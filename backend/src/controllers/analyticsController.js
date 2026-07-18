import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import * as res from '../utils/responseFormatter.js';
import mongoose from 'mongoose';

const verifyRestaurantOwnership = async (restaurantId, userId) => {
  const owns = await Restaurant.exists({ _id: restaurantId, ownerId: userId });
  if (!owns) throw new AppError('Not authorized for this restaurant', 403);
};

export const getSalesAnalytics = asyncHandler(async (req, response) => {
  const { restaurantId } = req.params;
  const { days = 30 } = req.query;

  if (req.user.role === 'merchant') {
    await verifyRestaurantOwnership(restaurantId, req.user._id);
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  // Get daily revenue and order counts
  const dailyStats = await Order.aggregate([
    {
      $match: {
        restaurantId: new mongoose.Types.ObjectId(restaurantId),
        createdAt: { $gte: startDate },
        status: { $in: ['delivered', 'picked_up', 'completed'] }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$total" },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Fill in missing days
  const filledStats = [];
  const curr = new Date(startDate);
  const end = new Date();
  
  while (curr <= end) {
    const dateStr = curr.toISOString().split('T')[0];
    const stat = dailyStats.find(s => s._id === dateStr);
    filledStats.push({
      date: dateStr,
      revenue: stat ? stat.revenue : 0,
      orders: stat ? stat.orders : 0
    });
    curr.setDate(curr.getDate() + 1);
  }

  // Get Top Items
  const topItems = await Order.aggregate([
    {
      $match: {
        restaurantId: new mongoose.Types.ObjectId(restaurantId),
        createdAt: { $gte: startDate },
        status: { $in: ['delivered', 'picked_up', 'completed'] }
      }
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.name",
        quantitySold: { $sum: "$items.quantity" },
        revenueGenerated: { $sum: "$items.lineTotal" }
      }
    },
    { $sort: { quantitySold: -1 } },
    { $limit: 10 }
  ]);

  const totalRevenue = filledStats.reduce((sum, day) => sum + day.revenue, 0);
  const totalOrders = filledStats.reduce((sum, day) => sum + day.orders, 0);

  res.success(response, {
    summary: {
      totalRevenue,
      totalOrders,
      aov: totalOrders > 0 ? (totalRevenue / totalOrders) : 0
    },
    dailyStats: filledStats,
    topItems
  });
});
