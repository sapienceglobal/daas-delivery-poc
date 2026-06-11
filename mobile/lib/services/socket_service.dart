import 'dart:developer' as dev;
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'api_service.dart';

class SocketService {
  static io.Socket? _socket;
  static String? _currentRestaurantId;

  // Active listener maps indexed by a unique listenerId (e.g. 'merchant_dashboard', 'order_tracking')
  static final Map<String, Function(dynamic)> _newOrderListeners = {};
  static final Map<String, Function(dynamic)> _orderUpdatedListeners = {};

  static void connect({
    required String listenerId,
    Function(dynamic)? onNewOrder,
    Function(dynamic)? onOrderUpdated,
    String? restaurantId,
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

      if (restaurantId != null && restaurantId != _currentRestaurantId) {
        _currentRestaurantId = restaurantId;
        dev.log('[Socket.io] Joining restaurant room: $restaurantId');
        _socket!.emit('join_restaurant', restaurantId);
      }
      return;
    }

    try {
      final url = ApiService.baseUrl;
      dev.log('[Socket.io] Connecting to: $url');
      _currentRestaurantId = restaurantId;
      
      _socket = io.io(
        url,
        io.OptionBuilder()
            .setTransports(['websocket']) // essential for flutter network compatibility
            .disableAutoConnect()
            .build(),
      );

      _socket!.onConnect((_) {
        dev.log('[Socket.io] Socket connected successfully');
        if (_currentRestaurantId != null) {
          dev.log('[Socket.io] Joining restaurant room: $_currentRestaurantId');
          _socket!.emit('join_restaurant', _currentRestaurantId);
        }
      });

      _socket!.onDisconnect((_) {
        dev.log('[Socket.io] Socket disconnected');
      });

      _socket!.onConnectError((err) {
        dev.log('[Socket.io] Connection Error: $err');
      });

      _socket!.on('NEW_ORDER', (data) {
        dev.log('[Socket.io] Event NEW_ORDER received: $data. Notifying ${_newOrderListeners.length} listener(s).');
        // Notify all registered new order listeners
        _newOrderListeners.forEach((id, callback) {
          try {
            callback(data);
          } catch (e) {
            dev.log('[Socket.io] Error in NEW_ORDER listener ($id): $e');
          }
        });
      });

      _socket!.on('ORDER_UPDATED', (data) {
        dev.log('[Socket.io] Event ORDER_UPDATED received: $data. Notifying ${_orderUpdatedListeners.length} listener(s).');
        // Notify all registered order updated listeners
        _orderUpdatedListeners.forEach((id, callback) {
          try {
            callback(data);
          } catch (e) {
            dev.log('[Socket.io] Error in ORDER_UPDATED listener ($id): $e');
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
        _currentRestaurantId = null;
      }
    }
  }
}
