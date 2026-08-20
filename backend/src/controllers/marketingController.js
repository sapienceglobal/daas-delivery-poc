import User from '../models/User.js';
import Campaign from '../models/Campaign.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as res from '../utils/responseFormatter.js';
import { AppError } from '../middleware/errorHandler.js';
import { getFirebaseAdmin } from '../config/firebase.js';
import { getMessaging } from 'firebase-admin/messaging';

/**
 * Helper to chunk an array into smaller arrays of a specified size
 */
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
 * @desc    Get all marketing campaigns for a restaurant
 * @route   GET /api/marketing
 * @access  Private (Admin/Manager)
 */
export const getCampaigns = asyncHandler(async (req, response) => {
  const { restaurantId } = req.query; // If not provided, fetch all for superadmin or filter by req.user.restaurantId

  const filter = {};
  if (restaurantId) {
    filter.restaurantId = restaurantId;
  } else if (req.user.restaurantId) {
    filter.restaurantId = req.user.restaurantId;
  }

  const CampaignModel = req.getModel('Campaign');
  const campaigns = await CampaignModel.find(filter).sort({ createdAt: -1 });

  res.success(response, { data: campaigns });
});

/**
 * @desc    Create and broadcast a marketing campaign via Push Notifications
 * @route   POST /api/marketing/broadcast
 * @access  Private (Admin/Manager)
 */
export const broadcastCampaign = asyncHandler(async (req, response) => {
  const { title, message, imageUrl, audience, restaurantId, actionUrl } = req.body;

  if (!title || !message) {
    throw new AppError('Title and message are required for a campaign', 400);
  }

  // Use the restaurantId from body or from user token
  const targetRestaurantId = restaurantId || req.user.restaurantId;

  if (!targetRestaurantId) {
    throw new AppError('Restaurant ID is required to launch a campaign', 400);
  }

  const CampaignModel = req.getModel('Campaign');
  
  // 1. Create pending campaign record
  const campaign = await CampaignModel.create({
    restaurantId: targetRestaurantId,
    title,
    message,
    imageUrl,
    actionUrl,
    audience: audience || 'all_customers',
    status: 'pending'
  });

  // 2. Fetch Target Audience
  const UserModel = req.getModel('User');
  let userQuery = { role: 'customer', fcmTokens: { $exists: true, $not: { $size: 0 } } };

  // Example Audience filtering logic
  if (audience === 'inactive_30_days') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    // Assuming we have a lastActive or lastOrder field. For now, we'll just fall back or rely on updatedAt
    userQuery.updatedAt = { $lt: thirtyDaysAgo };
  }

  const targetUsers = await UserModel.find(userQuery).select('fcmTokens');

  // Extract all unique tokens
  const allTokens = new Set();
  targetUsers.forEach(user => {
    user.fcmTokens.forEach(token => allTokens.add(token));
  });

  const tokensArray = Array.from(allTokens);

  if (tokensArray.length === 0) {
    campaign.status = 'failed';
    campaign.failureCount = 0;
    await campaign.save();
    return res.success(response, { message: 'No users found with push notification tokens for this audience', data: campaign });
  }

  // 3. Dispatch to Firebase
  const firebaseApp = getFirebaseAdmin();
  if (!firebaseApp) {
    campaign.status = 'failed';
    await campaign.save();
    throw new AppError('Firebase Admin SDK is not initialized', 500);
  }

  // Multicast limit is 500
  const tokenChunks = chunkArray(tokensArray, 500);
  
  let totalSuccess = 0;
  let totalFailure = 0;

  const pushMessage = {
    notification: {
      title,
      body: message,
      ...(imageUrl && { imageUrl }),
    },
    android: {
      notification: {
        color: '#006778',
        icon: 'ic_notification',
        channelId: 'high_importance_channel',
        sound: 'default',
        ...(imageUrl && { imageUrl }),
      }
    },
    data: {
      type: 'marketing_campaign',
      campaignId: campaign._id.toString(),
      ...(imageUrl && { image: imageUrl }),
      // Add actionUrl if it exists in the future (though we are adding it now)
    }
  };

  // We are handling imageUrl directly inside pushMessage now, so we can skip the manual assignment below, 
  // but we will also support actionUrl since we are adding it to the UI.
  if (req.body.actionUrl) {
    pushMessage.data.actionUrl = req.body.actionUrl;
  }

  try {
    const messaging = getMessaging(firebaseApp);
    for (const chunk of tokenChunks) {
      const fbResponse = await messaging.sendEachForMulticast({
        ...pushMessage,
        tokens: chunk
      });
      totalSuccess += fbResponse.successCount;
      totalFailure += fbResponse.failureCount;
    }

    // Update Campaign Record
    campaign.status = totalFailure === 0 ? 'sent' : (totalSuccess > 0 ? 'partial_success' : 'failed');
    campaign.successCount = totalSuccess;
    campaign.failureCount = totalFailure;
    campaign.sentAt = new Date();
    await campaign.save();

    res.success(response, { 
      message: 'Campaign broadcasted successfully',
      data: campaign
    });

  } catch (error) {
    console.error('Error broadcasting campaign:', error);
    campaign.status = 'failed';
    await campaign.save();
    throw new AppError('Failed to broadcast campaign', 500);
  }
});
