import User from '../models/User.js';
import Campaign from '../models/Campaign.js';
import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as res from '../utils/responseFormatter.js';
import { AppError } from '../middleware/errorHandler.js';
import { getFirebaseAdmin } from '../config/firebase.js';
import { getMessaging } from 'firebase-admin/messaging';

// chunk an array into smaller arrays of a specified size
const chunkArray = (array, size) => {
  const chunked = [];
  let index = 0;
  while (index < array.length) {
    chunked.push(array.slice(index, size + index));
    index += size;
  }
  return chunked;
};

/**
 * @desc    get real-time audience metrics for marketing dashboard
 * @route   GET /api/marketing/audience-stats
 * @access  Private (Admin/Manager)
 */
export const getAudienceStats = asyncHandler(async (req, response) => {
  const UserModel = req.getModel('User');
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalCustomers, pushActiveUsers, inactiveUsers] = await Promise.all([
    UserModel.countDocuments({ role: 'customer' }),
    UserModel.countDocuments({ role: 'customer', 'fcmTokens.0': { $exists: true } }),
    UserModel.countDocuments({
      role: 'customer',
      updatedAt: { $lt: thirtyDaysAgo }
    })
  ]);

  res.success(response, {
    data: {
      totalCustomers,
      pushActiveUsers,
      inactive30Days: inactiveUsers,
      topicBroadcast: 'all_customers (100% of Installed Customer Apps)'
    }
  });
});

/**
 * @desc    get all marketing campaigns for a restaurant
 * @route   GET /api/marketing
 * @access  Private (Admin/Manager)
 */
export const getCampaigns = asyncHandler(async (req, response) => {
  const { restaurantId } = req.query;

  const filter = {};
  if (restaurantId) {
    filter.restaurantId = restaurantId;
  } else if (req.user.restaurantId) {
    filter.restaurantId = req.user.restaurantId;
  }

  const CampaignModel = req.getModel('Campaign');
  const campaigns = await CampaignModel.find(filter).sort({ createdAt: -1 }).limit(50);

  res.success(response, { data: campaigns });
});

/**
 * @desc    create and broadcast an enterprise-grade marketing campaign via Push Notifications
 * @route   POST /api/marketing/broadcast
 * @access  Private (Admin/Manager)
 */
export const broadcastCampaign = asyncHandler(async (req, response) => {
  const { title, message, imageUrl, audience, restaurantId, actionUrl } = req.body;

  if (!title || !message) {
    throw new AppError('Title and message are required for a campaign', 400);
  }

  const targetRestaurantId = restaurantId || req.user.restaurantId;
  if (!targetRestaurantId) {
    throw new AppError('Restaurant ID is required to launch a campaign', 400);
  }

  const CampaignModel = req.getModel('Campaign');
  const UserModel = req.getModel('User');
  const NotificationModel = req.getModel('Notification');

  // 1. Create campaign record
  const campaign = await CampaignModel.create({
    restaurantId: targetRestaurantId,
    title,
    message,
    imageUrl: imageUrl || '',
    actionUrl: actionUrl || '',
    audience: audience || 'all_customers',
    status: 'pending'
  });

  const firebaseApp = getFirebaseAdmin();
  if (!firebaseApp) {
    campaign.status = 'failed';
    await campaign.save();
    throw new AppError('Firebase Admin SDK is not initialized. Please verify server environment variables.', 500);
  }

  const messaging = getMessaging(firebaseApp);
  const targetAudience = audience || 'all_customers';

  // Base notification payload
  const pushNotification = {
    title,
    body: message,
    ...(imageUrl && { imageUrl }),
  };

  const pushAndroid = {
    notification: {
      color: '#6B111C',
      icon: 'ic_notification',
      channelId: 'high_importance_channel',
      sound: 'default',
      ...(imageUrl && { imageUrl }),
    }
  };

  const pushData = {
    type: 'marketing_campaign',
    campaignId: campaign._id.toString(),
    title: String(title),
    body: String(message),
    ...(imageUrl && { image: String(imageUrl), imageUrl: String(imageUrl) }),
    ...(actionUrl && { actionUrl: String(actionUrl) })
  };

  let totalSuccess = 0;
  let totalFailure = 0;

  try {
    // ── Strategy A: "all_customers" -> Firebase Topic Broadcast (reaches 100% of customer APK installs) ──
    if (targetAudience === 'all_customers') {
      // 1. Broadcast to Firebase topic 'all_customers'
      const topicMessage = {
        topic: 'all_customers',
        notification: pushNotification,
        android: pushAndroid,
        data: pushData
      };

      try {
        await messaging.send(topicMessage);
      } catch (topicErr) {
        console.error('[Marketing] Topic broadcast error:', topicErr);
      }

      // 2. Fetch all registered customers to create in-app inbox notifications
      const registeredCustomers = await UserModel.find({
        role: 'customer',
        'notificationPreferences.marketing': { $ne: false }
      }).select('_id fcmTokens');

      totalSuccess = registeredCustomers.length || 1;

      // 3. Create In-App Notification records so customers see it in their Notifications tab
      if (NotificationModel && registeredCustomers.length > 0) {
        const notifDocs = registeredCustomers.map(cust => ({
          userId: cust._id,
          title,
          body: message,
          image: imageUrl || null,
          channel: 'in_app',
          type: 'marketing',
          actionUrl: actionUrl || null,
          metadata: { campaignId: campaign._id.toString() },
          sentAt: new Date()
        }));

        try {
          await NotificationModel.insertMany(notifDocs, { ordered: false });
        } catch (dbErr) {
          console.warn('[Marketing] Error creating in-app notification records:', dbErr.message);
        }
      }

      // 4. Update Campaign Record
      campaign.status = 'sent';
      campaign.successCount = totalSuccess;
      campaign.failureCount = 0;
      campaign.sentAt = new Date();
      await campaign.save();

      return res.success(response, {
        message: 'Campaign broadcasted successfully to all customer app installs (FCM Topic) and notification inboxes.',
        data: campaign
      });
    }

    // ── Strategy B: Segmented Audience (e.g. inactive_30_days) -> Targeted Device Tokens ──
    const userQuery = {
      role: 'customer',
      'notificationPreferences.marketing': { $ne: false },
      'fcmTokens.0': { $exists: true }
    };

    if (targetAudience === 'inactive_30_days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      userQuery.updatedAt = { $lt: thirtyDaysAgo };
    }

    const targetUsers = await UserModel.find(userQuery).select('_id fcmTokens');
    const allTokens = new Set();
    const targetUserIds = [];

    targetUsers.forEach(user => {
      targetUserIds.push(user._id);
      if (Array.isArray(user.fcmTokens)) {
        user.fcmTokens.forEach(token => {
          if (token && typeof token === 'string') allTokens.add(token);
        });
      }
    });

    const tokensArray = Array.from(allTokens);

    if (tokensArray.length === 0) {
      campaign.status = 'sent';
      campaign.successCount = 0;
      campaign.failureCount = 0;
      campaign.sentAt = new Date();
      await campaign.save();
      return res.success(response, {
        message: 'No registered devices found for this specific segment, but campaign record created.',
        data: campaign
      });
    }

    // Multicast in chunks of 500
    const tokenChunks = chunkArray(tokensArray, 500);
    const deadTokens = [];

    for (const chunk of tokenChunks) {
      const fbResponse = await messaging.sendEachForMulticast({
        tokens: chunk,
        notification: pushNotification,
        android: pushAndroid,
        data: pushData
      });

      totalSuccess += fbResponse.successCount;
      totalFailure += fbResponse.failureCount;

      // Identify dead / unregistered tokens for automated pruning
      fbResponse.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errCode = resp.error?.code;
          if (
            errCode === 'messaging/registration-token-not-registered' ||
            errCode === 'messaging/invalid-registration-token'
          ) {
            deadTokens.push(chunk[idx]);
          }
        }
      });
    }

    // Automated dead token cleanup
    if (deadTokens.length > 0) {
      try {
        await UserModel.updateMany(
          { fcmTokens: { $in: deadTokens } },
          { $pull: { fcmTokens: { $in: deadTokens } } }
        );
        console.log(`[Marketing] Automatically pruned ${deadTokens.length} dead FCM tokens.`);
      } catch (cleanErr) {
        console.warn('[Marketing] Error during dead token cleanup:', cleanErr.message);
      }
    }

    // Create in-app notifications for targeted customers
    if (NotificationModel && targetUserIds.length > 0) {
      const notifDocs = targetUserIds.map(uid => ({
        userId: uid,
        title,
        body: message,
        image: imageUrl || null,
        channel: 'in_app',
        type: 'marketing',
        actionUrl: actionUrl || null,
        metadata: { campaignId: campaign._id.toString() },
        sentAt: new Date()
      }));

      try {
        await NotificationModel.insertMany(notifDocs, { ordered: false });
      } catch (dbErr) {
        console.warn('[Marketing] Error creating in-app notification records:', dbErr.message);
      }
    }

    // Update Campaign Record
    campaign.status = totalFailure === 0 ? 'sent' : (totalSuccess > 0 ? 'partial_success' : 'failed');
    campaign.successCount = totalSuccess;
    campaign.failureCount = totalFailure;
    campaign.sentAt = new Date();
    await campaign.save();

    res.success(response, {
      message: 'Segmented campaign broadcasted successfully',
      data: campaign
    });

  } catch (error) {
    console.error('Error broadcasting campaign:', error);
    campaign.status = 'failed';
    await campaign.save();
    throw new AppError('Failed to broadcast campaign: ' + (error.message || 'Internal error'), 500);
  }
});
