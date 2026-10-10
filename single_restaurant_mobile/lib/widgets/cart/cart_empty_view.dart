import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';

class CartEmptyView extends StatelessWidget {
  final VoidCallback onBrowseMenu;

  const CartEmptyView({
    super.key,
    required this.onBrowseMenu,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.shopping_bag_outlined, size: 80, color: Colors.grey),
          const SizedBox(height: 16),
          const Text('Your cart is empty', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('Add some delicious items from the menu.', style: TextStyle(color: Colors.grey)),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: onBrowseMenu,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.secondary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('BROWSE MENU'),
          )
        ],
      ),
    );
  }
}
