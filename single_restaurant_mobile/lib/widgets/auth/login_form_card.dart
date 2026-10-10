import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/widgets/auth/login_register_form.dart';
import 'package:single_restaurant_mobile/widgets/auth/login_sign_in_form.dart';
import 'package:single_restaurant_mobile/widgets/auth/login_tab_switcher.dart';

/// Elevated authentication card supporting seamless in-place switching between
/// Sign In and Register views with smooth AnimatedSize and fade transitions.
class LoginFormCard extends StatelessWidget {
  final bool isSignIn;
  final ValueChanged<bool> onTabChanged;
  final GlobalKey<FormState> signInFormKey;
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
  final ValueChanged<String> onRegisterSuccess;

  const LoginFormCard({
    super.key,
    required this.isSignIn,
    required this.onTabChanged,
    required this.signInFormKey,
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
    required this.onRegisterSuccess,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          LoginTabSwitcher(
            isSignIn: isSignIn,
            onSignIn: () => onTabChanged(true),
            onRegister: () => onTabChanged(false),
          ),
          const SizedBox(height: 12),
          AnimatedSize(
            duration: const Duration(milliseconds: 320),
            curve: Curves.easeInOutCubic,
            alignment: Alignment.topCenter,
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 260),
              switchInCurve: Curves.easeInOut,
              switchOutCurve: Curves.easeInOut,
              transitionBuilder: (child, animation) {
                return FadeTransition(
                  opacity: animation,
                  child: child,
                );
              },
              layoutBuilder: (currentChild, previousChildren) {
                return Stack(
                  alignment: Alignment.topCenter,
                  children: [
                    ...previousChildren,
                    ?currentChild,
                  ],
                );
              },
              child: isSignIn
                  ? LoginSignInForm(
                      key: const ValueKey('sign_in_form'),
                      formKey: signInFormKey,
                      emailController: emailController,
                      passwordController: passwordController,
                      isPasswordVisible: isPasswordVisible,
                      onTogglePasswordVisibility: onTogglePasswordVisibility,
                      rememberMe: rememberMe,
                      onRememberMeChanged: onRememberMeChanged,
                      isLoading: isLoading,
                      isGoogleLoading: isGoogleLoading,
                      isAppleLoading: isAppleLoading,
                      errorMessage: errorMessage,
                      onLogin: onLogin,
                      onGoogleSignIn: onGoogleSignIn,
                      onAppleSignIn: onAppleSignIn,
                      onFacebookSignIn: onFacebookSignIn,
                      onForgotPassword: onForgotPassword,
                      onVerifyEmail: onVerifyEmail,
                      onFieldChanged: onFieldChanged,
                    )
                  : LoginRegisterForm(
                      key: const ValueKey('register_form'),
                      onRegisterSuccess: onRegisterSuccess,
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
