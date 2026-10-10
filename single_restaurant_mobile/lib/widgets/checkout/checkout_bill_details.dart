import 'package:flutter/material.dart';
import 'package:just_the_tooltip/just_the_tooltip.dart';
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
