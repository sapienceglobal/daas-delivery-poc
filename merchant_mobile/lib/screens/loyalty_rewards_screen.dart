import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:toastification/toastification.dart';

import '../providers/auth_provider.dart';
import '../providers/loyalty_provider.dart';
import '../widgets/app_drawer.dart';
import '../widgets/shared_bottom_nav.dart';

class LoyaltyRewardsScreen extends StatefulWidget {
  const LoyaltyRewardsScreen({Key? key}) : super(key: key);

  @override
  State<LoyaltyRewardsScreen> createState() => _LoyaltyRewardsScreenState();
}

class _LoyaltyRewardsScreenState extends State<LoyaltyRewardsScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedFilter = 'all'; // 'all', 'earned', 'redeemed'

  static const Color _primaryRed = Color(0xFF8B0000);
  static const Color _bgGrey = Color(0xFFF8FAFC);
  static const Color _cardBorder = Color(0xFFE2E8F0);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<LoyaltyProvider>().fetchLoyaltyData();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _openManageProgramSheet(LoyaltyProvider provider) {
    final auth = context.read<AuthProvider>();
    final restaurantId = auth.user?['restaurantId']?.toString() ?? '';

    bool enabled = provider.isProgramEnabled;
    final earnRateCtrl = TextEditingController(text: provider.pointsPerDollar.toString());
    final centsCtrl = TextEditingController(text: provider.centsPerPoint.toString());
    final multiplierCtrl = TextEditingController(text: provider.minimumOrderMultiplier.toString());
    final termsCtrl = TextEditingController(text: provider.termsAndConditions);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final earnRate = double.tryParse(earnRateCtrl.text) ?? 1.0;
          final centsVal = double.tryParse(centsCtrl.text) ?? 1.0;
          final multVal = double.tryParse(multiplierCtrl.text) ?? 3.0;

          final previewPoints = (500 * earnRate).toInt();
          final previewDiscount = (previewPoints * centsVal) / 100;
          final previewMinOrder = previewDiscount * multVal;

          return Container(
            height: MediaQuery.of(context).size.height * 0.85,
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 16, 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: _primaryRed.withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.settings, color: _primaryRed, size: 20),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Loyalty Program Settings',
                                style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 17, color: const Color(0xFF111827)),
                              ),
                              Text(
                                'Manage earn rates & discount rules',
                                style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                              ),
                            ],
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: Color(0xFF64748B)),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),

                // Form Content
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.all(20),
                    children: [
                      // Enable Toggle
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: _cardBorder),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Enable Loyalty Program', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: const Color(0xFF1E293B))),
                                const SizedBox(height: 2),
                                Text('Allow customers to earn & redeem points', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
                              ],
                            ),
                            Switch(
                              value: enabled,
                              activeColor: const Color(0xFF16A34A),
                              onChanged: (val) => setModalState(() => enabled = val),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Rates inputs
                      Row(
                        children: [
                          Expanded(
                            child: _buildInputField(
                              label: 'Points Earn Rate',
                              controller: earnRateCtrl,
                              suffix: 'pts / \$1',
                              onChanged: (_) => setModalState(() {}),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: _buildInputField(
                              label: 'Redemption Value',
                              controller: centsCtrl,
                              suffix: 'cents / pt',
                              onChanged: (_) => setModalState(() {}),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      _buildInputField(
                        label: 'Minimum Order Multiplier',
                        controller: multiplierCtrl,
                        suffix: 'X Coupon Value',
                        hint: 'e.g. 3 (A \$5 coupon requires \$15 min order)',
                        onChanged: (_) => setModalState(() {}),
                      ),
                      const SizedBox(height: 18),

                      // Live Calculation Preview Box
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFBFDBFE)),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: const BoxDecoration(
                                color: Color(0xFFDBEAFE),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.calculate_outlined, color: Color(0xFF2563EB), size: 18),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Program Preview',
                                    style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13, color: const Color(0xFF1E3A8A)),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'A customer spending \$500 will earn $previewPoints points. When redeeming, $previewPoints points translate to \$${previewDiscount.toStringAsFixed(2)} OFF. They will need to place a minimum order of \$${previewMinOrder.toStringAsFixed(2)} to use this coupon.',
                                    style: GoogleFonts.inter(fontSize: 12.5, color: const Color(0xFF1E40AF), height: 1.4),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 18),

                      // Terms & Conditions
                      Text(
                        'Terms & Conditions',
                        style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF334155)),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: termsCtrl,
                        maxLines: 3,
                        decoration: InputDecoration(
                          hintText: 'Enter terms displayed to customers...',
                          hintStyle: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _primaryRed, width: 2)),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),

                // Footer Save Button
                SafeArea(
                  top: false,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      border: Border(top: BorderSide(color: Color(0xFFF1F5F9))),
                    ),
                    child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.pop(ctx),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: Text('Cancel', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: const Color(0xFF475569))),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 2,
                        child: ElevatedButton(
                          onPressed: provider.isSaving
                              ? null
                              : () async {
                                  final success = await provider.updateSettings(restaurantId, {
                                    'enabled': enabled,
                                    'pointsPerDollar': double.tryParse(earnRateCtrl.text) ?? 1.0,
                                    'centsPerPoint': double.tryParse(centsCtrl.text) ?? 1.0,
                                    'minimumOrderMultiplier': double.tryParse(multiplierCtrl.text) ?? 3.0,
                                    'termsAndConditions': termsCtrl.text.trim(),
                                  });

                                  if (mounted) {
                                    if (success) {
                                      Navigator.pop(ctx);
                                      toastification.show(
                                        context: context,
                                        type: ToastificationType.success,
                                        title: const Text('Settings Saved'),
                                        description: const Text('Loyalty rules updated successfully.'),
                                        autoCloseDuration: const Duration(seconds: 3),
                                      );
                                    } else {
                                      toastification.show(
                                        context: context,
                                        type: ToastificationType.error,
                                        title: const Text('Update Failed'),
                                        description: Text(provider.error.isNotEmpty ? provider.error : 'Could not save settings.'),
                                        autoCloseDuration: const Duration(seconds: 3),
                                      );
                                    }
                                  }
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _primaryRed,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: provider.isSaving
                              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : Text('Save Program Settings', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14)),
                        ),
                      ),
                    ],
                  ),
                ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildInputField({
    required String label,
    required TextEditingController controller,
    required String suffix,
    String? hint,
    required Function(String) onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 12.5, fontWeight: FontWeight.bold, color: const Color(0xFF334155))),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          onChanged: onChanged,
          decoration: InputDecoration(
            hintText: hint,
            suffixText: suffix,
            suffixStyle: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF64748B)),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _primaryRed, width: 2)),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final loyalty = context.watch<LoyaltyProvider>();

    return Scaffold(
      backgroundColor: _bgGrey,
      appBar: AppBar(
        title: Column(
          children: [
            Text(
              'Loyalty & Rewards',
              style: GoogleFonts.outfit(color: const Color(0xFF111827), fontSize: 20, fontWeight: FontWeight.bold),
            ),
            Text(
              'Customer Points & Engagement',
              style: GoogleFonts.inter(color: const Color(0xFF6B7280), fontSize: 11, fontWeight: FontWeight.w500),
            ),
          ],
        ),
        backgroundColor: Colors.white,
        elevation: 0.5,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Color(0xFF111827)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12.0),
            child: TextButton.icon(
              onPressed: () => _openManageProgramSheet(loyalty),
              icon: const Icon(Icons.tune, size: 18, color: _primaryRed),
              label: Text(
                'Manage',
                style: GoogleFonts.inter(color: _primaryRed, fontWeight: FontWeight.bold, fontSize: 14),
              ),
            ),
          ),
        ],
      ),
      drawer: const AppDrawer(),
      body: loyalty.isLoading
          ? const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(color: _primaryRed),
                  SizedBox(height: 16),
                  Text('Loading Loyalty Rewards...', style: TextStyle(color: Color(0xFF64748B))),
                ],
              ),
            )
          : RefreshIndicator(
              color: _primaryRed,
              onRefresh: () => loyalty.fetchLoyaltyData(),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Program Status Card
                  _buildProgramStatusCard(loyalty),
                  const SizedBox(height: 16),

                  // 4 Stats Cards Grid
                  _buildStatsGrid(loyalty),
                  const SizedBox(height: 20),

                  // Program Rules & Exchange Rate Summary
                  _buildRulesCard(loyalty),
                  const SizedBox(height: 24),

                  // Recent Activity Header & Filters
                  _buildActivitySection(loyalty),
                  const SizedBox(height: 80),
                ],
              ),
            ),
      bottomNavigationBar: const SharedBottomNav(currentIndex: -1),
    );
  }

  // -------------------------------------------------------------
  // STATUS CARD
  // -------------------------------------------------------------
  Widget _buildProgramStatusCard(LoyaltyProvider loyalty) {
    final isEnabled = loyalty.isProgramEnabled;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isEnabled ? const Color(0xFFF0FDF4) : const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isEnabled ? const Color(0xFFBBF7D0) : const Color(0xFFFECACA)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isEnabled ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isEnabled ? Icons.check_circle_rounded : Icons.pause_circle_filled_rounded,
              color: isEnabled ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
              size: 24,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isEnabled ? 'Loyalty Program is Active' : 'Loyalty Program is Paused',
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    color: isEnabled ? const Color(0xFF14532D) : const Color(0xFF7F1D1D),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  isEnabled
                      ? 'Customers are currently earning points on purchases.'
                      : 'Points earning and redemptions are temporarily suspended.',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: isEnabled ? const Color(0xFF166534) : const Color(0xFF991B1B),
                  ),
                ),
              ],
            ),
          ),
          InkWell(
            onTap: () => _openManageProgramSheet(loyalty),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: isEnabled ? const Color(0xFF86EFAC) : const Color(0xFFFCA5A5)),
              ),
              child: Text(
                'Edit',
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                  color: isEnabled ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // -------------------------------------------------------------
  // STATS GRID
  // -------------------------------------------------------------
  Widget _buildStatsGrid(LoyaltyProvider loyalty) {
    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.35,
      children: [
        _buildStatCard(
          title: 'Total Members',
          value: loyalty.totalMembers.toString(),
          icon: Icons.workspace_premium_rounded,
          iconColor: const Color(0xFFEA580C),
          bgColor: const Color(0xFFFFF7ED),
          footer: 'Enrolled Customers',
        ),
        _buildStatCard(
          title: 'Points Issued',
          value: loyalty.pointsIssued.toString(),
          icon: Icons.trending_up_rounded,
          iconColor: const Color(0xFF16A34A),
          bgColor: const Color(0xFFF0FDF4),
          footer: 'Lifetime Issued',
        ),
        _buildStatCard(
          title: 'Points Redeemed',
          value: loyalty.pointsRedeemed.toString(),
          icon: Icons.trending_down_rounded,
          iconColor: const Color(0xFFDC2626),
          bgColor: const Color(0xFFFEF2F2),
          footer: '${loyalty.redemptionRate}% Redemption Rate',
        ),
        _buildStatCard(
          title: 'Outstanding Points',
          value: loyalty.outstandingPoints.toString(),
          icon: Icons.card_giftcard_rounded,
          iconColor: const Color(0xFF9333EA),
          bgColor: const Color(0xFFFAF5FF),
          footer: 'Current Liability',
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required IconData icon,
    required Color iconColor,
    required Color bgColor,
    required String footer,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _cardBorder),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 6, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF64748B))),
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(8)),
                child: Icon(icon, color: iconColor, size: 18),
              ),
            ],
          ),
          Text(value, style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: const Color(0xFF111827))),
          Text(footer, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: iconColor)),
        ],
      ),
    );
  }

  // -------------------------------------------------------------
  // RULES & EXCHANGE RATE SUMMARY
  // -------------------------------------------------------------
  Widget _buildRulesCard(LoyaltyProvider loyalty) {
    final exchangeAmount = ((loyalty.centsPerPoint * 100) / 100).toStringAsFixed(2);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.rule_folder_outlined, color: _primaryRed, size: 20),
              const SizedBox(width: 8),
              Text(
                'Current Program Rules',
                style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: const Color(0xFF111827)),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Rule 1: Purchases
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFFDCFCE7), borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.star_rounded, color: Color(0xFF16A34A), size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Order Purchases', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13, color: const Color(0xFF1E293B))),
                    Text('Earn ${loyalty.pointsPerDollar} point per \$1 spent on all delivered orders.', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Rule 2: Daily Login
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.alarm_on_rounded, color: Color(0xFF3B82F6), size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Daily Login Bonus', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13, color: const Color(0xFF1E293B))),
                    Text('Earn 5 bonus points once per day upon opening the app.', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Divider(height: 1),
          const SizedBox(height: 12),

          // Exchange Rate Highlight
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF1F2),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFFECDD3)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.redeem_rounded, color: Color(0xFF9F1239), size: 18),
                    const SizedBox(width: 8),
                    Text('Redemption Rate', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13, color: const Color(0xFF9F1239))),
                  ],
                ),
                Text('100 Points = \$$exchangeAmount OFF', style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 13, color: const Color(0xFF9F1239))),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // -------------------------------------------------------------
  // RECENT ACTIVITY & TRANSACTION LIST
  // -------------------------------------------------------------
  Widget _buildActivitySection(LoyaltyProvider loyalty) {
    final query = _searchController.text.toLowerCase().trim();
    final allTxns = loyalty.recentTransactions;

    final filtered = allTxns.where((txn) {
      final type = txn['type']?.toString().toLowerCase() ?? '';
      if (_selectedFilter == 'earned' && type != 'earned' && type != 'bonus') return false;
      if (_selectedFilter == 'redeemed' && type != 'redeemed') return false;

      if (query.isNotEmpty) {
        final userName = txn['userId']?['name']?.toString().toLowerCase() ?? '';
        final userEmail = txn['userId']?['email']?.toString().toLowerCase() ?? '';
        final desc = txn['description']?.toString().toLowerCase() ?? '';
        final code = txn['reward']?['couponId']?['code']?.toString().toLowerCase() ?? '';

        return userName.contains(query) || userEmail.contains(query) || desc.contains(query) || code.contains(query);
      }
      return true;
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Recent Loyalty Activity',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 17, color: const Color(0xFF111827)),
            ),
            Text(
              '${filtered.length} entries',
              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Search bar
        TextField(
          controller: _searchController,
          onChanged: (_) => setState(() {}),
          decoration: InputDecoration(
            hintText: 'Search by customer, description, or coupon...',
            hintStyle: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
            prefixIcon: const Icon(Icons.search, size: 20, color: Color(0xFF94A3B8)),
            suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear, size: 18, color: Color(0xFF94A3B8)),
                    onPressed: () {
                      _searchController.clear();
                      setState(() {});
                    },
                  )
                : null,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _cardBorder)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _cardBorder)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _primaryRed, width: 2)),
          ),
        ),
        const SizedBox(height: 10),

        // Filter Pills
        Row(
          children: [
            _buildFilterChip('all', 'All Activity'),
            const SizedBox(width: 8),
            _buildFilterChip('earned', 'Earned & Bonus'),
            const SizedBox(width: 8),
            _buildFilterChip('redeemed', 'Redeemed'),
          ],
        ),
        const SizedBox(height: 14),

        // List
        if (filtered.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 40),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: _cardBorder),
            ),
            child: Column(
              children: [
                const Icon(Icons.history_toggle_off_rounded, size: 40, color: Color(0xFF94A3B8)),
                const SizedBox(height: 8),
                Text('No loyalty activity found', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14, color: const Color(0xFF64748B))),
                const SizedBox(height: 4),
                Text('Transactions will appear here as customers earn or redeem points.', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8))),
              ],
            ),
          )
        else
          ...filtered.map((txn) => _buildTransactionCard(txn)).toList(),
      ],
    );
  }

  Widget _buildFilterChip(String key, String label) {
    final isSelected = _selectedFilter == key;

    return InkWell(
      onTap: () => setState(() => _selectedFilter = key),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? _primaryRed : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? _primaryRed : _cardBorder),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : const Color(0xFF64748B),
          ),
        ),
      ),
    );
  }

  Widget _buildTransactionCard(dynamic txn) {
    final type = txn['type']?.toString().toLowerCase() ?? '';
    final isPositive = type == 'earned' || type == 'bonus';
    final points = txn['points'] ?? 0;
    final balanceAfter = txn['balanceAfter'] ?? 0;
    final userName = txn['userId']?['name']?.toString() ?? 'Customer';
    final userEmail = txn['userId']?['email']?.toString() ?? '';
    final description = txn['description']?.toString() ?? '';
    final couponCode = txn['reward']?['couponId']?['code']?.toString();

    DateTime? createdAt;
    if (txn['createdAt'] != null) {
      createdAt = DateTime.tryParse(txn['createdAt'].toString());
    }

    final dateStr = createdAt != null ? '${createdAt.month}/${createdAt.day}/${createdAt.year}' : 'Recent';
    final timeStr = createdAt != null
        ? '${createdAt.hour % 12 == 0 ? 12 : createdAt.hour % 12}:${createdAt.minute.toString().padLeft(2, '0')} ${createdAt.hour >= 12 ? 'PM' : 'AM'}'
        : '';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _cardBorder),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Icon badge
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isPositive ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isPositive ? Icons.arrow_upward_rounded : Icons.arrow_downward_rounded,
              color: isPositive ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
              size: 18,
            ),
          ),
          const SizedBox(width: 12),

          // Main details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      userName,
                      style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14, color: const Color(0xFF111827)),
                    ),
                    Text(
                      '${isPositive ? '+' : ''}$points pts',
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        color: isPositive ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                      ),
                    ),
                  ],
                ),
                if (userEmail.isNotEmpty)
                  Text(userEmail, style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B))),
                const SizedBox(height: 4),

                Text(description, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF334155))),

                if (couponCode != null && couponCode.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: _primaryRed.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text('Coupon: $couponCode', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: _primaryRed)),
                  ),
                ],

                const SizedBox(height: 6),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('$dateStr $timeStr', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8))),
                    Text('Bal: $balanceAfter pts', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFF64748B))),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
