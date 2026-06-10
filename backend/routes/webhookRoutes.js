const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');

/**
 * Maps incoming DoorDash status strings to the PoC schema's statuses.
 * Accepts both exact DoorDash event names and simpler values for manual curl testing.
 */
const mapDoorDashStatus = (incomingStatus) => {
  if (!incomingStatus) return 'processing';
  
  const normalized = incomingStatus.toLowerCase();
  
  const statusMap = {
    // Driver Assigned
    'dasher_confirmed': 'driver_assigned',
    'dasher_assigned': 'driver_assigned',
    'driver_assigned': 'driver_assigned',
    'dasher_status_confirmed': 'driver_assigned',
    
    // Picked Up / En Route
    'dasher_picked_up': 'picked_up',
    'picked_up': 'picked_up',
    'en_route': 'picked_up',
    'in_transit': 'picked_up',
    
    // Delivered
    'delivered': 'delivered',
    'completed': 'delivered',
    'dasher_delivered': 'delivered',
    
    // Cancelled / Failed
    'cancelled': 'cancelled',
    'delivery_cancelled': 'cancelled',
    'failed': 'failed',
    'delivery_failed': 'failed'
  };

  return statusMap[normalized] || normalized;
};

/**
 * Creates a human-friendly description for the delivery timeline log.
 */
const getStatusDescription = (status, payload) => {
  const courierName = payload.dasher?.name || payload.dasher_name || 'Your courier';
  const phone = payload.dasher?.phone_number || payload.dasher_phone || '';
  const contactText = phone ? ` (Contact: ${phone})` : '';

  switch (status) {
    case 'driver_assigned':
      return `A courier partner (${courierName}) has been assigned to your order and is heading to the restaurant.${contactText}`;
    case 'picked_up':
      return `Your courier partner (${courierName}) has picked up your meal and is heading to your address.`;
    case 'delivered':
      return `Order successfully hand-delivered by ${courierName}. Enjoy your meal!`;
    case 'cancelled':
      return `The delivery request was cancelled. Reason: ${payload.cancellation_reason || 'Unknown'}`;
    case 'failed':
      return `Fulfillment attempt failed. Detail: ${payload.failure_reason || 'Courier issues'}`;
    default:
      return `Delivery status updated to ${status}`;
  }
};

/**
 * @route   POST /api/delivery-webhook
 * @desc    DoorDash Drive API webhook status update listener
 * @access  Public (Webhook)
 */
router.post('/', async (req, res) => {
  // HMAC-SHA256 Signature Verification
  const signatureHeader = req.headers.authorization;
  const secret = process.env.DOORDASH_SIGNING_SECRET || 'mock_signing_secret';
  
  if (process.env.NODE_ENV === 'production' || signatureHeader || process.env.DOORDASH_SIGNING_SECRET) {
    if (!signatureHeader || !signatureHeader.startsWith('Bearer ')) {
      console.warn(`\x1b[33m[Webhook Warning]\x1b[0m Rejecting webhook: Missing or malformed Authorization header.`);
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing webhook signature' });
    }

    const signature = signatureHeader.substring(7); // Extract token from "Bearer <token>"
    const rawBody = req.rawBody ? req.rawBody.toString('utf8') : '';
    
    // Compute expected signatures
    const expectedSignatureBase64 = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
    const expectedSignatureHex = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    
    // Timing safe comparison helper
    const compareSignatures = (sig1, sig2) => {
      if (!sig1 || !sig2 || sig1.length !== sig2.length) return false;
      return crypto.timingSafeEqual(Buffer.from(sig1, 'utf8'), Buffer.from(sig2, 'utf8'));
    };

    const isMatch = compareSignatures(signature, expectedSignatureBase64) || compareSignatures(signature, expectedSignatureHex);

    if (!isMatch) {
      console.error(`\x1b[31m[Webhook Error]\x1b[0m Webhook signature mismatch. Recv: "${signature}", Expected Base64: "${expectedSignatureBase64}" or Hex: "${expectedSignatureHex}"`);
      return res.status(401).json({ success: false, message: 'Unauthorized: Signature validation failed' });
    }
    console.log(`\x1b[32m[Webhook Security]\x1b[0m Webhook signature verified successfully using SHA256 HMAC.`);
  } else {
    console.log(`\x1b[33m[Webhook Security Warning]\x1b[0m Signature validation bypassed in development mode (No signature header or secret configured).`);
  }

  const payload = req.body;
  console.log(`\n\x1b[36m[Webhook Receiver]\x1b[0m Received status webhook payload:`, JSON.stringify(payload, null, 2));

  // Extract identifiers from DoorDash standard webhook payload
  // Note: DoorDash uses "delivery_id" or "id" and passes our unique ID in "external_delivery_id"
  const externalDeliveryId = payload.external_delivery_id;
  const deliveryId = payload.delivery_id || payload.id;
  const rawStatus = payload.status || payload.event_name;

  if (!externalDeliveryId && !deliveryId) {
    console.error(`\x1b[31m[Webhook Error]\x1b[0m Received webhook without valid tracking identifiers.`);
    return res.status(400).json({ 
      success: false, 
      message: 'Missing identification properties: external_delivery_id or delivery_id required' 
    });
  }

  try {
    // Find the matching order in our database
    let order = null;
    if (externalDeliveryId) {
      order = await Order.findOne({ externalDeliveryId });
    } else if (deliveryId) {
      order = await Order.findOne({ deliveryId });
    }

    if (!order) {
      console.warn(`\x1b[33m[Webhook Warning]\x1b[0m Webhook received for untracked delivery (ID: ${deliveryId || externalDeliveryId}). Ignored.`);
      return res.status(404).json({ 
        success: false, 
        message: 'No corresponding order found in PoC database' 
      });
    }

    // Map DoorDash API status to PoC local status
    const mappedStatus = mapDoorDashStatus(rawStatus);

    // Prevent duplicate logs for the same status if webhook retries or sends multiple updates
    if (order.deliveryStatus === mappedStatus) {
      console.log(`\x1b[36m[Webhook Receiver]\x1b[0m Order ${order._id} is already in status: ${mappedStatus}. Acknowledging without duplicate update.`);
      return res.status(200).json({ success: true, message: 'Status already up-to-date.' });
    }

    // Generate descriptive text and update the order
    const statusDescription = getStatusDescription(mappedStatus, payload);

    order.deliveryStatus = mappedStatus;
    
    // Parse and update real-time driver coordinates from DoorDash webhook
    if (payload.dasher_location && typeof payload.dasher_location.lat === 'number' && typeof payload.dasher_location.lng === 'number') {
      order.dasherLat = payload.dasher_location.lat;
      order.dasherLng = payload.dasher_location.lng;
      console.log(`\x1b[36m[Webhook Receiver]\x1b[0m Captured courier GPS coordinates: [${order.dasherLat}, ${order.dasherLng}]`);
    }
    
    // In case this is our first time getting the official delivery ID from the carrier
    if (deliveryId && !order.deliveryId) {
      order.deliveryId = deliveryId;
    }
    
    order.statusUpdates.push({
      status: mappedStatus,
      description: statusDescription,
      timestamp: new Date()
    });

    await order.save();
    console.log(`\x1b[32m[Webhook Success]\x1b[0m Order ${order._id} updated to status "${mappedStatus}" successfully.\x1b[0m`);

    // Emit Socket.io update event
    const io = req.app.get('io');
    if (io) {
      if (order.restaurantId) {
        io.to(order.restaurantId.toString()).emit('ORDER_UPDATED', order);
      }
      io.emit('ORDER_UPDATED', order);
    }

    res.status(200).json({ 
      success: true, 
      message: `Webhook processed. Order status updated to: ${mappedStatus}` 
    });

  } catch (error) {
    console.error(`\x1b[31m[Webhook Error] Processing failure:\x1b[0m`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process webhook status update', 
      error: error.message 
    });
  }
});

module.exports = router;
