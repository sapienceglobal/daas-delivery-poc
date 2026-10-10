import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import * as res from '../utils/responseFormatter.js';
import { ensureCanManageRestaurant } from './orderController.js';
import { DISPATCH_STATUSES, DISPATCH_BY, ALLOWED_DISPATCH_ORDER_STATUSES } from '../services/dispatch/dispatchConfig.js';
import { dispatchOrder } from '../services/dispatch/dispatchService.js';
import { emitDispatchUpdated } from '../services/dispatch/dispatchEvents.js';

/**
 * Manually dispatches an order now ("Request Rider Now" button).
 * Idempotent: returns current state if already dispatched.
 * Acts as retry if previous attempt failed.
 *
 * POST /api/orders/:id/dispatch-now
 */
export const dispatchNow = asyncHandler(async (req, response) => {
  const Order = req.getModel('Order');
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  ensureCanManageRestaurant(req.user, order.restaurantId);

  if (order.orderType !== 'delivery') {
    throw new AppError('Only delivery orders can be dispatched to riders', 400);
  }

  if (!ALLOWED_DISPATCH_ORDER_STATUSES.includes(order.status)) {
    throw new AppError(`Cannot dispatch rider for ${order.status} order. Order must be accepted, preparing, or ready.`, 400);
  }

  // Idempotency: if already dispatched or already has delivery ID
  if (order.dispatchStatus === DISPATCH_STATUSES.DISPATCHED || order.deliveryId) {
    return res.success(response, {
      data: order,
      message: 'Order is already dispatched to delivery provider'
    });
  }

  const io = req.app.get('io');
  const updatedOrder = await dispatchOrder(order._id, DISPATCH_BY.MANUAL, {
    io,
    getModel: req.getModel
  });

  return res.success(response, {
    data: updatedOrder || order,
    message: 'Rider dispatch requested'
  });
});

/**
 * Postpones a scheduled order dispatch by a given number of minutes.
 * Only valid while dispatchStatus is 'scheduled'.
 *
 * POST /api/orders/:id/dispatch-postpone
 * Body: { minutes: 5 | 10 }
 */
export const dispatchPostpone = asyncHandler(async (req, response) => {
  const Order = req.getModel('Order');
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  ensureCanManageRestaurant(req.user, order.restaurantId);

  if (order.orderType !== 'delivery') {
    throw new AppError('Only delivery orders can have rider dispatch postponed', 400);
  }

  if (!ALLOWED_DISPATCH_ORDER_STATUSES.includes(order.status)) {
    throw new AppError(`Cannot postpone dispatch for ${order.status} order. Order must be accepted, preparing, or ready.`, 400);
  }

  if (order.dispatchStatus !== DISPATCH_STATUSES.SCHEDULED) {
    throw new AppError(
      `Cannot postpone dispatch. Order is currently ${order.dispatchStatus || 'not scheduled'}.`,
      400
    );
  }

  const minutes = parseInt(req.body.minutes, 10);
  if (!minutes || isNaN(minutes) || minutes < 1 || minutes > 60) {
    throw new AppError('Please provide a valid postpone duration in minutes (1 - 60)', 400);
  }

  const currentTarget = order.dispatchAt ? order.dispatchAt.getTime() : Date.now();
  const baseTime = Math.max(Date.now(), currentTarget);
  order.dispatchAt = new Date(baseTime + minutes * 60 * 1000);
  order.delayMinutesApplied = (order.delayMinutesApplied || 0) + minutes;

  await order.save();

  const io = req.app.get('io');
  emitDispatchUpdated(order, io);

  return res.success(response, {
    data: order,
    message: `Rider dispatch postponed by ${minutes} minutes`
  });
});
