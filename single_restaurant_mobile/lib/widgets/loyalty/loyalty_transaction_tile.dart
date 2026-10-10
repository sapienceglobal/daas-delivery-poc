import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

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
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      padding: const EdgeInsets.all(16),
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
                  DateFormat('MMM d, yyyy • h:mm a').format(createdAt),
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
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
        ],
      ),
    );
  }
}
