import 'dart:convert';
import 'package:single_restaurant_mobile/services/api_service.dart';

class RestaurantService {
  // Hardcoded for now as it is a single restaurant app. We use the slug/id accepted by backend.
  static const String restaurantId = 'lassi-lounge';

  Future<Map<String, dynamic>?> getRestaurantDetails() async {
    try {
      final response = await ApiService.get('/api/restaurants/$restaurantId');
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['data']; // Returns restaurant details along with the `menu` array (categories with items)
      }
      return null;
    } catch (e) {
      print('Error fetching restaurant details: $e');
      return null;
    }
  }

  Future<List<dynamic>?> searchMenu(String query) async {
    try {
      final response = await ApiService.post('/api/ai/search', {
        'restaurantId': restaurantId,
        'query': query,
      });
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['data']; // Returns list of menu items
      }
      return null;
    } catch (e) {
      print('Error searching menu: $e');
      return null;
    }
  }
}
