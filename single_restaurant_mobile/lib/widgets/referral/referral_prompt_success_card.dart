import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';

class ReferralPromptSuccessCard extends StatelessWidget {
  final Map<String, dynamic>? appliedResult;
  final String restaurantName;
  final VoidCallback onContinue;

  const ReferralPromptSuccessCard({
    super.key,
    required this.appliedResult,
    this.restaurantName = 'Lassi Lounge',
    required this.onContinue,
  });

  @override
  Widget build(BuildContext context) {
    final coupon = appliedResult?['coupon'] as Map<String, dynamic>?;
    final code = coupon?['code']?.toString() ?? 'REFCDUQ9LCU';
    final discount = coupon?['discount'] ?? 20;
    final minOrder = coupon?['minOrder'] ?? 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const SizedBox(height: 4),

        // 1. Success Green Badge with Confetti Sparkles
        Center(
          child: SizedBox(
            width: 88,
            height: 88,
            child: Stack(
              alignment: Alignment.center,
              children: [
                CustomPaint(
                  size: const Size(88, 88),
                  painter: ConfettiBurstPainter(),
                ),
                Container(
                  width: 60,
                  height: 60,
                  decoration: const BoxDecoration(
                    color: Color(0xFFE8F6ED),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Container(
                      width: 46,
                      height: 46,
                      decoration: const BoxDecoration(
                        color: Color(0xFF1E824C),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Color(0x331E824C),
                            blurRadius: 10,
                            offset: Offset(0, 4),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.check,
                        color: Colors.white,
                        size: 28,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const Spacer(flex: 1),

        // 2. Serif Heading
        const Text(
          'Awesome!\nCode Applied',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w900,
            color: Color(0xFF5D0B14),
            fontFamily: 'serif',
            height: 1.15,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 6),

        // 3. Subtitle Description with Bold Discount
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: RichText(
            textAlign: TextAlign.center,
            text: TextSpan(
              style: const TextStyle(
                fontSize: 13.5,
                color: Color(0xFF5A524C),
                height: 1.35,
              ),
              children: [
                const TextSpan(text: 'You unlocked '),
                TextSpan(
                  text: '\$$discount OFF',
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF6B111C),
                  ),
                ),
                TextSpan(
                  text: ' on your first order\nat $restaurantName!\nYour personal coupon has been activated.',
                ),
              ],
            ),
          ),
        ),
        const Spacer(flex: 2),

        // 4. Ticket Coupon Card with Notches and Dashed Border
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: CustomPaint(
            painter: DashedTicketBorderPainter(
              color: const Color(0xFFE5DDD4),
              strokeWidth: 1.2,
              notchRadius: 12.0,
              notchY: 60.0,
            ),
            child: ClipPath(
              clipper: TicketNotchClipper(notchRadius: 12.0, notchY: 60.0),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    const Text(
                      'YOUR FIRST-ORDER COUPON',
                      style: TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.4,
                        color: Color(0xFF7A6F68),
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Code Row: Gift Icon, Code Text, Copy Button
                    Row(
                      children: [
                        Image.asset(
                          'assets/images/branded/lassi-lounge/referral_box_icon.jpg',
                          width: 40,
                          height: 40,
                          fit: BoxFit.contain,
                          errorBuilder: (context, error, stackTrace) => const Icon(
                            Icons.card_giftcard,
                            color: Color(0xFF6B111C),
                            size: 34,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            alignment: Alignment.centerLeft,
                            child: Text(
                              code,
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 2.2,
                                color: Color(0xFF6B111C),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: () {
                            Clipboard.setData(ClipboardData(text: code));
                            ToastUtils.showSuccess(context, 'Coupon code copied to clipboard!');
                          },
                          child: Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              color: const Color(0xFFFDE8E8),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Center(
                              child: Icon(
                                Icons.copy_rounded,
                                size: 18,
                                color: Color(0xFF6B111C),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Inner Peach/Blush Banner
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF2EE),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Column(
                        children: [
                          Text(
                            '\$$discount OFF on your first order',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF6B111C),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Minimum order: \$$minOrder • Valid for first order only',
                            style: const TextStyle(
                              fontSize: 10.5,
                              color: Color(0xFF7A6F68),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        const Spacer(flex: 2),

        // 5. Start Ordering Button
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: onContinue,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6B111C),
                foregroundColor: Colors.white,
                elevation: 3,
                shadowColor: const Color(0xFF6B111C).withValues(alpha: 0.35),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Start Ordering Now',
                    style: TextStyle(
                      fontSize: 15.5,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(width: 8),
                  Icon(Icons.arrow_forward, size: 18),
                ],
              ),
            ),
          ),
        ),
        const Spacer(flex: 1),
      ],
    );
  }
}

// ── Ticket Custom Clipper (Side Notches) ──────────────────────────────────
class TicketNotchClipper extends CustomClipper<Path> {
  final double notchRadius;
  final double notchY;

  TicketNotchClipper({this.notchRadius = 12.0, this.notchY = 62.0});

  @override
  Path getClip(Size size) {
    const r = 16.0;
    final path = Path();
    path.moveTo(r, 0);
    path.lineTo(size.width - r, 0);
    path.arcToPoint(Offset(size.width, r), radius: const Radius.circular(r));

    // Right notch
    path.lineTo(size.width, notchY - notchRadius);
    path.arcToPoint(
      Offset(size.width, notchY + notchRadius),
      radius: Radius.circular(notchRadius),
      clockwise: false,
    );
    path.lineTo(size.width, size.height - r);
    path.arcToPoint(Offset(size.width - r, size.height), radius: const Radius.circular(r));

    path.lineTo(r, size.height);
    path.arcToPoint(Offset(0, size.height - r), radius: const Radius.circular(r));

    // Left notch
    path.lineTo(0, notchY + notchRadius);
    path.arcToPoint(
      Offset(0, notchY - notchRadius),
      radius: Radius.circular(notchRadius),
      clockwise: false,
    );
    path.lineTo(0, r);
    path.arcToPoint(Offset(r, 0), radius: const Radius.circular(r));

    return path;
  }

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => false;
}

// ── Dashed Border Painter along Ticket Path ─────────────────────────────────
class DashedTicketBorderPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  final double notchRadius;
  final double notchY;

  DashedTicketBorderPainter({
    required this.color,
    this.strokeWidth = 1.2,
    this.notchRadius = 12.0,
    this.notchY = 62.0,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final clipper = TicketNotchClipper(notchRadius: notchRadius, notchY: notchY);
    final path = clipper.getClip(size);

    final paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke;

    for (final metric in path.computeMetrics()) {
      double distance = 0.0;
      const dashWidth = 5.0;
      const dashSpace = 4.0;
      while (distance < metric.length) {
        final length = math.min(dashWidth, metric.length - distance);
        final extractPath = metric.extractPath(distance, distance + length);
        canvas.drawPath(extractPath, paint);
        distance += dashWidth + dashSpace;
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ── Festive Confetti Burst Painter for Success Icon ─────────────────────────
class ConfettiBurstPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.8
      ..strokeCap = StrokeCap.round;

    final center = Offset(size.width / 2, size.height / 2);

    final bursts = [
      {'angle': -1.2, 'dist': 38.0, 'len': 7.0, 'color': const Color(0xFFD97706)},
      {'angle': -0.7, 'dist': 40.0, 'len': 6.0, 'color': const Color(0xFFDC2626)},
      {'angle': -0.2, 'dist': 38.0, 'len': 8.0, 'color': const Color(0xFFF59E0B)},
      {'angle': 2.3, 'dist': 39.0, 'len': 7.0, 'color': const Color(0xFFD97706)},
      {'angle': 2.8, 'dist': 40.0, 'len': 6.0, 'color': const Color(0xFFDC2626)},
      {'angle': 3.3, 'dist': 38.0, 'len': 7.0, 'color': const Color(0xFFF59E0B)},
    ];

    for (var b in bursts) {
      final angle = b['angle'] as double;
      final dist = b['dist'] as double;
      final len = b['len'] as double;
      paint.color = b['color'] as Color;

      final start = Offset(
        center.dx + math.cos(angle) * dist,
        center.dy + math.sin(angle) * dist,
      );
      final end = Offset(
        center.dx + math.cos(angle) * (dist + len),
        center.dy + math.sin(angle) * (dist + len),
      );
      canvas.drawPath(
        Path()
          ..moveTo(start.dx, start.dy)
          ..lineTo(end.dx, end.dy),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
