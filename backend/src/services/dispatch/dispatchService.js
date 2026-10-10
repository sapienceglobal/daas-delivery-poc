import mongoose from 'mongoose';
import logger from '../../utils/logger.js';
import { triggerDelivery } from '../deliveryAggregatorService.js';
import {
  DISPATCH_STATUSES,
  DISPATCH_BY,
  RETRY_DELAYS_MS,
  MAX_DISPATCH_ATTEMPTS,
  MIN_DELAY_MINUTES,
  MAX_DELAY_MINUTES,
  isDispatchDelayEnabled,
  ALLOWED_DISPATCH_ORDER_STATUSES
} from './dispatchConfig.js';
import { emitDispatchUpdated } from './dispatchEvents.js';

/**
 * Resolves the appropriate Mongoose Order model given an order instance or context.
 */
const resolveOrderModel = (orderDoc, getModel) => {
  if (orderDoc?.constructor?.modelName === 'Order') {
    return orderDoc.constructor;
  }
  if (typeof getModel === 'function') {
    return getModel('Order');
  }
  if (orderDoc && (!orderDoc.constructor || orderDoc.constructor === Object)) {
    return null;
  }
  return mongoose.model('Order');
};

/**
 * Resolves the appropriate Mongoose Restaurant model.
 */
const resolveRestaurantModel = (orderDoc, getModel) => {
  if (orderDoc?.constructor?.db?.models?.Restaurant) {
    return orderDoc.constructor.db.models.Restaurant;
  }
  if (typeof getModel === 'function') {
    return getModel('Restaurant');
  }
  return mongoose.model('Restaurant');
};

/**
 * Schedules or immediately dispatches an order upon restaurant acceptance.
 * 
 * Rules:
 * 1. Non-delivery orders: ignored, marked not_applicable.
 * 2. Delay = 0 or kill-switch off: dispatches immediately via dispatchOrder.
 * 3. Delay > 0: dispatchAt = now + delay, dispatchStatus = 'scheduled', frozen in DB.
 */
export const scheduleOrDispatch = async (order, options = {}) => {
  if (!order || order.orderType !== 'delivery') {
    if (order && order.dispatchStatus !== DISPATCH_STATUSES.NOT_APPLICABLE) {
      order.dispatchStatus = DISPATCH_STATUSES.NOT_APPLICABLE;
      await order.save().catch(() => {});
    }
    return order;
  }

  // Idempotency: if already dispatched or deliveryId present, do nothing
  if (order.deliveryId || order.dispatchStatus === DISPATCH_STATUSES.DISPATCHED) {
    return order;
  }

  const { io, getModel, restaurant: passedRestaurant } = options;
  const RestaurantModel = resolveRestaurantModel(order, getModel);

  let restaurant = passedRestaurant;
  if (!restaurant && order.restaurantId) {
    restaurant = await RestaurantModel.findById(order.restaurantId?._id || order.restaurantId).lean();
  }

  const configuredDelay = Number(restaurant?.deliveryDispatchDelayMinutes ?? 0);
  const delayMinutes = Math.max(MIN_DELAY_MINUTES, Math.min(MAX_DELAY_MINUTES, Math.floor(configuredDelay)));

  // If delay is 0 or kill switch is disabled, dispatch immediately
  if (delayMinutes === 0 || !isDispatchDelayEnabled()) {
    return await dispatchOrder(order._id, DISPATCH_BY.IMMEDIATE, {
      io,
      getModel,
      orderDoc: order,
      triggerFn: options.triggerFn
    });
  }

  // Delay > 0: freeze scheduled dispatch in DB
  const now = Date.now();
  order.dispatchStatus = DISPATCH_STATUSES.SCHEDULED;
  order.delayMinutesApplied = delayMinutes;
  order.dispatchAt = new Date(now + delayMinutes * 60 * 1000);
  order.dispatchAttempts = 0;
  order.dispatchError = null;

  await order.save();
  logger.info(`Scheduled rider dispatch for order ${order.orderNumber} in ${delayMinutes} mins (at ${order.dispatchAt.toISOString()})`);

  emitDispatchUpdated(order, io);
  return order;
};

/**
 * Dispatches an order to Shipday.
 * Single source of truth for all dispatch calls (auto, manual, ready, immediate).
 *
 * @param {string|ObjectId} orderId - Order identifier
 * @param {string} reason - 'auto' | 'manual' | 'ready' | 'immediate'
 * @param {Object} options - Context dependencies (io, getModel, orderDoc, triggerFn)
 */
export const dispatchOrder = async (orderId, reason = DISPATCH_BY.AUTO, options = {}) => {
  const { io, getModel, triggerFn = triggerDelivery } = options;
  const OrderModel = resolveOrderModel(options.orderDoc, getModel);

  // 1. Unified Atomic Claim: find and atomically transition dispatchStatus to DISPATCHING.
  // Both auto-scheduler and manual dispatch-now MUST go through this exact same claim filter.
  // Allowed source states:
  // - SCHEDULED: normal scheduled dispatch or manual trigger while countdown is ticking.
  // - FAILED: manual retry of a failed dispatch.
  // - NOT_APPLICABLE / null / undefined: immediate dispatch when delay is 0 or unassigned.
  // Blocked:
  // - DISPATCHING: another runner already claimed this order!
  // - DISPATCHED: already successfully created in Shipday!
  // - Terminal status: cancelled, delivered, pending, rejected.
  const claimFilter = {
    _id: orderId,
    status: { $in: ALLOWED_DISPATCH_ORDER_STATUSES },
    deliveryId: { $in: [null, undefined, ''] },
    dispatchStatus: {
      $in: [
        DISPATCH_STATUSES.SCHEDULED,
        DISPATCH_STATUSES.FAILED,
        DISPATCH_STATUSES.NOT_APPLICABLE,
        null
      ]
    }
  };

  const claimUpdate = {
    $set: {
      dispatchStatus: DISPATCH_STATUSES.DISPATCHING,
      ...(reason === DISPATCH_BY.MANUAL ? { dispatchAttempts: 0, dispatchError: null } : {})
    }
  };

  let order = null;
  if (typeof OrderModel?.findOneAndUpdate === 'function') {
    order = await OrderModel.findOneAndUpdate(claimFilter, claimUpdate, { new: true });
  }

  // Fallback for mocked orderDoc in tests where OrderModel.findOneAndUpdate is not available
  if (!order && options.orderDoc && !OrderModel?.findOneAndUpdate) {
    const doc = options.orderDoc;
    if (
      ALLOWED_DISPATCH_ORDER_STATUSES.includes(doc.status) &&
      !doc.deliveryId &&
      doc.dispatchStatus !== DISPATCH_STATUSES.DISPATCHED &&
      doc.dispatchStatus !== DISPATCH_STATUSES.DISPATCHING
    ) {
      doc.dispatchStatus = DISPATCH_STATUSES.DISPATCHING;
      if (reason === DISPATCH_BY.MANUAL) {
        doc.dispatchAttempts = 0;
        doc.dispatchError = null;
      }
      await doc.save?.();
      order = doc;
    }
  }

  if (!order) {
    let existing = null;
    if (typeof OrderModel?.findById === 'function') {
      existing = await OrderModel.findById(orderId);
    }
    if (!existing && options.orderDoc) {
      existing = options.orderDoc;
    }
    if (!existing) {
      logger.warn(`dispatchOrder: Order not found: ${orderId}`);
      return null;
    }
    if (existing.deliveryId || existing.dispatchStatus === DISPATCH_STATUSES.DISPATCHED) {
      logger.info(`dispatchOrder: Order ${existing.orderNumber || orderId} already dispatched`);
      return existing;
    }
    if (existing.dispatchStatus === DISPATCH_STATUSES.DISPATCHING) {
      logger.info(`dispatchOrder: Order ${existing.orderNumber || orderId} already dispatching (in-flight claim)`);
      return existing;
    }
    logger.info(`dispatchOrder: Skipping order ${existing.orderNumber || orderId} (status: ${existing.status}, dispatchStatus: ${existing.dispatchStatus})`);
    return existing;
  }

  emitDispatchUpdated(order, io);

  try {
    const delivery = await triggerFn(order);

    order.deliveryId = delivery.deliveryId;
    order.trackingUrl = delivery.trackingUrl;
    order.pickupTime = delivery.pickupTime;
    order.deliveryTime = delivery.deliveryTime;

    order.dispatchStatus = DISPATCH_STATUSES.DISPATCHED;
    order.dispatchedAt = new Date();
    order.dispatchedBy = reason;
    order.dispatchError = null;
    await order.save();

    logger.info(`Shipday dispatch succeeded for order ${order.orderNumber} (reason: ${reason})`);
    emitDispatchUpdated(order, io);
    return order;
  } catch (err) {
    order.dispatchAttempts = (order.dispatchAttempts || 0) + 1;
    order.dispatchError = err.message || 'Dispatch failed';

    if (!Array.isArray(order.statusUpdates)) {
      order.statusUpdates = [];
    }
    order.statusUpdates.push({
      status: order.status,
      description: `Shipday delivery creation failed: ${err.message}`
    });

    if (order.dispatchAttempts < MAX_DISPATCH_ATTEMPTS) {
      const backoffMs = RETRY_DELAYS_MS[order.dispatchAttempts - 1] || (120 * 1000);
      order.dispatchStatus = DISPATCH_STATUSES.SCHEDULED;
      order.dispatchAt = new Date(Date.now() + backoffMs);
      order.dispatchNextAttemptAt = order.dispatchAt;
      logger.warn(`Shipday dispatch attempt ${order.dispatchAttempts} failed for ${order.orderNumber}. Retrying in ${backoffMs / 1000}s.`, {
        error: err.message
      });
    } else {
      order.dispatchStatus = DISPATCH_STATUSES.FAILED;
      logger.error(`Shipday dispatch permanently failed for order ${order.orderNumber} after ${order.dispatchAttempts} attempts.`, {
        error: err.message
      });
    }

    await order.save();
    emitDispatchUpdated(order, io);
    return order;
  }
};
