import 'dart:developer' as dev;
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:flutter_ringtone_player/flutter_ringtone_player.dart';
import 'api_service.dart';

class SocketService {
  static io.Socket? _socket;
  static final Set<String> _restaurantRooms = {};
  static final Set<String> _orderRooms = {};

  // Active listener maps indexed by a unique listenerId (e.g. 'merchant_dashboard', 'order_tracking')
  static final Map<String, Function(dynamic)> _newOrderListeners = {};
  static final Map<String, Function(dynamic)> _orderUpdatedListeners = {};

  static void connect({
    required String listenerId,
    Function(dynamic)? onNewOrder,
    Function(dynamic)? onOrderUpdated,
    String? restaurantId,
    String? orderId,
  }) {
    // Register or update callbacks for this listenerId
    if (onNewOrder != null) {
      _newOrderListeners[listenerId] = onNewOrder;
    }
    if (onOrderUpdated != null) {
      _orderUpdatedListeners[listenerId] = onOrderUpdated;
    }

    // If socket is already initialized, join room (if restaurantId changes/is provided) and keep connection alive
    if (_socket != null) {
      dev.log('[Socket.io] Socket already initialized. Registered/updated listener: $listenerId');

      if (!_socket!.connected) {
        _socket!.connect();
      }

      if (restaurantId != null) {
        _restaurantRooms.add(restaurantId);
        dev.log('[Socket.io] Joining restaurant room: $restaurantId');
        if (_socket!.connected) {
          _socket!.emit('join_restaurant', restaurantId);
        }
      }

      if (orderId != null) {
        _orderRooms.add(orderId);
        if (_socket!.connected) {
          dev.log('[Socket.io] Joining order room: $orderId');
          _socket!.emit('join_order', orderId);
        }
      }
      return;
    }

    try {
      final url = ApiService.baseUrl;
      dev.log('[Socket.io] Connecting to: $url');
      if (restaurantId != null) _restaurantRooms.add(restaurantId);
      if (orderId != null) _orderRooms.add(orderId);

      _socket = io.io(
        url,
        io.OptionBuilder()
            .setTransports(['websocket', 'polling']) // allow polling fallback like the web
            .setAuth({'appSecret': 'DAAS_MOBILE_SECRET_2026'})
            .setExtraHeaders({'x-app-secret': 'DAAS_MOBILE_SECRET_2026'})
            .enableReconnection()
            .setReconnectionDelay(1000)
            .setReconnectionAttempts(10)
            .disableAutoConnect()
            .build(),
      );

      _socket!.onConnect((_) {
        dev.log('[Socket.io] Socket connected successfully');
        for (final room in _restaurantRooms) {
          dev.log('[Socket.io] Joining restaurant room: $room');
          _socket!.emit('join_restaurant', room);
        }
        for (final orderRoom in _orderRooms) {
          dev.log('[Socket.io] Joining order room: $orderRoom');
          _socket!.emit('join_order', orderRoom);
        }
      });

      _socket!.onDisconnect((_) {
        dev.log('[Socket.io] Socket disconnected');
      });

      _socket!.onConnectError((err) {
        dev.log('[Socket.io] Connection Error: $err');
      });

      _socket!.on('new_order', (data) {
        dev.log('[Socket.io] Event new_order received: $data. Notifying ${_newOrderListeners.length} listener(s).');
        
        try {
          // Play native notification sound
          FlutterRingtonePlayer.playNotification();
        } catch (e) {
          dev.log('[Socket.io] Failed to play notification sound: $e');
        }

        // Notify all registered new order listeners
        _newOrderListeners.forEach((id, callback) {
          try {
            callback(data);
          } catch (e) {
            dev.log('[Socket.io] Error in new_order listener ($id): $e');
          }
        });
      });

      _socket!.on('order_updated', (data) {
        dev.log('[Socket.io] Event order_updated received: $data. Notifying ${_orderUpdatedListeners.length} listener(s).');
        // Notify all registered order updated listeners
        _orderUpdatedListeners.forEach((id, callback) {
          try {
            callback(data);
          } catch (e) {
            dev.log('[Socket.io] Error in order_updated listener ($id): $e');
          }
        });
      });

      _socket!.on('order_status_changed', (data) {
        dev.log('[Socket.io] Event order_status_changed received: $data (Type: ${data.runtimeType}). Notifying ${_orderUpdatedListeners.length} listener(s).');
        _orderUpdatedListeners.forEach((id, callback) {
          try {
            callback(data);
          } catch (e) {
            dev.log('[Socket.io] Error in order_status_changed listener ($id): $e');
          }
        });
      });

      _socket!.connect();
    } catch (e) {
      dev.log('[Socket.io] Initialization Error: $e');
    }
  }

  static void disconnect(String listenerId) {
    _newOrderListeners.remove(listenerId);
    _orderUpdatedListeners.remove(listenerId);
    dev.log('[Socket.io] Removed listener: $listenerId. Remaining newOrder listeners: ${_newOrderListeners.keys}, orderUpdated listeners: ${_orderUpdatedListeners.keys}');

    // Only disconnect actual socket if there are no remaining active listeners
    if (_newOrderListeners.isEmpty && _orderUpdatedListeners.isEmpty) {
      if (_socket != null) {
        dev.log('[Socket.io] Disconnecting socket (no active listeners remaining)');
        _socket!.disconnect();
        _socket = null;
        _restaurantRooms.clear();
        _orderRooms.clear();
      }
    }
  }

  static void emit(String event, dynamic data) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit(event, data);
    } else {
      dev.log('[Socket.io] Cannot emit \$event: socket is not connected.');
    }
  }
}
