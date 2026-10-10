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
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final width = constraints.maxWidth;
          final bool isNarrow = width < 380;
          final bool isExtraNarrow = width < 340;

          return FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.center,
            child: ConstrainedBox(
              constraints: BoxConstraints(minWidth: width),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Left section: Filters & Veg dropdown
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.filter_alt_outlined,
                        size: isNarrow ? 18 : 20,
                        color: Colors.black87,
                      ),
                      const SizedBox(width: 4),
                      if (!isNarrow) ...[
                        const Text(
                          'Filters',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13.5,
                            color: Colors.black87,
                          ),
                        ),
                        const SizedBox(width: 8),
                      ],
                      DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: vegFilter,
                          isDense: true,
                          icon: const Icon(Icons.keyboard_arrow_down, size: 16),
                          style: TextStyle(
                            color: vegFilter == 'Veg'
                                ? const Color(0xFF2E7D32)
                                : vegFilter == 'Non-Veg'
                                    ? const Color(0xFF8B1E1E)
                                    : Colors.black87,
                            fontWeight: FontWeight.bold,
                            fontSize: isNarrow ? 12.5 : 13.5,
                          ),
                          onChanged: (v) {
                            if (v != null) onVegFilterChanged(v);
                          },
                          items: ['All', 'Veg', 'Non-Veg'].map((String value) {
                            final String displayLabel = value == 'All'
                                ? (isExtraNarrow ? 'All' : 'Veg & Non-Veg')
                                : value;
                            return DropdownMenuItem<String>(
                              value: value,
                              child: Text(displayLabel),
                            );
                          }).toList(),
                        ),
                      ),
                    ],
                  ),

                  // Right section: Sort by dropdown
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        isNarrow ? 'Sort: ' : 'Sort by ',
                        style: TextStyle(
                          color: Colors.grey.shade600,
                          fontSize: isNarrow ? 12.0 : 13.0,
                        ),
                      ),
                      DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: sortOrder,
                          isDense: true,
                          icon: const Icon(Icons.keyboard_arrow_down, size: 16),
                          style: TextStyle(
                            color: const Color(0xFF8B1E1E),
                            fontWeight: FontWeight.bold,
                            fontSize: isNarrow ? 12.5 : 13.5,
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
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
