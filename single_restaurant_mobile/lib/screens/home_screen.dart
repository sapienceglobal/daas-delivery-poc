import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:single_restaurant_mobile/screens/item_detail_screen.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/address_provider.dart';
import 'package:single_restaurant_mobile/providers/notification_provider.dart';
import 'package:single_restaurant_mobile/screens/saved_addresses_screen.dart';
import 'package:single_restaurant_mobile/screens/search_screen.dart';
import 'package:single_restaurant_mobile/screens/menu_screen.dart';
import 'package:single_restaurant_mobile/screens/cart_screen.dart';
import 'package:single_restaurant_mobile/screens/loyalty_rewards_screen.dart';
import 'package:single_restaurant_mobile/screens/delivery_partners_screen.dart';
import 'package:single_restaurant_mobile/providers/loyalty_provider.dart';
import 'package:single_restaurant_mobile/utils/cart_helper.dart';
import 'package:single_restaurant_mobile/utils/image_helper.dart';
import 'package:single_restaurant_mobile/screens/notifications_screen.dart';
import 'package:single_restaurant_mobile/widgets/shimmer_loading.dart';
import 'package:single_restaurant_mobile/widgets/empty_state_widget.dart';
import 'package:single_restaurant_mobile/services/coupon_service.dart';
import 'package:visibility_detector/visibility_detector.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with TickerProviderStateMixin {
  Map<String, dynamic>? _activeCoupon;
// 1. Logo Animation ke liye variables
  late AnimationController _logoController;
  late Animation<double> _logoScaleAnimation;
  @override
  void initState() {
    super.initState();
    _fetchActiveCoupon();
    VisibilityDetectorController.instance.updateInterval = const Duration(milliseconds: 50);
    // 2. Logo Animation ka logic setup karna
    _logoController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200), // 1.2 seconds ka smooth effect
    );
    // Premium Elastic Pop Effect
    _logoScaleAnimation = TweenSequence([
      // Pehle halke se bada hoga (Scale 0.7 se 1.1 tak)
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.7, end: 1.15)
            .chain(CurveTween(curve: Curves.easeOutCubic)),
        weight: 30,
      ),
      // Phir elastic bounce ke sath normal (1.0) par aayega
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.15, end: 1.0)
            .chain(CurveTween(curve: Curves.elasticOut)),
        weight: 70,
      ),
    ]).animate(_logoController);


 // Animation start karein
  _logoController.forward();
  }
  @override
  void dispose() {
    // 3. Controller ko dispose karna zaroori hai
    _logoController.dispose();
    super.dispose();
  }

  Future<void> _fetchActiveCoupon() async {
    try {
      final coupons = await CouponService().getCoupons(activeOnly: true);
      if (coupons.isNotEmpty) {
        if (mounted) {
          setState(() {
            _activeCoupon = coupons.first;
          });
        }
      }
    } catch (e) {
      print('Failed to load active coupon: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    _logoController.forward(from: 0.0);
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: _buildAppBar(context),
      body: Consumer<RestaurantProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.restaurant == null) {
            return const HomeShimmer();
          }

          if (provider.error != null && provider.restaurant == null) {
            return EmptyStateWidget(
              icon: Icons.error_outline,
              title: 'Oops! Something went wrong',
              subtitle: 'We couldn\'t load the restaurant data. Please try again later.\n${provider.error}',
              actionText: 'Try Again',
              onActionPressed: () => provider.fetchRestaurantData(),
            );
          }

          final restaurant = provider.restaurant;
          final categories = provider.menu;
          final signatureDishes = provider.getSignatureDishes();

          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () => provider.fetchRestaurantData(),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                 
                  _buildHeroBanner(context, restaurant),
                  const SizedBox(height: 24),
                  
                  if (categories.isNotEmpty) ...[
                    _buildSectionTitle('EXPLORE OUR MENU', () {
                      Navigator.push(context, MaterialPageRoute(builder: (context) => const MenuScreen()));
                    }),
                    _buildCategoriesCarousel(categories),
                    const SizedBox(height: 24),
                    _buildPromoCardsCarousel(context),
                    const SizedBox(height: 24),
                  ],

                  _buildDeliveryPartners(context),
                  const SizedBox(height: 24),
                  
                  if (signatureDishes.isNotEmpty) ...[
                    _buildSectionTitle('OUR SIGNATURE DISHES', () {
                      Navigator.push(context, MaterialPageRoute(builder: (context) => const MenuScreen()));
                    }),
                    _buildSignatureDishesCarousel(signatureDishes),
                    const SizedBox(height: 32),
                  ]
                ],
              ),
            ),
          );
        },
      ),
    );
  }

 PreferredSizeWidget _buildAppBar(BuildContext context) {
    return PreferredSize(
      // 👇 1. Height thodi si (2px) badhai hai taaki saans lene ki jagah mile aur overflow na ho
      preferredSize: const Size.fromHeight(142), 
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.background,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04), 
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: SafeArea(
          bottom: false,
          child: Padding(
      
            padding: const EdgeInsets.only(top: 2.0, bottom: 8.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                // ══════ ROW 1: Logo (Left) & Icons (Right) ══════
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 18.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // --- LOGO ---
                  VisibilityDetector(
                        key: const Key('home-screen-logo'),
                        onVisibilityChanged: (visibilityInfo) {
                          if (visibilityInfo.visibleFraction == 0.0) {
                            // 1. Jaise hi aap dusre tab par jayenge, animation chupchap reset ho jayega
                            _logoController.reset();
                          } else if (visibilityInfo.visibleFraction > 0.1) {
                            // 2. Wapas aane par sirf tab chalega jab ye already animate na ho raha ho
                            if (!_logoController.isAnimating && 
                                _logoController.status != AnimationStatus.completed) {
                              _logoController.forward(from: 0.0);
                            }
                          }
                        },
                        child: ScaleTransition(
                          scale: _logoScaleAnimation,
                          // Ye gap control karta hai (0.75 rakha hai taaki address bar upar rahe)
                          child: Align(
                            alignment: Alignment.topCenter,
                            heightFactor: 0.75, 
                            child: Transform.translate(
                              // '-6' ka matlab hai logo 6 pixel upar khisak jayega. 
                              offset: const Offset(0, -8),
                              child: Image.asset(
                                'assets/images/branded/lassi-lounge/Lassi-Lounge-logo.png',
                                height: 90, 
                                fit: BoxFit.contain,
                                errorBuilder: (c, e, s) => const Text(
                                  'LASSI LOUNGE',
                                  style: TextStyle(
                                    color: AppColors.primary,
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.0,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),

                      // --- ACTION ICONS ---
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Search
                          _appBarIconButton(
                            icon: Icons.search_rounded,
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (context) => const SearchScreen()),
                            ),
                          ),
                          const SizedBox(width: 4),

                          // Notifications
                          Consumer<NotificationProvider>(
                            builder: (context, np, _) => Stack(
                              alignment: Alignment.center,
                              children: [
                                _appBarIconButton(
                                  icon: Icons.notifications_none_outlined,
                                  onTap: () => Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                        builder: (context) =>
                                            const NotificationsScreen()),
                                  ),
                                ),
                                if (np.hasUnread)
                                  Positioned(
                                    right: 6,
                                    top: 6,
                                    child: Container(
                                      width: 9,
                                      height: 9,
                                      decoration: const BoxDecoration(
                                        color: Colors.red,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 4),

                          // Cart
                          Consumer<CartProvider>(
                            builder: (context, cart, _) => Stack(
                              alignment: Alignment.center,
                              children: [
                                _appBarIconButton(
                                  icon: Icons.shopping_cart_outlined,
                                  onTap: () => Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                        builder: (context) => const CartScreen()),
                                  ),
                                ),
                                if (cart.itemCount > 0)
                                  Positioned(
                                    right: 4,
                                    top: 4,
                                    child: Container(
                                      padding: const EdgeInsets.all(4),
                                      decoration: const BoxDecoration(
                                        color: Colors.red,
                                        shape: BoxShape.circle,
                                      ),
                                      child: Text(
                                        '${cart.itemCount}',
                                        style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 6), 

                // ══════ ROW 2: Full Width Address Bar ══════
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Consumer2<AddressProvider, AuthProvider>(
                    builder: (context, addressProvider, authProvider, _) {
                      String displayAddress = 'Select Location';
                      String label = 'Deliver to';
                      
                      if (authProvider.isAuthenticated &&
                          addressProvider.addresses.isNotEmpty) {
                        final def = addressProvider.addresses.firstWhere(
                          (a) => a['isDefault'] == true,
                          orElse: () => addressProvider.addresses.first,
                        );
                        displayAddress = def['address'] ?? 'Select Location';
                        label = def['label'] ?? 'Deliver to';
                      }
                      
                      return GestureDetector(
                        onTap: () {
                          if (authProvider.isAuthenticated) {
                            if (addressProvider.addresses.isEmpty) {
                              addressProvider.fetchAddresses();
                            }
                            _showLocationBottomSheet(context, addressProvider);
                          } else {
                            ToastUtils.showError(context, 'Please login to select address');
                          }
                        },
                        child: Container(
                          width: double.infinity, 
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: Colors.white, 
                            borderRadius: BorderRadius.circular(10), 
                            border: Border.all(color: Colors.grey.shade200, width: 1.5),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.grey.withOpacity(0.05),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              )
                            ]
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.location_on, color: Colors.red, size: 22),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      label.toUpperCase(),
                                      style: const TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w700,
                                        color: Colors.red, 
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      displayAddress,
                                      style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textDark,
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                      maxLines: 1,
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.all(4),
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade100,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.keyboard_arrow_down,
                                  color: AppColors.textDark,
                                  size: 18,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Icon button for the header action row
  Widget _appBarIconButton({
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(22),
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Icon(icon, size: 26, color: AppColors.textDark),
      ),
    );
  }

  void _showLocationBottomSheet(BuildContext context, AddressProvider provider) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 12),
            Container(
              width: 48,
              height: 5,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: Colors.grey.shade100)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Select a location', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.close, size: 20, color: Colors.grey.shade800),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: Consumer<AddressProvider>(
                builder: (context, addrProv, _) {
                  if (addrProv.isLoading && addrProv.addresses.isEmpty) {
                    return const Center(child: CircularProgressIndicator(color: Colors.red));
                  }
                  
                  if (addrProv.addresses.isEmpty) {
                    return const Center(child: Text('No saved addresses. Add one below.'));
                  }

                  return ListView.builder(
                    itemCount: addrProv.addresses.length,
                    itemBuilder: (context, index) {
                      final addr = addrProv.addresses[index];
                      final isDefault = addr['isDefault'] == true;
                      
                      return Container(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                        decoration: BoxDecoration(
                          color: isDefault ? Colors.red.shade50 : Colors.white,
                          border: Border.all(color: isDefault ? Colors.red.shade200 : Colors.grey.shade200),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                          leading: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: isDefault ? Colors.red.shade100 : Colors.grey.shade100,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              addr['label']?.toString().toLowerCase() == 'home' ? Icons.home_rounded : Icons.location_on_rounded,
                              color: isDefault ? Colors.red.shade700 : Colors.grey.shade600,
                              size: 24,
                            ),
                          ),
                          title: Text(
                            addr['label'] ?? 'Address', 
                            style: TextStyle(fontWeight: FontWeight.w700, color: Colors.grey.shade900)
                          ),
                          subtitle: Padding(
                            padding: const EdgeInsets.only(top: 4.0),
                            child: Text(
                              addr['address'] ?? '', 
                              maxLines: 2, 
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(color: Colors.grey.shade600, fontSize: 13, height: 1.3),
                            ),
                          ),
                          trailing: isDefault ? Icon(Icons.check_circle_rounded, color: Colors.red.shade700) : null,
                          onTap: () {
                            addrProv.setDefaultAddress(addr['_id']);
                            Navigator.pop(context);
                          },
                        ),
                      );
                    },
                  );
                },
              ),
            ),
            Container(
              padding: EdgeInsets.only(
                left: 16.0, 
                right: 16.0, 
                top: 16.0, 
                bottom: 16.0 + MediaQuery.of(context).padding.bottom
              ),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))],
              ),
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  Navigator.push(context, MaterialPageRoute(builder: (context) => const SavedAddressesScreen(selectingMode: false)));
                },
                icon: const Icon(Icons.add_rounded, color: Colors.white, size: 22),
                label: const Text('ADD NEW ADDRESS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 1)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red.shade900,
                  minimumSize: const Size(double.infinity, 54),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeroBanner(BuildContext context, dynamic restaurant) {
    final bannerUrl = restaurant?['banner'];
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Container(
        height: 200,
        width: double.infinity,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: Colors.grey.shade200,
        ),
        child: Stack(
          children: [
            // Background Image
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: bannerUrl != null && bannerUrl.toString().startsWith('http')
                  ? CachedNetworkImage(
                      imageUrl: bannerUrl,
                      fit: BoxFit.cover,
                      width: double.infinity,
                      height: double.infinity,
                      placeholder: (context, url) => const Center(child: CircularProgressIndicator()),
                      errorWidget: (context, url, error) => Image.asset('assets/images/branded/lassi-lounge/menu-hero.jpg', fit: BoxFit.cover, width: double.infinity, height: double.infinity),
                    )
                  : Image.asset(
                      'assets/images/branded/lassi-lounge/menu-hero.jpg',
                      fit: BoxFit.cover,
                      width: double.infinity,
                      height: double.infinity,
                    ),
            ),
            // Gradient Overlay
            Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: [
                    Colors.black.withOpacity(0.8),
                    Colors.transparent,
                  ],
                ),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'Craving something\ndelicious?',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Get it delivered hot\nand fresh!',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.push(context, MaterialPageRoute(builder: (context) => const MenuScreen()));
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.black,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    ),
                    child: const Text(
                      'ORDER NOW',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title, VoidCallback onViewAll) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
          TextButton(
            onPressed: onViewAll,
            child: const Text(
              'View All',
              style: TextStyle(
                color: Colors.red,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoriesCarousel(List<dynamic> categories) {
    return Column(
      children: [
        SizedBox(
          height: 120,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: categories.length,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemBuilder: (context, index) {
              final category = categories[index];
              final name = category['name'] ?? 'Category';

              return Padding(
                padding: const EdgeInsets.only(right: 16.0),
                child: InkWell(
                  onTap: () {
                    Navigator.push(context, MaterialPageRoute(builder: (context) => MenuScreen(initialCategoryId: category['_id'])));
                  },
                  child: Column(
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.red, width: 2), // Red border like UI
                        ),
                      child: ClipOval(
                        child: ImageHelper.buildCategoryImage(category, fit: BoxFit.cover),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      name,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                ), // Close InkWell
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildDeliveryPartners(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: GestureDetector(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const DeliveryPartnersScreen()),
          );
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16.0),
          decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.red.withOpacity(0.3)),
          color: Colors.white,
        ),
        child: Column(
          children: [
            const Text(
              'DELIVERING WITH',
              style: TextStyle(
                color: Colors.grey,
                fontWeight: FontWeight.bold,
                fontSize: 12,
                letterSpacing: 1.0,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Expanded(
                  child: Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Text('Uber', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold, height: 1.0)),
                          Text('Eats', style: TextStyle(color: Color(0xFF06C167), fontSize: 16, fontWeight: FontWeight.bold, height: 1.0)),
                        ],
                      ),
                    ),
                  ),
                ),
                Container(height: 50, width: 1, color: Colors.red.withOpacity(0.3)),
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SvgPicture.string('''
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="20">
                          <path d="M23.38 8.87a6.25 6.25 0 0 0-4.88-2.31H.69a.66.66 0 0 0-.66.66v2.18a.66.66 0 0 0 .66.66h17.81a1.9 1.9 0 0 1 1.48.69 1.84 1.84 0 0 1 .43 1.54 1.86 1.86 0 0 1-1.39 1.48 2 2 0 0 1-1.74-.29.66.66 0 0 0-.89 1.02 4.19 4.19 0 0 0 2.59 1.07 4.23 4.23 0 0 0 3.23-1.44 4.17 4.17 0 0 0 .97-3.41 4.18 4.18 0 0 0-2.8-3.07z" fill="#FF3008"/>
                          <path d="M12.92 13.91H.69a.66.66 0 0 0-.66.66v2.18a.66.66 0 0 0 .66.66h12.23a.66.66 0 0 0 .66-.66v-2.18a.66.66 0 0 0-.66-.66z" fill="#FF3008"/>
                        </svg>
                      '''),
                      const SizedBox(height: 4),
                      const Text('DOORDASH', style: TextStyle(color: Color(0xFFFF3008), fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                    ],
                  ),
                ),
                Container(height: 50, width: 1, color: Colors.red.withOpacity(0.3)),
                const Expanded(
                  child: Center(
                    child: Text('GRUBHUB', style: TextStyle(color: Color(0xFFFF8000), fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      ),
    );
  }

  Widget _buildSignatureDishesCarousel(List<dynamic> dishes) {
    return SizedBox(
      height: 228,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: dishes.length,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemBuilder: (context, index) {
          final dish = dishes[index];
          final name = dish['name'] ?? 'Dish';
          final price = dish['price']?.toString() ?? '0';

          return GestureDetector(
            onTap: () {
              Navigator.push(context,
                  MaterialPageRoute(builder: (context) => ItemDetailScreen(item: dish)));
            },
            child: Container(
              width: 170,
              margin: const EdgeInsets.only(right: 14, bottom: 4),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.cardShadow,
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Image with heart button
                  Stack(
                    children: [
                      ClipRRect(
                        borderRadius:
                            const BorderRadius.vertical(top: Radius.circular(16)),
                        child: SizedBox(
                          height: 130,
                          width: double.infinity,
                          child: ImageHelper.buildDishImage(dish, fit: BoxFit.cover),
                        ),
                      ),
                      Positioned(
                        top: 8,
                        right: 8,
                        child: Consumer<AuthProvider>(
                          builder: (context, authProvider, _) {
                            final dishId = dish['_id'] ?? dish['id'] ?? '';
                            final isFavorite = authProvider.isFavoriteItem(dishId);
                            return GestureDetector(
                              onTap: () async {
                                if (authProvider.isAuthenticated) {
                                  await authProvider.toggleFavoriteItem(dishId);
                                } else {
                                  ToastUtils.showError(context, 'Please login to add favorites');
                                }
                              },
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(
                                  color: Colors.white,
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                        color: Colors.black12, blurRadius: 4)
                                  ],
                                ),
                                child: Icon(
                                  isFavorite
                                      ? Icons.favorite
                                      : Icons.favorite_border,
                                  color: Colors.red.shade900,
                                  size: 18,
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),

                  // Name + price row — tight padding, no extra bottom space
                  Padding(
                    padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          name,
                          style: const TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 13),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '\u20b9$price',
                              style: const TextStyle(
                                color: Colors.red,
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                              ),
                            ),
                            Consumer<CartProvider>(
                              builder: (context, cart, child) {
                                final dishId = dish['_id'] ?? dish['id'];
                                int totalQty = 0;
                                int lastMatchIndex = -1;
                                for (int i = 0; i < cart.items.length; i++) {
                                  final c = cart.items[i];
                                  if ((c['menuItemId'] ?? c['_id'] ?? c['id']) ==
                                      dishId) {
                                    totalQty +=
                                        (c['quantity'] ?? c['qty'] ?? 1) as int;
                                    lastMatchIndex = i;
                                  }
                                }

                                if (totalQty > 0) {
                                  return Container(
                                    decoration: BoxDecoration(
                                      color: Colors.red.shade50,
                                      border: Border.all(color: Colors.red),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        InkWell(
                                          onTap: () {
                                            if (lastMatchIndex != -1) {
                                              final lastQty = (cart.items[lastMatchIndex]
                                                          ['quantity'] ??
                                                      cart.items[lastMatchIndex]
                                                          ['qty'] ??
                                                      1)
                                                  as int;
                                              cart.updateQuantity(
                                                  lastMatchIndex, lastQty - 1);
                                            }
                                          },
                                          child: const Padding(
                                            padding: EdgeInsets.symmetric(
                                                horizontal: 7, vertical: 3),
                                            child: Icon(Icons.remove,
                                                size: 14, color: Colors.red),
                                          ),
                                        ),
                                        Text('$totalQty',
                                            style: const TextStyle(
                                                fontWeight: FontWeight.bold,
                                                color: Colors.red,
                                                fontSize: 12)),
                                        InkWell(
                                          onTap: () {
                                            final restProv =
                                                Provider.of<RestaurantProvider>(
                                                    context,
                                                    listen: false);
                                            AddToCartHelper.handleAddToCart(
                                                context, dish, cart, restProv);
                                          },
                                          child: const Padding(
                                            padding: EdgeInsets.symmetric(
                                                horizontal: 7, vertical: 3),
                                            child: Icon(Icons.add,
                                                size: 14, color: Colors.red),
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                }

                                return InkWell(
                                  onTap: () {
                                    final restProv =
                                        Provider.of<RestaurantProvider>(context,
                                            listen: false);
                                    AddToCartHelper.handleAddToCart(
                                        context, dish, cart, restProv);
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 10, vertical: 3),
                                    decoration: BoxDecoration(
                                      border: Border.all(color: Colors.red),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: const Text(
                                      'Add +',
                                      style: TextStyle(
                                        color: Colors.red,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 11,
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPromoCardsCarousel(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          if (_activeCoupon != null) WelcomeOfferCard(coupon: _activeCoupon!),
          _buildLoyaltyCard(context),
          _buildFastDeliveryCard(),
        ],
      ),
    );
  }

  Widget _buildLoyaltyCard(BuildContext context) {
    return Consumer<LoyaltyProvider>(
      builder: (context, loyalty, _) {
        final isMember = loyalty.isLoyaltyMember;
        return GestureDetector(
          onTap: () {
            Navigator.push(context, MaterialPageRoute(builder: (context) => const LoyaltyRewardsScreen()));
          },
          child: Container(
            width: 220,
            height: 170,
            margin: const EdgeInsets.only(right: 8),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFFCF4EA), // Light Beige
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.workspace_premium, color: Color(0xFF7A151B), size: 18),
                    const SizedBox(width: 8),
                    const Text('LOYALTY REWARDS', style: TextStyle(color: Color(0xFF7A151B), fontWeight: FontWeight.bold, fontSize: 11, letterSpacing: 0.5)),
                  ],
                ),
                const Spacer(),
                Text(
                  isMember ? 'You have\n${loyalty.currentBalance} Points\nAvailable' : 'Earn Points &\nGet Exclusive\nRewards',
                  style: const TextStyle(color: Colors.black87, fontSize: 16, fontWeight: FontWeight.bold, height: 1.3),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF7A151B),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    isMember ? 'VIEW REWARDS' : 'JOIN NOW',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                )
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildFastDeliveryCard() {
    return Container(
      width: 220,
      height: 170,
      margin: const EdgeInsets.only(right: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1C1A), // Dark Black/Brown
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.two_wheeler, color: Color(0xFFC79854), size: 18), 
              const SizedBox(width: 8),
              const Text('FAST DELIVERY', style: TextStyle(color: Color(0xFFC79854), fontWeight: FontWeight.bold, fontSize: 11, letterSpacing: 1)),
            ],
          ),
          const Spacer(),
          Row(
            children: [
              const Icon(Icons.delivery_dining, color: Color(0xFFC79854), size: 48),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('30-40', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                  const Text('mins', style: TextStyle(color: Colors.white, fontSize: 18, fontFamily: 'serif')),
                ],
              )
            ],
          ),
          const Spacer(),
          const Text('At Your Doorstep', style: TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}
class WelcomeOfferCard extends StatefulWidget {
  final Map<String, dynamic> coupon;
  const WelcomeOfferCard({super.key, required this.coupon});

  @override
  State<WelcomeOfferCard> createState() => _WelcomeOfferCardState();
}

class _WelcomeOfferCardState extends State<WelcomeOfferCard> with SingleTickerProviderStateMixin {
  bool _isCopied = false;
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.1).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.elasticOut,
    ));
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _copyCode() {
    if (_isCopied) return;
    Clipboard.setData(ClipboardData(text: widget.coupon['code']));
    setState(() {
      _isCopied = true;
    });
    _animationController.forward().then((_) => _animationController.reverse());
    
    // Reset back to original text after 3 seconds
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() {
          _isCopied = false;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final coupon = widget.coupon;
    final isPercentage = coupon['type'] == 'percentage';
    final discountStr = isPercentage ? '${coupon['value']}% OFF' : '\$${coupon['value']} OFF';
    final titleStr = coupon['promoType']?.toString().toUpperCase() ?? 'OFFER';
    
    return Container(
      width: 220,
      height: 170,
      margin: const EdgeInsets.only(left: 16, right: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF630A10), // Maroon
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.card_giftcard, color: Color(0xFFE8D090), size: 16),
              const SizedBox(width: 8),
              Text(titleStr, style: const TextStyle(color: Color(0xFFE8D090), fontWeight: FontWeight.bold, fontSize: 11, letterSpacing: 1)),
            ],
          ),
          const Spacer(),
          Text(discountStr, style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900, fontFamily: 'serif')),
          const SizedBox(height: 4),
          Text(coupon['description'] ?? (coupon['firstOrderOnly'] == true ? 'On Your First Order' : 'Limited Time Offer'), style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500)),
          const Spacer(),
          GestureDetector(
            onTap: _copyCode,
            child: ScaleTransition(
              scale: _scaleAnimation,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                decoration: BoxDecoration(
                  color: _isCopied ? const Color(0xFFE8D090) : Colors.transparent,
                  border: Border.all(color: const Color(0xFFE8D090), width: 1.5),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      _isCopied ? 'CODE COPIED!' : 'CODE: ${coupon['code']}', 
                      style: TextStyle(
                        color: _isCopied ? const Color(0xFF630A10) : const Color(0xFFE8D090), 
                        fontWeight: FontWeight.bold, 
                        fontSize: 12
                      )
                    ),
                    if (_isCopied) ...[
                      const SizedBox(width: 4),
                      const Icon(Icons.check_circle, color: Color(0xFF630A10), size: 14),
                    ]
                  ],
                ),
              ),
            ),
          )
        ],
      ),
    );
  }
}
