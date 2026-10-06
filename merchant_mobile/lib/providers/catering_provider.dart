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
    DateTime parsedDate = DateTime.now();
    if (json['eventDate'] != null) {
      try {
        parsedDate = DateTime.parse(json['eventDate']);
      } catch (_) {}
    }

    return CateringModel(
      id: json['_id']?.toString() ?? '',
      customerName: json['customerName']?.toString() ?? 'Unknown',
      customerPhone: json['customerPhone']?.toString() ?? '',
      customerEmail: json['customerEmail']?.toString() ?? '',
      eventDate: parsedDate,
      eventType: json['eventType']?.toString() ?? 'Event',
      guestCount: (json['guestCount'] is num) ? (json['guestCount'] as num).toInt() : 0,
      message: (json['additionalNotes'] ?? json['message'])?.toString() ?? '',
      status: json['status']?.toString().toLowerCase() ?? 'new',
      packagePreference: json['packagePreference']?.toString() ?? 'Custom / Unsure',
      budgetRange: json['budgetRange']?.toString() ?? '',
    );
  }

  CateringModel copyWith({
    String? status,
    String? customerName,
    String? customerPhone,
    String? customerEmail,
    DateTime? eventDate,
    String? eventType,
    int? guestCount,
    String? message,
    String? packagePreference,
    String? budgetRange,
  }) {
    return CateringModel(
      id: id,
      customerName: customerName ?? this.customerName,
      customerPhone: customerPhone ?? this.customerPhone,
      customerEmail: customerEmail ?? this.customerEmail,
      eventDate: eventDate ?? this.eventDate,
      eventType: eventType ?? this.eventType,
      guestCount: guestCount ?? this.guestCount,
      message: message ?? this.message,
      status: status ?? this.status,
      packagePreference: packagePreference ?? this.packagePreference,
      budgetRange: budgetRange ?? this.budgetRange,
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
  String? get restaurantId => _restaurantId;

  List<CateringModel> get _sampleEnquiries => [
    CateringModel(
      id: 'cat_1',
      customerName: 'Manohar Prasad',
      customerPhone: '08851114187',
      customerEmail: 'manoharkumar006@gmail.com',
      eventDate: DateTime(2026, 8, 22),
      eventType: 'Birthday Party',
      guestCount: 1000,
      message: 'Test',
      status: 'confirmed',
      packagePreference: 'Custom / Unsure',
      budgetRange: '',
    ),
    CateringModel(
      id: 'cat_2',
      customerName: 'Adarsh Sharma',
      customerPhone: '8006708285',
      customerEmail: 'adarshsharma7p@gmail.com',
      eventDate: DateTime(2026, 8, 5),
      eventType: 'Family Gathering',
      guestCount: 40,
      message: 'I need Extra Sweets .',
      status: 'closed',
      packagePreference: 'Custom / Unsure',
      budgetRange: '',
    ),
    CateringModel(
      id: 'cat_3',
      customerName: 'Ritika Kapoor',
      customerPhone: '9876543210',
      customerEmail: 'ritikakapoor@gmail.com',
      eventDate: DateTime(2026, 9, 12),
      eventType: 'Corporate Event',
      guestCount: 250,
      message: 'Require high tea and lunch buffet with live lassi counter.',
      status: 'new',
      packagePreference: 'Lunch + High Tea',
      budgetRange: '',
    ),
  ];

  Future<void> fetchEnquiries({bool force = false, String? explicitRestaurantId}) async {
    if (_isInitialized && !force) return;

    if (explicitRestaurantId != null && explicitRestaurantId.isNotEmpty) {
      _restaurantId = explicitRestaurantId;
    }

    if (_restaurantId == null) {
      try {
        final res = await ApiService.get('/api/restaurants/merchant/my');
        final decoded = jsonDecode(res.body);
        if (decoded != null && decoded['data'] != null) {
          _restaurantId = decoded['data']['_id']?.toString();
        }
      } catch (e) {
        debugPrint("[CateringProvider] Could not fetch restaurant ID: $e");
      }
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      if (_restaurantId != null && _restaurantId!.isNotEmpty) {
        final response = await ApiService.get('/api/catering/restaurant/$_restaurantId');
        final decoded = jsonDecode(response.body);
        if (decoded != null && decoded['data'] != null) {
          final List<dynamic> data = decoded['data'];
          if (data.isNotEmpty) {
            _enquiries = data.map((json) => CateringModel.fromJson(json)).toList();
            _enquiries.sort((a, b) => b.eventDate.compareTo(a.eventDate));
          } else {
            _enquiries = _sampleEnquiries;
          }
        } else {
          _enquiries = _sampleEnquiries;
        }
      } else {
        _enquiries = _sampleEnquiries;
      }
    } catch (e) {
      _error = 'Failed to load catering enquiries: $e';
      _enquiries = _sampleEnquiries;
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
        _enquiries[index] = _enquiries[index].copyWith(status: status.toLowerCase());
        notifyListeners();
      }
    } catch (e) {
      // Local optimistic update for smooth UI
      final index = _enquiries.indexWhere((e) => e.id == id);
      if (index != -1) {
        _enquiries[index] = _enquiries[index].copyWith(status: status.toLowerCase());
        notifyListeners();
      }
      rethrow;
    }
  }

  Future<void> createEnquiry(Map<String, dynamic> data) async {
    try {
      final payload = {
        if (_restaurantId != null) 'restaurantId': _restaurantId,
        ...data,
      };
      final res = await ApiService.post('/api/catering', payload);
      final decoded = jsonDecode(res.body);
      if (decoded != null && decoded['data'] != null) {
        final newEnquiry = CateringModel.fromJson(decoded['data']);
        _enquiries.insert(0, newEnquiry);
        notifyListeners();
      } else {
        // Fallback local insertion
        final newEnquiry = CateringModel(
          id: 'cat_${DateTime.now().millisecondsSinceEpoch}',
          customerName: data['customerName'] ?? 'Guest',
          customerPhone: data['customerPhone'] ?? '',
          customerEmail: data['customerEmail'] ?? '',
          eventDate: data['eventDate'] != null ? DateTime.parse(data['eventDate']) : DateTime.now(),
          eventType: data['eventType'] ?? 'Event',
          guestCount: int.tryParse(data['guestCount'].toString()) ?? 50,
          message: data['additionalNotes'] ?? '',
          status: 'new',
          packagePreference: data['packagePreference'] ?? 'Custom / Unsure',
          budgetRange: data['budgetRange'] ?? '',
        );
        _enquiries.insert(0, newEnquiry);
        notifyListeners();
      }
    } catch (e) {
      // Optimistic local add
      final newEnquiry = CateringModel(
        id: 'cat_${DateTime.now().millisecondsSinceEpoch}',
        customerName: data['customerName'] ?? 'Guest',
        customerPhone: data['customerPhone'] ?? '',
        customerEmail: data['customerEmail'] ?? '',
        eventDate: data['eventDate'] != null ? DateTime.parse(data['eventDate']) : DateTime.now(),
        eventType: data['eventType'] ?? 'Event',
        guestCount: int.tryParse(data['guestCount'].toString()) ?? 50,
        message: data['additionalNotes'] ?? '',
        status: 'new',
        packagePreference: data['packagePreference'] ?? 'Custom / Unsure',
        budgetRange: data['budgetRange'] ?? '',
      );
      _enquiries.insert(0, newEnquiry);
      notifyListeners();
    }
  }
}
