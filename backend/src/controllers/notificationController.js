import Notification from '../models/Notification.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as res from '../utils/responseFormatter.js';
import { AppError } from '../middleware/errorHandler.js';
import { getFirebaseAdmin } from '../config/firebase.js';
import admin from 'firebase-admin';
import logger from '../utils/logger.js';
import { getNotificationImageUrl } from '../utils/imageUrl.js';

/**
 * @desc    get all notifications for the logged-in user
 * @route   GET /api/notifications
 * @access  Private
 */
export const getMyNotifications = asyncHandler(async (req, response) => {
  const NotificationModel = req.getModel('Notification');
  const notifications = await NotificationModel.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50); // Get last 50 notifications
  
  const unreadCount = await NotificationModel.countDocuments({ userId: req.user._id, isRead: false });

  res.success(response, { 
    data: notifications,
    meta: { unreadCount } 
  });
});

/**
 * @desc    mark a notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = asyncHandler(async (req, response) => {
  const NotificationModel = req.getModel('Notification');
  if (req.params.id === 'all') {
    await NotificationModel.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    return res.success(response, { message: 'All notifications marked as read' });
  }

  const notification = await NotificationModel.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) throw new AppError('Notification not found', 404);

  res.success(response, { data: notification });
});

/**
 * @desc    delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = asyncHandler(async (req, response) => {
  const NotificationModel = req.getModel('Notification');
  const notification = await NotificationModel.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  res.success(response, { message: 'Notification deleted successfully' });
});

// create and emit a notification (used internally by other controllers)
export const createNotification = async (userId, title, body, type = 'system', actionUrl = null, io = null, getModel = null, imageUrl = null, extraData = {}) => {
  try {
    const UserModel = getModel ? getModel('User') : User;
    const user = await UserModel.findById(userId).select('notificationPreferences fcmTokens role');
    
    if (user && user.notificationPreferences) {
      if (type === 'promotion' || type === 'marketing') {
        if (user.notificationPreferences.marketing === false) return null;
      }
      if (type === 'order_update' || type === 'delivery_update') {
        if (user.notificationPreferences.push === false) return null; // Or if we only want to block push, we could still save the in-app notification. Let's block both for simplicity to truly respect the toggle.
      }
    }

    const NotificationModel = getModel ? getModel('Notification') : Notification;
    const notification = await NotificationModel.create({
      userId,
      title,
      body,
      type,
      actionUrl,
      ...(imageUrl && { image: imageUrl })
    });

    if (io) {
      // emit to the specific user's socket room (assuming we use user._id as a room)
      io.to(userId.toString()).emit('new_notification', notification);
    }
    
    // dispatch FCM push notification
    if (user && user.fcmTokens && user.fcmTokens.length > 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[FCM DEV MOCK] Suppressed sending real FCM to user ${userId}`);
      } else {
        const firebaseApp = getFirebaseAdmin();
        if (firebaseApp) {
        // resolve and optimize image for push notifications
        let optimizedImageUrl = imageUrl;
        if (!optimizedImageUrl) {
          optimizedImageUrl = getNotificationImageUrl(type);
        } else if (optimizedImageUrl.startsWith('/uploads/')) {
          const baseUrl = (process.env.API_URL || 'https://api.lassiloungeny.com').replace(/\/+$/, '');
          optimizedImageUrl = `${baseUrl}${optimizedImageUrl}`;
        } else if (optimizedImageUrl.includes('res.cloudinary.com')) {
          optimizedImageUrl = optimizedImageUrl.replace(
            '/upload/',
            '/upload/w_400,h_200,c_fill,q_auto,f_auto/'
          );
        }

        const isMerchantUser = ['admin', 'merchant', 'restaurant_owner', 'manager', 'staff'].includes(user.role);

        const isNewOrder = type === 'new_order';
        const soundName = (isMerchantUser && isNewOrder) ? 'new_order_sound' : 'default';
        const channelIdName = isMerchantUser ? 'merchant_orders_channel_v3' : 'high_importance_channel';

        // For merchant new_order, omit the top-level 'notification' block to avoid duplicate alerts.
        // Android OS renders the top-level 'notification' block natively, while the merchant mobile app's
        // background handler simultaneously renders a rich, high-priority looping notification with 'View Order' button.
        // Data-only message guarantees exactly ONE rich, interactive notification with looping ringtone.
        const isDataOnlyMerchantOrder = isMerchantUser && isNewOrder;

        const message = {
          ...(!isDataOnlyMerchantOrder && {
            notification: {
              title,
              body,
              ...(optimizedImageUrl && { imageUrl: optimizedImageUrl }),
            }
          }),
          android: {
            priority: 'high',
            ...(!isDataOnlyMerchantOrder && {
              notification: {
                color: isMerchantUser ? '#6B111C' : '#006778',
                ...(!isMerchantUser && { icon: 'ic_notification' }),
                channelId: channelIdName,
                sound: soundName,
                ...(optimizedImageUrl && { imageUrl: optimizedImageUrl }),
              }
            })
          },
          apns: {
            payload: {
              aps: {
                sound: soundName === 'default' ? 'default' : `${soundName}.wav`,
                contentAvailable: true
              }
            }
          },
            data: {
              type,
              title, // Pass title in data for the background handler
              body, // Pass body in data for the background handler
              actionUrl: actionUrl || '',
              ...(optimizedImageUrl && { image: optimizedImageUrl }),
              ...(actionUrl && actionUrl.startsWith('/orders/') && { orderId: actionUrl.split('/').pop() }),
              ...extraData
            },
            tokens: user.fcmTokens
          };
        
        const { getMessaging } = await import('firebase-admin/messaging');
        getMessaging(firebaseApp).sendEachForMulticast(message)
          .then(response => {
            if (response.failureCount > 0) {
              logger.warn(`FCM partial failure: ${response.failureCount} failed out of ${user.fcmTokens.length} tokens.`);
              // in production, we should remove unregistered tokens from user.fcmTokens here.
            } else {
              logger.info(`Successfully sent FCM push to user ${userId}`);
            }
          })
          .catch(error => logger.error('Error sending FCM push:', error));
        }
      }
    }

    return notification;
  } catch (err) {
    console.error('Error creating notification:', err.message);
  }
};

/**
 * @desc    Send test notification exclusively to the requesting user's registered device (Zero impact on live clients)
 * @route   POST /api/notifications/test-my-device
 * @access  Private
 */
export const testMyDeviceNotification = asyncHandler(async (req, response) => {
  const { type = 'new_order', delaySeconds = 0 } = req.body;
  const userId = req.user._id;

  const UserModel = req.getModel ? req.getModel('User') : User;
  const user = await UserModel.findById(userId).select('fcmTokens email name');

  if (!user?.fcmTokens?.length) {
    throw new AppError('No active FCM token found for your device. Please open the mobile app to sync token.', 400);
  }

  const triggerTest = async () => {
    const imageUrl = getNotificationImageUrl(type);
    const io = req.app?.get('io');

    if (type === 'new_order') {
      await createNotification(
        userId,
        'New Order Request 🛎️ [TEST]',
        'Test Customer placed a new delivery order! Total: $34.50',
        'new_order',
        '/orders/test_mock_order_123',
        io,
        req.getModel,
        imageUrl,
        { orderId: 'test_mock_order_123' }
      );
    } else if (type === 'reservation') {
      await createNotification(
        userId,
        'New Reservation Request 📅 [TEST]',
        'Test Customer requested a table for 4 on tomorrow at 7:30 PM.',
        'reservation_new',
        '/reservations/test_mock_res_123',
        io,
        req.getModel,
        imageUrl,
        { entityType: 'reservation', entityId: 'test_mock_res_123' }
      );
    } else if (type === 'catering') {
      await createNotification(
        userId,
        'New Catering Inquiry 🍱 [TEST]',
        'Test Customer inquired for a Birthday Event for 50 guests.',
        'catering_new',
        '/catering/test_mock_cat_123',
        io,
        req.getModel,
        imageUrl,
        { entityType: 'catering', entityId: 'test_mock_cat_123' }
      );
    }
  };

  if (delaySeconds > 0) {
    setTimeout(triggerTest, delaySeconds * 1000);
    return res.success(response, {
      message: `Test notification scheduled in ${delaySeconds} seconds. Minimize or lock your phone now to test background alerts!`
    });
  }

  await triggerTest();
  return res.success(response, {
    message: `Test notification sent directly to your device (${user.fcmTokens.length} token(s)). Check your screen!`
  });
});
