import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:single_restaurant_mobile/screens/login_screen.dart';

class OrdersGuestView extends StatelessWidget {
  final VoidCallback? onBack;

  const OrdersGuestView({super.key, this.onBack});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFEFAF0),
      appBar: AppBar(
        backgroundColor: const Color(0xFFFEFAF0),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF8B0D18)),
          onPressed: () {
            if (onBack != null) {
              onBack!();
            } else if (Navigator.canPop(context)) {
              Navigator.pop(context);
            }
          },
        ),
        centerTitle: true,
        title: const Text(
          'My Orders',
          style: TextStyle(
            color: Color(0xFF8B0D18),
            fontWeight: FontWeight.w900,
            fontSize: 22,
            letterSpacing: -0.3,
          ),
        ),
      ),
      body: AnnotatedRegion<SystemUiOverlayStyle>(
        value: const SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.dark,
          systemNavigationBarColor: Color(0xFF660C0B),
          systemNavigationBarIconBrightness: Brightness.light,
        ),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final screenHeight = constraints.maxHeight;
            final isTall = screenHeight >= 750;
            final isSmall = screenHeight < 640;

            final topSpacing = isTall ? 48.0 : (isSmall ? 14.0 : 30.0);
            final heroHeight = isTall ? 260.0 : (isSmall ? 190.0 : 225.0);
            final titleFontSize = isTall ? 27.0 : (isSmall ? 21.0 : 24.0);
            final subFontSize = isTall ? 14.5 : (isSmall ? 12.5 : 13.5);
            final bottomWaveHeight = isTall ? 95.0 : (isSmall ? 65.0 : 80.0);

            return Stack(
              children: [
                // 1. Bottom Brand Wave (Deep Maroon & Golden Ribbon) anchored to bottom
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: Image.asset(
                    'assets/images/branded/lassi-lounge/address_guest_bottom_wave.png',
                    width: double.infinity,
                    height: bottomWaveHeight,
                    fit: BoxFit.cover,
                    alignment: Alignment.bottomCenter,
                    errorBuilder: (context, error, stackTrace) => const SizedBox(),
                  ),
                ),

                // 2. Foreground Content
                SafeArea(
                  top: false,
                  bottom: true,
                  child: SizedBox(
                    width: double.infinity,
                    height: screenHeight,
                    child: Column(
                      children: [
                        // Top spacing
                        SizedBox(height: topSpacing),

                        // Hero Illustration: 3D Food Cloche, Order Receipt, Delivery Box & Warm Glow
                        Image.asset(
                          'assets/images/branded/lassi-lounge/orders_guest_hero.png',
                          width: double.infinity,
                          height: heroHeight,
                          fit: BoxFit.contain,
                          errorBuilder: (context, error, stackTrace) => const SizedBox(height: 140),
                        ),

                        SizedBox(height: isTall ? 18 : 10),

                        // Heading: "Login to track your orders"
                        RichText(
                          textAlign: TextAlign.center,
                          text: TextSpan(
                            style: TextStyle(
                              fontSize: titleFontSize,
                              fontWeight: FontWeight.w900,
                              color: const Color(0xFF1E1E1E),
                              letterSpacing: -0.5,
                              height: 1.25,
                            ),
                            children: const [
                              TextSpan(text: 'Login to track\nyour '),
                              TextSpan(
                                text: 'orders',
                                style: TextStyle(
                                  color: Color(0xFF8B0D18),
                                ),
                              ),
                            ],
                          ),
                        ),

                        SizedBox(height: isTall ? 12 : 6),

                        // Subtitle
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Text(
                            'Track your live orders, view past order\nhistory, and reorder favorites anytime.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: subFontSize,
                              color: const Color(0xFF4A4A4A),
                              fontWeight: FontWeight.w500,
                              height: 1.4,
                            ),
                          ),
                        ),

                        SizedBox(height: isTall ? 24 : 14),

                        // CTA Button: [ Person | Login / Sign Up -> ]
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Container(
                            height: isTall ? 54 : 48,
                            decoration: BoxDecoration(
                              color: const Color(0xFF8B0D18),
                              borderRadius: BorderRadius.circular(18),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF8B0D18).withValues(alpha: 0.35),
                                  blurRadius: 12,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Material(
                              color: Colors.transparent,
                              child: InkWell(
                                borderRadius: BorderRadius.circular(18),
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (context) => const LoginScreen()),
                                  );
                                },
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 20),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.person, color: Colors.white, size: 22),
                                      const SizedBox(width: 14),
                                      Container(
                                        width: 1,
                                        height: 22,
                                        color: Colors.white.withValues(alpha: 0.35),
                                      ),
                                      const Expanded(
                                        child: Text(
                                          'Login / Sign Up',
                                          textAlign: TextAlign.center,
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                            letterSpacing: 0.3,
                                          ),
                                        ),
                                      ),
                                      const Icon(Icons.arrow_forward, color: Colors.white, size: 20),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),

                        SizedBox(height: isTall ? 20 : 12),

                        // 3-Column Benefits Card
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF9F3EA),
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(color: const Color(0xFFEBE0D3), width: 1.2),
                            ),
                            child: Row(
                              children: [
                                // Feature 1: Live Order Tracking
                                Expanded(
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.delivery_dining, color: Color(0xFF8B0D18), size: 24),
                                      const SizedBox(height: 6),
                                      Text(
                                        'Live Order\nTracking',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(
                                          fontSize: isTall ? 11.5 : 10.5,
                                          fontWeight: FontWeight.bold,
                                          color: const Color(0xFF333333),
                                          height: 1.2,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                                // Divider
                                Container(width: 1, height: 38, color: const Color(0xFFE2D4C3)),

                                // Feature 2: One-Tap Reorder
                                Expanded(
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.replay_rounded, color: Color(0xFF8B0D18), size: 23),
                                      const SizedBox(height: 6),
                                      Text(
                                        'One-Tap\nReorder',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(
                                          fontSize: isTall ? 11.5 : 10.5,
                                          fontWeight: FontWeight.bold,
                                          color: const Color(0xFF333333),
                                          height: 1.2,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                                // Divider
                                Container(width: 1, height: 38, color: const Color(0xFFE2D4C3)),

                                // Feature 3: Past Orders & Invoices
                                Expanded(
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.receipt_long_outlined, color: Color(0xFF8B0D18), size: 23),
                                      const SizedBox(height: 6),
                                      Text(
                                        'View Past\nOrders',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(
                                          fontSize: isTall ? 11.5 : 10.5,
                                          fontWeight: FontWeight.bold,
                                          color: const Color(0xFF333333),
                                          height: 1.2,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        // Bottom Spacer
                        const Spacer(),
                      ],
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
