import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/utils/formatters.dart';

class TrackOrderDetailsCard extends StatelessWidget {
  final Map<String, dynamic> order;

  const TrackOrderDetailsCard({
    super.key,
    required this.order,
  });

  @override
  Widget build(BuildContext context) {
    final items = order['items'] as List?;
    final currency = Provider.of<RestaurantProvider>(context, listen: false).restaurant?['currency'];
    final taxType = Provider.of<RestaurantProvider>(context, listen: false).restaurant?['taxType'] ?? 'Taxes & Charges';

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Order Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 16),
          if (items != null)
            for (var item in items) ...[
              _buildItemRow(
                item['image'],
                item['name'] ?? 'Item',
                item['quantity'] ?? 1,
                Formatters.formatCurrency((item['price'] ?? 0).toDouble(), currency),
              ),
              const SizedBox(height: 12),
            ],
          const SizedBox(height: 4),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Flexible(
                child: Text(
                  'View Full Details',
                  style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 13),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              SizedBox(width: 4),
              Icon(Icons.chevron_right, color: AppColors.secondary, size: 16),
            ],
          ),
          const Divider(height: 32),
          _buildPriceRow('Subtotal', Formatters.formatCurrency((order['subtotal'] ?? 0).toDouble(), currency)),
          const SizedBox(height: 8),
          _buildPriceRow('Delivery Fee', Formatters.formatCurrency((order['deliveryFee'] ?? 0).toDouble(), currency)),
          const SizedBox(height: 8),
          _buildPriceRow(taxType, Formatters.formatCurrency((order['tax'] ?? 0).toDouble(), currency)),
          if ((order['discount'] ?? 0) > 0) ...[
            const SizedBox(height: 8),
            _buildPriceRow('Discount', '-${Formatters.formatCurrency((order['discount']).toDouble(), currency)}', isDiscount: true),
          ],
          if ((order['refundAmount'] ?? 0) > 0) ...[
            const SizedBox(height: 8),
            _buildPriceRow('Refunded', '-${Formatters.formatCurrency((order['refundAmount']).toDouble(), currency)}', isDiscount: true),
          ],
          const SizedBox(height: 16),
          const Divider(height: 1, color: Colors.transparent),
          Container(
            margin: const EdgeInsets.symmetric(vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Flexible(
                  child: Text(
                    'Total Amount',
                    style: TextStyle(fontWeight: FontWeight.bold),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  Formatters.formatCurrency((order['total'] ?? 0).toDouble(), currency),
                  style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.secondary, fontSize: 18),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildItemRow(String? img, String name, int qty, String price) {
    final imagePath = img ?? 'assets/images/branded/lassi-lounge/categories/appetizers.jpg';
    return Row(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: imagePath.startsWith('http')
              ? CachedNetworkImage(
                  imageUrl: imagePath,
                  width: 36,
                  height: 36,
                  fit: BoxFit.cover,
                  errorWidget: (context, url, error) => Image.asset(
                    'assets/images/branded/lassi-lounge/categories/appetizers.jpg',
                    width: 36,
                    height: 36,
                    fit: BoxFit.cover,
                  ),
                )
              : Image.asset(imagePath, width: 36, height: 36, fit: BoxFit.cover),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            name,
            style: const TextStyle(fontWeight: FontWeight.w500),
            overflow: TextOverflow.ellipsis,
          ),
        ),
        const SizedBox(width: 8),
        Text('x $qty', style: const TextStyle(color: Colors.grey)),
        const SizedBox(width: 16),
        Text(price, style: const TextStyle(fontWeight: FontWeight.w500)),
      ],
    );
  }

  Widget _buildPriceRow(String label, String value, {bool isDiscount = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Flexible(
          child: Text(
            label,
            style: TextStyle(color: isDiscount ? Colors.green : Colors.black87),
            overflow: TextOverflow.ellipsis,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          value,
          style: TextStyle(
            color: isDiscount ? Colors.green : Colors.black,
            fontWeight: isDiscount ? FontWeight.bold : FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
