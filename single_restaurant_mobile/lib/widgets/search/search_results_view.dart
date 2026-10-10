import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/providers/search_provider.dart';
import 'package:single_restaurant_mobile/utils/cart_helper.dart';
import 'package:single_restaurant_mobile/widgets/menu_item_card.dart';

class SearchResultsView extends StatelessWidget {
  final String query;
  final SearchProvider searchProvider;

  const SearchResultsView({
    super.key,
    required this.query,
    required this.searchProvider,
  });

  @override
  Widget build(BuildContext context) {
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
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    RichText(
                      text: TextSpan(
                        text: 'Results for ',
                        style: const TextStyle(
                          color: Colors.black87,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                        children: [
                          TextSpan(
                            text: '"$query"',
                            style: TextStyle(color: Colors.red.shade900),
                          ),
                        ],
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${results.length} Items found',
                      style:
                          TextStyle(color: Colors.grey.shade600, fontSize: 13),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.red.shade900),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.tune, size: 16, color: Colors.red.shade900),
                    const SizedBox(width: 4),
                    Text(
                      'Filter',
                      style: TextStyle(
                        color: Colors.red.shade900,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
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

                        return MenuItemCard(
                          item: item,
                          cartQty: totalQty,
                          onAdd: () {
                            final restaurantProvider =
                                Provider.of<RestaurantProvider>(context,
                                    listen: false);
                            AddToCartHelper.handleAddToCart(
                                context, item, cart, restaurantProvider);
                          },
                          onIncrement: () {
                            final restaurantProvider =
                                Provider.of<RestaurantProvider>(context,
                                    listen: false);
                            AddToCartHelper.handleAddToCart(
                                context, item, cart, restaurantProvider);
                          },
                          onDecrement: () {
                            if (lastMatchIndex != -1) {
                              final lastQty = (cart.items[lastMatchIndex]
                                          ['quantity'] ??
                                      cart.items[lastMatchIndex]['qty'] ??
                                      1) as int;
                              cart.updateQuantity(
                                  lastMatchIndex, lastQty - 1);
                            }
                          },
                        );
                      },
                    );
                  },
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
            'No results found for "$query"',
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
