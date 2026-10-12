import 'package:flutter/material.dart';
import 'package:just_the_tooltip/just_the_tooltip.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/checkout_provider.dart';
import 'package:single_restaurant_mobile/providers/loyalty_provider.dart';
import 'package:single_restaurant_mobile/utils/formatters.dart';

class CheckoutBillDetails extends StatelessWidget {
  final CartProvider cart;
  final CheckoutProvider checkout;
  final LoyaltyProvider loyalty;
  final Map<String, dynamic>? restaurant;

  const CheckoutBillDetails({
    super.key,
    required this.cart,
    required this.checkout,
    required this.loyalty,
    this.restaurant,
  });

  @override
  Widget build(BuildContext context) {
    final subtotal = cart.subtotal;
    final deliveryFee = checkout.getDeliveryFee(cart, restaurant);
    final platformFee = checkout.getPlatformFee();
    final serviceFee = checkout.getServiceFee(cart, restaurant);
    final packagingFee = checkout.getPackagingFee(cart, restaurant);
    final tax = checkout.getTax(cart, restaurant);
    final couponDiscount = checkout.couponDiscount;

    final double maxRedeemable = checkout.getTotal(cart, restaurant);
    final double calculatedLoyalty = checkout.useLoyaltyPoints ? (loyalty.currentBalance / 100) : 0.0;
    final double loyaltyDiscount = calculatedLoyalty > maxRedeemable ? maxRedeemable : calculatedLoyalty;

    double total = maxRedeemable - loyaltyDiscount;
    if (total < 0) total = 0.0;

    return Container(
      decoration: const BoxDecoration(color: Colors.transparent),
      child: Column(
        children: [
          _buildBillRow('Subtotal (${cart.items.length} items)', subtotal, restaurant?['currency']),
          if (checkout.isDelivery)
            _buildBillRow(
              'Delivery Fee',
              deliveryFee,
              restaurant?['currency'],
              isInfo: true,
              tooltipMessage: 'Fee charged for delivery based on distance and local market conditions.',
            ),
          if (platformFee > 0)
            _buildBillRow(
              'Platform Fee',
              platformFee,
              restaurant?['currency'],
              isInfo: true,
              tooltipMessage: 'Fee to maintain the platform and operations.',
            ),
          if (serviceFee > 0)
            _buildBillRow(
              'Service Fee',
              serviceFee,
              restaurant?['currency'],
              isInfo: true,
              tooltipMessage: 'Fee for the restaurant service.',
            ),
          if (packagingFee > 0)
            _buildBillRow(
              'Packaging Fee',
              packagingFee,
              restaurant?['currency'],
              isInfo: true,
              tooltipMessage: 'Fee for safe packaging of your order.',
            ),
          _buildBillRow(
            restaurant?['taxType'] ?? 'Taxes',
            tax,
            restaurant?['currency'],
            isInfo: true,
            tooltipMessage: 'Estimated state and local sales taxes applied to your order.',
          ),
          if (checkout.tip > 0) _buildBillRow('Tip', checkout.tip, restaurant?['currency']),
          if (couponDiscount > 0)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 6.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        Icon(Icons.local_offer_outlined, color: Colors.green.shade700, size: 14),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            'Coupon Discount',
                            style: TextStyle(color: Colors.green.shade700, fontSize: 14),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '-${Formatters.formatCurrency(couponDiscount, restaurant?['currency'])}',
                    style: TextStyle(color: Colors.green.shade700, fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                ],
              ),
            ),
          if (loyaltyDiscount > 0)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 6.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        Icon(Icons.monetization_on, color: Colors.green.shade700, size: 14),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            'Loyalty Points Used',
                            style: TextStyle(color: Colors.green.shade700, fontSize: 14),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '-${Formatters.formatCurrency(loyaltyDiscount, restaurant?['currency'])}',
                    style: TextStyle(color: Colors.green.shade700, fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                ],
              ),
            ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8.0),
            child: Divider(height: 1, thickness: 1, color: Colors.grey),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Flexible(
                child: Text(
                  'Total Amount',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  Formatters.formatCurrency(total, restaurant?['currency']),
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF7A0B10)),
                ),
              ),
            ],
          ),

          // ── Lassi Lounge Rewards Points Earning Banner ──
          Builder(
            builder: (context) {
              final loyaltySettings = restaurant?['loyaltySettings'] as Map<String, dynamic>?;
              final bool loyaltyEnabled = loyaltySettings?['enabled'] != false;
              final num pointsPerDollar = loyaltySettings?['pointsPerDollar'] ?? 1;
              final int pointsToEarn = (loyaltyEnabled && total > 0)
                  ? (total * pointsPerDollar).floor()
                  : 0;

              if (pointsToEarn <= 0) return const SizedBox.shrink();

              final auth = Provider.of<AuthProvider>(context, listen: false);
              final bool isMember = loyalty.isLoyaltyMember || (auth.user?.isLoyaltyMember ?? false);

              if (isMember) {
                return Container(
                  margin: const EdgeInsets.only(top: 14),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFFFFBEB), Color(0xFFFEF3C7)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFFDE68A)),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFF59E0B).withValues(alpha: 0.08),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: const Color(0xFFFDE68A),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFD97706).withValues(alpha: 0.15),
                              blurRadius: 4,
                              offset: const Offset(0, 1),
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Icon(
                            Icons.stars_rounded,
                            color: Color(0xFFB45309),
                            size: 22,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Text(
                                  'REWARDS MEMBER',
                                  style: TextStyle(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.6,
                                    color: Color(0xFF92400E),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFDCFCE7),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: const Text(
                                    'ACTIVE',
                                    style: TextStyle(
                                      fontSize: 9.5,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFF15803D),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 3),
                            RichText(
                              text: TextSpan(
                                style: const TextStyle(
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF78350F),
                                  height: 1.25,
                                ),
                                children: [
                                  const TextSpan(text: 'Complete this order & earn '),
                                  TextSpan(
                                    text: '$pointsToEarn Points!',
                                    style: const TextStyle(
                                      color: Color(0xFFB45309),
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 3),
                            const Text(
                              'Points will be credited to your account once your order is delivered.',
                              style: TextStyle(
                                fontSize: 11,
                                color: Color(0xFF92400E),
                                height: 1.3,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              } else {
                return Container(
                  margin: const EdgeInsets.only(top: 14),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFDF8F3),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFF3E4D6)),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: const BoxDecoration(
                          color: Color(0xFFFDECEE),
                          shape: BoxShape.circle,
                        ),
                        child: const Center(
                          child: Icon(
                            Icons.card_giftcard_rounded,
                            color: Color(0xFF7A0B10),
                            size: 20,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'LASSI LOUNGE REWARDS',
                              style: TextStyle(
                                fontSize: 10.5,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.6,
                                color: Color(0xFF7A0B10),
                              ),
                            ),
                            const SizedBox(height: 3),
                            RichText(
                              text: TextSpan(
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF1E1E1E),
                                  height: 1.25,
                                ),
                                children: [
                                  const TextSpan(text: 'Join Rewards to earn '),
                                  TextSpan(
                                    text: '$pointsToEarn Points',
                                    style: const TextStyle(
                                      color: Color(0xFF7A0B10),
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                  const TextSpan(text: ' on this order!'),
                                ],
                              ),
                            ),
                            const SizedBox(height: 3),
                            const Text(
                              'Free to join. Redeem points for delicious rewards & discounts.',
                              style: TextStyle(
                                fontSize: 11,
                                color: Color(0xFF757575),
                                height: 1.3,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildBillRow(
    String title,
    double amount,
    String? currencySetting, {
    bool isInfo = false,
    String? tooltipMessage,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Row(
              children: [
                Flexible(
                  child: Text(
                    title,
                    style: const TextStyle(fontSize: 14, color: Colors.black87),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (isInfo) ...[
                  const SizedBox(width: 4),
                  JustTheTooltip(
                    content: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Text(
                        tooltipMessage ?? '',
                        style: const TextStyle(color: Colors.white, fontSize: 12),
                        softWrap: true,
                      ),
                    ),
                    backgroundColor: const Color(0xFF1A1A1A),
                    triggerMode: TooltipTriggerMode.tap,
                    tailLength: 6.0,
                    tailBaseWidth: 12.0,
                    margin: const EdgeInsets.symmetric(horizontal: 20),
                    borderRadius: BorderRadius.circular(8),
                    child: const Icon(Icons.info_outline, size: 14, color: Colors.grey),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              Formatters.formatCurrency(amount, currencySetting),
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black),
            ),
          ),
        ],
      ),
    );
  }
}
