import { Router } from 'express';
import crypto from 'crypto';
import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';
import { buildOrderSocketPayload } from '../services/deliverySyncService.js';

// ── Shipday Driver Location Webhook (Beta) ──────────────────────────────────
// This webhook receives real-time driver location updates from Shipday.
// Payload format:
// {
//   "event": "LOCATION_UPDATE",
//   "orderId": 12345,
//   "companyId": 67890,
//   "latitude": 37.7749,
//   "longitude": -122.4194,
//   "currentTimeStamp": 1631234567890
// }

const SHIPDAY_WEBHOOK_TOKEN = process.env.SHIPDAY_WEBHOOK_TOKEN;

const router = Router();

// ── Token Verification ──────────────────────────────────────────────────────
const verifyShipdayToken = (req, res, next) => {
  if (!SHIPDAY_WEBHOOK_TOKEN && process.env.NODE_ENV !== 'production') {
    return next();
  }

  const token = req.headers['token'] || req.headers['Token'];
  if (!token || !SHIPDAY_WEBHOOK_TOKEN) {
    throw new AppError('Missing Shipday webhook token', 401);
  }

  const tokenBuffer = Buffer.from(String(token));
  const expectedBuffer = Buffer.from(SHIPDAY_WEBHOOK_TOKEN);

  if (tokenBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(tokenBuffer, expectedBuffer)) {
    throw new AppError('Invalid Shipday webhook token', 401);
  }

  next();
};

/**
 * POST /api/shipday-location-webhook
 * Receives real-time driver location updates from Shipday.
 */
router.post('/', verifyShipdayToken, asyncHandler(async (req, response) => {
  const { event, orderId, latitude, longitude, currentTimeStamp } = req.body;

  if (event !== 'LOCATION_UPDATE') {
    logger.debug('Shipday location webhook: non-location event received', { event });
    return response.status(200).json({ received: true });
  }

  if (!orderId || typeof latitude !== 'number' || typeof longitude !== 'number') {
    logger.warn('Shipday location webhook: missing required fields', { orderId, latitude, longitude });
    return response.status(200).json({ received: true });
  }

  logger.debug('Shipday driver location update', {
    shipdayOrderId: orderId,
    lat: latitude,
    lng: longitude
  });

  // Find order by Shipday orderId (stored as deliveryId)
  const order = await Order.findOne({ deliveryId: String(orderId) });
  if (!order) {
    logger.debug(`Shipday location: no order found for shipdayOrderId ${orderId}`);
    return response.status(200).json({ received: true });
  }

  // Only update location for active delivery orders
  const activeStatuses = ['accepted', 'preparing', 'ready', 'picked_up', 'driver_assigned'];
  if (!activeStatuses.includes(order.status)) {
    return response.status(200).json({ received: true });
  }

  // Update courier location
  order.courierLat = latitude;
  order.courierLng = longitude;
  order.lastDeliverySyncAt = new Date();

  try {
    await order.save();
  } catch (err) {
    logger.error('Failed to save driver location update', { orderId: order._id, error: err.message });
  }

  // Emit real-time location update via Socket.io
  const io = req.app.get('io');
  if (io) {
    const socketPayload = buildOrderSocketPayload(order);
    io.to(`order_${order._id}`).emit('order_status_changed', socketPayload);

    // Also emit a dedicated location event for efficient frontend handling
    io.to(`order_${order._id}`).emit('driver_location_updated', {
      orderId: order._id,
      courierLat: latitude,
      courierLng: longitude,
      timestamp: currentTimeStamp || Date.now()
    });
  }

  response.status(200).json({ received: true });
}));

export default router;
