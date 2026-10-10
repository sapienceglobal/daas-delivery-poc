import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';

/// Pure presentational header for OTP Verification screen.
/// Shows brand logo, Indian Restaurant badge, and verification phone/code illustration.
class OtpHeader extends StatelessWidget {
  const OtpHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final statusBar = MediaQuery.of(context).padding.top;
    final topPadding = statusBar > 0 ? statusBar + 12.0 : 36.0;

    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFFFFF9F2), Colors.white],
        ),
      ),
      padding: EdgeInsets.only(top: topPadding, bottom: 16.0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Image.asset(
            'assets/images/branded/lassi-lounge/Lassi-Lounge-logo.png',
            height: 96,
            fit: BoxFit.contain,
            errorBuilder: (c, e, s) => const Text(
              'LASSI LOUNGE',
              style: TextStyle(
                color: AppColors.primary,
                fontSize: 28,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: 4),
          const Row(
            mainAxisSize: MainAxisSize.min,
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
          const SizedBox(height: 16),
          // Illustration Stack
          SizedBox(
            height: 140,
            width: 240,
            child: Stack(
              alignment: Alignment.center,
              children: [
                Container(
                  width: 84,
                  height: 136,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.orange.shade200, width: 2.5),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.orange.withValues(alpha: 0.2),
                        blurRadius: 16,
                        spreadRadius: 4,
                      ),
                    ],
                  ),
                ),
                const Positioned(
                  top: 32,
                  child: Icon(
                    Icons.mark_email_read_outlined,
                    color: AppColors.secondary,
                    size: 30,
                  ),
                ),
                Positioned(
                  bottom: 16,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF7F0),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.orange.shade200),
                      boxShadow: const [
                        BoxShadow(
                          color: Colors.black12,
                          blurRadius: 4,
                          offset: Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Text(
                      '123456',
                      style: TextStyle(
                        color: AppColors.secondary,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        letterSpacing: 2,
                      ),
                    ),
                  ),
                ),
                Positioned(
                  bottom: 8,
                  left: 8,
                  child: Icon(
                    Icons.local_drink,
                    color: Colors.orange.shade300,
                    size: 52,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
