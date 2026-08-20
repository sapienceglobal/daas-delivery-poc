import mongoose from 'mongoose';
import crypto from 'crypto';
import { ORDER_STATUS_VALUES, ORDER_TYPE_VALUES, PAYMENT_METHOD_VALUES, PAYMENT_STATUS_VALUES } from '../config/constants.js';

/**
 * Individual item inside an order — snapshot of the menu item at time of purchase.
 */
const OrderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: { type: String, required: true },
  image: { type: String, default: null },
  price: { type: Number, required: true },       // unit price at time of order
  quantity: { type: Number, required: true, default: 1, min: 1 },
  selectedSize: {
    name: { type: String, default: null },
    price: { type: Number, default: null }
  },
  addOns: [{
    name: { type: String },
    price: { type: Number, default: 0 }
  }],
  specialInstructions: { type: String, default: '' },
  lineTotal: { type: Number, required: true }   // (price + size + addOns) * quantity
}, { _id: true });

const StatusUpdateSchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  description: { type: String, default: '' }
}, { _id: false });

/**
 * Structured payment lifecycle event log.
 * Every meaningful payment or order-creation event is appended here.
 * Possible event values:
 *   payment_initiated       — user triggered payment
 *   payment_confirmed       — Stripe verified payment as succeeded
 *   payment_failed          — Stripe payment failed
 *   order_saved             — order document written to DB successfully
 *   order_creation_failed   — post-payment DB/logic step failed
 *   auto_refund_triggered   — auto-refund attempt started
 *   auto_refund_succeeded   — Stripe refund confirmed
 *   auto_refund_failed      — Stripe refund call threw error
 *   manual_refund           — merchant-initiated refund
 *   loyalty_rollback        — loyalty points reversed
 */
const PaymentEventSchema = new mongoose.Schema({
  event: {
    type: String,
    required: true,
    enum: [
      'payment_initiated', 'payment_confirmed', 'payment_failed',
      'order_saved', 'order_creation_failed',
      'auto_refund_triggered', 'auto_refund_succeeded', 'auto_refund_failed',
      'manual_refund', 'loyalty_rollback'
    ]
  },
  timestamp: { type: Date, default: Date.now },
  amount: { type: Number, default: null },
  stripeRefundId: { type: String, default: null },
  stripePaymentIntentId: { type: String, default: null },
  error: { type: String, default: null },
  reason: { type: String, default: null },
  triggeredBy: { type: String, enum: ['system', 'merchant', 'customer'], default: 'system' },
  meta: { type: mongoose.Schema.Types.Mixed, default: null }
}, { _id: true });

const OrderSchema = new mongoose.Schema({
  // ── Identifiers ───────────────────────────────────────────────────────
  orderNumber: {
    type: String,
    unique: true
  },
  externalDeliveryId: {
    type: String,
    unique: true,
    sparse: true
  },

  // ── Customer ──────────────────────────────────────────────────────────
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  customerPhone: {
    type: String,
    required: [true, 'Customer phone is required'],
    trim: true
  },
  customerEmail: {
    type: String,
    default: null,
    trim: true
  },

  // ── Delivery Address ──────────────────────────────────────────────────
  address: {
    type: String,
    required: [true, 'Delivery address is required'],
    trim: true
  },
  addressLat: { type: Number, default: null },
  addressLng: { type: Number, default: null },

  // ── Restaurant ────────────────────────────────────────────────────────
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant ID is required']
  },
  restaurantName: { type: String, required: true },
  restaurantAddress: { type: String, required: true },
  restaurantPhone: { type: String, required: true },

  // ── Order Items ───────────────────────────────────────────────────────
  items: {
    type: [OrderItemSchema],
    validate: [arr => arr.length > 0, 'Order must contain at least one item']
  },

  // ── Order Type ────────────────────────────────────────────────────────
  orderType: {
    type: String,
    enum: ORDER_TYPE_VALUES,
    default: 'delivery',
    required: true
  },
  tableNumber: { type: String, default: null },   // for dine-in

  // ── Pricing ───────────────────────────────────────────────────────────
  orderSource: {
    type: String,
    enum: ['web', 'app'],
    default: 'web'
  },
  subtotal: { type: Number, required: true, default: 0 },
  tax: { type: Number, required: true, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  platformFee: { type: Number, default: 2.00 },
  serviceFee: { type: Number, default: 0 },
  tip: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  loyaltyDiscount: { type: Number, default: 0, min: 0 },
  loyaltyPointsUsed: { type: Number, default: 0, min: 0 },
  loyaltyPointsEarned: { type: Number, default: 0, min: 0 },
  loyaltyPointsAwarded: { type: Boolean, default: false },
  loyaltyRollbackProcessed: { type: Boolean, default: false },
  total: { type: Number, required: true, default: 0 },

  // ── Coupon ────────────────────────────────────────────────────────────
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    default: null
  },
  couponCode: { type: String, default: null },

  // ── Payment ───────────────────────────────────────────────────────────
  paymentMethod: {
    type: String,
    enum: PAYMENT_METHOD_VALUES,
    required: true,
    default: 'credit_card'
  },
  paymentStatus: {
    type: String,
    enum: PAYMENT_STATUS_VALUES,
    required: true,
    default: 'pending'
  },
  stripePaymentIntentId: { type: String, default: null },

  // ── Order Status ──────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ORDER_STATUS_VALUES,
    default: 'pending',
    required: true
  },
  statusUpdates: [StatusUpdateSchema],

  // ── Delivery (Multi-Provider) ─────────────────────────────────────────────
  deliveryProvider: { type: String, enum: ['doordash', 'ubereats', 'grubhub'], default: 'doordash' },
  deliveryId: { type: String, default: null },
  trackingUrl: { type: String, default: null },
  pickupTime: { type: Date, default: null },
  deliveryTime: { type: Date, default: null },
  scheduledTime: { type: Date, default: null },
  courierNotes: { type: String, default: null },
  specialInstructions: { type: String, default: null },

  // ── Driver Info ───────────────────────────────────────────────────────
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  courierName: { type: String, default: null },
  courierPhone: { type: String, default: null },
  courierLat: { type: Number, default: null },
  courierLng: { type: Number, default: null },
  lastDeliverySyncAt: { type: Date, default: null },

  // ── Rating (inline for quick access; detailed in Review model) ────────
  rating: { type: Number, min: 1, max: 5, default: null },
  review: { type: String, default: null },
  restaurantReply: { type: String, default: null },

  // ── Admin Notes ───────────────────────────────────────────────────────
  adminNotes: [{
    text: { type: String, required: true },
    author: { type: String, required: true }, // e.g. "Admin" or "Kitchen"
    timestamp: { type: Date, default: Date.now }
  }],

  // ── Refund ────────────────────────────────────────────────────────────
  refunded: { type: Boolean, default: false },
  refundAmount: { type: Number, default: 0 },
  refundReason: { type: String, default: null },

  // ── Payment Audit Log ─────────────────────────────────────────────────
  // Structured event log of every payment + order lifecycle event.
  // Use pushPaymentEvent() helper to append safely.
  paymentEvents: { type: [PaymentEventSchema], default: [] },

  // ── Legacy field kept for DoorDash API compatibility ──────────────────
  productName: { type: String, default: null },
  productPrice: { type: Number, default: null }
}, { timestamps: true });

// ── Indexes ─────────────────────────────────────────────────────────────────
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ restaurantId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });



// ── Pre-save: generate order number & external ID ───────────────────────────
OrderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.orderNumber = `ORD-${ts}-${rand}`;
  }

  if (!this.externalDeliveryId) {
    const dbName = this.constructor.db ? this.constructor.db.name : 'daas_poc';
    const uuid = crypto.randomUUID();
    this.externalDeliveryId = `DD-${dbName}-${Date.now()}-${uuid.split('-')[0]}`;
  }

  // Map cart items to DoorDash product fields
  if (this.items?.length > 0) {
    this.productName = this.items.map(i => `${i.quantity}x ${i.name}`).join(', ').substring(0, 95);
    this.productPrice = this.subtotal;
  }

  // Initialize first status update
  if (this.statusUpdates.length === 0) {
    this.statusUpdates.push({
      status: this.status,
      timestamp: new Date(),
      description: 'Order created'
    });
  }

  next();
});

// M5: Performance indexes already defined above (lines ~185-188).
// userId+createdAt, restaurantId+createdAt, status, orderNumber — all covered.

const Order = mongoose.model('Order', OrderSchema);
export default Order;
