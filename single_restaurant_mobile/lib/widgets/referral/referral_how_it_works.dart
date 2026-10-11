import 'package:flutter/material.dart';

/// 4-Step "How It Works" Process Stepper matching reference design.
class ReferralHowItWorks extends StatelessWidget {
  final num refereeDiscount;
  final num referrerReward;

  const ReferralHowItWorks({
    super.key,
    this.refereeDiscount = 25,
    this.referrerReward = 25,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'How It Works',
            style: TextStyle(
              fontSize: 15.5,
              fontWeight: FontWeight.bold,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: _buildStep(
                  stepNumber: '1',
                  icon: Icons.share_outlined,
                  textWidget: const Text(
                    'Share your\nreferral code',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 10.5,
                      color: Color(0xFF374151),
                      height: 1.25,
                    ),
                  ),
                ),
              ),
              _buildArrow(),
              Expanded(
                child: _buildStep(
                  stepNumber: '2',
                  icon: Icons.person_add_alt_1_outlined,
                  textWidget: const Text(
                    'Your friend\nplaces first order',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 10.5,
                      color: Color(0xFF374151),
                      height: 1.25,
                    ),
                  ),
                ),
              ),
              _buildArrow(),
              Expanded(
                child: _buildStep(
                  stepNumber: '3',
                  icon: Icons.local_offer_outlined,
                  textWidget: RichText(
                    textAlign: TextAlign.center,
                    text: TextSpan(
                      style: const TextStyle(
                        fontSize: 10.5,
                        color: Color(0xFF374151),
                        height: 1.25,
                      ),
                      children: [
                        const TextSpan(text: 'They get\n'),
                        TextSpan(
                          text: '\$${refereeDiscount.toInt()} OFF',
                          style: const TextStyle(
                            color: Color(0xFF7B1113),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              _buildArrow(),
              Expanded(
                child: _buildStep(
                  stepNumber: '4',
                  icon: Icons.card_giftcard_outlined,
                  textWidget: RichText(
                    textAlign: TextAlign.center,
                    text: TextSpan(
                      style: const TextStyle(
                        fontSize: 10.5,
                        color: Color(0xFF374151),
                        height: 1.25,
                      ),
                      children: [
                        const TextSpan(text: 'You get\n'),
                        TextSpan(
                          text: '\$${referrerReward.toInt()} Reward',
                          style: const TextStyle(
                            color: Color(0xFF7B1113),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStep({
    required String stepNumber,
    required IconData icon,
    required Widget textWidget,
  }) {
    return Column(
      children: [
        Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0xFFFDE8E8),
              ),
              child: Icon(icon, color: const Color(0xFF7B1113), size: 21),
            ),
            Positioned(
              left: -2,
              bottom: -2,
              child: Container(
                width: 15,
                height: 15,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0xFF7B1113),
                ),
                alignment: Alignment.center,
                child: Text(
                  stepNumber,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        textWidget,
      ],
    );
  }

  Widget _buildArrow() {
    return const Padding(
      padding: EdgeInsets.only(top: 14),
      child: Icon(
        Icons.chevron_right,
        size: 16,
        color: Color(0xFFD1D5DB),
      ),
    );
  }
}
