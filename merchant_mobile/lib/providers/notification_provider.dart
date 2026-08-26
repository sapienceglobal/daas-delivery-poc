import 'dart:convert';
import 'package:flutter/material.dart';
import '../models/notification_model.dart';
import '../services/api_service.dart';

class NotificationProvider with ChangeNotifier {
  List<NotificationModel> _notifications = [];
  bool _isLoading = false;
  String? _error;

  List<NotificationModel> get notifications => _notifications;
  bool get isLoading => _isLoading;
  String? get error => _error;

  int get unreadCount => _notifications.where((n) => !n.isRead).length;

  Future<void> fetchNotifications() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.getNotifications();
      final data = json.decode(response.body);
      
      if (data['success'] && data['data'] != null) {
        final List<dynamic> items = data['data'];
        _notifications = items.map((e) => NotificationModel.fromJson(e)).toList();
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> markAsRead(String id) async {
    // Optimistic update
    final index = _notifications.indexWhere((n) => n.id == id);
    if (index == -1 || _notifications[index].isRead) return;

    final originalNotification = _notifications[index];
    _notifications[index] = NotificationModel(
      id: originalNotification.id,
      title: originalNotification.title,
      body: originalNotification.body,
      image: originalNotification.image,
      type: originalNotification.type,
      actionUrl: originalNotification.actionUrl,
      isRead: true,
      createdAt: originalNotification.createdAt,
    );
    notifyListeners();

    try {
      await ApiService.markNotificationRead(id);
    } catch (e) {
      // Revert on failure
      _notifications[index] = originalNotification;
      notifyListeners();
      debugPrint('Failed to mark notification as read: $e');
    }
  }

  void addNotification(NotificationModel notification) {
    _notifications.insert(0, notification);
    notifyListeners();
  }
}
