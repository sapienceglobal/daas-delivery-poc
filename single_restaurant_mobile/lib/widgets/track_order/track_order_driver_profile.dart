import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';

class TrackOrderDriverProfile extends StatelessWidget {
  final Map<String, dynamic> order;

  const TrackOrderDriverProfile({
    super.key,
    required this.order,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Row(
        children: [
          order['courierImageUrl']?.toString().isNotEmpty == true
              ? ClipOval(
                  child: CachedNetworkImage(
                    imageUrl: order['courierImageUrl']!,
                    width: 56,
                    height: 56,
                    fit: BoxFit.cover,
                    errorWidget: (context, url, error) => CircleAvatar(
                      radius: 28,
                      backgroundColor: Colors.grey.shade200,
                      child: const Icon(Icons.person, color: Colors.grey, size: 30),
                    ),
                  ),
                )
              : CircleAvatar(
                  radius: 28,
                  backgroundColor: Colors.grey.shade200,
                  child: const Icon(Icons.person, color: Colors.grey, size: 30),
                ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  order['thirdPartyDeliveryName']?.toString().isNotEmpty == true
                      ? 'Driver Details • ${order['thirdPartyDeliveryName']}'
                      : 'Driver Details',
                  style: const TextStyle(color: Colors.grey, fontSize: 11),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        order['courierName']?.toString().isNotEmpty == true
                            ? order['courierName']
                            : 'Assigning rider...',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                if (order['courierVehicle']?.toString().isNotEmpty == true) ...[
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      const Icon(Icons.directions_car_outlined, color: Colors.grey, size: 14),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          order['courierVehicle']!,
                          style: const TextStyle(fontSize: 12, color: Colors.grey),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.phone_outlined, color: AppColors.secondary, size: 14),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        order['courierPhone']?.toString().isNotEmpty == true
                            ? order['courierPhone']
                            : 'Awaiting assignment',
                        style: const TextStyle(fontSize: 12),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          OutlinedButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.phone, color: AppColors.secondary, size: 16),
            label: const Text('Call', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold)),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: AppColors.secondary),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
          )
        ],
      ),
    );
  }
}
