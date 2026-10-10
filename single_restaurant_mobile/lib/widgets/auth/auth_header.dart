import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/widgets/app_logo.dart';

/// Pure presentational header for authentication screens (Login, Register).
/// Displays brand gradient, AppLogo, Indian Restaurant tag, title, and subtitle.
class AuthHeader extends StatelessWidget {
  final String title;
  final String subtitle;

  const AuthHeader({
    super.key,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    final statusBarHeight = MediaQuery.of(context).padding.top;
    final topPadding = statusBarHeight > 0 ? statusBarHeight + 20.0 : 40.0;

    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFFFFF9F2), Color(0xFFFAF8F5)],
        ),
      ),
      padding: EdgeInsets.only(
        top: topPadding,
        left: 20.0,
        right: 20.0,
        bottom: 32.0,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const AppLogo(height: 76),
          const SizedBox(height: 8),
          const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.spa, color: Colors.orange, size: 12),
              SizedBox(width: 8),
              Text(
                'INDIAN RESTAURANT',
                style: TextStyle(
                  color: Colors.orange,
                  fontSize: 10,
                  letterSpacing: 1.2,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(width: 8),
              Icon(Icons.spa, color: Colors.orange, size: 12),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppColors.secondary,
              fontSize: 24,
              fontWeight: FontWeight.bold,
              fontFamily: 'serif',
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.grey,
              fontSize: 13,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 12),
          const Icon(
            Icons.horizontal_rule,
            color: Colors.orange,
            size: 24,
          ),
        ],
      ),
    );
  }
}
