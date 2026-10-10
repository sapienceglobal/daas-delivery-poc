import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/screens/about_us_screen.dart';
import 'package:single_restaurant_mobile/screens/book_table_screen.dart';
import 'package:single_restaurant_mobile/screens/favorites_screen.dart';
import 'package:single_restaurant_mobile/screens/help_support_screen.dart';
import 'package:single_restaurant_mobile/screens/loyalty_screen.dart';
import 'package:single_restaurant_mobile/screens/notification_settings_screen.dart';
import 'package:single_restaurant_mobile/screens/referral_screen.dart';
import 'package:single_restaurant_mobile/screens/saved_addresses_screen.dart';
import 'package:single_restaurant_mobile/screens/saved_cards_screen.dart';
import 'package:single_restaurant_mobile/services/ota_update_service.dart';
import 'package:url_launcher/url_launcher.dart';

class ProfileMenuList extends StatelessWidget {
  final String appVersion;

  const ProfileMenuList({
    super.key,
    required this.appVersion,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF3ECE6)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          _buildMenuItem(
            Icons.table_restaurant_outlined,
            'Book a Table',
            'Reserve your dining table',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const BookTableScreen()),
            ),
          ),
          _buildDivider(),
          _buildMenuItem(
            Icons.favorite_outline,
            'Favorites',
            'Your liked items',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const FavoritesScreen()),
            ),
          ),
          _buildDivider(),
          _buildMenuItem(
            Icons.location_on_outlined,
            'Addresses',
            'Manage your saved addresses',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const SavedAddressesScreen()),
            ),
          ),
          _buildDivider(),
          _buildMenuItem(
            Icons.credit_card_outlined,
            'Payment Methods',
            'Cards, Wallets & UPI',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const SavedCardsScreen()),
            ),
          ),
          _buildDivider(),
          Consumer<RestaurantProvider>(
            builder: (context, restProv, _) {
              final isLoyaltyEnabled = restProv.restaurant?['loyaltySettings']?['enabled'] ?? true;
              if (!isLoyaltyEnabled) return const SizedBox.shrink();
              return Column(
                children: [
                  _buildMenuItem(
                    Icons.military_tech_outlined,
                    'Loyalty & Rewards',
                    'Points, Offers & Benefits',
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const LoyaltyScreen()),
                    ),
                  ),
                  _buildDivider(),
                ],
              );
            },
          ),
          _buildMenuItem(
            Icons.card_giftcard_outlined,
            'Invite & Earn',
            'Invite your friends & earn rewards',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ReferralScreen()),
            ),
          ),
          _buildDivider(),
          _buildMenuItem(
            Icons.headset_mic_outlined,
            'Help & Support',
            'FAQs, Contact us & more',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const HelpSupportScreen()),
            ),
          ),
          _buildDivider(),
          _buildMenuItem(
            Icons.notifications_active_outlined,
            'Notification Settings',
            'Manage emails, SMS & push',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const NotificationSettingsScreen()),
            ),
          ),
          _buildDivider(),
          _buildMenuItem(
            Icons.system_update_alt_outlined,
            'Check for Updates',
            'Find new versions of Lassi Lounge',
            onTap: () => OtaUpdateService().checkForUpdate(context, isManual: true),
          ),
          _buildDivider(),
          _buildMenuItem(
            Icons.info_outline,
            'About Lassi Lounge',
            'Version $appVersion',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const AboutUsScreen()),
            ),
          ),
          _buildDivider(),
          _buildMenuItem(
            Icons.privacy_tip_outlined,
            'Privacy Policy',
            'Data security & privacy details',
            onTap: () async {
              final uri = Uri.parse('https://lassiloungeny.com/privacy-policy');
              if (await canLaunchUrl(uri)) {
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              }
            },
          ),
          _buildDivider(),
          _buildMenuItem(
            Icons.description_outlined,
            'Terms of Service',
            'Terms & conditions',
            onTap: () async {
              final uri = Uri.parse('https://lassiloungeny.com/terms');
              if (await canLaunchUrl(uri)) {
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildDivider() {
    return const Divider(height: 1, indent: 68, endIndent: 16, color: Color(0xFFF5EFEA));
  }

  Widget _buildMenuItem(
    IconData icon,
    String title,
    String subtitle, {
    VoidCallback? onTap,
  }) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      leading: Container(
        padding: const EdgeInsets.all(9),
        decoration: const BoxDecoration(
          color: Color(0xFFFDF1EF),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: const Color(0xFF680D13), size: 20),
      ),
      title: Text(
        title,
        style: const TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 14.5,
          color: Color(0xFF1E0C0E),
        ),
      ),
      subtitle: Text(
        subtitle,
        style: const TextStyle(
          color: Color(0xFF6E6E6E),
          fontSize: 12,
        ),
      ),
      trailing: const Icon(Icons.chevron_right, color: Color(0xFF757575), size: 20),
      onTap: onTap ?? () {},
    );
  }
}
