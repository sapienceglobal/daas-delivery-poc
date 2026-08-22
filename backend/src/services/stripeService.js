import Stripe from 'stripe';
import mongoose from 'mongoose';
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

// create a Stripe Customer
export const createCustomer = async (email, name, metadata = {}, phone = null) => {
  if (!stripe) throw new Error('Stripe is not configured');
  const params = { email, name, metadata };
  if (phone && phone !== '0000000000') params.phone = phone;
  const customer = await stripe.customers.create(params);
  return customer;
};

// update a Stripe Customer
export const updateCustomer = async (customerId, updates) => {
  if (!stripe) throw new Error('Stripe is not configured');
  return await stripe.customers.update(customerId, updates);
};

// create an Ephemeral Key for a Customer
export const createEphemeralKey = async (customerId, stripeVersion) => {
  if (!stripe) throw new Error('Stripe is not configured');
  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customerId },
    { apiVersion: stripeVersion || STRIPE_API_VERSION }
  );
  return ephemeralKey;
};

// create a Payment Intent
export const createPaymentIntent = async (amount, metadata = {}, customerId = null) => {
  if (!stripe) throw new Error('Stripe is not configured');

  const options = {
    amount: Math.round(amount * 100), // Stripe expects cents
    currency: 'usd',
    metadata,
    // explicitly specify 'card' only — do NOT use automatic_payment_methods
    // automatic_payment_methods enables Stripe Link which opens checkout.link.com
    // in a webview on mobile and breaks the native payment sheet flow.
    payment_method_types: ['card'],
  };

  if (customerId) {
    options.customer = customerId;
    options.setup_future_usage = 'off_session';
  }

  const paymentIntent = await stripe.paymentIntents.create(options);

  return paymentIntent;
};

// charge a saved card synchronously (off-session or direct on-session)
export const chargeSavedCard = async (amount, customerId, paymentMethodId, metadata = {}) => {
  if (!stripe) throw new Error('Stripe is not configured');

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    customer: customerId,
    payment_method: paymentMethodId,
    off_session: true, // We attempt it off-session to avoid 3DS if possible
    confirm: true,
    metadata,
  });

  return paymentIntent;
};

// create a Setup Intent for saving a card without charging
export const createSetupIntent = async (metadata = {}, customerId = null) => {
  if (!stripe) throw new Error('Stripe is not configured');

  const options = {
    metadata,
    payment_method_types: ['card'],
  };

  if (customerId) {
    options.customer = customerId;
  }

  const setupIntent = await stripe.setupIntents.create(options);

  return setupIntent;
};

// retrieve a Payment Intent from Stripe for server-side verification.
export const retrievePaymentIntent = async (paymentIntentId) => {
  if (!stripe) throw new Error('Stripe is not configured');
  return stripe.paymentIntents.retrieve(paymentIntentId);
};

// handle Stripe Webhook
export const handleWebhook = async (rawBody, signature, secret) => {
  if (!stripe) throw new Error('Stripe is not configured');

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    throw err;
  }

  // handle the event
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;
      const dbName = paymentIntent.metadata.tenantDbName || process.env.FORCE_TENANT_DB_NAME || 'daas_poc_lassi_lounge';

      if (orderId && orderId !== 'pending') {
        const targetDb = mongoose.connection.useDb(dbName, { useCache: true });
        const TenantOrder = targetDb.model('Order', Order.schema);
        await TenantOrder.findByIdAndUpdate(orderId, {
          paymentStatus: 'paid',
          stripePaymentIntentId: paymentIntent.id
        });
        logger.info(`Payment Intent Succeeded: ${paymentIntent.id} for Order: ${orderId} in db ${dbName}`);
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;
      const dbName = paymentIntent.metadata.tenantDbName || process.env.FORCE_TENANT_DB_NAME || 'daas_poc_lassi_lounge';

      if (orderId && orderId !== 'pending') {
        const targetDb = mongoose.connection.useDb(dbName, { useCache: true });
        const TenantOrder = targetDb.model('Order', Order.schema);
        await TenantOrder.findByIdAndUpdate(orderId, {
          paymentStatus: 'failed',
          stripePaymentIntentId: paymentIntent.id
        });
        logger.error(`Payment Intent Failed: ${paymentIntent.id} for Order: ${orderId} in db ${dbName}`);
      }
      break;
    }

    // add other event types here (e.g., charge.refunded)
    default:
      logger.info(`Unhandled Stripe event type: ${event.type}`);
  }

  return true;
};

// issue a Refund
export const refundPayment = async (paymentIntentId, amount = null, optionsOverride = {}) => {
  if (!stripe) throw new Error('Stripe is not configured');

  const options = { payment_intent: paymentIntentId };
  if (amount) {
    options.amount = Math.round(amount * 100);
  }

  const requestOptions = optionsOverride.idempotencyKey
    ? { idempotencyKey: optionsOverride.idempotencyKey }
    : undefined;

  const refund = await stripe.refunds.create(options, requestOptions);
  return refund;
};

export default {
  createCustomer,
  updateCustomer,
  createPaymentIntent,
  createSetupIntent,
  chargeSavedCard,
  retrievePaymentIntent,
  handleWebhook,
  refundPayment
};
