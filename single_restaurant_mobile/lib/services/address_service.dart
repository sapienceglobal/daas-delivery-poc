import 'dart:convert';
import 'package:single_restaurant_mobile/services/api_service.dart';

class AddressService {
  Future<List<dynamic>?> getAddresses() async {
    try {
      final response = await ApiService.get('/api/auth/me');
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['data']['savedAddresses'];
      }
      return null;
    } catch (e) {
      print('Error fetching addresses: $e');
      return null;
    }
  }

  Future<bool> addAddress(Map<String, dynamic> addressData) async {
    try {
      final response = await ApiService.post('/api/auth/me/addresses', addressData);
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      print('Error adding address: $e');
      return false;
    }
  }

  Future<bool> editAddress(String addressId, Map<String, dynamic> addressData) async {
    try {
      final response = await ApiService.put('/api/auth/me/addresses/$addressId', addressData);
      return response.statusCode == 200;
    } catch (e) {
      print('Error editing address: $e');
      return false;
    }
  }

  Future<bool> deleteAddress(String addressId) async {
    try {
      final response = await ApiService.delete('/api/auth/me/addresses/$addressId');
      return response.statusCode == 200;
    } catch (e) {
      print('Error deleting address: $e');
      return false;
    }
  }

  Future<bool> setDefaultAddress(String addressId) async {
    try {
      final response = await ApiService.patch('/api/auth/me/addresses/$addressId/default', {});
      return response.statusCode == 200;
    } catch (e) {
      print('Error setting default address: $e');
      return false;
    }
  }
}
