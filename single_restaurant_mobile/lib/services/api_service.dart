import 'dart:convert';
import 'dart:async';
import 'package:http/http.dart' as http;

class ApiService {
  // For real device testing on the same WiFi, replace this IP with your laptop's IPv4 address.
  // To find your IP, open cmd and type 'ipconfig' (look for IPv4 Address under Wireless LAN adapter).
  // When building for release, pass the production URL using --dart-define=API_BASE_URL=https://your-server.com
  static const String _configuredBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://192.168.1.7:5001', // Change your laptop's actual IP
  );
  static const Duration _requestTimeout = Duration(seconds: 20);

  static String? _authToken;

  static void setAuthToken(String token) {
    _authToken = token;
  }

  static void clearAuthToken() {
    _authToken = null;
  }

  static Map<String, String> _buildHeaders(Map<String, String>? customHeaders) {
    final Map<String, String> headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-tenant-id': 'lassi-lounge', // Required for single restaurant mode backend logic
      'x-app-secret': 'mobile_app_secure_key_2026', // Industry standard API key for mobile apps
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
    return _send(() => http.get(uri, headers: _buildHeaders(headers)));
  }

  static Future<http.Response> post(String endpoint, dynamic body, {Map<String, String>? headers}) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    return _send(() => http.post(uri, headers: _buildHeaders(headers), body: json.encode(body)));
  }
  
  static Future<http.Response> put(String endpoint, dynamic body, {Map<String, String>? headers}) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    return _send(() => http.put(uri, headers: _buildHeaders(headers), body: json.encode(body)));
  }

  static Future<http.Response> patch(String endpoint, dynamic body, {Map<String, String>? headers}) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    return _send(() => http.patch(uri, headers: _buildHeaders(headers), body: json.encode(body)));
  }

  static Future<http.Response> delete(String endpoint, {Map<String, String>? headers}) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    return _send(() => http.delete(uri, headers: _buildHeaders(headers)));
  }

  static Future<http.Response> _send(Future<http.Response> Function() request) async {
    try {
      final response = await request().timeout(_requestTimeout);
      return _handleResponse(response);
    } on TimeoutException {
      throw HttpException('Server request timed out. Please try again.');
    } on HttpException {
      rethrow; // Don't wrap our own HttpException in "Unable to connect"
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
