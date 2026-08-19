import logger from '../utils/logger.js';
import * as doordashProvider from './deliveryProviders/doordashProvider.js';
import * as ubereatsProvider from './deliveryProviders/ubereatsProvider.js';
import * as grubhubProvider from './deliveryProviders/grubhubProvider.js';

const providers = {
  doordash: doordashProvider,
  ubereats: ubereatsProvider,
  grubhub: grubhubProvider
};

/**
 * Fetches quotes from all enabled providers and returns the cheapest one.
 */
export const getBestDeliveryQuote = async (pickupAddress, dropoffAddress, subtotal, scheduledTime) => {
  logger.info(`Aggregating quotes for delivery to ${dropoffAddress}`);
  
  const enabledProviders = ['doordash', 'ubereats'];
  const quotes = [];
  
  // Run all requests in parallel
  const results = await Promise.allSettled(
    enabledProviders.map(provider => 
      providers[provider].getDeliveryQuoteAPI(pickupAddress, dropoffAddress, subtotal, scheduledTime)
        .then(res => ({ provider, fee: res.fee }))
    )
  );
  
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      quotes.push(result.value);
    } else {
      logger.warn(`Delivery provider quote failed: ${result.reason}`);
    }
  });
  
  if (quotes.length === 0) {
    logger.error('All delivery providers failed to return a quote.');
    throw new Error('Delivery is currently unavailable in this area.');
  }
  
  // Sort by lowest fee
  quotes.sort((a, b) => a.fee - b.fee);
  const bestQuote = quotes[0];
  
  logger.info(`Best quote selected: ${bestQuote.provider} at ${bestQuote.fee} cents`);
  
  return bestQuote;
};

/**
 * Triggers the delivery creation API on the provider selected during quote.
 */
export const triggerDelivery = async (order) => {
  const providerKey = order.deliveryProvider || 'doordash';
  const provider = providers[providerKey];
  
  if (!provider) {
    throw new Error(`Unknown delivery provider configured for order: ${providerKey}`);
  }
  
  return await provider.triggerDeliveryAPI(order);
};

/**
 * Cancels a delivery on the active provider.
 */
export const cancelDelivery = async (order, reason) => {
  if (!order.deliveryId && !order.externalDeliveryId) return true;
  
  const providerKey = order.deliveryProvider || 'doordash';
  const provider = providers[providerKey];
  
  if (!provider) {
    logger.warn(`Unknown provider ${providerKey} during cancellation`);
    return false;
  }
  
  return await provider.cancelDeliveryAPI(order.externalDeliveryId || order.deliveryId, reason);
};

/**
 * Gets real-time tracking payload for a delivery.
 */
export const getDeliveryTracking = async (order) => {
  if (!order.deliveryId && !order.externalDeliveryId) throw new Error('No delivery ID');
  
  const providerKey = order.deliveryProvider || 'doordash';
  const provider = providers[providerKey];
  
  // Real API call for supported providers (DoorDash, UberEats)
  if (provider && typeof provider.getDeliveryAPI === 'function') {
    return await provider.getDeliveryAPI(order.externalDeliveryId || order.deliveryId);
  }
  
  // Note: For Grubhub simulation, we will just return mock status
  return {
    status: order.status, // keep existing status
    tracking_url: order.trackingUrl
  };
};

