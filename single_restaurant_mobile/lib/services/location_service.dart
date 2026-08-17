import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:geolocator/geolocator.dart';
import 'api_service.dart';

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
