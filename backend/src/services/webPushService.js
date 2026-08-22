import webpush from 'web-push';
import dotenv from 'dotenv';
dotenv.config();

// initialize web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.FROM_EMAIL || 'support@lassilounge.com'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export const sendPushNotification = async (restaurant, payload) => {
  if (!restaurant.notificationSettings?.pushEnabled) {
    return;
  }
  
  if (!restaurant.webPushSubscriptions || restaurant.webPushSubscriptions.length === 0) {
    return;
  }

  if (!process.env.VAPID_PUBLIC_KEY) {
    console.warn('Web push VAPID keys not configured. Skipping push notification.');
    return;
  }

  const notificationPayload = JSON.stringify(payload);

  const sendPromises = restaurant.webPushSubscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification(subscription, notificationPayload);
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        // subscription has expired or is no longer valid, remove it
        console.log('Push subscription expired. It should be cleaned up.');
        // in a full implementation, you would pull this subscription from the DB here.
      } else {
        console.error('Error sending push notification:', error);
      }
    }
  });

  await Promise.all(sendPromises);
};
