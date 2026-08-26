import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import '../providers/order_provider.dart';
import '../models/order_model.dart';
import '../widgets/app_drawer.dart';
import '../widgets/shared_app_bar.dart';
import '../widgets/shared_bottom_nav.dart';

class KdsScreen extends StatefulWidget {
  const KdsScreen({Key? key}) : super(key: key);

  @override
  State<KdsScreen> createState() => _KdsScreenState();
}

class _KdsScreenState extends State<KdsScreen> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    // Refresh UI every minute to update the elapsed time
    _timer = Timer.periodic(const Duration(minutes: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<OrderProvider>();
    final allOrders = provider.orders;

    final newOrders = allOrders.where((o) => o.status == 'accepted').toList();
    final preparingOrders = allOrders.where((o) => o.status == 'preparing').toList();
    final readyOrders = allOrders.where((o) => o.status == 'ready').toList();

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: SharedAppBar(
          bottom: TabBar(
            indicatorColor: const Color(0xFF8B0000),
            labelColor: const Color(0xFF8B0000),
            unselectedLabelColor: Colors.grey.shade600,
            labelStyle: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13),
            tabs: [
              Tab(child: _buildTabLabel('NEW', newOrders.length, Colors.red)),
              Tab(child: _buildTabLabel('PREPARING', preparingOrders.length, Colors.orange)),
              Tab(child: _buildTabLabel('READY', readyOrders.length, Colors.green)),
            ],
          ),
        ),
        drawer: const AppDrawer(),
        body: TabBarView(
          children: [
            _buildOrderList(newOrders, 'new', provider),
            _buildOrderList(preparingOrders, 'preparing', provider),
            _buildOrderList(readyOrders, 'ready', provider),
          ],
        ),
        bottomNavigationBar: const SharedBottomNav(currentIndex: 2),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return '${weekdays[date.weekday - 1]}, ${months[date.month - 1]} ${date.day}';
  }

  Widget _buildTabLabel(String text, int count, Color dotColor) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text('$text ($count)'),
      ],
    );
  }

  Widget _buildOrderList(List<OrderModel> orders, String type, OrderProvider provider) {
    if (orders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              type == 'new' ? Icons.receipt_long : type == 'preparing' ? Icons.soup_kitchen : Icons.room_service,
              size: 64,
              color: Colors.grey.shade300,
            ),
            const SizedBox(height: 16),
            Text(
              type == 'new' ? 'No new orders' : type == 'preparing' ? 'No orders in prep' : 'No ready orders',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.grey.shade500),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: orders.length,
      itemBuilder: (ctx, i) => _buildTicketCard(orders[i], type, provider),
    );
  }

  Widget _buildTicketCard(OrderModel order, String type, OrderProvider provider) {
    final elapsedMinutes = DateTime.now().difference(order.createdAt).inMinutes;
    final isLate = elapsedMinutes > 15;

    Color headerBg, headerText, borderColor;
    
    if (type == 'new') {
      headerBg = Colors.red.shade50;
      headerText = Colors.red.shade700;
      borderColor = isLate ? Colors.red.shade400 : Colors.red.shade100;
    } else if (type == 'preparing') {
      headerBg = Colors.orange.shade50;
      headerText = Colors.orange.shade800;
      borderColor = isLate ? Colors.red.shade400 : Colors.orange.shade200;
    } else {
      headerBg = Colors.green.shade50;
      headerText = Colors.green.shade700;
      borderColor = Colors.green.shade200;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: borderColor,
          width: isLate && type != 'ready' ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: headerBg,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
              border: Border(bottom: BorderSide(color: borderColor)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Text('#${order.orderNumber ?? order.id.substring(order.id.length - 4)}', style: GoogleFonts.inter(fontWeight: FontWeight.w900, fontSize: 16, color: headerText)),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(4)),
                      child: Text(
                        order.orderType.toUpperCase(),
                        style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey.shade700),
                      ),
                    ),
                  ],
                ),
                Row(
                  children: [
                    Icon(Icons.access_time, size: 14, color: isLate && type != 'ready' ? Colors.red : Colors.grey.shade700),
                    const SizedBox(width: 4),
                    Text(
                      '${elapsedMinutes}m',
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        color: isLate && type != 'ready' ? Colors.red : Colors.grey.shade800,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Customer Info
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "${order.customerName} ${order.tableNumber != null ? '- Table ${order.tableNumber}' : ''}",
                  style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black87),
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: Divider(height: 1),
                ),
                // Items
                ...order.items.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${item.quantity}x', style: GoogleFonts.inter(fontWeight: FontWeight.w900, fontSize: 14, color: Colors.black)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.name,
                              style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14, color: Colors.black87),
                            ),
                            if (item.size != null && item.size!.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 2),
                                child: Text('Size: ${item.size}', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade700, fontWeight: FontWeight.bold)),
                              ),
                            if (item.addOns.isNotEmpty)
                              ...item.addOns.map((a) => Padding(
                                padding: const EdgeInsets.only(top: 2),
                                child: Text('+ $a', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade600, fontStyle: FontStyle.italic)),
                              )),
                            if (item.specialInstructions != null && item.specialInstructions!.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Text(
                                  'Note: ${item.specialInstructions}',
                                  style: GoogleFonts.inter(fontSize: 12, color: Colors.red.shade700, fontStyle: FontStyle.italic, fontWeight: FontWeight.w500),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                )).toList(),
              ],
            ),
          ),

          // Actions
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: const BorderRadius.vertical(bottom: Radius.circular(15)),
              border: Border(top: BorderSide(color: Colors.grey.shade200)),
            ),
            child: _buildAction(order, type, provider),
          ),
        ],
      ),
    );
  }

  Widget _buildAction(OrderModel order, String type, OrderProvider provider) {
    if (type == 'new') {
      return ElevatedButton.icon(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.black,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
        onPressed: () => _updateStatus(order, 'preparing', provider),
        icon: const Icon(Icons.local_fire_department, size: 18),
        label: Text('Start Prep', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14)),
      );
    } else if (type == 'preparing') {
      return ElevatedButton.icon(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.green.shade600,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
        onPressed: () => _updateStatus(order, 'ready', provider),
        icon: const Icon(Icons.check_circle, size: 18),
        label: Text('Mark Ready', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14)),
      );
    } else {
      return Container(
        height: 48,
        alignment: Alignment.center,
        child: Text('Waiting for Pickup...', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.grey.shade600, fontSize: 14)),
      );
    }
  }

  Future<void> _updateStatus(OrderModel order, String newStatus, OrderProvider provider) async {
    try {
      await provider.updateOrderStatus(order.id, newStatus);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Order moved to $newStatus')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error updating status: $e')));
      }
    }
  }
}
