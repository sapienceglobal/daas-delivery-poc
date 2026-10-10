import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/widgets/menu_item_card.dart';
import 'package:single_restaurant_mobile/widgets/shimmer_loading.dart';
import 'package:single_restaurant_mobile/utils/cart_helper.dart';
import 'package:single_restaurant_mobile/screens/search_screen.dart';
import 'package:single_restaurant_mobile/screens/cart_screen.dart';
import 'package:single_restaurant_mobile/theme/app_responsive.dart';
import 'package:single_restaurant_mobile/theme/app_spacing.dart';
import 'package:single_restaurant_mobile/widgets/common/app_bottom_sheet.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';
import 'package:single_restaurant_mobile/widgets/menu/menu_category_strip.dart';
import 'package:single_restaurant_mobile/widgets/menu/menu_filter_bar.dart';
import 'package:single_restaurant_mobile/widgets/menu/menu_loyalty_banner.dart';

class MenuScreen extends StatefulWidget {
  final String? initialCategoryId;
  final VoidCallback? onBack;
  const MenuScreen({super.key, this.initialCategoryId, this.onBack});

  @override
  State<MenuScreen> createState() => _MenuScreenState();
}

class _MenuScreenState extends State<MenuScreen> {
  String? _selectedCategoryId;
  String _sortOrder = 'Popularity';
  String _vegFilter = 'All';

  @override
  void initState() {
    super.initState();
    _selectedCategoryId = widget.initialCategoryId;
  }

  @override
  void didUpdateWidget(covariant MenuScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialCategoryId != oldWidget.initialCategoryId &&
        widget.initialCategoryId != null) {
      setState(() => _selectedCategoryId = widget.initialCategoryId);
    }
  }

  void _showCategoriesPopup(BuildContext context, List<dynamic> categories) {
    final isTablet = AppResponsive.isTablet(context);
    final columns = isTablet ? 5 : 3;

    AppBottomSheet.show(
      context: context,
      builder: (context) {
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
              final isSelected = cat['_id'] == _selectedCategoryId;
              return GestureDetector(
                onTap: () {
                  setState(() => _selectedCategoryId = cat['_id']);
                  Navigator.pop(context);
                },
                child: CategoryItemView(
                  name: cat['name'] ?? '',
                  category: cat,
                  isSelected: isSelected,
                  inGrid: true,
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildCartIcon() {
    return Consumer<CartProvider>(
      builder: (context, cart, child) {
        final itemCount = cart.items.fold(0, (sum, i) => sum + (i['quantity'] as int));
        return Stack(
          alignment: Alignment.center,
          children: [
            IconButton(
              icon: const Icon(Icons.shopping_cart_outlined, color: Colors.black87),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen())),
            ),
            if (itemCount > 0)
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(color: Colors.red.shade900, shape: BoxShape.circle),
                  child: Text('$itemCount', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                ),
              ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final restaurantProvider = Provider.of<RestaurantProvider>(context);
    final categories = restaurantProvider.menu;

    if (categories.isEmpty) {
      if (restaurantProvider.isLoading) {
        return const MenuShimmer();
      }
      return const Center(child: Text('No menu available.'));
    }

    if (_selectedCategoryId == null && categories.isNotEmpty) {
      _selectedCategoryId = 'all';
    }

    final displayCategories = [
      {'_id': 'all', 'name': 'All'},
      ...categories
    ];

    List<dynamic> items = [];
    if (_selectedCategoryId == 'all') {
      for (var cat in categories) {
        items.addAll(cat['items'] ?? []);
      }
    } else {
      final selectedCategory = categories.firstWhere(
        (c) => c['_id'] == _selectedCategoryId,
        orElse: () => categories[0],
      );
      items = List.from(selectedCategory['items'] ?? []);
    }

    if (_vegFilter == 'Veg') {
      items = items.where((i) => i['isVeg'] == true).toList();
    } else if (_vegFilter == 'Non-Veg') {
      items = items.where((i) => i['isVeg'] == false).toList();
    }

    if (_sortOrder == 'Price: Low to High') {
      items.sort((a, b) => (a['price'] ?? 0).compareTo(b['price'] ?? 0));
    } else if (_sortOrder == 'Price: High to Low') {
      items.sort((a, b) => (b['price'] ?? 0).compareTo(a['price'] ?? 0));
    }

    final currentCategory = displayCategories.firstWhere(
      (c) => c['_id'] == _selectedCategoryId,
      orElse: () => displayCategories[0],
    );

    return Scaffold(
      backgroundColor: const Color(0xFFFCF9F2),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.red),
          onPressed: () {
            if (widget.onBack != null) {
              widget.onBack!();
            } else if (Navigator.canPop(context)) {
              Navigator.pop(context);
            }
          },
        ),
        title: Image.asset(
          'assets/images/branded/lassi-lounge/Lassi-Lounge-logo.png',
          height: 80,
          errorBuilder: (c, e, s) =>
              const Text('LASSI LOUNGE', style: TextStyle(color: Colors.black)),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: Colors.black87),
            onPressed: () {
              Navigator.push(context,
                  MaterialPageRoute(builder: (context) => const SearchScreen()));
            },
          ),
          _buildCartIcon(),
        ],
      ),
      body: ResponsiveCenter(
        maxWidth: AppResponsive.maxContentWidth,
        child: Column(
          children: [
            // Flexible category strip
            MenuCategoryStrip(
              displayCategories: displayCategories,
              selectedCategoryId: _selectedCategoryId,
              onSelectCategory: (id) =>
                  setState(() => _selectedCategoryId = id),
              onMoreTap: () =>
                  _showCategoriesPopup(context, displayCategories),
            ),

            // Responsive filter bar (wraps on 320dp width)
            MenuFilterBar(
              vegFilter: _vegFilter,
              sortOrder: _sortOrder,
              onVegFilterChanged: (v) => setState(() => _vegFilter = v),
              onSortOrderChanged: (s) => setState(() => _sortOrder = s),
            ),

            // Items List (preserved ListView + Column as requested)
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Text(
                    currentCategory['name'] ?? '',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.red.shade900,
                      fontFamily: 'Serif',
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    currentCategory['description'] ??
                        'Flavorful dishes made with rich spices and authentic ingredients.',
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 14),
                  ),
                  const SizedBox(height: 20),

                  Consumer<CartProvider>(
                    builder: (context, cart, child) {
                      return Column(
                        children: items.map((item) {
                          final dishId = item['_id'] ?? item['id'];
                          int totalQty = 0;
                          int lastMatchIndex = -1;
                          for (int i = 0; i < cart.items.length; i++) {
                            final c = cart.items[i];
                            if ((c['menuItemId'] ?? c['_id'] ?? c['id']) == dishId) {
                              totalQty += (c['quantity'] ?? c['qty'] ?? 1) as int;
                              lastMatchIndex = i;
                            }
                          }
                          return MenuItemCard(
                            item: item,
                            cartQty: totalQty,
                            onAdd: () => AddToCartHelper.handleAddToCart(context, item, cart, restaurantProvider),
                            onIncrement: () => AddToCartHelper.handleAddToCart(context, item, cart, restaurantProvider),
                            onDecrement: () {
                              if (lastMatchIndex != -1) {
                                final lastQty = (cart.items[lastMatchIndex]['quantity'] ?? cart.items[lastMatchIndex]['qty'] ?? 1) as int;
                                cart.updateQuantity(lastMatchIndex, lastQty - 1);
                              }
                            },
                          );
                        }).toList(),
                      );
                    },
                  ),

                  const SizedBox(height: 20),

                  const MenuLoyaltyBanner(),
                  const SizedBox(height: 30),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
