import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class SupportMessagesProvider with ChangeNotifier {
  List<Map<String, dynamic>> _messages = [];
  bool _isLoading = false;
  String _error = '';
  String _statusFilter = 'all';

  List<Map<String, dynamic>> get messages => _messages;
  bool get isLoading => _isLoading;
  String get error => _error;
  String get statusFilter => _statusFilter;

  int get totalMessages => _messages.length;
  int get newMessagesCount => _messages.where((m) => m['status'] == 'new').length;
  int get readMessagesCount => _messages.where((m) => m['status'] == 'read').length;
  int get repliedMessagesCount => _messages.where((m) => m['status'] == 'replied').length;

  Future<void> fetchMessages({String? status}) async {
    _isLoading = true;
    _error = '';
    if (status != null) {
      _statusFilter = status;
    }
    notifyListeners();

    try {
      String endpoint = '/api/contact/merchant/messages';
      if (_statusFilter != 'all') {
        endpoint += '?status=$_statusFilter';
      }

      final response = await ApiService.get(endpoint);
      final decoded = jsonDecode(response.body);

      if (response.statusCode == 200 && decoded['success'] == true && decoded['data'] != null) {
        final List<dynamic> list = decoded['data'];
        _messages = list.map((m) => Map<String, dynamic>.from(m as Map)).toList();
      } else {
        _error = decoded['message'] ?? 'Failed to load messages';
      }
    } catch (e) {
      _error = 'Error connecting to server: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateMessageStatus(String messageId, String newStatus) async {
    try {
      final response = await ApiService.patch(
        '/api/contact/merchant/messages/$messageId',
        {'status': newStatus},
      );
      final decoded = jsonDecode(response.body);

      if (response.statusCode == 200 && decoded['success'] == true) {
        final idx = _messages.indexWhere((m) => m['_id'] == messageId);
        if (idx != -1) {
          _messages[idx]['status'] = newStatus;
          notifyListeners();
        }
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Failed to update message status: $e');
      return false;
    }
  }
}
