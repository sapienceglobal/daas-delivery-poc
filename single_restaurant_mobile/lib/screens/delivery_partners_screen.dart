import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/screens/help_support_screen.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';
import 'package:single_restaurant_mobile/widgets/delivery_partners/partner_card.dart';
import 'package:single_restaurant_mobile/widgets/delivery_partners/partner_features_banner.dart';

class DeliveryPartnersScreen extends StatelessWidget {
  const DeliveryPartnersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Delivery Partners',
          style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline, color: Colors.black87),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.phone_in_talk_outlined, color: Colors.black87),
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const HelpSupportScreen()));
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: ResponsiveCenter(
          maxWidth: 650,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 16),
                _buildHeaderSubtitle(),
                const SizedBox(height: 8),
                Text(
                  'Same great food. Your favorite way. ❤️',
                  style: TextStyle(color: Colors.grey.shade700, fontSize: 12),
                ),
                const SizedBox(height: 24),
                _buildBannerCard(),
                const SizedBox(height: 24),
                const PartnerCard(
                  partnerName: 'Uber Eats',
                  logoColor: Colors.black,
                  logoTextColor: Color(0xFF06C167),
                  accentColor: Color(0xFF06C167),
                  deliveryTime: '30–40 mins delivery',
                  benefitText: 'Exclusive offers & discounts',
                  rating: '4.6',
                  reviews: '(12K+)',
                ),
                const SizedBox(height: 16),
                const PartnerCard(
                  partnerName: 'DoorDash',
                  logoColor: Color(0xFFFF3008),
                  logoTextColor: Colors.white,
                  accentColor: Color(0xFFFF3008),
                  deliveryTime: '25–35 mins delivery',
                  benefitText: 'DashPass benefits',
                  rating: '4.5',
                  reviews: '(9K+)',
                  customLogoWidget: Icon(Icons.delivery_dining, color: Colors.white, size: 40),
                ),
                const SizedBox(height: 16),
                const PartnerCard(
                  partnerName: 'Grubhub',
                  logoColor: Color(0xFFFF8000),
                  logoTextColor: Colors.white,
                  accentColor: Color(0xFFFF8000),
                  deliveryTime: '30–45 mins delivery',
                  benefitText: 'Great deals & rewards',
                  rating: '4.4',
                  reviews: '(7K+)',
                  customLogoWidget: Icon(Icons.home, color: Colors.white, size: 40),
                ),
                const SizedBox(height: 32),
                const PartnerFeaturesBanner(),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.access_time, size: 14, color: Colors.grey.shade600),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'Delivery time may vary depending on your location and partner.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.grey.shade600, fontSize: 10),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeaderSubtitle() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.horizontal_rule, color: Colors.amber.shade300, size: 24),
        const SizedBox(width: 8),
        const Flexible(
          child: Text(
            'Order from Lassi Lounge on your favorite platform',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black87),
          ),
        ),
        const SizedBox(width: 8),
        Icon(Icons.horizontal_rule, color: Colors.amber.shade300, size: 24),
      ],
    );
  }

  Widget _buildBannerCard() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFFCF3E3),
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            flex: 1,
            child: Container(
              height: 100,
              decoration: BoxDecoration(
                color: Colors.transparent,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Icon(Icons.shopping_bag, size: 80, color: Colors.amber.shade200),
                  const Text(
                    'Lassi\nLounge',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.brown),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            flex: 1,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Delicious. Delivered.',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF8B1D1D)),
                ),
                const SizedBox(height: 8),
                Text(
                  'Order on your preferred delivery partner and we\'ll take care of the rest!',
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade800, height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
