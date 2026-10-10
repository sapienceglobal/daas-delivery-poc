import 'package:flutter/material.dart';

/// Centralized corner radius scale for buttons, cards, sheets, and badges.
class AppRadius {
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 20.0;
  static const double xxl = 24.0;
  static const double xxxl = 32.0;
  static const double full = 999.0;

  // Radius objects
  static const Radius radXs = Radius.circular(xs);
  static const Radius radSm = Radius.circular(sm);
  static const Radius radMd = Radius.circular(md);
  static const Radius radLg = Radius.circular(lg);
  static const Radius radXl = Radius.circular(xl);
  static const Radius radXxl = Radius.circular(xxl);
  static const Radius radXxxl = Radius.circular(xxxl);

  // All-around BorderRadius presets
  static const BorderRadius borderXs = BorderRadius.all(radXs);
  static const BorderRadius borderSm = BorderRadius.all(radSm);
  static const BorderRadius borderMd = BorderRadius.all(radMd);
  static const BorderRadius borderLg = BorderRadius.all(radLg);
  static const BorderRadius borderXl = BorderRadius.all(radXl);
  static const BorderRadius borderXxl = BorderRadius.all(radXxl);
  static const BorderRadius borderXxxl = BorderRadius.all(radXxxl);
  static const BorderRadius borderFull = BorderRadius.all(Radius.circular(full));

  // Top-only BorderRadius (for BottomSheets and persistent footers)
  static const BorderRadius topLg = BorderRadius.vertical(top: radLg);
  static const BorderRadius topXl = BorderRadius.vertical(top: radXl);
  static const BorderRadius topXxl = BorderRadius.vertical(top: radXxl);

  // Shape borders for Material widgets (ElevatedButton, Card, etc.)
  static const ShapeBorder shapeSm = RoundedRectangleBorder(borderRadius: borderSm);
  static const ShapeBorder shapeMd = RoundedRectangleBorder(borderRadius: borderMd);
  static const ShapeBorder shapeLg = RoundedRectangleBorder(borderRadius: borderLg);
  static const ShapeBorder shapeXl = RoundedRectangleBorder(borderRadius: borderXl);
  static const ShapeBorder shapeXxl = RoundedRectangleBorder(borderRadius: borderXxl);
  static const ShapeBorder shapeFull = RoundedRectangleBorder(borderRadius: borderFull);
}
