import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/address_provider.dart';
import 'package:single_restaurant_mobile/screens/menu_screen.dart';
import 'package:single_restaurant_mobile/services/coupon_service.dart';
import 'package:single_restaurant_mobile/theme/app_responsive.dart';
import 'package:single_restaurant_mobile/theme/app_spacing.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';
import 'package:single_restaurant_mobile/widgets/empty_state_widget.dart';
import 'package:single_restaurant_mobile/widgets/home/home_app_bar.dart';
import 'package:single_restaurant_mobile/widgets/home/home_categories_carousel.dart';
import 'package:single_restaurant_mobile/widgets/home/home_delivery_partners.dart';
import 'package:single_restaurant_mobile/widgets/home/home_hero_banner.dart';
import 'package:single_restaurant_mobile/widgets/home/home_location_sheet.dart';
import 'package:single_restaurant_mobile/widgets/home/home_promo_cards.dart';
import 'package:single_restaurant_mobile/widgets/home/home_section_title.dart';
import 'package:single_restaurant_mobile/widgets/home/home_signature_dishes_carousel.dart';
import 'package:single_restaurant_mobile/widgets/common/app_bottom_sheet.dart';
import 'package:single_restaurant_mobile/widgets/menu/menu_category_strip.dart';
import 'package:single_restaurant_mobile/widgets/shimmer_loading.dart';
import 'package:visibility_detector/visibility_detector.dart';

class HomeScreen extends StatefulWidget {
  final void Function(int tabIndex, {String? categoryId})? onNavigateTab;
  const HomeScreen({super.key, this.onNavigateTab});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with TickerProviderStateMixin {
  Map<String, dynamic>? _activeCoupon;
  late AnimationController _logoController;
  late Animation<double> _logoScaleAnimation;

  void _navigateToMenu([String? categoryId]) {
    if (widget.onNavigateTab != null) {
      widget.onNavigateTab!(1, categoryId: categoryId);
    } else {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => MenuScreen(initialCategoryId: categoryId),
        ),
      );
    }
  }

  void _onHeroSlideTap(int index) {
    final categories = context.read<RestaurantProvider>().menu;
    String? targetId;
    if (index == 0) {
      targetId = _findCategory(categories, ['veg main', 'main course', 'curry']);
    } else if (index == 1) {
      targetId = _findCategory(categories, ['rice dishes', 'biryani']);
    } else if (index == 2) {
      targetId = _findCategory(categories, ['beverage', 'drink', 'lassi']);
    }
    _navigateToMenu(targetId);
  }

  String? _findCategory(List<dynamic> categories, List<String> keywords) {
    for (var cat in categories) {
      final name = (cat['name'] ?? '').toString().toLowerCase();
      if (keywords.any((k) => name.contains(k))) return cat['_id']?.toString();
    }
    return null;
  }

  @override
  void initState() {
    super.initState();
    _fetchActiveCoupon();
    if (VisibilityDetectorController.instance.updateInterval !=
        Duration.zero) {
      VisibilityDetectorController.instance.updateInterval =
          const Duration(milliseconds: 50);
    }

    _logoController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _logoScaleAnimation = TweenSequence([
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.7, end: 1.15)
            .chain(CurveTween(curve: Curves.easeOutCubic)),
        weight: 30,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.15, end: 1.0)
            .chain(CurveTween(curve: Curves.elasticOut)),
        weight: 70,
      ),
    ]).animate(_logoController);

    _logoController.forward();
  }

  @override
  void dispose() {
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
      debugPrint('Failed to load active coupon: $e');
    }
  }

  void _onLocationTap() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final addressProvider =
        Provider.of<AddressProvider>(context, listen: false);

    if (authProvider.isAuthenticated) {
      if (addressProvider.addresses.isEmpty) {
        addressProvider.fetchAddresses();
      }
      HomeLocationSheet.show(context);
    } else {
      ToastUtils.showError(context, 'Please login to select address');
    }
  }

  void _showCategoriesPopup(BuildContext context, List<dynamic> categories) {
    final isTablet = AppResponsive.isTablet(context);
    final columns = isTablet ? 5 : 3;

    AppBottomSheet.show(
      context: context,
      builder: (bottomSheetContext) {
        return AppBottomSheet(
          title: 'All Categories',
          padding: EdgeInsets.zero,
          child: GridView.builder(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical: AppSpacing.md,
            ),
            shrinkWrap: true,
            physics: const ClampingScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: columns,
              childAspectRatio: 0.65,
              crossAxisSpacing: AppSpacing.md,
              mainAxisSpacing: AppSpacing.md,
            ),
            itemCount: categories.length,
            itemBuilder: (context, index) {
              final cat = categories[index];
              return GestureDetector(
                onTap: () {
                  Navigator.pop(bottomSheetContext);
                  _navigateToMenu(cat['_id']);
                },
                child: CategoryItemView(
                  name: cat['name'] ?? '',
                  category: cat,
                  isSelected: false,
                  inGrid: true,
                ),
              );
            },
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    _logoController.forward(from: 0.0);

    final textScaler = MediaQuery.textScalerOf(context);
    final scale = (textScaler.scale(14.0) / 14.0).clamp(1.0, 1.35);
    final scaledHeight = 192.0 + (scale - 1.0) * 70.0;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: HomeAppBar(
        logoScaleAnimation: _logoScaleAnimation,
        logoController: _logoController,
        onLocationTap: _onLocationTap,
        preferredHeight: scaledHeight,
      ),
      body: Consumer<RestaurantProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.restaurant == null) {
            return const HomeShimmer();
          }

          if (provider.error != null && provider.restaurant == null) {
            return EmptyStateWidget(
              icon: Icons.error_outline,
              title: 'Oops! Something went wrong',
              subtitle:
                  'We couldn\'t load the restaurant data. Please try again later.\n${provider.error}',
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
              child: ResponsiveCenter(
                maxWidth: AppResponsive.maxContentWidth,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    HomeHeroBanner(
                      restaurant: restaurant,
                      onOrderNow: () => _navigateToMenu(),
                      onSlideTap: _onHeroSlideTap,
                    ),
                    const SizedBox(height: 12),
                    if (categories.isNotEmpty) ...[
                      HomeSectionTitle(
                        title: 'CATEGORIES',
                        onViewAll: () =>
                            _showCategoriesPopup(context, categories),
                      ),
                      HomeCategoriesCarousel(
                        categories: categories,
                        onCategoryTap: (catId) => _navigateToMenu(catId),
                      ),
                      const SizedBox(height: 18),
                    ],
                    HomePromoCardsCarousel(activeCoupon: _activeCoupon),
                    const SizedBox(height: 18),
                    const HomeDeliveryPartners(),
                    const SizedBox(height: 24),
                    if (signatureDishes.isNotEmpty) ...[
                      HomeSectionTitle(
                        title: 'OUR SIGNATURE DISHES',
                        onViewAll: () => _navigateToMenu(),
                      ),
                      HomeSignatureDishesCarousel(dishes: signatureDishes),
                      const SizedBox(height: 32),
                    ],
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
