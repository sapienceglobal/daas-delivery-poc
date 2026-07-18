import jwt from 'jsonwebtoken';
import axios from 'axios';
import logger from '../utils/logger.js';

// ── Credentials ─────────────────────────────────────────────────────────────
const developerId = process.env.DOORDASH_DEVELOPER_ID || process.env.DOORDASH_CLIENT_ID;
const keyId = process.env.DOORDASH_KEY_ID || process.env.DOORDASH_CLIENT_ID;
const signingSecret = process.env.DOORDASH_SIGNING_SECRET || process.env.DOORDASH_SECRET;

const isConfigMissing = !developerId || !keyId || !signingSecret ||
  (developerId?.includes('your_')) ||
  (signingSecret?.includes('your_'));

const DRIVE_BASE_URL = 'https://openapi.doordash.com/drive/v2';

const doordashRequest = async ({ method, path, data }) => {
  const token = generateJWT();
  return axios({
    method,
    url: `${DRIVE_BASE_URL}${path}`,
    data,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
};

const formatPhoneForDoorDash = (phone, defaultPhone = '+16505550100') => {
  if (!phone) return defaultPhone;
  const cleaned = phone.toString().replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  if (phone.toString().trim().startsWith('+') && cleaned.length >= 10) {
    return `+${cleaned}`;
  }
  return defaultPhone;
};

const buildDeliveryPayload = (order) => ({
  external_delivery_id: order.externalDeliveryId,
  pickup_address: order.restaurantAddress,
  pickup_phone_number: formatPhoneForDoorDash(order.restaurantPhone, '+16505550100'),
  pickup_business_name: order.restaurantName,
  pickup_reference_tag: order.orderNumber,
  dropoff_address: order.address,
  dropoff_phone_number: formatPhoneForDoorDash(order.customerPhone, '+16505550100'),
  dropoff_name: order.customerName,
  dropoff_contact_given_name: order.customerName?.split(' ')?.[0] || order.customerName,
  dropoff_contact_family_name: order.customerName?.split(' ')?.slice(1).join(' ') || undefined,
  dropoff_email_address: order.customerEmail || undefined,
  order_value: Math.round((order.productPrice || order.subtotal) * 100),
  tip: Math.round((order.tip || 0) * 100),
  dropoff_instructions: order.courierNotes || undefined,
  scheduled_delivery_time: order.scheduledTime ? order.scheduledTime.toISOString() : undefined,
  contactless_dropoff: true,
  action_if_undeliverable: 'return_to_pickup',
  items: (order.items || []).map((item) => ({
    name: item.name,
    quantity: item.quantity,
    price: Math.round((item.price || 0) * 100),
    external_id: item.menuItemId?.toString(),
    special_instructions: item.specialInstructions || undefined
  }))
});

/**
 * Generate a DoorDash JWT for authenticating with Drive API v2.
 */
export const generateJWT = () => {
  if (isConfigMissing) {
    throw new Error('DoorDash API credentials not configured or using placeholders in .env');
  }

  const payload = {
    aud: 'doordash',
    iss: developerId,
    kid: keyId,
    exp: Math.floor(Date.now() / 1000) + 30 * 60,
    iat: Math.floor(Date.now() / 1000)
  };

  try {
    const decodedSecret = Buffer.from(signingSecret, 'base64url');
    return jwt.sign(payload, decodedSecret, {
      algorithm: 'HS256',
      header: { 'dd-ver': 'DD-JWT-V1' }
    });
  } catch (error) {
    throw new Error(`Failed to sign DoorDash JWT: ${error.message}`);
  }
};

/**
 * Trigger a real DoorDash Drive API direct delivery request.
 *
 * @param {Object} order - The Mongoose Order document
 * @returns {Promise<Object>}
 */
export const triggerDeliveryAPI = async (order) => {
  const pickupBusinessName = order.restaurantName;
  const pickupAddress = order.restaurantAddress;
  const pickupPhone = order.restaurantPhone;

  if (!pickupBusinessName || !pickupAddress || !pickupPhone) {
    throw new Error('Restaurant details (name, address, phone) are missing for DoorDash delivery.');
  }

  logger.info(`Triggering DoorDash delivery for order ${order.externalDeliveryId}`);

  try {
    const response = await doordashRequest({
      method: 'post',
      path: '/deliveries',
      data: buildDeliveryPayload(order)
    });

    const deliveryId = response.data.delivery_id || response.data.id || response.data.external_delivery_id;
    logger.info(`DoorDash delivery created — ID: ${deliveryId}`);

    return {
      deliveryId,
      trackingUrl: response.data.tracking_url || `https://demo.doordash.com/tracking/${deliveryId}`,
      deliveryFee: response.data.fee || 0,
      pickupTime: response.data.pickup_time ? new Date(response.data.pickup_time) : null,
      deliveryTime: response.data.delivery_time ? new Date(response.data.delivery_time) : null,
      realRequest: true
    };
  } catch (error) {
    logger.error('DoorDash API call failed', {
      error: error.response?.data || error.message
    });

    if (isConfigMissing) {
      logger.warn('SIMULATION MODE — configure DoorDash credentials in .env for live API');

      throw new Error('DoorDash configuration is missing. Cannot create live delivery.');
    }
    throw error;
  }
};

/**
 * Fetch a delivery quote from DoorDash Drive API.
 */
export const getDeliveryQuoteAPI = async (pickupAddress, dropoffAddress, orderValue, scheduledDeliveryTime) => {
  logger.info(`Requesting DoorDash quote: "${pickupAddress}" → "${dropoffAddress}"`);

  try {
    const payload = {
      external_delivery_id: `quote-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      pickup_address: pickupAddress,
      dropoff_address: dropoffAddress,
      order_value: Math.round(orderValue * 100),
      scheduled_delivery_time: scheduledDeliveryTime ? new Date(scheduledDeliveryTime).toISOString() : undefined
    };

    const response = await doordashRequest({ method: 'post', path: '/quotes', data: payload });

    logger.info(`DoorDash quote received — Fee: ${response.data.fee} cents`);
    return {
      deliveryFee: response.data.fee,
      pickupTime: response.data.pickup_time ? new Date(response.data.pickup_time) : null,
      deliveryTime: response.data.delivery_time ? new Date(response.data.delivery_time) : null,
      realRequest: true
    };
  } catch (error) {
    logger.error('DoorDash quote API failed', {
      error: error.response?.data || error.message
    });

    if (isConfigMissing) {
      logger.warn('MOCK QUOTE — simulation mode active');

      let simulatedFee = 599;
      const normalized = (dropoffAddress || '').toLowerCase();
      
      // Simulate out of bounds for non-US addresses or extreme cases
      if (normalized.includes('uk') || normalized.includes('london') || normalized.includes('india') || normalized.includes('australia') || normalized.includes('japan') || normalized.includes('china') || normalized.includes('germany') || normalized.includes('france') || normalized.includes('outside')) {
        throw new Error('OUT_OF_SERVICE_AREA');
      }

      if (normalized.includes('oak st') || normalized.includes('union square')) simulatedFee = 499;
      else if (normalized.includes('geary') || normalized.includes('lombard')) simulatedFee = 699;
      else if (normalized.includes('valencia') || normalized.includes('mission')) simulatedFee = 799;
      else if (normalized.length > 30) simulatedFee = 899;

      if (scheduledDeliveryTime) {
        const schDate = new Date(scheduledDeliveryTime);
        if (isNaN(schDate.getTime())) throw new Error('Invalid scheduled time format.');
        if (schDate.getTime() < Date.now() + 30 * 60 * 1000) {
          throw new Error('Scheduled delivery time must be at least 30-40 minutes in the future.');
        }
      }

      // Return simulated quote instead of throwing error unconditionally
      return {
        deliveryFee: simulatedFee,
        pickupTime: new Date(Date.now() + 15 * 60000),
        deliveryTime: new Date(Date.now() + 45 * 60000),
        realRequest: false
      };
    }
    throw error;
  }
};

export const checkServiceabilityAPI = async (pickupAddress, dropoffAddress) => {
  const response = await doordashRequest({
    method: 'post',
    path: '/serviceability',
    data: {
      pickup_address: pickupAddress,
      dropoff_address: dropoffAddress
    }
  });
  return response.data;
};

export const getDeliveryAPI = async (externalDeliveryId) => {
  const response = await doordashRequest({
    method: 'get',
    path: `/deliveries/${encodeURIComponent(externalDeliveryId)}`
  });
  return response.data;
};

export const updateDeliveryAPI = async (externalDeliveryId, updates) => {
  const response = await doordashRequest({
    method: 'patch',
    path: `/deliveries/${encodeURIComponent(externalDeliveryId)}`,
    data: updates
  });
  return response.data;
};

export const cancelDeliveryAPI = async (externalDeliveryId, reason = 'Order cancelled') => {
  const response = await doordashRequest({
    method: 'put',
    path: `/deliveries/${encodeURIComponent(externalDeliveryId)}/cancel`,
    data: { cancellation_reason: reason }
  });
  return response.data;
};
