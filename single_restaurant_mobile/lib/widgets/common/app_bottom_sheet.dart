import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/theme/app_radius.dart';
import 'package:single_restaurant_mobile/theme/app_responsive.dart';
import 'package:single_restaurant_mobile/theme/app_spacing.dart';

/// Standard modal bottom sheet framework for Lassi Lounge.
/// Enforces top drag handle, 90% max height, keyboard insets handling,
/// sticky bottom CTA dock, and tablet centering.
class AppBottomSheet extends StatelessWidget {
  final String? title;
  final String? subtitle;
  final Widget? trailing;
  final Widget child;
  final Widget? stickyFooter;
  final bool showCloseButton;
  final EdgeInsetsGeometry padding;
  final bool isDismissible;

  const AppBottomSheet({
    super.key,
    this.title,
    this.subtitle,
    this.trailing,
    required this.child,
    this.stickyFooter,
    this.showCloseButton = true,
    this.padding = const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
    this.isDismissible = true,
  });

  /// Standard entry point for displaying bottom sheets consistently.
  static Future<T?> show<T>({
    required BuildContext context,
    required Widget Function(BuildContext) builder,
    bool isDismissible = true,
    bool enableDrag = true,
    bool useSafeArea = false,
  }) {
    return showModalBottomSheet<T>(
      context: context,
      isScrollControlled: true,
      useSafeArea: useSafeArea,
      isDismissible: isDismissible,
      enableDrag: enableDrag,
      backgroundColor: Colors.transparent,
      elevation: 0,
      builder: (ctx) => builder(ctx),
    );
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final maxHeight = mediaQuery.size.height * 0.90;
    final keyboardInset = mediaQuery.viewInsets.bottom;

    return Align(
      alignment: Alignment.bottomCenter,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: AppResponsive.maxModalWidth),
        child: Container(
          constraints: BoxConstraints(maxHeight: maxHeight),
          margin: EdgeInsets.only(bottom: keyboardInset),
          decoration: BoxDecoration(
            color: AppColors.resolveSurface(context),
            borderRadius: AppRadius.topXxl,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.12),
                blurRadius: 20,
                offset: const Offset(0, -4),
              ),
            ],
          ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Drag Handle
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 44,
                height: 4.5,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2.5),
                ),
              ),
            ),

            // Optional Header Row
            if (title != null || showCloseButton || trailing != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 4, AppSpacing.sm, 8),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (title != null)
                            Text(
                              title!,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: AppColors.textDark,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          if (subtitle != null) ...[
                            const SizedBox(height: 2),
                            Text(
                              subtitle!,
                              style: const TextStyle(
                                fontSize: 12.5,
                                color: AppColors.textLight,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    ?trailing,
                    if (showCloseButton)
                      IconButton(
                        icon: const Icon(Icons.close, size: 20, color: AppColors.textDark),
                        onPressed: () => Navigator.pop(context),
                        splashRadius: 20,
                      ),
                  ],
                ),
              ),

            if (title != null)
              const Divider(height: 1, color: AppColors.borderSubtle),

            // Main Scrollable Content
            Flexible(
              child: Padding(
                padding: padding,
                child: child,
              ),
            ),

            // Sticky Bottom CTA Dock
            if (stickyFooter != null)
              Container(
                padding: EdgeInsets.only(
                  left: AppSpacing.lg,
                  right: AppSpacing.lg,
                  top: AppSpacing.md,
                  bottom: AppResponsive.safeBottomPadding(
                    context,
                    base: AppSpacing.md,
                    alreadyInsideSafeArea: keyboardInset > 0,
                  ),
                ),
                decoration: BoxDecoration(
                  color: AppColors.resolveSurface(context),
                  border: const Border(top: BorderSide(color: AppColors.borderSubtle, width: 1)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 8,
                      offset: const Offset(0, -2),
                    ),
                  ],
                ),
                child: stickyFooter!,
              )
            else if (keyboardInset == 0 && mediaQuery.padding.bottom > 0)
              SizedBox(height: mediaQuery.padding.bottom),
          ],
        ),
      ),
    ),
  );
}
}
