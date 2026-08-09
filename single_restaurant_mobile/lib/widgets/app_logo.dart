import 'package:flutter/material.dart';

/// Single source of truth for the Lassi Lounge brand mark.
/// Reuses the same asset generated for the native splash screen's
/// `branding` image — one real file, no font-guessing, no duplicated
/// "mock logo" blocks scattered across screens.
///
/// Use this on every screen that needs the logo (login, register,
/// forgot password, app bars, etc.) instead of re-typing an
/// Icon + Text placeholder each time.
class AppLogo extends StatelessWidget {
  final double height;

  const AppLogo({super.key, this.height = 56});

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      'assets/images/branded/lassi-lounge/splash-branding.png',
      height: height,
      fit: BoxFit.contain,
    );
  }
}