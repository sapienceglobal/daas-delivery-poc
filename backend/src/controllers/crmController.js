import Customer from '../models/Customer.js';
import Restaurant from '../models/Restaurant.js';
import Notification from '../models/Notification.js';
import Order from '../models/Order.js';
import LoyaltyTransaction from '../models/LoyaltyTransaction.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import * as res from '../utils/responseFormatter.js';
import mongoose from 'mongoose';

const ensureCanManageRestaurant = (user, restaurantId) => {
  if (user.role === 'admin') return true;
  if (user.restaurantId?.toString() !== restaurantId?.toString()) {
    throw new AppError('Not authorized for this restaurant', 403);
  }
};

export const getCustomers = asyncHandler(async (req, response) => {
  const { restaurantId } = req.params;
  console.log(`[CRM] getCustomers called with params.restaurantId: ${restaurantId}`);

  // Resolve slug/name to ObjectId if needed
  const isObjectId = /^[a-fA-F0-9]{24}$/.test(restaurantId);
  let actualRestaurantId = restaurantId;
  
  const RestaurantModel = req.getModel?.('Restaurant') || Restaurant;
  const OrderModel = req.getModel?.('Order') || Order;
  const CustomerModel = req.getModel?.('Customer') || Customer;
  const UserModel = req.getModel?.('User') || User;

  if (!isObjectId) {
    const restaurant = await RestaurantModel.findOne({ 
      $or: [
        { slug: new RegExp(`^${restaurantId}`, 'i') }, 
        { name: new RegExp(`^${restaurantId}$`, 'i') }
      ] 
    });
    console.log(`[CRM] Regex search for ${restaurantId} returned:`, restaurant ? restaurant._id : 'null');
    if (!restaurant) throw new AppError('Restaurant not found', 404);
    actualRestaurantId = restaurant._id.toString();
  }
  
  console.log(`[CRM] final actualRestaurantId: ${actualRestaurantId}`);

  if (req.user.role === 'merchant') {
    ensureCanManageRestaurant(req.user, actualRestaurantId);
  }

  // 1. Aggregate stats from ALL Orders for this restaurant
  const orderStats = await OrderModel.aggregate([
    { $match: { restaurantId: new mongoose.Types.ObjectId(actualRestaurantId) } },
    {
      $group: {
        _id: {
          email: { $toLower: { $ifNull: ["$customerEmail", ""] } },
          phone: { $ifNull: ["$customerPhone", ""] }
        },
        name: { $last: "$customerName" }, // taking the most recent name
        userId: { $last: "$userId" },
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$total' },
        lastOrderDate: { $max: '$createdAt' },
        firstOrderDate: { $min: '$createdAt' }
      }
    },
    { $sort: { lastOrderDate: -1 } }
  ]);

  // Then, retrieve explicit Customer profiles created by Merchant
  const manualCustomers = await CustomerModel.find({ restaurantId: actualRestaurantId, isDeleted: { $ne: true } }).lean();
  
  // 3. Fetch all registered users to enrich data (if they match email)
  const users = await UserModel.find({ role: 'customer' }).lean();
  const usersByEmail = {};
  users.forEach(u => {
    if (u.email) usersByEmail[u.email.toLowerCase()] = u;
  });

  const uniqueCustomersMap = new Map();

  // Helper to add/merge customer into the map
  const addCustomerToMap = (identifier, data) => {
    if (!identifier) return;
    if (uniqueCustomersMap.has(identifier)) {
      const existing = uniqueCustomersMap.get(identifier);
      uniqueCustomersMap.set(identifier, { ...existing, ...data });
    } else {
      uniqueCustomersMap.set(identifier, data);
    }
  };

  // Add Manual Customers first
  manualCustomers.forEach(c => {
    const identifier = (c.email || c.phone || c._id.toString()).toLowerCase();
    addCustomerToMap(identifier, {
      ...c,
      _id: c._id.toString(),
      source: 'manual',
    });
  });

  // Merge Order Stats
  orderStats.forEach(stat => {
    const email = stat._id.email;
    const phone = stat._id.phone;
    const identifier = email || phone;
    
    if (!identifier) return;

    let user = null;
    if (email && usersByEmail[email]) {
      user = usersByEmail[email];
    } else if (stat.userId) {
      user = users.find(u => u._id.toString() === stat.userId.toString());
    }

    const existing = uniqueCustomersMap.get(identifier) || {};

    addCustomerToMap(identifier, {
      _id: existing._id || (user ? user._id.toString() : identifier), // fallback to identifier if no real _id
      customerId: existing.customerId || (user ? `#CUST-${user._id.toString().slice(-6).toUpperCase()}` : `#CUST-${identifier.slice(-6).toUpperCase()}`),
      name: existing.name || stat.name || (user ? user.name : 'Guest'),
      email: existing.email || email || (user ? user.email : ''),
      phone: existing.phone || phone || (user ? user.phone : ''),
      group: existing.group || (user ? 'App User' : 'Guest'),
      loyaltyTier: existing.loyaltyTier || 'Bronze',
      totalOrders: Math.max(existing.totalOrders || 0, stat.totalOrders || 0),
      totalSpent: Math.max(existing.totalSpent || 0, stat.totalSpent || 0),
      lastOrderDate: stat.lastOrderDate || existing.lastOrderDate || null,
      status: existing.status || 'Active',
      createdAt: existing.createdAt || (user ? user.createdAt : stat.firstOrderDate) || new Date(),
      loginPlatforms: user ? (user.loginPlatforms || []) : []
    });
  });

  // Finally, add any registered app users who haven't placed an order yet
  users.forEach(user => {
    const identifier = (user.email || user.phone || user._id.toString()).toLowerCase();
    if (!uniqueCustomersMap.has(identifier)) {
      addCustomerToMap(identifier, {
        _id: user._id.toString(),
        customerId: `#CUST-${user._id.toString().slice(-6).toUpperCase()}`,
        name: user.name || 'App User',
        email: user.email || '',
        phone: user.phone || '',
        group: 'App User',
        loyaltyTier: 'Bronze',
        totalOrders: 0,
        totalSpent: 0,
        lastOrderDate: null,
        status: user.isActive ? 'Active' : 'Inactive',
        loginPlatforms: user.loginPlatforms || []
      });
    }
  });

  const uniqueCustomers = Array.from(uniqueCustomersMap.values());
  res.success(response, { data: uniqueCustomers });
});

export const getCustomerProfile = asyncHandler(async (req, response) => {
  const { restaurantId, customerId } = req.params;

  // Resolve slug/name to ObjectId if needed
  const isObjectIdRest = /^[a-fA-F0-9]{24}$/.test(restaurantId);
  let actualRestaurantId = restaurantId;
  
  const RestaurantModel = req.getModel?.('Restaurant') || Restaurant;
  const OrderModel = req.getModel?.('Order') || Order;
  const CustomerModel = req.getModel?.('Customer') || Customer;
  const UserModel = req.getModel?.('User') || User;

  if (!isObjectIdRest) {
    const restaurant = await RestaurantModel.findOne({ 
      $or: [
        { slug: new RegExp(`^${restaurantId}`, 'i') }, 
        { name: new RegExp(`^${restaurantId}$`, 'i') }
      ] 
    });
    if (!restaurant) throw new AppError('Restaurant not found', 404);
    actualRestaurantId = restaurant._id.toString();
  }

  if (req.user.role === 'merchant') {
    ensureCanManageRestaurant(req.user, actualRestaurantId);
  }

  const isObjectId = mongoose.Types.ObjectId.isValid(customerId);
  let customer = null;
  let user = null;

  if (isObjectId) {
    customer = await CustomerModel.findOne({ _id: customerId, restaurantId: actualRestaurantId }).lean();
    user = await UserModel.findById(customerId).lean();
  }

  // If customer is neither in Customer nor User, they are a pure Guest.
  // We'll reconstruct a basic customer object from their email/phone which is passed as `customerId`.
  if (!customer && !user) {
    const isEmail = customerId.includes('@');
    customer = {
      _id: customerId,
      customerId: `#CUST-${customerId.slice(-6).toUpperCase()}`,
      name: 'Guest Customer',
      email: isEmail ? customerId : '',
      phone: !isEmail ? customerId : '',
      group: 'Guest',
      loyaltyTier: 'Bronze'
    };
  } else if (!customer && user) {
    customer = {
      _id: user._id,
      customerId: `#CUST-${user._id.toString().slice(-6).toUpperCase()}`,
      name: user.name,
      email: user.email,
      phone: user.phone,
      group: 'App User',
      loyaltyTier: 'Bronze' // Adjust if user model has tier logic
    };
  }

  // Find all orders for this customer by email, phone, or userId
  const orderQuery = { restaurantId: new mongoose.Types.ObjectId(actualRestaurantId) };
  const orConditions = [];
  
  if (user && user._id) orConditions.push({ userId: user._id });
  if (customer.email) orConditions.push({ customerEmail: { $regex: new RegExp(`^${customer.email}$`, 'i') } });
  if (customer.phone) orConditions.push({ customerPhone: customer.phone });
  
  if (orConditions.length > 0) {
    orderQuery.$or = orConditions;
  } else if (customer.name) {
    orderQuery.customerName = customer.name; // Fallback
  }

  const orders = await OrderModel.find(orderQuery).sort({ createdAt: -1 }).lean();

  const totalOrders = orders.length;
  let totalSpent = 0;
  let totalSavings = 0;
  let totalCouponsUsed = 0;
  
  const orderTypes = { delivery: 0, pickup: 0, dine_in: 0 };
  
  orders.forEach(order => {
    totalSpent += (order.total || 0);
    if (order.couponCode) totalCouponsUsed++;
    totalSavings += (order.discount || 0) + (order.loyaltyDiscount || 0);
    
    if (order.orderType) {
      orderTypes[order.orderType] = (orderTypes[order.orderType] || 0) + 1;
    }
  });

  const aov = totalOrders > 0 ? (totalSpent / totalOrders).toFixed(2) : 0;
  const lastOrderDate = totalOrders > 0 ? orders[0].createdAt : null;

  let preferredOrderType = 'delivery';
  if (Object.keys(orderTypes).length > 0) {
    preferredOrderType = Object.keys(orderTypes).reduce((a, b) => orderTypes[a] > orderTypes[b] ? a : b);
  }

  // Loyalty history
  let loyaltyHistory = [];
  let currentPoints = user ? (user.loyaltyPoints || 0) : 0;
  
  // Extract loyalty events from orders for history
  orders.forEach(order => {
    if (order.loyaltyPointsEarned > 0) {
      loyaltyHistory.push({
        description: `Earned from Order #${order.orderNumber || order._id.toString().slice(-6).toUpperCase()}`,
        points: order.loyaltyPointsEarned,
        createdAt: order.createdAt
      });
    }
    if (order.loyaltyPointsUsed > 0) {
      loyaltyHistory.push({
        description: `Redeemed on Order #${order.orderNumber || order._id.toString().slice(-6).toUpperCase()}`,
        points: -order.loyaltyPointsUsed,
        createdAt: order.createdAt
      });
    }
  });

  // Sort history newest first
  loyaltyHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const profileData = {
    customer,
    stats: {
      totalOrders,
      totalSpent,
      aov,
      lastOrderDate,
      preferredOrderType,
      totalSavings,
      totalCouponsUsed
    },
    orders: orders.slice(0, 15), // Send last 15 orders for history
    loyalty: {
      tier: customer.loyaltyTier || 'Bronze',
      points: currentPoints,
      history: loyaltyHistory
    }
  };

  res.success(response, { data: profileData });
});

export const createCustomer = asyncHandler(async (req, response) => {
  const { restaurantId } = req.params;

  if (req.user.role === 'merchant') {
    ensureCanManageRestaurant(req.user, restaurantId);
  }

  const CustomerModel = req.getModel?.('Customer') || Customer;

  // Generate unique customerId like #CUST1001
  const count = await CustomerModel.countDocuments({ restaurantId });
  const customerId = `#CUST${1000 + count + 1}`;

  const customer = await CustomerModel.create({
    ...req.body,
    restaurantId,
    customerId
  });

  res.success(response, customer, 201);
});

export const updateCustomer = asyncHandler(async (req, response) => {
  const { restaurantId, customerId } = req.params;

  if (req.user.role === 'merchant') {
    ensureCanManageRestaurant(req.user, restaurantId);
  }

  const CustomerModel = req.getModel?.('Customer') || Customer;
  
  const customer = await CustomerModel.findOneAndUpdate(
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
    ensureCanManageRestaurant(req.user, restaurantId);
  }

  const CustomerModel = req.getModel?.('Customer') || Customer;

  const customer = await CustomerModel.findOneAndUpdate(
    { _id: customerId, restaurantId },
    { isDeleted: true },
    { new: true }
  );
  
  if (!customer) throw new AppError('Customer not found', 404);

  res.success(response, null, 204);
});

export const bulkUpdateCustomers = asyncHandler(async (req, response) => {
  const { restaurantId } = req.params;
  const { customerIds, updateData } = req.body;

  if (req.user.role === 'merchant') {
    ensureCanManageRestaurant(req.user, restaurantId);
  }

  if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
    throw new AppError('No customers selected', 400);
  }

  const CustomerModel = req.getModel?.('Customer') || Customer;

  await CustomerModel.updateMany(
    { _id: { $in: customerIds }, restaurantId },
    { $set: updateData }
  );

  res.success(response, { message: `${customerIds.length} customers updated successfully` });
});

export const bulkDeleteCustomers = asyncHandler(async (req, response) => {
  const { restaurantId } = req.params;
  const { customerIds } = req.body; // Sent in body for bulk delete

  if (req.user.role === 'merchant') {
    ensureCanManageRestaurant(req.user, restaurantId);
  }

  if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
    throw new AppError('No customers selected', 400);
  }

  const CustomerModel = req.getModel?.('Customer') || Customer;

  await CustomerModel.updateMany(
    { _id: { $in: customerIds }, restaurantId },
    { $set: { isDeleted: true } }
  );

  res.success(response, { message: `${customerIds.length} customers deleted successfully` });
});

export const sendPromo = asyncHandler(async (req, response) => {
  const { restaurantId } = req.params;
  const { userIds, message, title, discountType, discountValue } = req.body;

  if (req.user.role === 'merchant') {
    ensureCanManageRestaurant(req.user, restaurantId);
  }

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new AppError('No users selected to send promo to', 400);
  }

  const NotificationModel = req.getModel?.('Notification') || Notification;
  const CouponModel = req.getModel?.('Coupon') || Coupon;

  const notifications = [];
  const coupons = [];

  for (const uid of userIds) {
    const uniqueCode = `PROMO${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    coupons.push({
      restaurantId,
      code: uniqueCode,
      name: title || 'Special Offer',
      promoType: 'Offer',
      type: discountType || 'percentage',
      value: discountValue || 10,
      description: message || 'Special discount for you',
      isActive: true,
      channels: ['Mobile', 'Web'],
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usageLimit: 1,
    });

    notifications.push({
      userId: uid,
      title: title || 'Special Offer from Restaurant',
      message: `${message}\n\nUse Code: ${uniqueCode}`,
      type: 'promo',
      isRead: false
    });
  }

  if (coupons.length > 0) {
    await CouponModel.insertMany(coupons);
  }
  
  if (notifications.length > 0) {
    await NotificationModel.insertMany(notifications);
  }

  res.success(response, { message: `Promotion and coupons sent to ${userIds.length} customers` });
});
