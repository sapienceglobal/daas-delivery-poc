import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../services/socket_service.dart';
import '../../theme.dart';
import '../../widgets/glass_container.dart';

class MerchantOrdersScreen extends StatefulWidget {
  const MerchantOrdersScreen({super.key});

  @override
  State<MerchantOrdersScreen> createState() => _MerchantOrdersScreenState();
}

class _MerchantOrdersScreenState extends State<MerchantOrdersScreen> {
  List<dynamic> _orders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final restaurantId = auth.user?['restaurantId']?.toString();
    _fetchOrders();
    SocketService.connect(
      listenerId: 'merchant_orders_screen',
      restaurantId: restaurantId,
      onOrderUpdated: (data) {
        if (mounted) _fetchOrders();
      },
      onNewOrder: (data) {
        if (mounted) _fetchOrders();
      }
    );
  }

  @override
  void dispose() {
    SocketService.disconnect('merchant_orders_screen');
    super.dispose();
  }

  Future<void> _fetchOrders() async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiService.get('/api/orders/merchant/all');
      final data = json.decode(response.body);
      setState(() {
        _orders = data['data'] ?? [];
      });
    } catch (e) {
      debugPrint('Error fetching orders: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _updateOrderStatus(String orderId, String action) async {
    try {
      await ApiService.put('/api/orders/$orderId/$action', {});
      await _fetchOrders();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Order $action successful'), backgroundColor: BrandColors.green),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: BrandColors.red),
      );
    }
  }

  Widget _buildOrderActionButtons(Map<String, dynamic> order) {
    final status = order['status'];
    final orderId = order['_id'];

    if (status == 'pending') {
      return Row(
        children: [
          Expanded(child: ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: BrandColors.green),
            onPressed: () => _updateOrderStatus(orderId, 'accept'),
            child: const Text('Accept', style: TextStyle(color: BrandColors.background)),
          )),
          const SizedBox(width: 8),
          Expanded(child: ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: BrandColors.red),
            onPressed: () => _updateOrderStatus(orderId, 'reject'),
            child: const Text('Reject', style: TextStyle(color: BrandColors.background)),
          )),
        ],
      );
    }

    if (status == 'accepted') {
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: BrandColors.cyan),
          onPressed: () => _updateOrderStatus(orderId, 'prep'), // Simulate prep advance
          child: const Text('Mark as Preparing', style: TextStyle(color: BrandColors.background)),
        ),
      );
    }

    if (status == 'preparing') {
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: BrandColors.cyan),
          onPressed: () => _updateOrderStatus(orderId, 'status'), // Simulate ready
          child: const Text('Mark as Ready', style: TextStyle(color: BrandColors.background)),
        ),
      );
    }

    if (status == 'ready') {
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: BrandColors.blue),
          onPressed: () => _updateOrderStatus(orderId, 'status'),
          child: const Text('Mark as Picked Up', style: TextStyle(color: Colors.white)),
        ),
      );
    }

    return Text('Status: ${status.toString().toUpperCase()}', style: const TextStyle(color: BrandColors.cyan, fontWeight: FontWeight.bold));
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Center(child: CircularProgressIndicator(color: BrandColors.cyan));
    
    return RefreshIndicator(
      color: BrandColors.cyan,
      onRefresh: _fetchOrders,
      child: _orders.isEmpty
          ? ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: const [
                SizedBox(height: 100),
                Center(child: Text('No orders yet', style: TextStyle(color: BrandColors.textMuted))),
              ],
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _orders.length,
              itemBuilder: (context, index) {
                final order = _orders[index];
                return GlassContainer(
                  margin: const EdgeInsets.only(bottom: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Order #${order['orderNumber']}', style: const TextStyle(fontWeight: FontWeight.bold, color: BrandColors.textMain, fontSize: 18)),
                          Text('\$${(order['total'] ?? 0).toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, color: BrandColors.green, fontSize: 18)),
                        ],
                      ),
                      const Divider(color: BrandColors.border),
                      ...(order['items'] as List).map((item) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('${item['quantity']}x ${item['name'] ?? item['menuItemName'] ?? 'Item'}', style: const TextStyle(color: BrandColors.textMain)),
                            Text('\$${item['price'].toStringAsFixed(2)}', style: const TextStyle(color: BrandColors.textMuted)),
                          ],
                        ),
                      )),
                      // Customer Details block
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(10),
                        margin: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: BrandColors.border, width: 0.5),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.person_outline, size: 14, color: BrandColors.cyan),
                                const SizedBox(width: 6),
                                Text(
                                  '${order['customerName'] ?? 'Walk-in'}',
                                  style: const TextStyle(color: BrandColors.textMain, fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                                if (order['customerPhone'] != null && order['customerPhone'].toString().isNotEmpty) ...[
                                  const SizedBox(width: 8),
                                  Text(
                                    '📞 ${order['customerPhone']}',
                                    style: const TextStyle(color: BrandColors.textMuted, fontSize: 12),
                                  ),
                                ]
                              ],
                            ),
                            if (order['orderType'] == 'delivery' && order['address'] != null) ...[
                              const SizedBox(height: 6),
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(Icons.map_outlined, size: 14, color: BrandColors.green),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      '${order['address']}',
                                      style: const TextStyle(color: BrandColors.textMuted, fontSize: 12),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      _buildOrderActionButtons(order),
                    ],
                  ),
                );
              },
            ),
    );
  }
}
