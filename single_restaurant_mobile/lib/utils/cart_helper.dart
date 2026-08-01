import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/widgets/customization_bottom_sheet.dart';

class AddToCartHelper {
  static void handleAddToCart(
    BuildContext context,
    Map<String, dynamic> item,
    CartProvider cartProvider,
    RestaurantProvider restaurantProvider, {
    int quantity = 1,
  }) {
    final bool hasAddOns = item['addOns'] != null && (item['addOns'] as List).isNotEmpty;
    final bool hasSizes = item['sizeVariations'] != null && (item['sizeVariations'] as List).isNotEmpty;
    final bool isCustomizable = hasAddOns || hasSizes;

    if (!isCustomizable) {
      // Direct add
      final newItem = Map<String, dynamic>.from(item);
      newItem['quantity'] = quantity;
      cartProvider.addItem(newItem, restaurantData: restaurantProvider.restaurant);
      return;
    }

    // Check if the item already exists in the cart WITH ANY customizations
    final targetId = item['menuItemId'] ?? item['_id'] ?? item['id'];
    
    // Find all occurrences of this item in the cart
    final cartItems = cartProvider.items.where((i) {
      final iId = i['menuItemId'] ?? i['_id'] ?? i['id'];
      return iId == targetId;
    }).toList();

    if (cartItems.isNotEmpty) {
      // Ask user to repeat last or choose new
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Repeat Customization?'),
          content: const Text('You already have this item in your cart. Do you want to repeat your last customization or choose a new one?'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(ctx);
                _openCustomizationSheet(context, item, cartProvider, restaurantProvider);
              },
              child: Text('Choose New', style: TextStyle(color: Colors.red.shade900)),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                // Add the most recently added configuration again
                final lastItem = cartItems.last;
                final repeatItem = Map<String, dynamic>.from(lastItem);
                repeatItem['quantity'] = 1;
                cartProvider.addItem(repeatItem, restaurantData: restaurantProvider.restaurant);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red.shade900,
                foregroundColor: Colors.white,
              ),
              child: const Text('Last Repeat'),
            ),
          ],
        ),
      );
    } else {
      // First time adding, show customization bottom sheet
      _openCustomizationSheet(context, item, cartProvider, restaurantProvider);
    }
  }

  static void _openCustomizationSheet(
    BuildContext context,
    Map<String, dynamic> item,
    CartProvider cartProvider,
    RestaurantProvider restaurantProvider,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => CustomizationBottomSheet(
        item: item,
        cartProvider: cartProvider,
        restaurantProvider: restaurantProvider,
      ),
    );
  }
}
