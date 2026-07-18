import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';
import '../theme.dart';
import '../widgets/glass_container.dart';

class DriverDashboardScreen extends StatefulWidget {
  const DriverDashboardScreen({super.key});

  @override
  State<DriverDashboardScreen> createState() => _DriverDashboardScreenState();
}

class _DriverDashboardScreenState extends State<DriverDashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  List<dynamic> _availableOrders = [];
  Map<String, dynamic>? _activeOrder;
  bool _isLoading = true;
  Timer? _locationTimer;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchData();
    
    SocketService.connect(
      listenerId: 'driver_dashboard_screen',
      onOrderUpdated: (data) {
        if (mounted) _fetchData();
      }
    );
  }

  @override
  void dispose() {
    _stopLocationSimulation();
    SocketService.disconnect('driver_dashboard_screen');
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final availableRes = await ApiService.get('/api/orders/driver/available');
      final activeRes = await ApiService.get('/api/orders/driver/active');
      
      final availableData = json.decode(availableRes.body);
      final activeData = json.decode(activeRes.body);

      setState(() {
        _availableOrders = availableData['data'] ?? [];
        _activeOrder = activeData['data'];
      });

      if (_activeOrder != null && _activeOrder!['status'] == 'picked_up') {
        _startLocationSimulation(_activeOrder!['_id']);
      } else {
        _stopLocationSimulation();
      }
    } catch (e) {
      debugPrint('Error fetching driver data: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _startLocationSimulation(String orderId) {
    if (_locationTimer != null) return;
    
    double lat = 40.730610;
    double lng = -73.935242;
    
    _locationTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      lat += 0.0001;
      lng += 0.0001;
      
      SocketService.emit('driver_location_update', {
        'orderId': orderId,
        'location': {'lat': lat, 'lng': lng}
      });
    });
  }

  void _stopLocationSimulation() {
    _locationTimer?.cancel();
    _locationTimer = null;
  }

  Future<void> _updateOrderStatus(String orderId, String action) async {
    try {
      await ApiService.put('/api/orders/$orderId/driver-$action', {});
      await _fetchData();
      
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Order marked as $action successfully'), backgroundColor: BrandColors.green),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: BrandColors.red),
      );
    }
  }

  Widget _buildAvailableOrders() {
    if (_availableOrders.isEmpty) {
      return const Center(child: Text('No available deliveries right now', style: TextStyle(color: BrandColors.textMuted)));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _availableOrders.length,
      itemBuilder: (context, index) {
        final order = _availableOrders[index];
        return GlassContainer(
          margin: const EdgeInsets.only(bottom: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Order #${order['orderNumber']}', style: const TextStyle(fontWeight: FontWeight.bold, color: BrandColors.textMain)),
                  Text('\$${(order['total'] ?? 0).toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, color: BrandColors.green)),
                ],
              ),
              const SizedBox(height: 8),
              Text('From: ${order['restaurantName']}', style: const TextStyle(color: BrandColors.textMuted, fontSize: 12)),
              Text('To: ${order['address']}', style: const TextStyle(color: BrandColors.textMuted, fontSize: 12)),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: BrandColors.cyan, foregroundColor: BrandColors.background),
                  onPressed: _activeOrder != null ? null : () => _updateOrderStatus(order['_id'], 'accept'),
                  child: const Text('Accept Delivery'),
                ),
              )
            ],
          ),
        );
      },
    );
  }

  Widget _buildActiveDelivery() {
    if (_activeOrder == null) {
      return const Center(child: Text('No active delivery', style: TextStyle(color: BrandColors.textMuted)));
    }

    final status = _activeOrder!['status'];
    final isAccepted = status == 'accepted_by_driver';
    final isPickedUp = status == 'picked_up';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: GlassContainer(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: BrandColors.cyan.withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
              child: Text(status.toString().toUpperCase(), style: const TextStyle(color: BrandColors.cyan, fontSize: 10, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 12),
            Text('Order #${_activeOrder!['orderNumber']}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: BrandColors.textMain)),
            const Divider(color: BrandColors.border, height: 24),
            
            const Text('PICKUP', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: BrandColors.textMuted)),
            Text('${_activeOrder!['restaurantName']}', style: const TextStyle(color: BrandColors.textMain, fontSize: 16)),
            Text('${_activeOrder!['restaurantAddress']}', style: const TextStyle(color: BrandColors.textMuted, fontSize: 14)),
            
            const SizedBox(height: 16),
            const Text('DROPOFF', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: BrandColors.textMuted)),
            Text('${_activeOrder!['customerName']}', style: const TextStyle(color: BrandColors.textMain, fontSize: 16)),
            Text('${_activeOrder!['address']}', style: const TextStyle(color: BrandColors.textMuted, fontSize: 14)),
            
            const SizedBox(height: 32),
            if (isAccepted)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: BrandColors.green, foregroundColor: BrandColors.background, padding: const EdgeInsets.all(16)),
                  onPressed: () => _updateOrderStatus(_activeOrder!['_id'], 'pickup'),
                  child: const Text('Pick Up Food', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
              
            if (isPickedUp)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: BrandColors.cyan, foregroundColor: BrandColors.background, padding: const EdgeInsets.all(16)),
                  onPressed: () => _updateOrderStatus(_activeOrder!['_id'], 'deliver'),
                  child: const Text('Mark Delivered', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context, listen: false);

    return Scaffold(
      backgroundColor: BrandColors.background,
      appBar: AppBar(
        title: const Text('Driver Dashboard'),
        backgroundColor: BrandColors.card,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              auth.logout();
              Navigator.pushReplacementNamed(context, '/login');
            },
          )
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: BrandColors.cyan,
          labelColor: BrandColors.cyan,
          unselectedLabelColor: BrandColors.textMuted,
          tabs: const [
            Tab(text: 'Available'),
            Tab(text: 'Active Delivery'),
          ],
        ),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: BrandColors.cyan))
        : TabBarView(
            controller: _tabController,
            children: [
              _buildAvailableOrders(),
              _buildActiveDelivery(),
            ],
          ),
    );
  }
}
