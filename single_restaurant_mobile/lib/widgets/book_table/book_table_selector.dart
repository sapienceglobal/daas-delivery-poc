import 'package:flutter/material.dart';

class BookTableSelector extends StatelessWidget {
  final List<dynamic> tables;
  final String? selectedTableId;
  final ValueChanged<String?> onTableSelected;

  const BookTableSelector({
    super.key,
    required this.tables,
    required this.selectedTableId,
    required this.onTableSelected,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 180,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: tables.length,
        itemBuilder: (context, index) {
          final table = tables[index];
          final tableId = table['_id'] ?? table['id'];
          final isSelected = selectedTableId == tableId;
          final capacity = table['capacity'] ?? 4;
          final minCapacity = capacity > 2 ? capacity - 2 : 1;

          return GestureDetector(
            onTap: () {
              if (isSelected) {
                onTableSelected(null);
              } else {
                onTableSelected(tableId);
              }
            },
            child: Container(
              width: 140,
              margin: const EdgeInsets.only(right: 16),
              decoration: BoxDecoration(
                color: isSelected ? Colors.red.shade50 : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isSelected ? Colors.red.shade900 : Colors.grey.shade200,
                  width: isSelected ? 2 : 1,
                ),
              ),
              child: Stack(
                children: [
                  if (isSelected)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          color: Colors.red.shade900,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.check, color: Colors.white, size: 12),
                      ),
                    ),
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 60,
                          height: 60,
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey.shade400, width: 1.5),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Center(
                            child: Container(
                              width: 30,
                              height: 30,
                              decoration: BoxDecoration(
                                color: Colors.red.shade900,
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: Text(
                                  table['tableNumber'] ?? '${index + 1}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Table ${table['tableNumber'] ?? index + 1}',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Best for $minCapacity - $capacity Guests',
                          style: TextStyle(color: Colors.grey.shade600, fontSize: 10),
                        ),
                        const Spacer(),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(vertical: 6),
                          decoration: BoxDecoration(
                            color: isSelected ? Colors.red.shade900 : Colors.white,
                            border: Border.all(
                              color: isSelected ? Colors.transparent : Colors.grey.shade300,
                            ),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Center(
                            child: Text(
                              isSelected ? 'Recommended' : 'Select',
                              style: TextStyle(
                                color: isSelected ? Colors.white : Colors.black87,
                                fontSize: 11,
                                fontWeight:
                                    isSelected ? FontWeight.bold : FontWeight.normal,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
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
