import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/models/user_model.dart';
import 'package:single_restaurant_mobile/services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  
  UserModel? _user;
  bool _isLoading = false;
  String? _error;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;

  Future<void> fetchUser() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final userData = await _authService.getMe();
      if (userData != null) {
        _user = UserModel.fromJson(userData);
      } else {
        _user = null;
      }
    } catch (e) {
      _error = e.toString();
      _user = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();
    
    await _authService.logout();
    _user = null;
    
    _isLoading = false;
    notifyListeners();
  }

  // Helper to trigger UI updates without full refresh if we just edit a field locally
  void updateUserLocally(UserModel updatedUser) {
    _user = updatedUser;
    notifyListeners();
  }

  // --- Saved Cards ---

  Future<bool> addCard({
    required String cardId,
    required String brand,
    required String last4,
    required int expMonth,
    required int expYear,
    String title = 'Personal Card',
    bool isDefault = false,
  }) async {
    _isLoading = true;
    notifyListeners();

    final success = await _authService.addCard(
      cardId: cardId,
      brand: brand,
      last4: last4,
      expMonth: expMonth,
      expYear: expYear,
      title: title,
      isDefault: isDefault,
    );

    if (success) {
      await fetchUser(); // Refresh user to get updated savedCards with _id
    } else {
      _isLoading = false;
      _error = 'Failed to add card';
      notifyListeners();
    }
    return success;
  }

  Future<bool> removeCard(String cardId) async {
    _isLoading = true;
    notifyListeners();

    final success = await _authService.removeCard(cardId);
    if (success) {
      await fetchUser();
    } else {
      _isLoading = false;
      _error = 'Failed to remove card';
      notifyListeners();
    }
    return success;
  }

  Future<bool> setDefaultCard(String cardId) async {
    _isLoading = true;
    notifyListeners();

    final success = await _authService.setDefaultCard(cardId);
    if (success) {
      await fetchUser();
    } else {
      _isLoading = false;
      _error = 'Failed to set default card';
      notifyListeners();
    }
    return success;
  }
}
