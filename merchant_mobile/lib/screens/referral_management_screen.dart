import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:toastification/toastification.dart';

import '../providers/referral_provider.dart';
import '../widgets/app_drawer.dart';
import '../widgets/shared_bottom_nav.dart';

class ReferralManagementScreen extends StatefulWidget {
  const ReferralManagementScreen({Key? key}) : super(key: key);

  @override
  State<ReferralManagementScreen> createState() => _ReferralManagementScreenState();
}

class _ReferralManagementScreenState extends State<ReferralManagementScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedStatus = '';

  static const Color _primaryRed = Color(0xFF8B0000);
  static const Color _bgGrey = Color(0xFFF8FAFC);
  static const Color _cardBorder = Color(0xFFE2E8F0);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ReferralProvider>().fetchInitialData();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchSubmitted(String query) {
    context.read<ReferralProvider>().fetchReferralList(
      status: _selectedStatus,
      search: query,
      page: 1,
    );
  }

  void _onStatusFilterSelected(String status) {
    setState(() {
      _selectedStatus = status;
    });
    context.read<ReferralProvider>().fetchReferralList(
      status: status,
      search: _searchController.text.trim(),
      page: 1,
    );
  }

  // -------------------------------------------------------------
  // PROGRAM SETTINGS MODAL SHEET
  // -------------------------------------------------------------
  void _openManageProgramSheet(ReferralProvider provider) {
    bool enabled = provider.isProgramEnabled;
    bool requireOrder = provider.requireReferrerOrder;

    final discountCtrl = TextEditingController(text: provider.refereeDiscountValue.toStringAsFixed(0));
    final minOrderCtrl = TextEditingController(text: provider.refereeMinOrder.toStringAsFixed(0));
    final rewardCtrl = TextEditingController(text: provider.referrerRewardValue.toStringAsFixed(0));
    final validityCtrl = TextEditingController(text: provider.couponValidityDays.toString());
    final windowCtrl = TextEditingController(text: provider.applyWindowDays.toString());
    final maxRewardsCtrl = TextEditingController(text: provider.maxRewardsPerReferrer.toString());
    final maxIpCtrl = TextEditingController(text: provider.maxAppliesPerIpPerDay.toString());
    final titleCtrl = TextEditingController(text: provider.title);
    final descCtrl = TextEditingController(text: provider.description);
    final termsCtrl = TextEditingController(text: provider.termsAndConditions);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final curDiscount = double.tryParse(discountCtrl.text) ?? 25.0;
          final curMinOrder = double.tryParse(minOrderCtrl.text) ?? 30.0;
          final curReward = double.tryParse(rewardCtrl.text) ?? 25.0;

          return Container(
            height: MediaQuery.of(context).size.height * 0.90,
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              children: [
                // Modal Handle
                Center(
                  child: Container(
                    margin: const EdgeInsets.only(top: 10, bottom: 6),
                    width: 44,
                    height: 5,
                    decoration: BoxDecoration(
                      color: const Color(0xFFCBD5E1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),

                // Header
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 16, 12),
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
                            child: const Icon(Icons.settings_suggest_rounded, color: _primaryRed, size: 22),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Referral Program Settings',
                                style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 17, color: const Color(0xFF111827)),
                              ),
                              Text(
                                'Rewards, discounts & anti-fraud rules',
                                style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                              ),
                            ],
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B)),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1, color: Color(0xFFF1F5F9)),

                // Scrollable Form Body
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                    children: [
                      // Program Status Toggle Card
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: enabled ? const Color(0xFFF0FDF4) : const Color(0xFFFEF2F2),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: enabled ? const Color(0xFFBBF7D0) : const Color(0xFFFECACA)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Enable Referral Program',
                                    style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14, color: const Color(0xFF111827)),
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    enabled
                                        ? 'Active: customers can share codes and claim invite coupons.'
                                        : 'Disabled: code redemptions and new invitations are paused.',
                                    style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                                  ),
                                ],
                              ),
                            ),
                            Switch.adaptive(
                              value: enabled,
                              activeColor: const Color(0xFF16A34A),
                              onChanged: (val) {
                                setModalState(() => enabled = val);
                              },
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Section: Discount & Rewards
                      Text(
                        'DISCOUNT & REWARDS',
                        style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, color: const Color(0xFF94A3B8), letterSpacing: 0.8),
                      ),
                      const SizedBox(height: 12),

                      Row(
                        children: [
                          Expanded(
                            child: _buildNumberField(
                              label: "Friend's Discount",
                              controller: discountCtrl,
                              suffix: '\$',
                              hint: '25',
                              subtext: 'Off first order',
                              onChanged: (_) => setModalState(() {}),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildNumberField(
                              label: 'Min Order',
                              controller: minOrderCtrl,
                              suffix: '\$',
                              hint: '30',
                              subtext: 'Cart subtotal',
                              onChanged: (_) => setModalState(() {}),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      _buildNumberField(
                        label: 'Referrer Reward Value',
                        controller: rewardCtrl,
                        suffix: '\$',
                        hint: '25',
                        subtext: 'Credited in loyalty points after order delivery',
                        onChanged: (_) => setModalState(() {}),
                      ),
                      const SizedBox(height: 20),

                      // Live Program Preview Box
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFBFDBFE)),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.info_outline_rounded, color: Color(0xFF2563EB), size: 20),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Program Preview for Customers',
                                    style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13, color: const Color(0xFF1E3A8A)),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Invited friends receive \$${curDiscount.toStringAsFixed(0)} OFF when they place an order of \$${curMinOrder.toStringAsFixed(0)} or more. The referring member earns \$${curReward.toStringAsFixed(0)} worth of loyalty points once the order is delivered.',
                                    style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF1E40AF), height: 1.4),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Section: Expiry & Eligibility
                      Text(
                        'EXPIRY & ELIGIBILITY',
                        style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, color: const Color(0xFF94A3B8), letterSpacing: 0.8),
                      ),
                      const SizedBox(height: 12),

                      Row(
                        children: [
                          Expanded(
                            child: _buildNumberField(
                              label: 'Coupon Validity',
                              controller: validityCtrl,
                              suffix: 'Days',
                              hint: '30',
                              subtext: 'Before friend coupon expires',
                              onChanged: (_) => setModalState(() {}),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildNumberField(
                              label: 'Apply Window',
                              controller: windowCtrl,
                              suffix: 'Days',
                              hint: '7',
                              subtext: 'Days after signup to apply code',
                              onChanged: (_) => setModalState(() {}),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      Row(
                        children: [
                          Expanded(
                            child: _buildNumberField(
                              label: 'Max Rewards/User',
                              controller: maxRewardsCtrl,
                              suffix: 'Limit',
                              hint: '20',
                              subtext: '0 = unlimited',
                              onChanged: (_) => setModalState(() {}),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildNumberField(
                              label: 'Max IP / Day',
                              controller: maxIpCtrl,
                              suffix: 'Per Day',
                              hint: '3',
                              subtext: 'Anti-farm network limit',
                              onChanged: (_) => setModalState(() {}),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      // Require Referrer Order Checkbox
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: _cardBorder),
                        ),
                        child: Row(
                          children: [
                            Checkbox(
                              value: requireOrder,
                              activeColor: _primaryRed,
                              onChanged: (val) {
                                setModalState(() => requireOrder = val ?? false);
                              },
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                'Require referrer to have at least 1 completed order',
                                style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13, color: const Color(0xFF1E293B)),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Section: Public Content
                      Text(
                        'PUBLIC TEMPLATES & TERMS',
                        style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, color: const Color(0xFF94A3B8), letterSpacing: 0.8),
                      ),
                      const SizedBox(height: 12),

                      Text('Program Title', style: GoogleFonts.inter(fontSize: 12.5, fontWeight: FontWeight.bold, color: const Color(0xFF334155))),
                      const SizedBox(height: 6),
                      TextField(
                        controller: titleCtrl,
                        decoration: InputDecoration(
                          hintText: 'Refer a friend',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _primaryRed, width: 2)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        ),
                      ),
                      const SizedBox(height: 14),

                      Text('Customer Description Template', style: GoogleFonts.inter(fontSize: 12.5, fontWeight: FontWeight.bold, color: const Color(0xFF334155))),
                      const SizedBox(height: 4),
                      Text('Placeholders: {restaurant}, {refereeDiscount}, {referrerReward}', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8))),
                      const SizedBox(height: 6),
                      TextField(
                        controller: descCtrl,
                        maxLines: 2,
                        decoration: InputDecoration(
                          hintText: 'Invite your friends to {restaurant}...',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _primaryRed, width: 2)),
                          contentPadding: const EdgeInsets.all(12),
                        ),
                      ),
                      const SizedBox(height: 14),

                      Text('Terms & Conditions', style: GoogleFonts.inter(fontSize: 12.5, fontWeight: FontWeight.bold, color: const Color(0xFF334155))),
                      const SizedBox(height: 6),
                      TextField(
                        controller: termsCtrl,
                        maxLines: 3,
                        decoration: InputDecoration(
                          hintText: 'Enter referral terms and redemption rules...',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _primaryRed, width: 2)),
                          contentPadding: const EdgeInsets.all(12),
                        ),
                      ),
                    ],
                  ),
                ),

                // Footer Save Actions
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
                                    final payload = {
                                      'enabled': enabled,
                                      'refereeDiscountValue': double.tryParse(discountCtrl.text) ?? 25.0,
                                      'refereeMinOrder': double.tryParse(minOrderCtrl.text) ?? 30.0,
                                      'referrerRewardValue': double.tryParse(rewardCtrl.text) ?? 25.0,
                                      'couponValidityDays': int.tryParse(validityCtrl.text) ?? 30,
                                      'applyWindowDays': int.tryParse(windowCtrl.text) ?? 7,
                                      'maxRewardsPerReferrer': int.tryParse(maxRewardsCtrl.text) ?? 20,
                                      'maxAppliesPerIpPerDay': int.tryParse(maxIpCtrl.text) ?? 3,
                                      'requireReferrerOrder': requireOrder,
                                      'title': titleCtrl.text.trim(),
                                      'description': descCtrl.text.trim(),
                                      'termsAndConditions': termsCtrl.text.trim(),
                                    };

                                    final success = await provider.updateSettings(payload);

                                    if (mounted) {
                                      if (success) {
                                        Navigator.pop(ctx);
                                        toastification.show(
                                          context: context,
                                          type: ToastificationType.success,
                                          title: const Text('Program Settings Saved'),
                                          description: const Text('Referral rules updated successfully.'),
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

  Widget _buildNumberField({
    required String label,
    required TextEditingController controller,
    required String suffix,
    required String hint,
    required String subtext,
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
        const SizedBox(height: 4),
        Text(subtext, style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8))),
      ],
    );
  }

  // -------------------------------------------------------------
  // CANCEL REFERRAL CONFIRMATION DIALOG
  // -------------------------------------------------------------
  void _confirmCancelReferral(BuildContext context, String id, String code) {
    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: const BoxDecoration(
                color: Color(0xFFFEE2E2),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.block_rounded, color: Color(0xFFDC2626), size: 20),
            ),
            const SizedBox(width: 10),
            Text('Cancel Coupon?', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 17)),
          ],
        ),
        content: Text(
          'Cancel this unused referral coupon for code "$code"? The invited friend will no longer be able to redeem this coupon.',
          style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF475569)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx),
            child: Text('Keep Coupon', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: const Color(0xFF64748B))),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(dialogCtx);
              final provider = context.read<ReferralProvider>();
              final success = await provider.cancelReferral(id);
              if (mounted) {
                if (success) {
                  toastification.show(
                    context: context,
                    type: ToastificationType.success,
                    title: const Text('Coupon Revoked'),
                    description: const Text('The unused referral coupon was cancelled.'),
                    autoCloseDuration: const Duration(seconds: 3),
                  );
                } else {
                  toastification.show(
                    context: context,
                    type: ToastificationType.error,
                    title: const Text('Failed to Cancel'),
                    description: Text(provider.error.isNotEmpty ? provider.error : 'Could not revoke coupon.'),
                    autoCloseDuration: const Duration(seconds: 3),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text('Yes, Cancel', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white)),
          ),
        ],
      ),
    );
  }

  // -------------------------------------------------------------
  // BUILD METHOD
  // -------------------------------------------------------------
  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ReferralProvider>();

    return Scaffold(
      backgroundColor: _bgGrey,
      appBar: AppBar(
        title: Column(
          children: [
            Text(
              'Referral Program',
              style: GoogleFonts.outfit(color: const Color(0xFF111827), fontSize: 20, fontWeight: FontWeight.bold),
            ),
            Text(
              'Customer Referrals & Rewards',
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
              onPressed: () => _openManageProgramSheet(provider),
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
      body: provider.isLoading
          ? const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(color: _primaryRed),
                  SizedBox(height: 16),
                  Text('Loading Referral Program...', style: TextStyle(color: Color(0xFF64748B))),
                ],
              ),
            )
          : RefreshIndicator(
              color: _primaryRed,
              onRefresh: () => provider.fetchInitialData(),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Program Status Card
                  _buildProgramStatusCard(provider),
                  const SizedBox(height: 16),

                  // 6 Stats Grid matching Web
                  _buildStatsGrid(provider),
                  const SizedBox(height: 20),

                  // Program Rules Summary Card
                  _buildRulesSummaryCard(provider),
                  const SizedBox(height: 24),

                  // Referral Ledger & Filters
                  _buildLedgerSection(provider),
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
  Widget _buildProgramStatusCard(ReferralProvider provider) {
    final isEnabled = provider.isProgramEnabled;

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
                  isEnabled ? 'Referral Program is Active' : 'Referral Program is Paused',
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    color: isEnabled ? const Color(0xFF14532D) : const Color(0xFF7F1D1D),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  isEnabled
                      ? 'Customers can share their code & get rewarded upon friend orders.'
                      : 'Referral sharing and discount redemptions are paused.',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: isEnabled ? const Color(0xFF166534) : const Color(0xFF991B1B),
                  ),
                ),
              ],
            ),
          ),
          InkWell(
            onTap: () => _openManageProgramSheet(provider),
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
  // STATS GRID (6 STAT CARDS MATCHING WEB DASHBOARD)
  // -------------------------------------------------------------
  Widget _buildStatsGrid(ReferralProvider provider) {
    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.35,
      children: [
        _buildStatCard(
          title: 'Total Referrals',
          value: provider.totalReferrals.toString(),
          icon: Icons.group_outlined,
          iconColor: const Color(0xFF2563EB),
          bgColor: const Color(0xFFEFF6FF),
          footer: 'All-Time Codes',
        ),
        _buildStatCard(
          title: 'Coupons Issued',
          value: provider.couponIssued.toString(),
          icon: Icons.confirmation_number_outlined,
          iconColor: const Color(0xFFD97706),
          bgColor: const Color(0xFFFFFBEB),
          footer: 'Pending Redemption',
        ),
        _buildStatCard(
          title: 'Converted Orders',
          value: provider.rewarded.toString(),
          icon: Icons.check_circle_outline_rounded,
          iconColor: const Color(0xFF059669),
          bgColor: const Color(0xFFECFDF5),
          footer: '${provider.conversionRate}% Conversion Rate',
        ),
        _buildStatCard(
          title: 'Discount Given',
          value: '\$${provider.discountGiven.toStringAsFixed(0)}',
          icon: Icons.attach_money_rounded,
          iconColor: const Color(0xFF9333EA),
          bgColor: const Color(0xFFF3E8FF),
          footer: 'Friend Savings Total',
        ),
        _buildStatCard(
          title: 'Loyalty Points',
          value: provider.pointsAwarded.toString(),
          icon: Icons.card_giftcard_rounded,
          iconColor: const Color(0xFFDB2777),
          bgColor: const Color(0xFFFDF2F8),
          footer: 'Referrers Rewarded',
        ),
        _buildStatCard(
          title: 'Fraud Flags',
          value: provider.flagged.toString(),
          icon: Icons.shield_outlined,
          iconColor: const Color(0xFFDC2626),
          bgColor: const Color(0xFFFEF2F2),
          footer: 'Protected Claims',
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
  // RULES & PROGRAM SUMMARY CARD
  // -------------------------------------------------------------
  Widget _buildRulesSummaryCard(ReferralProvider provider) {
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
              const Icon(Icons.share_rounded, color: _primaryRed, size: 20),
              const SizedBox(width: 8),
              Text(
                'Current Referral Rules & Perks',
                style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: const Color(0xFF111827)),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Friend Discount Rule
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFFDCFCE7), borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.card_giftcard_rounded, color: Color(0xFF16A34A), size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Friend Welcome Offer', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13, color: const Color(0xFF1E293B))),
                    Text('Gets \$${provider.refereeDiscountValue.toStringAsFixed(0)} OFF on first order (Min \$${provider.refereeMinOrder.toStringAsFixed(0)}).', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Referrer Reward Rule
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.stars_rounded, color: Color(0xFF3B82F6), size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Referrer Reward', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13, color: const Color(0xFF1E293B))),
                    Text('Earns \$${provider.referrerRewardValue.toStringAsFixed(0)} in loyalty points once friend order is delivered.', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Divider(height: 1),
          const SizedBox(height: 12),

          // Fraud & Policy Banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFBEB),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFFDE68A)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.security_rounded, color: Color(0xFFB45309), size: 18),
                    const SizedBox(width: 8),
                    Text('Security Safeguards', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13, color: const Color(0xFF92400E))),
                  ],
                ),
                Text(
                  '${provider.couponValidityDays}d coupon • Max ${provider.maxAppliesPerIpPerDay}/IP/day',
                  style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 12, color: const Color(0xFF92400E)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // -------------------------------------------------------------
  // REFERRAL LEDGER & ACTIVITY
  // -------------------------------------------------------------
  Widget _buildLedgerSection(ReferralProvider provider) {
    final referrals = provider.referrals;
    final totalRecords = provider.pagination['total'] ?? referrals.length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Referral Ledger & Activity',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 17, color: const Color(0xFF111827)),
            ),
            Text(
              '$totalRecords records',
              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B), fontWeight: FontWeight.w600),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Search bar
        TextField(
          controller: _searchController,
          onSubmitted: _onSearchSubmitted,
          decoration: InputDecoration(
            hintText: 'Search by customer, code, or coupon...',
            hintStyle: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
            prefixIcon: const Icon(Icons.search, size: 20, color: Color(0xFF94A3B8)),
            suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear, size: 18, color: Color(0xFF94A3B8)),
                    onPressed: () {
                      _searchController.clear();
                      _onSearchSubmitted('');
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
        const SizedBox(height: 12),

        // Status Filter Chips (Horizontal Scroll)
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _buildStatusChip('', 'All Status'),
              const SizedBox(width: 8),
              _buildStatusChip('coupon_issued', 'Coupon Issued'),
              const SizedBox(width: 8),
              _buildStatusChip('redeemed', 'Ordered'),
              const SizedBox(width: 8),
              _buildStatusChip('rewarded', 'Delivered & Rewarded'),
              const SizedBox(width: 8),
              _buildStatusChip('revoked', 'Revoked'),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // List or Loading / Empty State
        if (provider.isListLoading)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 40),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: _cardBorder),
            ),
            child: const Center(
              child: CircularProgressIndicator(color: _primaryRed),
            ),
          )
        else if (referrals.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: _cardBorder),
            ),
            child: Column(
              children: [
                const Icon(Icons.share_arrival_time_outlined, size: 48, color: Color(0xFFCBD5E1)),
                const SizedBox(height: 12),
                Text('No Referral Records Found', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: const Color(0xFF1E293B))),
                const SizedBox(height: 4),
                Text(
                  _selectedStatus.isNotEmpty || _searchController.text.isNotEmpty
                      ? 'No referral entries matched your search or status filter.'
                      : 'When customers share their referral link, invites and conversions will show here.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                ),
              ],
            ),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: referrals.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final r = referrals[index];
              return _buildReferralCard(r);
            },
          ),
      ],
    );
  }

  Widget _buildStatusChip(String key, String label) {
    final isSelected = _selectedStatus == key;
    return InkWell(
      onTap: () => _onStatusFilterSelected(key),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
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
            color: isSelected ? Colors.white : const Color(0xFF475569),
          ),
        ),
      ),
    );
  }

  // -------------------------------------------------------------
  // REFERRAL CARD ITEM
  // -------------------------------------------------------------
  Widget _buildReferralCard(Map<String, dynamic> r) {
    final id = r['id']?.toString() ?? '';
    final code = r['code']?.toString() ?? 'N/A';
    final status = r['status']?.toString() ?? 'coupon_issued';
    final referrer = r['referrer'] as Map<String, dynamic>?;
    final referee = r['referee'] as Map<String, dynamic>?;
    final coupon = r['coupon'] as Map<String, dynamic>?;
    final order = r['order'] as Map<String, dynamic>?;
    final flagged = r['flagged'] == true;
    final flagReason = r['flagReason']?.toString() ?? 'Suspicious Activity';

    final createdAtStr = r['createdAt'] != null
        ? DateTime.tryParse(r['createdAt'].toString())?.toLocal().toString().split('.')[0] ?? ''
        : '';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _cardBorder),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 1)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row: Code & Status Badge
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Text(
                      code,
                      style: GoogleFonts.firaCode(fontWeight: FontWeight.bold, fontSize: 13, color: const Color(0xFF0F172A)),
                    ),
                  ),
                  if (flagged) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF2F2),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: const Color(0xFFFECACA)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.warning_amber_rounded, size: 12, color: Color(0xFFDC2626)),
                          const SizedBox(width: 3),
                          Text(flagReason, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFFDC2626))),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
              _buildStatusBadge(status),
            ],
          ),
          if (createdAtStr.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(createdAtStr, style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8))),
          ],
          const SizedBox(height: 12),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          const SizedBox(height: 12),

          // Referrer and Friend Information
          Row(
            children: [
              // Referrer
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('REFERRER (OWNER)', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: const Color(0xFF94A3B8))),
                    const SizedBox(height: 3),
                    Text(
                      referrer?['name']?.toString() ?? 'Unknown User',
                      style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13, color: const Color(0xFF1E293B)),
                    ),
                    Text(
                      referrer?['email']?.toString() ?? referrer?['phone']?.toString() ?? '',
                      style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              // Referee (Invited Friend)
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('INVITED FRIEND', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: const Color(0xFF94A3B8))),
                    const SizedBox(height: 3),
                    Text(
                      referee?['name']?.toString() ?? 'New Customer',
                      style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13, color: const Color(0xFF1E293B)),
                    ),
                    Text(
                      referee?['email']?.toString() ?? referee?['phone']?.toString() ?? '',
                      style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Coupon and Benefits Row
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Coupon: ${coupon?['code']?.toString() ?? 'N/A'}',
                      style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: const Color(0xFF334155)),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '\$${coupon?['discount'] ?? 25} OFF (Min \$${coupon?['minOrder'] ?? 30})',
                      style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF16A34A), fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      r['rewardPoints'] != null
                          ? '${r['rewardPoints']} pts awarded'
                          : '\$${r['rewardValue'] ?? 25} pending',
                      style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: const Color(0xFF4338CA)),
                    ),
                    if (order != null)
                      Text(
                        'Order #${order['orderNumber'] ?? ''} (\$${(order['total'] as num?)?.toStringAsFixed(2) ?? ''})',
                        style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
                      ),
                  ],
                ),
              ],
            ),
          ),

          // Cancel Action Button if status is coupon_issued
          if (status == 'coupon_issued') ...[
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: () => _confirmCancelReferral(context, id, code),
                icon: const Icon(Icons.block_rounded, size: 15, color: Color(0xFFDC2626)),
                label: Text(
                  'Cancel Coupon',
                  style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFFDC2626)),
                ),
                style: TextButton.styleFrom(
                  backgroundColor: const Color(0xFFFEF2F2),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                    side: const BorderSide(color: Color(0xFFFECACA)),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bg;
    Color text;
    Color border;
    IconData icon;
    String label;

    switch (status) {
      case 'coupon_issued':
        bg = const Color(0xFFFFFBEB);
        text = const Color(0xFFB45309);
        border = const Color(0xFFFDE68A);
        icon = Icons.access_time_rounded;
        label = 'Coupon Issued';
        break;
      case 'redeemed':
        bg = const Color(0xFFEFF6FF);
        text = const Color(0xFF1D4ED8);
        border = const Color(0xFFBFDBFE);
        icon = Icons.shopping_bag_outlined;
        label = 'Ordered';
        break;
      case 'rewarded':
        bg = const Color(0xFFECFDF5);
        text = const Color(0xFF047857);
        border = const Color(0xFFA7F3D0);
        icon = Icons.check_circle_rounded;
        label = 'Delivered & Rewarded';
        break;
      case 'revoked':
      case 'cancelled':
        bg = const Color(0xFFFEF2F2);
        text = const Color(0xFFB91C1C);
        border = const Color(0xFFFECACA);
        icon = Icons.cancel_outlined;
        label = 'Revoked';
        break;
      case 'expired':
        bg = const Color(0xFFF3F4F6);
        text = const Color(0xFF4B5563);
        border = const Color(0xFFE5E7EB);
        icon = Icons.timer_off_outlined;
        label = 'Expired';
        break;
      default:
        bg = const Color(0xFFF3F4F6);
        text = const Color(0xFF4B5563);
        border = const Color(0xFFE5E7EB);
        icon = Icons.info_outline;
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: text),
          const SizedBox(width: 4),
          Text(label, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: text)),
        ],
      ),
    );
  }
}
