import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/services/auth_service.dart';
import 'package:single_restaurant_mobile/screens/main_screen.dart';
import 'package:single_restaurant_mobile/screens/register_screen.dart';
import 'package:single_restaurant_mobile/screens/forgot_password_screen.dart';
import 'package:single_restaurant_mobile/screens/help_support_screen.dart';

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

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final errorMsg = await _authService.login(
      email: _emailController.text.trim(),
      password: _passwordController.text,
      rememberMe: _rememberMe,
    );

    if (mounted) {
      setState(() => _isLoading = false);
      if (errorMsg == null) {
        // Success
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => const MainScreen(initialIndex: 0)),
          (route) => false,
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(errorMsg)),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAF8F5), // Light beige background
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
                MaterialPageRoute(builder: (context) => const HelpSupportScreen()),
              );
            },
            icon: const Icon(Icons.headset_mic_outlined, color: AppColors.secondary, size: 20),
            label: const Text('Help', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold)),
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
                    // Mock Logo
                    const Icon(Icons.workspace_premium, color: Colors.orange, size: 40),
                    const Text('LASSI', style: TextStyle(color: AppColors.secondary, fontSize: 40, fontFamily: 'serif', letterSpacing: 2)),
                    const Text('LOUNGE', style: TextStyle(color: AppColors.secondary, fontSize: 20, fontFamily: 'serif', letterSpacing: 1.5, height: 0.8)),
                    const SizedBox(height: 8),
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.spa, color: Colors.orange, size: 12),
                        SizedBox(width: 8),
                        Text('INDIAN RESTAURANT', style: TextStyle(color: Colors.orange, fontSize: 10, letterSpacing: 1.2, fontWeight: FontWeight.bold)),
                        SizedBox(width: 8),
                        Icon(Icons.spa, color: Colors.orange, size: 12),
                      ],
                    ),
                    const SizedBox(height: 24),
                    const Text('Welcome Back!', style: TextStyle(color: AppColors.secondary, fontSize: 24, fontWeight: FontWeight.bold, fontFamily: 'serif')),
                    const SizedBox(height: 8),
                    const Text('Login to continue and enjoy\nyour favorite food.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 13, height: 1.4)),
                    const SizedBox(height: 12),
                    const Icon(Icons.horizontal_rule, color: Colors.orange, size: 24),
                  ],
                ),
              ),
            ),
            // Form Card
            Container(
              margin: const EdgeInsets.only(top: 330, left: 16, right: 16, bottom: 24),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Email Field
                    _buildLabel('Email Address'),
                    _buildTextField(
                      controller: _emailController,
                      hintText: 'Enter your email address',
                      icon: Icons.email_outlined,
                      keyboardType: TextInputType.emailAddress,
                      validator: (value) {
                        if (value == null || value.isEmpty) return 'Email is required';
                        final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
                        if (!emailRegex.hasMatch(value)) return 'Enter a valid email format';
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
                                MaterialPageRoute(builder: (context) => const ForgotPasswordScreen()),
                              );
                            },
                            child: const Text('Forgot Password?', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 12)),
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
                      onVisibilityToggle: () => setState(() => _isPasswordVisible = !_isPasswordVisible),
                      validator: (value) {
                        if (value == null || value.isEmpty) return 'Password is required';
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
                            onChanged: (val) => setState(() => _rememberMe = val ?? false),
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Text('Remember me', style: TextStyle(color: Colors.black87, fontSize: 13, fontWeight: FontWeight.w500)),
                      ],
                    ),
                    const SizedBox(height: 24),
                    
                    // Login Button
                    ElevatedButton(
                      onPressed: _isLoading ? null : _login,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.secondary,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: _isLoading 
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Login', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(height: 32),
                    
                    // Social Login Divider
                    Row(
                      children: [
                        Expanded(child: Divider(color: Colors.grey.shade300)),
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 16),
                          child: Text('or continue with', style: TextStyle(color: Colors.grey, fontSize: 12)),
                        ),
                        Expanded(child: Divider(color: Colors.grey.shade300)),
                      ],
                    ),
                    const SizedBox(height: 24),
                    
                    // Square Social Buttons Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildSquareSocialButton(Icons.g_mobiledata, 'Google', Colors.red),
                        _buildSquareSocialButton(Icons.apple, 'Apple', Colors.black),
                        _buildSquareSocialButton(Icons.facebook, 'Facebook', Colors.blue),
                      ],
                    ),
                    const SizedBox(height: 32),
                    
                    // Register Navigation
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('Don\'t have an account? ', style: TextStyle(color: Colors.black87, fontSize: 13)),
                        GestureDetector(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (context) => const RegisterScreen()),
                            );
                          },
                          child: const Text('Register', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 13)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            
            // Footer Section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Column(
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 800), // Adjusted to sit below the card roughly, actually better inside a Column below stack or wrap stack properly. 
                    // Let's use a trick: this is inside the Stack. Better to use a Column after the stack. Wait, Stack children overlay.
                    // The Container with top:320 determines the height. I'll move this outside the stack by putting the stack inside a column.
                  )
                ],
              ),
            )
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
                  color: const Color(0xFFFFF7F0), // Light orange/beige
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.card_giftcard, color: AppColors.secondary, size: 24),
                    const SizedBox(width: 16),
                    Expanded(
                      child: RichText(
                        text: const TextSpan(
                          style: TextStyle(color: Colors.black87, fontSize: 14),
                          children: [
                            TextSpan(text: 'New here? Sign up and get '),
                            TextSpan(text: '10% OFF', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold)),
                          ]
                        )
                      ),
                    ),
                    const Icon(Icons.chevron_right, color: AppColors.secondary, size: 20),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              // Security Text
              const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.lock_outline, color: Colors.grey, size: 14),
                  SizedBox(width: 6),
                  Text('Your data is safe and secure with us', style: TextStyle(color: Colors.grey, fontSize: 11)),
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
      child: Text(text, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
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
    TextInputType keyboardType = TextInputType.text,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: isPassword && !(isVisible ?? false),
      validator: validator,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
        prefixIcon: Icon(icon, color: Colors.grey, size: 20),
        suffixIcon: isPassword 
          ? IconButton(
              icon: Icon(isVisible! ? Icons.visibility : Icons.visibility_off, color: Colors.grey, size: 20),
              onPressed: onVisibilityToggle,
            )
          : null,
        contentPadding: const EdgeInsets.symmetric(vertical: 16),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey.shade300),
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

  Widget _buildSquareSocialButton(IconData icon, String label, Color iconColor) {
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
            Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87)),
          ],
        ),
      ),
    );
  }
}
