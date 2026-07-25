import 'dart:convert';
import 'package:single_restaurant_mobile/services/api_service.dart';

class MenuService {
  final String restaurantId = 'lassi-lounge';

  Future<List<dynamic>> getCategories() async {
    final response = await ApiService.get('/api/menu/categories/$restaurantId');
    final data = json.decode(response.body);
    return data['data'] ?? [];
  }

  Future<List<dynamic>> getMenu() async {
    final response = await ApiService.get('/api/menu/restaurant/$restaurantId');
    final data = json.decode(response.body);
    return data['data'] ?? [];
  }
}
