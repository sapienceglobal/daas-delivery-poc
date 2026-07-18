import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as res from '../utils/responseFormatter.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * @desc    Get all notifications for the logged-in user
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
 * @desc    Mark a notification as read
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
 * Helper function to create and emit a notification (used internally by other controllers)
 */
export const createNotification = async (userId, title, body, type = 'system', actionUrl = null, io = null, getModel = null) => {
  try {
    const NotificationModel = getModel ? getModel('Notification') : Notification;
    const notification = await NotificationModel.create({
      userId,
      title,
      body,
      type,
      actionUrl
    });

    if (io) {
      // Emit to the specific user's socket room (assuming we use user._id as a room)
      io.to(userId.toString()).emit('new_notification', notification);
    }
    return notification;
  } catch (err) {
    console.error('Error creating notification:', err.message);
  }
};
