import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class CartProvider extends ChangeNotifier {
  final List<Map<String, dynamic>> _cartItems = [];
  Map<String, dynamic>? _cartRestaurant;
  
  // Dynamic Quote & Validation details
  Map<String, dynamic>? _deliveryQuote;
  bool _isLoadingQuote = false;
  bool _isSubmittingOrder = false;
  String? _checkoutError;

  List<Map<String, dynamic>> get cartItems => _cartItems;
  Map<String, dynamic>? get cartRestaurant => _cartRestaurant;
  Map<String, dynamic>? get deliveryQuote => _deliveryQuote;
  bool get isLoadingQuote => _isLoadingQuote;
  bool get isSubmittingOrder => _isSubmittingOrder;
  String? get checkoutError => _checkoutError;

  void clearCheckoutError() {
    _checkoutError = null;
    notifyListeners();
  }

  void addToCart(Map<String, dynamic> item, Map<String, dynamic> restaurant) {
    if (_cartRestaurant != null && _cartRestaurant!['_id'] != restaurant['_id']) {
      // Different restaurant warning (will be handled by UI showing confirmation dialog)
      throw DifferentRestaurantException(item: item, restaurant: restaurant);
    }

    _cartRestaurant = restaurant;
    final itemId = item['_id'] ?? item['id'];
    final existingIdx = _cartItems.indexWhere((c) => c['id'] == itemId);
    
    if (existingIdx > -1) {
      _cartItems[existingIdx]['quantity'] += 1;
    } else {
      _cartItems.add({
        'id': itemId,
        'name': item['name'],
        'price': (item['price'] as num).toDouble(),
        'quantity': 1,
      });
    }
    notifyListeners();
  }

  void modifyQuantity(String itemId, int amount) {
    final idx = _cartItems.indexWhere((c) => c['id'] == itemId);
    if (idx == -1) return;

    _cartItems[idx]['quantity'] += amount;
    if (_cartItems[idx]['quantity'] <= 0) {
      _cartItems.removeAt(idx);
    }

    if (_cartItems.isEmpty) {
      _cartRestaurant = null;
      _deliveryQuote = null;
    }
    notifyListeners();
  }

  void clearCart() {
    _cartItems.clear();
    _cartRestaurant = null;
    _deliveryQuote = null;
    _checkoutError = null;
    notifyListeners();
  }

  void clearAndReplaceCart(Map<String, dynamic> item, Map<String, dynamic> restaurant) {
    clearCart();
    addToCart(item, restaurant);
  }

  double getCartSubtotal() {
    return _cartItems.fold(0.0, (total, item) => total + (item['price'] * item['quantity']));
  }

  double getTax() {
    return getCartSubtotal() * 0.0825; // 8.25% tax
  }

  double getPlatformFee() {
    return _cartItems.isNotEmpty ? 2.00 : 0.00;
  }

  double getDeliveryFee() {
    if (_deliveryQuote != null) {
      return (_deliveryQuote!['deliveryFee'] as num).toDouble() / 100.0;
    }
    return 0.0;
  }

  double getGrandTotal() {
    return getCartSubtotal() + getTax() + getPlatformFee() + getDeliveryFee();
  }

  Future<void> fetchQuote(String dropoffAddress, {DateTime? scheduledTime}) async {
    if (_cartItems.isEmpty || _cartRestaurant == null) {
      _deliveryQuote = null;
      notifyListeners();
      return;
    }

    _isLoadingQuote = true;
    _checkoutError = null;
    notifyListeners();

    try {
      final response = await ApiService.post('/api/orders/quote', {
        'pickupAddress': _cartRestaurant!['address'],
        'dropoffAddress': dropoffAddress,
        'orderValue': getCartSubtotal(),
        'scheduledTime': scheduledTime?.toUtc().toIso8601String(),
      });
      _deliveryQuote = json.decode(response.body);
    } catch (e) {
      _checkoutError = e.toString().replaceFirst('Exception: ', '');
      _deliveryQuote = null;
    } finally {
      _isLoadingQuote = false;
      notifyListeners();
    }
  }

  Future<bool> validateAddress(String address) async {
    try {
      final response = await ApiService.post('/api/orders/validate-address', {
        'address': address,
      });
      final data = json.decode(response.body);
      return data['success'] == true && data['isValid'] == true;
    } catch (_) {
      // If validation server goes offline, skip (fallback to valid)
      return true;
    }
  }

  Future<Map<String, dynamic>?> submitOrder({
    required String customerName,
    required String customerPhone,
    required String dropoffAddress,
    required String paymentMethod,
    DateTime? scheduledTime,
    String? courierNotes,
  }) async {
    _isSubmittingOrder = true;
    _checkoutError = null;
    notifyListeners();

    try {
      // Validate address first
      final isValid = await validateAddress(dropoffAddress);
      if (!isValid) {
        throw Exception('Address validation failed. Google Maps could not locate this address.');
      }

      final orderPayload = {
        'customerName': customerName,
        'customerPhone': customerPhone,
        'address': dropoffAddress,
        'items': _cartItems.map((item) => {
          'name': item['name'],
          'price': item['price'],
          'quantity': item['quantity'],
        }).toList(),
        'restaurantName': _cartRestaurant!['name'],
        'restaurantAddress': _cartRestaurant!['address'],
        'restaurantPhone': _cartRestaurant!['phone'],
        'restaurantId': _cartRestaurant!['_id'],
        'subtotal': getCartSubtotal(),
        'tax': getTax(),
        'deliveryFee': _deliveryQuote != null ? _deliveryQuote!['deliveryFee'] : 599,
        'paymentMethod': paymentMethod,
        'scheduledTime': scheduledTime?.toUtc().toIso8601String(),
        'courierNotes': courierNotes,
      };

      final response = await ApiService.post('/api/orders', orderPayload);
      final data = json.decode(response.body);
      
      if (data['success'] == true) {
        clearCart();
        _isSubmittingOrder = false;
        notifyListeners();
        return data;
      } else {
        throw Exception(data['message'] ?? 'Order creation failed.');
      }
    } catch (e) {
      _checkoutError = e.toString().replaceFirst('Exception: ', '');
      _isSubmittingOrder = false;
      notifyListeners();
      return null;
    }
  }
}

class DifferentRestaurantException implements Exception {
  final Map<String, dynamic> item;
  final Map<String, dynamic> restaurant;
  DifferentRestaurantException({required this.item, required this.restaurant});
}
