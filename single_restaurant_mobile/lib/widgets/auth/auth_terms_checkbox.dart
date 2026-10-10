import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';

/// Pure presentational checkbox for Terms & Privacy Policy in registration.
/// Ensures clean multi-line text wrapping on all compact devices.
class AuthTermsCheckbox extends StatelessWidget {
  final bool agreedToTerms;
  final bool termsError;
  final ValueChanged<bool?> onToggle;
  final GestureRecognizer? termsRecognizer;
  final GestureRecognizer? privacyRecognizer;

  const AuthTermsCheckbox({
    super.key,
    required this.agreedToTerms,
    required this.termsError,
    required this.onToggle,
    required this.termsRecognizer,
    required this.privacyRecognizer,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        InkWell(
          onTap: () => onToggle(!agreedToTerms),
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  height: 24,
                  width: 24,
                  child: Checkbox(
                    value: agreedToTerms,
                    activeColor: AppColors.secondary,
                    isError: termsError && !agreedToTerms,
                    onChanged: onToggle,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: RichText(
                    text: TextSpan(
                      style: const TextStyle(
                        color: Colors.black87,
                        fontSize: 12,
                        height: 1.4,
                      ),
                      children: [
                        const TextSpan(text: 'I agree to the '),
                        TextSpan(
                          text: 'Terms, Cancellation & Refund Policy',
                          recognizer: termsRecognizer,
                          style: const TextStyle(
                            color: AppColors.secondary,
                            fontWeight: FontWeight.bold,
                            decoration: TextDecoration.underline,
                          ),
                        ),
                        const TextSpan(text: ' and '),
                        TextSpan(
                          text: 'Privacy Policy',
                          recognizer: privacyRecognizer,
                          style: const TextStyle(
                            color: AppColors.secondary,
                            fontWeight: FontWeight.bold,
                            decoration: TextDecoration.underline,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        if (termsError && !agreedToTerms) ...[
          const SizedBox(height: 6),
          Padding(
            padding: const EdgeInsets.only(left: 34),
            child: Text(
              'You must agree to the Terms & Conditions and Privacy Policy to register.',
              style: TextStyle(
                color: Colors.red.shade700,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ],
    );
  }
}
