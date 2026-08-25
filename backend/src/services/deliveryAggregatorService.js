import logger from '../utils/logger.js';
import * as shipdayProvider from './deliveryProviders/shipdayProvider.js';

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
 * Gets delivery fee for an order.
 * Shipday does not have a quote/estimate API — uses restaurant's configured delivery fee.
 *
 * @param {string} pickupAddress  - Restaurant address (unused, kept for API compat)
 * @param {string} dropoffAddress - Customer address (unused)
 * @param {number} subtotal       - Order subtotal (unused)
 * @param {Date}   scheduledTime  - Scheduled delivery time (unused)
 * @returns {Promise<{ fee: number, provider: string }>}
 */
export const getBestDeliveryQuote = async (pickupAddress, dropoffAddress, subtotal, scheduledTime) => {
  try {
    const estimate = await shipdayProvider.getThirdPartyEstimate(pickupAddress, dropoffAddress);
    if (estimate && estimate.fee > 0) {
      return estimate; // { fee: number, provider: string, reference: string }
    }
  } catch (error) {
    logger.warn('Error fetching Shipday third-party estimate', { error: error.message });
  }

  // Fallback if the Shipday API doesn't return a quote or errors out
  throw new Error('QUOTE_NOT_AVAILABLE');
};
