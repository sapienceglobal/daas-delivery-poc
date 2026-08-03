import LoyaltyTransaction from '../models/LoyaltyTransaction.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import * as res from '../utils/responseFormatter.js';
import crypto from 'crypto';

/**
 * Get loyalty transaction history for the logged-in user
 */
export const getMyLoyaltyHistory = asyncHandler(async (req, response) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const LoyaltyTransaction = req.getModel('LoyaltyTransaction');
  const User = req.getModel('User');

  const [transactions, total] = await Promise.all([
    LoyaltyTransaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('orderId', 'orderNumber restaurantName')
      .populate('reward.couponId', 'code expiresAt')
      .lean(),
    LoyaltyTransaction.countDocuments({ userId: req.user._id })
  ]);

  const user = await User.findById(req.user._id).select('loyaltyPoints isLoyaltyMember lastLoginBonusDate');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const hasClaimedDaily = user?.lastLoginBonusDate && user.lastLoginBonusDate >= today;

  res.success(response, {
    data: {
      transactions,
      currentBalance: user?.loyaltyPoints || 0,
      isLoyaltyMember: user?.isLoyaltyMember || false,
      hasClaimedDaily
    },
    pagination: res.buildPagination(page, limit, total)
  });
});

/**
 * Join Loyalty Program
 */
export const joinProgram = asyncHandler(async (req, response) => {
  const User = req.getModel('User');
  const LoyaltyTransaction = req.getModel('LoyaltyTransaction');
  const user = await User.findById(req.user._id);
  if (user.isLoyaltyMember) {
    throw new AppError('You are already a member of the loyalty program', 400);
  }
  
  user.isLoyaltyMember = true;
  user.loyaltyPoints = user.loyaltyPoints || 0;
  await user.save();

  // Give 50 welcome points
  user.loyaltyPoints += 50;
  await user.save();
  await LoyaltyTransaction.create({
    userId: user._id,
    type: 'bonus',
    points: 50,
    balanceAfter: user.loyaltyPoints,
    description: 'Welcome Bonus'
  });

  res.success(response, { message: 'Successfully joined the loyalty program!', points: user.loyaltyPoints }, 201);
});

/**
 * Earn points via actions (login, review)
 */
export const earnPoints = asyncHandler(async (req, response) => {
  const User = req.getModel('User');
  const LoyaltyTransaction = req.getModel('LoyaltyTransaction');
  const Order = req.getModel('Order');
  const { action, orderId } = req.body;
  const user = await User.findById(req.user._id);

  if (!user.isLoyaltyMember) {
    throw new AppError('You must join the loyalty program first', 400);
  }

  let pointsToAward = 0;
  let description = '';

  if (action === 'login') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (user.lastLoginBonusDate && user.lastLoginBonusDate >= today) {
      throw new AppError('Daily login bonus already claimed today', 400);
    }
    
    user.lastLoginBonusDate = new Date();
    pointsToAward = 5;
    description = 'Daily Login Bonus';

  } else if (action === 'review') {
    // Must provide an orderId for the review
    if (!orderId) {
      throw new AppError('Please provide the orderId for the order you are reviewing', 400);
    }

    // Order must belong to this user and be delivered
    const order = await Order.findOne({ _id: orderId, userId: req.user._id, status: 'delivered' });
    if (!order) {
      throw new AppError('You can only earn review points for your own completed orders', 400);
    }

    // Check if review bonus already claimed for this order
    const alreadyClaimed = await LoyaltyTransaction.findOne({
      userId: req.user._id,
      description: `Review Bonus for order ${orderId}`
    });
    if (alreadyClaimed) {
      throw new AppError('You have already earned review points for this order', 400);
    }

    pointsToAward = 20;
    description = `Review Bonus for order ${orderId}`;

  } else if (action === 'refer') {
    // Refer bonus is awarded only by the referral system when a referred user completes their first order.
    // This endpoint cannot be used to self-claim referral points.
    throw new AppError('Referral points are automatically awarded when your referred friend places their first order', 400);

  } else {
    throw new AppError('Invalid action type', 400);
  }

  user.loyaltyPoints += pointsToAward;
  await user.save();

  await LoyaltyTransaction.create({
    userId: user._id,
    type: 'earned',
    points: pointsToAward,
    balanceAfter: user.loyaltyPoints,
    description
  });

  res.success(response, { 
    message: `Earned ${pointsToAward} points!`, 
    data: { points: user.loyaltyPoints } 
  });
});

/**
 * Redeem points for a discount coupon
 */
export const redeemPoints = asyncHandler(async (req, response) => {
  const User = req.getModel('User');
  const LoyaltyTransaction = req.getModel('LoyaltyTransaction');
  const Coupon = req.getModel('Coupon');
  const { points, expectedDiscount } = req.body;
  const user = await User.findById(req.user._id);

  if (!user.isLoyaltyMember) {
    throw new AppError('You must join the loyalty program first', 400);
  }

  if (!points || points <= 0 || !expectedDiscount) {
    throw new AppError('Invalid redemption request', 400);
  }

  if (user.loyaltyPoints < points) {
    throw new AppError(`Insufficient points. You need ${points} but have ${user.loyaltyPoints}`, 400);
  }

  // Deduct points
  user.loyaltyPoints -= points;
  await user.save();

  // Create single-use flat discount coupon
  const couponCode = `LOYALTY${expectedDiscount}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  // Set expiry to 30 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const coupon = await Coupon.create({
    code: couponCode,
    description: `Redeemed ${points} Loyalty Points for $${expectedDiscount} OFF`,
    type: 'flat',
    value: expectedDiscount,
    maxUses: 1,
    maxUsesPerUser: 1,
    isActive: true,
    endDate: expiresAt
  });

  // Log transaction
  await LoyaltyTransaction.create({
    userId: user._id,
    type: 'redeemed',
    points: -points,
    balanceAfter: user.loyaltyPoints,
    description: `Redeemed for $${expectedDiscount} OFF`,
    reward: {
      type: 'discount_coupon',
      value: expectedDiscount,
      couponId: coupon._id
    }
  });

  res.success(response, { 
    message: 'Points redeemed successfully', 
    data: {
      couponCode: coupon.code,
      points: user.loyaltyPoints 
    }
  });
});
