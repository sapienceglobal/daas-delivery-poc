import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import * as res from '../utils/responseFormatter.js';
import mongoose from 'mongoose';

const verifyRestaurantOwnership = async (restaurantId, userId) => {
  const owns = await Restaurant.exists({ _id: restaurantId, ownerId: userId });
  if (!owns) throw new AppError('Not authorized for this restaurant', 403);
};

export const getCustomers = asyncHandler(async (req, response) => {
  const { restaurantId } = req.params;

  if (req.user.role === 'merchant') {
    await verifyRestaurantOwnership(restaurantId, req.user._id);
  }

  // Aggregate orders by userId or customerPhone (for walk-ins / no account)
  const customers = await Order.aggregate([
    {
      $match: {
        restaurantId: new mongoose.Types.ObjectId(restaurantId),
        status: { $in: ['delivered', 'picked_up', 'completed'] }
      }
    },
    {
      $group: {
        _id: {
          $cond: [{ $ifNull: ["$userId", false] }, "$userId", "$customerPhone"]
        },
        userId: { $first: "$userId" },
        name: { $first: "$customerName" },
        phone: { $first: "$customerPhone" },
        totalSpend: { $sum: "$total" },
        totalOrders: { $sum: 1 },
        lastOrderDate: { $max: "$createdAt" }
      }
    },
    {
      $project: {
        _id: 0,
        id: "$_id",
        userId: 1,
        name: 1,
        phone: 1,
        totalSpend: 1,
        totalOrders: 1,
        lastOrderDate: 1,
        segment: {
          $switch: {
            branches: [
              { case: { $gte: ["$totalSpend", 500] }, then: "VIP" },
              { case: { $gte: ["$totalOrders", 5] }, then: "Regular" },
            ],
            default: "New"
          }
        }
      }
    },
    { $sort: { totalSpend: -1 } }
  ]);

  res.success(response, customers);
});

export const sendPromo = asyncHandler(async (req, response) => {
  const { restaurantId } = req.params;
  const { userIds, message, title } = req.body; // userIds is array of valid ObjectIds

  if (req.user.role === 'merchant') {
    await verifyRestaurantOwnership(restaurantId, req.user._id);
  }

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new AppError('No users selected to send promo to', 400);
  }

  // Create notifications
  const notifications = userIds.map(uid => ({
    userId: uid,
    title: title || 'Special Offer from Restaurant',
    message,
    type: 'promo',
    isRead: false
  }));

  await Notification.insertMany(notifications);

  res.success(response, { message: `Promotion sent to ${userIds.length} customers` });
});
