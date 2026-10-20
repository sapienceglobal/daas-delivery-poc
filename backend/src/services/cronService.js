import cron from 'node-cron';
import { rollbackLoyaltyPoints, awardLoyaltyPoints, processAutoRefund } from '../controllers/orderController.js';
import { buildOrderSocketPayload } from './deliverySyncService.js';
import { createNotification } from '../controllers/notificationController.js';
import logger from '../utils/logger.js';

export const initCronJobs = (io, getModel) => {
  logger.info('Initializing background cron jobs...');

  // run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const Order = getModel('Order');
      const now = Date.now();
      
      // 1. Auto-Cancel: 40 minutes ago for 'pending'
      const pendingCutoff = new Date(now - 40 * 60 * 1000);
      
      // 2. Auto-Cancel: 2 hours ago for 'accepted', 'preparing', 'ready'
      const prepCutoff = new Date(now - 2 * 60 * 60 * 1000);
      
      // 3. Auto-Complete: 4 hours ago for 'picked_up'
      const deliveryCutoff = new Date(now - 4 * 60 * 60 * 1000);

      // 4. Auto-Complete: 8 hours ago for pickup/dine-in 'ready' orders
      const pickupReadyCutoff = new Date(now - 8 * 60 * 60 * 1000);

      // --- Rule 1: Pending Timeout (5 mins) ---
      const stalePendingOrders = await Order.find({
        status: 'pending',
        createdAt: { $lt: pendingCutoff }
      });

      for (const order of stalePendingOrders) {
        await processAutoCancel(
          order, 
          'Auto-cancelled: Merchant did not accept in time',
          `We're sorry, ${order.restaurantName} is currently busy and couldn't accept your order in time. Any eligible charges and loyalty points have been reversed.`,
          io, 
          getModel
        );
      }

      // 2. Auto-Complete: 2 hours ago for 'accepted', 'preparing', 'ready' (both pickup & delivery)
      // Do not auto-complete orders whose rider dispatch is legitimately scheduled for the future
      const stalePrepOrders = await Order.find({
        status: { $in: ['accepted', 'preparing', 'ready'] },
        updatedAt: { $lt: prepCutoff },
        $nor: [
          { dispatchStatus: 'scheduled', dispatchAt: { $gt: new Date() } }
        ]
      });

      for (const order of stalePrepOrders) {
        const isPickup = ['pickup', 'dine-in', 'dine_in'].includes(order.orderType);
        await processAutoComplete(
          order,
          'Auto-completed: Order assumed completed after 2 hours',
          isPickup
            ? `Your pickup order from ${order.restaurantName} has been completed. Hope you enjoyed your meal!`
            : `Your order from ${order.restaurantName} has been marked as delivered. Hope you enjoyed your meal!`,
          io,
          getModel
        );
      }

      // --- Rule 3: Delivery Neglect (4 hours) ---
      const staleDeliveryOrders = await Order.find({
        status: 'picked_up',
        orderType: { $nin: ['pickup', 'dine-in', 'dine_in'] },
        updatedAt: { $lt: deliveryCutoff }
      });

      for (const order of staleDeliveryOrders) {
        await processAutoComplete(
          order,
          'Auto-completed: Assumed delivered after 4 hours',
          `Your order from ${order.restaurantName} has been marked as delivered. Hope you enjoyed your meal!`,
          io,
          getModel
        );
      }

      // --- Rule 4: Auto-complete stale pickup/dine-in 'ready' orders (8 hours) ---
      // If a pickup order was marked 'ready' and merchant forgot to mark it 'picked_up',
      // assume customer already collected the food and auto-complete it.
      const stalePickupReadyOrders = await Order.find({
        status: { $in: ['ready', 'ready_for_pickup'] },
        orderType: { $in: ['pickup', 'dine_in', 'dine-in'] },
        updatedAt: { $lt: pickupReadyCutoff }
      });

      for (const order of stalePickupReadyOrders) {
        await processAutoComplete(
          order,
          'Auto-completed: Pickup order assumed collected after 8 hours',
          `Your pickup order from ${order.restaurantName} has been completed. Hope you enjoyed your meal!`,
          io,
          getModel
        );
      }

    } catch (err) {
      logger.error('Error in Advanced Auto-Resolution Cron Job:', err);
    }
  });
};

const processAutoComplete = async (order, internalReason, customerMessage, io, getModel) => {
  try {
    const isPickup = ['pickup', 'dine-in', 'dine_in'].includes(order.orderType);
    const finalStatus = isPickup ? 'picked_up' : 'delivered';

    order.status = finalStatus;
    if (order.paymentMethod === 'cash' || order.paymentMethod === 'cod') {
      order.paymentStatus = 'paid';
    }
    order.statusUpdates.push({
      status: finalStatus,
      description: internalReason
    });

    await order.save();

    // award loyalty points
    await awardLoyaltyPoints(order);

    // emit socket events
    if (io) {
      const payload = buildOrderSocketPayload(order);
      io.to(order.restaurantId.toString()).emit('order_updated', payload);
      io.to(`order_${order._id}`).emit('order_status_changed', payload);
    }

    // notify Customer
    if (order.userId && !['merchant_app', 'merchant_web'].includes(order.orderSource)) {
      await createNotification(
        order.userId,
        isPickup ? 'Order Completed' : 'Order Delivered',
        customerMessage,
        'order_update',
        `/orders/${order._id}`,
        io,
        getModel
      );
    }

    logger.info(`Successfully auto-completed order ${order._id} (${finalStatus}) due to resolution logic.`);
  } catch (innerError) {
    logger.error(`Error processing auto-completion for order ${order._id}:`, innerError);
  }
};

const processAutoCancel = async (order, internalReason, customerMessage, io, getModel) => {
  try {
    order.status = 'cancelled';
    order.statusUpdates.push({
      status: 'cancelled',
      description: internalReason
    });

    // initiate Refund if order was paid via card
    await processAutoRefund(order, internalReason, io, getModel);
    
    await order.save();

    // revert loyalty points
    await rollbackLoyaltyPoints(order, 'auto_cancel_resolution');

    // emit socket events
    if (io) {
      const payload = buildOrderSocketPayload(order);
      io.to(order.restaurantId.toString()).emit('order_updated', payload);
      io.to(order.restaurantId.toString()).emit('order_cancelled', {
        orderId: order._id,
        orderNumber: order.orderNumber
      });
      io.to(`order_${order._id}`).emit('order_status_changed', payload);
    }

    // notify Customer
    if (order.userId && !['merchant_app', 'merchant_web'].includes(order.orderSource)) {
      await createNotification(
        order.userId,
        'Order Auto-Cancelled',
        customerMessage,
        'order_update',
        `/orders/${order._id}`,
        io,
        getModel
      );
    }

    logger.info(`Successfully auto-cancelled order ${order._id} due to resolution logic.`);
  } catch (innerError) {
    logger.error(`Error processing auto-cancellation for order ${order._id}:`, innerError);
  }
};
