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

          // Standalone Crisp Lassi Lounge Logo
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.only(top: 10.0),
                child: Center(
                  child: Image.asset(
                    'assets/images/branded/lassi-lounge/Lassi-Lounge-logo.png',
                    height: height < 260 ? 110.0 : 142.0,
                    fit: BoxFit.contain,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
