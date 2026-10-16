import 'dart:convert';
import 'dart:async';
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

  // Request sequencing & debounce guards
  int _fetchRequestId = 0;
  int _reportsFetchRequestId = 0;
  Timer? _socketDebounceTimer;

  AnalyticsProvider({this.socketService}) {
    _initSocketListeners();
  }

  // --- Reports & Analytics Screen Independent State ---
  AnalyticsData? _reportsData;
  bool _isReportsLoading = false;
  String _reportsError = '';
  int _reportsDays = 30;
  String? _reportsSpecialTimeframe = 'all'; // Default for Analytics screen is All Time
  DateTime? _reportsStartDate;
  DateTime? _reportsEndDate;

  AnalyticsData? get reportsData => _reportsData;
  bool get isReportsLoading => _isReportsLoading;
  String get reportsError => _reportsError;
  int get reportsDays => _reportsDays;
  String? get reportsSpecialTimeframe => _reportsSpecialTimeframe;
  DateTime? get reportsStartDate => _reportsStartDate;
  DateTime? get reportsEndDate => _reportsEndDate;

  void _initSocketListeners() {
    if (socketService == null) return;
    
    void handleUpdate(dynamic data) {
      if (_restaurantId != null) {
        // Industry-level: Debounce socket updates (e.g. status transitions, multiple new items)
        // so 10 socket events in 2 seconds only trigger ONE single analytics fetch.
        _socketDebounceTimer?.cancel();
        _socketDebounceTimer = Timer(const Duration(milliseconds: 2500), () {
          if (_restaurantId != null) {
            fetchAnalytics(_restaurantId!, silent: true);
            if (_reportsData != null) {
              fetchReportsAnalytics(_restaurantId!, silent: true);
            }
          }
        });
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

  // --- Dashboard Analytics Fetch ---
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

    // Monotonic request counter to prevent race conditions when switching filters quickly
    final int currentRequestId = ++_fetchRequestId;

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

      // Discard if user already triggered a newer filter or fetch
      if (currentRequestId != _fetchRequestId) return;

      final jsonResponse = json.decode(response.body);

      if (jsonResponse['success'] == true && jsonResponse['data'] != null) {
        _data = AnalyticsData.fromJson(jsonResponse['data']);
        _error = '';
      } else {
        if (!silent) _error = 'Failed to load analytics data';
      }
    } catch (e) {
      if (currentRequestId != _fetchRequestId) return;
      if (!silent) _error = e.toString();
    } finally {
      if (currentRequestId == _fetchRequestId) {
        if (!silent) _isLoading = false;
        notifyListeners();
      }
    }
  }

  void setSelectedDays(int days, String restaurantId) {
    _specialTimeframe = null;
    if (_selectedDays != days) {
      fetchAnalytics(restaurantId, days: days);
    } else {
      fetchAnalytics(restaurantId);
    }
  }

  void setSpecialTimeframe(String timeframe, String restaurantId, {DateTime? startDate, DateTime? endDate}) {
    _specialTimeframe = timeframe;
    if (startDate != null) _startDate = startDate;
    if (endDate != null) _endDate = endDate;
    fetchAnalytics(restaurantId);
  }

  // --- Reports Screen Independent Analytics Fetch ---
  Future<void> fetchReportsAnalytics(
    String restaurantId, {
    int? days,
    String? specialTimeframe,
    DateTime? startDate,
    DateTime? endDate,
    bool silent = false,
  }) async {
    _restaurantId = restaurantId;
    if (days != null) _reportsDays = days;
    if (specialTimeframe != null) _reportsSpecialTimeframe = specialTimeframe;
    if (startDate != null) _reportsStartDate = startDate;
    if (endDate != null) _reportsEndDate = endDate;

    final int currentRequestId = ++_reportsFetchRequestId;

    if (!silent) {
      _isReportsLoading = true;
      _reportsError = '';
      notifyListeners();
    }

    try {
      String endpoint = '/api/analytics/restaurant/$restaurantId?';
      if (_reportsSpecialTimeframe == 'custom' && _reportsStartDate != null && _reportsEndDate != null) {
        endpoint += 'startDate=${_reportsStartDate!.toIso8601String().split('T')[0]}&endDate=${_reportsEndDate!.toIso8601String().split('T')[0]}';
      } else if (_reportsSpecialTimeframe == 'yesterday') {
        endpoint += 'days=yesterday';
      } else if (_reportsSpecialTimeframe == 'all') {
        endpoint += 'days=all';
      } else {
        endpoint += 'days=$_reportsDays';
      }

      final response = await ApiService.get(endpoint);

      if (currentRequestId != _reportsFetchRequestId) return;

      final jsonResponse = json.decode(response.body);

      if (jsonResponse['success'] == true && jsonResponse['data'] != null) {
        _reportsData = AnalyticsData.fromJson(jsonResponse['data']);
        _reportsError = '';
      } else {
        if (!silent) _reportsError = 'Failed to load reports data';
      }
    } catch (e) {
      if (currentRequestId != _reportsFetchRequestId) return;
      if (!silent) _reportsError = e.toString();
    } finally {
      if (currentRequestId == _reportsFetchRequestId) {
        if (!silent) _isReportsLoading = false;
        notifyListeners();
      }
    }
  }

  void setReportsDays(int days, String restaurantId) {
    _reportsSpecialTimeframe = null;
    if (_reportsDays != days) {
      fetchReportsAnalytics(restaurantId, days: days);
    } else {
      fetchReportsAnalytics(restaurantId);
    }
  }

  void setReportsSpecialTimeframe(String timeframe, String restaurantId, {DateTime? startDate, DateTime? endDate}) {
    _reportsSpecialTimeframe = timeframe;
    if (startDate != null) _reportsStartDate = startDate;
    if (endDate != null) _reportsEndDate = endDate;
    fetchReportsAnalytics(restaurantId);
  }

  @override
  void dispose() {
    _socketDebounceTimer?.cancel();
    super.dispose();
  }
}
