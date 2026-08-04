import 'dart:convert';
import 'package:single_restaurant_mobile/services/api_service.dart';

class LoyaltyService {
  Future<Map<String, dynamic>?> getLoyaltyHistory({int page = 1, int limit = 20}) async {
    try {
      final response = await ApiService.get('/api/loyalty/history?page=$page&limit=$limit');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data; 
      }
      return null;
    } catch (e) {
      print('Error fetching loyalty history: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>> joinProgram() async {
    try {
      final response = await ApiService.post('/api/loyalty/join', {});
      if (response.statusCode == 201 || response.statusCode == 200) {
        return json.decode(response.body);
      }
      return {'success': false, 'message': 'Failed to join program'};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> earnPoints(String action) async {
    try {
      final response = await ApiService.post('/api/loyalty/earn', {'action': action});
      final data = json.decode(response.body);
      if (response.statusCode == 200) {
        return data;
      }
      return {'success': false, 'message': data['message'] ?? 'Failed to earn points'};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> redeemPoints(int points, int expectedDiscount) async {
    try {
      final response = await ApiService.post('/api/loyalty/redeem', {
        'points': points,
        'expectedDiscount': expectedDiscount,
      });
      final data = json.decode(response.body);
      if (response.statusCode == 200) {
        return data;
      }
      return {'success': false, 'message': data['message'] ?? 'Failed to redeem points'};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<List<dynamic>> getMyCoupons() async {
    try {
      final response = await ApiService.get('/api/loyalty/my-coupons');
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return (data['data'] as List<dynamic>?) ?? [];
      }
      return [];
    } catch (e) {
      return [];
    }
  }
}
