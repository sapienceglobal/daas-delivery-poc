import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/theme/app_radius.dart';
import 'package:single_restaurant_mobile/theme/app_responsive.dart';
import 'package:single_restaurant_mobile/theme/app_spacing.dart';
import 'package:single_restaurant_mobile/widgets/common/app_button.dart';

/// Standard branded modal dialog for confirmations, alerts, and notices.
/// Automatically constrains maximum width on tablets, includes icon badge,
/// and supports primary/secondary/destructive actions.
class AppDialog extends StatelessWidget {
  final String title;
  final String? message;
  final Widget? content;
  final IconData? icon;
  final Color? iconColor;
  final String? primaryActionText;
  final VoidCallback? onPrimaryAction;
  final String? secondaryActionText;
  final VoidCallback? onSecondaryAction;
  final bool isDestructive;
  final bool isLoading;

  const AppDialog({
    super.key,
    required this.title,
    this.message,
    this.content,
    this.icon,
    this.iconColor,
    this.primaryActionText,
    this.onPrimaryAction,
    this.secondaryActionText,
    this.onSecondaryAction,
    this.isDestructive = false,
    this.isLoading = false,
  });

  /// Entry point to display an AppDialog cleanly anywhere in the app.
  static Future<T?> show<T>({
    required BuildContext context,
    required String title,
    String? message,
    Widget? content,
    IconData? icon,
    Color? iconColor,
    String? primaryActionText,
    VoidCallback? onPrimaryAction,
    String? secondaryActionText,
    VoidCallback? onSecondaryAction,
    bool isDestructive = false,
    bool barrierDismissible = true,
  }) {
    return showDialog<T>(
      context: context,
      barrierDismissible: barrierDismissible,
      builder: (ctx) => AppDialog(
        title: title,
        message: message,
        content: content,
        icon: icon,
        iconColor: iconColor,
        primaryActionText: primaryActionText,
        onPrimaryAction: onPrimaryAction,
        secondaryActionText: secondaryActionText,
        onSecondaryAction: onSecondaryAction,
        isDestructive: isDestructive,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final effectiveIconColor = iconColor ?? (isDestructive ? AppColors.error : AppColors.secondary);

    return Dialog(
      backgroundColor: Colors.transparent,
      elevation: 0,
      insetPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: AppResponsive.maxDialogWidth),
          child: Container(
            padding: const EdgeInsets.all(AppSpacing.xxl),
            decoration: BoxDecoration(
              color: AppColors.resolveSurface(context),
              borderRadius: AppRadius.borderXl,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.14),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Icon Badge
                if (icon != null) ...[
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: effectiveIconColor.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(icon, size: 26, color: effectiveIconColor),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                ],

                // Title
                Text(
                  title,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textDark,
                  ),
                ),

                // Message or Custom Content
                if (message != null) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    message!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w400,
                      color: AppColors.textLight,
                      height: 1.45,
                    ),
                  ),
                ],

                if (content != null) ...[
                  const SizedBox(height: AppSpacing.md),
                  content!,
                ],

                const SizedBox(height: AppSpacing.xxl),

                // Action Buttons
                Row(
                  children: [
                    if (secondaryActionText != null) ...[
                      Expanded(
                        child: AppButton(
                          text: secondaryActionText!,
                          variant: AppButtonVariant.outlined,
                          size: AppButtonSize.medium,
                          onPressed: onSecondaryAction ?? () => Navigator.pop(context),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.md),
                    ],
                    if (primaryActionText != null)
                      Expanded(
                        child: AppButton(
                          text: primaryActionText!,
                          variant: isDestructive ? AppButtonVariant.destructive : AppButtonVariant.primary,
                          size: AppButtonSize.medium,
                          isLoading: isLoading,
                          onPressed: onPrimaryAction,
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
