import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';

class TrackOrderProgressTracker extends StatelessWidget {
  final Map<String, dynamic> order;

  const TrackOrderProgressTracker({
    super.key,
    required this.order,
  });

  @override
  Widget build(BuildContext context) {
    final status = order['status'] as String;
    final isDelivery = order['orderType'] == 'delivery';

    final statusRank = isDelivery
        ? {
            'pending': 0,
            'accepted': 1,
            'preparing': 2,
            'ready': 3,
            'picked_up': 4,
            'out_for_delivery': 4,
            'delivered': 5,
            'completed': 5,
            'cancelled': -1,
          }
        : {
            'pending': 0,
            'accepted': 1,
            'preparing': 2,
            'ready': 3,
            'picked_up': 4,
            'delivered': 4,
            'completed': 4,
            'cancelled': -1,
          };

    final currentRank = statusRank[status] ?? 0;

    final steps = isDelivery
        ? [
            {'id': 'received', 'label': 'Order Received', 'desc': "We've received your order and payment.", 'icon': Icons.receipt_long},
            {'id': 'accepted', 'label': 'Order Accepted', 'desc': 'Restaurant has accepted your order.', 'icon': Icons.check_circle_outline},
            {'id': 'preparing', 'label': 'Preparing Your Order', 'desc': 'Our chef is preparing your delicious food.', 'icon': Icons.soup_kitchen},
            {'id': 'ready', 'label': 'Food Ready', 'desc': 'Your food has been prepared.', 'icon': Icons.room_service},
            {'id': 'transit', 'label': 'Out for Delivery', 'desc': 'Your order is on the way.', 'icon': Icons.moped},
            {'id': 'delivered', 'label': 'Delivered', 'desc': 'Enjoy your meal!', 'icon': Icons.home_outlined},
          ]
        : [
            {'id': 'received', 'label': 'Order Received', 'desc': "We've received your order and payment.", 'icon': Icons.receipt_long},
            {'id': 'accepted', 'label': 'Order Accepted', 'desc': 'Restaurant has accepted your order.', 'icon': Icons.check_circle_outline},
            {'id': 'preparing', 'label': 'Preparing Your Order', 'desc': 'Our chef is preparing your delicious food.', 'icon': Icons.soup_kitchen},
            {
              'id': 'ready',
              'label': order['orderType'] == 'dine_in' ? 'Served to Table' : 'Ready for Pickup',
              'desc': order['orderType'] == 'dine_in'
                  ? 'Your food is ready and being served.'
                  : 'Your order is ready to be collected.',
              'icon': Icons.room_service,
            },
            {
              'id': 'delivered',
              'label': order['orderType'] == 'dine_in' ? 'Completed' : 'Collected',
              'desc': 'We hope you enjoy your meal!',
              'icon': Icons.check_circle,
            },
          ];

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: List.generate(steps.length, (index) {
          final step = steps[index];
          bool isCompleted = currentRank >= index;
          bool isActive = currentRank == index;
          if (status == 'cancelled') {
            isCompleted = false;
            isActive = false;
          }

          return IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: isCompleted || isActive ? AppColors.secondary : Colors.grey.shade200,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        step['icon'] as IconData,
                        color: isCompleted || isActive ? Colors.white : Colors.grey,
                        size: 16,
                      ),
                    ),
                    if (index < steps.length - 1)
                      Expanded(
                        child: Container(
                          width: 2,
                          color: currentRank > index ? AppColors.secondary : Colors.grey.shade200,
                        ),
                      ),
                  ],
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 24.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          step['label'] as String,
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: isActive ? FontWeight.bold : FontWeight.w600,
                            color: isCompleted || isActive ? Colors.black87 : Colors.grey,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          step['desc'] as String,
                          style: TextStyle(
                            fontSize: 13,
                            color: isCompleted || isActive ? Colors.black54 : Colors.grey.shade400,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        }),
      ),
    );
  }
}
