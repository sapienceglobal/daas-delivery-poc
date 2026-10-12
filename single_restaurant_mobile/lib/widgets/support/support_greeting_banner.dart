import 'package:flutter/material.dart';

class SupportGreetingBanner extends StatelessWidget {
  final String firstName;

  const SupportGreetingBanner({
    super.key,
    required this.firstName,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final cardWidth = constraints.maxWidth;
        final isSmall = cardWidth < 350;
        final imageWidth = isSmall ? 90.0 : 115.0;

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
          clipBehavior: Clip.antiAlias,
          child: Padding(
            padding: EdgeInsets.symmetric(
              horizontal: isSmall ? 14 : 18,
              vertical: isSmall ? 14 : 16,
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Left Text Column - strictly bounded by Expanded so it never overlaps artwork
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Hi $firstName! 👋',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontFamily: 'serif',
                          color: const Color(0xFF800A12),
                          fontWeight: FontWeight.w900,
                          fontSize: isSmall ? 19 : 22,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        'How can we help you today?',
                        style: TextStyle(
                          color: const Color(0xFF1F2937),
                          fontWeight: FontWeight.w900,
                          fontSize: isSmall ? 14 : 16,
                          height: 1.25,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "We're here to assist you 24/7.",
                        style: TextStyle(
                          color: const Color(0xFF8A8A8E),
                          fontSize: isSmall ? 11.5 : 13,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 8),

                // Right Support Headset Artwork
                SizedBox(
                  width: imageWidth,
                  child: Image.asset(
                    'assets/images/branded/lassi-lounge/help_banner_artwork.png',
                    fit: BoxFit.contain,
                    alignment: Alignment.centerRight,
                    errorBuilder: (context, error, stackTrace) =>
                        const SizedBox(),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
