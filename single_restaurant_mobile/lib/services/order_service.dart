import 'dart:convert';
import 'package:single_restaurant_mobile/services/api_service.dart';

class OrderService {
  Future<List<dynamic>?> getMyOrders({String status = 'all'}) async {
    try {
      final response = await ApiService.get('/api/orders/my-orders?status=$status');
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['data'];
      }
      return null;
    } catch (e) {
      print('Error fetching orders: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> getOrderById(String orderId) async {
    try {
      final response = await ApiService.get('/api/orders/$orderId');
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['data'];
      }
      return null;
    } catch (e) {
      print('Error fetching order $orderId: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> getRestaurantETA(String restaurantId, [String? address]) async {
    try {
      final query = address != null ? '?address=${Uri.encodeComponent(address)}' : '';
      final response = await ApiService.get('/api/restaurants/$restaurantId/eta$query');
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['data'];
      }
      return null;
    } catch (e) {
      print('Error fetching ETA: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> getDeliveryQuote(Map<String, dynamic> payload) async {
    try {
      final response = await ApiService.post('/api/orders/delivery-quote', payload);
      final data = json.decode(response.body);
      return data['data'];
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>?> createOrder(Map<String, dynamic> payload) async {
    try {
      final response = await ApiService.post('/api/orders', payload);
      final data = json.decode(response.body);
      return data['data'];
    } catch (e) {
      rethrow;
    }
  }
}
