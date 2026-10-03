import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class LoyaltyProvider with ChangeNotifier {
  Map<String, dynamic>? _stats;
  Map<String, dynamic> _settings = {
    'enabled': true,
    'pointsPerDollar': 1.0,
    'centsPerPoint': 1.0,
    'minimumOrderMultiplier': 3.0,
    'termsAndConditions': 'Earn 1 point for every \$1 spent. 100 points = \$1 off your next order.',
  };

  bool _isLoading = false;
  bool _isSaving = false;
  String _error = '';

  Map<String, dynamic>? get stats => _stats;
  Map<String, dynamic> get settings => _settings;
  bool get isLoading => _isLoading;
  bool get isSaving => _isSaving;
  String get error => _error;

  int get totalMembers => (_stats?['totalMembers'] as num?)?.toInt() ?? 0;
  int get pointsIssued => (_stats?['pointsIssued'] as num?)?.toInt() ?? 0;
  int get pointsRedeemed => (_stats?['pointsRedeemed'] as num?)?.toInt() ?? 0;
  int get outstandingPoints => (_stats?['outstandingPoints'] as num?)?.toInt() ?? 0;
  String get redemptionRate => _stats?['redemptionRate']?.toString() ?? '0.00';
  List<dynamic> get recentTransactions => _stats?['recentTransactions'] as List<dynamic>? ?? [];

  bool get isProgramEnabled => _settings['enabled'] == true;
  double get pointsPerDollar => (_settings['pointsPerDollar'] as num?)?.toDouble() ?? 1.0;
  double get centsPerPoint => (_settings['centsPerPoint'] as num?)?.toDouble() ?? 1.0;
  double get minimumOrderMultiplier => (_settings['minimumOrderMultiplier'] as num?)?.toDouble() ?? 3.0;
  String get termsAndConditions => _settings['termsAndConditions']?.toString() ?? '';

  Future<void> fetchLoyaltyData() async {
    _isLoading = true;
    _error = '';
    notifyListeners();

    try {
      // 1. Fetch Stats
      final statsRes = await ApiService.get('/api/loyalty/stats');
      final statsDecoded = jsonDecode(statsRes.body);

      if (statsRes.statusCode == 200 && statsDecoded['data'] != null) {
        _stats = statsDecoded['data'];
      } else {
        _error = statsDecoded['message'] ?? 'Failed to load loyalty stats';
      }

      // 2. Fetch Restaurant loyalty settings
      final restRes = await ApiService.get('/api/restaurants/merchant/my');
      final restDecoded = jsonDecode(restRes.body);

      if (restRes.statusCode == 200 && restDecoded['data'] != null) {
        final rest = restDecoded['data'];
        if (rest['loyaltySettings'] != null) {
          final ls = rest['loyaltySettings'];
          _settings = {
            'enabled': ls['enabled'] ?? true,
            'pointsPerDollar': (ls['pointsPerDollar'] as num?)?.toDouble() ?? 1.0,
            'centsPerPoint': (ls['centsPerPoint'] as num?)?.toDouble() ?? 1.0,
            'minimumOrderMultiplier': (ls['minimumOrderMultiplier'] as num?)?.toDouble() ?? 3.0,
            'termsAndConditions': ls['termsAndConditions'] ??
                'Earn 1 point for every \$1 spent. 100 points = \$1 off your next order.',
          };
        }
      }
    } catch (e) {
      _error = 'Error loading loyalty data: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateSettings(String restaurantId, Map<String, dynamic> newSettings) async {
    _isSaving = true;
    _error = '';
    notifyListeners();

    try {
      final payload = {
        'loyaltySettings': {
          'enabled': newSettings['enabled'] ?? true,
          'pointsPerDollar': newSettings['pointsPerDollar'] ?? 1.0,
          'centsPerPoint': newSettings['centsPerPoint'] ?? 1.0,
          'minimumOrderMultiplier': newSettings['minimumOrderMultiplier'] ?? 3.0,
          'termsAndConditions': newSettings['termsAndConditions'] ?? '',
        }
      };

      final response = await ApiService.put('/api/restaurants/$restaurantId', payload);
      final jsonResponse = jsonDecode(response.body);

      if (response.statusCode == 200 && jsonResponse['success'] == true) {
        _settings = Map<String, dynamic>.from(payload['loyaltySettings']!);
        _isSaving = false;
        notifyListeners();
        return true;
      } else {
        _error = jsonResponse['message'] ?? 'Failed to update loyalty settings';
        _isSaving = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Error updating settings: $e';
      _isSaving = false;
      notifyListeners();
      return false;
    }
  }
}
