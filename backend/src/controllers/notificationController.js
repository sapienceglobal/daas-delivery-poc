import Notification from '../models/Notification.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as res from '../utils/responseFormatter.js';
import { AppError } from '../middleware/errorHandler.js';
import { getFirebaseAdmin } from '../config/firebase.js';
import admin from 'firebase-admin';
import logger from '../utils/logger.js';

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
export const createNotification = async (userId, title, body, type = 'system', actionUrl = null, io = null, getModel = null, imageUrl = null) => {
  try {
    const UserModel = getModel ? getModel('User') : User;
    const user = await UserModel.findById(userId).select('notificationPreferences fcmTokens');
    
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
      const firebaseApp = getFirebaseAdmin();
      if (firebaseApp) {
        // optimize image for push notifications (thumbnail)
        let optimizedImageUrl = imageUrl;
        if (optimizedImageUrl && optimizedImageUrl.includes('res.cloudinary.com')) {
          optimizedImageUrl = optimizedImageUrl.replace(
            '/upload/',
            '/upload/w_400,h_200,c_fill,q_auto,f_auto/'
          );
        }

        const message = {
          notification: {
            title,
            body,
            ...(optimizedImageUrl && { imageUrl: optimizedImageUrl }),
          },
          android: {
            notification: {
              color: '#006778',
              icon: 'ic_notification',
              channelId: 'high_importance_channel',
              sound: 'default',
              ...(optimizedImageUrl && { imageUrl: optimizedImageUrl }),
            }
          },
          data: {
            type,
            actionUrl: actionUrl || '',
            ...(optimizedImageUrl && { image: optimizedImageUrl }),
            ...(actionUrl && actionUrl.startsWith('/orders/') && { orderId: actionUrl.split('/').pop() }),
          },
          tokens: user.fcmTokens
        };
        
        admin.messaging().sendEachForMulticast(message)
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

    return notification;
  } catch (err) {
    console.error('Error creating notification:', err.message);
  }
};
