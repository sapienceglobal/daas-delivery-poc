import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/services/order_service.dart';
import 'package:single_restaurant_mobile/services/socket_service.dart';

class OrderProvider with ChangeNotifier {
  final OrderService _orderService = OrderService();
  final SocketService _socketService = SocketService();
  bool _isSocketInitialized = false;
  
  List<dynamic> _orders = [];
  final Map<String, Map<String, dynamic>> _trackedOrdersCache = {};
  bool _isLoading = false;
  String? _error;

  List<dynamic> get orders => _orders;
  Map<String, dynamic>? getTrackedOrder(String orderId) => _trackedOrdersCache[orderId];
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchMyOrders({String status = 'all', bool silent = false}) async {
    if (!silent) _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _orderService.getMyOrders(status: status);
      if (data != null) {
        _orders = data;
        _setupGlobalSocketListeners();
      } else {
        _error = 'Failed to load orders';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      if (!silent) _isLoading = false;
      notifyListeners();
    }
  }

  void _setupGlobalSocketListeners() {
    _socketService.init();

    // Subscribe to active orders
    for (var order in _orders) {
      if (order['status'] != 'delivered' && order['status'] != 'cancelled') {
        _socketService.joinOrderRoom(order['_id']);
      }
    }

    if (!_isSocketInitialized) {
      _isSocketInitialized = true;
      final handleUpdate = (dynamic data) {
        if (data != null && data['order'] != null) {
           final updatedOrder = data['order'];
           final orderId = updatedOrder['_id'];
           
           bool shouldNotify = false;

           // Update in the tracked orders cache
           if (_trackedOrdersCache.containsKey(orderId)) {
               _trackedOrdersCache[orderId] = updatedOrder;
               shouldNotify = true;
           }

           // Update in the global _orders list for OrdersScreen
           final index = _orders.indexWhere((o) => o['_id'] == orderId);
           if (index != -1) {
             _orders[index] = updatedOrder;
             shouldNotify = true;
           } else {
             // If we get an update for an order not in our current list, we might want to refetch
             // But usually it's fine.
           }

           if (shouldNotify) {
             notifyListeners();
           }
        } else {
           // Fallback if data format is unexpected
           fetchMyOrders(status: 'all', silent: true);
           for (var orderId in _trackedOrdersCache.keys) {
               fetchTrackedOrder(orderId, silent: true);
           }
        }
      };

      _socketService.onOrderStatusChanged(handleUpdate);
      _socketService.onOrderUpdated(handleUpdate);
    }
  }

  Future<void> fetchTrackedOrder(String orderId, {bool silent = false}) async {
    if (!silent) {
      _isLoading = true;
      notifyListeners();
    }
    
    try {
      final data = await _orderService.getOrderById(orderId);
      if (data != null) {
        _trackedOrdersCache[orderId] = data;
        _socketService.joinOrderRoom(orderId);
      }
    } catch (e) {
      print('Error getting order by id from provider: $e');
    } finally {
      if (!silent) _isLoading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>?> getOrderById(String orderId) async {
    try {
      return await _orderService.getOrderById(orderId);
    } catch (e) {
      print('Error getting order by id from provider: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> getRestaurantETA(String restaurantId) async {
    try {
      return await _orderService.getRestaurantETA(restaurantId);
    } catch (e) {
      print('Error getting ETA from provider: $e');
      return null;
    }
  }
}
