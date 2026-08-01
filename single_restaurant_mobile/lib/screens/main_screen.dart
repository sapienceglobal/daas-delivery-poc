import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/screens/home_screen.dart';
import 'package:single_restaurant_mobile/screens/orders_screen.dart';
import 'package:single_restaurant_mobile/screens/profile_screen.dart';
import 'package:single_restaurant_mobile/screens/menu_screen.dart';
import 'package:single_restaurant_mobile/screens/cart_screen.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/address_provider.dart';
import 'package:single_restaurant_mobile/services/ota_update_service.dart';

class MainScreen extends StatefulWidget {
  final int initialIndex;
  
  const MainScreen({super.key, this.initialIndex = 0});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  late int _currentIndex;
  final List<int> _navigationHistory = [];

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _navigationHistory.add(_currentIndex);
    
    // Background OTA check
    WidgetsBinding.instance.addPostFrameCallback((_) {
      OtaUpdateService().checkForUpdate(context, isManual: false);
    });
  }

  void _onItemTapped(int index) {
    if (_currentIndex != index) {
      setState(() {
        _currentIndex = index;
        _navigationHistory.add(index);
      });
    }
  }
  
  // Custom back navigation for the app
  Future<bool> _onWillPop() async {
    if (_navigationHistory.length > 1) {
      setState(() {
        _navigationHistory.removeLast();
        _currentIndex = _navigationHistory.last;
      });
      return false; // Prevent default back behavior
    }
    return true; // Allow exiting the app
  }
  
  // Triggered by back button in child screens (like Orders)
  void _navigateBack() {
    _onWillPop();
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        body: IndexedStack(
          index: _currentIndex,
          children: [
            const HomeScreen(),
            const MenuScreen(),
            const CartScreen(),
            OrdersScreen(onBack: _navigateBack),
            const ProfileScreen(),
          ],
        ),
        bottomNavigationBar: ClipRRect(
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(24.0),
            topRight: Radius.circular(24.0),
          ),
          child: BottomNavigationBar(
            type: BottomNavigationBarType.fixed,
          currentIndex: _currentIndex,
          onTap: _onItemTapped,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.menu_book),
              label: 'Menu',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.shopping_cart_outlined),
              label: 'Cart',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.receipt_long),
              label: 'Orders',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              label: 'Account',
            ),
          ],
        ),
      ),
      ),
    );
  }
}
