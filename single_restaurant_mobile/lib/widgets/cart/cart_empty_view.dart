import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/screens/main_screen.dart';

class CartEmptyView extends StatelessWidget {
  final VoidCallback? onBrowseMenu;

  const CartEmptyView({
    super.key,
    this.onBrowseMenu,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final screenHeight = constraints.maxHeight;
        final isTall = screenHeight >= 750;
        final isSmall = screenHeight < 640;

        final heroHeight = isTall ? 320.0 : (isSmall ? 230.0 : 275.0);
        final titleFontSize = isTall ? 28.0 : (isSmall ? 22.0 : 25.0);
        final subFontSize = isTall ? 15.5 : (isSmall ? 13.5 : 14.5);
        final bottomFoodHeight = isTall ? 185.0 : (isSmall ? 130.0 : 155.0);

        return Stack(
          children: [
            // 1. Bottom Food Platter (Copper Kadai & Naan Basket) anchored to bottom
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Image.asset(
                'assets/images/branded/lassi-lounge/empty_cart_bottom_food.png',
                width: double.infinity,
                height: bottomFoodHeight,
                fit: BoxFit.cover,
                alignment: Alignment.bottomCenter,
                errorBuilder: (context, error, stackTrace) => const SizedBox(),
              ),
            ),

            // 2. Main Content
            SafeArea(
              top: false,
              bottom: true,
              child: SizedBox(
                width: double.infinity,
                height: screenHeight,
                child: Column(
                  children: [
                    // Top spacing
                    SizedBox(height: isTall ? 12 : 6),

                    // Hero Illustration: 3D Paper Shopping Bag with Peach Blob, Burst Lines & Doodles
                    Image.asset(
                      'assets/images/branded/lassi-lounge/empty_cart_hero_full.png',
                      width: double.infinity,
                      height: heroHeight,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => const SizedBox(height: 120),
                    ),

                    SizedBox(height: isTall ? 16 : 8),

                    // "Your cart is empty" with red accent and brush stroke swoosh
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Your cart is ',
                          style: TextStyle(
                            fontSize: titleFontSize,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF1E1E1E),
                            letterSpacing: -0.5,
                          ),
                        ),
                        Stack(
                          clipBehavior: Clip.none,
                          alignment: Alignment.center,
                          children: [
                            Text(
                              'empty',
                              style: TextStyle(
                                fontSize: titleFontSize,
                                fontWeight: FontWeight.w900,
                                color: const Color(0xFFDC3545),
                                letterSpacing: -0.5,
                              ),
                            ),
                            Positioned(
                              bottom: isTall ? -8 : -6,
                              left: -2,
                              right: -8,
                              child: Image.asset(
                                'assets/images/branded/lassi-lounge/empty_cart_swoosh.png',
                                height: isTall ? 13 : 11,
                                fit: BoxFit.fill,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),

                    SizedBox(height: isTall ? 14 : 8),

                    // Subtitle
                    Text(
                      'Add some delicious items\nfrom the menu.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: subFontSize,
                        color: const Color(0xFF3A3A3A),
                        fontWeight: FontWeight.w600,
                        height: 1.4,
                      ),
                    ),

                    SizedBox(height: isTall ? 26 : 16),

                    // Action Button: BROWSE MENU ->
                    ElevatedButton(
                      onPressed: onBrowseMenu ??
                          () {
                            Navigator.pushAndRemoveUntil(
                              context,
                              MaterialPageRoute(
                                builder: (context) =>
                                    const MainScreen(initialIndex: 1),
                              ),
                              (route) => false,
                            );
                          },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF6B111C),
                        foregroundColor: Colors.white,
                        elevation: 4,
                        shadowColor: const Color(0xFF6B111C).withValues(alpha: 0.35),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(28),
                        ),
                        padding: EdgeInsets.symmetric(
                          horizontal: isTall ? 42 : 34,
                          vertical: isTall ? 16 : 13,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'BROWSE MENU',
                            style: TextStyle(
                              fontSize: isTall ? 14.5 : 13.5,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.8,
                            ),
                          ),
                          const SizedBox(width: 10),
                          const Icon(Icons.arrow_forward, size: 18),
                        ],
                      ),
                    ),

                    // Bottom clearance
                    const Spacer(),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}
