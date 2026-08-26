import 'dart:convert';
import 'package:flutter/material.dart';
import '../models/order_model.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';

class OrderProvider extends ChangeNotifier {
  final SocketService socketService;

  List<OrderModel> _orders = [];
  bool _isLoading = true;
  bool _isInitialized = false;
  String? _error;
  String? _restaurantId; // Assuming we fetch this on init or login

  OrderProvider(this.socketService) {
    _initSocketListeners();
  }

  List<OrderModel> get orders => _orders;
  bool get isLoading => _isLoading;
  bool get isInitialized => _isInitialized;
  String? get error => _error;

  // Set the restaurant ID and load orders
  void setRestaurantId(String id) {
    _restaurantId = id;
    fetchOrders();
  }

  Future<void> fetchOrders({bool force = false}) async {
    if (_isInitialized && !force) return;

    if (_restaurantId == null) {
      // For POC, we might fetch a hardcoded or single tenant restaurant ID if not set
      // Fetching My Restaurant as fallback
      try {
        final res = await ApiService.get('/api/restaurants/merchant/my');
        final decoded = jsonDecode(res.body);
        if (decoded != null && decoded['data'] != null) {
           _restaurantId = decoded['data']['_id'];
        }
      } catch (e) {
        print("Could not fetch restaurant ID: $e");
        return;
      }
    }
    
    if (_restaurantId == null) return;

    socketService.joinRestaurantRoom(_restaurantId!);

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.get('/api/orders/restaurant/$_restaurantId');
      final decoded = jsonDecode(response.body);
      if (decoded != null && decoded['data'] != null) {
        final List<dynamic> data = decoded['data'];
        _orders = data.map((json) => OrderModel.fromJson(json)).toList();
      }
    } catch (e) {
      _error = 'Failed to load orders: $e';
    } finally {
      _isLoading = false;
      _isInitialized = true;
      notifyListeners();
    }
  }

  Future<void> fetchOrderById(String orderId) async {
    try {
      final res = await ApiService.get('/api/orders/restaurant/$_restaurantId?_id=$orderId');
      final decoded = jsonDecode(res.body);
      if (decoded != null && decoded['data'] != null) {
        final List<dynamic> data = decoded['data'];
        final orderData = data.firstWhere((o) => o['_id'] == orderId, orElse: () => null);
        if (orderData != null) {
          final freshOrder = OrderModel.fromJson(orderData);
          final idx = _orders.indexWhere((o) => o.id == orderId);
          if (idx != -1) {
            _orders[idx] = freshOrder;
          } else {
            _orders.insert(0, freshOrder);
          }
          notifyListeners();
        }
      }
    } catch (e) {
      print('Error fetching order: $e');
    }
  }

  Future<void> cancelOrder(String orderId) async {
    try {
      await ApiService.put('/api/orders/$orderId/status', {'status': 'cancelled'});
      await Future.delayed(const Duration(milliseconds: 1500)); // wait for Stripe webhook
      await fetchOrderById(orderId);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> refundOrder(String orderId) async {
    try {
      await ApiService.post('/api/orders/$orderId/refund', {'reason': 'Merchant initiated refund'});
      await Future.delayed(const Duration(milliseconds: 1500)); // wait for Stripe webhook
      await fetchOrderById(orderId);
    } catch (e) {
      rethrow;
    }
  }


  void _initSocketListeners() {
    void handleUpdate(dynamic data) {
       if (data == null) return;
       try {
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

          final orderData = payload['order'] ?? payload;
          if (orderData is! Map) return;

          // If the event only sent orderId (partial update or new order)
          if (orderData['_id'] == null && (orderData['orderId'] != null || payload['orderId'] != null)) {
            final id = orderData['orderId'] ?? payload['orderId'];
            final status = orderData['status'] ?? payload['status'];
            final index = _orders.indexWhere((o) => o.id == id);
            if (index != -1 && status != null) {
              _orders[index] = _orders[index].copyWith(status: status);
              notifyListeners();
            } else if (index == -1) {
              // It's a new order but we only got the ID. Let's fetch it.
              fetchOrderById(id).then((_) {
                // To maintain chronological order, sort orders if needed or it will just be added to list by fetchOrderById
              });
            }
            return;
          }

          if (orderData['_id'] == null) return;

          final updatedOrder = OrderModel.fromJson(Map<String, dynamic>.from(orderData));
          final index = _orders.indexWhere((o) => o.id == updatedOrder.id);
          
          if (index != -1) {
             _orders[index] = updatedOrder;
          } else {
             _orders.insert(0, updatedOrder);
          }
          notifyListeners();
       } catch (e) {
          print('Error handling socket update: $e');
       }
    }

    socketService.on('new_order', handleUpdate);
    socketService.on('order_updated', handleUpdate);
    socketService.on('order_status_changed', handleUpdate);
  }

  Future<void> updateOrderStatus(String orderId, String status) async {
    try {
      await ApiService.put('/api/orders/$orderId/status', {'status': status});
      // Optimistic update
      final index = _orders.indexWhere((o) => o.id == orderId);
      if (index != -1) {
        _orders[index] = _orders[index].copyWith(status: status);
        notifyListeners();
      }
    } catch (e) {
      _error = 'Failed to update order: $e';
      notifyListeners();
      rethrow;
    }
  }
}
