import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/address_provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/loyalty_provider.dart';
import 'package:single_restaurant_mobile/providers/notification_provider.dart';
import 'package:single_restaurant_mobile/screens/main_screen.dart';
import 'package:single_restaurant_mobile/services/auth_service.dart';
import 'package:single_restaurant_mobile/theme/app_responsive.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';
import 'package:single_restaurant_mobile/widgets/auth/otp_form_content.dart';
import 'package:single_restaurant_mobile/widgets/auth/otp_header.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';

class OtpVerificationScreen extends StatefulWidget {
  final String email;

  const OtpVerificationScreen({super.key, required this.email});

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final List<TextEditingController> _controllers =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  final _authService = AuthService();

  bool _isLoading = false;
  bool _isResending = false;
  String? _errorMessage;

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
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        child: Column(
          children: [
            const OtpHeader(),
            ResponsiveCenter(
              maxWidth: AppResponsive.maxFormWidth,
              padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
              child: OtpFormContent(
                email: widget.email,
                onChangeEmail: () => Navigator.pop(context),
                errorMessage: _errorMessage,
                controllers: _controllers,
                focusNodes: _focusNodes,
                onDigitChanged: _handleDigitChange,
                resendSecondsLeft: _resendSecondsLeft,
                isResending: _isResending,
                onResend: _onResend,
                isLoading: _isLoading,
                onVerify: _onVerify,
              ),
            ),
          ],
        ),
      ),
    );
  }
}