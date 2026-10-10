import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/checkout_provider.dart';

class CartAddressSelector extends StatelessWidget {
  final CartProvider cart;
  final CheckoutProvider checkout;
  final Map<String, dynamic>? restaurant;
  final VoidCallback onChangeAddress;

  const CartAddressSelector({
    super.key,
    required this.cart,
    required this.checkout,
    this.restaurant,
    required this.onChangeAddress,
  });

  bool _isRestaurantClosed(Map<String, dynamic>? res) {
    if (res == null) return false;
    if (res['isClosed'] == true || res['isOpen'] == false) return true;
    final openStr = res['openTime']?.toString();
    final closeStr = res['closeTime']?.toString();
    if (openStr != null && closeStr != null) {
      try {
        final now = DateTime.now();
        final openParts = openStr.split(':');
        final closeParts = closeStr.split(':');
        final openMinutes = int.parse(openParts[0]) * 60 + int.parse(openParts[1]);
        final closeMinutes = int.parse(closeParts[0]) * 60 + int.parse(closeParts[1]);
        final currentMinutes = now.hour * 60 + now.minute;
        if (currentMinutes < openMinutes || currentMinutes >= closeMinutes) {
          return true;
        }
      } catch (_) {}
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    final activeRestaurant = restaurant ?? cart.restaurant;
    final isClosed = _isRestaurantClosed(activeRestaurant);

    final openTime = activeRestaurant?['openTime']?.toString() ?? '10:00';
    final closeTime = activeRestaurant?['closeTime']?.toString() ?? '22:00';
    final hoursText = 'Operating hours today: $openTime - $closeTime';

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      padding: const EdgeInsets.all(14),
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: const BoxDecoration(
              color: Color(0xFFFDE8E8),
              shape: BoxShape.circle,
            ),
            child: const Center(
              child: Icon(Icons.location_on, color: Color(0xFF6B111C), size: 20),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Delivering to',
                  style: TextStyle(
                    color: Color(0xFF8A807E),
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  checkout.addressVerified && checkout.addressLine1.isNotEmpty
                      ? '${checkout.addressLabel} - ${checkout.addressLine1}'
                      : 'Select a delivery address',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: Color(0xFF1E1E1E),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                if (isClosed)
                  const Text(
                    'Restaurant is closed',
                    style: TextStyle(
                      color: Color(0xFFB91C1C),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  )
                else if (checkout.quoteLoading)
                  const Text(
                    'Calculating delivery fee...',
                    style: TextStyle(color: Colors.grey, fontSize: 12),
                  )
                else if (checkout.quoteError != null)
                  Text(
                    checkout.quoteError!,
                    style: const TextStyle(
                      color: Colors.red,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  )
                else
                  const Text(
                    'Delivery Available',
                    style: TextStyle(
                      color: Color(0xFF15803D),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                const SizedBox(height: 3),
                Text(
                  hoursText,
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 11,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          GestureDetector(
            onTap: onChangeAddress,
            behavior: HitTestBehavior.opaque,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFF8B1E1E), width: 1.2),
              ),
              child: const Text(
                'Change',
                style: TextStyle(
                  color: Color(0xFF8B1E1E),
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
