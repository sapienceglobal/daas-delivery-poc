import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/search_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/widgets/menu_item_card.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  String _currentQuery = '';

  @override
  void initState() {
    super.initState();
    // Request focus immediately for smooth UX
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _searchFocusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  void _onSearchSubmit(String query) {
    if (query.trim().isEmpty) return;
    setState(() => _currentQuery = query.trim());
    Provider.of<SearchProvider>(context, listen: false).search(query);
  }

  void _onRecentSearchTap(String query) {
    _searchController.text = query;
    _searchController.selection = TextSelection.fromPosition(TextPosition(offset: query.length));
    _onSearchSubmit(query);
  }

  @override
  Widget build(BuildContext context) {
    final searchProvider = Provider.of<SearchProvider>(context);

    return Scaffold(
      backgroundColor: const Color(0xFFFCF9F2),
      body: SafeArea(
        child: Column(
          children: [
            _buildSearchBar(context, searchProvider),
            Expanded(
              child: _currentQuery.isNotEmpty || searchProvider.isLoading
                  ? _buildSearchResults(searchProvider)
                  : _buildSearchSuggestions(searchProvider),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar(BuildContext context, SearchProvider searchProvider) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 12, 16, 12),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.red),
            onPressed: () {
              searchProvider.clearSearch();
              Navigator.pop(context);
            },
          ),
          Expanded(
            child: Container(
              height: 44,
              decoration: BoxDecoration(
                color: Colors.grey.shade200,
                borderRadius: BorderRadius.circular(12),
              ),
              child: TextField(
                controller: _searchController,
                focusNode: _searchFocusNode,
                textInputAction: TextInputAction.search,
                onSubmitted: _onSearchSubmit,
                onChanged: (val) {
                  if (val.isEmpty && _currentQuery.isNotEmpty) {
                    setState(() => _currentQuery = '');
                    searchProvider.clearSearch();
                  }
                },
                decoration: InputDecoration(
                  hintText: 'Search dishes...',
                  hintStyle: TextStyle(color: Colors.grey.shade600),
                  prefixIcon: const Icon(Icons.search, color: Colors.grey),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.close, size: 20, color: Colors.grey),
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _currentQuery = '');
                            searchProvider.clearSearch();
                          },
                        )
                      : null,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: () {
              _searchController.clear();
              setState(() => _currentQuery = '');
              searchProvider.clearSearch();
              Navigator.pop(context);
            },
            child: Text(
              'Cancel',
              style: TextStyle(
                color: Colors.red.shade900,
                fontWeight: FontWeight.w600,
                fontSize: 16,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchSuggestions(SearchProvider searchProvider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (searchProvider.recentSearches.isNotEmpty) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.history, size: 20, color: Colors.black87),
                    SizedBox(width: 8),
                    Text(
                      'Recent Searches',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                TextButton(
                  onPressed: searchProvider.clearRecentSearches,
                  child: Text(
                    'Clear All',
                    style: TextStyle(color: Colors.red.shade900, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 12,
              children: searchProvider.recentSearches.map((query) {
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(color: Colors.grey.shade300),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      GestureDetector(
                        onTap: () => _onRecentSearchTap(query),
                        child: Text(query, style: const TextStyle(fontWeight: FontWeight.w500)),
                      ),
                      const SizedBox(width: 6),
                      GestureDetector(
                        onTap: () => searchProvider.removeRecentSearch(query),
                        child: const Icon(Icons.close, size: 16, color: Colors.grey),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 32),
          ],
          
          const Row(
            children: [
              Text('🔥', style: TextStyle(fontSize: 18)),
              SizedBox(width: 8),
              Text(
                'Popular Searches',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            clipBehavior: Clip.none,
            child: Row(
              children: searchProvider.popularSearches.map((item) {
                return GestureDetector(
                  onTap: () => _onRecentSearchTap(item['name']!),
                  child: Container(
                    width: 80,
                    margin: const EdgeInsets.only(right: 12),
                    child: Column(
                      children: [
                        Container(
                          height: 70,
                          width: 70,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.grey.shade300, width: 1.5),
                            color: Colors.white,
                          ),
                          padding: const EdgeInsets.all(4),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.asset(
                              item['image']!,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) => 
                                  const Icon(Icons.restaurant, color: Colors.grey),
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          item['name']!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 12, 
                            fontWeight: FontWeight.w600,
                            height: 1.2,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchResults(SearchProvider searchProvider) {
    if (searchProvider.isLoading) {
      return const Center(child: CircularProgressIndicator(color: Colors.red));
    }

    final results = searchProvider.searchResults;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  RichText(
                    text: TextSpan(
                      text: 'Results for ',
                      style: const TextStyle(color: Colors.black87, fontSize: 16, fontWeight: FontWeight.bold),
                      children: [
                        TextSpan(
                          text: '"$_currentQuery"',
                          style: TextStyle(color: Colors.red.shade900),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${results.length} Items found',
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.red.shade900),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.tune, size: 16, color: Colors.red.shade900),
                    const SizedBox(width: 4),
                    Text('Filter', style: TextStyle(color: Colors.red.shade900, fontWeight: FontWeight.bold, fontSize: 13)),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: results.isEmpty
              ? _buildEmptyState()
              : Consumer<CartProvider>(
                  builder: (context, cart, child) {
                    return ListView.builder(
                      padding: const EdgeInsets.only(bottom: 24),
                      itemCount: results.length,
                      itemBuilder: (context, index) {
                        final item = results[index];
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
                          onAdd: () {
                            final restaurantProvider = Provider.of<RestaurantProvider>(context, listen: false);
                            cart.addItem(item, restaurantData: restaurantProvider.restaurant);
                          },
                          onIncrement: () => cart.updateQuantity(cartItemIndex, cartQty + 1),
                          onDecrement: () => cart.updateQuantity(cartItemIndex, cartQty - 1),
                        );
                      },
                    );
                  }
                ),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off, size: 80, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text(
            'No results found for "$_currentQuery"',
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'Try adjusting your search or check for typos.',
            style: TextStyle(color: Colors.grey.shade600),
          ),
        ],
      ),
    );
  }
}
