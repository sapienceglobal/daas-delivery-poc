import 'package:flutter/material.dart';

class ItemDetailOptions extends StatelessWidget {
  final List<dynamic> sizes;
  final int? selectedSizeIndex;
  final ValueChanged<int> onSelectSize;
  final List<Map<String, dynamic>> addons;
  final Set<int> selectedAddOnIndices;
  final ValueChanged<int> onToggleAddon;
  final String selectedSpiceLevel;

  const ItemDetailOptions({
    super.key,
    required this.sizes,
    required this.selectedSizeIndex,
    required this.onSelectSize,
    required this.addons,
    required this.selectedAddOnIndices,
    required this.onToggleAddon,
    required this.selectedSpiceLevel,
  });

  static const List<Map<String, String>> _spiceOptions = [
    {'label': 'Mild', 'icon': '🌶'},
    {'label': 'Medium', 'icon': '🌶'},
    {'label': 'Spicy', 'icon': '🌶'},
    {'label': 'Extra Spicy', 'icon': '🌶🌶'},
  ];

  Widget _buildSpicePill(Map<String, String> option) {
    final label = option['label']!;
    final icon = option['icon']!;
    final isSelected = selectedSpiceLevel.toLowerCase() == label.toLowerCase() ||
        (selectedSpiceLevel.toLowerCase().contains('mild') && label == 'Mild') ||
        (selectedSpiceLevel.toLowerCase().contains('medium') && label == 'Medium') ||
        (selectedSpiceLevel.toLowerCase().contains('extra') && label == 'Extra Spicy') ||
        (selectedSpiceLevel.toLowerCase() == 'spicy' && label == 'Spicy');

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: isSelected ? const Color(0xFFFBF4EE) : const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isSelected ? const Color(0xFF8B1818) : const Color(0xFFE5E7EB),
          width: isSelected ? 1.5 : 1.0,
        ),
        boxShadow: isSelected
            ? [
                BoxShadow(
                  color: const Color(0xFF8B1818).withValues(alpha: 0.08),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
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
              color: isSelected
                  ? const Color(0xFF8B1818)
                  : const Color(0xFF9CA3AF),
            ),
          ),
          if (isSelected) ...[
            const SizedBox(width: 5),
            const Icon(
              Icons.check_circle_rounded,
              size: 14,
              color: Color(0xFF8B1818),
            ),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Item Spice Level Header
        Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: const BoxDecoration(
                color: Color(0xFFFDE8E8),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.local_fire_department_rounded,
                color: Color(0xFFDC2626),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Item Spice Level',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF111827),
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Standard preparation for this item',
                  style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                ),
              ],
            ),
          ],
        ),

        const SizedBox(height: 14),

        // 4 Spice Pills (scrollable or snug row)
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          child: Row(
            children: _spiceOptions.map((opt) {
              return Padding(
                padding: const EdgeInsets.only(right: 8.0),
                child: _buildSpicePill(opt),
              );
            }).toList(),
          ),
        ),

        const Padding(
          padding: EdgeInsets.symmetric(vertical: 20.0),
          child: Divider(color: Color(0xFFF3F4F6), thickness: 1, height: 1),
        ),

        // Size Variations (if any)
        if (sizes.isNotEmpty) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Size',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              Text(
                'Required',
                style: TextStyle(color: Colors.red.shade900, fontSize: 13),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...List.generate(sizes.length, (index) {
            final size = sizes[index];
            final isSelected = selectedSizeIndex == index;
            return GestureDetector(
              onTap: () => onSelectSize(index),
              child: Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFFFBF4EE) : Colors.white,
                  border: Border.all(
                    color: isSelected
                        ? const Color(0xFF8B1818)
                        : Colors.grey.shade200,
                    width: isSelected ? 1.5 : 1,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(
                      isSelected
                          ? Icons.radio_button_checked
                          : Icons.radio_button_unchecked,
                      color: isSelected
                          ? const Color(0xFF8B1818)
                          : Colors.grey.shade400,
                      size: 20,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        size['name'] ?? '',
                        style: const TextStyle(
                            fontWeight: FontWeight.w600, fontSize: 13.5),
                      ),
                    ),
                    Text(
                      '\$${((size['price'] as num?) ?? 0.0).toStringAsFixed(2)}',
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 13.5),
                    ),
                  ],
                ),
              ),
            );
          }),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16.0),
            child: Divider(color: Color(0xFFF3F4F6), thickness: 1, height: 1),
          ),
        ],

        // Customize Your Order / Add-ons (if any)
        if (addons.isNotEmpty) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Customize Your Order',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              Text(
                'Optional',
                style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...List.generate(addons.length, (index) {
            final addon = addons[index];
            final isSelected = selectedAddOnIndices.contains(index);
            return GestureDetector(
              onTap: () => onToggleAddon(index),
              child: Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFFFBF4EE) : Colors.white,
                  border: Border.all(
                    color: isSelected
                        ? const Color(0xFF8B1818)
                        : Colors.grey.shade200,
                    width: isSelected ? 1.5 : 1,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(
                      isSelected
                          ? Icons.check_box
                          : Icons.check_box_outline_blank,
                      color: isSelected
                          ? const Color(0xFF8B1818)
                          : Colors.grey.shade400,
                      size: 20,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        addon['name'] ?? '',
                        style: const TextStyle(
                            fontWeight: FontWeight.w600, fontSize: 13.5),
                      ),
                    ),
                    Text(
                      '\$${((addon['price'] as num?) ?? 0.0).toStringAsFixed(2)}',
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 13.5),
                    ),
                  ],
                ),
              ),
            );
          }),
        ],
      ],
    );
  }
}
