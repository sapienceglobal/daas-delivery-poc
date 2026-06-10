import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../theme.dart';
import '../widgets/glass_container.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  
  // Input fields
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  
  // Forgot / Reset fields
  final _resetTokenController = TextEditingController();
  final _newPasswordController = TextEditingController();

  String _mode = 'login'; // 'login' | 'register' | 'forgot' | 'reset'
  String _role = 'customer'; // 'customer' | 'merchant'

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _resetTokenController.dispose();
    _newPasswordController.dispose();
    super.dispose();
  }

  void _switchMode(String newMode) {
    setState(() {
      _mode = newMode;
    });
    Provider.of<AuthProvider>(context, listen: false).clearMessages();
  }

  bool _validatePassword(String value) {
    // 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    final regex = RegExp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$');
    return regex.hasMatch(value);
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    if (_mode == 'login') {
      final success = await authProvider.login(
        _emailController.text.trim(),
        _passwordController.text.trim(),
      );
      if (success) {
        // Logged in successfully, navigation is managed automatically by main.dart listener
      }
    } else if (_mode == 'register') {
      final success = await authProvider.register(
        name: _nameController.text.trim(),
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
        phone: _phoneController.text.trim(),
        address: _addressController.text.trim(),
        role: _role,
      );
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Account registered successfully!')),
        );
      }
    } else if (_mode == 'forgot') {
      final success = await authProvider.forgotPassword(_emailController.text.trim());
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(authProvider.successMessage ?? 'Reset code logged to backend console!')),
        );
        _switchMode('reset');
      }
    } else if (_mode == 'reset') {
      final success = await authProvider.resetPassword(
        _resetTokenController.text.trim(),
        _newPasswordController.text.trim(),
      );
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(authProvider.successMessage ?? 'Password updated! Please log in.')),
        );
        _switchMode('login');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              BrandColors.background,
              Color(0xFF0F172A),
              Color(0xFF1E1E38),
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 36),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Brand Logo Area
                    const Icon(
                      Icons.delivery_dining_rounded,
                      size: 64,
                      color: BrandColors.cyan,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'SAPIENCE GLOBAL',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontSize: 24,
                            letterSpacing: 3.0,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'DoorDash PoC Delivery App',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            letterSpacing: 1.0,
                            color: BrandColors.cyan,
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 36),

                    // Main Interactive Card
                    GlassContainer(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            _mode == 'login'
                                ? 'Sign In'
                                : _mode == 'register'
                                    ? 'Create Account'
                                    : _mode == 'forgot'
                                        ? 'Reset Password'
                                        : 'Enter New Password',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 20),

                          if (authProvider.errorMessage != null) ...[
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: BrandColors.red.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: BrandColors.red.withOpacity(0.3)),
                              ),
                              child: Text(
                                authProvider.errorMessage!,
                                style: const TextStyle(color: BrandColors.red, fontSize: 12),
                              ),
                            ),
                            const SizedBox(height: 16),
                          ],

                          // Email
                          if (_mode == 'login' || _mode == 'register' || _mode == 'forgot') ...[
                            TextFormField(
                              controller: _emailController,
                              keyboardType: TextInputType.emailAddress,
                              decoration: const InputDecoration(
                                labelText: 'Email Address',
                                prefixIcon: Icon(Icons.email_outlined, color: BrandColors.textMuted, size: 18),
                              ),
                              validator: (val) => val == null || !val.contains('@') ? 'Enter a valid email' : null,
                            ),
                            const SizedBox(height: 16),
                          ],

                          // Password
                          if (_mode == 'login') ...[
                            TextFormField(
                              controller: _passwordController,
                              obscureText: true,
                              decoration: const InputDecoration(
                                labelText: 'Password',
                                prefixIcon: Icon(Icons.lock_outline, color: BrandColors.textMuted, size: 18),
                              ),
                              validator: (val) => val == null || val.length < 4 ? 'Enter your password' : null,
                            ),
                            const SizedBox(height: 8),
                            Align(
                              alignment: Alignment.centerRight,
                              child: TextButton(
                                onPressed: () => _switchMode('forgot'),
                                child: const Text(
                                  'Forgot Password?',
                                  style: TextStyle(color: BrandColors.cyan, fontSize: 12, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),
                          ],

                          // Register Fields
                          if (_mode == 'register') ...[
                            TextFormField(
                              controller: _passwordController,
                              obscureText: true,
                              decoration: const InputDecoration(
                                labelText: 'Password (8+ chars, A-Z, 0-9, symbol)',
                                prefixIcon: Icon(Icons.lock_outline, color: BrandColors.textMuted, size: 18),
                              ),
                              validator: (val) {
                                if (val == null || val.isEmpty) return 'Enter a password';
                                if (!_validatePassword(val)) {
                                  return 'Must be 8+ chars, with uppercase, number & symbol';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            TextFormField(
                              controller: _nameController,
                              decoration: const InputDecoration(
                                labelText: 'Full Name',
                                prefixIcon: Icon(Icons.person_outline, color: BrandColors.textMuted, size: 18),
                              ),
                              validator: (val) => val == null || val.trim().isEmpty ? 'Enter your full name' : null,
                            ),
                            const SizedBox(height: 16),
                            TextFormField(
                              controller: _phoneController,
                              keyboardType: TextInputType.phone,
                              decoration: const InputDecoration(
                                labelText: 'Phone Number',
                                prefixIcon: Icon(Icons.phone_outlined, color: BrandColors.textMuted, size: 18),
                              ),
                              validator: (val) => val == null || val.trim().isEmpty ? 'Enter your phone number' : null,
                            ),
                            const SizedBox(height: 16),
                            TextFormField(
                              controller: _addressController,
                              decoration: const InputDecoration(
                                labelText: 'Primary Delivery Address',
                                prefixIcon: Icon(Icons.location_on_outlined, color: BrandColors.textMuted, size: 18),
                              ),
                              validator: (val) => val == null || val.trim().isEmpty ? 'Enter your address' : null,
                            ),
                            const SizedBox(height: 16),
                            
                            // Role Selector Dropdown
                            DropdownButtonFormField<String>(
                              initialValue: _role,
                              decoration: const InputDecoration(
                                labelText: 'Register As',
                                prefixIcon: Icon(Icons.assignment_ind_outlined, color: BrandColors.textMuted, size: 18),
                              ),
                              items: const [
                                DropdownMenuItem(value: 'customer', child: Text('Customer (Order Food)')),
                                DropdownMenuItem(value: 'merchant', child: Text('Merchant (Restaurant Owner)')),
                              ],
                              onChanged: (val) {
                                if (val != null) {
                                  setState(() {
                                    _role = val;
                                  });
                                }
                              },
                            ),
                            const SizedBox(height: 24),
                          ],

                          // Forgot / Reset Fields
                          if (_mode == 'reset') ...[
                            TextFormField(
                              controller: _resetTokenController,
                              decoration: const InputDecoration(
                                labelText: 'Reset Hashed Token (from Server console logs)',
                                prefixIcon: Icon(Icons.vpn_key_outlined, color: BrandColors.textMuted, size: 18),
                              ),
                              validator: (val) => val == null || val.trim().isEmpty ? 'Enter the token' : null,
                            ),
                            const SizedBox(height: 16),
                            TextFormField(
                              controller: _newPasswordController,
                              obscureText: true,
                              decoration: const InputDecoration(
                                labelText: 'New Password',
                                prefixIcon: Icon(Icons.lock_outline, color: BrandColors.textMuted, size: 18),
                              ),
                              validator: (val) {
                                if (val == null || val.isEmpty) return 'Enter a password';
                                if (!_validatePassword(val)) {
                                  return 'Must be 8+ chars, with uppercase, number & symbol';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 24),
                          ],

                          // Submit Action Button
                          ElevatedButton(
                            onPressed: authProvider.isLoading ? null : _handleSubmit,
                            child: authProvider.isLoading
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: BrandColors.background),
                                  )
                                : Text(
                                    _mode == 'login'
                                        ? 'LOGIN'
                                        : _mode == 'register'
                                            ? 'REGISTER'
                                            : _mode == 'forgot'
                                                ? 'REQUEST RESET LINK'
                                                : 'RESET PASSWORD',
                                  ),
                          ),
                          const SizedBox(height: 16),

                          // Toggle screens option
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                _mode == 'login'
                                    ? "Don't have an account? "
                                    : "Already have an account? ",
                                style: const TextStyle(fontSize: 12, color: BrandColors.textMuted),
                              ),
                              GestureDetector(
                                onTap: () {
                                  if (_mode == 'login') {
                                    _switchMode('register');
                                  } else {
                                    _switchMode('login');
                                  }
                                },
                                child: Text(
                                  _mode == 'login' ? 'Register' : 'Login',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: BrandColors.cyan,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),

                          if (_mode == 'forgot' || _mode == 'reset') ...[
                            const SizedBox(height: 12),
                            TextButton(
                              onPressed: () => _switchMode('login'),
                              child: const Text('Back to Login', style: TextStyle(color: BrandColors.textMuted, fontSize: 12)),
                            )
                          ]
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
