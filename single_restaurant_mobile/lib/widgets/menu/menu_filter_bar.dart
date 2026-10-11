import 'package:flutter/material.dart';

class MenuFilterBar extends StatelessWidget {
  final String vegFilter;
  final List<String> availableVegFilters;
  final String sortOrder;
  final ValueChanged<String> onVegFilterChanged;
  final ValueChanged<String> onSortOrderChanged;

  const MenuFilterBar({
    super.key,
    required this.vegFilter,
    this.availableVegFilters = const ['All', 'Veg', 'Non-Veg'],
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
                      if (availableVegFilters.length == 1)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                          decoration: BoxDecoration(
                            color: vegFilter == 'Veg'
                                ? const Color(0xFFE8F5E9)
                                : const Color(0xFFFFEBEE),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: vegFilter == 'Veg'
                                  ? const Color(0xFFA5D6A7)
                                  : const Color(0xFFEF9A9A),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: vegFilter == 'Veg'
                                      ? const Color(0xFF2E7D32)
                                      : const Color(0xFF8B1E1E),
                                ),
                              ),
                              const SizedBox(width: 5),
                              Text(
                                vegFilter,
                                style: TextStyle(
                                  color: vegFilter == 'Veg'
                                      ? const Color(0xFF2E7D32)
                                      : const Color(0xFF8B1E1E),
                                  fontWeight: FontWeight.bold,
                                  fontSize: isNarrow ? 12.0 : 13.0,
                                ),
                              ),
                            ],
                          ),
                        )
                      else
                        DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: availableVegFilters.contains(vegFilter)
                                ? vegFilter
                                : availableVegFilters.first,
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
                            items: availableVegFilters.map((String value) {
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
