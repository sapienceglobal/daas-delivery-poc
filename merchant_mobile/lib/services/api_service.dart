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
  static void Function()? onSessionExpired;

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
        final token = prefs.getString('token');
        if (token != null && token.isNotEmpty) {
          _authToken = token;
        }
      } catch (_) {}
    }
  }

  static String? _deviceLocation;
  static String? _deviceCity;
  static String? _deviceRegion;
  static String? _deviceCountry;
  static double? _deviceLat;
  static double? _deviceLng;
  static String? _networkCarrier;
  static String? _networkType;

  /// Loads cached location/telemetry from SharedPreferences immediately upon boot
  static Future<void> initTelemetry(SharedPreferences? prefs) async {
    try {
      final p = prefs ?? await SharedPreferences.getInstance();
      _deviceCity = p.getString('geo_city');
      _deviceRegion = p.getString('geo_region');
      _deviceCountry = p.getString('geo_country');
      _deviceLocation = p.getString('geo_display');
      _deviceLat = p.getDouble('geo_lat');
      _deviceLng = p.getDouble('geo_lng');
    } catch (_) {}
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
    SharedPreferences.getInstance().then((p) {
      if (_deviceCity != null) p.setString('geo_city', _deviceCity!);
      if (_deviceRegion != null) p.setString('geo_region', _deviceRegion!);
      if (_deviceCountry != null) p.setString('geo_country', _deviceCountry!);
      if (_deviceLocation != null) p.setString('geo_display', _deviceLocation!);
    }).catchError((_) {});
  }

  static void setDeviceCoordinates(double lat, double lng) {
    _deviceLat = lat;
    _deviceLng = lng;
    if (_deviceLocation == null || _deviceLocation!.isEmpty) {
      _deviceLocation = '${lat.toStringAsFixed(4)}, ${lng.toStringAsFixed(4)}';
    }
    SharedPreferences.getInstance().then((p) {
      p.setDouble('geo_lat', lat);
      p.setDouble('geo_lng', lng);
      if (_deviceLocation != null) p.setString('geo_display', _deviceLocation!);
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
      'x-tenant-id': 'lassi-lounge', 
      'x-app-secret': 'mobile_app_secure_key_2026',
      'x-platform': 'merchant_app', 
      'x-device-os': Platform.isAndroid ? 'Android' : (Platform.isIOS ? 'iOS' : Platform.operatingSystem),
      'x-device-os-version': Platform.operatingSystemVersion,
    };

    if (_authToken != null && _authToken!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $_authToken';
    }

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
        prefs.remove('token');
        prefs.remove('user');
        prefs.remove('restaurantId');
        prefs.remove('rememberMe');
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
    return _send(() => _client.delete(uri, headers: buildHeaders(headers), body: body != null ? json.encode(body) : null));
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
  static Future<http.Response> getCustomers(String restaurantId, {int? page, int? limit, String? search}) async {
    String endpoint = '/api/crm/restaurant/$restaurantId/customers';
    final params = <String>[];
    if (page != null) params.add('page=$page');
    if (limit != null) params.add('limit=$limit');
    if (search != null && search.isNotEmpty) params.add('search=${Uri.encodeComponent(search)}');
    if (params.isNotEmpty) endpoint += '?${params.join('&')}';
    return get(endpoint);
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
