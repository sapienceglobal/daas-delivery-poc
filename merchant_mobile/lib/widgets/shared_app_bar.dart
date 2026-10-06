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
        // Global Search Button
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: InkWell(
            onTap: () {
              showSearch(
                context: context,
                delegate: GlobalSearchDelegate(),
              );
            },
            borderRadius: BorderRadius.circular(20),
            child: Container(
              width: 38,
              height: 38,
              decoration: const BoxDecoration(
                color: Color(0xFFF8FAFC),
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: const Icon(Icons.search, color: Color(0xFF1E293B), size: 20),
            ),
          ),
        ),
        // Notification bell with badge
        Padding(
          padding: const EdgeInsets.only(left: 4, right: 12),
          child: Consumer<NotificationProvider>(
            builder: (context, notificationProvider, child) {
              final unreadCount = notificationProvider.unreadCount;
              return Stack(
                clipBehavior: Clip.none,
                alignment: Alignment.center,
                children: [
                  InkWell(
                    onTap: () => context.push('/notifications'),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      width: 38,
                      height: 38,
                      decoration: const BoxDecoration(
                        color: Color(0xFFF8FAFC),
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: const Icon(
                        Icons.notifications_none_rounded,
                        color: Color(0xFF1E293B),
                        size: 20,
                      ),
                    ),
                  ),
                  if (unreadCount > 0)
                    Positioned(
                      right: -2,
                      top: -2,
                      child: Container(
                        padding: const EdgeInsets.all(3),
                        decoration: const BoxDecoration(
                          color: Color(0xFFDC2626),
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                        child: Text(
                          unreadCount > 99 ? '99+' : unreadCount.toString(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
        ),
      ],
    );
  }

  @override
  Size get preferredSize {
    final bottomHeight = bottom?.preferredSize.height ?? 0;
    return Size.fromHeight(70 + bottomHeight);
  }
}
