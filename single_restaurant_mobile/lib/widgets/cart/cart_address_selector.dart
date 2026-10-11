import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/checkout_provider.dart';
import 'package:single_restaurant_mobile/utils/formatters.dart';

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

  String _getTodayHoursText(Map<String, dynamic>? res) {
    if (res == null) return '';
    final opHours = res['operatingHours'];
    if (opHours is Map) {
      const days = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ];
      final now = DateTime.now();
      final todayKey = days[(now.weekday - 1).clamp(0, 6)];
      final todayData = opHours[todayKey];
      if (todayData is Map) {
        if (todayData['isClosed'] == true) {
          return 'Operating hours today: Closed';
        }
        final open = todayData['open']?.toString();
        final close = todayData['close']?.toString();
        if (open != null && close != null && open.isNotEmpty && close.isNotEmpty) {
          return 'Operating hours today: ${_formatTimeStr(open, res['timeFormat']?.toString())} - ${_formatTimeStr(close, res['timeFormat']?.toString())}';
        }
      }
    }
    final openTime = res['openTime']?.toString();
    final closeTime = res['closeTime']?.toString();
    if (openTime != null && closeTime != null && openTime.isNotEmpty && closeTime.isNotEmpty) {
      return 'Operating hours today: ${_formatTimeStr(openTime, res['timeFormat']?.toString())} - ${_formatTimeStr(closeTime, res['timeFormat']?.toString())}';
    }
    return '';
  }

  static String _formatTimeStr(String timeStr, String? timeFormat) {
    final parts = timeStr.split(':');
    if (parts.isEmpty) return timeStr;
    final hour = int.tryParse(parts[0]) ?? 0;
    final minute = parts.length > 1 ? parts[1] : '00';
    if (timeFormat == '24 Hour') {
      return '${hour.toString().padLeft(2, '0')}:$minute';
    }
    final ampm = hour >= 12 ? 'PM' : 'AM';
    final h12 = hour % 12 == 0 ? 12 : hour % 12;
    return '$h12:$minute $ampm';
  }

  @override
  Widget build(BuildContext context) {
    final activeRestaurant = restaurant ?? cart.restaurant;
    final hoursText = _getTodayHoursText(activeRestaurant);

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
                if (checkout.quoteLoading)
                  const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(
                        width: 12,
                        height: 12,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Color(0xFF6B111C),
                        ),
                      ),
                      SizedBox(width: 6),
                      Text(
                        'Calculating delivery fee...',
                        style: TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                    ],
                  )
                else if (checkout.quoteError != null)
                  Text(
                    checkout.quoteError!,
                    style: const TextStyle(
                      color: Colors.red,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  )
                else if (checkout.deliveryQuote != null && checkout.addressVerified)
                  Text(
                    'Delivery Available (${Formatters.formatCurrency(checkout.getDeliveryFee(cart, activeRestaurant), activeRestaurant?['currency'])})',
                    style: const TextStyle(
                      color: Color(0xFF15803D),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  )
                else if (checkout.addressVerified)
                  const Text(
                    'Delivery Available',
                    style: TextStyle(
                      color: Color(0xFF15803D),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  )
                else
                  const Text(
                    'Select address to calculate delivery fee',
                    style: TextStyle(color: Color(0xFF8A807E), fontSize: 11),
                  ),
                if (hoursText.isNotEmpty) ...[
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
