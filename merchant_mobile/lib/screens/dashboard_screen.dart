import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';
import 'dashboard_widgets.dart';
import 'package:go_router/go_router.dart';
import '../widgets/app_drawer.dart';
import '../widgets/shared_app_bar.dart';
import '../widgets/shared_bottom_nav.dart';
import 'package:provider/provider.dart';
import '../providers/analytics_provider.dart';
import '../providers/auth_provider.dart';
import '../services/push_notification_service.dart';
import '../services/ota_update_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
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
    // Determine screen width for responsive sizing
    final isDesktop = MediaQuery.of(context).size.width > 900;
    
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC), // Ultra soft slate background
      appBar: const SharedAppBar(),
      drawer: const AppDrawer(),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(left: 24.0, right: 24.0, top: 32.0, bottom: 16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const WelcomeBanner(),
            const SizedBox(height: 32),
            const SummaryStatsGrid(),
            const SizedBox(height: 32),
            const LiveOrderTracker(),
            const SizedBox(height: 32),
            const ChartsSection(),
          ],
        ),
      ),
      bottomNavigationBar: const SharedBottomNav(currentIndex: 0),
    );
  }
}
