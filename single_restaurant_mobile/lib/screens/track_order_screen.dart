import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/order_provider.dart';
import 'package:single_restaurant_mobile/screens/help_support_screen.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';
import 'package:single_restaurant_mobile/widgets/common/app_dialog.dart';
import 'package:single_restaurant_mobile/widgets/track_order/track_order_details_card.dart';
import 'package:single_restaurant_mobile/widgets/track_order/track_order_driver_profile.dart';
import 'package:single_restaurant_mobile/widgets/track_order/track_order_estimated_time.dart';
import 'package:single_restaurant_mobile/widgets/track_order/track_order_header.dart';
import 'package:single_restaurant_mobile/widgets/track_order/track_order_map_view.dart';
import 'package:single_restaurant_mobile/widgets/track_order/track_order_progress_tracker.dart';
import 'package:single_restaurant_mobile/widgets/track_order/track_order_terminal_notice.dart';

class TrackOrderScreen extends StatefulWidget {
  final String orderId;

  const TrackOrderScreen({super.key, required this.orderId});

  @override
  State<TrackOrderScreen> createState() => _TrackOrderScreenState();
}

class _TrackOrderScreenState extends State<TrackOrderScreen> {
  Map<String, dynamic>? get _order =>
      Provider.of<OrderProvider>(context, listen: false).getTrackedOrder(widget.orderId);
  bool _isLoading = true;
  String? _error;
  Timer? _pollingTimer;
  final MapController _mapController = MapController();

  bool _isRefunded(Map<String, dynamic> order) {
    final paymentStatus = order['paymentStatus']?.toString().toLowerCase();
    final refundAmount = (order['refundAmount'] as num?)?.toDouble() ?? 0.0;
    return order['refunded'] == true || paymentStatus == 'refunded' || refundAmount > 0;
  }

  bool _isTerminalOrder(Map<String, dynamic> order) {
    final status = order['status']?.toString();
    return _isRefunded(order) || status == 'cancelled' || status == 'failed';
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchOrder();
    });

    _pollingTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      final order = _order;
      if (order != null) {
        final status = order['status']?.toString();
        final paymentStatus = order['paymentStatus']?.toString().toLowerCase();
        final isPaidCancelled = status == 'cancelled' && paymentStatus == 'paid' && !_isRefunded(order);
        if ((status == 'delivered' || status == 'failed' || status == 'cancelled') && !isPaidCancelled) {
          _pollingTimer?.cancel();
          return;
        }
      }
      _fetchOrder(isBackground: true);
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchOrder({bool isBackground = false}) async {
    if (!isBackground) {
      setState(() => _isLoading = true);
    }

    final provider = Provider.of<OrderProvider>(context, listen: false);
    await provider.fetchTrackedOrder(widget.orderId, silent: isBackground);

    if (mounted) {
      setState(() {
        final order = provider.getTrackedOrder(widget.orderId);
        if (order != null) {
          _error = null;
        } else if (!isBackground) {
          _error = 'Failed to load order details';
        }
        if (!isBackground) _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAF8F5),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.secondary),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Track Order',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 24),
        ),
        centerTitle: false,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16.0, top: 12.0, bottom: 12.0),
            child: OutlinedButton.icon(
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const HelpSupportScreen()));
              },
              icon: const Icon(Icons.headset_mic_outlined, color: AppColors.secondary, size: 16),
              label: const Text('Support', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold)),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.secondary),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                padding: const EdgeInsets.symmetric(horizontal: 12),
              ),
            ),
          )
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.secondary))
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
              : Builder(
                  builder: (context) {
                    final provider = Provider.of<OrderProvider>(context);
                    final order = provider.getTrackedOrder(widget.orderId);

                    if (order == null) {
                      return const Center(child: Text('Order not found'));
                    }

                    final isTerminal = _isTerminalOrder(order);

                    return SingleChildScrollView(
                      child: ResponsiveCenter(
                        maxWidth: 700,
                        child: Column(
                          children: [
                            TrackOrderHeader(order: order, isRefunded: _isRefunded(order)),
                            if (isTerminal) TrackOrderTerminalNotice(order: order, isRefunded: _isRefunded(order)),
                            if (!isTerminal) TrackOrderProgressTracker(order: order),
                            if (!isTerminal) TrackOrderMapView(order: order, mapController: _mapController),
                            if (!isTerminal && order['deliveryId'] != null) TrackOrderDriverProfile(order: order),
                            TrackOrderDetailsCard(order: order),
                            const SizedBox(height: 16),
                            if (!isTerminal) TrackOrderEstimatedTime(order: order),
                            if (order['status'] == 'pending' || order['status'] == 'accepted')
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                                child: SizedBox(
                                  width: double.infinity,
                                  child: OutlinedButton(
                                    onPressed: () => _handleCancelOrder(provider, order['_id']),
                                    style: OutlinedButton.styleFrom(
                                      side: const BorderSide(color: Colors.red),
                                      foregroundColor: Colors.red,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      padding: const EdgeInsets.symmetric(vertical: 16),
                                    ),
                                    child: const Text('Cancel Order', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                  ),
                                ),
                              ),
                            const SizedBox(height: 32),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }

  Future<void> _handleCancelOrder(OrderProvider provider, String orderId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (dialogCtx) => AppDialog(
        title: 'Cancel Order',
        message: 'Are you sure you want to cancel this order? This action cannot be undone.',
        icon: Icons.cancel_outlined,
        iconColor: AppColors.brandRed,
        isDestructive: true,
        primaryActionText: 'Yes, Cancel',
        onPrimaryAction: () => Navigator.pop(dialogCtx, true),
        secondaryActionText: 'No',
        onSecondaryAction: () => Navigator.pop(dialogCtx, false),
      ),
    );

    if (confirm == true) {
      try {
        await provider.cancelOrder(orderId);
        if (mounted) {
          ToastUtils.showSuccess(context, 'Order cancelled successfully');
        }
      } catch (e) {
        if (mounted) {
          ToastUtils.showError(context, e.toString());
        }
      }
    }
  }
}
