import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Order from '../models/Order.js';
import Settlement from '../models/Settlement.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import * as res from '../utils/responseFormatter.js';
import { roundMoney } from '../services/orderPricing.js';

export const getDashboardStats = asyncHandler(async (_req, response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalRestaurants,
    totalCustomers,
    totalDrivers,
    totalOrders,
    todayOrders,
    revenueAgg,
    todayRevenueAgg
  ] = await Promise.all([
    Restaurant.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'driver' }),
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: today } }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' }, commission: { $sum: '$platformFee' } } }
    ]),
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ])
  ]);

  res.success(response, {
    data: {
      totalRestaurants,
      totalCustomers,
      totalDrivers,
      totalOrders,
      todayOrders,
      totalRevenue: revenueAgg[0]?.total || 0,
      totalCommission: revenueAgg[0]?.commission || 0,
      todayRevenue: todayRevenueAgg[0]?.total || 0
    }
  });
});

export const getUsers = asyncHandler(async (req, response) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 50);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select('-password -salt -passwordAlgorithm').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter)
  ]);

  res.success(response, { data: users, pagination: res.buildPagination(page, limit, total) });
});

export const updateUserRole = asyncHandler(async (req, response) => {
  const { role } = req.body;
  if (!['customer', 'merchant', 'driver', 'admin'].includes(role)) {
    throw new AppError('Invalid role', 400);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  ).select('-password -salt');

  if (!user) throw new AppError('User not found', 404);
  res.success(response, { data: user, message: `Role updated to ${role}` });
});

export const toggleUserActive = asyncHandler(async (req, response) => {
  const user = await User.findById(req.params.id).select('-password -salt');
  if (!user) throw new AppError('User not found', 404);

  user.isActive = !user.isActive;
  await user.save();

  res.success(response, {
    data: user,
    message: `User ${user.isActive ? 'activated' : 'deactivated'}`
  });
});

export const getAllRestaurants = asyncHandler(async (req, response) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 50);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [restaurants, total] = await Promise.all([
    Restaurant.find(filter).populate('ownerId', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Restaurant.countDocuments(filter)
  ]);

  res.success(response, { data: restaurants, pagination: res.buildPagination(page, limit, total) });
});

export const getRevenueAnalytics = asyncHandler(async (req, response) => {
  const days = parseInt(req.query.days) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const data = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate }, paymentStatus: 'paid' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
        avgOrderValue: { $avg: '$total' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.success(response, { data });
});

export const getOrderAnalytics = asyncHandler(async (req, response) => {
  const days = parseInt(req.query.days) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [statusBreakdown, hourlyDistribution, topRestaurants] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$restaurantId', name: { $first: '$restaurantName' }, orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ])
  ]);

  res.success(response, {
    data: { statusBreakdown, hourlyDistribution, topRestaurants }
  });
});

export const getFinanceSummary = asyncHandler(async (req, response) => {
  const days = parseInt(req.query.days) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [summaryAgg, refundAgg, pendingSettlements, paidSettlements] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, paymentStatus: { $in: ['paid', 'partially_refunded', 'refunded'] } } },
      {
        $group: {
          _id: null,
          grossSales: { $sum: '$subtotal' },
          taxes: { $sum: '$tax' },
          deliveryFees: { $sum: '$deliveryFee' },
          platformFees: { $sum: '$platformFee' },
          serviceFees: { $sum: '$serviceFee' },
          tips: { $sum: '$tip' },
          discounts: { $sum: '$discount' },
          totalCollected: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      }
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, refundAmount: { $gt: 0 } } },
      { $group: { _id: null, refunds: { $sum: '$refundAmount' } } }
    ]),
    Settlement.aggregate([
      { $match: { status: { $in: ['pending', 'processing'] } } },
      { $group: { _id: null, amount: { $sum: '$netPayable' }, count: { $sum: 1 } } }
    ]),
    Settlement.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: startDate } } },
      { $group: { _id: null, amount: { $sum: '$netPayable' }, count: { $sum: 1 } } }
    ])
  ]);

  const summary = summaryAgg[0] || {};
  res.success(response, {
    data: {
      days,
      orders: summary.orders || 0,
      grossSales: roundMoney(summary.grossSales || 0),
      taxes: roundMoney(summary.taxes || 0),
      deliveryFees: roundMoney(summary.deliveryFees || 0),
      platformFees: roundMoney(summary.platformFees || 0),
      serviceFees: roundMoney(summary.serviceFees || 0),
      tips: roundMoney(summary.tips || 0),
      discounts: roundMoney(summary.discounts || 0),
      totalCollected: roundMoney(summary.totalCollected || 0),
      refunds: roundMoney(refundAgg[0]?.refunds || 0),
      pendingPayouts: roundMoney(pendingSettlements[0]?.amount || 0),
      pendingSettlementCount: pendingSettlements[0]?.count || 0,
      paidPayouts: roundMoney(paidSettlements[0]?.amount || 0),
      paidSettlementCount: paidSettlements[0]?.count || 0
    }
  });
});

export const listSettlements = asyncHandler(async (req, response) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 50);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.restaurantId) filter.restaurantId = req.query.restaurantId;
  if (req.query.status) filter.status = req.query.status;

  const [settlements, total] = await Promise.all([
    Settlement.find(filter)
      .populate('restaurantId', 'name email phone stripeAccountId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Settlement.countDocuments(filter)
  ]);

  res.success(response, { data: settlements, pagination: res.buildPagination(page, limit, total) });
});

export const generateSettlement = asyncHandler(async (req, response) => {
  const { restaurantId, periodStart, periodEnd, notes } = req.body;
  if (!restaurantId || !periodStart || !periodEnd) {
    throw new AppError('restaurantId, periodStart, and periodEnd are required', 400);
  }

  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    throw new AppError('Invalid settlement period', 400);
  }

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) throw new AppError('Restaurant not found', 404);

  const existing = await Settlement.findOne({
    restaurantId,
    periodStart: start,
    periodEnd: end,
    status: { $in: ['pending', 'processing', 'paid'] }
  });
  if (existing) throw new AppError('Settlement already exists for this exact period', 409);

  const orders = await Order.find({
    restaurantId,
    createdAt: { $gte: start, $lt: end },
    paymentStatus: { $in: ['paid', 'partially_refunded', 'refunded'] }
  }).lean();

  const totals = orders.reduce((acc, order) => {
    const commission = roundMoney((order.subtotal || 0) * (restaurant.commissionRate || 0));
    acc.totalOrders += 1;
    acc.grossSales += order.subtotal || 0;
    acc.commission += commission;
    acc.platformFees += order.platformFee || 0;
    acc.taxes += order.tax || 0;
    acc.refunds += order.refundAmount || 0;
    acc.tips += order.tip || 0;
    acc.netPayable += (order.subtotal || 0) + (order.tip || 0) - commission - (order.refundAmount || 0);
    acc.orderIds.push(order._id);
    return acc;
  }, {
    totalOrders: 0,
    grossSales: 0,
    commission: 0,
    platformFees: 0,
    taxes: 0,
    refunds: 0,
    tips: 0,
    netPayable: 0,
    orderIds: []
  });

  const settlement = await Settlement.create({
    restaurantId,
    periodStart: start,
    periodEnd: end,
    totalOrders: totals.totalOrders,
    grossSales: roundMoney(totals.grossSales),
    commission: roundMoney(totals.commission),
    platformFees: roundMoney(totals.platformFees),
    taxes: roundMoney(totals.taxes),
    refunds: roundMoney(totals.refunds),
    netPayable: roundMoney(Math.max(0, totals.netPayable)),
    orderIds: totals.orderIds,
    notes: notes || ''
  });

  res.created(response, { data: settlement, message: 'Settlement generated' });
});

export const markSettlementPaid = asyncHandler(async (req, response) => {
  const { transactionReference, stripeTransferId } = req.body;
  const settlement = await Settlement.findById(req.params.id);
  if (!settlement) throw new AppError('Settlement not found', 404);
  if (settlement.status === 'paid') throw new AppError('Settlement is already paid', 400);

  settlement.status = 'paid';
  settlement.paidAt = new Date();
  settlement.transactionReference = transactionReference || settlement.transactionReference;
  settlement.stripeTransferId = stripeTransferId || settlement.stripeTransferId;
  await settlement.save();

  res.success(response, { data: settlement, message: 'Settlement marked paid' });
});
