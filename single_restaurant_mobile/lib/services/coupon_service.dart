import 'dart:convert';
import 'package:single_restaurant_mobile/services/api_service.dart';

class CouponService {
  Future<Map<String, dynamic>?> validateCoupon(String code, double subtotal, String? restaurantId) async {
    try {
      final response = await ApiService.post('/api/coupons/validate', {
        'code': code,
        'cartValue': subtotal,
        'restaurantId': restaurantId,
      });
      
      final data = json.decode(response.body);
      return data['data']; // Returns { discount: number }
    } catch (e) {
      // ApiService throws HttpException for 4xx/5xx errors
      rethrow;
    }
  }

  Future<List<dynamic>> getCoupons({bool activeOnly = true}) async {
    try {
      final response = await ApiService.get('/api/coupons?active=$activeOnly');
      final data = json.decode(response.body);
      return data['data'] ?? [];
    } catch (e) {
      print('Error fetching coupons: $e');
      return [];
    }
  }
}
