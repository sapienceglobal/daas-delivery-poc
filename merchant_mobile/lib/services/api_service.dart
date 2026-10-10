import 'dart:convert';
import 'dart:async';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Use the same fallback IP or a defined environment variable
  static const String _configuredBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.lassiloungeny.com',
    // defaultValue: 'http://192.168.1.3:5001',
  );
  
  static const Duration _requestTimeout = Duration(seconds: 20);
  
  static String? _authToken;

  static String? get authToken => _authToken;

  static void setAuthToken(String token) {
    _authToken = token;
  }

  static void clearAuthToken() {
    _authToken = null;
  }

  static Map<String, String> buildHeaders([Map<String, String>? customHeaders]) {
    final Map<String, String> headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-tenant-id': 'lassi-lounge', 
      'x-app-secret': 'mobile_app_secure_key_2026',
      // Explicitly identifying as the merchant app as per industry standard
      'x-platform': 'merchant_app', 
    };

    if (_authToken != null) {
      headers['Authorization'] = 'Bearer $_authToken';
    }

    if (customHeaders != null) {
      headers.addAll(customHeaders);
    }
    return headers;
  }

  static String get baseUrl => _configuredBaseUrl.replaceAll(RegExp(r'/+$'), '');

  static http.Response _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return response;
    } else {
      try {
        final decoded = json.decode(response.body);
        final errMsg = decoded['message'] ?? 'API request failed';
        throw HttpException(errMsg);
      } catch (e) {
        if (e is HttpException) rethrow;
        throw HttpException('Request failed: ${response.statusCode}');
      }
    }
  }

  static Future<http.Response> get(String endpoint, {Map<String, String>? headers}) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    return _send(() => http.get(uri, headers: buildHeaders(headers)));
  }

  static Future<http.Response> post(String endpoint, dynamic body, {Map<String, String>? headers}) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    return _send(() => http.post(uri, headers: buildHeaders(headers), body: json.encode(body)));
  }
  
  static Future<http.Response> put(String endpoint, dynamic body, {Map<String, String>? headers}) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    return _send(() => http.put(uri, headers: buildHeaders(headers), body: json.encode(body)));
  }

  static Future<http.Response> patch(String endpoint, dynamic body, {Map<String, String>? headers}) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    return _send(() => http.patch(uri, headers: buildHeaders(headers), body: json.encode(body)));
  }

  static Future<http.Response> delete(String endpoint, {dynamic body, Map<String, String>? headers}) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    return _send(() => http.delete(uri, headers: buildHeaders(headers), body: body != null ? json.encode(body) : null));
  }

  static Future<String?> uploadImage(String filePath, {String folder = 'restaurant-platform/dishes'}) async {
    try {
      // 1. Resolve token (in-memory first, SharedPreferences fallback)
      String? token = _authToken;
      if (token == null || token.isEmpty) {
        try {
          final prefs = await SharedPreferences.getInstance();
          token = prefs.getString('token');
          if (token != null && token.isNotEmpty) {
            _authToken = token;
          }
        } catch (_) {}
      }

      // 2. Prepare file & MIME MediaType (crucial for Multer validation on backend)
      final file = File(filePath);
      if (!await file.exists()) {
        throw HttpException('Image file does not exist at path: $filePath');
      }

      final filename = filePath.split(Platform.isWindows ? '\\' : '/').last;
      final ext = filename.contains('.') ? filename.split('.').last.toLowerCase() : 'jpg';

      String mimeSubtype = 'jpeg';
      if (ext == 'png') {
        mimeSubtype = 'png';
      } else if (ext == 'webp') {
        mimeSubtype = 'webp';
      } else if (ext == 'gif') {
        mimeSubtype = 'gif';
      } else if (ext == 'pdf') {
        mimeSubtype = 'pdf';
      }
      final mediaType = MediaType('image', mimeSubtype);

      // Read file bytes for cross-platform safe multipart streaming
      final bytes = await file.readAsBytes();
      final uploadFilename = filename.contains('.') ? filename : '$filename.jpg';

      // Clean headers without Content-Type so MultipartRequest sets boundary
      final headers = buildHeaders();
      headers.remove('Content-Type');
      headers.remove('content-type');
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }

      // 3. Primary endpoint: POST /api/upload (field: 'image') - standard across web portal
      try {
        final request = http.MultipartRequest('POST', Uri.parse('$baseUrl/api/upload'));
        request.headers.addAll(headers);
        request.fields['folder'] = folder;
        request.files.add(http.MultipartFile.fromBytes(
          'image',
          bytes,
          filename: uploadFilename,
          contentType: mediaType,
        ));

        final streamed = await request.send().timeout(_requestTimeout);
        final res = await http.Response.fromStream(streamed);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          final decoded = json.decode(res.body);
          if (decoded['data'] is Map && decoded['data']['url'] != null) {
            return decoded['data']['url'] as String;
          } else if (decoded['data'] is List && (decoded['data'] as List).isNotEmpty) {
            final first = decoded['data'][0];
            if (first is Map && first['url'] != null) {
              return first['url'] as String;
            }
          }
        }
      } catch (_) {
        // Fall through to fallback endpoint if /api/upload failed
      }

      // 4. Fallback endpoint: POST /api/upload/multiple (field: 'images')
      final fallbackRequest = http.MultipartRequest('POST', Uri.parse('$baseUrl/api/upload/multiple'));
      fallbackRequest.headers.addAll(headers);
      fallbackRequest.fields['folder'] = folder;
      fallbackRequest.files.add(http.MultipartFile.fromBytes(
        'images',
        bytes,
        filename: uploadFilename,
        contentType: mediaType,
      ));

      final streamedResponse = await fallbackRequest.send().timeout(_requestTimeout);
      final response = await http.Response.fromStream(streamedResponse);
      final decoded = json.decode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        if (decoded['data'] is List && (decoded['data'] as List).isNotEmpty) {
          final first = decoded['data'][0];
          if (first is Map && first['url'] != null) {
            return first['url'] as String;
          }
        } else if (decoded['data'] is Map && decoded['data']['url'] != null) {
          return decoded['data']['url'] as String;
        }
      }

      final errorMsg = decoded['message'] ?? decoded['error'] ?? 'Upload failed (${response.statusCode})';
      throw HttpException(errorMsg);
    } catch (e) {
      rethrow;
    }
  }

  // --- CRM & Customers ---
  static Future<http.Response> getCustomers(String restaurantId) async {
    return get('/api/crm/restaurant/$restaurantId/customers');
  }

  static Future<http.Response> getCustomerProfile(String restaurantId, String customerId) async {
    return get('/api/crm/restaurant/$restaurantId/customers/$customerId/profile');
  }

  static Future<http.Response> createCustomer(String restaurantId, Map<String, dynamic> data) async {
    return post('/api/crm/restaurant/$restaurantId/customers', data);
  }

  static Future<http.Response> updateCustomer(String restaurantId, String customerId, Map<String, dynamic> data) async {
    return put('/api/crm/restaurant/$restaurantId/customers/$customerId', data);
  }

  static Future<http.Response> deleteCustomer(String restaurantId, String customerId) async {
    return delete('/api/crm/restaurant/$restaurantId/customers/$customerId');
  }

  static Future<http.Response> bulkUpdateCustomers(String restaurantId, Map<String, dynamic> data) async {
    return put('/api/crm/restaurant/$restaurantId/customers/bulk', data);
  }

  static Future<http.Response> bulkDeleteCustomers(String restaurantId, List<String> customerIds) async {
    return delete('/api/crm/restaurant/$restaurantId/customers/bulk', body: {'customerIds': customerIds});
  }

  static Future<http.Response> sendPromo(String restaurantId, Map<String, dynamic> data) async {
    return post('/api/crm/restaurant/$restaurantId/promo', data);
  }

  // --- Notifications ---
  static Future<http.Response> getNotifications() async {
    return get('/api/notifications');
  }

  static Future<http.Response> markNotificationRead(String id) async {
    return put('/api/notifications/$id/read', {});
  }

  static Future<http.Response> _send(Future<http.Response> Function() request) async {
    try {
      final response = await request().timeout(_requestTimeout);
      return _handleResponse(response);
    } on TimeoutException {
      throw HttpException('Server request timed out. Please try again.');
    } on SocketException {
      throw HttpException('No internet connection. Please check your network.');
    } on HttpException {
      rethrow; 
    } catch (error) {
      throw HttpException('Unable to connect to the server: $error');
    }
  }
}

class HttpException implements Exception {
  final String message;
  HttpException(this.message);
  @override
  String toString() => message;
}
