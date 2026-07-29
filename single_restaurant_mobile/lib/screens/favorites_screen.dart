import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/widgets/menu_item_card.dart';

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
                  final cartItemIndex = cartProvider.items.indexWhere((i) {
                    final iId = i['menuItemId'] ?? i['_id'] ?? i['id'];
                    return iId == itemId;
                  });
                  final cartQty = cartItemIndex > -1 ? (cartProvider.items[cartItemIndex]['quantity'] ?? cartProvider.items[cartItemIndex]['qty'] ?? 1) as int : 0;

                  return MenuItemCard(
                    item: item as Map<String, dynamic>,
                    cartQty: cartQty,
                    onAdd: () {
                      final newItem = Map<String, dynamic>.from(item);
                      newItem['quantity'] = 1;
                      newItem['qty'] = 1;
                      newItem['addOns'] = [];
                      cartProvider.addItem(newItem, restaurantData: restaurantProvider.restaurant);
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${item['name']} added to cart!'), duration: const Duration(seconds: 1)));
                    },
                    onIncrement: () => cartProvider.updateQuantity(cartItemIndex, cartQty + 1),
                    onDecrement: () => cartProvider.updateQuantity(cartItemIndex, cartQty - 1),
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
