import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../providers/auth_provider.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with TickerProviderStateMixin {
  double _opacity = 0.0;
  int _currentTextIndex = 0;
  late AnimationController _spinnerController;
  late AnimationController _textFadeController;
  late Animation<double> _textFadeAnimation;
  Timer? _textTimer;

  final List<String> _loadingTexts = [
    'Crafting Experiences, One Order at a Time',
    'Preparing Your Dashboard...',
    'Setting Up Your Kitchen View...',
    'Loading Your Menu Magic...',
    'Syncing Orders & Analytics...',
    'Almost There, Chef!',
  ];

  @override
  void initState() {
    super.initState();

    _spinnerController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();

    _textFadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _textFadeAnimation = CurvedAnimation(
      parent: _textFadeController,
      curve: Curves.easeInOut,
    );
    _textFadeController.forward();

    // Start animation immediately after first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        setState(() {
          _opacity = 1.0;
        });
      }
    });

    // Rotate loading texts every 2.5 seconds
    _textTimer = Timer.periodic(const Duration(milliseconds: 2500), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      _textFadeController.reverse().then((_) {
        if (mounted) {
          setState(() {
            _currentTextIndex = (_currentTextIndex + 1) % _loadingTexts.length;
          });
          _textFadeController.forward();
        }
      });
    });

    _checkAuth();
  }

  Future<void> _checkAuth() async {
    // Artificial delay to show the nice splash screen
    await Future.delayed(const Duration(seconds: 4));
    
    if (!mounted) return;
    
    final authProvider = context.read<AuthProvider>();
    await authProvider.checkLoginStatus();
    
    if (!mounted) return;

    if (authProvider.isAuthenticated) {
      context.go('/');
    } else {
      context.go('/login');
    }
  }

  @override
  void dispose() {
    _textTimer?.cancel();
    _spinnerController.dispose();
    _textFadeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Full-screen background image
          Positioned.fill(
            child: Image.asset(
              'assets/images/branded/lassi-lounge/splash-bg.jpg',
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) => Container(
                color: const Color(0xFFF5F0E8),
              ),
            ),
          ),

          // Content overlay
          SafeArea(
            child: AnimatedOpacity(
              duration: const Duration(milliseconds: 1200),
              curve: Curves.easeIn,
              opacity: _opacity,
              child: Column(
                children: [
                  const Spacer(flex: 2),

                  // Brand Logo
                  AnimatedScale(
                    scale: _opacity == 0.0 ? 0.7 : 1.0,
                    duration: const Duration(milliseconds: 1400),
                    curve: Curves.easeOutBack,
                    child: Image.asset(
                      'assets/images/branded/lassi-lounge/Lassi-Lounge-logo.png',
                      height: 130,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => const Icon(
                        Icons.restaurant_menu,
                        size: 100,
                        color: Color(0xFFDC2626),
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Tagline: "Manage. Serve. Delight."
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Manage. ',
                        style: GoogleFonts.playfairDisplay(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF2D2D2D),
                        ),
                      ),
                      Text(
                        'Serve. ',
                        style: GoogleFonts.playfairDisplay(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFFE8A700), // golden/yellow accent
                        ),
                      ),
                      Text(
                        'Delight.',
                        style: GoogleFonts.playfairDisplay(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF2D2D2D),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 10),

                  // Subtitle
                  Text(
                    'Your restaurant, your way.',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: Colors.grey.shade600,
                      fontWeight: FontWeight.w500,
                    ),
                  ),

                  const Spacer(flex: 5),

                  // Loading section at the bottom
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Custom tri-color spinner
                      AnimatedBuilder(
                        animation: _spinnerController,
                        builder: (context, child) {
                          return CustomPaint(
                            size: const Size(36, 36),
                            painter: _TriColorSpinnerPainter(
                              progress: _spinnerController.value,
                            ),
                          );
                        },
                      ),

                      const SizedBox(height: 16),

                      // "L O A D I N G" text
                      Text(
                        'L O A D I N G',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          letterSpacing: 4,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          shadows: [
                            Shadow(color: Colors.black.withValues(alpha: 0.8), blurRadius: 4, offset: const Offset(0, 1)),
                            Shadow(color: Colors.black.withValues(alpha: 0.8), blurRadius: 8, offset: const Offset(0, 2)),
                            Shadow(color: Colors.black.withValues(alpha: 0.5), blurRadius: 12, offset: const Offset(0, 0)),
                          ],
                        ),
                      ),

                      const SizedBox(height: 8),

                      // Rotating motivational text
                      FadeTransition(
                        opacity: _textFadeAnimation,
                        child: Text(
                          _loadingTexts[_currentTextIndex],
                          textAlign: TextAlign.center,
                          style: GoogleFonts.playfairDisplay(
                            fontSize: 17,
                            fontStyle: FontStyle.italic,
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            shadows: [
                              Shadow(color: Colors.black.withValues(alpha: 0.6), blurRadius: 4, offset: const Offset(0, 1)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Custom painter for a tri-color (red/green/orange) spinning arc indicator
class _TriColorSpinnerPainter extends CustomPainter {
  final double progress;
  _TriColorSpinnerPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 2;
    const strokeWidth = 3.0;

    final colors = [
      const Color(0xFFDC2626), // red
      const Color(0xFF16A34A), // green
      const Color(0xFFF59E0B), // orange/amber
    ];

    final baseAngle = progress * 2 * pi;

    for (int i = 0; i < 3; i++) {
      final paint = Paint()
        ..color = colors[i]
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round;

      final startAngle = baseAngle + (i * 2 * pi / 3);
      const sweepAngle = pi / 3; // 60 degrees each

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle,
        false,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _TriColorSpinnerPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
