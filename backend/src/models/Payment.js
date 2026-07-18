import mongoose from 'mongoose';
import { PAYMENT_METHOD_VALUES, PAYMENT_STATUS_VALUES } from '../config/constants.js';

const PaymentSchema = new mongoose.Schema({
  // ── Relations ─────────────────────────────────────────────────────────
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant ID is required']
  },

  // ── Payment Details ───────────────────────────────────────────────────
  method: {
    type: String,
    enum: PAYMENT_METHOD_VALUES,
    required: [true, 'Payment method is required']
  },
  status: {
    type: String,
    enum: PAYMENT_STATUS_VALUES,
    default: 'pending'
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  currency: {
    type: String,
    default: 'usd',
    uppercase: true
  },
  tip: { type: Number, default: 0, min: 0 },

  // ── Stripe ────────────────────────────────────────────────────────────
  stripePaymentIntentId: { type: String, default: null },
  stripeChargeId: { type: String, default: null },

  // ── Split Payments ────────────────────────────────────────────────────
  isSplit: { type: Boolean, default: false },
  splitParts: [{
    method: { type: String, enum: PAYMENT_METHOD_VALUES },
    amount: { type: Number, min: 0 },
    status: { type: String, enum: PAYMENT_STATUS_VALUES, default: 'pending' },
    stripePaymentIntentId: { type: String, default: null }
  }],

  // ── Refund ────────────────────────────────────────────────────────────
  refunds: [{
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, default: '' },
    stripeRefundId: { type: String, default: null },
    refundedAt: { type: Date, default: Date.now },
    refundedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  totalRefunded: { type: Number, default: 0, min: 0 },

  // ── Invoice / Receipt ─────────────────────────────────────────────────
  invoiceNumber: { type: String, default: null },
  receiptUrl: { type: String, default: null },

  // ── Metadata ──────────────────────────────────────────────────────────
  failureReason: { type: String, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

// ── Indexes ─────────────────────────────────────────────────────────────────
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ restaurantId: 1, createdAt: -1 });
PaymentSchema.index({ stripePaymentIntentId: 1 }, { sparse: true });

const Payment = mongoose.model('Payment', PaymentSchema);
export default Payment;
