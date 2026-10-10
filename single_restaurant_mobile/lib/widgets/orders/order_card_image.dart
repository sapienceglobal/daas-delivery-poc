import 'package:flutter/material.dart';

class OrderCardImage extends StatelessWidget {
  final Map<String, dynamic> order;
  final bool isActive;

  const OrderCardImage({
    super.key,
    required this.order,
    required this.isActive,
  });

  @override
  Widget build(BuildContext context) {
    final items = order['items'] as List?;
    final imagePath = (items != null && items.isNotEmpty && items[0]['image'] != null)
        ? items[0]['image']
        : 'assets/images/branded/lassi-lounge/categories/appetizers.jpg';

    final screenWidth = MediaQuery.sizeOf(context).width;
    final imageSize = (screenWidth * 0.23).clamp(74.0, 92.0);

    return Stack(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: imagePath.startsWith('http')
              ? Image.network(
                  imagePath,
                  width: imageSize,
                  height: imageSize,
                  fit: BoxFit.cover,
                  errorBuilder: (c, e, s) => Image.asset(
                    'assets/images/branded/lassi-lounge/categories/appetizers.jpg',
                    width: imageSize,
                    height: imageSize,
                    fit: BoxFit.cover,
                  ),
                )
              : Image.asset(
                  imagePath,
                  width: imageSize,
                  height: imageSize,
                  fit: BoxFit.cover,
                ),
        ),
        if (isActive)
          Positioned(
            top: 8,
            left: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.red.shade700,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Row(
                children: [
                  Icon(Icons.circle, color: Colors.white, size: 8),
                  SizedBox(width: 4),
                  Text(
                    'LIVE',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
