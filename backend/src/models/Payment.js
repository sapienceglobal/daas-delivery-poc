import mongoose from 'mongoose';
import { PAYMENT_METHOD_VALUES, PAYMENT_STATUS_VALUES } from '../config/constants.js';

// Extend payment method values to include stripe_online (used in orderController)
const EXTENDED_PAYMENT_METHOD_VALUES = [...PAYMENT_METHOD_VALUES, 'stripe_online'];

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
    enum: EXTENDED_PAYMENT_METHOD_VALUES,
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

// ── Indexes ────────────────────────────────────────────────────────────
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ restaurantId: 1, createdAt: -1 });
PaymentSchema.index({ stripePaymentIntentId: 1 }, { sparse: true });

// ── Pre-save: auto-generate invoice number ─────────────────────────────────
// Format: INV-YYYY-XXXXX (e.g. INV-2026-00042)
PaymentSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const year = new Date().getFullYear();
    // Count total payments this year to get sequence
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(`${year}-01-01T00:00:00.000Z`),
        $lt:  new Date(`${year + 1}-01-01T00:00:00.000Z`)
      }
    });
    const seq = String(count + 1).padStart(5, '0');
    this.invoiceNumber = `INV-${year}-${seq}`;
  }
  next();
});

const Payment = mongoose.model('Payment', PaymentSchema);
export default Payment;
