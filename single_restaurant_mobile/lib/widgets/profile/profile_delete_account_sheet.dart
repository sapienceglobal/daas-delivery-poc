import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/address_provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/checkout_provider.dart';
import 'package:single_restaurant_mobile/providers/loyalty_provider.dart';
import 'package:single_restaurant_mobile/providers/notification_provider.dart';
import 'package:single_restaurant_mobile/providers/order_provider.dart';
import 'package:single_restaurant_mobile/screens/login_screen.dart';
import 'package:single_restaurant_mobile/theme/app_radius.dart';
import 'package:single_restaurant_mobile/theme/app_spacing.dart';
import 'package:single_restaurant_mobile/widgets/common/app_bottom_sheet.dart';
import 'package:single_restaurant_mobile/widgets/common/app_button.dart';

class ProfileDeleteAccountSheet {
  static void show(BuildContext context, AuthProvider authProvider) {
    final user = authProvider.user;
    final userEmail = user?.email ?? '';
    final initialMode = user?.deletionVerificationMode ?? 'password';

    final passwordController = TextEditingController();
    final otpController = TextEditingController();

    String selectedReason = 'I no longer need this service';
    final List<String> reasons = [
      'I no longer need this service',
      'Privacy and data concerns',
      'Too many notifications or emails',
      'Created a duplicate account',
      'Other reason',
    ];

    AppBottomSheet.show(
      context: context,
      isDismissible: true,
      builder: (bottomSheetContext) {
        bool isDeleting = false;
        bool isObscured = true;
        bool isSendingOtp = false;
        bool otpSent = false;
        int resendSeconds = 0;
        Timer? timer;
        String? errorMessage;
        String? successMessage;
        String activeMode = (initialMode == 'otp') ? 'otp' : 'password';

        return StatefulBuilder(
          builder: (context, setModalState) {
            void startTimer() {
              resendSeconds = 60;
              timer?.cancel();
              timer = Timer.periodic(const Duration(seconds: 1), (t) {
                if (resendSeconds > 0) {
                  setModalState(() => resendSeconds--);
                } else {
                  t.cancel();
                }
              });
            }

            Future<void> sendOtp() async {
              setModalState(() {
                isSendingOtp = true;
                errorMessage = null;
                successMessage = null;
              });

              final err = await authProvider.sendDeleteAccountOtp();
              setModalState(() {
                isSendingOtp = false;
                if (err == null) {
                  otpSent = true;
                  successMessage = 'A 6-digit code has been sent to $userEmail';
                  startTimer();
                } else {
                  errorMessage = err;
                }
              });
            }

            return AppBottomSheet(
              title: 'Delete Account',
              subtitle: 'Permanent & Irreversible Action',
              showCloseButton: !isDeleting,
              stickyFooter: Row(
                children: [
                  Expanded(
                    child: AppButton(
                      text: 'Cancel',
                      variant: AppButtonVariant.outlined,
                      onPressed: isDeleting ? null : () {
                        timer?.cancel();
                        Navigator.pop(bottomSheetContext);
                      },
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    flex: 2,
                    child: AppButton(
                      text: 'Delete Permanently',
                      variant: AppButtonVariant.destructive,
                      isLoading: isDeleting,
                      onPressed: isDeleting
                          ? null
                          : () async {
                              final password = passwordController.text.trim();
                              final otp = otpController.text.trim();

                              if (activeMode == 'password' && password.isEmpty) {
                                setModalState(() => errorMessage = 'Please enter your password to proceed.');
                                return;
                              }

                              if (activeMode == 'otp' && (!otpSent || otp.isEmpty)) {
                                setModalState(() => errorMessage = otpSent
                                    ? 'Please enter the 6-digit code sent to your email.'
                                    : 'Please click "Send Verification Code" first.');
                                return;
                              }

                              setModalState(() {
                                isDeleting = true;
                                errorMessage = null;
                              });

                              final error = await authProvider.deleteAccount(
                                password: activeMode == 'password' ? password : null,
                                otp: activeMode == 'otp' ? otp : null,
                                reason: selectedReason,
                              );

                              if (error == null) {
                                timer?.cancel();
                                if (!context.mounted) return;
                                Provider.of<CartProvider>(context, listen: false).clearCart();
                                Provider.of<AddressProvider>(context, listen: false).clear();
                                Provider.of<OrderProvider>(context, listen: false).clear();
                                Provider.of<LoyaltyProvider>(context, listen: false).clear();
                                Provider.of<CheckoutProvider>(context, listen: false).reset();
                                Provider.of<NotificationProvider>(context, listen: false).clear();

                                Navigator.of(bottomSheetContext).pop();

                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: const Row(
                                      children: [
                                        Icon(Icons.check_circle_outline, color: Colors.white, size: 20),
                                        SizedBox(width: 12),
                                        Expanded(
                                          child: Text(
                                            'Your account and data have been permanently deleted.',
                                            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                                          ),
                                        ),
                                      ],
                                    ),
                                    backgroundColor: const Color(0xFF1F2937),
                                    behavior: SnackBarBehavior.floating,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    margin: const EdgeInsets.all(16),
                                    duration: const Duration(seconds: 4),
                                  ),
                                );

                                Navigator.of(context).pushAndRemoveUntil(
                                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                                  (route) => false,
                                );
                              } else {
                                setModalState(() {
                                  isDeleting = false;
                                  errorMessage = error;
                                });
                              }
                            },
                    ),
                  ),
                ],
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF2F2),
                        borderRadius: AppRadius.borderMd,
                        border: Border.all(color: const Color(0xFFFECACA)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'What will be deleted:',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF991B1B)),
                          ),
                          const SizedBox(height: 8),
                          _buildWarningPoint(Icons.stars_rounded, 'All accumulated Loyalty Points and rewards will be forfeited.'),
                          _buildWarningPoint(Icons.receipt_long_outlined, 'Your past order history, tracking & receipts will be erased.'),
                          _buildWarningPoint(Icons.location_on_outlined, 'All saved delivery addresses and preferences will be purged.'),
                          _buildWarningPoint(Icons.person_off_outlined, 'Personal profile information will be permanently removed.'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),
                    const Text(
                      'Reason for deleting (Optional):',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF4B5563)),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF9FAFB),
                        borderRadius: AppRadius.borderSm,
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: selectedReason,
                          isExpanded: true,
                          icon: const Icon(Icons.keyboard_arrow_down, color: Colors.grey),
                          items: reasons.map((r) => DropdownMenuItem(value: r, child: Text(r, style: const TextStyle(fontSize: 13, color: Colors.black87)))).toList(),
                          onChanged: isDeleting ? null : (val) => val != null ? setModalState(() => selectedReason = val) : null,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // ── Mode: Password ────────────────────────────
                    if (activeMode == 'password') ...[
                      const Text(
                        'Confirm your account password:',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1F2937)),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'For security, please verify your password before deleting your account.',
                        style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: passwordController,
                        obscureText: isObscured,
                        enabled: !isDeleting,
                        decoration: _inputDeco(
                          hintText: 'Enter your account password',
                          prefixIcon: Icons.lock_outline,
                          suffixIcon: IconButton(
                            icon: Icon(isObscured ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 20, color: Colors.grey),
                            onPressed: () => setModalState(() => isObscured = !isObscured),
                          ),
                        ),
                      ),
                      if (initialMode == 'password_or_otp') ...[
                        const SizedBox(height: 8),
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: isDeleting
                                ? null
                                : () {
                                    setModalState(() {
                                      activeMode = 'otp';
                                      errorMessage = null;
                                    });
                                  },
                            style: TextButton.styleFrom(padding: EdgeInsets.zero, visualDensity: VisualDensity.compact),
                            child: const Text(
                              'Forgot password? Verify with Email Code',
                              style: TextStyle(fontSize: 12, color: Color(0xFF7A0B10), fontWeight: FontWeight.w600),
                            ),
                          ),
                        ),
                      ],
                    ]
                    // ── Mode: Email OTP (for Google/Apple accounts) ─
                    else ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Email Verification Code:',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1F2937)),
                          ),
                          if (initialMode == 'password_or_otp')
                            TextButton(
                              onPressed: isDeleting
                                  ? null
                                  : () {
                                      setModalState(() {
                                        activeMode = 'password';
                                        errorMessage = null;
                                      });
                                    },
                              style: TextButton.styleFrom(padding: EdgeInsets.zero, visualDensity: VisualDensity.compact),
                              child: const Text(
                                'Use Password instead',
                                style: TextStyle(fontSize: 12, color: Color(0xFF7A0B10), fontWeight: FontWeight.w600),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'A 6-digit verification code will be sent to your registered email ($userEmail) to confirm your identity.',
                        style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                      ),
                      const SizedBox(height: 10),
                      if (!otpSent) ...[
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: isSendingOtp || isDeleting ? null : sendOtp,
                            icon: isSendingOtp
                                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                : const Icon(Icons.mark_email_read_outlined, size: 18),
                            label: Text(isSendingOtp ? 'Sending code...' : 'Send Verification Code to Email'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF7A0B10),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                      ] else ...[
                        TextField(
                          controller: otpController,
                          keyboardType: TextInputType.number,
                          maxLength: 6,
                          enabled: !isDeleting,
                          decoration: _inputDeco(
                            hintText: 'Enter 6-digit verification code',
                            prefixIcon: Icons.security,
                            suffixIcon: resendSeconds > 0
                                ? Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                                    child: Text(
                                      '${resendSeconds}s',
                                      style: TextStyle(fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.bold),
                                    ),
                                  )
                                : TextButton(
                                    onPressed: isSendingOtp || isDeleting ? null : sendOtp,
                                    child: const Text('Resend', style: TextStyle(fontSize: 12, color: Color(0xFF7A0B10), fontWeight: FontWeight.bold)),
                                  ),
                          ),
                        ),
                      ],
                    ],

                    if (successMessage != null) ...[
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FDF4),
                          borderRadius: AppRadius.borderSm,
                          border: Border.all(color: const Color(0xFF86EFAC)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.check_circle_outline, color: Color(0xFF16A34A), size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                successMessage!,
                                style: const TextStyle(fontSize: 12, color: Color(0xFF16A34A), fontWeight: FontWeight.w500),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    if (errorMessage != null) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF2F2),
                          borderRadius: AppRadius.borderSm,
                          border: Border.all(color: const Color(0xFFFCA5A5)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline, color: Color(0xFFDC2626), size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                errorMessage!,
                                style: const TextStyle(fontSize: 12, color: Color(0xFFDC2626), fontWeight: FontWeight.w500),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  static InputDecoration _inputDeco({
    required String hintText,
    required IconData prefixIcon,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      hintText: hintText,
      hintStyle: TextStyle(fontSize: 13, color: Colors.grey.shade400),
      prefixIcon: Icon(prefixIcon, size: 20, color: Colors.grey),
      suffixIcon: suffixIcon,
      counterText: '',
      filled: true,
      fillColor: const Color(0xFFF9FAFB),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(borderRadius: AppRadius.borderSm, borderSide: BorderSide(color: Colors.grey.shade300)),
      enabledBorder: OutlineInputBorder(borderRadius: AppRadius.borderSm, borderSide: BorderSide(color: Colors.grey.shade300)),
      focusedBorder: const OutlineInputBorder(borderRadius: AppRadius.borderSm, borderSide: BorderSide(color: Color(0xFFDC2626), width: 1.5)),
    );
  }

  static Widget _buildWarningPoint(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: const Color(0xFFDC2626)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(text, style: const TextStyle(fontSize: 12, color: Color(0xFF7F1D1D), height: 1.3)),
          ),
        ],
      ),
    );
  }
}
