import logger from '../../utils/logger.js';

// Simulation Mode Implementation for UberEats Direct
export const getDeliveryQuoteAPI = async (pickupAddress, dropoffAddress, subtotal, scheduledTime) => {
  logger.info(`Requesting UberEats quote: "${pickupAddress}" → "${dropoffAddress}"`);
  // Simulate API delay
  await new Promise(r => setTimeout(r, 800));
  
  // UberEats usually has slightly different fee structures. Randomize between 400 and 700 cents
  const simulatedFee = Math.floor(Math.random() * (700 - 400 + 1) + 400);
  
  logger.info(`UberEats quote received — Fee: ${simulatedFee} cents`);
  return { fee: simulatedFee };
};

export const triggerDeliveryAPI = async (order) => {
  logger.info(`Triggering UberEats delivery for order ${order.externalDeliveryId}`);
  await new Promise(r => setTimeout(r, 1000));
  
  const deliveryId = `UE-${Date.now()}`;
  logger.info(`UberEats delivery created — ID: ${deliveryId}`);
  
  return {
    deliveryId,
    trackingUrl: `https://ubereats.com/tracking/${deliveryId}`,
    fee: order.deliveryFee * 100 // convert to cents
  };
};

export const cancelDeliveryAPI = async (deliveryId) => {
  logger.info(`Canceling UberEats delivery: ${deliveryId}`);
  await new Promise(r => setTimeout(r, 500));
  return true;
};
