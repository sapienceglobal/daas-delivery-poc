import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/utils/time_utils.dart';

class TrackOrderHeader extends StatelessWidget {
  final Map<String, dynamic> order;
  final bool isRefunded;

  const TrackOrderHeader({
    super.key,
    required this.order,
    required this.isRefunded,
  });

  @override
  Widget build(BuildContext context) {
    final items = order['items'] as List?;
    final imagePath = (items != null && items.isNotEmpty && items[0]['image'] != null)
        ? items[0]['image']
        : 'assets/images/branded/lassi-lounge/categories/appetizers.jpg';

    final status = order['status'] as String;
    final displayStatus = isRefunded ? 'REFUNDED' : status.replaceAll('_', ' ').toUpperCase();

    return Container(
      margin: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: imagePath.toString().startsWith('http')
                ? CachedNetworkImage(
                    imageUrl: imagePath,
                    width: 80,
                    height: 80,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => const CircularProgressIndicator(),
                    errorWidget: (context, url, error) => Image.asset(
                      'assets/images/branded/lassi-lounge/categories/appetizers.jpg',
                      width: 80,
                      height: 80,
                      fit: BoxFit.cover,
                    ),
                  )
                : Image.asset(
                    imagePath,
                    width: 80,
                    height: 80,
                    fit: BoxFit.cover,
                  ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        'Order #${order['orderNumber'] ?? order['_id'].toString().substring(0, 6)}',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.orange.shade100,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        displayStatus,
                        style: TextStyle(
                          color: isRefunded || status == 'cancelled'
                              ? Colors.red.shade700
                              : Colors.deepOrange,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  _formatDate(context, order['createdAt']),
                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                ),
                const SizedBox(height: 8),
                if (order['orderType'] == 'delivery' &&
                    (status == 'on_the_way' || status == 'picked_up' || status == 'out_for_delivery')) ...[
                  const Row(
                    children: [
                      Icon(Icons.moped, color: AppColors.secondary, size: 16),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Your order is on the way',
                          style: TextStyle(
                            color: AppColors.secondary,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                  Padding(
                    padding: const EdgeInsets.only(left: 24.0, top: 2),
                    child: Text(
                      order['estimatedDelivery'] ?? 'Arriving soon',
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ),
                ] else if (order['orderType'] != 'delivery' &&
                    (status == 'picked_up' || status == 'delivered' || status == 'completed')) ...[
                  const Row(
                    children: [
                      Icon(Icons.check_circle, color: Colors.green, size: 16),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Order Collected',
                          style: TextStyle(
                            color: Colors.green,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                ] else if (status == 'preparing') ...[
                  const Row(
                    children: [
                      Icon(Icons.soup_kitchen, color: AppColors.secondary, size: 16),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Your order is being prepared',
                          style: TextStyle(
                            color: AppColors.secondary,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                ]
              ],
            ),
          )
        ],
      ),
    );
  }

  String _formatDate(BuildContext context, String? isoString) {
    if (isoString == null) return '';
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
