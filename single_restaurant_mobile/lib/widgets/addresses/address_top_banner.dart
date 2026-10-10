import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';

class AddressTopBanner extends StatelessWidget {
  const AddressTopBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7F0), // Light orange/beige
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 4,
                ),
              ],
            ),
            child: const Icon(Icons.location_on, color: AppColors.secondary, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Your saved addresses for quick & easy checkout',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const SizedBox(height: 4),
                Text(
                  'Select an address during checkout to place your order',
                  style: TextStyle(color: Colors.grey.shade700, fontSize: 11),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          const Icon(Icons.map_outlined, color: Colors.orange, size: 40),
        ],
      ),
    );
  }
}

class AddressFooterBanner extends StatelessWidget {
  const AddressFooterBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7F0), // Light orange/beige
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 4,
                ),
              ],
            ),
            child: const Icon(Icons.security, color: Colors.brown, size: 24),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Text(
              'Your addresses are secure and\nused only for delivering your orders.',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, height: 1.4),
            ),
          ),
          const SizedBox(width: 8),
          const Icon(Icons.delivery_dining, color: AppColors.secondary, size: 40),
        ],
      ),
    );
  }
}

class AddNewAddressCard extends StatelessWidget {
  final VoidCallback onTap;

  const AddNewAddressCard({super.key, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.all(16),
        child: CustomPaint(
          painter: DashedRectPainter(
            color: Colors.grey.shade400,
            strokeWidth: 1.5,
            gap: 5.0,
          ),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 24),
            alignment: Alignment.center,
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.secondary, width: 1.5),
                  ),
                  child: const Icon(Icons.add, color: AppColors.secondary, size: 20),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Add New Address',
                  style: TextStyle(
                    color: AppColors.secondary,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Save a new address for faster checkout',
                  style: TextStyle(color: Colors.grey, fontSize: 12),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// Custom painter for dashed rectangle border
class DashedRectPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  final double gap;

  DashedRectPainter({this.color = Colors.black, this.strokeWidth = 1.0, this.gap = 5.0});

  @override
  void paint(Canvas canvas, Size size) {
    var paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke;

    var path = Path();
    path.addRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(0, 0, size.width, size.height),
        const Radius.circular(12),
      ),
    );

    var dashPath = Path();
    bool addLine = true;
    double distance = 0.0;
    for (var metric in path.computeMetrics()) {
      while (distance < metric.length) {
        if (addLine) {
          dashPath.addPath(metric.extractPath(distance, distance + gap), Offset.zero);
        }
        distance += gap;
        addLine = !addLine;
      }
      distance = 0.0;
    }

    canvas.drawPath(dashPath, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
