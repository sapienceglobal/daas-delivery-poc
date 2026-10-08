import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _rememberMe = false;

  String? _emailError;
  String? _passwordError;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    // Unfocus any active input
    FocusScope.of(context).unfocus();

    final email = _emailController.text.trim();
    final password = _passwordController.text;

    setState(() {
      _emailError = email.isEmpty ? 'Please enter your email address' : null;
      _passwordError = password.isEmpty ? 'Please enter your password' : null;
    });

    if (email.isEmpty || password.isEmpty) return;

    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.login(email, password, rememberMe: _rememberMe);

    if (success && mounted) {
      context.go('/');
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final mediaQuery = MediaQuery.of(context);
    final bottomInset = math.max(mediaQuery.padding.bottom, mediaQuery.viewPadding.bottom);
    final isKeyboardOpen = mediaQuery.viewInsets.bottom > 0;

    const creamBg = Color(0xFFFAF7F2);
    const primaryCrimson = Color(0xFF991B1B);
    const badgeBg = Color(0xFFFEE8E8);
    const darkNavy = Color(0xFF0F172A);
    const slateSub = Color(0xFF64748B);
    const hintGray = Color(0xFF94A3B8);
    const borderGray = Color(0xFFE2E8F0);

    return Scaffold(
      backgroundColor: creamBg,
      body: Stack(
        children: [
          // Background subtle ornamental watermarks
          Positioned.fill(
            child: IgnorePointer(
              child: CustomPaint(
                painter: const _OrnamentalWatermarkPainter(),
              ),
            ),
          ),

          // Main content
          SafeArea(
            bottom: false,
            child: LayoutBuilder(
              builder: (context, constraints) {
                final availableHeight = constraints.maxHeight;
                // Balanced top gap: positions the logo and form high and elegantly,
                // leaving generous breathing room for the bottom platter hero image
                final topGap = math.max(
                  12.0,
                  (availableHeight - 760.0) * 0.12 + 14.0,
                );

                return SingleChildScrollView(
                  // Screen does not scroll in normal state, only allows scroll when keyboard is open
                  physics: isKeyboardOpen
                      ? const ClampingScrollPhysics()
                      : const NeverScrollableScrollPhysics(),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: constraints.maxHeight,
                    ),
                    child: IntrinsicHeight(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          SizedBox(height: topGap),

                          // Brand Logo
                          Center(
                            child: Image.asset(
                              'assets/images/branded/lassi-lounge/Lassi-Lounge-logo.png',
                              height: 120,
                              fit: BoxFit.contain,
                              errorBuilder: (context, error, stackTrace) => const Icon(
                                Icons.local_drink_rounded,
                                size: 90,
                                color: primaryCrimson,
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Header Titles
                          Text(
                            'Admin Login',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.inter(
                              fontSize: 24,
                              fontWeight: FontWeight.w800,
                              color: darkNavy,
                              letterSpacing: -0.4,
                            ),
                          ),
                          const SizedBox(height: 5),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 28.0),
                            child: Text(
                              'Welcome back! Please sign in to access\nyour Lassi Lounge admin panel.',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                color: slateSub,
                                height: 1.35,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                          ),
                          const SizedBox(height: 18),

                          // Form Card Area
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 24.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                // Email Address Label
                                Text(
                                  'Email Address',
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: darkNavy,
                                  ),
                                ),
                                const SizedBox(height: 6),

                                // Email Input
                                TextField(
                                  controller: _emailController,
                                  keyboardType: TextInputType.emailAddress,
                                  textInputAction: TextInputAction.next,
                                  style: GoogleFonts.inter(
                                    fontSize: 14.5,
                                    color: darkNavy,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  decoration: InputDecoration(
                                    hintText: 'Enter your email',
                                    hintStyle: GoogleFonts.inter(
                                      color: hintGray,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w400,
                                    ),
                                    prefixIcon: Padding(
                                      padding: const EdgeInsets.fromLTRB(10, 8, 12, 8),
                                      child: Container(
                                        width: 34,
                                        height: 34,
                                        decoration: BoxDecoration(
                                          color: badgeBg,
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        alignment: Alignment.center,
                                        child: const Icon(
                                          Icons.mail_outline_rounded,
                                          color: Color(0xFFDC2626),
                                          size: 17,
                                        ),
                                      ),
                                    ),
                                    prefixIconConstraints: const BoxConstraints(
                                      minWidth: 56,
                                      minHeight: 50,
                                      maxHeight: 50,
                                    ),
                                    filled: true,
                                    fillColor: Colors.white,
                                    contentPadding: const EdgeInsets.symmetric(
                                      vertical: 14,
                                      horizontal: 16,
                                    ),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      borderSide: const BorderSide(color: borderGray, width: 1.2),
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      borderSide: const BorderSide(color: borderGray, width: 1.2),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      borderSide: const BorderSide(color: primaryCrimson, width: 1.6),
                                    ),
                                    errorBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      borderSide: const BorderSide(color: Color(0xFFDC2626), width: 1.4),
                                    ),
                                    focusedErrorBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      borderSide: const BorderSide(color: Color(0xFFDC2626), width: 1.6),
                                    ),
                                    errorText: _emailError,
                                  ),
                                  onChanged: (_) {
                                    if (_emailError != null) setState(() => _emailError = null);
                                  },
                                ),
                                const SizedBox(height: 14),

                                // Password Label
                                Text(
                                  'Password',
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: darkNavy,
                                  ),
                                ),
                                const SizedBox(height: 6),

                                // Password Input
                                TextField(
                                  controller: _passwordController,
                                  obscureText: _obscurePassword,
                                  textInputAction: TextInputAction.done,
                                  onSubmitted: (_) => _handleLogin(),
                                  style: GoogleFonts.inter(
                                    fontSize: 14.5,
                                    color: darkNavy,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  decoration: InputDecoration(
                                    hintText: 'Enter your password',
                                    hintStyle: GoogleFonts.inter(
                                      color: hintGray,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w400,
                                    ),
                                    prefixIcon: Padding(
                                      padding: const EdgeInsets.fromLTRB(10, 8, 12, 8),
                                      child: Container(
                                        width: 34,
                                        height: 34,
                                        decoration: BoxDecoration(
                                          color: badgeBg,
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        alignment: Alignment.center,
                                        child: const Icon(
                                          Icons.lock_rounded,
                                          color: Color(0xFFDC2626),
                                          size: 17,
                                        ),
                                      ),
                                    ),
                                    prefixIconConstraints: const BoxConstraints(
                                      minWidth: 56,
                                      minHeight: 50,
                                      maxHeight: 50,
                                    ),
                                    suffixIcon: IconButton(
                                      icon: Icon(
                                        _obscurePassword
                                            ? Icons.visibility_off_outlined
                                            : Icons.visibility_outlined,
                                        color: hintGray,
                                        size: 20,
                                      ),
                                      splashRadius: 20,
                                      onPressed: () {
                                        setState(() {
                                          _obscurePassword = !_obscurePassword;
                                        });
                                      },
                                    ),
                                    suffixIconConstraints: const BoxConstraints(
                                      minWidth: 48,
                                      minHeight: 50,
                                    ),
                                    filled: true,
                                    fillColor: Colors.white,
                                    contentPadding: const EdgeInsets.symmetric(
                                      vertical: 14,
                                      horizontal: 16,
                                    ),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      borderSide: const BorderSide(color: borderGray, width: 1.2),
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      borderSide: const BorderSide(color: borderGray, width: 1.2),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      borderSide: const BorderSide(color: primaryCrimson, width: 1.6),
                                    ),
                                    errorBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      borderSide: const BorderSide(color: Color(0xFFDC2626), width: 1.4),
                                    ),
                                    focusedErrorBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      borderSide: const BorderSide(color: Color(0xFFDC2626), width: 1.6),
                                    ),
                                    errorText: _passwordError,
                                  ),
                                  onChanged: (_) {
                                    if (_passwordError != null) setState(() => _passwordError = null);
                                  },
                                ),
                                const SizedBox(height: 16),

                                // API Error feedback
                                if (authProvider.error != null)
                                  Padding(
                                    padding: const EdgeInsets.only(bottom: 8.0),
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Icon(
                                          Icons.error_outline_rounded,
                                          color: Color(0xFFDC2626),
                                          size: 16,
                                        ),
                                        const SizedBox(width: 6),
                                        Expanded(
                                          child: Text(
                                            authProvider.error!,
                                            style: GoogleFonts.inter(
                                              color: const Color(0xFFDC2626),
                                              fontSize: 12.5,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),

                                // Remember Me & Forgot Password Row
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    GestureDetector(
                                      onTap: () {
                                        setState(() {
                                          _rememberMe = !_rememberMe;
                                        });
                                      },
                                      behavior: HitTestBehavior.opaque,
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          AnimatedContainer(
                                            duration: const Duration(milliseconds: 180),
                                            width: 20,
                                            height: 20,
                                            decoration: BoxDecoration(
                                              borderRadius: BorderRadius.circular(5.5),
                                              border: Border.all(
                                                color: _rememberMe
                                                    ? primaryCrimson
                                                    : const Color(0xFF94A3B8),
                                                width: 1.6,
                                              ),
                                              color: _rememberMe
                                                  ? primaryCrimson
                                                  : Colors.white,
                                            ),
                                            child: _rememberMe
                                                ? const Icon(
                                                    Icons.check_rounded,
                                                    size: 14,
                                                    color: Colors.white,
                                                  )
                                                : null,
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            'Remember me',
                                            style: GoogleFonts.inter(
                                              fontSize: 13,
                                              color: darkNavy,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    GestureDetector(
                                      onTap: () => context.push('/forgot-password'),
                                      child: Text(
                                        'Forgot Password?',
                                        style: GoogleFonts.inter(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w700,
                                          color: primaryCrimson,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 20),

                                // Login Button
                                Container(
                                  height: 50,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(14),
                                    boxShadow: [
                                      BoxShadow(
                                        color: primaryCrimson.withValues(alpha: 0.28),
                                        blurRadius: 16,
                                        offset: const Offset(0, 5),
                                      ),
                                    ],
                                  ),
                                  child: ElevatedButton(
                                    onPressed: authProvider.isLoading ? null : _handleLogin,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: primaryCrimson,
                                      foregroundColor: Colors.white,
                                      elevation: 0,
                                      shadowColor: Colors.transparent,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(14),
                                      ),
                                      disabledBackgroundColor: primaryCrimson.withValues(alpha: 0.65),
                                    ),
                                    child: authProvider.isLoading
                                        ? const SizedBox(
                                            height: 20,
                                            width: 20,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2.2,
                                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                            ),
                                          )
                                        : Row(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              Text(
                                                'Login',
                                                style: GoogleFonts.inter(
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.w700,
                                                  color: Colors.white,
                                                  letterSpacing: 0.2,
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              const Icon(
                                                Icons.arrow_forward_rounded,
                                                size: 18,
                                                color: Colors.white,
                                              ),
                                            ],
                                          ),
                                  ),
                                ),
                                const SizedBox(height: 15),

                                // Trust Badge ("Secure and protected login")
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(4.5),
                                      decoration: const BoxDecoration(
                                        color: Color(0xFFFDE8E8),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons.shield_rounded,
                                        size: 14,
                                        color: Color(0xFFDC2626),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Secure and protected login',
                                      style: GoogleFonts.inter(
                                        fontSize: 12.5,
                                        color: slateSub,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 15),

                          // Bottom Food Platter Hero Image (~200px visible, showing only the curry/naan dish like reference UI)
                          Expanded(
                            child: Stack(
                              alignment: Alignment.bottomCenter,
                              children: [
                                Positioned.fill(
                                  child: Image.asset(
                                    'assets/images/login_curry_platter.jpg',
                                    width: double.infinity,
                                    fit: BoxFit.cover,
                                    alignment: const Alignment(0.0, -0.2),
                                    errorBuilder: (context, error, stackTrace) =>
                                        const SizedBox(height: 20),
                                  ),
                                ),
                                // Feather blend at the very top edge into cream background
                                Positioned.fill(
                                  child: Container(
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(
                                        begin: Alignment.topCenter,
                                        end: Alignment.bottomCenter,
                                        colors: [
                                          creamBg,
                                          creamBg.withValues(alpha: 0.5),
                                          creamBg.withValues(alpha: 0.0),
                                          Colors.transparent,
                                        ],
                                        stops: const [0.0, 0.08, 0.20, 1.0],
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Device 3-Button Navigation bar bottom safe padding
                          SizedBox(height: bottomInset),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

/// Subtle ornamental watermark painter for top corners
class _OrnamentalWatermarkPainter extends CustomPainter {
  const _OrnamentalWatermarkPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final strokePaint = Paint()
      ..color = const Color(0xFFD4AF37).withValues(alpha: 0.18)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    // Top-Right ornamental mandala rings
    final trCenter = Offset(size.width, 0);
    canvas.drawCircle(trCenter, 60, strokePaint);
    canvas.drawCircle(trCenter, 100, strokePaint);
    canvas.drawCircle(trCenter, 140, strokePaint);

    // Subtle petal ticks around the mandala
    const int petalCount = 16;
    for (int i = 0; i < petalCount; i++) {
      final angle = (math.pi / 2) * (i / petalCount);
      final x1 = size.width - 100 * math.cos(angle);
      final y1 = 100 * math.sin(angle);
      final x2 = size.width - 120 * math.cos(angle);
      final y2 = 120 * math.sin(angle);
      canvas.drawLine(Offset(x1, y1), Offset(x2, y2), strokePaint);
    }

    // Top-Left faint decorative botanical branch curves
    final branchPaint = Paint()
      ..color = const Color(0xFFC7BBA5).withValues(alpha: 0.14)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;

    final leafPath = Path();
    leafPath.moveTo(0, 140);
    leafPath.cubicTo(20, 160, 35, 190, 15, 230);
    leafPath.cubicTo(10, 240, 5, 255, 0, 270);
    canvas.drawPath(leafPath, branchPaint);

    // Leaves
    void drawLeaf(double x, double y, double radius, double rot) {
      final leaf = Path();
      leaf.moveTo(x, y);
      leaf.quadraticBezierTo(x + radius * math.cos(rot + 0.5), y + radius * math.sin(rot + 0.5), x + radius * 1.5 * math.cos(rot), y + radius * 1.5 * math.sin(rot));
      leaf.quadraticBezierTo(x + radius * math.cos(rot - 0.5), y + radius * math.sin(rot - 0.5), x, y);
      canvas.drawPath(leaf, branchPaint);
    }

    drawLeaf(16, 170, 14, 0.4);
    drawLeaf(26, 205, 15, -0.3);
    drawLeaf(12, 245, 14, 0.5);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
