// ── Dispatch Configuration & Constants ─────────────────────────────────────
// Controls delayed rider request (Shipday dispatch scheduling) configuration.

export const DISPATCH_STATUSES = Object.freeze({
  NOT_APPLICABLE: 'not_applicable',
  SCHEDULED: 'scheduled',
  DISPATCHING: 'dispatching',
  DISPATCHED: 'dispatched',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
});

export const DISPATCH_BY = Object.freeze({
  AUTO: 'auto',
  MANUAL: 'manual',
  READY: 'ready',
  IMMEDIATE: 'immediate'
});

export const ALLOWED_DISPATCH_ORDER_STATUSES = Object.freeze([
  'accepted',
  'preparing',
  'ready'
]);

export const RETRY_DELAYS_MS = Object.freeze([
  30 * 1000,   // 1st retry in 30 seconds
  60 * 1000,   // 2nd retry in 60 seconds
  120 * 1000   // 3rd retry in 120 seconds
]);

export const MAX_DISPATCH_ATTEMPTS = 3;
export const STUCK_DISPATCHING_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
export const SCHEDULER_INTERVAL_MS = 10 * 1000;            // 10 seconds
export const MAX_BATCH_CLAIM = 50;
export const DISPATCH_CONCURRENCY_LIMIT = 5;

export const MIN_DELAY_MINUTES = 0;
export const MAX_DELAY_MINUTES = 180;

/**
 * Checks if dispatch delay feature is active via environment kill-switch.
 * Set DISPATCH_DELAY_ENABLED=false to revert completely to immediate dispatch.
 * Defaults to true.
 */
export const isDispatchDelayEnabled = () => {
  const envVal = process.env.DISPATCH_DELAY_ENABLED;
  if (envVal === 'false' || envVal === '0') return false;
  return true;
};
