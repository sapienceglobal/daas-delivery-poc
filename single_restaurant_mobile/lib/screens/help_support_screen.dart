import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';

class HelpSupportScreen extends StatelessWidget {
  const HelpSupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final userName = Provider.of<AuthProvider>(context).user?.name ?? 'User';
    // Get first name
    final firstName = userName.split(' ').first;

    return Scaffold(
      backgroundColor: Colors.white,
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
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            _buildGreetingBanner(firstName),
            const SizedBox(height: 24),
            const Text('Popular Topics', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 16),
            _buildPopularTopics(),
            const SizedBox(height: 32),
            const Text('Help Center', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 16),
            _buildHelpCenterList(),
            const SizedBox(height: 32),
            const Text('Contact Us', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 16),
            _buildContactUsList(),
            const SizedBox(height: 24),
            _buildSatisfactionBanner(),
            const SizedBox(height: 40),
          ],
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

  Widget _buildPopularTopics() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _buildTopicCard(Icons.inventory_2_outlined, 'Order Issues'),
          const SizedBox(width: 12),
          _buildTopicCard(Icons.currency_exchange_outlined, 'Refunds &\nPayments'),
          const SizedBox(width: 12),
          _buildTopicCard(Icons.electric_moped_outlined, 'Delivery\nSupport'),
          const SizedBox(width: 12),
          _buildTopicCard(Icons.person_outline, 'My Account'),
          const SizedBox(width: 12),
          _buildTopicCard(Icons.local_offer_outlined, 'Offers &\nPromotions'),
        ],
      ),
    );
  }

  Widget _buildTopicCard(IconData icon, String title) {
    return Container(
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
    );
  }

  Widget _buildHelpCenterList() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          _buildFaqItem(Icons.inventory_2_outlined, 'How do I track my order?', 'Track your order in real-time from placement to delivery.'),
          const Divider(height: 1, indent: 64),
          _buildFaqItem(Icons.gpp_bad_outlined, 'I received the wrong order', 'What to do if you get the wrong items.'),
          const Divider(height: 1, indent: 64),
          _buildFaqItem(Icons.currency_exchange_outlined, 'How do I request a refund?', 'Learn about our refund and cancellation policy.'),
          const Divider(height: 1, indent: 64),
          _buildFaqItem(Icons.payment_outlined, 'Payment failed but amount deducted?', 'How to get help for payment related issues.'),
          const Divider(height: 1, indent: 64),
          _buildFaqItem(Icons.schedule_outlined, 'How long does delivery take?', 'Estimated delivery time and delays.'),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Text('View All Articles', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 13)),
                SizedBox(width: 4),
                Icon(Icons.chevron_right, color: AppColors.secondary, size: 16),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildFaqItem(IconData icon, String title, String subtitle) {
    return ListTile(
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
      subtitle: Text(subtitle, style: const TextStyle(color: Colors.grey, fontSize: 11)),
      trailing: const Icon(Icons.chevron_right, color: Colors.grey, size: 16),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    );
  }

  Widget _buildContactUsList() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          _buildContactItem(Icons.chat_bubble_outline, 'Live Chat', 'Chat with our support executive', isLiveChat: true),
          const Divider(height: 1, indent: 64),
          _buildContactItem(Icons.phone_outlined, 'Call Us', 'Talk to our support team', trailingText: '+91 98765 43210'),
          const Divider(height: 1, indent: 64),
          _buildContactItem(Icons.email_outlined, 'Email Us', 'Send us an email anytime', trailingText: 'support@lassilounge.com'),
          const Divider(height: 1, indent: 64),
          _buildContactItem(Icons.wechat_outlined, 'WhatsApp Support', 'Message us on WhatsApp', trailingText: '+91 98765 43210'),
        ],
      ),
    );
  }

  Widget _buildContactItem(IconData icon, String title, String subtitle, {bool isLiveChat = false, String? trailingText}) {
    return ListTile(
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
              children: [
                const Text('Your satisfaction is our priority!', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 4),
                const Text('We are committed to resolving your issues quickly.', style: TextStyle(color: Colors.black87, fontSize: 11)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          const Icon(Icons.thumb_up_alt_outlined, color: Colors.green, size: 28),
        ],
      ),
    );
  }
}
