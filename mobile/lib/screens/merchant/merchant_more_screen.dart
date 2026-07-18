import 'package:flutter/material.dart';
import '../../theme.dart';
import '../../widgets/glass_container.dart';
import 'merchant_crm_screen.dart';
import 'merchant_kds_screen.dart';
import 'merchant_pos_screen.dart';
import 'merchant_analytics_screen.dart';
import 'merchant_promotions_screen.dart';
import 'merchant_tables_screen.dart';

class MerchantMoreScreen extends StatelessWidget {
  const MerchantMoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final items = [
      {'title': 'Analytics', 'icon': Icons.bar_chart, 'screen': const MerchantAnalyticsScreen()},
      {'title': 'POS Terminal', 'icon': Icons.point_of_sale, 'screen': const MerchantPosScreen()},
      {'title': 'KDS (Kitchen)', 'icon': Icons.kitchen, 'screen': const MerchantKdsScreen()},
      {'title': 'Promotions', 'icon': Icons.local_offer, 'screen': const MerchantPromotionsScreen()},
      {'title': 'Tables', 'icon': Icons.table_restaurant, 'screen': const MerchantTablesScreen()},
      {'title': 'CRM & Reviews', 'icon': Icons.star, 'screen': const MerchantCrmScreen()},
    ];

    return Scaffold(
      backgroundColor: BrandColors.background,
      body: GridView.builder(
        padding: const EdgeInsets.all(16.0),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 1.1,
        ),
        itemCount: items.length,
        itemBuilder: (context, index) {
          final item = items[index];
          return GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => item['screen'] as Widget),
              );
            },
            child: GlassContainer(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    item['icon'] as IconData,
                    size: 48,
                    color: BrandColors.cyan,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    item['title'] as String,
                    style: const TextStyle(
                      color: BrandColors.textMain,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
