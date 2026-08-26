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

  void _createSocket() {
    final String baseUrl = ApiService.baseUrl;
    final String? token = ApiService.authToken;

    final options = IO.OptionBuilder()
        .setTransports(['websocket', 'polling'])
        .enableAutoConnect()
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
    });

    _socket!.onDisconnect((_) {
      print('Socket.IO disconnected');
    });
    
    _socket!.onError((err) {
      print('Socket.IO error: $err');
    });
  }

  String? _currentRestaurantId;

  void joinRestaurantRoom(String restaurantId) {
    _currentRestaurantId = restaurantId;
    if (_socket == null) init();
    if (_socket!.connected) {
      _socket!.emit('join_restaurant', restaurantId);
    }
  }

  // Listeners tailored for merchant operations
  void onNewOrder(Function(dynamic) callback) {
    if (_socket == null) init();
    _socket!.on('new_order', callback);
  }

  void onOrderUpdated(Function(dynamic) callback) {
    if (_socket == null) init();
    _socket!.on('order_updated', callback);
  }

  void on(String event, Function(dynamic) callback) {
    if (_socket == null) init();
    _socket!.on(event, callback);
  }

  void off(String event, [Function(dynamic)? callback]) {
    if (callback != null) {
      _socket?.off(event, callback);
    } else {
      _socket?.off(event);
    }
  }

  void dispose() {
    _socket?.disconnect();
    _socket = null;
  }
}
