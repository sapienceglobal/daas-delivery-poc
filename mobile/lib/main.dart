import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'screens/login_screen.dart';
import 'screens/customer_home_screen.dart';
import 'screens/merchant_dashboard_screen.dart';
import 'screens/admin_dashboard_screen.dart';
import 'theme.dart';

void main() {
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
      title: 'Sapience Global PoC',
      debugShowCheckedModeBanner: false,
      theme: buildBrandTheme(),
      home: const MainGate(),
      routes: {
        '/login': (context) => const LoginScreen(),
        '/customer': (context) => const CustomerHomeScreen(),
        '/merchant': (context) => const MerchantDashboardScreen(),
        '/admin': (context) => const AdminDashboardScreen(),
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
      return const MerchantDashboardScreen();
    } else {
      return const CustomerHomeScreen();
    }
  }
}
