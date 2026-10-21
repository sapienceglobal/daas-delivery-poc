import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/screens/login_screen.dart';
import 'package:single_restaurant_mobile/widgets/common/app_dialog.dart';

/// Modal dialog displaying terms and conditions for a coupon.
class OfferTermsDialog {
  static void show(BuildContext context, dynamic coupon, int ordersCount) {
    final bool isLoggedIn =
        Provider.of<AuthProvider>(context, listen: false).isAuthenticated;

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
                _buildEligibilityBanner(context, coupon, ordersCount, isLoggedIn),
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
      padding: const EdgeInsets.only(bottom: 9.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.only(top: 6, right: 10, left: 2),
            width: 5.5,
            height: 5.5,
            decoration: const BoxDecoration(
              color: Color(0xFF8B1E1E),
              shape: BoxShape.circle,
            ),
          ),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 12.5,
                color: Color(0xFF333333),
                height: 1.3,
              ),
            ),
          ),
        ],
      ),
    );
  }

  static Widget _buildEligibilityBanner(
    BuildContext context,
    dynamic coupon,
    int ordersCount,
    bool isLoggedIn,
  ) {
    // When in Guest mode (not logged in), prompt user to log in instead of showing
    // misleading eligible/ineligible states based on default 0 orders.
    if (!isLoggedIn) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF9E6),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFFFD54F)),
        ),
        child: Row(
          children: [
            const Icon(
              Icons.lock_outline_rounded,
              color: Color(0xFFD97706),
              size: 20,
            ),
            const SizedBox(width: 10),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Login to check eligibility',
                    style: TextStyle(
                      color: Color(0xFF92400E),
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Log in to see if you are eligible and apply this offer.',
                    style: TextStyle(
                      color: Color(0xFF78350F),
                      fontSize: 11,
                      height: 1.25,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF8B1E1E),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                minimumSize: const Size(60, 32),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(6),
                ),
              ),
              child: const Text(
                'LOG IN',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ],
        ),
      );
    }

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
            Icon(Icons.info_outline, color: Colors.red.shade700, size: 20),
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
            Icon(Icons.info_outline, color: Colors.red.shade700, size: 20),
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
          Icon(Icons.check_circle_outline, color: Colors.green.shade700, size: 20),
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
