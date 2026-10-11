import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/screens/main_screen.dart';
import 'package:single_restaurant_mobile/services/referral_service.dart';
import 'package:single_restaurant_mobile/widgets/referral/referral_prompt_success_card.dart';

class ReferralPromptScreen extends StatefulWidget {
  const ReferralPromptScreen({super.key});

  @override
  State<ReferralPromptScreen> createState() => _ReferralPromptScreenState();
}

class _ReferralPromptScreenState extends State<ReferralPromptScreen> {
  final _controller = TextEditingController();
  final _referralService = ReferralService();
  bool _isLoading = false;
  String? _errorMessage;
  Map<String, dynamic>? _program;
  Map<String, dynamic>? _appliedResult;

  @override
  void initState() {
    super.initState();
    _loadProgram();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _loadProgram() async {
    final prog = await _referralService.getProgram();
    if (mounted && prog != null) {
      setState(() => _program = prog);
    }
  }

  void _navigateToHome() {
    if (!mounted) return;
    context.read<AuthProvider>().fetchUser();
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const MainScreen(initialIndex: 0)),
      (route) => false,
    );
  }

  Future<void> _onSkip() async {
    setState(() => _isLoading = true);
    await _referralService.skipOnboarding();
    _navigateToHome();
  }

  Future<void> _onApply() async {
    final code = _controller.text.trim().toUpperCase();
    if (code.isEmpty) {
      setState(() => _errorMessage = 'Please enter a referral code.');
      return;
    }

    FocusManager.instance.primaryFocus?.unfocus();

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await _referralService.applyCode(code);
      if (mounted) {
        setState(() {
          _isLoading = false;
          _appliedResult = res;
        });
      }
    } catch (e) {
      if (mounted) {
        final raw = e.toString().replaceFirst('Exception: ', '');
        setState(() {
          _isLoading = false;
          _errorMessage = raw;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final restProv = Provider.of<RestaurantProvider>(context, listen: false);
    final restaurantName = restProv.restaurant?['name']?.toString() ?? 'Lassi Lounge';
    final keyboardHeight = MediaQuery.of(context).viewInsets.bottom;
    final isKeyboardOpen = keyboardHeight > 0;

    return Scaffold(
      resizeToAvoidBottomInset: false,
      backgroundColor: const Color(0xFFFCF8EF),
      body: GestureDetector(
        onTap: () {
          final currentFocus = FocusScope.of(context);
          if (!currentFocus.hasPrimaryFocus && currentFocus.focusedChild != null) {
            FocusManager.instance.primaryFocus?.unfocus();
          }
        },
        behavior: HitTestBehavior.translucent,
        child: AnnotatedRegion<SystemUiOverlayStyle>(
          value: const SystemUiOverlayStyle(
            statusBarColor: Colors.transparent,
            statusBarIconBrightness: Brightness.dark,
            systemNavigationBarColor: Color(0xFF660C0B),
            systemNavigationBarIconBrightness: Brightness.light,
          ),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final screenHeight = constraints.maxHeight;
              final isTall = screenHeight >= 800; // Tall devices like OnePlus 12 (~850-920dp)
              final isSmall = screenHeight < 700; // Small phones

              final footerHeight = isTall ? 195.0 : (isSmall ? 135.0 : 165.0);
              // HERO & FONT SIZES REMAIN STABLE (NO ABRUPT COLLAPSE/JUMPING WHEN KEYBOARD OPENS!)
              final heroHeight = isTall ? 165.0 : (isSmall ? 125.0 : 145.0);
              final titleFontSize = isTall ? 26.0 : (isSmall ? 22.0 : 24.0);
              final subFontSize = isTall ? 13.5 : (isSmall ? 11.5 : 12.5);
              final inputHeight = isTall ? 50.0 : (isSmall ? 44.0 : 48.0);
              final buttonHeight = isTall ? 48.0 : (isSmall ? 44.0 : 46.0);

              return Stack(
                children: [
                  // 1. Bottom Food Platter & Maroon Wave anchored to absolute bottom (never moves with keyboard)
                  // When keyboard is open, do NOT render it at all so it never creeps up or obscures inputs!
                  if (!isKeyboardOpen)
                    Positioned(
                      left: 0,
                      right: 0,
                      bottom: 0,
                      child: IgnorePointer(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Image.asset(
                              'assets/images/branded/lassi-lounge/referral_footer_feast.png',
                              width: double.infinity,
                              height: footerHeight,
                              fit: BoxFit.cover,
                              alignment: Alignment.bottomCenter,
                              errorBuilder: (context, error, stackTrace) => const SizedBox(height: 60),
                            ),
                            Container(
                              height: MediaQuery.of(context).padding.bottom,
                              color: const Color(0xFF660C0B),
                            ),
                          ],
                        ),
                      ),
                    ),

                  // 2. Foreground Content
                  SafeArea(
                    top: true,
                    bottom: false,
                    child: SizedBox(
                      width: double.infinity,
                      height: screenHeight - MediaQuery.of(context).padding.top,
                      child: Column(
                        children: [
                          // Top Bar: Skip button on top right
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                if (_appliedResult == null)
                                  GestureDetector(
                                    onTap: _isLoading ? null : _onSkip,
                                    behavior: HitTestBehavior.opaque,
                                    child: const Padding(
                                      padding: EdgeInsets.symmetric(vertical: 4, horizontal: 4),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Text(
                                            'Skip',
                                            style: TextStyle(
                                              fontSize: 14.5,
                                              fontWeight: FontWeight.bold,
                                              color: Color(0xFF6B111C),
                                            ),
                                          ),
                                          SizedBox(width: 2),
                                          Icon(Icons.chevron_right, size: 18, color: Color(0xFF6B111C)),
                                        ],
                                      ),
                                    ),
                                  )
                                else
                                  const SizedBox(height: 28),
                              ],
                            ),
                          ),

                          // Main Content (Prompt Form OR Success Card)
                          Expanded(
                            child: _appliedResult != null
                                ? Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 20),
                                    child: ReferralPromptSuccessCard(
                                      appliedResult: _appliedResult,
                                      restaurantName: restaurantName,
                                      onContinue: _navigateToHome,
                                    ),
                                  )
                                : _buildPromptForm(
                                    restaurantName,
                                    isTall,
                                    isSmall,
                                    isKeyboardOpen,
                                    keyboardHeight,
                                    heroHeight,
                                    titleFontSize,
                                    subFontSize,
                                    inputHeight,
                                    buttonHeight,
                                    footerHeight,
                                  ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildPromptForm(
    String restaurantName,
    bool isTall,
    bool isSmall,
    bool isKeyboardOpen,
    double keyboardHeight,
    double heroHeight,
    double titleFontSize,
    double subFontSize,
    double inputHeight,
    double buttonHeight,
    double footerHeight,
  ) {
    final discount = _program?['refereeDiscountValue'] ?? 20;

    return SingleChildScrollView(
      physics: const ClampingScrollPhysics(),
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      padding: EdgeInsets.only(
        top: 4,
        bottom: isKeyboardOpen
            ? (keyboardHeight + 20.0)
            : (footerHeight * 0.72 + MediaQuery.of(context).padding.bottom + 12.0),
      ),
      child: Column(
        children: [
          // 1. Hero Illustration: Seamless 3D Gift Box with Red Ticket & Airplane Trail
          _buildHeroImage(discount, heroHeight),
          SizedBox(height: isTall ? 14 : (isSmall ? 8 : 10)),

          // 2. Serif Heading ("Have a Referral Code?")
          Text(
            'Have a\nReferral Code?',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: titleFontSize,
              fontWeight: FontWeight.w900,
              color: const Color(0xFF5D0B14),
              fontFamily: 'serif',
              height: 1.15,
              letterSpacing: -0.5,
            ),
          ),
          SizedBox(height: isTall ? 8 : (isSmall ? 4 : 6)),

          // 3. Subtitle with Bold Red Discount & Restaurant Name
          RichText(
            textAlign: TextAlign.center,
            text: TextSpan(
              style: TextStyle(
                fontSize: subFontSize,
                color: const Color(0xFF554D47),
                height: 1.35,
              ),
              children: [
                const TextSpan(text: 'Enter your friend\'s referral code to get\n'),
                TextSpan(
                  text: '\$$discount OFF',
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF6B111C),
                  ),
                ),
                TextSpan(
                  text: ' on your first order\nat $restaurantName!',
                ),
              ],
            ),
          ),
          SizedBox(height: isTall ? 16 : (isSmall ? 10 : 12)),

          // 4. Input Field Card with Tag Icon
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Container(
              height: inputHeight,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: _errorMessage != null ? const Color(0xFFB91C1C) : const Color(0xFFEDE3DC),
                  width: 1.2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  const SizedBox(width: 14),
                  const Icon(
                    Icons.local_offer_outlined,
                    color: Color(0xFF6B111C),
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Container(
                    width: 1,
                    height: 22,
                    color: const Color(0xFFEDE3DC),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      textCapitalization: TextCapitalization.characters,
                      inputFormatters: [
                        FilteringTextInputFormatter.allow(RegExp(r'[a-zA-Z0-9]')),
                        LengthLimitingTextInputFormatter(16),
                      ],
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1E1E1E),
                        letterSpacing: 0.5,
                      ),
                      decoration: const InputDecoration(
                        hintText: 'Enter referral code',
                        hintStyle: TextStyle(
                          color: Color(0xFF9E958C),
                          fontSize: 14.5,
                          fontWeight: FontWeight.normal,
                        ),
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.zero,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                ],
              ),
            ),
          ),

          // Error message if code is invalid
          if (_errorMessage != null) ...[
            const SizedBox(height: 6),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 14, color: Color(0xFFB91C1C)),
                const SizedBox(width: 5),
                Flexible(
                  child: Text(
                    _errorMessage!,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFFB91C1C),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ],
          SizedBox(height: isTall ? 14 : (isSmall ? 8 : 10)),

          // 5. Primary Button ("Apply & Claim Discount →")
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: SizedBox(
              width: double.infinity,
              height: buttonHeight,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _onApply,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6B111C),
                  foregroundColor: Colors.white,
                  elevation: 3,
                  shadowColor: const Color(0xFF6B111C).withValues(alpha: 0.35),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: _isLoading
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2.2,
                        ),
                      )
                    : const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Apply & Claim Discount',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.2,
                            ),
                          ),
                          SizedBox(width: 8),
                          Icon(Icons.arrow_forward, size: 18),
                        ],
                      ),
              ),
            ),
          ),
          SizedBox(height: isTall ? 12 : (isSmall ? 8 : 10)),

          // 6. OR Divider
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              children: [
                const Expanded(child: Divider(color: Color(0xFFE5DDD4), thickness: 1)),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  child: Text(
                    'OR',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey.shade500,
                      letterSpacing: 1.0,
                    ),
                  ),
                ),
                const Expanded(child: Divider(color: Color(0xFFE5DDD4), thickness: 1)),
              ],
            ),
          ),
          SizedBox(height: isTall ? 12 : (isSmall ? 8 : 10)),

          // 7. Secondary Outline Button ("I don't have a code, continue >")
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 46),
            child: SizedBox(
              width: double.infinity,
              height: isTall ? 44 : 40,
              child: OutlinedButton(
                onPressed: _isLoading ? null : _onSkip,
                style: OutlinedButton.styleFrom(
                  backgroundColor: Colors.white,
                  side: const BorderSide(color: Color(0xFF6B111C), width: 1.2),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'I don\'t have a code, continue',
                      style: TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF6B111C),
                      ),
                    ),
                    SizedBox(width: 4),
                    Icon(Icons.chevron_right, size: 16, color: Color(0xFF6B111C)),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildHeroImage(dynamic discountVal, double height) {
    final discount = (discountVal is num)
        ? discountVal.toInt()
        : (int.tryParse(discountVal.toString()) ?? 20);

    // Aspect ratio of referral_hero_blank.png is 460 / 240 = 1.9167
    final width = height * (460.0 / 240.0);

    return SizedBox(
      height: height,
      width: width,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // 1. Clean base hero illustration (No baked-in Skip button, clean red ticket with single authentic 'OFF')
          Image.asset(
            'assets/images/branded/lassi-lounge/referral_hero_blank.png',
            height: height,
            width: width,
            fit: BoxFit.contain,
            errorBuilder: (context, error, stackTrace) => const SizedBox(),
          ),

          // 2. 100% Dynamic Backend Discount Text Overlay ($20, $30) on top of the red ticket (above original OFF)
          Positioned(
            left: width * 0.485,
            top: height * 0.375,
            width: width * 0.19,
            height: height * 0.20,
            child: Transform.rotate(
              angle: 0.19, // Positive clockwise angle (+11 deg): $ on left tilts up, number on right tilts down towards F of OFF
              child: FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  '\$$discount',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: height * 0.175,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5,
                    height: 1.0,
                    shadows: const [
                      Shadow(color: Color(0x33000000), blurRadius: 4, offset: Offset(0, 1)),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
