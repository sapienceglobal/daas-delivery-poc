import crypto from 'crypto';
import Referral from '../models/Referral.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

/**
 * Referral program engine.
 *
 * Every function takes a `getModel(name)` resolver so it works both inside an
 * HTTP request (req.getModel) and in background flows (order delivered/cancelled).
 *
 * Security notes:
 *  - All terms come from Restaurant.referralSettings (admin editable) – no hardcoded values.
 *  - Applying a code is guarded by an atomic claim on the user document + a unique
 *    index on Referral.refereeId, so double taps / parallel requests can't issue two coupons.
 *  - Code related failures all return the same generic message (no code enumeration).
 *  - Referrer is rewarded exactly once, only after the order is DELIVERED, and the
 *    reward is clawed back if the order is later refunded.
 */

void Referral; // keep the model registered for tenant getModel()

const CODE_RE = /^[A-Z0-9]{4,12}$/;
const GENERIC_CODE_ERROR = 'This referral code is invalid or no longer available.';
const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVE_STATUSES = ['coupon_issued', 'redeemed', 'rewarded'];

// ── Helpers ─────────────────────────────────────────────────────────────────

export const money = (n) => {
  const v = Number(n) || 0;
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
};

const digits = (value) => String(value || '').replace(/\D/g, '');

/** Collapse gmail dots / "+tag" aliases so a@gmail.com == a+1@gmail.com. */
export const normalizeEmail = (email) => {
  const [rawLocal = '', domain = ''] = String(email || '').toLowerCase().trim().split('@');
  let local = rawLocal.split('+')[0];
  if (domain === 'gmail.com' || domain === 'googlemail.com') local = local.replace(/\./g, '');
  return `${local}@${domain === 'googlemail.com' ? 'gmail.com' : domain}`;
};

export const maskName = (name) => {
  const parts = String(name || 'Friend').trim().split(/\s+/);
  const first = parts[0] || 'Friend';
  const last = parts.length > 1 ? ` ${parts[parts.length - 1][0].toUpperCase()}.` : '';
  return `${first}${last}`;
};

export const renderTemplate = (template, settings, restaurantName = 'us') => String(template || '')
  .replace(/\{restaurant\}/g, restaurantName)
  .replace(/\{refereeDiscount\}/g, money(settings.refereeDiscountValue))
  .replace(/\{refereeMinOrder\}/g, money(settings.refereeMinOrder))
  .replace(/\{referrerReward\}/g, money(settings.referrerRewardValue))
  .replace(/\{couponValidityDays\}/g, String(settings.couponValidityDays))
  .replace(/\{applyWindowDays\}/g, String(settings.applyWindowDays));

export const loadRestaurant = async (getModel, restaurantId = null) => {
  const Restaurant = getModel('Restaurant');
  return restaurantId ? Restaurant.findById(restaurantId) : Restaurant.findOne();
};

export const readSettings = (restaurant) => {
  const raw = restaurant?.referralSettings;
  const s = raw?.toObject ? raw.toObject() : { ...(raw || {}) };
  return { ...s, enabled: !!restaurant && s.enabled !== false };
};

/** Customer facing program description – only public, rendered fields. */
export const buildPublicProgram = (restaurant) => {
  const s = readSettings(restaurant);
  const name = restaurant?.name || 'us';
  return {
    enabled: s.enabled,
    title: s.title,
    description: renderTemplate(s.description, s, name),
    termsAndConditions: renderTemplate(s.termsAndConditions, s, name),
    refereeDiscountValue: s.refereeDiscountValue,
    refereeMinOrder: s.refereeMinOrder,
    referrerRewardValue: s.referrerRewardValue,
    couponValidityDays: s.couponValidityDays,
    applyWindowDays: s.applyWindowDays,
    maxRewardsPerReferrer: s.maxRewardsPerReferrer !== undefined ? Number(s.maxRewardsPerReferrer) : 20,
    requireReferrerOrder: s.requireReferrerOrder ?? false
  };
};

const randomCouponCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(8);
  return `REF${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')}`;
};

const createCouponWithRetry = async (Coupon, payload) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await Coupon.create({ ...payload, code: randomCouponCode() });
    } catch (err) {
      if (err?.code !== 11000) throw err;
    }
  }
  throw new AppError('Could not generate your coupon. Please try again.', 500);
};

const revertUserClaim = (UserModel, userId) => UserModel.updateOne(
  { _id: userId },
  { $set: { referredBy: null, referralOnboarding: 'pending' } }
);

// ── Apply a referral code (referee) ─────────────────────────────────────────

export const applyReferralCode = async ({ getModel, userId, code, ip }) => {
  const UserModel = getModel('User');
  const OrderModel = getModel('Order');
  const CouponModel = getModel('Coupon');
  const ReferralModel = getModel('Referral');

  const restaurant = await loadRestaurant(getModel);
  const settings = readSettings(restaurant);
  if (!settings.enabled) throw new AppError('The referral program is not available right now.', 400);

  const normalized = String(code || '').trim().toUpperCase();
  if (!CODE_RE.test(normalized)) throw new AppError(GENERIC_CODE_ERROR, 400);

  const user = await UserModel.findById(userId).select('+signupIp');
  if (!user || !user.isActive) throw new AppError('Account not found.', 404);
  if (user.role !== 'customer') throw new AppError('Referral codes are only for customer accounts.', 403);
  if (!user.isEmailVerified) throw new AppError('Please verify your email first.', 403);

  if (user.referredBy || user.referralOnboarding === 'applied' ||
      await ReferralModel.exists({ refereeId: user._id })) {
    throw new AppError('You have already used a referral code.', 409);
  }

  const ageMs = Date.now() - new Date(user.createdAt).getTime();
  if (ageMs > settings.applyWindowDays * DAY_MS) {
    throw new AppError(`Referral codes can only be added within ${settings.applyWindowDays} days of signing up.`, 400);
  }

  const orderFilter = [{ userId: user._id }];
  if (user.phone) orderFilter.push({ customerPhone: user.phone });
  if (await OrderModel.exists({ $or: orderFilter })) {
    throw new AppError('Referral codes are only for new customers who have not placed an order yet.', 400);
  }

  if (ip) {
    const recentFromIp = await ReferralModel.countDocuments({
      appliedIp: ip,
      createdAt: { $gte: new Date(Date.now() - DAY_MS) }
    });
    if (recentFromIp >= settings.maxAppliesPerIpPerDay) {
      throw new AppError('Too many referral codes were applied from your network today. Please try again later.', 429);
    }
  }

  const referrer = await UserModel.findOne({ referralCode: normalized }).select('+signupIp');
  if (!referrer) throw new AppError(GENERIC_CODE_ERROR, 400);
  if (referrer._id.equals(user._id)) throw new AppError('You cannot use your own referral code.', 400);

  const invalidReferrer = !referrer.isActive || !referrer.isEmailVerified || referrer.role !== 'customer'
    || (referrer.referredBy && referrer.referredBy.equals(user._id))
    || (digits(referrer.phone) && digits(referrer.phone) === digits(user.phone))
    || normalizeEmail(referrer.email) === normalizeEmail(user.email);
  if (invalidReferrer) throw new AppError(GENERIC_CODE_ERROR, 400);

  if (settings.requireReferrerOrder &&
      !(await OrderModel.exists({ userId: referrer._id, status: 'delivered' }))) {
    throw new AppError(GENERIC_CODE_ERROR, 400);
  }

  if (settings.maxRewardsPerReferrer > 0) {
    const used = await ReferralModel.countDocuments({ referrerId: referrer._id, status: { $in: ACTIVE_STATUSES } });
    if (used >= settings.maxRewardsPerReferrer) throw new AppError(GENERIC_CODE_ERROR, 400);
  }

  // atomic claim: only ONE concurrent request can flip this user to "applied"
  const claimed = await UserModel.findOneAndUpdate(
    { _id: user._id, referredBy: null, referralOnboarding: { $ne: 'applied' } },
    { $set: { referredBy: referrer._id, referralOnboarding: 'applied' } },
    { new: true }
  );
  if (!claimed) throw new AppError('You have already used a referral code.', 409);

  let coupon = null;
  try {
    const expiresAt = new Date(Date.now() + settings.couponValidityDays * DAY_MS);
    coupon = await createCouponWithRetry(CouponModel, {
      name: 'Referral Welcome Offer',
      promoType: 'Referral Offer',
      source: 'invite_and_earn',
      description: `$${money(settings.refereeDiscountValue)} off your first order of $${money(settings.refereeMinOrder)} or more`,
      type: 'flat',
      value: settings.refereeDiscountValue,
      minCartValue: settings.refereeMinOrder,
      firstOrderOnly: true,
      maxUses: 1,
      maxUsesPerUser: 1,
      applicableUsers: [user._id],
      specificRestaurant: restaurant._id,
      endDate: expiresAt,
      isActive: true
    });

    const sameIp = !!(ip && referrer.signupIp && referrer.signupIp === ip);
    await ReferralModel.create({
      restaurantId: restaurant._id,
      referrerId: referrer._id,
      refereeId: user._id,
      code: normalized,
      couponId: coupon._id,
      couponCode: coupon.code,
      couponExpiresAt: expiresAt,
      refereeDiscountValue: settings.refereeDiscountValue,
      refereeMinOrder: settings.refereeMinOrder,
      referrerRewardValue: settings.referrerRewardValue,
      appliedIp: ip || null,
      flagged: sameIp,
      flagReason: sameIp ? 'same_network_as_referrer' : null
    });

    logger.info('Referral applied', { referrerId: referrer._id, refereeId: user._id, couponId: coupon._id });

    return {
      message: `Referral applied! You can save $${money(settings.refereeDiscountValue)} on your first order of $${money(settings.refereeMinOrder)} or more.`,
      coupon: {
        code: coupon.code,
        discount: settings.refereeDiscountValue,
        minOrder: settings.refereeMinOrder,
        expiresAt
      }
    };
  } catch (err) {
    // roll back everything so the user can retry with a clean state
    if (coupon) await CouponModel.deleteOne({ _id: coupon._id }).catch(() => {});
    await revertUserClaim(UserModel, user._id).catch(() => {});
    if (err?.code === 11000) throw new AppError('You have already used a referral code.', 409);
    throw err;
  }
};

// ── Order lifecycle hooks ───────────────────────────────────────────────────

/** Order placed with a coupon: mark the referral as redeemed (pending delivery). */
export const handleOrderPlaced = async ({ getModel, order, coupon }) => {
  if (!order?.userId || !coupon?._id) return;
  try {
    await getModel('Referral').findOneAndUpdate(
      { couponId: coupon._id, refereeId: order.userId, status: 'coupon_issued' },
      { $set: { status: 'redeemed', orderId: order._id, discountGiven: order.discount || 0, redeemedAt: new Date() } }
    );
  } catch (err) {
    logger.error('Referral order-placed hook failed', { orderId: order._id, error: err.message });
  }
};

/** Order delivered: pay the referrer once. */
export const handleOrderDelivered = async ({ getModel, order }) => {
  if (!order?._id || !order.userId) return;
  const ReferralModel = getModel('Referral');
  let referral = null;
  try {
    // atomic claim – parallel deliveries can only reward once
    referral = await ReferralModel.findOneAndUpdate(
      { orderId: order._id, refereeId: order.userId, status: 'redeemed' },
      { $set: { status: 'rewarded', rewardedAt: new Date() } },
      { new: true }
    );
    if (!referral) return;

    const UserModel = getModel('User');
    const referrer = await UserModel.findById(referral.referrerId);
    const restaurant = await loadRestaurant(getModel, referral.restaurantId);
    const settings = readSettings(restaurant);

    let skipReason = null;
    if (!referrer || !referrer.isActive) skipReason = 'referrer_inactive';
    else if (settings.maxRewardsPerReferrer > 0) {
      const rewarded = await ReferralModel.countDocuments({
        referrerId: referrer._id, status: 'rewarded', _id: { $ne: referral._id }
      });
      if (rewarded >= settings.maxRewardsPerReferrer) skipReason = 'referrer_reward_cap_reached';
    }

    if (skipReason) {
      await ReferralModel.updateOne({ _id: referral._id }, {
        $set: { status: 'revoked', revokedAt: new Date(), revokeReason: skipReason }
      });
      return;
    }

    const centsPerPoint = Number(restaurant?.loyaltySettings?.centsPerPoint) > 0
      ? Number(restaurant.loyaltySettings.centsPerPoint) : 1;
    const points = Math.max(0, Math.round((referral.referrerRewardValue * 100) / centsPerPoint));

    const updated = await UserModel.findByIdAndUpdate(referrer._id, { $inc: { loyaltyPoints: points } }, { new: true });
    await getModel('LoyaltyTransaction').create({
      userId: referrer._id,
      orderId: order._id,
      type: 'bonus',
      points,
      balanceAfter: updated.loyaltyPoints,
      description: `Referral reward: your friend ${maskName(order.customerName)} placed their first order`
    });
    await ReferralModel.updateOne({ _id: referral._id }, { $set: { referrerRewardPoints: points } });
    logger.info('Referral reward paid', { referralId: referral._id, referrerId: referrer._id, points });
  } catch (err) {
    logger.error('Referral reward failed', { orderId: order._id, error: err.message });
    // let a later delivery sync retry
    if (referral) {
      await ReferralModel.updateOne({ _id: referral._id, status: 'rewarded', referrerRewardPoints: 0 }, {
        $set: { status: 'redeemed', rewardedAt: null }
      }).catch(() => {});
    }
  }
};

/** Order cancelled / refunded: give the coupon back or claw the reward back. */
export const handleOrderReverted = async ({ getModel, order }) => {
  if (!order?._id) return;
  try {
    const ReferralModel = getModel('Referral');
    const referral = await ReferralModel.findOne({ orderId: order._id, status: { $in: ['redeemed', 'rewarded'] } });
    if (!referral) return;

    if (referral.status === 'redeemed') {
      const restored = await ReferralModel.findOneAndUpdate(
        { _id: referral._id, status: 'redeemed' },
        { $set: { status: 'coupon_issued', orderId: null, discountGiven: 0, redeemedAt: null } }
      );
      if (restored) {
        await getModel('Coupon').updateOne(
          { _id: referral.couponId, usedCount: { $gt: 0 } },
          { $inc: { usedCount: -1 }, $pull: { usedBy: { userId: referral.refereeId } } }
        );
      }
      return;
    }

    const revoked = await ReferralModel.findOneAndUpdate(
      { _id: referral._id, status: 'rewarded' },
      { $set: { status: 'revoked', revokedAt: new Date(), revokeReason: 'order_refunded' } }
    );
    if (!revoked || !(referral.referrerRewardPoints > 0)) return;

    const UserModel = getModel('User');
    const referrer = await UserModel.findById(referral.referrerId);
    if (!referrer) return;
    const newBalance = Math.max(0, (referrer.loyaltyPoints || 0) - referral.referrerRewardPoints);
    const clawed = (referrer.loyaltyPoints || 0) - newBalance;
    await UserModel.updateOne({ _id: referrer._id }, { $set: { loyaltyPoints: newBalance } });
    await getModel('LoyaltyTransaction').create({
      userId: referrer._id,
      orderId: order._id,
      type: 'adjustment',
      points: -clawed,
      balanceAfter: newBalance,
      description: 'Referral reward reversed (friend\'s order was refunded/cancelled)'
    });
  } catch (err) {
    logger.error('Referral revert hook failed', { orderId: order._id, error: err.message });
  }
};
