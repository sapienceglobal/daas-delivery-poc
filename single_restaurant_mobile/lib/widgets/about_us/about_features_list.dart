import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';

class AboutFeaturesList extends StatelessWidget {
  const AboutFeaturesList({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _buildFeatureItem(
          icon: Icons.restaurant_menu,
          title: 'Authentic Recipes',
          description: 'Traditional recipes crafted by experienced chefs.',
        ),
        const SizedBox(height: 24),
        _buildFeatureItem(
          icon: Icons.eco,
          title: 'Fresh Ingredients',
          description: 'We use the freshest & highest quality ingredients.',
        ),
        const SizedBox(height: 24),
        _buildFeatureItem(
          icon: Icons.celebration,
          title: 'Warm Ambience',
          description: 'Perfect place for family, friends & special occasions.',
        ),
      ],
    );
  }

  Widget _buildFeatureItem({
    required IconData icon,
    required String title,
    required String description,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.secondary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: AppColors.secondary, size: 28),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: const TextStyle(
                  fontSize: 14,
                  color: Colors.black87,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
