import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/widgets/menu_item_card.dart';
import 'package:single_restaurant_mobile/screens/search_screen.dart';

class MenuScreen extends StatefulWidget {
  const MenuScreen({super.key});

  @override
  State<MenuScreen> createState() => _MenuScreenState();
}

class _MenuScreenState extends State<MenuScreen> {
  String? _selectedCategoryId;
  String _sortOrder = 'Popularity'; // 'Popularity', 'Price: Low to High', 'Price: High to Low'
  String _vegFilter = 'All'; // 'All', 'Veg', 'Non-Veg'

  String _getCategoryIcon(String categoryName) {
    final name = categoryName.toLowerCase();
    if (name.contains('appetizer')) return 'assets/images/categories/appetizers.jpg';
    if (name.contains('bread') || name.contains('naan')) return 'assets/images/categories/breads.jpg';
    if (name.contains('biryani')) return 'assets/images/categories/biryani.jpg';
    if (name.contains('beverage') || name.contains('drink')) return 'assets/images/categories/beverages.jpg';
    if (name.contains('dessert')) return 'assets/images/categories/desserts.jpg';
    return 'assets/images/categories/main-course.jpg';
  }

  @override
  Widget build(BuildContext context) {
    final restaurantProvider = Provider.of<RestaurantProvider>(context);
    final categories = restaurantProvider.menu;

    if (categories.isEmpty) {
      if (restaurantProvider.isLoading) {
        return const Center(child: CircularProgressIndicator(color: Colors.red));
      }
      return const Center(child: Text('No menu available.'));
    }

    // Default to first category if none selected
    if (_selectedCategoryId == null && categories.isNotEmpty) {
      _selectedCategoryId = categories[0]['_id'];
    }

    final selectedCategory = categories.firstWhere(
      (c) => c['_id'] == _selectedCategoryId, 
      orElse: () => categories[0]
    );

    List<dynamic> items = List.from(selectedCategory['items'] ?? []);

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
        title: Image.asset('assets/images/logo.png', height: 40, errorBuilder: (c,e,s) => const Text('LASSI LOUNGE', style: TextStyle(color: Colors.black))),
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
            height: 100,
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: Colors.grey.shade300)),
            ),
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: categories.length + 1, // +1 for "More"
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemBuilder: (context, index) {
                if (index == categories.length) {
                  return _buildCategoryItem('More', Icons.grid_view, isSelected: false);
                }
                final cat = categories[index];
                final isSelected = cat['_id'] == _selectedCategoryId;
                return GestureDetector(
                  onTap: () => setState(() => _selectedCategoryId = cat['_id']),
                  child: _buildCategoryItem(cat['name'], null, imagePath: _getCategoryIcon(cat['name']), isSelected: isSelected),
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
                  selectedCategory['name'],
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.red.shade900, fontFamily: 'Serif'),
                ),
                const SizedBox(height: 4),
                Text(
                  selectedCategory['description'] ?? 'Flavorful dishes made with rich spices and authentic ingredients.',
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 14),
                ),
                const SizedBox(height: 20),

                // Render Items
                Consumer<CartProvider>(
                  builder: (context, cart, child) {
                    return Column(
                      children: items.map((item) {
                        final dishId = item['_id'] ?? item['id'];
                        final cartItemIndex = cart.items.indexWhere((i) {
                          final iId = i['menuItemId'] ?? i['_id'] ?? i['id'];
                          return iId == dishId;
                        });
                        
                        int cartQty = 0;
                        if (cartItemIndex > -1) {
                          final cartItem = cart.items[cartItemIndex];
                          cartQty = (cartItem['quantity'] ?? cartItem['qty'] ?? 1) as int;
                        }

                        return MenuItemCard(
                          item: item,
                          cartQty: cartQty,
                          onAdd: () => cart.addItem(item, restaurantData: restaurantProvider.restaurant),
                          onIncrement: () => cart.updateQuantity(cartItemIndex, cartQty + 1),
                          onDecrement: () => cart.updateQuantity(cartItemIndex, cartQty - 1),
                        );
                      }).toList(),
                    );
                  }
                ),

                const SizedBox(height: 20),
                
                // Pagination Footer
                if (items.isNotEmpty)
                  Center(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('Showing 1-${items.length} of ${items.length} items', style: TextStyle(color: Colors.grey.shade600, fontWeight: FontWeight.bold)),
                        const SizedBox(width: 8),
                        Text('Next', style: TextStyle(color: Colors.red.shade900, fontWeight: FontWeight.bold)),
                        Icon(Icons.chevron_right, color: Colors.red.shade900, size: 16),
                      ],
                    ),
                  ),

                const SizedBox(height: 24),
                
                // Loyalty Banner
                Container(
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
                            Text('Join Lassi Lounge Loyalty Program', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red.shade900, fontSize: 14)),
                            const SizedBox(height: 4),
                            Text('Earn points on every order and unlock exclusive rewards!', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                          ],
                        ),
                      ),
                      ElevatedButton(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red.shade900,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        ),
                        child: const Text('Join Now >', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                      )
                    ],
                  ),
                ),
                const SizedBox(height: 30), // Padding for bottom nav
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryItem(String name, IconData? icon, {String? imagePath, bool isSelected = false}) {
    return Container(
      width: 72,
      margin: const EdgeInsets.only(right: 12),
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
            child: imagePath != null 
              ? Image.asset(imagePath, fit: BoxFit.cover, errorBuilder: (c,e,s) => Icon(Icons.fastfood, color: Colors.grey.shade400))
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
                // Navigate to cart
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
