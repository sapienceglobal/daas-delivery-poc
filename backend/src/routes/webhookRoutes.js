import { Router } from 'express';
import crypto from 'crypto';
import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';
import { applyDeliveryUpdate, buildOrderSocketPayload } from '../services/deliverySyncService.js';
import { createNotification } from '../controllers/notificationController.js';

// ── Shipday Webhook Token ───────────────────────────────────────────────────
// Shipday allows configuring a validation token (max 32 chars) when setting up
// webhooks. This token is sent in the webhook request header as "token".
const SHIPDAY_WEBHOOK_TOKEN = process.env.SHIPDAY_WEBHOOK_TOKEN;
if (!SHIPDAY_WEBHOOK_TOKEN) {
  if (process.env.NODE_ENV === 'production') {
    console.error('[FATAL] SHIPDAY_WEBHOOK_TOKEN is not set. Refusing to start with insecure webhooks.');
    process.exit(1);
  } else {
    console.warn('[WARNING] SHIPDAY_WEBHOOK_TOKEN is not set. Webhooks will accept all requests in dev mode.');
  }
}

const router = Router();

// ── Token Verification Middleware ───────────────────────────────────────────
const verifyShipdayToken = (req, res, next) => {
  // In development without token configured, skip verification
  if (!SHIPDAY_WEBHOOK_TOKEN && process.env.NODE_ENV !== 'production') {
    return next();
  }

  const token = req.headers['token'] || req.headers['Token'];
  if (!token || !SHIPDAY_WEBHOOK_TOKEN) {
    throw new AppError('Missing Shipday webhook token', 401);
  }

  // Use timing-safe comparison to prevent timing attacks
  const tokenBuffer = Buffer.from(String(token));
  const expectedBuffer = Buffer.from(SHIPDAY_WEBHOOK_TOKEN);

  if (tokenBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(tokenBuffer, expectedBuffer)) {
    logger.warn('Shipday webhook token mismatch', {
      receivedLength: tokenBuffer.length,
      expectedLength: expectedBuffer.length
    });
    throw new AppError('Invalid Shipday webhook token', 401);
  }

  next();
};

// ── Helper: Find order by Shipday order number ──────────────────────────────
const findOrderByNumber = async (orderNumber, req) => {
  if (!orderNumber) return null;

  // Try the tenant-aware model first, fallback to global
  try {
    if (req.getModel) {
      const TenantOrder = req.getModel('Order');
      const order = await TenantOrder.findOne({ orderNumber: String(orderNumber) });
      if (order) return order;
    }
  } catch {
    // fallback below
  }

  // Fallback to the default Order model
  return await Order.findOne({ orderNumber: String(orderNumber) });
};

/**
 * POST /api/shipday-webhook
 * Receives Shipday order status update webhook events.
 *
 * Shipday webhook payload format:
 * {
 *   "timestamp": 1684644196349,
 *   "event": "ORDER_PIKEDUP",
 *   "order_status": "PICKED_UP",
 *   "order": { "id": 123456, "order_number": "808713698", ... },
 *   "carrier": { "id": 134, "name": "Jane Doe", "phone": "45678432", ... },
 *   "delivery_details": { ... },
 *   "pickup_details": { ... },
 *   "thirdPartyDeliveryOrder": { ... }
 * }
 */
router.post('/', verifyShipdayToken, asyncHandler(async (req, response) => {
  const event = req.body;

  const eventType = event.event || 'unknown';
  const orderData = event.order || {};
  const orderNumber = orderData.order_number || orderData.orderNumber;
  const shipdayOrderId = orderData.id || event.orderId;

  logger.info('Shipday webhook received', {
    event: eventType,
    orderNumber,
    shipdayOrderId,
    orderStatus: event.order_status
  });

  if (!orderNumber && !shipdayOrderId) {
    logger.warn('Shipday webhook missing order_number and orderId');
    return response.status(200).json({ received: true });
  }

  // Find the order in our database
  let order = null;
  if (orderNumber) {
    order = await findOrderByNumber(orderNumber, req);
  }
  if (!order && shipdayOrderId) {
    // Try finding by deliveryId (which stores the Shipday orderId)
    order = await Order.findOne({ deliveryId: String(shipdayOrderId) });
  }

  if (!order) {
    logger.warn(`Shipday webhook: no order found for orderNumber=${orderNumber}, shipdayId=${shipdayOrderId}`);
    return response.status(200).json({ received: true });
  }

  // Build a normalized payload for applyDeliveryUpdate
  const updatePayload = {
    // Status info
    event: eventType.toLowerCase(),
    order_status: (event.order_status || '').toLowerCase(),
    status: (event.order_status || '').toLowerCase()
  };

  // Carrier info from webhook
  if (event.carrier) {
    updatePayload.carrier = event.carrier;
  }

  // Third-party carrier info (when dispatched through 3rd party via Shipday)
  // We prioritize this over event.carrier because event.carrier contains generic aggregator info (e.g. "DoorDash" and their generic support number)
  if (event.thirdPartyDeliveryOrder) {
    const tp = event.thirdPartyDeliveryOrder;
    if (tp.driverName) {
      updatePayload.carrier = {
        name: tp.driverName,
        phone: tp.driverPhone || updatePayload.carrier?.phone
      };
    }
  }

  // Tracking URL from Shipday order data
  if (orderData.tracking_link) {
    updatePayload.trackingUrl = orderData.tracking_link;
  }

  // Timing data
  if (orderData.pickedup_time) updatePayload.pickupTime = new Date(orderData.pickedup_time);
  if (orderData.delivery_time) updatePayload.deliveryTime = new Date(orderData.delivery_time);

  // Apply the update
  const oldStatus = order.status;
  applyDeliveryUpdate(order, updatePayload);
  order.lastDeliverySyncAt = new Date();
  const newStatus = order.status;

  // Store Shipday orderId as deliveryId if not already set
  if (shipdayOrderId && !order.deliveryId) {
    order.deliveryId = String(shipdayOrderId);
  }

  try {
    await order.save();
  } catch (err) {
    logger.error('Failed to save order in Shipday webhook', { orderId: order._id, error: err.message });
  }

  // Emit real-time update via Socket.io
  const io = req.app.get('io');
  if (io) {
    const socketPayload = buildOrderSocketPayload(order);
    io.to(order.restaurantId.toString()).emit('order_updated', socketPayload);
    io.to(`order_${order._id}`).emit('order_status_changed', socketPayload);
  }

  // Trigger customer push notification if status progressed
  if (oldStatus !== newStatus && order.userId) {
    try {
      await createNotification(
        order.userId,
        `Order ${newStatus}`,
        `Your order from ${order.restaurantName} is now ${newStatus.replace('_', ' ')}.`,
        'delivery_update',
        `/orders/${order._id}`,
        io,
        req.getModel
      );
    } catch (notifErr) {
      logger.error('Failed to send webhook customer notification', { error: notifErr.message });
    }
  }

  response.status(200).json({ received: true });
}));

export default router;
