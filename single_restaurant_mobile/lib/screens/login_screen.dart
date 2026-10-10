import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:provider/provider.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:single_restaurant_mobile/providers/address_provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/loyalty_provider.dart';
import 'package:single_restaurant_mobile/providers/notification_provider.dart';
import 'package:single_restaurant_mobile/screens/forgot_password_screen.dart';
import 'package:single_restaurant_mobile/screens/main_screen.dart';
import 'package:single_restaurant_mobile/screens/otp_verification_screen.dart';
import 'package:single_restaurant_mobile/services/auth_service.dart';
import 'package:single_restaurant_mobile/theme/app_responsive.dart';
import 'package:single_restaurant_mobile/widgets/auth/guest_login_card.dart';
import 'package:single_restaurant_mobile/widgets/auth/login_background.dart';
import 'package:single_restaurant_mobile/widgets/auth/login_branding_header.dart';
import 'package:single_restaurant_mobile/widgets/auth/login_form_card.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _authService = AuthService();

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isSignIn = true;
  bool _isPasswordVisible = false;
  bool _rememberMe = true;
  bool _isLoading = false;
  bool _isGoogleLoading = false;
  bool _isAppleLoading = false;
  bool _isGuestLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _refreshUserDataAndNavigate() async {
    final authProv = context.read<AuthProvider>();
    final addressProv = context.read<AddressProvider>();
    final cartProv = context.read<CartProvider>();
    final loyaltyProv = context.read<LoyaltyProvider>();
    final notifProv = context.read<NotificationProvider>();

    await authProv.fetchUser();
    addressProv.fetchAddresses();
    cartProv.loadCart();
    loyaltyProv.fetchHistory();
    notifProv.fetchNotifications();

    if (mounted) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(
          builder: (context) => const MainScreen(initialIndex: 0),
        ),
        (route) => false,
      );
    }
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final errorMsg = await _authService.login(
      email: _emailController.text.trim(),
      password: _passwordController.text,
      rememberMe: _rememberMe,
    );

    if (mounted) {
      setState(() => _isLoading = false);
      if (errorMsg == null) {
        await _refreshUserDataAndNavigate();
      } else {
        setState(() => _errorMessage = errorMsg);
      }
    }
  }

  Future<void> _handleGoogleSignIn() async {
    setState(() => _isGoogleLoading = true);
    try {
      final GoogleSignIn googleSignIn = GoogleSignIn(
        scopes: ['email'],
        serverClientId:
            '960808501824-4lm2mhn15aq3lnis7bfs97gdmv193cgm.apps.googleusercontent.com',
      );
      final GoogleSignInAccount? account = await googleSignIn.signIn();
      if (account != null) {
        final GoogleSignInAuthentication auth = await account.authentication;
        if (auth.idToken != null) {
          final errorMsg = await _authService.socialLogin(
            provider: 'google',
            token: auth.idToken!,
            email: account.email,
            name: account.displayName,
          );
          if (errorMsg == null && mounted) {
            await _refreshUserDataAndNavigate();
          } else if (mounted) {
            setState(() => _errorMessage = errorMsg);
          }
        }
      }
    } catch (e) {
      if (mounted) setState(() => _errorMessage = 'Google Sign In failed: $e');
    } finally {
      if (mounted) setState(() => _isGoogleLoading = false);
    }
  }

  Future<void> _handleAppleSignIn() async {
    setState(() => _isAppleLoading = true);
    try {
      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );

      final name = (credential.givenName != null &&
              credential.familyName != null)
          ? '${credential.givenName} ${credential.familyName}'
          : null;

      final errorMsg = await _authService.socialLogin(
        provider: 'apple',
        token: credential.identityToken ?? '',
        email: credential.email,
        name: name,
      );

      if (errorMsg == null && mounted) {
        await _refreshUserDataAndNavigate();
      } else if (mounted) {
        setState(() => _errorMessage = errorMsg);
      }
    } catch (e) {
      if (mounted) setState(() => _errorMessage = 'Apple Sign In failed: $e');
    } finally {
      if (mounted) setState(() => _isAppleLoading = false);
    }
  }

  void _handleFacebookSignIn() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Facebook Sign In will be available shortly.'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  Future<void> _continueAsGuest() async {
    if (_isGuestLoading || _isLoading || _isGoogleLoading || _isAppleLoading) return;
    setState(() => _isGuestLoading = true);

    await Future.delayed(const Duration(milliseconds: 650));
    if (!mounted) return;

    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(
        builder: (context) => const MainScreen(initialIndex: 0),
      ),
      (route) => false,
    );
  }

  void _clearErrorOnType(String value) {
    if (_errorMessage != null) {
      setState(() => _errorMessage = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return LoginBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: SingleChildScrollView(
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          child: Column(
            children: [
              SafeArea(
                child: ResponsiveCenter(
                  maxWidth: AppResponsive.maxFormWidth,
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Column(
                    children: [
                      const SizedBox(height: 4),
                      LoginBrandingHeader(isSignIn: _isSignIn),
                      const SizedBox(height: 10),
                      LoginFormCard(
                        isSignIn: _isSignIn,
                        onTabChanged: (val) => setState(() => _isSignIn = val),
                        signInFormKey: _formKey,
                        emailController: _emailController,
                        passwordController: _passwordController,
                        isPasswordVisible: _isPasswordVisible,
                        onTogglePasswordVisibility: () => setState(
                          () => _isPasswordVisible = !_isPasswordVisible,
                        ),
                        rememberMe: _rememberMe,
                        onRememberMeChanged: (val) => setState(
                          () => _rememberMe = val ?? false,
                        ),
                        isLoading: _isLoading,
                        isGoogleLoading: _isGoogleLoading,
                        isAppleLoading: _isAppleLoading,
                        errorMessage: _errorMessage,
                        onLogin: _login,
                        onGoogleSignIn: _handleGoogleSignIn,
                        onAppleSignIn: _handleAppleSignIn,
                        onFacebookSignIn: _handleFacebookSignIn,
                        onForgotPassword: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) =>
                                  const ForgotPasswordScreen(),
                            ),
                          );
                        },
                        onVerifyEmail: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => OtpVerificationScreen(
                                email: _emailController.text.trim(),
                              ),
                            ),
                          );
                        },
                        onRegisterSuccess: (email) {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) =>
                                  OtpVerificationScreen(email: email),
                            ),
                          );
                        },
                        onFieldChanged: _clearErrorOnType,
                      ),
                      AnimatedSize(
                        duration: const Duration(milliseconds: 320),
                        curve: Curves.easeInOutCubic,
                        alignment: Alignment.topCenter,
                        child: _isSignIn
                            ? Padding(
                                padding: const EdgeInsets.only(top: 10),
                                child: GuestLoginCard(
                                  isLoading: _isGuestLoading,
                                  onTap: _continueAsGuest,
                                ),
                              )
                            : const SizedBox.shrink(),
                      ),
                      const SizedBox(height: 16),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}