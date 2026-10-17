#!/usr/bin/env node
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import admin from 'firebase-admin';
import { getNotificationImageUrl } from '../src/utils/imageUrl.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Parse command line arguments
// e.g. node scripts/test_push.mjs --type=new_order --email=test@lassilounge.com
// e.g. node scripts/test_push.mjs --type=reservation --token=eKa8...
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace(/^--/, '').split('=');
  acc[key] = value || true;
  return acc;
}, {});

const notifType = args.type || 'new_order'; // 'new_order', 'reservation', 'catering', 'promo'
const targetEmail = args.email || 'test@lassilounge.com';
const targetTopic = args.topic; // e.g. 'all_customers'
let explicitToken = args.token;

if (args.help || args.h) {
  console.log(`
Usage:
  node scripts/test_push.mjs [options]

Options:
  --type=TYPE        Type of notification to test:
                     • new_order   : Tests high-priority order alert (Red badge, looping ringtone, "View Order")
                     • reservation : Tests table reservation alert (Deep link to /reservations)
                     • catering    : Tests catering inquiry alert (Deep link to /catering)
                     • promo       : Tests customer app marketing alert
                     (Default: new_order)

  --email=EMAIL      Target user email in MongoDB (Default: test@lassilounge.com)
  --token=FCM_TOKEN  Explicit FCM device token (Overrides email lookup)
  --topic=TOPIC      FCM topic name (e.g. all_customers) to test topic broadcast

Examples:
  node scripts/test_push.mjs --type=new_order --email=test@lassilounge.com
  node scripts/test_push.mjs --type=promo --topic=all_customers
  node scripts/test_push.mjs --type=promo --email=test@lassilounge.com
  `);
  process.exit(0);
}

import { getFirebaseAdmin } from '../src/config/firebase.js';

async function initFirebase() {
  const app = getFirebaseAdmin();
  if (!app) {
    throw new Error('Firebase credentials not found! Ensure backend/.env has FIREBASE_* keys or backend/firebase-adminsdk.json exists on this machine / VPS.');
  }
  return app;
}

async function main() {
  console.log('====================================================');
  console.log('🧪 PUSH NOTIFICATION TARGETED TEST TOOL');
  console.log('====================================================');
  console.log(`Notification Type : ${notifType}`);

  let tokens = [];

  if (targetTopic && typeof targetTopic === 'string') {
    console.log(`Targeting Topic   : ${targetTopic}`);
  } else if (explicitToken && typeof explicitToken === 'string') {
    tokens = [explicitToken];
    console.log(`Targeting Token   : ${explicitToken.substring(0, 20)}...`);
  } else {
    console.log(`Targeting Email   : ${targetEmail}`);
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not defined in backend/.env');
    }
    console.log('Connecting to MongoDB to retrieve device FCM token...');
    await mongoose.connect(mongoUri);

    const isCustomerTest = notifType === 'promo';
    const appName = isCustomerTest ? 'Customer APK (single_restaurant_mobile)' : 'Admin/Merchant APK';
    const roleFilter = isCustomerTest ? { role: 'customer' } : { role: { $in: ['admin', 'merchant'] } };

    const user = await mongoose.connection.collection('users').findOne({ email: targetEmail.toLowerCase() });

    if (!user) {
      console.error(`❌ User not found with email: ${targetEmail}`);
      console.log(`Available ${isCustomerTest ? 'customer' : 'merchant'} users:`);
      const availableUsers = await mongoose.connection.collection('users').find(roleFilter).project({ email: 1, role: 1, fcmTokens: 1 }).limit(10).toArray();
      console.table(availableUsers.map(m => ({ email: m.email, role: m.role, tokens: Array.isArray(m.fcmTokens) ? m.fcmTokens.length : 0 })));
      process.exit(1);
    }

    if (!user.fcmTokens || user.fcmTokens.length === 0) {
      console.error(`❌ User ${targetEmail} does not have any registered FCM tokens in MongoDB.`);
      console.log(`👉 Please open the ${appName} on your test phone and log in with ${targetEmail} so it registers its FCM token.`);
      console.log(`\nAvailable registered users with active tokens in database:`);
      const usersWithTokens = await mongoose.connection.collection('users').find({
        ...roleFilter,
        'fcmTokens.0': { $exists: true }
      }).project({ email: 1, role: 1, fcmTokens: 1 }).limit(10).toArray();
      console.table(usersWithTokens.map(m => ({ email: m.email, role: m.role, tokens: Array.isArray(m.fcmTokens) ? m.fcmTokens.length : 0 })));
      console.log(`💡 Tip: You can also test topic broadcast to ALL customer app installs without an email:`);
      console.log(`   node scripts/test_push.mjs --type=promo --topic=all_customers\n`);
      process.exit(1);
    }

    // Use the most recent token (last in array)
    tokens = [user.fcmTokens[user.fcmTokens.length - 1]];
    console.log(`✅ Found ${user.fcmTokens.length} token(s) for ${targetEmail}. Using latest token: ${tokens[0].substring(0, 25)}...`);
  }

  const fbApp = await initFirebase();
  const { getMessaging } = await import('firebase-admin/messaging');
  const messaging = getMessaging(fbApp);

  const notifImage = getNotificationImageUrl(notifType);

  let messagePayload = {};

  if (notifType === 'new_order') {
    // Exact production merchant new_order: high priority data-only for insistent looping call ringtone
    messagePayload = {
      android: {
        priority: 'high'
      },
      apns: {
        payload: {
          aps: {
            contentAvailable: true,
            sound: 'new_order_sound.wav'
          }
        }
      },
      data: {
        type: 'new_order',
        title: 'New Order Request 🛎️ [TEST]',
        body: 'Adarsh Sharma placed a new delivery order! Total: $45.50',
        orderId: '6a84024d65c4d0517dfe9999',
        actionUrl: '/orders/6a84024d65c4d0517dfe9999',
        image: notifImage,
        customerName: 'Adarsh Sharma',
        total: '45.50'
      },
      tokens
    };
  } else if (notifType === 'reservation') {
    // Production reservation: includes notification block + deep link
    messagePayload = {
      notification: {
        title: 'New Reservation Request 📅 [TEST]',
        body: 'Adarsh Sharma requested a table for 4 on 24 Oct at 7:30 PM.',
        imageUrl: notifImage
      },
      android: {
        priority: 'high',
        notification: {
          color: '#6B111C',
          channelId: 'merchant_orders_channel_v3',
          sound: 'new_order_sound',
          imageUrl: notifImage
        }
      },
      data: {
        type: 'reservation_new',
        title: 'New Reservation Request 📅 [TEST]',
        body: 'Adarsh Sharma requested a table for 4 on 24 Oct at 7:30 PM.',
        actionUrl: '/reservations/6a84024d65c4d0517dfe8888',
        entityType: 'reservation',
        entityId: '6a84024d65c4d0517dfe8888'
      },
      tokens
    };
  } else if (notifType === 'catering') {
    messagePayload = {
      notification: {
        title: 'New Catering Inquiry 🍱 [TEST]',
        body: 'Adarsh Sharma inquired for a Wedding Party event for 150 guests.',
        imageUrl: notifImage
      },
      android: {
        priority: 'high',
        notification: {
          color: '#6B111C',
          channelId: 'merchant_orders_channel_v3',
          sound: 'new_order_sound',
          imageUrl: notifImage
        }
      },
      data: {
        type: 'catering_new',
        title: 'New Catering Inquiry 🍱 [TEST]',
        body: 'Adarsh Sharma inquired for a Wedding Party event for 150 guests.',
        actionUrl: '/catering/6a84024d65c4d0517dfe7777',
        entityType: 'catering',
        entityId: '6a84024d65c4d0517dfe7777'
      },
      tokens
    };
  } else {
    // Customer marketing promo test
    messagePayload = {
      notification: {
        title: 'Weekend Special: 20% OFF! 🥭 [TEST]',
        body: 'Get 20% off on all Mango & Special Lassies this weekend. Tap to order!',
        imageUrl: notifImage
      },
      android: {
        priority: 'high',
        notification: {
          color: '#6B111C',
          icon: 'ic_notification',
          channelId: 'customer_alerts_channel_v2',
          sound: 'default',
          priority: 'high',
          defaultSound: true,
          defaultVibrateTimings: true,
          imageUrl: notifImage
        }
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: 'Weekend Special: 20% OFF! 🥭 [TEST]',
              body: 'Get 20% off on all Mango & Special Lassies this weekend. Tap to order!',
            },
            sound: 'default',
            badge: 1
          }
        }
      },
      data: {
        type: 'promotion',
        title: 'Weekend Special: 20% OFF! 🥭 [TEST]',
        body: 'Get 20% off on all Mango & Special Lassies this weekend. Tap to order!',
        actionUrl: '/menu',
        image: notifImage
      },
      tokens
    };
  }

  if (targetTopic) {
    console.log(`\n🚀 Dispatching broadcast to topic "${targetTopic}" via Firebase Cloud Messaging...`);
    const topicMessage = {
      topic: targetTopic,
      notification: messagePayload.notification,
      android: messagePayload.android,
      apns: messagePayload.apns,
      data: messagePayload.data
    };
    const response = await messaging.send(topicMessage);
    console.log(`🎉 Broadcast delivered to topic "${targetTopic}" successfully! Message ID: ${response}`);
    console.log('Check your connected phone:');
    console.log(` • Alert banner will show with single chime sound`);
    console.log(` • Title: ${messagePayload.notification?.title}`);
    console.log(` • Tapping opens the app directly`);
    process.exit(0);
  }

  console.log('\n🚀 Dispatching push notification via Firebase Cloud Messaging...');
  const response = await messaging.sendEachForMulticast(messagePayload);

  console.log(`\nResults: ${response.successCount} succeeded, ${response.failureCount} failed.`);
  if (response.failureCount > 0) {
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        console.error(`Token ${idx + 1} Error:`, resp.error?.message || resp.error);
      }
    });
  } else {
    console.log('🎉 Push notification delivered to device successfully!');
    console.log('Check your connected phone:');
    if (notifType === 'new_order') {
      console.log(' • Looping incoming call ringtone should sound');
      console.log(' • Notification should show Red badge + "View Order" button');
      console.log(' • Only ONE notification should appear (zero duplicates)');
    } else {
      console.log(` • Alert should show with title: ${messagePayload.notification?.title}`);
      console.log(' • Tapping should open directly to the respective screen');
    }
  }

  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Test push failed with error:', err.message || err);
  process.exit(1);
});
