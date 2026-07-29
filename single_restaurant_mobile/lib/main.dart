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
import 'package:flutter_stripe/flutter_stripe.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  Stripe.publishableKey = 'pk_test_51Tqvb7HxSFxyqGbKxYaqXnfCOCEDuxSoZyxrMA46oSFzNJ9PGhAu9ggeOOUMKotyx1iblp3dG77GX879vnUBqjiI00SX1sCKi7';
  await Stripe.instance.applySettings();
  
  // Check if user is already logged in
  final authService = AuthService();
  final isLoggedIn = await authService.loadToken();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) {
          final authProvider = AuthProvider();
          if (isLoggedIn) {
            authProvider.fetchUser(); // Fetch user data in background
          }
          return authProvider;
        }),
        ChangeNotifierProvider(create: (_) {
          final addressProvider = AddressProvider();
          if (isLoggedIn) {
            addressProvider.fetchAddresses(); // Preload addresses if logged in
          }
          return addressProvider;
        }),
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
      title: 'Lassi Lounge',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: SplashScreen(isLoggedIn: isLoggedIn),
    );
  }
}
