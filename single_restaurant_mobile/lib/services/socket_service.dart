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

    _socket = IO.io(baseUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': true,
    });

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
    _socket!.emit('joinOrderRoom', orderId);
  }

  void onOrderStatusChanged(Function(dynamic) callback) {
    if (_socket == null) init();
    _socket!.on('order_status_changed', callback);
  }

  void onOrderUpdated(Function(dynamic) callback) {
    if (_socket == null) init();
    _socket!.on('order_updated', callback);
  }

  void offOrderStatusChanged() {
    _socket?.off('order_status_changed');
  }

  void offOrderUpdated() {
    _socket?.off('order_updated');
  }

  void dispose() {
    _socket?.disconnect();
    _socket = null;
  }
}
