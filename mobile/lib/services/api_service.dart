import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // --- CHOOSE ENVIRONMENT ---
  // Set this to true to use the live production/staging backend.
  // Set to false to use local laptop development backend.
  static const bool _useLiveBackend = false;
  static const String _liveBackendUrl = 'http://195.35.20.207:5001';

  // --- LOCAL DEVICE CONFIGURATION ---
  // 1. Wi-Fi Method: If testing on a real device over the same Wi-Fi, change this to your laptop's 
  //    local IP address (e.g. '192.168.1.15').
  static const String? _localWifiIp = '10.55.117.68';
  
  // 2. USB Data Cable Method: Run "adb reverse tcp:5000 tcp:5000" in your laptop's terminal, 
  //    and set this flag to true (it forwards phone localhost queries to your laptop's backend).
  static const bool _useAdbReverse = false;

  static String get baseUrl {
    if (_useLiveBackend) {
      return _liveBackendUrl;
    }
    if (kIsWeb) {
      return 'http://localhost:5000';
    }
    if (_localWifiIp != null && _localWifiIp!.isNotEmpty) {
      return 'http://$_localWifiIp:5000';
    }
    if (_useAdbReverse) {
      return 'http://localhost:5000';
    }
    try {
      if (Platform.isAndroid) {
        // Android Emulator loops back to development computer localhost via 10.0.2.2
        return 'http://10.0.2.2:5000';
      }
    } catch (_) {}
    return 'http://localhost:5000';
  }

  static Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('marketplace_token');
    
    final Map<String, String> headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    
    return headers;
  }

  static http.Response _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return response;
    } else {
      // Decode error if possible
      try {
        final decoded = json.decode(response.body);
        final errMsg = decoded['message'] ?? 'API request failed';
        final errDetail = decoded['error'];
        if (errDetail != null) {
          throw HttpException('$errMsg: $errDetail');
        }
        throw HttpException(errMsg);
      } catch (e) {
        if (e is HttpException) rethrow;
        throw HttpException('Request failed: ${response.statusCode} - ${response.reasonPhrase}');
      }
    }
  }

  static Future<http.Response> get(String endpoint) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    final headers = await _getHeaders();
    final response = await http.get(uri, headers: headers);
    return _handleResponse(response);
  }

  static Future<http.Response> post(String endpoint, Map<String, dynamic> body) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    final headers = await _getHeaders();
    final response = await http.post(uri, headers: headers, body: json.encode(body));
    return _handleResponse(response);
  }

  static Future<http.Response> put(String endpoint, Map<String, dynamic> body) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    final headers = await _getHeaders();
    final response = await http.put(uri, headers: headers, body: json.encode(body));
    return _handleResponse(response);
  }

  static Future<http.Response> delete(String endpoint) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    final headers = await _getHeaders();
    final response = await http.delete(uri, headers: headers);
    return _handleResponse(response);
  }
}

class HttpException implements Exception {
  final String message;
  HttpException(this.message);
  @override
  String toString() => message;
}
