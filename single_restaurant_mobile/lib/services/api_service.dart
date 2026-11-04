import 'dart:convert';
import 'dart:async';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // For real device testing on the same WiFi, replace this IP with your laptop's IPv4 address.
  // To find your IP, open cmd and type 'ipconfig' (look for IPv4 Address under Wireless LAN adapter).
  // When building for release, pass the production URL using --dart-define=API_BASE_URL=https://your-server.com
  static const String _configuredBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
       defaultValue: 'https://api.lassiloungeny.com', // Change your laptop's actual IP
    // defaultValue: 'http://192.168.1.3:5001',
  );
  static const Duration _requestTimeout = Duration(seconds: 20);
 
  static String? _authToken;
  static void Function()? onSessionExpired;

  // Real-time device telemetry & location context
  static String? _deviceCity;
  static String? _deviceRegion;
  static String? _deviceCountry;
  static String? _deviceLocation;
  static double? _deviceLat;
  static double? _deviceLng;
  static String? _networkCarrier;
  static String? _networkType;

  static String? get authToken => _authToken;

  static void setAuthToken(String token) {
    _authToken = token;
  }

  static void clearAuthToken() {
    _authToken = null;
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
      'x-device-os-version': Platform.operatingSystemVersion,
    };

    if (_deviceLocation != null && _deviceLocation!.isNotEmpty) {
      headers['x-device-location'] = _deviceLocation!;
    }
    if (_deviceCity != null && _deviceCity!.isNotEmpty) {
      headers['x-device-city'] = _deviceCity!;
    }
    if (_deviceRegion != null && _deviceRegion!.isNotEmpty) {
      headers['x-device-region'] = _deviceRegion!;
    }
    if (_deviceCountry != null && _deviceCountry!.isNotEmpty) {
      headers['x-device-country'] = _deviceCountry!;
    }
    if (_deviceLat != null && _deviceLng != null) {
      headers['x-device-lat'] = _deviceLat.toString();
      headers['x-device-lng'] = _deviceLng.toString();
    }
    if (_networkCarrier != null && _networkCarrier!.isNotEmpty) {
      headers['x-network-carrier'] = _networkCarrier!;
    }
    if (_networkType != null && _networkType!.isNotEmpty) {
      headers['x-network-type'] = _networkType!;
    }

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
      if (response.statusCode == 401) {
        _handleSessionExpired();
      }
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
    return _send(() => _client.get(uri, headers: buildHeaders(headers)));
  }

  static Future<http.Response> post(String endpoint, dynamic body, {Map<String, String>? headers}) async {
    await ensureAuthTokenLoaded();
    final uri = Uri.parse('$baseUrl$endpoint');
    return _send(() => _client.post(uri, headers: buildHeaders(headers), body: json.encode(body)));
  }
  
  static Future<http.Response> put(String endpoint, dynamic body, {Map<String, String>? headers}) async {
    await ensureAuthTokenLoaded();
    final uri = Uri.parse('$baseUrl$endpoint');
    return _send(() => _client.put(uri, headers: buildHeaders(headers), body: json.encode(body)));
  }

  static Future<http.Response> patch(String endpoint, dynamic body, {Map<String, String>? headers}) async {
    await ensureAuthTokenLoaded();
    final uri = Uri.parse('$baseUrl$endpoint');
    return _send(() => _client.patch(uri, headers: buildHeaders(headers), body: json.encode(body)));
  }

  static Future<http.Response> delete(String endpoint, {dynamic body, Map<String, String>? headers}) async {
    await ensureAuthTokenLoaded();
    final uri = Uri.parse('$baseUrl$endpoint');
    return _send(() => _client.delete(
      uri,
      headers: buildHeaders(headers),
      body: body != null ? json.encode(body) : null,
    ));
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
