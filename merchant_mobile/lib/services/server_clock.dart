import 'dart:async';
import 'package:flutter/foundation.dart';

/// ServerClock synchronizes client time with the backend's serverTime
/// to eliminate clock skew issues during countdowns.
/// It also provides a single shared 1-second ticker for all order cards.
class ServerClock {
  ServerClock._internal();
  static final ServerClock instance = ServerClock._internal();

  int _offsetMs = 0;
  Timer? _tickerTimer;
  final ValueNotifier<int> tickNotifier = ValueNotifier<int>(0);
  int _listenerCount = 0;

  /// Current synchronized server time
  DateTime get now => DateTime.now().add(Duration(milliseconds: _offsetMs));

  /// Synchronize clock with a server ISO string or timestamp
  void sync(dynamic serverTime) {
    if (serverTime == null) return;
    try {
      DateTime serverDate;
      if (serverTime is DateTime) {
        serverDate = serverTime;
      } else if (serverTime is int) {
        serverDate = DateTime.fromMillisecondsSinceEpoch(serverTime);
      } else {
        serverDate = DateTime.parse(serverTime.toString());
      }
      _offsetMs = serverDate.millisecondsSinceEpoch - DateTime.now().millisecondsSinceEpoch;
    } catch (e) {
      debugPrint('ServerClock sync error: $e');
    }
  }

  /// Calculates remaining duration until targetTime based on synchronized clock
  Duration remainingUntil(DateTime? targetTime) {
    if (targetTime == null) return Duration.zero;
    final diff = targetTime.difference(now);
    return diff.isNegative ? Duration.zero : diff;
  }

  /// Formats remaining time: mm:ss (or h:mm if >= 1 hour)
  String formatCountdown(DateTime? targetTime) {
    if (targetTime == null) return '00:00';
    final remaining = remainingUntil(targetTime);
    if (remaining <= Duration.zero) return '00:00';

    final totalMinutes = remaining.inMinutes;
    final seconds = remaining.inSeconds % 60;
    final hours = remaining.inHours;

    if (hours > 0) {
      final remainingMins = totalMinutes % 60;
      return '$hours:${remainingMins.toString().padLeft(2, '0')}';
    }

    return '${totalMinutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  /// Starts the shared ticker when a UI component starts observing
  void attachTicker() {
    _listenerCount++;
    if (_tickerTimer == null || !_tickerTimer!.isActive) {
      _tickerTimer = Timer.periodic(const Duration(seconds: 1), (_) {
        tickNotifier.value = DateTime.now().millisecondsSinceEpoch;
      });
    }
  }

  /// Stops the shared ticker when all UI components detach
  void detachTicker() {
    _listenerCount = (_listenerCount > 0) ? _listenerCount - 1 : 0;
    if (_listenerCount == 0) {
      _tickerTimer?.cancel();
      _tickerTimer = null;
    }
  }
}
