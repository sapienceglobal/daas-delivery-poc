import 'package:flutter/material.dart';

class MenuFilterBar extends StatelessWidget {
  final String vegFilter;
  final String sortOrder;
  final ValueChanged<String> onVegFilterChanged;
  final ValueChanged<String> onSortOrderChanged;

  const MenuFilterBar({
    super.key,
    required this.vegFilter,
    required this.sortOrder,
    required this.onVegFilterChanged,
    required this.onSortOrderChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.grey.shade300)),
      ),
      child: Wrap(
        alignment: WrapAlignment.spaceBetween,
        crossAxisAlignment: WrapCrossAlignment.center,
        runSpacing: 4,
        children: [
          // Left section: Filters & Veg dropdown
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.filter_alt_outlined,
                  size: 20, color: Colors.black87),
              const SizedBox(width: 4),
              const Text('Filters',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(width: 12),
              DropdownButton<String>(
                value: vegFilter,
                icon: const Icon(Icons.keyboard_arrow_down, size: 16),
                underline: const SizedBox(),
                style: const TextStyle(
                  color: Colors.black87,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
                onChanged: (v) {
                  if (v != null) onVegFilterChanged(v);
                },
                items: ['All', 'Veg', 'Non-Veg'].map((String value) {
                  return DropdownMenuItem<String>(
                    value: value,
                    child: Text(value == 'All' ? 'Veg & Non-Veg' : value),
                  );
                }).toList(),
              ),
            ],
          ),

          // Right section: Sort by dropdown
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Sort by ', style: TextStyle(color: Colors.grey)),
              DropdownButton<String>(
                value: sortOrder,
                icon: const Icon(Icons.keyboard_arrow_down, size: 16),
                underline: const SizedBox(),
                style: TextStyle(
                  color: Colors.red.shade900,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
                onChanged: (v) {
                  if (v != null) onSortOrderChanged(v);
                },
                items: [
                  'Popularity',
                  'Price: Low to High',
                  'Price: High to Low'
                ].map((String value) {
                  return DropdownMenuItem<String>(
                    value: value,
                    child: Text(value),
                  );
                }).toList(),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
