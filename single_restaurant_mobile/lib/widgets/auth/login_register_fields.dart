import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:single_restaurant_mobile/widgets/auth/auth_input_helper.dart';
import 'package:single_restaurant_mobile/widgets/auth/auth_terms_checkbox.dart';

/// Pure presentational input fields for embedded registration.
class LoginRegisterFields extends StatelessWidget {
  final TextEditingController nameController;
  final TextEditingController phoneController;
  final TextEditingController emailController;
  final TextEditingController passwordController;
  final TextEditingController confirmPasswordController;
  final bool isPasswordVisible;
  final bool isConfirmPasswordVisible;
  final VoidCallback onTogglePasswordVisibility;
  final VoidCallback onToggleConfirmPasswordVisibility;
  final String selectedCountryCode;
  final String selectedCountryFlag;
  final int phoneMaxLength;
  final VoidCallback onPickCountry;
  final bool agreedToTerms;
  final bool termsError;
  final ValueChanged<bool?> onToggleTerms;
  final GestureRecognizer? termsRecognizer;
  final GestureRecognizer? privacyRecognizer;

  const LoginRegisterFields({
    super.key,
    required this.nameController,
    required this.phoneController,
    required this.emailController,
    required this.passwordController,
    required this.confirmPasswordController,
    required this.isPasswordVisible,
    required this.isConfirmPasswordVisible,
    required this.onTogglePasswordVisibility,
    required this.onToggleConfirmPasswordVisibility,
    required this.selectedCountryCode,
    required this.selectedCountryFlag,
    required this.phoneMaxLength,
    required this.onPickCountry,
    required this.agreedToTerms,
    required this.termsError,
    required this.onToggleTerms,
    required this.termsRecognizer,
    required this.privacyRecognizer,
  });

  static final RegExp _passwordRegex = RegExp(
    r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$',
  );

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Full Name',
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: FontWeight.bold,
            color: Color(0xFF111827),
          ),
        ),
        const SizedBox(height: 4),
        TextFormField(
          controller: nameController,
          style: const TextStyle(fontSize: 13.5, color: Color(0xFF1F2937)),
          decoration: AuthInputHelper.inputDecoration(
            hint: 'Enter your full name',
            icon: Icons.person_outline,
          ),
          validator: (val) {
            if (val == null || val.trim().isEmpty) return 'Name is required';
            return null;
          },
        ),
        const SizedBox(height: 8),
        const Text(
          'Phone Number',
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: FontWeight.bold,
            color: Color(0xFF111827),
          ),
        ),
        const SizedBox(height: 4),
        TextFormField(
          controller: phoneController,
          keyboardType: TextInputType.phone,
          inputFormatters: [
            LengthLimitingTextInputFormatter(phoneMaxLength),
          ],
          style: const TextStyle(fontSize: 13.5, color: Color(0xFF1F2937)),
          decoration: InputDecoration(
            hintText: 'Enter your phone number',
            hintStyle: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 13.0),
            prefixIcon: InkWell(
              onTap: onPickCountry,
              borderRadius: const BorderRadius.horizontal(left: Radius.circular(12)),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                margin: const EdgeInsets.only(right: 8),
                decoration: const BoxDecoration(
                  border: Border(right: BorderSide(color: Color(0xFFE5E7EB), width: 1.2)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '$selectedCountryCode $selectedCountryFlag',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
                    ),
                    const SizedBox(width: 4),
                    const Icon(Icons.keyboard_arrow_down, size: 16, color: Color(0xFF6B7280)),
                  ],
                ),
              ),
            ),
            contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
            filled: true,
            fillColor: Colors.white,
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE5E7EB), width: 1.2),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF800A12), width: 1.2),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.red.shade300, width: 1.2),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.red.shade700, width: 1.2),
            ),
          ),
          validator: (val) {
            if (val == null || val.trim().isEmpty) return 'Phone is required';
            if (val.trim().length < 7) return 'Enter a valid phone number';
            return null;
          },
        ),
        const SizedBox(height: 8),
        const Text(
          'Email Address',
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: FontWeight.bold,
            color: Color(0xFF111827),
          ),
        ),
        const SizedBox(height: 4),
        TextFormField(
          controller: emailController,
          keyboardType: TextInputType.emailAddress,
          style: const TextStyle(fontSize: 13.5, color: Color(0xFF1F2937)),
          decoration: AuthInputHelper.inputDecoration(
            hint: 'Enter your email address',
            icon: Icons.mail_outline,
          ),
          validator: (val) {
            if (val == null || val.trim().isEmpty) return 'Email is required';
            final regex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
            if (!regex.hasMatch(val.trim())) return 'Enter a valid email';
            return null;
          },
        ),
        const SizedBox(height: 8),
        const Text(
          'Password',
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: FontWeight.bold,
            color: Color(0xFF111827),
          ),
        ),
        const SizedBox(height: 4),
        TextFormField(
          controller: passwordController,
          obscureText: !isPasswordVisible,
          style: const TextStyle(fontSize: 13.5, color: Color(0xFF1F2937)),
          decoration: AuthInputHelper.inputDecoration(
            hint: 'Create a password',
            icon: Icons.lock_outline,
            suffix: IconButton(
              icon: Icon(
                isPasswordVisible ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                color: const Color(0xFF6B7280),
                size: 19,
              ),
              onPressed: onTogglePasswordVisibility,
            ),
          ),
          validator: (val) {
            if (val == null || val.isEmpty) return 'Password is required';
            if (!_passwordRegex.hasMatch(val)) {
              return '8+ chars, upper, lower, number & special char';
            }
            return null;
          },
        ),
        const SizedBox(height: 8),
        const Text(
          'Confirm Password',
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: FontWeight.bold,
            color: Color(0xFF111827),
          ),
        ),
        const SizedBox(height: 4),
        TextFormField(
          controller: confirmPasswordController,
          obscureText: !isConfirmPasswordVisible,
          style: const TextStyle(fontSize: 13.5, color: Color(0xFF1F2937)),
          decoration: AuthInputHelper.inputDecoration(
            hint: 'Confirm your password',
            icon: Icons.lock_outline,
            suffix: IconButton(
              icon: Icon(
                isConfirmPasswordVisible
                    ? Icons.visibility_outlined
                    : Icons.visibility_off_outlined,
                color: const Color(0xFF6B7280),
                size: 19,
              ),
              onPressed: onToggleConfirmPasswordVisibility,
            ),
          ),
          validator: (val) {
            if (val != passwordController.text) return 'Passwords do not match';
            return null;
          },
        ),
        const SizedBox(height: 12),
        AuthTermsCheckbox(
          agreedToTerms: agreedToTerms,
          termsError: termsError,
          onToggle: onToggleTerms,
          termsRecognizer: termsRecognizer,
          privacyRecognizer: privacyRecognizer,
        ),
      ],
    );
  }
}
