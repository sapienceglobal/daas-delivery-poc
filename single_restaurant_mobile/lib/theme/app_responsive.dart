import 'package:flutter/material.dart';

/// Centralized responsive layout helper and breakpoint engine.
/// Provides device categorization, tablet max-width boundaries,
/// safe area padding resolution (preventing double bottom padding),
/// and responsive grid calculations.
class AppResponsive {
  // Standard Device Breakpoints
  static const double compactBreakpoint = 360.0; // Small phones (iPhone SE, small Androids)
  static const double mediumBreakpoint = 600.0;  // Standard phones (iPhone 14/15, Galaxy S series)
  static const double expandedBreakpoint = 900.0; // Tablets, iPads, and foldables unfolded

  // Maximum content boundary for tablets to prevent excessive horizontal stretching
  static const double maxContentWidth = 640.0;
  static const double maxModalWidth = 540.0;
  static const double maxFormWidth = 500.0;
  static const double maxDialogWidth = 400.0;

  // Text scaling boundaries (Rule 3)
  static const double minTextScale = 0.85;
  static const double maxTextScale = 1.20;

  /// Check if the screen is compact (< 360dp width)
  static bool isCompact(BuildContext context) =>
      MediaQuery.of(context).size.width < compactBreakpoint;

  /// Check if the screen is medium phone size (360dp - 600dp)
  static bool isMedium(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    return width >= compactBreakpoint && width < mediumBreakpoint;
  }

  /// Check if the screen is expanded or tablet (> 600dp width)
  static bool isTablet(BuildContext context) =>
      MediaQuery.of(context).size.width >= mediumBreakpoint;

  /// Clamps textScaler to an ergonomically safe range (0.85 to 1.20)
  /// preventing high system zoom from breaking UI layouts while maintaining readability.
  static TextScaler clampTextScaler(TextScaler scaler) {
    return scaler.clamp(
      minScaleFactor: minTextScale,
      maxScaleFactor: maxTextScale,
    );
  }

  /// Resolves bottom padding for sticky footers and bottom sheets (Rule 6).
  /// Prevents the common bug where [MediaQuery.padding.bottom] is added
  /// inside a widget that is already wrapped by [SafeArea].
  static double safeBottomPadding(
    BuildContext context, {
    double base = 16.0,
    bool alreadyInsideSafeArea = false,
  }) {
    if (alreadyInsideSafeArea) {
      return base;
    }
    final systemBottomInset = MediaQuery.of(context).padding.bottom;
    return base + systemBottomInset;
  }

  /// Calculates responsive grid columns for product and menu grids.
  static int gridColumns(
    BuildContext context, {
    int compact = 2,
    int medium = 2,
    int tablet = 3,
    int desktop = 4,
  }) {
    final width = MediaQuery.of(context).size.width;
    if (width < compactBreakpoint) return compact;
    if (width < mediumBreakpoint) return medium;
    if (width < expandedBreakpoint) return tablet;
    return desktop;
  }

  /// Returns responsive horizontal page margin.
  static double horizontalMargin(BuildContext context) {
    if (isCompact(context)) return 12.0;
    if (isTablet(context)) return 24.0;
    return 16.0;
  }
}
