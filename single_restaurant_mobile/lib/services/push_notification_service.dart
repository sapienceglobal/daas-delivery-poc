import 'dart:convert';
import 'dart:typed_data';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:single_restaurant_mobile/providers/notification_provider.dart';
import 'package:single_restaurant_mobile/screens/main_screen.dart';
import 'package:single_restaurant_mobile/screens/notifications_screen.dart';
import 'package:single_restaurant_mobile/screens/track_order_screen.dart';
import 'package:single_restaurant_mobile/services/auth_service.dart';
import 'package:single_restaurant_mobile/services/navigation_service.dart';
import 'package:provider/provider.dart';
import 'package:flutter/material.dart';

@pragma('vm:entry-point')
void _notificationTapBackground(NotificationResponse response) {
  // Fires only if a local notification we showed is tapped from a background isolate
  debugPrint('Background local notification tapped: ${response.payload}');
}

class PushNotificationService {
  static final PushNotificationService _instance = PushNotificationService._internal();
  factory PushNotificationService() => _instance;
  PushNotificationService._internal();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'customer_alerts_channel_v2',
    'Order & Offer Updates',
    description: 'Rich notifications for order status, delivery updates and offers.',
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
  );

  bool _initialized = false;
  String? _cachedToken;

  String? get cachedToken => _cachedToken;

  /// Static entry-point for background messages or external triggers
  static Future<void> showRichNotificationFromRemoteMessage(RemoteMessage message) async {
    await _instance._showRichNotification(message);
  }

  Future<void> initialize(BuildContext context) async {
    if (_initialized) return;
    _initialized = true;

    try {
      await _fcm.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );
    } catch (e) {
      debugPrint('[FCM] requestPermission error: $e');
    }

    const AndroidInitializationSettings androidInit = AndroidInitializationSettings('@drawable/ic_notification');
    const DarwinInitializationSettings iosInit = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    const InitializationSettings initSettings = InitializationSettings(android: androidInit, iOS: iosInit);

    await _localNotifications.initialize(
      settings: initSettings,
      onDidReceiveNotificationResponse: _onNotificationTap,
      onDidReceiveBackgroundNotificationResponse: _notificationTapBackground,
    );

    final androidImplementation = _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    if (androidImplementation != null) {
      await androidImplementation.requestNotificationsPermission();
      await androidImplementation.createNotificationChannel(_channel);
    }

    // ── 1. Subscribe every install (guest or user) to FCM broadcast topics ──
    try {
      await _fcm.subscribeToTopic('all_customers');
      await _fcm.subscribeToTopic('offers_and_marketing');
      debugPrint('[FCM] Successfully subscribed to topic: all_customers');
    } catch (topicErr) {
      debugPrint('[FCM] Error subscribing to topic: $topicErr');
    }

    // ── 2. Get and sync FCM Device Token ──
    try {
      String? token = await _fcm.getToken();
      if (token != null) {
        _cachedToken = token;
        await syncTokenWithBackend(token);
      }
    } catch (tokenErr) {
      debugPrint('[FCM] Error obtaining FCM token: $tokenErr');
    }

    _fcm.onTokenRefresh.listen((newToken) {
      _cachedToken = newToken;
      syncTokenWithBackend(newToken);
    });

    // ── 3. Foreground Notification Listener ──
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      _showRichNotification(message);
      final navContext = NavigationService.navigatorKey.currentContext ?? context;
      if (navContext.mounted) {
        try {
          Provider.of<NotificationProvider>(navContext, listen: false).fetchNotifications();
        } catch (_) {}
      }
    });

    // ── 4. Background / Terminated click listeners ──
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationOpen);

    RemoteMessage? initialMessage = await _fcm.getInitialMessage();
    if (initialMessage != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _handleNotificationOpen(initialMessage));
    }
  }

  /// Proactively syncs device FCM token with backend MongoDB
  Future<void> syncTokenWithBackend([String? token]) async {
    try {
      final tokenToSync = token ?? _cachedToken ?? await _fcm.getToken();
      if (tokenToSync == null || tokenToSync.isEmpty) return;
      _cachedToken = tokenToSync;

      // Persist in local storage
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('fcm_token', tokenToSync);

      // Check if user is authenticated
      final authService = AuthService();
      final hasToken = await authService.loadToken();
      if (hasToken) {
        final success = await authService.saveFcmToken(tokenToSync);
        debugPrint('[FCM] Token synced to backend (success: $success)');
      }
    } catch (e) {
      debugPrint('[FCM] Error in syncTokenWithBackend: $e');
    }
  }

  Future<void> _showRichNotification(RemoteMessage message) async {
    final notification = message.notification;
    final data = message.data;

    final String title = notification?.title ?? data['title'] ?? 'Lassi Lounge';
    final String body = notification?.body ?? data['body'] ?? '';
    final String? imageUrl = notification?.android?.imageUrl ?? data['image'] ?? data['imageUrl'];

    ByteArrayAndroidBitmap? largeIconBitmap;
    StyleInformation styleInformation = BigTextStyleInformation(
      body,
      htmlFormatBigText: true,
      contentTitle: '<b>$title</b>',
      htmlFormatContentTitle: true,
    );

    if (imageUrl != null && imageUrl.isNotEmpty) {
      final imageBytes = await _downloadImage(imageUrl);
      if (imageBytes != null) {
        largeIconBitmap = ByteArrayAndroidBitmap(imageBytes);
        styleInformation = BigPictureStyleInformation(
          ByteArrayAndroidBitmap(imageBytes),
          largeIcon: ByteArrayAndroidBitmap(imageBytes),
          contentTitle: '<b>$title</b>',
          htmlFormatContentTitle: true,
          summaryText: body,
          htmlFormatSummaryText: true,
        );
      }
    }

    int notificationId = message.hashCode;
    if (data['orderId'] != null) {
      notificationId = data['orderId'].hashCode;
    } else if (data['campaignId'] != null) {
      notificationId = data['campaignId'].hashCode;
    }

    await _localNotifications.show(
      id: notificationId,
      title: title,
      body: body,
      notificationDetails: NotificationDetails(
        android: AndroidNotificationDetails(
          _channel.id,
          _channel.name,
          channelDescription: _channel.description,
          icon: '@drawable/ic_notification',
          largeIcon: largeIconBitmap,
          color: const Color(0xFF6B111C),
          styleInformation: styleInformation,
          importance: Importance.max,
          priority: Priority.high,
          playSound: true,
          enableVibration: true,
          channelShowBadge: true,
          groupKey: data['type'] ?? 'lassi_lounge_marketing',
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      payload: jsonEncode(data),
    );
  }

  Future<Uint8List?> _downloadImage(String url) async {
    try {
      final response = await http.get(Uri.parse(url)).timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) return response.bodyBytes;
    } catch (e) {
      debugPrint('[FCM] Error downloading notification image: $e');
    }
    return null;
  }

  void _onNotificationTap(NotificationResponse response) {
    if (response.payload == null || response.payload!.isEmpty) return;
    try {
      final data = jsonDecode(response.payload!) as Map<String, dynamic>;
      _navigateFromData(data);
    } catch (e) {
      debugPrint('[FCM] Error parsing notification payload: $e');
    }
  }

  void _handleNotificationOpen(RemoteMessage message) {
    _navigateFromData(message.data);
  }

  void _navigateFromData(Map<String, dynamic> data) {
    final navigator = NavigationService.navigatorKey.currentState;
    if (navigator == null) return;

    final type = data['type'];
    final actionUrl = (data['actionUrl'] ?? '').toString().toLowerCase().trim();

    switch (type) {
      case 'order_update':
      case 'delivery_update':
      case 'order_cancelled':
        final orderId = data['orderId']?.toString();
        if (orderId != null && orderId.isNotEmpty) {
          navigator.push(
            MaterialPageRoute(builder: (_) => TrackOrderScreen(orderId: orderId)),
          );
        } else {
          navigator.pushAndRemoveUntil(
            MaterialPageRoute(builder: (_) => const MainScreen(initialIndex: 3)), // Orders tab
            (route) => false,
          );
        }
        break;

      case 'marketing_campaign':
      case 'promotion':
      case 'marketing':
        if (actionUrl == '/menu' || actionUrl == 'menu') {
          navigator.pushAndRemoveUntil(
            MaterialPageRoute(builder: (_) => const MainScreen(initialIndex: 1)), // Menu tab
            (route) => false,
          );
        } else if (actionUrl == '/orders' || actionUrl == 'orders') {
          navigator.pushAndRemoveUntil(
            MaterialPageRoute(builder: (_) => const MainScreen(initialIndex: 3)), // Orders tab
            (route) => false,
          );
        } else if (actionUrl.startsWith('/category/') || actionUrl.startsWith('category/')) {
          final catId = actionUrl.replaceAll('/category/', '').replaceAll('category/', '');
          navigator.pushAndRemoveUntil(
            MaterialPageRoute(builder: (_) => MainScreen(initialIndex: 1, initialCategory: catId)),
            (route) => false,
          );
        } else {
          navigator.pushAndRemoveUntil(
            MaterialPageRoute(builder: (_) => const MainScreen(initialIndex: 2)), // Offers tab
            (route) => false,
          );
        }
        break;

      default:
        navigator.push(MaterialPageRoute(builder: (_) => const NotificationsScreen()));
    }
  }
}