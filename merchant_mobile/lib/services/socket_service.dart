import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'api_service.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  IO.Socket? _socket;
  
  factory SocketService() {
    return _instance;
  }

  SocketService._internal();

  /// Initializes the socket connection
  void init() {
    if (_socket != null) {
      if (_socket!.connected) return;
      _socket!.dispose();
    }
    _createSocket();
  }

  void reconnect() {
    if (_socket != null) {
      _socket!.dispose();
      _socket = null;
    }
    _createSocket();
  }

  String? _currentRestaurantId;
  final Map<String, Set<Function(dynamic)>> _listenerRegistry = {};
  final List<void Function()> _reconnectCallbacks = [];

  void onReconnect(void Function() callback) {
    _reconnectCallbacks.add(callback);
  }

  void _rebindListeners() {
    if (_socket == null) return;
    _listenerRegistry.forEach((event, callbacks) {
      for (final cb in callbacks) {
        _socket!.off(event, cb);
        _socket!.on(event, cb);
      }
    });
  }

  void _createSocket() {
    final String baseUrl = ApiService.baseUrl;
    final String? token = ApiService.authToken;

    final options = IO.OptionBuilder()
        .setTransports(['websocket', 'polling'])
        .enableAutoConnect()
        .enableForceNewConnection()
        .setAuth({
          'appSecret': 'mobile_app_secure_key_2026',
          if (token != null) 'token': token,
          'tenantId': 'lassi-lounge',
        })
        .enableReconnection()
        .setReconnectionDelay(1000)
        .setReconnectionAttempts(10)
        .setExtraHeaders({
          'x-app-secret': 'mobile_app_secure_key_2026',
          if (token != null) 'Authorization': 'Bearer $token',
          'x-tenant-id': 'lassi-lounge',
          'x-platform': 'merchant_app',
        })
        .build();

    _socket = IO.io(baseUrl, options);

    _socket!.onConnect((_) {
      print('Socket.IO connected (Merchant App)');
      if (_currentRestaurantId != null) {
        _socket!.emit('join_restaurant', _currentRestaurantId);
      }
      _rebindListeners();
      for (final cb in _reconnectCallbacks) {
        try {
          cb();
        } catch (e) {
          print('Error in reconnect callback: $e');
        }
      }
    });

    _socket!.onDisconnect((_) {
      print('Socket.IO disconnected');
    });
    
    _socket!.onError((err) {
      print('Socket.IO error: $err');
    });
  }

  void joinRestaurantRoom(String restaurantId) {
    _currentRestaurantId = restaurantId;
    if (_socket == null) init();
    if (_socket!.connected) {
      _socket!.emit('join_restaurant', restaurantId);
    }
  }

  // Listeners tailored for merchant operations
  void onNewOrder(Function(dynamic) callback) {
    on('new_order', callback);
  }

  void onOrderUpdated(Function(dynamic) callback) {
    on('order_updated', callback);
  }

  void on(String event, Function(dynamic) callback) {
    _listenerRegistry.putIfAbsent(event, () => <Function(dynamic)>{}).add(callback);
    if (_socket == null) init();
    if (_socket != null) {
      _socket!.on(event, callback);
    }
  }

  void off(String event, [Function(dynamic)? callback]) {
    if (callback != null) {
      _listenerRegistry[event]?.remove(callback);
      _socket?.off(event, callback);
    } else {
      _listenerRegistry.remove(event);
      _socket?.off(event);
    }
  }

  void dispose() {
    _socket?.disconnect();
    _socket = null;
  }
}
