import Coupon from '../models/Coupon.js';
import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import * as res from '../utils/responseFormatter.js';

export const validateCoupon = asyncHandler(async (req, response) => {
  const { code, cartValue, restaurantId, paymentMethod } = req.body;
  if (!code) throw new AppError('Coupon code is required', 400);

  const CouponModel = req.getModel ? req.getModel('Coupon') : Coupon;
  const OrderModel = req.getModel ? req.getModel('Order') : Order;

  const coupon = await CouponModel.findOne({ code: code.toUpperCase() });
  if (!coupon) throw new AppError('Invalid coupon code', 404);

  if (coupon.specificRestaurant && restaurantId && coupon.specificRestaurant.toString() !== restaurantId) {
    throw new AppError('This coupon is not valid for this restaurant', 400);
  }

  const pastOrderCount = await OrderModel.countDocuments({ userId: req.user._id });
  // Pass null for paymentMethod during live validation so it applies successfully and frontend can enforce the UI lock
  const validation = coupon.isValid(cartValue || 0, req.user._id, pastOrderCount, null);

  if (!validation.valid) {
    throw new AppError(validation.reason, 400);
  }

  const discount = coupon.calculateDiscount(cartValue || 0);

  res.success(response, {
    data: {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount,
      description: coupon.description,
      allowedPaymentMethods: coupon.allowedPaymentMethods || ['All']
    }
  });
});

export const getCoupons = asyncHandler(async (req, response) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.user.role === 'merchant') {
    filter.specificRestaurant = req.user.restaurantId;
  }
  if (req.query.active === 'true') {
    filter.isActive = true;
    filter.endDate = { $gte: new Date() };
  }

  const CouponModel = req.getModel ? req.getModel('Coupon') : Coupon;

  const [coupons, total] = await Promise.all([
    CouponModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    CouponModel.countDocuments(filter)
  ]);

  res.success(response, { data: coupons, pagination: res.buildPagination(page, limit, total) });
});

export const getActiveCoupons = asyncHandler(async (req, response) => {
  const CouponModel = req.getModel ? req.getModel('Coupon') : Coupon;
  const filter = {
    isActive: true,
    $and: [
      {
        $or: [
          { endDate: { $gt: new Date() } },
          { endDate: { $exists: false } },
          { endDate: null }
        ]
      },
      {
        $or: [
          { applicableUsers: { $exists: false } },
          { applicableUsers: { $size: 0 } }
        ]
      }
    ]
  };

  // Allow optional restaurant filtering for single restaurant app or marketplace
  if (req.query.restaurantId) {
    filter.$and.push({
      $or: [
        { specificRestaurant: req.query.restaurantId },
        { specificRestaurant: null }
      ]
    });
  }

  // Only return coupons that haven't hit their usage limit
  filter.$expr = { $or: [{ $eq: ["$maxUses", null] }, { $lt: ["$usedCount", "$maxUses"] }] };

  const coupons = await CouponModel.find(filter)
    .sort({ value: -1, createdAt: -1 })
    .select('-usedBy') // Hide PII
    .lean();

  res.success(response, { data: coupons });
});

import Customer from '../models/Customer.js';
import User from '../models/User.js';

export const createCoupon = asyncHandler(async (req, response) => {
  req.body.createdBy = req.user._id;
  if (req.user.role === 'merchant') {
    req.body.specificRestaurant = req.user.restaurantId;
  }

  // Handle Target Group Logic
  const { targetGroup } = req.body;
  if (targetGroup && targetGroup !== 'All Users') {
    const CustomerModel = req.getModel ? req.getModel('Customer') : Customer;
    const UserModel = req.getModel ? req.getModel('User') : User;

    // Find customers in this group
    const customers = await CustomerModel.find({ 
      restaurantId: req.user.restaurantId, 
      group: targetGroup,
      isDeleted: { $ne: true }
    });

    const emails = customers.map(c => c.email).filter(Boolean);
    const users = await UserModel.find({ email: { $in: emails } });
    
    // Set applicable users to restrict the coupon
    req.body.applicableUsers = users.map(u => u._id);
  }

  const CouponModel = req.getModel ? req.getModel('Coupon') : Coupon;
  const coupon = await CouponModel.create(req.body);

  // Send notifications to targeted users
  if (targetGroup && targetGroup !== 'All Users' && req.body.applicableUsers?.length > 0) {
    const NotificationModel = req.getModel ? req.getModel('Notification') : (await import('../models/Notification.js')).default;
    const notifications = req.body.applicableUsers.map(uid => ({
      userId: uid,
      title: `Exclusive ${targetGroup} Offer!`,
      message: `You've got a new exclusive offer! Use code ${coupon.code} to get ${coupon.type === 'percentage' ? coupon.value + '%' : '$' + coupon.value} off.`,
      type: 'promo',
      isRead: false
    }));
    await NotificationModel.insertMany(notifications);
  }

  res.created(response, { data: coupon });
});

export const updateCoupon = asyncHandler(async (req, response) => {
  const CouponModel = req.getModel ? req.getModel('Coupon') : Coupon;
  const existingCoupon = await CouponModel.findById(req.params.id);
  if (!existingCoupon) throw new AppError('Coupon not found', 404);

  if (req.user.role === 'merchant' && existingCoupon.specificRestaurant?.toString() !== req.user.restaurantId?.toString()) {
    throw new AppError('Not authorized to update this coupon', 403);
  }

  if (req.user.role === 'merchant') {
    req.body.specificRestaurant = req.user.restaurantId;
  }

  const coupon = await CouponModel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.success(response, { data: coupon, message: 'Coupon updated' });
});

export const deleteCoupon = asyncHandler(async (req, response) => {
  const CouponModel = req.getModel ? req.getModel('Coupon') : Coupon;
  const existingCoupon = await CouponModel.findById(req.params.id);
  if (!existingCoupon) throw new AppError('Coupon not found', 404);

  if (req.user.role === 'merchant' && existingCoupon.specificRestaurant?.toString() !== req.user.restaurantId?.toString()) {
    throw new AppError('Not authorized to delete this coupon', 403);
  }

  await CouponModel.findByIdAndDelete(req.params.id);
  res.success(response, { message: 'Coupon deleted' });
});

export const getCouponStats = asyncHandler(async (req, response) => {
  const CouponModel = req.getModel ? req.getModel('Coupon') : Coupon;
  const OrderModel = req.getModel ? req.getModel('Order') : Order;

  const filter = {};
  if (req.user.role === 'merchant') {
    filter.specificRestaurant = req.user.restaurantId;
  }

  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [totalPromotions, activePromotions] = await Promise.all([
    CouponModel.countDocuments(filter),
    CouponModel.countDocuments({ ...filter, isActive: true, endDate: { $gte: now } })
  ]);

  // Total Orders for Redemption Rate
  const allOrdersFilter = req.user.role === 'merchant' ? { restaurantId: req.user.restaurantId } : {};
  const totalOrders = await OrderModel.countDocuments(allOrdersFilter);

  const orderFilter = { couponId: { $ne: null }, ...allOrdersFilter };

  // All time stats
  const orderStats = await OrderModel.aggregate([
    { $match: orderFilter },
    {
      $group: {
        _id: null,
        totalRedemptions: { $sum: 1 },
        totalDiscountGiven: { $sum: '$discount' },
        revenueFromPromo: { $sum: '$total' }
      }
    }
  ]);

  // This month stats
  const thisMonthStats = await OrderModel.aggregate([
    { $match: { ...orderFilter, createdAt: { $gte: startOfThisMonth } } },
    {
      $group: {
        _id: null,
        totalRedemptions: { $sum: 1 },
        totalDiscountGiven: { $sum: '$discount' },
        revenueFromPromo: { $sum: '$total' }
      }
    }
  ]);

  // Last month stats
  const lastMonthStats = await OrderModel.aggregate([
    { $match: { ...orderFilter, createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth } } },
    {
      $group: {
        _id: null,
        totalRedemptions: { $sum: 1 },
        totalDiscountGiven: { $sum: '$discount' },
        revenueFromPromo: { $sum: '$total' }
      }
    }
  ]);

  // Promotions created this/last month for trend
  const [promosThisMonth, promosLastMonth] = await Promise.all([
    CouponModel.countDocuments({ ...filter, createdAt: { $gte: startOfThisMonth } }),
    CouponModel.countDocuments({ ...filter, createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth } })
  ]);

  const stats = orderStats[0] || { totalRedemptions: 0, totalDiscountGiven: 0, revenueFromPromo: 0 };
  const thisM = thisMonthStats[0] || { totalRedemptions: 0, totalDiscountGiven: 0, revenueFromPromo: 0 };
  const lastM = lastMonthStats[0] || { totalRedemptions: 0, totalDiscountGiven: 0, revenueFromPromo: 0 };

  const calcTrend = (current, previous) => previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;

  const trends = {
    promotions: calcTrend(promosThisMonth, promosLastMonth),
    redemptions: calcTrend(thisM.totalRedemptions, lastM.totalRedemptions),
    discount: calcTrend(thisM.totalDiscountGiven, lastM.totalDiscountGiven),
    revenue: calcTrend(thisM.revenueFromPromo, lastM.revenueFromPromo)
  };

  const redemptionRate = totalOrders > 0 ? ((stats.totalRedemptions / totalOrders) * 100).toFixed(2) : 0;

  const topPromotions = await OrderModel.aggregate([
    { $match: orderFilter },
    {
      $group: {
        _id: '$couponId',
        redemptions: { $sum: 1 },
        revenue: { $sum: '$total' }
      }
    },
    { $sort: { redemptions: -1 } },
    { $limit: 3 },
    {
      $lookup: {
        from: 'coupons',
        localField: '_id',
        foreignField: '_id',
        as: 'coupon'
      }
    },
    { $unwind: '$coupon' },
    {
      $project: {
        name: '$coupon.name',
        code: '$coupon.code',
        redemptions: 1,
        revenue: 1
      }
    }
  ]);

  res.success(response, {
    data: {
      totalPromotions,
      activePromotions,
      couponsRedeemed: stats.totalRedemptions,
      totalDiscountGiven: stats.totalDiscountGiven,
      revenueFromPromo: stats.revenueFromPromo,
      redemptionRate: parseFloat(redemptionRate),
      topPromotions,
      trends
    }
  });
});

