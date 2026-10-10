import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/utils/formatters.dart';

class OrderCardFooter extends StatelessWidget {
  final Map<String, dynamic> order;
  final String status;
  final VoidCallback onTrackOrder;
  final VoidCallback? onCancelOrder;

  const OrderCardFooter({
    super.key,
    required this.order,
    required this.status,
    required this.onTrackOrder,
    this.onCancelOrder,
  });

  @override
  Widget build(BuildContext context) {
    final isActive = status != 'delivered' && status != 'cancelled';
    final currency = Provider.of<RestaurantProvider>(context, listen: false).restaurant?['currency'];

    return Column(
      children: [
        if (isActive)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: onTrackOrder,
                icon: const Icon(
                  Icons.location_on_outlined,
                  color: AppColors.secondary,
                  size: 20,
                ),
                label: const Text(
                  'TRACK ORDER',
                  style: TextStyle(
                    color: AppColors.secondary,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    letterSpacing: 1.0,
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(
                    color: AppColors.secondary,
                    width: 1.2,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  backgroundColor: Colors.white,
                ),
              ),
            ),
          ),
        if (isActive) const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.only(
            left: 16,
            right: 16,
            top: 12,
            bottom: 16,
          ),
          decoration: BoxDecoration(
            border: Border(
              top: BorderSide(color: Colors.black.withOpacity(0.05)),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.shopping_bag_outlined,
                        color: AppColors.secondary,
                        size: 18,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '${order['items']?.length ?? 0} Items',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 6.0),
                        child: Text('•', style: TextStyle(color: Colors.grey, fontSize: 16)),
                      ),
                      Text(
                        Formatters.formatCurrency(
                          (order['total'] ?? 0.0).toDouble(),
                          currency,
                        ),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                          fontSize: 15,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: onTrackOrder,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Text(
                      'View Details',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Colors.black87,
                      ),
                    ),
                    SizedBox(width: 2),
                    Icon(Icons.chevron_right, size: 20, color: Colors.black87),
                  ],
                ),
              ),
            ],
          ),
        ),
        if (status == 'pending' || status == 'accepted')
          Padding(
            padding: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
            child: SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: onCancelOrder,
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.red),
                  foregroundColor: Colors.red,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: const Text(
                  'Cancel Order',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
              ),
            ),
          ),
      ],
    );
  }
}
