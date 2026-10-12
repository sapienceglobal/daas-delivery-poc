import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/providers/search_provider.dart';
import 'package:single_restaurant_mobile/utils/cart_helper.dart';
import 'package:single_restaurant_mobile/widgets/menu_item_card.dart';
import 'package:single_restaurant_mobile/widgets/menu/menu_empty_filter_state.dart';

class SearchResultsView extends StatefulWidget {
  final String query;
  final SearchProvider searchProvider;

  const SearchResultsView({
    super.key,
    required this.query,
    required this.searchProvider,
  });

  @override
  State<SearchResultsView> createState() => _SearchResultsViewState();
}

class _SearchResultsViewState extends State<SearchResultsView> {
  String _vegFilter = 'All'; // 'All', 'Veg', 'Non-Veg'
  String _sortOrder = 'Default'; // 'Default', 'Price: Low to High', 'Price: High to Low'

  bool _isItemVeg(dynamic item) {
    if (item is! Map) return true;
    final val = item['isVeg'];
    if (val is bool) return val;
    if (val is num) return val == 1;
    if (val is String) return val.toLowerCase() == 'true';
    return true;
  }

  void _showFilterBottomSheet(
    BuildContext context,
    int totalCount,
    int vegCount,
    int nonVegCount,
  ) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        String tempVeg = _vegFilter;
        String tempSort = _sortOrder;

        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Drag Handle
                    Center(
                      child: Container(
                        width: 44,
                        height: 4,
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade300,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),

                    // Sheet Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Filter & Sort Dishes',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                        if (tempVeg != 'All' || tempSort != 'Default')
                          TextButton(
                            onPressed: () {
                              setModalState(() {
                                tempVeg = 'All';
                                tempSort = 'Default';
                              });
                            },
                            style: TextButton.styleFrom(
                              foregroundColor: const Color(0xFF8B1A1A),
                              padding: EdgeInsets.zero,
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            child: const Text(
                              'Clear All',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 18),

                    // Section 1: Dietary Preference
                    const Text(
                      'Dietary Preference',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF64748B),
                        letterSpacing: 0.2,
                      ),
                    ),
                    const SizedBox(height: 10),

                    // Option: All
                    _buildModalFilterTile(
                      title: 'All (Veg & Non-Veg)',
                      subtitle: 'Show all $totalCount items',
                      isSelected: tempVeg == 'All',
                      leading: const Icon(Icons.restaurant, size: 18, color: Color(0xFF64748B)),
                      onTap: () => setModalState(() => tempVeg = 'All'),
                    ),
                    const SizedBox(height: 8),

                    // Option: Veg Only
                    _buildModalFilterTile(
                      title: 'Veg Only',
                      titleColor: const Color(0xFF2E7D32),
                      subtitle: '$vegCount vegetarian items',
                      isSelected: tempVeg == 'Veg',
                      leading: _buildVegDotIcon(isVeg: true),
                      onTap: () => setModalState(() => tempVeg = 'Veg'),
                    ),
                    const SizedBox(height: 8),

                    // Option: Non-Veg Only
                    _buildModalFilterTile(
                      title: 'Non-Veg Only',
                      titleColor: const Color(0xFFC62828),
                      subtitle: '$nonVegCount non-vegetarian items',
                      isSelected: tempVeg == 'Non-Veg',
                      leading: _buildVegDotIcon(isVeg: false),
                      onTap: () => setModalState(() => tempVeg = 'Non-Veg'),
                    ),

                    const SizedBox(height: 20),

                    // Section 2: Sort By
                    const Text(
                      'Sort By',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF64748B),
                        letterSpacing: 0.2,
                      ),
                    ),
                    const SizedBox(height: 10),

                    Row(
                      children: [
                        Expanded(
                          child: _buildSortPill(
                            title: 'Relevance',
                            isSelected: tempSort == 'Default',
                            onTap: () => setModalState(() => tempSort = 'Default'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildSortPill(
                            title: 'Price: Low-High',
                            isSelected: tempSort == 'Price: Low to High',
                            onTap: () => setModalState(() => tempSort = 'Price: Low to High'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildSortPill(
                            title: 'Price: High-Low',
                            isSelected: tempSort == 'Price: High to Low',
                            onTap: () => setModalState(() => tempSort = 'Price: High to Low'),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Apply Button
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: () {
                          setState(() {
                            _vegFilter = tempVeg;
                            _sortOrder = tempSort;
                          });
                          Navigator.pop(ctx);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF8B1A1A),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: const Text(
                          'Apply Filters',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildModalFilterTile({
    required String title,
    required String subtitle,
    required bool isSelected,
    required Widget leading,
    required VoidCallback onTap,
    Color? titleColor,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFFDF2F2) : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? const Color(0xFF8B1A1A) : const Color(0xFFE2E8F0),
            width: isSelected ? 1.4 : 1.0,
          ),
        ),
        child: Row(
          children: [
            leading,
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: titleColor ??
                          (isSelected
                              ? const Color(0xFF8B1A1A)
                              : const Color(0xFF1E293B)),
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 11.5,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected ? const Color(0xFF8B1A1A) : Colors.transparent,
                border: Border.all(
                  color: isSelected ? const Color(0xFF8B1A1A) : Colors.grey.shade400,
                  width: 2,
                ),
              ),
              child: isSelected
                  ? const Icon(Icons.check, size: 13, color: Colors.white)
                  : null,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSortPill({
    required String title,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF8B1A1A) : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? const Color(0xFF8B1A1A) : const Color(0xFFE2E8F0),
          ),
        ),
        child: Text(
          title,
          style: TextStyle(
            fontSize: 11.5,
            fontWeight: FontWeight.bold,
            color: isSelected ? Colors.white : const Color(0xFF334155),
          ),
        ),
      ),
    );
  }

  Widget _buildVegDotIcon({required bool isVeg}) {
    final borderColor = isVeg ? const Color(0xFF2E7D32) : const Color(0xFF8B1E1E);
    final dotColor = isVeg ? const Color(0xFF2E7D32) : const Color(0xFF8B1E1E);

    return Container(
      width: 17,
      height: 17,
      padding: const EdgeInsets.all(2.5),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: borderColor, width: 1.4),
        borderRadius: BorderRadius.circular(3),
      ),
      child: Center(
        child: isVeg
            ? Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: dotColor,
                ),
              )
            : CustomPaint(
                size: const Size(8, 8),
                painter: _TrianglePainter(color: dotColor),
              ),
      ),
    );
  }

  Widget _buildQuickFilterChip({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
    Widget? leading,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFFDF2F2) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF8B1A1A) : Colors.grey.shade300,
            width: isSelected ? 1.4 : 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 4,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (leading != null) ...[
              leading,
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                color: isSelected ? const Color(0xFF8B1A1A) : const Color(0xFF334155),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptySearchState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off, size: 76, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text(
            'No results found for "${widget.query}"',
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              'Try checking for typos or searching for a different dish, cuisine or ingredient.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade600, fontSize: 13.5),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.searchProvider.isLoading) {
      return const Center(child: CircularProgressIndicator(color: Colors.red));
    }

    final allResults = widget.searchProvider.searchResults;

    // Calculate dietary counts
    final int vegCount = allResults.where((i) => _isItemVeg(i)).length;
    final int nonVegCount = allResults.where((i) => !_isItemVeg(i)).length;

    // Apply dietary filter
    List<dynamic> filteredResults = List.from(allResults);
    if (_vegFilter == 'Veg') {
      filteredResults = filteredResults.where((i) => _isItemVeg(i)).toList();
    } else if (_vegFilter == 'Non-Veg') {
      filteredResults = filteredResults.where((i) => !_isItemVeg(i)).toList();
    }

    // Apply sorting
    if (_sortOrder == 'Price: Low to High') {
      filteredResults.sort((a, b) => (a['price'] ?? 0).compareTo(b['price'] ?? 0));
    } else if (_sortOrder == 'Price: High to Low') {
      filteredResults.sort((a, b) => (b['price'] ?? 0).compareTo(a['price'] ?? 0));
    }

    final bool isFilterActive = _vegFilter != 'All' || _sortOrder != 'Default';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Top Summary Row with Search Term and Filter Button
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
                            text: '"${widget.query}"',
                            style: TextStyle(color: Colors.red.shade900),
                          ),
                        ],
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _vegFilter == 'All'
                          ? '${allResults.length} Items found'
                          : '${filteredResults.length} of ${allResults.length} Items ($_vegFilter)',
                      style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),

              // Filter Trigger Button
              GestureDetector(
                onTap: () => _showFilterBottomSheet(
                  context,
                  allResults.length,
                  vegCount,
                  nonVegCount,
                ),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: isFilterActive ? const Color(0xFF8B1A1A) : Colors.white,
                    border: Border.all(
                      color: isFilterActive ? const Color(0xFF8B1A1A) : Colors.red.shade900,
                    ),
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: isFilterActive
                        ? [
                            BoxShadow(
                              color: const Color(0xFF8B1A1A).withValues(alpha: 0.25),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ]
                        : null,
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.tune,
                        size: 16,
                        color: isFilterActive ? Colors.white : Colors.red.shade900,
                      ),
                      const SizedBox(width: 5),
                      Text(
                        isFilterActive
                            ? (_vegFilter != 'All' ? _vegFilter : 'Filtered')
                            : 'Filter',
                        style: TextStyle(
                          color: isFilterActive ? Colors.white : Colors.red.shade900,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                      if (isFilterActive) ...[
                        const SizedBox(width: 4),
                        GestureDetector(
                          onTap: () {
                            setState(() {
                              _vegFilter = 'All';
                              _sortOrder = 'Default';
                            });
                          },
                          child: const Icon(Icons.close, size: 14, color: Colors.white),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),

        // Quick Filter Horizontal Pills Row (Only shown when there are search results)
        if (allResults.isNotEmpty)
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(20, 2, 20, 8),
            child: Row(
              children: [
                _buildQuickFilterChip(
                  label: 'All (${allResults.length})',
                  isSelected: _vegFilter == 'All',
                  onTap: () => setState(() => _vegFilter = 'All'),
                ),
                const SizedBox(width: 8),
                _buildQuickFilterChip(
                  label: 'Veg Only ($vegCount)',
                  isSelected: _vegFilter == 'Veg',
                  leading: _buildVegDotIcon(isVeg: true),
                  onTap: () {
                    setState(() {
                      _vegFilter = _vegFilter == 'Veg' ? 'All' : 'Veg';
                    });
                  },
                ),
                const SizedBox(width: 8),
                _buildQuickFilterChip(
                  label: 'Non-Veg Only ($nonVegCount)',
                  isSelected: _vegFilter == 'Non-Veg',
                  leading: _buildVegDotIcon(isVeg: false),
                  onTap: () {
                    setState(() {
                      _vegFilter = _vegFilter == 'Non-Veg' ? 'All' : 'Non-Veg';
                    });
                  },
                ),
                if (_sortOrder != 'Default') ...[
                  const SizedBox(width: 8),
                  _buildQuickFilterChip(
                    label: _sortOrder,
                    isSelected: true,
                    leading: const Icon(Icons.sort, size: 14, color: Color(0xFF8B1A1A)),
                    onTap: () => setState(() => _sortOrder = 'Default'),
                  ),
                ],
              ],
            ),
          ),

        const SizedBox(height: 4),

        // Results List OR Filter Empty State OR General Empty State
        Expanded(
          child: allResults.isEmpty
              ? _buildEmptySearchState()
              : filteredResults.isEmpty
                  ? SingleChildScrollView(
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: MenuEmptyFilterState(
                        vegFilter: _vegFilter,
                        categoryName: widget.query,
                        customTitle: _vegFilter == 'Veg'
                            ? 'No Vegetarian Dishes for "${widget.query}"'
                            : 'No Non-Veg Dishes for "${widget.query}"',
                        customSubtitle:
                            'We found ${allResults.length} item${allResults.length == 1 ? '' : 's'} matching "${widget.query}", but none are ${_vegFilter.toLowerCase()}. Reset filter to explore all available dishes.',
                        onResetFilter: () => setState(() => _vegFilter = 'All'),
                      ),
                    )
                  : Consumer<CartProvider>(
                      builder: (context, cart, child) {
                        return ListView.builder(
                          physics: const BouncingScrollPhysics(),
                          padding: const EdgeInsets.only(bottom: 24, left: 16, right: 16),
                          itemCount: filteredResults.length,
                          itemBuilder: (context, index) {
                            final item = filteredResults[index];
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
}

class _TrianglePainter extends CustomPainter {
  final Color color;
  const _TrianglePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    final path = Path()
      ..moveTo(size.width / 2, 0)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _TrianglePainter oldDelegate) =>
      oldDelegate.color != color;
}
