import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/screens/cart_screen.dart';
import 'package:single_restaurant_mobile/services/navigation_service.dart';

class CartItemAddedToast extends StatelessWidget {
  final VoidCallback? onDismiss;
  final int initialCount;
  final String message;

  const CartItemAddedToast({
    super.key,
    this.onDismiss,
    this.initialCount = 1,
    this.message = 'Item added to cart successfully!',
  });

  void _openCart(BuildContext context) {
    onDismiss?.call();
    final navState = NavigationService.navigatorKey.currentState;
    if (navState != null) {
      navState.push(
        MaterialPageRoute(builder: (_) => const CartScreen()),
      );
    } else if (context.mounted) {
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const CartScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: const Color(0xFFC8E6C9), // Soft green outline from reference UI
            width: 1.2,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 14,
              spreadRadius: 1,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. Left Vibrant Green Accent Strip
              Container(
                width: 5.5,
                color: const Color(0xFF388E3C),
              ),

              // 2. Content Row
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  child: Row(
                    children: [
                      // Circular Green Checkmark Badge
                      Container(
                        width: 24,
                        height: 24,
                        decoration: const BoxDecoration(
                          color: Color(0xFF388E3C),
                          shape: BoxShape.circle,
                        ),
                        child: const Center(
                          child: Icon(
                            Icons.check,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),

                      // Notification message
                      Expanded(
                        child: Text(
                          message,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Color(0xFF1E1E1E),
                            fontSize: 12.5,
                            fontWeight: FontWeight.w600,
                            letterSpacing: -0.2,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),

                      // "View Cart (N)" Pill Button
                      Material(
                        color: Colors.transparent,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () => _openCart(context),
                          child: Ink(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6.5),
                            decoration: BoxDecoration(
                              color: const Color(0xFFA51D24), // Rich brand maroon
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFFA51D24).withValues(alpha: 0.28),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.shopping_cart_outlined,
                                  color: Colors.white,
                                  size: 15,
                                ),
                                const SizedBox(width: 5),
                                _CartItemCountText(fallbackCount: initialCount),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CartItemCountText extends StatelessWidget {
  final int fallbackCount;
  const _CartItemCountText({required this.fallbackCount});

  @override
  Widget build(BuildContext context) {
    try {
      final cart = Provider.of<CartProvider>(context);
      final count = cart.itemCount > 0 ? cart.itemCount : fallbackCount;
      return Text(
        'View Cart ($count)',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.bold,
          letterSpacing: -0.2,
        ),
      );
    } catch (_) {
      return Text(
        'View Cart ($fallbackCount)',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.bold,
          letterSpacing: -0.2,
        ),
      );
    }
  }
}
