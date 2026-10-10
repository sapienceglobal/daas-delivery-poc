import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/notification_provider.dart';
import 'package:single_restaurant_mobile/providers/order_provider.dart';
import 'package:single_restaurant_mobile/screens/notification_settings_screen.dart';
import 'package:single_restaurant_mobile/screens/notifications_screen.dart';
import 'package:single_restaurant_mobile/theme/app_typography.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';
import 'package:single_restaurant_mobile/widgets/profile/profile_delete_account_sheet.dart';
import 'package:single_restaurant_mobile/widgets/profile/profile_go_green_banner.dart';
import 'package:single_restaurant_mobile/widgets/profile/profile_header.dart';
import 'package:single_restaurant_mobile/widgets/profile/profile_logout_dialog.dart';
import 'package:single_restaurant_mobile/widgets/profile/profile_menu_list.dart';
import 'package:single_restaurant_mobile/widgets/profile/profile_orders_status.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ImagePicker _picker = ImagePicker();
  String _appVersion = '1.0.0';

  @override
  void initState() {
    super.initState();
    _loadAppVersion();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      authProvider.fetchUser();
      if (authProvider.isAuthenticated) {
        Provider.of<OrderProvider>(context, listen: false)
            .fetchMyOrders(silent: true);
      }
    });
  }

  Future<void> _loadAppVersion() async {
    try {
      final PackageInfo info = await PackageInfo.fromPlatform();
      if (mounted) {
        setState(() => _appVersion = '${info.version}+${info.buildNumber}');
      }
    } catch (_) {}
  }

  Future<void> _pickAndUploadImage(AuthProvider authProvider) async {
    if (authProvider.user == null) {
      ToastUtils.showError(context, 'Please login to edit profile');
      return;
    }
    final pickedFile = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (pickedFile != null) {
      final success = await authProvider.updateProfile(imagePath: pickedFile.path);
      if (mounted) {
        if (success) {
          ToastUtils.showSuccess(context, 'Profile picture updated successfully!');
        } else {
          ToastUtils.showError(context, authProvider.error ?? 'Failed to update profile picture');
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFCF9F2),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        toolbarHeight: 68,
        automaticallyImplyLeading: false,
        leadingWidth: Navigator.canPop(context) ? 140 : 115,
        leading: Padding(
          padding: const EdgeInsets.only(left: 16),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (Navigator.canPop(context)) ...[
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: const Icon(Icons.arrow_back, color: Color(0xFF680D13)),
                ),
                const SizedBox(width: 6),
              ],
              Flexible(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'My Profile',
                    style: AppTypography.serifHeading(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF2C0F12),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        centerTitle: true,
        title: Image.asset(
          'assets/images/branded/lassi-lounge/Lassi-Lounge-logo.png',
          height: 84,
          fit: BoxFit.contain,
          errorBuilder: (c, e, s) => const SizedBox.shrink(),
        ),
        actions: [
          Builder(
            builder: (context) {
              NotificationProvider? np;
              try {
                np = Provider.of<NotificationProvider>(context);
              } catch (_) {
                np = null;
              }
              final bool hasUnread = np?.hasUnread ?? false;
              return Stack(
                clipBehavior: Clip.none,
                children: [
                  _buildHeaderIconButton(
                    icon: Icons.notifications_none_outlined,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (_) => const NotificationsScreen()),
                    ),
                  ),
                  if (hasUnread)
                    Positioned(
                      right: 2,
                      top: 2,
                      child: Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: Colors.red.shade700,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 1.5),
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
          const SizedBox(width: 8),
          _buildHeaderIconButton(
            icon: Icons.settings_outlined,
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (_) => const NotificationSettingsScreen()),
            ),
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: Consumer2<AuthProvider, OrderProvider>(
        builder: (context, authProvider, orderProvider, child) {
          if (authProvider.isLoading && authProvider.user == null) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.secondary),
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: ResponsiveCenter(
              maxWidth: 650,
              child: Column(
                children: [
                  ProfileHeader(
                    authProvider: authProvider,
                    onPickImage: () => _pickAndUploadImage(authProvider),
                  ),
                  const SizedBox(height: 18),
                  ProfileOrdersStatus(orderProvider: orderProvider),
                  const SizedBox(height: 18),
                  ProfileMenuList(appVersion: _appVersion),
                  const SizedBox(height: 16),
                  const ProfileGoGreenBanner(),
                  const SizedBox(height: 16),
                  _buildLogoutButton(context, authProvider),
                  if (authProvider.isAuthenticated) ...[
                    const SizedBox(height: 12),
                    _buildDeleteAccountButton(context, authProvider),
                  ],
                  const SizedBox(height: 32),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildLogoutButton(BuildContext context, AuthProvider authProvider) {
    return GestureDetector(
      onTap: () => ProfileLogoutDialog.show(context, authProvider),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFFFDF2F0),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFFAD7D2)),
        ),
        child: const Row(
          children: [
            Icon(Icons.logout, color: Color(0xFF7A0B10), size: 22),
            SizedBox(width: 16),
            Expanded(child: Text('Logout', style: TextStyle(color: Color(0xFF7A0B10), fontWeight: FontWeight.bold, fontSize: 16))),
            Icon(Icons.chevron_right, color: Color(0xFF7A0B10), size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildDeleteAccountButton(BuildContext context, AuthProvider authProvider) {
    return GestureDetector(
      onTap: () => ProfileDeleteAccountSheet.show(context, authProvider),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF0F0),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFFECACA)),
        ),
        child: const Row(
          children: [
            Icon(Icons.delete_forever_outlined, color: Color(0xFFDC2626), size: 22),
            SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Delete Account', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14.5, color: Color(0xFFDC2626))),
                  SizedBox(height: 2),
                  Text('Permanently erase your account & personal data', style: TextStyle(color: Color(0xFF991B1B), fontSize: 11.5)),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: Color(0xFFDC2626), size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderIconButton({required IconData icon, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(22),
      child: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.grey.shade300, width: 1.0),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 4, offset: const Offset(0, 2)),
          ],
        ),
        child: Icon(icon, size: 21, color: Colors.black87),
      ),
    );
  }
}
