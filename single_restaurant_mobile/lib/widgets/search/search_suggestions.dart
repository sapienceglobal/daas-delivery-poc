import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/providers/search_provider.dart';
import 'package:single_restaurant_mobile/screens/item_detail_screen.dart';
import 'package:single_restaurant_mobile/utils/image_helper.dart';

const _kMaroon = Color(0xFF8B1A1A);
const _kCardShadow = Color(0x14000000);

class SearchSuggestions extends StatelessWidget {
  final SearchProvider searchProvider;
  final ValueChanged<String> onSearchTap;

  const SearchSuggestions({
    super.key,
    required this.searchProvider,
    required this.onSearchTap,
  });

  void _openDetail(BuildContext context, dynamic item) {
    FocusScope.of(context).unfocus();
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => ItemDetailScreen(item: item)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final restaurantProvider = context.watch<RestaurantProvider>();
    final ranked = SearchProvider.rankMenuItems(restaurantProvider.menu);
    final popular = ranked.take(8).toList();
    final trending = ranked.skip(8).take(5).toList();
    // If menu is small, reuse top items for trending so the section isn't empty
    final trendingItems =
        trending.isNotEmpty ? trending : ranked.take(5).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (searchProvider.recentSearches.isNotEmpty) ...[
            _buildRecent(),
            const SizedBox(height: 24),
          ],
          if (restaurantProvider.isLoading && ranked.isEmpty)
            const Padding(
              padding: EdgeInsets.only(top: 60),
              child: Center(child: CircularProgressIndicator(color: _kMaroon)),
            )
          else if (ranked.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 60),
              child: Center(
                child: Text(
                  restaurantProvider.error ?? 'No dishes available right now',
                  style: TextStyle(color: Colors.grey.shade600),
                ),
              ),
            )
          else ...[
            _sectionHeader(
              leading: const Text('🔥', style: TextStyle(fontSize: 28)),
              title: 'Popular Searches',
              subtitle: 'Try searching for your favorite dishes',
            ),
            const SizedBox(height: 16),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: popular.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 4,
                mainAxisSpacing: 12,
                crossAxisSpacing: 10,
                childAspectRatio: 0.82,
              ),
              itemBuilder: (context, i) =>
                  _popularTile(context, popular[i]),
            ),
            const SizedBox(height: 20),
            Divider(color: Colors.grey.shade300, height: 1),
            const SizedBox(height: 20),
            _sectionHeader(
              leading: Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: _kMaroon.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.search, color: _kMaroon),
              ),
              title: 'Trending Dishes',
              subtitle: 'Most searched by our customers',
            ),
            const SizedBox(height: 14),
            ...trendingItems.map((item) => _trendingTile(context, item)),
          ],
        ],
      ),
    );
  }

  Widget _sectionHeader({
    required Widget leading,
    required String title,
    required String subtitle,
  }) {
    return Row(
      children: [
        leading,
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _popularTile(BuildContext context, dynamic item) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      elevation: 0,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => _openDetail(context, item),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            boxShadow: const [
              BoxShadow(color: _kCardShadow, blurRadius: 8, offset: Offset(0, 3)),
            ],
          ),
          padding: const EdgeInsets.fromLTRB(6, 6, 6, 6),
          child: Column(
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: SizedBox(
                    width: double.infinity,
                    child: ImageHelper.buildDishImage(
                      Map<String, dynamic>.from(item),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 6),
              SizedBox(
                height: 30,
                child: Center(
                  child: Text(
                    item['name']?.toString() ?? '',
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 11.5,
                      height: 1.2,
                      fontWeight: FontWeight.w700,
                      color: _kMaroon,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _trendingTile(BuildContext context, dynamic item) {
    final desc = (item['description'] ?? '').toString().trim();
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () => _openDetail(context, item),
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              boxShadow: const [
                BoxShadow(
                    color: _kCardShadow, blurRadius: 6, offset: Offset(0, 2)),
              ],
            ),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: SizedBox(
                    width: 88,
                    height: 60,
                    child: ImageHelper.buildDishImage(
                      Map<String, dynamic>.from(item),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item['name']?.toString() ?? '',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: Colors.black87,
                        ),
                      ),
                      if (desc.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          desc,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                              fontSize: 12.5, color: Colors.grey.shade600),
                        ),
                      ],
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: _kMaroon),
                const SizedBox(width: 4),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRecent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.history, size: 20, color: Colors.black87),
            const SizedBox(width: 8),
            const Expanded(
              child: Text(
                'Recent Searches',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
            TextButton(
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              onPressed: searchProvider.clearRecentSearches,
              child: const Text(
                'Clear All',
                style: TextStyle(color: _kMaroon, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 10,
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
                    onTap: () => onSearchTap(query),
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 220),
                      child: Text(
                        query,
                        style: const TextStyle(fontWeight: FontWeight.w500),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  GestureDetector(
                    onTap: () => searchProvider.removeRecentSearch(query),
                    child:
                        const Icon(Icons.close, size: 16, color: Colors.grey),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}
