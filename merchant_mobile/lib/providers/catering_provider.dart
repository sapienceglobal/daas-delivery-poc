import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class CateringModel {
  final String id;
  final String customerName;
  final String customerPhone;
  final String customerEmail;
  final DateTime eventDate;
  final String eventType;
  final int guestCount;
  final String message;
  final String status;
  final String packagePreference;
  final String budgetRange;

  CateringModel({
    required this.id,
    required this.customerName,
    required this.customerPhone,
    required this.customerEmail,
    required this.eventDate,
    required this.eventType,
    required this.guestCount,
    required this.message,
    required this.status,
    required this.packagePreference,
    required this.budgetRange,
  });

  factory CateringModel.fromJson(Map<String, dynamic> json) {
    return CateringModel(
      id: json['_id'] ?? '',
      customerName: json['customerName'] ?? 'Unknown',
      customerPhone: json['customerPhone'] ?? '',
      customerEmail: json['customerEmail'] ?? '',
      eventDate: json['eventDate'] != null ? DateTime.parse(json['eventDate']) : DateTime.now(),
      eventType: json['eventType'] ?? 'Event',
      guestCount: json['guestCount'] ?? 0,
      message: json['additionalNotes'] ?? '',
      status: json['status'] ?? 'new',
      packagePreference: json['packagePreference'] ?? '',
      budgetRange: json['budgetRange'] ?? '',
    );
  }

  CateringModel copyWith({String? status}) {
    return CateringModel(
      id: id,
      customerName: customerName,
      customerPhone: customerPhone,
      customerEmail: customerEmail,
      eventDate: eventDate,
      eventType: eventType,
      guestCount: guestCount,
      message: message,
      status: status ?? this.status,
      packagePreference: packagePreference,
      budgetRange: budgetRange,
    );
  }
}

class CateringProvider extends ChangeNotifier {
  List<CateringModel> _enquiries = [];
  bool _isLoading = true;
  bool _isInitialized = false;
  String? _error;
  String? _restaurantId;

  List<CateringModel> get enquiries => _enquiries;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchEnquiries({bool force = false}) async {
    if (_isInitialized && !force) return;
    
    if (_restaurantId == null) {
      try {
        final res = await ApiService.get('/api/restaurants/merchant/my');
        final decoded = jsonDecode(res.body);
        if (decoded != null && decoded['data'] != null) {
           _restaurantId = decoded['data']['_id'];
        }
      } catch (e) {
        print("Could not fetch restaurant ID: $e");
        return;
      }
    }

    if (_restaurantId == null) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.get('/api/catering/restaurant/$_restaurantId');
      final decoded = jsonDecode(response.body);
      if (decoded != null && decoded['data'] != null) {
        final List<dynamic> data = decoded['data'];
        _enquiries = data.map((json) => CateringModel.fromJson(json)).toList();
        
        // Sort descending by created date or event date
        _enquiries.sort((a, b) => b.eventDate.compareTo(a.eventDate));
      }
    } catch (e) {
      _error = 'Failed to load catering enquiries: $e';
    } finally {
      _isLoading = false;
      _isInitialized = true;
      notifyListeners();
    }
  }

  Future<void> updateStatus(String id, String status) async {
    try {
      await ApiService.put('/api/catering/$id/status', {'status': status});
      
      final index = _enquiries.indexWhere((e) => e.id == id);
      if (index != -1) {
        _enquiries[index] = _enquiries[index].copyWith(status: status);
        notifyListeners();
      }
    } catch (e) {
      rethrow;
    }
  }
}
