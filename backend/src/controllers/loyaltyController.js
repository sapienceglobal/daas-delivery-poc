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

  const [transactions, total] = await Promise.all([
    LoyaltyTransaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('orderId', 'orderNumber restaurantName')
      .lean(),
    LoyaltyTransaction.countDocuments({ userId: req.user._id })
  ]);

  const user = await User.findById(req.user._id).select('loyaltyPoints isLoyaltyMember');

  res.success(response, {
    data: transactions,
    currentBalance: user?.loyaltyPoints || 0,
    isLoyaltyMember: user?.isLoyaltyMember || false,
    pagination: res.buildPagination(page, limit, total)
  });
});

/**
 * Join Loyalty Program
 */
export const joinProgram = asyncHandler(async (req, response) => {
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
 * Earn points via actions (login, review, refer)
 */
export const earnPoints = asyncHandler(async (req, response) => {
  const { action } = req.body;
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
    pointsToAward = 20;
    description = 'Review Bonus';
  } else if (action === 'refer') {
    pointsToAward = 100;
    description = 'Refer a Friend Bonus';
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

  res.success(response, { message: `Earned ${pointsToAward} points!`, points: user.loyaltyPoints });
});

/**
 * Redeem points for a discount coupon
 */
export const redeemPoints = asyncHandler(async (req, response) => {
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
  
  const coupon = await Coupon.create({
    code: couponCode,
    description: `Redeemed ${points} Loyalty Points for $${expectedDiscount} OFF`,
    type: 'flat',
    value: expectedDiscount,
    maxUses: 1,
    maxUsesPerUser: 1,
    isActive: true
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
    couponCode: coupon.code,
    points: user.loyaltyPoints 
  });
});
