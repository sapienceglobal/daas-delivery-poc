import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/services/api_service.dart';
import 'package:single_restaurant_mobile/services/socket_service.dart';

class NotificationModel {
  final String id;
  final String title;
  final String body;
  final String type;
  final bool isRead;
  final String? image;
  final String? actionUrl;
  final DateTime createdAt;

  NotificationModel({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.isRead,
    this.image,
    this.actionUrl,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    DateTime parsedDate;
    try {
      parsedDate = json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : DateTime.now();
    } catch (_) {
      parsedDate = DateTime.now();
    }

    return NotificationModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      title: json['title'] ?? '',
      body: json['body'] ?? '',
      type: json['type'] ?? 'system',
      isRead: json['isRead'] ?? false,
      image: json['image'],
      actionUrl: json['actionUrl'],
      createdAt: parsedDate,
    );
  }
}

class NotificationProvider extends ChangeNotifier {
  List<NotificationModel> _notifications = [];
  int _unreadCount = 0;
  bool _isLoading = false;

  List<NotificationModel> get notifications => _notifications;
  int get unreadCount {
    if (_unreadCount > 0) return _unreadCount;
    return _notifications.where((n) => !n.isRead).length;
  }
  bool get isLoading => _isLoading;
  bool get hasUnread => unreadCount > 0 || _notifications.any((n) => !n.isRead);

  NotificationProvider() {
    _initSocket();
  }

  void _initSocket() {
    SocketService().on('new_notification', (data) {
      if (data != null) {
        try {
          final newNotification = NotificationModel.fromJson(Map<String, dynamic>.from(data));
          final index = _notifications.indexWhere((n) => n.id.isNotEmpty && n.id == newNotification.id);
          if (index != -1) {
            _notifications[index] = newNotification;
          } else {
            _notifications.insert(0, newNotification);
          }
          _unreadCount = _notifications.where((n) => !n.isRead).length;
          notifyListeners();
        } catch (e) {
          debugPrint('Error handling socket new_notification: $e');
        }
      }
    });
  }

  Future<void> fetchNotifications() async {
    if (_isLoading) return;
    _isLoading = true;
    notifyListeners();

    try {
      final response = await ApiService.get('/api/notifications');
      final data = json.decode(response.body);

      if (data['success'] == true) {
        final List<dynamic> items = data['data'] ?? [];
        _notifications = items.map((item) => NotificationModel.fromJson(item)).toList();
        if (data['meta'] != null && data['meta']['unreadCount'] != null) {
          _unreadCount = (data['meta']['unreadCount'] as num).toInt();
        } else {
          _unreadCount = _notifications.where((n) => !n.isRead).length;
        }
      }
    } catch (e) {
      debugPrint('Error fetching notifications: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      final response = await ApiService.put('/api/notifications/$id/read', {});
      final data = json.decode(response.body);

      if (data['success'] == true) {
        if (id == 'all') {
          for (var i = 0; i < _notifications.length; i++) {
            if (!_notifications[i].isRead) {
              _notifications[i] = NotificationModel(
                id: _notifications[i].id,
                title: _notifications[i].title,
                body: _notifications[i].body,
                type: _notifications[i].type,
                isRead: true,
                image: _notifications[i].image,
                actionUrl: _notifications[i].actionUrl,
                createdAt: _notifications[i].createdAt,
              );
            }
          }
          _unreadCount = 0;
        } else {
          final index = _notifications.indexWhere((n) => n.id == id);
          if (index != -1 && !_notifications[index].isRead) {
             _notifications[index] = NotificationModel(
                id: _notifications[index].id,
                title: _notifications[index].title,
                body: _notifications[index].body,
                type: _notifications[index].type,
                isRead: true,
                image: _notifications[index].image,
                actionUrl: _notifications[index].actionUrl,
                createdAt: _notifications[index].createdAt,
              );
             _unreadCount = _notifications.where((n) => !n.isRead).length;
          }
        }
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error marking notification as read: $e');
    }
  }

  Future<void> saveFcmToken(String token) async {
    try {
      await ApiService.post('/api/auth/me/fcm-token', {'fcmToken': token});
    } catch (e) {
      debugPrint('Error saving FCM token: $e');
    }
  }

  Future<void> deleteNotification(String id) async {
    try {
      // Optimistic update
      final index = _notifications.indexWhere((n) => n.id == id);
      if (index != -1) {
        _notifications.removeAt(index);
        _unreadCount = _notifications.where((n) => !n.isRead).length;
        notifyListeners();
      }

      final response = await ApiService.delete('/api/notifications/$id');
      final data = json.decode(response.body);
      
      if (data['success'] != true) {
        debugPrint('Failed to delete on server');
      }
    } catch (e) {
      debugPrint('Error deleting notification: $e');
    }
  }

  /// Clears all notification data from memory. Call this on logout.
  void clear() {
    _notifications = [];
    _unreadCount = 0;
    _isLoading = false;
    notifyListeners();
  }
}
