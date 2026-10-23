import Restaurant from '../models/Restaurant.js';
import { getBestDeliveryQuote } from '../services/deliveryAggregatorService.js';
import logger from '../utils/logger.js';
import axios from 'axios';

// Haversine distance calculator in miles
const calculateDistanceMiles = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const getRestaurantETA = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { address, lat, lng } = req.query;

    let restaurant;
    if (id === 'lassi-lounge') {
      restaurant = await Restaurant.findOne({ name: { $regex: /^lassi lounge$/i } }).select('prepTime preparationTime address location deliveryRadius');
    } else {
      restaurant = await Restaurant.findById(id).select('prepTime preparationTime address location deliveryRadius');
    }

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const prepTime = restaurant.preparationTime || restaurant.prepTime || 15;
    const maxRadiusMiles = Number(restaurant.deliveryRadius) || 12;
    const restCoords = restaurant.location?.coordinates; // [lng, lat]

    // If NO address and NO coordinates provided, return pickup time and standard default
    if (!address && !lat && !lng) {
      return res.json({
        success: true,
        data: {
          prepTime,
          deliveryTime: prepTime + 20,
          isOutOfRange: false
        }
      });
    }

    // 1. Resolve coordinates (either from query or by geocoding address)
    let userLat = lat ? parseFloat(lat) : null;
    let userLng = lng ? parseFloat(lng) : null;

    const normalizedAddress = (address || '').toLowerCase().trim();

    // Fast check for foreign countries, non-US pincodes (e.g. 6-digit Indian PIN codes), or non-US states
    const isObviousForeignAddress = 
      /\b[1-9][0-9]{5}\b/.test(normalizedAddress) || // Indian 6-digit pin code like 110059
      /\b(india|delhi|\bdl\b|mumbai|bangalore|haryana|punjab|uk|london|australia|canada|france|germany|china|japan)\b/i.test(normalizedAddress);

    if (isObviousForeignAddress) {
      logger.info('Address recognized as outside service country/region:', { address });
      return res.json({
        success: true,
        data: {
          prepTime,
          deliveryTime: null,
          isOutOfRange: true,
          reason: 'Address is outside our delivery territory'
        }
      });
    }

    // If no coordinates provided but Google Maps key is available, attempt to geocode
    if ((!userLat || !userLng) && address && process.env.GOOGLE_MAPS_API_KEY) {
      try {
        const geoRes = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
          params: {
            address,
            key: process.env.GOOGLE_MAPS_API_KEY
          },
          timeout: 4000
        });
        const firstResult = geoRes.data?.results?.[0];
        if (firstResult?.geometry?.location) {
          userLat = firstResult.geometry.location.lat;
          userLng = firstResult.geometry.location.lng;

          // Check country component
          const countryComponent = firstResult.address_components?.find(c => c.types.includes('country'));
          if (countryComponent && countryComponent.short_name !== 'US') {
            return res.json({
              success: true,
              data: {
                prepTime,
                deliveryTime: null,
                isOutOfRange: true,
                reason: 'Delivery is only available in the United States'
              }
            });
          }
        }
      } catch (geoErr) {
        logger.warn('Google Maps geocode failed during ETA check:', { error: geoErr.message });
      }
    }

    // 2. Real Distance Check against Restaurant Coordinates
    let distanceMiles = null;
    if (userLat && userLng && Array.isArray(restCoords) && restCoords.length === 2) {
      const [restLng, restLat] = restCoords;
      distanceMiles = calculateDistanceMiles(restLat, restLng, userLat, userLng);

      if (distanceMiles > maxRadiusMiles) {
        logger.info(`Address is out of delivery radius: ${distanceMiles.toFixed(1)} miles (max ${maxRadiusMiles} miles)`, { address });
        return res.json({
          success: true,
          data: {
            prepTime,
            deliveryTime: null,
            isOutOfRange: true,
            distanceMiles: Math.round(distanceMiles),
            maxRadiusMiles,
            reason: `Address is ${Math.round(distanceMiles)} miles away, which exceeds our maximum delivery radius of ${maxRadiusMiles} miles.`
          }
        });
      }
    }

    // 3. Try to get actual delivery quote from provider (Shipday / DoorDash / Uber)
    let deliveryTime = null;
    if (address && restaurant.address) {
      try {
        const quote = await getBestDeliveryQuote(restaurant.address, address, 20, null);
        if (quote && quote.deliveryTime) {
          const now = new Date();
          const dropoffDate = new Date(quote.deliveryTime);
          const diffMs = dropoffDate.getTime() - now.getTime();
          const deliveryTransitMins = Math.round(diffMs / 60000);
          deliveryTime = prepTime + Math.max(0, deliveryTransitMins);
        } else if (quote && quote.fee > 0) {
          deliveryTime = prepTime + 25;
        }
      } catch (err) {
        const isDeliveryAreaError = /service area|outside.*area|out of range|no available delivery provider|unserviceable|too far/i.test(err.message || '');
        
        // If the error specifically indicates out of area/unserviceable, or if we had no verified distance
        if (isDeliveryAreaError || distanceMiles === null) {
          logger.warn('Delivery provider rejected address as out of area:', { address, error: err.message });
          return res.json({
            success: true,
            data: {
              prepTime,
              deliveryTime: null,
              isOutOfRange: true,
              reason: err.message || 'Delivery unavailable for this address'
            }
          });
        }

        // If distanceMiles is <= maxRadiusMiles and it was just a provider API config or temp error,
        // estimate based on distance instead of falsely blocking a nearby customer
        logger.info('Delivery quote API unavailable, using distance-based estimation:', { distanceMiles, error: err.message });
        const estimatedTransitMins = Math.max(10, Math.round(distanceMiles * 3) + 10);
        deliveryTime = prepTime + estimatedTransitMins;
      }
    }

    if (!deliveryTime) {
      deliveryTime = prepTime + (distanceMiles ? Math.max(10, Math.round(distanceMiles * 3) + 10) : 25);
    }

    res.json({
      success: true,
      data: {
        prepTime,
        deliveryTime,
        isOutOfRange: false
      }
    });
  } catch (error) {
    logger.error('Error fetching ETA:', error);
    next(error);
  }
};
