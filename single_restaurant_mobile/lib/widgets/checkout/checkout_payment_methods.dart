import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/checkout_provider.dart';

class CheckoutPaymentMethods extends StatelessWidget {
  final CheckoutProvider checkout;
  final AuthProvider auth;

  const CheckoutPaymentMethods({
    super.key,
    required this.checkout,
    required this.auth,
  });

  @override
  Widget build(BuildContext context) {
    final savedCards = auth.user?.savedCards;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            children: [
              // Saved Cards
              if (savedCards != null && savedCards.isNotEmpty)
                ...savedCards.map((card) {
                  return Column(
                    children: [
                      _buildPaymentOption(
                        icon: Icons.credit_card,
                        title: '${card['brand'] ?? 'Card'} ending in ${card['last4'] ?? '****'}',
                        subtitle: card['isDefault'] == true ? 'Recommended' : null,
                        value: card['cardId'] ?? card['id'] ?? card['_id'] ?? '',
                        groupValue: checkout.paymentMethod,
                        onChanged: (val) => checkout.setPaymentMethod(val!),
                        isFirst: card == savedCards.first,
                      ),
                      const Divider(height: 1, indent: 48),
                    ],
                  );
                }),

              // Pay with Card / Mobile Wallets (Secure Stripe Checkout)
              _buildPaymentOption(
                icon: Icons.lock_outline,
                title: 'Pay with Card / Mobile Wallets',
                subtitle: '100% Secure via Stripe',
                value: 'credit_card',
                groupValue: checkout.paymentMethod,
                onChanged: (val) => checkout.setPaymentMethod(val!),
                isFirst: savedCards == null || savedCards.isEmpty,
                isLast: true,
              ),
            ],
          ),
        ),
        if (checkout.couponPaymentError != null)
          Padding(
            padding: const EdgeInsets.only(top: 12.0),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.red.shade200),
              ),
              child: Row(
                children: [
                  Icon(Icons.error_outline, color: Colors.red.shade700, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      checkout.couponPaymentError!,
                      style: TextStyle(
                        color: Colors.red.shade700,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: checkout.handleRemoveCoupon,
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: const Text(
                      'Remove',
                      style: TextStyle(
                        color: Color(0xFF7A0B10),
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  )
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildPaymentOption({
    IconData? icon,
    required String title,
    String? subtitle,
    required String value,
    required String groupValue,
    required Function(String?) onChanged,
    bool isFirst = false,
    bool isLast = false,
  }) {
    final isSelected = value == groupValue;
    return InkWell(
      onTap: () => onChanged(value),
      borderRadius: BorderRadius.vertical(
        top: isFirst ? const Radius.circular(12) : Radius.zero,
        bottom: isLast ? const Radius.circular(12) : Radius.zero,
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
        child: Row(
          children: [
            SizedBox(
              width: 32,
              child: Icon(icon, color: isSelected ? const Color(0xFF7A0B10) : Colors.grey.shade600),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Row(
                children: [
                  Flexible(
                    child: Text(
                      title,
                      style: TextStyle(
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        fontSize: 14,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.green.shade50,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: Colors.green.shade200),
                      ),
                      child: Text(
                        subtitle,
                        style: TextStyle(
                          color: Colors.green.shade700,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    )
                  ]
                ],
              ),
            ),
            Icon(
              isSelected ? Icons.check_circle : Icons.circle_outlined,
              color: isSelected ? const Color(0xFF7A0B10) : Colors.grey.shade400,
            ),
          ],
        ),
      ),
    );
  }
}
