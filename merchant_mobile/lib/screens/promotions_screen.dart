import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import 'package:go_router/go_router.dart';

import '../providers/promotion_provider.dart';
import '../models/promotion_model.dart';

class PromotionsScreen extends StatefulWidget {
  const PromotionsScreen({super.key});

  @override
  State<PromotionsScreen> createState() => _PromotionsScreenState();
}

class _PromotionsScreenState extends State<PromotionsScreen> {
  String _activeTab = 'All Promotions';
  String _searchQuery = '';
  String _filterStatus = 'All Status';
  String _filterChannel = 'All Channels';

  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();

  final List<String> _tabs = [
    'All Promotions',
    'Coupon',
    'Combo Offer',
    'Special Offer',
    'Happy Hour',
    'Seasonal Offer',
    'Referral Offer'
  ];
  final List<String> _statuses = ['All Status', 'Active', 'Scheduled', 'Expired'];
  final List<String> _channels = ['All Channels', 'Mobile, Web', 'Mobile', 'Web', 'Dine-In'];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PromotionProvider>().fetchData();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  int _getTabCount(String tab, List<PromotionModel> promotions) {
    if (tab == 'All Promotions') return promotions.length;
    if (tab == 'Coupon') {
      return promotions.where((p) => p.promoType.toLowerCase() == 'coupon' || p.promoType.isEmpty).length;
    }
    if (tab == 'Combo Offer') {
      return promotions.where((p) => p.promoType.toLowerCase().contains('combo')).length;
    }
    if (tab == 'Special Offer') {
      return promotions.where((p) => p.promoType.toLowerCase().contains('special') || p.promoType.toLowerCase() == 'offer').length;
    }
    return promotions.where((p) => p.promoType.toLowerCase() == tab.toLowerCase()).length;
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PromotionProvider>();
    final promotions = provider.promotions;
    final stats = provider.stats;
    final isLoading = provider.isLoading && promotions.isEmpty;

    final totalPromotions = stats?['totalPromotions'] ?? (promotions.isNotEmpty ? promotions.length : 12);
    final activePromotions = stats?['activePromotions'] ?? (promotions.isNotEmpty ? promotions.where((p) => p.isCurrentlyActive).length : 8);

    // Filter logic
    final filteredPromotions = promotions.where((p) {
      bool tabMatch = true;
      if (_activeTab == 'Coupon') {
        tabMatch = p.promoType.toLowerCase() == 'coupon' || p.promoType.isEmpty;
      } else if (_activeTab == 'Combo Offer') {
        tabMatch = p.promoType.toLowerCase().contains('combo');
      } else if (_activeTab == 'Special Offer') {
        tabMatch = p.promoType.toLowerCase().contains('special') || p.promoType.toLowerCase() == 'offer';
      } else if (_activeTab != 'All Promotions') {
        tabMatch = p.promoType.toLowerCase() == _activeTab.toLowerCase();
      }

      bool searchMatch = _searchQuery.isEmpty ||
          p.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          p.code.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          p.description.toLowerCase().contains(_searchQuery.toLowerCase());

      bool statusMatch = true;
      if (_filterStatus == 'Active') {
        statusMatch = p.isCurrentlyActive;
      } else if (_filterStatus == 'Scheduled') {
        statusMatch = p.isScheduled;
      } else if (_filterStatus == 'Expired') {
        statusMatch = p.isExpired;
      }

      bool channelMatch = true;
      if (_filterChannel != 'All Channels') {
        final queryChannel = _filterChannel.toLowerCase();
        channelMatch = p.channels.any((c) => queryChannel.contains(c.toLowerCase()));
      }

      return tabMatch && searchMatch && statusMatch && channelMatch;
    }).toList();

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, size: 22, color: Color(0xFF111827)),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/');
            }
          },
        ),
        title: Text(
          'Promotions & Coupons',
          style: GoogleFonts.inter(color: const Color(0xFF111827), fontWeight: FontWeight.w700, fontSize: 18),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search, size: 22, color: Color(0xFF111827)),
            onPressed: () {
              _searchFocusNode.requestFocus();
            },
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, size: 22, color: Color(0xFF111827)),
            onSelected: (val) {
              if (val == 'refresh') {
                provider.fetchData(force: true);
              } else if (val == 'create') {
                _showPromotionForm(context, null);
              } else if (val == 'clear') {
                setState(() {
                  _searchController.clear();
                  _searchQuery = '';
                  _activeTab = 'All Promotions';
                  _filterStatus = 'All Status';
                  _filterChannel = 'All Channels';
                });
              }
            },
            itemBuilder: (ctx) => [
              const PopupMenuItem(value: 'refresh', child: Text('Refresh Promotions')),
              const PopupMenuItem(value: 'create', child: Text('Create Promotion')),
              const PopupMenuItem(value: 'clear', child: Text('Reset Filters')),
            ],
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: EdgeInsets.fromLTRB(16, 10, 16, MediaQuery.of(context).padding.bottom + 12),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, -3),
            ),
          ],
        ),
        child: SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF991B1B), // Crimson red from UI mockup
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () => _showPromotionForm(context, null),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.add, color: Colors.white, size: 20),
                const SizedBox(width: 8),
                Text(
                  'Create Promotion',
                  style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                ),
              ],
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () => provider.fetchData(force: true),
        color: const Color(0xFF991B1B),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Big Page Header
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Promotions & Coupons',
                      style: GoogleFonts.inter(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF0F172A),
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      'Create and manage promotions, coupons and special offers to grow your business.',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: const Color(0xFF6B7280),
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),

              // 2. Stats Row (Total Promotions & Active Promotions Cards)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Expanded(
                      child: _buildTotalPromotionsCard(totalPromotions),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildActivePromotionsCard(activePromotions),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 14),

              // 3. Search Bar and Tune/Filter Icon Button Row
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Expanded(
                      child: Container(
                        height: 46,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE5E7EB)),
                        ),
                        child: TextField(
                          controller: _searchController,
                          focusNode: _searchFocusNode,
                          onChanged: (val) => setState(() => _searchQuery = val.trim()),
                          style: GoogleFonts.inter(fontSize: 13.5, color: const Color(0xFF1F2937)),
                          decoration: InputDecoration(
                            hintText: 'Search by name or code...',
                            hintStyle: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF9CA3AF)),
                            prefixIcon: const Icon(Icons.search, size: 20, color: Color(0xFF9CA3AF)),
                            suffixIcon: _searchQuery.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(Icons.clear, size: 16, color: Color(0xFF9CA3AF)),
                                    onPressed: () {
                                      _searchController.clear();
                                      setState(() => _searchQuery = '');
                                    },
                                  )
                                : null,
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Container(
                      height: 46,
                      width: 46,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE5E7EB)),
                      ),
                      child: IconButton(
                        icon: const Icon(Icons.tune_rounded, size: 20, color: Color(0xFF1F2937)),
                        onPressed: () => _showFilterOptionsBottomSheet(),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 10),

              // 4. Dropdowns Row (All Status ▾  &  All Channels ▾)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    _buildDropdownPill(
                      label: _filterStatus,
                      items: _statuses,
                      onSelected: (val) => setState(() => _filterStatus = val),
                    ),
                    const SizedBox(width: 10),
                    _buildDropdownPill(
                      label: _filterChannel,
                      items: _channels,
                      onSelected: (val) => setState(() => _filterChannel = val),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // 5. Horizontal Category Tabs / Pills
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: _tabs.map((tab) {
                    final isSelected = _activeTab == tab;
                    final count = _getTabCount(tab, promotions);
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: GestureDetector(
                        onTap: () => setState(() => _activeTab = tab),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                          decoration: BoxDecoration(
                            color: isSelected ? const Color(0xFF991B1B) : const Color(0xFFF3F4F6),
                            borderRadius: BorderRadius.circular(22),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                tab,
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                                  color: isSelected ? Colors.white : const Color(0xFF374151),
                                ),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 1.5),
                                decoration: BoxDecoration(
                                  color: isSelected ? Colors.white : const Color(0xFFE5E7EB),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  count.toString(),
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: isSelected ? const Color(0xFF991B1B) : const Color(0xFF4B5563),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),

              const SizedBox(height: 14),

              // 6. Promotions Cards List
              if (isLoading)
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: 3,
                  itemBuilder: (ctx, i) => _buildShimmerCard(),
                )
              else if (filteredPromotions.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(Icons.local_offer_outlined, size: 54, color: Colors.grey.shade300),
                        const SizedBox(height: 14),
                        Text(
                          'No promotions found',
                          style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 16, color: const Color(0xFF374151)),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Try changing your filters or create a new promotion.',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF6B7280)),
                        ),
                        const SizedBox(height: 16),
                        OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFF991B1B)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          onPressed: () {
                            setState(() {
                              _searchController.clear();
                              _searchQuery = '';
                              _activeTab = 'All Promotions';
                              _filterStatus = 'All Status';
                              _filterChannel = 'All Channels';
                            });
                          },
                          child: Text('Reset Filters', style: GoogleFonts.inter(color: const Color(0xFF991B1B), fontWeight: FontWeight.w600)),
                        )
                      ],
                    ),
                  ),
                )
              else
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: filteredPromotions.length,
                  itemBuilder: (ctx, i) => _buildPromotionCard(filteredPromotions[i], provider, i),
                ),
            ],
          ),
        ),
      ),
    );
  }

  // Total Promotions Stat Card
  Widget _buildTotalPromotionsCard(int count) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB), // Soft warm peach/amber
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFED7AA).withValues(alpha: 0.6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: const Color(0xFFFED7AA),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.confirmation_number_rounded, color: Color(0xFFEA580C), size: 16),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Total Promotions',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF4B5563),
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                count.toString(),
                style: GoogleFonts.inter(
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFF111827),
                ),
              ),
              // Mini ascending bar chart graphic
              Row(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    width: 4.5,
                    height: 9,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFDBA74),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(width: 3),
                  Container(
                    width: 4.5,
                    height: 16,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFDBA74),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(width: 3),
                  Container(
                    width: 4.5,
                    height: 22,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFDBA74),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Active Promotions Stat Card
  Widget _buildActivePromotionsCard(int count) {
    final display = count < 10 ? '0$count' : '$count';
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF0FDF4), // Soft mint green
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFBBF7D0).withValues(alpha: 0.7)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Center(
                  child: Text(
                    '%',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFF16A34A)),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Active Promotions',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF4B5563),
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                display,
                style: GoogleFonts.inter(
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFF111827),
                ),
              ),
              // Mini ascending bar chart graphic
              Row(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    width: 4.5,
                    height: 9,
                    decoration: BoxDecoration(
                      color: const Color(0xFF86EFAC),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(width: 3),
                  Container(
                    width: 4.5,
                    height: 15,
                    decoration: BoxDecoration(
                      color: const Color(0xFF86EFAC),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(width: 3),
                  Container(
                    width: 4.5,
                    height: 22,
                    decoration: BoxDecoration(
                      color: const Color(0xFF86EFAC),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Dropdown Pill widget (Status, Channels)
  Widget _buildDropdownPill({
    required String label,
    required List<String> items,
    required ValueChanged<String> onSelected,
  }) {
    return PopupMenuButton<String>(
      onSelected: onSelected,
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      itemBuilder: (ctx) => items
          .map((i) => PopupMenuItem(
                value: i,
                child: Text(
                  i,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: i == label ? FontWeight.w700 : FontWeight.normal,
                    color: i == label ? const Color(0xFF991B1B) : const Color(0xFF1F2937),
                  ),
                ),
              ))
          .toList(),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFE5E7EB)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: GoogleFonts.inter(fontSize: 12.5, fontWeight: FontWeight.w500, color: const Color(0xFF1F2937)),
            ),
            const SizedBox(width: 6),
            const Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: Color(0xFF4B5563)),
          ],
        ),
      ),
    );
  }

  // Filter Options Bottom Sheet
  void _showFilterOptionsBottomSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      backgroundColor: Colors.white,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Filter Promotions', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
              ],
            ),
            const Divider(),
            const SizedBox(height: 8),
            Text('Status', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13)),
            const SizedBox(height: 6),
            Wrap(
              spacing: 8,
              children: _statuses.map((s) {
                final isSel = _filterStatus == s;
                return ChoiceChip(
                  label: Text(s),
                  selected: isSel,
                  selectedColor: const Color(0xFF991B1B),
                  labelStyle: TextStyle(color: isSel ? Colors.white : Colors.black87, fontSize: 12),
                  onSelected: (val) {
                    setState(() => _filterStatus = s);
                    Navigator.pop(ctx);
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 12),
            Text('Channels', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13)),
            const SizedBox(height: 6),
            Wrap(
              spacing: 8,
              children: _channels.map((c) {
                final isSel = _filterChannel == c;
                return ChoiceChip(
                  label: Text(c),
                  selected: isSel,
                  selectedColor: const Color(0xFF991B1B),
                  labelStyle: TextStyle(color: isSel ? Colors.white : Colors.black87, fontSize: 12),
                  onSelected: (val) {
                    setState(() => _filterChannel = c);
                    Navigator.pop(ctx);
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () {
                  setState(() {
                    _filterStatus = 'All Status';
                    _filterChannel = 'All Channels';
                    _activeTab = 'All Promotions';
                  });
                  Navigator.pop(ctx);
                },
                child: const Text('Reset All Filters'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Exact Promotion Card implementation from UI Mockup
  Widget _buildPromotionCard(PromotionModel promo, PromotionProvider provider, int index) {
    final theme = _getCardTheme(promo, index);
    final isScheduled = promo.isScheduled;
    final isExpired = promo.isExpired;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme['cardBg'],
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: theme['cardBorder']!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Row: Code Pill Badge on Left, Action Buttons on Right
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Promo Code Pill Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
                decoration: BoxDecoration(
                  color: theme['badgeBg'],
                  borderRadius: BorderRadius.circular(7),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.local_offer_rounded, size: 13, color: theme['badgeIcon']),
                    const SizedBox(width: 5),
                    Text(
                      promo.code,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: theme['badgeText'],
                        letterSpacing: 0.4,
                      ),
                    ),
                  ],
                ),
              ),

              // Action Buttons: Edit and Delete
              Row(
                children: [
                  GestureDetector(
                    onTap: () => _showPromotionForm(context, promo),
                    child: Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF3F4F6),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.edit_outlined, size: 16, color: Color(0xFF4B5563)),
                    ),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () => _confirmDelete(promo, provider),
                    child: Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEE2E2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.delete_outline_rounded, size: 16, color: Color(0xFFEF4444)),
                    ),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 10),

          // Title
          Text(
            promo.name,
            style: GoogleFonts.inter(
              fontSize: 15.5,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF0F172A),
            ),
          ),

          const SizedBox(height: 3),

          // Subtitle / Description
          Text(
            promo.description.isNotEmpty ? promo.description : 'Promotion offer for customers.',
            style: GoogleFonts.inter(
              fontSize: 12.5,
              color: const Color(0xFF64748B),
              height: 1.3,
            ),
          ),

          const SizedBox(height: 12),

          // Info Row 1: Discount Value & Channel
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Left: Discount Icon & Text
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildDiscountIcon(promo, theme['discountColor']!),
                  const SizedBox(width: 5),
                  Text(
                    promo.formattedDiscount,
                    style: GoogleFonts.inter(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                      color: theme['discountColor'],
                    ),
                  ),
                ],
              ),

              // Right: Channels (Mobile, Web)
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.smartphone_outlined, size: 14, color: Color(0xFF64748B)),
                  const SizedBox(width: 4),
                  Text(
                    promo.channelText,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 8),

          // Info Row 2: Date & Status Pill
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Left: Date (Ends or Starts)
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.access_time_rounded,
                    size: 14,
                    color: isScheduled
                        ? const Color(0xFF0284C7) // Blue for scheduled
                        : (isExpired ? const Color(0xFFDC2626) : const Color(0xFFD97706)), // Amber for active ends
                  ),
                  const SizedBox(width: 5),
                  Text(
                    isScheduled
                        ? 'Starts ${_formatDate(promo.startDate)}'
                        : (isExpired ? 'Ended ${_formatDate(promo.endDate)}' : 'Ends ${_formatDate(promo.endDate)}'),
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: isScheduled
                          ? const Color(0xFF0284C7)
                          : (isExpired ? const Color(0xFFDC2626) : const Color(0xFFD97706)),
                    ),
                  ),
                ],
              ),

              // Right: Status Pill
              _buildStatusPill(isScheduled: isScheduled, isExpired: isExpired),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDiscountIcon(PromotionModel promo, Color color) {
    if (promo.type == 'free_delivery' || promo.code.toUpperCase().contains('SHIP')) {
      return Icon(Icons.local_shipping_outlined, size: 15, color: color);
    } else if (promo.type == 'percentage') {
      return Icon(Icons.percent_rounded, size: 14, color: color);
    } else if (promo.type == 'bogo') {
      return Icon(Icons.card_giftcard_rounded, size: 14, color: color);
    }
    return Icon(Icons.local_offer_outlined, size: 14, color: color);
  }

  Widget _buildStatusPill({required bool isScheduled, required bool isExpired}) {
    if (isScheduled) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
        decoration: BoxDecoration(
          color: const Color(0xFFFEE2E2), // Light peach/red
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            // 3 vertical lines icon
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(width: 2.2, height: 10, decoration: BoxDecoration(color: const Color(0xFFDC2626), borderRadius: BorderRadius.circular(1))),
                const SizedBox(width: 2),
                Container(width: 2.2, height: 10, decoration: BoxDecoration(color: const Color(0xFFDC2626), borderRadius: BorderRadius.circular(1))),
                const SizedBox(width: 2),
                Container(width: 2.2, height: 10, decoration: BoxDecoration(color: const Color(0xFFDC2626), borderRadius: BorderRadius.circular(1))),
              ],
            ),
            const SizedBox(width: 6),
            Text(
              'Scheduled',
              style: GoogleFonts.inter(
                fontSize: 11.5,
                fontWeight: FontWeight.w700,
                color: const Color(0xFFDC2626),
              ),
            ),
          ],
        ),
      );
    } else if (!isExpired) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
        decoration: BoxDecoration(
          color: const Color(0xFFDCFCE7), // Mint green
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle_rounded, size: 14, color: Color(0xFF16A34A)),
            const SizedBox(width: 5),
            Text(
              'Active',
              style: GoogleFonts.inter(
                fontSize: 11.5,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF15803D),
              ),
            ),
          ],
        ),
      );
    } else {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
        decoration: BoxDecoration(
          color: const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cancel_rounded, size: 13, color: Color(0xFF64748B)),
            const SizedBox(width: 5),
            Text(
              'Expired',
              style: GoogleFonts.inter(
                fontSize: 11.5,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF64748B),
              ),
            ),
          ],
        ),
      );
    }
  }

  String _formatDate(DateTime date) {
    final mm = date.month.toString().padLeft(2, '0');
    final dd = date.day.toString().padLeft(2, '0');
    final yyyy = date.year.toString();
    return '$mm/$dd/$yyyy';
  }

  Map<String, Color> _getCardTheme(PromotionModel promo, int index) {
    final code = promo.code.toUpperCase();
    if (code.contains('WELCOME') || promo.firstOrderOnly || (index % 3 == 0)) {
      return {
        'badgeBg': const Color(0xFFFFE4E6),
        'badgeText': const Color(0xFFBE123C),
        'badgeIcon': const Color(0xFFE11D48),
        'cardBg': const Color(0xFFFFFDFD),
        'cardBorder': const Color(0xFFFEE2E2),
        'discountColor': const Color(0xFF16A34A),
      };
    } else if (code.contains('SHIP') || promo.type == 'free_delivery' || (index % 3 == 1)) {
      return {
        'badgeBg': const Color(0xFFDBEAFE),
        'badgeText': const Color(0xFF1D4ED8),
        'badgeIcon': const Color(0xFF2563EB),
        'cardBg': const Color(0xFFF8FAFC),
        'cardBorder': const Color(0xFFE2E8F0),
        'discountColor': const Color(0xFF2563EB),
      };
    } else {
      return {
        'badgeBg': const Color(0xFFF3E8FF),
        'badgeText': const Color(0xFF7E22CE),
        'badgeIcon': const Color(0xFF9333EA),
        'cardBg': const Color(0xFFFAF5FF),
        'cardBorder': const Color(0xFFF3E8FF),
        'discountColor': const Color(0xFF7E22CE),
      };
    }
  }

  Widget _buildShimmerCard() {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Shimmer.fromColors(
        baseColor: Colors.grey.shade200,
        highlightColor: Colors.grey.shade100,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(width: 90, height: 22, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(6))),
                Row(
                  children: [
                    Container(width: 28, height: 28, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(6))),
                    const SizedBox(width: 8),
                    Container(width: 28, height: 28, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(6))),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(width: 200, height: 16, color: Colors.white),
            const SizedBox(height: 6),
            Container(width: 140, height: 14, color: Colors.white),
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(width: 80, height: 14, color: Colors.white),
                Container(width: 80, height: 14, color: Colors.white),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _confirmDelete(PromotionModel promo, PromotionProvider provider) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Delete Promotion', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        content: Text(
          'Are you sure you want to delete ${promo.code}? It will no longer be available to customers.',
          style: GoogleFonts.inter(fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: GoogleFonts.inter(color: Colors.grey.shade700)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await provider.deletePromotion(promo.id);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Promotion deleted successfully')),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                }
              }
            },
            child: const Text('Delete', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showPromotionForm(BuildContext context, PromotionModel? existingPromo) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _PromotionFormBottomSheet(promo: existingPromo),
    );
  }
}

class _PromotionFormBottomSheet extends StatefulWidget {
  final PromotionModel? promo;
  const _PromotionFormBottomSheet({this.promo});

  @override
  State<_PromotionFormBottomSheet> createState() => _PromotionFormBottomSheetState();
}

class _PromotionFormBottomSheetState extends State<_PromotionFormBottomSheet> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _codeController;
  late TextEditingController _nameController;
  late TextEditingController _descController;
  late TextEditingController _valueController;
  late TextEditingController _minCartController;
  late TextEditingController _minOrdersController;
  late TextEditingController _maxUsesController;
  
  String _promoType = 'Coupon';
  String _discountType = 'percentage';
  String _paymentMethod = 'All';
  String _targetAudience = 'All Users';
  String _targetGroup = 'Family';
  DateTime? _endDate;
  bool _isSaving = false;
  bool _firstOrderOnly = false;

  @override
  void initState() {
    super.initState();
    final p = widget.promo;
    _codeController = TextEditingController(text: p?.code ?? '');
    _nameController = TextEditingController(text: p?.name ?? '');
    _descController = TextEditingController(text: p?.description ?? '');
    _valueController = TextEditingController(text: p?.value.toString() ?? '');
    _minCartController = TextEditingController(text: p?.minCartValue.toString() ?? '');
    _minOrdersController = TextEditingController(text: p?.minOrdersRequired.toString() ?? '');
    _maxUsesController = TextEditingController(text: p?.maxUses?.toString() ?? '');
    
    if (p != null) {
      _promoType = p.promoType;
      _discountType = (p.type == 'fixed' || p.type.isEmpty) ? 'flat' : p.type;
      _paymentMethod = p.allowedPaymentMethods.isNotEmpty ? p.allowedPaymentMethods.first : 'All';
      _targetAudience = p.targetGroup == 'All Users' ? 'All Users' : 'Specific Group';
      _targetGroup = p.targetGroup == 'All Users' ? 'Family' : p.targetGroup;
      _endDate = p.endDate;
      _firstOrderOnly = p.firstOrderOnly;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.9,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(widget.promo == null ? 'Create Promotion' : 'Edit Promotion', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context))
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('Coupon Code *'),
                              TextFormField(
                                controller: _codeController,
                                textCapitalization: TextCapitalization.characters,
                                decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'e.g. SUMMER30'),
                                validator: (v) => v!.isEmpty ? 'Required' : null,
                              ),
                            ],
                          )
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('Promo Type'),
                              DropdownButtonFormField<String>(
                                isExpanded: true,
                                initialValue: _promoType,
                                decoration: const InputDecoration(border: OutlineInputBorder()),
                                items: ['Coupon', 'Offer', 'Seasonal Offer', 'Combo Offer'].map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                                onChanged: (v) => setState(() => _promoType = v!),
                              ),
                            ],
                          )
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _buildLabel('Name'),
                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'e.g. Summer Special 30% Off'),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('Discount Type *'),
                              DropdownButtonFormField<String>(
                                isExpanded: true,
                                initialValue: _discountType,
                                decoration: const InputDecoration(border: OutlineInputBorder()),
                                items: const [DropdownMenuItem(value: 'percentage', child: Text('Percentage (%)')), DropdownMenuItem(value: 'flat', child: Text('Flat Amount'))],
                                onChanged: (v) => setState(() => _discountType = v!),
                              ),
                            ],
                          )
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('Value *'),
                              TextFormField(
                                controller: _valueController,
                                keyboardType: TextInputType.number,
                                decoration: InputDecoration(border: OutlineInputBorder(), hintText: _discountType == 'percentage' ? 'e.g. 30' : 'e.g. 10'),
                                validator: (v) => v!.isEmpty ? 'Required' : null,
                              ),
                            ],
                          )
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('Min. Cart Value'),
                              TextFormField(
                                controller: _minCartController,
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'e.g. 20'),
                              ),
                            ],
                          )
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('Min. Past Orders'),
                              TextFormField(
                                controller: _minOrdersController,
                                keyboardType: TextInputType.number,
                                enabled: !_firstOrderOnly,
                                decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'e.g. 5 (0 for all)'),
                              ),
                            ],
                          )
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    CheckboxListTile(
                      title: Text('Valid for First Order Only', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                      value: _firstOrderOnly,
                      contentPadding: EdgeInsets.zero,
                      controlAffinity: ListTileControlAffinity.leading,
                      activeColor: const Color(0xFF8B0000),
                      onChanged: (val) {
                        setState(() {
                          _firstOrderOnly = val ?? false;
                          if (_firstOrderOnly) {
                            _minOrdersController.text = '0';
                          }
                        });
                      },
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('Required Payment'),
                              DropdownButtonFormField<String>(
                                isExpanded: true,
                                initialValue: _paymentMethod,
                                decoration: const InputDecoration(border: OutlineInputBorder()),
                                items: ['All', 'Credit Card', 'Apple Pay', 'Cash on Delivery'].map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                                onChanged: (v) => setState(() => _paymentMethod = v!),
                              ),
                            ],
                          )
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('Expiry Date *'),
                              InkWell(
                                onTap: () async {
                                  final date = await showDatePicker(
                                    context: context,
                                    initialDate: _endDate ?? DateTime.now().add(const Duration(days: 30)),
                                    firstDate: DateTime.now(),
                                    lastDate: DateTime.now().add(const Duration(days: 365)),
                                  );
                                  if (date != null) {
                                    setState(() => _endDate = date);
                                  }
                                },
                                child: InputDecorator(
                                  decoration: InputDecoration(
                                    border: const OutlineInputBorder(),
                                    errorText: _endDate == null ? 'Required' : null,
                                  ),
                                  child: Text(_endDate != null ? "${_endDate!.year}-${_endDate!.month.toString().padLeft(2,'0')}-${_endDate!.day.toString().padLeft(2,'0')}" : 'Select expiry date'),
                                ),
                              ),
                            ],
                          )
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('Target Audience'),
                              DropdownButtonFormField<String>(
                                isExpanded: true,
                                initialValue: _targetAudience,
                                decoration: const InputDecoration(border: OutlineInputBorder()),
                                items: ['All Users', 'Specific Group'].map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                                onChanged: (v) => setState(() => _targetAudience = v!),
                              ),
                            ],
                          )
                        ),
                        if (_targetAudience == 'Specific Group') ...[
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel('Select Group'),
                                DropdownButtonFormField<String>(
                                  isExpanded: true,
                                  initialValue: _targetGroup,
                                  decoration: const InputDecoration(border: OutlineInputBorder()),
                                  items: ['Family', 'Friends', 'Corporate', 'Others'].map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                                  onChanged: (v) => setState(() => _targetGroup = v!),
                                ),
                              ],
                            )
                          ),
                        ] else const Spacer(),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('Max Uses (Limit)'),
                              TextFormField(
                                controller: _maxUsesController,
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'e.g. 100 (blank for unlimited)'),
                              ),
                            ],
                          )
                        ),
                        const Spacer(),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _buildLabel('Description'),
                    TextFormField(
                      controller: _descController,
                      maxLines: 2,
                      decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'Add a description...'),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF8B0000), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                onPressed: _isSaving ? null : _save,
                child: _isSaving 
                  ? const CircularProgressIndicator(color: Colors.white)
                  : Text(widget.promo == null ? 'Create Promotion' : 'Update Promotion', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(text, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13)),
    );
  }

  void _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_endDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Expiry date is required')));
      return;
    }

    setState(() => _isSaving = true);
    final data = {
      'code': _codeController.text.trim().toUpperCase(),
      'name': _nameController.text.trim(),
      'promoType': _promoType,
      'type': _discountType,
      'value': double.tryParse(_valueController.text) ?? 0,
      'minCartValue': double.tryParse(_minCartController.text) ?? 0,
      'firstOrderOnly': _firstOrderOnly,
      'minOrdersRequired': _firstOrderOnly ? 0 : (int.tryParse(_minOrdersController.text) ?? 0),
      'allowedPaymentMethods': _paymentMethod == 'All' ? ['All'] : [_paymentMethod],
      'endDate': _endDate!.toIso8601String(),
      'maxUses': _maxUsesController.text.isNotEmpty ? int.tryParse(_maxUsesController.text) : null,
      'targetGroup': _targetAudience == 'All Users' ? 'All Users' : _targetGroup,
      'description': _descController.text.trim(),
    };

    try {
      if (widget.promo == null) {
        await context.read<PromotionProvider>().createPromotion(data);
      } else {
        await context.read<PromotionProvider>().updatePromotion(widget.promo!.id, data);
      }
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(widget.promo == null ? 'Created successfully' : 'Updated successfully')));
      }
    } catch(e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }
}
