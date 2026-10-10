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
        final rawMenu = List<dynamic>.from(data['menu'] ?? []);
        rawMenu.sort((a, b) => categorySortIndex(a).compareTo(categorySortIndex(b)));
        _menu = rawMenu;
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

  /// Canonical sort priority index for the 13 restaurant categories
  static int categorySortIndex(dynamic category) {
    if (category is Map) {
      if (category['sortOrder'] != null) {
        final so = int.tryParse(category['sortOrder'].toString());
        if (so != null && so > 0) return so;
      }
      final name = (category['name'] ?? '').toString().toLowerCase().trim();
      if (name.contains('non') && name.contains('appetizer')) return 2;
      if (name.contains('appetizer') || name.contains('snack')) return 1;
      if (name.contains('non') && (name.contains('main') || name.contains('course'))) return 4;
      if (name.contains('veg') && (name.contains('main') || name.contains('course'))) return 3;
      if (name.contains('amritsar') || name.contains('kulcha')) return 5;
      if (name.contains('thali')) return 6;
      if (name.contains('combo')) return 7;
      if (name.contains('rice') || name.contains('biryani')) return 8;
      if (name.contains('naan') || name.contains('roti') || name.contains('bread')) return 9;
      if (name.contains('dessert') || name.contains('sweet')) return 10;
      if (name.contains('paratha')) return 11;
      if (name.contains('momo')) return 12;
      if (name.contains('beverage') ||
          name.contains('drink') ||
          name.contains('lassi') ||
          name.contains('chai')) {
        return 13;
      }
    }
    return 999;
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
