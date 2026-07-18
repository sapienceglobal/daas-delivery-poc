import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'dart:convert';
import '../services/api_service.dart';
import '../theme.dart';
import '../widgets/glass_container.dart';
import 'order_tracking_screen.dart';

class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  State<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen> {
  bool _isRefreshing = false;
  List<dynamic> _orders = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchOrders();
    });
  }

  Future<void> _fetchOrders() async {
    setState(() => _isRefreshing = true);
    try {
      final response = await ApiService.get('/api/orders/my-orders');
      final data = json.decode(response.body);
      if (data['success'] == true) {
        setState(() {
          _orders = data['data'] ?? data['orders'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Failed to load orders: $e');
    }
    setState(() => _isRefreshing = false);
  }

  Future<void> _refreshOrders() async {
    await _fetchOrders();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Order History'),
        backgroundColor: BrandColors.background,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: _refreshOrders,
        color: BrandColors.cyan,
        backgroundColor: BrandColors.card,
        child: _isRefreshing && _orders.isEmpty
            ? const Center(child: CircularProgressIndicator(color: BrandColors.cyan))
            : _orders.isEmpty
            ? _buildEmptyState()
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _orders.length,
                itemBuilder: (context, idx) {
                  final order = _orders[idx];
                  return _buildOrderCard(order);
                },
              ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.25),
        const Icon(Icons.receipt_long_outlined, size: 72, color: BrandColors.textMuted),
        const SizedBox(height: 16),
        const Text(
          'No Orders Found',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
        ),
        const SizedBox(height: 8),
        const Text(
          'Place orders from the marketplace to view history.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 13, color: BrandColors.textMuted),
        ),
      ],
    );
  }

  Widget _buildOrderCard(Map<String, dynamic> order) {
    final orderId = order['_id'] ?? order['id'] ?? '';
    final status = order['status'] ?? 'pending';
    final dateStr = order['createdAt'] != null
        ? DateFormat('MMM d, yyyy • hh:mm a').format(DateTime.parse(order['createdAt']).toLocal())
        : 'Unknown Date';
    
    final subtotal = (order['subtotal'] as num?)?.toDouble() ?? 0.0;
    final tax = (order['tax'] as num?)?.toDouble() ?? 0.0;
    final deliveryFee = (order['deliveryFee'] as num?)?.toDouble() ?? 0.0;
    final platformFee = (order['platformFee'] as num?)?.toDouble() ?? 0.0;
    final serviceFee = (order['serviceFee'] as num?)?.toDouble() ?? 0.0;
    final tip = (order['tip'] as num?)?.toDouble() ?? 0.0;
    final discount = (order['discount'] as num?)?.toDouble() ?? 0.0;
    final loyaltyDiscount = (order['loyaltyDiscount'] as num?)?.toDouble() ?? 0.0;
    final fallbackTotal = subtotal + tax + deliveryFee + platformFee + serviceFee + tip - discount - loyaltyDiscount;
    final grandTotal = (order['total'] as num?)?.toDouble() ?? (fallbackTotal < 0 ? 0.0 : fallbackTotal);

    final items = order['items'] as List? ?? [];
    final itemsSummary = items.map((i) => '${i['quantity']}x ${i['name']}').join(', ');

    final isActive = status != 'delivered' && status != 'cancelled' && status != 'failed';

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: GlassContainer(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      order['orderNumber'] ?? 'ORDER #${orderId.substring(orderId.length - 8).toUpperCase()}',
                      style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 13),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      dateStr,
                      style: const TextStyle(color: BrandColors.textMuted, fontSize: 11),
                    ),
                  ],
                ),
                _buildStatusBadge(status),
              ],
            ),
            const Divider(color: BrandColors.border, height: 24),
            Text(
              order['restaurantName'] ?? 'Restaurant',
              style: const TextStyle(fontWeight: FontWeight.bold, color: BrandColors.cyan, fontSize: 14),
            ),
            const SizedBox(height: 6),
            Text(
              itemsSummary,
              style: const TextStyle(color: BrandColors.textMuted, fontSize: 12),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const Divider(color: BrandColors.border, height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Total Paid', style: TextStyle(color: BrandColors.textMuted, fontSize: 10)),
                    const SizedBox(height: 2),
                    Text('\$${grandTotal.toStringAsFixed(2)}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                  ],
                ),
                ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) => OrderTrackingScreen(orderId: orderId),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isActive ? BrandColors.green : BrandColors.border,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  ),
                  child: Text(isActive ? 'TRACK LIVE' : 'DETAILS'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color = BrandColors.cyan;
    if (status == 'delivered') color = BrandColors.green;
    if (status == 'cancelled' || status == 'failed') color = BrandColors.red;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        border: Border.all(color: color.withOpacity(0.5)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 9),
      ),
    );
  }
}
