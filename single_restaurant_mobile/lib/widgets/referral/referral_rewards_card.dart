import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Double Reward Cards displaying "Your Friend Gets $20 OFF"
/// and "You Get $25 OFF" matching reference design.
class ReferralRewardsCard extends StatelessWidget {
  final num refereeDiscount;
  final num referrerReward;
  final num refereeMinOrder;

  const ReferralRewardsCard({
    super.key,
    this.refereeDiscount = 25,
    this.referrerReward = 25,
    this.refereeMinOrder = 30,
  });

  @override
  Widget build(BuildContext context) {
    final discountStr = refereeDiscount.toInt().toString();
    final rewardStr = referrerReward.toInt().toString();
    final minOrderStr = refereeMinOrder.toInt().toString();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Left Card: Your Friend Gets $X OFF
          Expanded(
            child: _buildRewardTile(
              backgroundColor: const Color(0xFFFFF9EE),
              imagePath:
                  'assets/images/branded/lassi-lounge/referral_gift_box.png',
              label: 'Your Friend Gets',
              amount: '\$$discountStr OFF',
              condition: 'on first order of \$$minOrderStr+',
            ),
          ),

          // Thin Vertical Divider
          Container(
            width: 1,
            height: 120,
            margin: const EdgeInsets.symmetric(horizontal: 8),
            color: const Color(0xFFF3F4F6),
          ),

          // Right Card: You Get $Y Rewards
          Expanded(
            child: _buildRewardTile(
              backgroundColor: const Color(0xFFFFF2F2),
              imagePath:
                  'assets/images/branded/lassi-lounge/referral_gift_box.png',
              label: 'You Get',
              amount: '\$$rewardStr REWARD',
              condition: 'in loyalty points when\nthey complete 1st order',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRewardTile({
    required Color backgroundColor,
    required String imagePath,
    required String label,
    required String amount,
    required String condition,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        children: [
          // 3D Surprise Gift Box Graphic (Clean, no hardcoded dollar amount)
          Image.asset(
            imagePath,
            height: 48,
            fit: BoxFit.contain,
            errorBuilder: (context, error, stackTrace) => const Icon(
              Icons.card_giftcard,
              color: Color(0xFF800A12),
              size: 44,
            ),
          ),
          const SizedBox(height: 8),

          Text(
            label,
            style: const TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 3),

          Text(
            amount,
            style: GoogleFonts.playfairDisplay(
              fontSize: 19,
              fontWeight: FontWeight.w900,
              color: const Color(0xFF7B1113),
            ),
          ),
          const SizedBox(height: 4),

          Text(
            condition,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 10.5,
              color: Color(0xFF6B7280),
              height: 1.25,
            ),
          ),
        ],
      ),
    );
  }
}
