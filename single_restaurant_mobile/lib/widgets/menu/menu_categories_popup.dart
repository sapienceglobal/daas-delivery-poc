import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/theme/app_responsive.dart';
import 'package:single_restaurant_mobile/theme/app_spacing.dart';
import 'package:single_restaurant_mobile/widgets/common/app_bottom_sheet.dart';
import 'package:single_restaurant_mobile/widgets/menu/menu_category_strip.dart';

/// Modal bottom sheet popup displaying all categories in a responsive grid.
class MenuCategoriesPopup {
  static void show({
    required BuildContext context,
    required List<dynamic> categories,
    required String? selectedCategoryId,
    required ValueChanged<String> onSelectCategory,
  }) {
    final isTablet = AppResponsive.isTablet(context);
    final columns = isTablet ? 5 : 3;

    AppBottomSheet.show(
      context: context,
      builder: (context) {
        return AppBottomSheet(
          title: 'All Categories',
          padding: EdgeInsets.zero,
          child: GridView.builder(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical: AppSpacing.md,
            ),
            shrinkWrap: true,
            physics: const ClampingScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: columns,
              childAspectRatio: 0.65,
              crossAxisSpacing: AppSpacing.md,
              mainAxisSpacing: AppSpacing.md,
            ),
            itemCount: categories.length,
            itemBuilder: (context, index) {
              final cat = categories[index];
              final isSelected = cat['_id'] == selectedCategoryId;
              return GestureDetector(
                onTap: () {
                  onSelectCategory(cat['_id']);
                  Navigator.pop(context);
                },
                child: CategoryItemView(
                  name: cat['name'] ?? '',
                  category: cat,
                  isSelected: isSelected,
                  inGrid: true,
                ),
              );
            },
          ),
        );
      },
    );
  }
}
