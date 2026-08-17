import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';

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

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final addons = item['addOns'] as List<dynamic>? ?? [];
    final basePrice = (item['price'] as num?)?.toDouble() ?? 0.0;
    
    double addonsTotal = 0.0;
    for (var index in _selectedAddOnIndices) {
      if (index < addons.length) {
        addonsTotal += (addons[index]['price'] as num?)?.toDouble() ?? 0.0;
      }
    }
    
    final totalPrice = (basePrice + addonsTotal) * _quantity;

    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
      decoration: const BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
      ),
      child: Column(
        children: [
          // Handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade400,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item['name'] ?? 'Item',
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, fontFamily: 'Serif'),
                  ),
                  const SizedBox(height: 8),
                  Text('\$${basePrice.toStringAsFixed(2)}', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.red.shade900)),
                  
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16.0),
                    child: Divider(color: Colors.black12, thickness: 1),
                  ),
                  
                  // Customize Your Order
                  if (addons.isNotEmpty) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Customize Your Order', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        Text('Optional', style: TextStyle(color: Colors.grey.shade500, fontSize: 14)),
                      ],
                    ),
                    const SizedBox(height: 16),
                    
                    ...List.generate(addons.length, (index) {
                      final addon = addons[index];
                      final isSelected = _selectedAddOnIndices.contains(index);
                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            if (isSelected) {
                              _selectedAddOnIndices.remove(index);
                            } else {
                              _selectedAddOnIndices.add(index);
                            }
                          });
                        },
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            border: Border.all(color: Colors.grey.shade200),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.red.shade900,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(Icons.extension, color: Colors.white, size: 20),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(addon['name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                  ],
                                ),
                              ),
                              Text('\$${(addon['price'] ?? 0).toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                              const SizedBox(width: 16),
                              Icon(
                                isSelected ? Icons.check_box : Icons.check_box_outline_blank,
                                color: isSelected ? Colors.red.shade900 : Colors.grey.shade400,
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                  ]
                ],
              ),
            ),
          ),
          
          // Bottom Bar
          Container(
            padding: EdgeInsets.only(
              left: 16, right: 16, top: 16,
              bottom: MediaQuery.of(context).padding.bottom + 16,
            ),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.05), offset: const Offset(0, -4), blurRadius: 10)
              ]
            ),
            child: SafeArea(
              child: Row(
                children: [
                  // Quantity
                  Container(
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade300),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.remove),
                          onPressed: () {
                            if (_quantity > 1) {
                              setState(() => _quantity--);
                            }
                          },
                        ),
                        Text('$_quantity', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        IconButton(
                          icon: const Icon(Icons.add),
                          onPressed: () {
                            setState(() => _quantity++);
                          },
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(width: 16),
                  
                  // Add to Cart
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        final selectedAddOns = _selectedAddOnIndices.map((idx) => addons[idx]).toList();
                        final newItem = Map<String, dynamic>.from(item);
                        newItem['quantity'] = _quantity;
                        newItem['addOns'] = selectedAddOns;
                        
                        widget.cartProvider.addItem(newItem, restaurantData: widget.restaurantProvider.restaurant);
                        
                        Navigator.pop(context);
                        ToastUtils.showSuccess(context, 'Item added to cart');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red.shade900,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                        elevation: 0,
                      ),
                      child: Text('Add to Cart - \$${totalPrice.toStringAsFixed(2)}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
