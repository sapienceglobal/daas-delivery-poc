import 'dart:developer' as dev;
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'api_service.dart';

class SocketService {
  static io.Socket? _socket;

  static void connect({
    required Function(dynamic) onNewOrder,
    required Function(dynamic) onOrderUpdated,
    String? restaurantId,
  }) {
    if (_socket != null) {
      _socket!.disconnect();
      _socket = null;
    }

    try {
      final url = ApiService.baseUrl;
      dev.log('[Socket.io] Connecting to: $url');
      
      _socket = io.io(
        url,
        io.OptionBuilder()
            .setTransports(['websocket']) // essential for flutter network compatibility
            .disableAutoConnect()
            .build(),
      );

      _socket!.onConnect((_) {
        dev.log('[Socket.io] Socket connected successfully');
        if (restaurantId != null) {
          dev.log('[Socket.io] Joining restaurant room: $restaurantId');
          _socket!.emit('join_restaurant', restaurantId);
        }
      });

      _socket!.onDisconnect((_) {
        dev.log('[Socket.io] Socket disconnected');
      });

      _socket!.onConnectError((err) {
        dev.log('[Socket.io] Connection Error: $err');
      });

      _socket!.on('NEW_ORDER', (data) {
        dev.log('[Socket.io] Event NEW_ORDER received: $data');
        onNewOrder(data);
      });

      _socket!.on('ORDER_UPDATED', (data) {
        dev.log('[Socket.io] Event ORDER_UPDATED received: $data');
        onOrderUpdated(data);
      });

      _socket!.connect();
    } catch (e) {
      dev.log('[Socket.io] Initialization Error: $e');
    }
  }

  static void disconnect() {
    if (_socket != null) {
      dev.log('[Socket.io] Disconnecting socket');
      _socket!.disconnect();
      _socket = null;
    }
  }
}
