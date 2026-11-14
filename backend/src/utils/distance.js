import { AppError } from '../middleware/errorHandler.js';
import logger from './logger.js';

/**
 * Validates that delivery address coordinates are present and logs the straight-line distance.
 * Serviceability is determined dynamically by Shipday (DoorDash / Uber Eats availability)
 * unless an explicit MAX_DELIVERY_MILES environment variable is configured.
 */
export const validateDeliveryDistance = (restaurant, addressLat, addressLng, maxDistanceMiles = null) => {
  if (!addressLat || !addressLng || Number(addressLat) === 0 || Number(addressLng) === 0) {
    throw new AppError('Delivery address coordinates missing. Please select a valid address from the dropdown.', 400);
  }

  const configuredMaxMiles = maxDistanceMiles ?? (process.env.MAX_DELIVERY_MILES ? Number(process.env.MAX_DELIVERY_MILES) : null);

  if (restaurant?.location?.coordinates) {
    const [restLng, restLat] = restaurant.location.coordinates;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 3958.8; // Earth radius in miles
    const dLat = toRad(addressLat - restLat);
    const dLon = toRad(addressLng - restLng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(restLat)) * Math.cos(toRad(addressLat)) * Math.sin(dLon / 2) ** 2;
    const distanceMiles = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    if (configuredMaxMiles && distanceMiles > configuredMaxMiles) {
      throw new AppError(
        `Delivery is not available for this location. It is ${Math.round(distanceMiles)} miles away — maximum delivery distance is ${configuredMaxMiles} miles.`,
        400
      );
    }

    logger.info(`Delivery distance calculated: ${distanceMiles.toFixed(1)} miles (serviceability delegated to Shipday)`);
    return distanceMiles;
  }

  return 0;
};
