import 'dart:convert';
import 'package:single_restaurant_mobile/services/api_service.dart';

class CouponService {
  Future<Map<String, dynamic>?> validateCoupon(String code, double subtotal, String? restaurantId) async {
    try {
      final response = await ApiService.post('/api/coupons/validate', {
        'code': code,
        'subtotal': subtotal,
        'restaurantId': restaurantId,
      });
      
      final data = json.decode(response.body);
      return data['data']; // Returns { discount: number }
    } catch (e) {
      // ApiService throws HttpException for 4xx/5xx errors
      rethrow;
    }
  }
}
