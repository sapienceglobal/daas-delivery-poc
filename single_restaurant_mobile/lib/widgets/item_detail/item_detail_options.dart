import 'package:flutter/material.dart';

class ItemDetailOptions extends StatelessWidget {
  final List<dynamic> sizes;
  final int? selectedSizeIndex;
  final ValueChanged<int> onSelectSize;
  final List<Map<String, dynamic>> addons;
  final Set<int> selectedAddOnIndices;
  final ValueChanged<int> onToggleAddon;

  const ItemDetailOptions({
    super.key,
    required this.sizes,
    required this.selectedSizeIndex,
    required this.onSelectSize,
    required this.addons,
    required this.selectedAddOnIndices,
    required this.onToggleAddon,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Size Variations
        if (sizes.isNotEmpty) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Expanded(
                child: Text(
                  'Size',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Text(
                'Required',
                style: TextStyle(color: Colors.red.shade900, fontSize: 14),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...List.generate(sizes.length, (index) {
            final size = sizes[index];
            final isSelected = selectedSizeIndex == index;
            return GestureDetector(
              onTap: () => onSelectSize(index),
              child: Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border.all(
                    color: isSelected
                        ? Colors.red.shade900
                        : Colors.grey.shade200,
                    width: isSelected ? 2 : 1,
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
                          ? Colors.red.shade900
                          : Colors.grey.shade400,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        size['name'] ?? '',
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ),
                    Text(
                      '\$${((size['price'] as num?) ?? 0.0).toStringAsFixed(2)}',
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                  ],
                ),
              ),
            );
          }),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16.0),
            child: Divider(color: Colors.black12, thickness: 1),
          ),
        ],

        // Customize Your Order
        if (addons.isNotEmpty) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Expanded(
                child: Text(
                  'Customize Your Order',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Text(
                'Optional',
                style: TextStyle(color: Colors.grey.shade500, fontSize: 14),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...List.generate(addons.length, (index) {
            final addon = addons[index];
            final isSelected = selectedAddOnIndices.contains(index);
            return GestureDetector(
              onTap: () => onToggleAddon(index),
              child: Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border.all(
                    color: isSelected
                        ? Colors.red.shade900
                        : Colors.grey.shade200,
                    width: isSelected ? 2 : 1,
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
                          ? Colors.red.shade900
                          : Colors.grey.shade400,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            addon['name'] ?? '',
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          if (addon['description'] != null)
                            Text(
                              addon['description'] ?? '',
                              style: TextStyle(
                                  color: Colors.grey.shade600, fontSize: 12),
                            ),
                        ],
                      ),
                    ),
                    Text(
                      '\$${((addon['price'] as num?) ?? 0.0).toStringAsFixed(2)}',
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 14),
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
