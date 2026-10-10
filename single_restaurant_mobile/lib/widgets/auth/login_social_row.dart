import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// Row containing Google, Apple, and Facebook social login tiles matching reference design.
class LoginSocialRow extends StatelessWidget {
  final VoidCallback onGoogleTap;
  final VoidCallback onAppleTap;
  final VoidCallback onFacebookTap;
  final bool isGoogleLoading;
  final bool isAppleLoading;

  final TargetPlatform? platformOverride;

  const LoginSocialRow({
    super.key,
    required this.onGoogleTap,
    required this.onAppleTap,
    required this.onFacebookTap,
    this.isGoogleLoading = false,
    this.isAppleLoading = false,
    this.platformOverride,
  });

  static const String _googleSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">'
      '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>'
      '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>'
      '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>'
      '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>'
      '</svg>';

  @override
  Widget build(BuildContext context) {
    final effectivePlatform = platformOverride ?? Theme.of(context).platform;
    final isApple = effectivePlatform == TargetPlatform.iOS ||
        effectivePlatform == TargetPlatform.macOS;

    return Row(
      children: [
        if (!isApple)
          Expanded(
            child: _SocialTile(
              icon: SvgPicture.string(_googleSvg, width: 20, height: 20),
              provider: 'Google',
              onTap: onGoogleTap,
              isLoading: isGoogleLoading,
            ),
          ),
        if (isApple)
          Expanded(
            child: _SocialTile(
              icon: const Icon(Icons.apple, color: Colors.black, size: 22),
              provider: 'Apple',
              onTap: onAppleTap,
              isLoading: isAppleLoading,
            ),
          ),
        const SizedBox(width: 10),
        Expanded(
          child: _SocialTile(
            icon: const Icon(Icons.facebook, color: Color(0xFF1877F2), size: 22),
            provider: 'Facebook',
            onTap: onFacebookTap,
            isLoading: false,
          ),
        ),
      ],
    );
  }
}

class _SocialTile extends StatelessWidget {
  final Widget icon;
  final String provider;
  final VoidCallback onTap;
  final bool isLoading;

  const _SocialTile({
    required this.icon,
    required this.provider,
    required this.onTap,
    required this.isLoading,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          onTap: isLoading ? null : onTap,
          borderRadius: BorderRadius.circular(10),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4.0, vertical: 8.0),
            child: isLoading
                ? const Center(
                    child: SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Color(0xFF800A12),
                      ),
                    ),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      icon,
                      const SizedBox(width: 4),
                      Flexible(
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'Continue\nwith $provider',
                            style: const TextStyle(
                              fontSize: 10,
                              height: 1.15,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF374151),
                            ),
                          ),
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
