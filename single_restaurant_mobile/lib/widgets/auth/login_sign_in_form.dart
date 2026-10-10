import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/widgets/auth/auth_error_box.dart';
import 'package:single_restaurant_mobile/widgets/auth/auth_input_helper.dart';
import 'package:single_restaurant_mobile/widgets/auth/login_social_row.dart';

/// Pure presentational form containing Sign In fields for authentication card.
class LoginSignInForm extends StatelessWidget {
  final GlobalKey<FormState> formKey;
  final TextEditingController emailController;
  final TextEditingController passwordController;
  final bool isPasswordVisible;
  final VoidCallback onTogglePasswordVisibility;
  final bool rememberMe;
  final ValueChanged<bool?> onRememberMeChanged;
  final bool isLoading;
  final bool isGoogleLoading;
  final bool isAppleLoading;
  final String? errorMessage;
  final VoidCallback onLogin;
  final VoidCallback onGoogleSignIn;
  final VoidCallback onAppleSignIn;
  final VoidCallback onFacebookSignIn;
  final VoidCallback onForgotPassword;
  final VoidCallback onVerifyEmail;
  final ValueChanged<String> onFieldChanged;

  const LoginSignInForm({
    super.key,
    required this.formKey,
    required this.emailController,
    required this.passwordController,
    required this.isPasswordVisible,
    required this.onTogglePasswordVisibility,
    required this.rememberMe,
    required this.onRememberMeChanged,
    required this.isLoading,
    this.isGoogleLoading = false,
    this.isAppleLoading = false,
    required this.errorMessage,
    required this.onLogin,
    required this.onGoogleSignIn,
    required this.onAppleSignIn,
    required this.onFacebookSignIn,
    required this.onForgotPassword,
    required this.onVerifyEmail,
    required this.onFieldChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Form(
      key: formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (errorMessage != null) ...[
            AuthErrorBox(
              errorMessage: errorMessage!,
              onVerifyEmail: onVerifyEmail,
            ),
            const SizedBox(height: 10),
          ],
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
            onChanged: onFieldChanged,
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
          const SizedBox(height: 10),
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
            onChanged: onFieldChanged,
            style: const TextStyle(fontSize: 13.5, color: Color(0xFF1F2937)),
            decoration: AuthInputHelper.inputDecoration(
              hint: 'Enter your password',
              icon: Icons.lock_outline,
              suffix: IconButton(
                icon: Icon(
                  isPasswordVisible
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                  color: const Color(0xFF6B7280),
                  size: 19,
                ),
                onPressed: onTogglePasswordVisibility,
              ),
            ),
            validator: (val) {
              if (val == null || val.isEmpty) return 'Password is required';
              return null;
            },
          ),
          const SizedBox(height: 10),
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            runSpacing: 6,
            children: [
              GestureDetector(
                onTap: () => onRememberMeChanged(!rememberMe),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 17,
                      height: 17,
                      decoration: BoxDecoration(
                        color: rememberMe
                            ? const Color(0xFF800A12)
                            : Colors.white,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(
                          color: rememberMe
                              ? const Color(0xFF800A12)
                              : const Color(0xFFD1D5DB),
                          width: 1.5,
                        ),
                      ),
                      child: rememberMe
                          ? const Icon(
                              Icons.check,
                              size: 12,
                              color: Colors.white,
                            )
                          : null,
                    ),
                    const SizedBox(width: 6),
                    const Text(
                      'Remember me',
                      style: TextStyle(
                        color: Color(0xFF1F2937),
                        fontSize: 12.0,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              GestureDetector(
                onTap: onForgotPassword,
                child: const Text(
                  'Forgot Password?',
                  style: TextStyle(
                    color: Color(0xFF800A12),
                    fontWeight: FontWeight.w600,
                    fontSize: 12.0,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: isLoading ? null : onLogin,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF800A12),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 0,
            ),
            child: isLoading
                ? const SizedBox(
                    height: 18,
                    width: 18,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  )
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Sign In',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(width: 8),
                      Icon(Icons.arrow_forward, size: 16),
                    ],
                  ),
          ),
          const SizedBox(height: 10),
          const Row(
            children: [
              Expanded(child: Divider(color: Color(0xFFE5E7EB), thickness: 1)),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 8),
                child: Text(
                  'OR',
                  style: TextStyle(
                    color: Color(0xFF9CA3AF),
                    fontSize: 10.5,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              Expanded(child: Divider(color: Color(0xFFE5E7EB), thickness: 1)),
            ],
          ),
          const SizedBox(height: 10),
          LoginSocialRow(
            onGoogleTap: onGoogleSignIn,
            onAppleTap: onAppleSignIn,
            onFacebookTap: onFacebookSignIn,
            isGoogleLoading: isGoogleLoading,
            isAppleLoading: isAppleLoading,
          ),
        ],
      ),
    );
  }
}
