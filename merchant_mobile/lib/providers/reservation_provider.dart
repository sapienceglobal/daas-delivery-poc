import 'dart:convert';
import 'package:flutter/material.dart';
import '../models/reservation_model.dart';
import '../services/api_service.dart';

class ReservationProvider extends ChangeNotifier {
  List<ReservationModel> _reservations = [];
  bool _isLoading = false;
  String? _error;
  String? _restaurantId;

  List<ReservationModel> get reservations => _reservations;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchReservations() async {
    if (_restaurantId == null) {
      try {
        final res = await ApiService.get('/api/restaurants/merchant/my');
        final decoded = jsonDecode(res.body);
        if (decoded != null && decoded['data'] != null) {
           _restaurantId = decoded['data']['_id'];
        }
      } catch (e) {
        print("Could not fetch restaurant ID: \$e");
        return;
      }
    }

    if (_restaurantId == null) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.get('/api/reservations/restaurant/$_restaurantId');
      final decoded = jsonDecode(response.body);
      if (decoded != null && decoded['data'] != null) {
        final List<dynamic> data = decoded['data'];
        _reservations = data.map((json) => ReservationModel.fromJson(json)).toList();
        
        // Sort descending by date/time
        _reservations.sort((a, b) => b.date.compareTo(a.date));
      }
    } catch (e) {
      _error = 'Failed to load reservations: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> createReservation(Map<String, dynamic> data) async {
    try {
      if (_restaurantId != null) {
        data['restaurantId'] = _restaurantId;
      }
      final response = await ApiService.post('/api/reservations', data);
      final decoded = jsonDecode(response.body);
      if (decoded != null && decoded['data'] != null) {
        _reservations.insert(0, ReservationModel.fromJson(decoded['data']));
        notifyListeners();
      } else {
        await fetchReservations();
      }
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updateReservationStatus(String id, String status) async {
    try {
      await ApiService.put('/api/reservations/$id/status', {'status': status});
      
      // Optimistic update
      final index = _reservations.indexWhere((r) => r.id == id);
      if (index != -1) {
        _reservations[index] = _reservations[index].copyWith(status: status);
        notifyListeners();
      }
    } catch (e) {
      rethrow;
    }
  }

  // Derived stats for a given date
  Map<String, dynamic> getStatsForDate(DateTime date) {
    final dateStr = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
    
    final daysRes = _reservations.where((r) {
      final rDateStr = '${r.date.year}-${r.date.month.toString().padLeft(2, '0')}-${r.date.day.toString().padLeft(2, '0')}';
      return rDateStr == dateStr;
    }).toList();

    int confirmed = 0;
    int pending = 0;
    int cancelled = 0;
    int seated = 0;
    int totalGuests = 0;

    for (var r in daysRes) {
      if (r.status == 'confirmed') confirmed++;
      if (r.status == 'pending') pending++;
      if (r.status == 'cancelled') cancelled++;
      if (r.status == 'seated') seated++;
      totalGuests += r.partySize;
    }

    return {
      'total': daysRes.length,
      'confirmed': confirmed,
      'pending': pending,
      'cancelled': cancelled,
      'seated': seated,
      'totalGuests': totalGuests,
    };
  }
}
