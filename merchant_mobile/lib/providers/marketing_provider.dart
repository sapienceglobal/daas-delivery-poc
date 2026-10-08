import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class MarketingProvider with ChangeNotifier {
  List<Map<String, dynamic>> _campaigns = [];
  bool _isLoading = false;
  bool _isSending = false;
  bool _isUploadingImage = false;
  String _error = '';

  List<Map<String, dynamic>> get campaigns => _campaigns;
  bool get isLoading => _isLoading;
  bool get isSending => _isSending;
  bool get isUploadingImage => _isUploadingImage;
  String get error => _error;

  int get totalCampaigns => _campaigns.length;
  int get successfulBroadcasts => _campaigns.where((c) => c['status'] == 'sent').length;
  int get totalReach => _campaigns.fold(0, (sum, c) => sum + ((c['successCount'] as num?)?.toInt() ?? 0));

  Future<void> fetchCampaigns(String? restaurantId) async {
    _isLoading = true;
    _error = '';
    notifyListeners();

    try {
      final query = (restaurantId != null && restaurantId.isNotEmpty) ? '?restaurantId=$restaurantId' : '';
      final response = await ApiService.get('/api/marketing$query');
      final decoded = jsonDecode(response.body);

      if (response.statusCode == 200 && decoded['data'] != null) {
        final List<dynamic> list = decoded['data'];
        _campaigns = list.map((c) => Map<String, dynamic>.from(c as Map)).toList();
      } else {
        _error = decoded['message'] ?? 'Failed to load campaigns';
      }
    } catch (e) {
      _error = 'Error loading campaigns: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> broadcastCampaign({
    required String title,
    required String message,
    String? imageUrl,
    String? actionUrl,
    String audience = 'all_customers',
    String? restaurantId,
  }) async {
    _isSending = true;
    _error = '';
    notifyListeners();

    try {
      final payload = {
        'title': title,
        'message': message,
        'imageUrl': imageUrl ?? '',
        'actionUrl': actionUrl ?? '',
        'audience': audience,
        if (restaurantId != null && restaurantId.isNotEmpty) 'restaurantId': restaurantId,
      };

      final response = await ApiService.post('/api/marketing', payload);
      final decoded = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (decoded['data'] != null) {
          _campaigns.insert(0, Map<String, dynamic>.from(decoded['data'] as Map));
        } else {
          // Re-fetch
          await fetchCampaigns(restaurantId);
        }
        _isSending = false;
        notifyListeners();
        return true;
      } else {
        _error = decoded['message'] ?? 'Failed to broadcast campaign';
        _isSending = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Broadcast error: $e';
      _isSending = false;
      notifyListeners();
      return false;
    }
  }

  Future<String?> uploadHeroImage(String filePath) async {
    _isUploadingImage = true;
    _error = '';
    notifyListeners();

    try {
      final url = await ApiService.uploadImage(filePath, folder: 'restaurant-platform/marketing');
      if (url != null && url.isNotEmpty) {
        return url;
      } else {
        _error = 'Image upload failed';
        return null;
      }
    } catch (e) {
      _error = 'Upload error: $e';
      return null;
    } finally {
      _isUploadingImage = false;
      notifyListeners();
    }
  }
}
