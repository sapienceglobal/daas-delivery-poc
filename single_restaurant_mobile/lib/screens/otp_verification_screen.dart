import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/screens/main_screen.dart';

class OtpVerificationScreen extends StatefulWidget {
  final String phoneNumber;

  const OtpVerificationScreen({super.key, required this.phoneNumber});

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final List<TextEditingController> _controllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  
  Timer? _timer;
  int _start = 58; // Starting from 00:58 as in the UI

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  void _startTimer() {
    _start = 58;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_start == 0) {
        setState(() => timer.cancel());
      } else {
        setState(() => _start--);
      }
    });
  }

  void _onVerify() {
    // Collect all digits
    String otp = _controllers.map((c) => c.text).join();
    
    // UI Validation: We require exactly 6 digits for the UI flow to proceed
    if (otp.length == 6) {
      // Option A: Accept any 6 digit code for now to allow UI progression
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => const MainScreen(initialIndex: 0)),
        (route) => false,
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the complete 6-digit OTP.')),
      );
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
                  // Stylized Background Content
                  Positioned(
                    top: 80,
                    child: Column(
                      children: [
                        const Icon(Icons.workspace_premium, color: Colors.orange, size: 40),
                        const Text('LASSI', style: TextStyle(color: AppColors.secondary, fontSize: 40, fontFamily: 'serif', letterSpacing: 2)),
                        const Text('LOUNGE', style: TextStyle(color: AppColors.secondary, fontSize: 20, fontFamily: 'serif', letterSpacing: 1.5, height: 0.8)),
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
                  // Mobile illustration with speech bubble
                  Positioned(
                    bottom: 0,
                    child: SizedBox(
                      height: 160,
                      width: 250,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          // Fake phone outline
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
                          // Fake screen content (Lock)
                          const Positioned(
                            top: 40,
                            child: Icon(Icons.lock, color: AppColors.secondary, size: 32),
                          ),
                          // Speech bubble
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
                          // Lassi glass (Placeholder icon)
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
                    'Verify Your Mobile Number',
                    style: TextStyle(color: AppColors.secondary, fontSize: 24, fontWeight: FontWeight.bold, fontFamily: 'serif'),
                  ),
                  const SizedBox(height: 16),
                  const Text('We\'ve sent a 6-digit OTP to', style: TextStyle(color: Colors.grey, fontSize: 14)),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(widget.phoneNumber, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: const Text('Change', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 14)),
                      )
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text('Please enter the OTP below to continue.', style: TextStyle(color: Colors.grey, fontSize: 13)),
                  const SizedBox(height: 24),
                  
                  // OTP Inputs
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: List.generate(6, (index) => _buildOtpDigitInput(index)),
                  ),
                  const SizedBox(height: 24),
                  
                  // Security Text
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.verified_user_outlined, color: Colors.green, size: 14),
                      SizedBox(width: 6),
                      Text('Your verification code is secure and will expire soon.', style: TextStyle(color: Colors.grey, fontSize: 11)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  // Countdown Timer
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('OTP expires in ', style: TextStyle(color: Colors.grey, fontSize: 14)),
                      const Icon(Icons.schedule, color: AppColors.secondary, size: 16),
                      const SizedBox(width: 4),
                      Text(
                        '00:${_start.toString().padLeft(2, '0')}',
                        style: const TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  // Resend Text
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('Didn\'t receive the code? ', style: TextStyle(color: Colors.grey, fontSize: 14)),
                      GestureDetector(
                        onTap: _start == 0 ? _startTimer : null, // Allow resend only if timer is 0
                        child: Text(
                          'Resend OTP',
                          style: TextStyle(color: _start == 0 ? AppColors.secondary : Colors.grey, fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                      )
                    ],
                  ),
                  const SizedBox(height: 24),
                  
                  // Verify Button
                  ElevatedButton(
                    onPressed: _onVerify,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.secondary,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      minimumSize: const Size(double.infinity, 50),
                    ),
                    child: const Row(
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
                      color: const Color(0xFFFFF7F0), // Light orange
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
                              Text('Why do we need OTP?', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black87)),
                              SizedBox(height: 4),
                              Text('To verify your identity and keep your\nLassi Lounge account safe and secure.', style: TextStyle(color: Colors.black54, fontSize: 12, height: 1.4)),
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
        maxLength: 1,
        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        decoration: InputDecoration(
          counterText: '',
          contentPadding: EdgeInsets.zero,
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: Colors.grey.shade300),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.secondary),
          ),
        ),
        onChanged: (value) {
          if (value.isNotEmpty) {
            // Move to next field if current is filled
            if (index < 5) {
              _focusNodes[index + 1].requestFocus();
            } else {
              _focusNodes[index].unfocus(); // Auto unfocus on last digit
            }
          } else {
            // Move to previous field if current is empty (backspace pressed)
            if (index > 0) {
              _focusNodes[index - 1].requestFocus();
            }
          }
        },
      ),
    );
  }
}
