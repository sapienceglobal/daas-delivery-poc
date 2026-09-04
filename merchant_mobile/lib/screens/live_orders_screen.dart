import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import 'dart:ui' as ui;
import 'dart:async';
import '../services/api_service.dart';
import '../constants/app_colors.dart';
import '../providers/order_provider.dart';
import '../models/order_model.dart';
import '../widgets/app_drawer.dart';
import '../widgets/shared_app_bar.dart';
import '../widgets/shared_bottom_nav.dart';

class LiveOrdersScreen extends StatefulWidget {
  const LiveOrdersScreen({Key? key}) : super(key: key);

  @override
  State<LiveOrdersScreen> createState() => _LiveOrdersScreenState();
}

class _LiveOrdersScreenState extends State<LiveOrdersScreen> {
  @override
  void initState() {
    super.initState();
    // Orders are already fetched and kept alive by SocketService globally
  }

  @override
  Widget build(BuildContext context) {
    final orderProvider = context.watch<OrderProvider>();
    final allOrders = orderProvider.orders;

    // Filter logic
    final newOrders = allOrders.where((o) => ['new', 'pending'].contains(o.status)).toList();
    final accepted = allOrders.where((o) => o.status == 'accepted').toList();
    final preparing = allOrders.where((o) => o.status == 'preparing').toList();
    final ready = allOrders.where((o) => o.status == 'ready').toList();
    final outForDelivery = allOrders.where((o) => o.orderType == 'delivery' && o.status == 'picked_up').toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const SharedAppBar(),
      drawer: const AppDrawer(),
      body: RefreshIndicator(
        onRefresh: () => orderProvider.fetchOrders(force: true),
        child: orderProvider.isLoading
            ? _buildSkeletonLoader()
            : SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Live Orders',
                            style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Track and manage orders in real time',
                            style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                      Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFF991B1B),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: IconButton(
                          onPressed: () => context.read<OrderProvider>().fetchOrders(),
                          icon: const Icon(Icons.refresh, color: Colors.white, size: 20),
                          tooltip: 'Refresh',
                          padding: const EdgeInsets.all(10),
                          constraints: const BoxConstraints(),
                        ),
                      )
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Order Status Sections
                  _buildStatusSection('New Orders', Icons.shopping_bag_outlined, newOrders, const Color(0xFF991B1B), const Color(0xFFFEF2F2), const Color(0xFFFEE2E2), const Color(0xFFFECACA)),
                  _buildStatusSection('Accepted', Icons.check_circle_outline, accepted, const Color(0xFF9A3412), const Color(0xFFFFF7ED), const Color(0xFFFFEDD5), const Color(0xFFFED7AA)),
                  _buildStatusSection('Preparing', Icons.access_time, preparing, const Color(0xFF5B21B6), const Color(0xFFF5F3FF), const Color(0xFFEDE9FE), const Color(0xFFDDD6FE)),
                  _buildStatusSection('Ready', Icons.shopping_bag, ready, const Color(0xFF166534), const Color(0xFFF0FDF4), const Color(0xFFDCFCE7), const Color(0xFFBBF7D0)),
                  _buildStatusSection('Out for Delivery', Icons.directions_bike, outForDelivery, const Color(0xFF1E40AF), const Color(0xFFEFF6FF), const Color(0xFFDBEAFE), const Color(0xFFBFDBFE)),



                  // Today's Summary
                  _buildTodaySummary(allOrders),

                  // Recent Completed
                  _buildRecentCompleted(allOrders),
                  
                ],
              ),
            ),
      ),
      bottomNavigationBar: const SharedBottomNav(currentIndex: 1),
    );
  }

  Widget _buildSkeletonLoader() {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade100,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(width: 150, height: 28, color: Colors.white),
                    const SizedBox(height: 4),
                    Container(width: 200, height: 16, color: Colors.white),
                  ],
                ),
                Container(width: 100, height: 40, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8))),
              ],
            ),
            const SizedBox(height: 24),
            Expanded(
              child: ListView.builder(
                itemCount: 4,
                itemBuilder: (context, index) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    height: 150,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusSection(String title, IconData icon, List<OrderModel> orders, Color textColor, Color bgColor, Color badgeBgColor, Color borderColor) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: borderColor)),
                    child: Icon(icon, color: textColor, size: 16),
                  ),
                  const SizedBox(width: 12),
                  Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: textColor, fontSize: 16)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: badgeBgColor, borderRadius: BorderRadius.circular(12)),
                child: Text('${orders.length}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: textColor, fontSize: 14)),
              )
            ],
          ),
          const SizedBox(height: 16),
          if (orders.isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 24),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.5),
                borderRadius: BorderRadius.circular(12),
                // Using a regular border as placeholder for dashed border
                border: Border.all(color: borderColor, style: BorderStyle.solid),
              ),
              child: Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.inbox, color: Colors.grey.shade400, size: 16),
                    const SizedBox(width: 8),
                    Text('No orders', style: GoogleFonts.inter(color: Colors.grey.shade500, fontSize: 12)),
                  ],
                ),
              ),
            )
          else
            ...orders.map((order) => _buildOrderCard(order, textColor)).toList(),
        ],
      ),
    );
  }

  void _showPaymentModal(String paymentUrl, DateTime createdAt, {String? customerPhone}) {
    showDialog(
      context: context,
      builder: (ctx) => _PaymentModalContent(
        paymentUrl: paymentUrl,
        createdAt: createdAt,
        customerPhone: customerPhone,
      ),
    );
  }

  Widget _buildOrderCard(OrderModel order, Color themeColor) {
    return GestureDetector(
      onTap: () {
        context.push('/order-details/${order.id}');
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 2))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text('#${order.orderNumber}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14), overflow: TextOverflow.ellipsis),
                ),
                const SizedBox(width: 4),
                Text(
                  '${order.createdAt.hour}:${order.createdAt.minute.toString().padLeft(2, '0')}',
                  style: GoogleFonts.inter(color: Colors.grey.shade500, fontSize: 12),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(order.customerName, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey.shade100),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ...order.items.take(3).map((item) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('${item.quantity}x', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: AppColors.primary)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(item.name, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey.shade800), maxLines: 1, overflow: TextOverflow.ellipsis),
                                if (item.size != null && item.size!.isNotEmpty)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 2),
                                    child: Text('Size: ${item.size}', style: GoogleFonts.inter(fontSize: 11, color: Colors.grey.shade700, fontWeight: FontWeight.bold)),
                                  ),
                                if (item.addOns.isNotEmpty)
                                  ...item.addOns.map((a) => Padding(
                                    padding: const EdgeInsets.only(top: 2),
                                    child: Text('+ $a', style: GoogleFonts.inter(fontSize: 11, color: Colors.grey.shade600, fontStyle: FontStyle.italic)),
                                  )),
                                if (item.specialInstructions != null && item.specialInstructions!.isNotEmpty)
                                  Text(
                                    'Note: ${item.specialInstructions}',
                                    style: GoogleFonts.inter(fontSize: 11, color: Colors.red.shade700, fontStyle: FontStyle.italic),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                  if (order.items.length > 3)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text('+ ${order.items.length - 3} more items', style: GoogleFonts.inter(fontSize: 11, color: Colors.grey.shade500, fontStyle: FontStyle.italic)),
                    )
                ],
              ),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text('${order.items.length} Items', style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 12, color: Colors.grey.shade700), overflow: TextOverflow.ellipsis),
                ),
                Text('\$${order.total.toStringAsFixed(2)}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14)),
              ],
            ),
            if (_hasQuickActions(order)) ...[
              Divider(color: Colors.grey.shade200, height: 24),
              _buildQuickActions(context, order),
            ],
          ],
        ),
      ),
    );
  }

  bool _hasQuickActions(OrderModel order) {
    if (order.status == 'out_for_delivery' && order.trackingUrl != null) return true;
    return ['pending', 'accepted', 'preparing', 'ready_for_pickup', 'ready'].contains(order.status);
  }

  Widget _buildQuickActions(BuildContext context, OrderModel order) {
    if (order.status == 'out_for_delivery' && order.trackingUrl != null) {
      return Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () => launchUrl(Uri.parse(order.trackingUrl!)),
              icon: const Icon(Icons.location_on, size: 16, color: Color(0xFF8B0000)),
              label: Text('Track Live Order', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: const Color(0xFF8B0000))),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFF8B0000)),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ),
        ],
      );
    }

    String buttonText = '';
    String nextStatus = '';
    Color buttonColor = AppColors.primary;
    IconData buttonIcon = Icons.check_circle_outline;

    switch (order.status) {
      case 'pending':
        buttonText = 'Accept Order';
        nextStatus = 'accepted';
        buttonColor = AppColors.primary;
        buttonIcon = Icons.check;
        break;
      case 'accepted':
        buttonText = 'Mark Preparing';
        nextStatus = 'preparing';
        buttonColor = Colors.orange;
        buttonIcon = Icons.soup_kitchen;
        break;
      case 'preparing':
        buttonText = 'Mark Ready';
        nextStatus = 'ready_for_pickup';
        buttonColor = Colors.green;
        buttonIcon = Icons.room_service;
        break;
      case 'ready_for_pickup':
      case 'ready':
        if (order.orderType == 'delivery') {
          buttonText = ''; // Disabled for delivery, Shipday driver handles this
        } else {
          buttonText = 'Mark Picked Up';
          nextStatus = 'picked_up';
          buttonColor = Colors.blue;
          buttonIcon = Icons.local_shipping;
        }
        break;
    }

    if (buttonText.isEmpty) return const SizedBox.shrink();

    final isUnpaid = order.paymentStatus != 'paid';

    if (order.status == 'pending' && isUnpaid) {
      return Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              border: Border.all(color: const Color(0xFFFCA5A5)),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(width: 8, height: 8, decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle)),
                const SizedBox(width: 8),
                Text('Awaiting Payment...', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.red, fontSize: 13)),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                    onPressed: () {
                      final url = '${ApiService.baseUrl}/api/orders/${order.id}/pay';
                      _showPaymentModal(url, order.createdAt, customerPhone: order.customerPhone);
                    },
                  icon: const Icon(Icons.qr_code, size: 16, color: Colors.black87),
                  label: Text('Show QR Code', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.black87)),
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: Colors.grey.shade300),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () async {
                    try {
                      await context.read<OrderProvider>().updateOrderStatus(order.id, 'cancelled');
                    } catch (e) {
                      print('Error cancelling order: $e');
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                      }
                    }
                  },
                  icon: const Icon(Icons.close, size: 16, color: Colors.red),
                  label: Text('Cancel Order', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.red)),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.red),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
            ],
          ),
        ],
      );
    }

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () async {
                  try {
                    await context.read<OrderProvider>().updateOrderStatus(order.id, nextStatus);
                  } catch (e) {
                    print('Error updating order status: $e');
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                    }
                  }
                },
                icon: Icon(buttonIcon, size: 16, color: Colors.white),
                label: Text(buttonText, style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.white)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: buttonColor,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  elevation: 0,
                ),
              ),
            ),
          ],
        ),
        if (order.status == 'pending') ...[
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () async {
                    try {
                      await context.read<OrderProvider>().updateOrderStatus(order.id, 'cancelled');
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                      }
                    }
                  },
                  icon: const Icon(Icons.close, size: 16, color: Colors.red),
                  label: Text('Reject Order', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.red)),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.red),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
            ],
          ),
        ]
      ],
    );
  }

  Widget _buildTodaySummary(List<OrderModel> orders) {
    final todayOrders = orders.where((o) => o.createdAt.day == DateTime.now().day).toList();
    final completed = todayOrders.where((o) => ['delivered', 'completed', 'picked_up'].contains(o.status)).toList();
    final cancelled = todayOrders.where((o) => ['cancelled', 'refunded'].contains(o.status)).toList();

    final completedPercent = todayOrders.isEmpty ? 0 : (completed.length / todayOrders.length * 100).round();
    final cancelledPercent = todayOrders.isEmpty ? 0 : (cancelled.length / todayOrders.length * 100).round();

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade200)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Today\'s Summary', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _buildSummaryStat('Total Orders', '${todayOrders.length}', null, null)),
              Container(height: 40, width: 1, color: Colors.grey.shade200),
              Expanded(child: _buildSummaryStat('Completed', '${completed.length}', '($completedPercent%)', const Color(0xFF166534))),
              Container(height: 40, width: 1, color: Colors.grey.shade200),
              Expanded(child: _buildSummaryStat('Cancelled', '${cancelled.length}', '($cancelledPercent%)', const Color(0xFFDC2626))),
            ],
          ),
          const SizedBox(height: 16),
          GestureDetector(
            onTap: () {
              context.push('/all-orders');
            },
            child: Text('View All Orders →', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: const Color(0xFFDC2626), fontSize: 12)),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryStat(String label, String val, String? sub, Color? subColor) {
    return Column(
      children: [
        Text(label, style: GoogleFonts.inter(color: Colors.grey.shade500, fontSize: 10)),
        const SizedBox(height: 4),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(val, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16, color: subColor ?? Colors.black)),
            if (sub != null) ...[
              const SizedBox(width: 4),
              Text(sub, style: GoogleFonts.inter(color: subColor, fontSize: 12)),
            ]
          ],
        )
      ],
    );
  }

  Widget _buildRecentCompleted(List<OrderModel> orders) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade200)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Recent Completed', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14)),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 24),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.inbox, color: Colors.grey.shade400, size: 16),
                const SizedBox(width: 8),
                Text('No completed orders yet', style: GoogleFonts.inter(color: Colors.grey.shade500, fontSize: 12)),
              ],
            ),
          )
        ],
      ),
    );
  }
}

class _PaymentModalContent extends StatefulWidget {
  final String paymentUrl;
  final DateTime createdAt;
  final String? customerPhone;

  const _PaymentModalContent({Key? key, required this.paymentUrl, required this.createdAt, this.customerPhone}) : super(key: key);

  @override
  State<_PaymentModalContent> createState() => _PaymentModalContentState();
}

class _PaymentModalContentState extends State<_PaymentModalContent> {
  int _modalTimeLeft = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _calculateTimeLeft();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      _calculateTimeLeft();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _calculateTimeLeft() {
    final expiresAtTime = widget.createdAt.add(const Duration(minutes: 10));
    final now = DateTime.now();
    final diff = expiresAtTime.difference(now).inSeconds;
    if (mounted) {
      setState(() {
        _modalTimeLeft = diff > 0 ? diff : 0;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Waiting for Payment', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('Have the customer scan the QR code to pay.', textAlign: TextAlign.center, style: GoogleFonts.inter(color: Colors.grey.shade600, fontSize: 14)),
            const SizedBox(height: 24),
            QrImageView(
              data: widget.paymentUrl,
              version: QrVersions.auto,
              size: 200.0,
              backgroundColor: Colors.white,
            ),
            const SizedBox(height: 24),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(color: const Color(0xFFFEF2F2), borderRadius: BorderRadius.circular(8)),
              child: Text(
                'Time Remaining: ${(_modalTimeLeft ~/ 60).toString().padLeft(2, '0')}:${(_modalTimeLeft % 60).toString().padLeft(2, '0')}',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.red),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF3F4F6), foregroundColor: Colors.black),
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: widget.paymentUrl));
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Link Copied!')));
                    },
                    icon: const Icon(Icons.copy, size: 16),
                    label: const Text('Copy'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF25D366), foregroundColor: Colors.white),
                    onPressed: () async {
                      final message = 'Hi! Please complete your payment for your order here:\n${widget.paymentUrl}';
                      final rawPhone = widget.customerPhone?.trim() ?? '';
                      String waUrl;
                      if (rawPhone.isNotEmpty && rawPhone != 'N/A') {
                        final digits = rawPhone.replaceAll(RegExp(r'[^\d]'), '');
                        final intlPhone = digits.length == 10 ? '1$digits' : digits;
                        waUrl = 'https://wa.me/$intlPhone?text=${Uri.encodeComponent(message)}';
                      } else {
                        waUrl = 'https://wa.me/?text=${Uri.encodeComponent(message)}';
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No customer phone. WhatsApp opened for manual selection.')));
                      }
                      final url = Uri.parse(waUrl);
                      if (await canLaunchUrl(url)) {
                        await launchUrl(url, mode: LaunchMode.externalApplication);
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not open WhatsApp')));
                      }
                    },
                    icon: const Icon(Icons.chat, size: 16),
                    label: const Text('WhatsApp'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Close'),
              ),
            )
          ],
        ),
      ),
    );
  }
}
