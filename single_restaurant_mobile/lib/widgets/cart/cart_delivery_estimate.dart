import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/providers/checkout_provider.dart';

class CartDeliveryEstimate extends StatelessWidget {
  final CheckoutProvider checkout;

  const CartDeliveryEstimate({
    super.key,
    required this.checkout,
  });

  @override
  Widget build(BuildContext context) {
    String etaText = '45 mins';
    if (checkout.etaLoading) {
      etaText = 'Calculating...';
    } else if (checkout.etaData != null) {
      if (checkout.isDelivery) {
        if (checkout.etaData!['isOutOfRange'] == true) {
          etaText = 'Out of range';
        } else if (checkout.etaData!['deliveryTime'] != null) {
          etaText = '${checkout.etaData!['deliveryTime']} mins';
        }
      } else {
        if (checkout.etaData!['prepTime'] != null) {
          etaText = '${checkout.etaData!['prepTime']} mins';
        } else {
          etaText = '15-20 mins';
        }
      }
    }

    final isError = checkout.isDelivery && checkout.etaData?['isOutOfRange'] == true;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF9F7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF3ECE6), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Left Column: Estimated Delivery
          Expanded(
            child: Row(
              children: [
                const Icon(
                  Icons.access_time,
                  color: Color(0xFF8B1E1E),
                  size: 22,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        checkout.isDelivery ? 'Estimated Delivery' : 'Estimated Pickup',
                        style: TextStyle(
                          color: Colors.grey.shade700,
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        etaText,
                        style: TextStyle(
                          color: isError ? Colors.red : const Color(0xFF8B1E1E),
                          fontWeight: FontWeight.w900,
                          fontSize: 14,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: 1,
            height: 32,
            color: const Color(0xFFEFE6E0),
            margin: const EdgeInsets.symmetric(horizontal: 12),
          ),
          // Right Column: Fast & Hot Delivery
          Expanded(
            child: Row(
              children: [
                const Icon(
                  Icons.local_fire_department,
                  color: Color(0xFFE53935),
                  size: 22,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'Fast & Hot Delivery',
                        style: TextStyle(
                          color: Color(0xFF1F1F1F),
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Freshly prepared for you',
                        style: TextStyle(
                          color: Colors.grey.shade600,
                          fontSize: 10,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
