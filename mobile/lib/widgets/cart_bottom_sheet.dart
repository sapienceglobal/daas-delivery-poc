import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/cart_provider.dart';
import '../screens/checkout_screen.dart';
import '../theme.dart';

class CartBottomSheet extends StatelessWidget {
  const CartBottomSheet({super.key});

  @override
  Widget build(BuildContext context) {
    final cart = Provider.of<CartProvider>(context);
    final items = cart.cartItems;

    return Container(
      padding: const EdgeInsets.only(top: 8, left: 16, right: 16, bottom: 24),
      decoration: const BoxDecoration(
        color: BrandColors.card,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(28),
          topRight: Radius.circular(28),
        ),
        border: Border(
          top: BorderSide(color: BrandColors.border, width: 1.5),
        ),
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Handle bar for sliding sheet feel
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: BrandColors.border.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Header Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Your Cart',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    if (cart.cartRestaurant != null)
                      Text(
                        'From ${cart.cartRestaurant!['name']}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: BrandColors.cyan,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                  ],
                ),
                if (items.isNotEmpty)
                  TextButton.icon(
                    onPressed: () => cart.clearCart(),
                    icon: const Icon(Icons.delete_sweep, color: BrandColors.red, size: 18),
                    label: const Text('Clear All', style: TextStyle(color: BrandColors.red, fontSize: 13)),
                  ),
              ],
            ),
            const Divider(color: BrandColors.border, height: 24),

            if (items.isEmpty) ...[
              const SizedBox(height: 32),
              const Icon(Icons.shopping_bag_outlined, size: 64, color: BrandColors.textMuted),
              const SizedBox(height: 16),
              const Text(
                'Your cart is empty',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Add items from a restaurant to start your order.',
                textAlign: TextAlign.center,
                style: TextStyle(color: BrandColors.textMuted, fontSize: 12),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: BrandColors.border,
                  foregroundColor: Colors.white,
                ),
                child: const Text('GO BACK'),
              ),
            ] else ...[
              // Items List
              Flexible(
                child: Container(
                  constraints: BoxConstraints(
                    maxHeight: MediaQuery.of(context).size.height * 0.4,
                  ),
                  child: ListView.separated(
                    shrinkWrap: true,
                    itemCount: items.length,
                    separatorBuilder: (context, index) => const Divider(color: BrandColors.border, height: 16),
                    itemBuilder: (context, idx) {
                      final item = items[idx];
                      final itemId = item['id'].toString();
                      final itemTotal = item['price'] * item['quantity'];

                      return Row(
                        children: [
                          // Item Name & Sub-details
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item['name'] ?? '',
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '\$${(item['price'] as num).toStringAsFixed(2)} each',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: BrandColors.textMuted,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Price
                          Text(
                            '\$${itemTotal.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(width: 16),

                          // Quantity Controls
                          Container(
                            decoration: BoxDecoration(
                              color: BrandColors.background,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: BrandColors.border),
                            ),
                            child: Row(
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.remove, size: 16, color: BrandColors.cyan),
                                  padding: EdgeInsets.zero,
                                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                                  onPressed: () => cart.modifyQuantity(itemId, -1),
                                ),
                                Text(
                                  item['quantity'].toString(),
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.add, size: 16, color: BrandColors.cyan),
                                  padding: EdgeInsets.zero,
                                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                                  onPressed: () => cart.modifyQuantity(itemId, 1),
                                ),
                              ],
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ),
              ),
              const Divider(color: BrandColors.border, height: 24),

              // Fee Breakdown Summary
              Column(
                children: [
                  _buildSummaryRow('Subtotal', '\$${cart.getCartSubtotal().toStringAsFixed(2)}'),
                  const SizedBox(height: 6),
                  _buildSummaryRow('Tax', '\$${cart.getTax().toStringAsFixed(2)}'),
                  const SizedBox(height: 6),
                  _buildSummaryRow('Platform Fee', '\$${cart.getPlatformFee().toStringAsFixed(2)}'),
                  if (cart.getDeliveryFee() > 0) ...[
                    const SizedBox(height: 6),
                    _buildSummaryRow('Delivery Fee', '\$${cart.getDeliveryFee().toStringAsFixed(2)}'),
                  ],
                  const Divider(color: BrandColors.border, height: 16),
                  _buildSummaryRow(
                    'Grand Total',
                    '\$${cart.getGrandTotal().toStringAsFixed(2)}',
                    isBold: true,
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Checkout Button
              ElevatedButton(
                onPressed: () {
                  Navigator.of(context).pop(); // Close bottom sheet
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (context) => const CheckoutScreen()),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: BrandColors.green,
                ),
                child: const Text('PROCEED TO CHECKOUT'),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isBold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: isBold ? 14 : 12,
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            color: isBold ? Colors.white : BrandColors.textMuted,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isBold ? 16 : 12,
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            color: isBold ? BrandColors.cyan : Colors.white,
          ),
        ),
      ],
    );
  }
}
