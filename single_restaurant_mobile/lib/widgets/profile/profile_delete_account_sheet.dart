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
    final isSocialUser = authProvider.user?.isSocialLogin ?? false;
    final passwordController = TextEditingController();
    final confirmationController = TextEditingController();

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
        String? errorMessage;

        return StatefulBuilder(
          builder: (context, setModalState) {
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
                      onPressed: isDeleting ? null : () => Navigator.pop(bottomSheetContext),
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
                              final confirmation = confirmationController.text.trim();

                              if (!isSocialUser && password.isEmpty) {
                                setModalState(() => errorMessage = 'Please enter your password to proceed.');
                                return;
                              }
                              if (isSocialUser && confirmation != 'DELETE') {
                                setModalState(() => errorMessage = 'Please type DELETE in capital letters to confirm.');
                                return;
                              }

                              setModalState(() {
                                isDeleting = true;
                                errorMessage = null;
                              });

                              final error = await authProvider.deleteAccount(
                                password: !isSocialUser ? password : null,
                                confirmation: isSocialUser ? confirmation : null,
                                reason: selectedReason,
                              );

                              if (error == null) {
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
                    if (!isSocialUser) ...[
                      const Text(
                        'Confirm your password:',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1F2937)),
                      ),
                      const SizedBox(height: 6),
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
                    ] else ...[
                      const Text(
                        'Type DELETE to confirm:',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1F2937)),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: confirmationController,
                        enabled: !isDeleting,
                        decoration: _inputDeco(
                          hintText: 'Type DELETE in capital letters',
                          prefixIcon: Icons.security,
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
