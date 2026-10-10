import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/theme/app_radius.dart';
import 'package:single_restaurant_mobile/theme/app_spacing.dart';

enum AppButtonVariant {
  primary, // Yellow #FDB714 with black text
  secondary, // Dark Maroon #430805 with white text
  accent, // Burgundy #7A0B10 with white text
  outlined, // Transparent with border
  ghost, // Text button with subtle ripple
  destructive, // Error Red #DC2626
}

enum AppButtonSize {
  small, // 36dp height
  medium, // 46dp height
  large, // 54dp height
}

/// Standardized high-performance button widget with variants, sizes,
/// loading spinner, tap ripple feedback, and full-width toggle.
class AppButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final AppButtonSize size;
  final Widget? icon;
  final bool isLoading;
  final bool isFullWidth;
  final BorderRadius? borderRadius;

  const AppButton({
    super.key,
    required this.text,
    this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.large,
    this.icon,
    this.isLoading = false,
    this.isFullWidth = true,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveRadius = borderRadius ?? AppRadius.borderMd;
    final isEnabled = onPressed != null && !isLoading;

    Color backgroundColor;
    Color foregroundColor;
    BorderSide borderSide = BorderSide.none;

    switch (variant) {
      case AppButtonVariant.primary:
        backgroundColor = isEnabled ? AppColors.primary : Colors.grey.shade300;
        foregroundColor = isEnabled ? Colors.black : Colors.grey.shade600;
        break;
      case AppButtonVariant.secondary:
        backgroundColor = isEnabled ? AppColors.secondary : Colors.grey.shade300;
        foregroundColor = isEnabled ? Colors.white : Colors.grey.shade600;
        break;
      case AppButtonVariant.accent:
        backgroundColor = isEnabled ? AppColors.accent : Colors.grey.shade300;
        foregroundColor = isEnabled ? Colors.white : Colors.grey.shade600;
        break;
      case AppButtonVariant.destructive:
        backgroundColor = isEnabled ? AppColors.error : Colors.grey.shade300;
        foregroundColor = isEnabled ? Colors.white : Colors.grey.shade600;
        break;
      case AppButtonVariant.outlined:
        backgroundColor = Colors.transparent;
        foregroundColor = isEnabled ? AppColors.textDark : Colors.grey.shade400;
        borderSide = BorderSide(
          color: isEnabled ? AppColors.border : Colors.grey.shade300,
          width: 1.5,
        );
        break;
      case AppButtonVariant.ghost:
        backgroundColor = Colors.transparent;
        foregroundColor = isEnabled ? AppColors.accent : Colors.grey.shade400;
        break;
    }

    double height;
    double fontSize;
    EdgeInsets padding;

    switch (size) {
      case AppButtonSize.small:
        height = 36.0;
        fontSize = 12.0;
        padding = const EdgeInsets.symmetric(horizontal: AppSpacing.md);
        break;
      case AppButtonSize.medium:
        height = 46.0;
        fontSize = 14.0;
        padding = const EdgeInsets.symmetric(horizontal: AppSpacing.lg);
        break;
      case AppButtonSize.large:
        height = 54.0;
        fontSize = 15.0;
        padding = const EdgeInsets.symmetric(horizontal: AppSpacing.xl);
        break;
    }

    Widget content = Row(
      mainAxisSize: isFullWidth ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (isLoading)
          SizedBox(
            width: fontSize + 4,
            height: fontSize + 4,
            child: CircularProgressIndicator(
              strokeWidth: 2.2,
              valueColor: AlwaysStoppedAnimation<Color>(foregroundColor),
            ),
          )
        else ...[
          if (icon != null) ...[
            icon!,
            const SizedBox(width: AppSpacing.sm),
          ],
          Flexible(
            child: Text(
              text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: fontSize,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.3,
                color: foregroundColor,
              ),
            ),
          ),
        ],
      ],
    );

    return SizedBox(
      width: isFullWidth ? double.infinity : null,
      height: height,
      child: Material(
        color: backgroundColor,
        shape: RoundedRectangleBorder(
          borderRadius: effectiveRadius,
          side: borderSide,
        ),
        child: InkWell(
          onTap: isEnabled ? onPressed : null,
          borderRadius: effectiveRadius,
          child: Padding(
            padding: padding,
            child: Center(child: content),
          ),
        ),
      ),
    );
  }
}
