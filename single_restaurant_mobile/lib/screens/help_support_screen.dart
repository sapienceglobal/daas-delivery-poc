import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/data/support_faq_data.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';
import 'package:single_restaurant_mobile/widgets/support/security_verification_sheet.dart';
import 'package:single_restaurant_mobile/widgets/support/support_contact_list.dart';
import 'package:single_restaurant_mobile/widgets/support/support_faq_list.dart';
import 'package:single_restaurant_mobile/widgets/support/support_greeting_banner.dart';
import 'package:single_restaurant_mobile/widgets/support/support_popular_topics.dart';

class HelpSupportScreen extends StatefulWidget {
  const HelpSupportScreen({super.key});

  @override
  State<HelpSupportScreen> createState() => _HelpSupportScreenState();
}

class _HelpSupportScreenState extends State<HelpSupportScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final restaurantProvider = Provider.of<RestaurantProvider>(context, listen: false);
      if (restaurantProvider.restaurant == null) {
        restaurantProvider.fetchRestaurantData();
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Widget _buildQuickChip(String label) {
    final isSelected = _searchQuery.toLowerCase() == label.toLowerCase();
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: InkWell(
        onTap: () {
          setState(() {
            if (isSelected) {
              _searchController.clear();
              _searchQuery = '';
            } else {
              _searchController.text = label;
              _searchQuery = label;
            }
          });
        },
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF800A12) : const Color(0xFFF9EFEF),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isSelected ? const Color(0xFF800A12) : const Color(0xFFF2DEDE),
              width: 1,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w600,
              color: isSelected ? Colors.white : const Color(0xFF800A12),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final restaurantProvider = Provider.of<RestaurantProvider>(context);

    // Dynamic customer name or 'Guest'
    final user = authProvider.user;
    final rawName = user?.name.trim();
    final customerName = user == null || rawName == null || rawName.isEmpty
        ? 'Guest'
        : rawName.split(' ').first;

    // Backend restaurant contact info saved by merchant
    final restaurant = restaurantProvider.restaurant;
    final phone = restaurant?['phone'] as String? ??
        restaurant?['contactPhone'] as String? ??
        '+1 347-233-3733';
    final email = restaurant?['email'] as String? ??
        restaurant?['contactEmail'] as String? ??
        'lassiloungeny@gmail.com';

    final isSearching = _searchQuery.trim().isNotEmpty;
    final searchResultsCount = isSearching ? SupportFaqData.search(_searchQuery).length : 0;

    return Scaffold(
      backgroundColor: const Color(0xFFFEFAF2),
      appBar: AppBar(
        backgroundColor: const Color(0xFFFEFAF2),
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back,
            color: Color(0xFF800A12),
            size: 24,
          ),
          onPressed: () {
            if (Navigator.canPop(context)) {
              Navigator.pop(context);
            }
          },
        ),
        title: const Text(
          'Help & Support',
          style: TextStyle(
            fontFamily: 'serif',
            color: Color(0xFF800A12),
            fontWeight: FontWeight.w900,
            fontSize: 22,
            letterSpacing: -0.3,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        top: false,
        child: ResponsiveCenter(
          maxWidth: 600,
          alignment: Alignment.topCenter,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 8),

              // Search Bar (Pinned at top)
              Container(
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isSearching ? const Color(0xFF800A12) : const Color(0xFFF1E5E5),
                    width: isSearching ? 1.5 : 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 14),
                      child: Icon(
                        Icons.search,
                        color: Color(0xFF800A12),
                        size: 20,
                      ),
                    ),
                    Expanded(
                      child: TextField(
                        controller: _searchController,
                        onChanged: (val) {
                          setState(() {
                            _searchQuery = val;
                          });
                        },
                        style: const TextStyle(
                          fontSize: 13.5,
                          color: Color(0xFF1F2937),
                        ),
                        decoration: const InputDecoration(
                          hintText: 'Search order, refund, delivery topics...',
                          hintStyle: TextStyle(
                            color: Color(0xFF9E9E9E),
                            fontSize: 13.5,
                          ),
                          border: InputBorder.none,
                          isDense: true,
                          contentPadding: EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                    if (isSearching)
                      IconButton(
                        icon: const Icon(Icons.clear, size: 18, color: Colors.grey),
                        onPressed: () {
                          setState(() {
                            _searchController.clear();
                            _searchQuery = '';
                          });
                        },
                      ),
                  ],
                ),
              ),

              // Quick Search Chips (Pinned at top)
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.only(top: 10, bottom: 4),
                child: Row(
                  children: [
                    _buildQuickChip('Track Live Order'),
                    _buildQuickChip('Cancel Order'),
                    _buildQuickChip('Refund Timeline'),
                    _buildQuickChip('Loyalty Points'),
                    _buildQuickChip('Payment Failed'),
                    _buildQuickChip('Wrong Item'),
                    _buildQuickChip('Saved Address'),
                    _buildQuickChip('Apply Coupon'),
                    _buildQuickChip('Contact Driver'),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // Scrollable Content
              Expanded(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // SEARCH RESULTS VIEW vs REGULAR DASHBOARD VIEW
                      if (isSearching) ...[
                        // Search Status Banner
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFDF2F2),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFF9D5D5)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.lightbulb_outline, size: 18, color: Color(0xFF800A12)),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Found $searchResultsCount solution${searchResultsCount == 1 ? '' : 's'} for "$_searchQuery"',
                                  style: const TextStyle(
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF800A12),
                                  ),
                                ),
                              ),
                              InkWell(
                                onTap: () {
                                  setState(() {
                                    _searchController.clear();
                                    _searchQuery = '';
                                  });
                                },
                                child: const Text(
                                  'Clear',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF800A12),
                                    decoration: TextDecoration.underline,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Matching FAQ Solutions
                        SupportFaqList(
                          searchQuery: _searchQuery,
                          phone: phone,
                          email: email,
                        ),

                        const SizedBox(height: 20),

                        // Contact Section
                        SupportContactList(
                          phone: phone,
                          email: email,
                        ),
                      ] else ...[
                        // Hero Greeting Banner (with exact headset artwork matching user mockup)
                        SupportGreetingBanner(
                          firstName: customerName,
                        ),

                        const SizedBox(height: 20),

                        // Popular Topics (with real topic bottom sheets)
                        SupportPopularTopics(
                          phone: phone,
                          email: email,
                        ),

                        const SizedBox(height: 20),

                        // Help Center (FAQs with real solutions)
                        SupportFaqList(
                          searchQuery: _searchQuery,
                          phone: phone,
                          email: email,
                        ),

                        const SizedBox(height: 20),

                        // Contact Us (2x2 Grid)
                        SupportContactList(
                          phone: phone,
                          email: email,
                        ),
                      ],

                      const SizedBox(height: 20),

                      // 100% Secure & Verified Banner (Tap to view security breakdown)
                      Material(
                        color: Colors.transparent,
                        borderRadius: BorderRadius.circular(16),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(16),
                          onTap: () => SecurityVerificationSheet.show(context),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF0FDF4),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFBBF7D0)),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 36,
                                  height: 36,
                                  decoration: const BoxDecoration(
                                    color: Colors.white,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Center(
                                    child: Icon(
                                      Icons.verified_user_rounded,
                                      color: Color(0xFF16A34A),
                                      size: 22,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                const Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '100% Secure & Verified',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13,
                                          color: Color(0xFF166534),
                                        ),
                                      ),
                                      SizedBox(height: 2),
                                      Text(
                                        'Tap to view our bank-grade security & privacy details.',
                                        style: TextStyle(
                                          color: Color(0xFF6B7280),
                                          fontSize: 11,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const Icon(
                                  Icons.chevron_right,
                                  color: Color(0xFF16A34A),
                                  size: 18,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
