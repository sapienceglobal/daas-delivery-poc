import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/loyalty_provider.dart';
import 'package:single_restaurant_mobile/providers/notification_provider.dart';
import 'package:single_restaurant_mobile/screens/home_screen.dart';
import 'package:single_restaurant_mobile/screens/menu_screen.dart';
import 'package:single_restaurant_mobile/screens/offers_screen.dart';
import 'package:single_restaurant_mobile/screens/orders_screen.dart';
import 'package:single_restaurant_mobile/screens/profile_screen.dart';
import 'package:single_restaurant_mobile/services/ota_update_service.dart';
import 'package:single_restaurant_mobile/services/push_notification_service.dart';
import 'package:single_restaurant_mobile/theme/app_radius.dart';

class MainScreen extends StatefulWidget {
  final int initialIndex;
  final List<Widget>? tabs;

  const MainScreen({super.key, this.initialIndex = 0, this.tabs});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  late int _currentIndex;
  final List<int> _navigationHistory = [];
  DateTime? _lastPressedAt;
  String? _menuCategoryId;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _navigationHistory.add(_currentIndex);

    // Background OTA check and initialize providers
    WidgetsBinding.instance.addPostFrameCallback((_) {
      OtaUpdateService().checkForUpdate(context, isManual: false);

      final authProv = context.read<AuthProvider>();
      if (authProv.isAuthenticated) {
        context.read<LoyaltyProvider>().fetchHistory();
        context.read<NotificationProvider>().fetchNotifications();
      }

      try {
        PushNotificationService().initialize(context);
      } catch (e) {
        debugPrint('PushNotification init skipped: $e');
      }
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

  void _onNavigateToTab(int index, {String? categoryId}) {
    setState(() {
      _currentIndex = index;
      _navigationHistory.add(index);
      _menuCategoryId = categoryId;
    });
  }

  Future<bool> _onWillPop() async {
    if (_navigationHistory.length > 1) {
      setState(() {
        _navigationHistory.removeLast();
        _currentIndex = _navigationHistory.last;
      });
      return false;
    }

    if (_currentIndex != 0) {
      setState(() {
        _currentIndex = 0;
        _navigationHistory.clear();
        _navigationHistory.add(0);
      });
      return false;
    }

    final now = DateTime.now();
    if (_lastPressedAt == null ||
        now.difference(_lastPressedAt!) > const Duration(seconds: 2)) {
      _lastPressedAt = now;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Press back again to exit the app',
            textAlign: TextAlign.center,
          ),
          duration: Duration(seconds: 2),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return false;
    }

    return true;
  }

  void _navigateBack() {
    _onWillPop();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (bool didPop, dynamic result) async {
        if (didPop) return;
        final bool shouldPop = await _onWillPop();
        if (shouldPop) {
          SystemNavigator.pop();
        }
      },
      child: Scaffold(
        body: IndexedStack(
          index: _currentIndex,
          children: widget.tabs ??
              [
                HomeScreen(onNavigateTab: _onNavigateToTab),
                MenuScreen(
                  key: _menuCategoryId != null
                      ? ValueKey('menu_$_menuCategoryId')
                      : const ValueKey('menu_default'),
                  initialCategoryId: _menuCategoryId,
                  onBack: _navigateBack,
                ),
                OffersScreen(onBack: _navigateBack),
                OrdersScreen(onBack: _navigateBack),
                const ProfileScreen(),
              ],
        ),
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            color: const Color(0xFF680D13),
            borderRadius: AppRadius.topXxl,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.15),
                blurRadius: 16,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: AppRadius.topXxl,
            child: BottomNavigationBar(
              type: BottomNavigationBarType.fixed,
              elevation: 0,
              backgroundColor: const Color(0xFF680D13),
              selectedItemColor: const Color(0xFFFFC107),
              unselectedItemColor: Colors.white70,
              selectedLabelStyle: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
              unselectedLabelStyle: const TextStyle(
                fontWeight: FontWeight.w500,
                fontSize: 12,
              ),
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
                  icon: Icon(Icons.local_offer_outlined),
                  activeIcon: Icon(Icons.local_offer),
                  label: 'Offers',
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
      ),
    );
  }
}
