import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/widgets/order_card.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/order_provider.dart';
import 'package:single_restaurant_mobile/services/socket_service.dart';

class OrdersScreen extends StatefulWidget {
  final VoidCallback onBack;

  const OrdersScreen({super.key, required this.onBack});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  final List<String> _filters = ['All Orders', 'Ongoing', 'Delivered', 'Cancelled'];
  String _selectedFilter = 'All Orders';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchOrders();
    });

    final socketService = SocketService();
    socketService.init();
    
    final handleUpdate = (dynamic data) {
      if (!mounted) return;
      _fetchOrders(silent: true);
    };

    socketService.onOrderStatusChanged(handleUpdate);
    socketService.onOrderUpdated(handleUpdate);
  }

  @override
  void dispose() {
    final socketService = SocketService();
    // We only remove the listeners we added, though ideally we'd manage named listeners
    socketService.offOrderStatusChanged();
    socketService.offOrderUpdated();
    super.dispose();
  }

  Future<void> _fetchOrders({bool silent = false}) async {
    String statusParam = 'all';
    switch (_selectedFilter) {
      case 'Ongoing':
        statusParam = 'ongoing';
        break;
      case 'Delivered':
        statusParam = 'delivered';
        break;
      case 'Cancelled':
        statusParam = 'cancelled';
        break;
    }
    
    Provider.of<OrderProvider>(context, listen: false).fetchMyOrders(status: statusParam, silent: silent);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.secondary),
          onPressed: widget.onBack,
        ),
        title: const Text(
          'My Orders',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 24),
        ),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: Colors.black, size: 26),
            onPressed: () {},
          ),
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: Stack(
              alignment: Alignment.center,
              children: [
                IconButton(
                  icon: const Icon(Icons.notifications_none_outlined, size: 28),
                  onPressed: () {},
                  color: AppColors.textDark,
                ),
                Positioned(
                  right: 8,
                  top: 12,
                  child: Container(
                    width: 10,
                    height: 10,
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                  ),
                )
              ],
            ),
          )
        ],
      ),
      body: Column(
        children: [
          _buildFilters(),
          Expanded(
            child: Consumer<OrderProvider>(
              builder: (context, provider, child) {
                if (provider.isLoading && provider.orders.isEmpty) {
                  return const Center(child: CircularProgressIndicator(color: AppColors.primary));
                }
                
                if (provider.error != null && provider.orders.isEmpty) {
                  return Center(child: Text('Error: ${provider.error}', style: const TextStyle(color: Colors.red)));
                }

                if (provider.orders.isEmpty) {
                  return const Center(child: Text('No orders found.'));
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: provider.orders.length,
                  itemBuilder: (context, index) {
                    return OrderCard(order: provider.orders[index]);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilters() {
    return SizedBox(
      height: 48,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: _filters.length,
        itemBuilder: (context, index) {
          final filter = _filters[index];
          final isSelected = _selectedFilter == filter;
          return GestureDetector(
            onTap: () {
              setState(() {
                _selectedFilter = filter;
              });
              _fetchOrders();
            },
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                color: isSelected ? AppColors.secondary : const Color(0xFFF5F5F5), // Light grey/beige for unselected
                borderRadius: BorderRadius.circular(16),
              ),
              alignment: Alignment.center,
              child: Text(
                filter,
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.black87,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  fontSize: 13,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
