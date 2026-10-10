import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/screens/item_detail_screen.dart';
import 'package:single_restaurant_mobile/screens/menu_screen.dart';
import 'package:single_restaurant_mobile/utils/cart_helper.dart';
import 'package:single_restaurant_mobile/utils/image_helper.dart';

class ItemDetailRecommendations extends StatelessWidget {
  final List<Map<String, dynamic>> recommended;
  final CartProvider cartProvider;
  final RestaurantProvider restaurantProvider;
  final VoidCallback? onViewAll;

  const ItemDetailRecommendations({
    super.key,
    required this.recommended,
    required this.cartProvider,
    required this.restaurantProvider,
    this.onViewAll,
  });

  Widget _buildSmallCartButton(
      BuildContext context, Map<String, dynamic> item) {
    final itemId = item['_id'] ?? item['id'];
    int qty = 0;
    for (var c in cartProvider.items) {
      if ((c['menuItemId'] ?? c['_id'] ?? c['id']) == itemId) {
        qty += (c['quantity'] ?? c['qty'] ?? 0) as int;
      }
    }

    if (qty > 0) {
      return Container(
        height: 24,
        decoration: BoxDecoration(
          color: Colors.red.shade900,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            GestureDetector(
              onTap: () {
                final idx = cartProvider.items.lastIndexWhere(
                    (c) => (c['menuItemId'] ?? c['_id'] ?? c['id']) == itemId);
                if (idx != -1) {
                  final current = cartProvider.items[idx]['quantity'] ?? 1;
                  cartProvider.updateQuantity(idx, current - 1);
                }
              },
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                child: Icon(Icons.remove, color: Colors.white, size: 12),
              ),
            ),
            Text('$qty',
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold)),
            GestureDetector(
              onTap: () {
                AddToCartHelper.handleAddToCart(
                    context, item, cartProvider, restaurantProvider);
              },
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                child: Icon(Icons.add, color: Colors.white, size: 12),
              ),
            ),
          ],
        ),
      );
    }

    return GestureDetector(
      onTap: () {
        AddToCartHelper.handleAddToCart(
            context, item, cartProvider, restaurantProvider);
      },
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
            color: Colors.red.shade900, borderRadius: BorderRadius.circular(6)),
        child: const Icon(Icons.add, color: Colors.white, size: 14),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 24),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Expanded(
              child: Text(
                'You May Also Like',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            GestureDetector(
              onTap: () {
                if (onViewAll != null) {
                  onViewAll!();
                } else {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const MenuScreen(),
                    ),
                  );
                }
              },
              behavior: HitTestBehavior.opaque,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'View All',
                      style: TextStyle(
                        color: Colors.red.shade900,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    Icon(
                      Icons.chevron_right,
                      color: Colors.red.shade900,
                      size: 16,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 220,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: recommended.length,
            itemBuilder: (context, index) {
              final rec = recommended[index];
              return GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ItemDetailScreen(item: rec),
                    ),
                  );
                },
                child: Container(
                  width: 160,
                  margin: const EdgeInsets.only(right: 16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Stack(
                        children: [
                          SizedBox(
                            height: 120,
                            width: double.infinity,
                            child: ImageHelper.buildDishImage(rec,
                                fit: BoxFit.cover),
                          ),
                          Positioned(
                            top: 8,
                            left: 8,
                            child: Container(
                              padding: const EdgeInsets.all(2),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Icon(
                                Icons.eco,
                                color: (rec['isVeg'] ?? true)
                                    ? Colors.green
                                    : Colors.red,
                                size: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              rec['name'] ?? '',
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 13),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '\$${((rec['price'] ?? 0.0) as num).toDouble().toStringAsFixed(2)}',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.red.shade900,
                                    fontSize: 13,
                                  ),
                                ),
                                _buildSmallCartButton(context, rec),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}
