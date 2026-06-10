import 'package:flutter/material.dart';

class BrandColors {
  static const Color background = Color(0xFF0B0F19);
  static const Color card = Color(0xFF151D30);
  static const Color border = Color(0xFF233554);
  static const Color cyan = Color(0xFF14B8A6);
  static const Color blue = Color(0xFF3B82F6);
  static const Color green = Color(0xFF22C55E);
  static const Color red = Color(0xFFEF4444);
  
  static const Color textMain = Color(0xFFF1F5F9);
  static const Color textMuted = Color(0xFF94A3B8);
}

ThemeData buildBrandTheme() {
  return ThemeData.dark().copyWith(
    primaryColor: BrandColors.cyan,
    scaffoldBackgroundColor: BrandColors.background,
    cardColor: BrandColors.card,
    colorScheme: const ColorScheme.dark(
      primary: BrandColors.cyan,
      secondary: BrandColors.blue,
      surface: BrandColors.card,
      error: BrandColors.red,
      onPrimary: BrandColors.background,
      onSecondary: Colors.white,
      onSurface: BrandColors.textMain,
    ),
    dividerColor: BrandColors.border,
    textTheme: const TextTheme(
      bodyLarge: TextStyle(color: BrandColors.textMain, fontSize: 16),
      bodyMedium: TextStyle(color: BrandColors.textMuted, fontSize: 14),
      titleLarge: TextStyle(color: BrandColors.textMain, fontSize: 20, fontWeight: FontWeight.bold),
      titleMedium: TextStyle(color: BrandColors.textMain, fontSize: 16, fontWeight: FontWeight.w600),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: BrandColors.background.withOpacity(0.6),
      labelStyle: const TextStyle(color: BrandColors.textMuted, fontSize: 12),
      hintStyle: TextStyle(color: BrandColors.textMuted.withOpacity(0.5), fontSize: 12),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: BrandColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: BrandColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: BrandColors.cyan),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: BrandColors.red),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        foregroundColor: BrandColors.background,
        backgroundColor: BrandColors.cyan,
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        textStyle: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w900,
          letterSpacing: 1.2,
        ),
      ),
    ),
  );
}
