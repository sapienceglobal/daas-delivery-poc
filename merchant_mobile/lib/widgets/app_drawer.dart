import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../providers/auth_provider.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  static const String privacyPolicyUrl = 'https://lassiloungeny.com/merchant-privacy-policy';
  static const String termsOfServiceUrl = 'https://lassiloungeny.com/terms';

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      debugPrint('Error launching URL: $e');
    }
  }

  void _showDeleteAccountSheet(BuildContext context) {
    final authProvider = context.read<AuthProvider>();
    final user = authProvider.user;
    final isSocial = user?['socialLogin'] != null &&
        (user?['socialLogin']['googleId'] != null || user?['socialLogin']['appleId'] != null);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => _MerchantDeleteAccountSheet(
        isSocialUser: isSocial,
        authProvider: authProvider,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.of(context);
    final screenWidth = media.size.width;

    // Responsive width calculation:
    // Narrow phone (<360px) -> 88% screen
    // Standard phone (360-600px) -> 82% screen (capped around 325-340px)
    // Tablet / Desktop (>600px) -> max 350px so it remains sleek and usable
    final drawerWidth = screenWidth < 360
        ? screenWidth * 0.88
        : (screenWidth < 600 ? (screenWidth * 0.82).clamp(280.0, 340.0) : 350.0);

    // Current route to highlight active tab
    final String location = GoRouterState.of(context).uri.toString();

    final user = context.watch<AuthProvider>().user;
    final name = (user?['name'] as String?)?.isNotEmpty == true
        ? user!['name'] as String
        : 'Lassi Lounge Admin';
    final email = (user?['email'] as String?)?.isNotEmpty == true
        ? user!['email'] as String
        : 'admin@lassiloungeny.com';
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'L';

    return Drawer(
      width: drawerWidth,
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      elevation: 16,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topRight: Radius.circular(28),
          bottomRight: Radius.circular(28),
        ),
      ),
      child: ClipRRect(
        borderRadius: const BorderRadius.only(
          topRight: Radius.circular(28),
          bottomRight: Radius.circular(28),
        ),
        child: SafeArea(
          top: true,
          bottom: true,
          child: Column(
            children: [
              // ── 1. Top Header: Brand Logo & Circular Close Button ──
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 4, 16, 0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Image.asset(
                      'assets/images/branded/lassi-lounge/Lassi-Lounge-logo.png',
                      height: 88,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => Text(
                        'Lassi Lounge',
                        style: GoogleFonts.outfit(
                          color: const Color(0xFFE63946),
                          fontSize: 36,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    InkWell(
                      onTap: () => Navigator.of(context).pop(),
                      borderRadius: BorderRadius.circular(20),
                      child: Container(
                        width: 36,
                        height: 36,
                        decoration: const BoxDecoration(
                          color: Color(0xFFFDEEE7),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.close_rounded,
                          size: 18,
                          color: Color(0xFFC2410C),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // ── 2. User Profile Card ──
              Container(
                margin: const EdgeInsets.fromLTRB(16, 2, 16, 6),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF6EE),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: const Color(0xFFFFEDDE),
                    width: 1,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: const BoxDecoration(
                        color: Color(0xFFEA580C),
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        initial,
                        style: GoogleFonts.outfit(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            name,
                            style: GoogleFonts.outfit(
                              color: const Color(0xFF1E293B),
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            email,
                            style: GoogleFonts.inter(
                              color: const Color(0xFF64748B),
                              fontSize: 12.5,
                              fontWeight: FontWeight.w400,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(10),
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0x08000000),
                                  blurRadius: 3,
                                  offset: Offset(0, 1),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.storefront_rounded,
                                  size: 13,
                                  color: Color(0xFFEA580C),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  'Main Branch',
                                  style: GoogleFonts.inter(
                                    color: const Color(0xFF334155),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 4),

              // ── 3. Navigation List ──
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  physics: const BouncingScrollPhysics(),
                  children: [
                    _buildNavItem(
                      icon: Icons.grid_view_rounded,
                      title: 'Dashboard',
                      isActive: location == '/',
                      onTap: () {
                        Navigator.of(context).pop();
                        context.go('/');
                      },
                    ),
                    _buildNavItem(
                      icon: Icons.timer_outlined,
                      title: 'Live Orders',
                      isActive: location == '/live-orders',
                      onTap: () {
                        Navigator.of(context).pop();
                        context.push('/live-orders');
                      },
                    ),
                    _buildNavItem(
                      icon: Icons.point_of_sale_rounded,
                      title: 'Create Order',
                      isActive: location == '/pos',
                      onTap: () {
                        Navigator.of(context).pop();
                        context.push('/pos');
                      },
                    ),
                    _buildNavItem(
                      icon: Icons.room_service_outlined,
                      title: 'All Orders',
                      isActive: location == '/all-orders',
                      onTap: () {
                        Navigator.of(context).pop();
                        context.push('/all-orders');
                      },
                    ),
                    _buildNavItem(
                      icon: Icons.calendar_today_outlined,
                      title: 'Catering Enquiries',
                      isActive: location == '/catering',
                      onTap: () {
                        Navigator.of(context).pop();
                        context.push('/catering');
                      },
                    ),
                    _buildNavItem(
                      icon: Icons.sell_outlined,
                      title: 'Menu Management',
                      isActive: location == '/menu-management',
                      onTap: () {
                        Navigator.of(context).pop();
                        context.push('/menu-management');
                      },
                    ),
                    _buildNavItem(
                      icon: Icons.campaign_outlined,
                      title: 'Promotions',
                      isActive: location == '/promotions',
                      onTap: () {
                        Navigator.of(context).pop();
                        context.push('/promotions');
                      },
                    ),
                    _buildNavItem(
                      icon: Icons.people_outline_rounded,
                      title: 'Customers & CRM',
                      isActive: location == '/crm',
                      onTap: () {
                        Navigator.of(context).pop();
                        context.push('/crm');
                      },
                    ),
                    _buildNavItem(
                      icon: Icons.event_note_outlined,
                      title: 'Bookings',
                      isActive: location == '/reservations',
                      onTap: () {
                        Navigator.of(context).pop();
                        context.push('/reservations');
                      },
                    ),
                    _buildNavItem(
                      icon: Icons.pie_chart_outline_rounded,
                      title: 'Reports & Analytics',
                      isActive: location == '/analytics',
                      onTap: () {
                        Navigator.of(context).pop();
                        context.push('/analytics');
                      },
                    ),
                    _buildNavItem(
                      icon: Icons.settings_outlined,
                      title: 'Settings',
                      isActive: location == '/restaurant-settings',
                      onTap: () {
                        Navigator.of(context).pop();
                        context.push('/restaurant-settings');
                      },
                    ),

                    // Additional Core Management Screens
                    _buildNavItem(
                      icon: Icons.web_rounded,
                      title: 'Website CMS',
                      isActive: location == '/cms',
                      onTap: () {
                        Navigator.of(context).pop();
                        context.push('/cms');
                      },
                    ),
                    _buildNavItem(
                      icon: Icons.card_giftcard_rounded,
                      title: 'Loyalty & Rewards',
                      isActive: location == '/loyalty',
                      onTap: () {
                        Navigator.of(context).pop();
                        context.push('/loyalty');
                      },
                    ),
                    _buildNavItem(
                      icon: Icons.mark_email_unread_outlined,
                      title: 'Push Marketing',
                      isActive: location == '/marketing',
                      onTap: () {
                        Navigator.of(context).pop();
                        context.push('/marketing');
                      },
                    ),
                    _buildNavItem(
                      icon: Icons.forum_outlined,
                      title: 'Support Messages',
                      isActive: location == '/support-messages',
                      onTap: () {
                        Navigator.of(context).pop();
                        context.push('/support-messages');
                      },
                    ),

                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                      child: Divider(color: Color(0xFFF1F5F9), thickness: 1),
                    ),

                    // Legal & Policy Compliance
                    _buildNavItem(
                      icon: Icons.shield_outlined,
                      title: 'Privacy Policy',
                      isActive: false,
                      onTap: () => _launchUrl(privacyPolicyUrl),
                    ),
                    _buildNavItem(
                      icon: Icons.description_outlined,
                      title: 'Terms of Service',
                      isActive: false,
                      onTap: () => _launchUrl(termsOfServiceUrl),
                    ),
                    _buildNavItem(
                      icon: Icons.delete_forever_outlined,
                      title: 'Delete Account',
                      isActive: false,
                      onTap: () {
                        Navigator.of(context).pop();
                        _showDeleteAccountSheet(context);
                      },
                    ),
                  ],
                ),
              ),

              // ── 4. Bottom Action Card (Settings & Logout) ──
              Container(
                margin: const EdgeInsets.fromLTRB(16, 6, 16, 10),
                padding:
                    const EdgeInsets.symmetric(vertical: 12, horizontal: 20),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF6F0),
                  borderRadius: BorderRadius.circular(22),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildBottomAction(
                      icon: Icons.settings_outlined,
                      label: 'Settings',
                      onTap: () {
                        Navigator.of(context).pop();
                        context.push('/restaurant-settings');
                      },
                    ),
                    _buildBottomAction(
                      icon: Icons.logout_rounded,
                      label: 'Logout',
                      onTap: () async {
                        Navigator.of(context).pop();
                        await context.read<AuthProvider>().logout();
                        if (context.mounted) {
                          context.go('/login');
                        }
                      },
                    ),
                  ],
                ),
              ),

              // Subtle version caption
              FutureBuilder<PackageInfo>(
                future: PackageInfo.fromPlatform(),
                builder: (context, snapshot) {
                  if (snapshot.hasData) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Text(
                        'v${snapshot.data!.version}',
                        style: GoogleFonts.inter(
                          color: const Color(0xFF94A3B8),
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    );
                  }
                  return const SizedBox.shrink();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required String title,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.0),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Row(
          children: [
            // Left edge indicator bar matching the screenshot
            Container(
              width: 4,
              height: 32,
              decoration: BoxDecoration(
                color: isActive ? const Color(0xFFEA580C) : Colors.transparent,
                borderRadius: const BorderRadius.only(
                  topRight: Radius.circular(4),
                  bottomRight: Radius.circular(4),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Container(
                margin: const EdgeInsets.only(right: 14),
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color:
                      isActive ? const Color(0xFFFFF3EB) : Colors.transparent,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  children: [
                    Icon(
                      icon,
                      color: const Color(0xFFEA580C),
                      size: 21,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Text(
                        title,
                        style: GoogleFonts.outfit(
                          color: isActive
                              ? const Color(0xFFEA580C)
                              : const Color(0xFF1E293B),
                          fontWeight:
                              isActive ? FontWeight.w700 : FontWeight.w500,
                          fontSize: 15,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Icon(
                      Icons.chevron_right_rounded,
                      color: isActive
                          ? const Color(0xFFEA580C)
                          : const Color(0xFFCBD5E1),
                      size: isActive ? 20 : 18,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomAction({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x0A000000),
                    blurRadius: 4,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              alignment: Alignment.center,
              child: Icon(
                icon,
                color: const Color(0xFFEA580C),
                size: 22,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: GoogleFonts.inter(
                color: const Color(0xFFEA580C),
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INDUSTRY-GRADE MERCHANT DELETE ACCOUNT BOTTOM SHEET
// ─────────────────────────────────────────────────────────────────────────────
class _MerchantDeleteAccountSheet extends StatefulWidget {
  final bool isSocialUser;
  final AuthProvider authProvider;

  const _MerchantDeleteAccountSheet({
    required this.isSocialUser,
    required this.authProvider,
  });

  @override
  State<_MerchantDeleteAccountSheet> createState() =>
      _MerchantDeleteAccountSheetState();
}

class _MerchantDeleteAccountSheetState
    extends State<_MerchantDeleteAccountSheet> {
  final _passwordController = TextEditingController();
  final _confirmationController = TextEditingController();
  String _selectedReason = 'No longer using the service';
  bool _obscurePassword = true;
  bool _isDeleting = false;
  String? _errorMessage;

  final List<String> _reasons = [
    'No longer using the service',
    'Closing restaurant / business branch',
    'Switching to another management platform',
    'Privacy or data security concerns',
    'Technical difficulties or bugs',
    'Other reason',
  ];

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmationController.dispose();
    super.dispose();
  }

  Future<void> _handleDelete() async {
    setState(() {
      _errorMessage = null;
    });

    if (!widget.isSocialUser && _passwordController.text.trim().isEmpty) {
      setState(() {
        _errorMessage = 'Please enter your password to verify your identity.';
      });
      return;
    }

    if (widget.isSocialUser &&
        _confirmationController.text.trim().toUpperCase() != 'DELETE') {
      setState(() {
        _errorMessage = 'Please type "DELETE" exactly to confirm.';
      });
      return;
    }

    // Secondary safety confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        backgroundColor: Colors.white,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFDC2626).withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.warning_amber_rounded,
                color: Color(0xFFDC2626),
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Final Confirmation',
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF111827),
                ),
              ),
            ),
          ],
        ),
        content: Text(
          'Are you absolutely sure you want to permanently delete your merchant account? This cannot be undone.',
          style: GoogleFonts.inter(
            fontSize: 14,
            color: Colors.grey.shade700,
            height: 1.5,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(
              'Cancel',
              style: GoogleFonts.inter(
                color: Colors.grey.shade700,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: Text(
              'Yes, Delete Forever',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() {
      _isDeleting = true;
    });

    final error = await widget.authProvider.deleteAccount(
      password: widget.isSocialUser ? null : _passwordController.text.trim(),
      confirmation: widget.isSocialUser ? 'DELETE' : null,
      reason: _selectedReason,
    );

    if (!mounted) return;

    if (error == null) {
      // Success! Close sheet and redirect to login
      Navigator.of(context).pop();
      context.go('/login');

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle_outline, color: Colors.white),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Your merchant account has been permanently deleted.',
                  style: GoogleFonts.inter(fontWeight: FontWeight.w500),
                ),
              ),
            ],
          ),
          backgroundColor: const Color(0xFF16A34A),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          margin: const EdgeInsets.all(16),
          duration: const Duration(seconds: 5),
        ),
      );
    } else {
      setState(() {
        _isDeleting = false;
        _errorMessage = error;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
        top: 16,
        left: 24,
        right: 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Drag handle
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Header Icon & Title
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDC2626).withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.delete_forever_rounded,
                    color: Color(0xFFDC2626),
                    size: 28,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Delete Merchant Account',
                        style: GoogleFonts.inter(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF111827),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Permanent & irreversible action',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: const Color(0xFFDC2626),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Warning Notice Box
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFFCA5A5)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.shield_outlined,
                        color: Color(0xFFDC2626),
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'What will be permanently deleted:',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF991B1B),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  _buildWarningBullet('Your merchant user account & login credentials'),
                  _buildWarningBullet('All active sessions and push notification tokens'),
                  _buildWarningBullet('Personal contact details & staff records'),
                  _buildWarningBullet('Access to order management, KDS & POS portals'),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Reason selector
            Text(
              'Reason for leaving (Optional)',
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade800,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(12),
                color: Colors.grey.shade50,
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _selectedReason,
                  isExpanded: true,
                  icon: const Icon(Icons.keyboard_arrow_down_rounded),
                  items: _reasons.map((reason) {
                    return DropdownMenuItem(
                      value: reason,
                      child: Text(
                        reason,
                        style: GoogleFonts.inter(fontSize: 14),
                      ),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) {
                      setState(() => _selectedReason = val);
                    }
                  },
                ),
              ),
            ),
            const SizedBox(height: 18),

            // Security Validation (Password or Confirmation)
            if (!widget.isSocialUser) ...[
              Text(
                'Enter current password to verify identity',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey.shade800,
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                decoration: InputDecoration(
                  hintText: 'Enter your password',
                  hintStyle: GoogleFonts.inter(fontSize: 14, color: Colors.grey.shade400),
                  prefixIcon: const Icon(Icons.lock_outline, size: 20),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword ? Icons.visibility_off : Icons.visibility,
                      size: 20,
                      color: Colors.grey.shade600,
                    ),
                    onPressed: () =>
                        setState(() => _obscurePassword = !_obscurePassword),
                  ),
                  filled: true,
                  fillColor: Colors.grey.shade50,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFFDC2626), width: 1.5),
                  ),
                ),
              ),
            ] else ...[
              Text(
                'Type "DELETE" to confirm deletion',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey.shade800,
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _confirmationController,
                decoration: InputDecoration(
                  hintText: 'Type DELETE here',
                  hintStyle: GoogleFonts.inter(fontSize: 14, color: Colors.grey.shade400),
                  prefixIcon: const Icon(Icons.shield_outlined, size: 20),
                  filled: true,
                  fillColor: Colors.grey.shade50,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFFDC2626), width: 1.5),
                  ),
                ),
              ),
            ],

            // Error display
            if (_errorMessage != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFFCA5A5)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, size: 18, color: Color(0xFFDC2626)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: const Color(0xFFDC2626),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 24),

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _isDeleting ? null : () => Navigator.pop(context),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      side: BorderSide(color: Colors.grey.shade300),
                    ),
                    child: Text(
                      'Cancel',
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey.shade700,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: _isDeleting ? null : _handleDelete,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFDC2626),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: _isDeleting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : Text(
                            'Permanently Delete',
                            style: GoogleFonts.inter(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWarningBullet(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '• ',
            style: TextStyle(
              color: Color(0xFFDC2626),
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
          Expanded(
            child: Text(
              text,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: const Color(0xFF7F1D1D),
                height: 1.3,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
