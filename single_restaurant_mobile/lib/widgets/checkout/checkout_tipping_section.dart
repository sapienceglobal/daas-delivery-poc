import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/checkout_provider.dart';
import 'package:single_restaurant_mobile/utils/formatters.dart';

class CheckoutTippingSection extends StatelessWidget {
  final CheckoutProvider checkout;
  final CartProvider cart;
  final Map<String, dynamic>? restaurant;

  const CheckoutTippingSection({
    super.key,
    required this.checkout,
    required this.cart,
    this.restaurant,
  });

  @override
  Widget build(BuildContext context) {
    final subtotal = cart.subtotal;
    final List<int> tipPercentages = [10, 15, 20];

    return Row(
      children: [
        ...tipPercentages.map((percent) {
          final tipAmount = (subtotal * percent) / 100;
          final isSelected = checkout.tip == tipAmount;
          return Expanded(
            child: GestureDetector(
              onTap: () => checkout.setTip(tipAmount),
              child: Container(
                margin: const EdgeInsets.only(right: 8),
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFF7A0B10) : Colors.white,
                  border: Border.all(
                    color: isSelected ? const Color(0xFF7A0B10) : Colors.grey.shade300,
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: [
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        '$percent%',
                        style: TextStyle(
                          color: isSelected ? Colors.white : Colors.black87,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        Formatters.formatCurrency(tipAmount, restaurant?['currency']),
                        style: TextStyle(
                          color: isSelected ? Colors.white70 : Colors.grey.shade600,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
        Expanded(
          child: GestureDetector(
            onTap: () => checkout.setTip(0),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: checkout.tip == 0.0 ? const Color(0xFF7A0B10) : Colors.white,
                border: Border.all(
                  color: checkout.tip == 0.0 ? const Color(0xFF7A0B10) : Colors.grey.shade300,
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      'None',
                      style: TextStyle(
                        color: checkout.tip == 0.0 ? Colors.white : Colors.black87,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      Formatters.formatCurrency(0, restaurant?['currency']),
                      style: TextStyle(
                        color: checkout.tip == 0.0 ? Colors.white70 : Colors.grey.shade600,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
