import 'package:flutter/material.dart';
import 'dart:math' as math;

class ThreeDotsLoading extends StatefulWidget {
  final Color color;
  final double size;

  const ThreeDotsLoading({
    super.key,
    this.color = Colors.white,
    this.size = 10.0,
  });

  @override
  State<ThreeDotsLoading> createState() => _ThreeDotsLoadingState();
}

class _ThreeDotsLoadingState extends State<ThreeDotsLoading> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (index) {
        return AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            final double offset = (index * 0.3);
            final double phase = (_controller.value * 2 * 3.14159) - offset;
            final double value = (1 - (0.5 * (1 + (phase.isNaN ? 0.0 : phase).sin()))).clamp(0.0, 1.0);
            
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 2.0),
              child: Transform.translate(
                offset: Offset(0, -value * 6),
                child: Opacity(
                  opacity: 0.5 + (value * 0.5),
                  child: Container(
                    width: widget.size,
                    height: widget.size,
                    decoration: BoxDecoration(
                      color: widget.color,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              ),
            );
          },
        );
      }),
    );
  }
}

extension on double {
  double sin() => math.sin(this);
}
