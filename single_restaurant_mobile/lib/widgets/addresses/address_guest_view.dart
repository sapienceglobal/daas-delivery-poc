import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:single_restaurant_mobile/screens/login_screen.dart';

class AddressGuestView extends StatelessWidget {
  final VoidCallback? onBack;

  const AddressGuestView({super.key, this.onBack});

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
          'Saved Addresses',
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
            final titleFontSize = isTall ? 27.0 : (isSmall ? 22.0 : 25.0);
            final subFontSize = isTall ? 15.0 : (isSmall ? 13.0 : 14.0);
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

                        // Hero Illustration: 3D Map, Red Location Pin, House & Green Trees
                        Image.asset(
                          'assets/images/branded/lassi-lounge/address_guest_hero.png',
                          width: double.infinity,
                          height: heroHeight,
                          fit: BoxFit.contain,
                          errorBuilder: (context, error, stackTrace) => const SizedBox(height: 140),
                        ),

                        SizedBox(height: isTall ? 16 : 10),

                        // Heading: "Login to manage your addresses" (Matching Image 1)
                        RichText(
                          textAlign: TextAlign.center,
                          text: TextSpan(
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: titleFontSize,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF1E1E1E),
                              letterSpacing: -0.4,
                              height: 1.2,
                            ),
                            children: const [
                              TextSpan(text: 'Login to manage\n'),
                              TextSpan(text: 'your '),
                              TextSpan(
                                text: 'addresses',
                                style: TextStyle(
                                  color: Color(0xFF8B0D18),
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ],
                          ),
                        ),

                        SizedBox(height: isTall ? 10 : 8),

                        // Subtitle (Matching Image 1)
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Text(
                            'Save your home, work, and other\naddresses for quick delivery.',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: subFontSize,
                              color: const Color(0xFF4A4A4A),
                              fontWeight: FontWeight.w500,
                              height: 1.35,
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
                                // Feature 1: Faster Checkout
                                Expanded(
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.bolt, color: Color(0xFF8B0D18), size: 24),
                                      const SizedBox(height: 6),
                                      Text(
                                        'Faster Checkout',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(
                                          fontSize: isTall ? 11.5 : 10.5,
                                          fontWeight: FontWeight.bold,
                                          color: const Color(0xFF333333),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                                // Divider
                                Container(width: 1, height: 38, color: const Color(0xFFE2D4C3)),

                                // Feature 2: Save Multiple Addresses
                                Expanded(
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.location_on, color: Color(0xFF8B0D18), size: 22),
                                      const SizedBox(height: 6),
                                      Text(
                                        'Save Multiple\nAddresses',
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

                                // Feature 3: Deliver to Your Doorstep
                                Expanded(
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.delivery_dining, color: Color(0xFF8B0D18), size: 24),
                                      const SizedBox(height: 6),
                                      Text(
                                        'Deliver to\nYour Doorstep',
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
