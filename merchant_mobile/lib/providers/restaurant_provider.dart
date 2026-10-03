import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class RestaurantProvider with ChangeNotifier {
  Map<String, dynamic>? _restaurant;
  bool _isLoading = false;
  String _error = '';

  Map<String, dynamic>? get restaurant => _restaurant;
  bool get isLoading => _isLoading;
  String get error => _error;

  Future<void> fetchMyRestaurant() async {
    _isLoading = true;
    _error = '';
    notifyListeners();

    try {
      final response = await ApiService.get('/api/restaurants/merchant/my');
      final jsonResponse = jsonDecode(response.body);

      if (response.statusCode == 200 && jsonResponse['success'] == true) {
        _restaurant = jsonResponse['data'];
      } else {
        _error = jsonResponse['message'] ?? 'Failed to load restaurant data';
      }
    } catch (e) {
      _error = 'Error loading restaurant: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateRestaurant(String id, Map<String, dynamic> updatePayload) async {
    _isLoading = true;
    _error = '';
    notifyListeners();

    try {
      final response = await ApiService.put('/api/restaurants/$id', updatePayload);
      final jsonResponse = jsonDecode(response.body);

      if (response.statusCode == 200 && jsonResponse['success'] == true) {
        _restaurant = jsonResponse['data'];
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = jsonResponse['message'] ?? 'Failed to update restaurant data';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Error updating restaurant: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateHours(String id, Map<String, dynamic> hoursPayload) async {
    _isLoading = true;
    _error = '';
    notifyListeners();

    try {
      final response = await ApiService.put('/api/restaurants/$id/hours', hoursPayload);
      final jsonResponse = jsonDecode(response.body);

      if (response.statusCode == 200 && jsonResponse['success'] == true) {
        _restaurant = jsonResponse['data'];
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = jsonResponse['message'] ?? 'Failed to update hours';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Error updating hours: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
}
