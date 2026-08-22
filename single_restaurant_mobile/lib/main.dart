import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/screens/main_screen.dart';
import 'package:single_restaurant_mobile/screens/login_screen.dart';
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

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint("Handling a background message: ${message.messageId}");
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Firebase.initializeApp();
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  
  Stripe.publishableKey = 'pk_test_51Tqvb7HxSFxyqGbKxYaqXnfCOCEDuxSoZyxrMA46oSFzNJ9PGhAu9ggeOOUMKotyx1iblp3dG77GX879vnUBqjiI00SX1sCKi7';
  // Stripe.publishableKey = 'pk_live_51U0Oy3FY8ihGsgg4uTvqPaO7SHZHn9kwl0cb08mLmelJxJGBpV2U8OCR6JiTbipPlivdKqjmcCnrOlzcATl12x7G004CSSZ3AT';
  Stripe.merchantIdentifier = 'merchant.com.lassilounge';
  Stripe.urlScheme = 'lassilounge';
  await Stripe.instance.applySettings();
  
  // Check if user is already logged in
  final authService = AuthService();
  final isLoggedIn = await authService.loadToken();

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
        return NetworkOverlay(child: child!);
      },
      home: SplashScreen(isLoggedIn: isLoggedIn),
    );
  }
}
