import Restaurant from '../models/Restaurant.js';
import { getDeliveryQuoteAPI } from '../services/doordashService.js';
import logger from '../utils/logger.js';

export const getRestaurantETA = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { address } = req.query;

    let restaurant;
    // Handle "lassi-lounge" slug or standard Object ID
    if (id === 'lassi-lounge') {
      restaurant = await Restaurant.findOne({ name: { $regex: /^lassi lounge$/i } }).select('prepTime address location');
    } else {
      restaurant = await Restaurant.findById(id).select('prepTime address location');
    }

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const prepTime = restaurant.prepTime || 15;
    let deliveryTime = null;

    if (address && restaurant.address) {
      try {
        // Try to get actual DoorDash quote (default order value $20)
        const quote = await getDeliveryQuoteAPI(restaurant.address, address, 20, null);
        if (quote && quote.deliveryTime) {
          const now = new Date();
          const dropoffDate = new Date(quote.deliveryTime);
          
          // Add prepTime offset to DoorDash delivery time estimation
          // DoorDash assumes order is ready now, so we add prepTime to the dropoff time
          const diffMs = dropoffDate.getTime() - now.getTime();
          const deliveryTransitMins = Math.round(diffMs / 60000);
          
          // Total Delivery ETA = Prep Time + Transit Time
          deliveryTime = prepTime + Math.max(0, deliveryTransitMins);
        }
      } catch (err) {
        const errReason = err.response?.data?.reason || err.response?.data?.error?.reason;
        if (errReason === 'distance_too_long' || err.message === 'OUT_OF_SERVICE_AREA') {
          return res.json({
            success: true,
            data: {
              prepTime,
              deliveryTime: null,
              isOutOfRange: true
            }
          });
        }
        logger.warn('Failed to get DoorDash quote for ETA, falling back to average', { error: err.message });
      }
    }

    if (!deliveryTime) {
      // Fallback if no address or DoorDash fails
      deliveryTime = prepTime + 20;
    }

    res.json({
      success: true,
      data: {
        prepTime, // Pickup ETA
        deliveryTime // Delivery ETA
      }
    });
  } catch (error) {
    logger.error('Error fetching ETA:', error);
    next(error);
  }
};
