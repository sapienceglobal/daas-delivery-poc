import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class Security2FAScreen extends StatefulWidget {
  final bool embedded;
  const Security2FAScreen({Key? key, this.embedded = false}) : super(key: key);

  @override
  State<Security2FAScreen> createState() => _Security2FAScreenState();
}

class _Security2FAScreenState extends State<Security2FAScreen> {
  bool _isLoading = false;
  bool _isSettingUp = false;
  String? _secret;
  String? _qrCodeBase64;
  final _enableCodeController = TextEditingController();
  final _disableCodeController = TextEditingController();
  String? _errorMessage;

  @override
  void dispose() {
    _enableCodeController.dispose();
    _disableCodeController.dispose();
    super.dispose();
  }

  Future<void> _start2FASetup() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final authProvider = context.read<AuthProvider>();
      final data = await authProvider.generate2FA();
      final secret = data['secret'] as String?;
      final qrUrl = data['qrCodeUrl'] as String?;

      String? base64Str;
      if (qrUrl != null && qrUrl.contains(',')) {
        base64Str = qrUrl.split(',')[1];
      }

      setState(() {
        _isSettingUp = true;
        _secret = secret;
        _qrCodeBase64 = base64Str;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString().replaceAll('Exception: ', '').replaceAll('HttpException: ', '');
      });
    }
  }

  Future<void> _confirmEnable2FA() async {
    final code = _enableCodeController.text.trim();
    if (code.length != 6) {
      setState(() => _errorMessage = 'Please enter the 6-digit code from your authenticator app');
      return;
    }

    if (_secret == null) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final authProvider = context.read<AuthProvider>();
      await authProvider.enable2FA(_secret!, code);

      if (mounted) {
        setState(() {
          _isSettingUp = false;
          _secret = null;
          _qrCodeBase64 = null;
          _enableCodeController.clear();
          _isLoading = false;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Two-Factor Authentication enabled successfully!'),
            backgroundColor: Color(0xFF16A34A),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = e.toString().replaceAll('Exception: ', '').replaceAll('HttpException: ', '');
        });
      }
    }
  }

  void _showDisable2FADialog() {
    _disableCodeController.clear();
    String? dialogError;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          child: Padding(
            padding: const EdgeInsets.all(22),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.lock_open_rounded, color: Colors.red.shade700, size: 32),
                ),
                const SizedBox(height: 16),
                Text(
                  'Disable 2FA',
                  style: GoogleFonts.outfit(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Enter the current 6-digit code from your authenticator app to confirm disabling Two-Factor Authentication.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: const Color(0xFF64748B),
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 18),
                TextField(
                  controller: _disableCodeController,
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  maxLength: 6,
                  autofocus: true,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(6),
                  ],
                  style: GoogleFonts.robotoMono(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 8,
                    color: const Color(0xFF0F172A),
                  ),
                  decoration: InputDecoration(
                    counterText: '',
                    hintText: '••••••',
                    hintStyle: TextStyle(color: Colors.grey.shade400, letterSpacing: 8),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    contentPadding: const EdgeInsets.symmetric(vertical: 14),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFDC2626), width: 2),
                    ),
                  ),
                ),
                if (dialogError != null) ...[
                  const SizedBox(height: 10),
                  Text(
                    dialogError!,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(fontSize: 12, color: Colors.red.shade700, fontWeight: FontWeight.w600),
                  ),
                ],
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.of(ctx).pop(),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text('Cancel', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.grey.shade700)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () async {
                          final code = _disableCodeController.text.trim();
                          if (code.length != 6) {
                            setDialogState(() => dialogError = 'Please enter 6 digits');
                            return;
                          }
                          try {
                            final nav = Navigator.of(ctx);
                            final messenger = ScaffoldMessenger.of(context);
                            final authProvider = context.read<AuthProvider>();
                            await authProvider.disable2FA(code);
                            nav.pop();
                            messenger.showSnackBar(
                              const SnackBar(
                                content: Text('Two-Factor Authentication disabled.'),
                                backgroundColor: Color(0xFF64748B),
                              ),
                            );
                          } catch (e) {
                            setDialogState(() {
                              dialogError = e.toString().replaceAll('Exception: ', '').replaceAll('HttpException: ', '');
                            });
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFDC2626),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text('Disable', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final is2FAEnabled = authProvider.user?['isTwoFactorEnabled'] == true;

    final content = SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Status Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 10,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: is2FAEnabled ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      is2FAEnabled ? Icons.verified_user_rounded : Icons.shield_outlined,
                      color: is2FAEnabled ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                      size: 34,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    is2FAEnabled ? '2FA is Active' : '2FA is Disabled',
                    style: GoogleFonts.outfit(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: is2FAEnabled ? const Color(0xFFECFDF5) : const Color(0xFFFFFBEB),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: is2FAEnabled ? const Color(0xFFA7F3D0) : const Color(0xFFFDE68A),
                      ),
                    ),
                    child: Text(
                      is2FAEnabled ? 'PROTECTED ACCOUNT' : 'SECURITY RECOMMENDED',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.5,
                        color: is2FAEnabled ? const Color(0xFF065F46) : const Color(0xFF92400E),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    is2FAEnabled
                        ? 'Your account requires a 6-digit code from your authenticator app (Google Authenticator, Authy) whenever you log in.'
                        : 'Add an extra layer of protection to your restaurant management account. When enabled, logging in will require your password and an authenticator app code.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      color: const Color(0xFF64748B),
                      height: 1.45,
                    ),
                  ),
                  const SizedBox(height: 20),
                  if (is2FAEnabled)
                    OutlinedButton.icon(
                      onPressed: _showDisable2FADialog,
                      icon: const Icon(Icons.lock_open_rounded, size: 18),
                      label: const Text('Disable 2FA'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFFDC2626),
                        side: const BorderSide(color: Color(0xFFFCA5A5)),
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    )
                  else if (!_isSettingUp)
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton.icon(
                        onPressed: _isLoading ? null : _start2FASetup,
                        icon: _isLoading
                            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Icon(Icons.qr_code_rounded, size: 20),
                        label: Text(_isLoading ? 'Generating Setup...' : 'Setup Two-Factor Authentication'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF991B1B),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          textStyle: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            if (_errorMessage != null) ...[
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error_outline_rounded, color: Colors.red.shade700, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: GoogleFonts.inter(fontSize: 12, color: Colors.red.shade700, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            // Setup Wizard (When user taps Setup 2FA)
            if (_isSettingUp && !is2FAEnabled) ...[
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Step 1: Scan QR Code',
                      style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Open Google Authenticator, Microsoft Authenticator, or Authy on your phone and scan the QR code below:',
                      style: GoogleFonts.inter(fontSize: 12.5, color: const Color(0xFF64748B), height: 1.4),
                    ),
                    const SizedBox(height: 16),
                    if (_qrCodeBase64 != null)
                      Center(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                            boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 3))],
                          ),
                          child: Image.memory(
                            base64Decode(_qrCodeBase64!),
                            width: 180,
                            height: 180,
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                    const SizedBox(height: 16),
                    if (_secret != null) ...[
                      Text(
                        'Or enter code manually:',
                        style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF64748B)),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                _secret!,
                                style: GoogleFonts.robotoMono(fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 1.5, color: const Color(0xFF0F172A)),
                              ),
                            ),
                            IconButton(
                              onPressed: () {
                                Clipboard.setData(ClipboardData(text: _secret!));
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Secret key copied to clipboard!')),
                                );
                              },
                              icon: const Icon(Icons.copy_rounded, size: 18, color: Color(0xFF2563EB)),
                              tooltip: 'Copy Key',
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 24),
                    Text(
                      'Step 2: Enter Verification Code',
                      style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Enter the 6-digit code shown in your authenticator app to verify setup:',
                      style: GoogleFonts.inter(fontSize: 12.5, color: const Color(0xFF64748B)),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _enableCodeController,
                      keyboardType: TextInputType.number,
                      textAlign: TextAlign.center,
                      maxLength: 6,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(6),
                      ],
                      style: GoogleFonts.robotoMono(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 8,
                        color: const Color(0xFF0F172A),
                      ),
                      decoration: InputDecoration(
                        counterText: '',
                        hintText: '••••••',
                        hintStyle: TextStyle(color: Colors.grey.shade400, letterSpacing: 8),
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        contentPadding: const EdgeInsets.symmetric(vertical: 14),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFF991B1B), width: 2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      height: 48,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _confirmEnable2FA,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF16A34A),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          textStyle: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        child: _isLoading
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Text('Verify & Enable 2FA'),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () => setState(() => _isSettingUp = false),
                      child: Text('Cancel Setup', style: GoogleFonts.inter(color: const Color(0xFF64748B), fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      );

    if (widget.embedded) {
      return content;
    }

    return Scaffold(
      backgroundColor: const Color(0xFFFAF7F2),
      appBar: AppBar(
        title: Text(
          'Security & 2FA',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0,
        centerTitle: true,
      ),
      body: content,
    );
  }
}
