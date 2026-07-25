import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';

class OffersScreen extends StatefulWidget {
  const OffersScreen({super.key});

  @override
  State<OffersScreen> createState() => _OffersScreenState();
}

class _OffersScreenState extends State<OffersScreen> {
  final PageController _pageController = PageController();
  int _currentHeroIndex = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.secondary),
          onPressed: () {
            // Since this might be part of bottom nav, popping might close app. 
            // Better to let MainScreen handle it if possible, but keeping standard pop for now.
            if (Navigator.canPop(context)) Navigator.pop(context);
          },
        ),
        title: const Text(
          'Offers & Discounts',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontFamily: 'serif', fontSize: 20),
        ),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: Colors.black87),
            onPressed: () {},
          ),
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.shopping_cart_outlined, color: Colors.black87),
                onPressed: () {},
              ),
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: AppColors.secondary,
                    shape: BoxShape.circle,
                  ),
                  child: const Text('3', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Location Row
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8),
              child: Row(
                children: [
                  const Icon(Icons.location_on, color: AppColors.secondary, size: 18),
                  const SizedBox(width: 8),
                  const Text('Deliver to 34 Union Avenue, Patiala', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
                  const SizedBox(width: 4),
                  Icon(Icons.keyboard_arrow_down, color: AppColors.secondary.withOpacity(0.8), size: 18),
                ],
              ),
            ),
            
            // Promo Code Input
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8),
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 12.0),
                      child: Icon(Icons.local_activity_outlined, color: Colors.black54, size: 20),
                    ),
                    Expanded(
                      child: TextField(
                        decoration: InputDecoration(
                          hintText: 'Enter promo code',
                          hintStyle: TextStyle(color: Colors.grey.shade500, fontSize: 14),
                          border: InputBorder.none,
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                      ),
                    ),
                    Container(
                      margin: const EdgeInsets.only(right: 4),
                      child: ElevatedButton(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.secondary,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 0),
                          minimumSize: const Size(0, 40),
                        ),
                        child: const Text('APPLY', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            // Hero Banner Carousel
            const SizedBox(height: 12),
            SizedBox(
              height: 200,
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) => setState(() => _currentHeroIndex = index),
                itemCount: 4, // 4 pages as per dots
                itemBuilder: (context, index) {
                  return _buildHeroBanner();
                },
              ),
            ),
            const SizedBox(height: 12),
            // Carousel Indicators
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(4, (index) {
                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _currentHeroIndex == index ? AppColors.secondary : Colors.grey.shade300,
                  ),
                );
              }),
            ),
            const SizedBox(height: 24),
            
            // Best Offers For You
            _buildSectionHeader('BEST OFFERS FOR YOU'),
            const SizedBox(height: 12),
            SizedBox(
              height: 170,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  _buildOfferCard(
                    iconData: Icons.percent,
                    iconColor: AppColors.secondary,
                    title: 'FLAT \$5 OFF',
                    titleColor: AppColors.secondary,
                    subtitle: 'on orders above \$30',
                    code: 'SAVE5',
                    codeColor: AppColors.secondary,
                  ),
                  _buildOfferCard(
                    iconData: Icons.delivery_dining,
                    iconColor: Colors.orange.shade700,
                    title: 'FREE DELIVERY',
                    titleColor: Colors.orange.shade700,
                    subtitle: 'on orders above \$25',
                    code: 'FREE25',
                    codeColor: Colors.orange.shade700,
                  ),
                  _buildOfferCard(
                    iconData: Icons.shopping_bag,
                    iconColor: Colors.green.shade700,
                    title: '50% OFF',
                    titleColor: Colors.green.shade700,
                    subtitle: 'on your next order',
                    code: 'NEXT50',
                    codeColor: Colors.green.shade700,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            
            // Bank Offers
            _buildSectionHeader('BANK OFFERS'),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade200),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: [
                    _buildBankOfferTile(
                      logo: 'VISA', // Using text for mockup, in real app use image
                      logoColor: Colors.blue.shade800,
                      title: '10% Instant Discount',
                      subtitle: 'on Visa Credit Cards',
                    ),
                    Divider(height: 1, color: Colors.grey.shade200),
                    _buildBankOfferTile(
                      logo: 'Mastercard', 
                      logoColor: Colors.red.shade600,
                      title: '10% Instant Discount',
                      subtitle: 'on Mastercard Credit Cards',
                      isMastercard: true,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            
            // More Ways To Save
            _buildSectionHeader('MORE WAYS TO SAVE'),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade200),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: [
                    _buildMoreWaysTile(Icons.stars_outlined, 'Loyalty Rewards', 'Earn points on every order & redeem exciting rewards'),
                    Divider(height: 1, color: Colors.grey.shade200),
                    _buildMoreWaysTile(Icons.card_giftcard, 'Refer & Earn', 'Invite your friends and both get \$10 off'),
                    Divider(height: 1, color: Colors.grey.shade200),
                    _buildMoreWaysTile(Icons.workspace_premium_outlined, 'Lassi Lounge Club', 'Join our club & get exclusive member benefits', iconColor: Colors.orange),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          Row(
            children: [
              const Text('View All', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 12)),
              const SizedBox(width: 2),
              Icon(Icons.chevron_right, color: AppColors.secondary.withOpacity(0.8), size: 16),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildHeroBanner() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        // Mocking the dark red/brown gradient background
        gradient: LinearGradient(
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
          colors: [
            const Color(0xFF4A0000), // Dark red
            Colors.orange.shade900,
          ],
        ),
        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 8, offset: Offset(0, 4))],
      ),
      child: Stack(
        children: [
          // Mock food image on the right (Using a placeholder icon since we don't have the exact paneer tikka image)
          Positioned(
            right: -20,
            bottom: -20,
            child: Opacity(
              opacity: 0.8,
              child: Icon(Icons.restaurant_menu, size: 180, color: Colors.orange.shade200),
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Exclusive Offer Badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.amber,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text('EXCLUSIVE OFFER', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.black87)),
                ),
                const SizedBox(height: 12),
                const Text('Get FLAT', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w500)),
                const Text('20% OFF', style: TextStyle(color: Colors.amber, fontSize: 36, fontWeight: FontWeight.bold, height: 1.1)),
                const Text('on your first order', style: TextStyle(color: Colors.white, fontSize: 14)),
                const SizedBox(height: 12),
                
                // Code Box
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.white54, width: 1, style: BorderStyle.solid), // Dashed border is tricky in basic containers, using solid for now
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('Code: ', style: TextStyle(color: Colors.white70, fontSize: 12)),
                      Text('LASSI20', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                      SizedBox(width: 8),
                      Icon(Icons.copy, color: Colors.white, size: 14),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                const Text('Min. order \$25  •  T&C Apply', style: TextStyle(color: Colors.white70, fontSize: 10)),
              ],
            ),
          ),
          // Decorative stars
          const Positioned(top: 20, left: 140, child: Icon(Icons.star, color: Colors.amber, size: 16)),
          const Positioned(top: 10, left: 170, child: Icon(Icons.star, color: Colors.amber, size: 12)),
          const Positioned(bottom: 20, left: 160, child: Icon(Icons.star, color: Colors.amber, size: 14)),
        ],
      ),
    );
  }

  Widget _buildOfferCard({
    required IconData iconData,
    required Color iconColor,
    required String title,
    required Color titleColor,
    required String subtitle,
    required String code,
    required Color codeColor,
  }) {
    return Container(
      width: 150,
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: codeColor.withOpacity(0.3)),
        boxShadow: [BoxShadow(color: codeColor.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2))],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(iconData, color: iconColor, size: 24),
          ),
          const SizedBox(height: 12),
          Text(title, style: TextStyle(color: titleColor, fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 4),
          Text(subtitle, textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey, fontSize: 11)),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              border: Border.all(color: codeColor, width: 1),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Code: ', style: TextStyle(color: Colors.grey.shade600, fontSize: 10)),
                Text(code, style: TextStyle(color: codeColor, fontSize: 10, fontWeight: FontWeight.bold)),
                const SizedBox(width: 4),
                Icon(Icons.copy, color: codeColor, size: 10),
              ],
            ),
          ),
          const SizedBox(height: 8),
          const Text('Valid till 31 May 2025', style: TextStyle(color: Colors.grey, fontSize: 9)),
        ],
      ),
    );
  }

  Widget _buildBankOfferTile({
    required String logo,
    required Color logoColor,
    required String title,
    required String subtitle,
    bool isMastercard = false,
  }) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          // Mock logo
          Container(
            width: 40,
            alignment: Alignment.center,
            child: isMastercard 
              ? Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(width: 16, height: 16, decoration: BoxDecoration(color: Colors.red, shape: BoxShape.circle)),
                    Transform.translate(offset: const Offset(-6, 0), child: Container(width: 16, height: 16, decoration: BoxDecoration(color: Colors.orange.withOpacity(0.8), shape: BoxShape.circle))),
                  ],
                )
              : Text(logo, style: TextStyle(color: logoColor, fontWeight: FontWeight.bold, fontStyle: FontStyle.italic, fontSize: 18)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
                const SizedBox(height: 2),
                Text(subtitle, style: const TextStyle(color: Colors.grey, fontSize: 11)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.green.shade50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text('Up to \$10', style: TextStyle(color: Colors.green.shade700, fontWeight: FontWeight.bold, fontSize: 10)),
          ),
        ],
      ),
    );
  }

  Widget _buildMoreWaysTile(IconData icon, String title, String subtitle, {Color iconColor = AppColors.secondary}) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: iconColor.withOpacity(0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: iconColor, size: 20),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
      subtitle: Text(subtitle, style: const TextStyle(color: Colors.grey, fontSize: 11)),
      trailing: Icon(Icons.chevron_right, color: Colors.grey.shade400, size: 20),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    );
  }
}
