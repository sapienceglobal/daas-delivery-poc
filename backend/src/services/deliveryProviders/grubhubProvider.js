import logger from '../../utils/logger.js';

// simulation Mode Implementation for Grubhub
export const getDeliveryQuoteAPI = async (pickupAddress, dropoffAddress, subtotal, scheduledTime) => {
  logger.info(`Requesting Grubhub quote: "${pickupAddress}" → "${dropoffAddress}"`);
  // simulate API delay
  await new Promise(r => setTimeout(r, 700));
  
  // grubhub random fee between 450 and 650 cents
  const simulatedFee = Math.floor(Math.random() * (650 - 450 + 1) + 450);
  
  logger.info(`Grubhub quote received — Fee: ${simulatedFee} cents`);
  return { fee: simulatedFee };
};

export const triggerDeliveryAPI = async (order) => {
  logger.info(`Triggering Grubhub delivery for order ${order.externalDeliveryId}`);
  await new Promise(r => setTimeout(r, 1000));
  
  const deliveryId = `GH-${Date.now()}`;
  logger.info(`Grubhub delivery created — ID: ${deliveryId}`);
  
  return {
    deliveryId,
    trackingUrl: `https://grubhub.com/tracking/${deliveryId}`,
    fee: order.deliveryFee * 100 // convert to cents
  };
};

export const cancelDeliveryAPI = async (deliveryId) => {
  logger.info(`Canceling Grubhub delivery: ${deliveryId}`);
  await new Promise(r => setTimeout(r, 500));
  return true;
};
