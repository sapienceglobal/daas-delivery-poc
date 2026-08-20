import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/screens/saved_addresses_screen.dart';
import 'package:single_restaurant_mobile/screens/saved_cards_screen.dart';
import 'package:single_restaurant_mobile/screens/orders_screen.dart';
import 'package:single_restaurant_mobile/services/ota_update_service.dart';
import 'package:single_restaurant_mobile/screens/loyalty_screen.dart';
import 'package:single_restaurant_mobile/screens/referral_screen.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/address_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/order_provider.dart';
import 'package:single_restaurant_mobile/providers/loyalty_provider.dart';
import 'package:single_restaurant_mobile/providers/checkout_provider.dart';
import 'package:single_restaurant_mobile/providers/notification_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/screens/login_screen.dart';
import 'package:single_restaurant_mobile/screens/favorites_screen.dart';
import 'package:single_restaurant_mobile/screens/help_support_screen.dart';
import 'package:single_restaurant_mobile/screens/notifications_screen.dart';
import 'package:single_restaurant_mobile/screens/notification_settings_screen.dart';
import 'package:single_restaurant_mobile/screens/edit_profile_screen.dart';
import 'package:single_restaurant_mobile/screens/book_table_screen.dart';
import 'package:single_restaurant_mobile/screens/about_us_screen.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';
import 'package:package_info_plus/package_info_plus.dart';

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
        Provider.of<OrderProvider>(context, listen: false).fetchMyOrders(silent: true);
      }
    });
  }

  Future<void> _loadAppVersion() async {
    try {
      final PackageInfo info = await PackageInfo.fromPlatform();
      if (mounted) {
        setState(() {
          _appVersion = info.version;
        });
      }
    } catch (e) {
      debugPrint('Failed to load app version: $e');
    }
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
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (context) => const NotificationsScreen()));
            },
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: AppColors.secondary),
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (context) => const NotificationSettingsScreen()));
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Consumer2<AuthProvider, OrderProvider>(
        builder: (context, authProvider, orderProvider, child) {
          if (authProvider.isLoading && authProvider.user == null) {
            return const Center(child: CircularProgressIndicator(color: AppColors.secondary));
          }
          return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _buildProfileHeader(authProvider, orderProvider),
                  const SizedBox(height: 16),
                  _buildOrdersQuickStatus(orderProvider),
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

  Widget _buildProfileHeader(AuthProvider authProvider, OrderProvider orderProvider) {
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
              GestureDetector(
                onTap: () => _pickAndUploadImage(authProvider),
                child: Stack(
                  alignment: Alignment.bottomRight,
                  children: [
                    CircleAvatar(
                      radius: 36,
                      backgroundColor: Colors.grey.shade200,
                      backgroundImage: (user != null && user.profilePicture != null && user.profilePicture!.isNotEmpty)
                          ? CachedNetworkImageProvider(user.profilePicture!) as ImageProvider
                          : const AssetImage('assets/images/branded/lassi-lounge/reviews/amit-v.jpg'), // Mock image
                      child: (user != null && user.profilePicture != null && user.profilePicture!.isNotEmpty)
                          ? null
                          : const Icon(Icons.person, color: Colors.grey, size: 40),
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
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(user?.name ?? 'Guest User', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    const SizedBox(height: 4),
                    if (user?.phone != null && user!.phone!.trim().isNotEmpty) ...[
                      Text(user!.phone!, style: const TextStyle(color: Colors.grey, fontSize: 13)),
                      const SizedBox(height: 2),
                    ],
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
              GestureDetector(
                onTap: () {
                  if (user != null) {
                    Navigator.push(context, MaterialPageRoute(builder: (context) => const EditProfileScreen()));
                  } else {
                    ToastUtils.showError(context, 'Please login to edit profile');
                  }
                },
                child: Column(
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
                ),
              )
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

  Widget _buildOrdersQuickStatus(OrderProvider orderProvider) {
    int active = 0;
    int delivered = 0;
    int cancelled = 0;
    int upcoming = 0;

    for (var order in orderProvider.orders) {
      final status = order['status'] ?? '';
      if (status == 'delivered') {
        delivered++;
      } else if (status == 'cancelled') {
        cancelled++;
      } else if (status != '') {
        active++;
      }
    }

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
              GestureDetector(
                onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (context) => OrdersScreen(
                    onBack: () => Navigator.pop(context),
                  )));
                },
                child: Row(
                  children: [
                    const Text('View All Orders', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 12)),
                    const SizedBox(width: 4),
                    const Icon(Icons.chevron_right, color: AppColors.secondary, size: 16),
                  ],
                ),
              )
            ],
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildOrderStatusItem(Icons.receipt_long, active.toString(), 'On The Way', Colors.orange.shade50, Colors.orange),
              _buildOrderStatusItem(Icons.check_circle_outline, delivered.toString(), 'Delivered', Colors.green.shade50, Colors.green, textColor: Colors.black),
              _buildOrderStatusItem(Icons.cancel_outlined, cancelled.toString(), 'Cancelled', Colors.red.shade50, AppColors.secondary),
              _buildOrderStatusItem(Icons.schedule, upcoming.toString(), 'Upcoming', Colors.yellow.shade50, Colors.orange.shade600),
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
          _buildMenuItem(Icons.event_seat_outlined, 'Book a Table', 'Reserve your dining table', onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const BookTableScreen()),
            );
          }),
          const Divider(height: 1, indent: 64),
          _buildMenuItem(Icons.favorite_border, 'Favorites', 'Your liked items', onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const FavoritesScreen()),
            );
          }),
          const Divider(height: 1, indent: 64),
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
          Consumer<RestaurantProvider>(
            builder: (context, restProv, _) {
              final isLoyaltyEnabled = restProv.restaurant?['loyaltySettings']?['enabled'] ?? true;
              if (!isLoyaltyEnabled) return const SizedBox.shrink();
              return Column(
                children: [
                  _buildMenuItem(Icons.workspace_premium_outlined, 'Loyalty & Rewards', 'Points, Offers & Benefits', onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const LoyaltyScreen()),
                    );
                  }),
                  const Divider(height: 1, indent: 64),
                ],
              );
            },
          ),
          _buildMenuItem(Icons.card_giftcard_outlined, 'Invite & Earn', 'Invite friends & earn rewards', onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const ReferralScreen()),
            );
          }),
          const Divider(height: 1, indent: 64),
          _buildMenuItem(Icons.headset_mic_outlined, 'Help & Support', 'FAQs, Contact us & more', onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const HelpSupportScreen()),
            );
          }),
          const Divider(height: 1, indent: 64),
          _buildMenuItem(Icons.notifications_active_outlined, 'Notification Settings', 'Manage emails, SMS & push', onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const NotificationSettingsScreen()),
            );
          }),
          const Divider(height: 1, indent: 64),
          _buildMenuItem(Icons.update, 'Check for Updates', 'Find new versions of Lassi Lounge', onTap: () {
            OtaUpdateService().checkForUpdate(context, isManual: true);
          }),
          const Divider(height: 1, indent: 64),
          _buildMenuItem(Icons.info_outline, 'About Lassi Lounge', 'Version $_appVersion', onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const AboutUsScreen()),
            );
          }),
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
            onPressed: () {
              _showGoGreenBottomSheet(context);
            },
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
      onTap: () {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) {
            bool isLoggingOut = false;
            return StatefulBuilder(
              builder: (context, setState) {
                return AlertDialog(
                  title: const Text('Confirm Logout', style: TextStyle(fontWeight: FontWeight.bold)),
                  content: const Text('Are you sure you want to log out of your account?'),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  actions: [
                    TextButton(
                      onPressed: isLoggingOut ? null : () => Navigator.pop(context),
                      child: const Text('Cancel', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                    ),
                    ElevatedButton(
                      onPressed: isLoggingOut
                          ? null
                          : () async {
                              setState(() {
                                isLoggingOut = true;
                              });
                              if (context.mounted) {
                                Provider.of<CartProvider>(context, listen: false).clearCart();
                                Provider.of<AddressProvider>(context, listen: false).clear();
                                Provider.of<OrderProvider>(context, listen: false).clear();
                                Provider.of<LoyaltyProvider>(context, listen: false).clear();
                                Provider.of<CheckoutProvider>(context, listen: false).reset();
                                Provider.of<NotificationProvider>(context, listen: false).clear();
                              }
                              await authProvider.logout();
                              if (context.mounted) {
                                Navigator.of(context).pushAndRemoveUntil(
                                  MaterialPageRoute(builder: (context) => const LoginScreen()),
                                  (route) => false,
                                );
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.secondary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: isLoggingOut
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Text('Logout', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ),
                  ],
                );
              },
            );
          },
        );
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.secondary.withOpacity(0.5)),
        ),
        child: const Row(
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

  void _showGoGreenBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Colors.green.shade50, shape: BoxShape.circle),
                  child: const Icon(Icons.eco, color: Colors.green, size: 28),
                ),
                const SizedBox(width: 16),
                const Expanded(
                  child: Text('Our Go Green Initiative', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Text(
              'We are committed to reducing our carbon footprint. By opting for eco-friendly packaging and no-contact delivery, you help us save trees, reduce plastic waste, and promote a sustainable future.',
              style: TextStyle(fontSize: 14, color: Colors.black87, height: 1.5),
            ),
            const SizedBox(height: 16),
            const Text(
              'Thank you for joining us in making the world a greener place!',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.green, height: 1.5),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () => Navigator.pop(context),
                child: const Text('Got it!', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
