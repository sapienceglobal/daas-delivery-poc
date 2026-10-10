import 'package:flutter/material.dart';
import 'package:just_the_tooltip/just_the_tooltip.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/checkout_provider.dart';
import 'package:single_restaurant_mobile/utils/formatters.dart';

class CartBillSummary extends StatelessWidget {
  final CartProvider cart;
  final CheckoutProvider checkout;
  final double subtotal;
  final double deliveryFee;
  final double combinedTaxesAndFees;
  final double total;
  final double saved;

  const CartBillSummary({
    super.key,
    required this.cart,
    required this.checkout,
    required this.subtotal,
    required this.deliveryFee,
    required this.combinedTaxesAndFees,
    required this.total,
    required this.saved,
  });

  @override
  Widget build(BuildContext context) {
    final itemCount = cart.items.length;
    final itemText = itemCount == 1 ? '1 item' : '$itemCount items';

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF9F7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF3ECE6), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with receipt icon
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: const Color(0xFFF7ECE8),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Center(
                  child: Icon(Icons.receipt_long_outlined, color: Color(0xFF6B111C), size: 18),
                ),
              ),
              const SizedBox(width: 10),
              const Text(
                'Bill Summary',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1E1E1E)),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Rows
          _buildBillRow('Item Total ($itemText)', subtotal),
          const SizedBox(height: 10),

          if (!checkout.isDelivery)
            _buildBillRow(
              'Delivery Fee',
              0,
              info: true,
              tooltipMessage: 'Fee charged for delivery based on distance and local market conditions.',
              textValue: '\$0.00',
            )
          else if (checkout.quoteLoading)
            _buildBillRow(
              'Delivery Fee',
              0,
              info: true,
              tooltipMessage: 'Fee charged for delivery based on distance and local market conditions.',
              textValue: 'Calculating...',
              color: Colors.grey,
            )
          else if (checkout.quoteError != null)
            _buildBillRow(
              'Delivery Fee',
              0,
              info: true,
              tooltipMessage: 'Fee charged for delivery based on distance and local market conditions.',
              textValue: 'Unavailable',
              color: const Color(0xFFB91C1C),
            )
          else
            _buildBillRow(
              'Delivery Fee',
              deliveryFee,
              info: true,
              tooltipMessage: 'Fee charged for delivery based on distance and local market conditions.',
            ),
          const SizedBox(height: 10),

          _buildBillRow(
            'Taxes & Fees',
            combinedTaxesAndFees,
            info: true,
            tooltipMessage: 'Estimated state and local sales taxes applied to your order.',
          ),

          if (saved > 0) ...[
            const SizedBox(height: 10),
            _buildBillRow('Discounts', -saved, color: const Color(0xFF16A34A)),
          ],

          // Dashed Separator
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 14.0),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final boxWidth = constraints.constrainWidth();
                const dashWidth = 4.0;
                const dashSpace = 3.0;
                final dashCount = (boxWidth / (dashWidth + dashSpace)).floor();
                return Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: List.generate(dashCount, (_) {
                    return const SizedBox(
                      width: dashWidth,
                      height: 1,
                      child: DecoratedBox(
                        decoration: BoxDecoration(color: Color(0xFFE2D6CF)),
                      ),
                    );
                  }),
                );
              },
            ),
          ),

          // To Pay Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'To Pay',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1E1E1E)),
              ),
              Text(
                Formatters.formatCurrency(total, cart.restaurant?['currency']),
                style: const TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 20,
                  color: Color(0xFF8B1E1E),
                ),
              ),
            ],
          ),

          if (saved > 0) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(Icons.sell, color: Color(0xFF16A34A), size: 14),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    'You saved ${Formatters.formatCurrency(saved, cart.restaurant?['currency'])} on this order',
                    style: const TextStyle(color: Color(0xFF16A34A), fontSize: 12, fontWeight: FontWeight.bold),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildBillRow(
    String label,
    double value, {
    bool info = false,
    String? tooltipMessage,
    Color? color,
    String? textValue,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Flexible(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Flexible(
                child: Text(
                  label,
                  style: const TextStyle(color: Color(0xFF4B5563), fontSize: 14),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (info) ...[
                const SizedBox(width: 4),
                JustTheTooltip(
                  content: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Text(
                      tooltipMessage ?? '',
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                      softWrap: true,
                    ),
                  ),
                  backgroundColor: const Color(0xFF1A1A1A),
                  triggerMode: TooltipTriggerMode.tap,
                  tailLength: 6.0,
                  tailBaseWidth: 12.0,
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  borderRadius: BorderRadius.circular(8),
                  child: const Icon(Icons.info_outline, size: 14, color: Colors.grey),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(width: 8),
        Text(
          textValue ?? (value < 0 ? '-${Formatters.formatCurrency(-value, null)}' : Formatters.formatCurrency(value, null)),
          style: TextStyle(
            fontWeight: FontWeight.w700,
            color: color ?? const Color(0xFF1F2937),
          ),
        ),
      ],
    );
  }
}
