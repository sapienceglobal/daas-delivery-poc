import logger from '../utils/logger.js';
import * as shipdayProvider from './deliveryProviders/shipdayProvider.js';
import * as doordashProvider from './deliveryProviders/doordashProvider.js';

// ── Delivery Aggregator Service ─────────────────────────────────────────────
// Single-provider aggregator pointing to Shipday.
// Previously supported DoorDash, UberEats, GrubHub — all replaced by Shipday.

/**
 * Triggers a delivery order creation via Shipday.
 *
 * @param {Object} order - Mongoose Order document
 * @returns {Promise<{ deliveryId, trackingUrl, deliveryFee, pickupTime, deliveryTime }>}
 */
export const triggerDelivery = async (order) => {
  logger.info(`Triggering delivery for order ${order.orderNumber} via Shipday`);

  const result = await shipdayProvider.insertOrder(order);

  return {
    deliveryId: result.deliveryId,
    trackingUrl: result.trackingUrl,
    deliveryFee: result.deliveryFee,
    pickupTime: result.pickupTime,
    deliveryTime: result.deliveryTime
  };
};

/**
 * Cancels a delivery on Shipday.
 *
 * @param {Object} order  - Mongoose Order document
 * @param {string} reason - Cancellation reason
 * @returns {Promise<boolean>}
 */
export const cancelDelivery = async (order, reason) => {
  if (!order.deliveryId && !order.externalDeliveryId) return true;

  const shipdayOrderId = order.deliveryId || order.externalDeliveryId;
  return await shipdayProvider.deleteOrder(shipdayOrderId, reason);
};

/**
 * Gets real-time delivery tracking data from Shipday.
 *
 * @param {Object} order - Mongoose Order document
 * @returns {Promise<Object>} - Tracking payload (status, courier info, location)
 */
export const getDeliveryTracking = async (order) => {
  if (!order.deliveryId && !order.externalDeliveryId) {
    throw new Error('No delivery ID on order');
  }

  const shipdayOrderId = order.deliveryId || order.externalDeliveryId;
  const tracking = await shipdayProvider.getOrderTracking(shipdayOrderId);

  if (!tracking) {
    // Tracking endpoint unavailable (plan limitation or order not found)
    return {
      status: order.status,
      trackingUrl: order.trackingUrl
    };
  }

  return tracking;
};

/**
 * Gets the best delivery fee quote from Shipday's Third-Party Network.
 * Checks both DoorDash and Uber via Shipday's /third-party/availability endpoint.
 * Returns the cheapest available option with exact fees (including regulatory).
 *
 * @param {string} pickupAddress  - Restaurant address
 * @param {string} dropoffAddress - Customer address
 * @param {number} subtotal       - Order subtotal (unused, kept for API compat)
 * @param {Date}   scheduledTime  - Scheduled delivery time (unused)
 * @returns {Promise<{ fee: number, provider: string, reference: string }>}
 */
export const getBestDeliveryQuote = async (pickupAddress, dropoffAddress, subtotal, scheduledTime) => {
  try {
    const quote = await shipdayProvider.getThirdPartyEstimate(pickupAddress, dropoffAddress);
    if (quote && quote.fee > 0) {
      return {
        fee: quote.fee,
        provider: quote.provider || 'shipday',
        reference: quote.reference
      };
    }
  } catch (error) {
    logger.warn('Shipday third-party quote failed', { error: error.message });
    // Re-throw with the actual error message (e.g. "Delivery address not within service area")
    throw error;
  }

  throw new Error('QUOTE_NOT_AVAILABLE');
};
