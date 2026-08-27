import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/notification_provider.dart';
import 'global_search_delegate.dart';

class SharedAppBar extends StatelessWidget implements PreferredSizeWidget {
  final PreferredSizeWidget? bottom;

  const SharedAppBar({Key? key, this.bottom}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      toolbarHeight: 70,
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.white,
      elevation: 0,
      titleSpacing: 0,
      bottom: bottom,
      leading: Builder(
        builder: (context) => IconButton(
          icon: const Icon(Icons.menu, color: Color(0xFF1F2937), size: 28),
          onPressed: () => Scaffold.of(context).openDrawer(),
        ),
      ),
      title: Image.asset(
        'assets/images/branded/lassi-lounge/Lassi-Lounge-logo.png',
        height: 85,
        fit: BoxFit.contain,
      ),
      centerTitle: false,
      actions: [
        // Global Search
        IconButton(
          icon: const Icon(Icons.search, color: Color(0xFF1F2937), size: 28),
          onPressed: () {
            showSearch(
              context: context,
              delegate: GlobalSearchDelegate(),
            );
          },
        ),
        // Notification bell with badge
        Consumer<NotificationProvider>(
          builder: (context, notificationProvider, child) {
            final unreadCount = notificationProvider.unreadCount;
            return Stack(
              alignment: Alignment.center,
              children: [
                IconButton(
                  icon: const Icon(Icons.notifications_none_rounded, color: Color(0xFF1F2937), size: 28),
                  onPressed: () {
                    context.push('/notifications');
                  },
                ),
                if (unreadCount > 0)
                  Positioned(
                    right: 8,
                    top: 8,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Color(0xFFDC2626),
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                      child: Text(
                        unreadCount > 99 ? '99+' : unreadCount.toString(),
                        style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  )
              ],
            );
          },
        ),
        const SizedBox(width: 12),
      ],
    );
  }

  @override
  Size get preferredSize {
    final bottomHeight = bottom?.preferredSize.height ?? 0;
    return Size.fromHeight(70 + bottomHeight);
  }
}
