import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:single_restaurant_mobile/screens/login_screen.dart';

class CardsGuestView extends StatelessWidget {
  final VoidCallback? onBack;

  const CardsGuestView({super.key, this.onBack});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFEFAF2),
      appBar: AppBar(
        backgroundColor: const Color(0xFFFEFAF2),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leadingWidth: 68,
        leading: Padding(
          padding: const EdgeInsets.only(left: 16.0),
          child: Center(
            child: Container(
              width: 42,
              height: 42,
              decoration: const BoxDecoration(
                color: Color(0xFFFDE4DF),
                shape: BoxShape.circle,
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(21),
                  onTap: () {
                    if (onBack != null) {
                      onBack!();
                    } else if (Navigator.canPop(context)) {
                      Navigator.pop(context);
                    }
                  },
                  child: const Icon(
                    Icons.arrow_back,
                    color: Color(0xFF800A12),
                    size: 20,
                  ),
                ),
              ),
            ),
          ),
        ),
        centerTitle: true,
        title: const Text(
          'Payment Methods',
          style: TextStyle(
            color: Color(0xFF800A12),
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
            final titleFontSize = isTall ? 27.0 : (isSmall ? 22.0 : 25.0);
            final subFontSize = isTall ? 14.5 : (isSmall ? 12.5 : 13.5);
            final bottomWaveHeight = isTall ? 115.0 : (isSmall ? 75.0 : 95.0);

            return Stack(
              children: [
                // 1. Bottom Wavy Curves
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: Image.asset(
                    'assets/images/branded/lassi-lounge/cards_guest_bottom_wave.png',
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
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    child: ConstrainedBox(
                      constraints: BoxConstraints(minHeight: screenHeight),
                      child: IntrinsicHeight(
                        child: Column(
                          children: [
                            SizedBox(height: topSpacing),

                            // Hero Illustration: 3D Red Wallet with Cards, Padlock Shield & Gold Coins
                            Image.asset(
                              'assets/images/branded/lassi-lounge/cards_guest_hero.png',
                              width: double.infinity,
                              height: heroHeight,
                              fit: BoxFit.contain,
                              errorBuilder: (context, error, stackTrace) =>
                                  const SizedBox(height: 140),
                            ),

                            SizedBox(height: isTall ? 18 : 10),

                            // Heading: "Login to manage your payment methods"
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
                                  TextSpan(text: 'Login to manage\nyour '),
                                  TextSpan(
                                    text: 'payment methods',
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
                              padding: const EdgeInsets.symmetric(horizontal: 28),
                              child: Text(
                                'Securely save your cards and payment\nmethods for faster checkout.',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: subFontSize,
                                  color: const Color(0xFF6B7280),
                                  fontWeight: FontWeight.w500,
                                  height: 1.4,
                                ),
                              ),
                            ),

                            SizedBox(height: isTall ? 22 : 14),

                            // 3-Column Benefits Card
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 24),
                              child: Container(
                                padding: EdgeInsets.symmetric(
                                  vertical: isTall ? 16 : 12,
                                  horizontal: 8,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: const Color(0xFFF1E5E5),
                                    width: 1.2,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.03),
                                      blurRadius: 10,
                                      offset: const Offset(0, 3),
                                    ),
                                  ],
                                ),
                                child: Row(
                                  children: [
                                    // Feature 1: Secure Payments
                                    _buildFeatureColumn(
                                      icon: Icons.shield_outlined,
                                      title: 'Secure\nPayments',
                                      isTall: isTall,
                                    ),

                                    // Divider
                                    Container(
                                      width: 1,
                                      height: 40,
                                      color: const Color(0xFFF1E5E5),
                                    ),

                                    // Feature 2: Faster Checkout
                                    _buildFeatureColumn(
                                      icon: Icons.bolt_rounded,
                                      title: 'Faster\nCheckout',
                                      isTall: isTall,
                                    ),

                                    // Divider
                                    Container(
                                      width: 1,
                                      height: 40,
                                      color: const Color(0xFFF1E5E5),
                                    ),

                                    // Feature 3: Manage Cards Easily
                                    _buildFeatureColumn(
                                      icon: Icons.credit_card_rounded,
                                      title: 'Manage\nCards Easily',
                                      isTall: isTall,
                                    ),
                                  ],
                                ),
                              ),
                            ),

                            SizedBox(height: isTall ? 22 : 14),

                            // CTA Button: [ Person | Login / Sign Up -> ]
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 24),
                              child: Container(
                                height: isTall ? 54 : 48,
                                decoration: BoxDecoration(
                                  color: const Color(0xFF800A12),
                                  borderRadius: BorderRadius.circular(28),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFF800A12)
                                          .withValues(alpha: 0.35),
                                      blurRadius: 12,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: Material(
                                  color: Colors.transparent,
                                  child: InkWell(
                                    borderRadius: BorderRadius.circular(28),
                                    onTap: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) =>
                                              const LoginScreen(),
                                        ),
                                      );
                                    },
                                    child: const Padding(
                                      padding:
                                          EdgeInsets.symmetric(horizontal: 20),
                                      child: Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: [
                                          Icon(
                                            Icons.person_outline,
                                            color: Colors.white,
                                            size: 22,
                                          ),
                                          SizedBox(width: 12),
                                          Text(
                                            'Login / Sign Up',
                                            style: TextStyle(
                                              color: Colors.white,
                                              fontSize: 16,
                                              fontWeight: FontWeight.bold,
                                              letterSpacing: 0.3,
                                            ),
                                          ),
                                          SizedBox(width: 12),
                                          Icon(
                                            Icons.arrow_forward_rounded,
                                            color: Colors.white,
                                            size: 20,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),

                            const Spacer(),
                            SizedBox(height: isTall ? 35 : 20),
                          ],
                        ),
                      ),
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

  Widget _buildFeatureColumn({
    required IconData icon,
    required String title,
    required bool isTall,
  }) {
    return Expanded(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: const BoxDecoration(
              color: Color(0xFFFDECEE),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: const Color(0xFF800A12),
              size: 22,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: isTall ? 12.0 : 11.0,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF1F2937),
              height: 1.25,
            ),
          ),
        ],
      ),
    );
  }
}
