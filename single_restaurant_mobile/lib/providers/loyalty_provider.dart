import 'package:flutter/foundation.dart';
import 'package:single_restaurant_mobile/services/loyalty_service.dart';

class LoyaltyProvider with ChangeNotifier {
  final LoyaltyService _loyaltyService = LoyaltyService();

  List<dynamic> _transactions = [];
  int _currentBalance = 0;
  bool _isLoading = false;
  String? _error;
  
  bool _hasMore = true;
  int _currentPage = 1;

  List<dynamic> get transactions => _transactions;
  int get currentBalance => _currentBalance;
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
        _currentBalance = response['currentBalance'] ?? 0;
        final newTransactions = response['data'] as List<dynamic>? ?? [];
        
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
}
