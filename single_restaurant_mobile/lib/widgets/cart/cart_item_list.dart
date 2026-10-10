import 'dart:async';
import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/checkout_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/utils/cart_helper.dart';
import 'package:single_restaurant_mobile/widgets/cart_item_card.dart';

class CartItemList extends StatelessWidget {
  final CartProvider cartProvider;
  final CheckoutProvider checkoutProvider;
  final RestaurantProvider restaurantProvider;
  final Future<void> Function(FutureOr<void> Function() action) onHandleQty;

  const CartItemList({
    super.key,
    required this.cartProvider,
    required this.checkoutProvider,
    required this.restaurantProvider,
    required this.onHandleQty,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Column(
        children: cartProvider.items.asMap().entries.map((entry) {
          final index = entry.key;
          final item = entry.value;
          final currentQty = (item['quantity'] ?? item['qty'] ?? 1) as int;

          return CartItemCard(
            item: item,
            onIncrement: () => onHandleQty(
              () => AddToCartHelper.handleAddToCart(
                context,
                item,
                cartProvider,
                restaurantProvider,
              ),
            ),
            onDecrement: () => onHandleQty(
              () => cartProvider.updateQuantity(index, currentQty - 1),
            ),
            onDelete: () => onHandleQty(
              () => cartProvider.removeItem(index),
            ),
          );
        }).toList(),
      ),
    );
  }
}
