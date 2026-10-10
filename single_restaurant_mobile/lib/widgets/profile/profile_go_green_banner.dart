import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/widgets/common/app_bottom_sheet.dart';
import 'package:single_restaurant_mobile/widgets/common/app_button.dart';

class ProfileGoGreenBanner extends StatelessWidget {
  const ProfileGoGreenBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _showGoGreenBottomSheet(context),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFFEAF5EA),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFD6EAD7)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(7),
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.eco_outlined, color: Color(0xFF2E7D32), size: 22),
            ),
            const SizedBox(width: 14),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Go Green with Lassi Lounge',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: Color(0xFF1B381E),
                    ),
                  ),
                  SizedBox(height: 3),
                  Text(
                    'Opt for no-contact delivery and eco-friendly packaging.',
                    style: TextStyle(
                      color: Color(0xFF4A604D),
                      fontSize: 11.5,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.chevron_right, color: Color(0xFF4A604D), size: 20),
          ],
        ),
      ),
    );
  }

  void _showGoGreenBottomSheet(BuildContext context) {
    AppBottomSheet.show(
      context: context,
      builder: (sheetContext) => AppBottomSheet(
        title: 'Our Go Green Initiative',
        stickyFooter: AppButton(
          text: 'Got it!',
          onPressed: () => Navigator.pop(sheetContext),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.green.shade50,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.eco, color: Colors.green, size: 28),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Text(
                      'Sustainable Dining & Delivery',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.green,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Text(
                'We are committed to reducing our carbon footprint. By opting for eco-friendly packaging and no-contact delivery, you help us save trees, reduce plastic waste, and promote a sustainable future.',
                style: TextStyle(fontSize: 14, color: AppColors.textDark, height: 1.5),
              ),
              const SizedBox(height: 16),
              _buildFeatureRow(Icons.recycling, '100% Biodegradable & Recyclable containers'),
              const SizedBox(height: 10),
              _buildFeatureRow(Icons.no_meals_outlined, 'No plastic cutlery unless requested'),
              const SizedBox(height: 10),
              _buildFeatureRow(Icons.electric_bike, 'Route-optimized delivery partners'),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFeatureRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 18, color: Colors.green.shade700),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(fontSize: 13, color: Colors.black87),
          ),
        ),
      ],
    );
  }
}
