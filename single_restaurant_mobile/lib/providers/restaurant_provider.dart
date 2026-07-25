import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/services/restaurant_service.dart';

class RestaurantProvider with ChangeNotifier {
  final RestaurantService _restaurantService = RestaurantService();
  
  Map<String, dynamic>? _restaurant;
  List<dynamic> _menu = [];
  bool _isLoading = false;
  String? _error;

  Map<String, dynamic>? get restaurant => _restaurant;
  List<dynamic> get menu => _menu;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchRestaurantData() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _restaurantService.getRestaurantDetails();
      if (data != null) {
        _restaurant = data;
        _menu = data['menu'] ?? [];
      } else {
        _error = 'Failed to load restaurant data';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Helper to extract signature dishes from menu items
  List<dynamic> getSignatureDishes() {
    List<dynamic> items = [];
    for (var category in _menu) {
      if (category['items'] != null) {
        for (var item in category['items']) {
          if (item['isAvailable'] == true) {
            items.add(item);
          }
        }
      }
    }
    // Simple logic: return top 5 items, or randomly select, or rely on a popular flag
    // For now, returning first 5 available items
    return items.take(5).toList();
  }
}
