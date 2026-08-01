import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/screens/item_detail_screen.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/utils/image_helper.dart';

class MenuItemCard extends StatelessWidget {
  final Map<String, dynamic> item;
  final int cartQty;
  final VoidCallback onAdd;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;

  const MenuItemCard({
    super.key,
    required this.item,
    required this.cartQty,
    required this.onAdd,
    required this.onIncrement,
    required this.onDecrement,
  });

  // Helper removed in favor of ImageHelper

  @override
  Widget build(BuildContext context) {
    final isVeg = item['isVeg'] ?? true;
    final isSpicy = item['isSpicy'] ?? false;
    final spiceText = isSpicy ? 'Medium' : 'Mild';
    final price = item['price'] ?? 0.0;
    final name = item['name'] ?? 'Unknown Dish';
    final description = item['description'] ?? 'Crispy rolls stuffed with fresh vegetables & served hot.';
    
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => ItemDetailScreen(item: item)),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image Left
          SizedBox(
            width: 130,
            height: 130,
            child: Stack(
              fit: StackFit.expand,
              children: [
                ImageHelper.buildDishImage(item, fit: BoxFit.cover),
                Positioned(
                  top: 8,
                  right: 8,
                  child: Consumer<AuthProvider>(
                    builder: (context, authProvider, _) {
                      final itemId = item['_id'] ?? item['id'] ?? '';
                      final isFavorite = authProvider.isFavoriteItem(itemId);
                      return GestureDetector(
                        onTap: () async {
                          if (authProvider.isAuthenticated) {
                            await authProvider.toggleFavoriteItem(itemId);
                          } else {
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please login to add favorites')));
                          }
                        },
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            isFavorite ? Icons.favorite : Icons.favorite_border,
                            size: 16,
                            color: isFavorite ? Colors.red.shade900 : Colors.grey.shade600,
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
          
          // Content Right
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Veg/NonVeg Indicator
                      Container(
                        margin: const EdgeInsets.only(top: 2, right: 6),
                        padding: const EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          border: Border.all(color: isVeg ? Colors.green : Colors.red, width: 1.5),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: CircleAvatar(
                          radius: 3,
                          backgroundColor: isVeg ? Colors.green : Colors.red,
                        ),
                      ),
                      Expanded(
                        child: Text(
                          name,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, fontFamily: 'Serif'),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  
                  // Spice Levels
                  Row(
                    children: [
                      Row(
                        children: List.generate(3, (index) {
                          final isActive = isSpicy ? index < 2 : index < 1;
                          return Padding(
                            padding: const EdgeInsets.only(right: 2),
                            child: Image.asset(
                              'assets/images/chili.png', // Assuming chili icon exists, fallback to Icon
                              width: 12,
                              height: 12,
                              color: isActive ? Colors.red.shade900 : Colors.grey.shade300,
                              errorBuilder: (c,e,s) => Icon(Icons.local_fire_department, size: 14, color: isActive ? Colors.red.shade900 : Colors.grey.shade300),
                            ),
                          );
                        }),
                      ),
                      const SizedBox(width: 4),
                      Text('($spiceText)', style: TextStyle(color: Colors.grey.shade600, fontSize: 11)),
                    ],
                  ),
                  
                  const SizedBox(height: 12),
                  
                  // Price and Add Button
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '\$${price.toStringAsFixed(2)}',
                        style: TextStyle(color: Colors.red.shade900, fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      _buildCartButton(),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ),);
  }

  Widget _buildCartButton() {
    if (cartQty > 0) {
      return Container(
        height: 32,
        decoration: BoxDecoration(
          color: Colors.red.shade900,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.remove, color: Colors.white, size: 16),
              onPressed: onDecrement,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
            ),
            Text(
              '$cartQty',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
            IconButton(
              icon: const Icon(Icons.add, color: Colors.white, size: 16),
              onPressed: onIncrement,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
            ),
          ],
        ),
      );
    }

    return SizedBox(
      height: 32,
      child: ElevatedButton(
        onPressed: onAdd,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.red.shade900,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('+ Add', style: TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}
