import 'package:flutter/material.dart';

/// Centralized color palette for Lassi Lounge customer app.
/// Retains exact existing brand constants while extending semantic,
/// surface, and dark-mode tokens for premium styling.
class AppColors {
  // Existing Brand Colors (Untouched)
  static const Color primary = Color(0xFFFDB714); // Warm Golden Yellow
  static const Color secondary = Color(0xFF430805); // Rich Dark Maroon/Brown
  static const Color background = Color(0xFFFFFFFF);
  static const Color textDark = Color(0xFF1E1E1E);
  static const Color textLight = Color(0xFF757575);
  static const Color textWhite = Color(0xFFFFFFFF);
  static const Color divider = Color(0xFFEEEEEE);
  static const Color cardShadow = Color(0x1A000000); // 10% opacity black

  // Extended Brand Accents
  static const Color accent = Color(0xFF7A0B10); // Deep Crimson / Burgundy
  static const Color brandRed = Color(0xFF7A0B10); // Brand red accent
  static const Color creamBackground = Color(0xFFFCF9F2); // Warm Off-White / Cream
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceMuted = Color(0xFFF9FAFB);

  // Border & Outline Tokens
  static const Color border = Color(0xFFE5E7EB);
  static const Color borderSubtle = Color(0xFFF3F4F6);

  // Semantic Feedback Tokens
  static const Color success = Color(0xFF16A34A);
  static const Color successLight = Color(0xFFF0FDF4);
  static const Color successBorder = Color(0xFFBBF7D0);

  static const Color warning = Color(0xFFD97706);
  static const Color warningLight = Color(0xFFFFFBEB);
  static const Color warningBorder = Color(0xFFFDE68A);

  static const Color error = Color(0xFFDC2626);
  static const Color errorLight = Color(0xFFFEF2F2);
  static const Color errorBorder = Color(0xFFFECACA);

  static const Color info = Color(0xFF2563EB);
  static const Color infoLight = Color(0xFFEFF6FF);
  static const Color infoBorder = Color(0xFFBFDBFE);

  // Dark Mode Tokens
  static const Color darkBackground = Color(0xFF121212);
  static const Color darkSurface = Color(0xFF1E1E1E);
  static const Color darkCard = Color(0xFF252525);
  static const Color darkBorder = Color(0xFF2E2E2E);
  static const Color darkTextPrimary = Color(0xFFF3F4F6);
  static const Color darkTextSecondary = Color(0xFF9CA3AF);
  static const Color darkDivider = Color(0xFF262626);

  // Context-aware theme resolution helpers
  static bool isDark(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark;

  static Color resolveBackground(BuildContext context) =>
      isDark(context) ? darkBackground : background;

  static Color resolveSurface(BuildContext context) =>
      isDark(context) ? darkSurface : surface;

  static Color resolveText(BuildContext context) =>
      isDark(context) ? darkTextPrimary : textDark;

  static Color resolveTextMuted(BuildContext context) =>
      isDark(context) ? darkTextSecondary : textLight;

  static Color resolveBorder(BuildContext context) =>
      isDark(context) ? darkBorder : border;
}
