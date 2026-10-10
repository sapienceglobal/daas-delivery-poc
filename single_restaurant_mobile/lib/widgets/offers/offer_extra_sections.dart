import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/screens/loyalty_rewards_screen.dart';
import 'package:single_restaurant_mobile/screens/referral_screen.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';

/// Bank Offers card matching screenshot design.
class BankOffersCard extends StatelessWidget {
  const BankOffersCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
        decoration: BoxDecoration(
          color: const Color(0xFFF9FAFB),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE5E7EB), width: 1.2),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: const Color(0xFFE5E7EB).withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(10),
              ),
              alignment: Alignment.center,
              child: Icon(
                Icons.credit_card_off_outlined,
                size: 24,
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'No Bank Offers Available',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF1E1E1E),
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    'Check back later for exciting bank discounts.',
                    style: TextStyle(
                      color: Colors.grey.shade500,
                      fontSize: 11.5,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// "More Ways to Save" card with Loyalty, Referral, and Club options.
class MoreWaysToSaveCard extends StatelessWidget {
  const MoreWaysToSaveCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE5E7EB), width: 1.2),
        ),
        child: Consumer<RestaurantProvider>(
          builder: (context, restProv, _) {
            final isLoyaltyEnabled =
                restProv.restaurant?['loyaltySettings']?['enabled'] ?? true;
            return Column(
              children: [
                if (isLoyaltyEnabled) ...[
                  _buildTile(
                    context,
                    Icons.military_tech_outlined,
                    'Loyalty Rewards',
                    'Earn points on every order & redeem exciting rewards',
                    iconBgColor: const Color(0xFFFDE8E8),
                    iconColor: const Color(0xFF8B1E1E),
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const LoyaltyRewardsScreen()),
                    ),
                  ),
                  const Divider(height: 1, color: Color(0xFFF3F4F6)),
                ],
                _buildTile(
                  context,
                  Icons.group_outlined,
                  'Refer & Earn',
                  'Invite your friends and both get \$10 off',
                  iconBgColor: const Color(0xFFFDE8E8),
                  iconColor: const Color(0xFF8B1E1E),
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const ReferralScreen()),
                  ),
                ),
                const Divider(height: 1, color: Color(0xFFF3F4F6)),
                _buildTile(
                  context,
                  Icons.workspace_premium_outlined,
                  'Lassi Lounge Club',
                  'Join our club & get exclusive member benefits',
                  iconBgColor: const Color(0xFFFEF3C7),
                  iconColor: const Color(0xFFB45309),
                  onTap: () => ToastUtils.showInfo(context, 'This feature is coming soon!'),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildTile(
    BuildContext context,
    IconData icon,
    String title,
    String subtitle, {
    required Color iconBgColor,
    required Color iconColor,
    required VoidCallback onTap,
  }) {
    return ListTile(
      onTap: onTap,
      leading: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: iconBgColor,
          shape: BoxShape.circle,
        ),
        alignment: Alignment.center,
        child: Icon(icon, color: iconColor, size: 20),
      ),
      title: Text(
        title,
        style: const TextStyle(
          fontWeight: FontWeight.w700,
          fontSize: 13.5,
          color: Color(0xFF1E1E1E),
        ),
      ),
      subtitle: Text(
        subtitle,
        style: TextStyle(color: Colors.grey.shade500, fontSize: 11.5),
      ),
      trailing: Icon(Icons.chevron_right, color: Colors.grey.shade400, size: 20),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
    );
  }
}
