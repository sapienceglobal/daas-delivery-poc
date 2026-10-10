import 'package:country_picker/country_picker.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/services/auth_service.dart';
import 'package:single_restaurant_mobile/widgets/auth/auth_error_box.dart';
import 'package:single_restaurant_mobile/widgets/auth/login_register_fields.dart';
import 'package:url_launcher/url_launcher.dart';

/// Form containing registration fields embedded directly into the login card.
class LoginRegisterForm extends StatefulWidget {
  final ValueChanged<String> onRegisterSuccess;

  const LoginRegisterForm({
    super.key,
    required this.onRegisterSuccess,
  });

  @override
  State<LoginRegisterForm> createState() => _LoginRegisterFormState();
}

class _LoginRegisterFormState extends State<LoginRegisterForm> {
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
  bool _termsError = false;
  bool _isLoading = false;

  String _selectedCountryCode = '+91';
  String _selectedCountryFlag = '🇮🇳';
  int _phoneMaxLength = 10;
  String? _errorMessage;

  TapGestureRecognizer? _termsRecognizer;
  TapGestureRecognizer? _privacyRecognizer;

  @override
  void initState() {
    super.initState();
    _termsRecognizer = TapGestureRecognizer()..onTap = _openTerms;
    _privacyRecognizer = TapGestureRecognizer()..onTap = _openPrivacyPolicy;
  }

  @override
  void dispose() {
    _termsRecognizer?.dispose();
    _privacyRecognizer?.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _openTerms() async {
    final uri = Uri.parse('https://lassiloungeny.com/terms');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _openPrivacyPolicy() async {
    final uri = Uri.parse('https://lassiloungeny.com/privacy-policy');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _openCountryPicker() {
    showCountryPicker(
      context: context,
      showPhoneCode: true,
      countryListTheme: CountryListThemeData(
        bottomSheetHeight: MediaQuery.of(context).size.height * 0.7,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        inputDecoration: const InputDecoration(
          labelText: 'Search Country',
          hintText: 'Start typing to search',
          prefixIcon: Icon(Icons.search),
        ),
      ),
      onSelect: (Country country) {
        setState(() {
          _selectedCountryCode = '+${country.phoneCode}';
          _selectedCountryFlag = country.flagEmoji;
          _phoneMaxLength =
              country.example.isNotEmpty ? country.example.length : 15;
        });
      },
    );
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;

    if (!_agreedToTerms) {
      setState(() {
        _termsError = true;
        _errorMessage =
            'Please agree to the Terms & Conditions and Privacy Policy.';
      });
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
      agreedToTerms: _agreedToTerms,
    );

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (errorMsg == null) {
      widget.onRegisterSuccess(_emailController.text.trim());
    } else {
      setState(() => _errorMessage = errorMsg);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_errorMessage != null) ...[
            AuthErrorBox(errorMessage: _errorMessage!),
            const SizedBox(height: 10),
          ],
          LoginRegisterFields(
            nameController: _nameController,
            phoneController: _phoneController,
            emailController: _emailController,
            passwordController: _passwordController,
            confirmPasswordController: _confirmPasswordController,
            isPasswordVisible: _isPasswordVisible,
            isConfirmPasswordVisible: _isConfirmPasswordVisible,
            onTogglePasswordVisibility: () =>
                setState(() => _isPasswordVisible = !_isPasswordVisible),
            onToggleConfirmPasswordVisibility: () => setState(() =>
                _isConfirmPasswordVisible = !_isConfirmPasswordVisible),
            selectedCountryCode: _selectedCountryCode,
            selectedCountryFlag: _selectedCountryFlag,
            phoneMaxLength: _phoneMaxLength,
            onPickCountry: _openCountryPicker,
            agreedToTerms: _agreedToTerms,
            termsError: _termsError,
            onToggleTerms: (val) => setState(() {
              _agreedToTerms = val ?? false;
              if (_agreedToTerms) _termsError = false;
            }),
            termsRecognizer: _termsRecognizer,
            privacyRecognizer: _privacyRecognizer,
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: _isLoading ? null : _register,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF800A12),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 0,
            ),
            child: _isLoading
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
                        'Register',
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
        ],
      ),
    );
  }
}
