import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/utils/formatters.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';

class CheckoutBottomBar extends StatelessWidget {
  final double total;
  final String? currency;
  final bool isPlacingOrder;
  final bool canProceed;
  final bool isContactComplete;
  final VoidCallback? onPlaceOrder;
  final VoidCallback onTermsTap;

  const CheckoutBottomBar({
    super.key,
    required this.total,
    this.currency,
    required this.isPlacingOrder,
    required this.canProceed,
    required this.isContactComplete,
    this.onPlaceOrder,
    required this.onTermsTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF7A0B10),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 12,
            offset: const Offset(0, -4),
          ),
        ],
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        bottom: true,
        top: false,
        child: ResponsiveCenter(
          maxWidth: 600,
          heightFactor: 1.0,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Flexible(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Total Payment',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.85),
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 2),
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            alignment: Alignment.centerLeft,
                            child: Text(
                              Formatters.formatCurrency(total, currency),
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w900,
                                fontSize: 22,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Flexible(
                      child: ElevatedButton(
                        onPressed:
                            (isPlacingOrder || !canProceed) ? null : onPlaceOrder,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: const Color(0xFF7A0B10),
                          disabledBackgroundColor:
                              Colors.white.withValues(alpha: 0.6),
                          disabledForegroundColor:
                              const Color(0xFF7A0B10).withValues(alpha: 0.6),
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(
                            vertical: 13,
                            horizontal: 18,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(24),
                          ),
                        ),
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          child: isPlacingOrder
                              ? const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(
                                        color: Color(0xFF7A0B10),
                                        strokeWidth: 2.5,
                                      ),
                                    ),
                                    SizedBox(width: 8),
                                    Text(
                                      'Processing...',
                                      style: TextStyle(
                                        color: Color(0xFF7A0B10),
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ],
                                )
                              : !isContactComplete
                                  ? const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          Icons.phone_outlined,
                                          size: 16,
                                          color: Color(0xFF7A0B10),
                                        ),
                                        SizedBox(width: 6),
                                        Text(
                                          'Add Phone to Order',
                                          style: TextStyle(
                                            color: Color(0xFF7A0B10),
                                            fontWeight: FontWeight.bold,
                                            fontSize: 13,
                                          ),
                                        ),
                                      ],
                                    )
                                  : const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          Icons.lock_outline,
                                          size: 17,
                                          color: Color(0xFF7A0B10),
                                        ),
                                        SizedBox(width: 6),
                                        Text(
                                          'Place Order',
                                          style: TextStyle(
                                            color: Color(0xFF7A0B10),
                                            fontWeight: FontWeight.bold,
                                            fontSize: 15,
                                            letterSpacing: 0.3,
                                          ),
                                        ),
                                        SizedBox(width: 6),
                                        Icon(
                                          Icons.arrow_forward,
                                          size: 17,
                                          color: Color(0xFF7A0B10),
                                        ),
                                      ],
                                    ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Center(
                  child: RichText(
                    textAlign: TextAlign.center,
                    text: TextSpan(
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.white.withValues(alpha: 0.8),
                        height: 1.3,
                      ),
                      children: [
                        const TextSpan(
                            text: 'By placing this order, you agree to our\n'),
                        TextSpan(
                          text: 'Terms, Cancellation & Refund Policy.',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            decoration: TextDecoration.underline,
                          ),
                          recognizer: TapGestureRecognizer()..onTap = onTermsTap,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
