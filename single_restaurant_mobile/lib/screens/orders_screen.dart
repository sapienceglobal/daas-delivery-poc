import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/notification_provider.dart';
import 'package:single_restaurant_mobile/providers/order_provider.dart';
import 'package:single_restaurant_mobile/screens/notifications_screen.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';
import 'package:single_restaurant_mobile/widgets/common/app_dialog.dart';
import 'package:single_restaurant_mobile/widgets/empty_state_widget.dart';
import 'package:single_restaurant_mobile/widgets/guest_login_prompt.dart';
import 'package:single_restaurant_mobile/widgets/order_card.dart';
import 'package:single_restaurant_mobile/widgets/orders/orders_filter_bar.dart';

class OrdersScreen extends StatefulWidget {
  final VoidCallback onBack;

  const OrdersScreen({super.key, required this.onBack});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  final List<String> _filters = ['All Orders', 'Ongoing', 'Delivered', 'Cancelled'];
  String _selectedFilter = 'All Orders';

  bool _isSearching = false;
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _fetchOrders();
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
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

    final orderProvider = Provider.of<OrderProvider>(context, listen: false);
    await orderProvider.fetchMyOrders(status: statusParam, silent: silent);
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    if (authProvider.user == null) {
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
        ),
        body: const GuestLoginPrompt(
          icon: Icons.receipt_long,
          title: 'Login to view your orders',
          subtitle: 'Track your orders in real-time, get updates, and see your past history.',
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.secondary),
          onPressed: widget.onBack,
        ),
        title: _isSearching
            ? TextField(
                controller: _searchController,
                autofocus: true,
                decoration: const InputDecoration(
                  hintText: 'Search orders...',
                  border: InputBorder.none,
                  hintStyle: TextStyle(color: Colors.black54),
                ),
                style: const TextStyle(color: Colors.black, fontSize: 18),
                onChanged: (value) {
                  setState(() {
                    _searchQuery = value;
                  });
                },
              )
            : const Text(
                'My Orders',
                style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 24),
              ),
        centerTitle: false,
        actions: [
          IconButton(
            icon: Icon(_isSearching ? Icons.close : Icons.search, color: Colors.black, size: 26),
            onPressed: () {
              setState(() {
                if (_isSearching) {
                  _isSearching = false;
                  _searchQuery = '';
                  _searchController.clear();
                } else {
                  _isSearching = true;
                }
              });
            },
          ),
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: Consumer<NotificationProvider>(
              builder: (context, notificationProvider, child) {
                return Stack(
                  alignment: Alignment.center,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.notifications_none_outlined, size: 28),
                      onPressed: () {
                        Navigator.push(context, MaterialPageRoute(builder: (context) => const NotificationsScreen()));
                      },
                      color: AppColors.textDark,
                    ),
                    if (notificationProvider.hasUnread)
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
                );
              },
            ),
          )
        ],
      ),
      body: Column(
        children: [
          OrdersFilterBar(
            filters: _filters,
            selectedFilter: _selectedFilter,
            onFilterSelected: (filter) {
              setState(() {
                _selectedFilter = filter;
              });
              _fetchOrders();
            },
          ),
          Expanded(
            child: Consumer<OrderProvider>(
              builder: (context, provider, child) {
                if (provider.isLoading && provider.orders.isEmpty) {
                  return const Center(child: CircularProgressIndicator(color: AppColors.primary));
                }

                if (provider.error != null && provider.orders.isEmpty) {
                  return EmptyStateWidget(
                    icon: Icons.error_outline,
                    title: 'Oops! Something went wrong',
                    subtitle: 'We couldn\'t load your orders.\n${provider.error}',
                    actionText: 'Try Again',
                    onActionPressed: () => provider.fetchMyOrders(),
                  );
                }

                List<dynamic> displayOrders = provider.orders;
                if (_searchQuery.isNotEmpty) {
                  final query = _searchQuery.toLowerCase();
                  displayOrders = displayOrders.where((order) {
                    final orderId = order['_id']?.toString().toLowerCase() ?? '';
                    final items = (order['items'] as List<dynamic>?) ?? [];
                    final hasMatchingItem = items.any((item) =>
                        (item['menuItemId']?['name']?.toString().toLowerCase() ?? '').contains(query));
                    return orderId.contains(query) || hasMatchingItem;
                  }).toList();
                }

                if (displayOrders.isEmpty) {
                  return const EmptyStateWidget(
                    icon: Icons.receipt_long_outlined,
                    title: 'No Orders Yet',
                    subtitle: 'Looks like you haven\'t placed any orders yet.\nExplore our menu and order your favorites!',
                  );
                }

                return RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: () => _fetchOrders(),
                  child: ResponsiveCenter(
                    maxWidth: 700,
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: displayOrders.length,
                      itemBuilder: (context, index) {
                        return OrderCard(
                          order: displayOrders[index],
                          onCancelOrder: () => _handleCancelOrder(provider, displayOrders[index]['_id']),
                        );
                      },
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleCancelOrder(OrderProvider provider, String orderId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (dialogCtx) => AppDialog(
        title: 'Cancel Order',
        message: 'Are you sure you want to cancel this order? This action cannot be undone.',
        icon: Icons.cancel_outlined,
        iconColor: AppColors.brandRed,
        isDestructive: true,
        primaryActionText: 'Yes, Cancel',
        onPrimaryAction: () => Navigator.pop(dialogCtx, true),
        secondaryActionText: 'No',
        onSecondaryAction: () => Navigator.pop(dialogCtx, false),
      ),
    );

    if (confirm == true) {
      try {
        await provider.cancelOrder(orderId);
        if (mounted) {
          ToastUtils.showSuccess(context, 'Order cancelled successfully');
        }
      } catch (e) {
        if (mounted) {
          ToastUtils.showError(context, e.toString());
        }
      }
    }
  }
}
