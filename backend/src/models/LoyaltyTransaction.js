import mongoose from 'mongoose';

const LoyaltyTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },

  // ── Transaction ───────────────────────────────────────────────────────
  type: {
    type: String,
    enum: ['earned', 'redeemed', 'expired', 'bonus', 'adjustment'],
    required: true
  },
  points: {
    type: Number,
    required: true   // positive = earned, negative = redeemed
  },
  balanceAfter: {
    type: Number,
    required: true
  },

  // ── Details ───────────────────────────────────────────────────────────
  description: {
    type: String,
    default: ''
  },
  reward: {
    type: {
      type: String,
      enum: ['free_food', 'discount_coupon', 'cashback', 'free_delivery'],
      default: null
    },
    value: { type: Number, default: null },
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      default: null
    }
  },

  expiresAt: { type: Date, default: null }
}, { timestamps: true });

// ── Indexes ─────────────────────────────────────────────────────────────────
LoyaltyTransactionSchema.index({ userId: 1, createdAt: -1 });
LoyaltyTransactionSchema.index({ userId: 1, type: 1 });

const LoyaltyTransaction = mongoose.model('LoyaltyTransaction', LoyaltyTransactionSchema);
export default LoyaltyTransaction;
