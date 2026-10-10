import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/notification_provider.dart';
import 'package:single_restaurant_mobile/screens/main_screen.dart';
import 'package:single_restaurant_mobile/screens/track_order_screen.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';
import 'package:single_restaurant_mobile/widgets/guest_login_prompt.dart';
import 'package:single_restaurant_mobile/widgets/notifications/notification_bottom_banner.dart';
import 'package:single_restaurant_mobile/widgets/notifications/notification_filter_bar.dart';
import 'package:single_restaurant_mobile/widgets/notifications/notification_item_card.dart';

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

  void _handleNotificationTap(NotificationModel notification, NotificationProvider provider) {
    if (!notification.isRead) {
      provider.markAsRead(notification.id);
    }

    final type = notification.type;
    final url = notification.actionUrl ?? '';
    String orderId = '';
    if (url.isNotEmpty && url.contains('/orders/')) {
      final segments = url.split('/');
      if (segments.isNotEmpty) {
        orderId = segments.last;
      }
    }

    if ((type == 'order_update' || type == 'delivery_update' || type == 'order_cancelled') && orderId.isNotEmpty) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => TrackOrderScreen(orderId: orderId)),
      );
    } else if (type == 'promotion' || type == 'marketing') {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const MainScreen(initialIndex: 2)),
        (route) => false,
      );
    } else if (type == 'order_update' || type == 'delivery_update' || type == 'order_cancelled') {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const MainScreen(initialIndex: 3)),
        (route) => false,
      );
    }
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
        body: const ResponsiveCenter(
          maxWidth: 600,
          child: GuestLoginPrompt(
            icon: Icons.notifications_none_outlined,
            title: 'Login to see notifications',
            subtitle: 'Get real-time updates on your orders and exclusive offers.',
          ),
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
            builder: (context, notificationProvider, _) {
              if (notificationProvider.hasUnread) {
                return TextButton(
                  onPressed: () => notificationProvider.markAsRead('all'),
                  child: const Text('Mark all read', style: TextStyle(color: AppColors.secondary, fontSize: 12)),
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
      body: Consumer<NotificationProvider>(
        builder: (context, notificationProvider, _) {
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

          return ResponsiveCenter(
            maxWidth: 650,
            child: Column(
              children: [
                NotificationFilterBar(
                  selectedFilter: _selectedFilter,
                  onFilterSelected: (val) => setState(() => _selectedFilter = val),
                ),
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
                          padding: const EdgeInsets.only(top: 8, bottom: 16),
                          itemCount: filteredList.length,
                          itemBuilder: (context, index) {
                            final notification = filteredList[index];
                            return Dismissible(
                              key: Key(notification.id),
                              direction: DismissDirection.endToStart,
                              onDismissed: (_) {
                                notificationProvider.deleteNotification(notification.id);
                                ToastUtils.showSuccess(context, 'Notification deleted');
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
                              child: NotificationItemCard(
                                notification: notification,
                                onTap: () => _handleNotificationTap(notification, notificationProvider),
                              ),
                            );
                          },
                        ),
                ),
                const NotificationBottomBanner(),
              ],
            ),
          );
        },
      ),
    );
  }
}
