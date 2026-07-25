import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/screens/saved_addresses_screen.dart';
import 'package:single_restaurant_mobile/screens/saved_cards_screen.dart';
import 'package:single_restaurant_mobile/screens/loyalty_screen.dart';
import 'package:single_restaurant_mobile/screens/referral_screen.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/screens/login_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  void initState() {
    super.initState();
    // Fetch fresh user data if needed when profile screen loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AuthProvider>(context, listen: false).fetchUser();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAF8F5), // Light background
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'My Profile',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 24),
        ),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none_outlined, color: AppColors.secondary),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: AppColors.secondary),
            onPressed: () {},
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          if (authProvider.isLoading && authProvider.user == null) {
            return const Center(child: CircularProgressIndicator(color: AppColors.secondary));
          }
          return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _buildProfileHeader(authProvider),
                  const SizedBox(height: 16),
                  _buildOrdersQuickStatus(),
                  const SizedBox(height: 16),
                  _buildMenuList(),
                  const SizedBox(height: 16),
                  _buildGoGreenBanner(),
                  const SizedBox(height: 24),
                  _buildLogoutButton(context, authProvider),
                  const SizedBox(height: 32), // Extra bottom padding
                ],
              ),
            );
        },
      ),
    );
  }

  Widget _buildProfileHeader(AuthProvider authProvider) {
    final user = authProvider.user;
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Stack(
                alignment: Alignment.bottomRight,
                children: [
                  CircleAvatar(
                    radius: 36,
                    backgroundColor: Colors.grey.shade200,
                    backgroundImage: const AssetImage('assets/images/branded/lassi-lounge/reviews/amit-v.jpg'), // Mock image
                    child: const Icon(Icons.person, color: Colors.grey, size: 40),
                  ),
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFDF7F3),
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: const Icon(Icons.edit, size: 12, color: AppColors.secondary),
                  ),
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(user?.name ?? 'Guest User', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    const SizedBox(height: 4),
                    Text(user?.phone ?? '', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                    const SizedBox(height: 2),
                    Text(user?.email ?? '', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.orange.shade50,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.workspace_premium, color: Colors.orange, size: 14),
                          const SizedBox(width: 4),
                          Text(user?.role == 'merchant' ? 'Merchant' : 'Gold Member', style: const TextStyle(color: Colors.orange, fontSize: 11, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    )
                  ],
                ),
              ),
              Column(
                children: [
                  Row(
                    children: [
                      const Text('Edit Profile', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 12)),
                      const SizedBox(width: 4),
                      const Icon(Icons.chevron_right, color: AppColors.secondary, size: 16),
                    ],
                  ),
                  const SizedBox(height: 40), // spacer to push it up
                ],
              )
            ],
          ),
          const Divider(height: 32),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildStatItem(Icons.shopping_bag_outlined, '0', 'Orders'),
              Container(height: 40, width: 1, color: AppColors.divider),
              _buildStatItem(Icons.star_outline, '0.0', 'Ratings'),
              Container(height: 40, width: 1, color: AppColors.divider),
              _buildStatItem(Icons.local_offer_outlined, '0', 'Offers Used'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(IconData icon, String value, String label) {
    return Row(
      children: [
        Icon(icon, color: AppColors.secondary, size: 24),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
          ],
        ),
      ],
    );
  }

  Widget _buildOrdersQuickStatus() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('My Orders', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              Row(
                children: [
                  const Text('View All Orders', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 12)),
                  const SizedBox(width: 4),
                  const Icon(Icons.chevron_right, color: AppColors.secondary, size: 16),
                ],
              )
            ],
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildOrderStatusItem(Icons.receipt_long, '2', 'On The Way', Colors.orange.shade50, Colors.orange),
              _buildOrderStatusItem(Icons.check_circle_outline, '15', 'Delivered', Colors.green.shade50, Colors.green, textColor: Colors.black),
              _buildOrderStatusItem(Icons.cancel_outlined, '1', 'Cancelled', Colors.red.shade50, AppColors.secondary),
              _buildOrderStatusItem(Icons.schedule, '0', 'Upcoming', Colors.yellow.shade50, Colors.orange.shade600),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildOrderStatusItem(IconData icon, String count, String label, Color bgColor, Color iconColor, {Color textColor = AppColors.secondary}) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: bgColor,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: iconColor, size: 24),
        ),
        const SizedBox(height: 8),
        Text(count, style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 10)),
      ],
    );
  }

  Widget _buildMenuList() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        children: [
          _buildMenuItem(Icons.location_on_outlined, 'Addresses', 'Manage your saved addresses', onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const SavedAddressesScreen()),
            );
          }),
          const Divider(height: 1, indent: 64),
          _buildMenuItem(Icons.credit_card_outlined, 'Payment Methods', 'Cards, Wallets & UPI', onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const SavedCardsScreen()),
            );
          }),
          const Divider(height: 1, indent: 64),
          _buildMenuItem(Icons.workspace_premium_outlined, 'Loyalty & Rewards', 'Points, Offers & Benefits', onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const LoyaltyScreen()),
            );
          }),
          const Divider(height: 1, indent: 64),
          _buildMenuItem(Icons.card_giftcard_outlined, 'Invite & Earn', 'Invite friends & earn rewards', onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const ReferralScreen()),
            );
          }),
          const Divider(height: 1, indent: 64),
          _buildMenuItem(Icons.headset_mic_outlined, 'Help & Support', 'FAQs, Contact us & more'),
          const Divider(height: 1, indent: 64),
          _buildMenuItem(Icons.info_outline, 'About Lassi Lounge', 'Version 1.0.0'),
        ],
      ),
    );
  }

  Widget _buildMenuItem(IconData icon, String title, String subtitle, {VoidCallback? onTap}) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: const BoxDecoration(
          color: Color(0xFFFDF7F3),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: AppColors.secondary, size: 20),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
      subtitle: Text(subtitle, style: const TextStyle(color: Colors.grey, fontSize: 12)),
      trailing: const Icon(Icons.chevron_right, color: Colors.grey, size: 20),
      onTap: onTap ?? () {},
    );
  }

  Widget _buildGoGreenBanner() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F8F1), // Light green
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.green.shade200),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.eco_outlined, color: Colors.green, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Go Green with Lassi Lounge', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 4),
                const Text('Opt for no-contact delivery and eco-friendly packaging.', style: TextStyle(color: Colors.grey, fontSize: 11)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          OutlinedButton(
            onPressed: () {},
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Colors.green),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              padding: const EdgeInsets.symmetric(horizontal: 12),
              minimumSize: const Size(0, 32),
            ),
            child: const Text('Learn More', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 12)),
          )
        ],
      ),
    );
  }

  Widget _buildLogoutButton(BuildContext context, AuthProvider authProvider) {
    return InkWell(
      onTap: () async {
        await authProvider.logout();
        if (context.mounted) {
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(builder: (context) => const LoginScreen()),
            (route) => false,
          );
        }
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.secondary.withOpacity(0.5)),
        ),
        child: authProvider.isLoading 
          ? const Center(child: CircularProgressIndicator(color: AppColors.secondary))
          : const Row(
              children: [
                Icon(Icons.logout, color: AppColors.secondary, size: 24),
                SizedBox(width: 16),
                Expanded(child: Text('Logout', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 16))),
                Icon(Icons.chevron_right, color: AppColors.secondary, size: 20),
              ],
            ),
      ),
    );
  }
}
