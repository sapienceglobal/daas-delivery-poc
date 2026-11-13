import 'dart:convert';
import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // For real device testing on the same WiFi, replace this IP with your laptop's IPv4 address.
  // To find your IP, open cmd and type 'ipconfig' (look for IPv4 Address under Wireless LAN adapter).
  // When building for release, pass the production URL using --dart-define=API_BASE_URL=https://your-server.com
  static const String _configuredBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.lassiloungeny.com', // Change your laptop's actual IP
    // defaultValue: 'http://192.168.1.4:5001',
  );
  static const Duration _requestTimeout = Duration(seconds: 35);
 
  static String? _authToken;
  static void Function()? onSessionExpired;

  // Real-time device telemetry & location context
  static String? _deviceCity;
  static String? _deviceRegion;
  static String? _deviceCountry;
  static String? _deviceLocation;
  static double? _deviceLat;
  static double? _deviceLng;
  static String? _deviceIp;
  static String? _networkCarrier;
  static String? _networkType;

  static String? get authToken => _authToken;

  static void setAuthToken(String token) {
    _authToken = token;
  }

  static void clearAuthToken() {
    _authToken = null;
  }

  /// Helper to sanitize headers so non-ASCII characters (e.g. Hindi, Unicode) never throw FormatException in dart:io
  static String? _safeHeader(String? val) {
    if (val == null) return null;
    final sanitized = val.replaceAll(RegExp(r'[^\x20-\x7E]'), '').trim();
    return sanitized.isEmpty ? null : sanitized;
  }

  /// Self-healing token loader: if in-memory _authToken is null, loads it from SharedPreferences.
  static Future<void> ensureAuthTokenLoaded() async {
    if (_authToken == null || _authToken!.isEmpty) {
      try {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('auth_token');
        if (token != null && token.isNotEmpty) {
          _authToken = token;
        }
      } catch (_) {}
    }
  }

  static void setDeviceLocation({String? city, String? region, String? country, String? display}) {
    if (city != null) _deviceCity = city;
    if (region != null) _deviceRegion = region;
    if (country != null) _deviceCountry = country;
    if (display != null) {
      _deviceLocation = display;
    } else {
      final parts = [_deviceCity, _deviceRegion, _deviceCountry].where((s) => s != null && s.isNotEmpty).toList();
      if (parts.isNotEmpty) _deviceLocation = parts.join(', ');
    }
  }

  static void setDeviceCoordinates(double lat, double lng) {
    _deviceLat = lat;
    _deviceLng = lng;
    if (_deviceLocation == null || _deviceLocation!.isEmpty) {
      _deviceLocation = '${lat.toStringAsFixed(4)}, ${lng.toStringAsFixed(4)}';
    }
  }

  static void setDeviceIp(String ip) {
    _deviceIp = ip;
    SharedPreferences.getInstance().then((p) {
      p.setString('geo_ip', ip);
    }).catchError((_) {});
  }

  static void setNetworkInfo({String? carrier, String? type}) {
    if (carrier != null) _networkCarrier = carrier;
    if (type != null) _networkType = type;
  }

  static Map<String, String> buildHeaders([Map<String, String>? customHeaders]) {
    final Map<String, String> headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-tenant-id': 'lassi-lounge', // Required for single restaurant mode backend logic
      'x-app-secret': 'mobile_app_secure_key_2026', // API key for mobile apps
      'x-platform': 'customer_app',
      'x-device-os': Platform.isAndroid ? 'Android' : (Platform.isIOS ? 'iOS' : Platform.operatingSystem),
      'x-device-os-version': _safeHeader(Platform.operatingSystemVersion) ?? 'Unknown',
    };

    final safeLoc = _safeHeader(_deviceLocation);
    if (safeLoc != null) headers['x-device-location'] = safeLoc;

    final safeCity = _safeHeader(_deviceCity);
    if (safeCity != null) headers['x-device-city'] = safeCity;

    final safeReg = _safeHeader(_deviceRegion);
    if (safeReg != null) headers['x-device-region'] = safeReg;

    final safeCountry = _safeHeader(_deviceCountry);
    if (safeCountry != null) headers['x-device-country'] = safeCountry;

    final safeIp = _safeHeader(_deviceIp);
    if (safeIp != null) headers['x-device-ip'] = safeIp;

    if (_deviceLat != null && _deviceLng != null) {
      headers['x-device-lat'] = _deviceLat.toString();
      headers['x-device-lng'] = _deviceLng.toString();
    }

    final safeCarrier = _safeHeader(_networkCarrier);
    if (safeCarrier != null) headers['x-network-carrier'] = safeCarrier;

    final safeType = _safeHeader(_networkType);
    if (safeType != null) headers['x-network-type'] = safeType;

    if (_authToken != null && _authToken!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $_authToken';
    }

    if (customHeaders != null) {
      headers.addAll(customHeaders);
    }
    return headers;
  }

  static String get baseUrl => _configuredBaseUrl.replaceAll(RegExp(r'/+$'), '');

  static http.Response _handleResponse(http.Response response, {String? endpoint}) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return response;
    } else {
      // Never treat login/register attempts as session expirations
      final isAuthEndpoint = endpoint != null && (
        endpoint.contains('/api/auth/login') ||
        endpoint.contains('/api/auth/register') ||
        endpoint.contains('/api/auth/social-login')
      );
      if (response.statusCode == 401 && !isAuthEndpoint) {
        _handleSessionExpired();
      }
      try {
        final decoded = json.decode(response.body);
        final errMsg = decoded['message'] ?? 'API request failed';
        throw ApiException(errMsg, response.statusCode);
      } catch (e) {
        if (e is ApiException) rethrow;
        throw ApiException('Request failed: ${response.statusCode}', response.statusCode);
      }
    }
  }

  static void _handleSessionExpired() {
    clearAuthToken();
    try {
      SharedPreferences.getInstance().then((prefs) {
        prefs.remove('auth_token');
        prefs.remove('remember_me');
      });
    } catch (_) {}

    if (onSessionExpired != null) {
      onSessionExpired!();
    }
  }

  static final http.Client _client = http.Client();

  static Future<http.Response> get(String endpoint, {Map<String, String>? headers}) async {
    await ensureAuthTokenLoaded();
    final uri = Uri.parse('$baseUrl$endpoint');
    return _send(() => _client.get(uri, headers: buildHeaders(headers)), endpoint: endpoint);
  }

  static Future<http.Response> post(String endpoint, dynamic body, {Map<String, String>? headers}) async {
    await ensureAuthTokenLoaded();
    final uri = Uri.parse('$baseUrl$endpoint');
    return _send(() => _client.post(uri, headers: buildHeaders(headers), body: json.encode(body)), endpoint: endpoint);
  }
  
  static Future<http.Response> put(String endpoint, dynamic body, {Map<String, String>? headers}) async {
    await ensureAuthTokenLoaded();
    final uri = Uri.parse('$baseUrl$endpoint');
    return _send(() => _client.put(uri, headers: buildHeaders(headers), body: json.encode(body)), endpoint: endpoint);
  }

  static Future<http.Response> patch(String endpoint, dynamic body, {Map<String, String>? headers}) async {
    await ensureAuthTokenLoaded();
    final uri = Uri.parse('$baseUrl$endpoint');
    return _send(() => _client.patch(uri, headers: buildHeaders(headers), body: json.encode(body)), endpoint: endpoint);
  }

  static Future<http.Response> delete(String endpoint, {dynamic body, Map<String, String>? headers}) async {
    await ensureAuthTokenLoaded();
    final uri = Uri.parse('$baseUrl$endpoint');
    return _send(() => _client.delete(
      uri,
      headers: buildHeaders(headers),
      body: body != null ? json.encode(body) : null,
    ), endpoint: endpoint);
  }

  static Future<http.Response> _send(Future<http.Response> Function() request, {String? endpoint}) async {
    try {
      http.Response? response;
      // Retry transient network failures (IPv6/NAT64 cold DNS, flaky Wi-Fi) up to 3 attempts
      for (int attempt = 1; attempt <= 3; attempt++) {
        try {
          response = await request().timeout(_requestTimeout);
          break;
        } on SocketException {
          if (attempt == 3) rethrow;
          await Future.delayed(Duration(milliseconds: 700 * attempt));
        } on http.ClientException {
          if (attempt == 3) rethrow;
          await Future.delayed(Duration(milliseconds: 700 * attempt));
        }
      }
      return _handleResponse(response!, endpoint: endpoint);
    } on http.ClientException {
      throw ApiException('No internet connection. Please check your network.');
    } on TimeoutException {
      throw ApiException('Server request timed out. Please try again.');
    } on SocketException {
      throw ApiException('No internet connection. Please check your network.');
    } on ApiException {
      rethrow;
    } catch (error) {
      debugPrint('[ApiService Error] Request failed on $endpoint: $error');
      throw ApiException('Unable to connect to the server: $error');
    }
  }
}

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  ApiException(this.message, [this.statusCode]);
  @override
  String toString() => message;
}

/// Backward compatibility alias
typedef HttpException = ApiException;
