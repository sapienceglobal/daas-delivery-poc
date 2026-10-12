import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';

class NotificationSettingsScreen extends StatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  State<NotificationSettingsScreen> createState() => _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState extends State<NotificationSettingsScreen> {
  bool _email = true;
  bool _sms = false;
  bool _push = true;
  bool _marketing = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      if (authProvider.user?.notificationPreferences != null) {
        final prefs = authProvider.user!.notificationPreferences!;
        setState(() {
          _email = prefs['email'] ?? true;
          _sms = prefs['sms'] ?? false;
          _push = prefs['push'] ?? true;
          _marketing = prefs['marketing'] ?? true;
        });
      }
    });
  }

  Future<void> _updatePreference(String key, bool value) async {
    // Optimistic UI update locally first
    setState(() {
      if (key == 'email') _email = value;
      if (key == 'sms') _sms = value;
      if (key == 'push') _push = value;
      if (key == 'marketing') _marketing = value;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    // Construct the full preferences map to send
    final updatedPrefs = {
      'email': _email,
      'sms': _sms,
      'push': _push,
      'marketing': _marketing,
    };

    final success = await authProvider.updateNotificationPreferences(updatedPrefs);
    
    if (!success && mounted) {
      // Revert if API failed
      setState(() {
        if (key == 'email') _email = !value;
        if (key == 'sms') _sms = !value;
        if (key == 'push') _push = !value;
        if (key == 'marketing') _marketing = !value;
      });
      ToastUtils.showError(context, 'Failed to update settings. Please try again.');
    }
  }

  static const _maroon = Color(0xFF6E1111);
  static const _pinkTint = Color(0xFFFDEEEE);
  static const _peachTint = Color(0xFFFDF3E4);
  static const _pinkIconBg = Color(0xFFFADCDC);
  static const _peachIconBg = Color(0xFFFBE6C8);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFBF6F1),
      body: Stack(
        children: [
          // Decorative top-right accent
          Positioned(
            top: -70,
            right: -90,
            child: Container(
              width: 220,
              height: 220,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF8E1A1A),
                    _maroon.withValues(alpha: 0.85),
                  ],
                ),
                boxShadow: [
                  BoxShadow(
                    color: _maroon.withValues(alpha: 0.25),
                    blurRadius: 30,
                  ),
                ],
              ),
              child: Align(
                alignment: const Alignment(-0.45, 0.35),
                child: Icon(Icons.eco,
                    size: 46, color: Colors.green.shade400),
              ),
            ),
          ),
          SafeArea(
            child: ResponsiveCenter(
              maxWidth: 650,
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        width: 42,
                        height: 42,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.06),
                              blurRadius: 10,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: const Icon(Icons.arrow_back, color: _maroon),
                      ),
                    ),
                    const SizedBox(height: 18),
                    const Text(
                      'Notification Settings',
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF1A1A1A),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Manage how we contact you',
                      style: TextStyle(color: Colors.grey.shade600, fontSize: 15),
                    ),
                    const SizedBox(height: 28),
                    _sectionHeader('Order Notifications', 'Stay updated on your orders'),
                    const SizedBox(height: 14),
                    _buildSettingSection(
                      title: 'Order Updates (Email)',
                      description: 'Receive order confirmations, receipts, and status updates via email.',
                      icon: Icons.mail_outline,
                      illustration: Icons.drafts,
                      tint: _pinkTint,
                      iconBg: _pinkIconBg,
                      value: _email,
                      onChanged: (val) => _updatePreference('email', val),
                    ),
                    const SizedBox(height: 16),
                    _buildSettingSection(
                      title: 'Order Updates (SMS)',
                      description: 'Get real-time text messages when your food is on the way.',
                      icon: Icons.sms_outlined,
                      illustration: Icons.mark_chat_unread,
                      tint: _peachTint,
                      iconBg: _peachIconBg,
                      value: _sms,
                      onChanged: (val) => _updatePreference('sms', val),
                    ),
                    const SizedBox(height: 16),
                    _buildSettingSection(
                      title: 'Push Notifications',
                      description: 'Receive app notifications on your device for order tracking.',
                      icon: Icons.notifications_none,
                      illustration: Icons.notifications_active,
                      tint: _pinkTint,
                      iconBg: _pinkIconBg,
                      value: _push,
                      onChanged: (val) => _updatePreference('push', val),
                    ),
                    const SizedBox(height: 30),
                    _sectionHeader('Promotions', 'Be the first to know about exciting offers'),
                    const SizedBox(height: 14),
                    _buildSettingSection(
                      title: 'Offers & Marketing',
                      description: 'Get notified about new menu items, special discounts, and events.',
                      icon: Icons.sell_outlined,
                      illustration: Icons.card_giftcard,
                      tint: _peachTint,
                      iconBg: _peachIconBg,
                      value: _marketing,
                      onChanged: (val) => _updatePreference('marketing', val),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionHeader(String title, String subtitle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 20,
            color: Color(0xFF1A1A1A),
          ),
        ),
        const SizedBox(height: 4),
        Text(subtitle, style: TextStyle(color: Colors.grey.shade600, fontSize: 14)),
      ],
    );
  }

  Widget _buildSettingSection({
    required String title,
    required String description,
    required IconData icon,
    required IconData illustration,
    required Color tint,
    required Color iconBg,
    required bool value,
    required Function(bool) onChanged,
  }) {
    final isPeach = tint == _peachTint;
    final illoColor =
        isPeach ? const Color(0xFFE9B97A) : const Color(0xFFF0A3A3);
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Colors.white, tint],
        ),
        border: Border.all(color: Colors.white),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: 10,
            bottom: 4,
            child: Icon(illustration,
                size: 54, color: illoColor.withValues(alpha: 0.55)),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 18, 14, 22),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 62,
                  height: 62,
                  decoration: BoxDecoration(color: iconBg, shape: BoxShape.circle),
                  child: Icon(icon, color: _maroon, size: 28),
                ),
                const SizedBox(width: 18),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(right: 28),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 17,
                            color: Color(0xFF1A1A1A),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          description,
                          style: TextStyle(
                            color: Colors.grey.shade700,
                            fontSize: 14,
                            height: 1.35,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                CupertinoSwitch(
                  value: value,
                  activeTrackColor: _maroon,
                  inactiveTrackColor: Colors.grey.shade300,
                  onChanged: onChanged,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
