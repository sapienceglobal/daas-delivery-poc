import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/order_provider.dart';
import '../models/order_model.dart';

class SearchScreenItem {
  final String title;
  final String route;
  final IconData icon;
  final String description;

  SearchScreenItem({required this.title, required this.route, required this.icon, required this.description});
}

class GlobalSearchDelegate extends SearchDelegate<String?> {
  final List<SearchScreenItem> _screens = [
    SearchScreenItem(title: 'Dashboard', route: '/', icon: Icons.dashboard, description: 'Overview and analytics'),
    SearchScreenItem(title: 'Live Orders', route: '/live-orders', icon: Icons.receipt_long, description: 'Manage active orders'),
    SearchScreenItem(title: 'All Orders', route: '/all-orders', icon: Icons.history, description: 'View order history'),
    SearchScreenItem(title: 'Menu Management', route: '/menu-management', icon: Icons.restaurant_menu, description: 'Edit categories and items'),
    SearchScreenItem(title: 'Promotions', route: '/promotions', icon: Icons.local_offer, description: 'Manage discounts and offers'),
    SearchScreenItem(title: 'KDS', route: '/kds', icon: Icons.kitchen, description: 'Kitchen Display System'),
    SearchScreenItem(title: 'Reservations', route: '/reservations', icon: Icons.event_seat, description: 'Table bookings'),
    SearchScreenItem(title: 'Catering', route: '/catering', icon: Icons.room_service, description: 'Large event orders'),
    SearchScreenItem(title: 'Settings', route: '/more', icon: Icons.settings, description: 'App preferences and configurations'),
  ];

  @override
  String get searchFieldLabel => 'Search screens, orders, customers...';

  @override
  TextStyle get searchFieldStyle => GoogleFonts.inter(fontSize: 16, color: const Color(0xFF1F2937));

  @override
  ThemeData appBarTheme(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    return theme.copyWith(
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: IconThemeData(color: Color(0xFF1F2937)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: InputBorder.none,
        hintStyle: GoogleFonts.inter(color: Colors.grey.shade500),
      ),
      textSelectionTheme: const TextSelectionThemeData(
        cursorColor: Color(0xFF8B0000),
      ),
    );
  }

  @override
  List<Widget>? buildActions(BuildContext context) {
    return [
      if (query.isNotEmpty)
        IconButton(
          icon: const Icon(Icons.clear, color: Colors.grey),
          onPressed: () {
            query = '';
            showSuggestions(context);
          },
        ),
    ];
  }

  @override
  Widget? buildLeading(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.arrow_back),
      onPressed: () => close(context, null),
    );
  }

  @override
  Widget buildResults(BuildContext context) {
    return _buildBody(context);
  }

  @override
  Widget buildSuggestions(BuildContext context) {
    return _buildBody(context);
  }

  Widget _buildBody(BuildContext context) {
    final queryLower = query.toLowerCase().trim();

    // 1. Filter Screens
    final matchedScreens = queryLower.isEmpty
        ? _screens.take(4).toList() // default suggestions
        : _screens.where((s) => s.title.toLowerCase().contains(queryLower) || s.description.toLowerCase().contains(queryLower)).toList();

    // 2. Filter Orders
    final orderProvider = context.watch<OrderProvider>();
    final allOrders = orderProvider.orders;
    
    final matchedOrders = queryLower.isEmpty
        ? <OrderModel>[]
        : allOrders.where((o) {
            return o.orderNumber.toLowerCase().contains(queryLower) ||
                o.customerName.toLowerCase().contains(queryLower) ||
                (o.customerPhone != null && o.customerPhone!.contains(queryLower));
          }).toList();

    if (queryLower.isNotEmpty && matchedScreens.isEmpty && matchedOrders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off, size: 64, color: Colors.grey.shade300),
            const SizedBox(height: 16),
            Text('No results found for "$query"', style: GoogleFonts.inter(fontSize: 16, color: Colors.grey.shade600)),
          ],
        ),
      );
    }

    return Container(
      color: Colors.white,
      child: ListView(
        padding: const EdgeInsets.symmetric(vertical: 12),
        children: [
          if (matchedScreens.isNotEmpty) ...[
            _buildSectionHeader('Screens & Features'),
            ...matchedScreens.map((screen) => _buildScreenTile(context, screen)),
          ],
          if (matchedOrders.isNotEmpty) ...[
            if (matchedScreens.isNotEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: Divider(height: 32),
              ),
            _buildSectionHeader('Orders & Customers'),
            ...matchedOrders.map((order) => _buildOrderTile(context, order)),
          ],
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Text(
        title.toUpperCase(),
        style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade500, letterSpacing: 1.2),
      ),
    );
  }

  Widget _buildScreenTile(BuildContext context, SearchScreenItem screen) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: const Color(0xFF8B0000).withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(screen.icon, color: const Color(0xFF8B0000), size: 20),
      ),
      title: Text(screen.title, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15, color: const Color(0xFF1F2937))),
      subtitle: Text(screen.description, style: GoogleFonts.inter(color: Colors.grey.shade600, fontSize: 13)),
      onTap: () {
        close(context, screen.route);
        context.push(screen.route);
      },
    );
  }

  Widget _buildOrderTile(BuildContext context, OrderModel order) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.blue.shade50,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(Icons.receipt_long, color: Colors.blue.shade700, size: 20),
      ),
      title: Text(
        '#${order.orderNumber} - ${order.customerName}',
        style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15, color: const Color(0xFF1F2937)),
      ),
      subtitle: Text(
        '${order.status.toUpperCase()} • \$${order.total.toStringAsFixed(2)}',
        style: GoogleFonts.inter(color: Colors.grey.shade600, fontSize: 12, fontWeight: FontWeight.w500),
      ),
      trailing: const Icon(Icons.chevron_right, color: Colors.grey),
      onTap: () {
        close(context, '/order-details/${order.id}');
        context.push('/order-details/${order.id}');
      },
    );
  }
}
