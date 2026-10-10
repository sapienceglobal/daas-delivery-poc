import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';

/// Pure presentational footer cards for OTP screen ("Why do we need this code?" + security note).
class OtpInfoCards extends StatelessWidget {
  const OtpInfoCards({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFFFF7F0),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.orange.shade100),
          ),
          child: const Row(
            children: [
              Icon(Icons.chat_bubble_outline, color: AppColors.secondary, size: 32),
              SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Why do we need this code?',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        color: Colors.black87,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'To confirm this email is really yours and keep your\nLassi Lounge account safe and secure.',
                      style: TextStyle(
                        color: Colors.black54,
                        fontSize: 12,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 32),
        FittedBox(
          fit: BoxFit.scaleDown,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.lock_outline, color: Colors.grey, size: 14),
              const SizedBox(width: 4),
              const Text(
                'Secure Connection',
                style: TextStyle(color: Colors.grey, fontSize: 11),
              ),
              Container(
                height: 12,
                width: 1,
                color: Colors.grey,
                margin: const EdgeInsets.symmetric(horizontal: 8),
              ),
              const Text(
                'Powered by Lassi Lounge',
                style: TextStyle(color: Colors.grey, fontSize: 11),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
