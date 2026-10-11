import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class ReferralProvider with ChangeNotifier {
  Map<String, dynamic>? _stats;
  Map<String, dynamic> _settings = {
    'enabled': true,
    'refereeDiscountValue': 25.0,
    'refereeMinOrder': 30.0,
    'referrerRewardValue': 25.0,
    'couponValidityDays': 30,
    'applyWindowDays': 7,
    'maxRewardsPerReferrer': 20,
    'maxAppliesPerIpPerDay': 3,
    'requireReferrerOrder': false,
    'title': 'Refer a friend',
    'description':
        'Invite your friends to {restaurant}. They get \${refereeDiscount} off their first order, and you get \${referrerReward} in loyalty points once they order!',
    'termsAndConditions':
        'Your friend must be a new customer and enter your code within {applyWindowDays} days of signing up. The \${refereeDiscount} coupon applies to a first order of \${refereeMinOrder} or more and is valid for {couponValidityDays} days. You receive \${referrerReward} in loyalty points after your friend\'s order is delivered. Orders that are cancelled or refunded do not qualify. Self-referrals and duplicate accounts are not eligible. The restaurant may modify or end this offer at any time.',
  };

  List<Map<String, dynamic>> _referrals = [];
  Map<String, dynamic> _pagination = {
    'page': 1,
    'limit': 15,
    'total': 0,
    'totalPages': 1,
  };

  bool _isLoading = false;
  bool _isListLoading = false;
  bool _isSaving = false;
  String _error = '';
  String _selectedStatus = '';
  String _searchQuery = '';

  Map<String, dynamic>? get stats => _stats;
  Map<String, dynamic> get settings => _settings;
  List<Map<String, dynamic>> get referrals => _referrals;
  Map<String, dynamic> get pagination => _pagination;
  bool get isLoading => _isLoading;
  bool get isListLoading => _isListLoading;
  bool get isSaving => _isSaving;
  String get error => _error;
  String get selectedStatus => _selectedStatus;
  String get searchQuery => _searchQuery;

  // Stats convenience getters
  int get totalReferrals => (_stats?['totalReferrals'] as num?)?.toInt() ?? 0;
  int get couponIssued => (_stats?['couponIssued'] as num?)?.toInt() ?? 0;
  int get redeemed => (_stats?['redeemed'] as num?)?.toInt() ?? 0;
  int get rewarded => (_stats?['rewarded'] as num?)?.toInt() ?? 0;
  int get revoked => (_stats?['revoked'] as num?)?.toInt() ?? 0;
  int get flagged => (_stats?['flagged'] as num?)?.toInt() ?? 0;
  double get discountGiven => (_stats?['discountGiven'] as num?)?.toDouble() ?? 0.0;
  int get pointsAwarded => (_stats?['pointsAwarded'] as num?)?.toInt() ?? 0;
  double get conversionRate => (_stats?['conversionRate'] as num?)?.toDouble() ?? 0.0;
  List<dynamic> get topReferrers => _stats?['topReferrers'] as List<dynamic>? ?? [];

  // Settings getters
  bool get isProgramEnabled => _settings['enabled'] == true;
  double get refereeDiscountValue =>
      (_settings['refereeDiscountValue'] as num?)?.toDouble() ?? 25.0;
  double get refereeMinOrder =>
      (_settings['refereeMinOrder'] as num?)?.toDouble() ?? 30.0;
  double get referrerRewardValue =>
      (_settings['referrerRewardValue'] as num?)?.toDouble() ?? 25.0;
  int get couponValidityDays =>
      (_settings['couponValidityDays'] as num?)?.toInt() ?? 30;
  int get applyWindowDays =>
      (_settings['applyWindowDays'] as num?)?.toInt() ?? 7;
  int get maxRewardsPerReferrer =>
      (_settings['maxRewardsPerReferrer'] as num?)?.toInt() ?? 20;
  int get maxAppliesPerIpPerDay =>
      (_settings['maxAppliesPerIpPerDay'] as num?)?.toInt() ?? 3;
  bool get requireReferrerOrder => _settings['requireReferrerOrder'] == true;
  String get title => _settings['title']?.toString() ?? 'Refer a friend';
  String get description => _settings['description']?.toString() ?? '';
  String get termsAndConditions => _settings['termsAndConditions']?.toString() ?? '';

  Future<void> fetchInitialData() async {
    _isLoading = true;
    _error = '';
    notifyListeners();

    try {
      final futures = await Future.wait([
        ApiService.get('/api/referrals/admin/stats'),
        ApiService.get('/api/referrals/admin/settings'),
      ]);

      final statsRes = futures[0];
      final settingsRes = futures[1];

      final statsDecoded = jsonDecode(statsRes.body);
      if (statsRes.statusCode == 200 && statsDecoded['data'] != null) {
        _stats = statsDecoded['data'];
      }

      final settingsDecoded = jsonDecode(settingsRes.body);
      if (settingsRes.statusCode == 200 && settingsDecoded['data'] != null) {
        final st = Map<String, dynamic>.from(settingsDecoded['data']);
        _settings = {
          'enabled': st['enabled'] ?? true,
          'refereeDiscountValue': (st['refereeDiscountValue'] as num?)?.toDouble() ?? 25.0,
          'refereeMinOrder': (st['refereeMinOrder'] as num?)?.toDouble() ?? 30.0,
          'referrerRewardValue': (st['referrerRewardValue'] as num?)?.toDouble() ?? 25.0,
          'couponValidityDays': (st['couponValidityDays'] as num?)?.toInt() ?? 30,
          'applyWindowDays': (st['applyWindowDays'] as num?)?.toInt() ?? 7,
          'maxRewardsPerReferrer': (st['maxRewardsPerReferrer'] as num?)?.toInt() ?? 20,
          'maxAppliesPerIpPerDay': (st['maxAppliesPerIpPerDay'] as num?)?.toInt() ?? 3,
          'requireReferrerOrder': st['requireReferrerOrder'] == true,
          'title': st['title']?.toString() ?? 'Refer a friend',
          'description': st['description']?.toString() ?? '',
          'termsAndConditions': st['termsAndConditions']?.toString() ?? '',
        };
      }

      await fetchReferralList(
        status: _selectedStatus,
        search: _searchQuery,
        page: 1,
      );
    } catch (e) {
      _error = 'Error loading referral data: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchReferralList({
    String? status,
    String? search,
    int page = 1,
  }) async {
    _isListLoading = true;
    if (status != null) _selectedStatus = status;
    if (search != null) _searchQuery = search;
    notifyListeners();

    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': (_pagination['limit'] ?? 15).toString(),
      };
      if (_selectedStatus.isNotEmpty) {
        queryParams['status'] = _selectedStatus;
      }
      if (_searchQuery.trim().isNotEmpty) {
        queryParams['search'] = _searchQuery.trim();
      }

      final queryString = Uri(queryParameters: queryParams).query;
      final res = await ApiService.get('/api/referrals/admin/list?$queryString');
      final decoded = jsonDecode(res.body);

      if (res.statusCode == 200 && decoded['data'] != null) {
        _referrals = (decoded['data'] as List<dynamic>)
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
        if (decoded['pagination'] != null) {
          _pagination = Map<String, dynamic>.from(decoded['pagination']);
        }
      }
    } catch (e) {
      debugPrint('Failed to load referral list: $e');
    } finally {
      _isListLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateSettings(Map<String, dynamic> newSettings) async {
    _isSaving = true;
    _error = '';
    notifyListeners();

    try {
      final response = await ApiService.put('/api/referrals/admin/settings', newSettings);
      final jsonResponse = jsonDecode(response.body);

      if (response.statusCode == 200 && (jsonResponse['success'] == true || jsonResponse['data'] != null)) {
        if (jsonResponse['data'] != null) {
          final st = Map<String, dynamic>.from(jsonResponse['data']);
          _settings = {
            'enabled': st['enabled'] ?? true,
            'refereeDiscountValue': (st['refereeDiscountValue'] as num?)?.toDouble() ?? 25.0,
            'refereeMinOrder': (st['refereeMinOrder'] as num?)?.toDouble() ?? 30.0,
            'referrerRewardValue': (st['referrerRewardValue'] as num?)?.toDouble() ?? 25.0,
            'couponValidityDays': (st['couponValidityDays'] as num?)?.toInt() ?? 30,
            'applyWindowDays': (st['applyWindowDays'] as num?)?.toInt() ?? 7,
            'maxRewardsPerReferrer': (st['maxRewardsPerReferrer'] as num?)?.toInt() ?? 20,
            'maxAppliesPerIpPerDay': (st['maxAppliesPerIpPerDay'] as num?)?.toInt() ?? 3,
            'requireReferrerOrder': st['requireReferrerOrder'] == true,
            'title': st['title']?.toString() ?? 'Refer a friend',
            'description': st['description']?.toString() ?? '',
            'termsAndConditions': st['termsAndConditions']?.toString() ?? '',
          };
        } else {
          _settings = Map<String, dynamic>.from(newSettings);
        }

        // Refresh stats in background
        _refreshStatsOnly();
        return true;
      } else {
        _error = jsonResponse['message'] ?? 'Failed to update referral settings';
        return false;
      }
    } catch (e) {
      _error = 'Error saving referral settings: $e';
      return false;
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  Future<bool> cancelReferral(String id) async {
    try {
      final response = await ApiService.patch('/api/referrals/admin/$id/cancel', {});
      final jsonResponse = jsonDecode(response.body);

      if (response.statusCode == 200 && jsonResponse['success'] == true) {
        // Refetch current list page and stats
        await Future.wait([
          fetchReferralList(page: _pagination['page'] ?? 1),
          _refreshStatsOnly(),
        ]);
        return true;
      } else {
        _error = jsonResponse['message'] ?? 'Could not cancel referral';
        return false;
      }
    } catch (e) {
      _error = 'Error cancelling referral: $e';
      return false;
    }
  }

  Future<void> _refreshStatsOnly() async {
    try {
      final statsRes = await ApiService.get('/api/referrals/admin/stats');
      final statsDecoded = jsonDecode(statsRes.body);
      if (statsRes.statusCode == 200 && statsDecoded['data'] != null) {
        _stats = statsDecoded['data'];
        notifyListeners();
      }
    } catch (_) {}
  }
}
