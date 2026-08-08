import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/screens/track_order_screen.dart';
import 'package:single_restaurant_mobile/utils/formatters.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';

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
    
    // Background color inspired by the image (warm beige)
    final bgColor = const Color(0xFFFDF8F3);
    final borderColor = const Color(0xFFEBE0D3);

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
          )
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
                _buildImage(status, isActive),
                const SizedBox(width: 16),
                Expanded(child: _buildOrderDetails(status, displayStatus, isDelivery, isRefunded)),
              ],
            ),
          ),
          if (isActive) _buildLiveTracking(status, isDelivery),
          _buildActionAndFooter(context, status),
        ],
      ),
    );
  }

  Widget _buildImage(String status, bool isActive) {
    final items = order['items'] as List?;
    final imagePath = (items != null && items.isNotEmpty && items[0]['image'] != null)
        ? items[0]['image']
        : 'assets/images/branded/lassi-lounge/categories/appetizers.jpg';
        
    return Stack(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: imagePath.startsWith('http') 
              ? Image.network(imagePath, width: 100, height: 100, fit: BoxFit.cover, errorBuilder: (c, e, s) => Image.asset('assets/images/branded/lassi-lounge/categories/appetizers.jpg', width: 100, height: 100, fit: BoxFit.cover))
              : Image.asset(imagePath, width: 100, height: 100, fit: BoxFit.cover),
        ),
        if (isActive)
          Positioned(
            top: 8,
            left: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.red.shade700,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Row(
                children: [
                  Icon(Icons.circle, color: Colors.white, size: 8),
                  SizedBox(width: 4),
                  Text('LIVE', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildOrderDetails(String status, String displayStatus, bool isDelivery, bool isRefunded) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                'Order #${order['orderNumber'] ?? order['_id']?.toString().substring(0, 6) ?? '...'}',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black87),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Row(
              children: [
                _buildStatusBadge(displayStatus),
                const SizedBox(width: 2),
                const Icon(Icons.chevron_right, color: Colors.black87, size: 18),
              ],
            )
          ],
        ),
        const SizedBox(height: 6),
        Text(
          _formatDate(order['createdAt'] ?? ''),
          style: TextStyle(color: Colors.grey.shade600, fontSize: 13, fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 12),
        if (status != 'delivered' && status != 'cancelled' && !isRefunded) ...[
          Row(
            children: [
              Icon(isDelivery ? Icons.moped : Icons.shopping_bag_outlined, color: AppColors.secondary, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  _getStatusText(status, isDelivery),
                  style: const TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 14),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.only(left: 26.0, top: 4),
            child: Text(
              order['estimatedDelivery'] ?? 'Arriving soon',
              style: TextStyle(color: Colors.grey.shade600, fontSize: 12, fontWeight: FontWeight.w500),
            ),
          ),
        ] else if (status == 'delivered') ...[
          Row(
            children: [
              const Icon(Icons.check_circle_outline, color: Colors.green, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text('Delivered on ${_formatDate(order['deliveredAt'] ?? order['createdAt'])}', style: TextStyle(color: Colors.grey.shade600, fontSize: 13, fontWeight: FontWeight.w500)),
              ),
            ],
          ),
        ] else if (status == 'cancelled' || isRefunded) ...[
          Row(
            children: [
              const Icon(Icons.cancel_outlined, color: Colors.red, size: 18),
              const SizedBox(width: 8),
              Text(isRefunded ? 'Order has been refunded' : 'Order was cancelled',
                style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 14)),
            ],
          ),
          Padding(
            padding: const EdgeInsets.only(left: 26.0, top: 4),
            child: Text(
              _formatDate(order['cancelledAt'] ?? order['createdAt']),
              style: TextStyle(color: Colors.grey.shade600, fontSize: 12, fontWeight: FontWeight.w500),
            ),
          ),
        ]
      ],
    );
  }

  String _getStatusText(String status, bool isDelivery) {
    if (status == 'pending') return 'Waiting for confirmation';
    if (status == 'accepted') return 'Order is confirmed';
    if (status == 'preparing') return 'Food is being prepared';
    if (status == 'ready' || status == 'ready_for_pickup') return isDelivery ? 'Waiting for driver' : 'Ready for pickup';
    if (status == 'out_for_delivery' || status == 'picked_up' || status == 'on_the_way') return 'Your order is on the way';
    return status.replaceAll('_', ' ').toUpperCase();
  }

  Widget _buildLiveTracking(String status, bool isDelivery) {
    final statusRank = isDelivery
      ? {'pending': 0, 'accepted': 1, 'preparing': 2, 'ready': 3, 'ready_for_pickup': 3, 'picked_up': 4, 'on_the_way': 4, 'out_for_delivery': 4, 'delivered': 5}
      : {'pending': 0, 'accepted': 1, 'preparing': 2, 'ready': 3, 'ready_for_pickup': 3, 'delivered': 4};

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

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 12.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: List.generate(steps.length * 2 - 1, (i) {
          if (i % 2 != 0) {
            // Connector line
            final index = i ~/ 2;
            return Expanded(
              child: Container(
                margin: const EdgeInsets.only(top: 14),
                height: 2,
                color: currentRank > index ? AppColors.secondary : Colors.grey.shade300,
              ),
            );
          }
          
          // Step Icon and Label
          final index = i ~/ 2;
          final isCompleted = currentRank >= index;
          
          return SizedBox(
            width: isDelivery ? 50 : 60, // Fixed width for each step's content
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: isCompleted ? AppColors.secondary : Colors.grey.shade300,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(steps[index]['icon'] as IconData, color: isCompleted ? Colors.white : Colors.grey.shade600, size: 14),
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
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bgColor;
    Color textColor;
    String text;

    if (status == 'pending' || status == 'accepted' || status == 'preparing' || status == 'ready' || status == 'ready_for_pickup') {
      bgColor = const Color(0xFFFDF0ED);
      textColor = AppColors.secondary;
      text = 'IN PROGRESS';
    } else if (status == 'out_for_delivery' || status == 'picked_up' || status == 'on_the_way') {
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
      child: Text(text, style: TextStyle(color: textColor, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.5)),
    );
  }

  Widget _buildActionAndFooter(BuildContext context, String status) {
    final isActive = status != 'delivered' && status != 'cancelled';
    
    return Column(
      children: [
        if (isActive)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => TrackOrderScreen(orderId: order['_id']),
                    ),
                  );
                },
                icon: const Icon(Icons.location_on_outlined, color: AppColors.secondary, size: 20),
                label: const Text('TRACK ORDER', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 1.0)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.secondary, width: 1.2),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  backgroundColor: Colors.white,
                ),
              ),
            ),
          ),
        if (isActive) const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.only(left: 16, right: 16, top: 12, bottom: 16),
          decoration: BoxDecoration(
            border: Border(top: BorderSide(color: Colors.black.withOpacity(0.05))),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.shopping_bag_outlined, color: AppColors.secondary, size: 18),
                  const SizedBox(width: 6),
                  Text('${order['items']?.length ?? 0} Items', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.black87)),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 10.0),
                    child: Text('•', style: TextStyle(color: Colors.grey, fontSize: 18)),
                  ),
                  Text(
                    Formatters.formatCurrency((order['total'] ?? 0.0).toDouble(), Provider.of<RestaurantProvider>(context, listen: false).restaurant?['currency']),
                    style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black87, fontSize: 15),
                  ),
                ],
              ),
              GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => TrackOrderScreen(orderId: order['_id']),
                    ),
                  );
                },
                child: const Row(
                  children: [
                    Text('View Details', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.black87)),
                    SizedBox(width: 2),
                    Icon(Icons.chevron_right, size: 20, color: Colors.black87),
                  ],
                ),
              )
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
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: const Text('Cancel Order', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              ),
            ),
          )
      ],
    );
  }

  String _formatDate(String isoString) {
    try {
      final date = DateTime.parse(isoString);
      final monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      final month = monthNames[date.month - 1];
      final hour = date.hour > 12 ? date.hour - 12 : (date.hour == 0 ? 12 : date.hour);
      final amPm = date.hour >= 12 ? 'PM' : 'AM';
      final min = date.minute.toString().padLeft(2, '0');
      return '$month ${date.day}, ${date.year} • $hour:$min $amPm';
    } catch (e) {
      return isoString;
    }
  }
}
