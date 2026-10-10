import 'package:flutter/material.dart';

/// Renders the subtle Indian heritage monuments silhouette watermark
/// (Taj Mahal, historic palace domes, birds, and mandala corners)
/// at the bottom of the welcome screen card.
class WelcomeMonumentsWatermark extends StatelessWidget {
  final double height;
  final double opacity;

  const WelcomeMonumentsWatermark({
    super.key,
    this.height = 110.0,
    this.opacity = 0.95,
  });

  @override
  Widget build(BuildContext context) {
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: IgnorePointer(
        child: Opacity(
          opacity: opacity,
          child: Image.asset(
            'assets/images/branded/lassi-lounge/welcome_monuments_watermark.png',
            height: height,
            fit: BoxFit.cover,
            alignment: Alignment.bottomCenter,
            errorBuilder: (context, error, stackTrace) => const SizedBox.shrink(),
          ),
        ),
      ),
    );
  }
}
