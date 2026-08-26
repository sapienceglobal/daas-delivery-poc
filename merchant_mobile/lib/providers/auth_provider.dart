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
    final token = prefs.getString('token');
    if (token != null && token.isNotEmpty) {
      _token = token;
      _isAuthenticated = true;
      ApiService.setAuthToken(token);
      final userStr = prefs.getString('user');
      if (userStr != null) {
        _user = jsonDecode(userStr);
      }
    } else {
      _isAuthenticated = false;
      _user = null;
    }
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.post('/api/auth/login', {
        'email': email,
        'password': password,
      });

      final decoded = jsonDecode(response.body);

      if (response.statusCode == 200 && decoded['success'] == true) {
        final token = decoded['token'];
        final user = decoded['user'];
        
        if (user['role'] == 'admin' || user['role'] == 'merchant') {
          _token = token;
          _user = user;
          _isAuthenticated = true;
          ApiService.setAuthToken(token);
          
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('token', token);
          await prefs.setString('user', jsonEncode(user));
          
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

  Future<void> logout() async {
    _isAuthenticated = false;
    _token = null;
    _user = null;
    ApiService.clearAuthToken();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('user');
    notifyListeners();
  }
}
