import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/screens/track_order_screen.dart';

class OrderCard extends StatelessWidget {
  final Map<String, dynamic> order;

  const OrderCard({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    final status = order['status'] as String;
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
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
                _buildImage(status),
                const SizedBox(width: 16),
                Expanded(child: _buildOrderDetails(status)),
              ],
            ),
          ),
          if (status == 'on_the_way') _buildLiveTracking(),
          _buildActionAndFooter(context, status),
        ],
      ),
    );
  }

  Widget _buildImage(String status) {
    final items = order['items'] as List?;
    final imagePath = (items != null && items.isNotEmpty && items[0]['image'] != null)
        ? items[0]['image']
        : 'assets/images/branded/lassi-lounge/categories/appetizers.jpg';
        
    return Stack(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: imagePath.startsWith('http') 
              ? Image.network(imagePath, width: 80, height: 80, fit: BoxFit.cover, errorBuilder: (c, e, s) => Image.asset('assets/images/branded/lassi-lounge/categories/appetizers.jpg', width: 80, height: 80, fit: BoxFit.cover))
              : Image.asset(imagePath, width: 80, height: 80, fit: BoxFit.cover),
        ),
        if (status == 'on_the_way')
          Positioned(
            top: 4,
            left: 4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.red,
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Row(
                children: [
                  Icon(Icons.circle, color: Colors.white, size: 8),
                  SizedBox(width: 4),
                  Text('LIVE', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildOrderDetails(String status) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                'Order #${order['orderNumber'] ?? order['_id']?.toString().substring(0, 6) ?? '...'}',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Row(
              children: [
                _buildStatusBadge(status),
                const SizedBox(width: 4),
                const Icon(Icons.chevron_right, color: Colors.grey, size: 16),
              ],
            )
          ],
        ),
        const SizedBox(height: 4),
        Text(
          _formatDate(order['createdAt'] ?? ''),
          style: const TextStyle(color: Colors.grey, fontSize: 12),
        ),
        const SizedBox(height: 8),
        if (status == 'on_the_way') ...[
          const Row(
            children: [
              Icon(Icons.moped, color: Colors.red, size: 16),
              SizedBox(width: 8),
              Text('Your order is on the way', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 13)),
            ],
          ),
          Padding(
            padding: const EdgeInsets.only(left: 24.0, top: 2),
            child: Text(
              order['estimatedDelivery'] ?? '',
              style: const TextStyle(color: Colors.grey, fontSize: 12),
            ),
          ),
        ] else if (status == 'delivered') ...[
          Row(
            children: [
              const Icon(Icons.check_circle_outline, color: Colors.green, size: 16),
              const SizedBox(width: 8),
              Text('Delivered on ${_formatDate(order['deliveredAt'] ?? order['createdAt'])}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 8),
          _buildItemImagesRow(),
        ] else if (status == 'cancelled') ...[
          Row(
            children: [
              const Icon(Icons.cancel_outlined, color: Colors.red, size: 16),
              const SizedBox(width: 8),
              const Text('Order was cancelled', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 13)),
            ],
          ),
          Padding(
            padding: const EdgeInsets.only(left: 24.0, top: 2),
            child: Text(
              _formatDate(order['cancelledAt'] ?? order['createdAt']),
              style: const TextStyle(color: Colors.grey, fontSize: 12),
            ),
          ),
        ]
      ],
    );
  }

  Widget _buildItemImagesRow() {
    final items = (order['items'] as List?) ?? [];
    if (items.isEmpty) return const SizedBox.shrink();
    
    final displayCount = items.length > 3 ? 3 : items.length;
    final extraCount = items.length > 3 ? items.length - 3 : 0;

    return Row(
      children: [
        for (var i = 0; i < displayCount; i++)
          Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: (items[i]['image']?.toString().startsWith('http') ?? false)
                  ? Image.network(items[i]['image'], width: 36, height: 36, fit: BoxFit.cover, errorBuilder: (c, e, s) => Image.asset('assets/images/branded/lassi-lounge/categories/appetizers.jpg', width: 36, height: 36, fit: BoxFit.cover))
                  : Image.asset('assets/images/branded/lassi-lounge/categories/appetizers.jpg', width: 36, height: 36, fit: BoxFit.cover),
            ),
          ),
        if (extraCount > 0)
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: Colors.grey.shade200,
              borderRadius: BorderRadius.circular(6),
            ),
            alignment: Alignment.center,
            child: Text('+$extraCount\nmore', textAlign: TextAlign.center, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
          )
      ],
    );
  }

  Widget _buildLiveTracking() {
    return Padding(
      padding: const EdgeInsets.only(left: 16.0, right: 16.0, bottom: 16.0),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildStepperNode(Icons.receipt_long, 'Confirmed', true),
              _buildStepperLine(true),
              _buildStepperNode(Icons.soup_kitchen, 'Preparing', true),
              _buildStepperLine(true),
              _buildStepperNode(Icons.moped, 'On The Way', true),
              _buildStepperLine(false),
              _buildStepperNode(Icons.home_outlined, 'Delivered', false),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStepperNode(IconData icon, String label, bool active) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: active ? AppColors.secondary : Colors.grey.shade200,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: active ? Colors.white : Colors.grey, size: 16),
        ),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(fontSize: 10, color: active ? AppColors.secondary : Colors.grey, fontWeight: active ? FontWeight.bold : FontWeight.normal)),
      ],
    );
  }

  Widget _buildStepperLine(bool active) {
    return Expanded(
      child: Container(
        height: 2,
        color: active ? AppColors.secondary : Colors.grey.shade300,
        margin: const EdgeInsets.only(bottom: 16), // offset for text
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bgColor;
    Color textColor;
    String text;

    switch (status) {
      case 'on_the_way':
        bgColor = Colors.orange.shade100;
        textColor = Colors.deepOrange;
        text = 'ON THE WAY';
        break;
      case 'delivered':
        bgColor = Colors.green.shade100;
        textColor = Colors.green.shade800;
        text = 'DELIVERED';
        break;
      case 'cancelled':
        bgColor = Colors.red.shade100;
        textColor = Colors.red;
        text = 'CANCELLED';
        break;
      default:
        bgColor = Colors.grey.shade200;
        textColor = Colors.black;
        text = status.toUpperCase();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(text, style: TextStyle(color: textColor, fontSize: 10, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildActionAndFooter(BuildContext context, String status) {
    return Column(
      children: [
        if (status == 'on_the_way')
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
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
                icon: const Icon(Icons.location_on_outlined, color: Colors.red, size: 18),
                label: const Text('TRACK ORDER', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.red),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ),
        const Divider(height: 24),
        Padding(
          padding: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.shopping_bag_outlined, color: Colors.brown, size: 16),
                  const SizedBox(width: 4),
                  Text('${order['items']?.length ?? 0} Items', style: const TextStyle(fontSize: 13)),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 8.0),
                    child: Text('•', style: TextStyle(color: Colors.grey)),
                  ),
                  Text(
                    '\$${(order['total'] ?? 0.0).toStringAsFixed(2)}', 
                    style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.red, fontSize: 14),
                  ),
                ],
              ),
              Row(
                children: [
                  if (status == 'delivered') ...[
                    ElevatedButton(
                      onPressed: () {},
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.secondary, // Dark red
                        foregroundColor: Colors.white,
                        minimumSize: const Size(0, 32),
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      ),
                      child: const Text('ORDER AGAIN', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(width: 12),
                  ],
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
                        Text('View Details', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.secondary)),
                        Icon(Icons.chevron_right, size: 16, color: AppColors.secondary),
                      ],
                    ),
                  )
                ],
              )
            ],
          ),
        )
      ],
    );
  }

  String _formatDate(String isoString) {
    // A simple formatter for mock data. E.g., "2025-05-21T12:45:00Z" -> "May 21, 2025 • 12:45 PM"
    // For production, use intl package
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
