import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:visibility_detector/visibility_detector.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/address_provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/notification_provider.dart';
import 'package:single_restaurant_mobile/screens/cart_screen.dart';
import 'package:single_restaurant_mobile/screens/notifications_screen.dart';
import 'package:single_restaurant_mobile/screens/search_screen.dart';

class HomeAppBar extends StatelessWidget implements PreferredSizeWidget {
  final Animation<double> logoScaleAnimation;
  final AnimationController logoController;
  final VoidCallback onLocationTap;
  final double preferredHeight;

  const HomeAppBar({
    super.key,
    required this.logoScaleAnimation,
    required this.logoController,
    required this.onLocationTap,
    this.preferredHeight = 144.0,
  });

  @override
  Size get preferredSize => Size.fromHeight(preferredHeight);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.only(top: 2.0, bottom: 8.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              // Row 1: Logo & Actions
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Logo with VisibilityDetector
                    VisibilityDetector(
                      key: const Key('home-screen-logo'),
                      onVisibilityChanged: (info) {
                        try {
                          if (info.visibleFraction == 0.0) {
                            logoController.reset();
                          } else if (info.visibleFraction > 0.1 &&
                              !logoController.isAnimating &&
                              logoController.status !=
                                  AnimationStatus.completed) {
                            logoController.forward(from: 0.0);
                          }
                        } catch (_) {}
                      },
                      child: ScaleTransition(
                        scale: logoScaleAnimation,
                        child: Align(
                          alignment: Alignment.topCenter,
                          heightFactor: 0.75,
                          child: Transform.translate(
                            offset: const Offset(0, -8),
                            child: Image.asset(
                              'assets/images/branded/lassi-lounge/Lassi-Lounge-logo.png',
                              height: 90,
                              fit: BoxFit.contain,
                              errorBuilder: (c, e, s) => const Text(
                                'LASSI LOUNGE',
                                style: TextStyle(
                                  color: AppColors.primary,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 1.0,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),

                    // Action Icons: Search, Notifications, Cart
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _appBarIconButton(
                          icon: Icons.search_rounded,
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const SearchScreen(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Consumer<NotificationProvider>(
                          builder: (context, np, _) => Stack(
                            clipBehavior: Clip.none,
                            children: [
                              _appBarIconButton(
                                icon: Icons.notifications_none_outlined,
                                onTap: () => Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        const NotificationsScreen(),
                                  ),
                                ),
                              ),
                              if (np.hasUnread)
                                Positioned(
                                  right: 2,
                                  top: 2,
                                  child: Container(
                                    width: 10,
                                    height: 10,
                                    decoration: BoxDecoration(
                                      color: Colors.red.shade700,
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                          color: Colors.white, width: 1.5),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Consumer<CartProvider>(
                          builder: (context, cart, _) => Stack(
                            clipBehavior: Clip.none,
                            children: [
                              _appBarIconButton(
                                icon: Icons.shopping_cart_outlined,
                                onTap: () => Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => const CartScreen(),
                                  ),
                                ),
                              ),
                              if (cart.itemCount > 0)
                                Positioned(
                                  right: -2,
                                  top: -2,
                                  child: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFD32F2F),
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                          color: Colors.white, width: 1.5),
                                    ),
                                    constraints: const BoxConstraints(
                                      minWidth: 18,
                                      minHeight: 18,
                                    ),
                                    child: Center(
                                      child: Text(
                                        '${cart.itemCount}',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          height: 1,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 8),

              // Row 2: Deliver To Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Consumer2<AddressProvider, AuthProvider>(
                  builder: (context, addressProvider, authProvider, _) {
                    String displayAddress =
                        '87-18 Lefferts Boulevard, New York, NY 10001';
                    String label = 'DELIVER TO';

                    if (authProvider.isAuthenticated &&
                        addressProvider.addresses.isNotEmpty) {
                      final def = addressProvider.addresses.firstWhere(
                        (a) => a['isDefault'] == true,
                        orElse: () => addressProvider.addresses.first,
                      );
                      displayAddress = def['address'] ?? displayAddress;
                      label = (def['label'] ?? 'DELIVER TO').toUpperCase();
                    }

                    return GestureDetector(
                      onTap: onLocationTap,
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                              color: Colors.grey.shade300, width: 1.0),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.02),
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: const Color(0xFFD32F2F)
                                    .withValues(alpha: 0.1),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.location_on,
                                color: Color(0xFFD32F2F),
                                size: 18,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    label,
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFFD32F2F),
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                  const SizedBox(height: 1),
                                  Text(
                                    displayAddress,
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.black87,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                    maxLines: 1,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 6),
                            const Icon(
                              Icons.keyboard_arrow_down,
                              color: Colors.black87,
                              size: 20,
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _appBarIconButton({
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(22),
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.grey.shade300, width: 1.0),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Icon(icon, size: 21, color: Colors.black87),
      ),
    );
  }
}
