import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/data/support_faq_data.dart';
import 'package:single_restaurant_mobile/services/navigation_service.dart';
import 'package:single_restaurant_mobile/utils/support_actions.dart';
import 'package:single_restaurant_mobile/widgets/common/app_bottom_sheet.dart';

class SupportPopularTopics extends StatelessWidget {
  final String? phone;
  final String? email;

  const SupportPopularTopics({
    super.key,
    this.phone,
    this.email,
  });

  @override
  Widget build(BuildContext context) {
    final topics = [
      {
        'icon': Icons.assignment_outlined,
        'title': 'Order\nIssues',
        'rawTitle': 'Order Issues',
        'category': 'order',
      },
      {
        'icon': Icons.currency_exchange,
        'title': 'Refunds &\nPayments',
        'rawTitle': 'Refunds & Payments',
        'category': 'refund',
      },
      {
        'icon': Icons.electric_moped_outlined,
        'title': 'Delivery\nSupport',
        'rawTitle': 'Delivery Support',
        'category': 'delivery',
      },
      {
        'icon': Icons.manage_accounts_outlined,
        'title': 'Account\n& App Help',
        'rawTitle': 'Account & App Help',
        'category': 'account',
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Popular Topics',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
                color: Color(0xFF1F2937),
              ),
            ),
            InkWell(
              onTap: () => _showAllTopicsBottomSheet(context),
              borderRadius: BorderRadius.circular(4),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'View All',
                      style: TextStyle(
                        color: Color(0xFF800A12),
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                    SizedBox(width: 2),
                    Icon(
                      Icons.chevron_right,
                      color: Color(0xFF800A12),
                      size: 16,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        LayoutBuilder(
          builder: (context, constraints) {
            final cardWidth = (constraints.maxWidth - (3 * 10)) / 4;
            final useExpanded = cardWidth >= 78;

            if (useExpanded) {
              return Row(
                children: topics.map((topic) {
                  return Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(
                        right: topic == topics.last ? 0 : 10,
                      ),
                      child: _buildTopicCard(
                        context,
                        topic['icon'] as IconData,
                        topic['title'] as String,
                        topic['rawTitle'] as String,
                        topic['category'] as String,
                      ),
                    ),
                  );
                }).toList(),
              );
            }

            return SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              child: Row(
                children: topics.map((topic) {
                  return Padding(
                    padding: EdgeInsets.only(
                      right: topic == topics.last ? 0 : 10,
                    ),
                    child: SizedBox(
                      width: 90,
                      child: _buildTopicCard(
                        context,
                        topic['icon'] as IconData,
                        topic['title'] as String,
                        topic['rawTitle'] as String,
                        topic['category'] as String,
                      ),
                    ),
                  );
                }).toList(),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildTopicCard(
    BuildContext context,
    IconData icon,
    String title,
    String rawTitle,
    String categoryKey,
  ) {
    return GestureDetector(
      onTap: () => _showTopicBottomSheet(context, rawTitle, categoryKey),
      child: Container(
        height: 125,
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 10),
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
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: const BoxDecoration(
                color: Color(0xFFFDECEE),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                color: const Color(0xFF800A12),
                size: 20,
              ),
            ),
            Text(
              title,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1F2937),
                height: 1.15,
              ),
            ),
            Container(
              width: 20,
              height: 20,
              decoration: const BoxDecoration(
                color: Color(0xFFFDECEE),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.chevron_right,
                size: 13,
                color: Color(0xFF800A12),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAllTopicsBottomSheet(BuildContext context) {
    AppBottomSheet.show(
      context: context,
      builder: (sheetContext) {
        return AppBottomSheet(
          title: 'All Help Topics',
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildAllTopicTile(context, Icons.assignment_outlined, 'Order Issues', 'Delays, wrong items, cancellation policy', 'order'),
              _buildAllTopicTile(context, Icons.currency_exchange, 'Refunds & Payments', 'Stripe, bank reversal, failed payments', 'refund'),
              _buildAllTopicTile(context, Icons.electric_moped_outlined, 'Delivery Support', 'MapLibre GPS tracking, driver contact', 'delivery'),
              _buildAllTopicTile(context, Icons.manage_accounts_outlined, 'Account & App Help', 'Profile details, addresses, guest mode', 'account'),
              _buildAllTopicTile(context, Icons.local_offer_outlined, 'Offers & Promotions', 'Coupons, discounts, loyalty points', 'offers'),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  Widget _buildAllTopicTile(BuildContext context, IconData icon, String title, String subtitle, String categoryKey) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: const BoxDecoration(
          color: Color(0xFFFDECEE),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: const Color(0xFF800A12), size: 20),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
      subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: Colors.grey)),
      trailing: const Icon(Icons.chevron_right, color: Color(0xFF800A12), size: 18),
      onTap: () {
        if (Navigator.canPop(context)) {
          Navigator.pop(context);
        }
        _showTopicBottomSheet(context, title, categoryKey);
      },
    );
  }

  void _showTopicBottomSheet(BuildContext context, String title, String categoryKey) {
    final faqs = SupportFaqData.getByCategory(categoryKey);

    AppBottomSheet.show(
      context: context,
      builder: (sheetContext) {
        return AppBottomSheet(
          title: title,
          child: TopicFaqSheetContent(
            title: title,
            faqs: faqs,
            phone: phone,
            email: email,
          ),
        );
      },
    );
  }
}

class TopicFaqSheetContent extends StatefulWidget {
  final String title;
  final List<SupportFaqItem> faqs;
  final String? phone;
  final String? email;

  const TopicFaqSheetContent({
    super.key,
    required this.title,
    required this.faqs,
    this.phone,
    this.email,
  });

  @override
  State<TopicFaqSheetContent> createState() => _TopicFaqSheetContentState();
}

class _TopicFaqSheetContentState extends State<TopicFaqSheetContent> {
  int? _expandedIndex = 0; // Default open first question

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Subtitle
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(
              'Frequently asked questions & solutions for ${widget.title.toLowerCase()}:',
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF6B7280),
              ),
            ),
          ),

          // FAQ Accordion
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFF1E5E5)),
            ),
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: EdgeInsets.zero,
              itemCount: widget.faqs.length,
              separatorBuilder: (context, index) => const Divider(
                height: 1,
                indent: 52,
                endIndent: 16,
                color: Color(0xFFF5EBEB),
              ),
              itemBuilder: (context, index) {
                final faq = widget.faqs[index];
                final isExpanded = _expandedIndex == index;

                return InkWell(
                  onTap: () {
                    setState(() {
                      _expandedIndex = isExpanded ? null : index;
                    });
                  },
                  borderRadius: BorderRadius.vertical(
                    top: index == 0 ? const Radius.circular(16) : Radius.zero,
                    bottom: index == widget.faqs.length - 1 && !isExpanded
                        ? const Radius.circular(16)
                        : Radius.zero,
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Container(
                              width: 34,
                              height: 34,
                              decoration: const BoxDecoration(
                                color: Color(0xFFFDECEE),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                faq.icon,
                                color: const Color(0xFF800A12),
                                size: 18,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                faq.question,
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13.5,
                                  color: isExpanded
                                      ? const Color(0xFF800A12)
                                      : const Color(0xFF1F2937),
                                ),
                              ),
                            ),
                            Icon(
                              isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                              color: const Color(0xFF800A12),
                              size: 20,
                            ),
                          ],
                        ),
                        if (isExpanded) ...[
                          const SizedBox(height: 10),
                          Padding(
                            padding: const EdgeInsets.only(left: 46, right: 8, bottom: 4),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  faq.answer,
                                  style: const TextStyle(
                                    fontSize: 12.5,
                                    color: Color(0xFF4B5563),
                                    height: 1.45,
                                  ),
                                ),
                                if (faq.actionLabel != null && faq.actionType != null) ...[
                                  const SizedBox(height: 10),
                                  Align(
                                    alignment: Alignment.centerLeft,
                                    child: OutlinedButton.icon(
                                      onPressed: () {
                                        final targetCtx = NavigationService.navigatorKey.currentContext ?? context;
                                        if (Navigator.canPop(context)) {
                                          Navigator.pop(context);
                                        }
                                        SupportActions.handleAction(
                                          targetCtx,
                                          faq.actionType!,
                                          phone: widget.phone,
                                          email: widget.email,
                                        );
                                      },
                                      icon: const Icon(Icons.arrow_forward, size: 14),
                                      label: Text(faq.actionLabel!),
                                      style: OutlinedButton.styleFrom(
                                        foregroundColor: const Color(0xFF800A12),
                                        side: const BorderSide(color: Color(0xFF800A12)),
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                        textStyle: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 16),

          // Immediate Help Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFFDF7F7),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFF8E7E7)),
            ),
            child: Row(
              children: [
                const Icon(Icons.support_agent, color: Color(0xFF800A12), size: 22),
                const SizedBox(width: 10),
                const Expanded(
                  child: Text(
                    'Still have questions? Our support team is ready 24/7.',
                    style: TextStyle(fontSize: 11.5, color: Color(0xFF555555)),
                  ),
                ),
                const SizedBox(width: 8),
                TextButton(
                  onPressed: () {
                    if (Navigator.canPop(context)) {
                      Navigator.pop(context);
                    }
                    SupportActions.makePhoneCall(context, widget.phone);
                  },
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFF800A12),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  ),
                  child: const Text('Call Us', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
