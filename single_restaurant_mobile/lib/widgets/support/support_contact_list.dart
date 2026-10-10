import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
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

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          _buildContactItem(
            Icons.chat_bubble_outline,
            'Live Chat',
            'Chat with our support executive',
            isLiveChat: true,
            onTap: () {
              ToastUtils.showInfo(context, 'Live Chat is an upcoming feature!');
            },
          ),
          const Divider(height: 1, indent: 64),
          _buildContactItem(
            Icons.phone_outlined,
            'Call Us',
            'Talk to our support team',
            trailingText: phone,
            onTap: () async {
              final Uri uri = Uri.parse('tel:$phone');
              if (await canLaunchUrl(uri)) {
                await launchUrl(uri);
              } else {
                if (context.mounted) {
                  ToastUtils.showError(context, 'Could not launch phone app');
                }
              }
            },
          ),
          const Divider(height: 1, indent: 64),
          _buildContactItem(
            Icons.email_outlined,
            'Email Us',
            'Send us an email anytime',
            trailingText: email,
            onTap: () async {
              final Uri uri = Uri.parse('mailto:$email');
              if (await canLaunchUrl(uri)) {
                await launchUrl(uri);
              } else {
                if (context.mounted) {
                  ToastUtils.showError(context, 'Could not launch email app');
                }
              }
            },
          ),
          const Divider(height: 1, indent: 64),
          _buildContactItem(
            Icons.wechat_outlined,
            'WhatsApp Support',
            'Message us on WhatsApp',
            trailingText: phone,
            onTap: () async {
              final cleanPhone = phone.replaceAll(RegExp(r'[^\d+]'), '');
              final Uri uri = Uri.parse('https://wa.me/$cleanPhone');
              if (await canLaunchUrl(uri)) {
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              } else {
                if (context.mounted) {
                  ToastUtils.showError(context, 'Could not launch WhatsApp');
                }
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildContactItem(
    IconData icon,
    String title,
    String subtitle, {
    bool isLiveChat = false,
    String? trailingText,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFFDF7F3),
                shape: BoxShape.circle,
                border: Border.all(
                  color: AppColors.secondary.withValues(alpha: 0.3),
                ),
              ),
              child: Icon(icon, color: AppColors.secondary, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          title,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (isLiveChat) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.green.shade50,
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: Colors.green.shade200),
                          ),
                          child: const Text(
                            'Online',
                            style: TextStyle(
                              color: Colors.green,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(color: Colors.grey, fontSize: 11),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            if (isLiveChat)
              const Icon(Icons.chevron_right,
                  color: AppColors.secondary, size: 16)
            else if (trailingText != null)
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 110),
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    trailingText,
                    style: const TextStyle(
                      color: AppColors.secondary,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
