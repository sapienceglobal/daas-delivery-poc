import 'package:flutter/material.dart';
import 'dashboard_widgets.dart';
import '../widgets/app_drawer.dart';
import '../widgets/shared_app_bar.dart';
import '../widgets/shared_bottom_nav.dart';
import 'package:provider/provider.dart';
import '../providers/analytics_provider.dart';
import '../providers/auth_provider.dart';
import '../services/push_notification_service.dart';
import '../services/ota_update_service.dart';
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthProvider>();
      if (auth.user?['restaurantId'] != null) {
        context.read<AnalyticsProvider>().fetchAnalytics(auth.user!['restaurantId']);
      }
      PushNotificationService().initialize(context);
      OtaUpdateService().checkForUpdate(context);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white, // Pure white background
      appBar: const SharedAppBar(),
      drawer: const AppDrawer(),
      body: SingleChildScrollView(
        controller: _scrollController,
        physics: const BouncingScrollPhysics(),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16.0, 12.0, 16.0, 6.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              // Welcome Text & Timeframe selector
              WelcomeBannerText(),
              SizedBox(height: 18),
              
              // Horizontally scrollable stats cards row (Total Revenue, Orders, Customers, Reservations, etc.)
              RevenueOrdersCard(),
              SizedBox(height: 20),
              
              // Live Order Tracker
              LiveOrderTracker(),
              SizedBox(height: 20),
              
              // Quick Actions (4x2 grid)
              QuickActionsGrid(),
              SizedBox(height: 20),
              
              // Charts / Analytics
              ChartsSection(),
              SizedBox(height: 20),

              // Momentum Card
              MomentumCard(),
              SizedBox(height: 4),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const SharedBottomNav(currentIndex: 0),
    );
  }
}
