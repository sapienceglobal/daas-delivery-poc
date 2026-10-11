import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Top Hero Section of Refer & Earn screen matching reference design.
/// Features "Give $20, Get $25!" serif headline, highlighted coupon offer text,
/// and the smiling couple enjoying Lassi Lounge feast.
class ReferralHeroSection extends StatelessWidget {
  final num refereeDiscount;
  final num referrerReward;
  final String? customDescription;

  const ReferralHeroSection({
    super.key,
    this.refereeDiscount = 25,
    this.referrerReward = 25,
    this.customDescription,
  });

  @override
  Widget build(BuildContext context) {
    final discountStr = refereeDiscount.toInt().toString();
    final rewardStr = referrerReward.toInt().toString();

    return Padding(
      padding: const EdgeInsets.fromLTRB(18, 12, 12, 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Left: Headline & Offer Description
          Expanded(
            flex: 11,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Text(
                      'Give \$$discountStr,\nGet \$$rewardStr!',
                      style: GoogleFonts.playfairDisplay(
                        fontSize: 30,
                        fontWeight: FontWeight.w900,
                        height: 1.15,
                        color: const Color(0xFF4A0E13),
                      ),
                    ),
                    Positioned(
                      top: -6,
                      right: 18,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Transform.rotate(
                            angle: -0.3,
                            child: Container(
                              width: 3,
                              height: 10,
                              decoration: BoxDecoration(
                                color: const Color(0xFFF59E0B),
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                          ),
                          const SizedBox(width: 3),
                          Container(
                            width: 3,
                            height: 13,
                            decoration: BoxDecoration(
                              color: const Color(0xFFF59E0B),
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                          const SizedBox(width: 3),
                          Transform.rotate(
                            angle: 0.3,
                            child: Container(
                              width: 3,
                              height: 10,
                              decoration: BoxDecoration(
                                color: const Color(0xFFF59E0B),
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                const Text(
                  'Invite your friends to Lassi Lounge!',
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF374151),
                  ),
                ),
                const SizedBox(height: 4),
                RichText(
                  text: TextSpan(
                    style: const TextStyle(
                      fontSize: 12.0,
                      color: Color(0xFF4B5563),
                      height: 1.4,
                    ),
                    children: [
                      const TextSpan(text: 'Your friend gets a '),
                      TextSpan(
                        text: '\$$discountStr OFF',
                        style: const TextStyle(
                          color: Color(0xFF800A12),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const TextSpan(
                        text: ' coupon, and you earn ',
                      ),
                      TextSpan(
                        text: '\$$rewardStr in loyalty rewards',
                        style: const TextStyle(
                          color: Color(0xFF800A12),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const TextSpan(
                        text: ' when they complete their first eligible order.',
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(width: 8),

          // Right: Hero Illustration of couple enjoying Lassi Lounge feast
          Expanded(
            flex: 10,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.asset(
                'assets/images/branded/lassi-lounge/referral_couple.jpg',
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) {
                  return const SizedBox(height: 180);
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}
