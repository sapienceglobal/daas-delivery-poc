import Order from '../models/Order.js';
import logger from '../utils/logger.js';

/**
 * Initialise MongoDB Change Streams to broadcast real-time order updates
 * via Socket.io. Each status change on an Order document triggers a push
 * to the restaurant's room.
 */
export const initChangeStreams = (io) => {
  try {
    const changeStream = Order.watch([], { fullDocument: 'updateLookup' });

    changeStream.on('change', (change) => {
      if (change.operationType === 'update' && change.fullDocument) {
        const order = change.fullDocument;
        const restaurantId = order.restaurantId?.toString();

        if (restaurantId) {
          io.to(restaurantId).emit('order_updated', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.paymentStatus,
            updatedAt: order.updatedAt
          });
        }

        // Also emit to a global orders channel for admin dashboards
        io.emit('global_order_update', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          restaurantId
        });
      }
    });

    changeStream.on('error', (error) => {
      logger.error('Change stream error', { error: error.message });
    });

    logger.info('MongoDB Change Streams initialized for real-time order sync');
  } catch (error) {
    // Change streams require a replica set — log and continue gracefully
    logger.warn('Change Streams unavailable (replica set required). Real-time sync will rely on manual Socket.io emits.', {
      error: error.message
    });
  }
};
