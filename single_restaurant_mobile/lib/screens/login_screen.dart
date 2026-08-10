import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/services/auth_service.dart';
import 'package:single_restaurant_mobile/screens/main_screen.dart';
import 'package:single_restaurant_mobile/screens/register_screen.dart';
import 'package:single_restaurant_mobile/screens/forgot_password_screen.dart';
import 'package:single_restaurant_mobile/screens/help_support_screen.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/address_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/loyalty_provider.dart';
import 'package:single_restaurant_mobile/providers/notification_provider.dart';
import 'package:single_restaurant_mobile/widgets/app_logo.dart';

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
                              child: Text(
                                _errorMessage!,
                                style: TextStyle(
                                  color: Colors.red.shade700, 
                                  fontSize: 12.5, 
                                  fontWeight: FontWeight.w600, 
                                  height: 1.3
                                ),
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

                    // Square Social Buttons Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildSquareSocialButton(
                          Icons.g_mobiledata,
                          'Google',
                          Colors.red,
                        ),
                        _buildSquareSocialButton(
                          Icons.apple,
                          'Apple',
                          Colors.black,
                        ),
                        _buildSquareSocialButton(
                          Icons.facebook,
                          'Facebook',
                          Colors.blue,
                        ),
                      ],
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

  Widget _buildSquareSocialButton(
    IconData icon,
    String label,
    Color iconColor,
  ) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey.shade300),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: iconColor, size: 28),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
          ],
        ),
      ),
    );
  }
}