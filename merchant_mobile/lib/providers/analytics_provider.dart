import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../models/analytics_model.dart';
import '../services/api_service.dart';

class AnalyticsProvider with ChangeNotifier {
  AnalyticsData? _data;
  bool _isLoading = false;
  String _error = '';
  int _selectedDays = 1; // default timeframe (Today)
  String? _specialTimeframe; // 'yesterday', 'custom'
  DateTime? _startDate;
  DateTime? _endDate;

  AnalyticsData? get data => _data;
  bool get isLoading => _isLoading;
  String get error => _error;
  int get selectedDays => _selectedDays;
  String? get specialTimeframe => _specialTimeframe;
  DateTime? get customStartDate => _startDate;
  DateTime? get customEndDate => _endDate;

  Future<void> fetchAnalytics(
    String restaurantId, {
    int? days,
    String? specialTimeframe,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    if (days != null) _selectedDays = days;
    if (specialTimeframe != null) _specialTimeframe = specialTimeframe;
    if (startDate != null) _startDate = startDate;
    if (endDate != null) _endDate = endDate;

    _isLoading = true;
    _error = '';
    notifyListeners();

    try {
      String endpoint = '/api/analytics/restaurant/$restaurantId?';
      if (_specialTimeframe == 'custom' && _startDate != null && _endDate != null) {
        endpoint += 'startDate=${_startDate!.toIso8601String().split('T')[0]}&endDate=${_endDate!.toIso8601String().split('T')[0]}';
      } else if (_specialTimeframe == 'yesterday') {
        endpoint += 'days=yesterday';
      } else {
        endpoint += 'days=$_selectedDays';
      }

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
    _specialTimeframe = null;
    if (_selectedDays != days) {
      fetchAnalytics(restaurantId, days: days);
    } else {
      fetchAnalytics(restaurantId); // force refresh if switching from custom
    }
  }

  void setSpecialTimeframe(String timeframe, String restaurantId, {DateTime? startDate, DateTime? endDate}) {
    _specialTimeframe = timeframe;
    if (startDate != null) _startDate = startDate;
    if (endDate != null) _endDate = endDate;
    fetchAnalytics(restaurantId);
  }
}
