import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/screens/book_table_screen.dart';
import 'package:single_restaurant_mobile/screens/login_screen.dart';
import 'package:single_restaurant_mobile/screens/main_screen.dart';
import 'package:single_restaurant_mobile/theme/app_responsive.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';
import 'package:single_restaurant_mobile/widgets/welcome/welcome_action_button.dart';
import 'package:single_restaurant_mobile/widgets/welcome/welcome_card_clipper.dart';
import 'package:single_restaurant_mobile/widgets/welcome/welcome_food_header.dart';
import 'package:single_restaurant_mobile/widgets/welcome/welcome_icons.dart';
import 'package:single_restaurant_mobile/widgets/welcome/welcome_monuments_watermark.dart';

class SplashScreen extends StatefulWidget {
  final bool isLoggedIn;

  const SplashScreen({super.key, required this.isLoggedIn});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  bool _isExploreLoading = false;
  bool _isOrderLoading = false;
  bool _isReserveLoading = false;

  bool get _isAnyLoading =>
      _isExploreLoading || _isOrderLoading || _isReserveLoading;

  Future<void> _onExploreMenu() async {
    if (_isAnyLoading) return;
    setState(() => _isExploreLoading = true);

    await Future.delayed(const Duration(milliseconds: 350));
    if (!mounted) return;
    setState(() => _isExploreLoading = false);

    // Both authenticated and non-authenticated (guest) users enter Menu tab
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => const MainScreen(initialIndex: 1),
      ),
    );
  }

  Future<void> _onOrderOnline() async {
    if (_isAnyLoading) return;
    setState(() => _isOrderLoading = true);

    await Future.delayed(const Duration(milliseconds: 350));
    if (!mounted) return;
    setState(() => _isOrderLoading = false);

    if (widget.isLoggedIn) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => const MainScreen(initialIndex: 0),
        ),
      );
    } else {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => const LoginScreen(),
        ),
      );
    }
  }

  Future<void> _onReserveTable() async {
    if (_isAnyLoading) return;
    setState(() => _isReserveLoading = true);

    await Future.delayed(const Duration(milliseconds: 350));
    if (!mounted) return;
    setState(() => _isReserveLoading = false);

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const BookTableScreen(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1B0C06),
      body: ResponsiveCenter(
        maxWidth: AppResponsive.maxFormWidth,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final screenHeight = constraints.maxHeight;
            final isCompact = screenHeight < 640;
            final headerHeight = (screenHeight * 0.46).clamp(
              isCompact ? 220.0 : 275.0,
              440.0,
            );
            const waveOverlap = 30.0;
            final cardMinHeight = screenHeight - (headerHeight - waveOverlap);

            return Stack(
              children: [
                // Top Hero Food Banner (Copper Kadai, Biryani, Naan & Lassi Lounge branding)
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: WelcomeFoodHeader(height: headerHeight),
                ),

                // Scrollable Content with Overlapping Wavy White Card
                Positioned.fill(
                  child: SingleChildScrollView(
                    physics: const ClampingScrollPhysics(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        SizedBox(height: headerHeight - waveOverlap),

                        // Curved White Container Card
                        ClipPath(
                          clipper: const WelcomeCardClipper(),
                          child: Container(
                            width: double.infinity,
                            constraints: BoxConstraints(
                              minHeight: cardMinHeight,
                            ),
                            color: Colors.white,
                            child: Stack(
                              children: [
                                // Indian Monuments Silhouette Watermark (Taj Mahal & Mandalas)
                                const WelcomeMonumentsWatermark(
                                  height: 120,
                                  opacity: 0.95,
                                ),

                                // Card Content: Headings & 3 Action Buttons
                                Padding(
                                  padding: EdgeInsets.symmetric(
                                    horizontal: isCompact ? 20.0 : 24.0,
                                    vertical: 20.0,
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.center,
                                    children: [
                                      SizedBox(height: isCompact ? 18 : 24),

                                      // Headline: "Welcome to"
                                      const Text(
                                        'Welcome to',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(
                                          color: Color(0xFF1F1F1F),
                                          fontSize: 28,
                                          fontWeight: FontWeight.w800,
                                          letterSpacing: -0.5,
                                        ),
                                      ),
                                      const SizedBox(height: 2),

                                      // Headline: "Lassi Lounge"
                                      const Text(
                                        'Lassi Lounge',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(
                                          color: Color(0xFF800A12),
                                          fontSize: 34,
                                          fontWeight: FontWeight.w900,
                                          letterSpacing: -0.6,
                                          height: 1.15,
                                        ),
                                      ),
                                      const SizedBox(height: 10),

                                      // Subtitle
                                      const Text(
                                        'Authentic Indian Cuisine\nDelivered to Your Doorstep',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(
                                          color: Color(0xFF555555),
                                          fontSize: 14.5,
                                          fontWeight: FontWeight.w500,
                                          height: 1.35,
                                        ),
                                      ),
                                      SizedBox(height: isCompact ? 18 : 24),

                                      // 1. EXPLORE OUR MENU Button
                                      WelcomeActionButton(
                                        title: 'EXPLORE OUR MENU',
                                        isUppercase: true,
                                        icon: const MenuDocumentIcon(
                                          color: Color(0xFF800A12),
                                          size: 26,
                                        ),
                                        backgroundColor: const Color(0xFFFEEDE6),
                                        textColor: const Color(0xFF800A12),
                                        arrowColor: const Color(0xFF800A12),
                                        isLoading: _isExploreLoading,
                                        onTap: _onExploreMenu,
                                      ),
                                      const SizedBox(height: 14),

                                      // 2. ORDER ONLINE Button
                                      WelcomeActionButton(
                                        title: 'ORDER ONLINE',
                                        isUppercase: true,
                                        icon: const ClochePlatterIcon(
                                          color: Color(0xFF1F1F1F),
                                          size: 26,
                                        ),
                                        backgroundColor: const Color(0xFFFAB82C),
                                        textColor: const Color(0xFF1F1F1F),
                                        arrowColor: const Color(0xFF1F1F1F),
                                        isLoading: _isOrderLoading,
                                        onTap: _onOrderOnline,
                                      ),
                                      const SizedBox(height: 14),

                                      // 3. RESERVE A TABLE Button
                                      WelcomeActionButton(
                                        title: 'RESERVE A TABLE',
                                        isUppercase: true,
                                        icon: const DiningTableIcon(
                                          color: Color(0xFF800A12),
                                          size: 26,
                                        ),
                                        backgroundColor: Colors.white,
                                        borderColor: const Color(0xFF800A12),
                                        textColor: const Color(0xFF800A12),
                                        arrowColor: const Color(0xFF800A12),
                                        isLoading: _isReserveLoading,
                                        onTap: _onReserveTable,
                                      ),

                                      const SizedBox(height: 32),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
