import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';

class OrderCardLiveTracking extends StatelessWidget {
  final String status;
  final bool isDelivery;

  const OrderCardLiveTracking({
    super.key,
    required this.status,
    required this.isDelivery,
  });

  @override
  Widget build(BuildContext context) {
    final statusRank = isDelivery
        ? {
            'pending': 0,
            'accepted': 1,
            'preparing': 2,
            'ready': 3,
            'ready_for_pickup': 3,
            'picked_up': 4,
            'on_the_way': 4,
            'out_for_delivery': 4,
            'delivered': 5,
          }
        : {
            'pending': 0,
            'accepted': 1,
            'preparing': 2,
            'ready': 3,
            'ready_for_pickup': 3,
            'delivered': 4,
          };

    final currentRank = statusRank[status] ?? 0;

    final steps = isDelivery
        ? [
            {'label': 'Confirmed', 'icon': Icons.receipt_long},
            {'label': 'Accepted', 'icon': Icons.check_circle_outline},
            {'label': 'Preparing', 'icon': Icons.soup_kitchen},
            {'label': 'Ready', 'icon': Icons.room_service},
            {'label': 'On The Way', 'icon': Icons.moped},
            {'label': 'Delivered', 'icon': Icons.home_outlined},
          ]
        : [
            {'label': 'Confirmed', 'icon': Icons.receipt_long},
            {'label': 'Accepted', 'icon': Icons.check_circle_outline},
            {'label': 'Preparing', 'icon': Icons.soup_kitchen},
            {'label': 'Ready', 'icon': Icons.room_service},
            {'label': 'Collected', 'icon': Icons.check_circle},
          ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 12.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: List.generate(steps.length * 2 - 1, (i) {
            if (i % 2 != 0) {
              final index = i ~/ 2;
              return Container(
                width: 24,
                margin: const EdgeInsets.only(top: 14),
                height: 2,
                color: currentRank > index ? AppColors.secondary : Colors.grey.shade300,
              );
            }

            final index = i ~/ 2;
            final isCompleted = currentRank >= index;

            return SizedBox(
              width: isDelivery ? 50 : 60,
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: isCompleted ? AppColors.secondary : Colors.grey.shade300,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      steps[index]['icon'] as IconData,
                      color: isCompleted ? Colors.white : Colors.grey.shade600,
                      size: 14,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    steps[index]['label'] as String,
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    style: TextStyle(
                      fontSize: 9,
                      color: isCompleted ? AppColors.secondary : Colors.grey.shade500,
                      fontWeight: isCompleted ? FontWeight.bold : FontWeight.w500,
                      height: 1.1,
                    ),
                  ),
                ],
              ),
            );
          }),
        ),
      ),
    );
  }
}
