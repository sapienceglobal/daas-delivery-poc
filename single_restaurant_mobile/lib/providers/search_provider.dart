import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:single_restaurant_mobile/services/restaurant_service.dart';

class SearchProvider with ChangeNotifier {
  final RestaurantService _restaurantService = RestaurantService();
  
  List<dynamic> _searchResults = [];
  bool _isLoading = false;
  String? _error;
  
  List<String> _recentSearches = [];

  /// Splits real menu items into "popular" (grid) and "trending" (list)
  /// sections. Bestsellers come first, then highest priced items.
  static List<dynamic> rankMenuItems(List<dynamic> menu) {
    final items = <dynamic>[];
    final seen = <String>{};
    for (final category in menu) {
      final list = category is Map ? category['items'] : null;
      if (list is! List) continue;
      for (final item in list) {
        if (item is! Map || item['isAvailable'] == false) continue;
        final name = (item['name'] ?? '').toString().toLowerCase().trim();
        if (name.isEmpty || name.contains('water') || !seen.add(name)) continue;
        items.add(item);
      }
    }
    double price(dynamic i) =>
        double.tryParse(i['price']?.toString() ?? '0') ?? 0.0;
    items.sort((a, b) {
      final aBest = a['isBestseller'] == true ? 0 : 1;
      final bBest = b['isBestseller'] == true ? 0 : 1;
      if (aBest != bBest) return aBest.compareTo(bBest);
      return price(b).compareTo(price(a));
    });
    return items;
  }

  List<dynamic> get searchResults => _searchResults;
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<String> get recentSearches => _recentSearches;

  SearchProvider() {
    _loadRecentSearches();
  }

  Future<void> _loadRecentSearches() async {
    final prefs = await SharedPreferences.getInstance();
    _recentSearches = prefs.getStringList('recent_searches') ?? [];
    notifyListeners();
  }

  Future<void> _saveRecentSearch(String query) async {
    if (query.trim().isEmpty) return;
    
    // Remove if already exists to move it to the top
    _recentSearches.remove(query);
    _recentSearches.insert(0, query);
    
    // Keep only last 10 searches
    if (_recentSearches.length > 10) {
      _recentSearches = _recentSearches.sublist(0, 10);
    }
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList('recent_searches', _recentSearches);
    notifyListeners();
  }
  
  Future<void> clearRecentSearches() async {
    _recentSearches.clear();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('recent_searches');
    notifyListeners();
  }
  
  void removeRecentSearch(String query) async {
    _recentSearches.remove(query);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList('recent_searches', _recentSearches);
    notifyListeners();
  }

  Future<void> search(String query) async {
    if (query.trim().isEmpty) {
      _searchResults = [];
      notifyListeners();
      return;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    await _saveRecentSearch(query.trim());

    try {
      final data = await _restaurantService.searchMenu(query);
      if (data != null) {
        _searchResults = data;
      } else {
        _error = 'Failed to load search results';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  void clearSearch() {
    _searchResults = [];
    _error = null;
    notifyListeners();
  }
}
