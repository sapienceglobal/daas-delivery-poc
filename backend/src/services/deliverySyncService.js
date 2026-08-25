import { getDeliveryTracking } from './deliveryAggregatorService.js';
import Order from '../models/Order.js';
import logger from '../utils/logger.js';
import { awardLoyaltyPoints } from '../controllers/orderController.js';
import { withOptimisticRetry } from '../utils/optimisticRetry.js';

const ACTIVE_STATUSES = new Set(['pending', 'accepted', 'preparing', 'ready', 'picked_up', 'driver_assigned']);

// ── Shipday Status Mapping ──────────────────────────────────────────────────
// Maps Shipday orderState / webhook order_status values to our internal statuses.
const statusMap = {
  // Shipday orderState values (from Order Object / Tracking)
  'not_assigned': 'pending',
  'not_accepted': 'pending',
  'not_started_yet': 'driver_assigned',
  'started': 'preparing',
  'picked_up': 'picked_up',
  'ready_to_deliver': 'picked_up',
  'already_delivered': 'delivered',
  'failed_delivery': 'cancelled',
  'incomplete': 'cancelled',
  'active': 'accepted',

  // Shipday webhook event values
  'order_assigned': 'driver_assigned',
  'order_accepted_and_started': 'preparing',
  'order_ontheway': 'picked_up',
  'order_pikedup': 'picked_up',        // Note: Shipday's typo "PIKEDUP"
  'order_completed': 'delivered',
  'order_failed': 'cancelled',
  'order_incomplete': 'cancelled',
  'order_inserted': 'pending',
  'order_unassigned': 'pending',

  // Legacy DoorDash values kept for backward compatibility with existing orders
  'created': 'pending',
  'confirmed': 'accepted',
  'dasher_confirmed': 'driver_assigned',
  'dasher_assigned': 'driver_assigned',
  'enroute_to_pickup': 'preparing',
  'arrived_at_pickup': 'ready',
  'dasher_picked_up': 'picked_up',
  'enroute_to_dropoff': 'picked_up',
  'arrived_at_dropoff': 'picked_up',
  'delivered': 'delivered',
  'dasher_delivered': 'delivered',
  'cancelled': 'cancelled',
  'canceled': 'cancelled'
};

const statusRank = {
  pending: 0,
  accepted: 1,
  driver_assigned: 2,
  preparing: 3,
  ready: 4,
  picked_up: 5,
  delivered: 6,
  cancelled: -1
};

// ── Payload Extractors ──────────────────────────────────────────────────────

/**
 * Extracts the delivery status from a Shipday webhook or tracking payload.
 */
const getDeliveryStatus = (payload = {}) => {
  // Shipday webhook format
  if (payload.event) return String(payload.event).toLowerCase();
  if (payload.order_status) return String(payload.order_status).toLowerCase();

  // Shipday tracking/progress endpoint format
  if (payload.status) return String(payload.status).toLowerCase();

  // Legacy DoorDash format
  return String(
    payload.delivery_status ||
    payload.delivery_status_update ||
    payload.event_type ||
    ''
  ).toLowerCase();
};

/**
 * Extracts carrier (driver) info from Shipday webhook or tracking payload.
 */
const getCarrier = (payload = {}) => {
  // Shipday webhook: carrier object
  if (payload.carrier) {
    return {
      name: payload.carrier.name || null,
      phone: payload.carrier.phone || null
    };
  }
  // Shipday tracking/progress: fixedData.carrier
  if (payload.courierName) {
    return {
      name: payload.courierName,
      phone: payload.courierPhone || null
    };
  }
  // Legacy DoorDash format
  const dasher = payload.dasher || payload.driver || payload.courier || {};
  return {
    name: dasher.name || payload.courier_name || payload.driver_name || null,
    phone: dasher.phone_number || dasher.phone || payload.courier_phone || payload.driver_phone || null
  };
};

/**
 * Extracts carrier location from Shipday webhook or tracking payload.
 */
const getCarrierLocation = (payload = {}) => {
  // Shipday location webhook format
  if (payload.event === 'LOCATION_UPDATE' || payload.event === 'location_update') {
    return {
      lat: payload.latitude || null,
      lng: payload.longitude || null
    };
  }
  // Shipday tracking/progress: dynamicData.carrierLocation
  if (payload.courierLat && payload.courierLng) {
    return { lat: payload.courierLat, lng: payload.courierLng };
  }
  // Legacy DoorDash format
  const dasher = payload.dasher || payload.driver || payload.courier || {};
  const loc = payload.dasher_location || dasher.location || payload.driver_location || payload.courier_location || null;
  if (loc) {
    return {
      lat: loc.lat ?? loc.latitude ?? null,
      lng: loc.lng ?? loc.lon ?? loc.longitude ?? null
    };
  }
  return null;
};

const assignIfPresent = (order, key, value) => {
  if (value !== undefined && value !== null && value !== '') {
    order[key] = value;
  }
};

// ── Core Update Logic ───────────────────────────────────────────────────────

export const applyDeliveryUpdate = (order, payload = {}) => {
  const rawStatus = getDeliveryStatus(payload);
  const mappedStatus = statusMap[rawStatus];

  if (mappedStatus && order.status !== mappedStatus) {
    const currentRank = statusRank[order.status] ?? 0;
    const newRank = statusRank[mappedStatus] ?? 0;
    
    // only update if the new status is a forward progression, or if it's a cancellation.
    // do not downgrade a manual 'accepted' or 'preparing' status back to 'pending'.
    if (newRank > currentRank || mappedStatus === 'cancelled') {
      order.status = mappedStatus;
      order.statusUpdates.push({
        status: mappedStatus,
        description: `Shipday: ${rawStatus}`
      });
    }
  }

  // Extract carrier info
  const carrier = getCarrier(payload);
  assignIfPresent(order, 'courierName', carrier.name);
  assignIfPresent(order, 'courierPhone', carrier.phone);

  // Extract carrier location
  const location = getCarrierLocation(payload);
  if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
    order.courierLat = location.lat;
    order.courierLng = location.lng;
  }

  // Extract Shipday-specific fields
  assignIfPresent(order, 'deliveryId', payload.deliveryId);
  assignIfPresent(order, 'trackingUrl', payload.trackingUrl || payload.trackingLink);

  // Timing fields from tracking
  if (payload.pickupTime) order.pickupTime = new Date(payload.pickupTime);
  if (payload.deliveryTime) order.deliveryTime = new Date(payload.deliveryTime);

  // Legacy DoorDash timing fields
  if (payload.pickup_time) order.pickupTime = new Date(payload.pickup_time);
  if (payload.delivery_time) order.deliveryTime = new Date(payload.delivery_time);
  if (payload.estimated_pickup_time) order.pickupTime = new Date(payload.estimated_pickup_time);
  if (payload.estimated_delivery_time) order.deliveryTime = new Date(payload.estimated_delivery_time);

  return {
    rawStatus,
    mappedStatus,
    hasDasherLocation: Boolean(order.courierLat && order.courierLng)
  };
};

// ── Polling Logic ───────────────────────────────────────────────────────────

export const shouldPollDelivery = (order, { force = false } = {}) => {
  if (force) return true;
  if (!order || order.orderType !== 'delivery') return false;
  if (!order.deliveryId && !order.externalDeliveryId) return false;
  if (!ACTIVE_STATUSES.has(order.status)) return false;

  const intervalMs = Number(process.env.SHIPDAY_POLL_INTERVAL_MS || 30000);
  if (!order.lastDeliverySyncAt) return true;
  return Date.now() - new Date(order.lastDeliverySyncAt).getTime() >= intervalMs;
};

export const syncDeliveryTracking = async (order, options = {}) => {
  if (!shouldPollDelivery(order, options)) {
    return { updated: false, skipped: true, order };
  }

  try {
    const payload = await getDeliveryTracking(order);

    const { doc: finalOrder, result } = await withOptimisticRetry(order, (doc) => {
      return applyDeliveryUpdate(doc, payload);
    });
    
    finalOrder.lastDeliverySyncAt = new Date();
    try {
      await finalOrder.save();
    } catch (saveErr) {
      logger.error('Failed to save order during delivery sync', { orderId: finalOrder._id, error: saveErr.message });
    }
    
    if (finalOrder.status === 'delivered' || finalOrder.status === 'picked_up') {
      await awardLoyaltyPoints(finalOrder);
    }
    return { updated: true, order: finalOrder, payload, result };
  } catch (error) {
    order.lastDeliverySyncAt = new Date();
    try {
      await order.save();
    } catch (saveErr) {
      logger.error('Failed to update lastDeliverySyncAt', { orderId: order._id, error: saveErr.message });
    }
    logger.warn('Shipday delivery polling failed', {
      orderId: order._id,
      deliveryId: order.deliveryId || order.externalDeliveryId,
      error: error.response?.data || error.message
    });
    return { updated: false, error, order };
  }
};

// ── Socket Payload Builder ──────────────────────────────────────────────────

export const buildOrderSocketPayload = (order) => {
  const plainOrder = typeof order.toObject === 'function' ? order.toObject() : order;
  return {
    orderId: plainOrder._id,
    orderNumber: plainOrder.orderNumber,
    status: plainOrder.status,
    paymentStatus: plainOrder.paymentStatus,
    refunded: plainOrder.refunded,
    refundAmount: plainOrder.refundAmount,
    refundReason: plainOrder.refundReason,
    courierName: plainOrder.courierName,
    courierPhone: plainOrder.courierPhone,
    courierLat: plainOrder.courierLat,
    courierLng: plainOrder.courierLng,
    trackingUrl: plainOrder.trackingUrl,
    pickupTime: plainOrder.pickupTime,
    deliveryTime: plainOrder.deliveryTime,
    order: plainOrder
  };
};

// ── Batch Polling ───────────────────────────────────────────────────────────

export const pollActiveDeliveries = async (io) => {
  const orders = await Order.find({
    orderType: 'delivery',
    $or: [
      { deliveryId: { $exists: true, $ne: null } },
      { externalDeliveryId: { $exists: true, $ne: null } }
    ],
    status: { $in: Array.from(ACTIVE_STATUSES) }
  }).limit(Number(process.env.SHIPDAY_POLL_BATCH_SIZE || 25));

  await Promise.allSettled(orders.map(async (order) => {
    const before = {
      status: order.status,
      courierName: order.courierName,
      courierPhone: order.courierPhone,
      courierLat: order.courierLat,
      courierLng: order.courierLng,
      trackingUrl: order.trackingUrl,
      pickupTime: order.pickupTime,
      deliveryTime: order.deliveryTime
    };

    try {
      const result = await syncDeliveryTracking(order);
      if (!result.updated || !io) return;

      const changed = Object.entries(before).some(([key, value]) => {
        const nextValue = order[key];
        return String(value ?? '') !== String(nextValue ?? '');
      });

      if (changed) {
        const payload = buildOrderSocketPayload(order);
        io.to(order.restaurantId.toString()).emit('order_updated', payload);
        io.to(`order_${order._id}`).emit('order_status_changed', payload);
      }
    } catch (err) {
      logger.error(`Failed to sync delivery tracking for order ${order._id}:`, err);
    }
  }));
};

export const startDeliveryPolling = (io) => {
  if (process.env.SHIPDAY_POLLING_ENABLED === 'false') return null;

  const intervalMs = Number(process.env.SHIPDAY_POLL_INTERVAL_MS || 30000);
  const timer = setInterval(() => {
    pollActiveDeliveries(io).catch((error) => {
      logger.warn('Shipday polling cycle failed', {
        error: error.response?.data || error.message
      });
    });
  }, intervalMs);
  timer.unref?.();
  logger.info(`Shipday delivery polling enabled every ${intervalMs}ms`);
  return timer;
};
