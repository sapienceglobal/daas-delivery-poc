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
      final promosRes = await ApiService.get('/api/coupons');

      final statsDecoded = jsonDecode(statsRes.body);
      final promosDecoded = jsonDecode(promosRes.body);

      if (statsDecoded != null && statsDecoded['data'] != null) {
        _stats = statsDecoded['data'];
      }

      if (promosDecoded != null && promosDecoded['data'] != null) {
        final List<dynamic> data = promosDecoded['data'];
        _promotions = data.map((json) => PromotionModel.fromJson(json)).toList();
      }
    } catch (e) {
      _error = 'Failed to load promotions: $e';
    } finally {
      _isLoading = false;
      _isInitialized = true;
      notifyListeners();
    }
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
