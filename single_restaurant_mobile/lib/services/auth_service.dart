import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:single_restaurant_mobile/services/api_service.dart';
import 'package:single_restaurant_mobile/services/socket_service.dart';
import 'package:http_parser/http_parser.dart';
import 'package:google_sign_in/google_sign_in.dart';

class AuthService {
  static const String _tokenKey = 'auth_token';

  // Attempt to load token from storage and set it in ApiService
  Future<bool> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    if (token != null) {
      ApiService.setAuthToken(token);
      SocketService().reconnect();
      return true;
    }
    return false;
  }

  // Fetch the current user profile from the backend
  Future<Map<String, dynamic>?> getMe() async {
    try {
      final response = await ApiService.get('/api/auth/me');
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['data'];
      }
      return null;
    } catch (e) {
      print('Error fetching profile: $e');
      return null;
    }
  }

  // Register a new user
  // Returns null on success, error message string on failure
  Future<String?> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    try {
      final response = await ApiService.post('/api/auth/register', {
        'name': name,
        'email': email,
        'password': password,
        'phone': phone ?? '',
        'role': 'customer',
      });

      // Agar status 201 (Created) ya 200 (OK) hai toh success
      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = json.decode(response.body);
        final token = data['token'];
        if (token != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(_tokenKey, token);
          ApiService.setAuthToken(token);
          SocketService().reconnect();
        }
        return null; // Null return karne ka matlab hai Success
      } 
      
      // Agar backend se koi error aati hai (jaise Email already exists)
      try {
        final errorData = json.decode(response.body);
        return errorData['message'] ?? 'Registration failed. Please try again.';
      } catch (decodeError) {
        // Agar JSON parse na ho paye toh safe fallback
        if (response.body.isNotEmpty && response.body.length < 100) {
          return response.body;
        }
        return 'Registration failed. Please check your details and try again.';
      }
    } catch (e) {
      print('Error during registration: $e');
      if (e is HttpException) {
        return e.message;
      }
      return 'Unable to connect to the server. Please check your internet connection.';
    }
  }

  // Social Login
  Future<String?> socialLogin({
    required String provider,
    required String token,
    String? name,
    String? email,
  }) async {
    try {
      final response = await ApiService.post('/api/auth/social-login', {
        'provider': provider,
        'token': token,
        if (name != null) 'name': name,
        if (email != null) 'email': email,
        'role': 'customer',
      });

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final jwtToken = data['token'];
        if (jwtToken != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(_tokenKey, jwtToken);
          ApiService.setAuthToken(jwtToken);
          SocketService().reconnect();
        }
        return null;
      }

      try {
        final errorData = json.decode(response.body);
        return errorData['message'] ?? 'Social login failed. Please try again.';
      } catch (decodeError) {
        return 'Social login failed. Please try again.';
      }
    } catch (e) {
      print('Error during social login: $e');
      if (e is HttpException) {
        return e.message;
      }
      return 'Unable to connect to the server. Please check your internet connection.';
    }
  }

  // Login an existing user
  Future<String?> login({
    required String email,
    required String password,
    bool rememberMe = true,
  }) async {
    try {
      final response = await ApiService.post('/api/auth/login', {
        'email': email,
        'password': password,
        'rememberMe': rememberMe,
      });

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final token = data['token'];
        if (token != null) {
          final prefs = await SharedPreferences.getInstance();
          if (rememberMe) {
            await prefs.setString(_tokenKey, token);
          } else {
            await prefs.remove(_tokenKey);
          }
          ApiService.setAuthToken(token);
          SocketService().reconnect();
          return null; // success
        }
      }
      
      // Parse error message if available
      final errorData = json.decode(response.body);
      return errorData['message'] ?? 'Login failed. Please check your credentials.';
    } catch (e) {
      print('Error during login: $e');
      if (e is HttpException) {
        return e.message;
      }
      return 'Unable to connect to the server.';
    }
  }

  // Forgot password
  Future<String?> forgotPassword({required String email}) async {
    try {
      final response = await ApiService.post('/api/auth/forgot-password', {
        'email': email,
      });

      if (response.statusCode == 200) {
        return null; // success
      }
      
      final errorData = json.decode(response.body);
      return errorData['message'] ?? 'Failed to send reset link.';
    } catch (e) {
      print('Error during forgot password: $e');
      if (e is HttpException) {
        return e.message;
      }
      return 'Unable to connect to the server.';
    }
  }

  // Logout clears the token
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    ApiService.clearAuthToken();
    try {
      await GoogleSignIn().signOut();
    } catch (e) {
      print('Google sign out error: $e');
    }
    SocketService().reconnect();
  }

  // Update profile
  Future<Map<String, dynamic>?> updateProfile({
    String? name,
    String? phone,
    String? imagePath,
  }) async {
    try {
      String? avatarUrl;
      final token = ApiService.authToken;
      if (token == null) return null;

      // 1. Upload image if provided
      if (imagePath != null) {
        final uploadUri = Uri.parse('${ApiService.baseUrl}/api/upload');
        final uploadRequest = http.MultipartRequest('POST', uploadUri);
        
        final headers = ApiService.buildHeaders();
        uploadRequest.headers.addAll(headers);
        
        final ext = imagePath.split('.').last.toLowerCase();
        String mimeType = 'jpeg';
        if (ext == 'png') mimeType = 'png';
        else if (ext == 'webp') mimeType = 'webp';
        else if (ext == 'gif') mimeType = 'gif';
        
        uploadRequest.files.add(await http.MultipartFile.fromPath(
          'image', 
          imagePath,
          contentType: MediaType('image', mimeType),
        ));
        
        final streamedResponse = await uploadRequest.send();
        final response = await http.Response.fromStream(streamedResponse);
        
        if (response.statusCode == 200 || response.statusCode == 201) {
          final data = json.decode(response.body);
          avatarUrl = data['data']['url'];
        } else {
          print('Image upload failed: ${response.body}');
          return null; // Fail early if image upload fails
        }
      }

      // 2. Update profile data
      final payload = <String, dynamic>{};
      if (name != null) payload['name'] = name;
      if (phone != null) payload['phone'] = phone;
      if (avatarUrl != null) payload['avatar'] = avatarUrl;

      if (payload.isEmpty) return null;

      final response = await ApiService.put('/api/auth/me', payload);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        // The backend returns { success: true, data: user, message: ... }
        return data['data'];
      }
      return null;
    } catch (e) {
      print('Error updating profile: $e');
      return null;
    }
  }

  // Update notification preferences
  Future<bool> updateNotificationPreferences(Map<String, dynamic> preferences) async {
    try {
      final response = await ApiService.put('/api/auth/me', {
        'notificationPreferences': preferences,
      });

      if (response.statusCode == 200) {
        return true;
      }
      return false;
    } catch (e) {
      print('Error updating notification preferences: $e');
      return false;
    }
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
    try {
      final response = await ApiService.post('/api/auth/me/cards', {
        'cardId': cardId,
        'title': title,
        'brand': brand,
        'last4': last4,
        'expMonth': expMonth,
        'expYear': expYear,
        'isDefault': isDefault,
      });
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      print('Error adding card: $e');
      return false;
    }
  }

  Future<bool> removeCard(String cardId) async {
    try {
      final response = await ApiService.delete('/api/auth/me/cards/$cardId');
      return response.statusCode == 200;
    } catch (e) {
      print('Error removing card: $e');
      return false;
    }
  }

  Future<bool> setDefaultCard(String cardId) async {
    try {
      final response = await ApiService.patch('/api/auth/me/cards/$cardId/default', {});
      return response.statusCode == 200;
    } catch (e) {
      print('Error setting default card: $e');
      return false;
    }
  }

  // Toggle favorite item
  Future<bool> toggleFavoriteItem(String itemId) async {
    try {
      final response = await ApiService.post('/api/auth/me/favorites/items/$itemId', {});
      return response.statusCode == 200;
    } catch (e) {
      print('Error toggling favorite item: $e');
      return false;
    }
  }

 // Verify email OTP after registration
  // Returns null on success, error message string on failure
  Future<String?> verifyOtp({
    required String email,
    required String otp,
  }) async {
    try {
      final response = await ApiService.post('/api/auth/verify-otp', {
        'email': email,
        'otp': otp,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        final token = data['token'];
        if (token != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(_tokenKey, token);
          ApiService.setAuthToken(token);
        }
        return null; // success
      }

      final errorData = json.decode(response.body);
      return errorData['message'] ?? 'Invalid OTP. Please try again.';
      
    } catch (e) {
      print('Error verifying OTP: $e');
      if (e is HttpException) {
        return e.message;
      }
      return 'Unable to connect to the server. Please check your internet connection.';
    }
  }

  // Resend OTP logic
  Future<String?> resendOtp({required String email}) async {
    try {
      final response = await ApiService.post('/api/auth/resend-otp', {
        'email': email,
      });
      
      if (response.statusCode == 200) {
        return null; // success
      }
      
      final errorData = json.decode(response.body);
      return errorData['message'] ?? 'Failed to resend OTP.';
      
    } catch (e) {
      print('Error resending OTP: $e');
      if (e is HttpException) {
        return e.message;
      }
      return 'Unable to connect to the server. Please check your internet connection.';
    }
  }
}
