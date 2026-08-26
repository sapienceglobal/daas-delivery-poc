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
    return Drawer(
      backgroundColor: Colors.white,
      child: Column(
        children: [
          UserAccountsDrawerHeader(
            decoration: const BoxDecoration(
              color: Color(0xFFDC2626), // App Red
            ),
            accountName: Text(
              'Lassi Lounge Admin',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            accountEmail: Text(
              'admin@lassilounge.com',
              style: GoogleFonts.inter(fontSize: 12),
            ),
            currentAccountPicture: const CircleAvatar(
              backgroundColor: Colors.white,
              backgroundImage: AssetImage('assets/images/branded/lassi-lounge/splash-icon.png'),
            ),
          ),
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                _buildDrawerItem(
                  icon: Icons.dashboard,
                  title: 'Dashboard',
                  onTap: () => context.pushReplacement('/'),
                ),
                _buildDrawerItem(
                  icon: Icons.receipt_long,
                  title: 'All Orders',
                  onTap: () {
                    context.pop(); // Close drawer
                    context.push('/all-orders');
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.restaurant_menu,
                  title: 'Menu Management',
                  onTap: () {
                    context.pop();
                    context.push('/menu-management');
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.local_offer,
                  title: 'Promotions',
                  onTap: () {
                    context.pop();
                    context.push('/promotions');
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.event_available,
                  title: 'Catering Enquiries',
                  onTap: () {
                    context.pop();
                    context.push('/catering');
                  },
                ),
                const Divider(),
                _buildDrawerItem(
                  icon: Icons.logout,
                  title: 'Logout',
                  color: Colors.red,
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
    required VoidCallback onTap,
    Color? color,
  }) {
    return ListTile(
      leading: Icon(icon, color: color ?? Colors.grey.shade700, size: 22),
      title: Text(
        title,
        style: GoogleFonts.inter(
          color: color ?? Colors.black87,
          fontWeight: FontWeight.w600,
          fontSize: 14,
        ),
      ),
      onTap: onTap,
    );
  }
}
