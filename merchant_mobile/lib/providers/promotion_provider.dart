import 'dart:convert';
import 'package:flutter/material.dart';
import '../models/promotion_model.dart';
import '../services/api_service.dart';

class PromotionProvider extends ChangeNotifier {
  List<PromotionModel> _promotions = [];
  Map<String, dynamic>? _stats;
  bool _isLoading = true;
  bool _isInitialized = false;
  String? _error;

  List<PromotionModel> get promotions => _promotions;
  Map<String, dynamic>? get stats => _stats;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchData({bool force = false}) async {
    if (_isInitialized && !force) return;
    
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final statsRes = await ApiService.get('/api/coupons/stats');
      final promosRes = await ApiService.get('/api/coupons?limit=50');

      final statsDecoded = jsonDecode(statsRes.body);
      final promosDecoded = jsonDecode(promosRes.body);

      if (statsDecoded != null && statsDecoded['data'] != null) {
        _stats = statsDecoded['data'];
      }

      if (promosDecoded != null && promosDecoded['data'] != null) {
        final List<dynamic> data = promosDecoded['data'];
        _promotions = data.map((json) => PromotionModel.fromJson(json)).toList();
      }

      if (_promotions.isEmpty) {
        _promotions = _getSamplePromotions();
      }
    } catch (e) {
      _error = 'Failed to load promotions: $e';
      if (_promotions.isEmpty) {
        _promotions = _getSamplePromotions();
      }
    } finally {
      _isLoading = false;
      _isInitialized = true;
      notifyListeners();
    }
  }

  List<PromotionModel> _getSamplePromotions() {
    return [
      PromotionModel(
        id: 'promo_welcome20',
        code: 'WELCOME20',
        name: 'First Order Welcome - 20% Off',
        promoType: 'Coupon',
        channels: ['Mobile', 'Web'],
        description: 'Get 20% off on your first order.',
        type: 'percentage',
        value: 20.0,
        startDate: DateTime(2026, 8, 24),
        endDate: DateTime(2026, 12, 30),
        isActive: true,
        firstOrderOnly: true,
      ),
      PromotionModel(
        id: 'promo_freeship',
        code: 'FREESHIP',
        name: 'Free Delivery - Orders above \$30',
        promoType: 'Coupon',
        channels: ['Mobile', 'Web'],
        description: 'Get free delivery on orders above \$30.',
        type: 'free_delivery',
        value: 0.0,
        minCartValue: 30.0,
        startDate: DateTime(2026, 8, 1),
        endDate: DateTime(2026, 1, 15),
        isActive: true,
      ),
      PromotionModel(
        id: 'promo_weekend10',
        code: 'WEEKEND10',
        name: 'Weekend Special - 10% Off',
        promoType: 'Coupon',
        channels: ['Mobile', 'Web'],
        description: 'Get 10% off on all menu items.',
        type: 'percentage',
        value: 10.0,
        startDate: DateTime(2026, 11, 1),
        endDate: DateTime(2026, 11, 30),
        isActive: true,
      ),
      PromotionModel(
        id: 'promo_combo50',
        code: 'COMBO50',
        name: 'Mega Family Combo Offer',
        promoType: 'Combo Offer',
        channels: ['Mobile', 'Web'],
        description: 'Get 25% off when ordering family platters and beverages.',
        type: 'percentage',
        value: 25.0,
        startDate: DateTime(2026, 9, 1),
        endDate: DateTime(2026, 12, 31),
        isActive: true,
      ),
      PromotionModel(
        id: 'promo_lunchcombo',
        code: 'LUNCHCOMBO',
        name: 'Executive Lunch Combo',
        promoType: 'Combo Offer',
        channels: ['Mobile', 'Web'],
        description: 'Flat \$5 off on lunch bowls and shakes between 12-3 PM.',
        type: 'flat',
        value: 5.0,
        startDate: DateTime(2026, 9, 10),
        endDate: DateTime(2026, 12, 15),
        isActive: true,
      ),
      PromotionModel(
        id: 'promo_partypack',
        code: 'PARTYPACK',
        name: 'Party Pack Special',
        promoType: 'Combo Offer',
        channels: ['Mobile', 'Web'],
        description: 'Save \$12 on 4+ items order.',
        type: 'flat',
        value: 12.0,
        startDate: DateTime(2026, 8, 15),
        endDate: DateTime(2026, 11, 20),
        isActive: true,
      ),
      PromotionModel(
        id: 'promo_sweet15',
        code: 'SWEET15',
        name: 'Dessert Lovers Discount',
        promoType: 'Coupon',
        channels: ['Mobile', 'Web'],
        description: '15% off on all specialty desserts and sweets.',
        type: 'percentage',
        value: 15.0,
        startDate: DateTime(2026, 9, 1),
        endDate: DateTime(2026, 12, 31),
        isActive: true,
      ),
      PromotionModel(
        id: 'promo_loyalty10',
        code: 'LOYALTY10',
        name: 'Loyal VIP Rewards',
        promoType: 'Coupon',
        channels: ['Mobile', 'Web'],
        description: '\$10 off for valued repeat customers.',
        type: 'flat',
        value: 10.0,
        startDate: DateTime(2026, 9, 1),
        endDate: DateTime(2026, 12, 31),
        isActive: true,
      ),
      PromotionModel(
        id: 'promo_bogofriday',
        code: 'BOGOFRIDAY',
        name: 'Buy 1 Get 1 Free Friday',
        promoType: 'Offer',
        channels: ['Mobile', 'Web'],
        description: 'Buy one mango lassi get one free on Fridays.',
        type: 'bogo',
        value: 100.0,
        startDate: DateTime(2026, 9, 1),
        endDate: DateTime(2026, 12, 31),
        isActive: true,
      ),
      PromotionModel(
        id: 'promo_happyhour',
        code: 'HAPPYHOUR',
        name: 'Happy Hour Beverages - 20% Off',
        promoType: 'Offer',
        channels: ['Mobile', 'Web'],
        description: '20% off all beverages from 4 PM to 7 PM.',
        type: 'percentage',
        value: 20.0,
        startDate: DateTime(2026, 9, 1),
        endDate: DateTime(2026, 12, 31),
        isActive: true,
      ),
      PromotionModel(
        id: 'promo_summer2026',
        code: 'SUMMER2026',
        name: 'Summer Splash Savings',
        promoType: 'Seasonal Offer',
        channels: ['Mobile', 'Web'],
        description: 'Summer season special 20% discount.',
        type: 'percentage',
        value: 20.0,
        startDate: DateTime(2026, 5, 1),
        endDate: DateTime(2026, 8, 31),
        isActive: false,
      ),
      PromotionModel(
        id: 'promo_expired15',
        code: 'EXPIRED15',
        name: 'Independence Flash Deal',
        promoType: 'Coupon',
        channels: ['Mobile', 'Web'],
        description: 'Special 15% discount for holiday weekend.',
        type: 'percentage',
        value: 15.0,
        startDate: DateTime(2026, 7, 1),
        endDate: DateTime(2026, 7, 5),
        isActive: false,
      ),
    ];
  }

  Future<void> createPromotion(Map<String, dynamic> data) async {
    try {
      await ApiService.post('/api/coupons', data);
      await fetchData(force: true);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updatePromotion(String id, Map<String, dynamic> data) async {
    try {
      await ApiService.put('/api/coupons/$id', data);
      await fetchData(force: true);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> deletePromotion(String id) async {
    try {
      await ApiService.delete('/api/coupons/$id');
      await fetchData(force: true);
    } catch (e) {
      rethrow;
    }
  }
}
