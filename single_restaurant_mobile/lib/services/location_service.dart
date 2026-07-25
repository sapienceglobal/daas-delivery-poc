import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:geolocator/geolocator.dart';

class LocationService {
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
      final url = Uri.parse('https://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lon&zoom=18&addressdetails=1');
      final response = await http.get(url, headers: {
        'User-Agent': 'SapienceGlobalPoCDeliveryApp/1.0',
      });

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
      final url = Uri.parse('https://nominatim.openstreetmap.org/search?format=json&q=${Uri.encodeComponent(query)}&addressdetails=1&limit=5');
      final response = await http.get(url, headers: {
        'User-Agent': 'SapienceGlobalPoCDeliveryApp/1.0',
      });

      if (response.statusCode == 200) {
        return json.decode(response.body) as List<dynamic>;
      }
    } catch (e) {
      print('Search address error: $e');
    }
    return [];
  }

  Future<Map<String, dynamic>?> geocodeAddress(String query) async {
    try {
      final results = await searchAddress(query);
      if (results.isNotEmpty) {
        return results.first; // Returns the top result containing lat/lon
      }
    } catch (e) {
      print('Geocode address error: $e');
    }
    return null;
  }
}
