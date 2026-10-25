import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:geolocator/geolocator.dart';
import 'api_service.dart';

class LocationService {
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
          final city = addr?['city'] ?? addr?['town'] ?? addr?['suburb'] ?? addr?['county'];
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
      // Non-blocking fail-safe
    }
  }

  Future<Position?> getCurrentLocation() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw Exception('Location services are disabled.');
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        throw Exception('Location permissions are denied');
      }
    }
    
    if (permission == LocationPermission.deniedForever) {
      throw Exception('Location permissions are permanently denied, we cannot request permissions.');
    } 

    return await Geolocator.getCurrentPosition();
  }

  Future<Map<String, dynamic>?> reverseGeocode(double lat, double lon) async {
    try {
      final url = Uri.parse('${ApiService.baseUrl}/api/location/reverse-geocode?lat=$lat&lng=$lon');
      final response = await http.get(url, headers: ApiService.buildHeaders());

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (e) {
      print('Reverse geocode error: $e');
    }
    return null;
  }

  Future<List<dynamic>> searchAddress(String query) async {
    try {
      final url = Uri.parse('${ApiService.baseUrl}/api/location/autocomplete?q=${Uri.encodeComponent(query)}');
      final response = await http.get(url, headers: ApiService.buildHeaders());

      if (response.statusCode == 200) {
        return json.decode(response.body) as List<dynamic>;
      }
    } catch (e) {
      print('Search address error: $e');
    }
    return [];
  }

  Future<Map<String, dynamic>?> geocodeAddress(String queryOrPlaceId, {bool isPlaceId = false}) async {
    try {
      if (isPlaceId) {
        final url = Uri.parse('${ApiService.baseUrl}/api/location/place?place_id=$queryOrPlaceId');
        final response = await http.get(url, headers: ApiService.buildHeaders());
        if (response.statusCode == 200) {
           return json.decode(response.body);
        }
      } else {
        final url = Uri.parse('${ApiService.baseUrl}/api/location/geocode?address=${Uri.encodeComponent(queryOrPlaceId)}');
        final response = await http.get(url, headers: ApiService.buildHeaders());
        if (response.statusCode == 200) {
          final results = json.decode(response.body) as List<dynamic>;
          if (results.isNotEmpty) {
            return results.first;
          }
        }
      }
    } catch (e) {
      print('Geocode address error: $e');
    }
    return null;
  }
}
