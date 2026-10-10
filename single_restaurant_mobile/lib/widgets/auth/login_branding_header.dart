import 'package:flutter/material.dart';

/// Branding header specifically matching the authentic Lassi Lounge reference image.
class LoginBrandingHeader extends StatelessWidget {
  final bool isSignIn;

  const LoginBrandingHeader({
    super.key,
    this.isSignIn = true,
  });

  Widget _buildLogo(bool isCompact) {
    if (!isCompact) {
      return Image.asset(
        'assets/images/branded/lassi-lounge/Lassi-Lounge-logo.png',
        height: 120,
        fit: BoxFit.contain,
      );
    }

    final double targetHeight = isSignIn ? 64.0 : 50.0;
    return SizedBox(
      height: targetHeight,
      child: FittedBox(
        fit: BoxFit.contain,
        alignment: Alignment.center,
        child: ClipRect(
          child: SizedBox(
            width: 4400,
            height: 2250,
            child: OverflowBox(
              minWidth: 0,
              maxWidth: 4500,
              minHeight: 0,
              maxHeight: 4500,
              alignment: Alignment.center,
              child: Image.asset(
                'assets/images/branded/lassi-lounge/Lassi-Lounge-logo.png',
                width: 4500,
                height: 4500,
                fit: BoxFit.fill,
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isCompact = size.height < 720 || size.width < 380;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        _buildLogo(isCompact),
        const SizedBox(height: 1),
        AnimatedSize(
          duration: const Duration(milliseconds: 260),
          curve: Curves.easeInOutCubic,
          alignment: Alignment.topCenter,
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 220),
            child: KeyedSubtree(
              key: ValueKey<bool>(isSignIn),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text.rich(
                      TextSpan(
                        text: isSignIn ? 'Welcome ' : 'Create ',
                        style: TextStyle(
                          fontSize: isCompact ? (isSignIn ? 24 : 22) : 26,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF0F1A24),
                          letterSpacing: -0.5,
                        ),
                        children: [
                          TextSpan(
                            text: isSignIn ? 'Back!' : 'Account',
                            style: const TextStyle(
                              color: Color(0xFF8B151F),
                            ),
                          ),
                        ],
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  SizedBox(height: isCompact ? 2 : 3),
                  Text(
                    isSignIn
                        ? 'Sign in to your Lassi Lounge account\nand enjoy your favorite food.'
                        : 'Join Lassi Lounge and enjoy\ndelicious food & exclusive offers.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: const Color(0xFF6B7280),
                      fontSize: isCompact ? 11.0 : 12.0,
                      height: 1.25,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
