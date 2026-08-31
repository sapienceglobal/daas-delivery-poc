import 'dart:convert';
import 'package:flutter/material.dart';
import '../models/menu_model.dart';
import '../services/api_service.dart';

class MenuProvider extends ChangeNotifier {
  List<CategoryModel> _categories = [];
  bool _isLoading = true;
  bool _isInitialized = false;
  String? _error;
  String? _restaurantId;
  double _taxRate = 0.0;
  String _taxType = 'Taxes & Charges';
  double _serviceCharge = 0.0;
  double _packagingCharge = 0.0;
  bool _roundOff = false;

  List<CategoryModel> get categories => _categories;
  bool get isLoading => _isLoading;
  bool get isInitialized => _isInitialized;
  String? get error => _error;
  String? get restaurantId => _restaurantId;
  double get taxRate => _taxRate;
  String get taxType => _taxType;
  double get serviceCharge => _serviceCharge;
  double get packagingCharge => _packagingCharge;
  bool get roundOff => _roundOff;

  MenuProvider() {
    _initRestaurantId();
  }

  Future<void> _initRestaurantId() async {
    try {
      final res = await ApiService.get('/api/restaurants/merchant/my');
      final decoded = jsonDecode(res.body);
      if (decoded != null && decoded['data'] != null) {
        _restaurantId = decoded['data']['_id'];
        _taxRate = (decoded['data']['taxRate'] ?? 0.0).toDouble();
        _taxType = decoded['data']['taxType'] ?? 'Taxes & Charges';
        _serviceCharge = (decoded['data']['serviceCharge'] ?? 0.0).toDouble();
        _packagingCharge = (decoded['data']['packagingCharge'] ?? 0.0).toDouble();
        _roundOff = decoded['data']['roundOff'] ?? false;
        fetchMenu();
      }
    } catch (e) {
      _error = 'Could not fetch restaurant profile';
      notifyListeners();
    }
  }

  Future<void> fetchMenu({bool force = false}) async {
    if (_isInitialized && !force) return;
    if (_restaurantId == null) return;
    
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.get('/api/menu/restaurant/$_restaurantId');
      final decoded = jsonDecode(response.body);
      if (decoded != null && decoded['data'] != null) {
        final List<dynamic> data = decoded['data'];
        _categories = data.map((json) => CategoryModel.fromJson(json)).toList();
      }
    } catch (e) {
      _error = 'Failed to load menu: $e';
    } finally {
      _isLoading = false;
      _isInitialized = true;
      notifyListeners();
    }
  }

  // --- Category CRUD ---
  Future<void> addCategory(String name) async {
    try {
      await ApiService.post('/api/menu/categories', {'name': name});
      await fetchMenu(force: true);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updateCategory(String id, String name) async {
    try {
      await ApiService.put('/api/menu/categories/$id', {'name': name});
      await fetchMenu(force: true);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> deleteCategory(String id) async {
    try {
      await ApiService.delete('/api/menu/categories/$id');
      await fetchMenu(force: true);
    } catch (e) {
      rethrow;
    }
  }

  // --- Item CRUD ---
  Future<void> addMenuItem(MenuItemModel item) async {
    try {
      final payload = item.toJson();
      if (_restaurantId != null) {
        payload['restaurantId'] = _restaurantId;
      }
      await ApiService.post('/api/menu/items', payload);
      await fetchMenu(force: true);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updateMenuItem(String itemId, MenuItemModel updatedItem) async {
    try {
      final payload = updatedItem.toJson();
      if (_restaurantId != null) {
        payload['restaurantId'] = _restaurantId;
      }
      await ApiService.put('/api/menu/items/$itemId', payload);
      await fetchMenu(force: true);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> toggleItemAvailability(String itemId, bool isAvailable) async {
    try {
      await ApiService.patch('/api/menu/items/$itemId/toggle', {'isAvailable': isAvailable});
      await fetchMenu(force: true);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> deleteMenuItem(String itemId) async {
    try {
      await ApiService.delete('/api/menu/items/$itemId');
      await fetchMenu(force: true);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> moveItemToCategory(String itemId, String newCategoryId) async {
    try {
      MenuItemModel? itemToMove;
      String? oldCategoryId;
      
      // Find item and remove from old category
      for (int i = 0; i < _categories.length; i++) {
        final itemIndex = _categories[i].items.indexWhere((it) => it.id == itemId);
        if (itemIndex != -1) {
          itemToMove = _categories[i].items[itemIndex];
          oldCategoryId = _categories[i].id;
          _categories[i].items.removeAt(itemIndex);
          break;
        }
      }

      if (itemToMove == null || oldCategoryId == newCategoryId) return;

      // Update item model
      final updatedItem = itemToMove.copyWith(categoryId: newCategoryId);
      
      // Add to new category locally (optimistic)
      final newCatIndex = _categories.indexWhere((c) => c.id == newCategoryId);
      if (newCatIndex != -1) {
        _categories[newCatIndex].items.add(updatedItem);
        notifyListeners();
      }

      // API call
      await ApiService.put('/api/menu/items/$itemId', {'categoryId': newCategoryId});
      
    } catch (e) {
      // Revert if failed
      fetchMenu();
      rethrow;
    }
  }
}
