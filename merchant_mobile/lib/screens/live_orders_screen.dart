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
import 'dart:convert';
import 'package:flutter_stripe/flutter_stripe.dart';
import '../services/api_service.dart';
import '../constants/app_colors.dart';
import '../providers/order_provider.dart';
import '../models/order_model.dart';
import '../widgets/app_drawer.dart';
import '../widgets/shared_app_bar.dart';
import '../widgets/shared_bottom_nav.dart';
import '../providers/auth_provider.dart';
import '../utils/time_utils.dart';

class LiveOrdersScreen extends StatefulWidget {
  const LiveOrdersScreen({super.key});

  @override
  State<LiveOrdersScreen> createState() => _LiveOrdersScreenState();
}

class _LiveOrdersScreenState extends State<LiveOrdersScreen> {
  @override
  void initState() {
    super.initState();
    // Orders are already fetched and kept alive by SocketService globally
  }

  Future<void> _processStripePayment(OrderModel order) async {
    bool isDialogShowing = false;
    try {
      isDialogShowing = true;
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => const Center(child: CircularProgressIndicator()),
      ).then((_) => isDialogShowing = false);

      final intentPayload = {
        'amount': order.total,
        'orderId': order.id,
        'customerName': order.customerName,
        'customerPhone': order.customerPhone,
        'customerEmail': order.customerEmail ?? '',
      };

      final intentResponse = await ApiService.post(
        '/api/payments/create-intent',
        intentPayload,
      );
      final intentRes = jsonDecode(intentResponse.body);
      final intentData = intentRes['data'] ?? intentRes;

      if (intentData == null || !intentData.containsKey('clientSecret')) {
        throw Exception(
          intentData['message'] ?? 'Failed to initialize payment',
        );
      }

      final pData = intentData['data'] ?? intentData;

      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          paymentIntentClientSecret: pData['clientSecret'],
          appearance: const PaymentSheetAppearance(
            colors: PaymentSheetAppearanceColors(primary: Color(0xFF8B0000)),
          ),
          merchantDisplayName: 'Merchant Stripe POS',
        ),
      );

      if (isDialogShowing && mounted) {
        Navigator.of(context).pop(); // hide loading
        isDialogShowing = false;
      }

      await Stripe.instance.presentPaymentSheet();

      final stripePaymentIntentId =
          pData['paymentIntentId'] ?? pData['paymentIntent'];

      // Now call our new endpoint to mark the order as paid via credit_card
      final updateResponse =
          await ApiService.put('/api/orders/${order.id}/payment', {
            'paymentMethod': 'credit_card',
            'paymentStatus': 'paid',
            'stripePaymentIntentId': stripePaymentIntentId,
          });
      final updateRes = jsonDecode(updateResponse.body);

      if (updateRes['success'] == true || updateRes['data'] != null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Order paid successfully via Stripe!'),
              backgroundColor: Colors.green,
            ),
          );
          context.read<OrderProvider>().fetchOrders(force: true);
        }
      }
    } catch (e) {
      if (isDialogShowing && mounted) {
        Navigator.of(context).pop(); // hide loading if error
        isDialogShowing = false;
      }

      final errorStr = e.toString().toLowerCase();
      if ((e is StripeException && e.error.code == FailureCode.Canceled) ||
          errorStr.contains('cancel')) {
        debugPrint('Payment sheet cancelled');
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Payment failed: ${e.toString()}'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final orderProvider = context.watch<OrderProvider>();
    final allOrders = orderProvider.orders;

    // Filter logic
    final newOrders = allOrders
        .where((o) => ['new', 'pending'].contains(o.status))
        .toList();
    final accepted = allOrders
        .where((o) => ['accepted', 'driver_assigned'].contains(o.status))
        .toList();
    final preparing = allOrders.where((o) => o.status == 'preparing').toList();
    final ready = allOrders.where((o) => o.status == 'ready').toList();
    final outForDelivery = allOrders
        .where((o) => o.orderType == 'delivery' && o.status == 'picked_up')
        .toList();

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
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Live Orders',
                              style: GoogleFonts.inter(
                                fontSize: 24,
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF0F172A),
                                letterSpacing: -0.5,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Track and manage orders in real time',
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                color: const Color(0xFF6B7280),
                              ),
                            ),
                          ],
                        ),
                        // Refresh button matching mockup
                        GestureDetector(
                          onTap: () => context.read<OrderProvider>().fetchOrders(force: true),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEA580C), // Bright orange from UI mockup
                              borderRadius: BorderRadius.circular(10),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFFEA580C).withValues(alpha: 0.25),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.refresh_rounded,
                                  color: Colors.white,
                                  size: 16,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  'Refresh',
                                  style: GoogleFonts.inter(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Order Status Sections (5 Stages matching UI Mockup)
                    _buildStatusSection(
                      title: 'New Orders',
                      icon: Icons.assignment_outlined,
                      emptyIllustrationIcon: Icons.receipt_long_rounded,
                      emptyTitle: 'No new orders',
                      emptySubtitle: 'Orders placed by customers will appear here.',
                      orders: newOrders,
                      textColor: const Color(0xFF9A3412),
                      bgColor: const Color(0xFFFFF7ED),
                      badgeBgColor: const Color(0xFFFFEDD5),
                      borderColor: const Color(0xFFFED7AA),
                    ),
                    _buildStatusSection(
                      title: 'Accepted',
                      icon: Icons.check_circle_outline_rounded,
                      emptyIllustrationIcon: Icons.fact_check_outlined,
                      emptyTitle: 'No accepted orders',
                      emptySubtitle: 'Orders that are accepted will appear here.',
                      orders: accepted,
                      textColor: const Color(0xFF854D0E),
                      bgColor: const Color(0xFFFEFCE8),
                      badgeBgColor: const Color(0xFFFEF9C3),
                      borderColor: const Color(0xFFFEF08A),
                    ),
                    _buildStatusSection(
                      title: 'Preparing',
                      icon: Icons.access_time_rounded,
                      emptyIllustrationIcon: Icons.soup_kitchen_outlined,
                      emptyTitle: 'No orders in preparation',
                      emptySubtitle: 'Orders being prepared will appear here.',
                      orders: preparing,
                      textColor: const Color(0xFF6B21A8),
                      bgColor: const Color(0xFFFAF5FF),
                      badgeBgColor: const Color(0xFFF3E8FF),
                      borderColor: const Color(0xFFE9D5FF),
                    ),
                    _buildStatusSection(
                      title: 'Ready',
                      icon: Icons.shopping_bag_outlined,
                      emptyIllustrationIcon: Icons.room_service_outlined,
                      emptyTitle: 'No ready orders',
                      emptySubtitle: 'Orders ready for pickup or delivery will appear here.',
                      orders: ready,
                      textColor: const Color(0xFF15803D),
                      bgColor: const Color(0xFFF0FDF4),
                      badgeBgColor: const Color(0xFFDCFCE7),
                      borderColor: const Color(0xFFBBF7D0),
                    ),
                    _buildStatusSection(
                      title: 'Out for Delivery',
                      icon: Icons.two_wheeler_rounded,
                      emptyIllustrationIcon: Icons.delivery_dining_outlined,
                      emptyTitle: 'No orders out for delivery',
                      emptySubtitle: 'Orders that are out for delivery will appear here.',
                      orders: outForDelivery,
                      textColor: const Color(0xFF0369A1),
                      bgColor: const Color(0xFFF0F9FF),
                      badgeBgColor: const Color(0xFFE0F2FE),
                      borderColor: const Color(0xFFBAE6FD),
                    ),

                    // Today's Summary
                    _buildTodaySummary(allOrders, context),

                    // Recent Completed
                    _buildRecentCompleted(allOrders, context),
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
                Container(
                  width: 100,
                  height: 40,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
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

  Widget _buildStatusSection({
    required String title,
    required IconData icon,
    required IconData emptyIllustrationIcon,
    required String emptyTitle,
    required String emptySubtitle,
    required List<OrderModel> orders,
    required Color textColor,
    required Color bgColor,
    required Color badgeBgColor,
    required Color borderColor,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
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
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: badgeBgColor,
                      shape: BoxShape.circle,
                      border: Border.all(color: borderColor.withValues(alpha: 0.8)),
                    ),
                    child: Icon(icon, color: textColor, size: 16),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    title,
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w700,
                      color: textColor,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: badgeBgColor,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: borderColor.withValues(alpha: 0.6)),
                ),
                child: Text(
                  '${orders.length}',
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.w800,
                    color: textColor,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          if (orders.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: borderColor.withValues(alpha: 0.6),
                ),
              ),
              child: Row(
                children: [
                  _buildEmptyIllustration(emptyIllustrationIcon, textColor),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          emptyTitle,
                          style: GoogleFonts.inter(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF1E293B),
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          emptySubtitle,
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: const Color(0xFF64748B),
                            height: 1.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            )
          else
            ...orders
                .map((order) => _buildOrderCard(order, textColor))
                .toList(),
        ],
      ),
    );
  }

  Widget _buildEmptyIllustration(IconData icon, Color color) {
    return SizedBox(
      width: 48,
      height: 48,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Top-left sparkle dashes
          Positioned(
            top: 2,
            left: 2,
            child: Transform.rotate(
              angle: -0.6,
              child: Container(
                width: 4,
                height: 2,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(1),
                ),
              ),
            ),
          ),
          Positioned(
            top: 0,
            left: 9,
            child: Transform.rotate(
              angle: -0.2,
              child: Container(
                width: 4,
                height: 2,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(1),
                ),
              ),
            ),
          ),
          // Top-right sparkle dashes
          Positioned(
            top: 2,
            right: 2,
            child: Transform.rotate(
              angle: 0.6,
              child: Container(
                width: 4,
                height: 2,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(1),
                ),
              ),
            ),
          ),
          Positioned(
            top: 0,
            right: 9,
            child: Transform.rotate(
              angle: 0.2,
              child: Container(
                width: 4,
                height: 2,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(1),
                ),
              ),
            ),
          ),
          // Bottom subtle sparkle
          Positioned(
            bottom: 4,
            left: 6,
            child: Container(
              width: 3,
              height: 3,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.5),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Positioned(
            bottom: 4,
            right: 6,
            child: Container(
              width: 3,
              height: 3,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.5),
                shape: BoxShape.circle,
              ),
            ),
          ),
          // Center Icon
          Icon(icon, size: 34, color: color),
        ],
      ),
    );
  }

  void _showPaymentModal(
    String paymentUrl,
    DateTime createdAt, {
    String? customerPhone,
  }) {
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
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    '#${order.orderNumber}',
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Row(
                  children: [
                    const Icon(Icons.access_time, size: 12, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(
                        TimeUtils.formatDateTimeWithTz(
                          order.createdAt,
                          TimeUtils.getRestaurantTimezone(Provider.of<AuthProvider>(
                            context,
                            listen: false,
                          ).user),
                        ).split('  ').last,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              order.customerName,
              style: GoogleFonts.inter(
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
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
                          Text(
                            '${item.quantity}x',
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                              color: AppColors.primary,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.name,
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.grey.shade800,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                if (item.size != null && item.size!.isNotEmpty)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 2),
                                    child: Text(
                                      'Size: ${item.size}',
                                      style: GoogleFonts.inter(
                                        fontSize: 11,
                                        color: Colors.grey.shade700,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                if (item.addOns.isNotEmpty)
                                  ...item.addOns.map(
                                    (a) => Padding(
                                      padding: const EdgeInsets.only(top: 2),
                                      child: Text(
                                        '+ $a',
                                        style: GoogleFonts.inter(
                                          fontSize: 11,
                                          color: Colors.grey.shade600,
                                          fontStyle: FontStyle.italic,
                                        ),
                                      ),
                                    ),
                                  ),
                                if (item.specialInstructions != null &&
                                    item.specialInstructions!.isNotEmpty)
                                  Text(
                                    'Note: ${item.specialInstructions}',
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      color: Colors.red.shade700,
                                      fontStyle: FontStyle.italic,
                                    ),
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
                      child: Text(
                        '+ ${order.items.length - 3} more items',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: Colors.grey.shade500,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            if (order.orderType == 'delivery' && order.courierName != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue.shade100),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.delivery_dining, size: 16, color: Colors.blue),
                        const SizedBox(width: 6),
                        Text(
                          'Rider: ${order.courierName ?? 'Assigning rider...'}',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.blue.shade900,
                          ),
                        ),
                      ],
                    ),
                    if (order.courierPhoneForCustomer != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 4, left: 22),
                        child: Row(
                          children: [
                            const Icon(Icons.phone, size: 12, color: Colors.blue),
                            const SizedBox(width: 4),
                            Text(
                              '(Customer): ${order.courierPhoneForCustomer}',
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                color: Colors.blue.shade800,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      )
                    else if (order.courierPhone != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 4, left: 22),
                        child: Row(
                          children: [
                            const Icon(Icons.phone, size: 12, color: Colors.blue),
                            const SizedBox(width: 4),
                            Text(
                              order.courierPhone!,
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                color: Colors.blue.shade800,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    if (order.courierPhoneForRestaurant != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 4, left: 22),
                        child: Row(
                          children: [
                            const Icon(Icons.storefront, size: 12, color: Colors.blue),
                            const SizedBox(width: 4),
                            Text(
                              '(Restaurant): ${order.courierPhoneForRestaurant}',
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                color: Colors.blue.shade800,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    '${order.items.length} Items',
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w500,
                      fontSize: 12,
                      color: Colors.grey.shade700,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Text(
                  '\$${order.total.toStringAsFixed(2)}',
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
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
    // Show track button on any active status when tracking URL is available
    if (order.orderType == 'delivery' &&
        (order.thirdPartyTrackingUrl != null || order.trackingUrl != null))
      return true;
    // Ready delivery orders → show waiting for rider
    if (order.orderType == 'delivery' &&
        ['ready_for_pickup', 'ready'].contains(order.status))
      return true;
    return [
      'pending',
      'accepted',
      'preparing',
      'ready_for_pickup',
      'ready',
      'picked_up',
    ].contains(order.status);
  }

  Widget _buildQuickActions(BuildContext context, OrderModel order) {
    // Track button: show on any status when delivery + tracking URL available
    final hasTrackingUrl = order.orderType == 'delivery' &&
        (order.thirdPartyTrackingUrl != null || order.trackingUrl != null);

    // For picked_up (out for delivery), only show track button
    if (order.orderType == 'delivery' && order.status == 'picked_up') {
      if (!hasTrackingUrl) return const SizedBox.shrink();
      final trackUrl = order.thirdPartyTrackingUrl ?? order.trackingUrl!;
      return Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () => launchUrl(Uri.parse(trackUrl)),
              icon: const Icon(
                Icons.location_on,
                size: 16,
                color: Color(0xFF8B0000),
              ),
              label: Text(
                'Track Live Order',
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF8B0000),
                ),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFF8B0000)),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
        ],
      );
    }

    // Ready delivery orders → show animated "Waiting for Rider..." indicator
    if (order.orderType == 'delivery' &&
        ['ready_for_pickup', 'ready'].contains(order.status)) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFFF0FDF4),
          border: Border.all(
            color: const Color(0xFFBBF7D0),
            width: 2,
            strokeAlign: BorderSide.strokeAlignInside,
          ),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                color: const Color(0xFF16A34A),
              ),
            ),
            const SizedBox(width: 10),
            Text(
              'Waiting for Rider...',
              style: GoogleFonts.inter(
                fontWeight: FontWeight.bold,
                fontSize: 13,
                color: const Color(0xFF166534),
              ),
            ),
          ],
        ),
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
        nextStatus = 'ready';
        buttonColor = Colors.green;
        buttonIcon = Icons.room_service;
        break;
      case 'ready_for_pickup':
      case 'ready':
        if (order.orderType == 'delivery') {
          // Delivery orders: "Waiting for Rider" handled above, return nothing here
          return const SizedBox.shrink();
        } else {
          buttonText = 'Handed to Customer';
          nextStatus = 'picked_up';
          buttonColor = Colors.blue;
          buttonIcon = Icons.local_shipping;
          
          // For pickup, we want to show BOTH the "Waiting for Customer..." animation AND the button
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 12),
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDF4),
                  border: Border.all(
                    color: const Color(0xFFBBF7D0),
                    width: 2,
                    strokeAlign: BorderSide.strokeAlignInside,
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: const Color(0xFF16A34A),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'Waiting for Customer...',
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: const Color(0xFF166534),
                      ),
                    ),
                  ],
                ),
              ),
              ElevatedButton.icon(
                onPressed: () async {
                  try {
                    await context.read<OrderProvider>().updateOrderStatus(
                      order.id,
                      nextStatus,
                    );
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(e.toString())),
                      );
                    }
                  }
                },
                icon: Icon(buttonIcon, size: 18),
                label: Text(
                  buttonText,
                  style: GoogleFonts.inter(fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: buttonColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  elevation: 0,
                ),
              ),
            ],
          );
        }
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
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'Awaiting Payment...',
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.bold,
                    color: Colors.red,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    final url =
                        '${ApiService.baseUrl}/api/orders/${order.id}/pay';
                    _showPaymentModal(
                      url,
                      order.createdAt,
                      customerPhone: order.customerPhone,
                    );
                  },
                  icon: const Icon(
                    Icons.qr_code,
                    size: 16,
                    color: Colors.black87,
                  ),
                  label: Text(
                    'Show QR Code',
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                      fontSize: 12,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: Colors.grey.shade300),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _processStripePayment(order),
                  icon: const Icon(
                    Icons.credit_card,
                    size: 16,
                    color: Colors.blue,
                  ),
                  label: Text(
                    'Charge Card',
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w600,
                      color: Colors.blue,
                      fontSize: 12,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.blue),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
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
                      await context.read<OrderProvider>().updateOrderStatus(
                        order.id,
                        'cancelled',
                      );
                    } catch (e) {
                      print('Error cancelling order: $e');
                      if (context.mounted) {
                        ScaffoldMessenger.of(
                          context,
                        ).showSnackBar(SnackBar(content: Text(e.toString())));
                      }
                    }
                  },
                  icon: const Icon(Icons.close, size: 16, color: Colors.red),
                  label: Text(
                    'Cancel Order',
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w600,
                      color: Colors.red,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.red),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
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
        // Track button above status button when tracking URL available (not on pending)
        if (hasTrackingUrl && order.status != 'pending') ...[
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => launchUrl(Uri.parse(order.thirdPartyTrackingUrl ?? order.trackingUrl!)),
                  icon: const Icon(
                    Icons.location_on,
                    size: 16,
                    color: Color(0xFF8B0000),
                  ),
                  label: Text(
                    'Track Live Order',
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF8B0000),
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFF8B0000)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
        ],
        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () async {
                  try {
                    // Use dedicated accept endpoint for pending orders
                    if (order.status == 'pending') {
                      await context.read<OrderProvider>().acceptOrder(order.id);
                    } else {
                      await context.read<OrderProvider>().updateOrderStatus(
                        order.id,
                        nextStatus,
                      );
                    }
                  } catch (e) {
                    print('Error updating order status: $e');
                    if (context.mounted) {
                      ScaffoldMessenger.of(
                        context,
                      ).showSnackBar(SnackBar(content: Text(e.toString())));
                    }
                  }
                },
                icon: Icon(buttonIcon, size: 16, color: Colors.white),
                label: Text(
                  buttonText,
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: buttonColor,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
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
                      await context.read<OrderProvider>().updateOrderStatus(
                        order.id,
                        'cancelled',
                      );
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(
                          context,
                        ).showSnackBar(SnackBar(content: Text(e.toString())));
                      }
                    }
                  },
                  icon: const Icon(Icons.close, size: 16, color: Colors.red),
                  label: Text(
                    'Reject Order',
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w600,
                      color: Colors.red,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.red),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }

  Widget _buildTodaySummary(List<OrderModel> orders, BuildContext context) {
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    final tzString = TimeUtils.getRestaurantTimezone(user);
    final nowTz = TimeUtils.getTzDateTime(DateTime.now(), tzString);
    
    final todayOrders = orders.where((o) {
      final orderTz = TimeUtils.getTzDateTime(o.createdAt, tzString);
      return orderTz.year == nowTz.year &&
             orderTz.month == nowTz.month &&
             orderTz.day == nowTz.day;
    }).toList();
    final completed = todayOrders
        .where((o) {
          final isDelivery = o.orderType.toLowerCase() == 'delivery';
          final status = o.status.toLowerCase();
          if (status == 'picked_up' && isDelivery) return false;
          return ['delivered', 'completed', 'picked_up'].contains(status);
        })
        .toList();
    final cancelled = todayOrders
        .where((o) => ['cancelled', 'refunded'].contains(o.status))
        .toList();

    final completedPercent = todayOrders.isEmpty
        ? 0
        : (completed.length / todayOrders.length * 100).round();
    final cancelledPercent = todayOrders.isEmpty
        ? 0
        : (cancelled.length / todayOrders.length * 100).round();

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Today\'s Summary',
            style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildSummaryStat(
                  'Total Orders',
                  '${todayOrders.length}',
                  null,
                  null,
                ),
              ),
              Container(height: 40, width: 1, color: Colors.grey.shade200),
              Expanded(
                child: _buildSummaryStat(
                  'Completed',
                  '${completed.length}',
                  '($completedPercent%)',
                  const Color(0xFF166534),
                ),
              ),
              Container(height: 40, width: 1, color: Colors.grey.shade200),
              Expanded(
                child: _buildSummaryStat(
                  'Cancelled',
                  '${cancelled.length}',
                  '($cancelledPercent%)',
                  const Color(0xFFDC2626),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          GestureDetector(
            onTap: () {
              context.push('/all-orders');
            },
            child: Text(
              'View All Orders →',
              style: GoogleFonts.inter(
                fontWeight: FontWeight.bold,
                color: const Color(0xFFDC2626),
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryStat(
    String label,
    String val,
    String? sub,
    Color? subColor,
  ) {
    return Column(
      children: [
        Text(
          label,
          style: GoogleFonts.inter(color: Colors.grey.shade500, fontSize: 10),
        ),
        const SizedBox(height: 4),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              val,
              style: GoogleFonts.inter(
                fontWeight: FontWeight.bold,
                fontSize: 16,
                color: subColor ?? Colors.black,
              ),
            ),
            if (sub != null) ...[
              const SizedBox(width: 4),
              Text(
                sub,
                style: GoogleFonts.inter(color: subColor, fontSize: 12),
              ),
            ],
          ],
        ),
      ],
    );
  }

  Widget _buildRecentCompleted(List<OrderModel> orders, BuildContext context) {
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    final tzString = TimeUtils.getRestaurantTimezone(user);
    final nowTz = TimeUtils.getTzDateTime(DateTime.now(), tzString);
    final completedOrders = orders.where((o) {
      final orderTz = TimeUtils.getTzDateTime(o.createdAt, tzString);
      final isToday = orderTz.year == nowTz.year &&
             orderTz.month == nowTz.month &&
             orderTz.day == nowTz.day;
      if (!isToday) return false;
      
      final isDelivery = o.orderType.toLowerCase() == 'delivery';
      final status = o.status.toLowerCase();
      if (status == 'picked_up' && isDelivery) return false;
      return ['delivered', 'completed', 'picked_up'].contains(status);
    }).toList();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Recent Completed',
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (completedOrders.isEmpty)
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
                  Text(
                    'No completed orders yet',
                    style: GoogleFonts.inter(
                      color: Colors.grey.shade500,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: completedOrders.take(3).length, // Show up to 3 recent
              itemBuilder: (context, index) {
                final order = completedOrders[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        order.orderNumber ?? '#${order.id.substring(order.id.length - 4)}',
                        style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                      Text(
                        '\$${order.total.toStringAsFixed(2)}',
                        style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13, color: const Color(0xFF166534)),
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}

class _PaymentModalContent extends StatefulWidget {
  final String paymentUrl;
  final DateTime createdAt;
  final String? customerPhone;

  const _PaymentModalContent({
    super.key,
    required this.paymentUrl,
    required this.createdAt,
    this.customerPhone,
  });

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
            Text(
              'Waiting for Payment',
              style: GoogleFonts.inter(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Have the customer scan the QR code to pay.',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                color: Colors.grey.shade600,
                fontSize: 14,
              ),
            ),
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
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'Time Remaining: ${(_modalTimeLeft ~/ 60).toString().padLeft(2, '0')}:${(_modalTimeLeft % 60).toString().padLeft(2, '0')}',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.bold,
                  color: Colors.red,
                ),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFF3F4F6),
                      foregroundColor: Colors.black,
                    ),
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: widget.paymentUrl));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Link Copied!')),
                      );
                    },
                    icon: const Icon(Icons.copy, size: 16),
                    label: const Text('Copy'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Opacity(
                    opacity:
                        (widget.customerPhone == null ||
                            widget.customerPhone!.trim().isEmpty ||
                            widget.customerPhone!.trim() == '0000000000' ||
                            widget.customerPhone!.trim() == 'N/A')
                        ? 0.4
                        : 1.0,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF25D366),
                        foregroundColor: Colors.white,
                        disabledBackgroundColor: const Color(
                          0xFF25D366,
                        ).withValues(alpha: 0.5),
                        disabledForegroundColor: Colors.white,
                      ),
                      onPressed:
                          (widget.customerPhone == null ||
                              widget.customerPhone!.trim().isEmpty ||
                              widget.customerPhone!.trim() == '0000000000' ||
                              widget.customerPhone!.trim() == 'N/A')
                          ? null
                          : () async {
                              final qrUrl =
                                  'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${Uri.encodeComponent(widget.paymentUrl)}';
                              final message =
                                  'Hi! 👋\n\nPlease complete the payment for your order.\n\n🔗 *Click here to pay:* \n${widget.paymentUrl}\n\n📷 *Or scan this QR code:* \n$qrUrl\n\nThank you!';
                              final rawPhone = widget.customerPhone!.trim();
                              final digits = rawPhone.replaceAll(
                                RegExp(r'[^\d]'),
                                '',
                              );
                              final intlPhone = digits.length == 10
                                  ? '1$digits'
                                  : digits;
                              final waUrl =
                                  'https://wa.me/$intlPhone?text=${Uri.encodeComponent(message)}';

                              final url = Uri.parse(waUrl);
                              if (await canLaunchUrl(url)) {
                                await launchUrl(
                                  url,
                                  mode: LaunchMode.externalApplication,
                                );
                              } else {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Could not open WhatsApp'),
                                  ),
                                );
                              }
                            },
                      icon: const Icon(Icons.chat, size: 16),
                      label: const Text('WhatsApp'),
                    ),
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
            ),
          ],
        ),
      ),
    );
  }
}
