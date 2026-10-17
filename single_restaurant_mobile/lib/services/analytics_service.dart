import 'package:flutter/foundation.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AnalyticsService {
  static final AnalyticsService _instance = AnalyticsService._internal();
  factory AnalyticsService() => _instance;
  AnalyticsService._internal();

  final FirebaseAnalytics _analytics = FirebaseAnalytics.instance;

  DateTime? _lastBeginCheckoutTime;

  /// Helper: converts any cart or order item Map into a standard GA4 AnalyticsEventItem
  AnalyticsEventItem _toAnalyticsItem(dynamic rawItem) {
    if (rawItem is! Map) {
      return AnalyticsEventItem(itemName: 'Food Item', quantity: 1);
    }

    final item = Map<String, dynamic>.from(rawItem);
    final id = (item['menuItemId'] ?? item['_id'] ?? item['id'] ?? '').toString();
    final name = (item['name'] ?? item['title'] ?? 'Food Item').toString();
    final category = (item['category'] ?? item['categoryName'] ?? item['category_id'] ?? '').toString();
    final qty = (item['quantity'] ?? item['qty'] ?? 1) as int;

    // Calculate base + add-on price
    final basePrice = (item['selectedSize']?['price'] ?? item['price'] ?? 0.0) as num;
    double addonsTotal = 0.0;
    if (item['addOns'] != null && item['addOns'] is List) {
      for (var a in item['addOns']) {
        if (a is Map) {
          addonsTotal += ((a['price'] as num?) ?? 0.0).toDouble();
        }
      }
    }
    final unitPrice = (basePrice + addonsTotal).toDouble();

    return AnalyticsEventItem(
      itemId: id.isNotEmpty ? id : null,
      itemName: name,
      itemCategory: category.isNotEmpty ? category : null,
      price: unitPrice > 0 ? unitPrice : null,
      quantity: qty > 0 ? qty : 1,
    );
  }

  /// 1. Triggered when customer adds food item to cart
  Future<void> logAddToCart({
    required Map<String, dynamic> item,
    int quantity = 1,
  }) async {
    try {
      final analyticsItem = _toAnalyticsItem(item);
      final price = (analyticsItem.price ?? 0.0).toDouble();
      final totalValue = (price * quantity).toDouble();

      await _analytics.logAddToCart(
        items: [analyticsItem],
        value: totalValue > 0 ? totalValue : null,
        currency: 'USD',
      );

      debugPrint('📊 [Analytics] logAddToCart -> ${analyticsItem.itemName} x$quantity (\$$totalValue)');
    } catch (e) {
      debugPrint('⚠️ [Analytics] logAddToCart error: $e');
    }
  }

  /// 2. Triggered when customer begins checkout
  Future<void> logBeginCheckout({
    required List<dynamic> items,
    required double value,
  }) async {
    try {
      final now = DateTime.now();
      if (_lastBeginCheckoutTime != null &&
          now.difference(_lastBeginCheckoutTime!) < const Duration(seconds: 10)) {
        return; // Debounce rapid triggers
      }
      _lastBeginCheckoutTime = now;

      final analyticsItems = items.map(_toAnalyticsItem).toList();

      await _analytics.logBeginCheckout(
        items: analyticsItems.isNotEmpty ? analyticsItems : null,
        value: value > 0 ? value : null,
        currency: 'USD',
      );

      debugPrint('📊 [Analytics] logBeginCheckout -> ${analyticsItems.length} items, total: \$$value');
    } catch (e) {
      debugPrint('⚠️ [Analytics] logBeginCheckout error: $e');
    }
  }

  /// 3. Triggered when order is successfully placed (Deduplicated strictly once per orderId)
  Future<void> logPurchase({
    required String orderId,
    required double value,
    required List<dynamic> items,
    String currency = 'USD',
  }) async {
    final cleanId = orderId.trim();
    if (cleanId.isEmpty) return;

    try {
      final prefs = await SharedPreferences.getInstance();
      final dedupeKey = 'analytics_purchased_$cleanId';

      if (prefs.getBool(dedupeKey) == true) {
        debugPrint('ℹ️ [Analytics] Purchase already logged for order $cleanId, skipping duplicate.');
        return;
      }

      final analyticsItems = items.map(_toAnalyticsItem).toList();

      await _analytics.logPurchase(
        transactionId: cleanId,
        value: value > 0 ? value : null,
        currency: currency,
        items: analyticsItems.isNotEmpty ? analyticsItems : null,
      );

      await prefs.setBool(dedupeKey, true);
      debugPrint('🎉 [Analytics] logPurchase fired -> orderId: $cleanId, value: \$$value, items: ${analyticsItems.length}');
    } catch (e) {
      debugPrint('⚠️ [Analytics] logPurchase error: $e');
    }
  }
}
