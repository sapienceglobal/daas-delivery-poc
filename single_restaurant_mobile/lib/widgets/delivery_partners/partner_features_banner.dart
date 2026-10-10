import 'package:flutter/material.dart';

class PartnerFeaturesBanner extends StatelessWidget {
  const PartnerFeaturesBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFFCF3E3), // Warm cream background
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(child: _buildFeatureItem(Icons.verified_user_outlined, '100% Safe', 'Secure payments\non all platforms')),
          Expanded(child: _buildFeatureItem(Icons.moped_outlined, 'Fast Delivery', 'Hot & fresh\nat your door')),
          Expanded(child: _buildFeatureItem(Icons.workspace_premium_outlined, 'Best Quality', 'Prepared with\nlove & care')),
          Expanded(child: _buildFeatureItem(Icons.support_agent_outlined, '24/7 Support', 'Help whenever\nyou need')),
        ],
      ),
    );
  }

  Widget _buildFeatureItem(IconData icon, String title, String subtitle) {
    return Column(
      children: [
        Icon(icon, color: Colors.brown.shade700, size: 22),
        const SizedBox(height: 6),
        FittedBox(
          fit: BoxFit.scaleDown,
          child: Text(
            title,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.black87),
          ),
        ),
        const SizedBox(height: 3),
        Text(
          subtitle,
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.grey.shade700, fontSize: 9, height: 1.2),
        ),
      ],
    );
  }
}
