import { Router } from 'express';
import crypto from 'crypto';
import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';
import { applyDeliveryUpdate, buildOrderSocketPayload } from '../services/deliverySyncService.js';

const router = Router();

/**
 * POST /api/delivery-webhook
 * Receives DoorDash Drive API webhook events for delivery status updates.
 */
router.post('/', asyncHandler(async (req, response) => {
  if (process.env.DOORDASH_WEBHOOK_SECRET) {
    const signature = req.headers['x-doordash-signature'] || req.headers['x-dd-signature'];
    if (!signature || !req.rawBody) {
      throw new AppError('Missing DoorDash webhook signature', 401);
    }

    const expected = crypto
      .createHmac('sha256', process.env.DOORDASH_WEBHOOK_SECRET)
      .update(req.rawBody)
      .digest('hex');
    const normalized = String(signature).replace(/^sha256=/, '');

    const expectedBuffer = Buffer.from(expected, 'hex');
    const actualBuffer = Buffer.from(normalized, 'hex');
    if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
      throw new AppError('Invalid DoorDash webhook signature', 401);
    }
  }

  const event = req.body;

  logger.info('DoorDash webhook received', {
    eventType: event.event_type || event.delivery_status,
    externalId: event.external_delivery_id
  });

  const externalId = event.external_delivery_id;
  if (!externalId) {
    logger.warn('Webhook missing external_delivery_id');
    return response.status(200).json({ received: true });
  }

  // externalId format: DD-dbName-timestamp-random
  const parts = externalId.split('-');
  const dbName = parts.length >= 2 ? parts[1] : 'daas_poc';
  const targetDb = req.app.locals.mongoose ? req.app.locals.mongoose.connection.useDb(dbName, { useCache: true }) : Order.db.useDb(dbName, { useCache: true });
  const TenantOrder = targetDb.model('Order', Order.schema);

  const order = await TenantOrder.findOne({ externalDeliveryId: externalId });
  if (!order) {
    logger.warn(`Webhook: no order found for ${externalId} in db ${dbName}`);
    return response.status(200).json({ received: true });
  }

  applyDeliveryUpdate(order, event);
  order.lastDeliverySyncAt = new Date();

  await order.save();

  // Emit real-time update via Socket.io
  const io = req.app.get('io');
  if (io) {
    const socketPayload = buildOrderSocketPayload(order);
    io.to(order.restaurantId.toString()).emit('order_updated', socketPayload);
    io.to(`order_${order._id}`).emit('order_status_changed', socketPayload);
  }

  response.status(200).json({ received: true });
}));

export default router;
