import 'package:flutter/material.dart';

/// Segmented tab switcher with smooth animated sliding indicator between Sign In and Register.
class LoginTabSwitcher extends StatelessWidget {
  final bool isSignIn;
  final VoidCallback onSignIn;
  final VoidCallback onRegister;

  const LoginTabSwitcher({
    super.key,
    this.isSignIn = true,
    required this.onSignIn,
    required this.onRegister,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFF7EFEF),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Stack(
        children: [
          // Smooth sliding maroon pill indicator
          AnimatedAlign(
            duration: const Duration(milliseconds: 280),
            curve: Curves.easeInOutCubic,
            alignment: isSignIn ? Alignment.centerLeft : Alignment.centerRight,
            child: FractionallySizedBox(
              widthFactor: 0.5,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 7),
                decoration: BoxDecoration(
                  color: const Color(0xFF800A12),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF800A12).withValues(alpha: 0.25),
                      blurRadius: 4,
                      offset: const Offset(0, 1.5),
                    ),
                  ],
                ),
                child: const Text(
                  ' ',
                  style: TextStyle(fontSize: 14),
                ),
              ),
            ),
          ),
          Row(
            children: [
              Expanded(
                child: InkWell(
                  onTap: onSignIn,
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 7),
                    alignment: Alignment.center,
                    child: AnimatedDefaultTextStyle(
                      duration: const Duration(milliseconds: 200),
                      style: TextStyle(
                        color: isSignIn ? Colors.white : const Color(0xFF6B7280),
                        fontWeight: isSignIn ? FontWeight.bold : FontWeight.w600,
                        fontSize: 14,
                      ),
                      child: const Text('Sign In'),
                    ),
                  ),
                ),
              ),
              Expanded(
                child: InkWell(
                  onTap: onRegister,
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 7),
                    alignment: Alignment.center,
                    child: AnimatedDefaultTextStyle(
                      duration: const Duration(milliseconds: 200),
                      style: TextStyle(
                        color: !isSignIn ? Colors.white : const Color(0xFF6B7280),
                        fontWeight: !isSignIn ? FontWeight.bold : FontWeight.w600,
                        fontSize: 14,
                      ),
                      child: const Text('Register'),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
