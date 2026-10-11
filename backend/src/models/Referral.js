import mongoose from 'mongoose';

/**
 * One document per (referrer -> referee) relationship.
 * A referee can only ever have ONE referral (unique index) which is what makes
 * "apply a code" race-safe and one-time.
 */
const ReferralSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', default: null },

  referrerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  refereeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  code: { type: String, required: true, uppercase: true, trim: true },

  // coupon generated for the referee
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
  couponCode: { type: String, default: null },
  couponExpiresAt: { type: Date, default: null },

  // lifecycle
  //   coupon_issued -> friend has coupon, no order yet
  //   redeemed      -> friend placed the order with the coupon (awaiting delivery)
  //   rewarded      -> order delivered, referrer was paid
  //   revoked       -> reward clawed back (refund) or cancelled by admin
  status: {
    type: String,
    enum: ['coupon_issued', 'redeemed', 'rewarded', 'revoked'],
    default: 'coupon_issued',
    index: true
  },

  // snapshot of the terms at the time of applying (admin may change them later)
  refereeDiscountValue: { type: Number, default: 0 },
  refereeMinOrder: { type: Number, default: 0 },
  referrerRewardValue: { type: Number, default: 0 },       // $
  referrerRewardPoints: { type: Number, default: 0 },      // points actually credited

  // benefit tracking
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  discountGiven: { type: Number, default: 0 },
  redeemedAt: { type: Date, default: null },
  rewardedAt: { type: Date, default: null },
  revokedAt: { type: Date, default: null },
  revokeReason: { type: String, default: null },

  // fraud signals (admin review)
  appliedIp: { type: String, default: null },
  flagged: { type: Boolean, default: false },
  flagReason: { type: String, default: null }
}, { timestamps: true });

ReferralSchema.index({ refereeId: 1 }, { unique: true });
ReferralSchema.index({ couponId: 1 });
ReferralSchema.index({ appliedIp: 1, createdAt: -1 });
ReferralSchema.index({ restaurantId: 1, createdAt: -1 });

const Referral = mongoose.model('Referral', ReferralSchema);
export default Referral;
