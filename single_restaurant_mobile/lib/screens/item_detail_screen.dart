import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/utils/cart_helper.dart';
import 'package:single_restaurant_mobile/utils/image_helper.dart';
import 'package:single_restaurant_mobile/screens/cart_screen.dart';

class ItemDetailScreen extends StatefulWidget {
  final Map<String, dynamic> item;

  const ItemDetailScreen({super.key, required this.item});

  @override
  State<ItemDetailScreen> createState() => _ItemDetailScreenState();
}

class _ItemDetailScreenState extends State<ItemDetailScreen> {
  int _localQuantity = 1;
  final Set<int> _selectedAddOnIndices = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final cartProvider = Provider.of<CartProvider>(context, listen: false);
      final itemId = widget.item['_id'] ?? widget.item['id'];
      final cartIndex = cartProvider.items.indexWhere((i) => (i['menuItemId'] == itemId || i['_id'] == itemId));
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
        });
      }
    });
  }
  
  // Helper removed in favor of ImageHelper

  // Mock addons if none provided
  List<Map<String, dynamic>> _getAddOns() {
    if (widget.item['addOns'] != null && (widget.item['addOns'] as List).isNotEmpty) {
      return List<Map<String, dynamic>>.from(widget.item['addOns']);
    }
    return [
      {'name': 'Extra Cheese', 'price': 2.00, 'description': 'Adds extra cheese topping'},
      {'name': 'Mint Chutney', 'price': 1.00, 'description': 'Refreshing mint chutney'},
      {'name': 'Extra Paneer', 'price': 3.00, 'description': 'Adds 4 pieces of paneer'},
    ];
  }
  
  List<Map<String, dynamic>> _getSelectedAddonsList() {
    List<Map<String, dynamic>> selectedAddonsList = [];
    final allAddons = _getAddOns();
    for (int idx in _selectedAddOnIndices) {
      selectedAddonsList.add(allAddons[idx]);
    }
    return selectedAddonsList;
  }
  
  bool _areAddonsEqual(List<dynamic>? cartAddons, List<Map<String, dynamic>> selectedAddons) {
    final cAdd = cartAddons ?? [];
    if (cAdd.length != selectedAddons.length) return false;
    for (var sa in selectedAddons) {
      if (!cAdd.any((ca) => ca['name'] == sa['name'])) return false;
    }
    return true;
  }

  double _calculateTotal(int qty) {
    double base = (widget.item['price'] ?? 0.0).toDouble();
    double addonsTotal = 0.0;
    final addons = _getAddOns();
    for (int idx in _selectedAddOnIndices) {
      addonsTotal += (addons[idx]['price'] ?? 0.0).toDouble();
    }
    return (base + addonsTotal) * qty;
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final itemId = item['_id'] ?? item['id'] ?? '';
    final name = item['name'] ?? 'Unknown Dish';
    final isSpicy = item['isSpicy'] ?? false;
    final isVeg = item['isVeg'] ?? true;
    final description = item['description'] ?? 'Cottage cheese cubes marinated in a blend of yogurt, spices and herbs, grilled to perfection in a tandoor for a smoky and flavorful taste.';
    final imageUrl = ImageHelper.getDishImageUrl(widget.item);
    final basePrice = (item['price'] ?? 0.0).toDouble();
    final addons = _getAddOns();
    
    final prepTime = item['preparationTime'] ?? 20;
    
    final authProvider = Provider.of<AuthProvider>(context);
    final cartProvider = Provider.of<CartProvider>(context);
    final restaurantProvider = Provider.of<RestaurantProvider>(context);
    
    // Check if in cart with matching configuration
    final selectedAddonsList = _getSelectedAddonsList();
    final cartIndex = cartProvider.items.indexWhere((cartItem) {
      final matchId = (cartItem['menuItemId'] == itemId || cartItem['_id'] == itemId);
      return matchId && _areAddonsEqual(cartItem['addOns'], selectedAddonsList);
    });
    
    final inCart = cartIndex != -1;
    final displayQuantity = inCart ? (cartProvider.items[cartIndex]['quantity'] ?? 1) : _localQuantity;
    
    final isFavorite = authProvider.isFavoriteItem(itemId);
    
    // Recommendations
    final categories = restaurantProvider.menu;
    List<Map<String, dynamic>> recommended = [];
    if (categories.isNotEmpty) {
      final flattened = categories.expand((cat) => (cat['items'] ?? []) as List<dynamic>).toList();
      recommended = flattened.where((i) => (i['_id'] ?? i['id']) != itemId).take(3).cast<Map<String, dynamic>>().toList();
    }
    if (recommended.isEmpty) {
      recommended = [
        {'id': '1', 'name': 'Malai Paneer Tikka', 'price': 14.99, 'isVeg': true},
        {'id': '2', 'name': 'Hara Bhara Kabab', 'price': 10.99, 'isVeg': true},
        {'id': '3', 'name': 'Veg Seekh Kabab', 'price': 11.99, 'isVeg': true},
      ];
    }

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 300,
                pinned: true,
                backgroundColor: Colors.white,
                leading: Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: CircleAvatar(
                    backgroundColor: Colors.white,
                    child: IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.black),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ),
                ),
                actions: [
                  Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: CircleAvatar(
                      backgroundColor: Colors.white,
                      child: IconButton(
                        icon: Icon(isFavorite ? Icons.favorite : Icons.favorite_border, color: Colors.red),
                        onPressed: () async {
                          if (authProvider.isAuthenticated) {
                            await authProvider.toggleFavoriteItem(itemId);
                          } else {
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please login to add favorites')));
                          }
                        },
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(right: 8.0, top: 8.0, bottom: 8.0),
                    child: CircleAvatar(
                      backgroundColor: Colors.white,
                      child: _buildCartIcon(),
                    ),
                  ),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      ImageHelper.buildDishImage(widget.item, fit: BoxFit.cover),
                      Positioned(
                        bottom: 16,
                        left: 0,
                        right: 0,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(4, (index) => Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: index == 0 ? Colors.white : Colors.white54,
                            ),
                          )),
                        ),
                      )
                    ],
                  ),
                ),
              ),
              
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Title & Qty
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    name,
                                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, fontFamily: 'Serif'),
                                  ),
                                ),
                                if (isSpicy)
                                  Padding(
                                    padding: const EdgeInsets.only(left: 8.0),
                                    child: Image.asset('assets/images/chili.png', width: 24, height: 24, color: Colors.red.shade900, errorBuilder: (c,e,s) => Icon(Icons.local_fire_department, color: Colors.red.shade900, size: 24)),
                                  )
                              ],
                            ),
                          ),
                          const SizedBox.shrink()
                        ],
                      ),
                      
                      const SizedBox(height: 8),
                      // Rating
                      Row(
                        children: [
                          Row(
                            children: List.generate(5, (index) => Icon(
                              Icons.star,
                              color: index < 4 ? Colors.amber : Colors.amber.shade200,
                              size: 16,
                            )),
                          ),
                          const SizedBox(width: 8),
                          Text('4.6 (128 Reviews)', style: TextStyle(color: Colors.grey.shade700, fontSize: 14)),
                        ],
                      ),
                      
                      const SizedBox(height: 12),
                      // Price
                      Text('\$${basePrice.toStringAsFixed(2)}', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.red.shade900)),
                      
                      const SizedBox(height: 16),
                      // Description
                      Text(description, style: TextStyle(color: Colors.grey.shade800, fontSize: 14, height: 1.5)),
                      
                      const SizedBox(height: 24),
                      // Tags row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _buildTag(isVeg ? Icons.eco : Icons.restaurant, isVeg ? 'Veg' : 'Non-Veg', isVeg ? Colors.green : Colors.red),
                          _buildTag(Icons.local_fire_department, isSpicy ? 'Medium Spicy' : 'Mild Spicy', Colors.red.shade800),
                          _buildTag(Icons.schedule, '$prepTime mins', Colors.red.shade900),
                          _buildTag(Icons.outdoor_grill, 'Tandoor Grilled', Colors.red.shade900),
                        ],
                      ),
                      
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 24.0),
                        child: Divider(color: Colors.black12, thickness: 1),
                      ),
                      
                      // Customize Your Order
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Customize Your Order', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                          Text('Optional', style: TextStyle(color: Colors.grey.shade500, fontSize: 14)),
                        ],
                      ),
                      const SizedBox(height: 16),
                      
                      ...List.generate(addons.length, (index) {
                        final addon = addons[index];
                        final isSelected = _selectedAddOnIndices.contains(index);
                        return GestureDetector(
                          onTap: () {
                            if (inCart) {
                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please adjust quantity for a new configuration or remove from cart to edit.')));
                              return;
                            }
                            setState(() {
                              if (isSelected) {
                                _selectedAddOnIndices.remove(index);
                              } else {
                                _selectedAddOnIndices.add(index);
                              }
                            });
                          },
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              border: Border.all(color: Colors.grey.shade200),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.red.shade900,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Icon(Icons.extension, color: Colors.white, size: 20),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(addon['name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                      if (addon['description'] != null)
                                        Text(addon['description'], style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                                    ],
                                  ),
                                ),
                                Text('\$${(addon['price'] ?? 0).toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                const SizedBox(width: 16),
                                Icon(
                                  isSelected ? Icons.check_box : Icons.check_box_outline_blank,
                                  color: isSelected ? Colors.red.shade900 : Colors.grey.shade400,
                                ),
                              ],
                            ),
                          ),
                        );
                      }),
                      
                      const SizedBox(height: 24),
                      // You May Also Like
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('You May Also Like', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                          Row(
                            children: [
                              Text('View All', style: TextStyle(color: Colors.red.shade900, fontWeight: FontWeight.bold, fontSize: 14)),
                              Icon(Icons.chevron_right, color: Colors.red.shade900, size: 16),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      
                      SizedBox(
                        height: 220,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: recommended.length,
                          itemBuilder: (context, index) {
                            final rec = recommended[index];
                            return GestureDetector(
                              onTap: () {
                                // Close current detail screen and open new one, or push onto stack
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => ItemDetailScreen(item: rec),
                                  ),
                                );
                              },
                              child: Container(
                              width: 160,
                              margin: const EdgeInsets.only(right: 16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.grey.shade200),
                              ),
                              clipBehavior: Clip.antiAlias,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Stack(
                                    children: [
                                      SizedBox(
                                        height: 120,
                                        width: double.infinity,
                                        child: ImageHelper.buildDishImage(rec, fit: BoxFit.cover),
                                      ),
                                      Positioned(
                                        top: 8, left: 8,
                                        child: Container(
                                          padding: const EdgeInsets.all(2),
                                          decoration: BoxDecoration(
                                            color: Colors.white,
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: Icon(Icons.eco, color: (rec['isVeg'] ?? true) ? Colors.green : Colors.red, size: 12),
                                        ),
                                      )
                                    ],
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.all(12),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(rec['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
                                        const SizedBox(height: 8),
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text('\$${(rec['price'] ?? 0.0).toStringAsFixed(2)}', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red.shade900, fontSize: 13)),
                                            _buildSmallCartButton(rec, cartProvider, restaurantProvider)
                                          ],
                                        )
                                      ],
                                    ),
                                  )
                                ],
                              ),
                              ),
                            );
                          },
                        ),
                      ),
                      
                      const SizedBox(height: 100), // padding for bottom bar
                    ],
                  ),
                ),
              ),
            ],
          ),
          
          // Bottom Bar
          Positioned(
            bottom: 0, left: 0, right: 0,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))],
              ),
              child: SafeArea(
                top: false,
                child: Row(
                  children: [
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('\$${_calculateTotal(displayQuantity).toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20)),
                      Row(
                        children: [
                          Text('View Details', style: TextStyle(color: Colors.red.shade900, fontSize: 12, fontWeight: FontWeight.bold)),
                          Icon(Icons.keyboard_arrow_up, color: Colors.red.shade900, size: 16),
                        ],
                      )
                    ],
                  ),
                  const Spacer(),
                  if (inCart)
                    Container(
                      height: 48,
                      decoration: BoxDecoration(
                        color: Colors.green.shade700,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.remove, color: Colors.white),
                            onPressed: () {
                              if (displayQuantity > 1) {
                                cartProvider.updateQuantity(cartIndex, displayQuantity - 1);
                              } else {
                                cartProvider.removeItem(cartIndex);
                              }
                            },
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16.0),
                            child: Text('$displayQuantity', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                          ),
                          IconButton(
                            icon: const Icon(Icons.add, color: Colors.white),
                            onPressed: () {
                              cartProvider.updateQuantity(cartIndex, displayQuantity + 1);
                            },
                          ),
                        ],
                      ),
                    )
                  else
                    ElevatedButton.icon(
                      onPressed: () {
                        final newItem = Map<String, dynamic>.from(widget.item);
                        newItem['quantity'] = 1;
                        newItem['qty'] = 1;
                        newItem['addOns'] = selectedAddonsList;
                        cartProvider.addItem(newItem, restaurantData: restaurantProvider.restaurant);
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Item added to cart!'), duration: Duration(seconds: 2)));
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red.shade900,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      icon: const Icon(Icons.shopping_cart_outlined, size: 20),
                      label: const Text('ADD ITEM', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1)),
                    ),
                ],
              ),
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildTag(IconData icon, String text, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 6),
        Text(text, style: TextStyle(fontSize: 11, color: Colors.grey.shade800, fontWeight: FontWeight.w500)),
      ],
    );
  }

  Widget _buildSmallCartButton(Map<String, dynamic> item, CartProvider cartProvider, RestaurantProvider restaurantProvider) {
    final itemId = item['_id'] ?? item['id'];
    int qty = 0;
    for (var c in cartProvider.items) {
      if ((c['menuItemId'] ?? c['_id'] ?? c['id']) == itemId) {
        qty += (c['quantity'] ?? c['qty'] ?? 0) as int;
      }
    }

    if (qty > 0) {
      return Container(
        height: 24,
        decoration: BoxDecoration(
          color: Colors.red.shade900,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            GestureDetector(
              onTap: () {
                 final idx = cartProvider.items.lastIndexWhere((c) => (c['menuItemId'] ?? c['_id'] ?? c['id']) == itemId);
                 if (idx != -1) {
                   final current = cartProvider.items[idx]['quantity'] ?? 1;
                   cartProvider.updateQuantity(idx, current - 1);
                 }
              },
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                child: Icon(Icons.remove, color: Colors.white, size: 12),
              ),
            ),
            Text('$qty', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
            GestureDetector(
              onTap: () {
                 AddToCartHelper.handleAddToCart(context, item, cartProvider, restaurantProvider);
              },
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                child: Icon(Icons.add, color: Colors.white, size: 12),
              ),
            ),
          ],
        ),
      );
    }

    return GestureDetector(
      onTap: () {
        AddToCartHelper.handleAddToCart(context, item, cartProvider, restaurantProvider);
      },
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(color: Colors.red.shade900, borderRadius: BorderRadius.circular(6)),
        child: const Icon(Icons.add, color: Colors.white, size: 14),
      ),
    );
  }

  Widget _buildCartIcon() {
    return Consumer<CartProvider>(
      builder: (context, cart, child) {
        final itemCount = cart.items.fold(0, (sum, item) => sum + ((item['quantity'] ?? item['qty'] ?? 1) as int));
        return Stack(
          alignment: Alignment.center,
          children: [
            IconButton(
              icon: const Icon(Icons.shopping_cart_outlined, color: Colors.black87, size: 22),
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (context) => const CartScreen()));
              },
            ),
            if (itemCount > 0)
              Positioned(
                right: 4,
                top: 4,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(color: Colors.red.shade900, shape: BoxShape.circle),
                  child: Text(
                    '$itemCount',
                    style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
          ],
        );
      }
    );
  }
}
