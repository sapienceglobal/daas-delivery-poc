import axios from 'axios';
import logger from '../../utils/logger.js';

const UBEREATS_CLIENT_ID = process.env.UBEREATS_CLIENT_ID;
const UBEREATS_CLIENT_SECRET = process.env.UBEREATS_CLIENT_SECRET;
const UBEREATS_CUSTOMER_ID = process.env.UBEREATS_CUSTOMER_ID;
const UBER_API_BASE = 'https://api.uber.com/v1';

let cachedToken = null;
let tokenExpiry = null;
let tokenPromise = null;

const getUberToken = async () => {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  if (tokenPromise) {
    return tokenPromise;
  }

  tokenPromise = (async () => {
    try {
      const params = new URLSearchParams();
      params.append('client_id', UBEREATS_CLIENT_ID);
      params.append('client_secret', UBEREATS_CLIENT_SECRET);
      params.append('grant_type', 'client_credentials');
      params.append('scope', 'eats.deliveries');

      const response = await axios.post('https://login.uber.com/oauth/v2/token', params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      cachedToken = response.data.access_token;
      // cache until 5 minutes before expiry
      tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;
      return cachedToken;
    } catch (err) {
      logger.error(`UberEats OAuth Error: ${err.response?.data?.error || err.message}`);
      throw new Error('Failed to authenticate with UberEats API');
    } finally {
      tokenPromise = null;
    }
  })();

  return tokenPromise;
};

const makeUberRequest = async (method, path, data = null) => {
  if (UBEREATS_CUSTOMER_ID === 'your_uber_customer_id_here' || !UBEREATS_CUSTOMER_ID) {
    throw new Error('UBEREATS_CUSTOMER_ID is missing in .env');
  }

  const token = await getUberToken();
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios({
        method,
        url: `${UBER_API_BASE}${path}`,
        data,
        timeout: 8000,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      const is5xx = error.response && error.response.status >= 500 && error.response.status < 600;
      const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
      if ((is5xx || isTimeout) && attempt < maxRetries) {
        logger.warn(`UberEats request failed (${error.message}). Retrying... attempt ${attempt + 1}`);
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); // simple backoff
        continue;
      }
      logger.error(`UberEats API Error (${method} ${path}): ${error.response?.data?.message || error.message}`);
      throw new Error(error.response?.data?.message || 'UberEats API request failed');
    }
  }
};

export const getDeliveryQuoteAPI = async (pickupAddress, dropoffAddress, subtotal, scheduledTime) => {
  logger.info(`Requesting UberEats quote: "${pickupAddress}" -> "${dropoffAddress}"`);
  
  const payload = {
    pickup_address: pickupAddress,
    dropoff_address: dropoffAddress
  };

  const data = await makeUberRequest('POST', `/customers/${UBEREATS_CUSTOMER_ID}/delivery_quotes`, payload);
  
  // uber returns fee in cents.
  logger.info(`UberEats quote received - Fee: ${data.fee} cents`);
  return { fee: data.fee, externalQuoteId: data.id };
};

export const triggerDeliveryAPI = async (order) => {
  logger.info(`Triggering UberEats delivery for order ${order.orderNumber}`);

  if (!order.restaurantPhone || !order.customerPhone) {
    throw new Error('Valid phone number is strictly required for Restaurant and Customer but was missing.');
  }

  const payload = {
    pickup_name: order.restaurantName,
    pickup_address: order.restaurantAddress,
    pickup_phone_number: order.restaurantPhone,
    dropoff_name: order.customerName,
    dropoff_address: order.address,
    dropoff_phone_number: order.customerPhone,
    dropoff_notes: order.specialInstructions || order.courierNotes || '',
    manifest_items: order.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: Math.round(item.price * 100)
    })),
    manifest_total_value: Math.round((order.subtotal || 0) * 100),
    courier_tip: Math.round((order.tip || 0) * 100)
  };

  const data = await makeUberRequest('POST', `/customers/${UBEREATS_CUSTOMER_ID}/deliveries`, payload);
  
  logger.info(`UberEats delivery created - ID: ${data.id}`);
  
  return {
    deliveryId: data.id,
    trackingUrl: data.tracking_url,
    fee: data.fee,
    pickupTime: data.pickup_estimate ? new Date(data.pickup_estimate) : null,
    deliveryTime: data.dropoff_estimate ? new Date(data.dropoff_estimate) : null
  };
};

export const cancelDeliveryAPI = async (deliveryId) => {
  logger.info(`Canceling UberEats delivery ${deliveryId}`);
  await makeUberRequest('POST', `/customers/${UBEREATS_CUSTOMER_ID}/deliveries/${deliveryId}/cancel`);
  return true;
};

export const getDeliveryAPI = async (deliveryId) => {
  const data = await makeUberRequest('GET', `/customers/${UBEREATS_CUSTOMER_ID}/deliveries/${deliveryId}`);
  
  // map Uber status to standard internal status
  let mappedStatus = 'accepted';
  if (data.status === 'pickup') mappedStatus = 'picked_up';
  else if (data.status === 'dropoff') mappedStatus = 'out_for_delivery';
  else if (data.status === 'delivered') mappedStatus = 'delivered';
  else if (data.status === 'canceled') mappedStatus = 'cancelled';

  return {
    status: mappedStatus,
    tracking_url: data.tracking_url,
    courierName: data.courier?.name || null,
    courierPhone: data.courier?.phone_number || null,
    courierLat: data.courier?.location?.lat || null,
    courierLng: data.courier?.location?.lng || null
  };
};
