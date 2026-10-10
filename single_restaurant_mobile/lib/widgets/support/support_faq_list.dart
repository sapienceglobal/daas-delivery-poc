import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';

class SupportFaqList extends StatelessWidget {
  const SupportFaqList({super.key});

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
          _buildFaqItem(
            context,
            Icons.inventory_2_outlined,
            'How do I track my order?',
            'You can track your order in real-time from the "My Orders" section in the app. Just click on your active order to see the live status.',
          ),
          const Divider(height: 1, indent: 64),
          _buildFaqItem(
            context,
            Icons.gpp_bad_outlined,
            'I received the wrong order',
            'We apologize for the inconvenience. Please contact our support team immediately using the live chat or call option below with your order ID.',
          ),
          const Divider(height: 1, indent: 64),
          _buildFaqItem(
            context,
            Icons.currency_exchange_outlined,
            'How do I request a refund?',
            'If you cancel your order before the restaurant accepts it, a refund is automatically initiated and processed within 3-5 business days.',
          ),
          const Divider(height: 1, indent: 64),
          _buildFaqItem(
            context,
            Icons.payment_outlined,
            'Payment failed but amount deducted?',
            'Don\'t worry! Failed transactions are automatically refunded by your bank within 48-72 hours. If it takes longer, please contact your bank.',
          ),
          const Divider(height: 1, indent: 64),
          _buildFaqItem(
            context,
            Icons.schedule_outlined,
            'How long does delivery take?',
            'Delivery typically takes 30-45 minutes depending on your location and restaurant preparation time. You can see the estimated time before placing the order.',
          ),
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
            border: Border.all(color: AppColors.secondary.withValues(alpha: 0.3)),
          ),
          child: Icon(icon, color: AppColors.secondary, size: 18),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
        childrenPadding: const EdgeInsets.only(left: 72, right: 16, bottom: 16),
        children: [
          Text(answer, style: const TextStyle(color: Colors.grey, fontSize: 12, height: 1.5)),
        ],
      ),
    );
  }
}
