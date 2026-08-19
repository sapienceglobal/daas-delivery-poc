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
          if (item['isAvailable'] != false) {
            String name = (item['name'] ?? '').toString().toLowerCase();
            // Aggressively exclude boring items like water and tea from the signature section
            if (!name.contains('water') && !name.contains('tea')) {
              items.add(item);
            }
          }
        }
      }
    }

    // 1. Try to get actual bestsellers
    List<dynamic> bestsellers = items.where((i) => i['isBestseller'] == true).toList();

    // 2. If not enough bestsellers, pick the highest priced premium items
    if (bestsellers.length < 6) {
      List<dynamic> others = items.where((i) => i['isBestseller'] != true).toList();
      
      // Sort others by price descending
      others.sort((a, b) {
        double priceA = double.tryParse(a['price']?.toString() ?? '0') ?? 0.0;
        double priceB = double.tryParse(b['price']?.toString() ?? '0') ?? 0.0;
        return priceB.compareTo(priceA);
      });
      
      bestsellers.addAll(others);
    }

    return bestsellers.take(6).toList();
  }
}
