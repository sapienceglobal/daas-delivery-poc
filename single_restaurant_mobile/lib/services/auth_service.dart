import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:single_restaurant_mobile/services/api_service.dart';
import 'package:single_restaurant_mobile/services/socket_service.dart';
import 'package:single_restaurant_mobile/services/push_notification_service.dart';
import 'package:http_parser/http_parser.dart';
import 'package:google_sign_in/google_sign_in.dart';

class AuthService {
  static const String _tokenKey = 'auth_token';

  /// Cached user payload from the most recent successful auth response
  /// (login, socialLogin, verifyOtp) so fetchUser() has an instant fallback.
  static Map<String, dynamic>? lastAuthenticatedUser;

  // Attempt to load token from storage and set it in ApiService
  Future<bool> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    final rememberMe = prefs.getBool('remember_me') ?? false;
    final token = prefs.getString(_tokenKey);
    // If remember_me was ticked and token exists, restore session.
    // If remember_me was NOT ticked (false), wipe token on app cold restart so login screen is shown.
    if (rememberMe && token != null && token.isNotEmpty) {
      ApiService.setAuthToken(token);
      try {
        SocketService().reconnect();
      } catch (_) {}
      return true;
    } else {
      // Session-only or unremembered login: Wipe persistent token on app cold restart
      await prefs.remove(_tokenKey);
      await prefs.remove('remember_me');
      ApiService.clearAuthToken();
      return false;
    }
  }

  // Fetch the current user profile from the backend
  Future<Map<String, dynamic>?> getMe() async {
    try {
      final response = await ApiService.get('/api/auth/me');
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['data'] is Map) {
          final userMap = Map<String, dynamic>.from(data['data'] as Map);
          lastAuthenticatedUser = userMap;
          return userMap;
        }
      }
      return lastAuthenticatedUser;
    } catch (e) {
      print('Error fetching profile: $e');
      return lastAuthenticatedUser;
    }
  }

  // Register a new user
  // Returns null on success, error message string on failure
  Future<String?> register({
    required String name,
    required String email,
    required String password,
    required bool agreedToTerms,
    String? phone,
  }) async {
    try {
      final response = await ApiService.post('/api/auth/register', {
        'name': name,
        'email': email,
        'password': password,
        'phone': phone ?? '',
        'role': 'customer',
        'agreedToTerms': agreedToTerms,
      });

      // Agar status 201 (Created) ya 200 (OK) hai toh success
      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['user'] is Map) {
          lastAuthenticatedUser = Map<String, dynamic>.from(data['user'] as Map);
        }
        final token = data['token'];
        if (token != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(_tokenKey, token);
          await prefs.setBool('remember_me', true);
          ApiService.setAuthToken(token);
          try { SocketService().reconnect(); } catch (_) {}
          try { PushNotificationService().syncTokenWithBackend(); } catch (_) {}
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
    bool rememberMe = true,
  }) async {
    try {
      final response = await ApiService.post('/api/auth/social-login', {
        'provider': provider,
        'token': token,
        if (name != null) 'name': name,
        if (email != null) 'email': email,
        'role': 'customer',
        'rememberMe': rememberMe,
      });

      if (response.statusCode == 200) {
        try {
          final data = json.decode(response.body);
          if (data['user'] is Map) {
            lastAuthenticatedUser = Map<String, dynamic>.from(data['user'] as Map);
          }
          final jwtToken = data['token'];
          if (jwtToken != null) {
            final prefs = await SharedPreferences.getInstance();
            if (rememberMe) {
              await prefs.setString(_tokenKey, jwtToken);
              await prefs.setBool('remember_me', true);
            } else {
              await prefs.remove(_tokenKey);
              await prefs.setBool('remember_me', false);
            }
            ApiService.setAuthToken(jwtToken);
            try { SocketService().reconnect(); } catch (se) { print('Socket reconnect error: $se'); }
            try { PushNotificationService().syncTokenWithBackend(); } catch (pe) { print('Push sync error: $pe'); }
          }
          return null;
        } catch (parseErr) {
          print('Error parsing socialLogin response: $parseErr');
          return 'Social login succeeded but session storage error: $parseErr';
        }
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
        'email': email.trim().toLowerCase(),
        'password': password,
        'rememberMe': rememberMe,
      });

      if (response.statusCode == 200) {
        try {
          final data = json.decode(response.body);
          if (data['user'] is Map) {
            lastAuthenticatedUser = Map<String, dynamic>.from(data['user'] as Map);
          }
          final token = data['token'];
          if (token != null) {
            final prefs = await SharedPreferences.getInstance();
            if (rememberMe) {
              await prefs.setString(_tokenKey, token);
              await prefs.setBool('remember_me', true);
            } else {
              await prefs.remove(_tokenKey);
              await prefs.setBool('remember_me', false);
            }
            ApiService.setAuthToken(token);
            try { SocketService().reconnect(); } catch (se) { print('Socket reconnect error: $se'); }
            try { PushNotificationService().syncTokenWithBackend(); } catch (pe) { print('Push sync error: $pe'); }
            return null; // success
          }
        } catch (parseErr) {
          print('Error parsing login response: $parseErr');
          return 'Login succeeded but session storage error: $parseErr';
        }
      }
      
      // Parse error message if available
      try {
        final errorData = json.decode(response.body);
        return errorData['message'] ?? 'Login failed (${response.statusCode}). Please check your credentials.';
      } catch (_) {
        return 'Login failed (${response.statusCode}).';
      }
    } catch (e) {
      print('Error during login: $e');
      if (e is ApiException) {
        return e.message;
      }
      return 'Login failed: ${e.toString()}';
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
      if (e is ApiException) {
        return e.message;
      }
      return 'Unable to connect to the server.';
    }
  }

  // Logout clears the token
  Future<void> logout() async {
    lastAuthenticatedUser = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove('remember_me');
    ApiService.clearAuthToken();
    if (Platform.isAndroid) {
      try {
        final isSignedIn = await GoogleSignIn().isSignedIn().timeout(const Duration(seconds: 2), onTimeout: () => false);
        if (isSignedIn) {
          await GoogleSignIn().signOut().timeout(const Duration(seconds: 2));
        }
      } catch (e) {
        print('Google sign out error: $e');
      }
    }
    try {
      SocketService().reconnect();
    } catch (_) {}
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
        if (data['data'] is Map) {
          final updated = Map<String, dynamic>.from(data['data'] as Map);
          lastAuthenticatedUser = updated;
          return updated;
        }
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
        if (data['user'] is Map) {
          lastAuthenticatedUser = Map<String, dynamic>.from(data['user'] as Map);
        }
        final token = data['token'];
        if (token != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(_tokenKey, token);
          await prefs.setBool('remember_me', true);
          ApiService.setAuthToken(token);
          try { SocketService().reconnect(); } catch (_) {}
          try { PushNotificationService().syncTokenWithBackend(); } catch (_) {}
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

  // Save FCM Token
  Future<bool> saveFcmToken(String fcmToken) async {
    try {
      final response = await ApiService.post('/api/auth/me/fcm-token', {
        'fcmToken': fcmToken,
      });

      if (response.statusCode == 200) {
        return true;
      }
      return false;
    } catch (e) {
      print('Error saving FCM token: $e');
      return false;
    }
  }

  // Delete Account (Google Play Compliance)
  // Returns null on success, error message string on failure
  /// Sends a one-time deletion code to the user's email (for Google/Apple accounts).
  /// Returns null on success, error message on failure.
  Future<String?> sendDeleteAccountOtp() async {
    try {
      await ApiService.post('/api/auth/me/delete-otp', {});
      return null;
    } catch (e) {
      if (e is ApiException) return e.message;
      return 'Unable to send verification code. Please try again.';
    }
  }

  Future<String?> deleteAccount({String? password, String? otp, String? reason}) async {
    try {
      final response = await ApiService.delete('/api/auth/me', body: {
        if (password != null && password.isNotEmpty) 'password': password,
        if (otp != null && otp.isNotEmpty) 'otp': otp,
        if (reason != null) 'reason': reason,
      });

      if (response.statusCode == 200) {
        await logout();
        return null; // success
      }

      final errorData = json.decode(response.body);
      return errorData['message'] ?? 'Failed to delete account. Please try again.';
    } catch (e) {
      print('Error deleting account: $e');
      if (e is HttpException) {
        return e.message;
      }
      return 'Unable to connect to the server. Please check your internet connection.';
    }
  }
}
