import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../constants/app_colors.dart';
import '../providers/auth_provider.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Current route to highlight active tab
    final String location = GoRouterState.of(context).uri.toString();

    return Drawer(
      width: 280, // Adjust this value to make the sidepanel wider or narrower
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent, // Prevents Material 3 slight coloring
      child: Column(
        children: [
          // 1. Header (Logo & Close button)
          Container(
            padding: const EdgeInsets.only(top: 38, left: 24, right: 16, bottom: 14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Logo
                Image.asset(
                  'assets/images/branded/lassi-lounge/Lassi-Lounge-logo.png',
                  height: 90, // Increased height to match screenshot
                  errorBuilder: (context, error, stackTrace) => Text(
                    'Lassi Lounge',
                    style: GoogleFonts.outfit(color: const Color(0xFFE63946), fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                ),
                // Close Button
                InkWell(
                  onTap: () => context.pop(),
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3F4F6),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.close, size: 16, color: Color(0xFF6B7280)),
                  ),
                ),
              ],
            ),
          ),

          // 2. Profile Section
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: const BoxDecoration(
                    color: Color(0xFFF97316), // Orange bg
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    'A',
                    style: GoogleFonts.inter(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Admin',
                        style: GoogleFonts.inter(color: const Color(0xFF111827), fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'admin@lassilounge.com',
                        style: GoogleFonts.inter(color: const Color(0xFF6B7280), fontSize: 13, fontWeight: FontWeight.w400),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: Divider(color: Color(0xFFF3F4F6), thickness: 1),
          ),

          // 3. Navigation List (Keeping existing functional tabs)
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              physics: const BouncingScrollPhysics(),
              children: [
                _buildDrawerItem(
                  icon: Icons.home_filled,
                  title: 'Dashboard',
                  iconColor: const Color(0xFFF97316), // Orange
                  isActive: location == '/',
                  onTap: () {
                    context.pop();
                    context.go('/');
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.room_service_outlined,
                  title: 'Live Orders', // Formerly All Orders
                  iconColor: const Color(0xFF22C55E), // Green
                  isActive: location == '/all-orders',
                  onTap: () {
                    context.pop();
                    context.push('/all-orders');
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.calendar_month_outlined,
                  title: 'Catering Enquiries',
                  iconColor: const Color(0xFFA855F7), // Purple
                  isActive: location == '/catering',
                  onTap: () {
                    context.pop();
                    context.push('/catering');
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.sell_outlined,
                  title: 'Menu Management',
                  iconColor: const Color(0xFF8B5CF6), // Purple/Indigo
                  isActive: location == '/menu-management',
                  onTap: () {
                    context.pop();
                    context.push('/menu-management');
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.discount_outlined,
                  title: 'Promotions', // Or Discounts & Offers
                  iconColor: const Color(0xFF3B82F6), // Blue
                  isActive: location == '/promotions',
                  onTap: () {
                    context.pop();
                    context.push('/promotions');
                  },
                ),
              ],
            ),
          ),

          // 4. Footer section
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 24),
            child: Divider(color: Color(0xFFF3F4F6), thickness: 1),
          ),
          
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            child: Column(
              children: [
                _buildDrawerItem(
                  icon: Icons.logout,
                  title: 'Logout',
                  iconColor: const Color(0xFFEF4444), // Red
                  isActive: false,
                  onTap: () async {
                    await context.read<AuthProvider>().logout();
                    if (context.mounted) {
                      context.go('/login');
                    }
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDrawerItem({
    required IconData icon,
    required String title,
    required Color iconColor,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          hoverColor: const Color(0xFFF9FAFB),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isActive ? const Color(0xFFFFF7ED) : Colors.transparent,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(
                  icon,
                  color: isActive ? iconColor : iconColor.withOpacity(0.8), // Keep icon colored even when inactive, as in image
                  size: 22,
                ),
                const SizedBox(width: 16),
                Text(
                  title,
                  style: GoogleFonts.inter(
                    color: isActive ? iconColor : const Color(0xFF374151),
                    fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
