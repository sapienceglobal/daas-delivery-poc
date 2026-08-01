import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/screens/help_support_screen.dart';

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
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 16),
              
              // Decorative header
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.horizontal_rule, color: Colors.amber.shade300, size: 24),
                  const SizedBox(width: 8),
                  const Text(
                    'Order from Lassi Lounge on your favorite platform',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black87),
                  ),
                  const SizedBox(width: 8),
                  Icon(Icons.horizontal_rule, color: Colors.amber.shade300, size: 24),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Same great food. Your favorite way. ❤️',
                style: TextStyle(color: Colors.grey.shade700, fontSize: 12),
              ),
              const SizedBox(height: 24),
              
              // Banner Card
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFFCF3E3), // Light cream/orange background
                  borderRadius: BorderRadius.circular(16),
                ),
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    // Mock image for food bag
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
                            const Text('Lassi\nLounge', textAlign: TextAlign.center, style: TextStyle(fontFamily: 'Cursive', fontSize: 12, fontWeight: FontWeight.bold, color: Colors.brown)),
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
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF8B1D1D)), // Dark red
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
              ),
              const SizedBox(height: 24),
              
              // Uber Eats Card
              _buildPartnerCard(
                partnerName: 'Uber Eats',
                logoColor: Colors.black,
                logoTextColor: const Color(0xFF06C167), // Uber eats green
                accentColor: const Color(0xFF06C167),
                deliveryTime: '30–40 mins delivery',
                benefitText: 'Exclusive offers & discounts',
                rating: '4.6',
                reviews: '(12K+)',
              ),
              const SizedBox(height: 16),
              
              // DoorDash Card
              _buildPartnerCard(
                partnerName: 'DoorDash',
                logoColor: const Color(0xFFFF3008), // DoorDash red
                logoTextColor: Colors.white,
                accentColor: const Color(0xFFFF3008),
                deliveryTime: '25–35 mins delivery',
                benefitText: 'DashPass benefits',
                rating: '4.5',
                reviews: '(9K+)',
                customLogoWidget: const Icon(Icons.delivery_dining, color: Colors.white, size: 40), // Mock icon for doordash
              ),
              const SizedBox(height: 16),
              
              // Grubhub Card
              _buildPartnerCard(
                partnerName: 'Grubhub',
                logoColor: const Color(0xFFFF8000), // Grubhub orange
                logoTextColor: Colors.white,
                accentColor: const Color(0xFFFF8000),
                deliveryTime: '30–45 mins delivery',
                benefitText: 'Great deals & rewards',
                rating: '4.4',
                reviews: '(7K+)',
                customLogoWidget: const Icon(Icons.home, color: Colors.white, size: 40), // Mock icon for grubhub
              ),
              const SizedBox(height: 32),
              
              // Footer Features
              Container(
                padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFCF3E3),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildFeatureItem(Icons.verified_user_outlined, '100% Safe', 'Secure payments\non all platforms'),
                    _buildFeatureItem(Icons.moped_outlined, 'Fast Delivery', 'Hot & fresh\nat your door'),
                    _buildFeatureItem(Icons.workspace_premium_outlined, 'Best Quality', 'Prepared with\nlove & care'),
                    _buildFeatureItem(Icons.support_agent_outlined, '24/7 Support', 'Help whenever\nyou need'),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              
              // Bottom Note
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.access_time, size: 14, color: Colors.grey.shade600),
                  const SizedBox(width: 6),
                  Text(
                    'Delivery time may vary depending on your location and partner.',
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 10),
                  ),
                ],
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPartnerCard({
    required String partnerName,
    required Color logoColor,
    required Color logoTextColor,
    required Color accentColor,
    required String deliveryTime,
    required String benefitText,
    required String rating,
    required String reviews,
    Widget? customLogoWidget,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Logo
              Container(
                width: 70,
                height: 70,
                decoration: BoxDecoration(
                  color: logoColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: customLogoWidget ?? Text(
                    partnerName.split(' ').join('\n'),
                    textAlign: TextAlign.center,
                    style: TextStyle(color: logoTextColor, fontWeight: FontWeight.bold, fontSize: 14, height: 1.1),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              
              // Details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          partnerName,
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              Container(width: 6, height: 6, decoration: BoxDecoration(color: accentColor, shape: BoxShape.circle)),
                              const SizedBox(width: 4),
                              Text('Open', style: TextStyle(color: accentColor, fontSize: 10, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    _buildIconTextRow(Icons.check_circle_outline, deliveryTime),
                    const SizedBox(height: 4),
                    _buildIconTextRow(Icons.local_offer_outlined, benefitText),
                    const SizedBox(height: 4),
                    _buildIconTextRow(Icons.location_on_outlined, 'Live order tracking'),
                  ],
                ),
              ),
              
              // Rating
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Row(
                    children: [
                      Icon(Icons.star, color: Colors.amber.shade600, size: 14),
                      const SizedBox(width: 4),
                      Text(rating, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    ],
                  ),
                  Text(reviews, style: TextStyle(color: Colors.grey.shade500, fontSize: 10)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Button
          SizedBox(
            width: double.infinity,
            height: 40,
            child: OutlinedButton(
              onPressed: () {},
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: accentColor, width: 1.5),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Order on $partnerName',
                    style: TextStyle(color: accentColor, fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(width: 8),
                  Icon(Icons.open_in_new, color: accentColor, size: 16),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIconTextRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 14, color: Colors.grey.shade700),
        const SizedBox(width: 8),
        Text(text, style: TextStyle(color: Colors.grey.shade700, fontSize: 12)),
      ],
    );
  }

  Widget _buildFeatureItem(IconData icon, String title, String subtitle) {
    return Column(
      children: [
        Icon(icon, color: Colors.brown.shade700, size: 24),
        const SizedBox(height: 8),
        Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.black87)),
        const SizedBox(height: 4),
        Text(
          subtitle,
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.grey.shade700, fontSize: 9, height: 1.3),
        ),
      ],
    );
  }
}
