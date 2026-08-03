import 'package:flutter/foundation.dart';
import 'package:single_restaurant_mobile/services/loyalty_service.dart';

class LoyaltyProvider with ChangeNotifier {
  final LoyaltyService _loyaltyService = LoyaltyService();

  List<dynamic> _transactions = [];
  int _currentBalance = 0;
  bool _isLoyaltyMember = false;
  bool _hasClaimedDaily = false;
  bool _isLoading = false;
  String? _error;
  
  bool _hasMore = true;
  int _currentPage = 1;

  List<dynamic> get transactions => _transactions;
  int get currentBalance => _currentBalance;
  bool get isLoyaltyMember => _isLoyaltyMember;
  bool get hasClaimedDaily => _hasClaimedDaily;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasMore => _hasMore;

  Future<void> fetchHistory({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _transactions = [];
      _hasMore = true;
      _error = null;
    } else {
      if (!_hasMore || _isLoading) return;
    }

    _isLoading = true;
    notifyListeners();

    try {
      final response = await _loyaltyService.getLoyaltyHistory(page: _currentPage, limit: 20);
      
      if (response != null && response['success'] == true) {
        final data = response['data'] ?? {};
        _currentBalance = data['currentBalance'] ?? 0;
        _isLoyaltyMember = data['isLoyaltyMember'] ?? false;
        _hasClaimedDaily = data['hasClaimedDaily'] ?? false;
        final newTransactions = data['transactions'] as List<dynamic>? ?? [];
        
        if (newTransactions.isEmpty) {
          _hasMore = false;
        } else {
          _transactions.addAll(newTransactions);
          _currentPage++;
        }
      } else {
        _error = 'Failed to load loyalty history';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> joinProgram() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    final res = await _loyaltyService.joinProgram();
    
    _isLoading = false;
    if (res['success'] == true) {
      _isLoyaltyMember = true;
      _currentBalance = res['points'] ?? _currentBalance;
      notifyListeners();
      return true;
    } else {
      _error = res['message'];
      notifyListeners();
      return false;
    }
  }

  Future<Map<String, dynamic>> earnPoints(String action) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    final res = await _loyaltyService.earnPoints(action);
    
    _isLoading = false;
    if (res['success'] == true) {
      final data = res['data'] ?? {};
      _currentBalance = data['points'] ?? _currentBalance;
      // Option: Refetch history to show new transaction
      fetchHistory(refresh: true);
      notifyListeners();
      return {'success': true, 'message': res['message']};
    } else {
      _error = res['message'];
      notifyListeners();
      return {'success': false, 'message': res['message']};
    }
  }

  Future<Map<String, dynamic>> redeemPoints(int points, int expectedDiscount) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    final res = await _loyaltyService.redeemPoints(points, expectedDiscount);
    
    _isLoading = false;
    if (res['success'] == true) {
      final data = res['data'] ?? {};
      _currentBalance = data['points'] ?? _currentBalance;
      fetchHistory(refresh: true);
      notifyListeners();
      return {'success': true, 'couponCode': data['couponCode']};
    } else {
      _error = res['message'];
      notifyListeners();
      return {'success': false, 'message': res['message']};
    }
  }
}
