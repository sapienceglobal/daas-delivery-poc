import 'package:flutter/material.dart';

/// Highly polished interactive action button used on the Welcome screen.
/// Supports custom icons, theme colors, borders, loading state, and auto-scaling.
class WelcomeActionButton extends StatelessWidget {
  final String title;
  final Widget icon;
  final Color backgroundColor;
  final Color textColor;
  final Color arrowColor;
  final Color? borderColor;
  final VoidCallback? onTap;
  final bool isLoading;
  final bool isUppercase;
  final double height;

  const WelcomeActionButton({
    super.key,
    required this.title,
    required this.icon,
    required this.backgroundColor,
    required this.textColor,
    required this.arrowColor,
    this.borderColor,
    this.onTap,
    this.isLoading = false,
    this.isUppercase = false,
    this.height = 54.0,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: height,
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(14.0),
        border: borderColor != null
            ? Border.all(color: borderColor!, width: 1.6)
            : null,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isLoading ? null : onTap,
          borderRadius: BorderRadius.circular(14.0),
          splashColor: textColor.withValues(alpha: 0.12),
          highlightColor: textColor.withValues(alpha: 0.06),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: isLoading
                ? Center(
                    child: SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        valueColor: AlwaysStoppedAnimation<Color>(textColor),
                      ),
                    ),
                  )
                : Row(
                    children: [
                      // Leading Custom Icon
                      SizedBox(
                        width: 36,
                        height: 36,
                        child: Center(child: icon),
                      ),
                      const SizedBox(width: 8),

                      // Center Title Text with safe scaling
                      Expanded(
                        child: Center(
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(
                              isUppercase ? title.toUpperCase() : title,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: textColor,
                                fontSize: 16.0,
                                fontWeight: FontWeight.w700,
                                letterSpacing: isUppercase ? 0.6 : 0.2,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),

                      // Trailing Arrow Icon
                      SizedBox(
                        width: 28,
                        child: Icon(
                          Icons.arrow_forward,
                          size: 20,
                          color: arrowColor,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}
