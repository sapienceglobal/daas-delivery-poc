import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import CateringInquiry from '../models/CateringInquiry.js';
import Reservation from '../models/Reservation.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import * as res from '../utils/responseFormatter.js';
import { getOrCompute } from '../utils/responseCache.js';
import mongoose from 'mongoose';

// Analytics results are cached briefly and de-duplicated across devices.
// Any order write invalidates the restaurant's cache (see models/Order.js),
// so numbers are still instant-fresh after a new order / status change.
const ANALYTICS_CACHE_TTL_MS = Number(process.env.ANALYTICS_CACHE_TTL_MS || 30000);

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

  const cacheKey = `analytics:${req.tenantDb?.name || 'default'}:${restaurantId}:${days || ''}:${queryStart || ''}:${queryEnd || ''}`;
  const data = await getOrCompute(cacheKey, restaurantId, ANALYTICS_CACHE_TTL_MS, () =>
    computeSalesAnalytics(req, restaurantId, days, queryStart, queryEnd)
  );

  res.success(response, { data });
});

const computeSalesAnalytics = async (req, restaurantId, days, queryStart, queryEnd) => {
  const Restaurant = req.getModel('Restaurant');
  const restaurant = await Restaurant.findById(restaurantId).select('timezone').lean();
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
  
  if (queryStart) {
    startDate = getTzDateBoundaryUTC(queryStart, tz, false);
    endOfToday = getTzDateBoundaryUTC(queryEnd || queryStart, tz, true);
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
    const firstOrder = await Order.findOne({ restaurantId: new mongoose.Types.ObjectId(restaurantId) }).sort({ createdAt: 1 }).select('createdAt').lean();
    startDate = firstOrder ? new Date(firstOrder.createdAt) : getTzMidnightUTC(tz, 0);
  }

  const diffTime = Math.abs(endOfToday - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - diffDays);

  const restaurantObjectId = new mongoose.Types.ObjectId(restaurantId);

  const currentMatch = {
    restaurantId: restaurantObjectId,
    createdAt: { $gte: startDate, $lt: endOfToday },
    $or: [
      { paymentStatus: { $in: ['paid', 'partially_refunded'] } },
      { status: { $in: ['delivered', 'picked_up', 'completed'] } }
    ]
  };
  
  const prevMatch = {
    restaurantId: restaurantObjectId,
    createdAt: { $gte: prevStartDate, $lt: startDate },
    $or: [
      { paymentStatus: { $in: ['paid', 'partially_refunded'] } },
      { status: { $in: ['delivered', 'picked_up', 'completed'] } }
    ]
  };

  const netRevenue = { $sum: { $subtract: ["$total", { $ifNull: ["$refundAmount", 0] }] } };

  // All independent queries run in PARALLEL (previously 11 sequential round-trips).
  // Current-period breakdowns share ONE collection scan via $facet.
  const [currentFacet, prevStats, prevCustomerStats, prevCateringCount, prevReservationsCount, cateringCount, reservationsCount] = await Promise.all([
    Order.aggregate([
      { $match: currentMatch },
      {
        $facet: {
          // 1. Daily Stats
          dailyStats: [
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: tz } }, revenue: netRevenue, orders: { $sum: 1 } } },
            { $sort: { _id: 1 } }
          ],
          // 2. Sales by Channel
          salesByChannel: [
            { $group: { _id: "$orderType", count: { $sum: 1 }, revenue: netRevenue } }
          ],
          // 3. Payment Method Breakdown
          paymentMethodBreakdown: [
            { $group: { _id: "$paymentMethod", count: { $sum: 1 }, revenue: netRevenue } }
          ],
          // 4. Orders by Time of Day (Heatmap)
          timeOfDayHeatmap: [
            {
              $group: {
                _id: {
                  dayOfWeek: { $dayOfWeek: { date: "$createdAt", timezone: tz } },
                  hour: { $hour: { date: "$createdAt", timezone: tz } }
                },
                orders: { $sum: 1 },
                revenue: netRevenue
              }
            }
          ],
          // 5. Top Items
          topItems: [
            { $unwind: "$items" },
            { $group: { _id: "$items.name", quantitySold: { $sum: "$items.quantity" }, revenueGenerated: { $sum: "$items.lineTotal" } } },
            { $sort: { quantitySold: -1 } },
            { $limit: 10 }
          ],
          // 6. Customers
          customerStats: [
            { $match: { userId: { $ne: null } } },
            { $group: { _id: "$userId" } },
            { $count: "count" }
          ],
          // Total Discounts
          totalDiscounts: [
            { $group: { _id: null, totalDiscounts: { $sum: "$discount" } } }
          ]
        }
      }
    ]),
    // --- PREVIOUS PERIOD DATA ---
    Order.aggregate([
      { $match: prevMatch },
      { $group: { _id: null, revenue: netRevenue, orders: { $sum: 1 } } }
    ]),
    Order.aggregate([
      { $match: { ...prevMatch, userId: { $ne: null } } },
      { $group: { _id: "$userId" } },
      { $count: "count" }
    ]),
    CateringInquiry.countDocuments({ restaurantId: restaurantObjectId, createdAt: { $gte: prevStartDate, $lt: startDate } }),
    Reservation.countDocuments({ restaurantId: restaurantObjectId, createdAt: { $gte: prevStartDate, $lt: startDate } }),
    CateringInquiry.countDocuments({ restaurantId: restaurantObjectId, createdAt: { $gte: startDate, $lt: endOfToday } }),
    Reservation.countDocuments({ restaurantId: restaurantObjectId, createdAt: { $gte: startDate, $lt: endOfToday } })
  ]);

  const facet = currentFacet[0] || {};
  const dailyStats = facet.dailyStats || [];
  const salesByChannel = facet.salesByChannel || [];
  const paymentMethodBreakdown = facet.paymentMethodBreakdown || [];
  const timeOfDayHeatmap = facet.timeOfDayHeatmap || [];
  const topItems = facet.topItems || [];
  const newCustomers = facet.customerStats?.length > 0 ? facet.customerStats[0].count : 0;
  const totalDiscounts = facet.totalDiscounts?.length > 0 ? facet.totalDiscounts[0].totalDiscounts : 0;

  // fill in missing days based on target timezone
  const statsByDate = new Map(dailyStats.map(s => [s._id, s]));
  const seenDates = new Set();
  const filledStats = [];
  const dateFormatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric' });
  const curr = new Date(startDate);
  while (curr <= endOfToday) {
    const parts = dateFormatter.formatToParts(curr);
    const y = parts.find(p => p.type === 'year').value;
    const m = parts.find(p => p.type === 'month').value.padStart(2, '0');
    const d = parts.find(p => p.type === 'day').value.padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    
    if (!seenDates.has(dateStr)) {
      seenDates.add(dateStr);
      const stat = statsByDate.get(dateStr);
      filledStats.push({ date: dateStr, revenue: stat ? stat.revenue : 0, orders: stat ? stat.orders : 0 });
    }
    curr.setDate(curr.getDate() + 1);
  }

  const prevRevenue = prevStats.length > 0 ? prevStats[0].revenue : 0;
  const prevOrders = prevStats.length > 0 ? prevStats[0].orders : 0;
  const prevAov = prevOrders > 0 ? (prevRevenue / prevOrders) : 0;
  const prevCustomers = prevCustomerStats.length > 0 ? prevCustomerStats[0].count : 0;

  // aggregate current summary
  const totalRevenue = filledStats.reduce((sum, day) => sum + day.revenue, 0);
  const totalOrders = filledStats.reduce((sum, day) => sum + day.orders, 0);
  const currentAov = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

  return {
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
  };
};
