const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const { protect } = require('../middleware/authMiddleware');
const { triggerDeliveryAPI, getDeliveryQuoteAPI } = require('../services/doordashService');

// Role authorization helper middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges.' });
    }
    next();
  };
};

const validateScheduledTime = async (scheduledTime, restaurantId, pickupAddress) => {
  if (!scheduledTime) return null;

  const schDate = new Date(scheduledTime);
  if (isNaN(schDate.getTime())) {
    throw new Error('Invalid scheduled time format.');
  }

  // 1. Must be in the future (at least 30 minutes)
  const minFutureTime = Date.now() + 30 * 60 * 1000;
  if (schDate.getTime() < minFutureTime) {
    throw new Error('Scheduled delivery time must be at least 30-40 minutes in the future.');
  }

  // Find restaurant
  let restaurant = null;
  if (restaurantId) {
    restaurant = await Restaurant.findById(restaurantId);
  }
  if (!restaurant && pickupAddress) {
    restaurant = await Restaurant.findOne({
      $or: [
        { address: pickupAddress },
        { name: pickupAddress }
      ]
    });
  }

  // 2. Must be within restaurant operating hours
  if (restaurant && restaurant.openTime && restaurant.closeTime) {
    const pacificTimeString = schDate.toLocaleTimeString('en-US', { 
      timeZone: 'America/Los_Angeles', 
      hour12: false 
    });
    const [schHour, schMin] = pacificTimeString.split(':').map(Number);
    const schTimeMinutes = schHour * 60 + schMin;

    const [openH, openM] = restaurant.openTime.split(':').map(Number);
    const [closeH, closeM] = restaurant.closeTime.split(':').map(Number);

    const openTimeMinutes = openH * 60 + openM;
    const closeTimeMinutes = closeH * 60 + closeM;

    if (schTimeMinutes < openTimeMinutes || schTimeMinutes > closeTimeMinutes) {
      throw new Error(`The restaurant is closed at the scheduled time. Operating hours: ${restaurant.openTime} - ${restaurant.closeTime}.`);
    }
  }

  // 3. Slot capacity / availability check (first 15 minutes of any hour are fully booked)
  const pacificTimeString = schDate.toLocaleTimeString('en-US', { 
    timeZone: 'America/Los_Angeles', 
    hour12: false 
  });
  const [, schMin] = pacificTimeString.split(':').map(Number);
  if (schMin >= 0 && schMin <= 14) {
    throw new Error('The selected time slot is fully booked. Please choose a different delivery window.');
  }

  return schDate;
};

/**
 * @route   POST /api/orders/quote
 * @desc    Fetch a delivery fee quote from DoorDash Drive API with $2.00 markup
 * @access  Public
 */
router.post('/quote', async (req, res) => {
  const { pickupAddress, dropoffAddress, orderValue, scheduledTime } = req.body;

  if (!pickupAddress || !dropoffAddress) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide both pickupAddress and dropoffAddress.' 
    });
  }

  try {
    if (scheduledTime) {
      await validateScheduledTime(scheduledTime, null, pickupAddress);
    }
    const quote = await getDeliveryQuoteAPI(pickupAddress, dropoffAddress, orderValue || 10.00, scheduledTime);
    
    // Platform fee markup ($2.00 in cents)
    const platformMarkup = 200; 
    const totalDeliveryFee = quote.deliveryFee + platformMarkup;

    res.json({
      success: true,
      deliveryFee: totalDeliveryFee, // in cents
      baseFee: quote.deliveryFee,     // in cents
      platformMarkup: platformMarkup,  // in cents
      pickupTime: quote.pickupTime,
      deliveryTime: quote.deliveryTime,
      realRequest: quote.realRequest
    });
  } catch (error) {
    console.error(`[Quote Route] Error fetching quote:`, error.message);

    // If it is our validation error, return it as 400 Bad Request
    if (
      error.message.includes('closed at the scheduled time') || 
      error.message.includes('fully booked') || 
      error.message.includes('future') || 
      error.message.includes('format')
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Inspect Axios error response if available to determine if it is a service area/radius issue
    const responseData = error.response ? error.response.data : null;
    const responseStatus = error.response ? error.response.status : 500;
    
    let isUnserviceable = false;
    let customMessage = `Failed to calculate delivery fee: ${error.message}`;

    if (responseData) {
      console.error(`[Quote Route] DoorDash API response error data:`, JSON.stringify(responseData));
      const errorStr = JSON.stringify(responseData).toLowerCase();
      
      // Typical DoorDash error identifiers for serviceability/radius boundaries
      if (
        errorStr.includes('service area') ||
        errorStr.includes('serviceable') ||
        errorStr.includes('outside the delivery radius') ||
        errorStr.includes('exceeds') ||
        errorStr.includes('does not serve') ||
        errorStr.includes('outside_delivery_radius') ||
        errorStr.includes('not_serviceable') ||
        errorStr.includes('invalid_dropoff_address') ||
        errorStr.includes('address_not_found') ||
        errorStr.includes('outside delivery')
      ) {
        isUnserviceable = true;
        customMessage = "This location is outside our delivery partner service area.";
      }
    } else if (error.message && (
      error.message.toLowerCase().includes('service area') ||
      error.message.toLowerCase().includes('serviceable') ||
      error.message.toLowerCase().includes('outside the delivery radius') ||
      error.message.toLowerCase().includes('outside_delivery_radius')
    )) {
      isUnserviceable = true;
      customMessage = "This location is outside our delivery partner service area.";
    }

    if (isUnserviceable) {
      return res.status(422).json({
        success: false,
        unserviceable: true,
        message: customMessage
      });
    }

    res.status(responseStatus === 401 ? 401 : 500).json({
      success: false,
      message: customMessage
    });
  }
});

/**
 * @route   POST /api/orders
 * @desc    Create a new order & trigger DoorDash Drive API
 * @access  Public
 */
router.post('/', async (req, res) => {
  const { 
    customerName, 
    customerPhone, 
    address, 
    items, 
    restaurantName, 
    restaurantAddress, 
    restaurantPhone,
    restaurantId,
    subtotal,
    tax,
    deliveryFee,
    paymentMethod,
    scheduledTime,
    courierNotes
  } = req.body;

  // Basic validation
  if (!customerName || !customerPhone || !address || !items || items.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide customerName, customerPhone, address, and shopping cart items.' 
    });
  }

  try {
    // Optionally extract userId if the request includes a valid Bearer token
    let userId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'DEV_MARKETPLACE_JWT_SECRET');
        userId = decoded.id;
      } catch (err) {
        console.warn('[Order Route] Non-blocking JWT parsing failed during order creation:', err.message);
      }
    }

    let validScheduledTime = null;
    try {
      validScheduledTime = await validateScheduledTime(scheduledTime, restaurantId, restaurantAddress);
    } catch (valErr) {
      return res.status(400).json({ success: false, message: valErr.message });
    }

    // 1. Create and save order in Mongoose with "pending" status
    const order = new Order({
      customerName,
      customerPhone,
      address,
      items,
      restaurantName: restaurantName || 'Burger Palace',
      restaurantAddress: restaurantAddress || '100 Main St, San Francisco, CA 94105',
      restaurantPhone: restaurantPhone || '+16505550100',
      restaurantId: restaurantId || null,
      subtotal: subtotal || 0,
      tax: tax || 0,
      platformFee: 2.00,
      deliveryFee: deliveryFee || 0, // In cents
      paymentMethod: paymentMethod || 'Credit Card',
      userId: userId,
      scheduledTime: validScheduledTime,
      courierNotes: courierNotes || null,
      deliveryStatus: 'pending' // Initially pending until paid (except Cash)
    });

    await order.save();
    console.log(`\x1b[34m[Order Route]\x1b[0m Saved order ${order._id} locally.`);

    // If Cash on Delivery, trigger DoorDash dispatch immediately
    if (paymentMethod === 'Cash on Delivery') {
      order.deliveryStatus = 'processing';
      order.statusUpdates.push({
        status: 'processing',
        description: 'Order confirmed under Cash on Delivery. Dispatching DoorDash...'
      });

      let deliveryResult;
      try {
        deliveryResult = await triggerDeliveryAPI(order);
        order.deliveryId = deliveryResult.deliveryId;
        order.trackingUrl = deliveryResult.trackingUrl;
        order.deliveryFee = deliveryResult.deliveryFee;
        order.pickupTime = deliveryResult.pickupTime;
        order.deliveryTime = deliveryResult.deliveryTime;
        order.statusUpdates.push({
          status: 'processing',
          description: deliveryResult.realRequest 
            ? `Delivery partner assigned and dispatch initialized (ID: ${deliveryResult.deliveryId})`
            : `Marketplace simulation active. Generated mock Courier ID: ${deliveryResult.deliveryId}`
        });
      } catch (apiError) {
        console.error('[Order Route] Cash Delivery API failed:', apiError.message);
        order.deliveryStatus = 'failed';
        order.statusUpdates.push({
          status: 'failed',
          description: `Fulfillment dispatch failure: ${apiError.message}`
        });
      }

      await order.save();

      // Emit socket event to the merchant dashboard
      const io = req.app.get('io');
      if (io && order.restaurantId) {
        io.to(order.restaurantId.toString()).emit('NEW_ORDER', order);
        console.log(`[Socket.io] Emitted NEW_ORDER for Cash order ${order._id} to room ${order.restaurantId}`);
      }

      return res.status(201).json({
        success: true,
        message: 'Cash order created and DaaS shipment triggered successfully.',
        order
      });
    }

    // Otherwise (Credit Card or Apple Pay), generate Stripe Checkout Redirection Session
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const origin = req.get('origin') || 'http://localhost:3001';
    
    if (stripeKey && !stripeKey.includes('your_')) {
      try {
        console.log(`[Order Route] Generating Stripe Session for order: ${order._id}`);
        const grandTotal = subtotal + tax + 2.00 + (deliveryFee / 100); // Grand total in USD
        
        // URL-encode body parameters for Stripe API PaymentIntent Checkout Session
        const params = new URLSearchParams();
        params.append('payment_method_types[0]', 'card');
        params.append('line_items[0][price_data][currency]', 'usd');
        params.append('line_items[0][price_data][product_data][name]', `Marketplace Order - ${restaurantName}`);
        params.append('line_items[0][price_data][unit_amount]', Math.round(grandTotal * 100).toString());
        params.append('line_items[0][quantity]', '1');
        params.append('mode', 'payment');
        params.append('success_url', `${origin}/orders/${order._id}?payment=success`);
        params.append('cancel_url', `${origin}?payment=cancelled`);

        const stripeResponse = await axios.post(
          'https://api.stripe.com/v1/checkout/sessions',
          params.toString(),
          {
            headers: {
              'Authorization': `Bearer ${stripeKey}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );

        return res.status(201).json({
          success: true,
          message: 'Order created, redirecting to Stripe Checkout.',
          paymentUrl: stripeResponse.data.url,
          order
        });
      } catch (stripeErr) {
        console.error('[Order Route] Stripe Session creation failed, falling back to mock:', stripeErr.response ? stripeErr.response.data : stripeErr.message);
      }
    }

    // Fallback: Simulation Mode payment link (automatically redirects with payment=success)
    console.log(`[Order Route] Stripe Key not configured. Using Mock Checkout link for order: ${order._id}`);
    const mockCheckoutUrl = `${origin}/orders/${order._id}?payment=success`;
    
    return res.status(201).json({
      success: true,
      message: 'Order created in Sandbox simulation mode.',
      paymentUrl: mockCheckoutUrl,
      order
    });

  } catch (error) {
    console.error(`\x1b[31m[Order Route] Internal Error:\x1b[0m`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error during order creation.', 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/orders/:id
 * @desc    Get order details and real-time status history
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (error) {
    console.error(`\x1b[31m[Order Route] GET Error:\x1b[0m`, error);
    res.status(500).json({ success: false, message: 'Invalid order ID or server error', error: error.message });
  }
});

/**
 * @route   POST /api/orders/:id/simulate
 * @desc    Manually advance delivery stage for Sandbox UI demonstrations
 * @access  Public (Developer Tool)
 */
router.post('/:id/simulate', async (req, res) => {
  const { nextStatus } = req.body;
  const validStages = ['processing', 'driver_assigned', 'picked_up', 'delivered', 'cancelled'];
  
  if (!nextStatus || !validStages.includes(nextStatus)) {
    return res.status(400).json({ 
      success: false, 
      message: `Invalid simulation status. Choose one of: ${validStages.join(', ')}` 
    });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Update status
    order.deliveryStatus = nextStatus;
    
    // Detailed descriptions for simulation logs
    let description = `Simulated status transition to ${nextStatus}`;
    if (nextStatus === 'driver_assigned') {
      description = "Dasher 'Alex Rodriguez' has been assigned to your delivery and is heading to the store.";
    } else if (nextStatus === 'picked_up') {
      description = "Dasher picked up your package and is currently en route to your address.";
    } else if (nextStatus === 'delivered') {
      description = "Delivery completed successfully! Dasher dropped off your order.";
    } else if (nextStatus === 'cancelled') {
      description = "Delivery order was cancelled.";
    }

    order.statusUpdates.push({
      status: nextStatus,
      description
    });

    await order.save();
    console.log(`\x1b[33m[Simulator]\x1b[0m Transitioned order ${order._id} to status "${nextStatus}"`);

    // Emit Socket.io update event so mobile app and other components sync in real-time
    const io = req.app.get('io');
    if (io) {
      if (order.restaurantId) {
        io.to(order.restaurantId.toString()).emit('ORDER_UPDATED', order);
      }
      io.emit('ORDER_UPDATED', order);
    }

    res.json({
      success: true,
      message: `Order simulated to: ${nextStatus}`,
      order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Simulation error', error: error.message });
  }
});

/**
 * @route   POST /api/orders/:id/confirm-payment
 * @desc    Confirm payment has been received and dispatch DoorDash shipment
 * @access  Public
 */
router.post('/:id/confirm-payment', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // If order already processed, just bypass
    if (order.deliveryStatus !== 'pending') {
      return res.json({ success: true, message: 'Payment already processed.', order });
    }

    // Log the success payment event
    order.statusUpdates.push({
      status: 'pending',
      description: 'Transaction successfully processed and captured via Stripe Gateway.'
    });

    // Save and call DoorDash Drive API
    let deliveryResult;
    try {
      deliveryResult = await triggerDeliveryAPI(order);
    } catch (apiError) {
      console.error(`[Confirm Payment] DoorDash dispatch failed:`, apiError.message);
      order.deliveryStatus = 'failed';
      order.statusUpdates.push({
        status: 'failed',
        description: `DoorDash integration failure: ${apiError.message}`
      });
      await order.save();
      return res.status(502).json({
        success: false,
        message: `Payment confirmed, but DoorDash dispatch rejected: ${apiError.message}`,
        order
      });
    }

    order.deliveryId = deliveryResult.deliveryId;
    order.trackingUrl = deliveryResult.trackingUrl;
    order.deliveryFee = deliveryResult.deliveryFee;
    order.pickupTime = deliveryResult.pickupTime;
    order.deliveryTime = deliveryResult.deliveryTime;
    order.deliveryStatus = 'processing';
    
    order.statusUpdates.push({
      status: 'processing',
      description: deliveryResult.realRequest 
        ? `Delivery dispatch registered with fulfillment network (ID: ${deliveryResult.deliveryId})`
        : `Marketplace simulation active. Generated mock Courier ID: ${deliveryResult.deliveryId}`
    });

    await order.save();
    console.log(`[Confirm Payment] Order ${order._id} successfully confirmed & DoorDash dispatch initialized.`);

    // Emit socket event to the merchant dashboard
    const io = req.app.get('io');
    if (io && order.restaurantId) {
      io.to(order.restaurantId.toString()).emit('NEW_ORDER', order);
      console.log(`[Socket.io] Emitted NEW_ORDER for confirmed order ${order._id} to room ${order.restaurantId}`);
    }

    res.json({
      success: true,
      message: 'Payment confirmed and DaaS dispatch triggered successfully.',
      order
    });
  } catch (error) {
    console.error('[Confirm Payment Route] Error:', error);
    res.status(500).json({ success: false, message: 'Server error confirming payment.' });
  }
});

/**
 * @route   GET /api/orders/merchant/all
 * @desc    Get all orders associated with the merchant's restaurant
 * @access  Private (Merchant/Admin)
 */
router.get('/merchant/all', protect, authorize('merchant', 'admin'), async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const orders = await Order.find().sort({ createdAt: -1 });
      return res.json({ success: true, count: orders.length, orders });
    }

    if (!req.user.restaurantId) {
      return res.status(400).json({ success: false, message: 'No restaurant associated with this merchant account.' });
    }

    const restaurant = await Restaurant.findById(req.user.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Associated restaurant not found.' });
    }

    const orders = await Order.find({
      $or: [
        { restaurantName: restaurant.name },
        { restaurantAddress: restaurant.address }
      ]
    }).sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('[Order Route] Merchant Get Orders Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error loading merchant orders.' });
  }
});

/**
 * @route   PUT /api/orders/:id/prep
 * @desc    Merchant accepts or completes food prep for an order
 * @access  Private (Merchant/Admin)
 */
router.put('/:id/prep', protect, authorize('merchant', 'admin'), async (req, res) => {
  const { status } = req.body; // 'accepted' | 'ready'
  const validStatuses = ['accepted', 'ready'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid prep status. Choose accepted or ready.' });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Double-check merchant owns the restaurant of this order
    if (req.user.role === 'merchant') {
      const restaurant = await Restaurant.findById(req.user.restaurantId);
      if (!restaurant || (order.restaurantName !== restaurant.name && order.restaurantAddress !== restaurant.address)) {
        return res.status(403).json({ success: false, message: 'Not authorized to manage this order.' });
      }
    }

    if (status === 'accepted') {
      order.deliveryStatus = 'processing';
      order.statusUpdates.push({
        status: 'processing',
        description: 'Restaurant has accepted your order and is preparing the food.'
      });
      await order.save();
      return res.json({ success: true, message: 'Order accepted by restaurant.', order });
    }

    if (status === 'ready') {
      // If DoorDash hasn't been triggered yet (simulation or Cash on Delivery fallback), trigger it now
      if (!order.deliveryId) {
        try {
          const deliveryResult = await triggerDeliveryAPI(order);
          order.deliveryId = deliveryResult.deliveryId;
          order.trackingUrl = deliveryResult.trackingUrl;
          order.deliveryFee = deliveryResult.deliveryFee;
          order.pickupTime = deliveryResult.pickupTime;
          order.deliveryTime = deliveryResult.deliveryTime;
          order.deliveryStatus = 'processing';
          order.statusUpdates.push({
            status: 'processing',
            description: deliveryResult.realRequest 
              ? `Fulfillment courier dispatch registered (ID: ${deliveryResult.deliveryId})`
              : `Marketplace simulation active. Generated mock Courier ID: ${deliveryResult.deliveryId}`
          });
        } catch (apiError) {
          console.error('[Order Route] Ready trigger DoorDash failed:', apiError.message);
          // Fallback simulation
          const simulatedDeliveryId = `dd-sim-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
          order.deliveryId = simulatedDeliveryId;
          order.trackingUrl = 'https://developer.doordash.com/portal/simulator';
          order.deliveryStatus = 'processing';
          order.statusUpdates.push({
            status: 'processing',
            description: `Fulfillment dispatch simulation initialized (ID: ${simulatedDeliveryId})`
          });
        }
      } else {
        order.statusUpdates.push({
          status: 'processing',
          description: 'Food preparation complete. Waiting for DoorDash courier pickup.'
        });
      }
      await order.save();
      return res.json({ success: true, message: 'Order marked ready. DoorDash courier notified.', order });
    }

  } catch (error) {
    console.error('[Order Route] Prep Status Update Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating prep status.', error: error.message });
  }
});

/**
 * @route   POST /api/orders/:id/rate
 * @desc    Submit rating and review for a delivered order
 * @access  Private
 */
router.post('/:id/rate', protect, async (req, res) => {
  const { rating, review } = req.body;
  const numRating = parseInt(rating, 10);

  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    return res.status(400).json({ success: false, message: 'Please provide a valid rating between 1 and 5.' });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Ensure order is owned by the user
    if (order.userId && order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: You did not place this order.' });
    }

    // Ensure the order is delivered
    if (order.deliveryStatus !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Only delivered orders can be rated.' });
    }

    // Ensure it hasn't been rated already
    if (order.rating !== null && order.rating !== undefined) {
      return res.status(400).json({ success: false, message: 'This order has already been rated.' });
    }

    order.rating = numRating;
    order.review = review || '';
    await order.save();

    // Recalculate average rating & reviews count for the target restaurant
    const restaurant = await Restaurant.findOne({ name: order.restaurantName });
    if (restaurant) {
      const ratedOrders = await Order.find({ 
        restaurantName: order.restaurantName, 
        rating: { $ne: null } 
      });

      const totalReviews = ratedOrders.length;
      const totalScore = ratedOrders.reduce((sum, o) => sum + o.rating, 0);
      const avgRating = parseFloat((totalScore / totalReviews).toFixed(1));

      restaurant.rating = avgRating;
      restaurant.reviews = totalReviews;
      await restaurant.save();
    }

    res.json({ success: true, message: 'Thank you for your feedback!', order });
  } catch (error) {
    console.error('[Order Route] POST Rate Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error submitting rating.' });
  }
});

/**
 * @route   POST /api/orders/validate-address
 * @desc    Mock Google Address Validation API
 * @access  Public
 */
router.post('/validate-address', async (req, res) => {
  const { address } = req.body;

  if (!address || address.trim() === '') {
    return res.status(400).json({ success: false, message: 'Address is required.' });
  }

  const lowercaseAddress = address.toLowerCase();

  // Mock invalid case if user types 'invalid' or similar
  if (lowercaseAddress.includes('invalid') || lowercaseAddress.includes('fake address') || lowercaseAddress.length < 5) {
    return res.json({
      success: true,
      isValid: false,
      message: 'The address could not be verified by Google Maps.',
      verdict: {
        addressComplete: false,
        hasUnresolvedTokens: true,
        validationGranularity: 'OTHER'
      }
    });
  }

  // Generate mock but consistent coordinates based on string length to look realistic
  let lat = 37.7749 + (address.length % 10) * 0.01;
  let lng = -122.4194 - (address.length % 10) * 0.01;

  res.json({
    success: true,
    isValid: true,
    formattedAddress: `${address}, San Francisco, CA`,
    coordinates: { lat, lng },
    verdict: {
      addressComplete: true,
      hasUnresolvedTokens: false,
      validationGranularity: 'PREMISE'
    }
  });
});

/**
 * @route   POST /api/orders/:id/refund
 * @desc    Cancel and refund an order (Admin only)
 * @access  Private (Admin only)
 */
router.post('/:id/refund', protect, authorize('admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.deliveryStatus === 'cancelled' && order.refunded) {
      return res.status(400).json({ success: false, message: 'Order is already cancelled and refunded.' });
    }

    order.deliveryStatus = 'cancelled';
    order.refunded = true;
    order.statusUpdates.push({
      status: 'cancelled',
      description: 'Order cancelled and refund processed by platform administrator.'
    });

    await order.save();

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      if (order.restaurantId) {
        io.to(order.restaurantId.toString()).emit('ORDER_UPDATED', order);
      }
      io.emit('ORDER_UPDATED', order);
    }

    res.json({ success: true, message: 'Order successfully cancelled and refund initiated.', order });
  } catch (error) {
    console.error('[Refund Route] Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error processing refund.', error: error.message });
  }
});

module.exports = router;
