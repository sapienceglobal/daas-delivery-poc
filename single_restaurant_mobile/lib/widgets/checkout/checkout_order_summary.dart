import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/utils/cart_helper.dart';
import 'package:single_restaurant_mobile/utils/formatters.dart';

class CheckoutOrderSummary extends StatefulWidget {
  final CartProvider cart;
  final Map<String, dynamic>? restaurant;

  const CheckoutOrderSummary({
    super.key,
    required this.cart,
    this.restaurant,
  });

  @override
  State<CheckoutOrderSummary> createState() => _CheckoutOrderSummaryState();
}

class _CheckoutOrderSummaryState extends State<CheckoutOrderSummary> {
  bool _isExpanded = true;

  @override
  Widget build(BuildContext context) {
    final cart = widget.cart;
    final restaurant = widget.restaurant;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          InkWell(
            onTap: () {
              setState(() {
                _isExpanded = !_isExpanded;
              });
            },
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'ORDER SUMMARY',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.2,
                      color: Colors.black87,
                    ),
                  ),
                  Row(
                    children: [
                      Text(
                        '${cart.items.length} Items',
                        style: const TextStyle(
                          color: Color(0xFF7A0B10),
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Icon(
                        _isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                        color: const Color(0xFF7A0B10),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          if (_isExpanded) ...[
            const Divider(height: 1, thickness: 1),
            ...cart.items.map((item) {
              final quantity = (item['quantity'] ?? item['qty'] ?? 1) as int;
              final price = (item['price'] as num).toDouble();
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        width: 50,
                        height: 50,
                        color: Colors.grey.shade200,
                        child: item['image'] != null && item['image'].toString().startsWith('http')
                            ? CachedNetworkImage(
                                imageUrl: item['image'],
                                fit: BoxFit.cover,
                                errorWidget: (context, url, error) => Image.asset(
                                  'assets/images/branded/lassi-lounge/categories/appetizers.jpg',
                                  fit: BoxFit.cover,
                                ),
                              )
                            : Image.asset(
                                'assets/images/branded/lassi-lounge/categories/appetizers.jpg',
                                fit: BoxFit.cover,
                              ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item['name'] ?? 'Item',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                    ),
                                    if (item['selectedSize'] != null)
                                      Text(
                                        item['selectedSize']['name'],
                                        style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                                      ),
                                    if (item['addOns'] != null && (item['addOns'] as List).isNotEmpty)
                                      ...((item['addOns'] as List).map(
                                        (a) => Text(
                                          '+ ${a['name']}',
                                          style: TextStyle(color: Colors.grey.shade500, fontSize: 11),
                                        ),
                                      )),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                Formatters.formatCurrency(price * quantity, restaurant?['currency']),
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: Colors.red.shade100),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                InkWell(
                                  onTap: () => cart.updateQuantity(cart.items.indexOf(item), quantity - 1),
                                  child: const Padding(
                                    padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    child: Icon(Icons.remove, size: 16, color: Color(0xFF7A0B10)),
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 4),
                                  child: Text('$quantity', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                ),
                                InkWell(
                                  onTap: () {
                                    final restProv = Provider.of<RestaurantProvider>(context, listen: false);
                                    AddToCartHelper.handleAddToCart(context, item, cart, restProv);
                                  },
                                  child: const Padding(
                                    padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    child: Icon(Icons.add, size: 16, color: Color(0xFF7A0B10)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),
          ]
        ],
      ),
    );
  }
}
