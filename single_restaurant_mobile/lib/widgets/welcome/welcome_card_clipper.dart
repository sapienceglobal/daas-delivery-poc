import 'package:flutter/material.dart';

/// Custom clipper generating the signature double-crest wavy curve
/// along the top boundary of the welcome screen white card.
class WelcomeCardClipper extends CustomClipper<Path> {
  const WelcomeCardClipper();

  @override
  Path getClip(Size size) {
    final path = Path();
    final w = size.width;
    final h = size.height;

    // Start slightly down on the left edge
    path.moveTo(0, 32);

    // Smooth curve rising into left crest
    path.cubicTo(w * 0.06, 16, w * 0.14, 4, w * 0.24, 8);

    // Dipping smoothly into the center valley
    path.cubicTo(w * 0.34, 12, w * 0.42, 34, w * 0.52, 34);

    // Rising smoothly into right crest
    path.cubicTo(w * 0.62, 34, w * 0.72, 8, w * 0.82, 8);

    // Descending to right edge
    path.cubicTo(w * 0.90, 8, w * 0.96, 22, w, 32);

    // Complete rectangle bounds to the bottom
    path.lineTo(w, h);
    path.lineTo(0, h);
    path.close();

    return path;
  }

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => false;
}
