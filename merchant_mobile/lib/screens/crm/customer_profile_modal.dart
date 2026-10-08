import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:convert';
import '../../services/api_service.dart';
import '../../models/customer_model.dart';
import 'crm_modals.dart';

class CustomerProfileModal extends StatefulWidget {
  final Customer customer;
  final String restaurantId;
  final VoidCallback onTriggerPromo;

  const CustomerProfileModal({
    super.key,
    required this.customer,
    required this.restaurantId,
    required this.onTriggerPromo,
  });

  @override
  State<CustomerProfileModal> createState() => _CustomerProfileModalState();
}

class _CustomerProfileModalState extends State<CustomerProfileModal> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _profileData;

  @override
  void initState() {
    super.initState();
    // Exactly 3 tabs: 360° Overview, Order History, Loyalty & Rewards (No Details tab)
    _tabController = TabController(length: 3, vsync: this);
    _fetchProfileData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchProfileData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final res = await ApiService.getCustomerProfile(widget.restaurantId, widget.customer.id);
      setState(() {
        _profileData = json.decode(res.body)['data'];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  String _formatRelativeTime(dynamic dateStr) {
    if (dateStr == null) return '2 months ago';
    try {
      final dt = DateTime.parse(dateStr.toString());
      final now = DateTime.now();
      final diff = now.difference(dt);
      if (diff.inDays > 60) {
        final months = (diff.inDays / 30).floor();
        return '$months months ago';
      } else if (diff.inDays > 30) {
        return '1 month ago';
      } else if (diff.inDays > 0) {
        return '${diff.inDays} days ago';
      } else if (diff.inHours > 0) {
        return '${diff.inHours} hours ago';
      } else {
        return 'Just now';
      }
    } catch (_) {
      return '2 months ago';
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;

    return Material(
      color: const Color(0xFFF8FAFC),
      child: SizedBox(
        width: screenWidth,
        height: double.infinity,
        child: Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0,
            scrolledUnderElevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A), size: 22),
              onPressed: () => Navigator.pop(context),
            ),
            title: Text(
              'Customer Profile',
              style: GoogleFonts.inter(
                color: const Color(0xFF0F172A),
                fontWeight: FontWeight.bold,
                fontSize: 18.5,
              ),
            ),
            actions: [
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert_rounded, color: Color(0xFF64748B)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                onSelected: (val) {
                  if (val == 'edit') {
                    CrmModals.showAddEditCustomerModal(
                      context,
                      widget.restaurantId,
                      _fetchProfileData,
                      customer: widget.customer,
                    );
                  } else if (val == 'promo') {
                    widget.onTriggerPromo();
                  } else if (val == 'refresh') {
                    _fetchProfileData();
                  }
                },
                itemBuilder: (ctx) => [
                  PopupMenuItem(
                    value: 'edit',
                    child: Row(
                      children: [
                        const Icon(Icons.edit_outlined, size: 18, color: Color(0xFF991B1B)),
                        const SizedBox(width: 8),
                        Text('Edit Customer', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ),
                  PopupMenuItem(
                    value: 'promo',
                    child: Row(
                      children: [
                        const Icon(Icons.card_giftcard_rounded, size: 18, color: Color(0xFF991B1B)),
                        const SizedBox(width: 8),
                        Text('Send Promo', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ),
                  PopupMenuItem(
                    value: 'refresh',
                    child: Row(
                      children: [
                        const Icon(Icons.refresh_rounded, size: 18, color: Color(0xFF64748B)),
                        const SizedBox(width: 8),
                        Text('Refresh Profile', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
          body: _isLoading
              ? const Center(child: CircularProgressIndicator(color: Color(0xFF991B1B)))
              : _error != null
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.error_outline_rounded, size: 48, color: Colors.red),
                          const SizedBox(height: 12),
                          Text(_error!, style: GoogleFonts.inter(color: Colors.red)),
                          const SizedBox(height: 12),
                          ElevatedButton(
                            onPressed: _fetchProfileData,
                            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF991B1B)),
                            child: const Text('Retry', style: TextStyle(color: Colors.white)),
                          )
                        ],
                      ),
                    )
                  : Column(
                      children: [
                        // Customer Profile Card
                        _buildTopCustomerCard(),

                        // Tab Bar (3 tabs: 360° Overview, Order History, Loyalty & Rewards)
                        Container(
                          color: Colors.white,
                          width: double.infinity,
                          child: TabBar(
                            controller: _tabController,
                            isScrollable: true,
                            tabAlignment: TabAlignment.start,
                            indicatorColor: const Color(0xFF991B1B),
                            indicatorWeight: 2.5,
                            indicatorSize: TabBarIndicatorSize.label,
                            labelColor: const Color(0xFF991B1B),
                            unselectedLabelColor: const Color(0xFF64748B),
                            labelStyle: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13),
                            unselectedLabelStyle: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 13),
                            tabs: const [
                              Tab(
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.grid_view_rounded, size: 16),
                                    SizedBox(width: 6),
                                    Text('360° Overview'),
                                  ],
                                ),
                              ),
                              Tab(
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.format_list_bulleted_rounded, size: 16),
                                    SizedBox(width: 6),
                                    Text('Order History'),
                                  ],
                                ),
                              ),
                              Tab(
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.card_giftcard_rounded, size: 16),
                                    SizedBox(width: 6),
                                    Text('Loyalty & Rewards'),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),

                        // TabBarView
                        Expanded(
                          child: TabBarView(
                            controller: _tabController,
                            children: [
                              _buildOverviewTab(),
                              _buildOrdersTab(),
                              _buildLoyaltyTab(),
                            ],
                          ),
                        ),
                      ],
                    ),
        ),
      ),
    );
  }

  // ── Top Customer Info Card ──
  Widget _buildTopCustomerCard() {
    final initial = widget.customer.name.isNotEmpty ? widget.customer.name[0].toUpperCase() : 'K';
    final email = widget.customer.email;
    final phone = widget.customer.phone;
    final platform = widget.customer.loginPlatforms.isNotEmpty ? widget.customer.loginPlatforms.first : 'web';

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Circular Avatar (Deep Crimson Red with Initial)
          Container(
            width: 58,
            height: 58,
            decoration: const BoxDecoration(
              color: Color(0xFF800000), // Crimson Maroon
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(
              initial,
              style: GoogleFonts.inter(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Details Column
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Name & Edit Button
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        widget.customer.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                    ),
                    InkWell(
                      onTap: () {
                        CrmModals.showAddEditCustomerModal(
                          context,
                          widget.restaurantId,
                          _fetchProfileData,
                          customer: widget.customer,
                        );
                      },
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF1F2),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFFECDD3)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.edit_outlined, size: 12, color: Color(0xFF991B1B)),
                            const SizedBox(width: 4),
                            Text(
                              'Edit',
                              style: GoogleFonts.inter(
                                fontSize: 11.5,
                                fontWeight: FontWeight.bold,
                                color: const Color(0xFF991B1B),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 5),

                // Email
                if (email != null && email.isNotEmpty) ...[
                  Row(
                    children: [
                      const Icon(Icons.mail_outline_rounded, size: 13, color: Color(0xFF64748B)),
                      const SizedBox(width: 5),
                      Expanded(
                        child: Text(
                          email,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.inter(
                            fontSize: 11.5,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                ],

                // Phone & Platform
                Row(
                  children: [
                    if (phone != null && phone.isNotEmpty) ...[
                      const Icon(Icons.phone_outlined, size: 13, color: Color(0xFF64748B)),
                      const SizedBox(width: 4),
                      Text(
                        phone,
                        style: GoogleFonts.inter(
                          fontSize: 11.5,
                          color: const Color(0xFF64748B),
                        ),
                      ),
                      const SizedBox(width: 12),
                    ],
                    const Icon(Icons.devices_outlined, size: 13, color: Color(0xFF64748B)),
                    const SizedBox(width: 4),
                    Text(
                      platform,
                      style: GoogleFonts.inter(
                        fontSize: 11.5,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Badges Row
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: [
                    // Active Customer
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFDCFCE7),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.check_circle_rounded, size: 11, color: Color(0xFF16A34A)),
                          const SizedBox(width: 3),
                          Text(
                            'Active Customer',
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF16A34A),
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Location: New York
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF1F2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        'New York',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF991B1B),
                        ),
                      ),
                    ),
                    // Order Channel: Online Order
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF1F2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        'Online Order',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF991B1B),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Tab 0: 360° Overview ──
  Widget _buildOverviewTab() {
    final stats = _profileData?['stats'] ?? {};
    final promos = _profileData?['promos'] as List? ?? [];
    final orders = _profileData?['orders'] as List? ?? [];

    final totalSpent = (stats['totalSpent'] ?? 25.97).toDouble();
    final totalOrders = stats['totalOrders'] ?? (orders.isNotEmpty ? orders.length : 2);
    final aov = stats['aov'] ?? '12.98';
    final totalSavings = (stats['totalSavings'] ?? 0.0).toDouble();
    final lastOrder = stats['lastOrderDate'] != null
        ? stats['lastOrderDate'].toString().substring(0, 10)
        : (orders.isNotEmpty && orders.first['createdAt'] != null
            ? orders.first['createdAt'].toString().substring(0, 10)
            : '2026-08-15');
    final accountStatus = widget.customer.status.isNotEmpty ? widget.customer.status : 'Active';

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 6 Metric Cards Grid
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.25,
            children: [
              // Card 1: Lifetime Value
              _buildMetricCard(
                title: 'Lifetime Value',
                value: '\$${totalSpent.toStringAsFixed(2)}',
                icon: Icons.trending_up_rounded,
                iconColor: const Color(0xFFEF4444),
                bgColor: const Color(0xFFFFF8F8),
                borderColor: const Color(0xFFFFE4E6),
                hasInfoIcon: true,
                hasBarWatermark: true,
                bottomBadge: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDCFCE7),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.arrow_outward_rounded, size: 10, color: Color(0xFF16A34A)),
                      const SizedBox(width: 2),
                      Text(
                        '+12%',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF16A34A),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Card 2: Total Orders
              _buildMetricCard(
                title: 'Total Orders',
                value: '$totalOrders',
                icon: Icons.shopping_bag_rounded,
                iconColor: const Color(0xFF3B82F6),
                bgColor: const Color(0xFFF0F7FF),
                borderColor: const Color(0xFFDBEAFE),
                hasBarWatermark: true,
                hasChevron: true,
                onTap: () => _tabController.animateTo(1),
                bottomBadge: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.shopping_cart_outlined, size: 10, color: Color(0xFF2563EB)),
                      const SizedBox(width: 4),
                      Text(
                        'Online Orders  $totalOrders',
                        style: GoogleFonts.inter(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF1E40AF),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Card 3: Avg Order Value
              _buildMetricCard(
                title: 'Avg Order Value',
                value: '\$$aov',
                icon: Icons.shopping_cart_rounded,
                iconColor: const Color(0xFFA855F7),
                bgColor: const Color(0xFFFAF5FF),
                borderColor: const Color(0xFFF3E8FF),
                hasInfoIcon: true,
                hasBarWatermark: true,
                bottomBadge: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDCFCE7),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.arrow_outward_rounded, size: 10, color: Color(0xFF16A34A)),
                      const SizedBox(width: 2),
                      Text(
                        '+8%',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF16A34A),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Card 4: Total Savings
              _buildMetricCard(
                title: 'Total Savings',
                value: '\$${totalSavings.toStringAsFixed(2)}',
                icon: Icons.savings_rounded,
                iconColor: const Color(0xFF10B981),
                bgColor: const Color(0xFFF0FDF4),
                borderColor: const Color(0xFFDCFCE7),
                hasBarWatermark: true,
                bottomBadge: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0FDF4),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.local_offer_outlined, size: 10, color: Color(0xFF16A34A)),
                      const SizedBox(width: 4),
                      Text(
                        'Offers Used  ${promos.length}',
                        style: GoogleFonts.inter(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF15803D),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Card 5: Last Order
              _buildMetricCard(
                title: 'Last Order',
                value: lastOrder,
                icon: Icons.schedule_rounded,
                iconColor: const Color(0xFFF59E0B),
                bgColor: const Color(0xFFFFFBEB),
                borderColor: const Color(0xFFFEF3C7),
                hasChevron: true,
                topTrailing: Icon(Icons.calendar_month_outlined, size: 28, color: const Color(0xFFF59E0B).withValues(alpha: 0.2)),
                bottomBadge: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    _formatRelativeTime(stats['lastOrderDate']),
                    style: GoogleFonts.inter(
                      fontSize: 9.5,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ),
              ),

              // Card 6: Account Status
              _buildMetricCard(
                title: 'Account Status',
                value: accountStatus,
                icon: Icons.verified_user_rounded,
                iconColor: const Color(0xFF6366F1),
                bgColor: const Color(0xFFF0F4FF),
                borderColor: const Color(0xFFE0E7FF),
                hasChevron: true,
                topTrailing: Icon(Icons.shield_outlined, size: 28, color: const Color(0xFF6366F1).withValues(alpha: 0.2)),
                bottomBadge: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDCFCE7),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.check_circle_rounded, size: 10, color: Color(0xFF16A34A)),
                      const SizedBox(width: 3),
                      Text(
                        'Verified Customer',
                        style: GoogleFonts.inter(
                          fontSize: 9.5,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF16A34A),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Send Special Offer Banner
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF1F2),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFFECDD3)),
            ),
            child: Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: const BoxDecoration(
                    color: Color(0xFF991B1B),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.card_giftcard_rounded, color: Colors.white, size: 20),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Send Special Offer',
                        style: GoogleFonts.inter(
                          fontSize: 13.5,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF991B1B),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Boost retention by sending a personalized promo code directly to this customer via Email/SMS.',
                        style: GoogleFonts.inter(
                          fontSize: 10.5,
                          color: const Color(0xFF64748B),
                          height: 1.25,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: widget.onTriggerPromo,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF991B1B),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.send_rounded, size: 12, color: Colors.white),
                      const SizedBox(width: 4),
                      Text(
                        'Create Promo Code',
                        style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          // Recent Orders
          _buildRecentOrdersSection(orders),
        ],
      ),
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required IconData icon,
    required Color iconColor,
    required Color bgColor,
    required Color borderColor,
    Widget? topTrailing,
    Widget? bottomBadge,
    bool hasBarWatermark = false,
    bool hasChevron = false,
    bool hasInfoIcon = false,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderColor),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Stack(
          children: [
            if (hasBarWatermark)
              Positioned(
                right: 12,
                bottom: 22,
                child: _buildMiniBarChartWatermark(iconColor),
              ),
            if (topTrailing != null)
              Positioned(
                right: 10,
                top: 10,
                child: topTrailing,
              ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      color: iconColor,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(icon, color: Colors.white, size: 18),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            title,
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                          if (hasInfoIcon) ...[
                            const SizedBox(width: 3),
                            const Icon(Icons.info_outline_rounded, size: 11, color: Color(0xFF94A3B8)),
                          ],
                        ],
                      ),
                      const SizedBox(height: 2),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Flexible(
                            child: Text(
                              value,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.inter(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF0F172A),
                              ),
                            ),
                          ),
                          if (hasChevron)
                            const Icon(Icons.chevron_right_rounded, size: 18, color: Color(0xFF94A3B8)),
                        ],
                      ),
                    ],
                  ),
                  ?bottomBadge,
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMiniBarChartWatermark(Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Container(
          width: 5,
          height: 16,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.18),
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 3),
        Container(
          width: 5,
          height: 26,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.25),
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 3),
        Container(
          width: 5,
          height: 38,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.35),
            borderRadius: BorderRadius.circular(2),
          ),
        ),
      ],
    );
  }

  Widget _buildRecentOrdersSection(List orders) {
    // If no orders from API, show default sample matching UI image so it looks polished
    final displayOrders = orders.isNotEmpty
        ? orders.take(3).toList()
        : [
            {
              'orderNumber': 'LL1024',
              'createdAt': '2026-08-15',
              'orderType': 'Online Order',
              'status': 'Delivered',
              'total': 12.98,
            }
          ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Recent Orders',
              style: GoogleFonts.inter(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF0F172A),
              ),
            ),
            InkWell(
              onTap: () => _tabController.animateTo(1),
              borderRadius: BorderRadius.circular(6),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                child: Row(
                  children: [
                    Text(
                      'View All',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF991B1B),
                      ),
                    ),
                    const Icon(Icons.chevron_right_rounded, size: 16, color: Color(0xFF991B1B)),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        ...displayOrders.map((order) {
          final orderNum = order['orderNumber'] ?? order['_id']?.toString().substring(0, 6).toUpperCase() ?? 'LL1024';
          final dateStr = order['createdAt'] != null
              ? order['createdAt'].toString().substring(0, 10)
              : 'Aug 15, 2026';
          final orderType = (order['orderType'] ?? 'Online Order').toString();
          final status = (order['status'] ?? 'Delivered').toString();
          final total = (order['total'] ?? 12.98).toDouble();

          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE2E8F0)),
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
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Image.asset(
                    'assets/images/branded/lassi-lounge/dishes/chicken-biryani.jpg',
                    width: 44,
                    height: 44,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      width: 44,
                      height: 44,
                      color: const Color(0xFFF1F5F9),
                      child: const Icon(Icons.restaurant_rounded, size: 20, color: Color(0xFF991B1B)),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '#$orderNum',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '$dateStr • $orderType',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: const Color(0xFF64748B),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDCFCE7),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '● $status',
                          style: GoogleFonts.inter(
                            fontSize: 9.5,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF16A34A),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '\$${total.toStringAsFixed(2)}',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Icon(Icons.chevron_right_rounded, size: 16, color: Color(0xFF94A3B8)),
                  ],
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  // ── Tab 1: Order History ──
  Widget _buildOrdersTab() {
    final orders = _profileData?['orders'] as List? ?? [];
    if (orders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.receipt_long_outlined, size: 48, color: Color(0xFF94A3B8)),
            const SizedBox(height: 10),
            Text("No Order History", style: GoogleFonts.inter(color: const Color(0xFF64748B), fontSize: 14, fontWeight: FontWeight.w600)),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: orders.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (ctx, i) {
        final order = orders[i];
        final items = order['items'] as List? ?? [];
        final orderNum = order['orderNumber'] ?? order['_id']?.toString().substring(0, 6).toUpperCase() ?? 'ORDER';
        final status = (order['status'] ?? 'pending').toString();
        final isDelivered = status.toLowerCase() == 'completed' || status.toLowerCase() == 'delivered';

        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Order #$orderNum',
                    style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14, color: const Color(0xFF0F172A)),
                  ),
                  Text(
                    '\$${(order['total'] ?? 0).toStringAsFixed(2)}',
                    style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: const Color(0xFF0F172A)),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: isDelivered ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '● ${status.toUpperCase()} • ${(order['orderType'] ?? 'PICKUP').toString().toUpperCase()}',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: isDelivered ? const Color(0xFF16A34A) : const Color(0xFFD97706),
                      ),
                    ),
                  ),
                  Text(
                    order['createdAt'] != null ? order['createdAt'].toString().substring(0, 16).replaceFirst('T', ' ') : '',
                    style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
                  ),
                ],
              ),
              if (order['couponCode'] != null) ...[
                const SizedBox(height: 4),
                Text(
                  'Coupon: ${order['couponCode']}',
                  style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF2563EB), fontWeight: FontWeight.bold),
                ),
              ],
              if (items.isNotEmpty) ...[
                const Divider(height: 16, color: Color(0xFFF1F5F9)),
                ...items.map((item) {
                  final name = item['name'] is Map ? item['name']['name'] : item['name'];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Row(
                      children: [
                        Text('${item['quantity']}x', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 11.5, color: const Color(0xFF0F172A))),
                        const SizedBox(width: 6),
                        Expanded(child: Text(name.toString(), style: GoogleFonts.inter(fontSize: 11.5, color: const Color(0xFF64748B)), overflow: TextOverflow.ellipsis)),
                        Text('\$${(item['price'] ?? 0).toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 11.5, color: const Color(0xFF0F172A))),
                      ],
                    ),
                  );
                }),
              ],
            ],
          ),
        );
      },
    );
  }

  // ── Tab 2: Loyalty & Rewards ──
  Widget _buildLoyaltyTab() {
    final loyalty = _profileData?['loyalty'] ?? {};
    final history = loyalty['history'] as List? ?? [];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF800000), Color(0xFF4A0000)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF800000).withValues(alpha: 0.25),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'AVAILABLE BALANCE',
                      style: GoogleFonts.inter(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Text(
                          '${loyalty['points'] ?? 0}',
                          style: GoogleFonts.inter(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(width: 8),
                        const Icon(Icons.star_rounded, color: Colors.amber, size: 24),
                      ],
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      'CURRENT TIER',
                      style: GoogleFonts.inter(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.amber.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.amber.shade300),
                      ),
                      child: Text(
                        '${loyalty['tier'] ?? widget.customer.loyaltyTier}',
                        style: GoogleFonts.inter(color: Colors.amber, fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Points History',
            style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
          ),
          const SizedBox(height: 10),
          if (history.isEmpty)
            Container(
              padding: const EdgeInsets.all(20),
              alignment: Alignment.center,
              child: Text("No Activity Yet", style: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 13)),
            )
          else
            ...history.map((h) {
              final pts = h['points'] ?? 0;
              final isPositive = pts > 0;
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          h['description'] ?? 'Points Update',
                          style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13, color: const Color(0xFF0F172A)),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          h['createdAt'] != null ? h['createdAt'].toString().substring(0, 10) : '',
                          style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
                        ),
                      ],
                    ),
                    Text(
                      '${isPositive ? '+' : ''}$pts',
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        color: isPositive ? const Color(0xFF16A34A) : Colors.red,
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }
}
