import Stripe from 'stripe';
import logger from '../utils/logger.js';
import Order from '../models/Order.js';

const STRIPE_API_VERSION = process.env.STRIPE_API_VERSION || '2026-06-24.dahlia';

let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: STRIPE_API_VERSION,
  });
} else {
  logger.warn('Stripe is not configured. Payments will not work.');
}

/**
 * Create a Payment Intent
 */
export const createPaymentIntent = async (amount, metadata = {}) => {
  if (!stripe) throw new Error('Stripe is not configured');

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Stripe expects cents
    currency: 'usd',
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return paymentIntent;
};

/**
 * Retrieve a Payment Intent from Stripe for server-side verification.
 */
export const retrievePaymentIntent = async (paymentIntentId) => {
  if (!stripe) throw new Error('Stripe is not configured');
  return stripe.paymentIntents.retrieve(paymentIntentId);
};

/**
 * Handle Stripe Webhook
 */
export const handleWebhook = async (rawBody, signature, secret) => {
  if (!stripe) throw new Error('Stripe is not configured');

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    throw err;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;
      
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: 'paid',
          stripePaymentIntentId: paymentIntent.id
        });
        logger.info(`Payment Intent Succeeded: ${paymentIntent.id} for Order: ${orderId}`);
      }
      break;
    }
    
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;
      
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: 'failed',
          stripePaymentIntentId: paymentIntent.id
        });
        logger.error(`Payment Intent Failed: ${paymentIntent.id} for Order: ${orderId}`);
      }
      break;
    }

    // Add other event types here (e.g., charge.refunded)
    default:
      logger.info(`Unhandled Stripe event type: ${event.type}`);
  }

  return true;
};

/**
 * Issue a Refund
 */
export const refundPayment = async (paymentIntentId, amount = null) => {
  if (!stripe) throw new Error('Stripe is not configured');

  const options = { payment_intent: paymentIntentId };
  if (amount) {
    options.amount = Math.round(amount * 100);
  }

  const refund = await stripe.refunds.create(options);
  return refund;
};

export default {
  createPaymentIntent,
  retrievePaymentIntent,
  handleWebhook,
  refundPayment
};
