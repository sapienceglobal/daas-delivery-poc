import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/services/order_service.dart';
import 'package:single_restaurant_mobile/services/socket_service.dart';
import 'dart:convert';

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

  bool _shouldTrackOrder(dynamic order) {
    final status = order['status']?.toString();
    final paymentStatus = order['paymentStatus']?.toString().toLowerCase();
    final refundAmount = (order['refundAmount'] as num?)?.toDouble() ?? 0.0;
    final isRefunded = order['refunded'] == true || paymentStatus == 'refunded' || refundAmount > 0;
    final isPaidCancelled = status == 'cancelled' && paymentStatus == 'paid' && !isRefunded;
    return status != 'delivered' && (status != 'cancelled' || isPaidCancelled);
  }

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

    // Subscribe to active orders (in case already connected)
    for (var order in _orders) {
      if (_shouldTrackOrder(order)) {
        _socketService.joinOrderRoom(order['_id']);
      }
    }
    for (var orderId in _trackedOrdersCache.keys) {
      _socketService.joinOrderRoom(orderId);
    }

    if (!_isSocketInitialized) {
      _isSocketInitialized = true;
      
      // Re-join rooms upon connection/reconnection
      _socketService.on('connect', (_) {
        for (var order in _orders) {
          if (_shouldTrackOrder(order)) {
            _socketService.joinOrderRoom(order['_id']);
          }
        }
        for (var orderId in _trackedOrdersCache.keys) {
          _socketService.joinOrderRoom(orderId);
        }
      });
      
      final handleUpdate = (dynamic data) {
        try {
          print('Socket event received: $data');
          Map<String, dynamic> payload;
          if (data is String) {
            payload = jsonDecode(data);
          } else if (data is Map) {
            payload = Map<String, dynamic>.from(data);
          } else if (data is List && data.isNotEmpty) {
            if (data.first is String) {
              payload = jsonDecode(data.first);
            } else {
              payload = Map<String, dynamic>.from(data.first);
            }
          } else {
            return;
          }

          if (payload['order'] != null) {
             final updatedOrder = payload['order'];
             final orderId = updatedOrder['_id']?.toString();
             
             if (orderId == null) return;

             bool shouldNotify = false;

             if (_trackedOrdersCache.containsKey(orderId)) {
                 _trackedOrdersCache[orderId] = updatedOrder;
                 shouldNotify = true;
             }

             final index = _orders.indexWhere((o) => o['_id']?.toString() == orderId);
             if (index != -1) {
               _orders[index] = updatedOrder;
               shouldNotify = true;
             }

             if (shouldNotify) {
               notifyListeners();
             }
          } else {
             fetchMyOrders(status: 'all', silent: true);
             for (var orderId in _trackedOrdersCache.keys) {
                 fetchTrackedOrder(orderId, silent: true);
             }
          }
        } catch (e) {
          print('Error handling socket update: $e');
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
        
        final index = _orders.indexWhere((o) => o['_id']?.toString() == orderId);
        if (index != -1) {
          _orders[index] = data;
        }

        _setupGlobalSocketListeners();
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

  Future<void> cancelOrder(String orderId) async {
    try {
      final data = await _orderService.cancelOrder(orderId);
      
      if (data != null) {
        // Update local cache
        if (_trackedOrdersCache.containsKey(orderId)) {
          _trackedOrdersCache[orderId] = data;
        }
        
        final index = _orders.indexWhere((o) => o['_id']?.toString() == orderId);
        if (index != -1) {
          _orders[index] = data;
        }
        
        notifyListeners();
      }
    } catch (e) {
      rethrow;
    }
  }

  /// Clears all order data from memory. Call this on logout.
  void clear() {
    _socketService.dispose();
    _orders = [];
    _trackedOrdersCache.clear();
    _isSocketInitialized = false;
    _isLoading = false;
    _error = null;
    notifyListeners();
  }
}
