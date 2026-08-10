import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/screens/login_screen.dart';
import 'package:single_restaurant_mobile/services/auth_service.dart';
import 'package:single_restaurant_mobile/screens/otp_verification_screen.dart';
import 'package:single_restaurant_mobile/screens/help_support_screen.dart';
import 'package:single_restaurant_mobile/widgets/app_logo.dart';
import 'package:country_picker/country_picker.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _authService = AuthService();

  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isPasswordVisible = false;
  bool _isConfirmPasswordVisible = false;
  bool _agreedToTerms = false;
  bool _isLoading = false;

  // NOTE: Defaulted to India since the storefront is branded as an
  // "Indian Restaurant" — change this if the business is actually
  // based elsewhere. (Previously defaulted to +1 US/Canada, which
  // didn't match the rest of the app's branding.)
  String _selectedCountryCode = '+91';
  String _selectedCountryFlag = '🇮🇳';

  // Top-of-form banner for anything the backend rejects (duplicate
  // email, server error, etc). Field-specific errors ALSO populate
  // _emailServerError below so the exact field gets highlighted too.
  String? _errorMessage;
  String? _emailServerError;

  final RegExp _passwordRegex = RegExp(
    r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$',
  );

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    // Clear any previous server error before re-validating, otherwise a
    // stale server error can block a resubmission that would now succeed.
    setState(() => _emailServerError = null);

    if (!_formKey.currentState!.validate()) return;

    if (!_agreedToTerms) {
      setState(() => _errorMessage = 'Please agree to the Terms & Conditions to continue.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final errorMsg = await _authService.register(
      name: _nameController.text.trim(),
      email: _emailController.text.trim(),
      password: _passwordController.text,
      phone: '$_selectedCountryCode${_phoneController.text.trim()}',
    );

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (errorMsg == null) {
      // Navigate to OTP Verification before going to the main app
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => OtpVerificationScreen(
            email: _emailController.text.trim(),
          ),
        ),
      );
    } else {
      setState(() {
        _errorMessage = errorMsg;
        // Best-effort mapping: if the backend's message is about the
        // email, surface it right under the Email field too, not just
        // in the top banner. Ideally the backend returns a structured
        // {field, message} pair instead of a plain string so this
        // doesn't have to guess — happy to wire that up if you share
        // the backend's error response shape.
        if (errorMsg.toLowerCase().contains('email')) {
          _emailServerError = errorMsg;
        }
      });
      if (_emailServerError != null) {
        _formKey.currentState!.validate();
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
                    // Mock Logo
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
                      'Create Your Account',
                      style: TextStyle(
                        color: AppColors.secondary,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'serif',
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Join Lassi Lounge and enjoy\ndelicious food & exclusive offers.',
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
                    if (_errorMessage != null) ...[
                      _buildErrorBanner(_errorMessage!),
                      const SizedBox(height: 16),
                    ],

                    _buildLabel('Full Name'),
                    _buildTextField(
                      controller: _nameController,
                      hintText: 'Enter your full name',
                      icon: Icons.person_outline,
                      validator: (value) =>
                          value!.isEmpty ? 'Name is required' : null,
                    ),
                    const SizedBox(height: 16),

                    _buildLabel('Phone Number'),
                    _buildPhoneField(),
                    const SizedBox(height: 16),

                    _buildLabel('Email Address'),
                    _buildTextField(
                      controller: _emailController,
                      hintText: 'Enter your email address',
                      icon: Icons.email_outlined,
                      keyboardType: TextInputType.emailAddress,
                      onChanged: (_) {
                        if (_emailServerError != null) {
                          setState(() => _emailServerError = null);
                        }
                      },
                      validator: (value) {
                        // Server-side error (e.g. "already registered")
                        // takes priority so the user sees it right where
                        // they're looking, not just in the top banner.
                        if (_emailServerError != null) return _emailServerError;
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

                    _buildLabel('Password'),
                    _buildTextField(
                      controller: _passwordController,
                      hintText: 'Create a password',
                      icon: Icons.lock_outline,
                      isPassword: true,
                      isVisible: _isPasswordVisible,
                      onVisibilityToggle: () => setState(
                        () => _isPasswordVisible = !_isPasswordVisible,
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty)
                          return 'Password is required';
                        if (!_passwordRegex.hasMatch(value))
                          return 'Must meet complexity requirements';
                        return null;
                      },
                    ),
                    const Padding(
                      padding: EdgeInsets.only(top: 8.0, left: 4.0),
                      child: Text(
                        'At least 8 characters with a number and special character',
                        style: TextStyle(color: Colors.grey, fontSize: 11),
                      ),
                    ),
                    const SizedBox(height: 16),

                    _buildLabel('Confirm Password'),
                    _buildTextField(
                      controller: _confirmPasswordController,
                      hintText: 'Confirm your password',
                      icon: Icons.lock_outline,
                      isPassword: true,
                      isVisible: _isConfirmPasswordVisible,
                      onVisibilityToggle: () => setState(
                        () => _isConfirmPasswordVisible =
                            !_isConfirmPasswordVisible,
                      ),
                      validator: (value) {
                        if (value != _passwordController.text)
                          return 'Passwords do not match';
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),

                    // Terms & Conditions Checkbox
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(
                          height: 24,
                          width: 24,
                          child: Checkbox(
                            value: _agreedToTerms,
                            activeColor: AppColors.secondary,
                            onChanged: (val) => setState(() {
                              _agreedToTerms = val ?? false;
                              _errorMessage = null;
                            }),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: RichText(
                            text: const TextSpan(
                              style: TextStyle(
                                color: Colors.black87,
                                fontSize: 12,
                                height: 1.4,
                              ),
                              children: [
                                TextSpan(text: 'I agree to the '),
                                TextSpan(
                                  text: 'Terms & Conditions',
                                  style: TextStyle(
                                    color: AppColors.secondary,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                TextSpan(text: ' and '),
                                TextSpan(
                                  text: 'Privacy Policy',
                                  style: TextStyle(
                                    color: AppColors.secondary,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Register Button
                    ElevatedButton(
                      onPressed: _isLoading ? null : _register,
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
                              'Register',
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
                            'or register with',
                            style: TextStyle(color: Colors.grey, fontSize: 12),
                          ),
                        ),
                        Expanded(child: Divider(color: Colors.grey.shade300)),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Social Buttons Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildSocialButton(
                          Icons.g_mobiledata,
                          'Google',
                          Colors.red,
                        ),
                        _buildSocialButton(Icons.apple, 'Apple', Colors.black),
                        _buildSocialButton(
                          Icons.facebook,
                          'Facebook',
                          Colors.blue,
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Footer Navigation
                    Container(
                      padding: const EdgeInsets.symmetric(
                        vertical: 16,
                        horizontal: 24,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF7F0), // Light orange/beige
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const LoginScreen(),
                            ),
                          );
                        },
                        behavior: HitTestBehavior.opaque,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(
                              Icons.card_giftcard,
                              color: AppColors.secondary,
                              size: 20,
                            ),
                            const SizedBox(width: 12),
                            GestureDetector(
                              onTap: () => Navigator.pop(context),
                              child: RichText(
                                text: const TextSpan(
                                  style: TextStyle(
                                    color: Colors.black87,
                                    fontSize: 14,
                                  ),
                                  children: [
                                    TextSpan(text: 'Already have an account? '),
                                    TextSpan(
                                      text: 'Login',
                                      style: TextStyle(
                                        color: AppColors.secondary,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const Spacer(),
                            const Icon(
                              Icons.chevron_right,
                              color: AppColors.secondary,
                              size: 20,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Inline banner shown for anything the backend rejects — replaces the
  // old ScaffoldMessenger SnackBar, which disappears too fast and isn't
  // tied to the form the user is actually looking at.
  Widget _buildErrorBanner(String message) {
    return Container(
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
              message,
              style: TextStyle(
                color: Colors.red.shade700,
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                height: 1.3,
              ),
            ),
          ),
        ],
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
    void Function(String)? onChanged,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: isPassword && !(isVisible ?? false),
      validator: validator,
      onChanged: onChanged,
      keyboardType: keyboardType,
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

  Widget _buildPhoneField() {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Row(
        children: [
          InkWell(
            onTap: () {
              showCountryPicker(
                context: context,
                showPhoneCode: true,
                countryListTheme: CountryListThemeData(
                  bottomSheetHeight: MediaQuery.of(context).size.height * 0.7,
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(20),
                  ),
                  inputDecoration: InputDecoration(
                    labelText: 'Search Country',
                    hintText: 'Start typing to search',
                    prefixIcon: const Icon(Icons.search),
                    border: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: Colors.grey.shade300,
                      ),
                    ),
                  ),
                ),
                onSelect: (Country country) {
                  setState(() {
                    _selectedCountryCode = '+${country.phoneCode}';
                    _selectedCountryFlag = country.flagEmoji;
                  });
                },
              );
            },
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '$_selectedCountryCode $_selectedCountryFlag',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  const SizedBox(width: 4),
                  Icon(
                    Icons.keyboard_arrow_down,
                    color: Colors.grey.shade600,
                    size: 18,
                  ),
                ],
              ),
            ),
          ),
          Container(height: 24, width: 1, color: Colors.grey.shade300),
          Expanded(
            child: TextFormField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              onTap: () {
                if (_phoneController.selection.baseOffset !=
                    _phoneController.selection.extentOffset) {
                  final extent = _phoneController.selection.extentOffset;
                  if (extent != -1) {
                    _phoneController.selection = TextSelection.collapsed(
                      offset: extent,
                    );
                  }
                }
              },
              decoration: InputDecoration(
                hintText: 'Enter your phone number',
                hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) return 'Phone is required';
                final numbersOnly = value.replaceAll(RegExp(r'\D'), '');
                if (numbersOnly.length < 7 || numbersOnly.length > 15) {
                  return 'Enter a valid phone number';
                }
                return null;
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSocialButton(IconData icon, String label, Color iconColor) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey.shade300),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: iconColor, size: 20),
            const SizedBox(width: 6),
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