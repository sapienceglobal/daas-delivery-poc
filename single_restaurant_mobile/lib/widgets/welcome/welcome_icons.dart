import 'package:flutter/material.dart';

/// Pixel-perfect menu/document sheet icon with 3 horizontal lines.
class MenuDocumentIcon extends StatelessWidget {
  final Color color;
  final double size;

  const MenuDocumentIcon({
    super.key,
    required this.color,
    this.size = 28,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _MenuDocumentPainter(color: color),
      ),
    );
  }
}

class _MenuDocumentPainter extends CustomPainter {
  final Color color;

  _MenuDocumentPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final stroke = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final fill = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round;

    // Outer rounded document frame
    final rect = RRect.fromRectAndRadius(
      Rect.fromLTWH(size.width * 0.16, size.height * 0.12, size.width * 0.68, size.height * 0.76),
      const Radius.circular(5.0),
    );
    canvas.drawRRect(rect, stroke);

    // Three horizontal text lines
    final left = size.width * 0.32;
    final top1 = size.height * 0.35;
    final top2 = size.height * 0.50;
    final top3 = size.height * 0.65;

    // Line 1
    canvas.drawLine(Offset(left, top1), Offset(size.width * 0.68, top1), fill);
    // Line 2
    canvas.drawLine(Offset(left, top2), Offset(size.width * 0.68, top2), fill);
    // Line 3 (shorter)
    canvas.drawLine(Offset(left, top3), Offset(size.width * 0.50, top3), fill);
  }

  @override
  bool shouldRepaint(covariant _MenuDocumentPainter oldDelegate) =>
      oldDelegate.color != color;
}

/// Pixel-perfect cloche/food serving platter with 3 steam lines.
class ClochePlatterIcon extends StatelessWidget {
  final Color color;
  final double size;

  const ClochePlatterIcon({
    super.key,
    required this.color,
    this.size = 28,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _ClochePlatterPainter(color: color),
      ),
    );
  }
}

class _ClochePlatterPainter extends CustomPainter {
  final Color color;

  _ClochePlatterPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final stroke = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final w = size.width;
    final h = size.height;

    // 3 Steam lines on top
    final steam1 = Path()
      ..moveTo(w * 0.36, h * 0.22)
      ..quadraticBezierTo(w * 0.32, h * 0.14, w * 0.36, h * 0.08);
    canvas.drawPath(steam1, stroke);

    final steam2 = Path()
      ..moveTo(w * 0.50, h * 0.20)
      ..quadraticBezierTo(w * 0.46, h * 0.12, w * 0.50, h * 0.06);
    canvas.drawPath(steam2, stroke);

    final steam3 = Path()
      ..moveTo(w * 0.64, h * 0.22)
      ..quadraticBezierTo(w * 0.60, h * 0.14, w * 0.64, h * 0.08);
    canvas.drawPath(steam3, stroke);

    // Top small knob handle
    final knobRect = Rect.fromCenter(
      center: Offset(w * 0.50, h * 0.30),
      width: w * 0.14,
      height: h * 0.10,
    );
    canvas.drawArc(knobRect, 3.14159, 3.14159, false, stroke);

    // Domed Cloche Lid
    final dome = Path()
      ..moveTo(w * 0.16, h * 0.65)
      ..cubicTo(w * 0.18, h * 0.35, w * 0.82, h * 0.35, w * 0.84, h * 0.65)
      ..close();
    canvas.drawPath(dome, stroke);

    // Base Platter Rim
    final baseRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(w * 0.10, h * 0.68, w * 0.80, h * 0.08),
      const Radius.circular(3.0),
    );
    canvas.drawRRect(baseRect, stroke);
  }

  @override
  bool shouldRepaint(covariant _ClochePlatterPainter oldDelegate) =>
      oldDelegate.color != color;
}

/// Pixel-perfect dining table with two chairs outline icon.
class DiningTableIcon extends StatelessWidget {
  final Color color;
  final double size;

  const DiningTableIcon({
    super.key,
    required this.color,
    this.size = 28,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _DiningTablePainter(color: color),
      ),
    );
  }
}

class _DiningTablePainter extends CustomPainter {
  final Color color;

  _DiningTablePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final stroke = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final w = size.width;
    final h = size.height;

    // Center Dining Table Top
    canvas.drawLine(Offset(w * 0.35, h * 0.44), Offset(w * 0.65, h * 0.44), stroke);
    // Center Table Pedestal / Leg
    canvas.drawLine(Offset(w * 0.50, h * 0.44), Offset(w * 0.50, h * 0.78), stroke);
    // Center Table Base Feet
    canvas.drawLine(Offset(w * 0.42, h * 0.78), Offset(w * 0.58, h * 0.78), stroke);

    // Left Chair: Back, Seat, Legs
    // Chair Back
    canvas.drawLine(Offset(w * 0.16, h * 0.28), Offset(w * 0.20, h * 0.54), stroke);
    // Chair Seat
    canvas.drawLine(Offset(w * 0.18, h * 0.54), Offset(w * 0.32, h * 0.54), stroke);
    // Chair Left Leg
    canvas.drawLine(Offset(w * 0.18, h * 0.54), Offset(w * 0.16, h * 0.78), stroke);
    // Chair Right Leg
    canvas.drawLine(Offset(w * 0.30, h * 0.54), Offset(w * 0.30, h * 0.78), stroke);

    // Right Chair: Back, Seat, Legs
    // Chair Back
    canvas.drawLine(Offset(w * 0.84, h * 0.28), Offset(w * 0.80, h * 0.54), stroke);
    // Chair Seat
    canvas.drawLine(Offset(w * 0.68, h * 0.54), Offset(w * 0.82, h * 0.54), stroke);
    // Chair Left Leg
    canvas.drawLine(Offset(w * 0.70, h * 0.54), Offset(w * 0.70, h * 0.78), stroke);
    // Chair Right Leg
    canvas.drawLine(Offset(w * 0.82, h * 0.54), Offset(w * 0.84, h * 0.78), stroke);
  }

  @override
  bool shouldRepaint(covariant _DiningTablePainter oldDelegate) =>
      oldDelegate.color != color;
}
