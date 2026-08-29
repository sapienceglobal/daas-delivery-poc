import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';

class SharedBottomNav extends StatelessWidget {
  final int currentIndex;

  const SharedBottomNav({Key? key, required this.currentIndex}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 20,
            offset: const Offset(0, -4),
          )
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(context, 0, Icons.home_rounded, Icons.home_outlined, 'Dashboard'),
              _buildNavItem(context, 1, Icons.receipt_long_rounded, Icons.receipt_long_outlined, 'Orders'),
              _buildNavItem(context, 2, Icons.kitchen_rounded, Icons.kitchen_outlined, 'KDS'),
              _buildNavItem(context, 3, Icons.calendar_month_rounded, Icons.calendar_month_outlined, 'Booking'),
              _buildNavItem(context, 4, Icons.more_horiz_rounded, Icons.more_horiz_rounded, 'More'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(BuildContext context, int index, IconData activeIcon, IconData inactiveIcon, String label) {
    final isActive = currentIndex == index;
    final color = isActive ? const Color(0xFFDC2626) : const Color(0xFF94A3B8);

    return Expanded(
      child: GestureDetector(
        onTap: () {
          if (index == currentIndex) return;
          switch (index) {
            case 0:
              context.go('/');
              break;
            case 1:
              context.go('/live-orders');
              break;
            case 2:
              context.go('/kds');
              break;
            case 3:
              context.go('/reservations');
              break;
            case 4:
              context.go('/more');
              break;
          }
        },
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(isActive ? activeIcon : inactiveIcon, color: color, size: 24),
            const SizedBox(height: 4),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                color: color,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.visible,
            ),
          ],
        ),
      ),
    );
  }
}
