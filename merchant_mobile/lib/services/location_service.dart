import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:geolocator/geolocator.dart';
import 'api_service.dart';

class LocationService {
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;
  LocationService._internal();

  /// Asynchronously request location permission at startup without blocking or crashing.
  /// If granted, saves position and reverse-geocoded address into ApiService telemetry context.
  Future<void> requestStartupLocationPermission() async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return;

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
        Position? position;
        try {
          position = await Geolocator.getLastKnownPosition();
        } catch (_) {}

        position ??= await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.medium,
            timeLimit: Duration(seconds: 5),
          ),
        );

        ApiService.setDeviceCoordinates(position.latitude, position.longitude);

        final geo = await reverseGeocode(position.latitude, position.longitude);
        if (geo != null) {
          final addr = geo['address'] is Map<String, dynamic> ? geo['address'] as Map<String, dynamic> : null;
          final city = addr?['city'] ?? addr?['town'] ?? addr?['suburb'] ?? addr?['county'] ?? addr?['village'];
          final region = addr?['state'] ?? addr?['region'];
          final country = addr?['country'];
          final display = geo['displayName'] ?? geo['display_name'] ?? [city, region, country].where((s) => s != null && s.toString().isNotEmpty).join(', ');
          
          ApiService.setDeviceLocation(
            city: city?.toString(),
            region: region?.toString(),
            country: country?.toString(),
            display: display?.toString(),
          );
        }
      }
    } catch (e) {
      debugPrint('[LocationService] Non-blocking startup error: $e');
    }
  }

  Future<Position?> getCurrentLocation() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw Exception('Location services are disabled.');
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        throw Exception('Location permissions are denied');
      }
    }
    
    if (permission == LocationPermission.deniedForever) {
      throw Exception('Location permissions are permanently denied.');
    } 

    return await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );
  }

  Future<Map<String, dynamic>?> reverseGeocode(double lat, double lon) async {
    try {
      final url = Uri.parse('${ApiService.baseUrl}/api/location/reverse-geocode?lat=$lat&lng=$lon');
      final response = await http.get(url, headers: ApiService.buildHeaders()).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (e) {
      debugPrint('[LocationService] Reverse geocode error: $e');
    }
    return null;
  }
}
