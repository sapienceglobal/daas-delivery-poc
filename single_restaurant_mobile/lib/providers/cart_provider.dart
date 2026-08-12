import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/services/cart_service.dart';

class CartProvider with ChangeNotifier, WidgetsBindingObserver {
  final CartService _cartService = CartService();
  
  CartProvider() {
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // Refresh cart from server when app comes back to foreground
      // to keep it in sync with any changes made on the website
      loadCart();
    }
  }
  
  List<dynamic> _items = [];
  Map<String, dynamic>? _restaurant;
  String _specialInstructions = '';
  
  bool _isLoading = false;
  String? _error;
  
  Timer? _debounceTimer;

  List<dynamic> get items => _items;
  Map<String, dynamic>? get restaurant => _restaurant;
  String get specialInstructions => _specialInstructions;
  bool get isLoading => _isLoading;
  String? get error => _error;

  int get itemCount => _items.fold(0, (sum, item) => sum + ((item['quantity'] ?? item['qty'] ?? 0) as int));

  double get subtotal {
    double total = 0.0;
    for (var item in _items) {
      final qty = (item['quantity'] ?? item['qty'] ?? 1) as int;
      final basePrice = (item['selectedSize']?['price'] ?? item['price'] ?? 0.0) as num;
      double addonsTotal = 0.0;
      if (item['addOns'] != null) {
        for (var addon in item['addOns']) {
          addonsTotal += (addon['price'] ?? 0.0) as num;
        }
      }
      total += (basePrice + addonsTotal) * qty;
    }
    return total;
  }
  
  double get tax {
    final rawTaxRate = (_restaurant?['taxRate'] as num?)?.toDouble() ?? 8.875;
    final taxRateMultiplier = rawTaxRate < 1 ? rawTaxRate : (rawTaxRate / 100);
    return subtotal * taxRateMultiplier;
  }

  double get deliveryFee => subtotal > 0 ? ((_restaurant?['deliveryFee'] as num?)?.toDouble() ?? 2.99) : 0.0;
  double get platformFee => subtotal > 0 ? 2.0 : 0.0;
  
  double get serviceFee {
    if (subtotal <= 0) return 0.0;
    final rawServiceCharge = (_restaurant?['serviceCharge'] as num?)?.toDouble() ?? 3.0;
    final serviceChargeMultiplier = rawServiceCharge < 1 ? rawServiceCharge : (rawServiceCharge / 100);
    return double.parse((subtotal * serviceChargeMultiplier).toStringAsFixed(2));
  }
  
  double get packagingFee => subtotal > 0 ? ((_restaurant?['packagingCharge'] as num?)?.toDouble() ?? 0.0) : 0.0;
  
  double get total {
    if (subtotal <= 0) return 0.0;
    double t = subtotal + tax + deliveryFee + platformFee + serviceFee + packagingFee;
    if (_restaurant?['roundOff'] == true) {
      t = t.roundToDouble();
    }
    return t;
  }

  // Initial load
  Future<void> loadCart() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _cartService.getCart();
      if (data != null) {
        final serverItems = data['items'] ?? [];
        
        if (serverItems.isEmpty && _items.isNotEmpty) {
          // If server is empty but we have local items (added as guest before login),
          // sync local items up to the server instead of wiping them out.
          _triggerSync();
        } else {
          // Server cart wins
          _items = serverItems;
          final rest = data['restaurant'];
          if (rest != null && rest['_id'] == null && rest['id'] == null) {
            _restaurant = null;
          } else {
            _restaurant = rest;
          }
          _specialInstructions = data['specialInstructions'] ?? '';
        }
      } else {
        // Fallback: don't wipe local items if request failed silently, just keep them.
        if (_items.isEmpty) {
          _items = [];
          _restaurant = null;
          _specialInstructions = '';
        }
      }
    } catch (e) {
      _error = 'Failed to load cart';
      // Do not clear the cart on error, so user doesn't lose items on network blip
    }

    _isLoading = false;
    notifyListeners();
  }

  void addItem(Map<String, dynamic> item, {Map<String, dynamic>? restaurantData}) {
    if (restaurantData != null && (_restaurant == null || (_restaurant?['_id'] == null && _restaurant?['id'] == null))) {
      _restaurant = restaurantData;
    }

    // Attempt to find existing item with exact match
    final targetId = item['menuItemId'] ?? item['_id'] ?? item['id'];
    final existingIdx = _items.indexWhere((i) {
      final iId = i['menuItemId'] ?? i['_id'] ?? i['id'];
      final sameId = (targetId != null && iId == targetId);
      final sameSize = i['selectedSize']?['name'] == item['selectedSize']?['name'];
      
      // Basic addon check (can be improved)
      final addons1 = (i['addOns'] ?? []).map((e) => e['name']).toList()..sort();
      final addons2 = (item['addOns'] ?? []).map((e) => e['name']).toList()..sort();
      final sameAddons = listEquals(addons1, addons2);
      
      return sameId && sameSize && sameAddons;
    });

    final addedQty = (item['quantity'] ?? item['qty'] ?? 1) as int;

    if (existingIdx > -1) {
      final existingItem = Map<String, dynamic>.from(_items[existingIdx]);
      final currentQty = (existingItem['quantity'] ?? existingItem['qty'] ?? 1) as int;
      final newQty = currentQty + addedQty;
      
      final basePrice = (existingItem['selectedSize']?['price'] ?? existingItem['price'] ?? 0.0) as num;
      double addonsTotal = 0.0;
      if (existingItem['addOns'] != null) {
        for (var addon in existingItem['addOns']) {
          addonsTotal += (addon['price'] ?? 0.0) as num;
        }
      }
      
      existingItem['quantity'] = newQty;
      existingItem['qty'] = newQty;
      existingItem['lineTotal'] = (basePrice + addonsTotal) * newQty;
      
      _items[existingIdx] = existingItem;
    } else {
      final newItem = Map<String, dynamic>.from(item);
      newItem['menuItemId'] = targetId;
      newItem['quantity'] = addedQty;
      newItem['qty'] = addedQty;
      
      final basePrice = (newItem['selectedSize']?['price'] ?? newItem['price'] ?? 0.0) as num;
      double addonsTotal = 0.0;
      if (newItem['addOns'] != null) {
        for (var addon in newItem['addOns']) {
          addonsTotal += (addon['price'] ?? 0.0) as num;
        }
      }
      
      newItem['lineTotal'] = (basePrice + addonsTotal) * addedQty;
      _items.add(newItem);
    }

    notifyListeners();
    _triggerSync();
  }

  void updateQuantity(int index, int newQuantity) {
    if (index < 0 || index >= _items.length) return;

    if (newQuantity < 1) {
      removeItem(index);
      return;
    }

    final item = Map<String, dynamic>.from(_items[index]);
    item['quantity'] = newQuantity;
    item['qty'] = newQuantity;
    
    final basePrice = (item['selectedSize']?['price'] ?? item['price'] ?? 0.0) as num;
    double addonsTotal = 0.0;
    if (item['addOns'] != null) {
      for (var addon in item['addOns']) {
        addonsTotal += (addon['price'] ?? 0.0) as num;
      }
    }
    item['lineTotal'] = (basePrice + addonsTotal) * newQuantity;
    
    _items[index] = item;
    notifyListeners();
    _triggerSync();
  }

  void removeItem(int index) {
    if (index >= 0 && index < _items.length) {
      _items.removeAt(index);
      if (_items.isEmpty) {
        _restaurant = null;
      }
      notifyListeners();
      _triggerSync();
    }
  }

  Future<void> clearCart() async {
    _items = [];
    _restaurant = null;
    _specialInstructions = '';
    notifyListeners();
    
    _debounceTimer?.cancel();
    await _cartService.clearCart();
  }

  // Sync to backend automatically after changes
  void _triggerSync() {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      _cartService.updateCart(_items, _restaurant, _specialInstructions);
    });
  }

  void setSpecialInstructions(String val) {
    if (_specialInstructions != val) {
      _specialInstructions = val;
      notifyListeners();
      _triggerSync();
    }
  }
}
