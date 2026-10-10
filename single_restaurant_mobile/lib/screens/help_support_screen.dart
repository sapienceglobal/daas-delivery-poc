import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';
import 'package:single_restaurant_mobile/widgets/support/support_contact_list.dart';
import 'package:single_restaurant_mobile/widgets/support/support_faq_list.dart';
import 'package:single_restaurant_mobile/widgets/support/support_greeting_banner.dart';
import 'package:single_restaurant_mobile/widgets/support/support_popular_topics.dart';

class HelpSupportScreen extends StatelessWidget {
  const HelpSupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final userName = Provider.of<AuthProvider>(context).user?.name ?? 'User';
    final firstName = userName.split(' ').first;

    final restaurant = Provider.of<RestaurantProvider>(context).restaurant;
    final phone = restaurant?['phone'] as String? ?? '+1 347-233-3733';
    final email = restaurant?['email'] as String? ?? 'lassiloungeny@gmail.com';

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
        child: ResponsiveCenter(
          maxWidth: 650,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                SupportGreetingBanner(firstName: firstName),
                const SizedBox(height: 24),
                const Text('Popular Topics', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 16),
                const SupportPopularTopics(),
                const SizedBox(height: 32),
                const Text('Help Center', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 16),
                const SupportFaqList(),
                const SizedBox(height: 32),
                const Text('Contact Us', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 16),
                SupportContactList(phone: phone, email: email),
                const SizedBox(height: 24),
                _buildSatisfactionBanner(),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
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
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
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
}
