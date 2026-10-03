import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../constants/app_colors.dart';
import '../providers/auth_provider.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({Key? key}) : super(key: key);

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
    // Current route to highlight active tab
    final String location = GoRouterState.of(context).uri.toString();

    final user = context.watch<AuthProvider>().user;
    final name = (user?['name'] as String?)?.isNotEmpty == true
        ? user!['name'] as String
        : 'Admin';
    final email = (user?['email'] as String?)?.isNotEmpty == true
        ? user!['email'] as String
        : 'admin@lassilounge.com';
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'A';

    return Drawer(
      width: 280,
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      child: Column(
        children: [
          // 1. Header (Logo & Close button)
          Container(
            padding: const EdgeInsets.only(top: 38, left: 24, right: 16, bottom: 14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Logo
                Image.asset(
                  'assets/images/branded/lassi-lounge/Lassi-Lounge-logo.png',
                  height: 90,
                  errorBuilder: (context, error, stackTrace) => Text(
                    'Lassi Lounge',
                    style: GoogleFonts.outfit(
                      color: const Color(0xFFE63946),
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                // Close Button
                InkWell(
                  onTap: () => context.pop(),
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: const BoxDecoration(
                      color: Color(0xFFF3F4F6),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.close, size: 16, color: Color(0xFF6B7280)),
                  ),
                ),
              ],
            ),
          ),

          // 2. Profile Section
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: const BoxDecoration(
                    color: Color(0xFFF97316),
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    initial,
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: GoogleFonts.inter(
                          color: const Color(0xFF111827),
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        email,
                        style: GoogleFonts.inter(
                          color: const Color(0xFF6B7280),
                          fontSize: 13,
                          fontWeight: FontWeight.w400,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: Divider(color: Color(0xFFF3F4F6), thickness: 1),
          ),

          // 3. Navigation List
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              physics: const BouncingScrollPhysics(),
              children: [
                _buildDrawerItem(
                  icon: Icons.home_filled,
                  title: 'Dashboard',
                  iconColor: const Color(0xFFF97316),
                  isActive: location == '/',
                  onTap: () {
                    context.pop();
                    context.go('/');
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.analytics_outlined,
                  title: 'Analytics',
                  iconColor: const Color(0xFF0EA5E9),
                  isActive: location == '/analytics',
                  onTap: () {
                    context.pop();
                    context.push('/analytics');
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.room_service_outlined,
                  title: 'All Orders',
                  iconColor: const Color(0xFF22C55E),
                  isActive: location == '/all-orders',
                  onTap: () {
                    context.pop();
                    context.push('/all-orders');
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.calendar_month_outlined,
                  title: 'Catering Enquiries',
                  iconColor: const Color(0xFFA855F7),
                  isActive: location == '/catering',
                  onTap: () {
                    context.pop();
                    context.push('/catering');
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.sell_outlined,
                  title: 'Menu Management',
                  iconColor: const Color(0xFF8B5CF6),
                  isActive: location == '/menu-management',
                  onTap: () {
                    context.pop();
                    context.push('/menu-management');
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.discount_outlined,
                  title: 'Promotions',
                  iconColor: const Color(0xFF3B82F6),
                  isActive: location == '/promotions',
                  onTap: () {
                    context.pop();
                    context.push('/promotions');
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.people_alt_outlined,
                  title: 'Customers & CRM',
                  iconColor: const Color(0xFFEC4899),
                  isActive: location == '/crm',
                  onTap: () {
                    context.pop();
                    context.push('/crm');
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.web_rounded,
                  title: 'Website CMS',
                  iconColor: const Color(0xFF0EA5E9),
                  isActive: location == '/cms',
                  onTap: () {
                    context.pop();
                    context.push('/cms');
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.settings_outlined,
                  title: 'Restaurant Settings',
                  iconColor: const Color(0xFF4F46E5),
                  isActive: location == '/restaurant-settings',
                  onTap: () {
                    context.pop();
                    context.push('/restaurant-settings');
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.card_giftcard_rounded,
                  title: 'Loyalty & Rewards',
                  iconColor: const Color(0xFFF59E0B),
                  isActive: location == '/loyalty',
                  onTap: () {
                    context.pop();
                    context.push('/loyalty');
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.campaign_outlined,
                  title: 'Push Marketing',
                  iconColor: const Color(0xFFEC4899),
                  isActive: location == '/marketing',
                  onTap: () {
                    context.pop();
                    context.push('/marketing');
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.forum_outlined,
                  title: 'Support Messages',
                  iconColor: const Color(0xFFF43F5E),
                  isActive: location == '/support-messages',
                  onTap: () {
                    context.pop();
                    context.push('/support-messages');
                  },
                ),

                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 8),
                  child: Divider(color: Color(0xFFF3F4F6), thickness: 1),
                ),

                // Legal & Policy items
                _buildDrawerItem(
                  icon: Icons.shield_outlined,
                  title: 'Privacy Policy',
                  iconColor: const Color(0xFF6B7280),
                  isActive: false,
                  onTap: () => _launchUrl(privacyPolicyUrl),
                ),
                _buildDrawerItem(
                  icon: Icons.description_outlined,
                  title: 'Terms of Service',
                  iconColor: const Color(0xFF6B7280),
                  isActive: false,
                  onTap: () => _launchUrl(termsOfServiceUrl),
                ),
                _buildDrawerItem(
                  icon: Icons.delete_forever_outlined,
                  title: 'Delete Account',
                  iconColor: const Color(0xFFEF4444),
                  isActive: false,
                  onTap: () {
                    context.pop();
                    _showDeleteAccountSheet(context);
                  },
                ),
              ],
            ),
          ),

          // 4. Footer section
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 24),
            child: Divider(color: Color(0xFFF3F4F6), thickness: 1),
          ),

          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            child: Column(
              children: [
                FutureBuilder<PackageInfo>(
                  future: PackageInfo.fromPlatform(),
                  builder: (context, snapshot) {
                    if (snapshot.hasData) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12.0),
                        child: Text(
                          'Version ${snapshot.data!.version}',
                          style: GoogleFonts.inter(
                            color: Colors.grey.shade500,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      );
                    }
                    return const SizedBox.shrink();
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.logout,
                  title: 'Logout',
                  iconColor: const Color(0xFFEF4444),
                  isActive: false,
                  onTap: () async {
                    await context.read<AuthProvider>().logout();
                    if (context.mounted) {
                      context.go('/login');
                    }
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDrawerItem({
    required IconData icon,
    required String title,
    required Color iconColor,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          hoverColor: const Color(0xFFF9FAFB),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isActive ? const Color(0xFFFFF7ED) : Colors.transparent,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(
                  icon,
                  color: isActive ? iconColor : iconColor.withOpacity(0.85),
                  size: 22,
                ),
                const SizedBox(width: 16),
                Text(
                  title,
                  style: GoogleFonts.inter(
                    color: isActive ? iconColor : const Color(0xFF374151),
                    fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
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
                color: const Color(0xFFDC2626).withOpacity(0.1),
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
                    color: const Color(0xFFDC2626).withOpacity(0.1),
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
