import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/widgets/common/app_bottom_sheet.dart';

/// Modal bottom sheet presenting bank-grade security, zero raw card storage,
/// cryptographic password/OTP hashing, and privacy guarantees.
class SecurityVerificationSheet extends StatelessWidget {
  const SecurityVerificationSheet({super.key});

  /// Opens the security details bottom sheet.
  static Future<void> show(BuildContext context) {
    return AppBottomSheet.show(
      context: context,
      builder: (ctx) => const SecurityVerificationSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppBottomSheet(
      title: 'Security & Data Protection',
      subtitle: 'Bank-grade encryption & zero raw credential storage',
      trailing: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0xFFF0FDF4),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFBBF7D0)),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.verified_user_rounded,
              color: Color(0xFF16A34A),
              size: 14,
            ),
            SizedBox(width: 4),
            Text(
              'VERIFIED',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w800,
                color: Color(0xFF166534),
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
      ),
      stickyFooter: SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF800A12),
            foregroundColor: Colors.white,
            elevation: 0,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
          onPressed: () => Navigator.pop(context),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.check_circle_outline_rounded, size: 18),
              SizedBox(width: 8),
              Text(
                'Got It, My Data Is Safe',
                style: TextStyle(
                  fontSize: 14.5,
                  fontWeight: FontWeight.bold,
                  letterSpacing: -0.2,
                ),
              ),
            ],
          ),
        ),
      ),
      child: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 6),

            // Top Hero Trust Card
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFF0FDF4), Color(0xFFDCFCE7)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF16A34A).withValues(alpha: 0.15),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Center(
                      child: Icon(
                        Icons.shield_rounded,
                        color: Color(0xFF16A34A),
                        size: 24,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Industry-Standard Security Architecture',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 13.5,
                            color: Color(0xFF166534),
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'We follow strict cybersecurity and privacy guidelines. Your payment information, credentials, and identity are never exposed in plaintext.',
                          style: TextStyle(
                            fontSize: 11.5,
                            color: Color(0xFF374151),
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Feature 1: Zero Card Storage
            _buildSecurityCard(
              icon: Icons.credit_card_off_rounded,
              iconColor: const Color(0xFF800A12),
              iconBgColor: const Color(0xFFFDECEE),
              badgeText: 'PCI-DSS LEVEL 1',
              badgeColor: const Color(0xFF991B1B),
              badgeBgColor: const Color(0xFFFEE2E2),
              title: 'Zero Card Storage Policy',
              subtitle:
                  'We NEVER store, log, or cache your raw Credit or Debit card numbers, CVVs, or ATM pins on any of our servers or databases.\n\nTransactions are tokenized and processed directly by globally certified PCI-DSS Level 1 payment gateways (Stripe / 3D Secure 2.0). Even our engineers cannot see your card numbers.',
            ),

            const SizedBox(height: 12),

            // Feature 2: Passwords Hashed
            _buildSecurityCard(
              icon: Icons.password_rounded,
              iconColor: const Color(0xFF2563EB),
              iconBgColor: const Color(0xFFEFF6FF),
              badgeText: 'ONE-WAY SALTED HASH',
              badgeColor: const Color(0xFF1E40AF),
              badgeBgColor: const Color(0xFFDBEAFE),
              title: 'Cryptographically Hashed Passwords',
              subtitle:
                  'Your account password is protected using one-way cryptographic hashing algorithms combined with unique, random salt strings.\n\nBecause hashing is mathematically irreversible, plaintext passwords never exist on our systems and can never be stolen or leaked in plaintext.',
            ),

            const SizedBox(height: 12),

            // Feature 3: OTP Hashed & Ephemeral
            _buildSecurityCard(
              icon: Icons.mark_email_read_outlined,
              iconColor: const Color(0xFFD97706),
              iconBgColor: const Color(0xFFFFFBEB),
              badgeText: 'ZERO-TRACE OTP',
              badgeColor: const Color(0xFF92400E),
              badgeBgColor: const Color(0xFFFEF3C7),
              title: 'Hashed & Time-Limited OTPs',
              subtitle:
                  'Login and verification OTPs are short-lived, encrypted, and hashed. They automatically expire in minutes to prevent interception.\n\nStrict rate-limiting blocks automated brute-force attacks, and OTP codes self-destruct immediately upon successful authentication.',
            ),

            const SizedBox(height: 12),

            // Feature 4: 256-bit TLS In Transit
            _buildSecurityCard(
              icon: Icons.lock_outline_rounded,
              iconColor: const Color(0xFF16A34A),
              iconBgColor: const Color(0xFFF0FDF4),
              badgeText: 'TLS 1.3 / AES-256',
              badgeColor: const Color(0xFF166534),
              badgeBgColor: const Color(0xFFDCFCE7),
              title: '256-Bit SSL/TLS Encryption In-Transit',
              subtitle:
                  'Every request between your device and our servers travels over bank-grade encrypted HTTPS/TLS 1.3 tunnels.\n\nThis shields your delivery address, live coordinates, and order activity from eavesdropping or tampering on public Wi-Fi networks.',
            ),

            const SizedBox(height: 12),

            // Feature 5: Session Integrity & JWT
            _buildSecurityCard(
              icon: Icons.security_rounded,
              iconColor: const Color(0xFF7C3AED),
              iconBgColor: const Color(0xFFF5F3FF),
              badgeText: 'CRYPTOGRAPHIC JWT',
              badgeColor: const Color(0xFF5B21B6),
              badgeBgColor: const Color(0xFFEDE9FE),
              title: 'Secure Session & Fraud Detection',
              subtitle:
                  'Sessions utilize signed, ephemeral JWT tokens with automatic expiry and active anomaly monitoring, ensuring full account integrity and instant remote revocation.',
            ),

            const SizedBox(height: 16),

            // Trust Badges Grid
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFFF9FAFB),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              child: Column(
                children: [
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.lock_person_outlined, size: 14, color: Color(0xFF4B5563)),
                      SizedBox(width: 6),
                      Text(
                        '100% Privacy Guarantee',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF1F2937),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'We never sell, trade, or share your personal contact details, saved addresses, or purchase history with third-party advertising brokers.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 11,
                      color: Color(0xFF6B7280),
                      height: 1.35,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    alignment: WrapAlignment.center,
                    children: [
                      _buildMiniBadge('PCI-DSS Level 1'),
                      _buildMiniBadge('256-Bit SSL'),
                      _buildMiniBadge('Zero Plaintext'),
                      _buildMiniBadge('Encrypted Storage'),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 14),
          ],
        ),
      ),
    );
  }

  Widget _buildSecurityCard({
    required IconData icon,
    required Color iconColor,
    required Color iconBgColor,
    required String badgeText,
    required Color badgeColor,
    required Color badgeBgColor,
    required String title,
    required String subtitle,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1E5E5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: iconBgColor,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Icon(icon, color: iconColor, size: 19),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13.5,
                    color: Color(0xFF1F2937),
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: badgeBgColor,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  badgeText,
                  style: TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w800,
                    color: badgeColor,
                    letterSpacing: 0.3,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            subtitle,
            style: const TextStyle(
              fontSize: 11.5,
              color: Color(0xFF4B5563),
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMiniBadge(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const Color(0xFFD1D5DB)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.check, size: 11, color: Color(0xFF16A34A)),
          const SizedBox(width: 4),
          Text(
            text,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: Color(0xFF374151),
            ),
          ),
        ],
      ),
    );
  }
}
