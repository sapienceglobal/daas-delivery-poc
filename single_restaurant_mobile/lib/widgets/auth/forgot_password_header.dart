import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/widgets/app_logo.dart';

/// Pure presentational header for Forgot Password screen.
/// Displays logo, Indian Restaurant tag, and animated/custom envelope illustration.
class ForgotPasswordHeader extends StatelessWidget {
  const ForgotPasswordHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final statusBar = MediaQuery.of(context).padding.top;
    final topPadding = statusBar > 0 ? statusBar + 16.0 : 40.0;

    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFFFFF9F2), Color(0xFFFAF8F5)],
        ),
      ),
      padding: EdgeInsets.only(top: topPadding, bottom: 16.0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const AppLogo(height: 60),
          const SizedBox(height: 8),
          const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.spa, color: Colors.orange, size: 12),
              SizedBox(width: 8),
              Text(
                'INDIAN RESTAURANT',
                style: TextStyle(
                  color: Colors.orange,
                  fontSize: 10,
                  letterSpacing: 1.2,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(width: 8),
              Icon(Icons.spa, color: Colors.orange, size: 12),
            ],
          ),
          const SizedBox(height: 16),
          // Envelope Illustration
          SizedBox(
            height: 150,
            width: 200,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Background circle
                Container(
                  width: 130,
                  height: 130,
                  decoration: BoxDecoration(
                    color: Colors.orange.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                ),
                // Card inside envelope
                Positioned(
                  top: 10,
                  child: Container(
                    width: 100,
                    height: 110,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: const [
                        BoxShadow(color: Colors.black12, blurRadius: 4),
                      ],
                    ),
                    child: const Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.lock, color: AppColors.secondary, size: 30),
                        SizedBox(height: 6),
                        Text(
                          '*****',
                          style: TextStyle(
                            color: AppColors.secondary,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                // Envelope front flap
                Positioned(
                  bottom: 10,
                  child: CustomPaint(
                    size: const Size(140, 70),
                    painter: EnvelopePainter(),
                  ),
                ),
                // Lassi glass
                Positioned(
                  bottom: 5,
                  right: 0,
                  child: Icon(
                    Icons.local_drink,
                    color: Colors.orange.shade300,
                    size: 54,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Custom painter to draw the envelope front flap (v-shape)
class EnvelopePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.orange.shade200
      ..style = PaintingStyle.fill;

    final path = Path();
    path.moveTo(0, 20);
    path.lineTo(size.width / 2, size.height);
    path.lineTo(size.width, 20);
    path.lineTo(size.width, size.height);
    path.lineTo(0, size.height);
    path.close();

    canvas.drawShadow(path, Colors.black26, 4.0, false);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
