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

  const ResponsiveCenter({
    super.key,
    required this.child,
    this.maxWidth = AppResponsive.maxContentWidth,
    this.padding,
    this.heightFactor,
  });

  @override
  Widget build(BuildContext context) {
    Widget content = child;

    if (padding != null) {
      content = Padding(padding: padding!, child: content);
    }

    return Center(
      heightFactor: heightFactor,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: content,
      ),
    );
  }
}
