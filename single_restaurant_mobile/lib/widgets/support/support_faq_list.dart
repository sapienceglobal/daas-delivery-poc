import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/data/support_faq_data.dart';
import 'package:single_restaurant_mobile/utils/support_actions.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';

class SupportFaqList extends StatefulWidget {
  final String searchQuery;
  final String? phone;
  final String? email;

  const SupportFaqList({
    super.key,
    this.searchQuery = '',
    this.phone,
    this.email,
  });

  @override
  State<SupportFaqList> createState() => _SupportFaqListState();
}

class _SupportFaqListState extends State<SupportFaqList> {
  bool _showAll = false;
  String? _expandedFaqId;
  final Set<String> _helpfulVoted = {};

  @override
  void initState() {
    super.initState();
    _checkAutoExpand();
  }

  @override
  void didUpdateWidget(covariant SupportFaqList oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.searchQuery != oldWidget.searchQuery) {
      _checkAutoExpand();
    }
  }

  void _checkAutoExpand() {
    final clean = widget.searchQuery.trim();
    if (clean.isNotEmpty) {
      final matches = SupportFaqData.search(clean);
      if (matches.length == 1) {
        _expandedFaqId = matches.first.id;
      } else {
        _expandedFaqId = null;
      }
    } else {
      _expandedFaqId = null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isSearching = widget.searchQuery.trim().isNotEmpty;
    final filteredFaqs = SupportFaqData.search(widget.searchQuery);
    final hasMoreFaqs = filteredFaqs.length > 5;
    final displayedFaqs = (isSearching || _showAll)
        ? filteredFaqs
        : filteredFaqs.take(5).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              isSearching
                  ? 'Matching Solutions (${filteredFaqs.length})'
                  : 'Help Center (FAQs)',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
                color: Color(0xFF1F2937),
              ),
            ),
            if (!isSearching && hasMoreFaqs)
              InkWell(
                onTap: () {
                  setState(() {
                    _showAll = !_showAll;
                  });
                },
                borderRadius: BorderRadius.circular(4),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _showAll ? 'Show Less' : 'View All (${filteredFaqs.length})',
                        style: const TextStyle(
                          color: Color(0xFF800A12),
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(width: 2),
                      Icon(
                        _showAll ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                        color: const Color(0xFF800A12),
                        size: 16,
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 12),
        if (filteredFaqs.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFF1E5E5)),
            ),
            child: Column(
              children: [
                const Icon(Icons.search_off_rounded, size: 40, color: Color(0xFF9E9E9E)),
                const SizedBox(height: 10),
                Text(
                  'No solutions found for "${widget.searchQuery}"',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: Color(0xFF1F2937),
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Try searching with different keywords or contact our team directly.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xFF6B7280), fontSize: 12),
                ),
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ElevatedButton.icon(
                      onPressed: () => SupportActions.makePhoneCall(context, widget.phone),
                      icon: const Icon(Icons.phone, size: 16),
                      label: const Text('Call Us'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF800A12),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      ),
                    ),
                    const SizedBox(width: 10),
                    OutlinedButton.icon(
                      onPressed: () => SupportActions.openWhatsApp(context, widget.phone),
                      icon: const Icon(Icons.chat_outlined, size: 16),
                      label: const Text('WhatsApp'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF25D366),
                        side: const BorderSide(color: Color(0xFF25D366)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          )
        else
          Container(
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
              children: [
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  padding: EdgeInsets.zero,
                  itemCount: displayedFaqs.length,
                  separatorBuilder: (context, index) => const Divider(
                    height: 1,
                    indent: 58,
                    endIndent: 16,
                    color: Color(0xFFF5EBEB),
                  ),
                  itemBuilder: (context, index) {
                    final faq = displayedFaqs[index];
                    final isExpanded = _expandedFaqId == faq.id;
                    final hasVoted = _helpfulVoted.contains(faq.id);
                    final isFirst = index == 0;
                    final isLast = index == displayedFaqs.length - 1;
                    final showFooter = !isSearching && hasMoreFaqs;

                    return InkWell(
                      onTap: () {
                        setState(() {
                          _expandedFaqId = isExpanded ? null : faq.id;
                        });
                      },
                      borderRadius: BorderRadius.vertical(
                        top: isFirst ? const Radius.circular(16) : Radius.zero,
                        bottom: (isLast && !showFooter && !isExpanded)
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
                                  width: 36,
                                  height: 36,
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
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        faq.question,
                                        style: TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 13,
                                          color: isExpanded
                                              ? const Color(0xFF800A12)
                                              : const Color(0xFF1F2937),
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        faq.categoryTitle,
                                        style: const TextStyle(
                                          fontSize: 10.5,
                                          color: Color(0xFF9E9E9E),
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Icon(
                                  isExpanded ? Icons.keyboard_arrow_up : Icons.chevron_right,
                                  color: const Color(0xFF800A12),
                                  size: 18,
                                ),
                              ],
                            ),
                            if (isExpanded) ...[
                              const SizedBox(height: 10),
                              Padding(
                                padding: const EdgeInsets.only(left: 48, right: 8, bottom: 4),
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
                                    const SizedBox(height: 12),
                                    Row(
                                      children: [
                                        if (faq.actionLabel != null && faq.actionType != null)
                                          OutlinedButton.icon(
                                            onPressed: () {
                                              SupportActions.handleAction(
                                                context,
                                                faq.actionType!,
                                                phone: widget.phone,
                                                email: widget.email,
                                              );
                                            },
                                            icon: const Icon(Icons.arrow_forward, size: 13),
                                            label: Text(faq.actionLabel!),
                                            style: OutlinedButton.styleFrom(
                                              foregroundColor: const Color(0xFF800A12),
                                              side: const BorderSide(color: Color(0xFF800A12)),
                                              shape: RoundedRectangleBorder(
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                              textStyle: const TextStyle(
                                                fontSize: 11.5,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                        const Spacer(),
                                        if (!hasVoted) ...[
                                          const Text(
                                            'Helpful?',
                                            style: TextStyle(fontSize: 11, color: Color(0xFF8A8A8E)),
                                          ),
                                          const SizedBox(width: 6),
                                          InkWell(
                                            onTap: () {
                                              setState(() {
                                                _helpfulVoted.add(faq.id);
                                              });
                                              ToastUtils.showSuccess(context, 'Thank you for your feedback!');
                                            },
                                            child: const Padding(
                                              padding: EdgeInsets.all(4),
                                              child: Icon(Icons.thumb_up_alt_outlined, size: 15, color: Color(0xFF16A34A)),
                                            ),
                                          ),
                                          const SizedBox(width: 4),
                                          InkWell(
                                            onTap: () {
                                              setState(() {
                                                _helpfulVoted.add(faq.id);
                                              });
                                              ToastUtils.showInfo(context, 'We will improve this answer.');
                                            },
                                            child: const Padding(
                                              padding: EdgeInsets.all(4),
                                              child: Icon(Icons.thumb_down_alt_outlined, size: 15, color: Color(0xFF9E9E9E)),
                                            ),
                                          ),
                                        ] else ...[
                                          const Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(Icons.check_circle, size: 14, color: Color(0xFF16A34A)),
                                              SizedBox(width: 4),
                                              Text(
                                                'Feedback received',
                                                style: TextStyle(fontSize: 11, color: Color(0xFF16A34A), fontWeight: FontWeight.w600),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ],
                                    ),
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
                if (!isSearching && hasMoreFaqs) ...[
                  const Divider(height: 1, color: Color(0xFFF5EBEB)),
                  InkWell(
                    onTap: () {
                      setState(() {
                        _showAll = !_showAll;
                      });
                    },
                    borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      decoration: const BoxDecoration(
                        color: Color(0xFFFFF7F7),
                        borderRadius: BorderRadius.vertical(bottom: Radius.circular(16)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            _showAll
                                ? 'Show Less'
                                : 'View All FAQs (${filteredFaqs.length})',
                            style: const TextStyle(
                              color: Color(0xFF800A12),
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Icon(
                            _showAll ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
                            color: const Color(0xFF800A12),
                            size: 18,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
      ],
    );
  }
}
