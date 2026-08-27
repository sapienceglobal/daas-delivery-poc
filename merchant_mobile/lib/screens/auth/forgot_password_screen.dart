import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({Key? key}) : super(key: key);

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  bool _isLoading = false;
  bool _isSuccess = false;
  String? _error;

  Future<void> _handleReset() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      setState(() => _error = 'Please enter your email address');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await ApiService.post('/api/auth/forgot-password', {'email': email});
      final decoded = jsonDecode(response.body);

      if (response.statusCode == 200 && decoded['success'] == true) {
        setState(() => _isSuccess = true);
      } else {
        setState(() => _error = decoded['message'] ?? 'Failed to send reset link');
      }
    } catch (e) {
      setState(() => _error = 'An error occurred. Please try again.');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        leading: Padding(
          padding: const EdgeInsets.only(left: 16.0, top: 8.0, bottom: 8.0),
          child: Container(
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(12),
            ),
            child: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new, color: Colors.black, size: 16),
              onPressed: () => context.pop(),
            ),
          ),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
            child: _isSuccess ? _buildSuccessView() : _buildFormView(),
          ),
        ),
      ),
    );
  }

  Widget _buildFormView() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Header Icon Composition
        Center(
          child: Container(
            width: 140,
            height: 140,
            decoration: const BoxDecoration(
              color: Color(0xFFFFF0F0),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Image.asset(
                'assets/images/branded/lassi-lounge/Lassi-Lounge-icon.png',
                width: 70,
                height: 70,
                fit: BoxFit.contain,
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),
        
        // Title
        Text(
          'Forgot Password?',
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(
            fontSize: 26,
            fontWeight: FontWeight.w900,
            color: const Color(0xFF111827),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          "No worries! Enter your email address and we'll\nsend you a link to reset your password.",
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(
            fontSize: 14,
            color: const Color(0xFF6B7280),
            height: 1.5,
          ),
        ),
        const SizedBox(height: 32),

        // Email Field
        Text(
          'Email Address',
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF1F2937),
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          decoration: InputDecoration(
            hintText: 'Enter your email',
            hintStyle: GoogleFonts.inter(color: const Color(0xFF9CA3AF), fontSize: 14),
            prefixIcon: const Icon(Icons.mail_outline, color: Color(0xFF6B7280), size: 20),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: _error != null ? Colors.red.shade300 : const Color(0xFFE5E7EB)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: _error != null ? Colors.red.shade300 : const Color(0xFFE5E7EB)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: _error != null ? Colors.red : const Color(0xFF8B0000)),
            ),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(vertical: 16),
          ),
          onChanged: (_) {
            if (_error != null) setState(() => _error = null);
          },
        ),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              _error!,
              style: GoogleFonts.inter(color: Colors.red, fontSize: 12, fontWeight: FontWeight.bold),
            ),
          ),
        const SizedBox(height: 32),

        // Submit Button
        ElevatedButton(
          onPressed: _isLoading ? null : _handleReset,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF8B0000),
            foregroundColor: Colors.white,
            disabledBackgroundColor: const Color(0xFF8B0000).withOpacity(0.6),
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            elevation: 0,
          ),
          child: _isLoading
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Send Reset Link', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(width: 8),
                    const Icon(Icons.send_outlined, size: 20),
                  ],
                ),
        ),
        const SizedBox(height: 32),

        // Info Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFFFF5F5),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFE5E5),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.shield_outlined, color: Color(0xFF8B0000), size: 20),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  "We'll send password reset instructions\nto your registered email address.",
                  style: GoogleFonts.inter(
                    color: const Color(0xFF4B5563),
                    fontSize: 12,
                    height: 1.5,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 40),

        // Bottom Login Link
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Remember your password? ',
              style: GoogleFonts.inter(color: const Color(0xFF6B7280), fontSize: 13),
            ),
            GestureDetector(
              onTap: () => context.pop(),
              child: Text(
                'Back to Login',
                style: GoogleFonts.inter(
                  color: const Color(0xFF8B0000),
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSuccessView() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const SizedBox(height: 40),
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: Colors.green.shade50,
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.check_circle_outline, color: Colors.green, size: 48),
        ),
        const SizedBox(height: 24),
        Text(
          'Check your inbox',
          style: GoogleFonts.inter(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF1F2937),
          ),
        ),
        const SizedBox(height: 12),
        RichText(
          textAlign: TextAlign.center,
          text: TextSpan(
            style: GoogleFonts.inter(color: const Color(0xFF6B7280), fontSize: 14, height: 1.5),
            children: [
              const TextSpan(text: 'We sent a password reset link to\\n'),
              TextSpan(text: _emailController.text, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1F2937))),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Text(
          "Link expires in 60 minutes. Check your spam folder if you don't see it.",
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(color: const Color(0xFF9CA3AF), fontSize: 13),
        ),
        const SizedBox(height: 40),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () => context.pop(),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFF3F4F6),
              foregroundColor: const Color(0xFF1F2937),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 0,
            ),
            child: Text('Back to Sign In', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold)),
          ),
        ),
        const SizedBox(height: 16),
        TextButton.icon(
          onPressed: () {
            setState(() {
              _isSuccess = false;
              _emailController.clear();
            });
          },
          icon: const Icon(Icons.refresh, size: 16, color: Color(0xFF8B0000)),
          label: Text(
            'Try a different email',
            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF8B0000)),
          ),
        ),
      ],
    );
  }
}
