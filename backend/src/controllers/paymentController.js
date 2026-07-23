import { createPaymentIntent, createSetupIntent as createStripeSetupIntent, handleWebhook } from '../services/stripeService.js';
import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';
import { calculateOrderPricing } from '../services/orderPricing.js';
import { getDeliveryQuoteAPI } from '../services/doordashService.js';

const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

const getTrustedDeliveryFee = async ({ restaurant, address, subtotal, scheduledTime }) => {
  if (!address) return 0;
  try {
    const quote = await getDeliveryQuoteAPI(restaurant.address, address, subtotal || 10, scheduledTime);
    return roundMoney((quote.deliveryFee || 0) / 100);
  } catch (err) {
    const errReason = err.response?.data?.reason || err.response?.data?.error?.reason;
    if (errReason === 'distance_too_long' || err.message === 'OUT_OF_SERVICE_AREA') {
      logger.warn('DoorDash rejected quote due to distance_too_long during payment intent', {
        address,
        restaurantId: restaurant._id
      });
      throw new AppError('Delivery is not available for this location. The distance is too far.', 400);
    }
    logger.warn('DoorDash quote unavailable while creating payment intent, using restaurant default fee', {
      restaurantId: restaurant._id,
      error: err.response?.data || err.message
    });
    return roundMoney(restaurant.deliveryFee || 0);
  }
};

/**
 * @desc    Create a Stripe Payment Intent
 * @route   POST /api/payments/create-intent
 * @access  Private
 */
export const createIntent = asyncHandler(async (req, res) => {
  const { amount, orderId, restaurantId, items, orderType, tip, couponCode, useLoyaltyPoints, address, scheduledTime } = req.body;

  let verifiedAmount = Number(amount);
  const metadata = {};
  if (orderId) metadata.orderId = orderId.toString();
  if (req.user?._id) metadata.userId = req.user._id.toString();

  if (restaurantId && items?.length) {
    const prePricing = await calculateOrderPricing({
      restaurantId,
      items,
      orderType,
      tip,
      couponCode,
      userId: req.user?._id,
      useLoyaltyPoints,
      getModel: req.getModel
    });

    const deliveryFeeOverride = orderType === 'delivery'
      ? await getTrustedDeliveryFee({
          restaurant: prePricing.restaurant,
          address,
          subtotal: prePricing.subtotal,
          scheduledTime
        })
      : null;

    const pricing = await calculateOrderPricing({
      restaurantId,
      items,
      orderType,
      tip,
      couponCode,
      userId: req.user?._id,
      useLoyaltyPoints,
      deliveryFeeOverride,
      getModel: req.getModel
    });

    verifiedAmount = pricing.total;
    metadata.restaurantId = restaurantId.toString();
  }

  if (!verifiedAmount || verifiedAmount <= 0) {
    res.status(400);
    throw new Error('Amount is required');
  }

  const paymentIntent = await createPaymentIntent(verifiedAmount, metadata);

  res.status(200).json({
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: verifiedAmount
    },
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: verifiedAmount
  });
});

/**
 * @desc    Create a Stripe Setup Intent (for saving cards)
 * @route   POST /api/payments/create-setup-intent
 * @access  Private
 */
export const createSetupIntent = asyncHandler(async (req, res) => {
  const metadata = {
    userId: req.user?._id?.toString()
  };

  const setupIntent = await createStripeSetupIntent(metadata);

  res.status(200).json({
    data: {
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id
    },
    clientSecret: setupIntent.client_secret,
    setupIntentId: setupIntent.id
  });
});

/**
 * @desc    Handle Stripe Webhooks
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
    // We use req.rawBody which was added by express.json() verify function in app.js
    await handleWebhook(req.rawBody, signature, secret);
    res.status(200).json({ received: true });
  } catch (err) {
    logger.error(`Webhook error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
