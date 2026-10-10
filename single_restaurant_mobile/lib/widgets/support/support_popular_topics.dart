import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/theme/app_radius.dart';
import 'package:single_restaurant_mobile/theme/app_spacing.dart';
import 'package:single_restaurant_mobile/widgets/common/app_bottom_sheet.dart';

class SupportPopularTopics extends StatelessWidget {
  const SupportPopularTopics({super.key});

  @override
  Widget build(BuildContext context) {
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
      onTap: () => _showTopicBottomSheet(context, title.replaceAll('\n', ' ')),
      child: Container(
        width: 96,
        height: 96,
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: AppColors.secondary, size: 26),
            const SizedBox(height: 6),
            Expanded(
              child: Center(
                child: Text(
                  title,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    height: 1.1,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showTopicBottomSheet(BuildContext context, String title) {
    AppBottomSheet.show(
      context: context,
      builder: (sheetContext) {
        return AppBottomSheet(
          title: title,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFF9FAFB),
                    borderRadius: AppRadius.borderMd,
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
                const SizedBox(height: AppSpacing.xl),
              ],
            ),
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
