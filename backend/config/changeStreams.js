const Order = require('../models/Order');

/**
 * Initializes MongoDB Change Streams on the Order collection.
 * Catches errors gracefully to handle local standalone MongoDB instances without replica sets.
 * @param {Object} io - Socket.io instance
 */
const initChangeStreams = (io) => {
  if (!io) {
    console.warn('[Change Stream] Socket.io instance not provided. Skipping Change Streams.');
    return;
  }

  try {
    // Watch the Order collection. Using updateLookup ensures full document availability on update events.
    const changeStream = Order.watch([], { fullDocument: 'updateLookup' });

    changeStream.on('change', async (change) => {
      try {
        console.log(`\x1b[35m[Change Stream]\x1b[0m Collection changed: ${change.operationType}`);
        
        if (change.operationType === 'insert') {
          const order = change.fullDocument;
          if (order) {
            const restaurantIdStr = order.restaurantId ? order.restaurantId.toString() : null;
            if (restaurantIdStr) {
              io.to(restaurantIdStr).emit('NEW_ORDER', order);
              console.log(`\x1b[35m[Change Stream]\x1b[0m Emitted NEW_ORDER for order ${order._id} to room ${restaurantIdStr}`);
            }
            // Emit globally so customer-side order tracking pages update in real-time
            io.emit('ORDER_UPDATED', order);
          }
        } else if (change.operationType === 'update' || change.operationType === 'replace') {
          const order = change.fullDocument;
          if (order) {
            const restaurantIdStr = order.restaurantId ? order.restaurantId.toString() : null;
            if (restaurantIdStr) {
              io.to(restaurantIdStr).emit('ORDER_UPDATED', order);
            }
            io.emit('ORDER_UPDATED', order);
            console.log(`\x1b[35m[Change Stream]\x1b[0m Emitted ORDER_UPDATED for order ${order._id}`);
          }
        }
      } catch (innerErr) {
        console.error('[Change Stream Callback Error]', innerErr.message);
      }
    });

    changeStream.on('error', (err) => {
      console.warn('[Change Stream Error] Change stream error (likely standalone MongoDB instance):', err.message);
      changeStream.close();
    });

    console.log('\x1b[32m[Change Stream] Orders change stream listener successfully initialized.\x1b[0m');
  } catch (err) {
    console.warn('[Change Stream] Failed to initialize Order watch (unsupported standalone deployment?):', err.message);
  }
};

module.exports = { initChangeStreams };
