import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/widgets/menu_item_card.dart';
import 'package:single_restaurant_mobile/widgets/shimmer_loading.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/screens/item_detail_screen.dart';
import 'package:single_restaurant_mobile/utils/cart_helper.dart';
import 'package:single_restaurant_mobile/screens/search_screen.dart';
import 'package:single_restaurant_mobile/screens/cart_screen.dart';
import 'package:single_restaurant_mobile/utils/image_helper.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/loyalty_provider.dart';
import 'package:single_restaurant_mobile/screens/login_screen.dart';
import 'package:single_restaurant_mobile/screens/loyalty_rewards_screen.dart';

class MenuScreen extends StatefulWidget {
  final String? initialCategoryId;
  const MenuScreen({super.key, this.initialCategoryId});

  @override
  State<MenuScreen> createState() => _MenuScreenState();
}

class _MenuScreenState extends State<MenuScreen> {
  String? _selectedCategoryId;
  String _sortOrder = 'Popularity'; // 'Popularity', 'Price: Low to High', 'Price: High to Low'
  String _vegFilter = 'All'; // 'All', 'Veg', 'Non-Veg'

  @override
  void initState() {
    super.initState();
    _selectedCategoryId = widget.initialCategoryId;
  }

  // Removed _getCategoryIcon in favor of ImageHelper

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

    // Default to 'all' if none selected
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
        orElse: () => categories[0]
      );
      items = List.from(selectedCategory['items'] ?? []);
    }

    // Filter Logic
    if (_vegFilter == 'Veg') {
      items = items.where((i) => i['isVeg'] == true).toList();
    } else if (_vegFilter == 'Non-Veg') {
      items = items.where((i) => i['isVeg'] == false).toList();
    }

    // Sort Logic
    if (_sortOrder == 'Price: Low to High') {
      items.sort((a, b) => (a['price'] ?? 0).compareTo(b['price'] ?? 0));
    } else if (_sortOrder == 'Price: High to Low') {
      items.sort((a, b) => (b['price'] ?? 0).compareTo(a['price'] ?? 0));
    }

    final currentCategory = displayCategories.firstWhere(
      (c) => c['_id'] == _selectedCategoryId, 
      orElse: () => displayCategories[0]
    );

    return Scaffold(
      backgroundColor: const Color(0xFFFCF9F2),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.red),
          onPressed: () => Navigator.pop(context), // Handled by MainScreen tabs usually, but kept for standalone
        ),
        title: Image.asset('assets/images/branded/lassi-lounge/Lassi-Lounge-logo.png', height: 80, errorBuilder: (c,e,s) => const Text('LASSI LOUNGE', style: TextStyle(color: Colors.black))),
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: Colors.black87),
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (context) => const SearchScreen()));
            },
          ),
          _buildCartIcon(),
        ],
      ),
      body: Column(
        children: [
          // Horizontal Categories
          Container(
            height: 110,
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: Colors.grey.shade300)),
            ),
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: displayCategories.length + 1, // +1 for "More"
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemBuilder: (context, index) {
                if (index == displayCategories.length) {
                  return GestureDetector(
                    onTap: () => _showCategoriesPopup(context, displayCategories),
                    child: _buildCategoryItem('More', Icons.grid_view, isSelected: false),
                  );
                }
                final cat = displayCategories[index];
                final isSelected = cat['_id'] == _selectedCategoryId;
                return GestureDetector(
                  onTap: () => setState(() => _selectedCategoryId = cat['_id']),
                  child: _buildCategoryItem(cat['name'], cat['_id'] == 'all' ? Icons.fastfood : null, category: cat['_id'] == 'all' ? null : cat, isSelected: isSelected),
                );
              },
            ),
          ),
          
          // Filters
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: Colors.grey.shade300)),
            ),
            child: Row(
              children: [
                const Icon(Icons.filter_alt_outlined, size: 20, color: Colors.black87),
                const SizedBox(width: 4),
                const Text('Filters', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(width: 16),
                
                // Veg/NonVeg Dropdown
                DropdownButton<String>(
                  value: _vegFilter,
                  icon: const Icon(Icons.keyboard_arrow_down, size: 16),
                  underline: const SizedBox(),
                  style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 14),
                  onChanged: (v) => setState(() => _vegFilter = v!),
                  items: ['All', 'Veg', 'Non-Veg'].map((String value) {
                    return DropdownMenuItem<String>(value: value, child: Text(value == 'All' ? 'Veg & Non-Veg' : value));
                  }).toList(),
                ),
                const Spacer(),
                
                // Sort By
                const Text('Sort by ', style: TextStyle(color: Colors.grey)),
                DropdownButton<String>(
                  value: _sortOrder,
                  icon: const Icon(Icons.keyboard_arrow_down, size: 16),
                  underline: const SizedBox(),
                  style: TextStyle(color: Colors.red.shade900, fontWeight: FontWeight.bold, fontSize: 14),
                  onChanged: (v) => setState(() => _sortOrder = v!),
                  items: ['Popularity', 'Price: Low to High', 'Price: High to Low'].map((String value) {
                    return DropdownMenuItem<String>(value: value, child: Text(value));
                  }).toList(),
                ),
              ],
            ),
          ),

          // Items List
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Category Title & Desc
                Text(
                  currentCategory['name'],
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.red.shade900, fontFamily: 'Serif'),
                ),
                const SizedBox(height: 4),
                Text(
                  currentCategory['description'] ?? 'Flavorful dishes made with rich spices and authentic ingredients.',
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 14),
                ),
                const SizedBox(height: 20),

                // Render Items
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
                  }
                ),

                const SizedBox(height: 20),
                
                // Loyalty Banner
                Consumer2<AuthProvider, LoyaltyProvider>(
                  builder: (context, auth, loyalty, child) {
                    final isLoggedIn = auth.isAuthenticated;
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.orange.shade200),
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            backgroundColor: Colors.orange.shade100,
                            radius: 24,
                            child: Icon(Icons.workspace_premium, color: Colors.red.shade900, size: 28),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  isLoggedIn ? 'Lassi Lounge Rewards' : 'Join Lassi Lounge Loyalty', 
                                  style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red.shade900, fontSize: 14)
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  isLoggedIn 
                                    ? 'Balance: ${loyalty.currentBalance} pts. Earn more on every order!' 
                                    : 'Earn points on every order and unlock exclusive rewards!', 
                                  style: TextStyle(fontSize: 12, color: Colors.grey.shade600)
                                ),
                              ],
                            ),
                          ),
                          ElevatedButton(
                            onPressed: () {
                              if (isLoggedIn) {
                                Navigator.push(context, MaterialPageRoute(builder: (context) => const LoyaltyRewardsScreen()));
                              } else {
                                Navigator.push(context, MaterialPageRoute(builder: (context) => const LoginScreen()));
                              }
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.red.shade900,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            ),
                            child: Text(isLoggedIn ? 'Rewards >' : 'Join Now >', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                          )
                        ],
                      ),
                    );
                  }
                ),
                const SizedBox(height: 30), // Padding for bottom nav
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showCategoriesPopup(BuildContext context, List<dynamic> categories) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.7,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  margin: const EdgeInsets.only(top: 12, bottom: 20),
                  height: 4,
                  width: 40,
                  decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Text('All Categories', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.red.shade900, fontFamily: 'Serif')),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: GridView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    childAspectRatio: 0.8,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
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
                      child: _buildCategoryItem(cat['name'], null, category: cat, isSelected: isSelected, inGrid: true),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      }
    );
  }

  Widget _buildCategoryItem(String name, IconData? icon, {Map<String, dynamic>? category, bool isSelected = false, bool inGrid = false}) {
    return Container(
      width: inGrid ? null : 72,
      margin: inGrid ? EdgeInsets.zero : const EdgeInsets.only(right: 12),
      child: Column(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: isSelected ? Colors.red.shade900 : Colors.transparent, width: 2),
              color: Colors.grey.shade100,
            ),
            clipBehavior: Clip.antiAlias,
            child: category != null 
              ? ImageHelper.buildCategoryImage(category, fit: BoxFit.cover)
              : Icon(icon, color: Colors.grey.shade700),
          ),
          const SizedBox(height: 6),
          Text(
            name,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              color: isSelected ? Colors.red.shade900 : Colors.black87,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          if (isSelected)
            Container(
              margin: const EdgeInsets.only(top: 4),
              height: 2,
              width: 30,
              color: Colors.red.shade900,
            )
        ],
      ),
    );
  }

  Widget _buildCartIcon() {
    return Consumer<CartProvider>(
      builder: (context, cart, child) {
        final itemCount = cart.items.fold(0, (sum, item) => sum + (item['quantity'] as int));
        return Stack(
          alignment: Alignment.center,
          children: [
            IconButton(
              icon: const Icon(Icons.shopping_cart_outlined, color: Colors.black87),
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (context) => const CartScreen()));
              },
            ),
            if (itemCount > 0)
              Positioned(
                right: 8,
                top: 8,
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
      },
    );
  }
}
