import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/providers/checkout_provider.dart';

class CheckoutFulfillmentEstimate extends StatelessWidget {
  final CheckoutProvider checkout;
  final VoidCallback onChange;

  const CheckoutFulfillmentEstimate({
    super.key,
    required this.checkout,
    required this.onChange,
  });

  @override
  Widget build(BuildContext context) {
    String etaText = '30-40 mins';
    if (checkout.etaLoading) {
      etaText = 'Calculating...';
    } else if (checkout.etaData != null) {
      if (checkout.isDelivery) {
        if (checkout.etaData!['isOutOfRange'] == true) {
          etaText = 'Out of range';
        } else if (checkout.etaData!['deliveryTime'] != null) {
          etaText = 'In ${checkout.etaData!['deliveryTime']} mins';
        }
      } else {
        if (checkout.etaData!['prepTime'] != null) {
          etaText = 'In ${checkout.etaData!['prepTime']} mins';
        } else {
          etaText = 'In 15-20 mins';
        }
      }
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          const Icon(Icons.access_time, color: Color(0xFF7A0B10)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  checkout.isDelivery ? 'Estimated Delivery Time' : 'Estimated Pickup Time',
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                ),
                const SizedBox(height: 4),
                Text(
                  etaText,
                  style: const TextStyle(
                    color: Color(0xFF7A0B10),
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),
          OutlinedButton(
            onPressed: onChange,
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFF7A0B10)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              minimumSize: const Size(0, 36),
            ),
            child: const Text(
              'Change',
              style: TextStyle(color: Color(0xFF7A0B10), fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}
