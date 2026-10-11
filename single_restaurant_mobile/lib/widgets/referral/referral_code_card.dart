import 'package:flutter/material.dart';

/// Interactive Referral Code Box with Copy button, Share button,
/// and Social Sharing options matching reference design.
class ReferralCodeCard extends StatelessWidget {
  final String referralCode;
  final VoidCallback onCopyCode;
  final VoidCallback onShareCode;
  final VoidCallback onShareWhatsApp;
  final VoidCallback onShareSMS;
  final VoidCallback onShareInstagram;
  final VoidCallback onCopyLink;
  final VoidCallback onShareMore;

  const ReferralCodeCard({
    super.key,
    required this.referralCode,
    required this.onCopyCode,
    required this.onShareCode,
    required this.onShareWhatsApp,
    required this.onShareSMS,
    required this.onShareInstagram,
    required this.onCopyLink,
    required this.onShareMore,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Your Referral Code',
            style: TextStyle(
              fontSize: 15.5,
              fontWeight: FontWeight.bold,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 3),
          const Text(
            'Share your unique code with friends and family.',
            style: TextStyle(
              fontSize: 12,
              color: Color(0xFF6B7280),
            ),
          ),
          const SizedBox(height: 12),

          // Code display + Copy button
          Container(
            padding: const EdgeInsets.only(left: 16, top: 4, bottom: 4, right: 4),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE5E7EB), width: 1.2),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    referralCode,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2.2,
                      color: Color(0xFF5A1015),
                    ),
                  ),
                ),
                InkWell(
                  onTap: onCopyCode,
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 18, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF7B1113),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.copy_rounded, color: Colors.white, size: 18),
                        SizedBox(height: 2),
                        Text(
                          'Copy',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Pill "Share Referral Code" Button
          InkWell(
            onTap: onShareCode,
            borderRadius: BorderRadius.circular(24),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF7B1113),
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.share_outlined, color: Colors.white, size: 18),
                  SizedBox(width: 8),
                  Text(
                    'Share Referral Code',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14.5,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 18),

          // 5 Social share action icons row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildSocialAction(
                label: 'WhatsApp',
                background: const Color(0xFF25D366),
                icon: Icons.chat,
                iconColor: Colors.white,
                onTap: onShareWhatsApp,
              ),
              _buildSocialAction(
                label: 'Messages',
                background: const Color(0xFF2563EB),
                icon: Icons.sms_outlined,
                iconColor: Colors.white,
                onTap: onShareSMS,
              ),
              _buildSocialAction(
                label: 'Instagram',
                gradient: const LinearGradient(
                  colors: [
                    Color(0xFFF58529),
                    Color(0xFFDD2A7B),
                    Color(0xFF8134AF),
                  ],
                  begin: Alignment.bottomLeft,
                  end: Alignment.topRight,
                ),
                icon: Icons.camera_alt_outlined,
                iconColor: Colors.white,
                onTap: onShareInstagram,
              ),
              _buildSocialAction(
                label: 'Copy Link',
                background: const Color(0xFFF3F4F6),
                icon: Icons.link,
                iconColor: const Color(0xFF374151),
                onTap: onCopyLink,
              ),
              _buildSocialAction(
                label: 'More',
                background: const Color(0xFFF3F4F6),
                icon: Icons.more_horiz,
                iconColor: const Color(0xFF374151),
                onTap: onShareMore,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSocialAction({
    required String label,
    Color? background,
    Gradient? gradient,
    required IconData icon,
    required Color iconColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(30),
      child: Column(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: background,
              gradient: gradient,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: Color(0xFF374151),
            ),
          ),
        ],
      ),
    );
  }
}
