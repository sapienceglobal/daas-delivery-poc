import 'dart:convert';
import 'package:single_restaurant_mobile/services/api_service.dart';

class LoyaltyService {
  Future<Map<String, dynamic>?> getLoyaltyHistory({int page = 1, int limit = 20}) async {
    try {
      final response = await ApiService.get('/api/loyalty/history?page=$page&limit=$limit');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data; // contains { success: true, data: [...], currentBalance: ..., pagination: ... }
      }
      return null;
    } catch (e) {
      print('Error fetching loyalty history: $e');
      return null;
    }
  }
}
