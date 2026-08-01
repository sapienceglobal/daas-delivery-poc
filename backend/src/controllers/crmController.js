import Customer from '../models/Customer.js';
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

  const customers = await Customer.find({ restaurantId }).sort({ createdAt: -1 });
  res.success(response, customers);
});

export const createCustomer = asyncHandler(async (req, response) => {
  const { restaurantId } = req.params;
  
  if (req.user.role === 'merchant') {
    await verifyRestaurantOwnership(restaurantId, req.user._id);
  }

  // Generate unique customerId like #CUST1001
  const count = await Customer.countDocuments({ restaurantId });
  const customerId = `#CUST${1000 + count + 1}`;

  const customer = await Customer.create({
    ...req.body,
    restaurantId,
    customerId
  });

  res.success(response, customer, 201);
});

export const updateCustomer = asyncHandler(async (req, response) => {
  const { restaurantId, customerId } = req.params;
  
  if (req.user.role === 'merchant') {
    await verifyRestaurantOwnership(restaurantId, req.user._id);
  }

  const customer = await Customer.findOneAndUpdate(
    { _id: customerId, restaurantId },
    req.body,
    { new: true, runValidators: true }
  );

  if (!customer) throw new AppError('Customer not found', 404);

  res.success(response, customer);
});

export const deleteCustomer = asyncHandler(async (req, response) => {
  const { restaurantId, customerId } = req.params;
  
  if (req.user.role === 'merchant') {
    await verifyRestaurantOwnership(restaurantId, req.user._id);
  }

  const customer = await Customer.findOneAndDelete({ _id: customerId, restaurantId });
  if (!customer) throw new AppError('Customer not found', 404);

  res.success(response, null, 204);
});

export const sendPromo = asyncHandler(async (req, response) => {
  const { restaurantId } = req.params;
  const { userIds, message, title } = req.body;

  if (req.user.role === 'merchant') {
    await verifyRestaurantOwnership(restaurantId, req.user._id);
  }

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new AppError('No users selected to send promo to', 400);
  }

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
