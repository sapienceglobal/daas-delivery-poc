import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/theme/app_radius.dart';
import 'package:single_restaurant_mobile/theme/app_spacing.dart';
import 'package:single_restaurant_mobile/utils/spice_helper.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';
import 'package:single_restaurant_mobile/widgets/common/app_bottom_sheet.dart';
import 'package:single_restaurant_mobile/widgets/common/app_button.dart';

/// Modal bottom sheet for dish customization (sizes, add-ons, quantity).
/// Wraps in AppBottomSheet with a sticky responsive checkout CTA.
class CustomizationBottomSheet extends StatefulWidget {
  final Map<String, dynamic> item;
  final CartProvider cartProvider;
  final RestaurantProvider restaurantProvider;

  const CustomizationBottomSheet({
    super.key,
    required this.item,
    required this.cartProvider,
    required this.restaurantProvider,
  });

  @override
  State<CustomizationBottomSheet> createState() => _CustomizationBottomSheetState();
}

class _CustomizationBottomSheetState extends State<CustomizationBottomSheet> {
  final Set<int> _selectedAddOnIndices = {};
  int _quantity = 1;
  int? _selectedSizeIndex;
  late String _selectedSpiceLevel;

  static const List<Map<String, String>> _spiceOptions = [
    {'label': 'Mild', 'icon': '🌶'},
    {'label': 'Medium', 'icon': '🌶'},
    {'label': 'Spicy', 'icon': '🌶'},
    {'label': 'Extra Spicy', 'icon': '🌶🌶'},
  ];

  @override
  void initState() {
    super.initState();
    final canSelectSpice = SpiceHelper.canCustomizeSpice(widget.item);
    final customSpice = widget.item['spiceLevel'] ?? widget.item['spicyLevel'];
    final isSpicy = widget.item['isSpicy'] ?? false;
    _selectedSpiceLevel = canSelectSpice
        ? (customSpice != null
            ? customSpice.toString()
            : (isSpicy ? 'Medium' : 'Mild'))
        : '';

    final sizes = widget.item['sizeVariations'] as List<dynamic>? ?? [];
    if (sizes.isNotEmpty) {
      _selectedSizeIndex = 0;
    }
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final canSelectSpice = SpiceHelper.canCustomizeSpice(item);
    final addons = item['addOns'] as List<dynamic>? ?? [];
    final sizes = item['sizeVariations'] as List<dynamic>? ?? [];

    double basePrice = (item['price'] as num?)?.toDouble() ?? 0.0;
    if (sizes.isNotEmpty && _selectedSizeIndex != null && _selectedSizeIndex! < sizes.length) {
      basePrice = (sizes[_selectedSizeIndex!]['price'] as num?)?.toDouble() ?? 0.0;
    }

    double addonsTotal = 0.0;
    for (var index in _selectedAddOnIndices) {
      if (index < addons.length) {
        addonsTotal += (addons[index]['price'] as num?)?.toDouble() ?? 0.0;
      }
    }

    final totalPrice = (basePrice + addonsTotal) * _quantity;

    return AppBottomSheet(
      title: item['name'] ?? 'Item',
      subtitle: '\$${basePrice.toStringAsFixed(2)}',
      stickyFooter: Row(
        children: [
          // Quantity Stepper
          Container(
            height: 48,
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.border),
              borderRadius: AppRadius.borderFull,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: const Icon(Icons.remove, size: 18),
                  onPressed: () {
                    if (_quantity > 1) {
                      setState(() => _quantity--);
                    }
                  },
                  splashRadius: 20,
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xs),
                  child: Text(
                    '$_quantity',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.add, size: 18),
                  onPressed: () {
                    setState(() => _quantity++);
                  },
                  splashRadius: 20,
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          // Add to Cart Primary Button
          Expanded(
            child: AppButton(
              text: 'Add to Cart - \$${totalPrice.toStringAsFixed(2)}',
              onPressed: () {
                final selectedAddOns = _selectedAddOnIndices.map((idx) => addons[idx]).toList();
                final newItem = Map<String, dynamic>.from(item);
                newItem['quantity'] = _quantity;
                newItem['addOns'] = selectedAddOns;
                if (canSelectSpice && _selectedSpiceLevel.isNotEmpty) {
                  newItem['selectedSpiceLevel'] = _selectedSpiceLevel;
                } else {
                  newItem.remove('selectedSpiceLevel');
                }
                if (sizes.isNotEmpty && _selectedSizeIndex != null) {
                  newItem['selectedSize'] = sizes[_selectedSizeIndex!];
                  newItem['price'] = (sizes[_selectedSizeIndex!]['price'] as num?)?.toDouble() ?? 0.0;
                } else {
                  newItem['price'] = basePrice;
                }

                widget.cartProvider.addItem(
                  newItem,
                  restaurantData: widget.restaurantProvider.restaurant,
                );

                Navigator.pop(context);
                ToastUtils.showCartSuccess(context);
              },
              variant: AppButtonVariant.primary,
              size: AppButtonSize.large,
            ),
          ),
        ],
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Spice Level Selection (for spice-eligible items)
            if (canSelectSpice) ...[
              const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Spice Level', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  Text('Select preference', style: TextStyle(color: AppColors.textLight, fontSize: 13)),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                child: Row(
                  children: _spiceOptions.map((opt) {
                    final label = opt['label']!;
                    final icon = opt['icon']!;
                    final isSelected = _selectedSpiceLevel.toLowerCase() == label.toLowerCase();
                    return Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: GestureDetector(
                        onTap: () => setState(() => _selectedSpiceLevel = label),
                        behavior: HitTestBehavior.opaque,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: isSelected ? const Color(0xFFFBF4EE) : const Color(0xFFF9FAFB),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: isSelected ? AppColors.brandRed : AppColors.border,
                              width: isSelected ? 1.5 : 1.0,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(icon, style: const TextStyle(fontSize: 13)),
                              const SizedBox(width: 5),
                              Text(
                                label,
                                style: TextStyle(
                                  fontSize: 12.5,
                                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                  color: isSelected ? AppColors.brandRed : const Color(0xFF4B5563),
                                ),
                              ),
                              if (isSelected) ...[
                                const SizedBox(width: 5),
                                const Icon(Icons.check_circle_rounded, size: 14, color: AppColors.brandRed),
                              ],
                            ],
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
                child: Divider(color: AppColors.borderSubtle, thickness: 1),
              ),
            ],

            // Size Variations
            if (sizes.isNotEmpty) ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Size', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const Text('Required', style: TextStyle(color: AppColors.brandRed, fontSize: 13, fontWeight: FontWeight.w600)),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              ...List.generate(sizes.length, (index) {
                final size = sizes[index];
                final isSelected = _selectedSizeIndex == index;
                return InkWell(
                  onTap: () {
                    setState(() {
                      _selectedSizeIndex = index;
                    });
                  },
                  borderRadius: AppRadius.borderMd,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: AppSpacing.sm),
                    padding: const EdgeInsets.all(AppSpacing.md),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.brandRed.withValues(alpha: 0.04) : AppColors.resolveSurface(context),
                      border: Border.all(
                        color: isSelected ? AppColors.brandRed : AppColors.border,
                        width: isSelected ? 2 : 1,
                      ),
                      borderRadius: AppRadius.borderMd,
                    ),
                    child: Row(
                      children: [
                        Icon(
                          isSelected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                          color: isSelected ? AppColors.brandRed : AppColors.textLight,
                          size: 20,
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Text(
                            size['name'] ?? '',
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                          ),
                        ),
                        Text(
                          '\$${((size['price'] as num?) ?? 0.0).toStringAsFixed(2)}',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                      ],
                    ),
                  ),
                );
              }),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
                child: Divider(color: AppColors.borderSubtle, thickness: 1),
              ),
            ],

            // Add-Ons
            if (addons.isNotEmpty) ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Add-Ons', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const Text('Optional', style: TextStyle(color: AppColors.textLight, fontSize: 13)),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              ...List.generate(addons.length, (index) {
                final addon = addons[index];
                final isSelected = _selectedAddOnIndices.contains(index);
                return InkWell(
                  onTap: () {
                    setState(() {
                      if (isSelected) {
                        _selectedAddOnIndices.remove(index);
                      } else {
                        _selectedAddOnIndices.add(index);
                      }
                    });
                  },
                  borderRadius: AppRadius.borderMd,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: AppSpacing.sm),
                    padding: const EdgeInsets.all(AppSpacing.md),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.brandRed.withValues(alpha: 0.04) : AppColors.resolveSurface(context),
                      border: Border.all(
                        color: isSelected ? AppColors.brandRed : AppColors.border,
                        width: isSelected ? 2 : 1,
                      ),
                      borderRadius: AppRadius.borderMd,
                    ),
                    child: Row(
                      children: [
                        Icon(
                          isSelected ? Icons.check_box : Icons.check_box_outline_blank,
                          color: isSelected ? AppColors.brandRed : AppColors.textLight,
                          size: 20,
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                addon['name'] ?? '',
                                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                              ),
                              if (addon['description'] != null && addon['description'].toString().isNotEmpty)
                                Text(
                                  addon['description'],
                                  style: const TextStyle(color: AppColors.textLight, fontSize: 12),
                                ),
                            ],
                          ),
                        ),
                        Text(
                          '\$${((addon['price'] as num?) ?? 0.0).toStringAsFixed(2)}',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                      ],
                    ),
                  ),
                );
              }),
              const SizedBox(height: AppSpacing.lg),
            ],
          ],
        ),
      ),
    );
  }
}
