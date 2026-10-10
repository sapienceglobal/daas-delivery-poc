import 'package:flutter/material.dart';

class ItemDetailInfo extends StatelessWidget {
  final String name;
  final bool isSpicy;
  final bool isVeg;
  final double basePrice;
  final String description;
  final int prepTime;
  final Map<String, dynamic>? item;

  const ItemDetailInfo({
    super.key,
    required this.name,
    required this.isSpicy,
    required this.isVeg,
    required this.basePrice,
    required this.description,
    required this.prepTime,
    this.item,
  });

  Widget _buildHighlightItem({
    required IconData icon,
    required String label,
  }) {
    return Expanded(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: const Color(0xFF8B1818), size: 22),
          const SizedBox(height: 6),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Color(0xFF374151),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dynamic customSpice = item?['spiceLevel'] ?? item?['spicyLevel'];
    final String spiceText = customSpice != null
        ? customSpice.toString()
        : (isSpicy ? 'Medium Spicy' : 'Mild Spicy');

    final String cookingStyle = item?['cookingMethod'] ??
        item?['cookingStyle'] ??
        item?['categoryName'] ??
        (isVeg ? 'Clay Oven' : 'Tandoor Grilled');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Top row: Veg Badge on left, Price on right
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Veg/Non-Veg Badge
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(2.5),
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: isVeg
                          ? const Color(0xFF16A34A)
                          : const Color(0xFFDC2626),
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: CircleAvatar(
                    radius: 3.5,
                    backgroundColor: isVeg
                        ? const Color(0xFF16A34A)
                        : const Color(0xFFDC2626),
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  isVeg ? 'Veg' : 'Non-Veg',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
            // Price
            Text(
              '\$${basePrice.toStringAsFixed(2)}',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: Color(0xFF8B1818),
              ),
            ),
          ],
        ),

        const SizedBox(height: 8),

        // Dish Title
        Text(
          name,
          style: const TextStyle(
            fontSize: 26,
            fontWeight: FontWeight.w900,
            color: Color(0xFF111827),
            letterSpacing: -0.5,
          ),
        ),

        const SizedBox(height: 14),

        // 4-item Quick Highlights Card
        Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
          decoration: BoxDecoration(
            color: const Color(0xFFFCF8F5),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              _buildHighlightItem(
                icon: Icons.restaurant_menu_rounded,
                label: isVeg ? 'Veg' : 'Non-Veg',
              ),
              _buildHighlightItem(
                icon: Icons.local_fire_department_rounded,
                label: spiceText,
              ),
              _buildHighlightItem(
                icon: Icons.access_time_rounded,
                label: '$prepTime mins',
              ),
              _buildHighlightItem(
                icon: Icons.outdoor_grill_outlined,
                label: cookingStyle,
              ),
            ],
          ),
        ),

        const SizedBox(height: 22),

        // Description Section
        const Text(
          'Description',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFF111827),
          ),
        ),

        const SizedBox(height: 8),

        Text(
          description,
          style: const TextStyle(
            fontSize: 13.5,
            color: Color(0xFF4B5563),
            height: 1.55,
          ),
        ),

        const Padding(
          padding: EdgeInsets.symmetric(vertical: 20.0),
          child: Divider(color: Color(0xFFF3F4F6), thickness: 1, height: 1),
        ),
      ],
    );
  }
}
