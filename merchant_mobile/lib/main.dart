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
import 'screens/menu_management_screen.dart';
import 'screens/promotions_screen.dart';
import 'screens/kds_screen.dart';
import 'screens/reservations_screen.dart';
import 'screens/catering_screen.dart';
import 'screens/pos_screen.dart';
import 'screens/more_settings_screen.dart';
import 'screens/notifications_screen.dart';
import 'screens/auth/splash_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/forgot_password_screen.dart';

import 'services/api_service.dart';
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

import 'package:flutter_stripe/flutter_stripe.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint("Handling a background message: ${message.messageId}");
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Stripe.publishableKey = 'pk_test_51Tqvb7HxSFxyqGbKxYaqXnfCOCEDuxSoZyxrMA46oSFzNJ9PGhAu9ggeOOUMKotyx1iblp3dG77GX879vnUBqjiI00SX1sCKi7';
  Stripe.publishableKey =  'pk_live_51U0Oy3FY8ihGsgg4uTvqPaO7SHZHn9kwl0cb08mLmelJxJGBpV2U8OCR6JiTbipPlivdKqjmcCnrOlzcATl12x7G004CSSZ3AT';
  
  await Firebase.initializeApp();
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  
  // Initialize SharedPreferences
  final prefs = await SharedPreferences.getInstance();
  
  // Create shared instances
  final socketService = SocketService();
  final authProvider = AuthProvider();
  
  // Check initial login state
  await authProvider.checkLoginStatus();
  socketService.init();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthProvider>.value(value: authProvider),
        Provider<SharedPreferences>.value(value: prefs),
        // Provider<ApiService>.value(value: apiService),
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
          create: (_) => AnalyticsProvider(),
        ),
        ChangeNotifierProvider<NotificationProvider>(
          create: (_) => NotificationProvider()..fetchNotifications(),
        ),
      ],
      child: const MerchantApp(),
    ),
  );
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
      builder: (context, state) => const MenuManagementScreen(),
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


