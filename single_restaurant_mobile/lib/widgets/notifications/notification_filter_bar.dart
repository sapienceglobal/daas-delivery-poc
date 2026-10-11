import 'package:flutter/material.dart';

class NotificationFilterBar extends StatelessWidget {
  final String selectedFilter;
  final ValueChanged<String> onFilterSelected;
  final int allCount;
  final int unreadCount;

  const NotificationFilterBar({
    super.key,
    required this.selectedFilter,
    required this.onFilterSelected,
    this.allCount = 0,
    this.unreadCount = 0,
  });

  @override
  Widget build(BuildContext context) {
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
            isSelected: selectedFilter == 'All',
          ),
          const SizedBox(width: 10),

          // 2. Unread (count)
          _buildPill(
            label: 'Unread ($unreadCount)',
            filterKey: 'Unread',
            icon: Icons.radio_button_unchecked,
            isSelected: selectedFilter == 'Unread',
            showRedBadge: selectedFilter != 'Unread' && unreadCount > 0,
          ),
          const SizedBox(width: 10),

          // 3. Orders
          _buildPill(
            label: 'Orders',
            filterKey: 'Orders',
            icon: Icons.receipt_long_outlined,
            isSelected: selectedFilter == 'Orders',
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
      onTap: () => onFilterSelected(filterKey),
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
}
