import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:single_restaurant_mobile/services/api_service.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  IO.Socket? _socket;
  
  factory SocketService() {
    return _instance;
  }

  SocketService._internal();

  /// Initializes the socket connection
  void init() {
    if (_socket != null && _socket!.connected) return;

    final String baseUrl = ApiService.baseUrl;
    final String? token = ApiService.authToken;

    final options = IO.OptionBuilder()
        .setTransports(['websocket'])
        .enableAutoConnect()
        .setAuth({
          'appSecret': 'mobile_app_secure_key_2026',
          if (token != null) 'token': token,
          'tenantId': 'lassi-lounge',
        })
        .setExtraHeaders({
          'x-app-secret': 'mobile_app_secure_key_2026',
          if (token != null) 'Authorization': 'Bearer $token',
          'x-tenant-id': 'lassi-lounge',
        })
        .build();

    _socket = IO.io(baseUrl, options);

    _socket!.onConnect((_) {
      print('Socket.IO connected');
    });

    _socket!.onDisconnect((_) {
      print('Socket.IO disconnected');
    });
    
    _socket!.onError((err) {
      print('Socket.IO error: $err');
    });
  }

  void joinOrderRoom(String orderId) {
    if (_socket == null) init();
    _socket!.emit('join_order', orderId);
  }

  void onOrderStatusChanged(Function(dynamic) callback) {
    if (_socket == null) init();
    _socket!.on('order_status_changed', callback);
  }

  void onOrderUpdated(Function(dynamic) callback) {
    if (_socket == null) init();
    _socket!.on('order_updated', callback);
  }

  void offOrderStatusChanged([Function(dynamic)? callback]) {
    if (callback != null) {
      _socket?.off('order_status_changed', callback);
    } else {
      _socket?.off('order_status_changed');
    }
  }

  void offOrderUpdated([Function(dynamic)? callback]) {
    if (callback != null) {
      _socket?.off('order_updated', callback);
    } else {
      _socket?.off('order_updated');
    }
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
