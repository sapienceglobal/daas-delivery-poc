import 'dart:convert';
import 'dart:typed_data';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/notification_provider.dart';
import 'package:single_restaurant_mobile/screens/main_screen.dart';
import 'package:single_restaurant_mobile/screens/notifications_screen.dart';
import 'package:single_restaurant_mobile/services/navigation_service.dart';
import 'package:provider/provider.dart';
import 'package:flutter/material.dart';

@pragma('vm:entry-point')
void _notificationTapBackground(NotificationResponse response) {
  // Fires only if a local notification we showed is tapped from a background
  // isolate. We keep this lightweight; real navigation for FCM taps is
  // handled by onMessageOpenedApp / getInitialMessage below.
  debugPrint('Background local notification tapped: ${response.payload}');
}

class PushNotificationService {
  static final PushNotificationService _instance = PushNotificationService._internal();
  factory PushNotificationService() => _instance;
  PushNotificationService._internal();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'high_importance_channel',
    'Order & Offer Updates',
    description: 'Rich notifications for order status, delivery updates and offers.',
    importance: Importance.max,
  );

  bool _initialized = false;

  Future<void> initialize(BuildContext context) async {
    if (_initialized) return;
    _initialized = true;

    NotificationSettings settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus != AuthorizationStatus.authorized &&
        settings.authorizationStatus != AuthorizationStatus.provisional) {
      return;
    }

    const AndroidInitializationSettings androidInit = AndroidInitializationSettings('@drawable/ic_notification_lassi');
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

    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_channel);

    // FCM Token
    String? token = await _fcm.getToken();
    if (token != null) _syncTokenWithBackend(context, token);
    _fcm.onTokenRefresh.listen((newToken) => _syncTokenWithBackend(context, newToken));

    // 1) Foreground -> hume khud rich notification banana hai
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      _showRichNotification(message);
      if (context.mounted) {
        Provider.of<NotificationProvider>(context, listen: false).fetchNotifications();
      }
    });

    // 2) App background me tha, user ne OS ki tray notification tap ki
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationOpen);

    // 3) App terminated tha, notification tap karke khola
    RemoteMessage? initialMessage = await _fcm.getInitialMessage();
    if (initialMessage != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _handleNotificationOpen(initialMessage));
    }
  }

  Future<void> _showRichNotification(RemoteMessage message) async {
    final notification = message.notification;
    final data = message.data;

    final String title = notification?.title ?? data['title'] ?? 'Lassi Lounge';
    final String body = notification?.body ?? data['body'] ?? '';
    final String? imageUrl = notification?.android?.imageUrl ?? data['image'];

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
          icon: '@drawable/ic_notification_lassi',
          largeIcon: largeIconBitmap,
          color: const Color(0xFF8B1D1D), // apna brand red/maroon daal do
          styleInformation: styleInformation,
          importance: Importance.max,
          priority: Priority.high,
          groupKey: data['type'] ?? 'lassi_lounge_general',
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
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) return response.bodyBytes;
    } catch (e) {
      debugPrint('Error downloading notification image: $e');
    }
    return null;
  }

  void _onNotificationTap(NotificationResponse response) {
    if (response.payload == null || response.payload!.isEmpty) return;
    try {
      final data = jsonDecode(response.payload!) as Map<String, dynamic>;
      _navigateFromData(data);
    } catch (e) {
      debugPrint('Error parsing notification payload: $e');
    }
  }

  void _handleNotificationOpen(RemoteMessage message) {
    _navigateFromData(message.data);
  }

  void _navigateFromData(Map<String, dynamic> data) {
    final navigator = NavigationService.navigatorKey.currentState;
    if (navigator == null) return;

    final type = data['type'];
    switch (type) {
      case 'order_update':
      case 'delivery_update':
        navigator.pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const MainScreen(initialIndex: 3)), // Orders tab
          (route) => false,
        );
        break;
      case 'promotion':
      case 'marketing':
        navigator.pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const MainScreen(initialIndex: 2)), // Offers tab
          (route) => false,
        );
        break;
      default:
        navigator.push(MaterialPageRoute(builder: (_) => const NotificationsScreen()));
    }
  }

  void _syncTokenWithBackend(BuildContext context, String token) {
    Future.microtask(() {
      if (!context.mounted) return;
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      if (authProvider.isAuthenticated) {
        authProvider.saveFcmToken(token);
      }
    });
  }
}