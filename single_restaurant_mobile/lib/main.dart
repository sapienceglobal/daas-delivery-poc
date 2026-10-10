import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/screens/splash_screen.dart';
import 'package:single_restaurant_mobile/services/auth_service.dart';
import 'package:single_restaurant_mobile/theme/app_theme.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/address_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/providers/order_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/checkout_provider.dart';
import 'package:single_restaurant_mobile/providers/loyalty_provider.dart';
import 'package:single_restaurant_mobile/providers/search_provider.dart';
import 'package:single_restaurant_mobile/providers/notification_provider.dart';
import 'package:single_restaurant_mobile/widgets/network_overlay.dart';
import 'package:single_restaurant_mobile/services/navigation_service.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:timezone/data/latest.dart' as tz;
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:timezone/timezone.dart' as tz;

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint("Handling a background message: ${message.messageId}");
}

// ---------------------------------------------------------------------------
// Startup helpers
// ---------------------------------------------------------------------------

/// Runs [task] with a time limit. Never throws: on error or timeout it only
/// logs, so a slow/failing service can never block runApp().
Future<void> _guard(
  String name,
  Future<void> Function() task,
  Duration timeout,
) async {
  try {
    await task().timeout(timeout);
  } catch (e) {
    debugPrint('$name init error: $e');
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
  // Stripe.publishableKey =
  //     'pk_live_51U0Oy3FY8ihGsgg4uTvqPaO7SHZHn9kwl0cb08mLmelJxJGBpV2U8OCR6JiTbipPlivdKqjmcCnrOlzcATl12x7G004CSSZ3AT';

   Stripe.publishableKey =
      'pk_test_51Tqvb7HxSFxyqGbKxYaqXnfCOCEDuxSoZyxrMA46oSFzNJ9PGhAu9ggeOOUMKotyx1iblp3dG77GX879vnUBqjiI00SX1sCKi7';
  Stripe.merchantIdentifier = 'merchant.com.lassilounge';
  Stripe.urlScheme = 'lassilounge';
  await Stripe.instance.applySettings();
}

Future<bool> _loadLoginState(AuthService authService) async {
  try {
    return await authService.loadToken().timeout(const Duration(seconds: 5));
  } catch (e) {
    debugPrint('Auth token load error: $e');
    return false;
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Global error handlers: log instead of crashing/blanking the app.
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    debugPrint('FlutterError: ${details.exceptionAsString()}');
  };
  PlatformDispatcher.instance.onError = (Object error, StackTrace stack) {
    debugPrint('Uncaught error: $error');
    return true;
  };

  // Friendly fallback instead of the grey error box in release builds.
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

  final authService = AuthService();
  bool isLoggedIn = false;

  // All startup work runs in parallel, each with its own time limit.
  // Worst case the app starts after ~8 seconds, never hangs forever.
  await Future.wait<void>([
    _guard('Firebase', _initFirebase, const Duration(seconds: 8)),
    _guard('Timezone', _initTimezone, const Duration(seconds: 3)),
    _guard('Stripe', _initStripe, const Duration(seconds: 5)),
    _loadLoginState(authService).then((value) => isLoggedIn = value),
  ]);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) {
            final authProvider = AuthProvider();
            if (isLoggedIn) {
              authProvider.fetchUser(); // Fetch user data in background
            }
            return authProvider;
          },
          lazy: false,
        ),
        ChangeNotifierProvider(
          create: (_) {
            final addressProvider = AddressProvider();
            if (isLoggedIn) {
              addressProvider.fetchAddresses(); // Preload addresses if logged in
            }
            return addressProvider;
          },
          lazy: false,
        ),
        ChangeNotifierProvider(create: (_) {
          final restaurantProvider = RestaurantProvider();
          restaurantProvider.fetchRestaurantData();
          return restaurantProvider;
        }),
        ChangeNotifierProvider(create: (_) => OrderProvider()),
        ChangeNotifierProvider(create: (_) {
          final cartProvider = CartProvider();
          if (isLoggedIn) {
            cartProvider.loadCart(); // Load saved cart if logged in
          }
          return cartProvider;
        }),
        ChangeNotifierProvider(create: (_) => CheckoutProvider()),
        ChangeNotifierProvider(create: (_) => LoyaltyProvider()),
        ChangeNotifierProvider(create: (_) => SearchProvider()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
      ],
      child: LassiLoungeApp(isLoggedIn: isLoggedIn),
    ),
  );
}

class LassiLoungeApp extends StatelessWidget {
  final bool isLoggedIn;

  const LassiLoungeApp({super.key, required this.isLoggedIn});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: NavigationService.navigatorKey,
      title: 'Lassi Lounge',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      builder: (context, child) {
        final mediaQuery = MediaQuery.of(context);
        final clampedScaler = mediaQuery.textScaler.clamp(
          minScaleFactor: 0.85,
          maxScaleFactor: 1.20,
        );
        return MediaQuery(
          data: mediaQuery.copyWith(textScaler: clampedScaler),
          child: NetworkOverlay(child: child!),
        );
      },
      home: SplashScreen(isLoggedIn: isLoggedIn),
    );
  }
}
