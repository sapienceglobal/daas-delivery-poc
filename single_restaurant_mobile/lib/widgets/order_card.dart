import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/screens/track_order_screen.dart';
import 'package:single_restaurant_mobile/utils/time_utils.dart';
import 'package:single_restaurant_mobile/widgets/orders/order_card_footer.dart';
import 'package:single_restaurant_mobile/widgets/orders/order_card_image.dart';
import 'package:single_restaurant_mobile/widgets/orders/order_card_live_tracking.dart';
import 'package:single_restaurant_mobile/widgets/orders/order_card_status_badge.dart';

class OrderCard extends StatelessWidget {
  final Map<String, dynamic> order;
  final VoidCallback? onCancelOrder;

  const OrderCard({super.key, required this.order, this.onCancelOrder});

  @override
  Widget build(BuildContext context) {
    final status = order['status'] as String;
    final paymentStatus = order['paymentStatus']?.toString().toLowerCase();
    final refundAmount = (order['refundAmount'] as num?)?.toDouble() ?? 0.0;
    final isRefunded = order['refunded'] == true || paymentStatus == 'refunded' || refundAmount > 0;
    final displayStatus = isRefunded ? 'refunded' : status;
    final isDelivery = order['orderType'] == 'delivery';
    final isActive = status != 'delivered' && status != 'cancelled' && !isRefunded;

    const bgColor = Color(0xFFFDF8F3);
    const borderColor = Color(0xFFEBE0D3);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                OrderCardImage(order: order, isActive: isActive),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildOrderDetails(
                    context,
                    status,
                    displayStatus,
                    isDelivery,
                    isRefunded,
                  ),
                ),
              ],
            ),
          ),
          if (isActive) OrderCardLiveTracking(status: status, isDelivery: isDelivery),
          OrderCardFooter(
            order: order,
            status: status,
            onTrackOrder: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => TrackOrderScreen(orderId: order['_id']),
                ),
              );
            },
            onCancelOrder: onCancelOrder,
          ),
        ],
      ),
    );
  }

  Widget _buildOrderDetails(
    BuildContext context,
    String status,
    String displayStatus,
    bool isDelivery,
    bool isRefunded,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                'Order #${order['orderNumber'] ?? order['_id']?.toString().substring(0, 6) ?? '...'}',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: Colors.black87,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 4),
            Flexible(
              child: FittedBox(
                fit: BoxFit.scaleDown,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    OrderCardStatusBadge(status: displayStatus),
                    const SizedBox(width: 2),
                    const Icon(
                      Icons.chevron_right,
                      color: Colors.black87,
                      size: 18,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          _formatDate(context, order['createdAt'] ?? ''),
          style: TextStyle(
            color: Colors.grey.shade600,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 12),
        if (status != 'delivered' && status != 'cancelled' && !isRefunded) ...[
          Row(
            children: [
              Icon(
                isDelivery ? Icons.moped : Icons.shopping_bag_outlined,
                color: AppColors.secondary,
                size: 18,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  _getStatusText(status, isDelivery),
                  style: const TextStyle(
                    color: AppColors.secondary,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.only(left: 26.0, top: 4),
            child: Text(
              order['estimatedDelivery'] ?? 'Arriving soon',
              style: TextStyle(
                color: Colors.grey.shade600,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ] else if (status == 'delivered') ...[
          Row(
            children: [
              const Icon(
                Icons.check_circle_outline,
                color: Colors.green,
                size: 18,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Delivered on ${_formatDate(context, order['deliveredAt'] ?? order['createdAt'])}',
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ] else if (status == 'cancelled' || isRefunded) ...[
          Row(
            children: [
              const Icon(Icons.cancel_outlined, color: Colors.red, size: 18),
              const SizedBox(width: 8),
              Text(
                isRefunded ? 'Order has been refunded' : 'Order was cancelled',
                style: const TextStyle(
                  color: Colors.red,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.only(left: 26.0, top: 4),
            child: Text(
              _formatDate(context, order['cancelledAt'] ?? order['createdAt']),
              style: TextStyle(
                color: Colors.grey.shade600,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ],
    );
  }

  String _getStatusText(String status, bool isDelivery) {
    if (status == 'pending') return 'Waiting for confirmation';
    if (status == 'accepted') return 'Order is confirmed';
    if (status == 'preparing') return 'Food is being prepared';
    if (status == 'ready' || status == 'ready_for_pickup') {
      return isDelivery ? 'Waiting for driver' : 'Ready for pickup';
    }
    if (status == 'out_for_delivery' || status == 'picked_up' || status == 'on_the_way') {
      return 'Your order is on the way';
    }
    return status.replaceAll('_', ' ').toUpperCase();
  }

  String _formatDate(BuildContext context, String isoString) {
    try {
      final date = DateTime.parse(isoString);
      final restaurantProvider = Provider.of<RestaurantProvider>(context, listen: false);
      final tz = restaurantProvider.restaurant?['timezone'];
      return TimeUtils.formatDateTimeWithTz(date, tz);
    } catch (e) {
      return isoString;
    }
  }
}
