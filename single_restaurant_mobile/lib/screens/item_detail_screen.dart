import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/utils/image_helper.dart';
import 'package:single_restaurant_mobile/screens/cart_screen.dart';
import 'package:single_restaurant_mobile/theme/app_responsive.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';
import 'package:single_restaurant_mobile/widgets/item_detail/item_detail_bottom_bar.dart';
import 'package:single_restaurant_mobile/widgets/item_detail/item_detail_cart_badge.dart';
import 'package:single_restaurant_mobile/widgets/item_detail/item_detail_header.dart';
import 'package:single_restaurant_mobile/widgets/item_detail/item_detail_info.dart';
import 'package:single_restaurant_mobile/widgets/item_detail/item_detail_options.dart';
import 'package:single_restaurant_mobile/widgets/item_detail/item_detail_recommendations.dart';

class ItemDetailScreen extends StatefulWidget {
  final Map<String, dynamic> item;
  final VoidCallback? onViewAll;

  const ItemDetailScreen({super.key, required this.item, this.onViewAll});

  @override
  State<ItemDetailScreen> createState() => _ItemDetailScreenState();
}

class _ItemDetailScreenState extends State<ItemDetailScreen> {
  int _localQuantity = 1;
  final Set<int> _selectedAddOnIndices = {};
  int? _selectedSizeIndex;
  int _currentImageIndex = 0;

  @override
  void initState() {
    super.initState();
    final sizeVariations =
        widget.item['sizeVariations'] as List<dynamic>? ?? [];
    if (sizeVariations.isNotEmpty) _selectedSizeIndex = 0;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final cartProvider = Provider.of<CartProvider>(context, listen: false);
      final itemId = widget.item['_id'] ?? widget.item['id'];
      final cartIndex = cartProvider.items.indexWhere(
          (i) => (i['menuItemId'] == itemId || i['_id'] == itemId));
      if (cartIndex != -1) {
        final cartItem = cartProvider.items[cartIndex];
        setState(() {
          _localQuantity = cartItem['quantity'] ?? cartItem['qty'] ?? 1;
          final addons = _getAddOns();
          final cartAddons = cartItem['addOns'] as List<dynamic>? ?? [];
          for (int i = 0; i < addons.length; i++) {
            if (cartAddons.any((ca) => ca['name'] == addons[i]['name'])) {
              _selectedAddOnIndices.add(i);
            }
          }
          if (sizeVariations.isNotEmpty) {
            final cartSize = cartItem['selectedSize'];
            if (cartSize != null) {
              final idx = sizeVariations
                  .indexWhere((s) => s['name'] == cartSize['name']);
              if (idx != -1) _selectedSizeIndex = idx;
            }
          }
        });
      }
    });
  }

  List<Map<String, dynamic>> _getAddOns() {
    if (widget.item['addOns'] != null &&
        (widget.item['addOns'] as List).isNotEmpty) {
      return List<Map<String, dynamic>>.from(widget.item['addOns']);
    }
    return [];
  }

  List<Map<String, dynamic>> _getSelectedAddonsList() {
    final allAddons = _getAddOns();
    return [for (int idx in _selectedAddOnIndices) allAddons[idx]];
  }

  bool _areAddonsEqual(List<dynamic>? cartAddons,
      List<Map<String, dynamic>> selectedAddons, dynamic cartSize, dynamic currentSize) {
    if (cartSize?['name'] != currentSize?['name']) return false;
    final cAdd = cartAddons ?? [];
    if (cAdd.length != selectedAddons.length) return false;
    return selectedAddons.every((sa) => cAdd.any((ca) => ca['name'] == sa['name']));
  }

  double _calculateTotal(int qty) {
    final sizes = widget.item['sizeVariations'] as List<dynamic>? ?? [];
    double base = (widget.item['price'] ?? 0.0).toDouble();
    if (sizes.isNotEmpty &&
        _selectedSizeIndex != null &&
        _selectedSizeIndex! < sizes.length) {
      base = (sizes[_selectedSizeIndex!]['price'] ?? 0.0).toDouble();
    }
    final addons = _getAddOns();
    final addonsTotal = _selectedAddOnIndices.fold<double>(
        0.0, (sum, idx) => sum + (addons[idx]['price'] ?? 0.0).toDouble());
    return (base + addonsTotal) * qty;
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final itemId = item['_id'] ?? item['id'] ?? '';
    final name = item['name'] ?? 'Unknown Dish';
    final isSpicy = item['isSpicy'] ?? false;
    final isVeg = item['isVeg'] ?? true;
    final description = item['description'] ??
        'Cottage cheese cubes marinated in a blend of yogurt, spices and herbs, grilled to perfection in a tandoor for a smoky and flavorful taste.';

    final images = (widget.item['images'] != null &&
            (widget.item['images'] as List).isNotEmpty)
        ? List<String>.from(widget.item['images'])
        : [ImageHelper.getDishImageUrl(widget.item)];

    final sizes = item['sizeVariations'] as List<dynamic>? ?? [];
    double basePrice = (sizes.isNotEmpty &&
            _selectedSizeIndex != null &&
            _selectedSizeIndex! < sizes.length)
        ? (sizes[_selectedSizeIndex!]['price'] ?? 0.0).toDouble()
        : (item['price'] ?? 0.0).toDouble();
    final addons = _getAddOns();
    final prepTime = item['preparationTime'] ?? 20;

    final authProvider = Provider.of<AuthProvider>(context);
    final cartProvider = Provider.of<CartProvider>(context);
    final restaurantProvider = Provider.of<RestaurantProvider>(context);

    final selectedAddonsList = _getSelectedAddonsList();
    final currentSize = (sizes.isNotEmpty &&
            _selectedSizeIndex != null &&
            _selectedSizeIndex! < sizes.length)
        ? sizes[_selectedSizeIndex!]
        : null;

    final cartIndex = cartProvider.items.indexWhere((cartItem) {
      final matchId =
          (cartItem['menuItemId'] == itemId || cartItem['_id'] == itemId);
      return matchId &&
          _areAddonsEqual(cartItem['addOns'], selectedAddonsList,
              cartItem['selectedSize'], currentSize);
    });

    final inCart = cartIndex != -1;
    final displayQuantity = inCart
        ? (cartProvider.items[cartIndex]['quantity'] ?? 1)
        : _localQuantity;
    final isFavorite = authProvider.isFavoriteItem(itemId);

    final categories = restaurantProvider.menu;
    List<Map<String, dynamic>> recommended = [];
    if (categories.isNotEmpty) {
      final flattened = categories
          .expand((cat) => (cat['items'] ?? []) as List<dynamic>)
          .toList();
      recommended = flattened
          .where((i) => (i['_id'] ?? i['id']) != itemId)
          .take(3)
          .cast<Map<String, dynamic>>()
          .toList();
    }
    if (recommended.isEmpty) {
      recommended = [
        {'id': '1', 'name': 'Malai Paneer Tikka', 'price': 14.99, 'isVeg': true},
        {'id': '2', 'name': 'Hara Bhara Kabab', 'price': 10.99, 'isVeg': true},
        {'id': '3', 'name': 'Veg Seekh Kabab', 'price': 11.99, 'isVeg': true},
      ];
    }

    final screenHeight = MediaQuery.sizeOf(context).height;
    final expandedHeight = (screenHeight * 0.35).clamp(240.0, 360.0);

    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        slivers: [
          ItemDetailHeader(
            images: images,
            item: widget.item,
            currentImageIndex: _currentImageIndex,
            onPageChanged: (idx) => setState(() => _currentImageIndex = idx),
            isFavorite: isFavorite,
            onToggleFavorite: () async {
              if (authProvider.isAuthenticated) {
                await authProvider.toggleFavoriteItem(itemId);
              } else {
                ToastUtils.showError(context, 'Please login to add favorites');
              }
            },
            cartIcon: const ItemDetailCartBadge(),
            expandedHeight: expandedHeight,
          ),
          SliverToBoxAdapter(
            child: ResponsiveCenter(
              maxWidth: AppResponsive.maxContentWidth,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ItemDetailInfo(
                      name: name,
                      isSpicy: isSpicy,
                      isVeg: isVeg,
                      basePrice: basePrice,
                      description: description,
                      prepTime: prepTime,
                    ),
                    ItemDetailOptions(
                      sizes: sizes,
                      selectedSizeIndex: _selectedSizeIndex,
                      onSelectSize: (idx) {
                        if (inCart) {
                          ToastUtils.showError(context,
                              'Please adjust quantity for a new configuration or remove from cart to edit.');
                          return;
                        }
                        setState(() => _selectedSizeIndex = idx);
                      },
                      addons: addons,
                      selectedAddOnIndices: _selectedAddOnIndices,
                      onToggleAddon: (idx) {
                        if (inCart) {
                          ToastUtils.showError(context,
                              'Please adjust quantity for a new configuration or remove from cart to edit.');
                          return;
                        }
                        setState(() {
                          if (_selectedAddOnIndices.contains(idx)) {
                            _selectedAddOnIndices.remove(idx);
                          } else {
                            _selectedAddOnIndices.add(idx);
                          }
                        });
                      },
                    ),
                    ItemDetailRecommendations(
                      recommended: recommended,
                      cartProvider: cartProvider,
                      restaurantProvider: restaurantProvider,
                      onViewAll: widget.onViewAll,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        color: Colors.white,
        child: SafeArea(
          top: false,
          child: ResponsiveCenter(
            heightFactor: 1.0,
            maxWidth: AppResponsive.maxContentWidth,
            child: ItemDetailBottomBar(
              totalPrice: _calculateTotal(displayQuantity),
              inCart: inCart,
              displayQuantity: displayQuantity,
              onViewDetails: () {
                Navigator.push(
                    context, MaterialPageRoute(builder: (_) => const CartScreen()));
              },
              onIncrement: () {
                cartProvider.updateQuantity(cartIndex, displayQuantity + 1);
              },
              onDecrement: () => displayQuantity > 1
                  ? cartProvider.updateQuantity(cartIndex, displayQuantity - 1)
                  : cartProvider.removeItem(cartIndex),
              onAddToCart: () {
                final newItem = Map<String, dynamic>.from(widget.item);
                newItem['quantity'] = 1;
                newItem['qty'] = 1;
                newItem['addOns'] = selectedAddonsList;
                newItem['price'] = (sizes.isNotEmpty && _selectedSizeIndex != null)
                    ? (sizes[_selectedSizeIndex!]['price'] as num?)?.toDouble() ?? 0.0
                    : basePrice;
                if (sizes.isNotEmpty && _selectedSizeIndex != null) {
                  newItem['selectedSize'] = sizes[_selectedSizeIndex!];
                }
                cartProvider.addItem(newItem,
                    restaurantData: restaurantProvider.restaurant);
                ToastUtils.showSuccess(context, 'Item added to cart!');
              },
            ),
          ),
        ),
      ),
    );
  }
}
