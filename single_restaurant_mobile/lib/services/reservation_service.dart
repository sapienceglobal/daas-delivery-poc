import 'dart:convert';
import 'package:single_restaurant_mobile/services/api_service.dart';
import 'package:flutter/foundation.dart';

class ReservationService {
  Future<List<dynamic>> getTables(String restaurantId) async {
    try {
      final response = await ApiService.get('/api/tables/$restaurantId');
      final data = json.decode(response.body);
      
      if (data['success'] == true && data['data'] != null) {
        return data['data'] as List<dynamic>;
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching tables: $e');
      return [];
    }
  }

  Future<Map<String, dynamic>> createReservation(Map<String, dynamic> reservationData) async {
    try {
      final response = await ApiService.post('/api/reservations', reservationData);
      final data = json.decode(response.body);
      
      return data;
    } catch (e) {
      debugPrint('Error creating reservation: $e');
      return {'success': false, 'message': e.toString()};
    }
  }
}
