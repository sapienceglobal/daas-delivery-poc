import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'screens/login_screen.dart';
import 'screens/customer/customer_main_screen.dart';
import 'screens/merchant/merchant_main_screen.dart';

import 'screens/admin_dashboard_screen.dart';
import 'screens/driver_dashboard_screen.dart';
import 'theme.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'services/firebase_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await FirebaseService.init();
  Stripe.publishableKey = 'pk_test_51Tqvb7HxSFxyqGbKxYaqXnfCOCEDuxSoZyxrMA46oSFzNJ9PGhAu9ggeOOUMKotyx1iblp3dG77GX879vnUBqjiI00SX1sCKi7';
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'WebForge DaaS',
      debugShowCheckedModeBanner: false,
      theme: buildBrandTheme(),
      home: const MainGate(),
      routes: {
        '/login': (context) => const LoginScreen(),
        '/customer': (context) => const CustomerMainScreen(),
        '/merchant': (context) => const MerchantMainScreen(),
        '/admin': (context) => const AdminDashboardScreen(),
        '/driver': (context) => const DriverDashboardScreen(),
      },
    );
  }
}

class MainGate extends StatelessWidget {
  const MainGate({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);

    if (auth.isBootstrapping) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: BrandColors.cyan),
        ),
      );
    }

    if (!auth.isAuthenticated) {
      return const LoginScreen();
    }

    // Direct to correct portal based on role
    final role = auth.userRole;
    if (role == 'admin') {
      return const AdminDashboardScreen();
    } else if (role == 'merchant') {
      return const MerchantMainScreen();
    } else if (role == 'driver') {
      return const DriverDashboardScreen();
    } else {
      return const CustomerMainScreen();
    }
  }
}
