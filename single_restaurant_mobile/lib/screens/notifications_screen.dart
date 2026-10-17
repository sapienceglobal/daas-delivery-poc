import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/notification_provider.dart';
import 'package:single_restaurant_mobile/screens/main_screen.dart';
import 'package:single_restaurant_mobile/screens/track_order_screen.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';
import 'package:single_restaurant_mobile/widgets/notifications/notifications_guest_view.dart';
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
    } else if (type == 'promotion' || type == 'marketing' || type == 'marketing_campaign') {
      final cleanUrl = url.toLowerCase().trim();
      if (cleanUrl == '/menu' || cleanUrl == 'menu') {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const MainScreen(initialIndex: 1)),
          (route) => false,
        );
      } else if (cleanUrl == '/orders' || cleanUrl == 'orders') {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const MainScreen(initialIndex: 3)),
          (route) => false,
        );
      } else if (cleanUrl.startsWith('/category/') || cleanUrl.startsWith('category/')) {
        final catId = cleanUrl.replaceAll('/category/', '').replaceAll('category/', '');
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => MainScreen(initialIndex: 1, initialCategory: catId)),
          (route) => false,
        );
      } else {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const MainScreen(initialIndex: 2)),
          (route) => false,
        );
      }
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
      return NotificationsGuestView(
        onBack: () {
          if (Navigator.canPop(context)) {
            Navigator.pop(context);
          }
        },
      );
    }

    const creamBg = Color(0xFFFAF7F2);
    const maroonColor = Color(0xFF6B111C);

    return Scaffold(
      backgroundColor: creamBg,
      appBar: AppBar(
        backgroundColor: creamBg,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: maroonColor),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Notifications',
          style: TextStyle(
            color: Color(0xFF1A1A1A),
            fontWeight: FontWeight.w900,
            fontSize: 21,
            letterSpacing: -0.3,
          ),
        ),
        centerTitle: false,
        actions: [
          Consumer<NotificationProvider>(
            builder: (context, np, _) {
              return Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (np.hasUnread)
                    Padding(
                      padding: const EdgeInsets.only(right: 4),
                      child: InkWell(
                        onTap: () {
                          np.markAsRead('all');
                          ToastUtils.showSuccess(context, 'All marked as read');
                        },
                        borderRadius: BorderRadius.circular(8),
                        child: const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.done_all_rounded,
                                size: 18,
                                color: maroonColor,
                              ),
                              SizedBox(width: 4),
                              Text(
                                'Mark Read',
                                style: TextStyle(
                                  color: maroonColor,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  Padding(
                    padding: const EdgeInsets.only(right: 12),
                    child: InkWell(
                      onTap: () {
                        np.fetchNotifications();
                      },
                      borderRadius: BorderRadius.circular(8),
                      child: const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.refresh,
                              size: 18,
                              color: maroonColor,
                            ),
                            SizedBox(width: 4),
                            Text(
                              'Refresh',
                              style: TextStyle(
                                color: maroonColor,
                                fontWeight: FontWeight.bold,
                                fontSize: 13.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
      body: Consumer<NotificationProvider>(
        builder: (context, notificationProvider, _) {
          if (notificationProvider.isLoading && notificationProvider.notifications.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: maroonColor));
          }

          var filteredList = notificationProvider.notifications;
          if (_selectedFilter == 'Unread') {
            filteredList = filteredList.where((n) => !n.isRead).toList();
          } else if (_selectedFilter == 'Orders') {
            filteredList = filteredList.where((n) {
              final t = n.type.toLowerCase();
              final b = n.body.toLowerCase();
              final title = n.title.toLowerCase();
              return t.contains('order') ||
                  b.contains('order') ||
                  title.contains('order') ||
                  b.contains('delivery') ||
                  b.contains('pickup');
            }).toList();
          }

          return ResponsiveCenter(
            maxWidth: 650,
            child: Column(
              children: [
                NotificationFilterBar(
                  selectedFilter: _selectedFilter,
                  onFilterSelected: (val) => setState(() => _selectedFilter = val),
                  allCount: notificationProvider.notifications.length,
                  unreadCount: notificationProvider.unreadCount,
                ),
                Expanded(
                  child: filteredList.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(22),
                                decoration: BoxDecoration(
                                  color: maroonColor.withValues(alpha: 0.06),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.notifications_off_outlined,
                                  size: 56,
                                  color: maroonColor,
                                ),
                              ),
                              const SizedBox(height: 18),
                              const Text(
                                'No notifications yet',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF1A1A1A),
                                ),
                              ),
                              const SizedBox(height: 6),
                              const Text(
                                'When new orders or updates arrive,\nthey will show up here.',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Color(0xFF7A726B),
                                  height: 1.4,
                                ),
                              ),
                            ],
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: () async {
                            await Provider.of<NotificationProvider>(context, listen: false).fetchNotifications();
                          },
                          color: maroonColor,
                          child: ListView.separated(
                            padding: const EdgeInsets.only(top: 4, bottom: 24),
                            itemCount: filteredList.length,
                            separatorBuilder: (context, index) => const SizedBox(height: 6),
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
                                    borderRadius: BorderRadius.circular(16),
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
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
