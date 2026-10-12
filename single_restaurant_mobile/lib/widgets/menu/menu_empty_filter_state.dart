import 'package:flutter/material.dart';

/// An industry-standard empty state view for menu filtering.
/// Displayed when a category or veg/non-veg filter yields no results.
class MenuEmptyFilterState extends StatelessWidget {
  final String vegFilter;
  final String categoryName;
  final VoidCallback onResetFilter;
  final VoidCallback? onShowAllCategories;
  final ValueChanged<String>? onSwitchVegFilter;
  final String? customTitle;
  final String? customSubtitle;

  const MenuEmptyFilterState({
    super.key,
    required this.vegFilter,
    required this.categoryName,
    required this.onResetFilter,
    this.onShowAllCategories,
    this.onSwitchVegFilter,
    this.customTitle,
    this.customSubtitle,
  });

  @override
  Widget build(BuildContext context) {
    final bool isVeg = vegFilter == 'Veg';
    final bool isNonVeg = vegFilter == 'Non-Veg';
    final String cleanCat = categoryName.trim().isEmpty ? 'this Category' : categoryName;

    // Visual theme based on filter type
    final Color badgeBg = isVeg
        ? const Color(0xFFE8F5E9)
        : isNonVeg
            ? const Color(0xFFFFEBEE)
            : const Color(0xFFFFF3E0);

    final Color badgeBorder = isVeg
        ? const Color(0xFFA5D6A7)
        : isNonVeg
            ? const Color(0xFFEF9A9A)
            : const Color(0xFFFFCC80);

    final Color iconColor = isVeg
        ? const Color(0xFF2E7D32)
        : isNonVeg
            ? const Color(0xFFC62828)
            : const Color(0xFFE65100);

    final IconData iconData = isVeg
        ? Icons.eco_rounded
        : isNonVeg
            ? Icons.restaurant_menu_rounded
            : Icons.soup_kitchen_outlined;

    // Industry-standard copy
    final String title = customTitle ??
        (isVeg
            ? (cleanCat == 'All' ? 'No Vegetarian Dishes Found' : 'No Vegetarian Dishes in $cleanCat')
            : isNonVeg
                ? (cleanCat == 'All' ? 'No Non-Veg Dishes Found' : 'No Non-Veg Dishes in $cleanCat')
                : (cleanCat == 'All' ? 'No Dishes Available' : 'No Dishes in $cleanCat'));

    final String subtitle = customSubtitle ??
        (isVeg
            ? 'We don\'t have any pure vegetarian options in this section right now. Reset your filter to explore all available dishes.'
            : isNonVeg
                ? 'We don\'t have any non-vegetarian options in this section right now. Reset your filter to explore all available dishes.'
                : 'This section currently has no dishes listed. Try checking out our other popular categories.');

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(vertical: 16),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Icon badge with animated-style halo
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: badgeBg,
              shape: BoxShape.circle,
              border: Border.all(color: badgeBorder, width: 2),
            ),
            child: Icon(iconData, size: 36, color: iconColor),
          ),
          const SizedBox(height: 16),

          // Title
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1E293B),
              letterSpacing: -0.2,
            ),
          ),
          const SizedBox(height: 8),

          // Subtitle
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 360),
            child: Text(
              subtitle,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13.5,
                color: Colors.grey.shade600,
                height: 1.45,
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Call to action button
          Wrap(
            spacing: 12,
            runSpacing: 8,
            alignment: WrapAlignment.center,
            children: [
              if (isVeg || isNonVeg)
                ElevatedButton.icon(
                  onPressed: onResetFilter,
                  icon: const Icon(Icons.filter_alt_off_outlined, size: 18),
                  label: const Text(
                    'Show All Dishes',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red.shade900,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                  ),
                ),
              if (!isVeg && !isNonVeg && onShowAllCategories != null)
                ElevatedButton.icon(
                  onPressed: onShowAllCategories,
                  icon: const Icon(Icons.restaurant_rounded, size: 18),
                  label: const Text(
                    'Explore All Categories',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red.shade900,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
