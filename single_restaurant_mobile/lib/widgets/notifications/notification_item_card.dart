import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/providers/notification_provider.dart';

class NotificationItemCard extends StatelessWidget {
  final NotificationModel notification;
  final VoidCallback onTap;

  const NotificationItemCard({
    super.key,
    required this.notification,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
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
    } else if (typeLower.contains('promotion') || typeLower.contains('marketing')) {
      leftAccentColor = const Color(0xFFD97706);
      avatarBgColor = const Color(0xFFFEF3C7);
      avatarIcon = const Icon(Icons.local_offer_outlined, color: Color(0xFFD97706), size: 26);
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
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

  String _formatTimeAgo(DateTime time) {
    final diff = DateTime.now().difference(time);
    if (diff.inSeconds < 60) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${diff.inDays ~/ 7}w ago';
  }
}
