import 'package:flutter/material.dart';

/// Background decorator providing warm ivory backdrop and Indian monuments footer.
class LoginBackground extends StatelessWidget {
  final Widget child;

  const LoginBackground({
    super.key,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFFAF7F0),
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Bottom Indian Monuments Skyline & Ribbon Footer
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: IgnorePointer(
              child: Image.asset(
                'assets/images/branded/lassi-lounge/login_monuments_footer.png',
                width: double.infinity,
                fit: BoxFit.fitWidth,
                alignment: Alignment.bottomCenter,
              ),
            ),
          ),
          // Foreground Content
          child,
        ],
      ),
    );
  }
}
