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
            final isCompact = screenHeight < 720 || constraints.maxWidth < 380;
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
                                      SizedBox(height: isCompact ? 14 : 20),

                                      // Headline: "Welcome to"
                                      Text(
                                        'Welcome to',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(
                                          color: const Color(0xFF1F1F1F),
                                          fontSize: isCompact ? 24 : 28,
                                          fontWeight: FontWeight.w900,
                                          letterSpacing: -0.4,
                                          height: isCompact ? 1.05 : 1.15,
                                        ),
                                      ),
                                      SizedBox(height: isCompact ? 1 : 2),

                                      // Headline: "Lassi Lounge"
                                      Text(
                                        'Lassi Lounge',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(
                                          color: const Color(0xFF800A12),
                                          fontSize: isCompact ? 29 : 34,
                                          fontWeight: FontWeight.w900,
                                          letterSpacing:
                                              isCompact ? -0.5 : -0.6,
                                          height: isCompact ? 1.05 : 1.15,
                                        ),
                                      ),
                                      SizedBox(height: isCompact ? 7 : 10),

                                      // Subtitle
                                      Text(
                                        'Authentic Indian Cuisine\nDelivered to Your Doorstep',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(
                                          color: const Color(0xFF555555),
                                          fontSize: isCompact ? 13 : 14.5,
                                          fontWeight: FontWeight.w500,
                                          height: isCompact ? 1.3 : 1.35,
                                        ),
                                      ),
                                      SizedBox(height: isCompact ? 14 : 24),

                                      // 1. Explore Our Menu Button
                                      WelcomeActionButton(
                                        title: 'EXPLORE OUR MENU',
                                        isUppercase: true,
                                        height: isCompact ? 46.0 : 54.0,
                                        icon: MenuDocumentIcon(
                                          color: const Color(0xFF800A12),
                                          size: isCompact ? 22 : 26,
                                        ),
                                        backgroundColor: const Color(0xFFFEEDE6),
                                        textColor: const Color(0xFF800A12),
                                        arrowColor: const Color(0xFF800A12),
                                        isLoading: _isExploreLoading,
                                        onTap: _onExploreMenu,
                                      ),
                                      SizedBox(height: isCompact ? 11 : 14),

                                      // 2. ORDER ONLINE Button
                                      WelcomeActionButton(
                                        title: 'ORDER ONLINE',
                                        isUppercase: true,
                                        height: isCompact ? 46.0 : 54.0,
                                        icon: ClochePlatterIcon(
                                          color: const Color(0xFF1F1F1F),
                                          size: isCompact ? 22 : 26,
                                        ),
                                        backgroundColor: const Color(0xFFFAB82C),
                                        textColor: const Color(0xFF1F1F1F),
                                        arrowColor: const Color(0xFF1F1F1F),
                                        isLoading: _isOrderLoading,
                                        onTap: _onOrderOnline,
                                      ),
                                      SizedBox(height: isCompact ? 11 : 14),

                                      // 3. RESERVE A TABLE Button
                                      WelcomeActionButton(
                                        title: 'RESERVE A TABLE',
                                        isUppercase: true,
                                        height: isCompact ? 46.0 : 54.0,
                                        icon: DiningTableIcon(
                                          color: const Color(0xFF800A12),
                                          size: isCompact ? 22 : 26,
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
