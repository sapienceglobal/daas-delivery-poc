import 'package:flutter/material.dart';

class SupportGreetingBanner extends StatelessWidget {
  final String firstName;

  const SupportGreetingBanner({
    super.key,
    required this.firstName,
  });

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1E5E5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Stack(
          children: [
            Positioned(
              right: 0,
              top: 0,
              bottom: 0,
              child: Image.asset(
                'assets/images/branded/lassi-lounge/help_banner_artwork.png',
                fit: BoxFit.fitHeight,
                alignment: Alignment.centerRight,
                errorBuilder: (context, error, stackTrace) => const SizedBox(),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: screenWidth > 450 ? 320 : screenWidth * 0.62,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Hi $firstName! 👋',
                      style: const TextStyle(
                        fontFamily: 'serif',
                        color: Color(0xFF800A12),
                        fontWeight: FontWeight.w900,
                        fontSize: 22,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'How can we help you today?',
                      style: TextStyle(
                        color: Color(0xFF1F2937),
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      "We're here to assist you 24/7.",
                      style: TextStyle(
                        color: Color(0xFF8A8A8E),
                        fontSize: 13,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
