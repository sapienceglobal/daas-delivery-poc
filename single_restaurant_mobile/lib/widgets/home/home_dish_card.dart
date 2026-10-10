import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/screens/item_detail_screen.dart';
import 'package:single_restaurant_mobile/utils/cart_helper.dart';
import 'package:single_restaurant_mobile/utils/image_helper.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';

class HomeDishCard extends StatelessWidget {
  final dynamic dish;

  const HomeDishCard({super.key, required this.dish});

  @override
  Widget build(BuildContext context) {
    final name = dish['name'] ?? 'Dish';
    final price = dish['price']?.toString() ?? '0';

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ItemDetailScreen(item: dish),
          ),
        );
      },
      child: Container(
        width: 172,
        margin: const EdgeInsets.only(right: 14, bottom: 4),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: const [
            BoxShadow(
              color: AppColors.cardShadow,
              blurRadius: 8,
              offset: Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(16),
                  ),
                  child: SizedBox(
                    height: 120,
                    width: double.infinity,
                    child: ImageHelper.buildDishImage(
                      dish,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: Consumer<AuthProvider>(
                    builder: (context, authProvider, _) {
                      final dishId = dish['_id'] ?? dish['id'] ?? '';
                      final isFavorite = authProvider.isFavoriteItem(dishId);
                      return GestureDetector(
                        onTap: () async {
                          if (authProvider.isAuthenticated) {
                            await authProvider.toggleFavoriteItem(dishId);
                          } else {
                            ToastUtils.showError(
                              context,
                              'Please login to add favorites',
                            );
                          }
                        },
                        child: Container(
                          padding: const EdgeInsets.all(5),
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black12,
                                blurRadius: 4,
                              ),
                            ],
                          ),
                          child: Icon(
                            isFavorite
                                ? Icons.favorite
                                : Icons.favorite_border,
                            color: const Color(0xFFB71C1C),
                            size: 17,
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 7, 10, 5),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                      color: Color(0xFF1E1E1E),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 5),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '\$$price',
                        style: const TextStyle(
                          color: Color(0xFFB71C1C),
                          fontWeight: FontWeight.w900,
                          fontSize: 14.5,
                        ),
                      ),
                      Consumer<CartProvider>(
                        builder: (context, cart, child) {
                          final dishId = dish['_id'] ?? dish['id'];
                          int totalQty = 0;
                          int lastMatchIndex = -1;
                          for (int i = 0; i < cart.items.length; i++) {
                            final c = cart.items[i];
                            if ((c['menuItemId'] ?? c['_id'] ?? c['id']) ==
                                dishId) {
                              totalQty += (c['quantity'] ?? c['qty'] ?? 1) as int;
                              lastMatchIndex = i;
                            }
                          }

                          if (totalQty > 0) {
                            return Container(
                              decoration: BoxDecoration(
                                color: const Color(0xFFFDE8E8),
                                border: Border.all(
                                  color: const Color(0xFFB71C1C),
                                  width: 1.2,
                                ),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  InkWell(
                                    onTap: () {
                                      if (lastMatchIndex != -1) {
                                        final lastQty = (cart.items[lastMatchIndex]
                                                ['quantity'] ??
                                            cart.items[lastMatchIndex]['qty'] ??
                                            1) as int;
                                        cart.updateQuantity(
                                          lastMatchIndex,
                                          lastQty - 1,
                                        );
                                      }
                                    },
                                    child: const Padding(
                                      padding: EdgeInsets.symmetric(
                                        horizontal: 6,
                                        vertical: 3,
                                      ),
                                      child: Icon(
                                        Icons.remove,
                                        size: 13,
                                        color: Color(0xFFB71C1C),
                                      ),
                                    ),
                                  ),
                                  Text(
                                    '$totalQty',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFFB71C1C),
                                      fontSize: 11.5,
                                    ),
                                  ),
                                  InkWell(
                                    onTap: () {
                                      final restProv =
                                          Provider.of<RestaurantProvider>(
                                        context,
                                        listen: false,
                                      );
                                      AddToCartHelper.handleAddToCart(
                                        context,
                                        dish,
                                        cart,
                                        restProv,
                                      );
                                    },
                                    child: const Padding(
                                      padding: EdgeInsets.symmetric(
                                        horizontal: 6,
                                        vertical: 3,
                                      ),
                                      child: Icon(
                                        Icons.add,
                                        size: 13,
                                        color: Color(0xFFB71C1C),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }

                          return InkWell(
                            borderRadius: BorderRadius.circular(16),
                            onTap: () {
                              final restProv = Provider.of<RestaurantProvider>(
                                context,
                                listen: false,
                              );
                              AddToCartHelper.handleAddToCart(
                                context,
                                dish,
                                cart,
                                restProv,
                              );
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                border: Border.all(
                                  color: const Color(0xFFB71C1C),
                                  width: 1.2,
                                ),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Text(
                                'Add +',
                                style: TextStyle(
                                  color: Color(0xFFB71C1C),
                                  fontWeight: FontWeight.w700,
                                  fontSize: 11,
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
