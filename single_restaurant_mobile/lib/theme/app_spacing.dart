import 'package:flutter/material.dart';

/// Centralized spacing tokens (4px base scale) for consistent layout,
/// margins, padding, and gaps across all devices.
class AppSpacing {
  static const double xxs = 2.0;
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 20.0;
  static const double xxl = 24.0;
  static const double xxxl = 32.0;
  static const double section = 40.0;
  static const double massive = 48.0;
  static const double giant = 64.0;

  // EdgeInsets presets for padding/margins
  static const EdgeInsets zero = EdgeInsets.zero;
  static const EdgeInsets pXs = EdgeInsets.all(xs);
  static const EdgeInsets pSm = EdgeInsets.all(sm);
  static const EdgeInsets pMd = EdgeInsets.all(md);
  static const EdgeInsets pLg = EdgeInsets.all(lg);
  static const EdgeInsets pXl = EdgeInsets.all(xl);
  static const EdgeInsets pXxl = EdgeInsets.all(xxl);

  // Horizontal padding presets
  static const EdgeInsets hSm = EdgeInsets.symmetric(horizontal: sm);
  static const EdgeInsets hMd = EdgeInsets.symmetric(horizontal: md);
  static const EdgeInsets hLg = EdgeInsets.symmetric(horizontal: lg);
  static const EdgeInsets hXl = EdgeInsets.symmetric(horizontal: xl);
  static const EdgeInsets hXxl = EdgeInsets.symmetric(horizontal: xxl);

  // Vertical padding presets
  static const EdgeInsets vXs = EdgeInsets.symmetric(vertical: xs);
  static const EdgeInsets vSm = EdgeInsets.symmetric(vertical: sm);
  static const EdgeInsets vMd = EdgeInsets.symmetric(vertical: md);
  static const EdgeInsets vLg = EdgeInsets.symmetric(vertical: lg);
  static const EdgeInsets vXl = EdgeInsets.symmetric(vertical: xl);

  // Pre-built SizedBox gaps for vertical rhythm
  static const Widget gapH4 = SizedBox(height: xs);
  static const Widget gapH8 = SizedBox(height: sm);
  static const Widget gapH12 = SizedBox(height: md);
  static const Widget gapH16 = SizedBox(height: lg);
  static const Widget gapH20 = SizedBox(height: xl);
  static const Widget gapH24 = SizedBox(height: xxl);
  static const Widget gapH32 = SizedBox(height: xxxl);
  static const Widget gapH40 = SizedBox(height: section);
  static const Widget gapH48 = SizedBox(height: massive);

  // Pre-built SizedBox gaps for horizontal rhythm
  static const Widget gapW4 = SizedBox(width: xs);
  static const Widget gapW8 = SizedBox(width: sm);
  static const Widget gapW12 = SizedBox(width: md);
  static const Widget gapW16 = SizedBox(width: lg);
  static const Widget gapW20 = SizedBox(width: xl);
  static const Widget gapW24 = SizedBox(width: xxl);
  static const Widget gapW32 = SizedBox(width: xxxl);
}
