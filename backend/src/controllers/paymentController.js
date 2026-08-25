import { createPaymentIntent, createSetupIntent as createStripeSetupIntent, handleWebhook, createCustomer, updateCustomer, createEphemeralKey } from '../services/stripeService.js';
import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';
import { calculateOrderPricing } from '../services/orderPricing.js';
import { getBestDeliveryQuote } from '../services/deliveryAggregatorService.js';
import { validateDeliveryDistance } from '../utils/distance.js';
import { AppError } from '../middleware/errorHandler.js';

const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

const getTrustedDeliveryQuoteForPayment = async ({ restaurant, address, subtotal, scheduledTime }) => {
  if (!address) return { fee: 0, provider: null };
  try {
    const quote = await getBestDeliveryQuote(restaurant.address, address, subtotal || 10, scheduledTime);
    return { fee: roundMoney((quote.fee || 0) / 100), provider: quote.provider };
  } catch (err) {
    // Shipday does not have a dynamic quote API. Fallback to the restaurant's fixed delivery fee.
    return { fee: roundMoney(restaurant.deliveryFee || 0), provider: null };
  }
};

/**
 * @desc    create a Stripe Payment Intent
 * @route   POST /api/payments/create-intent
 * @access  Private
 */
export const createIntent = asyncHandler(async (req, res) => {
  // support both flat payload and legacy nested { checkoutData: {...} } format
  const body = req.body.checkoutData
    ? { ...req.body, ...req.body.checkoutData }
    : req.body;

  const { amount, orderId, restaurantId, items, orderType, tip, couponCode, useLoyaltyPoints, address, addressLat, addressLng, scheduledTime, paymentMethod, customerPhone, customerName, customerEmail } = body;

  logger.info('createIntent called', { restaurantId, orderType, itemCount: items?.length, amount });

  let verifiedAmount = Number(amount);
  const metadata = {};
  if (orderId) metadata.orderId = orderId.toString();

  let stripeCustomerId = req.user?.stripeCustomerId || null;
  if (req.user && !stripeCustomerId) {
    try {
      const customer = await createCustomer(customerEmail || req.user.email, customerName || req.user.name || 'DaaS User', { userId: req.user._id.toString() }, customerPhone || req.user.phone);
      stripeCustomerId = customer.id;
      req.user.stripeCustomerId = stripeCustomerId;
      await req.user.save();
    } catch (err) {
      logger.warn('Failed to create stripe customer during createIntent', err);
    }
  } else if (stripeCustomerId && customerPhone && customerPhone !== '0000000000') {
    try {
      await updateCustomer(stripeCustomerId, { phone: customerPhone });
    } catch (err) {
      logger.warn('Failed to update stripe customer phone', err);
    }
  }

  if (req.user?._id) metadata.userId = req.user._id.toString();
  if (req.tenantDb?.name) metadata.tenantDbName = req.tenantDb.name;
  // safety fallback: always ensure tenantDbName is set so Stripe webhooks write to the correct DB.
  if (!metadata.tenantDbName) {
    metadata.tenantDbName = process.env.FORCE_TENANT_DB_NAME || 'daas_poc_lassi_lounge';
  }

  if (restaurantId && items?.length) {
    const prePricing = await calculateOrderPricing({
      restaurantId,
      items,
      orderType,
      tip,
      couponCode,
      userId: req.user?._id,
      useLoyaltyPoints,
      paymentMethod,
      getModel: req.getModel
    });

    if (orderType === 'delivery') {
      validateDeliveryDistance(prePricing.restaurant, addressLat, addressLng);
    }

    const deliveryQuoteObj = orderType === 'delivery'
      ? await getTrustedDeliveryQuoteForPayment({
        restaurant: prePricing.restaurant,
        address,
        subtotal: prePricing.subtotal,
        scheduledTime
      })
      : null;

    const deliveryFeeOverride = deliveryQuoteObj ? deliveryQuoteObj.fee : null;

    const pricing = await calculateOrderPricing({
      restaurantId,
      items,
      orderType,
      tip,
      couponCode,
      userId: req.user?._id,
      useLoyaltyPoints,
      deliveryFeeOverride,
      paymentMethod,
      getModel: req.getModel
    });

    verifiedAmount = pricing.total;
    metadata.restaurantId = restaurantId.toString();
    if (deliveryQuoteObj) {
      metadata.deliveryFee = deliveryQuoteObj.fee;
      metadata.deliveryProvider = deliveryQuoteObj.provider || 'doordash';
    }
  }

  if (!verifiedAmount || verifiedAmount <= 0) {
    res.status(400);
    throw new Error('Amount is required');
  }

  let paymentIntent;
  try {
    paymentIntent = await createPaymentIntent(verifiedAmount, metadata, stripeCustomerId);
  } catch (err) {
    if (err.message && err.message.includes('No such customer')) {
      logger.warn(`Stripe customer ${stripeCustomerId} not found. Auto-recreating for seamless dev...`);
      stripeCustomerId = null;
      if (req.user) {
        try {
          const customer = await createCustomer(customerEmail || req.user.email, customerName || req.user.name || 'DaaS User', { userId: req.user._id.toString() }, customerPhone || req.user.phone);
          stripeCustomerId = customer.id;
          req.user.stripeCustomerId = stripeCustomerId;
          await req.user.save();
        } catch (createErr) {
          logger.warn('Failed to recreate stripe customer', createErr);
        }
      }
      paymentIntent = await createPaymentIntent(verifiedAmount, metadata, stripeCustomerId);
    } else {
      throw err;
    }
  }
  let ephemeralKey = null;
  if (stripeCustomerId) {
    try {
      ephemeralKey = await createEphemeralKey(stripeCustomerId);
    } catch (err) {
      logger.warn('Failed to create ephemeral key for payment intent', err);
    }
  }

  res.status(200).json({
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: verifiedAmount,
      ephemeralKey: ephemeralKey?.secret,
      customerId: stripeCustomerId
    },
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: verifiedAmount,
    ephemeralKey: ephemeralKey?.secret,
    customerId: stripeCustomerId
  });
});

/**
 * @desc    create a Stripe Setup Intent (for saving cards)
 * @route   POST /api/payments/create-setup-intent
 * @access  Private
 */
export const createSetupIntent = asyncHandler(async (req, res) => {
  const metadata = {
    userId: req.user?._id?.toString()
  };
  if (req.tenantDb?.name) {
    metadata.tenantDbName = req.tenantDb.name;
  }

  let stripeCustomerId = req.user?.stripeCustomerId || null;
  if (req.user && !stripeCustomerId) {
    try {
      const customer = await createCustomer(req.user.email, req.user.name || 'DaaS User', { userId: req.user._id.toString() }, req.user.phone);
      stripeCustomerId = customer.id;
      req.user.stripeCustomerId = stripeCustomerId;
      await req.user.save();
    } catch (err) {
      logger.warn('Failed to create stripe customer during createSetupIntent', err);
    }
  }

  let setupIntent;
  try {
    setupIntent = await createStripeSetupIntent(metadata, stripeCustomerId);
  } catch (err) {
    if (err.message && err.message.includes('No such customer')) {
      logger.warn(`Stripe customer ${stripeCustomerId} not found. Auto-recreating for seamless dev...`);
      stripeCustomerId = null;
      if (req.user) {
        try {
          const customer = await createCustomer(req.user.email, req.user.name || 'DaaS User', { userId: req.user._id.toString() }, req.user.phone);
          stripeCustomerId = customer.id;
          req.user.stripeCustomerId = stripeCustomerId;
          await req.user.save();
        } catch (createErr) {
          logger.warn('Failed to recreate stripe customer', createErr);
        }
      }
      setupIntent = await createStripeSetupIntent(metadata, stripeCustomerId);
    } else {
      throw err;
    }
  }
  let ephemeralKey = null;
  if (stripeCustomerId) {
    try {
      ephemeralKey = await createEphemeralKey(stripeCustomerId);
    } catch (err) {
      logger.warn('Failed to create ephemeral key', err);
    }
  }

  res.status(200).json({
    data: {
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
      ephemeralKey: ephemeralKey?.secret,
      customerId: stripeCustomerId
    },
    clientSecret: setupIntent.client_secret,
    setupIntentId: setupIntent.id,
    ephemeralKey: ephemeralKey?.secret,
    customerId: stripeCustomerId
  });
});

/**
 * @desc    handle Stripe Webhooks
 * @route   POST /api/payments/webhook
 * @access  Public (Stripe only)
 */
export const stripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    logger.error('STRIPE_WEBHOOK_SECRET is not configured');
    res.status(500).end();
    return;
  }

  try {
    // we use req.rawBody which was added by express.json() verify function in app.js
    await handleWebhook(req.rawBody, signature, secret);
    res.status(200).json({ received: true });
  } catch (err) {
    logger.error(`Webhook error: ${err.message}`);
    
    // log to global system audit
    const AuditLog = (await import('../models/AuditLog.js')).default;
    await AuditLog.create({
      event: 'webhook_error',
      severity: 'warning',
      message: `Stripe webhook failed: ${err.message}`,
      metadata: { error: err.message, stack: err.stack }
    }).catch(e => logger.error('Failed to write AuditLog for webhook error', e));

    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
