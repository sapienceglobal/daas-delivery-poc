import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/checkout_provider.dart';

class CartDeliveryToggle extends StatelessWidget {
  final CheckoutProvider checkout;
  final CartProvider cart;

  const CartDeliveryToggle({
    super.key,
    required this.checkout,
    required this.cart,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFF4ECE6),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Row(
        children: [
          // Delivery Tab
          Expanded(
            child: GestureDetector(
              onTap: () => checkout.setDelivery(true, cart),
              behavior: HitTestBehavior.opaque,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: checkout.isDelivery ? const Color(0xFF6B111C) : Colors.transparent,
                  borderRadius: BorderRadius.circular(26),
                  boxShadow: checkout.isDelivery
                      ? [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.12),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          )
                        ]
                      : null,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.delivery_dining,
                      color: checkout.isDelivery ? Colors.white : const Color(0xFF6B111C),
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        'Delivery',
                        style: TextStyle(
                          color: checkout.isDelivery ? Colors.white : const Color(0xFF262626),
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          // Pickup Tab
          Expanded(
            child: GestureDetector(
              onTap: () => checkout.setDelivery(false, cart),
              behavior: HitTestBehavior.opaque,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: !checkout.isDelivery ? const Color(0xFF6B111C) : Colors.transparent,
                  borderRadius: BorderRadius.circular(26),
                  boxShadow: !checkout.isDelivery
                      ? [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.12),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          )
                        ]
                      : null,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.storefront,
                      color: !checkout.isDelivery ? Colors.white : const Color(0xFF6B111C),
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        'Pickup',
                        style: TextStyle(
                          color: !checkout.isDelivery ? Colors.white : const Color(0xFF262626),
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
