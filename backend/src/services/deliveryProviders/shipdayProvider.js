import axios from 'axios';
import logger from '../../utils/logger.js';

// ── Configuration ───────────────────────────────────────────────────────────
const SHIPDAY_API_KEY = process.env.SHIPDAY_API_KEY;
const SHIPDAY_BASE_URL = 'https://api.shipday.com';

const isConfigMissing = !SHIPDAY_API_KEY || SHIPDAY_API_KEY.includes('your_');

if (isConfigMissing && process.env.NODE_ENV === 'production') {
  logger.error('[FATAL] SHIPDAY_API_KEY is not set. Delivery integration will not work.');
}

// ── Axios Client with Retry ────────────────────────────────────────────────

const shipdayRequest = async ({ method, path, data, params }) => {
  if (isConfigMissing) {
    throw new Error('Shipday API key is not configured. Set SHIPDAY_API_KEY in .env');
  }

  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await axios({
        method,
        url: `${SHIPDAY_BASE_URL}${path}`,
        data,
        params,
        timeout: 15000,
        headers: {
          'Authorization': `Basic ${SHIPDAY_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    } catch (error) {
      const is5xx = error.response && error.response.status >= 500 && error.response.status < 600;
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
      if ((is5xx || isTimeout) && attempt < maxRetries) {
        logger.warn(`Shipday request failed (${error.message}). Retrying... attempt ${attempt + 1}`);
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
};

// ── Phone Formatter ─────────────────────────────────────────────────────────

const formatPhone = (phone, entityName = 'Entity') => {
  if (!phone) return '';
  const cleaned = phone.toString().replace(/\D/g, '');
  if (cleaned.length === 10) return `+1${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith('1')) return `+${cleaned}`;
  if (phone.toString().trim().startsWith('+') && cleaned.length >= 10) return `+${cleaned}`;
  return phone.toString().trim(); // return as-is if format is unknown
};

// ── Insert Order ────────────────────────────────────────────────────────────
/**
 * Creates a delivery order in Shipday.
 *
 * @param {Object} order - Mongoose Order document
 * @returns {Promise<{ shipdayOrderId: number, trackingUrl: string|null }>}
 */
export const insertOrder = async (order) => {
  const pickupBusinessName = order.restaurantName;
  const pickupAddress = order.restaurantAddress;

  if (!pickupBusinessName || !pickupAddress) {
    throw new Error('Restaurant details (name, address) are missing for Shipday delivery.');
  }

  logger.info(`Triggering Shipday delivery for order ${order.orderNumber}`);

  // Build the Shipday order payload
  const payload = {
    orderNumber: String(order.orderNumber),
    customerName: order.customerName || 'Customer',
    customerAddress: order.address || '',
    customerEmail: order.customerEmail || undefined,
    customerPhoneNumber: formatPhone(order.customerPhone, 'Customer'),
    restaurantName: pickupBusinessName,
    restaurantAddress: pickupAddress,
    restaurantPhoneNumber: formatPhone(order.restaurantPhone, 'Restaurant'),
    orderItem: (order.items || []).map(item => ({
      name: item.name || 'Item',
      unitPrice: Number(item.price) || 0,
      quantity: item.quantity || 1,
      addOns: (item.addOns || []).map(a => a.name).filter(Boolean),
      detail: item.specialInstructions || undefined
    })),
    tips: Number(order.tip) || 0,
    tax: Number(order.tax) || 0,
    discountAmount: Number(order.discount) || 0,
    deliveryFee: Number(order.deliveryFee) || 0,
    totalOrderCost: Number(order.total) || 0,
    deliveryInstruction: order.courierNotes || order.specialInstructions || undefined,
    orderSource: 'Lassi Lounge',
    additionalId: order._id?.toString(),
    paymentMethod: order.paymentMethod === 'cash' ? 'cash' : 'credit_card'
  };

  // Add coordinates if available
  if (order.restaurantLat && order.restaurantLng) {
    payload.pickupLatitude = Number(order.restaurantLat);
    payload.pickupLongitude = Number(order.restaurantLng);
  }
  if (order.addressLat && order.addressLng) {
    payload.deliveryLatitude = Number(order.addressLat);
    payload.deliveryLongitude = Number(order.addressLng);
  }

  // Add scheduled times if this is a scheduled order
  if (order.scheduledTime) {
    const scheduled = new Date(order.scheduledTime);
    if (!isNaN(scheduled.getTime())) {
      payload.expectedDeliveryDate = scheduled.toISOString().split('T')[0];
      payload.expectedDeliveryTime = scheduled.toISOString().split('T')[1]?.split('.')[0];
    }
  }

  try {
    const response = await shipdayRequest({
      method: 'post',
      path: '/orders',
      data: payload
    });

    const shipdayOrderId = response.data?.orderId;
    if (!shipdayOrderId) {
      logger.error('Shipday response missing orderId', { response: response.data });
      throw new Error('Shipday did not return an orderId');
    }

    logger.info(`Shipday delivery created — ID: ${shipdayOrderId}`);

    return {
      shipdayOrderId,
      deliveryId: String(shipdayOrderId),
      trackingUrl: null, // Shipday provides tracking link via webhook/polling
      deliveryFee: Number(order.deliveryFee) || 0,
      pickupTime: null,
      deliveryTime: null
    };
  } catch (error) {
    logger.error('Shipday API call failed', {
      status: error.response?.status,
      error: error.response?.data || error.message
    });
    throw error;
  }
};

// ── Get Order Tracking (Delivery Progress) ──────────────────────────────────
/**
 * Fetches real-time delivery progress from Shipday.
 * Uses the Order Delivery Progress endpoint.
 * Rate limit: max 3 requests per minute per trackingId.
 *
 * @param {string|number} shipdayOrderId - The Shipday order ID
 * @returns {Promise<Object>} - Tracking data including carrier location, status, ETA
 */
export const getOrderTracking = async (shipdayOrderId) => {
  try {
    const response = await shipdayRequest({
      method: 'get',
      path: `/order/progress/${encodeURIComponent(shipdayOrderId)}`,
      params: { isStaticDataRequired: 'true' }
    });

    const data = response.data;
    const fixedData = data?.fixedData || {};
    const dynamicData = data?.dynamicData || {};
    const carrier = fixedData?.carrier || {};
    const carrierLocation = dynamicData?.carrierLocation || {};
    const orderStatus = dynamicData?.orderStatus || {};

    return {
      status: orderStatus.status || null,
      courierName: carrier.name || null,
      courierPhone: carrier.phoneNumber || null,
      courierLat: carrierLocation.latitude || null,
      courierLng: carrierLocation.longitude || null,
      estimatedTimeMinutes: dynamicData.estimatedTimeInMinutes || null,
      trackingUrl: fixedData.trackingLink || null,
      pickupTime: orderStatus.pickedTime ? new Date(orderStatus.pickedTime) : null,
      deliveryTime: orderStatus.deliveryTime ? new Date(orderStatus.deliveryTime) : null
    };
  } catch (error) {
    // 404 or 401 means the order doesn't exist or plan doesn't support this endpoint
    if (error.response?.status === 401 || error.response?.status === 404) {
      logger.debug(`Shipday tracking unavailable for order ${shipdayOrderId} (status ${error.response.status})`);
      return null;
    }
    throw error;
  }
};

// ── Get Active Orders ───────────────────────────────────────────────────────
/**
 * Retrieves all active orders from Shipday.
 *
 * @returns {Promise<Array>}
 */
export const getActiveOrders = async () => {
  const response = await shipdayRequest({
    method: 'get',
    path: '/orders'
  });
  return response.data || [];
};

// ── Delete / Cancel Order ───────────────────────────────────────────────────
/**
 * Marks a Shipday order as incomplete / cancels it.
 * Shipday doesn't have a dedicated cancel endpoint — we use the edit endpoint
 * to mark the order as incomplete, or simply rely on webhooks to handle it.
 *
 * @param {string|number} shipdayOrderId
 * @param {string} reason
 * @returns {Promise<boolean>}
 */
export const deleteOrder = async (shipdayOrderId, reason = 'Order cancelled') => {
  try {
    // Shipday API supports deleting/marking orders via editing
    // If the order cannot be edited (already completed), this is a no-op
    logger.info(`Cancelling Shipday order ${shipdayOrderId}: ${reason}`);

    // Attempt to edit the order with empty/cancelled status
    // Note: Shipday may not support direct cancellation via API —
    // the order will be managed from the Shipday dashboard
    await shipdayRequest({
      method: 'put',
      path: `/orders/${encodeURIComponent(shipdayOrderId)}`,
      data: {
        deliveryInstruction: `CANCELLED: ${reason}`
      }
    });

    return true;
  } catch (error) {
    logger.warn(`Failed to cancel Shipday order ${shipdayOrderId}`, {
      error: error.response?.data || error.message
    });
    return false;
  }
};
