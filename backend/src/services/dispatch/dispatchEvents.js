import logger from '../../utils/logger.js';
import { buildOrderSocketPayload } from '../deliverySyncService.js';

/**
 * Builds the additive payload for the order:dispatch-updated socket event.
 */
export const buildDispatchSocketPayload = (order) => {
  const plain = typeof order.toObject === 'function' ? order.toObject() : order;
  return {
    orderId: plain._id,
    orderNumber: plain.orderNumber,
    restaurantId: plain.restaurantId?._id || plain.restaurantId,
    dispatchStatus: plain.dispatchStatus || 'not_applicable',
    dispatchAt: plain.dispatchAt || null,
    dispatchedAt: plain.dispatchedAt || null,
    dispatchedBy: plain.dispatchedBy || null,
    dispatchAttempts: plain.dispatchAttempts || 0,
    dispatchError: plain.dispatchError || null,
    delayMinutesApplied: plain.delayMinutesApplied || 0,
    deliveryId: plain.deliveryId || null,
    serverTime: new Date().toISOString()
  };
};

/**
 * Emits dispatch update events across all relevant rooms.
 * Emits both the new additive 'order:dispatch-updated' event and
 * existing 'order_updated' / 'order_status_changed' for backward compatibility.
 */
export const emitDispatchUpdated = (order, io) => {
  if (!io || !order) return;

  try {
    const plain = typeof order.toObject === 'function' ? order.toObject() : order;
    const restaurantId = (plain.restaurantId?._id || plain.restaurantId)?.toString();
    const orderId = plain._id?.toString();

    const dispatchPayload = buildDispatchSocketPayload(plain);
    const orderPayload = buildOrderSocketPayload(plain);

    if (restaurantId) {
      // Additive event for delayed dispatch
      io.to(restaurantId).emit('order:dispatch-updated', dispatchPayload);
      // Legacy / broad order update for existing merchant app and web
      io.to(restaurantId).emit('order_updated', orderPayload);
    }

    if (orderId) {
      io.to(`order_${orderId}`).emit('order:dispatch-updated', dispatchPayload);
      io.to(`order_${orderId}`).emit('order_status_changed', orderPayload);
    }
  } catch (err) {
    logger.warn('Failed to emit dispatch socket events', { error: err.message });
  }
};
