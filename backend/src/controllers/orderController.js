import xss from 'xss';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import Table from '../models/Table.js';
import Payment from '../models/Payment.js';
import LoyaltyTransaction from '../models/LoyaltyTransaction.js';
import IdempotencyLock from '../models/IdempotencyLock.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { getTenantModel } from '../utils/tenant.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import * as res from '../utils/responseFormatter.js';
import { withOptimisticRetry } from '../utils/optimisticRetry.js';
import { triggerDelivery, getBestDeliveryQuote, cancelDelivery } from '../services/deliveryAggregatorService.js';
import { validateDeliveryDistance } from '../utils/distance.js';
import { buildOrderSocketPayload, syncDeliveryTracking } from '../services/deliverySyncService.js';
import { retrievePaymentIntent, refundPayment as refundStripePayment, chargeSavedCard } from '../services/stripeService.js';
import { calculateOrderPricing, roundMoney } from '../services/orderPricing.js';
import { sendOrderConfirmationEmail, sendInvoiceEmail } from '../services/emailService.js';
import { generateInvoiceHTML, generateKOTHTML } from '../services/documentService.js';
import { createNotification } from './notificationController.js';
import { sendPushNotification } from '../services/webPushService.js';
import { sendOrderAlert } from '../services/whatsappService.js';
import logger from '../utils/logger.js';

const CUSTOMER_PAYMENT_METHODS = ['credit_card', 'apple_pay', 'google_pay', 'stripe_online'];
const STRIPE_REFUND_PAYMENT_METHODS = ['credit_card', 'debit_card', 'apple_pay', 'google_pay', 'stripe_online'];

/**
 * pushPaymentEvent — safely appends a structured event to order.paymentEvents.
 * Does NOT call order.save() — caller is responsible for persistence.
 *
 * @param {Object} order  - Mongoose order document
 * @param {string} event  - event name from PaymentEventSchema enum
 * @param {Object} extras - optional { amount, stripeRefundId, stripePaymentIntentId, error, reason, triggeredBy, meta }
 */
const pushPaymentEvent = (order, event, extras = {}) => {
  if (!order || !order.paymentEvents) return;
  order.paymentEvents.push({
    event,
    timestamp: new Date(),
    amount: extras.amount ?? null,
    stripeRefundId: extras.stripeRefundId ?? null,
    stripePaymentIntentId: extras.stripePaymentIntentId ?? null,
    error: extras.error ?? null,
    reason: extras.reason ?? null,
    triggeredBy: extras.triggeredBy ?? 'system',
    meta: extras.meta ?? null
  });
};

const canManageRestaurant = (user, restaurantId) => {
  if (user.role === 'admin') return true;
  return user.restaurantId?.toString() === restaurantId?.toString();
};

const ensureCanManageRestaurant = (user, restaurantId) => {
  if (!canManageRestaurant(user, restaurantId)) {
    throw new AppError('You can only manage orders for your own restaurant', 403);
  }
};

export const rollbackLoyaltyPoints = async (order, reason = 'cancellation') => {
  if (!order.userId) return;
  if (order.loyaltyRollbackProcessed) return;

  const pointsUsed = order.loyaltyPointsUsed || 0;
  const pointsEarned = order.loyaltyPointsAwarded ? (order.loyaltyPointsEarned || 0) : 0;

  if (pointsUsed === 0 && pointsEarned === 0) {
    order.loyaltyRollbackProcessed = true;
    await order.save();
    return;
  }

  try {
    const tenantId = order.constructor.db.name;
    const UserModel = getTenantModel(tenantId, 'User');
    const LoyaltyTransactionModel = getTenantModel(tenantId, 'LoyaltyTransaction');

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

export const awardLoyaltyPoints = async (order) => {
  if (!order.userId) return;
  if (order.loyaltyPointsAwarded) return;
  if ((order.loyaltyPointsEarned || 0) <= 0) return;

  try {
    const tenantId = order.constructor.db.name;
    const OrderModel = getTenantModel(tenantId, 'Order');
    
    // Atomic guard: Only one thread will successfully set loyaltyPointsAwarded from false to true
    const updatedOrder = await OrderModel.findOneAndUpdate(
      { _id: order._id, loyaltyPointsAwarded: false },
      { $set: { loyaltyPointsAwarded: true } }
    );

    if (!updatedOrder) {
      // Points were already awarded concurrently
      return;
    }
    // Update local instance so the caller sees the new state
    order.loyaltyPointsAwarded = true;

    const UserModel = getTenantModel(tenantId, 'User');
    const LoyaltyTransactionModel = getTenantModel(tenantId, 'LoyaltyTransaction');

    const updatedUser = await UserModel.findByIdAndUpdate(
      order.userId,
      { $inc: { loyaltyPoints: order.loyaltyPointsEarned } },
      { new: true }
    );

    if (updatedUser) {
      await LoyaltyTransactionModel.create({
        userId: order.userId,
        orderId: order._id,
        type: 'earned',
        points: order.loyaltyPointsEarned,
        balanceAfter: updatedUser.loyaltyPoints,
        description: `Earned from Order #${order.orderNumber || order._id}`
      });

      await order.save();
      logger.info('Loyalty points awarded on delivery', { orderId: order._id, userId: order.userId, points: order.loyaltyPointsEarned });
    }
  } catch (err) {
    logger.error('Error awarding loyalty points', { orderId: order._id, error: err.message });
  }
};

const getPaymentModelForOrder = (order, getModel) => {
  if (typeof getModel === 'function') return getModel('Payment');
  const tenantId = order.constructor?.db?.name;
  return tenantId ? getTenantModel(tenantId, 'Payment') : Payment;
};

const issueStripeRefund = async (paymentIntentId, amount, idempotencyKey = null) => {
  if (paymentIntentId?.startsWith('pi_test_mock_') && process.env.NODE_ENV !== 'production') {
    return { id: `re_mock_${Date.now()}` };
  }
  return refundStripePayment(paymentIntentId, amount, { idempotencyKey });
};

const recordPaymentRefund = async ({ order, amount, reason, stripeRefundId, refundedBy = null, getModel }) => {
  const PaymentModel = getPaymentModelForOrder(order, getModel);
  const nextRefundedTotal = roundMoney((order.refundAmount || 0) + amount);
  const nextStatus = nextRefundedTotal >= roundMoney(order.total) ? 'refunded' : 'partially_refunded';

  const payment = await PaymentModel.findOneAndUpdate(
    { orderId: order._id },
    {
      $push: {
        refunds: {
          amount,
          reason,
          stripeRefundId,
          refundedBy
        }
      },
      $inc: { totalRefunded: amount },
      $set: { status: nextStatus }
    },
    { new: true }
  );

  if (!payment) {
    logger.warn('Payment record not found while recording refund', { orderId: order._id });
  }

  return { nextRefundedTotal, nextStatus };
};

export const processAutoRefund = async (order, reason, io, getModel) => {
  if (order.refunded || order.paymentStatus === 'refunded') {
    return { processed: false, skipped: true, reason: 'already_refunded' };
  }

  if (!['paid', 'partially_refunded'].includes(order.paymentStatus)) {
    return { processed: false, skipped: true, reason: 'not_paid' };
  }

  const remainingAmount = roundMoney((order.total || 0) - (order.refundAmount || 0));
  if (remainingAmount <= 0) {
    order.refunded = true;
    order.paymentStatus = 'refunded';
    await order.save();
    return { processed: false, skipped: true, reason: 'no_remaining_amount' };
  }

  if (!order.stripePaymentIntentId) {
    logger.error('Cannot auto-refund paid order without Stripe PaymentIntent', { orderId: order._id });
    return { processed: false, error: 'missing_stripe_payment_intent' };
  }

  // Log: auto_refund_triggered
  pushPaymentEvent(order, 'auto_refund_triggered', {
    amount: remainingAmount,
    stripePaymentIntentId: order.stripePaymentIntentId,
    reason,
    triggeredBy: 'system'
  });

  try {
    const refund = await issueStripeRefund(
      order.stripePaymentIntentId,
      remainingAmount,
      `auto-refund-${order._id}-${Math.round(remainingAmount * 100)}`
    );
    const { nextRefundedTotal, nextStatus } = await recordPaymentRefund({
      order,
      amount: remainingAmount,
      reason,
      stripeRefundId: refund.id,
      getModel
    });

    order.paymentStatus = nextStatus;
    order.refunded = nextStatus === 'refunded';
    order.refundAmount = nextRefundedTotal;
    order.refundReason = reason;
    order.statusUpdates.push({
      status: order.status,
      description: `Auto-refunded $${remainingAmount.toFixed(2)}: ${reason}`
    });

    // Log: auto_refund_succeeded
    pushPaymentEvent(order, 'auto_refund_succeeded', {
      amount: remainingAmount,
      stripeRefundId: refund.id,
      stripePaymentIntentId: order.stripePaymentIntentId,
      reason,
      triggeredBy: 'system'
    });

    await order.save();
    logger.info('Auto-refunded order', { orderId: order._id, refundAmount: remainingAmount, stripeRefundId: refund.id });
    return { processed: true, amount: remainingAmount, stripeRefundId: refund.id };
  } catch (stripeError) {
    // Log: auto_refund_failed
    pushPaymentEvent(order, 'auto_refund_failed', {
      amount: remainingAmount,
      stripePaymentIntentId: order.stripePaymentIntentId,
      error: stripeError.message,
      reason,
      triggeredBy: 'system'
    });
    await order.save().catch(saveErr =>
      logger.error('Failed to save auto_refund_failed event', { orderId: order._id, error: saveErr.message })
    );
    logger.error('Failed to auto-refund order', { orderId: order._id, error: stripeError.message });
    return { processed: false, error: stripeError.message };
  }
};

const verifyCardPayment = async ({ paymentMethod, stripePaymentIntentId, expectedTotal, userId }) => {
  if (!['credit_card', 'debit_card', 'apple_pay', 'google_pay', 'stripe_online'].includes(paymentMethod)) {
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
    const delivery = await triggerDelivery(order);
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
    const quote = await getBestDeliveryQuote(restaurant.address, address, subtotal || 10, scheduledTime);
    return {
      deliveryFee: roundMoney((quote.fee || 0) / 100),
      quote
    };
  } catch (err) {
    logger.warn('All delivery providers failed to return a quote', {
      restaurantId: restaurant._id,
      address,
      error: err.message
    });
    throw new AppError('Delivery is not available for this location. We cannot find a delivery partner for this address.', 400);
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
    stripePaymentIntentId, useLoyaltyPoints = false, savedCardId,
    customerPhone, customerName, customerEmail
  } = req.body;
  const platform = req.headers['x-platform'] || 'web';

  if (!restaurantId || !items?.length) {
    throw new AppError('restaurantId and items are required', 400);
  }

  // Prevent double-submit / accidental duplicate orders (15 seconds debounce) - ATOMIC LOCK
  try {
    await IdempotencyLock.create({ userId: req.user._id, restaurantId });
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError('You just placed an order. Please wait a moment before placing another one.', 429);
    }
    // If it's a different error, just log and allow the order to proceed rather than blocking checkout
    logger.warn('Failed to create idempotency lock', { error: error.message });
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

  // Accept both MongoDB ObjectId and slug (e.g. 'lassi-lounge')
  const isObjectId = /^[a-fA-F0-9]{24}$/.test(restaurantId);
  let restaurantCheck;
  if (isObjectId) {
    restaurantCheck = await Restaurant.findById(restaurantId);
  } else if (restaurantId === 'lassi-lounge') {
    restaurantCheck = await Restaurant.findOne({ name: { $regex: /^lassi lounge$/i } });
  } else {
    restaurantCheck = await Restaurant.findOne({ $or: [{ slug: restaurantId }, { name: restaurantId }] });
  }
  if (!restaurantCheck) {
    throw new AppError('Restaurant not found', 404);
  }
  // Normalize restaurantId to ObjectId string for all downstream operations
  const normalizedRestaurantId = restaurantCheck._id.toString();
  if (restaurantCheck.isActive === false) {
    throw new AppError('This restaurant is not accepting orders right now', 400);
  }

  // Geo-distance serviceability check for delivery orders
  if (orderType === 'delivery') {
    validateDeliveryDistance(restaurantCheck, addressLat, addressLng);
  }

  const prePricing = await calculateOrderPricing({
    restaurantId: normalizedRestaurantId,
    items,
    orderType,
    tip,
    couponCode,
    userId: req.user._id,
    useLoyaltyPoints,
    paymentMethod,
    getModel: req.getModel
  });

  let deliveryFeeOverride = null;
  let deliveryProviderOverride = null;

  if (stripePaymentIntentId) {
    const paymentIntent = await retrievePaymentIntent(stripePaymentIntentId);
    if (paymentIntent.metadata?.deliveryFee !== undefined) {
      deliveryFeeOverride = Number(paymentIntent.metadata.deliveryFee);
    }
    if (paymentIntent.metadata?.deliveryProvider) {
      deliveryProviderOverride = paymentIntent.metadata.deliveryProvider;
    }
  }

  const deliveryQuote = (orderType === 'delivery' && deliveryFeeOverride === null)
    ? await getTrustedDeliveryQuote({
      restaurant: prePricing.restaurant,
      address,
      subtotal: prePricing.subtotal,
      scheduledTime
    })
    : { deliveryFee: deliveryFeeOverride || 0, quote: { provider: deliveryProviderOverride } };

  const pricing = await calculateOrderPricing({
    restaurantId: normalizedRestaurantId,
    items,
    orderType,
    tip,
    couponCode,
    userId: req.user._id,
    useLoyaltyPoints,
    paymentMethod,
    deliveryFeeOverride: deliveryQuote.deliveryFee,
    getModel: req.getModel
  });

  const { restaurant } = pricing;
  let finalStripePaymentIntentId = stripePaymentIntentId;

  if (savedCardId && !finalStripePaymentIntentId && paymentMethod === 'credit_card') {
    if (!req.user.stripeCustomerId) {
      throw new AppError('No Stripe customer associated with this user', 400);
    }

    const savedCard = req.user.savedCards?.find(c => c._id.toString() === savedCardId || c.cardId === savedCardId);
    if (!savedCard) {
      throw new AppError('Saved card not found in your profile', 400);
    }
    const stripePaymentMethodId = savedCard.cardId;

    const charge = await chargeSavedCard(pricing.total, req.user.stripeCustomerId, stripePaymentMethodId, {
      userId: req.user._id.toString(),
      tenantDbName: req.tenantDb?.name || 'daas_poc'
    });
    finalStripePaymentIntentId = charge.id;
  }

  const { paymentStatus } = await verifyCardPayment({
    paymentMethod,
    stripePaymentIntentId: finalStripePaymentIntentId,
    expectedTotal: pricing.total,
    userId: req.user._id
  });

  // Track whether the order document has been persisted to DB.
  // Used in the catch block to decide between orphan-cleanup vs. simple refund.
  let savedOrder = null;
  const session = await Order.startSession();
  session.startTransaction();

  try {
    // If the user's phone was the dummy '0000000000' or missing, and a valid phone was provided at checkout, save it to their profile.
    if (customerPhone && (!req.user.phone || req.user.phone === '0000000000') && customerPhone !== '0000000000') {
      await User.findByIdAndUpdate(req.user._id, { phone: customerPhone }, { session });
    }

    const order = new Order({
    userId: req.user._id,
    orderSource: platform,
    customerName: customerName || req.user.name,
    customerPhone: customerPhone || req.user.phone || '0000000000',
    customerEmail: customerEmail || req.user.email,
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
    stripePaymentIntentId: finalStripePaymentIntentId || null,
    deliveryProvider: deliveryQuote.quote?.provider || 'doordash',
    status: restaurant.autoAcceptOrders ? 'accepted' : 'pending',
    statusUpdates: [
      { status: 'pending', description: 'Order placed by customer', timestamp: new Date() },
      ...(restaurant.autoAcceptOrders ? [{ status: 'accepted', description: 'Order auto-accepted by restaurant', timestamp: new Date() }] : [])
    ]
  });

  await order.save({ session });
  savedOrder = order; // Mark as persisted — catch block will use this to clean up properly

  // Log: order_saved + payment_confirmed
  pushPaymentEvent(order, 'order_saved', {
    stripePaymentIntentId: finalStripePaymentIntentId,
    meta: { orderNumber: order.orderNumber }
  });
  if (finalStripePaymentIntentId && paymentStatus === 'paid') {
    pushPaymentEvent(order, 'payment_confirmed', {
      amount: pricing.total,
      stripePaymentIntentId: finalStripePaymentIntentId,
      triggeredBy: 'customer'
    });
  }
  await order.save({ session }); // persist events

  if (order.orderType === 'dine_in' && order.tableNumber) {
    const table = await Table.findOneAndUpdate(
      { restaurantId: restaurant._id, tableNumber: order.tableNumber },
      {
        status: 'occupied',
        currentOrderId: order._id,
        occupiedAt: new Date()
      },
      { new: true, session }
    ).populate('currentOrderId', 'orderNumber status subtotal items');

    if (table) {
      const io = req.app.get('io');
      if (io) io.to(restaurant._id.toString()).emit('table_update', table);
    }
  }

  await Payment.create([{
    orderId: order._id,
    userId: req.user._id,
    restaurantId: restaurant._id,
    method: paymentMethod,
    status: paymentStatus,
    amount: order.total,
    tip: order.tip,
    stripePaymentIntentId: finalStripePaymentIntentId || null,
    metadata: {
      orderNumber: order.orderNumber,
      platformFee: order.platformFee,
      serviceFee: order.serviceFee,
      deliveryFee: order.deliveryFee,
      discount: order.discount,
      loyaltyDiscount: order.loyaltyDiscount
    }
  }], { session });

  // Mark coupon usage atomically
  if (pricing.coupon) {
    const CouponModel = req.getModel('Coupon');
    const updateQuery = { _id: pricing.coupon._id };
    if (pricing.coupon.maxUses) {
      updateQuery.usedCount = { $lt: pricing.coupon.maxUses };
    }
    
    const updatedCoupon = await CouponModel.findOneAndUpdate(
      updateQuery,
      {
        $inc: { usedCount: 1 },
        $push: { usedBy: { userId: req.user._id } }
      },
      { new: true, session }
    );

    if (!updatedCoupon) {
      throw new AppError('Sorry, this coupon just reached its usage limit.', 400);
    }
  }

  // Handle loyalty points: deduct used, add earned
  if (pricing.pointsUsed > 0) {
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user._id, loyaltyPoints: { $gte: pricing.pointsUsed } },
      { $inc: { loyaltyPoints: -pricing.pointsUsed } },
      { new: true, session }
    );
    if (!updatedUser) {
      throw new AppError('Insufficient loyalty points to complete this order.', 400);
    }
    await LoyaltyTransaction.create([{
      userId: req.user._id,
      orderId: order._id,
      type: 'redeemed',
      points: -pricing.pointsUsed,
      balanceAfter: updatedUser.loyaltyPoints,
      description: `Redeemed on Order #${order.orderNumber}`
    }], { session });
  }

  await session.commitTransaction();
  session.endSession();

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

    if (req.user.email && req.user.notificationPreferences?.email !== false) {
      sendOrderConfirmationEmail(req.user.email, order).catch(() => { });
    }

    // ── TRIGGER BACKGROUND NOTIFICATIONS ──────────────────────────────────────
    try {
      await sendPushNotification(restaurant, {
        title: 'New Order Request',
        body: `${order.customerName} placed a new ${order.orderType} order! Total: $${order.total.toFixed(2)}`,
        url: `/merchant/orders/${order._id}`
      });
      await sendOrderAlert(restaurant, order);
    } catch (notifErr) {
      console.error('Error sending background notifications:', notifErr);
    }

    res.created(response, { data: order });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    if (finalStripePaymentIntentId) {
      try {
        if (savedOrder) {
          // Order already persisted — mark it as 'failed' so it is visible in merchant
          // All Orders view and audit trails rather than becoming an invisible orphan.
          savedOrder.status = 'failed';
          savedOrder.statusUpdates.push({
            status: 'failed',
            description: `Order creation failed after payment: ${error.message}`
          });
          savedOrder.paymentStatus = 'refunded';
          savedOrder.refunded = true;
          savedOrder.refundAmount = pricing.total;
          savedOrder.refundReason = 'order_creation_failed';

          // Log: order_creation_failed
          pushPaymentEvent(savedOrder, 'order_creation_failed', {
            amount: pricing.total,
            stripePaymentIntentId: finalStripePaymentIntentId,
            error: error.message,
            triggeredBy: 'system'
          });
          // Log: auto_refund_triggered
          pushPaymentEvent(savedOrder, 'auto_refund_triggered', {
            amount: pricing.total,
            stripePaymentIntentId: finalStripePaymentIntentId,
            reason: 'order_creation_failed',
            triggeredBy: 'system'
          });

          await savedOrder.save().catch(saveErr =>
            logger.error('Failed to mark orphaned order as failed', { orderId: savedOrder._id, error: saveErr.message })
          );
          logger.warn('Order saved but post-save step failed — marked as failed in DB', {
            orderId: savedOrder._id,
            error: error.message
          });
        }

        // Issue Stripe refund with correct signature
        try {
          const refund = await refundStripePayment(
            finalStripePaymentIntentId,
            pricing.total,
            { idempotencyKey: `order-creation-failed-${finalStripePaymentIntentId}` }
          );
          logger.info(`Auto-refunded failed order payment: ${finalStripePaymentIntentId}`, { stripeRefundId: refund.id });

          if (savedOrder) {
            pushPaymentEvent(savedOrder, 'auto_refund_succeeded', {
              amount: pricing.total,
              stripeRefundId: refund.id,
              stripePaymentIntentId: finalStripePaymentIntentId,
              reason: 'order_creation_failed',
              triggeredBy: 'system'
            });
            await savedOrder.save().catch(saveErr =>
              logger.error('Failed to save auto_refund_succeeded event on failed order', { orderId: savedOrder._id, error: saveErr.message })
            );

            // Also record the refund in the Payment collection if it was created
            try {
              await recordPaymentRefund({
                order: savedOrder,
                amount: pricing.total,
                reason: 'order_creation_failed',
                stripeRefundId: refund.id,
                getModel: req.getModel
              });
            } catch (paymentRecordErr) {
              logger.warn('Could not record refund in Payment collection for failed order', {
                orderId: savedOrder._id,
                error: paymentRecordErr.message
              });
            }
          } else {
            // No savedOrder, log orphaned auto-refund success to global audit log
            await AuditLog.create({
              restaurantId: restaurant._id,
              userId: req.user._id,
              event: 'auto_refund_succeeded',
              severity: 'info',
              message: `Order DB creation failed. Successfully auto-refunded orphaned payment. Error that caused checkout failure: ${error.message}`,
              metadata: {
                paymentIntentId: finalStripePaymentIntentId,
                amount: pricing.total,
                refundId: refund.id,
                error: error.message,
                customerName: req.user.name,
                customerEmail: req.user.email
              }
            });
          }
        } catch (refundError) {
          logger.error(`Failed to auto-refund after order creation error: ${refundError.message}`, {
            paymentIntentId: finalStripePaymentIntentId
          });
          if (savedOrder) {
            pushPaymentEvent(savedOrder, 'auto_refund_failed', {
              amount: pricing.total,
              stripePaymentIntentId: finalStripePaymentIntentId,
              error: refundError.message,
              reason: 'order_creation_failed',
              triggeredBy: 'system'
            });
            await savedOrder.save().catch(() => {});
          } else {
            // No savedOrder, log orphaned auto-refund failure to global audit log
            await AuditLog.create({
              restaurantId: restaurant._id,
              userId: req.user._id,
              event: 'auto_refund_failed',
              severity: 'critical',
              message: `Failed to auto-refund orphaned payment after order creation error. Manual intervention required. Refund error: ${refundError.message}`,
              metadata: {
                paymentIntentId: finalStripePaymentIntentId,
                amount: pricing.total,
                checkoutError: error.message,
                refundError: refundError.message,
                customerName: req.user.name,
                customerEmail: req.user.email
              }
            });
          }
        }
      } catch (err) {
        logger.error('Error during automatic refund chain', { error: err.message });
      }
    }

    if (!savedOrder && finalStripePaymentIntentId) {
      // Log the initial checkout failure that caused the whole rollback chain
      await AuditLog.create({
        restaurantId: restaurant._id,
        userId: req.user._id,
        event: 'checkout_failed',
        severity: 'critical',
        message: `Order DB creation failed after successful Stripe charge. Rollback initiated. Error: ${error.message}`,
        metadata: {
          paymentIntentId: finalStripePaymentIntentId,
          error: error.message,
          customerName: req.user.name,
          customerEmail: req.user.email,
          items: pricing.orderItems
        }
      });
    }

    throw error;
  }
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
  const order = await Order.findById(req.params.id).populate('restaurantId');
  if (!order) throw new AppError('Order not found', 404);

  // Customer can only see their own orders; merchant/admin can see restaurant orders
  if (req.user.role === 'customer' && order.userId?.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to view this order', 403);
  }
  if (req.user.role === 'merchant') {
    ensureCanManageRestaurant(req.user, order.restaurantId._id || order.restaurantId);
  }

  await syncDeliveryTracking(order);

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
    cancelDelivery(order, 'Cancelled by customer').catch(err => {
      logger.warn('DoorDash cancellation failed during customer cancel', {
        orderId: order._id,
        error: err.response?.data || err.message
      });
    });
  }

  order.status = 'cancelled';
  order.statusUpdates.push({ status: 'cancelled', description: 'Cancelled by customer' });
  await order.save();

  const io = req.app.get('io');
  processAutoRefund(order, 'Cancelled by customer', io, req.getModel).catch(err => logger.error('Auto refund error', err));

  await rollbackLoyaltyPoints(order, 'customer_cancel');

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
    io.to(`order_${order._id}`).emit('order_status_changed', buildOrderSocketPayload(order));
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

  // Accept both MongoDB ObjectId and slug (e.g. 'lassi-lounge')
  const isObjectId = /^[a-fA-F0-9]{24}$/.test(restaurantId);
  let restaurant;
  if (isObjectId) {
    restaurant = await Restaurant.findById(restaurantId);
  } else if (restaurantId === 'lassi-lounge') {
    restaurant = await Restaurant.findOne({ name: { $regex: /^lassi lounge$/i } });
  } else {
    restaurant = await Restaurant.findOne({ $or: [{ slug: restaurantId }, { name: restaurantId }] });
  }
  if (!restaurant) throw new AppError('Restaurant not found', 404);

  // ── Geo-distance serviceability check ──
  validateDeliveryDistance(restaurant, addressLat, addressLng);

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
  let order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  ensureCanManageRestaurant(req.user, order.restaurantId);

  const allowedTransitions = {
    pending: ['accepted', 'cancelled'],
    accepted: ['driver_assigned', 'preparing', 'cancelled'],
    driver_assigned: ['preparing', 'ready', 'picked_up', 'cancelled'],
    preparing: ['driver_assigned', 'ready', 'cancelled'],
    ready: ['driver_assigned', 'picked_up', 'cancelled'],
    picked_up: ['delivered'],
    delivered: [],
    cancelled: [],
    failed: []
  };

  let finalStatus = status;
  const { doc: finalOrder } = await withOptimisticRetry(order, async (doc) => {
    if (!status) {
      if (doc.status === 'pending') finalStatus = 'accepted';
      else if (doc.status === 'accepted') finalStatus = 'preparing';
      else if (doc.status === 'preparing') finalStatus = 'ready';
      else if (doc.status === 'ready') finalStatus = 'picked_up';
      else if (doc.status === 'picked_up') finalStatus = 'delivered';
      else finalStatus = doc.status;
    } else {
      finalStatus = status;
    }

    if (!allowedTransitions[doc.status]?.includes(finalStatus)) {
      throw new AppError(`Cannot change order from ${doc.status} to ${finalStatus}`, 400);
    }
    if (finalStatus === 'accepted' && ['credit_card', 'debit_card', 'apple_pay', 'google_pay', 'stripe_online'].includes(doc.paymentMethod) && doc.paymentStatus !== 'paid') {
      throw new AppError('Card orders must be paid before acceptance', 400);
    }

    doc.status = finalStatus;
    doc.statusUpdates.push({ status: finalStatus, description: `Status updated to ${finalStatus}` });
  });

  status = finalStatus;
  order = finalOrder;
  if (status === 'accepted') {
    createDoorDashDeliveryForOrder(order).catch(err => logger.error('DoorDash background error', err));
  } else if (status === 'cancelled') {
    rollbackLoyaltyPoints(order, 'status_update_cancel').catch(err => logger.error('Rollback points error', err));
    const io = req.app.get('io');
    processAutoRefund(order, 'Cancelled by restaurant', io, req.getModel).catch(err => logger.error('Auto refund error', err));
    if (order.deliveryId) {
      cancelDelivery(order, 'Cancelled via status update').catch(err => logger.error('DoorDash cancel error', err));
    }
  } else if (status === 'delivered' || status === 'picked_up') {
    awardLoyaltyPoints(order).catch(err => logger.error('Award points error', err));
    if (order.customerEmail) {
      const Payment = req.getModel('Payment');
      Payment.findOne({ orderId: order._id }).lean().then(payment => {
        sendInvoiceEmail(order.customerEmail, order, payment).catch(err => logger.error('Auto invoice email error', err));
      }).catch(() => {});
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
  if (['credit_card', 'debit_card', 'apple_pay', 'google_pay', 'stripe_online'].includes(order.paymentMethod) && order.paymentStatus !== 'paid') {
    throw new AppError('Card orders must be paid before acceptance', 400);
  }

  order.status = 'accepted';
  order.statusUpdates.push({ status: 'accepted', description: 'Order accepted by restaurant' });
  await order.save();
  createDoorDashDeliveryForOrder(order).catch(err => logger.error('DoorDash background error', err));

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
  order.statusUpdates.push({ status: 'cancelled', description: xss(String(req.body.reason || '')) || 'Rejected by restaurant' });
  if (order.deliveryId) {
    try {
      await cancelDelivery(order, xss(String(req.body.reason || '')) || 'Rejected by restaurant');
    } catch (err) {
      logger.warn('DoorDash cancellation failed during restaurant reject', {
        orderId: order._id,
        error: err.response?.data || err.message
      });
    }
  }
  await order.save();

  const io = req.app.get('io');
  await processAutoRefund(order, xss(String(req.body.reason || '')) || 'Rejected by restaurant', io, req.getModel);

  await rollbackLoyaltyPoints(order, 'restaurant_reject');

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
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  if (req.user.role === 'merchant') {
    ensureCanManageRestaurant(req.user, order.restaurantId);
  }

  const { amount } = req.body;
  const reason = req.body.reason ? xss(String(req.body.reason)) : undefined;
  const refundAmount = roundMoney(amount || order.total);
  const nextRefundedTotal = roundMoney((order.refundAmount || 0) + refundAmount);
  if (refundAmount <= 0 || nextRefundedTotal > roundMoney(order.total)) {
    throw new AppError('Invalid refund amount', 400);
  }

  let stripeRefundId = null;
  const isStripePayment = STRIPE_REFUND_PAYMENT_METHODS.includes(order.paymentMethod);
  if (isStripePayment && ['paid', 'partially_refunded'].includes(order.paymentStatus) && !order.stripePaymentIntentId) {
    throw new AppError('Cannot refund this card payment because Stripe payment reference is missing', 400);
  }

  if (order.stripePaymentIntentId && ['paid', 'partially_refunded'].includes(order.paymentStatus)) {
    // Prevent double-click accidental double-refunds via state-based idempotency key
    const idempotencyKey = req.body.idempotencyKey || `manual-refund-${order._id}-${Math.round((order.refundAmount || 0) * 100)}-${Math.round(refundAmount * 100)}`;
    const refund = await issueStripeRefund(order.stripePaymentIntentId, refundAmount, idempotencyKey);
    stripeRefundId = refund.id;
  }

  await recordPaymentRefund({
    order,
    amount: refundAmount,
    reason: reason || 'Refund processed',
    stripeRefundId,
    refundedBy: req.user._id,
    getModel: req.getModel
  });

  order.refunded = nextRefundedTotal >= roundMoney(order.total);
  order.refundAmount = nextRefundedTotal;
  order.refundReason = reason || 'Refund processed';
  order.paymentStatus = order.refundAmount >= order.total ? 'refunded' : 'partially_refunded';

  // Auto-cancel active orders if fully refunded
  if (order.paymentStatus === 'refunded' && !['delivered', 'cancelled'].includes(order.status)) {
    order.status = 'cancelled';
    order.statusUpdates.push({
      status: 'cancelled',
      description: 'Order cancelled automatically due to full refund'
    });
  }

  order.statusUpdates.push({
    status: order.status,
    description: `Refund of $${refundAmount.toFixed(2)} processed`
  });
  await order.save();

  if (order.paymentStatus === 'refunded') {
    await rollbackLoyaltyPoints(order, 'order_refund');
  }

  // Send Notification
  if (order.userId) {
    const io = req.app.get('io');
    await createNotification(
      order.userId,
      'Refund Processed',
      `Your refund of $${refundAmount.toFixed(2)} has been processed.`,
      'order_update',
      `/orders/${order._id}`,
      io,
      req.getModel
    );
  }

  // Emit Socket Event
  const io = req.app.get('io');
  if (io) {
    io.to(`order_${order._id}`).emit('order_status_changed', buildOrderSocketPayload(order));

    // Also notify the restaurant room so the merchant dashboard order list updates in real-time
    io.to(order.restaurantId.toString()).emit('order_updated', {
      orderId: order._id,
      status: order.status,
      paymentStatus: order.paymentStatus
    });
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
    io.to(`order_${order._id}`).emit('order_status_changed', buildOrderSocketPayload(order));
  }

  res.success(response, { data: order, message: `Simulated → ${nextStatus}` });
});

// ── Review Reply ────────────────────────────────────────────────────────────

export const replyToReview = asyncHandler(async (req, response) => {
  const { reply } = req.body;
  if (!reply) throw new AppError('Reply content is required', 400);

  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);

  ensureCanManageRestaurant(req.user, order.restaurantId);

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
    io.to(`order_${order._id}`).emit('order_status_changed', buildOrderSocketPayload(order));
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
    io.to(`order_${order._id}`).emit('order_status_changed', buildOrderSocketPayload(order));
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
    io.to(`order_${order._id}`).emit('order_status_changed', buildOrderSocketPayload(order));
  }

  if (order.customerEmail) {
    const Payment = req.getModel('Payment');
    Payment.findOne({ orderId: order._id }).lean().then(payment => {
      sendInvoiceEmail(order.customerEmail, order, payment).catch(err => logger.error('Auto invoice email error (driver)', err));
    }).catch(() => {});
  }

  res.success(response, { data: order, message: 'Order delivered successfully' });
});

export const addAdminNote = asyncHandler(async (req, response) => {
  const Order = req.getModel('Order');
  const text = req.body.text ? xss(String(req.body.text)) : null;
  if (!text) throw new AppError('Note text is required', 400);

  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);

  // Author logic: if user has a name use it, else default to 'Admin/Staff'
  const author = req.user?.name || (req.user?.role === 'admin' ? 'Admin' : 'Kitchen');

  order.adminNotes.push({
    text,
    author,
    timestamp: new Date()
  });

  await order.save();

  // Notify clients if needed (optional)
  const io = req.app.get('io');
  if (io) {
    io.to(order.restaurantId.toString()).emit('order_updated', {
      orderId: order._id
    });
  }

  res.success(response, { data: order, message: 'Note added successfully' });
});

export const remakeOrder = asyncHandler(async (req, response) => {
  const tenantId = req.user.tenantId || req.user.restaurantId?.toString(); // fallback if tenantId missing
  const OrderModel = getTenantModel(tenantId, 'Order');
  const PaymentModel = getTenantModel(tenantId, 'Payment');
  const order = await OrderModel.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  ensureCanManageRestaurant(req.user, order.restaurantId);
  
  // Create duplicate remake order with $0 cost
  const remake = new OrderModel({
    ...order.toObject(),
    _id: undefined,
    orderNumber: undefined,
    createdAt: undefined,
    updatedAt: undefined,
    status: 'pending',
    statusUpdates: [{ status: 'pending', timestamp: new Date(), comment: 'Remake order created' }],
    total: 0,
    subtotal: 0,
    tax: 0,
    deliveryFee: 0,
    tip: 0,
    paymentStatus: 'paid',
    adminNotes: [{ text: 'Remake of order ' + order._id, author: 'Merchant', timestamp: new Date() }]
  });
  await remake.save();

  await PaymentModel.create([{
    orderId: remake._id,
    userId: remake.userId || req.user._id,
    restaurantId: remake.restaurantId,
    method: remake.paymentMethod || 'cash',
    status: 'completed',
    amount: 0,
    tip: 0,
    metadata: {
      orderNumber: remake.orderNumber,
      remakeOf: order._id
    }
  }]);

  const io = req.app.get('io');
  if (io) {
    const payload = buildOrderSocketPayload(remake);
    io.to(remake.restaurantId.toString()).emit('new_order', payload);
  }

  res.success(response, { data: remake, message: 'Remake order created' });
});

export const sendInvoice = asyncHandler(async (req, response) => {
  const tenantId = req.user.tenantId || req.user.restaurantId?.toString();
  const OrderModel = getTenantModel(tenantId, 'Order');
  const order = await OrderModel.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  ensureCanManageRestaurant(req.user, order.restaurantId);
  
  if (order.customerEmail) {
    try {
      await sendInvoiceEmail(order.customerEmail, order);
    } catch (err) {
      logger.error(`Failed to send invoice email for order ${order._id}:`, err);
    }
  } else {
    logger.warn(`Cannot send invoice for order ${order._id}: no customer email found`);
  }
  
  res.success(response, { data: null, message: 'Invoice sent successfully' });
});

// ── Payment Events Audit Trail ───────────────────────────────────────────────

/**
 * @desc    Get payment event audit log for an order
 * @route   GET /api/orders/:id/payment-events
 * @access  Private (merchant, admin)
 */
export const getPaymentEvents = asyncHandler(async (req, response) => {
  const Order = req.getModel('Order');
  const order = await Order.findById(req.params.id).select('paymentEvents statusUpdates orderNumber paymentStatus refunded refundAmount refundReason stripePaymentIntentId').lean();
  if (!order) throw new AppError('Order not found', 404);

  // Merge paymentEvents + statusUpdates into a unified chronological audit log
  const paymentEvts = (order.paymentEvents || []).map(ev => ({
    type: 'payment_event',
    event: ev.event,
    timestamp: ev.timestamp,
    amount: ev.amount,
    stripeRefundId: ev.stripeRefundId,
    stripePaymentIntentId: ev.stripePaymentIntentId,
    error: ev.error,
    reason: ev.reason,
    triggeredBy: ev.triggeredBy,
    meta: ev.meta
  }));

  const statusEvts = (order.statusUpdates || []).map(su => ({
    type: 'status_update',
    event: 'status_change',
    timestamp: su.timestamp,
    status: su.status,
    description: su.description
  }));

  const unified = [...paymentEvts, ...statusEvts].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  res.success(response, {
    data: {
      orderId: req.params.id,
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      refunded: order.refunded,
      refundAmount: order.refundAmount,
      refundReason: order.refundReason,
      stripePaymentIntentId: order.stripePaymentIntentId,
      events: unified
    }
  });
});

// ── Document Generation (Invoice & KOT) ────────────────────────────────────

/**
 * @desc    Generate and serve standalone Invoice HTML
 * @route   GET /api/orders/:id/invoice
 * @access  Private (merchant, admin)
 */
export const getInvoiceDocument = asyncHandler(async (req, response) => {
  const Order = req.getModel('Order');
  const Payment = req.getModel('Payment');

  const order = await Order.findById(req.params.id).lean();
  if (!order) throw new AppError('Order not found', 404);
  ensureCanManageRestaurant(req.user, order.restaurantId);

  const payment = await Payment.findOne({ orderId: order._id }).lean();

  const html = generateInvoiceHTML(order, payment);
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; script-src-attr 'unsafe-inline';");
  response.send(html);
});

/**
 * @desc    Generate and serve standalone KOT (Kitchen Order Ticket) HTML
 * @route   GET /api/orders/:id/kot
 * @access  Private (merchant, admin)
 */
export const getKOTDocument = asyncHandler(async (req, response) => {
  const Order = req.getModel('Order');

  const order = await Order.findById(req.params.id).lean();
  if (!order) throw new AppError('Order not found', 404);
  ensureCanManageRestaurant(req.user, order.restaurantId);

  const html = generateKOTHTML(order);
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; script-src-attr 'unsafe-inline';");
  response.send(html);
});
