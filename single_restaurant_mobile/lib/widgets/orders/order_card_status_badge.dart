import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';

class OrderCardStatusBadge extends StatelessWidget {
  final String status;

  const OrderCardStatusBadge({
    super.key,
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    Color bgColor;
    Color textColor;
    String text;

    if (status == 'pending' ||
        status == 'accepted' ||
        status == 'preparing' ||
        status == 'ready' ||
        status == 'ready_for_pickup') {
      bgColor = const Color(0xFFFDF0ED);
      textColor = AppColors.secondary;
      text = 'IN PROGRESS';
    } else if (status == 'out_for_delivery' ||
        status == 'picked_up' ||
        status == 'on_the_way') {
      bgColor = const Color(0xFFFDF0ED);
      textColor = AppColors.secondary;
      text = 'ON THE WAY';
    } else if (status == 'delivered') {
      bgColor = Colors.green.shade50;
      textColor = Colors.green.shade700;
      text = 'DELIVERED';
    } else if (status == 'refunded') {
      bgColor = Colors.red.shade50;
      textColor = Colors.red;
      text = 'REFUNDED';
    } else if (status == 'cancelled') {
      bgColor = Colors.red.shade50;
      textColor = Colors.red;
      text = 'CANCELLED';
    } else {
      bgColor = Colors.grey.shade100;
      textColor = Colors.black87;
      text = status.toUpperCase();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: textColor,
          fontSize: 10,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
