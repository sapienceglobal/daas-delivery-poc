import 'dart:convert';
import 'package:single_restaurant_mobile/services/api_service.dart';

class PaymentService {
  Future<Map<String, dynamic>?> createIntent(double amount, Map<String, dynamic> checkoutData) async {
    try {
      final response = await ApiService.post('/api/payments/create-intent', {
        'amount': amount,
        'checkoutData': checkoutData,
      });
      
      final data = json.decode(response.body);
      return data['data'] ?? data; // Depending on backend wrapper
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>?> createSetupIntent() async {
    try {
      final response = await ApiService.post('/api/payments/create-setup-intent', {});
      final data = json.decode(response.body);
      return data['data'] ?? data;
    } catch (e) {
      rethrow;
    }
  }
}
