import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/services/coupon_service.dart';
import 'package:single_restaurant_mobile/services/loyalty_service.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/checkout_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/screens/cart_screen.dart';
import 'package:single_restaurant_mobile/screens/loyalty_rewards_screen.dart';
import 'package:single_restaurant_mobile/screens/referral_screen.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';

class OffersScreen extends StatefulWidget {
  const OffersScreen({super.key});

  @override
  State<OffersScreen> createState() => _OffersScreenState();
}

class _OffersScreenState extends State<OffersScreen> {
  final PageController _pageController = PageController();
  int _currentHeroIndex = 0;
  List<dynamic> _coupons = [];
  bool _isLoading = true;
  final TextEditingController _promoController = TextEditingController();
  bool _isApplying = false;
  int _ordersCount = 0;

  @override
  void initState() {
    super.initState();
    _fetchCoupons();
  }

  Future<void> _fetchCoupons() async {
    final coupons = await CouponService().getCoupons(activeOnly: true);
    final history = await LoyaltyService().getLoyaltyHistory();
    
    int ordersCount = 0;
    if (history != null && history['data'] != null && history['data']['ordersCount'] != null) {
      ordersCount = history['data']['ordersCount'];
    }

    if (mounted) {
      setState(() {
        _coupons = coupons;
        _ordersCount = ordersCount;
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    _promoController.dispose();
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
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.secondary))
          : SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Promo Code Input
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16),
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border.all(color: AppColors.secondary.withOpacity(0.5)),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [BoxShadow(color: AppColors.secondary.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
                ),
                child: Row(
                  children: [
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 12.0),
                      child: Icon(Icons.local_activity_outlined, color: AppColors.secondary, size: 24),
                    ),
                    Expanded(
                      child: TextField(
                        controller: _promoController,
                        decoration: InputDecoration(
                          hintText: 'Enter promo code',
                          hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 15),
                          border: InputBorder.none,
                          isDense: true,
                        ),
                      ),
                    ),
                    ElevatedButton(
                      onPressed: () async {
                        if (_promoController.text.trim().isEmpty) return;
                        
                        final checkout = Provider.of<CheckoutProvider>(context, listen: false);
                        final cart = Provider.of<CartProvider>(context, listen: false);
                        
                        if (cart.items.isEmpty) {
                          ToastUtils.showError(context, 'Add items to cart first');
                          return;
                        }
                        
                        setState(() => _isApplying = true);
                        checkout.setCouponCode(_promoController.text.trim());
                        
                        try {
                          await checkout.handleApplyCoupon(cart);
                          if (mounted) {
                            ToastUtils.showSuccess(context, 'Coupon applied successfully!');
                            if (Navigator.canPop(context)) Navigator.pop(context);
                          }
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(e.toString().replaceAll('Exception: ', '')),
                                backgroundColor: Colors.red.shade800,
                              ),
                            );
                          }
                        } finally {
                          if (mounted) setState(() => _isApplying = false);
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.secondary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        elevation: 0,
                      ),
                      child: _isApplying ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('APPLY', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 0.5)),
                    ),
                  ],
                ),
              ),
            ),
            
            // Hero Banner Carousel
            const SizedBox(height: 12),
            if (_coupons.isNotEmpty)
              SizedBox(
                height: 220,
                child: PageView.builder(
                  controller: _pageController,
                  onPageChanged: (index) => setState(() => _currentHeroIndex = index),
                  itemCount: _coupons.length > 3 ? 3 : _coupons.length,
                  itemBuilder: (context, index) {
                    return _buildHeroBanner(_coupons[index]);
                  },
                ),
              ),
            if (_coupons.isNotEmpty)
              const SizedBox(height: 12),
            if (_coupons.isNotEmpty)
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(_coupons.length > 3 ? 3 : _coupons.length, (index) {
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
            if (_coupons.isEmpty)
               const Padding(padding: EdgeInsets.all(16), child: Text("No offers available at the moment.")),
            if (_coupons.isNotEmpty)
              SizedBox(
                height: 190,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _coupons.length,
                  itemBuilder: (context, index) {
                    final coupon = _coupons[index];
                    IconData iData = Icons.local_offer;
                    if (coupon['type'] == 'percentage') {
                      iData = Icons.percent;
                    } else if (coupon['description']?.toString().toLowerCase().contains('delivery') ?? false) {
                      iData = Icons.delivery_dining;
                    }
                    
                    return OfferCardWidget(
                      coupon: coupon,
                      iconData: iData,
                      iconColor: AppColors.secondary,
                      title: coupon['type'] == 'percentage' ? '${coupon['value']}% OFF' : '\$${coupon['value']} OFF',
                      titleColor: AppColors.secondary,
                      subtitle: coupon['minCartValue'] > 0 ? 'on orders above \$${coupon['minCartValue']}' : coupon['description'] ?? 'Exclusive offer',
                      code: coupon['code'],
                      codeColor: AppColors.secondary,
                      onInfoTap: () => _showCouponTerms(context, coupon),
                    );
                  }
                ),
              ),
            const SizedBox(height: 24),
            
            // Bank Offers
            _buildSectionHeader('BANK OFFERS'),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  border: Border.all(color: Colors.grey.shade200),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Column(
                    children: [
                      Icon(Icons.credit_card_off_outlined, size: 48, color: Colors.grey.shade400),
                      const SizedBox(height: 12),
                      Text('No Bank Offers Available', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade700, fontSize: 16)),
                      const SizedBox(height: 4),
                      Text('Check back later for exciting bank discounts.', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                    ],
                  ),
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
                child: Consumer<RestaurantProvider>(
                  builder: (context, restProv, _) {
                    final isLoyaltyEnabled = restProv.restaurant?['loyaltySettings']?['enabled'] ?? true;
                    return Column(
                      children: [
                        if (isLoyaltyEnabled) ...[
                          _buildMoreWaysTile(Icons.stars_outlined, 'Loyalty Rewards', 'Earn points on every order & redeem exciting rewards'),
                          Divider(height: 1, color: Colors.grey.shade200),
                        ],
                        _buildMoreWaysTile(Icons.card_giftcard, 'Refer & Earn', 'Invite your friends and both get \$10 off'),
                        Divider(height: 1, color: Colors.grey.shade200),
                        _buildMoreWaysTile(Icons.workspace_premium_outlined, 'Lassi Lounge Club', 'Join our club & get exclusive member benefits', iconColor: Colors.orange),
                      ],
                    );
                  }
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
      child: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 1.2, color: Colors.black87)),
    );
  }

  Widget _buildHeroBanner(dynamic coupon) {
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
                Text(coupon['type'] == 'percentage' ? '${coupon['value']}% OFF' : '\$${coupon['value']} OFF', style: const TextStyle(color: Colors.amber, fontSize: 36, fontWeight: FontWeight.bold, height: 1.1)),
                Text(coupon['firstOrderOnly'] == true ? 'on your first order' : (coupon['description'] ?? 'Limited time offer'), style: const TextStyle(color: Colors.white, fontSize: 14)),
                const SizedBox(height: 12),
                
                // Code Box
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.white54, width: 1, style: BorderStyle.solid), // Dashed border is tricky in basic containers, using solid for now
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('Code: ', style: TextStyle(color: Colors.white70, fontSize: 12)),
                      Text(coupon['code'], style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                      const SizedBox(width: 8),
                      const Icon(Icons.copy, color: Colors.white, size: 14),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Text('Min. order \$${coupon['minCartValue'] ?? 0}  •  T&C Apply', style: const TextStyle(color: Colors.white70, fontSize: 10)),
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

  // _buildOfferCard removed, replaced by OfferCardWidget

  void _showCouponTerms(BuildContext context, dynamic coupon) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Column(
            children: [
              const Text('Terms & Conditions', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              const SizedBox(height: 4),
              Text('Code: ${coupon['code']}', style: TextStyle(color: AppColors.secondary, fontSize: 14, fontWeight: FontWeight.bold)),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildTermItem(coupon['description'] ?? 'Applies to your order based on cart value.'),
                if ((coupon['minCartValue'] ?? 0) > 0)
                  _buildTermItem('Minimum order value of \$${coupon['minCartValue']} is required.'),
                if (coupon['firstOrderOnly'] == true)
                  _buildTermItem('Valid for first-time orders only.'),
                if ((coupon['maxDiscount'] ?? 0) > 0)
                  _buildTermItem('Maximum discount capped at \$${coupon['maxDiscount']}.'),
                if (coupon['allowedPaymentMethods'] != null && (coupon['allowedPaymentMethods'] as List).isNotEmpty && !((coupon['allowedPaymentMethods'] as List).contains('All')))
                  _buildTermItem('Valid only for payments via ${(coupon['allowedPaymentMethods'] as List).join(', ')}.'),
                if ((coupon['minOrdersRequired'] ?? 0) > 0)
                  _buildTermItem('Requires a minimum of ${coupon['minOrdersRequired']} past orders to unlock.'),
                _buildTermItem('Only one coupon can be applied per order. Not valid with other offers.'),
                
                const SizedBox(height: 16),
                Builder(
                  builder: (context) {
                    final bool isFirstOrderError = coupon['firstOrderOnly'] == true && _ordersCount > 0;
                    final bool isMinOrdersError = (coupon['minOrdersRequired'] ?? 0) > 0 && _ordersCount < coupon['minOrdersRequired'];

                    if (isFirstOrderError) {
                      return Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.red.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red.shade200),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.info, color: Colors.red.shade700, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'You are not eligible for this coupon as it is for first-time orders only.',
                                style: TextStyle(color: Colors.red.shade900, fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                      );
                    }

                    if (isMinOrdersError) {
                      return Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.red.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red.shade200),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.info, color: Colors.red.shade700, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'You need at least ${coupon['minOrdersRequired']} past orders to use this coupon. (You have $_ordersCount).',
                                style: TextStyle(color: Colors.red.shade900, fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                      );
                    }

                    return Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.green.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.green.shade200),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.info, color: Colors.green.shade700, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'You are eligible to use this coupon on your next applicable order!',
                              style: TextStyle(color: Colors.green.shade900, fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ],
        );
      },
    );
  }

  Widget _buildTermItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.check_circle, color: Colors.green, size: 16),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 13, color: Colors.black87))),
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
      onTap: () {
        if (title == 'Loyalty Rewards') {
          Navigator.push(context, MaterialPageRoute(builder: (context) => const LoyaltyRewardsScreen()));
        } else if (title == 'Refer & Earn') {
          Navigator.push(context, MaterialPageRoute(builder: (context) => const ReferralScreen()));
        } else if (title == 'Lassi Lounge Club') {
          ToastUtils.showInfo(context, 'This feature is coming soon!');
        }
      },
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

class OfferCardWidget extends StatefulWidget {
  final dynamic coupon;
  final IconData iconData;
  final Color iconColor;
  final String title;
  final Color titleColor;
  final String subtitle;
  final String code;
  final Color codeColor;
  final VoidCallback onInfoTap;

  const OfferCardWidget({
    Key? key,
    required this.coupon,
    required this.iconData,
    required this.iconColor,
    required this.title,
    required this.titleColor,
    required this.subtitle,
    required this.code,
    required this.codeColor,
    required this.onInfoTap,
  }) : super(key: key);

  @override
  State<OfferCardWidget> createState() => _OfferCardWidgetState();
}

class _OfferCardWidgetState extends State<OfferCardWidget> {
  bool _isCopied = false;

  void _copyCode() {
    Clipboard.setData(ClipboardData(text: widget.code));
    setState(() => _isCopied = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _isCopied = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 150,
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: widget.codeColor.withOpacity(0.3)),
        boxShadow: [BoxShadow(color: widget.codeColor.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2))],
      ),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: widget.iconColor.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(widget.iconData, color: widget.iconColor, size: 24),
              ),
              const SizedBox(height: 12),
              Text(widget.title, style: TextStyle(color: widget.titleColor, fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 4),
              Text(widget.subtitle, textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey, fontSize: 11), maxLines: 2, overflow: TextOverflow.ellipsis),
              const Spacer(),
              GestureDetector(
                onTap: _copyCode,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: _isCopied ? Colors.green.shade50 : Colors.transparent,
                    border: Border.all(color: _isCopied ? Colors.green : widget.codeColor, width: 1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_isCopied ? 'COPIED' : 'Code: ', style: TextStyle(color: _isCopied ? Colors.green : Colors.grey.shade600, fontSize: 10, fontWeight: _isCopied ? FontWeight.bold : FontWeight.normal)),
                        if (!_isCopied) Text(widget.code, style: TextStyle(color: widget.codeColor, fontSize: 10, fontWeight: FontWeight.bold)),
                        const SizedBox(width: 4),
                        Icon(_isCopied ? Icons.check : Icons.copy, color: _isCopied ? Colors.green : widget.codeColor, size: 10),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(widget.coupon['endDate'] != null ? 'Valid till ${DateTime.parse(widget.coupon['endDate']).day}/${DateTime.parse(widget.coupon['endDate']).month}/${DateTime.parse(widget.coupon['endDate']).year}' : 'Limited time offer', style: const TextStyle(color: Colors.grey, fontSize: 9)),
            ],
          ),
          Positioned(
            top: -8,
            right: -8,
            child: GestureDetector(
              onTap: widget.onInfoTap,
              behavior: HitTestBehavior.opaque,
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: Icon(Icons.info_outline, size: 16, color: Colors.grey.shade700),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
