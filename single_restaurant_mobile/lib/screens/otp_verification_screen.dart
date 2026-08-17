import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/screens/main_screen.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/address_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/loyalty_provider.dart';
import 'package:single_restaurant_mobile/providers/notification_provider.dart';
import 'package:single_restaurant_mobile/services/auth_service.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';

class OtpVerificationScreen extends StatefulWidget {
  final String email;

  const OtpVerificationScreen({super.key, required this.email});

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final List<TextEditingController> _controllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  final _authService = AuthService();

  bool _isLoading = false;
  bool _isResending = false;
  String? _errorMessage;

  // This is ONLY the "resend" cooldown, not the OTP's actual validity
  // window. The previous version reused this single 60s timer as if it
  // were the OTP expiry too, which is why the UI said the code expires
  // in under a minute when the backend actually allows 10 minutes.
  // The real expiry is communicated as static text below instead of a
  // live countdown, since the backend is the source of truth for it.
  Timer? _resendTimer;
  int _resendSecondsLeft = 60;

  @override
  void initState() {
    super.initState();
    _startResendTimer();
  }

  @override
  void dispose() {
    _resendTimer?.cancel();
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  void _startResendTimer() {
    _resendSecondsLeft = 60;
    _resendTimer?.cancel();
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_resendSecondsLeft == 0) {
        setState(() => timer.cancel());
      } else {
        setState(() => _resendSecondsLeft--);
      }
    });
  }

  void _clearOtpFields() {
    for (var c in _controllers) {
      c.clear();
    }
    _focusNodes[0].requestFocus();
  }

  Future<void> _onVerify() async {
    final otp = _controllers.map((c) => c.text).join();

    if (otp.length < 6) {
      setState(() => _errorMessage = 'Please enter the complete 6-digit code.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final errorMsg = await _authService.verifyOtp(
      email: widget.email,
      otp: otp,
    );

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (errorMsg == null) {
      // Load all user-specific providers freshly for the new account
      context.read<AuthProvider>().fetchUser();
      context.read<AddressProvider>().fetchAddresses();
      context.read<CartProvider>().loadCart();
      context.read<LoyaltyProvider>().fetchHistory();
      context.read<NotificationProvider>().fetchNotifications();
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => const MainScreen(initialIndex: 0)),
        (route) => false,
      );
    } else {
      // Wrong / expired OTP: show it inline, clear the boxes, and put
      // focus back on the first one — never navigate forward here.
      // NOTE: this screen only trusts `errorMsg == null` as success, so
      // if wrong codes are still getting people registered, the bug is
      // inside `auth_service.dart` / the backend `verify-otp` endpoint
      // returning null when it shouldn't — not in this file.
      setState(() => _errorMessage = errorMsg);
      _clearOtpFields();
    }
  }

  Future<void> _onResend() async {
    setState(() {
      _isResending = true;
      _errorMessage = null;
    });
    final errorMsg = await _authService.resendOtp(email: widget.email);
    if (!mounted) return;
    setState(() => _isResending = false);

    if (errorMsg == null) {
      _clearOtpFields();
      _startResendTimer();
      ToastUtils.showInfo(context, 'A new code has been sent to your email.');
    } else {
      setState(() => _errorMessage = errorMsg);
    }
  }

  void _handleDigitChange(int index, String rawValue) {
    if (_errorMessage != null) {
      setState(() => _errorMessage = null);
    }

    // Pasting a full 6-digit code into any box lands here with more
    // than one character — distribute it across the remaining boxes
    // instead of only keeping the first digit (previous behaviour,
    // since `maxLength: 1` silently truncated pasted codes).
    if (rawValue.length > 1) {
      final digits = rawValue.split('');
      for (int i = 0; i < digits.length && (index + i) < 6; i++) {
        _controllers[index + i].text = digits[i];
      }
      final lastFilledIndex = (index + digits.length - 1).clamp(0, 5);
      _focusNodes[lastFilledIndex].requestFocus();
      if (_controllers.every((c) => c.text.isNotEmpty)) {
        FocusScope.of(context).unfocus();
        _onVerify();
      }
      return;
    }

    if (rawValue.isNotEmpty) {
      if (index < 5) {
        _focusNodes[index + 1].requestFocus();
      } else {
        _focusNodes[index].unfocus();
        if (_controllers.every((c) => c.text.isNotEmpty)) {
          _onVerify();
        }
      }
    } else {
      if (index > 0) {
        _focusNodes[index - 1].requestFocus();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
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
                  colors: [Color(0xFFFFF9F2), Colors.white],
                ),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
              Positioned(
                    top: 70, 
                    child: Column(
                      children: [
                        // 1. Aapka Lassi Lounge Logo
                        Image.asset(
                          'assets/images/branded/lassi-lounge/Lassi-Lounge-logo.png',
                          height: 120, // Height thodi 100 rakhi hai taaki niche text aaram se fit ho
                          fit: BoxFit.contain,
                          errorBuilder: (c, e, s) => const Text(
                            'LASSI LOUNGE',
                            style: TextStyle(
                              color: AppColors.primary,
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        
                        const SizedBox(height: 0), // Logo aur text ke beech ka gap

                        // 2. Premium 'Indian Restaurant' tag
                        const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.spa, color: Colors.orange, size: 12),
                            SizedBox(width: 8),
                            Text(
                              'INDIAN RESTAURANT', 
                              style: TextStyle(
                                color: Colors.orange, 
                                fontSize: 10, 
                                letterSpacing: 1.2, 
                                fontWeight: FontWeight.bold
                              ),
                            ),
                            SizedBox(width: 8),
                            Icon(Icons.spa, color: Colors.orange, size: 12),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    child: SizedBox(
                      height: 160,
                      width: 250,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Container(
                            width: 90,
                            height: 150,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Colors.orange.shade200, width: 3),
                              boxShadow: [BoxShadow(color: Colors.orange.withOpacity(0.2), blurRadius: 20, spreadRadius: 5)],
                            ),
                          ),
                          const Positioned(
                            top: 40,
                            // Mail icon instead of a lock — the code is
                            // sent to email, not used to unlock the phone.
                            child: Icon(Icons.mark_email_read_outlined, color: AppColors.secondary, size: 32),
                          ),
                          Positioned(
                            bottom: 20,
                            right: 10,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFF7F0),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.orange.shade200),
                                boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))],
                              ),
                              child: const Text('123456', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 18, letterSpacing: 2)),
                            ),
                          ),
                          Positioned(
                            bottom: 10,
                            left: 10,
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
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  const Text(
                    'Verify Your Email Address',
                    style: TextStyle(color: AppColors.secondary, fontSize: 24, fontWeight: FontWeight.bold, fontFamily: 'serif'),
                  ),
                  const SizedBox(height: 16),
                  const Text('We\'ve sent a 6-digit verification code to', style: TextStyle(color: Colors.grey, fontSize: 14)),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(widget.email, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: const Text('Change', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 14)),
                      )
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text('Please check your inbox (and spam folder) for the code.', style: TextStyle(color: Colors.grey, fontSize: 13)),
                  const SizedBox(height: 24),

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
                              style: TextStyle(color: Colors.red.shade700, fontSize: 12.5, fontWeight: FontWeight.w600, height: 1.3),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // OTP Inputs
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: List.generate(6, (index) => _buildOtpDigitInput(index)),
                  ),
                  const SizedBox(height: 24),

                  // Static expiry info — matches the backend's real
                  // 10-minute window instead of a fake live countdown.
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.verified_user_outlined, color: Colors.green, size: 14),
                      SizedBox(width: 6),
                      Text('This code will expire in 10 minutes.', style: TextStyle(color: Colors.grey, fontSize: 11)),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Resend cooldown
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('Didn\'t receive the code? ', style: TextStyle(color: Colors.grey, fontSize: 14)),
                      if (_resendSecondsLeft == 0)
                        GestureDetector(
                          onTap: _isResending ? null : _onResend,
                          child: _isResending
                              ? const SizedBox(
                                  height: 14,
                                  width: 14,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.secondary),
                                )
                              : const Text(
                                  'Resend OTP',
                                  style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 14),
                                ),
                        )
                      else
                        Text(
                          'Resend in 00:${_resendSecondsLeft.toString().padLeft(2, '0')}',
                          style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Verify Button
                  ElevatedButton(
                    onPressed: _isLoading ? null : _onVerify,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.secondary,
                      foregroundColor: Colors.white,
                     
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                     
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text('Verify & Continue', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                              SizedBox(width: 8),
                              Icon(Icons.arrow_forward, color: Colors.white, size: 20),
                            ],
                          ),
                  ),
                  const SizedBox(height: 24),

                  // Info Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF7F0),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.orange.shade100),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.chat_bubble_outline, color: AppColors.secondary, size: 32),
                        SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Why do we need this code?', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black87)),
                              SizedBox(height: 4),
                              Text('To confirm this email is really yours and keep your\nLassi Lounge account safe and secure.', style: TextStyle(color: Colors.black54, fontSize: 12, height: 1.4)),
                            ],
                          ),
                        )
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Footer
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.lock_outline, color: Colors.grey, size: 14),
                      const SizedBox(width: 4),
                      const Text('Secure Connection', style: TextStyle(color: Colors.grey, fontSize: 11)),
                      Container(height: 12, width: 1, color: Colors.grey, margin: const EdgeInsets.symmetric(horizontal: 8)),
                      const Text('Powered by Lassi Lounge', style: TextStyle(color: Colors.grey, fontSize: 11)),
                    ],
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildOtpDigitInput(int index) {
    return SizedBox(
      width: 45,
      height: 55,
      child: TextFormField(
        controller: _controllers[index],
        focusNode: _focusNodes[index],
        keyboardType: TextInputType.number,
        textAlign: TextAlign.center,
        // No `maxLength: 1` here on purpose — that formatter silently
        // truncated pasted 6-digit codes down to a single character
        // before onChanged ever saw them. Length is handled manually
        // in `_handleDigitChange` instead, which also enables paste.
        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        decoration: InputDecoration(
          counterText: '',
          contentPadding: EdgeInsets.zero,
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(
              color: _errorMessage != null ? Colors.red.shade300 : Colors.grey.shade300,
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.secondary),
          ),
        ),
        onChanged: (value) => _handleDigitChange(index, value),
      ),
    );
  }
}