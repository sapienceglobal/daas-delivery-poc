import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/services/order_service.dart';

class OrderProvider with ChangeNotifier {
  final OrderService _orderService = OrderService();
  
  List<dynamic> _orders = [];
  bool _isLoading = false;
  String? _error;

  List<dynamic> get orders => _orders;
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
