import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/checkout_provider.dart';
import 'package:single_restaurant_mobile/screens/cart_screen.dart';
import 'package:single_restaurant_mobile/screens/search_screen.dart';
import 'package:single_restaurant_mobile/services/coupon_service.dart';
import 'package:single_restaurant_mobile/services/loyalty_service.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';
import 'package:single_restaurant_mobile/widgets/offers/offer_card_item.dart';
import 'package:single_restaurant_mobile/widgets/offers/offer_extra_sections.dart';
import 'package:single_restaurant_mobile/widgets/offers/offer_hero_banner.dart';
import 'package:single_restaurant_mobile/widgets/offers/offer_promo_bar.dart';
import 'package:single_restaurant_mobile/widgets/offers/offer_terms_dialog.dart';

class OffersScreen extends StatefulWidget {
  final VoidCallback? onBack;

  const OffersScreen({super.key, this.onBack});

  @override
  State<OffersScreen> createState() => _OffersScreenState();
}

class _OffersScreenState extends State<OffersScreen> {
  final PageController _pageController = PageController();
  final TextEditingController _promoController = TextEditingController();

  int _currentHeroIndex = 0;
  List<dynamic> _coupons = [];
  bool _isLoading = true;
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
    final count = (history?['data']?['ordersCount'] as num?)?.toInt() ?? 0;
    if (mounted) {
      setState(() {
        _coupons = coupons;
        _ordersCount = count;
        _isLoading = false;
      });
    }
  }

  Future<void> _handleApplyPromo() async {
    final text = _promoController.text.trim();
    if (text.isEmpty) return;
    final checkout = Provider.of<CheckoutProvider>(context, listen: false);
    final cart = Provider.of<CartProvider>(context, listen: false);
    if (cart.items.isEmpty) {
      ToastUtils.showError(context, 'Add items to cart first');
      return;
    }
    setState(() => _isApplying = true);
    checkout.setCouponCode(text);
    try {
      await checkout.handleApplyCoupon(cart);
      if (mounted) {
        ToastUtils.showSuccess(context, 'Coupon applied successfully!');
        if (Navigator.canPop(context)) Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ToastUtils.showError(context, e.toString().replaceAll('Exception: ', ''));
      }
    } finally {
      if (mounted) setState(() => _isApplying = false);
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
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF8B1E1E)),
          onPressed: () {
            if (widget.onBack != null) {
              widget.onBack!();
            } else if (Navigator.canPop(context)) {
              Navigator.pop(context);
            }
          },
        ),
        title: const Text(
          'Offers & Discounts',
          style: TextStyle(
            color: Color(0xFF1E1E1E),
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: Color(0xFF8B1E1E)),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SearchScreen()),
              );
            },
          ),
          Consumer<CartProvider>(
            builder: (context, cart, _) {
              final itemCount = cart.items.fold(0, (sum, i) => sum + (i['quantity'] as int));
              return Stack(
                alignment: Alignment.center,
                children: [
                  IconButton(
                    icon: const Icon(Icons.shopping_cart_outlined, color: Color(0xFF8B1E1E)),
                    onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen())),
                  ),
                  if (itemCount > 0)
                    Positioned(
                      right: 8,
                      top: 8,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(color: Color(0xFF8B1E1E), shape: BoxShape.circle),
                        child: Text('$itemCount', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                    ),
                ],
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF8B1E1E)),
            )
          : SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. Promo Code Input Bar
                  OfferPromoBar(
                    controller: _promoController,
                    isApplying: _isApplying,
                    onApply: _handleApplyPromo,
                  ),

                  // 2. Dynamic Hero Banner Carousel
                  if (_coupons.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    SizedBox(
                      height: 195,
                      child: PageView.builder(
                        controller: _pageController,
                        onPageChanged: (i) => setState(() => _currentHeroIndex = i),
                        itemCount: _coupons.length > 5 ? 5 : _coupons.length,
                        itemBuilder: (context, index) {
                          return OfferHeroBanner(coupon: _coupons[index]);
                        },
                      ),
                    ),
                    const SizedBox(height: 10),
                    // Centered Carousel Dots
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        _coupons.length > 5 ? 5 : _coupons.length,
                        (index) {
                          final bool isActive = _currentHeroIndex == index;
                          return AnimatedContainer(
                            duration: const Duration(milliseconds: 250),
                            margin: const EdgeInsets.symmetric(horizontal: 3),
                            width: isActive ? 16 : 6,
                            height: 6,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(3),
                              color: isActive
                                  ? const Color(0xFF8B1E1E)
                                  : Colors.grey.shade300,
                            ),
                          );
                        },
                      ),
                    ),
                  ],

                  const SizedBox(height: 22),

                  // 3. Best Offers For You Section
                  _buildSectionHeader('BEST OFFERS FOR YOU', showViewAll: true),
                  const SizedBox(height: 10),
                  if (_coupons.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: Text(
                        'No offers available at the moment.',
                        style: TextStyle(color: Colors.grey, fontSize: 13),
                      ),
                    )
                  else
                    SizedBox(
                      height: 195,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: _coupons.length,
                        itemBuilder: (context, index) {
                          final coupon = _coupons[index];
                          return OfferCardItem(
                            coupon: coupon,
                            onInfoTap: () => OfferTermsDialog.show(
                              context,
                              coupon,
                              _ordersCount,
                            ),
                          );
                        },
                      ),
                    ),

                  const SizedBox(height: 24),

                  // 4. Bank Offers Section
                  _buildSectionHeader('BANK OFFERS'),
                  const SizedBox(height: 10),
                  const BankOffersCard(),

                  const SizedBox(height: 24),

                  // 5. More Ways to Save Section
                  _buildSectionHeader('MORE WAYS TO SAVE'),
                  const SizedBox(height: 10),
                  const MoreWaysToSaveCard(),

                  const SizedBox(height: 36),
                ],
              ),
            ),
    );
  }

  Widget _buildSectionHeader(String title, {bool showViewAll = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 13.5,
                letterSpacing: 0.8,
                color: Color(0xFF1E1E1E),
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (showViewAll)
            const Text(
              'View All >',
              style: TextStyle(
                color: Color(0xFF8B1E1E),
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
        ],
      ),
    );
  }
}
