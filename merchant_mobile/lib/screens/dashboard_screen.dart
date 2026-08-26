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
import 'dart:math';
import 'package:google_fonts/google_fonts.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

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
    // Banner height (the red hero section)
    const double bannerHeight = 190;

    return Scaffold(
      backgroundColor: Colors.transparent, // Replaced flat red with transparent to show the background
      appBar: const SharedAppBar(),
      drawer: const AppDrawer(),
      body: Stack(
        children: [
          // Layer 0: Premium Full-Screen Background with Parallax
          AnimatedBuilder(
            animation: _scrollController,
            builder: (context, child) {
              double offset = 0.0;
              double scale = 1.0;
              
              if (_scrollController.hasClients) {
                offset = _scrollController.offset;
                if (offset < 0) {
                  // Overscroll top: scale up slightly
                  scale = 1.0 + (-offset / 500);
                  offset = 0; 
                }
              }

              return Positioned.fill(
                child: Transform.scale(
                  scale: scale,
                  alignment: Alignment.topCenter,
                  child: Image.asset(
                    'assets/images/branded/lassi-lounge/dashboard_bg.jpg',
                    fit: BoxFit.cover,
                  ),
                ),
              );
            },
          ),

          // Layer 1: Overscroll Bottom Reveal (Branding)
          AnimatedBuilder(
            animation: _scrollController,
            builder: (context, child) {
              double overscroll = 0.0;
              if (_scrollController.hasClients) {
                final maxScroll = _scrollController.position.maxScrollExtent;
                if (_scrollController.offset > maxScroll) {
                  overscroll = _scrollController.offset - maxScroll;
                }
              }

              if (overscroll <= 0) return const SizedBox.shrink();

              // Calculate opacity and scale based on overscroll amount
              // Calculate reveal progress based on overscroll amount
              // Start the animation only after overscroll reaches 50px so it's not hidden behind the sheet
              final revealProgress = ((overscroll - 50) / 100).clamp(0.0, 1.0);
              final scale = 0.9 + (overscroll / 400).clamp(0.0, 0.2);

              return Positioned(
                bottom: 20, // Moved up to prevent hiding behind bottom tab
                left: 0,
                right: 0,
                child: Transform.scale(
                  scale: scale,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Opacity(
                        opacity: revealProgress,
                        child: Image.asset(
                          'assets/images/branded/lassi-lounge/Lassi-Lounge-icon.png',
                          height: 32, // Small and elegant
                        ),
                      ),
                      const SizedBox(height: 2),
                      ShaderMask(
                        shaderCallback: (bounds) {
                          return LinearGradient(
                            colors: const [Colors.white, Colors.transparent],
                            stops: [revealProgress, revealProgress + 0.15],
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                          ).createShader(bounds);
                        },
                        blendMode: BlendMode.dstIn,
                        child: Text(
                          'Lassi Lounge',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.greatVibes(
                            fontSize: 54,
                            color: Colors.white, // Back to pure white
                            fontWeight: FontWeight.w500,
                            shadows: [
                              Shadow(color: const Color(0xFFDC2626).withValues(alpha: 0.8), blurRadius: 15, offset: const Offset(0, 2)), // Brand red glow
                              Shadow(color: Colors.black.withValues(alpha: 0.4), blurRadius: 10, offset: const Offset(0, 4)),
                            ],
                          ),
                        ),
                      ),
                      Opacity(
                        opacity: revealProgress, // Fade in the tagline only as it reveals
                        child: Text(
                          'Crafting Experiences',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: Colors.white.withValues(alpha: 0.8),
                            fontWeight: FontWeight.w500,
                            letterSpacing: 3,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),

          // Layer 2: Scrollable content on top
          SingleChildScrollView(
            controller: _scrollController,
            physics: const BouncingScrollPhysics(),
            child: Column(
              children: [
                // Transparent spacer so banner is visible initially
                const SizedBox(height: bannerHeight - 24),

                // White content sheet with rounded top corners
                Container(
                  decoration: const BoxDecoration(
                    color: Color(0xFFF5F5F5),
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(24),
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        // 6-Card Stats Grid
                        DashboardStatsGrid(),
                        SizedBox(height: 24),
                        // Live Order Tracker
                        LiveOrderTracker(),
                        SizedBox(height: 24),
                        // Quick Actions
                        QuickActionsGrid(),
                        SizedBox(height: 24),
                        // Charts / Analytics
                        ChartsSection(),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Layer 3: Fixed text that gets covered by the white sheet
          AnimatedBuilder(
            animation: _scrollController,
            builder: (context, child) {
              final offset = _scrollController.hasClients ? max(0.0, _scrollController.offset) : 0.0;
              final visibleHeight = max(0.0, (bannerHeight - 24) - offset);
              
              if (visibleHeight == 0) return const SizedBox.shrink();
              
              return Positioned(
                top: 0,
                left: 0,
                right: 0,
                height: visibleHeight,
                child: ClipRect(
                  child: OverflowBox(
                    alignment: Alignment.topCenter,
                    minHeight: bannerHeight,
                    maxHeight: bannerHeight,
                    child: child,
                  ),
                ),
              );
            },
            child: const WelcomeBannerText(),
          ),
        ],
      ),
      bottomNavigationBar: const SharedBottomNav(currentIndex: 0),
    );
  }
}
