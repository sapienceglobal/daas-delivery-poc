import LoyaltyTransaction from '../models/LoyaltyTransaction.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import * as res from '../utils/responseFormatter.js';

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

  const user = await User.findById(req.user._id).select('loyaltyPoints');

  res.success(response, {
    data: transactions,
    currentBalance: user?.loyaltyPoints || 0,
    pagination: res.buildPagination(page, limit, total)
  });
});
