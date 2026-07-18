import { getDeliveryAPI } from './doordashService.js';
import Order from '../models/Order.js';
import logger from '../utils/logger.js';

const ACTIVE_STATUSES = new Set(['pending', 'accepted', 'preparing', 'ready', 'picked_up']);

const statusMap = {
  created: 'pending',
  confirmed: 'accepted',
  dasher_confirmed: 'driver_assigned',
  dasher_assigned: 'driver_assigned',
  enroute_to_pickup: 'preparing',
  arrived_at_pickup: 'ready',
  picked_up: 'picked_up',
  dasher_picked_up: 'picked_up',
  enroute_to_dropoff: 'picked_up',
  arrived_at_dropoff: 'picked_up',
  delivered: 'delivered',
  dasher_delivered: 'delivered',
  cancelled: 'cancelled',
  canceled: 'cancelled'
};

const getDoorDashStatus = (payload = {}) => {
  return String(
    payload.delivery_status ||
    payload.delivery_status_update ||
    payload.event_type ||
    payload.status ||
    ''
  ).toLowerCase();
};

const getDasher = (payload = {}) => payload.dasher || payload.driver || payload.courier || {};

const getDasherLocation = (payload = {}) => {
  const dasher = getDasher(payload);
  return payload.dasher_location || dasher.location || payload.driver_location || payload.courier_location || null;
};

const assignIfPresent = (order, key, value) => {
  if (value !== undefined && value !== null && value !== '') {
    order[key] = value;
  }
};

export const applyDoorDashDeliveryUpdate = (order, payload = {}) => {
  const rawStatus = getDoorDashStatus(payload);
  const mappedStatus = statusMap[rawStatus];

  if (mappedStatus && order.status !== mappedStatus) {
    order.status = mappedStatus;
    order.statusUpdates.push({
      status: mappedStatus,
      description: `DoorDash: ${rawStatus}`
    });
  }

  const dasher = getDasher(payload);
  assignIfPresent(order, 'dasherName', dasher.name || payload.dasher_name || payload.driver_name || payload.courier_name);
  assignIfPresent(order, 'dasherPhone', dasher.phone_number || dasher.phone || payload.dasher_phone || payload.driver_phone || payload.courier_phone);

  const location = getDasherLocation(payload);
  if (location) {
    const lat = location.lat ?? location.latitude;
    const lng = location.lng ?? location.lon ?? location.longitude;
    if (typeof lat === 'number' && typeof lng === 'number') {
      order.dasherLat = lat;
      order.dasherLng = lng;
    }
  }

  assignIfPresent(order, 'deliveryId', payload.delivery_id || payload.id);
  assignIfPresent(order, 'trackingUrl', payload.tracking_url || payload.trackingUrl);
  if (payload.pickup_time) order.pickupTime = new Date(payload.pickup_time);
  if (payload.delivery_time) order.deliveryTime = new Date(payload.delivery_time);
  if (payload.estimated_pickup_time) order.pickupTime = new Date(payload.estimated_pickup_time);
  if (payload.estimated_delivery_time) order.deliveryTime = new Date(payload.estimated_delivery_time);

  return {
    rawStatus,
    mappedStatus,
    hasDasherLocation: Boolean(order.dasherLat && order.dasherLng)
  };
};

export const shouldPollDoorDash = (order, { force = false } = {}) => {
  if (force) return true;
  if (!order || order.orderType !== 'delivery') return false;
  if (!order.externalDeliveryId) return false;
  if (!ACTIVE_STATUSES.has(order.status)) return false;

  const intervalMs = Number(process.env.DOORDASH_POLL_INTERVAL_MS || 30000);
  if (!order.lastDoorDashSyncAt) return true;
  return Date.now() - new Date(order.lastDoorDashSyncAt).getTime() >= intervalMs;
};

export const syncDoorDashDelivery = async (order, options = {}) => {
  if (!shouldPollDoorDash(order, options)) {
    return { updated: false, skipped: true, order };
  }

  try {
    const payload = await getDeliveryAPI(order.externalDeliveryId);
    const result = applyDoorDashDeliveryUpdate(order, payload);
    order.lastDoorDashSyncAt = new Date();
    await order.save();
    return { updated: true, order, payload, result };
  } catch (error) {
    order.lastDoorDashSyncAt = new Date();
    await order.save();
    logger.warn('DoorDash delivery polling failed', {
      orderId: order._id,
      externalDeliveryId: order.externalDeliveryId,
      error: error.response?.data || error.message
    });
    return { updated: false, error, order };
  }
};

export const buildOrderSocketPayload = (order) => {
  const plainOrder = typeof order.toObject === 'function' ? order.toObject() : order;
  return {
    orderId: plainOrder._id,
    orderNumber: plainOrder.orderNumber,
    status: plainOrder.status,
    dasherName: plainOrder.dasherName,
    dasherPhone: plainOrder.dasherPhone,
    dasherLat: plainOrder.dasherLat,
    dasherLng: plainOrder.dasherLng,
    trackingUrl: plainOrder.trackingUrl,
    pickupTime: plainOrder.pickupTime,
    deliveryTime: plainOrder.deliveryTime,
    order: plainOrder
  };
};

export const pollActiveDoorDashDeliveries = async (io) => {
  const orders = await Order.find({
    orderType: 'delivery',
    externalDeliveryId: { $exists: true, $ne: null },
    status: { $in: Array.from(ACTIVE_STATUSES) }
  }).limit(Number(process.env.DOORDASH_POLL_BATCH_SIZE || 25));

  for (const order of orders) {
    const before = {
      status: order.status,
      dasherName: order.dasherName,
      dasherPhone: order.dasherPhone,
      dasherLat: order.dasherLat,
      dasherLng: order.dasherLng,
      trackingUrl: order.trackingUrl,
      pickupTime: order.pickupTime,
      deliveryTime: order.deliveryTime
    };

    const result = await syncDoorDashDelivery(order);
    if (!result.updated || !io) continue;

    const changed = Object.entries(before).some(([key, value]) => {
      const nextValue = order[key];
      return String(value ?? '') !== String(nextValue ?? '');
    });

    if (changed) {
      const payload = buildOrderSocketPayload(order);
      io.to(order.restaurantId.toString()).emit('order_updated', payload);
      io.to(`order_${order._id}`).emit('order_status_changed', payload);
    }
  }
};

export const startDoorDashPolling = (io) => {
  if (process.env.DOORDASH_POLLING_ENABLED === 'false') return null;

  const intervalMs = Number(process.env.DOORDASH_POLL_INTERVAL_MS || 30000);
  const timer = setInterval(() => {
    pollActiveDoorDashDeliveries(io).catch((error) => {
      logger.warn('DoorDash polling cycle failed', {
        error: error.response?.data || error.message
      });
    });
  }, intervalMs);
  timer.unref?.();
  logger.info(`DoorDash delivery polling enabled every ${intervalMs}ms`);
  return timer;
};
