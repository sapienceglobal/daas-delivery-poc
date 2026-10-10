import 'package:flutter/material.dart';

class TrackOrderTerminalNotice extends StatelessWidget {
  final Map<String, dynamic> order;
  final bool isRefunded;

  const TrackOrderTerminalNotice({
    super.key,
    required this.order,
    required this.isRefunded,
  });

  @override
  Widget build(BuildContext context) {
    final status = order['status']?.toString();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.red.shade100),
      ),
      child: Row(
        children: [
          Icon(
            isRefunded ? Icons.assignment_return_outlined : Icons.cancel_outlined,
            color: Colors.red.shade700,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isRefunded
                      ? 'Order Refunded'
                      : status == 'failed'
                          ? 'Order Failed'
                          : 'Order Cancelled',
                  style: TextStyle(color: Colors.red.shade700, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 2),
                Text(
                  isRefunded
                      ? 'The payment has been refunded back to the original payment source.'
                      : 'This order will not be delivered. Refund details will appear here once processed.',
                  style: const TextStyle(color: Colors.black54, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
