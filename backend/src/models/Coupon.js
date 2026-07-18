import mongoose from 'mongoose';
import { COUPON_TYPE_VALUES } from '../config/constants.js';

const CouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [30, 'Code cannot exceed 30 characters']
  },
  description: {
    type: String,
    default: '',
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  // ── Discount Type ─────────────────────────────────────────────────────
  type: {
    type: String,
    enum: COUPON_TYPE_VALUES,
    required: [true, 'Coupon type is required']
  },
  value: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: 0
  },
  maxDiscount: {
    type: Number,
    default: null,      // cap for percentage coupons (e.g. max $20 off)
    min: 0
  },

  // ── Rules ─────────────────────────────────────────────────────────────
  minCartValue: { type: Number, default: 0, min: 0 },
  firstOrderOnly: { type: Boolean, default: false },
  specificRestaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    default: null
  },
  applicableCuisines: [{ type: String }],

  // ── Usage Limits ──────────────────────────────────────────────────────
  maxUses: { type: Number, default: null },          // null = unlimited
  maxUsesPerUser: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0, min: 0 },
  usedBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usedAt: { type: Date, default: Date.now }
  }],

  // ── Validity ──────────────────────────────────────────────────────────
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: [true, 'Expiry date is required'] },
  isActive: { type: Boolean, default: true },

  // ── Created By ────────────────────────────────────────────────────────
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

// ── Indexes ─────────────────────────────────────────────────────────────────
CouponSchema.index({ code: 1 });
CouponSchema.index({ isActive: 1, endDate: 1 });

/**
 * Check if a coupon is valid for a given context.
 */
CouponSchema.methods.isValid = function (cartValue, userId, isFirstOrder = false) {
  const now = new Date();

  if (!this.isActive) return { valid: false, reason: 'Coupon is inactive' };
  if (now < this.startDate) return { valid: false, reason: 'Coupon is not yet active' };
  if (now > this.endDate) return { valid: false, reason: 'Coupon has expired' };
  if (this.maxUses && this.usedCount >= this.maxUses) return { valid: false, reason: 'Coupon usage limit reached' };
  if (cartValue < this.minCartValue) return { valid: false, reason: `Minimum cart value of $${this.minCartValue} required` };
  if (this.firstOrderOnly && !isFirstOrder) return { valid: false, reason: 'This coupon is valid for first orders only' };

  // Check per-user limit
  if (userId && this.maxUsesPerUser) {
    const userUses = this.usedBy.filter(u => u.userId?.toString() === userId.toString()).length;
    if (userUses >= this.maxUsesPerUser) return { valid: false, reason: 'You have already used this coupon' };
  }

  return { valid: true, reason: null };
};

/**
 * Calculate the discount amount.
 */
CouponSchema.methods.calculateDiscount = function (cartValue) {
  let discountAmount = 0;

  switch (this.type) {
    case 'flat':
      discountAmount = this.value;
      break;
    case 'percentage':
      discountAmount = (cartValue * this.value) / 100;
      if (this.maxDiscount) discountAmount = Math.min(discountAmount, this.maxDiscount);
      break;
    case 'free_delivery':
      discountAmount = 0; // handled at order level
      break;
    case 'bogo':
      discountAmount = 0; // handled at item level
      break;
    default:
      discountAmount = 0;
  }

  return Math.min(discountAmount, cartValue); // can't discount more than cart
};

const Coupon = mongoose.model('Coupon', CouponSchema);
export default Coupon;
