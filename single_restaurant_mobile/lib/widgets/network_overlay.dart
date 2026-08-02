import 'dart:async';
import 'package:flutter/material.dart';
import 'package:internet_connection_checker_plus/internet_connection_checker_plus.dart';

class NetworkOverlay extends StatefulWidget {
  final Widget child;

  const NetworkOverlay({super.key, required this.child});

  @override
  State<NetworkOverlay> createState() => _NetworkOverlayState();
}

class _NetworkOverlayState extends State<NetworkOverlay> with SingleTickerProviderStateMixin {
  bool _isConnected = true;
  bool _wasDisconnected = false;
  late StreamSubscription<InternetStatus> _subscription;
  late AnimationController _animationController;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, -1),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOut,
    ));

    _subscription = InternetConnection().onStatusChange.listen((status) {
      final isConnected = status == InternetStatus.connected;
      if (_isConnected != isConnected) {
        setState(() {
          _isConnected = isConnected;
          if (!isConnected) {
            _wasDisconnected = true;
            _animationController.forward();
          } else if (_wasDisconnected) {
            // Wait a moment before hiding the "We are back" banner
            Future.delayed(const Duration(seconds: 2), () {
              if (mounted && _isConnected) {
                _animationController.reverse();
              }
            });
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _subscription.cancel();
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: SlideTransition(
            position: _slideAnimation,
            child: Material(
              color: Colors.transparent,
              child: Container(
                padding: EdgeInsets.only(
                  top: MediaQuery.of(context).padding.top + 12,
                  bottom: 12,
                  left: 16,
                  right: 16,
                ),
                color: _isConnected ? Colors.green.shade600 : Colors.red.shade600,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      _isConnected ? Icons.wifi : Icons.wifi_off,
                      color: Colors.white,
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _isConnected ? 'Back Online' : 'You are offline',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
