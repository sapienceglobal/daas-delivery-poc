import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

const _kMaroonGradient = [Color(0xFF6A0C0C), Color(0xFF4C0808)];
const _kBadgeBg = Color(0xFFFCEBE8);
const _kMaroon = Color(0xFF6E1111);

class LoyaltyBalanceCard extends StatelessWidget {
  final int points;

  const LoyaltyBalanceCard({
    super.key,
    required this.points,
  });

  @override
  Widget build(BuildContext context) {
    final formattedPoints = NumberFormat('#,##0').format(points);
    final dollarValue = (points / 100).toStringAsFixed(2);

    return Column(
      children: [
        // Top Maroon Points Card
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            gradient: const LinearGradient(
              colors: _kMaroonGradient,
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            boxShadow: const [
              BoxShadow(
                color: Color(0x356A0C0C),
                blurRadius: 18,
                offset: Offset(0, 8),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Stack(
            children: [
              // Background subtle radial glow / arc
              Positioned(
                right: -20,
                top: -20,
                child: Container(
                  width: 220,
                  height: 220,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withValues(alpha: 0.04),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 22, 16, 22),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Left Text & Balance details
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 34,
                                height: 34,
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.16),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.card_giftcard,
                                  color: Colors.white,
                                  size: 18,
                                ),
                              ),
                              const SizedBox(width: 10),
                              const Text(
                                'Available Balance',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 18),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.baseline,
                            textBaseline: TextBaseline.alphabetic,
                            children: [
                              Text(
                                formattedPoints,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 48,
                                  fontWeight: FontWeight.w900,
                                  height: 1,
                                ),
                              ),
                              const SizedBox(width: 8),
                              const Text(
                                'PTS',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.28),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Text(
                              'Equals \$$dollarValue',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Right 3D Gold Coins illustration
                    SizedBox(
                      width: 130,
                      height: 130,
                      child: Image.asset(
                        'assets/images/branded/lassi-lounge/gold_coins_3d.png',
                        fit: BoxFit.contain,
                        errorBuilder: (ctx, err, st) => const Icon(
                          Icons.monetization_on,
                          color: Colors.amber,
                          size: 90,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 8),

        // Middle 3-Column Benefits Card
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 18),
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0C000000),
                blurRadius: 14,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildBenefitItem(
                icon: Icons.shopping_cart_outlined,
                label: 'Earn\nPoints',
              ),
              _buildBenefitItem(
                icon: Icons.card_giftcard,
                label: 'Get\nRewards',
              ),
              _buildBenefitItem(
                icon: Icons.star_outline_rounded,
                label: 'Save on\nYour Orders',
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildBenefitItem({
    required IconData icon,
    required String label,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 52,
          height: 52,
          decoration: const BoxDecoration(
            color: _kBadgeBg,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: _kMaroon, size: 24),
        ),
        const SizedBox(height: 10),
        Text(
          label,
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 12.5,
            fontWeight: FontWeight.w600,
            color: Color(0xFF2B2B2B),
            height: 1.25,
          ),
        ),
      ],
    );
  }
}
