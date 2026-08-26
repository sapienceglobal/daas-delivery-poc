import 'dart:convert';
import 'dart:typed_data';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../providers/auth_provider.dart';
import '../providers/order_provider.dart';
import 'api_service.dart';
import 'package:toastification/toastification.dart';

// Global navigator key to be used in main.dart GoRouter
final GlobalKey<NavigatorState> rootNavigatorKey = GlobalKey<NavigatorState>();

@pragma('vm:entry-point')
void _notificationTapBackground(NotificationResponse response) {
  debugPrint('Background local notification tapped: ${response.payload}');
}

class PushNotificationService {
  static final PushNotificationService _instance = PushNotificationService._internal();
  factory PushNotificationService() => _instance;
  PushNotificationService._internal();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'merchant_orders_channel_v2',
    'New Orders & Updates',
    description: 'Rich notifications for new orders and merchant updates.',
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
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

    // You need an icon named @mipmap/ic_launcher or a custom drawable
    const AndroidInitializationSettings androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
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

    final androidImplementation = _localNotifications.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    if (androidImplementation != null) {
      await androidImplementation.requestNotificationsPermission();
      await androidImplementation.createNotificationChannel(_channel);
    }

    String? token = await _fcm.getToken();
    if (token != null) _syncTokenWithBackend(context, token);
    _fcm.onTokenRefresh.listen((newToken) => _syncTokenWithBackend(context, newToken));

    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      _showRichNotification(message);
      
      final activeContext = rootNavigatorKey.currentContext ?? context;
      
      if (activeContext.mounted) {
        Provider.of<OrderProvider>(activeContext, listen: false).fetchOrders();
        
        final notification = message.notification;
        final data = message.data;
        final title = notification?.title ?? data['title'] ?? 'New Order!';
        final body = notification?.body ?? data['body'] ?? '';

        toastification.show(
          context: activeContext,
          type: ToastificationType.success,
          style: ToastificationStyle.flat,
          title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
          description: Text(body),
          alignment: Alignment.topCenter,
          autoCloseDuration: const Duration(seconds: 5),
          showProgressBar: true,
        );
      }
    });

    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationOpen);

    RemoteMessage? initialMessage = await _fcm.getInitialMessage();
    if (initialMessage != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _handleNotificationOpen(initialMessage));
    }
  }

  Future<void> _showRichNotification(RemoteMessage message) async {
    final notification = message.notification;
    final data = message.data;

    final String title = notification?.title ?? data['title'] ?? 'New Order!';
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
          icon: '@mipmap/ic_launcher',
          largeIcon: largeIconBitmap,
          color: const Color(0xFFDC2626), 
          styleInformation: styleInformation,
          importance: Importance.max,
          priority: Priority.high,
          playSound: true,
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
    if (response.payload == null || response.payload!.isEmpty) {
      _navigateFromData({});
      return;
    }
    try {
      final data = jsonDecode(response.payload!) as Map<String, dynamic>;
      _navigateFromData(data);
    } catch (e) {
      debugPrint('Error parsing notification payload: $e');
      _navigateFromData({});
    }
  }

  void _handleNotificationOpen(RemoteMessage message) {
    _navigateFromData(message.data);
  }

  void _navigateFromData(Map<String, dynamic> data) {
    final context = rootNavigatorKey.currentContext;
    if (context == null) return;
    
    // As per user requirement, tapping new order notification opens live orders
    context.go('/live-orders');
  }

  void _syncTokenWithBackend(BuildContext context, String token) {
    Future.microtask(() async {
      if (!context.mounted) return;
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      if (authProvider.user?['restaurantId'] != null) {
        try {
          final response = await http.post(
            Uri.parse('${ApiService.baseUrl}/api/auth/me/fcm-token'),
            headers: ApiService.buildHeaders(),
            body: jsonEncode({'fcmToken': token}),
          );
          debugPrint("FCM Token sync response: ${response.statusCode} - ${response.body}");
          if (response.statusCode == 200) {
            debugPrint("✅ Merchant FCM Token saved successfully");
          } else {
            debugPrint("❌ FCM Token save failed: ${response.statusCode}");
          }
        } catch (e) {
          debugPrint("❌ Failed to update merchant FCM token: $e");
        }
      } else {
        debugPrint("⚠️ No restaurantId found, skipping FCM token sync");
      }
    });
  }
}
