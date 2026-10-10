import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/widgets/auth/auth_error_box.dart';
import 'package:single_restaurant_mobile/widgets/auth/otp_info_cards.dart';

/// Pure presentational content for the OTP verification form.
class OtpFormContent extends StatelessWidget {
  final String email;
  final VoidCallback onChangeEmail;
  final String? errorMessage;
  final List<TextEditingController> controllers;
  final List<FocusNode> focusNodes;
  final void Function(int, String) onDigitChanged;
  final int resendSecondsLeft;
  final bool isResending;
  final VoidCallback onResend;
  final bool isLoading;
  final VoidCallback onVerify;

  const OtpFormContent({
    super.key,
    required this.email,
    required this.onChangeEmail,
    required this.errorMessage,
    required this.controllers,
    required this.focusNodes,
    required this.onDigitChanged,
    required this.resendSecondsLeft,
    required this.isResending,
    required this.onResend,
    required this.isLoading,
    required this.onVerify,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const Text(
          'Verify Your Email Address',
          style: TextStyle(
            color: AppColors.secondary,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'We\'ve sent a 6-digit verification code to',
          style: TextStyle(color: Colors.grey, fontSize: 14),
        ),
        const SizedBox(height: 4),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Flexible(
              child: Text(
                email,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: onChangeEmail,
              child: const Text(
                'Change',
                style: TextStyle(
                  color: AppColors.secondary,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        const Text(
          'Please check your inbox (and spam folder) for the code.',
          style: TextStyle(color: Colors.grey, fontSize: 13),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 24),

        if (errorMessage != null) ...[
          AuthErrorBox(errorMessage: errorMessage!),
          const SizedBox(height: 16),
        ],

        // Responsive 6-digit OTP Row (Rule 5: fits even on 320dp width)
        LayoutBuilder(
          builder: (context, constraints) {
            final gap = constraints.maxWidth < 340 ? 5.0 : 8.0;
            final boxWidth = ((constraints.maxWidth - (5 * gap)) / 6).clamp(34.0, 48.0);

            return Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: List.generate(
                6,
                (index) => SizedBox(
                  width: boxWidth,
                  height: 55,
                  child: TextFormField(
                    controller: controllers[index],
                    focusNode: focusNodes[index],
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    style: TextStyle(
                      fontSize: boxWidth < 40 ? 20 : 24,
                      fontWeight: FontWeight.bold,
                    ),
                    decoration: InputDecoration(
                      counterText: '',
                      contentPadding: EdgeInsets.zero,
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(
                          color: errorMessage != null
                              ? Colors.red.shade300
                              : Colors.grey.shade300,
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: AppColors.secondary),
                      ),
                    ),
                    onChanged: (value) => onDigitChanged(index, value),
                  ),
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 24),

        const FittedBox(
          fit: BoxFit.scaleDown,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.verified_user_outlined, color: Colors.green, size: 14),
              SizedBox(width: 6),
              Text(
                'This code will expire in 10 minutes.',
                style: TextStyle(color: Colors.grey, fontSize: 11),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        Wrap(
          alignment: WrapAlignment.center,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            const Text(
              'Didn\'t receive the code? ',
              style: TextStyle(color: Colors.grey, fontSize: 14),
            ),
            if (resendSecondsLeft == 0)
              GestureDetector(
                onTap: isResending ? null : onResend,
                child: isResending
                    ? const SizedBox(
                        height: 14,
                        width: 14,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppColors.secondary,
                        ),
                      )
                    : const Text(
                        'Resend OTP',
                        style: TextStyle(
                          color: AppColors.secondary,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
              )
            else
              Text(
                'Resend in 00:${resendSecondsLeft.toString().padLeft(2, '0')}',
                style: const TextStyle(
                  color: Colors.grey,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
          ],
        ),
        const SizedBox(height: 24),

        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: isLoading ? null : onVerify,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.secondary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                  )
                : const FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Verify & Continue',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        SizedBox(width: 8),
                        Icon(Icons.arrow_forward, color: Colors.white, size: 20),
                      ],
                    ),
                  ),
          ),
        ),
        const SizedBox(height: 24),

        const OtpInfoCards(),
        const SizedBox(height: 24),
      ],
    );
  }
}
