import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../services/socket_service.dart';
import '../../theme.dart';
import '../../widgets/glass_container.dart';

class MerchantKdsScreen extends StatefulWidget {
  const MerchantKdsScreen({super.key});

  @override
  State<MerchantKdsScreen> createState() => _MerchantKdsScreenState();
}

class _MerchantKdsScreenState extends State<MerchantKdsScreen> {
  List<dynamic> _newOrders = [];
  List<dynamic> _preparingOrders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final restaurantId = auth.user?['restaurantId']?.toString();
    _fetchOrders();
    
    if (restaurantId != null) {
      SocketService.connect(
        listenerId: 'kds_screen',
        restaurantId: restaurantId,
        onOrderUpdated: (data) {
          if (mounted) _fetchOrders();
        },
        onNewOrder: (data) {
          if (mounted) _fetchOrders();
        }
      );
    }
  }

  @override
  void dispose() {
    SocketService.disconnect('kds_screen');
    super.dispose();
  }

  Future<void> _fetchOrders() async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiService.get('/api/orders/merchant/all');
      final data = json.decode(response.body);
      final allOrders = data['data'] as List<dynamic>? ?? [];
      
      setState(() {
        _newOrders = allOrders.where((o) => o['status'] == 'pending' || o['status'] == 'accepted').toList();
        _preparingOrders = allOrders.where((o) => o['status'] == 'preparing').toList();
      });
    } catch (e) {
      debugPrint('Error fetching KDS orders: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _updateStatus(String orderId, String nextStatus) async {
    try {
      final response = await ApiService.put('/api/orders/$orderId/status', {'status': nextStatus});
      final resData = json.decode(response.body);
      if (resData['success'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Order marked as ${nextStatus.toUpperCase()}'), backgroundColor: BrandColors.green),
          );
        }
        await _fetchOrders();
      } else {
        throw Exception(resData['message'] ?? 'Failed to update order status');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: BrandColors.red),
        );
      }
    }
  }

  Widget _buildOrderCard(Map<String, dynamic> order, bool isNew) {
    final tableNumber = order['tableNumber'];
    final isDineIn = order['orderType'] == 'dine_in';
    
    return GlassContainer(
      margin: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '#${order['orderNumber'] ?? order['_id'].toString().substring(18)}',
                style: const TextStyle(fontWeight: FontWeight.bold, color: BrandColors.textMain, fontSize: 18),
              ),
              if (isDineIn && tableNumber != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: BrandColors.cyan.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: BrandColors.cyan.withOpacity(0.3)),
                  ),
                  child: Text('TABLE $tableNumber', style: const TextStyle(color: BrandColors.cyan, fontWeight: FontWeight.bold, fontSize: 12)),
                )
              else
                Text(
                  order['orderType'].toString().toUpperCase(),
                  style: const TextStyle(color: BrandColors.textMuted, fontWeight: FontWeight.bold, fontSize: 12),
                ),
            ],
          ),
          const Divider(color: BrandColors.border),
          // Items List
          ...(order['items'] as List).map((item) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${item['quantity']}x ', style: const TextStyle(fontWeight: FontWeight.bold, color: BrandColors.cyan)),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item['name'] ?? item['menuItemName'] ?? '', style: const TextStyle(color: BrandColors.textMain, fontWeight: FontWeight.bold)),
                      if (item['specialInstructions'] != null && item['specialInstructions'].toString().isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Text(
                            'Note: ${item['specialInstructions']}',
                            style: const TextStyle(color: Colors.orange, fontSize: 11, fontStyle: FontStyle.italic),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          )),
          // Customer Details block
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(8),
            margin: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: BrandColors.border, width: 0.5),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.person_outline, size: 13, color: BrandColors.cyan),
                    const SizedBox(width: 4),
                    Text(
                      '${order['customerName'] ?? 'Walk-in'}',
                      style: const TextStyle(color: BrandColors.textMain, fontWeight: FontWeight.bold, fontSize: 11),
                    ),
                    if (order['customerPhone'] != null && order['customerPhone'].toString().isNotEmpty) ...[
                      const SizedBox(width: 6),
                      Text(
                        '📞 ${order['customerPhone']}',
                        style: const TextStyle(color: BrandColors.textMuted, fontSize: 10),
                      ),
                    ]
                  ],
                ),
                if (order['orderType'] == 'delivery' && order['address'] != null) ...[
                  const SizedBox(height: 4),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.map_outlined, size: 13, color: BrandColors.green),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '${order['address']}',
                          style: const TextStyle(color: BrandColors.textMuted, fontSize: 10),
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
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: isNew ? BrandColors.cyan : BrandColors.green,
              ),
              onPressed: () => _updateStatus(order['_id'], isNew ? 'preparing' : 'ready'),
              child: Text(
                isNew ? 'Start Preparing' : 'Mark Ready',
                style: const TextStyle(color: BrandColors.background, fontWeight: FontWeight.bold, fontSize: 15),
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildColumn(String title, List<dynamic> orders, bool isNew) {
    return Expanded(
      child: Container(
        color: isNew ? Colors.black12 : Colors.black26,
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(title, style: const TextStyle(color: BrandColors.textMain, fontSize: 18, fontWeight: FontWeight.w900)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: isNew ? BrandColors.red : BrandColors.cyan,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '${orders.length}',
                    style: const TextStyle(color: BrandColors.background, fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                )
              ],
            ),
            const SizedBox(height: 12),
            Expanded(
              child: orders.isEmpty
                  ? Center(
                      child: Text(
                        isNew ? 'No new orders' : 'No orders in prep',
                        style: const TextStyle(color: BrandColors.textMuted),
                      ),
                    )
                  : ListView.builder(
                      itemCount: orders.length,
                      itemBuilder: (context, index) {
                        return _buildOrderCard(orders[index], isNew);
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: BrandColors.background,
      appBar: AppBar(
        title: const Text('Kitchen Display'),
        backgroundColor: BrandColors.card,
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchOrders),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: BrandColors.cyan))
          : Row(
              children: [
                _buildColumn('New Orders', _newOrders, true),
                const VerticalDivider(width: 1, color: BrandColors.border),
                _buildColumn('Preparing', _preparingOrders, false),
              ],
            ),
    );
  }
}
