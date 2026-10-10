import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/providers/order_provider.dart';
import 'package:single_restaurant_mobile/screens/orders_screen.dart';
import 'package:single_restaurant_mobile/theme/app_typography.dart';

class ProfileOrdersStatus extends StatelessWidget {
  final OrderProvider orderProvider;

  const ProfileOrdersStatus({
    super.key,
    required this.orderProvider,
  });

  @override
  Widget build(BuildContext context) {
    int active = 0;
    int delivered = 0;
    int cancelled = 0;
    int upcoming = 0;

    for (var order in orderProvider.orders) {
      final status = (order['status'] ?? '').toString().toLowerCase();
      if (status == 'delivered') {
        delivered++;
      } else if (status == 'cancelled') {
        cancelled++;
      } else if (status.contains('schedule') || status.contains('upcoming')) {
        upcoming++;
      } else if (status.isNotEmpty) {
        active++;
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                'My Orders',
                style: AppTypography.serifHeading(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF2C0F12),
                ),
              ),
            ),
            GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) =>
                        OrdersScreen(onBack: () => Navigator.pop(context)),
                  ),
                );
              },
              child: const Row(
                children: [
                  Text(
                    'View All Orders',
                    style: TextStyle(
                      color: Color(0xFF7A0B10),
                      fontWeight: FontWeight.bold,
                      fontSize: 12.5,
                    ),
                  ),
                  SizedBox(width: 3),
                  Icon(Icons.chevron_right, color: Color(0xFF7A0B10), size: 16),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildStatusCard(
                context,
                icon: Icons.receipt_long,
                count: active.toString(),
                label: 'On The Way',
                cardBg: const Color(0xFFFFF9E6),
                badgeBg: const Color(0xFFFEE8B7),
                iconColor: const Color(0xFFE5A024),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildStatusCard(
                context,
                icon: Icons.check_circle_outline,
                count: delivered.toString(),
                label: 'Delivered',
                cardBg: const Color(0xFFEEF8F1),
                badgeBg: const Color(0xFFD4F0DE),
                iconColor: const Color(0xFF22A355),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildStatusCard(
                context,
                icon: Icons.cancel_outlined,
                count: cancelled.toString(),
                label: 'Cancelled',
                cardBg: const Color(0xFFFDF0F0),
                badgeBg: const Color(0xFFFCD5D6),
                iconColor: const Color(0xFFD32F2F),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildStatusCard(
                context,
                icon: Icons.access_time,
                count: upcoming.toString(),
                label: 'Upcoming',
                cardBg: const Color(0xFFFFF7EC),
                badgeBg: const Color(0xFFFDE4CD),
                iconColor: const Color(0xFFE59828),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatusCard(
    BuildContext context, {
    required IconData icon,
    required String count,
    required String label,
    required Color cardBg,
    required Color badgeBg,
    required Color iconColor,
  }) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) =>
                OrdersScreen(onBack: () => Navigator.pop(context)),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(5),
              decoration: BoxDecoration(
                color: badgeBg,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor, size: 16),
            ),
            const SizedBox(height: 6),
            Text(
              count,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1E0C0E),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: Color(0xFF555555),
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
