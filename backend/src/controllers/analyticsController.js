import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import CateringInquiry from '../models/CateringInquiry.js';
import Reservation from '../models/Reservation.js';
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
  const { days, startDate: queryStart, endDate: queryEnd } = req.query;

  if (req.user.role === 'merchant') {
    await verifyRestaurantOwnership(restaurantId, req.user);
  }

  const Restaurant = req.getModel('Restaurant');
  const restaurant = await Restaurant.findById(restaurantId).select('timezone');
  const rawTz = restaurant?.timezone || '';
  let tz = 'America/New_York';
  if (rawTz.includes('Eastern Time')) tz = 'America/New_York';
  else if (rawTz.includes('Pacific Time')) tz = 'America/Los_Angeles';
  else if (rawTz.includes('Indian Standard Time')) tz = 'Asia/Kolkata';
  else if (rawTz) {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: rawTz });
      tz = rawTz; // Valid IANA timezone
    } catch (e) {
      tz = 'America/New_York'; // Fallback
    }
  }

  const getTzMidnightUTC = (timezone, daysAgo = 0) => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone, year: 'numeric', month: 'numeric', day: 'numeric'
    }).formatToParts(now);
    
    const y = parts.find(p => p.type === 'year').value;
    const m = parts.find(p => p.type === 'month').value;
    const d = parts.find(p => p.type === 'day').value;
    
    const baseUtc = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    
    const utcStr = baseUtc.toLocaleString('en-US', { timeZone: 'UTC' });
    const tzStr = baseUtc.toLocaleString('en-US', { timeZone: timezone });
    const offsetMs = new Date(utcStr).getTime() - new Date(tzStr).getTime();
    
    const tzMidnight = new Date(baseUtc.getTime() + offsetMs);
    tzMidnight.setDate(tzMidnight.getDate() - daysAgo);
    
    return tzMidnight;
  };

  let endOfToday = new Date();
  const getTzDateBoundaryUTC = (dateStr, timezone, isEnd = false) => {
    const parts = dateStr.split('-');
    const y = parseInt(parts[0]);
    const m = parseInt(parts[1]);
    const d = parseInt(parts[2].split('T')[0]); 
    const baseUtc = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    const utcStr = baseUtc.toLocaleString('en-US', { timeZone: 'UTC' });
    const tzStr = baseUtc.toLocaleString('en-US', { timeZone: timezone });
    const offsetMs = new Date(utcStr).getTime() - new Date(tzStr).getTime();
    const boundary = new Date(baseUtc.getTime() + offsetMs);
    if (isEnd) return new Date(boundary.getTime() + 24 * 60 * 60 * 1000 - 1);
    return boundary;
  };

  let startDate;
  let numDays = null;
  
  if (queryStart && queryEnd) {
    startDate = getTzDateBoundaryUTC(queryStart, tz, false);
    endOfToday = getTzDateBoundaryUTC(queryEnd, tz, true);
  } else if (days === 'yesterday') {
    startDate = getTzMidnightUTC(tz, 1);
    endOfToday = new Date(getTzMidnightUTC(tz, 0).getTime() - 1);
  } else if (days && !isNaN(parseInt(days))) {
    numDays = parseInt(days);
    if (numDays === 1) {
      startDate = getTzMidnightUTC(tz, 0);
    } else {
      startDate = getTzMidnightUTC(tz, numDays);
    }
  } else {
    // all-time default
    const firstOrder = await Order.findOne({ restaurantId: new mongoose.Types.ObjectId(restaurantId) }).sort({ createdAt: 1 }).select('createdAt');
    startDate = firstOrder ? new Date(firstOrder.createdAt) : getTzMidnightUTC(tz, 0);
  }

  const diffTime = Math.abs(endOfToday - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - diffDays);

  // helper match conditions
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
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: tz } }, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  // fill in missing days based on target timezone
  const filledStats = [];
  const curr = new Date(startDate);
  while (curr <= endOfToday) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(curr);
    const y = parts.find(p => p.type === 'year').value;
    const m = parts.find(p => p.type === 'month').value.padStart(2, '0');
    const d = parts.find(p => p.type === 'day').value.padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    
    // Make sure we only add unique dates (curr increments by 24h, timezone rules might cause dupes if we aren't careful, but fine for now)
    if (!filledStats.some(s => s.date === dateStr)) {
      const stat = dailyStats.find(s => s._id === dateStr);
      filledStats.push({ date: dateStr, revenue: stat ? stat.revenue : 0, orders: stat ? stat.orders : 0 });
    }
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
          dayOfWeek: { $dayOfWeek: { date: "$createdAt", timezone: tz } }, 
          hour: { $hour: { date: "$createdAt", timezone: tz } } 
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

  const prevCateringCount = await CateringInquiry.countDocuments({
    restaurantId: new mongoose.Types.ObjectId(restaurantId),
    createdAt: { $gte: prevStartDate, $lt: startDate }
  });

  const prevReservationsCount = await Reservation.countDocuments({
    restaurantId: new mongoose.Types.ObjectId(restaurantId),
    createdAt: { $gte: prevStartDate, $lt: startDate }
  });

  // aggregate current summary
  const totalRevenue = filledStats.reduce((sum, day) => sum + day.revenue, 0);
  const totalOrders = filledStats.reduce((sum, day) => sum + day.orders, 0);
  const currentAov = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

  const cateringCount = await CateringInquiry.countDocuments({
    restaurantId: new mongoose.Types.ObjectId(restaurantId),
    createdAt: { $gte: startDate, $lt: endOfToday }
  });

  const reservationsCount = await Reservation.countDocuments({
    restaurantId: new mongoose.Types.ObjectId(restaurantId),
    createdAt: { $gte: startDate, $lt: endOfToday }
  });

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
        totalDiscounts,
        cateringCount,
        prevCateringCount,
        reservationsCount,
        prevReservationsCount
      },
      dailyStats: filledStats,
      salesByChannel,
      paymentMethodBreakdown,
      timeOfDayHeatmap,
      topItems
    }
  });
});

