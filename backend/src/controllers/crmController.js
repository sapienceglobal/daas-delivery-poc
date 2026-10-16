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
import { createNotification } from './notificationController.js';
import { getOrCompute, invalidateRestaurant } from '../utils/responseCache.js';
import mongoose from 'mongoose';

const CRM_CACHE_TTL_MS = Number(process.env.CRM_CACHE_TTL_MS || 30000);

const ensureCanManageRestaurant = (user, restaurantId) => {
  if (user.role === 'admin') return true;
  if (user.restaurantId?.toString() !== restaurantId?.toString()) {
    throw new AppError('Not authorized for this restaurant', 403);
  }
};

const computeRestaurantCustomers = async (req, actualRestaurantId) => {
  const OrderModel = req.getModel?.('Order') || Order;
  const CustomerModel = req.getModel?.('Customer') || Customer;
  const UserModel = req.getModel?.('User') || User;

  // 1. Fetch Order stats, Manual customers, and registered customers in PARALLEL
  const [orderStats, manualCustomers, users] = await Promise.all([
    OrderModel.aggregate([
      { $match: { restaurantId: new mongoose.Types.ObjectId(actualRestaurantId) } },
      {
        $group: {
          _id: {
            email: { $toLower: { $ifNull: ["$customerEmail", ""] } },
            phone: { $ifNull: ["$customerPhone", ""] }
          },
          name: { $last: "$customerName" },
          userId: { $last: "$userId" },
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          lastOrderDate: { $max: '$createdAt' },
          firstOrderDate: { $min: '$createdAt' }
        }
      },
      { $sort: { lastOrderDate: -1 } }
    ]),
    CustomerModel.find({ restaurantId: actualRestaurantId, isDeleted: { $ne: true } }).lean(),
    UserModel.find({ role: 'customer' }).select('name email phone isActive loginPlatforms createdAt updatedAt').lean()
  ]);

  // Index users by email & by _id for O(1) lookups (avoids O(N*M) search in loop)
  const usersByEmail = new Map();
  const usersById = new Map();
  users.forEach(u => {
    if (u.email) usersByEmail.set(u.email.toLowerCase(), u);
    if (u._id) usersById.set(u._id.toString(), u);
  });

  const uniqueCustomersMap = new Map();
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
    if (email && usersByEmail.has(email)) {
      user = usersByEmail.get(email);
    } else if (stat.userId && usersById.has(stat.userId.toString())) {
      user = usersById.get(stat.userId.toString());
    }

    const existing = uniqueCustomersMap.get(identifier) || {};

    addCustomerToMap(identifier, {
      _id: existing._id || (user ? user._id.toString() : identifier),
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

  // Add registered app users who haven't ordered yet
  users.forEach(user => {
    const identifier = (user.email || user.phone || user._id.toString()).toLowerCase();
    if (!uniqueCustomersMap.has(identifier)) {
      const userCreatedDate = user.createdAt || (user._id && mongoose.Types.ObjectId.isValid(user._id) ? new mongoose.Types.ObjectId(user._id).getTimestamp() : new Date());
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
        loginPlatforms: user.loginPlatforms || [],
        createdAt: userCreatedDate,
        updatedAt: user.updatedAt || userCreatedDate,
      });
    }
  });

  const uniqueCustomers = Array.from(uniqueCustomersMap.values());

  // Compute RFM Segmentation & Stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  let totalOrdersSum = 0;
  let totalSpentSum = 0;
  let newCustomersCount = 0;
  let newCustomersLastMonthCount = 0;

  const enrichedCustomers = uniqueCustomers.map(c => {
    const orders = Number(c.totalOrders || 0);
    const spent = Number(c.totalSpent || 0);
    totalOrdersSum += orders;
    totalSpentSum += spent;

    const createdAt = c.createdAt ? new Date(c.createdAt) : null;
    const lastOrder = c.lastOrderDate ? new Date(c.lastOrderDate) : null;

    if (createdAt && createdAt >= startOfMonth) {
      newCustomersCount++;
    } else if (createdAt && createdAt >= startOfLastMonth && createdAt <= endOfLastMonth) {
      newCustomersLastMonthCount++;
    }

    const tier = (c.loyaltyTier || 'Bronze').toLowerCase();
    const daysSinceLastOrder = lastOrder ? Math.floor((now - lastOrder) / (1000 * 60 * 60 * 24)) : null;

    let segment = 'Regular';
    let tag = 'Regular Customer';
    let badge = null;

    if (spent >= 100 || orders >= 5 || ['vip', 'gold', 'platinum'].includes(tier)) {
      segment = 'VIP';
      badge = 'VIP';
      tag = orders >= 3 ? 'Frequent Customer' : 'VIP Customer';
    } else if (orders >= 3) {
      segment = 'Frequent';
      badge = 'Frequent';
      tag = 'Frequent Customer';
    } else if (orders >= 2) {
      segment = 'Loyal';
      badge = null;
      tag = 'Loyal Customer';
    } else if (createdAt && createdAt >= startOfMonth) {
      segment = 'New';
      badge = 'New';
      tag = 'New this month';
    } else if (orders <= 1) {
      segment = 'New';
      badge = 'New';
      tag = 'First time customer';
    } else if (daysSinceLastOrder !== null && daysSinceLastOrder > 45) {
      segment = 'Inactive';
      badge = null;
      tag = 'Inactive Customer';
    }

    return {
      ...c,
      segment,
      tag,
      badge,
      totalOrders: orders,
      totalSpent: Math.round(spent * 100) / 100
    };
  });

  const customerGrowth = newCustomersLastMonthCount > 0 
    ? Math.round(((newCustomersCount - newCustomersLastMonthCount) / newCustomersLastMonthCount) * 100) 
    : (newCustomersCount > 0 ? 20 : 12);

  const stats = {
    totalCustomers: enrichedCustomers.length,
    newCustomers: newCustomersCount,
    loyaltyMembers: enrichedCustomers.filter(c => c.loyaltyTier && c.loyaltyTier.toLowerCase() !== 'bronze').length,
    repeatCustomers: enrichedCustomers.filter(c => c.totalOrders > 1).length,
    totalOrders: totalOrdersSum,
    totalSpent: Math.round(totalSpentSum * 100) / 100,
    customerGrowthPct: customerGrowth > 0 ? `↑ ${customerGrowth}%` : `${customerGrowth}%`,
  };

  return { customers: enrichedCustomers, stats };
};

export const getCustomers = asyncHandler(async (req, response) => {
  const { restaurantId } = req.params;

  // Resolve slug/name to ObjectId if needed
  const isObjectId = /^[a-fA-F0-9]{24}$/.test(restaurantId);
  let actualRestaurantId = restaurantId;
  
  const RestaurantModel = req.getModel?.('Restaurant') || Restaurant;

  if (!isObjectId) {
    const restaurant = await RestaurantModel.findOne({ 
      $or: [
        { slug: new RegExp(`^${restaurantId}`, 'i') }, 
        { name: new RegExp(`^${restaurantId}$`, 'i') }
      ] 
    }).lean();
    if (!restaurant) throw new AppError('Restaurant not found', 404);
    actualRestaurantId = restaurant._id.toString();
  }

  if (req.user.role === 'merchant') {
    ensureCanManageRestaurant(req.user, actualRestaurantId);
  }

  // Retrieve base enriched list & stats (from cache if warm, otherwise computed)
  const cacheKey = `crm:customers:${req.tenantDb?.name || 'default'}:${actualRestaurantId}`;
  const { customers, stats } = await getOrCompute(cacheKey, actualRestaurantId, CRM_CACHE_TTL_MS, () =>
    computeRestaurantCustomers(req, actualRestaurantId)
  );

  let resultCustomers = [...customers];

  // Optional Filtering
  if (req.query.search) {
    const q = req.query.search.toLowerCase().trim();
    resultCustomers = resultCustomers.filter(c => 
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.customerId && c.customerId.toLowerCase().includes(q))
    );
  }

  if (req.query.segment) {
    const seg = req.query.segment.toLowerCase();
    resultCustomers = resultCustomers.filter(c => c.segment && c.segment.toLowerCase() === seg);
  }

  if (req.query.tier) {
    const tier = req.query.tier.toLowerCase();
    resultCustomers = resultCustomers.filter(c => (c.loyaltyTier || 'bronze').toLowerCase() === tier);
  }

  // Sorting
  const sortBy = (req.query.sortBy || 'newest').toLowerCase();
  resultCustomers.sort((a, b) => {
    const timeA = new Date(a.createdAt || a.lastOrderDate || 0).getTime();
    const timeB = new Date(b.createdAt || b.lastOrderDate || 0).getTime();

    if (sortBy === 'oldest') {
      return timeA - timeB;
    }
    if (sortBy === 'most_orders') {
      const diff = (Number(b.totalOrders) || 0) - (Number(a.totalOrders) || 0);
      if (diff !== 0) return diff;
      return (Number(b.totalSpent) || 0) - (Number(a.totalSpent) || 0);
    }
    if (sortBy === 'highest_spent') {
      const diff = (Number(b.totalSpent) || 0) - (Number(a.totalSpent) || 0);
      if (diff !== 0) return diff;
      return (Number(b.totalOrders) || 0) - (Number(a.totalOrders) || 0);
    }
    if (sortBy === 'recent_order') {
      const orderTimeA = new Date(a.lastOrderDate || 0).getTime();
      const orderTimeB = new Date(b.lastOrderDate || 0).getTime();
      if (orderTimeB !== orderTimeA) return orderTimeB - orderTimeA;
      return timeB - timeA;
    }
    if (sortBy === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    }

    // Default 'newest'
    if (timeB !== timeA) return timeB - timeA;
    return (Number(b.totalOrders) || 0) - (Number(a.totalOrders) || 0);
  });

  // Optional Pagination (if requested by client infinite scroll / pagination)
  if (req.query.page) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const paginated = resultCustomers.slice(skip, skip + limit);
    return res.success(response, {
      data: paginated,
      stats,
      pagination: res.buildPagination(page, limit, resultCustomers.length)
    });
  }

  // Standard full array return (100% backward compatible for existing web & mobile builds)
  res.success(response, { data: resultCustomers, stats });
});

export const getCustomerProfile = asyncHandler(async (req, response) => {
  const { restaurantId, customerId } = req.params;

  const isObjectIdRest = /^[a-fA-F0-9]{24}$/.test(restaurantId);
  let actualRestaurantId = restaurantId;
  
  const RestaurantModel = req.getModel?.('Restaurant') || Restaurant;
  const OrderModel = req.getModel?.('Order') || Order;
  const CustomerModel = req.getModel?.('Customer') || Customer;
  const UserModel = req.getModel?.('User') || User;
  const CouponModel = req.getModel?.('Coupon') || Coupon;

  if (!isObjectIdRest) {
    const restaurant = await RestaurantModel.findOne({ 
      $or: [
        { slug: new RegExp(`^${restaurantId}`, 'i') }, 
        { name: new RegExp(`^${restaurantId}$`, 'i') }
      ] 
    }).lean();
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
    [customer, user] = await Promise.all([
      CustomerModel.findOne({ _id: customerId, restaurantId: actualRestaurantId }).lean(),
      UserModel.findById(customerId).lean()
    ]);
  }

  // If user not found by ID, try finding by customer email or phone
  if (!user && customer) {
    const orConditions = [];
    if (customer.email) orConditions.push({ email: { $regex: new RegExp(`^${customer.email}$`, 'i') } });
    if (customer.phone) orConditions.push({ phone: customer.phone });
    if (orConditions.length > 0) {
      user = await UserModel.findOne({ $or: orConditions }).lean();
    }
  }

  // If customer is neither in Customer nor User, they are a pure Guest
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
      loyaltyTier: 'Bronze'
    };
  }

  // Find orders for this customer by email, phone, or userId
  const orderQuery = { restaurantId: new mongoose.Types.ObjectId(actualRestaurantId) };
  const orConditions = [];
  
  if (user && user._id) orConditions.push({ userId: user._id });
  if (customer.email) orConditions.push({ customerEmail: { $regex: new RegExp(`^${customer.email}$`, 'i') } });
  if (customer.phone) orConditions.push({ customerPhone: customer.phone });
  
  if (orConditions.length > 0) {
    orderQuery.$or = orConditions;
  } else if (customer.name) {
    orderQuery.customerName = customer.name;
  }

  // Project only relevant fields for profile order history and calculation
  const orders = await OrderModel.find(orderQuery)
    .select('orderNumber total discount loyaltyDiscount couponCode orderType createdAt status items loyaltyPointsEarned loyaltyPointsUsed')
    .sort({ createdAt: -1 })
    .lean();

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

  loyaltyHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Promo history
  let promoHistory = [];
  const searchIds = [
    user ? user._id : null,
    customer ? customer._id : null
  ].filter(Boolean);

  if (searchIds.length > 0) {
    promoHistory = await CouponModel.find({
      $or: [
        { specificRestaurant: new mongoose.Types.ObjectId(actualRestaurantId) },
        { specificRestaurant: null }
      ],
      applicableUsers: { $in: searchIds }
    }).sort({ createdAt: -1 }).lean();
  }

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
    orders: orders.slice(0, 20), // Send recent 20 orders with projected lightweight fields
    loyalty: {
      tier: customer.loyaltyTier || 'Bronze',
      points: currentPoints,
      history: loyaltyHistory
    },
    promos: promoHistory
  };

  res.success(response, { data: profileData });
});

export const createCustomer = asyncHandler(async (req, response) => {
  const { restaurantId } = req.params;

  if (req.user.role === 'merchant') {
    ensureCanManageRestaurant(req.user, restaurantId);
  }

  const CustomerModel = req.getModel?.('Customer') || Customer;

  const count = await CustomerModel.countDocuments({ restaurantId });
  const customerId = `#CUST${1000 + count + 1}`;

  const customer = await CustomerModel.create({
    ...req.body,
    restaurantId,
    customerId
  });

  invalidateRestaurant(restaurantId);
  res.success(response, customer, 201);
});

export const updateCustomer = asyncHandler(async (req, response) => {
  const { restaurantId, customerId } = req.params;

  if (req.user.role === 'merchant') {
    ensureCanManageRestaurant(req.user, restaurantId);
  }

  const CustomerModel = req.getModel?.('Customer') || Customer;
  const UserModel = req.getModel?.('User') || User;
  
  let customer = null;
  try {
    customer = await CustomerModel.findOneAndUpdate(
      { _id: customerId, restaurantId },
      req.body,
      { new: true, runValidators: true }
    );
  } catch (err) {
    // Ignore CastError if customerId is not a valid ObjectId
  }

  if (!customer) {
    let user = null;
    const isValidId = mongoose.Types.ObjectId.isValid(customerId);
    if (isValidId) {
      user = await UserModel.findById(customerId);
    }
    
    const count = await CustomerModel.countDocuments({ restaurantId });
    const generatedCustId = `#CUST${1000 + count + 1}`;
    
    const newCustomerData = {
      restaurantId,
      customerId: generatedCustId,
      name: req.body.name || (user ? user.name : 'Guest'),
      email: req.body.email || (user ? user.email : (customerId.includes('@') ? customerId : '')),
      phone: req.body.phone || (user ? user.phone : (!customerId.includes('@') ? customerId : '')),
      group: req.body.group || (user ? 'App User' : 'Guest'),
      loyaltyTier: req.body.loyaltyTier || 'Bronze',
      status: req.body.status || 'Active',
      ...req.body
    };
    
    if (isValidId) {
      newCustomerData._id = customerId;
    }
    
    customer = await CustomerModel.create(newCustomerData);
  }

  invalidateRestaurant(restaurantId);
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

  invalidateRestaurant(restaurantId);
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

  invalidateRestaurant(restaurantId);
  res.success(response, { message: `${customerIds.length} customers updated successfully` });
});

export const bulkDeleteCustomers = asyncHandler(async (req, response) => {
  const { restaurantId } = req.params;
  const { customerIds } = req.body;

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

  invalidateRestaurant(restaurantId);
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
      specificRestaurant: restaurantId,
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
      maxUses: 1,
      applicableUsers: [uid],
    });

    const notificationPromise = createNotification(
      uid,
      title || 'Special Offer from Restaurant',
      `${message}\n\nUse Code: ${uniqueCode}`,
      'promotion',
      null,
      req.app.get('io'),
      req.getModel
    );
    notifications.push(notificationPromise);
  }

  if (coupons.length > 0) {
    await CouponModel.insertMany(coupons);
  }
  
  if (notifications.length > 0) {
    await Promise.all(notifications);
  }

  invalidateRestaurant(restaurantId);
  res.success(response, { message: `Promotion and coupons sent to ${userIds.length} customers` });
});
