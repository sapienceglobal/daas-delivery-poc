import xss from 'xss';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import * as res from '../utils/responseFormatter.js';
import {
  applyReferralCode,
  buildPublicProgram,
  loadRestaurant,
  maskName,
  readSettings
} from '../services/referralService.js';

const requireRestaurant = async (req) => {
  const restaurantId = req.user?.role === 'merchant' ? req.user.restaurantId : null;
  const restaurant = await loadRestaurant(req.getModel, restaurantId);
  if (!restaurant) throw new AppError('Restaurant not found', 404);
  return restaurant;
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isExpired = (referral) => referral.status === 'coupon_issued'
  && referral.couponExpiresAt && new Date(referral.couponExpiresAt) < new Date();

// ── Public / customer ───────────────────────────────────────────────────────

export const getProgram = asyncHandler(async (req, response) => {
  const restaurant = await loadRestaurant(req.getModel);
  res.success(response, { data: buildPublicProgram(restaurant) });
});

export const getMyReferral = asyncHandler(async (req, response) => {
  const UserModel = req.getModel('User');
  const ReferralModel = req.getModel('Referral');
  const restaurant = await loadRestaurant(req.getModel);

  const user = await UserModel.findById(req.user._id);
  const [sent, received] = await Promise.all([
    ReferralModel.find({ referrerId: user._id }).sort({ createdAt: -1 }).limit(50)
      .populate('refereeId', 'name').lean(),
    ReferralModel.findOne({ refereeId: user._id }).lean()
  ]);

  const stats = {
    invited: sent.length,
    pending: sent.filter((r) => ['coupon_issued', 'redeemed'].includes(r.status)).length,
    rewarded: sent.filter((r) => r.status === 'rewarded').length,
    pointsEarned: sent.filter((r) => r.status === 'rewarded').reduce((s, r) => s + (r.referrerRewardPoints || 0), 0)
  };

  const base = process.env.REFERRAL_LINK_BASE || 'https://lassiloungeny.com/ref';
  res.success(response, {
    data: {
      code: user.referralCode,
      shareLink: user.referralCode ? `${base}/${user.referralCode}` : null,
      program: buildPublicProgram(restaurant),
      onboarding: user.referralOnboarding,
      stats,
      friends: sent.map((r) => ({
        name: maskName(r.refereeId?.name),
        status: r.status,
        points: r.referrerRewardPoints || 0,
        date: r.createdAt
      })),
      myCoupon: received && received.status !== 'revoked' ? {
        code: received.couponCode,
        discount: received.refereeDiscountValue,
        minOrder: received.refereeMinOrder,
        expiresAt: received.couponExpiresAt,
        used: ['redeemed', 'rewarded'].includes(received.status),
        expired: isExpired(received)
      } : null
    }
  });
});

export const applyCode = asyncHandler(async (req, response) => {
  const platform = req.headers['x-platform'];
  if (platform !== 'app') {
    throw new AppError('Referral rewards are exclusive to the Lassi Lounge Mobile App. Please download the app on iOS or Android to claim your referral rewards.', 400);
  }
  const result = await applyReferralCode({
    getModel: req.getModel,
    userId: req.user._id,
    code: req.body?.code,
    ip: req.ip
  });
  res.success(response, { data: result, message: result.message });
});

export const skipOnboarding = asyncHandler(async (req, response) => {
  await req.getModel('User').updateOne(
    { _id: req.user._id, referralOnboarding: 'pending' },
    { $set: { referralOnboarding: 'skipped' } }
  );
  res.success(response, { message: 'Skipped' });
});

// ── Admin / merchant ────────────────────────────────────────────────────────

const NUMBER_FIELDS = {
  refereeDiscountValue: [0, 1000],
  refereeMinOrder: [0, 10000],
  referrerRewardValue: [0, 1000],
  couponValidityDays: [1, 365],
  applyWindowDays: [1, 90],
  maxRewardsPerReferrer: [0, 1000],
  maxAppliesPerIpPerDay: [1, 100]
};
const TEXT_FIELDS = { title: 80, description: 300, termsAndConditions: 2000 };

export const getAdminSettings = asyncHandler(async (req, response) => {
  const restaurant = await requireRestaurant(req);
  res.success(response, { data: readSettings(restaurant) });
});

export const updateAdminSettings = asyncHandler(async (req, response) => {
  const restaurant = await requireRestaurant(req);
  const body = req.body || {};
  const next = {};

  for (const [key, [min, max]] of Object.entries(NUMBER_FIELDS)) {
    if (body[key] === undefined) continue;
    const value = Number(body[key]);
    if (!Number.isFinite(value) || value < min || value > max) {
      throw new AppError(`${key} must be a number between ${min} and ${max}`, 400);
    }
    next[key] = Math.round(value * 100) / 100;
  }
  for (const key of ['enabled', 'requireReferrerOrder']) {
    if (body[key] !== undefined) next[key] = body[key] === true || body[key] === 'true';
  }
  for (const [key, maxLen] of Object.entries(TEXT_FIELDS)) {
    if (body[key] === undefined) continue;
    const value = xss(String(body[key]).trim(), { whiteList: {}, stripIgnoreTag: true });
    if (!value) throw new AppError(`${key} cannot be empty`, 400);
    if (value.length > maxLen) throw new AppError(`${key} cannot exceed ${maxLen} characters`, 400);
    next[key] = value;
  }

  const current = readSettings(restaurant);
  delete current.enabled;
  restaurant.referralSettings = { ...current, ...next, enabled: next.enabled ?? readSettings(restaurant).enabled };
  await restaurant.save();

  res.success(response, { data: readSettings(restaurant), message: 'Referral settings updated' });
});

export const getAdminStats = asyncHandler(async (req, response) => {
  const ReferralModel = req.getModel('Referral');

  const [byStatus, totals, flagged, topReferrers] = await Promise.all([
    ReferralModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ReferralModel.aggregate([
      { $match: { status: { $in: ['redeemed', 'rewarded'] } } },
      { $group: { _id: null, discountGiven: { $sum: '$discountGiven' } } }
    ]),
    ReferralModel.countDocuments({ flagged: true }),
    ReferralModel.aggregate([
      { $match: { status: 'rewarded' } },
      { $group: { _id: '$referrerId', rewarded: { $sum: 1 }, points: { $sum: '$referrerRewardPoints' } } },
      { $sort: { rewarded: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { _id: 0, name: '$user.name', email: '$user.email', rewarded: 1, points: 1 } }
    ])
  ]);

  const counts = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));
  const total = byStatus.reduce((s, x) => s + x.count, 0);
  const rewardPoints = await ReferralModel.aggregate([
    { $match: { status: 'rewarded' } },
    { $group: { _id: null, points: { $sum: '$referrerRewardPoints' } } }
  ]);

  res.success(response, {
    data: {
      totalReferrals: total,
      couponIssued: counts.coupon_issued || 0,
      redeemed: counts.redeemed || 0,
      rewarded: counts.rewarded || 0,
      revoked: counts.revoked || 0,
      flagged,
      discountGiven: totals[0]?.discountGiven || 0,
      pointsAwarded: rewardPoints[0]?.points || 0,
      conversionRate: total ? Math.round(((counts.rewarded || 0) + (counts.redeemed || 0)) / total * 1000) / 10 : 0,
      topReferrers
    }
  });
});

export const listReferrals = asyncHandler(async (req, response) => {
  const ReferralModel = req.getModel('Referral');
  const UserModel = req.getModel('User');
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

  const filter = {};
  const allowedStatus = ['coupon_issued', 'redeemed', 'rewarded', 'revoked'];
  if (req.query.status && allowedStatus.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.flagged === 'true') filter.flagged = true;

  const search = String(req.query.search || '').trim().slice(0, 60);
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    const users = await UserModel.find({ $or: [{ name: rx }, { email: rx }, { referralCode: rx }] }).select('_id').limit(200);
    const ids = users.map((u) => u._id);
    filter.$or = [{ referrerId: { $in: ids } }, { refereeId: { $in: ids } }, { code: rx }, { couponCode: rx }];
  }

  const [rows, total] = await Promise.all([
    ReferralModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
      .populate('referrerId', 'name email phone').populate('refereeId', 'name email phone')
      .populate('orderId', 'orderNumber total').lean(),
    ReferralModel.countDocuments(filter)
  ]);

  const data = rows.map((r) => ({
    id: r._id,
    code: r.code,
    status: isExpired(r) ? 'expired' : r.status,
    referrer: r.referrerId,
    referee: r.refereeId,
    coupon: { code: r.couponCode, expiresAt: r.couponExpiresAt, discount: r.refereeDiscountValue, minOrder: r.refereeMinOrder },
    order: r.orderId || null,
    discountGiven: r.discountGiven,
    rewardValue: r.referrerRewardValue,
    rewardPoints: r.referrerRewardPoints,
    flagged: r.flagged,
    flagReason: r.flagReason,
    revokeReason: r.revokeReason,
    createdAt: r.createdAt,
    redeemedAt: r.redeemedAt,
    rewardedAt: r.rewardedAt
  }));

  res.success(response, { data, pagination: res.buildPagination(page, limit, total) });
});

/** Admin can cancel a referral whose coupon has not been used yet. */
export const cancelReferral = asyncHandler(async (req, response) => {
  const ReferralModel = req.getModel('Referral');
  const referral = await ReferralModel.findOneAndUpdate(
    { _id: req.params.id, status: 'coupon_issued' },
    { $set: { status: 'revoked', revokedAt: new Date(), revokeReason: 'cancelled_by_admin' } },
    { new: true }
  );
  if (!referral) throw new AppError('Only referrals with an unused coupon can be cancelled', 400);
  if (referral.couponId) {
    await req.getModel('Coupon').updateOne({ _id: referral.couponId }, { $set: { isActive: false } });
  }
  res.success(response, { message: 'Referral cancelled' });
});
