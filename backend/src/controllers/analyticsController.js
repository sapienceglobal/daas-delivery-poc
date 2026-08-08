import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import * as res from '../utils/responseFormatter.js';
import mongoose from 'mongoose';

const verifyRestaurantOwnership = async (restaurantId, user) => {
  if (user.restaurantId && user.restaurantId.toString() === restaurantId.toString()) return;
  const owns = await Restaurant.exists({ _id: restaurantId, ownerId: user._id });
  if (!owns) throw new AppError('Not authorized for this restaurant', 403);
};

export const getSalesAnalytics = asyncHandler(async (req, response) => {
  const { restaurantId } = req.params;
  const { days = 30 } = req.query;
  const numDays = parseInt(days);

  if (req.user.role === 'merchant') {
    await verifyRestaurantOwnership(restaurantId, req.user);
  }

  const endOfToday = new Date();
  
  const startDate = new Date(endOfToday);
  startDate.setDate(startDate.getDate() - numDays);

  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - numDays);

  // Helper match conditions
  const currentMatch = {
    restaurantId: new mongoose.Types.ObjectId(restaurantId),
    createdAt: { $gte: startDate, $lt: endOfToday },
    status: { $in: ['delivered', 'picked_up', 'completed'] }
  };
  
  const prevMatch = {
    restaurantId: new mongoose.Types.ObjectId(restaurantId),
    createdAt: { $gte: prevStartDate, $lt: startDate },
    status: { $in: ['delivered', 'picked_up', 'completed'] }
  };

  // --- CURRENT PERIOD DATA ---
  
  // 1. Daily Stats
  const dailyStats = await Order.aggregate([
    { $match: currentMatch },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  // Fill in missing days
  const filledStats = [];
  const curr = new Date(startDate);
  while (curr <= endOfToday) {
    const dateStr = curr.toISOString().split('T')[0];
    const stat = dailyStats.find(s => s._id === dateStr);
    filledStats.push({ date: dateStr, revenue: stat ? stat.revenue : 0, orders: stat ? stat.orders : 0 });
    curr.setDate(curr.getDate() + 1);
  }

  // 2. Sales by Channel
  const salesByChannel = await Order.aggregate([
    { $match: currentMatch },
    { $group: { _id: "$orderType", count: { $sum: 1 }, revenue: { $sum: "$total" } } }
  ]);

  // 3. Payment Method Breakdown
  const paymentMethodBreakdown = await Order.aggregate([
    { $match: currentMatch },
    { $group: { _id: "$paymentMethod", count: { $sum: 1 }, revenue: { $sum: "$total" } } }
  ]);

  // 4. Orders by Time of Day (Heatmap)
  const timeOfDayHeatmap = await Order.aggregate([
    { $match: currentMatch },
    { 
      $group: { 
        _id: { 
          dayOfWeek: { $dayOfWeek: "$createdAt" }, 
          hour: { $hour: "$createdAt" } 
        }, 
        orders: { $sum: 1 } 
      } 
    }
  ]);

  // 5. Top Items
  const topItems = await Order.aggregate([
    { $match: currentMatch },
    { $unwind: "$items" },
    { $group: { _id: "$items.name", quantitySold: { $sum: "$items.quantity" }, revenueGenerated: { $sum: "$items.lineTotal" } } },
    { $sort: { quantitySold: -1 } },
    { $limit: 10 }
  ]);

  // 6. Customers & Total Discounts
  const customerStats = await Order.aggregate([
    { $match: { ...currentMatch, userId: { $ne: null } } },
    { $group: { _id: "$userId" } },
    { $count: "count" }
  ]);
  const newCustomers = customerStats.length > 0 ? customerStats[0].count : 0;

  const totalDiscountsAgg = await Order.aggregate([
    { $match: currentMatch },
    { $group: { _id: null, totalDiscounts: { $sum: "$discount" } } }
  ]);
  const totalDiscounts = totalDiscountsAgg.length > 0 ? totalDiscountsAgg[0].totalDiscounts : 0;

  // --- PREVIOUS PERIOD DATA ---
  
  const prevStats = await Order.aggregate([
    { $match: prevMatch },
    { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 } } }
  ]);
  const prevRevenue = prevStats.length > 0 ? prevStats[0].revenue : 0;
  const prevOrders = prevStats.length > 0 ? prevStats[0].orders : 0;
  const prevAov = prevOrders > 0 ? (prevRevenue / prevOrders) : 0;

  const prevCustomerStats = await Order.aggregate([
    { $match: { ...prevMatch, userId: { $ne: null } } },
    { $group: { _id: "$userId" } },
    { $count: "count" }
  ]);
  const prevCustomers = prevCustomerStats.length > 0 ? prevCustomerStats[0].count : 0;

  // Aggregate current summary
  const totalRevenue = filledStats.reduce((sum, day) => sum + day.revenue, 0);
  const totalOrders = filledStats.reduce((sum, day) => sum + day.orders, 0);
  const currentAov = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

  res.success(response, {
    data: {
      summary: {
        totalRevenue,
        prevRevenue,
        totalOrders,
        prevOrders,
        aov: currentAov,
        prevAov,
        newCustomers,
        prevCustomers,
        totalDiscounts
      },
      dailyStats: filledStats,
      salesByChannel,
      paymentMethodBreakdown,
      timeOfDayHeatmap,
      topItems
    }
  });
});
