import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/services/auth_service.dart';
import 'package:single_restaurant_mobile/screens/main_screen.dart';
import 'package:single_restaurant_mobile/screens/register_screen.dart';
import 'package:single_restaurant_mobile/screens/forgot_password_screen.dart';
import 'package:single_restaurant_mobile/screens/otp_verification_screen.dart';
import 'package:single_restaurant_mobile/screens/help_support_screen.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/address_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/loyalty_provider.dart';
import 'package:single_restaurant_mobile/providers/notification_provider.dart';
import 'package:single_restaurant_mobile/widgets/app_logo.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

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

  bool _isPasswordVisible = false;
  bool _rememberMe = true;
  bool _isLoading = false;
  bool _isGoogleLoading = false;
  String? _errorMessage; // 👈 1. Error message store karne ke liye variable

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null; // 👈 Login start hote hi purana error clear karein
    });

    final errorMsg = await _authService.login(
      email: _emailController.text.trim(),
      password: _passwordController.text,
      rememberMe: _rememberMe,
    );

    if (mounted) {
      setState(() => _isLoading = false);
      if (errorMsg == null) {
        // Trigger all providers that depend on auth
        final authProv = context.read<AuthProvider>();
        final addressProv = context.read<AddressProvider>();
        final cartProv = context.read<CartProvider>();
        final loyaltyProv = context.read<LoyaltyProvider>();
        final notifProv = context.read<NotificationProvider>();

        // Fire and forget
        authProv.fetchUser();
        addressProv.fetchAddresses();
        cartProv.loadCart();
        loyaltyProv.fetchHistory();
        notifProv.fetchNotifications(); 

        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(
            builder: (context) => const MainScreen(initialIndex: 0),
          ),
          (route) => false,
        );
      } else {
        // 👈 2. SnackBar hata kar inline error state set ki
        setState(() => _errorMessage = errorMsg);
      }
    }
  }

  Future<void> _handleGoogleSignIn() async {
    setState(() => _isGoogleLoading = true);
    try {
      final GoogleSignIn googleSignIn = GoogleSignIn(
        scopes: ['email'],
        serverClientId: '960808501824-4lm2mhn15aq3lnis7bfs97gdmv193cgm.apps.googleusercontent.com',
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
            // Trigger all providers that depend on auth
            final authProv = context.read<AuthProvider>();
            final addressProv = context.read<AddressProvider>();
            final cartProv = context.read<CartProvider>();
            final loyaltyProv = context.read<LoyaltyProvider>();
            final notifProv = context.read<NotificationProvider>();

            // Fire and forget
            authProv.fetchUser();
            addressProv.fetchAddresses();
            cartProv.loadCart();
            loyaltyProv.fetchHistory();
            notifProv.fetchNotifications();

            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (context) => const MainScreen(initialIndex: 0)),
              (route) => false,
            );
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
    setState(() => _isLoading = true);
    try {
      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [AppleIDAuthorizationScopes.email, AppleIDAuthorizationScopes.fullName],
      );
      
      final name = (credential.givenName != null && credential.familyName != null) 
          ? '${credential.givenName} ${credential.familyName}'
          : null;

      final errorMsg = await _authService.socialLogin(
        provider: 'apple',
        token: credential.identityToken ?? '',
        email: credential.email,
        name: name,
      );
      
      if (errorMsg == null && mounted) {
        context.read<AuthProvider>().fetchUser();
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => const MainScreen(initialIndex: 0)),
          (route) => false,
        );
      } else if (mounted) {
        setState(() => _errorMessage = errorMsg);
      }
    } catch (e) {
      if (mounted) setState(() => _errorMessage = 'Apple Sign In failed: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // 👈 Type karte hi error hatane ka function
  void _clearErrorOnType(String value) {
    if (_errorMessage != null) {
      setState(() => _errorMessage = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAF8F5),
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.secondary),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          TextButton.icon(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const HelpSupportScreen(),
                ),
              );
            },
            icon: const Icon(
              Icons.headset_mic_outlined,
              color: AppColors.secondary,
              size: 20,
            ),
            label: const Text(
              'Help',
              style: TextStyle(
                color: AppColors.secondary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        child: Stack(
          children: [
            // Background Header Design
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: Container(
                height: 380,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color(0xFFFFF9F2), Color(0xFFFAF8F5)],
                  ),
                ),
                child: Column(
                  children: [
                    const SizedBox(height: 80),
                    const AppLogo(height: 80),
                    const SizedBox(height: 8),
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.spa, color: Colors.orange, size: 12),
                        SizedBox(width: 8),
                        Text(
                          'INDIAN RESTAURANT',
                          style: TextStyle(
                            color: Colors.orange,
                            fontSize: 10,
                            letterSpacing: 1.2,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(width: 8),
                        Icon(Icons.spa, color: Colors.orange, size: 12),
                      ],
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Welcome Back!',
                      style: TextStyle(
                        color: AppColors.secondary,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'serif',
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Login to continue and enjoy\nyour favorite food.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.grey,
                        fontSize: 13,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Icon(
                      Icons.horizontal_rule,
                      color: Colors.orange,
                      size: 24,
                    ),
                  ],
                ),
              ),
            ),
            
            // Form Card
            Container(
              margin: const EdgeInsets.only(
                top: 330,
                left: 16,
                right: 16,
                bottom: 24,
              ),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    
                    // 👈 3. OTP screen jaisa Red Error Box yahan add kiya hai
                    if (_errorMessage != null) ...[
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          color: Colors.red.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red.shade200),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(Icons.error_outline, color: Colors.red.shade700, size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _errorMessage!,
                                    style: TextStyle(
                                      color: Colors.red.shade700, 
                                      fontSize: 12.5, 
                                      fontWeight: FontWeight.w600, 
                                      height: 1.3
                                    ),
                                  ),
                                  if (_errorMessage!.toLowerCase().contains('verify your email')) ...[
                                    const SizedBox(height: 10),
                                    GestureDetector(
                                      onTap: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) => OtpVerificationScreen(
                                              email: _emailController.text.trim(),
                                            ),
                                          ),
                                        );
                                      },
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withOpacity(0.9),
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border.all(color: Colors.red.shade200),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Text(
                                              'Verify Email Now',
                                              style: TextStyle(
                                                color: Colors.red.shade800,
                                                fontSize: 12,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                            const SizedBox(width: 4),
                                            Icon(Icons.arrow_forward, size: 14, color: Colors.red.shade800),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Email Field
                    _buildLabel('Email Address'),
                    _buildTextField(
                      controller: _emailController,
                      hintText: 'Enter your email address',
                      icon: Icons.email_outlined,
                      keyboardType: TextInputType.emailAddress,
                      onChanged: _clearErrorOnType, // 👈 Jaise hi user type karega, error hat jayega
                      validator: (value) {
                        if (value == null || value.isEmpty)
                          return 'Email is required';
                        final emailRegex = RegExp(
                          r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$',
                        );
                        if (!emailRegex.hasMatch(value))
                          return 'Enter a valid email format';
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Password Field
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildLabel('Password'),
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8.0),
                          child: GestureDetector(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) =>
                                      const ForgotPasswordScreen(),
                                ),
                              );
                            },
                            child: const Text(
                              'Forgot Password?',
                              style: TextStyle(
                                color: AppColors.secondary,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    _buildTextField(
                      controller: _passwordController,
                      hintText: 'Enter your password',
                      icon: Icons.lock_outline,
                      isPassword: true,
                      isVisible: _isPasswordVisible,
                      onChanged: _clearErrorOnType, // 👈 Jaise hi user type karega, error hat jayega
                      onVisibilityToggle: () => setState(
                        () => _isPasswordVisible = !_isPasswordVisible,
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty)
                          return 'Password is required';
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Remember me Checkbox
                    Row(
                      children: [
                        SizedBox(
                          height: 24,
                          width: 24,
                          child: Checkbox(
                            value: _rememberMe,
                            activeColor: AppColors.secondary,
                            onChanged: (val) =>
                                setState(() => _rememberMe = val ?? false),
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'Remember me',
                          style: TextStyle(
                            color: Colors.black87,
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Login Button
                    ElevatedButton(
                      onPressed: _isLoading ? null : _login,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.secondary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : const Text(
                              'Login',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                    const SizedBox(height: 32),

                    // Social Login Divider
                    Row(
                      children: [
                        Expanded(child: Divider(color: Colors.grey.shade300)),
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 16),
                          child: Text(
                            'or continue with',
                            style: TextStyle(color: Colors.grey, fontSize: 12),
                          ),
                        ),
                        Expanded(child: Divider(color: Colors.grey.shade300)),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Full Width Google Button
                    _buildSquareSocialButton(
                      'Google',
                      SvgPicture.string(
                        '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>''',
                        width: 24,
                        height: 24,
                      ),
                      _handleGoogleSignIn,
                      isLoading: _isGoogleLoading,
                    ),
                    const SizedBox(height: 32),

                    // Register Navigation
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          'Don\'t have an account? ',
                          style: TextStyle(color: Colors.black87, fontSize: 13),
                        ),
                        GestureDetector(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const RegisterScreen(),
                              ),
                            );
                          },
                          child: const Text(
                            'Register',
                            style: TextStyle(
                              color: AppColors.secondary,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            
            // Layout spacing trick footer
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Column(
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 800),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Promotional Banner
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF7F0),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const RegisterScreen(),
                      ),
                    );
                  },
                  behavior: HitTestBehavior.opaque,
                  child: Row(
                    children: [
                      const Icon(
                        Icons.card_giftcard,
                        color: AppColors.secondary,
                        size: 24,
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: RichText(
                          text: const TextSpan(
                            style: TextStyle(
                              color: Colors.black87,
                              fontSize: 14,
                            ),
                            children: [
                              TextSpan(text: 'New here? Sign up and get '),
                              TextSpan(
                                text: '10% OFF',
                                style: TextStyle(
                                  color: AppColors.secondary,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const Icon(
                        Icons.chevron_right,
                        color: AppColors.secondary,
                        size: 20,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              // Security Text
              const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.lock_outline, color: Colors.grey, size: 14),
                  SizedBox(width: 6),
                  Text(
                    'Your data is safe and secure with us',
                    style: TextStyle(color: Colors.grey, fontSize: 11),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0, left: 4.0),
      child: Text(
        text,
        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hintText,
    required IconData icon,
    bool isPassword = false,
    bool? isVisible,
    VoidCallback? onVisibilityToggle,
    String? Function(String?)? validator,
    Function(String)? onChanged, // 👈 4. onChanged add kiya
    TextInputType keyboardType = TextInputType.text,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: isPassword && !(isVisible ?? false),
      validator: validator,
      keyboardType: keyboardType,
      onChanged: onChanged, // 👈 Connect kar diya
      onTap: () {
        if (controller.selection.baseOffset !=
            controller.selection.extentOffset) {
          final extent = controller.selection.extentOffset;
          if (extent != -1) {
            controller.selection = TextSelection.collapsed(offset: extent);
          }
        }
      },
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
        prefixIcon: Icon(icon, color: Colors.grey, size: 20),
        suffixIcon: isPassword
            ? IconButton(
                icon: Icon(
                  isVisible! ? Icons.visibility : Icons.visibility_off,
                  color: Colors.grey,
                  size: 20,
                ),
                onPressed: onVisibilityToggle,
              )
            : null,
        contentPadding: const EdgeInsets.symmetric(vertical: 16),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(
            color: _errorMessage != null ? Colors.red.shade300 : Colors.grey.shade300, // Error state me border red ho jayegi
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.secondary),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Colors.red),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Colors.red),
        ),
      ),
    );
  }

  Widget _buildSquareSocialButton(String label, Widget iconWidget, VoidCallback onTap, {bool isLoading = false}) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 0),
      child: InkWell(
        onTap: isLoading ? null : onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey.shade300),
            color: Colors.white,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (isLoading)
                const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.black54),
                )
              else
                iconWidget,
              const SizedBox(width: 12),
              Text(
                isLoading ? 'Signing in...' : 'Continue with $label',
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}