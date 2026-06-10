const jwt = require('jsonwebtoken');
const axios = require('axios');

// Gracefully accommodate both the standard credentials and user's requested .env keys
const developerId = process.env.DOORDASH_DEVELOPER_ID || process.env.DOORDASH_CLIENT_ID;
const keyId = process.env.DOORDASH_KEY_ID || process.env.DOORDASH_CLIENT_ID;
const signingSecret = process.env.DOORDASH_SIGNING_SECRET || process.env.DOORDASH_SECRET;

const isConfigMissing = !developerId || !keyId || !signingSecret || 
  (developerId && developerId.includes('your_')) || 
  (signingSecret && signingSecret.includes('your_'));

/**
 * Generates a DoorDash JWT for authenticating with the Drive API v2.
 * Reference: https://developer.doordash.com/
 */
const generateJWT = () => {
  // Validate presence of credentials
  if (isConfigMissing) {
    throw new Error('DoorDash API credentials not configured or using placeholders in .env');
  }

  // DoorDash Drive API JWT Payload standard fields
  const payload = {
    aud: 'doordash',
    iss: developerId,
    kid: keyId,
    exp: Math.floor(Date.now() / 1000) + 30 * 60, // Expiration time: 30 minutes
    iat: Math.floor(Date.now() / 1000),          // Issued at time
  };

  // Sign token using HS256 and custom dd-ver header
  try {
    // DoorDash signing secrets are base64url-encoded and must be decoded into a Buffer prior to signing.
    const decodedSecret = Buffer.from(signingSecret, 'base64url');
    
    const token = jwt.sign(payload, decodedSecret, {
      algorithm: 'HS256',
      header: {
        'dd-ver': 'DD-JWT-V1'
      }
    });
    return token;
  } catch (error) {
    throw new Error(`Failed to sign DoorDash JWT: ${error.message}`);
  }
};

/**
 * Triggers a real DoorDash Drive API direct delivery request.
 * Endpoint: POST https://openapi.doordash.com/drive/v2/deliveries
 * 
 * @param {Object} order - The Mongoose Order document
 * @returns {Promise<Object>} - The API response or mapped simulation
 */
const triggerDeliveryAPI = async (order) => {
  // Prioritize pickup details defined on the restaurant order dynamically
  const pickupBusinessName = order.restaurantName || process.env.PICKUP_BUSINESS_NAME || 'The Premium Test Store';
  const pickupAddress = order.restaurantAddress || process.env.PICKUP_ADDRESS || '100 Main St, San Francisco, CA 94105';
  const pickupPhone = order.restaurantPhone || process.env.PICKUP_PHONE_NUMBER || '+16505550100';

  console.log(`\n\x1b[35m[DoorDash Service]\x1b[0m Triggering delivery for order ${order.externalDeliveryId}...`);

  try {
    // 1. Generate active JWT
    const token = generateJWT();
    console.log(`\x1b[35m[DoorDash Service]\x1b[0m JWT generated successfully.`);

    // 2. Prepare payload matching DoorDash Drive API v2 specifications
    const payload = {
      external_delivery_id: order.externalDeliveryId,
      pickup_address: pickupAddress,
      pickup_phone_number: pickupPhone,
      pickup_business_name: pickupBusinessName,
      dropoff_address: order.address,
      dropoff_phone_number: order.customerPhone,
      dropoff_name: order.customerName,
      order_value: Math.round(order.productPrice * 100), // convert USD to cents
      dropoff_instructions: order.courierNotes || undefined,
      scheduled_delivery_time: order.scheduledTime ? order.scheduledTime.toISOString() : undefined,
      items: [
        {
          name: order.productName,
          quantity: 1,
          price: Math.round(order.productPrice * 100)
        }
      ]
    };

    console.log(`\x1b[35m[DoorDash Service]\x1b[0m Requesting delivery from DoorDash Sandbox URL: https://openapi.doordash.com/drive/v2/deliveries`);
    
    // 3. Make real HTTP POST request to DoorDash OpenAPI
    const response = await axios.post(
      'https://openapi.doordash.com/drive/v2/deliveries', 
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log(`\x1b[32m[DoorDash Service] Success!\x1b[0m DoorDash Delivery ID: ${response.data.id || response.data.delivery_id}`);
    
    return {
      deliveryId: response.data.id || response.data.delivery_id,
      trackingUrl: response.data.tracking_url || `https://demo.doordash.com/tracking/${response.data.id}`,
      deliveryFee: response.data.fee || 0, // fee in cents
      pickupTime: response.data.pickup_time ? new Date(response.data.pickup_time) : null,
      deliveryTime: response.data.delivery_time ? new Date(response.data.delivery_time) : null,
      realRequest: true
    };

  } catch (error) {
    // Log the detailed error
    console.error(`\x1b[31m[DoorDash Service] API Call Failed:\x1b[0m`, error.response ? error.response.data : error.message);

    // If keys are missing/placeholder, do a realistic simulation so the user can test the app
    // Fall back to simulation only if credentials are completely missing/not configured.
    // If credentials are configured but fail, throw the error so the user gets clear feedback.
    if (isConfigMissing) {
      console.log(`\n\x1b[33m[DoorDash Service] SIMULATION MODE ACTIVE\x1b[0m`);
      console.log(`To test with the real API, configure DOORDASH_DEVELOPER_ID, KEY_ID, and SIGNING_SECRET in backend/.env`);
      console.log(`Generating simulated credentials for external ID: ${order.externalDeliveryId}\n`);
      
      const simulatedDeliveryId = `dd-sim-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const simulatedFee = 599; // $5.99 in cents
      const simulatedDeliveryTime = order.scheduledTime ? new Date(order.scheduledTime) : new Date(Date.now() + 45 * 60 * 1000);
      const simulatedPickupTime = order.scheduledTime 
        ? new Date(new Date(order.scheduledTime).getTime() - 25 * 60 * 1000) 
        : new Date(Date.now() + 20 * 60 * 1000);
      
      return {
        deliveryId: simulatedDeliveryId,
        trackingUrl: 'https://developer.doordash.com/portal/simulator',
        deliveryFee: simulatedFee,
        pickupTime: simulatedPickupTime,
        deliveryTime: simulatedDeliveryTime,
        realRequest: false
      };
    }
    
    // Otherwise throw the error up to the route handler
    throw error;
  }
};

/**
 * Fetches a delivery quote from DoorDash Drive API.
 * Endpoint: POST https://openapi.doordash.com/drive/v2/quotes
 * 
 * @param {String} pickupAddress
 * @param {String} dropoffAddress
 * @param {Number} orderValue - In USD
 * @returns {Promise<Object>} - Contains deliveryFee in cents, and timeline info
 */
const getDeliveryQuoteAPI = async (pickupAddress, dropoffAddress, orderValue, scheduledDeliveryTime) => {
  console.log(`\n\x1b[35m[DoorDash Service]\x1b[0m Requesting quote from "${pickupAddress}" to "${dropoffAddress}" at schedule: ${scheduledDeliveryTime || 'Now'}...`);
  try {
    const token = generateJWT();
    const payload = {
      external_delivery_id: `quote-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      pickup_address: pickupAddress,
      dropoff_address: dropoffAddress,
      order_value: Math.round(orderValue * 100), // convert to cents
      scheduled_delivery_time: scheduledDeliveryTime ? new Date(scheduledDeliveryTime).toISOString() : undefined
    };

    const response = await axios.post(
      'https://openapi.doordash.com/drive/v2/quotes', 
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log(`\x1b[32m[DoorDash Service] Quote Success!\x1b[0m Fee: ${response.data.fee} cents`);
    return {
      deliveryFee: response.data.fee, // in cents
      pickupTime: response.data.pickup_time ? new Date(response.data.pickup_time) : null,
      deliveryTime: response.data.delivery_time ? new Date(response.data.delivery_time) : null,
      realRequest: true
    };
  } catch (error) {
    console.error(`\x1b[31m[DoorDash Service] Quote API Failed:\x1b[0m`, error.response ? error.response.data : error.message);
    // Fall back to simulation only if credentials are completely missing/not configured.
    if (isConfigMissing) {
      console.log(`\n\x1b[33m[DoorDash Service] MOCK QUOTE GENERATED (Simulation Mode)\x1b[0m`);
      
      // Dynamic mock quote based on address mapping to simulate distance charges
      let simulatedFee = 599; // $5.99 in cents default
      const normalizedAddress = (dropoffAddress || '').toLowerCase();
      if (normalizedAddress.includes('oak st') || normalizedAddress.includes('union square')) {
        simulatedFee = 499; // $4.99
      } else if (normalizedAddress.includes('geary') || normalizedAddress.includes('lombard')) {
        simulatedFee = 699; // $6.99
      } else if (normalizedAddress.includes('valencia') || normalizedAddress.includes('mission')) {
        simulatedFee = 799; // $7.99
      } else if (normalizedAddress.length > 30) {
        simulatedFee = 899; // $8.99
      }
      
      // Mock validation checking for scheduled delivery slots:
      if (scheduledDeliveryTime) {
        const schDate = new Date(scheduledDeliveryTime);
        if (isNaN(schDate.getTime())) {
          throw new Error('Invalid scheduled time format.');
        }
        if (schDate.getTime() < Date.now() + 30 * 60 * 1000) {
          throw new Error('Scheduled delivery time must be at least 30-40 minutes in the future.');
        }
      }
      
      return {
        deliveryFee: simulatedFee,
        pickupTime: new Date(Date.now() + 20 * 60 * 1000),
        deliveryTime: scheduledDeliveryTime ? new Date(scheduledDeliveryTime) : new Date(Date.now() + 45 * 60 * 1000),
        realRequest: false
      };
    }
    throw error;
  }
};

module.exports = {
  generateJWT,
  triggerDeliveryAPI,
  getDeliveryQuoteAPI
};
