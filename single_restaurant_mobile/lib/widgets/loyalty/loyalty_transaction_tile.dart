import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:single_restaurant_mobile/screens/track_order_screen.dart';

class LoyaltyTransactionTile extends StatelessWidget {
  final dynamic tx;

  const LoyaltyTransactionTile({
    super.key,
    required this.tx,
  });

  @override
  Widget build(BuildContext context) {
    final type = tx['type'] as String? ?? 'earned';
    final points = tx['points'] as int? ?? 0;
    final description = tx['description'] as String? ?? '';
    final createdAt = tx['createdAt'] != null
        ? DateTime.tryParse(tx['createdAt'].toString()) ?? DateTime.now()
        : DateTime.now();

    // Extract Order ID & Order Number if linked to an order
    String? orderId;
    String? orderNumber;
    final rawOrderId = tx['orderId'];
    if (rawOrderId != null) {
      if (rawOrderId is Map) {
        orderId = rawOrderId['_id']?.toString() ?? rawOrderId['id']?.toString();
        orderNumber = rawOrderId['orderNumber']?.toString();
      } else {
        final s = rawOrderId.toString().trim();
        if (s.isNotEmpty && s != 'null') {
          orderId = s;
        }
      }
    }

    final hasOrder = orderId != null && orderId.isNotEmpty;

    final isPositive =
        type == 'earned' || type == 'refunded' || type == 'adjustment_add';
    final amountColor =
        isPositive ? const Color(0xFF1fae64) : Colors.red.shade600;
    final amountPrefix = isPositive ? '+' : '-';

    IconData iconData;
    Color iconColor;
    Color iconBgColor;

    if (type == 'earned') {
      iconData = Icons.add_circle_outline;
      iconColor = const Color(0xFF1fae64);
      iconBgColor = const Color(0xFFE8F6ED);
    } else if (type == 'redeemed') {
      iconData = Icons.remove_circle_outline;
      iconColor = Colors.red.shade600;
      iconBgColor = Colors.red.shade50;
    } else {
      iconData = Icons.info_outline;
      iconColor = Colors.blue.shade600;
      iconBgColor = Colors.blue.shade50;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            if (orderId != null && orderId.isNotEmpty) {
              final targetOrderId = orderId;
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => TrackOrderScreen(orderId: targetOrderId),
                ),
              );
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('This transaction is not linked to a specific order.'),
                  duration: Duration(seconds: 2),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            }
          },
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: iconBgColor,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(iconData, color: iconColor, size: 24),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        description,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        orderNumber != null && orderNumber.isNotEmpty
                            ? 'Order #$orderNumber • ${DateFormat('MMM d, yyyy').format(createdAt)}'
                            : DateFormat('MMM d, yyyy • h:mm a').format(createdAt),
                        style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    '$amountPrefix$points',
                    style: TextStyle(
                      color: amountColor,
                      fontWeight: FontWeight.w900,
                      fontSize: 16,
                    ),
                  ),
                ),
                if (hasOrder) ...[
                  const SizedBox(width: 6),
                  Icon(
                    Icons.chevron_right,
                    color: Colors.grey.shade400,
                    size: 20,
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
