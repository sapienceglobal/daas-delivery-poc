import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/widgets/menu_item_card.dart';
import 'package:single_restaurant_mobile/utils/cart_helper.dart';
import 'package:single_restaurant_mobile/widgets/guest_login_prompt.dart';

class FavoritesScreen extends StatelessWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAF8F5),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('My Favorites', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
      ),
      body: Consumer2<AuthProvider, RestaurantProvider>(
        builder: (context, authProvider, restaurantProvider, child) {
          if (authProvider.user == null) {
            return const GuestLoginPrompt(
              icon: Icons.favorite_outline,
              title: 'Login to view favorites',
              subtitle: 'Save your favorite dishes to re-order them quickly.',
            );
          }

          final favoriteItemsIds = authProvider.user?.favoriteItems ?? [];
          
          if (favoriteItemsIds.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.favorite_border, size: 80, color: Colors.grey.shade300),
                  const SizedBox(height: 16),
                  const Text('No favorite items yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  const Text('Heart your favorite dishes while browsing menus.', style: TextStyle(color: Colors.grey)),
                ],
              ),
            );
          }

          // Flatten all categories to find the favorite items
          final allItems = restaurantProvider.menu.expand((cat) => (cat['items'] ?? []) as List<dynamic>).toList();
          final favoriteItems = allItems.where((item) {
            final id = item['_id'] ?? item['id'] ?? '';
            return authProvider.isFavoriteItem(id);
          }).toList();

          if (favoriteItems.isEmpty) {
             return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.favorite_border, size: 80, color: Colors.grey.shade300),
                  const SizedBox(height: 16),
                  const Text('No favorite items found', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                ],
              ),
            );
          }

          return Consumer<CartProvider>(
            builder: (context, cartProvider, _) {
              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: favoriteItems.length,
                itemBuilder: (context, index) {
                  final item = favoriteItems[index];
                  final itemId = item['_id'] ?? item['id'] ?? '';
                  
                  int totalQty = 0;
                  int lastMatchIndex = -1;
                  for (int i = 0; i < cartProvider.items.length; i++) {
                    final c = cartProvider.items[i];
                    if ((c['menuItemId'] ?? c['_id'] ?? c['id']) == itemId) {
                      totalQty += (c['quantity'] ?? c['qty'] ?? 1) as int;
                      lastMatchIndex = i;
                    }
                  }

                  return MenuItemCard(
                    item: item as Map<String, dynamic>,
                    cartQty: totalQty,
                    onAdd: () {
                      AddToCartHelper.handleAddToCart(context, item as Map<String, dynamic>, cartProvider, restaurantProvider);
                    },
                    onIncrement: () {
                      AddToCartHelper.handleAddToCart(context, item as Map<String, dynamic>, cartProvider, restaurantProvider);
                    },
                    onDecrement: () {
                      if (lastMatchIndex != -1) {
                        final lastQty = (cartProvider.items[lastMatchIndex]['quantity'] ?? cartProvider.items[lastMatchIndex]['qty'] ?? 1) as int;
                        cartProvider.updateQuantity(lastMatchIndex, lastQty - 1);
                      }
                    },
                  );
                },
              );
            }
          );
        },
      ),
    );
  }
}
