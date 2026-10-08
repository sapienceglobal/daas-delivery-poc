import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:toastification/toastification.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'constants/app_theme.dart';
import 'screens/dashboard_screen.dart';
import 'screens/live_orders_screen.dart';
import 'screens/order_details_screen.dart';
import 'screens/all_orders_screen.dart';
import 'screens/analytics_screen.dart';
import 'screens/menu_management_screen.dart';
import 'screens/promotions_screen.dart';
import 'screens/kds_screen.dart';
import 'screens/reservations_screen.dart';
import 'screens/catering_screen.dart';
import 'screens/pos_screen.dart';
import 'screens/more_settings_screen.dart';
import 'screens/crm_screen.dart';
import 'screens/notifications_screen.dart';
import 'screens/auth/splash_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/forgot_password_screen.dart';
import 'screens/restaurant_settings_screen.dart';
import 'screens/cms_management_screen.dart';
import 'screens/loyalty_rewards_screen.dart';
import 'screens/marketing_screen.dart';
import 'screens/support_messages_screen.dart';

import 'services/socket_service.dart';
import 'services/push_notification_service.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';


import 'providers/auth_provider.dart';
import 'providers/order_provider.dart';
import 'providers/menu_provider.dart';
import 'providers/promotion_provider.dart';
import 'providers/reservation_provider.dart';
import 'providers/catering_provider.dart';
import 'providers/analytics_provider.dart';
import 'providers/notification_provider.dart';
import 'providers/restaurant_provider.dart';
import 'providers/cms_provider.dart';
import 'providers/loyalty_provider.dart';
import 'providers/marketing_provider.dart';
import 'providers/support_messages_provider.dart';

import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:timezone/data/latest.dart' as tz;
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:timezone/timezone.dart' as tz;

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint("Handling a background message: ${message.messageId}");
  
  // Natively trigger our insistent looping notification if it's a data-only message (or any background message we intercept)
  if (message.data['type'] == 'new_order') {
    await PushNotificationService.showRichNotificationFromData(message.data);
  }
}

Future<void> _guard(
    String name, Future<void> Function() fn, Duration timeout) async {
  try {
    await fn().timeout(timeout);
    debugPrint('$name initialized successfully.');
  } catch (e) {
    debugPrint('Warning: $name init failed or timed out: $e');
  }
}

Future<void> _initFirebase() async {
  await Firebase.initializeApp();
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
}

Future<void> _initTimezone() async {
  tz.initializeTimeZones();
  try {
    final String tzStr =
        (await FlutterTimezone.getLocalTimezone()).identifier;
    if (tzStr.isNotEmpty) {
      try {
        tz.setLocalLocation(tz.getLocation(tzStr));
        return; // Device native timezone anywhere in the world successfully applied!
      } catch (_) {
        // Fallback for New York / US Eastern non-standard strings
        if (tzStr.contains('New_York') ||
            tzStr.contains('Eastern') ||
            tzStr.contains('EDT') ||
            tzStr.contains('EST') ||
            tzStr.contains('-05') ||
            tzStr.contains('-04')) {
          tz.setLocalLocation(tz.getLocation('America/New_York'));
          return;
        }
        // Fallback for Indian testers / legacy IDs
        if (tzStr.contains('Calcutta') ||
            tzStr.contains('+05') ||
            tzStr.contains('IST')) {
          tz.setLocalLocation(tz.getLocation('Asia/Kolkata'));
          return;
        }
      }
    }
    // Default fallback for New York restaurants
    tz.setLocalLocation(tz.getLocation('America/New_York'));
  } catch (e) {
    debugPrint('Timezone lookup error ($e) - falling back to America/New_York');
    try {
      tz.setLocalLocation(tz.getLocation('America/New_York'));
    } catch (_) {
      try {
        tz.setLocalLocation(tz.getLocation('UTC'));
      } catch (_) {}
    }
  }
}

Future<void> _initStripe() async {
  Stripe.publishableKey =
      'pk_live_51U0Oy3FY8ihGsgg4uTvqPaO7SHZHn9kwl0cb08mLmelJxJGBpV2U8OCR6JiTbipPlivdKqjmcCnrOlzcATl12x7G004CSSZ3AT';
  Stripe.merchantIdentifier = 'merchant.com.lassilounge';
  Stripe.urlScheme = 'lassilounge';
  try {
    await Stripe.instance.applySettings();
  } catch (e) {
    debugPrint('Stripe applySettings warning: $e');
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Global error handlers: prevent native crashing or black screen on uncaught errors
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    debugPrint('FlutterError: ${details.exceptionAsString()}');
  };
  PlatformDispatcher.instance.onError = (Object error, StackTrace stack) {
    debugPrint('Uncaught error: $error');
    return true;
  };

  // Graceful fallback instead of grey/black screen in release builds
  if (kReleaseMode) {
    ErrorWidget.builder = (FlutterErrorDetails details) => const Material(
          color: Colors.white,
          child: Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Text(
                'Something went wrong. Please restart the app.',
                textAlign: TextAlign.center,
              ),
            ),
          ),
        );
  }

  SharedPreferences? prefs;
  final socketService = SocketService();
  final authProvider = AuthProvider();

  // Initialize critical services in parallel with timeouts to guarantee quick boot
  await Future.wait<void>([
    _guard('Firebase', _initFirebase, const Duration(seconds: 8)),
    _guard('Timezone', _initTimezone, const Duration(seconds: 3)),
    _guard('Stripe', _initStripe, const Duration(seconds: 5)),
    _guard('Prefs', () async {
      prefs = await SharedPreferences.getInstance();
    }, const Duration(seconds: 4)),
    _guard('Auth', () async {
      await authProvider.checkLoginStatus();
    }, const Duration(seconds: 4)),
  ]);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthProvider>.value(value: authProvider),
        if (prefs != null)
          Provider<SharedPreferences>.value(value: prefs!)
        else
          FutureProvider<SharedPreferences?>(
            create: (_) => SharedPreferences.getInstance(),
            initialData: null,
          ),
        Provider<SocketService>.value(value: socketService),
        ChangeNotifierProvider<OrderProvider>(
          create: (_) => OrderProvider(socketService)..fetchOrders(), // Attempt to fetch on boot
        ),
        ChangeNotifierProvider<MenuProvider>(
          create: (_) => MenuProvider(),
        ),
        ChangeNotifierProvider<PromotionProvider>(
          create: (_) => PromotionProvider()..fetchData(),
        ),
        ChangeNotifierProvider<ReservationProvider>(
          create: (_) => ReservationProvider()..fetchReservations(),
        ),
        ChangeNotifierProvider<CateringProvider>(
          create: (_) => CateringProvider()..fetchEnquiries(),
        ),
        ChangeNotifierProvider<AnalyticsProvider>(
          create: (_) => AnalyticsProvider(socketService: socketService),
        ),
        ChangeNotifierProvider<NotificationProvider>(
          create: (_) => NotificationProvider()..fetchNotifications(),
        ),
        ChangeNotifierProvider<RestaurantProvider>(
          create: (_) => RestaurantProvider(),
        ),
        ChangeNotifierProvider<CmsProvider>(
          create: (_) => CmsProvider(),
        ),
        ChangeNotifierProvider<LoyaltyProvider>(
          create: (_) => LoyaltyProvider(),
        ),
        ChangeNotifierProvider<MarketingProvider>(
          create: (_) => MarketingProvider(),
        ),
        ChangeNotifierProvider<SupportMessagesProvider>(
          create: (_) => SupportMessagesProvider(),
        ),
      ],
      child: const MerchantApp(),
    ),
  );

  // Initialize socket connection after first frame has rendered so it never blocks UI boot
  WidgetsBinding.instance.addPostFrameCallback((_) {
    try {
      socketService.init();
    } catch (e) {
      debugPrint('Socket init post-frame warning: $e');
    }
  });
}

final GoRouter _router = GoRouter(
  navigatorKey: rootNavigatorKey,
  initialLocation: '/splash',
  routes: [
    GoRoute(
      path: '/splash',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/forgot-password',
      builder: (context, state) => const ForgotPasswordScreen(),
    ),
    GoRoute(
      path: '/',
      pageBuilder: (context, state) => const NoTransitionPage(child: DashboardScreen()),
    ),
    GoRoute(
      path: '/analytics',
      builder: (context, state) => const AnalyticsScreen(),
    ),
    GoRoute(
      path: '/crm',
      builder: (context, state) => const CrmScreen(),
    ),
    GoRoute(
      path: '/live-orders',
      pageBuilder: (context, state) => const NoTransitionPage(child: LiveOrdersScreen()),
    ),
    GoRoute(
      path: '/all-orders',
      builder: (context, state) => const AllOrdersScreen(),
    ),
    GoRoute(
      path: '/order-details/:id',
      builder: (context, state) => OrderDetailsScreen(orderId: state.pathParameters['id']!),
    ),
    GoRoute(
      path: '/menu-management',
      pageBuilder: (context, state) => const NoTransitionPage(child: MenuManagementScreen()),
    ),
    GoRoute(
      path: '/promotions',
      builder: (context, state) => const PromotionsScreen(),
    ),
    GoRoute(
      path: '/pos',
      pageBuilder: (context, state) => const NoTransitionPage(child: PosScreen()),
    ),
    GoRoute(
      path: '/kds',
      pageBuilder: (context, state) => const NoTransitionPage(child: KdsScreen()),
    ),
    GoRoute(
      path: '/reservations',
      pageBuilder: (context, state) => const NoTransitionPage(child: ReservationsScreen()),
    ),
    GoRoute(
      path: '/catering',
      builder: (context, state) => const CateringScreen(),
    ),
    GoRoute(
      path: '/more',
      pageBuilder: (context, state) => const NoTransitionPage(child: MoreSettingsScreen()),
    ),
    GoRoute(
      path: '/notifications',
      builder: (context, state) => const NotificationsScreen(),
    ),
    GoRoute(
      path: '/restaurant-settings',
      builder: (context, state) => const RestaurantSettingsScreen(),
    ),
    GoRoute(
      path: '/cms',
      builder: (context, state) => const CmsManagementScreen(),
    ),
    GoRoute(
      path: '/loyalty',
      builder: (context, state) => const LoyaltyRewardsScreen(),
    ),
    GoRoute(
      path: '/marketing',
      builder: (context, state) => const MarketingScreen(),
    ),
    GoRoute(
      path: '/support-messages',
      builder: (context, state) => const SupportMessagesScreen(),
    ),
  ],
);

class MerchantApp extends StatelessWidget {
  const MerchantApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ToastificationWrapper(
      child: MaterialApp.router(
      title: 'Merchant Dashboard',
      theme: AppTheme.lightTheme,
      routerConfig: _router,
      debugShowCheckedModeBanner: false,
      builder: (context, child) {
        return Container(
          color: Colors.white, // Match the bottom nav bar / surface color
          child: SafeArea(
            top: false, // AppBars handle top safe area
            left: false,
            right: false,
            child: child!,
          ),
        );
      },
    ),
    );
  }
}


