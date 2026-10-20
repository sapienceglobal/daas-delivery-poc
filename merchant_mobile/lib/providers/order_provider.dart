import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/order_model.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';
import '../services/server_clock.dart';

class OrderProvider extends ChangeNotifier {
  final SocketService socketService;

  List<OrderModel> _orders = [];
  bool _isLoading = false;
  bool _isInitialized = false;
  bool _isFetching = false;
  String? _error;
  String? _restaurantId;
  int _retryAttempts = 0;
  Timer? _retryTimer;

  // Pagination state
  int _currentPage = 1;
  bool _hasMore = true;
  bool _isLoadingMore = false;
  int _totalOrders = 0;
  Map<String, int> _orderStats = {
    'total': 0,
    'new': 0,
    'preparing': 0,
    'ready': 0,
    'picked_up': 0,
    'completed': 0,
    'cancelled': 0,
  };

  OrderProvider(this.socketService) {
    _initSocketListeners();
    socketService.onReconnect(() {
      fetchOrders(force: true);
    });
  }

  List<OrderModel> get orders => _orders;
  bool get isLoading => _isLoading;
  bool get isInitialized => _isInitialized;
  String? get error => _error;
  String? get restaurantId => _restaurantId;
  int get currentPage => _currentPage;
  bool get hasMore => _hasMore;
  bool get isLoadingMore => _isLoadingMore;
  int get totalOrders => _totalOrders;
  Map<String, int> get orderStats => _orderStats;

  // Set the restaurant ID and load orders
  void setRestaurantId(String id) {
    _restaurantId = id;
    fetchOrders(force: true);
  }

  Future<String?> _resolveRestaurantId() async {
    if (_restaurantId != null && _restaurantId!.isNotEmpty) {
      return _restaurantId;
    }

    // 1. Try resolving instantly from SharedPreferences without network latency
    try {
      final prefs = await SharedPreferences.getInstance();
      final cachedId = prefs.getString('restaurantId');
      if (cachedId != null && cachedId.isNotEmpty) {
        _restaurantId = cachedId;
        return _restaurantId;
      }
      final userStr = prefs.getString('user');
      if (userStr != null) {
        final decodedUser = jsonDecode(userStr);
        final uRestId = decodedUser['restaurantId'] is Map
            ? (decodedUser['restaurantId']['_id'] ?? decodedUser['restaurantId']['id'])
            : decodedUser['restaurantId']?.toString();
        if (uRestId != null && uRestId.isNotEmpty) {
          _restaurantId = uRestId;
          await prefs.setString('restaurantId', uRestId);
          return _restaurantId;
        }
      }
    } catch (e) {
      debugPrint('OrderProvider: Error reading restaurantId from prefs: $e');
    }

    // 2. Fallback to API /api/restaurants/merchant/my if not in local storage
    try {
      final res = await ApiService.get('/api/restaurants/merchant/my');
      final decoded = jsonDecode(res.body);
      if (decoded != null && decoded['data'] != null) {
        final id = decoded['data']['_id']?.toString();
        if (id != null && id.isNotEmpty) {
          _restaurantId = id;
          try {
            final prefs = await SharedPreferences.getInstance();
            await prefs.setString('restaurantId', id);
          } catch (_) {}
          return _restaurantId;
        }
      }
    } catch (e) {
      debugPrint("OrderProvider: Could not fetch restaurant ID from API: $e");
    }

    return null;
  }

  void _scheduleAutoRetry() {
    if (_retryAttempts >= 3) return;
    _retryTimer?.cancel();
    _retryAttempts++;
    final delaySeconds = _retryAttempts * 3; // 3s, 6s, 9s
    debugPrint('OrderProvider: Scheduling auto-retry #$_retryAttempts in $delaySeconds seconds...');
    _retryTimer = Timer(Duration(seconds: delaySeconds), () {
      if (_orders.isEmpty) {
        fetchOrders(force: true);
      }
    });
  }

  Future<void> fetchOrders({bool force = false}) async {
    // Prevent duplicate overlapping network calls
    if (_isFetching) return;
    if (_isInitialized && !force && _orders.isNotEmpty) return;

    _isFetching = true;
    // Only show full skeleton loader if we don't have orders yet
    if (_orders.isEmpty) {
      _isLoading = true;
    }
    _error = null;
    notifyListeners();

    try {
      final restId = await _resolveRestaurantId();
      if (restId == null || restId.isEmpty) {
        _error = 'Unable to identify restaurant. Check your connection or log in again.';
        _scheduleAutoRetry();
        return;
      }

      socketService.joinRestaurantRoom(restId);

      if (force) {
        _currentPage = 1;
        _hasMore = true;
      }

      final response = await ApiService.get('/api/orders/restaurant/$restId?page=1&limit=50');
      final decoded = jsonDecode(response.body);
      if (decoded != null && decoded['data'] != null) {
        if (decoded['serverTime'] != null) {
          ServerClock.instance.sync(decoded['serverTime']);
        }
        final List<dynamic> data = decoded['data'];
        _orders = data.map((json) => OrderModel.fromJson(json)).toList();
        if (decoded['pagination'] != null) {
          _totalOrders = decoded['pagination']['total'] ?? _orders.length;
          final totalPages = decoded['pagination']['totalPages'] ?? 1;
          _hasMore = _currentPage < totalPages;
        } else {
          _hasMore = _orders.length >= 50;
        }

        if (decoded['stats'] != null && decoded['stats'] is Map) {
          final s = decoded['stats'];
          _orderStats = {
            'total': (s['total'] as num?)?.toInt() ?? _totalOrders,
            'new': (s['new'] as num?)?.toInt() ?? 0,
            'preparing': (s['preparing'] as num?)?.toInt() ?? 0,
            'ready': (s['ready'] as num?)?.toInt() ?? 0,
            'picked_up': (s['picked_up'] as num?)?.toInt() ?? 0,
            'completed': (s['completed'] as num?)?.toInt() ?? 0,
            'cancelled': (s['cancelled'] as num?)?.toInt() ?? 0,
          };
          if (_orderStats['total']! > 0) {
            _totalOrders = _orderStats['total']!;
          }
        } else {
          _orderStats['total'] = _totalOrders > 0 ? _totalOrders : _orders.length;
          _orderStats['new'] = _orders.where((o) => ['new', 'pending'].contains(o.status.toLowerCase())).length;
          _orderStats['preparing'] = _orders.where((o) => o.status.toLowerCase() == 'preparing').length;
          _orderStats['ready'] = _orders.where((o) => o.status.toLowerCase() == 'ready').length;
          _orderStats['picked_up'] = _orders.where((o) => o.status.toLowerCase() == 'picked_up').length;
          _orderStats['completed'] = _orders.where((o) => ['completed', 'delivered'].contains(o.status.toLowerCase())).length;
          _orderStats['cancelled'] = _orders.where((o) => ['cancelled', 'refunded'].contains(o.status.toLowerCase())).length;
        }

        _error = null;
        _retryAttempts = 0; // Reset retry counter on success
        _retryTimer?.cancel();
      } else {
        _error = 'Unexpected response from server';
        _scheduleAutoRetry();
      }
    } catch (e) {
      _error = 'Failed to load orders: $e';
      debugPrint('OrderProvider fetchOrders failed: $e');
      _scheduleAutoRetry();
    } finally {
      _isLoading = false;
      _isInitialized = true;
      _isFetching = false;
      notifyListeners();
    }
  }

  Future<void> loadMoreOrders() async {
    if (_isLoadingMore || !_hasMore || _isFetching || _isLoading) return;

    final restId = await _resolveRestaurantId();
    if (restId == null || restId.isEmpty) return;

    _isLoadingMore = true;
    notifyListeners();

    try {
      final nextPage = _currentPage + 1;
      final response = await ApiService.get('/api/orders/restaurant/$restId?page=$nextPage&limit=50');
      final decoded = jsonDecode(response.body);
      if (decoded != null && decoded['data'] != null) {
        final List<dynamic> data = decoded['data'];
        final newOrders = data.map((json) => OrderModel.fromJson(json)).toList();

        final existingIds = _orders.map((o) => o.id).toSet();
        for (final order in newOrders) {
          if (!existingIds.contains(order.id)) {
            _orders.add(order);
            existingIds.add(order.id);
          }
        }

        _currentPage = nextPage;
        if (decoded['pagination'] != null) {
          final totalPages = decoded['pagination']['totalPages'] ?? nextPage;
          _totalOrders = decoded['pagination']['total'] ?? _orders.length;
          _hasMore = _currentPage < totalPages;
        } else {
          _hasMore = newOrders.length >= 50;
        }

        if (decoded['stats'] != null && decoded['stats'] is Map) {
          final s = decoded['stats'];
          _orderStats = {
            'total': (s['total'] as num?)?.toInt() ?? _totalOrders,
            'new': (s['new'] as num?)?.toInt() ?? 0,
            'preparing': (s['preparing'] as num?)?.toInt() ?? 0,
            'ready': (s['ready'] as num?)?.toInt() ?? 0,
            'picked_up': (s['picked_up'] as num?)?.toInt() ?? 0,
            'completed': (s['completed'] as num?)?.toInt() ?? 0,
            'cancelled': (s['cancelled'] as num?)?.toInt() ?? 0,
          };
          if (_orderStats['total']! > 0) {
            _totalOrders = _orderStats['total']!;
          }
        }
      } else {
        _hasMore = false;
      }
    } catch (e) {
      debugPrint('OrderProvider loadMoreOrders failed: $e');
    } finally {
      _isLoadingMore = false;
      notifyListeners();
    }
  }

  Future<void> fetchOrderById(String orderId) async {
    try {
      final res = await ApiService.get('/api/orders/$orderId');
      final decoded = jsonDecode(res.body);
      if (decoded != null && decoded['data'] != null) {
        final orderData = decoded['data'];
        final freshOrder = OrderModel.fromJson(orderData);
        final idx = _orders.indexWhere((o) => o.id == orderId);
        if (idx != -1) {
          _orders[idx] = freshOrder;
        } else {
          _orders.insert(0, freshOrder);
          _totalOrders++;
          _orderStats['total'] = (_orderStats['total'] ?? 0) + 1;
          _orderStats['new'] = (_orderStats['new'] ?? 0) + 1;
        }
        notifyListeners();
      }
    } catch (e) {
      print('Error fetching order: $e');
    }
  }

  Future<void> cancelOrder(String orderId) async {
    try {
      await ApiService.put('/api/orders/$orderId/status', {'status': 'cancelled'});
      await Future.delayed(const Duration(milliseconds: 1500)); // wait for Stripe webhook
      await fetchOrderById(orderId);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> refundOrder(String orderId) async {
    try {
      await ApiService.post('/api/orders/$orderId/refund', {'reason': 'Merchant initiated refund'});
      await Future.delayed(const Duration(milliseconds: 1500)); // wait for Stripe webhook
      await fetchOrderById(orderId);
    } catch (e) {
      rethrow;
    }
  }


  void _initSocketListeners() {
    void handleUpdate(dynamic data) {
       if (data == null) return;
       try {
          Map<String, dynamic> payload;
          if (data is String) {
            payload = jsonDecode(data);
          } else if (data is Map) {
            payload = Map<String, dynamic>.from(data);
          } else if (data is List && data.isNotEmpty) {
            if (data.first is String) {
              payload = jsonDecode(data.first);
            } else {
              payload = Map<String, dynamic>.from(data.first);
            }
          } else {
            return;
          }

          final orderData = payload['order'] ?? payload;
          if (orderData is! Map) return;

          // If the event only sent orderId (partial update or new order)
          if (orderData['_id'] == null && (orderData['orderId'] != null || payload['orderId'] != null)) {
            final id = orderData['orderId'] ?? payload['orderId'];
            final status = orderData['status'] ?? payload['status'];
            final index = _orders.indexWhere((o) => o.id == id);
            if (index != -1 && status != null) {
              _orders[index] = _orders[index].copyWith(status: status);
              notifyListeners();
            } else if (index == -1) {
              // It's a new order but we only got the ID. Let's fetch it.
              fetchOrderById(id).then((_) {
                // To maintain chronological order, sort orders if needed or it will just be added to list by fetchOrderById
              });
            }
            return;
          }

          if (orderData['_id'] == null) return;

          final updatedOrder = OrderModel.fromJson(Map<String, dynamic>.from(orderData));
          final index = _orders.indexWhere((o) => o.id == updatedOrder.id);
          
          if (index != -1) {
             _orders[index] = updatedOrder;
          } else {
             _orders.insert(0, updatedOrder);
             _totalOrders++;
             _orderStats['total'] = (_orderStats['total'] ?? 0) + 1;
             _orderStats['new'] = (_orderStats['new'] ?? 0) + 1;
          }
          notifyListeners();
       } catch (e) {
          print('Error handling socket update: $e');
       }
    }

    socketService.on('new_order', handleUpdate);
    socketService.on('order_updated', handleUpdate);
    socketService.on('order_status_changed', handleUpdate);
    socketService.on('order:dispatch-updated', (data) {
      if (data == null) return;
      try {
        Map<String, dynamic> payload;
        if (data is String) {
          payload = jsonDecode(data);
        } else if (data is Map) {
          payload = Map<String, dynamic>.from(data);
        } else {
          return;
        }

        final orderId = payload['orderId']?.toString();
        if (orderId == null) return;

        if (payload['serverTime'] != null) {
          ServerClock.instance.sync(payload['serverTime']);
        }

        final idx = _orders.indexWhere((o) => o.id == orderId);
        if (idx != -1) {
          final existing = _orders[idx];
          _orders[idx] = existing.copyWith(
            dispatchStatus: payload['dispatchStatus']?.toString(),
            dispatchAt: payload['dispatchAt'] != null ? DateTime.tryParse(payload['dispatchAt'].toString()) : null,
            dispatchedAt: payload['dispatchedAt'] != null ? DateTime.tryParse(payload['dispatchedAt'].toString()) : null,
            dispatchedBy: payload['dispatchedBy']?.toString(),
            dispatchAttempts: (payload['dispatchAttempts'] is num) ? (payload['dispatchAttempts'] as num).toInt() : existing.dispatchAttempts,
            dispatchError: payload['dispatchError']?.toString(),
            delayMinutesApplied: (payload['delayMinutesApplied'] is num) ? (payload['delayMinutesApplied'] as num).toInt() : existing.delayMinutesApplied,
            deliveryId: payload['deliveryId']?.toString() ?? existing.deliveryId,
          );
          notifyListeners();
        } else {
          fetchOrderById(orderId);
        }
      } catch (e) {
        debugPrint('Error handling dispatch socket update: $e');
      }
    });
  }

  Future<void> updateOrderStatus(String orderId, String status) async {
    try {
      await ApiService.put('/api/orders/$orderId/status', {'status': status});
      // Optimistic update
      final index = _orders.indexWhere((o) => o.id == orderId);
      if (index != -1) {
        _orders[index] = _orders[index].copyWith(status: status);
        notifyListeners();
      }
      // Delayed re-fetch: the server may have triggered background side effects
      // (e.g., createShipdayDeliveryForOrder setting deliveryId) that the optimistic
      // update doesn't capture. Re-fetch after a short delay to get the full state.
      Future.delayed(const Duration(milliseconds: 800), () {
        fetchOrderById(orderId);
      });
    } catch (e) {
      _error = 'Failed to update order: $e';
      notifyListeners();
      // Edge case: if update failed (e.g., transition invalid because it was already updated in the background),
      // we must fetch the latest state so the local UI catches up.
      fetchOrders(force: true);
      rethrow;
    }
  }

  /// Accept a pending order using the dedicated /accept endpoint.
  /// This matches the web panel's behavior (sends confirmation email, etc.)
  /// and ensures consistent behavior across all platforms.
  Future<void> acceptOrder(String orderId) async {
    try {
      await ApiService.put('/api/orders/$orderId/accept', {});
      // Optimistic update
      final index = _orders.indexWhere((o) => o.id == orderId);
      if (index != -1) {
        _orders[index] = _orders[index].copyWith(status: 'accepted');
        notifyListeners();
      }
      // Delayed re-fetch to capture server-side changes (deliveryId, etc.)
      Future.delayed(const Duration(milliseconds: 800), () {
        fetchOrderById(orderId);
      });
    } catch (e) {
      _error = 'Failed to accept order: $e';
      notifyListeners();
      fetchOrders(force: true);
      rethrow;
    }
  }

  /// Request rider now for a scheduled or failed order.
  Future<void> dispatchNow(String orderId) async {
    try {
      final res = await ApiService.post('/api/orders/$orderId/dispatch-now', {});
      final decoded = jsonDecode(res.body);
      if (decoded != null && decoded['data'] != null) {
        final updated = OrderModel.fromJson(decoded['data']);
        final idx = _orders.indexWhere((o) => o.id == orderId);
        if (idx != -1) {
          _orders[idx] = updated;
          notifyListeners();
        }
      }
    } catch (e) {
      _error = 'Failed to request rider: $e';
      notifyListeners();
      rethrow;
    }
  }

  /// Postpone dispatch by specified minutes (+5 min or +10 min).
  Future<void> dispatchPostpone(String orderId, int minutes) async {
    try {
      final res = await ApiService.post('/api/orders/$orderId/dispatch-postpone', {'minutes': minutes});
      final decoded = jsonDecode(res.body);
      if (decoded != null && decoded['data'] != null) {
        final updated = OrderModel.fromJson(decoded['data']);
        final idx = _orders.indexWhere((o) => o.id == orderId);
        if (idx != -1) {
          _orders[idx] = updated;
          notifyListeners();
        }
      }
    } catch (e) {
      _error = 'Failed to postpone rider request: $e';
      notifyListeners();
      rethrow;
    }
  }

  @override
  void dispose() {
    _retryTimer?.cancel();
    super.dispose();
  }
}
