import 'dart:convert';
import 'dart:async';
import 'dart:io';
import 'package:http/http.dart' as http;

class ApiService {
  // Use the same fallback IP or a defined environment variable
  static const String _configuredBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.lassiloungeny.com',
    // defaultValue: 'http://192.168.1.7:5001',
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
