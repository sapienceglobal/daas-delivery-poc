import { AppError } from '../middleware/errorHandler.js';
import logger from './logger.js';

/**
 * Validates if the delivery address is within the maximum allowed radius (15 miles).
 * Throws an AppError if it's too far.
 */
export const validateDeliveryDistance = (restaurant, addressLat, addressLng, maxDistanceMiles = 15) => {
  if (!addressLat || !addressLng || Number(addressLat) === 0 || Number(addressLng) === 0) {
    // if we don't have lat/lng from the frontend, we must either geocode it or reject it.
    // for safety, if it's a delivery order, we should enforce valid coordinates.
    throw new AppError('Delivery address coordinates missing. Please select a valid address from the dropdown.', 400);
  }

  if (restaurant?.location?.coordinates) {
    const [restLng, restLat] = restaurant.location.coordinates;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 3958.8; // Earth radius in miles
    const dLat = toRad(addressLat - restLat);
    const dLon = toRad(addressLng - restLng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(restLat)) * Math.cos(toRad(addressLat)) * Math.sin(dLon / 2) ** 2;
    const distanceMiles = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    if (distanceMiles > maxDistanceMiles) {
      throw new AppError(
        `Delivery is not available for this location. It is ${Math.round(distanceMiles)} miles away — we deliver within ${maxDistanceMiles} miles.`,
        400
      );
    }
    
    logger.info(`Delivery distance check passed: ${distanceMiles.toFixed(1)} miles (max ${maxDistanceMiles})`);
    return distanceMiles;
  } else {
    throw new AppError('Restaurant location is not configured properly for delivery.', 500);
  }
};
