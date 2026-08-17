import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAF8F5),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.secondary),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Notification Settings',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Manage how we contact you',
              style: TextStyle(color: Colors.grey, fontSize: 14),
            ),
            const SizedBox(height: 24),
            _buildSettingSection(
              title: 'Order Updates (Email)',
              description: 'Receive order confirmations, receipts, and status updates via email.',
              icon: Icons.email_outlined,
              value: _email,
              onChanged: (val) => _updatePreference('email', val),
            ),
            const SizedBox(height: 16),
            _buildSettingSection(
              title: 'Order Updates (SMS)',
              description: 'Get real-time text messages when your food is on the way.',
              icon: Icons.sms_outlined,
              value: _sms,
              onChanged: (val) => _updatePreference('sms', val),
            ),
            const SizedBox(height: 16),
            _buildSettingSection(
              title: 'Push Notifications',
              description: 'Receive app notifications on your device for order tracking.',
              icon: Icons.notifications_active_outlined,
              value: _push,
              onChanged: (val) => _updatePreference('push', val),
            ),
            const SizedBox(height: 32),
            const Text(
              'Promotions',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 16),
            _buildSettingSection(
              title: 'Offers & Marketing',
              description: 'Get notified about new menu items, special discounts, and events.',
              icon: Icons.local_offer_outlined,
              value: _marketing,
              onChanged: (val) => _updatePreference('marketing', val),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingSection({
    required String title,
    required String description,
    required IconData icon,
    required bool value,
    required Function(bool) onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFFDF7F3),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.orange.shade100),
            ),
            child: Icon(icon, color: AppColors.secondary, size: 22),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12, height: 1.3),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          CupertinoSwitch(
            value: value,
            activeColor: AppColors.secondary,
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
}
