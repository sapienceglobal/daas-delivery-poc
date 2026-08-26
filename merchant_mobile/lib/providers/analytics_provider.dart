import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../models/analytics_model.dart';
import '../services/api_service.dart';

class AnalyticsProvider with ChangeNotifier {
  AnalyticsData? _data;
  bool _isLoading = false;
  String _error = '';
  int _selectedDays = 1; // default timeframe (Today)

  AnalyticsData? get data => _data;
  bool get isLoading => _isLoading;
  String get error => _error;
  int get selectedDays => _selectedDays;

  Future<void> fetchAnalytics(String restaurantId, {int? days}) async {
    if (days != null) {
      _selectedDays = days;
    }

    _isLoading = true;
    _error = '';
    notifyListeners();

    try {
      final endpoint = '/api/analytics/restaurant/$restaurantId?days=$_selectedDays';
      final response = await ApiService.get(endpoint);
      final jsonResponse = json.decode(response.body);

      if (jsonResponse['success'] == true && jsonResponse['data'] != null) {
        _data = AnalyticsData.fromJson(jsonResponse['data']);
      } else {
        _error = 'Failed to load analytics data';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void setSelectedDays(int days, String restaurantId) {
    if (_selectedDays != days) {
      fetchAnalytics(restaurantId, days: days);
    }
  }
}
