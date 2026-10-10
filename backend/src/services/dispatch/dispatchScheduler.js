import logger from '../../utils/logger.js';
import { getAllowedTenantIds, getTenantModel } from '../../utils/tenant.js';
import {
  DISPATCH_STATUSES,
  DISPATCH_BY,
  MAX_BATCH_CLAIM,
  DISPATCH_CONCURRENCY_LIMIT,
  STUCK_DISPATCHING_TIMEOUT_MS,
  SCHEDULER_INTERVAL_MS,
  MAX_DISPATCH_ATTEMPTS,
  ALLOWED_DISPATCH_ORDER_STATUSES
} from './dispatchConfig.js';
import { dispatchOrder } from './dispatchService.js';
import { emitDispatchUpdated } from './dispatchEvents.js';

/**
 * Concurrency limiter that processes items in parallel up to maxConcurrency.
 */
const runWithConcurrency = async (items, limit, asyncFn) => {
  const executing = new Set();
  const results = [];

  for (const item of items) {
    const promise = Promise.resolve().then(() => asyncFn(item));
    results.push(promise);
    executing.add(promise);
    const clean = () => executing.delete(promise);
    promise.then(clean, clean);

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  return Promise.allSettled(results);
};

/**
 * Recovers orders stuck in 'dispatching' for more than 2 minutes
 * (e.g., if a server process crashed mid-dispatch).
 */
export const recoverStuckDispatches = async (OrderModel, io) => {
  try {
    const cutoff = new Date(Date.now() - STUCK_DISPATCHING_TIMEOUT_MS);
    const stuckOrders = await OrderModel.find({
      dispatchStatus: DISPATCH_STATUSES.DISPATCHING,
      updatedAt: { $lt: cutoff }
    }).limit(20);

    for (const order of stuckOrders) {
      logger.warn(`Recovering stuck dispatch order: ${order.orderNumber} (attempts: ${order.dispatchAttempts})`);
      if ((order.dispatchAttempts || 0) < MAX_DISPATCH_ATTEMPTS) {
        order.dispatchStatus = DISPATCH_STATUSES.SCHEDULED;
        order.dispatchAt = new Date(); // retry immediately
        order.dispatchError = 'Recovered from timed-out dispatching state';
      } else {
        order.dispatchStatus = DISPATCH_STATUSES.FAILED;
        order.dispatchError = 'Stuck in dispatching state permanently';
      }
      await order.save();
      emitDispatchUpdated(order, io);
    }
  } catch (err) {
    logger.error('Error recovering stuck dispatches', { error: err.message });
  }
};

/**
 * Polls and processes scheduled dispatches for a single Order model.
 * Performs atomic claim (findOneAndUpdate) so multi-instance setups do not duplicate.
 */
export const pollModelDispatches = async (OrderModel, io, getModel, options = {}) => {
  const now = new Date();

  // 1. Recover any stuck dispatches first
  await recoverStuckDispatches(OrderModel, io);

  // 2. Find IDs of candidates ready for dispatch
  const candidates = await OrderModel.find({
    orderType: 'delivery',
    status: { $in: ALLOWED_DISPATCH_ORDER_STATUSES },
    dispatchStatus: DISPATCH_STATUSES.SCHEDULED,
    dispatchAt: { $lte: now }
  })
    .select('_id')
    .limit(MAX_BATCH_CLAIM)
    .lean();

  if (!candidates.length) return 0;

  // 3. Process candidates with bounded concurrency directly via unified dispatchOrder atomic claim
  logger.info(`Found ${candidates.length} candidate scheduled orders for auto-dispatch`);

  let dispatchedCount = 0;
  await runWithConcurrency(candidates, DISPATCH_CONCURRENCY_LIMIT, async (candidate) => {
    try {
      const result = await dispatchOrder(candidate._id, DISPATCH_BY.AUTO, {
        io,
        getModel,
        triggerFn: options.triggerFn
      });
      if (result && result.dispatchStatus === DISPATCH_STATUSES.DISPATCHED) {
        dispatchedCount++;
      }
    } catch (err) {
      logger.error(`Unhandled error auto-dispatching order ${candidate._id}:`, err);
    }
  });

  return dispatchedCount;
};

/**
 * Polls across all active/configured tenants.
 */
export const pollAllDispatches = async (io, fallbackGetModel) => {
  try {
    const tenantIds = Array.from(getAllowedTenantIds());
    for (const tenantId of tenantIds) {
      try {
        const OrderModel = getTenantModel(tenantId, 'Order');
        const getModel = (name) => getTenantModel(tenantId, name);
        await pollModelDispatches(OrderModel, io, getModel);
      } catch (tenantErr) {
        logger.error(`Error polling dispatches for tenant ${tenantId}:`, tenantErr);
      }
    }
  } catch (err) {
    // Fallback if tenant resolution fails
    if (typeof fallbackGetModel === 'function') {
      try {
        const fallbackOrderModel = fallbackGetModel('Order');
        await pollModelDispatches(fallbackOrderModel, io, fallbackGetModel);
      } catch (fallbackErr) {
        logger.error('Error in fallback dispatch polling:', fallbackErr);
      }
    }
  }
};

/**
 * Starts the background dispatch scheduler.
 * Runs on boot immediately, then repeats every 10 seconds.
 */
export const startDispatchScheduler = (io, getModel) => {
  logger.info('Initializing Delayed Dispatch Scheduler (10s poller + boot recovery)...');

  // Run on boot immediately to catch any overdue orders
  pollAllDispatches(io, getModel).catch((err) => {
    logger.error('Initial boot dispatch poll failed:', err);
  });

  const intervalId = setInterval(() => {
    pollAllDispatches(io, getModel).catch((err) => {
      logger.error('Dispatch scheduler cycle error:', err);
    });
  }, SCHEDULER_INTERVAL_MS);

  intervalId.unref?.();
  return intervalId;
};
