import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/widgets/common/app_dialog.dart';

/// Modal dialog displaying terms and conditions for a coupon.
class OfferTermsDialog {
  static void show(BuildContext context, dynamic coupon, int ordersCount) {
    showDialog(
      context: context,
      builder: (ctx) {
        return AppDialog(
          title: 'Terms & Conditions',
          message: 'Code: ${coupon['code']}',
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildTermItem(coupon['description'] ?? 'Applies to your order based on cart value.'),
                if ((coupon['minCartValue'] ?? 0) > 0)
                  _buildTermItem('Minimum order value of \$${coupon['minCartValue']} is required.'),
                if (coupon['firstOrderOnly'] == true)
                  _buildTermItem('Valid for first-time orders only.'),
                if ((coupon['maxDiscount'] ?? 0) > 0)
                  _buildTermItem('Maximum discount capped at \$${coupon['maxDiscount']}.'),
                if (coupon['allowedPaymentMethods'] != null &&
                    (coupon['allowedPaymentMethods'] as List).isNotEmpty &&
                    !((coupon['allowedPaymentMethods'] as List).contains('All')))
                  _buildTermItem('Valid only for payments via ${(coupon['allowedPaymentMethods'] as List).join(', ')}.'),
                if ((coupon['minOrdersRequired'] ?? 0) > 0)
                  _buildTermItem('Requires a minimum of ${coupon['minOrdersRequired']} past orders to unlock.'),
                _buildTermItem('Only one coupon can be applied per order. Not valid with other offers.'),
                const SizedBox(height: 16),
                _buildEligibilityBanner(coupon, ordersCount),
              ],
            ),
          ),
          primaryActionText: 'Close',
          onPrimaryAction: () => Navigator.pop(ctx),
        );
      },
    );
  }

  static Widget _buildTermItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.check_circle, color: Colors.green, size: 16),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 13, color: Colors.black87),
            ),
          ),
        ],
      ),
    );
  }

  static Widget _buildEligibilityBanner(dynamic coupon, int ordersCount) {
    final bool isFirstOrderError = coupon['firstOrderOnly'] == true && ordersCount > 0;
    final bool isMinOrdersError = (coupon['minOrdersRequired'] ?? 0) > 0 && ordersCount < coupon['minOrdersRequired'];

    if (isFirstOrderError) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.red.shade50,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.red.shade200),
        ),
        child: Row(
          children: [
            Icon(Icons.info, color: Colors.red.shade700, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'You are not eligible for this coupon as it is for first-time orders only.',
                style: TextStyle(
                  color: Colors.red.shade900,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      );
    }

    if (isMinOrdersError) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.red.shade50,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.red.shade200),
        ),
        child: Row(
          children: [
            Icon(Icons.info, color: Colors.red.shade700, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'You need at least ${coupon['minOrdersRequired']} past orders to use this coupon. (You have $ordersCount).',
                style: TextStyle(
                  color: Colors.red.shade900,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.green.shade200),
      ),
      child: Row(
        children: [
          Icon(Icons.check_circle, color: Colors.green.shade700, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'You are eligible to use this coupon on your next applicable order!',
              style: TextStyle(
                color: Colors.green.shade900,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
