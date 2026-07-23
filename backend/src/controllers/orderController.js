import xss from 'xss';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import Table from '../models/Table.js';
import Payment from '../models/Payment.js';
import LoyaltyTransaction from '../models/LoyaltyTransaction.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import * as res from '../utils/responseFormatter.js';
import { triggerDeliveryAPI, getDeliveryQuoteAPI, checkServiceabilityAPI, cancelDeliveryAPI } from '../services/doordashService.js';
import { buildOrderSocketPayload, syncDoorDashDelivery } from '../services/doordashSyncService.js';
import { retrievePaymentIntent, refundPayment as refundStripePayment } from '../services/stripeService.js';
import { calculateOrderPricing, roundMoney } from '../services/orderPricing.js';
import { sendOrderConfirmationEmail } from '../services/emailService.js';
import { createNotification } from './notificationController.js';
import logger from '../utils/logger.js';

const CUSTOMER_PAYMENT_METHODS = ['credit_card', 'apple_pay', 'google_pay'];

const canManageRestaurant = (user, restaurantId) => {
  if (user.role === 'admin') return true;
  return user.restaurantId?.toString() === restaurantId?.toString();
};

const ensureCanManageRestaurant = (user, restaurantId) => {
  if (!canManageRestaurant(user, restaurantId)) {
    throw new AppError('You can only manage orders for your own restaurant', 403);
  }
};

const rollbackLoyaltyPoints = async (order, reason = 'cancellation') => {
  if (!order.userId) return;
  if (order.loyaltyRollbackProcessed) return;

  const pointsUsed = order.loyaltyPointsUsed || 0;
  const pointsEarned = order.loyaltyPointsEarned || 0;

  if (pointsUsed === 0 && pointsEarned === 0) {
    order.loyaltyRollbackProcessed = true;
    await order.save();
    return;
  }

  try {
    const UserModel = order.constructor.db.model('User');
    const LoyaltyTransactionModel = order.constructor.db.model('LoyaltyTransaction');

    const user = await UserModel.findById(order.userId);
    if (!user) {
      logger.error('User not found during loyalty rollback', { userId: order.userId, orderId: order._id });
      return;
    }

    const currentPoints = user.loyaltyPoints || 0;
    // pointsUsed is refunded (added back), pointsEarned is revoked (subtracted)
    let newBalance = currentPoints + pointsUsed - pointsEarned;
    if (newBalance < 0) newBalance = 0;

    user.loyaltyPoints = newBalance;
    await user.save();

    // Log the rollback transaction(s)
    if (pointsUsed > 0) {
      await LoyaltyTransactionModel.create({
        userId: order.userId,
        orderId: order._id,
        type: 'adjustment',
        points: pointsUsed,
        balanceAfter: newBalance,
        description: `Refunded points from cancelled/refunded order #${order.orderNumber || order._id}`
      });
    }

    if (pointsEarned > 0) {
      await LoyaltyTransactionModel.create({
        userId: order.userId,
        orderId: order._id,
        type: 'adjustment',
        points: -pointsEarned, // negative points to denote subtraction
        balanceAfter: newBalance,
        description: `Revoked earned points from cancelled/refunded order #${order.orderNumber || order._id}`
      });
    }

    order.loyaltyRollbackProcessed = true;
    await order.save();

    logger.info('Loyalty points rollback completed successfully', {
      orderId: order._id,
      userId: order.userId,
      refunded: pointsUsed,
      revoked: pointsEarned,
      newBalance,
      reason
    });
  } catch (err) {
    logger.error('Error occurred during loyalty points rollback', {
      orderId: order._id,
      error: err.message
    });
  }
};

const verifyCardPayment = async ({ paymentMethod, stripePaymentIntentId, expectedTotal, userId }) => {
  if (!['credit_card', 'debit_card', 'apple_pay', 'google_pay'].includes(paymentMethod)) {
    return { paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid' };
  }

  if (!stripePaymentIntentId) {
    throw new AppError('Payment confirmation is required before placing this order', 400);
  }

  if (stripePaymentIntentId.startsWith('pi_test_mock_')) {
    if (process.env.NODE_ENV === 'production') {
      throw new AppError('Test/mock payments are not allowed in production', 400);
    }
    return { paymentStatus: 'paid' };
  }

  const paymentIntent = await retrievePaymentIntent(stripePaymentIntentId);
  if (paymentIntent.status !== 'succeeded') {
    throw new AppError('Payment has not been completed', 402);
  }

  if (paymentIntent.metadata?.userId && paymentIntent.metadata.userId !== userId.toString()) {
    throw new AppError('Payment does not belong to this customer', 403);
  }

  const paidAmount = roundMoney(paymentIntent.amount_received / 100);
  if (paidAmount !== roundMoney(expectedTotal)) {
    throw new AppError('Paid amount does not match current order total. Please refresh checkout and try again.', 400);
  }

  return { paymentStatus: 'paid' };
};

const createDoorDashDeliveryForOrder = async (order) => {
  if (order.orderType !== 'delivery' || order.deliveryId) return order;

  try {
    const delivery = await triggerDeliveryAPI(order);
    order.deliveryId = delivery.deliveryId;
    order.trackingUrl = delivery.trackingUrl;
    order.pickupTime = delivery.pickupTime;
    order.deliveryTime = delivery.deliveryTime;
    await order.save();
  } catch (err) {
    order.statusUpdates.push({
      status: order.status,
      description: `DoorDash delivery creation failed: ${err.message}`
    });
    await order.save();
    logger.warn('DoorDash delivery trigger failed after restaurant acceptance', {
      orderId: order._id,
      error: err.message
    });
  }

  return order;
};

const getTrustedDeliveryQuote = async ({ restaurant, address, subtotal, scheduledTime }) => {
  if (!address) return { deliveryFee: 0, quote: null };

  try {
    const quote = await getDeliveryQuoteAPI(restaurant.address, address, subtotal || 10, scheduledTime);
    return {
      deliveryFee: roundMoney((quote.deliveryFee || 0) / 100),
      quote
    };
  } catch (err) {
    const errReason = err.response?.data?.reason || err.response?.data?.error?.reason;
    if (errReason === 'distance_too_long' || err.message === 'OUT_OF_SERVICE_AREA') {
      logger.warn('DoorDash rejected quote due to distance_too_long', {
        address,
        restaurantId: restaurant._id
      });
      throw new AppError('Delivery is not available for this location. The distance is too far.', 400);
    }
    
    // For all other DoorDash errors (including fake seed addresses that DoorDash can't resolve),
    // fall back to the restaurant's default delivery fee so the PoC works.
    logger.warn('DoorDash quote unavailable, using restaurant default delivery fee', {
      restaurantId: restaurant._id,
      error: err.response?.data || err.message
    });
    return {
      deliveryFee: roundMoney(restaurant.deliveryFee || 0),
      quote: null
    };
  }
};

// ── Customer ────────────────────────────────────────────────────────────────

export const createOrder = asyncHandler(async (req, response) => {
  const Order = req.getModel('Order');
  const Restaurant = req.getModel('Restaurant');
  const Table = req.getModel('Table');
  const Payment = req.getModel('Payment');
  const LoyaltyTransaction = req.getModel('LoyaltyTransaction');
  const User = req.getModel('User');

  const {
    restaurantId, items, address, addressLat, addressLng,
    orderType = 'delivery', paymentMethod = 'credit_card',
    tip = 0, couponCode, courierNotes, specialInstructions, scheduledTime, tableNumber,
    stripePaymentIntentId, useLoyaltyPoints = false
  } = req.body;

  if (!restaurantId || !items?.length) {
    throw new AppError('restaurantId and items are required', 400);
  }
  // M6: Limit maximum items per order to prevent abuse
  if (items.length > 50) {
    throw new AppError('Maximum 50 items per order', 400);
  }
  if (orderType === 'delivery' && !address) {
    throw new AppError('Delivery address is required', 400);
  }
  // M4: Sanitize user-generated text fields
  const sanitizedCourierNotes = courierNotes ? xss(String(courierNotes).slice(0, 500)) : '';
  const isMerchantPosCash =
    ['merchant', 'admin'].includes(req.user.role) &&
    ['pickup', 'dine_in'].includes(orderType) &&
    paymentMethod === 'cash';

  if (!CUSTOMER_PAYMENT_METHODS.includes(paymentMethod) && !isMerchantPosCash) {
    throw new AppError('Unsupported payment method for US customer checkout. Please use card, Apple Pay, or Google Pay.', 400);
  }

  const restaurantCheck = await Restaurant.findById(restaurantId);
  if (!restaurantCheck) {
    throw new AppError('Restaurant not found', 404);
  }
  if (restaurantCheck.isActive === false) {
    throw new AppError('This restaurant is not accepting orders right now', 400);
  }

  // Geo-distance serviceability check for delivery orders
  if (orderType === 'delivery' && addressLat != null && addressLng != null) {
    const restaurant = await Restaurant.findById(restaurantId);
    if (restaurant?.location?.coordinates) {
      const [restLng, restLat] = restaurant.location.coordinates;
      const toRad = (deg) => (deg * Math.PI) / 180;
      const R = 3958.8;
      const dLat = toRad(addressLat - restLat);
      const dLon = toRad(addressLng - restLng);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(restLat)) * Math.cos(toRad(addressLat)) * Math.sin(dLon / 2) ** 2;
      const distanceMiles = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (distanceMiles > 15) {
        throw new AppError(`Delivery is not available for this location. It is ${Math.round(distanceMiles)} miles away.`, 400);
      }
    }
  }

  const prePricing = await calculateOrderPricing({
    restaurantId,
    items,
    orderType,
    tip,
    couponCode,
    userId: req.user._id,
    useLoyaltyPoints,
    getModel: req.getModel
  });

  const deliveryQuote = orderType === 'delivery'
    ? await getTrustedDeliveryQuote({
        restaurant: prePricing.restaurant,
        address,
        subtotal: prePricing.subtotal,
        scheduledTime
      })
    : { deliveryFee: 0, quote: null };

  const pricing = await calculateOrderPricing({
    restaurantId,
    items,
    orderType,
    tip,
    couponCode,
    userId: req.user._id,
    useLoyaltyPoints,
    deliveryFeeOverride: deliveryQuote.deliveryFee,
    getModel: req.getModel
  });

  const { restaurant } = pricing;
  const { paymentStatus } = await verifyCardPayment({
    paymentMethod,
    stripePaymentIntentId,
    expectedTotal: pricing.total,
    userId: req.user._id
  });

  const order = new Order({
    userId: req.user._id,
    customerName: req.user.name,
    customerPhone: req.user.phone || '',
    customerEmail: req.user.email,
    address: address || restaurant.address,
    addressLat,
    addressLng,
    restaurantId: restaurant._id,
    restaurantName: restaurant.name,
    restaurantAddress: restaurant.address,
    restaurantPhone: restaurant.phone,
    items: pricing.orderItems,
    orderType,
    tableNumber: orderType === 'dine_in' ? tableNumber : null,
    subtotal: pricing.subtotal,
    tax: pricing.tax,
    deliveryFee: pricing.deliveryFee,
    platformFee: pricing.platformFee,
    serviceFee: pricing.serviceFee,
    tip: pricing.tip,
    discount: pricing.discount,
    loyaltyDiscount: pricing.loyaltyDiscount,
    loyaltyPointsUsed: pricing.pointsUsed,
    loyaltyPointsEarned: pricing.pointsEarned,
    total: pricing.total,
    paymentMethod,
    paymentStatus,
    couponId: pricing.coupon?._id || null,
    couponCode: pricing.coupon?.code || null,
    courierNotes: sanitizedCourierNotes,
    specialInstructions: specialInstructions ? xss(String(specialInstructions).slice(0, 500)) : '',
    scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
    stripePaymentIntentId: stripePaymentIntentId || null
  });

  await order.save();

  if (order.orderType === 'dine_in' && order.tableNumber) {
    const table = await Table.findOneAndUpdate(
      { restaurantId: restaurant._id, tableNumber: order.tableNumber },
      { 
        status: 'occupied', 
        currentOrderId: order._id, 
        occupiedAt: new Date() 
      },
      { new: true }
    ).populate('currentOrderId', 'orderNumber status subtotal items');
    
    if (table) {
      const io = req.app.get('io');
      if (io) io.to(restaurant._id.toString()).emit('table_update', table);
    }
  }

  await Payment.create({
    orderId: order._id,
    userId: req.user._id,
    restaurantId: restaurant._id,
    method: paymentMethod,
    status: paymentStatus,
    amount: order.total,
    tip: order.tip,
    stripePaymentIntentId: stripePaymentIntentId || null,
    metadata: {
      orderNumber: order.orderNumber,
      platformFee: order.platformFee,
      serviceFee: order.serviceFee,
      deliveryFee: order.deliveryFee,
      discount: order.discount,
      loyaltyDiscount: order.loyaltyDiscount
    }
  });

  // Mark coupon usage
  if (pricing.coupon) {
    pricing.coupon.usedCount += 1;
    pricing.coupon.usedBy.push({ userId: req.user._id });
    await pricing.coupon.save();
  }

  // Handle loyalty points: deduct used, add earned
  if (pricing.pointsUsed > 0) {
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { loyaltyPoints: -pricing.pointsUsed } },
      { new: true }
    );
    await LoyaltyTransaction.create({
      userId: req.user._id,
      orderId: order._id,
      type: 'redeemed',
      points: -pricing.pointsUsed,
      balanceAfter: updatedUser.loyaltyPoints,
      description: `Redeemed on Order #${order.orderNumber}`
    });
  }

  if (pricing.pointsEarned > 0) {
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { loyaltyPoints: pricing.pointsEarned } },
      { new: true }
    );
    await LoyaltyTransaction.create({
      userId: req.user._id,
      orderId: order._id,
      type: 'earned',
      points: pricing.pointsEarned,
      balanceAfter: updatedUser.loyaltyPoints,
      description: `Earned from Order #${order.orderNumber}`
    });
  }

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.to(restaurant._id.toString()).emit('new_order', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      items: order.items.length,
      total: order.total
    });
  }

  // Send confirmation email (fire and forget)
  if (req.user.email) {
    sendOrderConfirmationEmail(req.user.email, order).catch(() => {});
  }

  res.created(response, { data: order });
});

export const getMyOrders = asyncHandler(async (req, response) => {
  const Order = req.getModel('Order');

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 50);
  const skip = (page - 1) * limit;

  const filter = { userId: req.user._id };

  if (req.query.status && req.query.status !== 'all') {
    if (req.query.status === 'ongoing') {
      filter.status = { $in: ['pending', 'accepted', 'preparing', 'ready', 'picked_up', 'out_for_delivery'] };
    } else {
      filter.status = req.query.status;
    }
  }

  if (req.query.q) {
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const qRegex = new RegExp(escapeRegex(req.query.q.trim()), 'i');
    filter.$or = [
      { orderNumber: qRegex },
      { 'items.name': qRegex }
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter)
  ]);

  res.success(response, { data: orders, pagination: res.buildPagination(page, limit, total) });
});

export const getOrderById = asyncHandler(async (req, response) => {
  const Order = req.getModel('Order');
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);

  // Customer can only see their own orders; merchant/admin can see restaurant orders
  if (req.user.role === 'customer' && order.userId?.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to view this order', 403);
  }
  if (req.user.role === 'merchant') {
    ensureCanManageRestaurant(req.user, order.restaurantId);
  }

  await syncDoorDashDelivery(order);

  res.success(response, { data: order.toObject() });
});

export const cancelOrder = asyncHandler(async (req, response) => {
  const Order = req.getModel('Order');
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);

  if (order.userId?.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized', 403);
  }

  if (!['pending', 'accepted'].includes(order.status)) {
    throw new AppError('Order cannot be cancelled at this stage', 400);
  }

  if (order.deliveryId) {
    try {
      await cancelDeliveryAPI(order.externalDeliveryId, 'Cancelled by customer');
    } catch (err) {
      logger.warn('DoorDash cancellation failed during customer cancel', {
        orderId: order._id,
        error: err.response?.data || err.message
      });
    }
  }

  order.status = 'cancelled';
  order.statusUpdates.push({ status: 'cancelled', description: 'Cancelled by customer' });
  await order.save();

  await rollbackLoyaltyPoints(order, 'customer_cancel');

  const io = req.app.get('io');
  if (io) {
    io.to(order.restaurantId.toString()).emit('order_updated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: 'cancelled'
    });
    io.to(order.restaurantId.toString()).emit('order_cancelled', {
      orderId: order._id,
      orderNumber: order.orderNumber
    });
    io.to(`order_${order._id}`).emit('order_status_changed', { status: 'cancelled' });
  }

  res.success(response, { data: order, message: 'Order cancelled' });
});

export const rateOrder = asyncHandler(async (req, response) => {
  const { rating, review } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  if (order.userId?.toString() !== req.user._id.toString()) throw new AppError('Not authorized', 403);
  if (order.status !== 'delivered') throw new AppError('Can only rate delivered orders', 400);

  order.rating = rating;
  order.review = review ? xss(String(review).slice(0, 1000)) : null;
  await order.save();

  res.success(response, { data: order, message: 'Thanks for your rating!' });
});

export const getDeliveryQuote = asyncHandler(async (req, response) => {
  const Restaurant = req.getModel('Restaurant');

  const { restaurantId, address, addressLat, addressLng, scheduledTime, items = [] } = req.body;
  if (!restaurantId || !address) throw new AppError('restaurantId and address are required', 400);

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) throw new AppError('Restaurant not found', 404);

  // ── Geo-distance serviceability check (same as homepage's getNearby) ──
  // If the frontend sent lat/lng, check if the delivery address is within 15 miles of the restaurant.
  // This is the same check the homepage uses to decide whether to show restaurants.
  const MAX_DELIVERY_MILES = 15;
  if (addressLat != null && addressLng != null && restaurant.location?.coordinates) {
    const [restLng, restLat] = restaurant.location.coordinates;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 3958.8; // Earth radius in miles
    const dLat = toRad(addressLat - restLat);
    const dLon = toRad(addressLng - restLng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(restLat)) * Math.cos(toRad(addressLat)) * Math.sin(dLon / 2) ** 2;
    const distanceMiles = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    if (distanceMiles > MAX_DELIVERY_MILES) {
      throw new AppError(
        `Delivery is not available for this location. It is ${Math.round(distanceMiles)} miles away — we deliver within ${MAX_DELIVERY_MILES} miles.`,
        400
      );
    }
    logger.info(`Delivery distance check passed: ${distanceMiles.toFixed(1)} miles (max ${MAX_DELIVERY_MILES})`);
  }

  let subtotal = 10;
  if (items.length > 0) {
    const pricing = await calculateOrderPricing({
      restaurantId,
      items,
      orderType: 'delivery',
      userId: req.user._id,
      getModel: req.getModel
    });
    subtotal = pricing.subtotal;
  }

  const quote = await getTrustedDeliveryQuote({ restaurant, address, subtotal, scheduledTime });

  res.success(response, {
    data: {
      ...(quote.quote || {}),
      deliveryFee: quote.deliveryFee,
      deliveryFeeCents: Math.round(quote.deliveryFee * 100),
      fallback: !quote.quote
    }
  });
});

// ── Merchant ────────────────────────────────────────────────────────────────

export const getRestaurantOrders = asyncHandler(async (req, response) => {
  const Order = req.getModel('Order');
  ensureCanManageRestaurant(req.user, req.params.restaurantId);

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 50);
  const skip = (page - 1) * limit;

  const filter = { restaurantId: req.params.restaurantId };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.date) {
    const d = new Date(req.query.date);
    filter.createdAt = { $gte: d, $lt: new Date(d.getTime() + 24 * 60 * 60 * 1000) };
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter)
  ]);

  res.success(response, { data: orders, pagination: res.buildPagination(page, limit, total) });
});

export const getMerchantOrders = asyncHandler(async (req, response) => {
  const Order = req.getModel('Order');
  if (!req.user.restaurantId) {
    throw new AppError('No restaurant associated with this merchant account.', 400);
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 50);
  const skip = (page - 1) * limit;

  const filter = { restaurantId: req.user.restaurantId };
  if (req.query.status) filter.status = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter)
  ]);

  res.success(response, { data: orders, pagination: res.buildPagination(page, limit, total) });
});

export const updateOrderStatus = asyncHandler(async (req, response) => {
  const Order = req.getModel('Order');
  let { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  ensureCanManageRestaurant(req.user, order.restaurantId);

  // Determine next status if not provided in the request body (for KDS/mobile app compat)
  if (!status) {
    if (order.status === 'pending') status = 'accepted';
    else if (order.status === 'accepted') status = 'preparing';
    else if (order.status === 'preparing') status = 'ready';
    else if (order.status === 'ready') status = 'picked_up';
    else if (order.status === 'picked_up') status = 'delivered';
  }

  const allowedTransitions = {
    pending: ['accepted', 'cancelled'],
    accepted: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['picked_up', 'cancelled'],
    picked_up: ['delivered'],
    delivered: [],
    cancelled: [],
    failed: []
  };

  if (!allowedTransitions[order.status]?.includes(status)) {
    throw new AppError(`Cannot change order from ${order.status} to ${status}`, 400);
  }
  if (status === 'accepted' && ['credit_card', 'debit_card', 'apple_pay', 'google_pay'].includes(order.paymentMethod) && order.paymentStatus !== 'paid') {
    throw new AppError('Card orders must be paid before acceptance', 400);
  }

  order.status = status;
  order.statusUpdates.push({ status, description: `Status updated to ${status}` });
  await order.save();
  if (status === 'accepted') {
    await createDoorDashDeliveryForOrder(order);
  } else if (status === 'cancelled') {
    await rollbackLoyaltyPoints(order, 'status_update_cancel');
    if (order.deliveryId) {
      try {
        await cancelDeliveryAPI(order.externalDeliveryId, 'Cancelled via status update');
      } catch (err) {
        logger.warn('DoorDash cancellation failed during status update cancel', {
          orderId: order._id,
          error: err.response?.data || err.message
        });
      }
    }
  }

  const io = req.app.get('io');
  if (io) {
    const payload = buildOrderSocketPayload(order);
    io.to(order.restaurantId.toString()).emit('order_updated', payload);
    io.to(`order_${order._id}`).emit('order_status_changed', payload);
  }

  if (order.userId) {
    await createNotification(
      order.userId,
      `Order ${status}`,
      `Your order from ${order.restaurantName} is now ${status.replace('_', ' ')}.`,
      'order_update',
      `/orders/${order._id}`,
      io,
      req.getModel
    );
  }

  res.success(response, { data: order, message: `Status updated to ${status}` });
});

export const acceptOrder = asyncHandler(async (req, response) => {
  const Order = req.getModel('Order');
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  ensureCanManageRestaurant(req.user, order.restaurantId);

  if (order.status !== 'pending') {
    throw new AppError(`Only pending orders can be accepted. Current status: ${order.status}`, 400);
  }
  if (['credit_card', 'debit_card', 'apple_pay', 'google_pay'].includes(order.paymentMethod) && order.paymentStatus !== 'paid') {
    throw new AppError('Card orders must be paid before acceptance', 400);
  }

  order.status = 'accepted';
  order.statusUpdates.push({ status: 'accepted', description: 'Order accepted by restaurant' });
  await order.save();
  await createDoorDashDeliveryForOrder(order);

  const io = req.app.get('io');
  if (io) {
    const payload = buildOrderSocketPayload(order);
    io.to(order.restaurantId.toString()).emit('order_updated', payload);
    io.to(`order_${order._id}`).emit('order_status_changed', payload);
  }

  if (order.userId) {
    await createNotification(
      order.userId,
      'Order Accepted',
      `${order.restaurantName} has accepted your order and is starting to prepare it!`,
      'order_update',
      `/orders/${order._id}`,
      io,
      req.getModel
    );
  }

  res.success(response, { data: order, message: 'Order accepted' });
});

export const rejectOrder = asyncHandler(async (req, response) => {
  const Order = req.getModel('Order');
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  ensureCanManageRestaurant(req.user, order.restaurantId);

  if (!['pending', 'accepted'].includes(order.status)) {
    throw new AppError(`Order cannot be rejected at ${order.status}`, 400);
  }

  order.status = 'cancelled';
  order.statusUpdates.push({ status: 'cancelled', description: req.body.reason || 'Rejected by restaurant' });
  if (order.deliveryId) {
    try {
      await cancelDeliveryAPI(order.externalDeliveryId, req.body.reason || 'Rejected by restaurant');
    } catch (err) {
      logger.warn('DoorDash cancellation failed during restaurant reject', {
        orderId: order._id,
        error: err.response?.data || err.message
      });
    }
  }
  await order.save();

  await rollbackLoyaltyPoints(order, 'restaurant_reject');

  const io = req.app.get('io');
  if (io) {
    const payload = buildOrderSocketPayload(order);
    io.to(order.restaurantId.toString()).emit('order_updated', payload);
    io.to(`order_${order._id}`).emit('order_status_changed', payload);
  }

  if (order.userId) {
    await createNotification(
      order.userId,
      'Order Cancelled',
      `Unfortunately, your order from ${order.restaurantName} was cancelled.`,
      'order_update',
      `/orders/${order._id}`,
      io,
      req.getModel
    );
  }

  res.success(response, { data: order, message: 'Order rejected' });
});

// ── Admin ───────────────────────────────────────────────────────────────────

export const getAllOrders = asyncHandler(async (req, response) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 50);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.restaurantId) filter.restaurantId = req.query.restaurantId;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter)
  ]);

  res.success(response, { data: orders, pagination: res.buildPagination(page, limit, total) });
});

export const refundOrder = asyncHandler(async (req, response) => {
  const Order = req.getModel('Order');
  const Payment = req.getModel('Payment');
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  if (req.user.role === 'merchant') {
    ensureCanManageRestaurant(req.user, order.restaurantId);
  }

  const { amount, reason } = req.body;
  const refundAmount = roundMoney(amount || order.total);
  const nextRefundedTotal = roundMoney((order.refundAmount || 0) + refundAmount);
  if (refundAmount <= 0 || nextRefundedTotal > roundMoney(order.total)) {
    throw new AppError('Invalid refund amount', 400);
  }

  if (order.stripePaymentIntentId && ['paid', 'partially_refunded'].includes(order.paymentStatus)) {
    const refund = await refundStripePayment(order.stripePaymentIntentId, refundAmount);
    await Payment.findOneAndUpdate(
      { orderId: order._id },
      {
        $push: {
          refunds: {
            amount: refundAmount,
            reason: reason || 'Refund processed',
            stripeRefundId: refund.id,
            refundedBy: req.user._id
          }
        },
        $inc: { totalRefunded: refundAmount },
        $set: {
          status: nextRefundedTotal >= order.total ? 'refunded' : 'partially_refunded'
        }
      }
    );
  } else {
    await Payment.findOneAndUpdate(
      { orderId: order._id },
      {
        $push: {
          refunds: {
            amount: refundAmount,
            reason: reason || 'Refund processed',
            refundedBy: req.user._id
          }
        },
        $inc: { totalRefunded: refundAmount },
        $set: {
          status: nextRefundedTotal >= order.total ? 'refunded' : 'partially_refunded'
        }
      }
    );
  }

  order.refunded = true;
  order.refundAmount = nextRefundedTotal;
  order.refundReason = reason || 'Refund processed';
  order.paymentStatus = order.refundAmount >= order.total ? 'refunded' : 'partially_refunded';
  order.statusUpdates.push({
    status: order.status,
    description: `Refund of $${refundAmount.toFixed(2)} processed`
  });
  await order.save();

  if (order.paymentStatus === 'refunded') {
    await rollbackLoyaltyPoints(order, 'order_refund');
  }

  res.success(response, { data: order, message: `Refund of $${refundAmount.toFixed(2)} processed` });
});

// ── Simulation (dev only) ───────────────────────────────────────────────────

const STATUS_FLOW = ['pending', 'accepted', 'preparing', 'ready', 'picked_up', 'delivered'];

export const simulateStatusAdvance = asyncHandler(async (req, response) => {
  if (process.env.NODE_ENV === 'production') {
    throw new AppError('Simulation not available in production', 403);
  }

  const Order = req.getModel('Order');
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);

  const currentIdx = STATUS_FLOW.indexOf(order.status);
  if (currentIdx === -1 || currentIdx >= STATUS_FLOW.length - 1) {
    throw new AppError('Order has reached terminal status', 400);
  }

  const nextStatus = STATUS_FLOW[currentIdx + 1];
  order.status = nextStatus;
  order.statusUpdates.push({ status: nextStatus, description: `Simulated advance to ${nextStatus}` });
  await order.save();

  const io = req.app.get('io');
  if (io) {
    io.to(order.restaurantId.toString()).emit('order_updated', {
      orderId: order._id, orderNumber: order.orderNumber, status: nextStatus
    });
    io.to(`order_${order._id}`).emit('order_status_changed', { status: nextStatus });
  }

  res.success(response, { data: order, message: `Simulated → ${nextStatus}` });
});

// ── Review Reply ────────────────────────────────────────────────────────────

export const replyToReview = asyncHandler(async (req, response) => {
  const { reply } = req.body;
  if (!reply) throw new AppError('Reply content is required', 400);

  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);

  ensureCanManageRestaurant(req, order.restaurantId);

  if (!order.rating) {
    throw new AppError('Order has not been rated yet', 400);
  }

  order.restaurantReply = xss(String(reply).slice(0, 1000));
  await order.save();

  res.success(response, { data: order, message: 'Reply added successfully' });
});

// ── Driver ──────────────────────────────────────────────────────────────────

export const getAvailableDriverOrders = asyncHandler(async (req, response) => {
  // Find orders that are ready for pickup and have no assigned driver, or orders that this driver just accepted.
  // Actually, let's just find orders with status 'ready' and orderType 'delivery' and no deliveryId (DoorDash)
  const orders = await Order.find({
    orderType: 'delivery',
    status: 'ready',
    deliveryId: { $exists: false } // Not managed by DoorDash
  }).sort({ createdAt: 1 }).lean();

  res.success(response, { data: orders });
});

export const getActiveDriverOrder = asyncHandler(async (req, response) => {
  // An active order is one that the driver has accepted or picked up, but not delivered.
  const order = await Order.findOne({
    driverId: req.user._id,
    status: { $in: ['accepted_by_driver', 'picked_up'] }
  }).lean();

  res.success(response, { data: order });
});

export const driverAcceptOrder = asyncHandler(async (req, response) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  
  if (order.driverId) {
    throw new AppError('Order already accepted by another driver', 400);
  }

  order.driverId = req.user._id;
  order.status = 'accepted_by_driver'; // Custom intermediate status
  order.statusUpdates.push({ status: 'accepted_by_driver', description: `Driver ${req.user.name} accepted the delivery` });
  await order.save();

  const io = req.app.get('io');
  if (io) {
    io.to(order.restaurantId.toString()).emit('order_updated', {
      orderId: order._id, status: order.status
    });
    io.to(`order_${order._id}`).emit('order_status_changed', { status: order.status });
  }

  res.success(response, { data: order, message: 'Order accepted' });
});

export const driverPickupOrder = asyncHandler(async (req, response) => {
  const order = await Order.findOne({ _id: req.params.id, driverId: req.user._id });
  if (!order) throw new AppError('Order not found or not assigned to you', 404);

  order.status = 'picked_up';
  order.pickupTime = new Date();
  order.statusUpdates.push({ status: 'picked_up', description: `Order picked up by ${req.user.name}` });
  await order.save();

  const io = req.app.get('io');
  if (io) {
    io.to(order.restaurantId.toString()).emit('order_updated', {
      orderId: order._id, status: order.status
    });
    io.to(`order_${order._id}`).emit('order_status_changed', { status: order.status });
  }

  res.success(response, { data: order, message: 'Order picked up' });
});

export const driverDeliverOrder = asyncHandler(async (req, response) => {
  const order = await Order.findOne({ _id: req.params.id, driverId: req.user._id });
  if (!order) throw new AppError('Order not found or not assigned to you', 404);

  order.status = 'delivered';
  order.deliveryTime = new Date();
  order.statusUpdates.push({ status: 'delivered', description: `Order delivered by ${req.user.name}` });
  await order.save();

  const io = req.app.get('io');
  if (io) {
    io.to(order.restaurantId.toString()).emit('order_updated', {
      orderId: order._id, status: order.status
    });
    io.to(`order_${order._id}`).emit('order_status_changed', { status: order.status });
  }

  res.success(response, { data: order, message: 'Order delivered successfully' });
});
