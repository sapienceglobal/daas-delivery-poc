import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/cart_provider.dart';
import '../services/api_service.dart';
import '../theme.dart';
import '../widgets/glass_container.dart';
import 'checkout_screen.dart';
import '../widgets/cart_bottom_sheet.dart';

class RestaurantMenuScreen extends StatefulWidget {
  final Map<String, dynamic> restaurant;
  const RestaurantMenuScreen({super.key, required this.restaurant});

  @override
  State<RestaurantMenuScreen> createState() => _RestaurantMenuScreenState();
}

class _RestaurantMenuScreenState extends State<RestaurantMenuScreen> {
  Map<String, dynamic>? _detailedRestaurant;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchDetails();
  }

  Future<void> _fetchDetails() async {
    try {
      final restId = widget.restaurant['_id'] ?? widget.restaurant['id'];
      final response = await ApiService.get('/api/restaurants/$restId');
      final data = json.decode(response.body);
      if (data['success'] == true) {
        setState(() {
          _detailedRestaurant = data['restaurant'];
        });
      } else {
        throw Exception(data['message'] ?? 'Failed to load menu details');
      }
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _handleAddToCart(Map<String, dynamic> item) {
    final cart = Provider.of<CartProvider>(context, listen: false);
    try {
      cart.addToCart(item, _detailedRestaurant ?? widget.restaurant);
    } catch (e) {
      if (e is DifferentRestaurantException) {
        _showCartConflictDialog(context, cart, e.item, e.restaurant);
      }
    }
  }

  void _showCartConflictDialog(BuildContext context, CartProvider cart, Map<String, dynamic> item, Map<String, dynamic> restaurant) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: BrandColors.card,
          title: const Text('Replace Cart Items?', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
          content: Text(
            'Your cart already contains items from "${cart.cartRestaurant?['name']}". '
            'Would you like to clear your cart and start a new order from "${restaurant['name']}"?',
            style: const TextStyle(color: BrandColors.textMuted, fontSize: 13),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('CANCEL', style: TextStyle(color: BrandColors.textMuted)),
            ),
            ElevatedButton(
              onPressed: () {
                cart.clearAndReplaceCart(item, restaurant);
                Navigator.of(context).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Cart replaced with new restaurant items.')),
                );
              },
              style: ElevatedButton.styleFrom(backgroundColor: BrandColors.red),
              child: const Text('CLEAR & REPLACE'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final cart = Provider.of<CartProvider>(context);
    final rest = _detailedRestaurant ?? widget.restaurant;

    // Categorized items
    final Map<String, List<dynamic>> categories = {};
    if (rest['menu'] != null) {
      for (var item in rest['menu']) {
        final cat = item['category'] ?? 'Mains';
        if (!categories.containsKey(cat)) {
          categories[cat] = [];
        }
        categories[cat]!.add(item);
      }
    }

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Banner Sliver AppBar
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: BrandColors.background,
            flexibleSpace: FlexibleSpaceBar(
              background: Image.network(
                rest['banner'] ?? 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) => Container(color: BrandColors.border),
              ),
              title: Text(
                rest['name'] ?? '',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 16,
                  shadows: [Shadow(color: Colors.black, blurRadius: 8, offset: Offset(0, 2))],
                ),
              ),
            ),
          ),

          // Restaurant Info Header
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: GlassContainer(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(rest['cuisine'] ?? '', style: const TextStyle(color: BrandColors.cyan, fontSize: 13, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.star, color: BrandColors.cyan, size: 16),
                        const SizedBox(width: 4),
                        Text('${rest['rating'] ?? '4.5'}', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                        const SizedBox(width: 16),
                        const Icon(Icons.location_on, color: BrandColors.cyan, size: 16),
                        const SizedBox(width: 4),
                        Text(rest['distance'] ?? '1.2 mi', style: const TextStyle(color: BrandColors.textMuted, fontSize: 12)),
                        const SizedBox(width: 16),
                        const Icon(Icons.access_time, color: BrandColors.cyan, size: 16),
                        const SizedBox(width: 4),
                        Text(rest['deliveryTime'] ?? '25-35 min', style: const TextStyle(color: BrandColors.textMuted, fontSize: 12)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Operational Hours: ${rest['openTime'] ?? '09:00'} - ${rest['closeTime'] ?? '22:00'}',
                      style: const TextStyle(color: BrandColors.textMuted, fontSize: 11, fontStyle: FontStyle.italic),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Menu Loader/Error
          if (_isLoading)
            const SliverFillRemaining(
              child: Center(
                child: CircularProgressIndicator(color: BrandColors.cyan),
              ),
            )
          else if (_error != null)
            SliverFillRemaining(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: BrandColors.red)),
                ),
              ),
            )
          else if (categories.isEmpty)
            const SliverFillRemaining(
              child: Center(
                child: Text('No menu items available for this restaurant.', style: TextStyle(color: BrandColors.textMuted)),
              ),
            )
          else
            // Menu lists by category
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final catName = categories.keys.elementAt(index);
                  final items = categories[catName]!;
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        child: Text(
                          catName.toUpperCase(),
                          style: const TextStyle(color: BrandColors.cyan, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.5),
                        ),
                      ),
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: items.length,
                        itemBuilder: (context, idx) {
                          final item = items[idx];
                          final itemId = item['_id'] ?? item['id'];
                          
                          // Quantity in cart
                          final cartItem = cart.cartItems.firstWhere((c) => c['id'] == itemId, orElse: () => {});
                          final cartQty = cartItem.isNotEmpty ? cartItem['quantity'] as int : 0;
                          
                          final isAvailable = item['isAvailable'] != false;

                          return Opacity(
                            opacity: isAvailable ? 1.0 : 0.45,
                            child: Container(
                              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              decoration: BoxDecoration(
                                color: BrandColors.card.withOpacity(0.3),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: BrandColors.border.withOpacity(0.3)),
                              ),
                              child: ListTile(
                                contentPadding: const EdgeInsets.all(12),
                                title: Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        item['name'] ?? '',
                                        style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      '\$${(item['price'] as num).toStringAsFixed(2)}',
                                      style: const TextStyle(fontWeight: FontWeight.w900, color: BrandColors.cyan, fontSize: 14),
                                    ),
                                  ],
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const SizedBox(height: 6),
                                    Text(item['description'] ?? '', style: const TextStyle(color: BrandColors.textMuted, fontSize: 11)),
                                    if (!isAvailable) ...[
                                      const SizedBox(height: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: BrandColors.red.withOpacity(0.15),
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border.all(color: BrandColors.red.withOpacity(0.3)),
                                        ),
                                        child: const Text('OUT OF STOCK', style: TextStyle(color: BrandColors.red, fontSize: 9, fontWeight: FontWeight.bold)),
                                      ),
                                    ],
                                  ],
                                ),
                                trailing: isAvailable
                                    ? cartQty > 0
                                        ? Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              IconButton(
                                                icon: const Icon(Icons.remove_circle_outline, color: BrandColors.cyan, size: 22),
                                                onPressed: () => cart.modifyQuantity(itemId, -1),
                                              ),
                                              Text('$cartQty', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                              IconButton(
                                                icon: const Icon(Icons.add_circle, color: BrandColors.cyan, size: 22),
                                                onPressed: () => _handleAddToCart(item),
                                              ),
                                            ],
                                          )
                                        : ElevatedButton(
                                            onPressed: () => _handleAddToCart(item),
                                            style: ElevatedButton.styleFrom(
                                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                              minimumSize: Size.zero,
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                            ),
                                            child: const Text('ADD', style: TextStyle(fontSize: 11)),
                                          )
                                    : const Icon(Icons.block, color: BrandColors.textMuted, size: 20),
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  );
                },
                childCount: categories.length,
              ),
            ),
        ],
      ),
      bottomNavigationBar: cart.cartItems.isNotEmpty
          ? Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: BrandColors.card,
                border: Border(top: BorderSide(color: BrandColors.border.withOpacity(0.4))),
              ),
              child: SafeArea(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Total Value', style: TextStyle(color: BrandColors.textMuted, fontSize: 11)),
                        Text('\$${cart.getGrandTotal().toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Colors.white)),
                      ],
                    ),
                    ElevatedButton(
                      onPressed: () {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (context) => const CartBottomSheet(),
                        );
                      },
                      style: ElevatedButton.styleFrom(backgroundColor: BrandColors.green),
                      child: const Text('VIEW CART'),
                    ),
                  ],
                ),
              ),
            )
          : null,
    );
  }
}
