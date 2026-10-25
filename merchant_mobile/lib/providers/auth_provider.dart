import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  bool _isAuthenticated = false;
  bool _isLoading = false;
  String? _error;
  String? _token;
  Map<String, dynamic>? _user;

  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Map<String, dynamic>? get user => _user;

  Future<void> checkLoginStatus() async {
    final prefs = await SharedPreferences.getInstance();
    final rememberMe = prefs.getBool('rememberMe') ?? false;
    final token = prefs.getString('token');

    // If rememberMe was false or token missing, do NOT auto-login on cold restart
    if (rememberMe && token != null && token.isNotEmpty) {
      _token = token;
      _isAuthenticated = true;
      ApiService.setAuthToken(token);
      final userStr = prefs.getString('user');
      if (userStr != null) {
        try {
          final decodedUser = jsonDecode(userStr);
          if (decodedUser['restaurantId'] is Map) {
            decodedUser['timezone'] = decodedUser['restaurantId']['timezone'];
            decodedUser['restaurantId'] = decodedUser['restaurantId']['_id'] ?? decodedUser['restaurantId']['id'];
            // Save the flattened version back to prefs for future
            prefs.setString('user', jsonEncode(decodedUser));
          }
          _user = decodedUser;
          if (decodedUser['restaurantId'] != null) {
            prefs.setString('restaurantId', decodedUser['restaurantId'].toString());
          }
        } catch (_) {}
      }
    } else {
      // Session-only login expired on app close OR not authenticated
      _isAuthenticated = false;
      _token = null;
      _user = null;
      ApiService.clearAuthToken();
      await prefs.remove('token');
      await prefs.remove('user');
      await prefs.remove('restaurantId');
      await prefs.remove('rememberMe');
    }
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  Future<bool> login(String email, String password, {bool rememberMe = true}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.post('/api/auth/login', {
        'email': email,
        'password': password,
        'rememberMe': rememberMe,
      });

      final decoded = jsonDecode(response.body);

      if (response.statusCode == 200 && decoded['success'] == true) {
        final token = decoded['token'];
        final user = decoded['user'];
        
        if (user['role'] == 'admin' || user['role'] == 'merchant') {
          // Flatten restaurantId if it's an object, to prevent type errors across the app
          if (user['restaurantId'] is Map) {
            user['timezone'] = user['restaurantId']['timezone'];
            user['restaurantId'] = user['restaurantId']['_id'] ?? user['restaurantId']['id'];
          }
          
          _token = token;
          _user = user;
          _isAuthenticated = true;
          ApiService.setAuthToken(token);
          
          final prefs = await SharedPreferences.getInstance();
          if (rememberMe) {
            // Persistent 180-day login across cold boots and app updates
            await prefs.setString('token', token);
            await prefs.setString('user', jsonEncode(user));
            if (user['restaurantId'] != null) {
              await prefs.setString('restaurantId', user['restaurantId'].toString());
            }
            await prefs.setBool('rememberMe', true);
          } else {
            // Session-only: do NOT store token in prefs so next app launch prompts login
            await prefs.remove('token');
            await prefs.remove('user');
            await prefs.remove('restaurantId');
            await prefs.setBool('rememberMe', false);
          }
          
          _isLoading = false;
          notifyListeners();
          return true;
        } else {
          _error = 'Access Denied: This portal is for restaurant partners only.';
          _isLoading = false;
          notifyListeners();
          return false;
        }
      } else {
        _error = decoded['message'] ?? 'Login failed';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } on HttpException catch (e) {
      _error = e.message;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'An error occurred during login. Please try again.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Verifies active token with backend /api/auth/me to catch expired or revoked credentials
  Future<bool> validateSessionWithServer() async {
    if (_token == null || _token!.isEmpty) return false;
    try {
      final res = await ApiService.get('/api/auth/me').timeout(const Duration(seconds: 4));
      final decoded = jsonDecode(res.body);
      if (res.statusCode == 200 && decoded['success'] == true) {
        final userData = decoded['data'] ?? decoded['user'];
        if (userData != null) {
          if (userData['restaurantId'] is Map) {
            userData['timezone'] = userData['restaurantId']['timezone'];
            userData['restaurantId'] = userData['restaurantId']['_id'] ?? userData['restaurantId']['id'];
          }
          _user = userData;
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('user', jsonEncode(userData));
        }
        return true;
      }
      if (res.statusCode == 401) {
        await logout();
        return false;
      }
    } catch (e) {
      debugPrint('AuthProvider validateSessionWithServer network timeout/offline: $e');
      // If offline or network timeout, keep cached login state
      return true;
    }
    return true;
  }

  void forceLogout() {
    _isAuthenticated = false;
    _token = null;
    _user = null;
    ApiService.clearAuthToken();
    try {
      SharedPreferences.getInstance().then((prefs) {
        prefs.remove('token');
        prefs.remove('user');
        prefs.remove('restaurantId');
        prefs.remove('rememberMe');
      });
    } catch (_) {}
    notifyListeners();
  }

  Future<void> logout() async {
    _isAuthenticated = false;
    _token = null;
    _user = null;
    ApiService.clearAuthToken();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('user');
    await prefs.remove('restaurantId');
    await prefs.remove('rememberMe');
    notifyListeners();
  }

  // Delete Merchant Account (Google Play Compliance)
  // Returns null on success, error message on failure
  Future<String?> deleteAccount({String? password, String? confirmation, String? reason}) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await ApiService.delete('/api/auth/me', body: {
        if (password != null && password.isNotEmpty) 'password': password,
        if (confirmation != null && confirmation.isNotEmpty) 'confirmation': confirmation,
        if (reason != null && reason.isNotEmpty) 'reason': reason,
      });

      final decoded = jsonDecode(response.body);
      if (response.statusCode == 200 && decoded['success'] == true) {
        await logout();
        _isLoading = false;
        notifyListeners();
        return null; // success
      } else {
        _isLoading = false;
        notifyListeners();
        return decoded['message'] ?? 'Failed to delete account. Please try again.';
      }
    } on HttpException catch (e) {
      _isLoading = false;
      notifyListeners();
      return e.message;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return 'Unable to connect to the server. Please check your internet connection.';
    }
  }
}
