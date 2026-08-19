import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';
import 'package:url_launcher/url_launcher.dart';

class HelpSupportScreen extends StatelessWidget {
  const HelpSupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final userName = Provider.of<AuthProvider>(context).user?.name ?? 'User';
    // Get first name
    final firstName = userName.split(' ').first;

    return Scaffold(
      backgroundColor: const Color(0xFFFCF9F2),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.secondary),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Help & Support',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              _buildGreetingBanner(firstName),
              const SizedBox(height: 24),
              const Text('Popular Topics', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 16),
              _buildPopularTopics(context),
              const SizedBox(height: 32),
              const Text('Help Center', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 16),
              _buildHelpCenterList(context),
              const SizedBox(height: 32),
              const Text('Contact Us', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 16),
              _buildContactUsList(context),
              const SizedBox(height: 24),
              _buildSatisfactionBanner(),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGreetingBanner(String firstName) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7F0), // Light beige
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 6,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Hi $firstName! 👋',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                ),
                const SizedBox(height: 8),
                const Text(
                  'How can we help you today?',
                  style: TextStyle(color: Color(0xFF3B5998), fontSize: 13, fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 4),
                Text(
                  'We\'re here to assist you 24/7.',
                  style: TextStyle(color: Colors.grey.shade700, fontSize: 12),
                ),
              ],
            ),
          ),
          Expanded(
            flex: 4,
            child: Stack(
              alignment: Alignment.center,
              children: [
                Icon(Icons.headset_mic, size: 64, color: AppColors.secondary.withOpacity(0.8)),
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: const BoxDecoration(
                      color: AppColors.secondary,
                      shape: BoxShape.circle,
                    ),
                    child: const Text('?', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                )
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildPopularTopics(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _buildTopicCard(context, Icons.inventory_2_outlined, 'Order Issues'),
          const SizedBox(width: 12),
          _buildTopicCard(context, Icons.currency_exchange_outlined, 'Refunds &\nPayments'),
          const SizedBox(width: 12),
          _buildTopicCard(context, Icons.electric_moped_outlined, 'Delivery\nSupport'),
          const SizedBox(width: 12),
          _buildTopicCard(context, Icons.person_outline, 'My Account'),
          const SizedBox(width: 12),
          _buildTopicCard(context, Icons.local_offer_outlined, 'Offers &\nPromotions'),
        ],
      ),
    );
  }

  Widget _buildTopicCard(BuildContext context, IconData icon, String title) {
    return GestureDetector(
      onTap: () {
        _showTopicBottomSheet(context, title.replaceAll('\n', ' '));
      },
      child: Container(
        width: 90,
        height: 90,
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: AppColors.secondary, size: 28),
            const SizedBox(height: 8),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHelpCenterList(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          _buildFaqItem(context, Icons.inventory_2_outlined, 'How do I track my order?', 'You can track your order in real-time from the "My Orders" section in the app. Just click on your active order to see the live status.'),
          const Divider(height: 1, indent: 64),
          _buildFaqItem(context, Icons.gpp_bad_outlined, 'I received the wrong order', 'We apologize for the inconvenience. Please contact our support team immediately using the live chat or call option below with your order ID.'),
          const Divider(height: 1, indent: 64),
          _buildFaqItem(context, Icons.currency_exchange_outlined, 'How do I request a refund?', 'If you cancel your order before the restaurant accepts it, a refund is automatically initiated and processed within 3-5 business days.'),
          const Divider(height: 1, indent: 64),
          _buildFaqItem(context, Icons.payment_outlined, 'Payment failed but amount deducted?', 'Don\'t worry! Failed transactions are automatically refunded by your bank within 48-72 hours. If it takes longer, please contact your bank.'),
          const Divider(height: 1, indent: 64),
          _buildFaqItem(context, Icons.schedule_outlined, 'How long does delivery take?', 'Delivery typically takes 30-45 minutes depending on your location and restaurant preparation time. You can see the estimated time before placing the order.'),
        ],
      ),
    );
  }

  Widget _buildFaqItem(BuildContext context, IconData icon, String title, String answer) {
    return Theme(
      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: const Color(0xFFFDF7F3),
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.secondary.withOpacity(0.3)),
          ),
          child: Icon(icon, color: AppColors.secondary, size: 18),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
        childrenPadding: const EdgeInsets.only(left: 72, right: 16, bottom: 16),
        children: [
          Text(answer, style: const TextStyle(color: Colors.grey, fontSize: 12, height: 1.5))
        ],
      ),
    );
  }

  Widget _buildContactUsList(BuildContext context) {
    final restaurant = Provider.of<RestaurantProvider>(context).restaurant;
    final phone = restaurant?['phone'] as String? ?? '+1 347-233-3733';
    final email = restaurant?['email'] as String? ?? 'lassiloungeny@gmail.com';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          _buildContactItem(Icons.chat_bubble_outline, 'Live Chat', 'Chat with our support executive', isLiveChat: true, onTap: () {
            ToastUtils.showInfo(context, 'Live Chat is an upcoming feature!');
          }),
          const Divider(height: 1, indent: 64),
          _buildContactItem(Icons.phone_outlined, 'Call Us', 'Talk to our support team', trailingText: phone, onTap: () async {
            final Uri uri = Uri.parse('tel:$phone');
            if (await canLaunchUrl(uri)) {
              await launchUrl(uri);
            } else {
              ToastUtils.showError(context, 'Could not launch phone app');
            }
          }),
          const Divider(height: 1, indent: 64),
          _buildContactItem(Icons.email_outlined, 'Email Us', 'Send us an email anytime', trailingText: email, onTap: () async {
            final Uri uri = Uri.parse('mailto:$email');
            if (await canLaunchUrl(uri)) {
              await launchUrl(uri);
            } else {
              ToastUtils.showError(context, 'Could not launch email app');
            }
          }),
          const Divider(height: 1, indent: 64),
          _buildContactItem(Icons.wechat_outlined, 'WhatsApp Support', 'Message us on WhatsApp', trailingText: phone, onTap: () async {
            final cleanPhone = phone.replaceAll(RegExp(r'[^\d+]'), '');
            final Uri uri = Uri.parse('https://wa.me/$cleanPhone');
            if (await canLaunchUrl(uri)) {
              await launchUrl(uri, mode: LaunchMode.externalApplication);
            } else {
              ToastUtils.showError(context, 'Could not launch WhatsApp');
            }
          }),
        ],
      ),
    );
  }

  Widget _buildContactItem(IconData icon, String title, String subtitle, {bool isLiveChat = false, String? trailingText, VoidCallback? onTap}) {
    return ListTile(
      onTap: onTap,
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: const Color(0xFFFDF7F3),
          shape: BoxShape.circle,
          border: Border.all(color: AppColors.secondary.withOpacity(0.3)),
        ),
        child: Icon(icon, color: AppColors.secondary, size: 18),
      ),
      title: Row(
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          if (isLiveChat) ...[
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: Colors.green.shade200),
              ),
              child: const Text('Online', style: TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold)),
            )
          ]
        ],
      ),
      subtitle: Text(subtitle, style: const TextStyle(color: Colors.grey, fontSize: 11)),
      trailing: isLiveChat
          ? const Icon(Icons.chevron_right, color: AppColors.secondary, size: 16)
          : Text(trailingText ?? '', style: const TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 12)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    );
  }

  Widget _buildSatisfactionBanner() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF2F9F2), // Light green
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.green.shade200),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.green.shade300),
            ),
            child: const Icon(Icons.verified_user_outlined, color: Colors.green, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('100% Secure & Verified', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                SizedBox(height: 4),
                Text('Your data and payments are completely safe with us.', style: TextStyle(color: Colors.grey, fontSize: 11, height: 1.4)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          const Icon(Icons.thumb_up_alt_outlined, color: Colors.green, size: 28),
        ],
      ),
    );
  }

  void _showTopicBottomSheet(BuildContext context, String title) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Drag handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 24),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1A1A1A),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF9FAFB),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Column(
                  children: [
                    _buildBottomSheetFaq('Why is this important?', 'Understanding $title helps you get the most out of our platform without needing to contact support directly.'),
                    const Divider(height: 1, indent: 16, endIndent: 16),
                    _buildBottomSheetFaq('Where can I find more details?', 'You can find comprehensive guides in our Help Center or by starting a live chat with our support team.'),
                    const Divider(height: 1, indent: 16, endIndent: 16),
                    _buildBottomSheetFaq('Need immediate assistance?', 'Please use the "Call Us" option below for urgent issues regarding $title.'),
                  ],
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        );
      },
    );
  }

  Widget _buildBottomSheetFaq(String question, String answer) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.help_outline, size: 16, color: AppColors.secondary),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  question,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: Color(0xFF1A1A1A),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.only(left: 24),
            child: Text(
              answer,
              style: TextStyle(
                fontSize: 13,
                color: Colors.grey.shade600,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
