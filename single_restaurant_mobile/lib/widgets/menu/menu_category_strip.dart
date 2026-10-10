import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/theme/app_responsive.dart';
import 'package:single_restaurant_mobile/utils/image_helper.dart';
import 'package:single_restaurant_mobile/widgets/common/pop_out_capsule_image.dart';

class MenuCategoryStrip extends StatefulWidget {
  final List<dynamic> displayCategories;
  final String? selectedCategoryId;
  final ValueChanged<String> onSelectCategory;
  final VoidCallback onMoreTap;

  const MenuCategoryStrip({
    super.key,
    required this.displayCategories,
    required this.selectedCategoryId,
    required this.onSelectCategory,
    required this.onMoreTap,
  });

  @override
  State<MenuCategoryStrip> createState() => _MenuCategoryStripState();
}

class _MenuCategoryStripState extends State<MenuCategoryStrip> {
  late final ScrollController _scrollController;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToSelected());
  }

  @override
  void didUpdateWidget(covariant MenuCategoryStrip oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.selectedCategoryId != oldWidget.selectedCategoryId) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToSelected());
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToSelected() {
    if (!mounted || !_scrollController.hasClients) return;
    if (widget.selectedCategoryId == null || widget.selectedCategoryId == 'all') {
      _scrollController.animateTo(
        0.0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
      );
      return;
    }
    final index = widget.displayCategories.indexWhere(
      (c) => c['_id'] == widget.selectedCategoryId,
    );
    if (index >= 0) {
      final offset = (index * 88.0 - 40.0).clamp(
        0.0,
        _scrollController.position.maxScrollExtent,
      );
      _scrollController.animateTo(
        offset,
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeOutCubic,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final textScaler = MediaQuery.textScalerOf(context);
    final stripHeight =
        (144.0 * (textScaler.scale(11.0) / 11.0)).clamp(142.0, 172.0);

    return Container(
      height: stripHeight,
      padding: const EdgeInsets.symmetric(vertical: 6),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.grey.shade300)),
      ),
      child: ListView.builder(
        controller: _scrollController,
        scrollDirection: Axis.horizontal,
        itemCount: widget.displayCategories.length + 1, // +1 for "More"
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemBuilder: (context, index) {
          if (index == widget.displayCategories.length) {
            return CategoryItemView(
              name: 'More',
              icon: Icons.grid_view,
              isSelected: false,
              onTap: widget.onMoreTap,
            );
          }
          final cat = widget.displayCategories[index];
          final isSelected = cat['_id'] == widget.selectedCategoryId;
          return CategoryItemView(
            name: cat['name'] ?? '',
            icon: cat['_id'] == 'all' ? Icons.fastfood : null,
            category: cat['_id'] == 'all' ? null : cat,
            isSelected: isSelected,
            onTap: () => widget.onSelectCategory(cat['_id']),
          );
        },
      ),
    );
  }
}

class CategoryItemView extends StatelessWidget {
  final String name;
  final IconData? icon;
  final Map<String, dynamic>? category;
  final bool isSelected;
  final bool inGrid;
  final VoidCallback? onTap;

  const CategoryItemView({
    super.key,
    required this.name,
    this.icon,
    this.category,
    this.isSelected = false,
    this.inGrid = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isTablet = AppResponsive.isTablet(context);
    final screenWidth = MediaQuery.sizeOf(context).width;
    final itemWidth = inGrid
        ? (isTablet ? 96.0 : (screenWidth < 350 ? 76.0 : 84.0))
        : 68.0;

    final imageUrl = category != null
        ? ImageHelper.getCategoryImageUrl(category!)
        : null;

    final tile = PopOutCapsuleImage(
      width: itemWidth,
      imageUrl: imageUrl,
      icon: icon,
      label: name,
      isSelected: isSelected,
      onTap: onTap,
    );

    if (inGrid) {
      return Center(child: tile);
    }

    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: tile,
    );
  }
}
