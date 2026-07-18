/**
 * Platform-wide constants and enums.
 * Single source of truth for all status strings, roles, and defaults.
 */

// ── User Roles ──────────────────────────────────────────────────────────────
export const USER_ROLES = {
  CUSTOMER: 'customer',
  MERCHANT: 'merchant',
  DRIVER: 'driver',
  ADMIN: 'admin'
};

export const USER_ROLE_VALUES = Object.values(USER_ROLES);

// ── Order ───────────────────────────────────────────────────────────────────
export const ORDER_TYPES = {
  DELIVERY: 'delivery',
  PICKUP: 'pickup',
  DINE_IN: 'dine_in'
};

export const ORDER_TYPE_VALUES = Object.values(ORDER_TYPES);

export const ORDER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  READY: 'ready',
  PICKED_UP: 'picked_up',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  FAILED: 'failed'
};

export const ORDER_STATUS_VALUES = Object.values(ORDER_STATUS);

// ── Payment ─────────────────────────────────────────────────────────────────
export const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  APPLE_PAY: 'apple_pay',
  GOOGLE_PAY: 'google_pay',
  WALLET: 'wallet',
  GIFT_CARD: 'gift_card',
  CASH: 'cash'
};

export const PAYMENT_METHOD_VALUES = Object.values(PAYMENT_METHODS);

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded'
};

export const PAYMENT_STATUS_VALUES = Object.values(PAYMENT_STATUS);

// ── Restaurant ──────────────────────────────────────────────────────────────
export const RESTAURANT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended'
};

export const RESTAURANT_STATUS_VALUES = Object.values(RESTAURANT_STATUS);

// ── Driver ──────────────────────────────────────────────────────────────────
export const DRIVER_STATUS = {
  OFFLINE: 'offline',
  ONLINE: 'online',
  BUSY: 'busy'
};

export const DRIVER_STATUS_VALUES = Object.values(DRIVER_STATUS);

// ── Table ───────────────────────────────────────────────────────────────────
export const TABLE_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved'
};

export const TABLE_STATUS_VALUES = Object.values(TABLE_STATUS);

// ── Employee ────────────────────────────────────────────────────────────────
export const EMPLOYEE_ROLES = {
  MANAGER: 'manager',
  CASHIER: 'cashier',
  CHEF: 'chef',
  WAITER: 'waiter'
};

export const EMPLOYEE_ROLE_VALUES = Object.values(EMPLOYEE_ROLES);

// ── Coupon ──────────────────────────────────────────────────────────────────
export const COUPON_TYPES = {
  FLAT: 'flat',
  PERCENTAGE: 'percentage',
  FREE_DELIVERY: 'free_delivery',
  BOGO: 'bogo'
};

export const COUPON_TYPE_VALUES = Object.values(COUPON_TYPES);

// ── Notification ────────────────────────────────────────────────────────────
export const NOTIFICATION_CHANNELS = {
  PUSH: 'push',
  SMS: 'sms',
  EMAIL: 'email',
  IN_APP: 'in_app'
};

export const NOTIFICATION_CHANNEL_VALUES = Object.values(NOTIFICATION_CHANNELS);

// ── Loyalty ─────────────────────────────────────────────────────────────────
export const LOYALTY_CONFIG = {
  POINTS_PER_DOLLAR: 10,    // $1 spent = 10 points
  POINTS_PER_REWARD: 500    // 500 points = 1 reward
};

// ── Platform Fees ───────────────────────────────────────────────────────────
export const PLATFORM_DEFAULTS = {
  PLATFORM_FEE: 2.00,               // $2.00 per order
  DEFAULT_TAX_RATE: 0.0875,          // 8.75% (California average)
  DEFAULT_COMMISSION_RATE: 0.15,     // 15% restaurant commission
  MIN_ORDER_AMOUNT: 10.00,          // $10 minimum order
  MAX_DELIVERY_DISTANCE_MILES: 15   // Maximum delivery radius
};
