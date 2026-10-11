import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import 'package:go_router/go_router.dart';

import '../providers/notification_provider.dart';
import '../models/notification_model.dart';

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
      context.read<NotificationProvider>().fetchNotifications();
    });
  }

  Future<void> _handleRefresh() async {
    await context.read<NotificationProvider>().fetchNotifications();
  }

  List<NotificationModel> _getFilteredList(List<NotificationModel> all) {
    if (_selectedFilter == 'Unread') {
      return all.where((n) => !n.isRead).toList();
    } else if (_selectedFilter == 'Orders') {
      return all.where((n) {
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
    return all;
  }

  @override
  Widget build(BuildContext context) {
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
          onPressed: () {
            if (Navigator.canPop(context)) {
              Navigator.pop(context);
            } else {
              context.go('/dashboard');
            }
          },
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
          Padding(
            padding: const EdgeInsets.only(right: 14),
            child: InkWell(
              onTap: _handleRefresh,
              borderRadius: BorderRadius.circular(8),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.refresh,
                      size: 19,
                      color: maroonColor,
                    ),
                    SizedBox(width: 4),
                    Text(
                      'Refresh',
                      style: TextStyle(
                        color: maroonColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 14.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
      body: Consumer<NotificationProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.notifications.isEmpty) {
            return _buildShimmerLoading();
          }

          if (provider.error != null && provider.notifications.isEmpty) {
            return _buildErrorState(provider.error!);
          }

          final allList = provider.notifications;
          final unreadCount = provider.unreadCount;
          final filteredList = _getFilteredList(allList);

          return RefreshIndicator(
            onRefresh: _handleRefresh,
            color: maroonColor,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Filter Pills Row
                _buildFilterChips(allList.length, unreadCount),

                // Notification Cards List
                Expanded(
                  child: filteredList.isEmpty
                      ? _buildEmptyState()
                      : ListView.separated(
                          padding: const EdgeInsets.only(top: 4, bottom: 24),
                          itemCount: filteredList.length,
                          separatorBuilder: (context, index) => const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final notification = filteredList[index];
                            return _buildNotificationCard(notification, provider);
                          },
                        ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildFilterChips(int allCount, int unreadCount) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          // 1. All (count)
          _buildPill(
            label: 'All ($allCount)',
            filterKey: 'All',
            icon: Icons.notifications,
            isSelected: _selectedFilter == 'All',
          ),
          const SizedBox(width: 10),

          // 2. Unread (count)
          _buildPill(
            label: 'Unread ($unreadCount)',
            filterKey: 'Unread',
            icon: Icons.radio_button_unchecked,
            isSelected: _selectedFilter == 'Unread',
            showRedBadge: _selectedFilter != 'Unread' && unreadCount > 0,
          ),
          const SizedBox(width: 10),

          // 3. Orders
          _buildPill(
            label: 'Orders',
            filterKey: 'Orders',
            icon: Icons.receipt_long_outlined,
            isSelected: _selectedFilter == 'Orders',
          ),
        ],
      ),
    );
  }

  Widget _buildPill({
    required String label,
    required String filterKey,
    required IconData icon,
    required bool isSelected,
    bool showRedBadge = false,
  }) {
    const maroonColor = Color(0xFF6B111C);

    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedFilter = filterKey;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
        decoration: BoxDecoration(
          color: isSelected ? maroonColor : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isSelected ? maroonColor : const Color(0xFFEADBCE),
            width: 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isSelected ? 0.08 : 0.02),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? Colors.white : const Color(0xFF333333),
            ),
            const SizedBox(width: 7),
            Text(
              label,
              style: TextStyle(
                fontSize: 13.5,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                color: isSelected ? Colors.white : const Color(0xFF333333),
                letterSpacing: 0.1,
              ),
            ),
            if (showRedBadge) ...[
              const SizedBox(width: 6),
              Container(
                width: 7,
                height: 7,
                decoration: const BoxDecoration(
                  color: Color(0xFFDC2626),
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationCard(NotificationModel notification, NotificationProvider provider) {
    final bool isUnread = !notification.isRead;
    final bodyLower = notification.body.toLowerCase();
    final typeLower = notification.type.toLowerCase();
    final titleLower = notification.title.toLowerCase();

    // 1. Detect Order Type (Delivery vs Pickup vs Dine-in)
    String? orderType;
    if (bodyLower.contains('delivery') || typeLower.contains('delivery')) {
      orderType = 'delivery';
    } else if (bodyLower.contains('pickup') || typeLower.contains('pickup')) {
      orderType = 'pickup';
    } else if (bodyLower.contains('dine_in') || bodyLower.contains('dine-in') || bodyLower.contains('dine in')) {
      orderType = 'dine_in';
    } else if (typeLower.contains('order') || titleLower.contains('order') || bodyLower.contains('order')) {
      orderType = 'order';
    }

    // 2. Parse Total Amount ($24.24, etc.)
    String? totalAmount;
    final totalMatch = RegExp(r'Total\s*:\s*(\$[\d\.,]+|\d+[\d\.,]*)', caseSensitive: false)
        .firstMatch(notification.body);
    if (totalMatch != null) {
      final rawVal = totalMatch.group(1) ?? '';
      totalAmount = rawVal.startsWith(r'$') ? rawVal : '\$$rawVal';
    }

    // 3. Clean Subtitle Text (Strip out Total: if present)
    String cleanSubtitle = notification.body;
    if (notification.body.contains(RegExp(r'\s+Total\s*:', caseSensitive: false))) {
      cleanSubtitle = notification.body.split(RegExp(r'\s+Total\s*:', caseSensitive: false))[0].trim();
    }

    // 4. Clean Title Text with Bell Emoji 🛎️
    String cleanTitle = notification.title.trim();
    if (cleanTitle.isEmpty) {
      cleanTitle = 'New Order Request 🛎️';
    } else if (cleanTitle.toLowerCase().contains('new order request') &&
        !cleanTitle.contains('🛎️') &&
        !cleanTitle.contains('🔔')) {
      cleanTitle = '$cleanTitle 🛎️';
    }

    // 5. Semantic Colors and Icon Per Type
    Color leftAccentColor = Colors.transparent;
    Color avatarBgColor = const Color(0xFFF3ECE4);
    Widget avatarIcon = const Icon(Icons.notifications_none, color: Color(0xFF6B111C), size: 26);

    if (orderType == 'delivery') {
      leftAccentColor = const Color(0xFFC02626);
      avatarBgColor = const Color(0xFFFFEAEA);
      avatarIcon = const Icon(Icons.delivery_dining, color: Color(0xFF8B1527), size: 28);
    } else if (orderType == 'pickup') {
      leftAccentColor = const Color(0xFF16A34A);
      avatarBgColor = const Color(0xFFE5F7EC);
      avatarIcon = const Icon(Icons.shopping_bag, color: Color(0xFF0F8B44), size: 25);
    } else if (typeLower.contains('cancel')) {
      leftAccentColor = const Color(0xFFDC2626);
      avatarBgColor = const Color(0xFFFEE2E2);
      avatarIcon = const Icon(Icons.cancel_outlined, color: Color(0xFFDC2626), size: 26);
    } else if (typeLower.contains('reservation')) {
      leftAccentColor = const Color(0xFF7C3AED);
      avatarBgColor = const Color(0xFFF3E8FF);
      avatarIcon = const Icon(Icons.table_restaurant_outlined, color: Color(0xFF7C3AED), size: 26);
    } else if (typeLower.contains('catering')) {
      leftAccentColor = const Color(0xFFD97706);
      avatarBgColor = const Color(0xFFFEF3C7);
      avatarIcon = const Icon(Icons.room_service_outlined, color: Color(0xFFD97706), size: 26);
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            if (isUnread) {
              provider.markAsRead(notification.id);
            }

            final type = notification.type.toLowerCase();
            final url = notification.actionUrl ?? '';
            final segments = url.split('/');
            final id = segments.isNotEmpty ? segments.last : '';

            if (type.contains('order')) {
              if (id.isNotEmpty && id.length == 24) {
                context.push('/order-details/$id');
              } else {
                context.push('/live-orders');
              }
            } else if (type.contains('reservation')) {
              context.push('/reservations');
            } else if (type.contains('catering')) {
              context.push('/catering');
            } else if (url.isNotEmpty) {
              try {
                context.push(url);
              } catch (e) {
                debugPrint('Route not found: $url');
              }
            }
          },
          borderRadius: BorderRadius.circular(18),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: const Color(0xFFF1EBE4),
                width: 1.0,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.035),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: Stack(
                children: [
                  // Left Accent Vertical Bar (Red for Delivery, Green for Pickup)
                  if (leftAccentColor != Colors.transparent)
                    Positioned(
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 4.5,
                      child: Container(color: leftAccentColor),
                    ),

                  // Main Card Content
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 14, 16),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Left Avatar Circle
                        Container(
                          width: 52,
                          height: 52,
                          decoration: BoxDecoration(
                            color: avatarBgColor,
                            shape: BoxShape.circle,
                          ),
                          child: Center(child: avatarIcon),
                        ),
                        const SizedBox(width: 14),

                        // Notification Details
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // 1. Title Row with Unread Red Dot
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Expanded(
                                    child: Text(
                                      cleanTitle,
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w900,
                                        color: Color(0xFF1A1A1A),
                                        letterSpacing: -0.3,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  if (isUnread) ...[
                                    const SizedBox(width: 8),
                                    Container(
                                      width: 7.5,
                                      height: 7.5,
                                      decoration: const BoxDecoration(
                                        color: Color(0xFFDC2626),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 2),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 3),

                              // 2. Subtitle with Right Chevron '>'
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Expanded(
                                    child: Text(
                                      cleanSubtitle,
                                      style: const TextStyle(
                                        fontSize: 13.5,
                                        fontWeight: FontWeight.w500,
                                        color: Color(0xFF5A524C),
                                        height: 1.35,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  const Icon(
                                    Icons.chevron_right,
                                    size: 20,
                                    color: Color(0xFF6B111C),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 9),

                              // 3. Metadata Row: Badge Pill + Divider + Total
                              if (orderType != null) ...[
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    if (orderType == 'delivery')
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF6B111C),
                                          borderRadius: BorderRadius.circular(14),
                                        ),
                                        child: const Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(Icons.delivery_dining, size: 14, color: Colors.white),
                                            SizedBox(width: 5),
                                            Text(
                                              'Delivery',
                                              style: TextStyle(
                                                color: Colors.white,
                                                fontSize: 12,
                                                fontWeight: FontWeight.bold,
                                                letterSpacing: 0.1,
                                              ),
                                            ),
                                          ],
                                        ),
                                      )
                                    else if (orderType == 'pickup')
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF0F8B44),
                                          borderRadius: BorderRadius.circular(14),
                                        ),
                                        child: const Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(Icons.shopping_bag, size: 13, color: Colors.white),
                                            SizedBox(width: 5),
                                            Text(
                                              'Pickup',
                                              style: TextStyle(
                                                color: Colors.white,
                                                fontSize: 12,
                                                fontWeight: FontWeight.bold,
                                                letterSpacing: 0.1,
                                              ),
                                            ),
                                          ],
                                        ),
                                      )
                                    else
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF4A4A4A),
                                          borderRadius: BorderRadius.circular(14),
                                        ),
                                        child: Text(
                                          orderType.toUpperCase(),
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),

                                    if (totalAmount != null) ...[
                                      Container(
                                        height: 14,
                                        width: 1,
                                        color: const Color(0xFFDDD4C8),
                                        margin: const EdgeInsets.symmetric(horizontal: 10),
                                      ),
                                      RichText(
                                        text: TextSpan(
                                          style: const TextStyle(
                                            fontSize: 13.5,
                                            color: Color(0xFF5A524C),
                                          ),
                                          children: [
                                            const TextSpan(text: 'Total: '),
                                            TextSpan(
                                              text: totalAmount,
                                              style: const TextStyle(
                                                fontWeight: FontWeight.w900,
                                                color: Color(0xFF6B111C),
                                                fontSize: 15,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                const SizedBox(height: 7),
                              ],

                              // 4. Time Ago Row with Clock Icon
                              Row(
                                children: [
                                  const Icon(
                                    Icons.access_time,
                                    size: 13.5,
                                    color: Color(0xFF7A726B),
                                  ),
                                  const SizedBox(width: 5),
                                  Text(
                                    _formatTimeAgo(notification.createdAt),
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                      color: Color(0xFF7A726B),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildShimmerLoading() {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: 6,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        return Shimmer.fromColors(
          baseColor: Colors.grey[200]!,
          highlightColor: Colors.grey[50]!,
          child: Container(
            height: 120,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: const Color(0xFF6B111C).withValues(alpha: 0.06),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.notifications_off_outlined,
              size: 56,
              color: Color(0xFF6B111C),
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
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 48, color: Color(0xFFDC2626)),
          const SizedBox(height: 16),
          Text(error, style: const TextStyle(color: Color(0xFF7A726B))),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _handleRefresh,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF6B111C),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Try Again'),
          )
        ],
      ),
    );
  }

  String _formatTimeAgo(DateTime time) {
    final diff = DateTime.now().difference(time);
    if (diff.inSeconds < 60) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${diff.inDays ~/ 7}w ago';
  }
}
