import 'package:flutter/material.dart';

class ItemDetailInfo extends StatelessWidget {
  final String name;
  final bool isSpicy;
  final bool isVeg;
  final double basePrice;
  final String description;
  final int prepTime;

  const ItemDetailInfo({
    super.key,
    required this.name,
    required this.isSpicy,
    required this.isVeg,
    required this.basePrice,
    required this.description,
    required this.prepTime,
  });

  Widget _buildTag(IconData icon, String text, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 6),
        Text(
          text,
          style: TextStyle(
            fontSize: 11,
            color: Colors.grey.shade800,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Title & Spicy badge
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Text(
                name,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Serif',
                ),
              ),
            ),
            if (isSpicy)
              Padding(
                padding: const EdgeInsets.only(left: 8.0, top: 4.0),
                child: Image.asset(
                  'assets/images/chili.png',
                  width: 24,
                  height: 24,
                  color: Colors.red.shade900,
                  errorBuilder: (c, e, s) => Icon(
                    Icons.local_fire_department,
                    color: Colors.red.shade900,
                    size: 24,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 12),
        // Price
        Text(
          '\$${basePrice.toStringAsFixed(2)}',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w900,
            color: Colors.red.shade900,
          ),
        ),
        const SizedBox(height: 16),
        // Description
        Text(
          description,
          style: TextStyle(
            color: Colors.grey.shade800,
            fontSize: 14,
            height: 1.5,
          ),
        ),
        const SizedBox(height: 24),
        // Tags
        Wrap(
          alignment: WrapAlignment.spaceBetween,
          spacing: 8,
          runSpacing: 10,
          children: [
            _buildTag(
              isVeg ? Icons.eco : Icons.restaurant,
              isVeg ? 'Veg' : 'Non-Veg',
              isVeg ? Colors.green : Colors.red,
            ),
            _buildTag(
              Icons.local_fire_department,
              isSpicy ? 'Medium Spicy' : 'Mild Spicy',
              Colors.red.shade800,
            ),
            _buildTag(
              Icons.schedule,
              '$prepTime mins',
              Colors.red.shade900,
            ),
            _buildTag(
              Icons.outdoor_grill,
              'Tandoor Grilled',
              Colors.red.shade900,
            ),
          ],
        ),
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 24.0),
          child: Divider(color: Colors.black12, thickness: 1),
        ),
      ],
    );
  }
}
