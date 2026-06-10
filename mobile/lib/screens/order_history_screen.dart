import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/auth_provider.dart';
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

  @override
  void initState() {
    super.initState();
    // Fetch latest profile & orders
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AuthProvider>(context, listen: false).fetchProfile();
    });
  }

  Future<void> _refreshOrders() async {
    setState(() => _isRefreshing = true);
    await Provider.of<AuthProvider>(context, listen: false).fetchProfile();
    setState(() => _isRefreshing = false);
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final orders = auth.userOrders;

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
        child: orders.isEmpty
            ? _buildEmptyState()
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: orders.length,
                itemBuilder: (context, idx) {
                  final order = orders[idx];
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
    final status = order['deliveryStatus'] ?? 'pending';
    final dateStr = order['createdAt'] != null
        ? DateFormat('MMM d, yyyy • hh:mm a').format(DateTime.parse(order['createdAt']).toLocal())
        : 'Unknown Date';
    
    final subtotal = (order['subtotal'] as num?)?.toDouble() ?? 0.0;
    final tax = (order['tax'] as num?)?.toDouble() ?? 0.0;
    final deliveryFee = ((order['deliveryFee'] as num?)?.toDouble() ?? 0.0) / 100.0;
    final grandTotal = subtotal + tax + 2.0 + deliveryFee;

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
                      'ORDER #${orderId.substring(orderId.length - 8).toUpperCase()}',
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
