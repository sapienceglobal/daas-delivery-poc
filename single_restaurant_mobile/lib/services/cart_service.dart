import 'dart:convert';
import 'package:single_restaurant_mobile/services/api_service.dart';

class CartService {
  // Fetch cart
  Future<Map<String, dynamic>?> getCart() async {
    try {
      final response = await ApiService.get('/api/auth/me/cart');
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['data'];
      }
      return null;
    } catch (e) {
      print('Error fetching cart: $e');
      return null;
    }
  }

  // Update cart
  Future<bool> updateCart(List<dynamic> items, Map<String, dynamic>? restaurant, String specialInstructions) async {
    try {
      final response = await ApiService.put('/api/auth/me/cart', {
        'items': items,
        'restaurant': restaurant,
        'specialInstructions': specialInstructions,
      });
      return response.statusCode == 200;
    } catch (e) {
      print('Error updating cart: $e');
      return false;
    }
  }

  // Clear cart
  Future<bool> clearCart() async {
    try {
      final response = await ApiService.delete('/api/auth/me/cart');
      return response.statusCode == 200;
    } catch (e) {
      print('Error clearing cart: $e');
      return false;
    }
  }
}
