import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/utils/image_helper.dart';
import 'package:single_restaurant_mobile/screens/item_detail_screen.dart';

class CartItemCard extends StatelessWidget {
  final Map<String, dynamic> item;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;
  final VoidCallback onDelete;

  const CartItemCard({
    super.key,
    required this.item,
    required this.onIncrement,
    required this.onDecrement,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final name = item['name'] ?? 'Unknown Item';
    final quantity = (item['quantity'] ?? item['qty'] ?? 1) as int;
    final lineTotal = (item['lineTotal'] ?? ((item['price'] ?? 0.0) * quantity)) as num;
    final imageUrl = item['image'];
    
    // Addons logic
    final addOns = item['addOns'] as List?;
    final isVeg = item['isVeg'] ?? true;
    final isSpicy = item['isSpicy'] ?? false;
    final spiceText = isSpicy ? 'Medium' : 'Mild';
    
    final goToDetail = () {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ItemDetailScreen(item: item),
        ),
      );
    };

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.only(bottom: 16),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFF3F4F6))),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image
          GestureDetector(
            onTap: goToDetail,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: SizedBox(
                width: 75,
                height: 75,
                child: ImageHelper.buildDishImage(item, fit: BoxFit.cover),
              ),
            ),
          ),
          const SizedBox(width: 14),
          
          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Row: Title, Veg/Non-Veg icon, and Trash
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: goToDetail,
                        behavior: HitTestBehavior.opaque,
                        child: Row(
                          children: [
                          Flexible(
                            child: Text(
                              name,
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: Color(0xFF1F2937)),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 6),
                          // Veg/Non-veg icon
                          Container(
                            width: 14,
                            height: 14,
                            decoration: BoxDecoration(
                              border: Border.all(color: isVeg ? Colors.green : const Color(0xFF7A0B10)),
                              borderRadius: BorderRadius.circular(3),
                            ),
                            alignment: Alignment.center,
                            child: Container(
                              width: 6,
                              height: 6,
                              decoration: BoxDecoration(
                                color: isVeg ? Colors.green : const Color(0xFF7A0B10),
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Icon(Icons.local_fire_department, size: 14, color: isSpicy ? Colors.red.shade900 : Colors.grey.shade400),
                          const SizedBox(width: 2),
                          Text(spiceText, style: TextStyle(color: Colors.grey.shade600, fontSize: 11)),
                        ],
                      ),
                    )),
                    GestureDetector(
                      onTap: onDelete,
                      child: const Icon(Icons.delete_outline, color: Color(0xFF9CA3AF), size: 20),
                    )
                  ],
                ),
                
                // Addons / Size
                const SizedBox(height: 2),
                GestureDetector(
                  onTap: goToDetail,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item['selectedSize'] != null ? item['selectedSize']['name'] ?? 'Regular' : 'Regular',
                        style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12),
                      ),
                      if (addOns != null && addOns.isNotEmpty)
                        ...addOns.map<Widget>((a) => Text(
                          '+ ${a['name']}',
                          style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        )),
                    ],
                  ),
                ),
                
                const SizedBox(height: 12),
                
                // Bottom Row: Unit Price, Stepper, Total Price
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Unit Price
                    GestureDetector(
                      onTap: goToDetail,
                      child: Text(
                        '\$${((item['price'] ?? 0.0) as num).toStringAsFixed(2)}',
                        style: const TextStyle(
                          color: Color(0xFF7A0B10),
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    
                    // Stepper and Total Price
                    Row(
                      children: [
                        Container(
                          height: 32,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFFE5E7EB)),
                          ),
                          child: Row(
                            children: [
                              InkWell(
                                onTap: onDecrement,
                                child: const Padding(
                                  padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  child: Icon(Icons.remove, size: 16, color: Color(0xFF6B7280)),
                                ),
                              ),
                              Text(
                                '$quantity',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF374151)),
                              ),
                              InkWell(
                                onTap: onIncrement,
                                child: const Padding(
                                  padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  child: Icon(Icons.add, size: 16, color: Color(0xFF7A0B10)),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 14),
                        // Total Price
                        Text(
                          '\$${lineTotal.toStringAsFixed(2)}',
                          style: const TextStyle(
                            color: Color(0xFF7A0B10),
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                          textAlign: TextAlign.right,
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
