import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/widgets/app_logo.dart';
import 'package:single_restaurant_mobile/services/auth_service.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _authService = AuthService();
  final _emailController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _sendResetLink() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final errorMsg = await _authService.forgotPassword(
      email: _emailController.text.trim(),
    );

    if (mounted) {
      setState(() => _isLoading = false);
      if (errorMsg == null) {
        ToastUtils.showSuccess(context, 'Reset link sent successfully to your email.');
        Navigator.pop(context); // Go back to login screen
      } else {
        ToastUtils.showError(context, errorMsg);
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
            onPressed: () {},
            icon: const Icon(Icons.headset_mic_outlined, color: AppColors.secondary, size: 20),
            label: const Text('Help', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Header Section
            Container(
              height: 380,
              width: double.infinity,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0xFFFFF9F2), Color(0xFFFAF8F5)],
                ),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Stylized Background Content
                  Positioned(
                    top: 80,
                    child: Column(
                      children: [
                        const AppLogo(height: 56),
   
                        const SizedBox(height: 8),
                        const Row(
                          children: [
                            Icon(Icons.spa, color: Colors.orange, size: 12),
                            SizedBox(width: 8),
                            Text('INDIAN RESTAURANT', style: TextStyle(color: Colors.orange, fontSize: 10, letterSpacing: 1.2, fontWeight: FontWeight.bold)),
                            SizedBox(width: 8),
                            Icon(Icons.spa, color: Colors.orange, size: 12),
                          ],
                        ),
                      ],
                    ),
                  ),
                  // Custom Envelope Illustration
                  Positioned(
                    bottom: 0,
                    child: SizedBox(
                      height: 160,
                      width: 200,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          // Background circle
                          Container(
                            width: 140,
                            height: 140,
                            decoration: BoxDecoration(
                              color: Colors.orange.withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                          ),
                          // Card inside envelope
                          Positioned(
                            top: 10,
                            child: Container(
                              width: 100,
                              height: 120,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4)],
                              ),
                              child: const Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.lock, color: AppColors.secondary, size: 32),
                                  SizedBox(height: 8),
                                  Text('*****', style: TextStyle(color: AppColors.secondary, fontSize: 20, fontWeight: FontWeight.bold, letterSpacing: 4)),
                                ],
                              ),
                            ),
                          ),
                          // Envelope front flap
                          Positioned(
                            bottom: 10,
                            child: CustomPaint(
                              size: const Size(140, 70),
                              painter: EnvelopePainter(),
                            ),
                          ),
                          // Lassi glass (Placeholder icon)
                          Positioned(
                            bottom: 5,
                            right: 0,
                            child: Icon(Icons.local_drink, color: Colors.orange.shade300, size: 60),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            // Content Section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16),
              child: Column(
                children: [
                  const Text(
                    'Forgot Password?',
                    style: TextStyle(color: AppColors.secondary, fontSize: 24, fontWeight: FontWeight.bold, fontFamily: 'serif'),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'No worries! Enter your registered email address\nand we\'ll send you a link to reset your password.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey, fontSize: 13, height: 1.4),
                  ),
                  const SizedBox(height: 24),
                  
                  // Form Card
                  Container(
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
                          const Padding(
                            padding: EdgeInsets.only(bottom: 8.0, left: 4.0),
                            child: Text('Email Address', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          ),
                          TextFormField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            validator: (value) {
                              if (value == null || value.isEmpty) return 'Email is required';
                              if (!value.contains('@')) return 'Enter a valid email';
                              return null;
                            },
                            decoration: InputDecoration(
                              hintText: 'Enter your registered email address',
                              hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                              prefixIcon: const Icon(Icons.email_outlined, color: Colors.grey, size: 20),
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
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'We\'ll send password reset instructions to this email.',
                            style: TextStyle(color: Colors.grey, fontSize: 11),
                          ),
                          const SizedBox(height: 24),
                          
                          // Submit Button
                          ElevatedButton.icon(
                            onPressed: _isLoading ? null : _sendResetLink,
                            icon: _isLoading 
                                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) 
                                : const Icon(Icons.send, color: Colors.white, size: 18),
                            label: const Text('Send Reset Link', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.secondary,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  
                  // Security Banner
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF7F0), // Light orange/beige
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: AppColors.secondary, width: 2),
                          ),
                          child: const Icon(Icons.check, color: AppColors.secondary, size: 20),
                        ),
                        const SizedBox(width: 16),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Security is our priority', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black87)),
                              SizedBox(height: 4),
                              Text('We\'ll never share your details with anyone.\nYour account is safe with us.', style: TextStyle(color: Colors.black54, fontSize: 12, height: 1.4)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                  
                  // Support Footer
                  const Text('Still need help?', style: TextStyle(color: Colors.black87, fontSize: 14)),
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: () {},
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('Contact Support', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 14)),
                        SizedBox(width: 4),
                        Icon(Icons.chevron_right, color: AppColors.secondary, size: 16),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Custom painter to draw the envelope front flap (v-shape)
class EnvelopePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.orange.shade200
      ..style = PaintingStyle.fill;
      
    final path = Path();
    // Start top left
    path.moveTo(0, 20);
    // V dip in the middle
    path.lineTo(size.width / 2, size.height);
    // Top right
    path.lineTo(size.width, 20);
    // Bottom right
    path.lineTo(size.width, size.height);
    // Bottom left
    path.lineTo(0, size.height);
    path.close();

    // Add shadow
    canvas.drawShadow(path, Colors.black26, 4.0, false);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
