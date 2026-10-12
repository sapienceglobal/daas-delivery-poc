import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/theme/app_responsive.dart';

/// Centers child and constrains its maximum width on tablets, foldables,
/// and wide viewports. Keeps phone layouts edge-to-edge while preventing
/// excessive stretched forms and dialogs on wider devices.
class ResponsiveCenter extends StatelessWidget {
  final Widget child;
  final double maxWidth;
  final EdgeInsetsGeometry? padding;
  final double? heightFactor;
  final AlignmentGeometry alignment;

  const ResponsiveCenter({
    super.key,
    required this.child,
    this.maxWidth = AppResponsive.maxContentWidth,
    this.padding,
    this.heightFactor,
    this.alignment = Alignment.center,
  });

  @override
  Widget build(BuildContext context) {
    Widget content = child;

    if (padding != null) {
      content = Padding(padding: padding!, child: content);
    }

    return Align(
      alignment: alignment,
      heightFactor: heightFactor,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: content,
      ),
    );
  }
}
