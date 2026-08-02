import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/notification_provider.dart';
import 'package:single_restaurant_mobile/widgets/guest_login_prompt.dart';
import 'package:single_restaurant_mobile/screens/notification_settings_screen.dart';
import 'package:intl/intl.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  String _selectedFilter = 'All';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      if (authProvider.user != null) {
        Provider.of<NotificationProvider>(context, listen: false).fetchNotifications();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    
    if (authProvider.user == null) {
      return Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: AppColors.secondary),
            onPressed: () => Navigator.pop(context),
          ),
          title: const Text(
            'Notifications',
            style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 18),
          ),
          centerTitle: true,
        ),
        body: const GuestLoginPrompt(
          icon: Icons.notifications_none_outlined,
          title: 'Login to see notifications',
          subtitle: 'Get real-time updates on your orders and exclusive offers.',
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.secondary),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Notifications',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        centerTitle: true,
        actions: [
          Consumer<NotificationProvider>(
            builder: (context, notificationProvider, child) {
              if (notificationProvider.hasUnread) {
                return TextButton(
                  onPressed: () {
                    notificationProvider.markAsRead('all');
                  },
                  child: const Text('Mark all read', style: TextStyle(color: AppColors.secondary, fontSize: 12)),
                );
              }
              return const SizedBox.shrink();
            }
          ),
        ],
      ),
      body: Consumer<NotificationProvider>(
        builder: (context, notificationProvider, child) {
          if (notificationProvider.isLoading && notificationProvider.notifications.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: AppColors.secondary));
          }

          var filteredList = notificationProvider.notifications;
          if (_selectedFilter != 'All') {
            filteredList = filteredList.where((n) {
              if (_selectedFilter == 'Orders' && (n.type == 'order_update' || n.type == 'delivery_update')) return true;
              if (_selectedFilter == 'Offers' && n.type == 'promotion') return true;
              if (_selectedFilter == 'System' && n.type == 'system') return true;
              return false;
            }).toList();
          }

          return Column(
            children: [
              _buildFilterChips(),
              Expanded(
                child: filteredList.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.notifications_off_outlined, size: 64, color: Colors.grey.shade300),
                            const SizedBox(height: 16),
                            Text('No notifications found', style: TextStyle(color: Colors.grey.shade600)),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.only(top: 8, bottom: 24),
                        itemCount: filteredList.length,
                        itemBuilder: (context, index) {
                          final notification = filteredList[index];
                          return Dismissible(
                            key: Key(notification.id),
                            direction: DismissDirection.endToStart,
                            onDismissed: (direction) {
                              notificationProvider.deleteNotification(notification.id);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Notification deleted'),
                                  behavior: SnackBarBehavior.floating,
                                  duration: Duration(seconds: 2),
                                ),
                              );
                            },
                            background: Container(
                              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.red,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              alignment: Alignment.centerRight,
                              padding: const EdgeInsets.only(right: 20),
                              child: const Icon(Icons.delete_outline, color: Colors.white, size: 28),
                            ),
                            child: GestureDetector(
                              onTap: () {
                                if (!notification.isRead) {
                                  notificationProvider.markAsRead(notification.id);
                                }
                              },
                              child: _buildDynamicNotificationItem(notification),
                            ),
                          );
                        },
                      ),
              ),
              _buildBottomBanner(),
            ],
          );
        },
      ),
    );
  }

  Widget _buildFilterChips() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          _buildChip('All', Icons.notifications_none_outlined),
          const SizedBox(width: 8),
          _buildChip('Orders', Icons.shopping_bag_outlined),
          const SizedBox(width: 8),
          _buildChip('Offers', Icons.local_offer_outlined),
          const SizedBox(width: 8),
          _buildChip('System', Icons.settings_outlined),
        ],
      ),
    );
  }

  Widget _buildChip(String label, IconData icon) {
    bool isSelected = _selectedFilter == label;
    return GestureDetector(
      onTap: () => setState(() => _selectedFilter = label),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFFFF5F5) : Colors.white,
          border: Border.all(color: isSelected ? AppColors.secondary : Colors.grey.shade300),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: isSelected ? AppColors.secondary : Colors.black87),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? AppColors.secondary : Colors.black87,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDynamicNotificationItem(NotificationModel notification) {
    IconData icon;
    Color iconColor;

    switch (notification.type) {
      case 'order_update':
      case 'delivery_update':
        icon = Icons.electric_moped_outlined;
        iconColor = Colors.red;
        break;
      case 'promotion':
      case 'marketing':
        icon = Icons.local_offer_outlined;
        iconColor = Colors.orange;
        break;
      case 'review':
        icon = Icons.star_outline;
        iconColor = Colors.amber;
        break;
      case 'loyalty':
        icon = Icons.card_giftcard;
        iconColor = Colors.purple;
        break;
      case 'system':
      default:
        icon = Icons.notifications_active_outlined;
        iconColor = Colors.blue;
        break;
    }

    String timeStr = _formatTime(notification.createdAt);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: !notification.isRead ? const Color(0xFFFFF7F7) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: !notification.isRead ? Border.all(color: Colors.red.shade100) : null,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Red dot for unread
          if (!notification.isRead) ...[
            Container(
              margin: const EdgeInsets.only(top: 18, right: 6),
              width: 6,
              height: 6,
              decoration: const BoxDecoration(
                color: AppColors.secondary,
                shape: BoxShape.circle,
              ),
            )
          ] else ...[
            const SizedBox(width: 12),
          ],
          
          // Icon Circle
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              shape: BoxShape.circle,
              border: Border.all(color: iconColor.withOpacity(0.2)),
            ),
            child: Icon(icon, color: iconColor, size: 24),
          ),
          const SizedBox(width: 12),
          
          // Content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  notification.title,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87),
                ),
                const SizedBox(height: 4),
                Text(
                  notification.body,
                  style: TextStyle(color: Colors.grey.shade700, fontSize: 12, height: 1.3),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          
          // Trailing
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                timeStr,
                style: TextStyle(color: Colors.grey.shade600, fontSize: 11),
              ),
              const SizedBox(height: 12),
              const Icon(Icons.chevron_right, color: Colors.grey, size: 16),
            ],
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final difference = now.difference(time);
    
    if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else {
      return DateFormat('MMM d').format(time);
    }
  }

  Widget _buildBottomBanner() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 32),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7F0), // Light beige
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.orange.shade100),
      ),
      child: Row(
        children: [
          Icon(Icons.room_service_outlined, size: 32, color: Colors.amber.shade700),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Never miss an update!',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87),
                ),
                const SizedBox(height: 4),
                Text(
                  'Enable all notifications to stay updated on your orders, offers and new launches.',
                  style: TextStyle(color: Colors.grey.shade800, fontSize: 11),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          ElevatedButton(
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (context) => const NotificationSettingsScreen()));
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF8B1D1D), // Dark red
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              minimumSize: const Size(0, 32),
            ),
            child: const Text('Enable All', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
          )
        ],
      ),
    );
  }
}
