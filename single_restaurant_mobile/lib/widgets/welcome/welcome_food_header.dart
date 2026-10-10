import 'package:flutter/material.dart';

/// Top hero food banner featuring authentic Indian gourmet feast photography
/// (copper handi butter chicken, biryani, naan, chutneys)
/// and the official Lassi Lounge branding header.
class WelcomeFoodHeader extends StatelessWidget {
  final double height;

  const WelcomeFoodHeader({
    super.key,
    required this.height,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Background Food Feast Image
          Image.asset(
            'assets/images/branded/lassi-lounge/welcome_hero_food.png',
            fit: BoxFit.cover,
            alignment: Alignment.topCenter,
            errorBuilder: (context, error, stackTrace) {
              // Fallback to high-res feast asset or network image
              return Image.asset(
                'assets/images/branded/lassi-lounge/welcome_food_feast.jpg',
                fit: BoxFit.cover,
                alignment: Alignment.center,
                errorBuilder: (context, error, stackTrace) => Container(
                  color: const Color(0xFF200E08),
                ),
              );
            },
          ),

          // Top Subtle Gradient Scrim for Status Bar & Notch Readability
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 175,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.70),
                    Colors.black.withValues(alpha: 0.35),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // Standalone Crisp Lassi Lounge Logo & Authentic Subtitle
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.only(top: 4.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Image.asset(
                      'assets/images/branded/lassi-lounge/Lassi-Lounge-logo.png',
                      height: height < 260 ? 112.0 : 145.0,
                      fit: BoxFit.contain,
                    ),
                    Transform.translate(
                      offset: const Offset(0, -24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text(
                            'AUTHENTIC INDIAN CUISINE',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Color(0xFFF7EFE4),
                              fontSize: 10.5,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 2.2,
                              shadows: [
                                Shadow(
                                  offset: Offset(0, 1),
                                  blurRadius: 4,
                                  color: Colors.black54,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 3),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                width: 22,
                                height: 1,
                                color: const Color(0xFFFAB82C).withValues(alpha: 0.85),
                              ),
                              const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 7.0),
                                child: Text(
                                  'NEW YORK',
                                  style: TextStyle(
                                    color: Color(0xFFFAB82C),
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 2.8,
                                    shadows: [
                                      Shadow(
                                        offset: Offset(0, 1),
                                        blurRadius: 4,
                                        color: Colors.black54,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              Container(
                                width: 22,
                                height: 1,
                                color: const Color(0xFFFAB82C).withValues(alpha: 0.85),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
