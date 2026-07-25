import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:cached_network_image/cached_network_image.dart';

class CartItemCard extends StatelessWidget {
  final Map<String, dynamic> item;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;

  const CartItemCard({
    super.key,
    required this.item,
    required this.onIncrement,
    required this.onDecrement,
  });

  @override
  Widget build(BuildContext context) {
    final name = item['name'] ?? 'Unknown Item';
    final quantity = (item['quantity'] ?? item['qty'] ?? 1) as int;
    final lineTotal = (item['lineTotal'] ?? ((item['price'] ?? 0.0) * quantity)) as num;
    final imageUrl = item['image'];
    
    // Addons logic
    final addOns = item['addOns'] as List?;
    String addOnsText = '';
    if (addOns != null && addOns.isNotEmpty) {
      addOnsText = addOns.map((a) => a['name']).join(', ');
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: imageUrl != null && imageUrl.toString().startsWith('http')
                ? CachedNetworkImage(
                    imageUrl: imageUrl,
                    width: 70,
                    height: 70,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(color: Colors.grey.shade200, width: 70, height: 70),
                    errorWidget: (context, url, error) => Image.asset('assets/images/branded/lassi-lounge/categories/appetizers.jpg', width: 70, height: 70, fit: BoxFit.cover),
                  )
                : Image.asset('assets/images/branded/lassi-lounge/categories/appetizers.jpg', width: 70, height: 70, fit: BoxFit.cover),
          ),
          const SizedBox(width: 12),
          
          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
                if (addOnsText.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    addOnsText,
                    style: const TextStyle(color: Colors.grey, fontSize: 12),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: 12),
                Text(
                  '\$${lineTotal.toStringAsFixed(2)}',
                  style: const TextStyle(
                    color: Colors.red,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          
          // Quantity Selector
          Container(
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey.shade300),
            ),
            child: Row(
              children: [
                InkWell(
                  onTap: onDecrement,
                  child: const Padding(
                    padding: EdgeInsets.all(8.0),
                    child: Icon(Icons.remove, size: 16),
                  ),
                ),
                Text(
                  '$quantity',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                InkWell(
                  onTap: onIncrement,
                  child: const Padding(
                    padding: EdgeInsets.all(8.0),
                    child: Icon(Icons.add, size: 16),
                  ),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}
