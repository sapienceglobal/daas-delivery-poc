import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/screens/item_detail_screen.dart';
import 'package:single_restaurant_mobile/screens/menu_screen.dart';
import 'package:single_restaurant_mobile/utils/cart_helper.dart';
import 'package:single_restaurant_mobile/utils/image_helper.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';

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

  Widget _buildCartAction(BuildContext context, Map<String, dynamic> item) {
    final itemId = item['_id'] ?? item['id'];
    int qty = 0;
    for (var c in cartProvider.items) {
      if ((c['menuItemId'] ?? c['_id'] ?? c['id']) == itemId) {
        qty += (c['quantity'] ?? c['qty'] ?? 0) as int;
      }
    }

    if (qty > 0) {
      return Container(
        height: 26,
        decoration: BoxDecoration(
          color: const Color(0xFF8B1818),
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
              behavior: HitTestBehavior.opaque,
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                child: Icon(Icons.remove, color: Colors.white, size: 13),
              ),
            ),
            Text(
              '$qty',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
            GestureDetector(
              onTap: () {
                AddToCartHelper.handleAddToCart(
                    context, item, cartProvider, restaurantProvider);
              },
              behavior: HitTestBehavior.opaque,
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                child: Icon(Icons.add, color: Colors.white, size: 13),
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
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: const Color(0xFF8B1818),
          borderRadius: BorderRadius.circular(6),
        ),
        child: const Text(
          '+ Add',
          style: TextStyle(
            color: Colors.white,
            fontSize: 11,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (recommended.isEmpty) return const SizedBox.shrink();

    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'You May Also Like',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF111827),
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
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'View All',
                      style: TextStyle(
                        color: Color(0xFF8B1818),
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                    Icon(
                      Icons.chevron_right,
                      color: Color(0xFF8B1818),
                      size: 16,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),

        const SizedBox(height: 14),

        SizedBox(
          height: 205,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            itemCount: recommended.length,
            itemBuilder: (context, index) {
              final rec = recommended[index];
              final isVeg = rec['isVeg'] ?? true;
              final recId = rec['_id'] ?? rec['id'] ?? '';
              final isFav = authProvider.isFavoriteItem(recId);

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
                  width: 155,
                  margin: const EdgeInsets.only(right: 14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Image with Veg badge & Favorite heart
                      Stack(
                        children: [
                          SizedBox(
                            height: 110,
                            width: double.infinity,
                            child: ImageHelper.buildDishImage(rec,
                                fit: BoxFit.cover),
                          ),
                          // Veg/Non-Veg Badge Top-Left
                          Positioned(
                            top: 8,
                            left: 8,
                            child: Container(
                              padding: const EdgeInsets.all(2.5),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Container(
                                padding: const EdgeInsets.all(1.5),
                                decoration: BoxDecoration(
                                  border: Border.all(
                                    color: isVeg
                                        ? const Color(0xFF16A34A)
                                        : const Color(0xFFDC2626),
                                    width: 1.2,
                                  ),
                                  borderRadius: BorderRadius.circular(3),
                                ),
                                child: CircleAvatar(
                                  radius: 2.5,
                                  backgroundColor: isVeg
                                      ? const Color(0xFF16A34A)
                                      : const Color(0xFFDC2626),
                                ),
                              ),
                            ),
                          ),
                          // Heart Icon Top-Right
                          Positioned(
                            top: 8,
                            right: 8,
                            child: GestureDetector(
                              onTap: () async {
                                if (authProvider.isAuthenticated) {
                                  await authProvider.toggleFavoriteItem(recId);
                                } else {
                                  ToastUtils.showError(
                                      context, 'Please login to add favorites');
                                }
                              },
                              child: Container(
                                width: 26,
                                height: 26,
                                decoration: const BoxDecoration(
                                  color: Colors.white,
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  isFav
                                      ? Icons.favorite
                                      : Icons.favorite_border,
                                  color: const Color(0xFF8B1818),
                                  size: 15,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      // Details Below Image
                      Padding(
                        padding: const EdgeInsets.all(10),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              rec['name'] ?? '',
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 13,
                                color: Color(0xFF111827),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '\$${((rec['price'] ?? 0.0) as num).toDouble().toStringAsFixed(2)}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w900,
                                    color: Color(0xFF8B1818),
                                    fontSize: 13.5,
                                  ),
                                ),
                                _buildCartAction(context, rec),
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
