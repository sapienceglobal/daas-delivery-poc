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

  static Widget _buildVegSymbol({required bool isVeg, double size = 13}) {
    final color = isVeg ? const Color(0xFF2E7D32) : const Color(0xFFC62828);
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: color, width: 1.3),
        borderRadius: BorderRadius.circular(3),
      ),
      alignment: Alignment.center,
      child: Container(
        width: size * 0.46,
        height: size * 0.46,
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
        ),
      ),
    );
  }

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
                              _buildVegSymbol(isVeg: vegFilter == 'Veg', size: 12),
                              const SizedBox(width: 5),
                              Text(
                                vegFilter,
                                style: TextStyle(
                                  color: vegFilter == 'Veg'
                                      ? const Color(0xFF2E7D32)
                                      : const Color(0xFFC62828),
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
                            dropdownColor: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            elevation: 4,
                            icon: const Icon(Icons.keyboard_arrow_down, size: 16),
                            selectedItemBuilder: (BuildContext context) {
                              return availableVegFilters.map<Widget>((String value) {
                                final String displayLabel = value == 'All'
                                    ? (isExtraNarrow ? 'All' : 'Veg & Non-Veg')
                                    : value;
                                final Color textColor = value == 'Veg'
                                    ? const Color(0xFF2E7D32)
                                    : value == 'Non-Veg'
                                        ? const Color(0xFFC62828)
                                        : Colors.black87;

                                return Row(
                                  mainAxisSize: MainAxisSize.min,
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    if (value == 'Veg') ...[
                                      _buildVegSymbol(isVeg: true, size: 12),
                                      const SizedBox(width: 5),
                                    ] else if (value == 'Non-Veg') ...[
                                      _buildVegSymbol(isVeg: false, size: 12),
                                      const SizedBox(width: 5),
                                    ],
                                    Text(
                                      displayLabel,
                                      style: TextStyle(
                                        color: textColor,
                                        fontWeight: FontWeight.bold,
                                        fontSize: isNarrow ? 12.5 : 13.5,
                                      ),
                                    ),
                                  ],
                                );
                              }).toList();
                            },
                            onChanged: (v) {
                              if (v != null) onVegFilterChanged(v);
                            },
                            items: availableVegFilters.map((String value) {
                              final String displayLabel = value == 'All'
                                  ? (isExtraNarrow ? 'All' : 'Veg & Non-Veg')
                                  : value;
                              final Color itemColor = value == 'Veg'
                                  ? const Color(0xFF2E7D32)
                                  : value == 'Non-Veg'
                                      ? const Color(0xFFC62828)
                                      : const Color(0xFF1E293B);

                              return DropdownMenuItem<String>(
                                value: value,
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    if (value == 'Veg') ...[
                                      _buildVegSymbol(isVeg: true, size: 13),
                                      const SizedBox(width: 8),
                                    ] else if (value == 'Non-Veg') ...[
                                      _buildVegSymbol(isVeg: false, size: 13),
                                      const SizedBox(width: 8),
                                    ] else ...[
                                      const Icon(
                                        Icons.restaurant,
                                        size: 14,
                                        color: Color(0xFF64748B),
                                      ),
                                      const SizedBox(width: 8),
                                    ],
                                    Text(
                                      displayLabel,
                                      style: TextStyle(
                                        color: itemColor,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13.5,
                                      ),
                                    ),
                                  ],
                                ),
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
                          dropdownColor: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          elevation: 4,
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
