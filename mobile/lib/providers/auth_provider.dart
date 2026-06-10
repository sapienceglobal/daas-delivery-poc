import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  Map<String, dynamic>? _user;
  String? _token;
  bool _isLoading = false;
  bool _isBootstrapping = true;
  String? _errorMessage;
  String? _successMessage;
  List<dynamic> _userOrders = [];

  Map<String, dynamic>? get user => _user;
  String? get token => _token;
  bool get isAuthenticated => _token != null;
  bool get isLoading => _isLoading;
  bool get isBootstrapping => _isBootstrapping;
  String? get errorMessage => _errorMessage;
  String? get successMessage => _successMessage;
  List<dynamic> get userOrders => _userOrders;

  String? get userRole => _user != null ? _user!['role'] : null;

  AuthProvider() {
    loadSession();
  }

  void clearMessages() {
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();
  }

  Future<void> loadSession() async {
    _isBootstrapping = true;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      _token = prefs.getString('marketplace_token');
      final userStr = prefs.getString('marketplace_user');
      if (userStr != null) {
        _user = json.decode(userStr);
      }
      
      if (_token != null) {
        await fetchProfile();
      }
    } catch (e) {
      _errorMessage = 'Failed to load session: $e';
    } finally {
      _isBootstrapping = false;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiService.post('/api/auth/login', {
        'email': email,
        'password': password,
      });
      final data = json.decode(response.body);
      
      _token = data['token'];
      _user = data['user'];

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('marketplace_token', _token!);
      await prefs.setString('marketplace_user', json.encode(_user));

      await fetchProfile(); // load orders & addresses
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String name,
    required String email,
    required String password,
    required String phone,
    required String address,
    required String role,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiService.post('/api/auth/register', {
        'name': name,
        'email': email,
        'password': password,
        'phone': phone,
        'address': address,
        'role': role,
      });
      final data = json.decode(response.body);
      
      _token = data['token'];
      _user = data['user'];

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('marketplace_token', _token!);
      await prefs.setString('marketplace_user', json.encode(_user));

      await fetchProfile();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();
    try {
      await ApiService.post('/api/auth/logout', {});
    } catch (_) {}

    _token = null;
    _user = null;
    _userOrders = [];

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('marketplace_token');
    await prefs.remove('marketplace_user');
    
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> forgotPassword(String email) async {
    _isLoading = true;
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();

    try {
      final response = await ApiService.post('/api/auth/forgot-password', {
        'email': email,
      });
      final data = json.decode(response.body);
      _successMessage = data['message'] ?? 'Reset instructions sent!';
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> resetPassword(String resetToken, String newPassword) async {
    _isLoading = true;
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();

    try {
      final response = await ApiService.post('/api/auth/reset-password/$resetToken', {
        'password': newPassword,
      });
      final data = json.decode(response.body);
      _successMessage = data['message'] ?? 'Password reset successfully!';
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> fetchProfile() async {
    if (_token == null) return;
    try {
      final response = await ApiService.get('/api/auth/profile');
      final data = json.decode(response.body);
      if (data['success'] == true) {
        _user = data['user'];
        _userOrders = data['orders'] ?? [];
        
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('marketplace_user', json.encode(_user));
      }
    } catch (e) {
      debugPrint('Error fetching profile: $e');
    }
  }

  Future<bool> addAddress(String address) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final response = await ApiService.post('/api/auth/addresses', {'address': address});
      final data = json.decode(response.body);
      if (data['success'] == true) {
        _user!['savedAddresses'] = data['savedAddresses'];
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('marketplace_user', json.encode(_user));
        _isLoading = false;
        notifyListeners();
        return true;
      }
      throw HttpException('Failed to add address');
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateAddress(int index, String address) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final response = await ApiService.put('/api/auth/addresses/$index', {'address': address});
      final data = json.decode(response.body);
      if (data['success'] == true) {
        _user!['savedAddresses'] = data['savedAddresses'];
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('marketplace_user', json.encode(_user));
        _isLoading = false;
        notifyListeners();
        return true;
      }
      throw HttpException('Failed to update address');
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteAddress(int index) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final response = await ApiService.delete('/api/auth/addresses/$index');
      final data = json.decode(response.body);
      if (data['success'] == true) {
        _user!['savedAddresses'] = data['savedAddresses'];
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('marketplace_user', json.encode(_user));
        _isLoading = false;
        notifyListeners();
        return true;
      }
      throw HttpException('Failed to delete address');
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
}
