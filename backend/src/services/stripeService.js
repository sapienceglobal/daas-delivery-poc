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

// create a Checkout Session for Payment Links (SMS/QR)
export const createCheckoutSession = async (amount, metadata = {}, customerId = null, items = []) => {
  if (!stripe) throw new Error('Stripe is not configured');

  const lineItems = items.length > 0 ? items.map(item => {
    let unitAmount = item.price || 0;
    if (item.lineTotal !== undefined && item.quantity) {
      unitAmount = item.lineTotal / item.quantity;
    }
    return {
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name || 'Order Item',
        },
        unit_amount: Math.round(unitAmount * 100),
      },
      quantity: item.quantity || 1,
    };
  }) : [{
    price_data: {
      currency: 'usd',
      product_data: {
        name: 'Order Total',
      },
      unit_amount: Math.round(amount * 100),
    },
    quantity: 1,
  }];

  const options = {
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: lineItems,
    expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // Expires in 30 minutes minimum
    payment_intent_data: {
      metadata
    },
    metadata, // Session metadata
    success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?order_id=${metadata.orderId || ''}`,
    cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-cancel?order_id=${metadata.orderId || ''}`,
  };

  if (customerId) {
    options.customer = customerId;
  }

  const session = await stripe.checkout.sessions.create(options);
  return session;
};

// retrieve a Payment Intent from Stripe for server-side verification.
export const retrievePaymentIntent = async (paymentIntentId) => {
  if (!stripe) throw new Error('Stripe is not configured');
  return stripe.paymentIntents.retrieve(paymentIntentId);
};

export const expireCheckoutSession = async (sessionId) => {
  if (!stripe) throw new Error('Stripe is not configured');
  try {
    const session = await stripe.checkout.sessions.expire(sessionId);
    return session;
  } catch (err) {
    logger.error(`Failed to expire checkout session ${sessionId}: ${err.message}`);
    throw err;
  }
};

// handle Stripe Webhook
export const handleWebhook = async (rawBody, signature, secret, io = null) => {
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
        const order = await TenantOrder.findById(orderId);
        
        if (order) {
          if (['cancelled', 'failed'].includes(order.status)) {
            logger.warn(`Payment succeeded for a cancelled/failed order ${orderId}. Auto-refunding.`);
            try {
              await stripe.refunds.create({ payment_intent: paymentIntent.id });
              order.paymentStatus = 'refunded';
              order.refunded = true;
              order.refundAmount = paymentIntent.amount_received / 100;
              order.refundReason = 'paid_after_cancellation';
              await order.save();
            } catch(refundErr) {
              logger.error('Failed to auto-refund late payment:', refundErr);
            }
          } else {
            order.paymentStatus = 'paid';
            order.stripePaymentIntentId = paymentIntent.id;
            await order.save();
            logger.info(`Payment Intent Succeeded: ${paymentIntent.id} for Order: ${orderId} in db ${dbName}`);
          }
        }
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

    case 'checkout.session.completed': {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      const dbName = session.metadata?.tenantDbName || process.env.FORCE_TENANT_DB_NAME || 'daas_poc_lassi_lounge';

      if (orderId && orderId !== 'pending') {
        logger.info(`Checkout Session Completed: ${session.id} for Order: ${orderId} in db ${dbName}`);
        try {
          const { handleStripeWebhookSuccess } = await import('../controllers/orderController.js');
          await handleStripeWebhookSuccess(orderId, session.payment_intent, dbName, io);
        } catch (err) {
          logger.error('Error processing handleStripeWebhookSuccess', err);
        }
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
  createCheckoutSession,
  expireCheckoutSession,
  handleWebhook,
  refundPayment
};
