import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/utils/time_utils.dart';

class TrackOrderEstimatedTime extends StatelessWidget {
  final Map<String, dynamic> order;

  const TrackOrderEstimatedTime({
    super.key,
    required this.order,
  });

  @override
  Widget build(BuildContext context) {
    final pickupTime = order['pickupTime'];
    final deliveryTime = order['deliveryTime'];

    if (pickupTime == null && deliveryTime == null) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFDF7F3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.orange.shade100),
      ),
      child: Row(
        children: [
          const Icon(Icons.timer_outlined, color: AppColors.secondary, size: 24),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Estimated Delivery Time',
                  style: TextStyle(color: Colors.grey, fontSize: 12),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  deliveryTime != null ? _formatTime(context, deliveryTime) : 'Calculating...',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.secondary),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.divider),
              ),
              child: const FittedBox(
                fit: BoxFit.scaleDown,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('View Details', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    SizedBox(width: 4),
                    Icon(Icons.keyboard_arrow_down, size: 16),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(BuildContext context, String isoString) {
    try {
      final date = DateTime.parse(isoString);
      final restaurantProvider = Provider.of<RestaurantProvider>(context, listen: false);
      final tz = restaurantProvider.restaurant?['timezone'];
      return TimeUtils.formatDateTimeWithTz(date, tz).split('  ').last;
    } catch (e) {
      return isoString;
    }
  }
}
