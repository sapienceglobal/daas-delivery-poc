import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../theme.dart';
import '../widgets/glass_container.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  int _activeTab = 0; // 0: Analytics, 1: Orders & Refunds
  bool _isLoading = true;
  List<dynamic> _orders = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchAdminData();
  }

  Future<void> _fetchAdminData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await ApiService.get('/api/orders');
      final data = json.decode(response.body);
      if (data['success'] == true) {
        setState(() {
          _orders = data['orders'] ?? [];
        });
      } else {
        throw Exception(data['message'] ?? 'Failed to load platform data');
      }
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _refundOrder(String orderId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: BrandColors.card,
        title: const Text('Refund & Cancel Order?', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: const Text('This will cancel the order, reverse payouts, and update order status to Refunded.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('CANCEL', style: TextStyle(color: BrandColors.textMuted))),
          ElevatedButton(onPressed: () => Navigator.of(context).pop(true), style: ElevatedButton.styleFrom(backgroundColor: BrandColors.red), child: const Text('ISSUE REFUND')),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final response = await ApiService.post('/api/orders/$orderId/refund', {});
      final data = json.decode(response.body);
      if (data['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Refund issued and order cancelled successfully!')),
        );
        await _fetchAdminData();
      } else {
        throw Exception(data['message'] ?? 'Refund failed');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Refund Error: $e')),
      );
      setState(() {
        _isLoading = false;
      });
    }
  }

  // Analytics Helpers
  double _getGrossRevenue() {
    return _orders
        .where((o) => o['deliveryStatus'] != 'cancelled' && o['deliveryStatus'] != 'refunded')
        .fold(0.0, (sum, o) => sum + ((o['subtotal'] as num?)?.toDouble() ?? 0.0));
  }

  double _getPlatformEarnings() {
    // Platform fee ($2) + 20% markups (mock markup or commission)
    final completed = _orders.where((o) => o['deliveryStatus'] != 'cancelled' && o['deliveryStatus'] != 'refunded');
    double fees = completed.length * 2.0;
    double markup = completed.fold(0.0, (sum, o) => sum + (((o['deliveryFee'] as num?)?.toDouble() ?? 0.0) * 0.2) / 100);
    return fees + markup;
  }

  List<double> _getDailySalesData() {
    // Returns sales for past 7 days
    final now = DateTime.now();
    final List<double> sales = List.filled(7, 0.0);
    
    for (var order in _orders) {
      if (order['deliveryStatus'] == 'cancelled' || order['deliveryStatus'] == 'refunded') continue;
      final dateStr = order['createdAt'] as String?;
      if (dateStr == null) continue;
      
      final date = DateTime.parse(dateStr).toLocal();
      final diff = now.difference(date).inDays;
      if (diff >= 0 && diff < 7) {
        sales[6 - diff] += ((order['subtotal'] as num?)?.toDouble() ?? 0.0);
      }
    }
    return sales;
  }

  List<int> _getDailyOrdersCount() {
    final now = DateTime.now();
    final List<int> counts = List.filled(7, 0);
    
    for (var order in _orders) {
      final dateStr = order['createdAt'] as String?;
      if (dateStr == null) continue;
      
      final date = DateTime.parse(dateStr).toLocal();
      final diff = now.difference(date).inDays;
      if (diff >= 0 && diff < 7) {
        counts[6 - diff] += 1;
      }
    }
    return counts;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Dashboard'),
        backgroundColor: BrandColors.background,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.swap_horiz, color: BrandColors.cyan),
            onPressed: () => Navigator.of(context).pushReplacementNamed('/customer'),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: BrandColors.cyan))
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: BrandColors.red)))
              : IndexedStack(
                  index: _activeTab,
                  children: [
                    _buildAnalyticsTab(),
                    _buildOrdersTab(),
                  ],
                ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _activeTab,
        backgroundColor: BrandColors.card,
        selectedItemColor: BrandColors.cyan,
        unselectedItemColor: BrandColors.textMuted,
        onTap: (idx) => setState(() => _activeTab = idx),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.analytics_outlined), label: 'Analytics'),
          BottomNavigationBarItem(icon: Icon(Icons.gavel_outlined), label: 'Orders & Refunds'),
        ],
      ),
    );
  }

  Widget _buildAnalyticsTab() {
    final gross = _getGrossRevenue();
    final earnings = _getPlatformEarnings();
    final dailySales = _getDailySalesData();
    final dailyOrders = _getDailyOrdersCount();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Platform Overview', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 16),

          // Total Earnings Blocks
          Row(
            children: [
              Expanded(
                child: GlassContainer(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('GROSS VOLUME', style: TextStyle(color: BrandColors.textMuted, fontSize: 10, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 6),
                      Text('\$${gross.toStringAsFixed(2)}', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: GlassContainer(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('PLATFORM FEES', style: TextStyle(color: BrandColors.cyan, fontSize: 10, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 6),
                      Text('\$${earnings.toStringAsFixed(2)}', style: const TextStyle(color: BrandColors.cyan, fontSize: 18, fontWeight: FontWeight.w900)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Custom Paint line chart for sales volume
          GlassContainer(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Daily Revenue (Past 7 Days)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white)),
                const SizedBox(height: 16),
                SizedBox(
                  height: 120,
                  width: double.infinity,
                  child: CustomPaint(
                    painter: AnalyticsLineChartPainter(dataPoints: dailySales),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Custom Paint bar chart for order count
          GlassContainer(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Daily Order Count (Past 7 Days)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white)),
                const SizedBox(height: 16),
                SizedBox(
                  height: 120,
                  width: double.infinity,
                  child: CustomPaint(
                    painter: AnalyticsBarChartPainter(dataPoints: dailyOrders),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildOrdersTab() {
    return RefreshIndicator(
      onRefresh: _fetchAdminData,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _orders.length,
        itemBuilder: (context, idx) {
          final order = _orders[idx];
          final isRefunded = order['refunded'] == true || order['deliveryStatus'] == 'refunded' || order['deliveryStatus'] == 'cancelled';
          final date = DateTime.parse(order['createdAt']).toLocal();

          return Container(
            margin: const EdgeInsets.only(bottom: 16),
            child: GlassContainer(
              borderColor: isRefunded ? BrandColors.red.withOpacity(0.3) : null,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '#${order['_id'].toString().substring(order['_id'].toString().length - 8).toUpperCase()}',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
                      ),
                      Text(
                        '\$${(order['subtotal'] as num).toStringAsFixed(2)}',
                        style: const TextStyle(fontWeight: FontWeight.w900, color: BrandColors.cyan, fontSize: 14),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text('Store: ${order['restaurantName']}', style: const TextStyle(color: BrandColors.textMuted, fontSize: 11)),
                  Text('Customer: ${order['customerName']} (${order['customerPhone']})', style: const TextStyle(color: BrandColors.textMuted, fontSize: 11)),
                  Text('Placed: ${DateFormat('MMM d, h:mm a').format(date)}', style: const TextStyle(color: BrandColors.textMuted, fontSize: 11)),
                  const Divider(color: BrandColors.border, height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        isRefunded ? 'STATUS: REFUNDED' : 'STATUS: ${order['deliveryStatus'].toString().toUpperCase()}',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 10,
                          color: isRefunded ? BrandColors.red : BrandColors.cyan,
                        ),
                      ),
                      if (!isRefunded)
                        ElevatedButton(
                          onPressed: () => _refundOrder(order['_id']),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: BrandColors.red,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            minimumSize: Size.zero,
                          ),
                          child: const Text('CANCEL & REFUND', style: TextStyle(fontSize: 10)),
                        )
                      else
                        const Text('Captured & Settled', style: TextStyle(color: BrandColors.textMuted, fontSize: 11, fontStyle: FontStyle.italic)),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class AnalyticsLineChartPainter extends CustomPainter {
  final List<double> dataPoints;
  AnalyticsLineChartPainter({required this.dataPoints});

  @override
  void paint(Canvas canvas, Size size) {
    if (dataPoints.isEmpty) return;
    
    final paintLine = Paint()
      ..color = BrandColors.cyan
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;

    final paintFill = Paint()
      ..color = BrandColors.cyan.withOpacity(0.15)
      ..style = PaintingStyle.fill;

    final double maxVal = dataPoints.reduce((a, b) => a > b ? a : b);
    final double divisor = maxVal == 0 ? 1 : maxVal;

    final int len = dataPoints.length;
    final double stepX = size.width / (len - 1);

    final pathLine = Path();
    final pathFill = Path();

    pathFill.moveTo(0, size.height);

    for (int i = 0; i < len; i++) {
      final double x = i * stepX;
      final double ratio = dataPoints[i] / divisor;
      final double y = size.height - (ratio * (size.height - 20)) - 10;

      if (i == 0) {
        pathLine.moveTo(x, y);
      } else {
        pathLine.lineTo(x, y);
      }
      pathFill.lineTo(x, y);
    }

    pathFill.lineTo(size.width, size.height);
    pathFill.close();

    canvas.drawPath(pathFill, paintFill);
    canvas.drawPath(pathLine, paintLine);

    // Draw coordinate dots
    final paintDot = Paint()..color = Colors.white;
    for (int i = 0; i < len; i++) {
      final double x = i * stepX;
      final double ratio = dataPoints[i] / divisor;
      final double y = size.height - (ratio * (size.height - 20)) - 10;
      canvas.drawCircle(Offset(x, y), 4, paintDot);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

class AnalyticsBarChartPainter extends CustomPainter {
  final List<int> dataPoints;
  AnalyticsBarChartPainter({required this.dataPoints});

  @override
  void paint(Canvas canvas, Size size) {
    if (dataPoints.isEmpty) return;

    final paintBar = Paint()
      ..color = BrandColors.blue
      ..style = PaintingStyle.fill;

    final double maxVal = dataPoints.reduce((a, b) => a > b ? a : b).toDouble();
    final double divisor = maxVal == 0 ? 1 : maxVal;

    final int len = dataPoints.length;
    final double space = 12.0;
    final double barWidth = (size.width - (space * (len - 1))) / len;

    for (int i = 0; i < len; i++) {
      final double ratio = dataPoints[i] / divisor;
      final double height = ratio * (size.height - 20);
      
      final double left = i * (barWidth + space);
      final double top = size.height - height;
      final double right = left + barWidth;
      final double bottom = size.height;

      final rect = RRect.fromRectAndRadius(
        Rect.fromLTRB(left, top, right, bottom),
        const Radius.circular(6),
      );
      canvas.drawRRect(rect, paintBar);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
