import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/loyalty_provider.dart';
import 'package:single_restaurant_mobile/screens/loyalty_rewards_screen.dart';
import 'package:single_restaurant_mobile/widgets/home/home_fast_delivery_card.dart';
import 'package:single_restaurant_mobile/widgets/home/home_welcome_offer_card.dart';

class HomePromoCardsCarousel extends StatelessWidget {
  final Map<String, dynamic>? activeCoupon;

  const HomePromoCardsCarousel({
    super.key,
    this.activeCoupon,
  });

  @override
  Widget build(BuildContext context) {
    final coupon = activeCoupon ??
        const {
          'promoType': 'FIRST ORDER OFFER',
          'value': 20,
          'type': 'percentage',
          'code': 'WELCOME20',
          'description':
              'Enjoy 20% off on your very first order on our Website and App!',
        };

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          WelcomeOfferCard(coupon: coupon),
          const LoyaltyPromoCard(),
          const FastDeliveryCard(),
        ],
      ),
    );
  }
}

class LoyaltyPromoCard extends StatelessWidget {
  const LoyaltyPromoCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<LoyaltyProvider>(
      builder: (context, loyalty, _) {
        final isMember = loyalty.isLoyaltyMember;
        return GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const LoyaltyRewardsScreen(),
              ),
            );
          },
          child: Container(
            width: 220,
            height: 185,
            margin: const EdgeInsets.only(right: 10),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFAF3EC),
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(
                      Icons.workspace_premium,
                      color: Color(0xFF6E0D14),
                      size: 15,
                    ),
                    SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'LOYALTY REWARDS',
                        style: TextStyle(
                          color: Color(0xFF6E0D14),
                          fontWeight: FontWeight.w800,
                          fontSize: 10,
                          letterSpacing: 0.7,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              isMember
                                  ? 'You have\n${loyalty.currentBalance} Points\nAvailable'
                                  : 'Earn Points &\nGet Exclusive\nRewards',
                              style: const TextStyle(
                                color: Color(0xFF1B1B1B),
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                height: 1.2,
                              ),
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 15),
                            FittedBox(
                              fit: BoxFit.scaleDown,
                              alignment: Alignment.centerLeft,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 11,
                                  vertical: 5.5,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFC41E24),
                                  borderRadius: BorderRadius.circular(16),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFFC41E24).withValues(alpha: 0.25),
                                      blurRadius: 4,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      isMember ? 'VIEW REWARDS' : 'JOIN NOW',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 10,
                                        letterSpacing: 0.4,
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    const Icon(
                                      Icons.arrow_forward,
                                      color: Colors.white,
                                      size: 11,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 4),
                      SizedBox(
                        width: 86,
                        height: 98,
                        child: Image.asset(
                          'assets/images/branded/lassi-lounge/loyalty_gift_clean.png',
                          fit: BoxFit.contain,
                          errorBuilder: (context, error, stackTrace) =>
                              Image.asset(
                            'assets/images/branded/lassi-lounge/loyalty-gift.png',
                            fit: BoxFit.contain,
                            errorBuilder: (context, error, stackTrace) =>
                                const Icon(
                              Icons.card_giftcard,
                              size: 52,
                              color: Color(0xFFC78A22),
                            ),
                          ),
                        ),
                      ),
                    ],
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
