import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';
import 'package:url_launcher/url_launcher.dart';

class SupportContactList extends StatelessWidget {
  final String phone;
  final String email;

  const SupportContactList({
    super.key,
    required this.phone,
    required this.email,
  });

  Future<void> _makePhoneCall(BuildContext context, String phoneNumber) async {
    final cleanPhone = phoneNumber.replaceAll(RegExp(r'[^\d+]'), '');
    final Uri launchUri = Uri(
      scheme: 'tel',
      path: cleanPhone,
    );
    try {
      if (await canLaunchUrl(launchUri)) {
        await launchUrl(launchUri);
      } else {
        if (context.mounted) {
          ToastUtils.showInfo(context, 'Could not launch dialer for $phoneNumber');
        }
      }
    } catch (_) {
      if (context.mounted) {
        ToastUtils.showInfo(context, 'Calling $phoneNumber');
      }
    }
  }

  Future<void> _sendEmail(BuildContext context, String emailAddress) async {
    final Uri launchUri = Uri(
      scheme: 'mailto',
      path: emailAddress,
      query: 'subject=Support Inquiry - Lassi Lounge',
    );
    try {
      if (await canLaunchUrl(launchUri)) {
        await launchUrl(launchUri);
      } else {
        if (context.mounted) {
          ToastUtils.showInfo(context, 'Could not open mail client for $emailAddress');
        }
      }
    } catch (_) {
      if (context.mounted) {
        ToastUtils.showInfo(context, 'Emailing $emailAddress');
      }
    }
  }

  Future<void> _openWhatsApp(BuildContext context, String phoneNumber) async {
    final cleanDigits = phoneNumber.replaceAll(RegExp(r'\D'), '');
    final Uri launchUri = Uri.parse('https://wa.me/$cleanDigits');
    try {
      if (await canLaunchUrl(launchUri)) {
        await launchUrl(launchUri, mode: LaunchMode.externalApplication);
      } else {
        if (context.mounted) {
          ToastUtils.showInfo(context, 'WhatsApp not installed or could not open');
        }
      }
    } catch (_) {
      if (context.mounted) {
        ToastUtils.showInfo(context, 'Opening WhatsApp for $phoneNumber');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final displayPhone = phone.trim().isNotEmpty ? phone : '+1 347-233-3733';
    final displayEmail = email.trim().isNotEmpty ? email : 'lassiloungeny@gmail.com';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Contact Us',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
            color: Color(0xFF1F2937),
          ),
        ),
        const SizedBox(height: 12),
        // Row 1: Live Chat & Call Us
        Row(
          children: [
            Expanded(
              child: _buildContactCard(
                context: context,
                icon: Icons.chat_bubble_outline,
                iconBgColor: const Color(0xFFD32F2F),
                title: 'Live Chat',
                isOnline: false,
                badgeText: 'Soon',
                badgeColor: const Color(0xFFE65100),
                badgeBgColor: const Color(0xFFFFF3E0),
                valueText: null,
                subtitle: 'Chat with our support executive',
                onTap: () {
                  ToastUtils.showInfo(
                      context, 'Live Chat is an upcoming feature! Coming soon.');
                },
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildContactCard(
                context: context,
                icon: Icons.phone,
                iconBgColor: const Color(0xFF800A12),
                title: 'Call Us',
                isOnline: false,
                valueText: displayPhone,
                subtitle: 'Talk to our support team',
                onTap: () => _makePhoneCall(context, displayPhone),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        // Row 2: Email Us & WhatsApp Support
        Row(
          children: [
            Expanded(
              child: _buildContactCard(
                context: context,
                icon: Icons.email_outlined,
                iconBgColor: const Color(0xFF3F51B5),
                title: 'Email Us',
                isOnline: false,
                valueText: displayEmail,
                subtitle: 'Send us an email anytime',
                onTap: () => _sendEmail(context, displayEmail),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildContactCard(
                context: context,
                icon: Icons.chat_outlined,
                iconBgColor: const Color(0xFF25D366),
                title: 'WhatsApp Support',
                isOnline: false,
                valueText: displayPhone,
                subtitle: 'Message us on WhatsApp',
                onTap: () => _openWhatsApp(context, displayPhone),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildContactCard({
    required BuildContext context,
    required IconData icon,
    required Color iconBgColor,
    required String title,
    bool isOnline = false,
    String? badgeText,
    Color? badgeColor,
    Color? badgeBgColor,
    required String? valueText,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 84,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
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
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: iconBgColor,
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                color: Colors.white,
                size: 17,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Flexible(
                        child: Text(
                          title,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                            color: Color(0xFF1F2937),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (badgeText != null) ...[
                        const SizedBox(width: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                          decoration: BoxDecoration(
                            color: badgeBgColor ?? const Color(0xFFFFF3E0),
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(
                              color: (badgeColor ?? const Color(0xFFE65100)).withValues(alpha: 0.3),
                              width: 0.8,
                            ),
                          ),
                          child: Text(
                            badgeText,
                            style: TextStyle(
                              color: badgeColor ?? const Color(0xFFE65100),
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ] else if (isOnline) ...[
                        const SizedBox(width: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE8F5E9),
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: const Color(0xFFC8E6C9), width: 0.8),
                          ),
                          child: const Text(
                            'Online',
                            style: TextStyle(
                              color: Color(0xFF2E7D32),
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  if (valueText != null) ...[
                    const SizedBox(height: 1),
                    Text(
                      valueText,
                      style: const TextStyle(
                        color: Color(0xFF800A12),
                        fontWeight: FontWeight.bold,
                        fontSize: 10.5,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 1),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      color: Color(0xFF8A8A8E),
                      fontSize: 9.5,
                      height: 1.15,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 2),
            const Icon(
              Icons.chevron_right,
              color: Color(0xFF800A12),
              size: 16,
            ),
          ],
        ),
      ),
    );
  }
}
