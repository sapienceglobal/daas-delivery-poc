import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../models/analytics_model.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';

class AnalyticsProvider with ChangeNotifier {
  final SocketService? socketService;

  AnalyticsData? _data;
  bool _isLoading = false;
  String _error = '';
  int _selectedDays = 1; // default timeframe (Today)
  String? _specialTimeframe; // 'yesterday', 'custom'
  DateTime? _startDate;
  DateTime? _endDate;
  String? _restaurantId;

  AnalyticsProvider({this.socketService}) {
    _initSocketListeners();
  }

  void _initSocketListeners() {
    if (socketService == null) return;
    
    void handleUpdate(dynamic data) {
      if (_restaurantId != null) {
        // Trigger a silent re-fetch
        fetchAnalytics(_restaurantId!, silent: true);
      }
    }

    socketService!.on('new_order', handleUpdate);
    socketService!.on('order_updated', handleUpdate);
    socketService!.on('order_status_changed', handleUpdate);
  }

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
    bool silent = false,
  }) async {
    _restaurantId = restaurantId;
    if (days != null) _selectedDays = days;
    if (specialTimeframe != null) _specialTimeframe = specialTimeframe;
    if (startDate != null) _startDate = startDate;
    if (endDate != null) _endDate = endDate;

    if (!silent) {
      _isLoading = true;
      _error = '';
      notifyListeners();
    }

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
        if (!silent) _error = 'Failed to load analytics data';
      }
    } catch (e) {
      if (!silent) _error = e.toString();
    } finally {
      if (!silent) _isLoading = false;
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
