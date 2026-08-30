import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../constants/app_colors.dart';
import '../providers/order_provider.dart';
import '../models/order_model.dart';
import '../services/api_service.dart';

class OrderDetailsScreen extends StatefulWidget {
  final String orderId;
  const OrderDetailsScreen({Key? key, required this.orderId}) : super(key: key);

  @override
  State<OrderDetailsScreen> createState() => _OrderDetailsScreenState();
}

class _OrderDetailsScreenState extends State<OrderDetailsScreen> {
  bool _isLoadingAction = false;
  bool _isRemakingOrder = false;
  bool _isSendingInvoice = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrderProvider>().fetchOrderById(widget.orderId);
    });
  }

  void _launchURL(String path) async {
    final url = Uri.parse('\${ApiService.baseUrl}$path');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not open document')));
    }
  }

  void _showPremiumDialog({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
    required String confirmText,
    required VoidCallback onConfirm,
  }) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        elevation: 0,
        backgroundColor: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 10))],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: iconColor.withOpacity(0.1), shape: BoxShape.circle),
                child: Icon(icon, color: iconColor, size: 36),
              ),
              const SizedBox(height: 20),
              Text(
                title,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF111827)),
              ),
              const SizedBox(height: 12),
              Text(
                subtitle,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF6B7280), height: 1.5),
              ),
              const SizedBox(height: 32),
              Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: () => Navigator.pop(ctx),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text('Cancel', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: const Color(0xFF6B7280))),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        onConfirm();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: iconColor,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(confirmText, style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _confirmRemake(OrderModel order) {
    _showPremiumDialog(
      title: 'Remake Order',
      subtitle: 'Send this order back to the kitchen to be prepared again?',
      icon: Icons.refresh,
      iconColor: Colors.orange,
      confirmText: 'Yes, Remake',
      onConfirm: () async {
        setState(() => _isRemakingOrder = true);
        try {
          await ApiService.post('/api/orders/${order.id}/remake', {});
          if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Remake order sent to kitchen')));
          if (mounted) context.read<OrderProvider>().fetchOrderById(widget.orderId);
        } catch (e) {
          if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to create remake order: $e')));
        } finally {
          if (mounted) setState(() => _isRemakingOrder = false);
        }
      },
    );
  }

  void _handleSendInvoice(OrderModel order) async {
    if (order.customerEmail == null || order.customerEmail!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No customer email on file')));
      return;
    }
    setState(() => _isSendingInvoice = true);
    try {
      await ApiService.post('/api/orders/${order.id}/send-invoice', {});
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Invoice emailed to ${order.customerEmail}')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to send invoice email: $e')));
    } finally {
      if (mounted) setState(() => _isSendingInvoice = false);
    }
  }

  void _confirmCancel(OrderModel order) {
    _showPremiumDialog(
      title: 'Cancel Order',
      subtitle: 'Are you sure you want to cancel this order? If paid, an auto-refund will be initiated.',
      icon: Icons.cancel_outlined,
      iconColor: Colors.red,
      confirmText: 'Yes, Cancel',
      onConfirm: () async {
        setState(() => _isLoadingAction = true);
        try {
          await context.read<OrderProvider>().cancelOrder(order.id);
          if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Order Cancelled')));
        } catch (e) {
          if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
        } finally {
          if (mounted) setState(() => _isLoadingAction = false);
        }
      },
    );
  }

  void _confirmRefund(OrderModel order) {
    if (order.refunded) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Order has already been refunded.')));
      return;
    }
    if (!['paid', 'partially_refunded'].contains(order.paymentStatus.toLowerCase())) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Only paid orders can be refunded.')));
      return;
    }
    _showPremiumDialog(
      title: 'Refund Order',
      subtitle: 'Refund \$${order.total.toStringAsFixed(2)} to the customer? This action cannot be undone.',
      icon: Icons.history,
      iconColor: Colors.blue,
      confirmText: 'Yes, Refund',
      onConfirm: () async {
        setState(() => _isLoadingAction = true);
        try {
          await context.read<OrderProvider>().refundOrder(order.id);
          if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Order Refunded')));
        } catch (e) {
          if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
        } finally {
          if (mounted) setState(() => _isLoadingAction = false);
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<OrderProvider>();
    final order = provider.orders.firstWhere((o) => o.id == widget.orderId, orElse: () => OrderModel(id: '', orderNumber: '', status: '', customerName: '', customerPhone: '', orderType: '', total: 0, createdAt: DateTime.now(), items: []));
    
    if (order.id.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Order Details')),
        body: const Center(child: Text('Order not found')),
      );
    }

    final isTerminal = ['delivered', 'cancelled', 'failed', 'refunded', 'picked_up', 'completed'].contains(order.status.toLowerCase());
    final canRefund = !order.refunded && ['paid', 'partially_refunded'].contains(order.paymentStatus.toLowerCase());
    
    // Build unified order journey feed
    final List<Map<String, dynamic>> journeyEvents = [];
    
    for (var su in order.statusUpdates) {
      String label = su.status.replaceAll('_', ' ');
      String key = su.status.toLowerCase();
      
      if (su.description != null && su.description!.toLowerCase().contains('refund of') && su.description!.toLowerCase().contains('processed')) {
        label = 'refunded';
        key = 'refunded';
      }
      
      journeyEvents.add({
        'type': 'status',
        'key': key,
        'label': label.toUpperCase(),
        'desc': su.description,
        'time': su.timestamp,
      });
    }
    
    for (var pe in order.paymentEvents) {
      journeyEvents.add({
        'type': 'payment',
        'key': pe.event,
        'label': pe.event.replaceAll('_', ' ').toUpperCase(),
        'desc': pe.reason ?? pe.error,
        'amount': pe.amount,
        'time': pe.timestamp,
      });
    }
    
    journeyEvents.sort((a, b) => (a['time'] as DateTime).compareTo(b['time'] as DateTime));
    
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        title: Text('Order #${order.orderNumber}', style: GoogleFonts.inter(color: Colors.black, fontWeight: FontWeight.bold)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.print, color: Colors.black), onPressed: () => _launchURL('/api/orders/\${order.id}/kot')),
          IconButton(icon: const Icon(Icons.receipt, color: Colors.black), onPressed: () => _launchURL('/api/orders/\${order.id}/invoice')),
        ],
      ),
      body: _isLoadingAction 
        ? const Center(child: CircularProgressIndicator()) 
        : SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Quick Info Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildStatusBadge(order.status),
                    Text(
                      "${order.createdAt.hour.toString().padLeft(2, '0')}:${order.createdAt.minute.toString().padLeft(2, '0')} ${order.createdAt.month}/${order.createdAt.day}/${order.createdAt.year}",
                      style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                if (order.hasAutoRefund) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: order.autoRefundFailed ? Colors.red.shade50 : 
                             order.autoRefundSkipped ? Colors.blueGrey.shade50 :
                             (order.autoRefundSucceeded ? Colors.amber.shade50 : Colors.blue.shade50),
                      border: Border.all(color: order.autoRefundFailed ? Colors.red.shade200 : 
                                                order.autoRefundSkipped ? Colors.blueGrey.shade200 :
                                                (order.autoRefundSucceeded ? Colors.amber.shade200 : Colors.blue.shade200)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          order.autoRefundFailed ? Icons.error_outline : 
                          order.autoRefundSkipped ? Icons.settings_outlined :
                          (order.autoRefundSucceeded ? Icons.flash_on : Icons.info_outline),
                          color: order.autoRefundFailed ? Colors.red.shade700 : 
                                 order.autoRefundSkipped ? Colors.blueGrey.shade700 :
                                 (order.autoRefundSucceeded ? Colors.amber.shade700 : Colors.blue.shade700),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                order.autoRefundFailed ? 'Auto-Refund Failed — Manual action required' : 
                                order.autoRefundSkipped ? 'Auto-Refund Disabled in Settings' :
                                (order.autoRefundSucceeded ? 'Auto-Refund Processed' : 'Auto-Refund Initiated'),
                                style: GoogleFonts.inter(
                                  fontWeight: FontWeight.bold, 
                                  fontSize: 13, 
                                  color: order.autoRefundFailed ? Colors.red.shade900 : 
                                         order.autoRefundSkipped ? Colors.blueGrey.shade900 :
                                         (order.autoRefundSucceeded ? Colors.amber.shade900 : Colors.blue.shade900)
                                ),
                              ),
                              if (order.autoRefundSkipped)
                                Padding(
                                  padding: const EdgeInsets.only(top: 4),
                                  child: Text(
                                    'Please initiate a manual refund below if required.',
                                    style: GoogleFonts.inter(fontSize: 12, color: Colors.blueGrey.shade700),
                                  ),
                                ),
                            ],
                          ),
                        )
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Order Status Progression Button
                if (!isTerminal) ...[
                  _buildStatusProgressionButton(order),
                  const SizedBox(height: 16),
                ],

                // Quick Actions Group
                _buildSectionHeader('Quick Actions'),
                Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade200)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Opacity(
                                opacity: _isRemakingOrder ? 0.4 : 1.0,
                                child: OutlinedButton.icon(
                                  onPressed: _isRemakingOrder ? null : () => _confirmRemake(order),
                                  icon: _isRemakingOrder ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.refresh, size: 16, color: Colors.green),
                                  label: Text('Remake', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.black87)),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Opacity(
                                opacity: (_isSendingInvoice || order.customerEmail == null) ? 0.4 : 1.0,
                                child: OutlinedButton.icon(
                                  onPressed: (_isSendingInvoice || order.customerEmail == null) ? null : () => _handleSendInvoice(order),
                                  icon: _isSendingInvoice ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.send, size: 16),
                                  label: Text('Email Invoice', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.black87)),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: Opacity(
                                opacity: (!canRefund) ? 0.4 : 1.0,
                                child: OutlinedButton.icon(
                                  onPressed: (!canRefund) ? null : () => _confirmRefund(order),
                                  icon: const Icon(Icons.history, size: 16),
                                  label: Text('Refund', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.black87)),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Opacity(
                                opacity: isTerminal ? 0.4 : 1.0,
                                child: OutlinedButton.icon(
                                  onPressed: isTerminal ? null : () => _confirmCancel(order),
                                  icon: const Icon(Icons.cancel, size: 16, color: Colors.red),
                                  style: OutlinedButton.styleFrom(side: BorderSide(color: Colors.red.shade200), backgroundColor: Colors.red.shade50),
                                  label: Text('Cancel', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.red.shade700)),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Customer Details Card
                _buildSectionHeader('Customer Details'),
                Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade200)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              backgroundColor: const Color(0xFFEBDCC1),
                              foregroundColor: const Color(0xFF8B0000),
                              child: Text(order.customerName[0].toUpperCase(), style: const TextStyle(fontWeight: FontWeight.bold)),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(order.customerName, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16)),
                                  Text(order.customerPhone, style: GoogleFonts.inter(color: Colors.grey.shade600, fontSize: 13)),
                                  const SizedBox(height: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      border: Border.all(color: Colors.grey.shade300),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text('Source: ', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFF8B0000))),
                                        Icon(order.orderSource == 'app' ? Icons.smartphone : Icons.language, size: 12, color: order.orderSource == 'app' ? Colors.green : Colors.blue),
                                        const SizedBox(width: 4),
                                        Text(order.orderSource == 'app' ? 'Mobile App' : 'Website', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.phone, color: Colors.green),
                              onPressed: () => launchUrl(Uri.parse('tel:${order.customerPhone}')),
                            )
                          ],
                        ),
                        if (order.customerEmail != null) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(Icons.email, size: 14, color: Colors.grey),
                              const SizedBox(width: 8),
                              Text(order.customerEmail!, style: GoogleFonts.inter(color: Colors.grey.shade700, fontSize: 13)),
                            ],
                          ),
                        ],
                        if (order.accountName != null && (order.accountName != order.customerName || order.accountEmail != order.customerEmail)) ...[
                          const SizedBox(height: 12),
                          const Divider(height: 1, color: Colors.black12),
                          const SizedBox(height: 12),
                          Text('ACCOUNT OWNER', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey.shade500)),
                          const SizedBox(height: 4),
                          Text(order.accountName ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13)),
                          if (order.accountEmail != null) Text(order.accountEmail!, style: GoogleFonts.inter(color: Colors.grey.shade600, fontSize: 12)),
                          if (order.accountPhone != null) Text(order.accountPhone!, style: GoogleFonts.inter(color: Colors.grey.shade600, fontSize: 12)),
                        ]
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Fulfillment Details Card
                _buildSectionHeader('Fulfillment Details'),
                Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade200)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
                              child: Text(order.orderType.toUpperCase(), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        if (order.orderType == 'dine_in' && order.tableNumber != null)
                          Text('Table ${order.tableNumber}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14))
                        else
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.location_on, size: 16, color: Colors.grey),
                              const SizedBox(width: 8),
                              Expanded(child: Text(order.address ?? 'Pickup / No Address Provided', style: GoogleFonts.inter(fontSize: 13))),
                            ],
                          ),
                        if (order.specialInstructions != null && order.specialInstructions!.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(color: const Color(0xFFFFFBEB), borderRadius: BorderRadius.circular(8), border: Border.all(color: const Color(0xFFFDE68A))),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Customer Notes', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFFB45309))),
                                const SizedBox(height: 4),
                                Text(order.specialInstructions!, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF92400E))),
                              ],
                            ),
                          )
                        ],
                      ],
                    ),
                  ),
                ),
                if (order.orderType == 'delivery') ...[
                  const SizedBox(height: 16),
                  _buildSectionHeader('Delivery & Tracking Details'),
                  Card(
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade200)),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (order.trackingUrl != null)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(color: const Color(0xFFFCFAF5), borderRadius: const BorderRadius.vertical(top: Radius.circular(12)), border: Border(bottom: BorderSide(color: Colors.grey.shade200))),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    const Icon(Icons.local_shipping, size: 16, color: Color(0xFF8B0000)),
                                    const SizedBox(width: 8),
                                    Text('TRACKING ACTIVE', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF8B0000))),
                                  ],
                                ),
                                InkWell(
                                  onTap: () => launchUrl(Uri.parse(order.trackingUrl!)),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(color: const Color(0xFF8B0000), borderRadius: BorderRadius.circular(6)),
                                    child: Row(
                                      children: [
                                        const Icon(Icons.open_in_new, size: 14, color: Colors.white),
                                        const SizedBox(width: 6),
                                        Text('Track Order', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white)),
                                      ],
                                    ),
                                  ),
                                )
                              ],
                            ),
                          ),
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildDeliveryRow('Placement Time', _formatDT(order.createdAt)),
                              _buildDeliveryRow('Accepted Time', _formatDT(order.statusUpdates.where((u) => u.status == 'accepted').isNotEmpty ? order.statusUpdates.firstWhere((u) => u.status == 'accepted').timestamp : null)),
                              _buildDeliveryRow('Pickup Time', _formatDT(order.pickupTime)),
                              _buildDeliveryRow('Delivery Time', _formatDT(order.deliveryTime)),
                              const SizedBox(height: 12),
                              const Divider(height: 1, color: Colors.black12),
                              const SizedBox(height: 12),
                              _buildDeliveryRow('Delivery Provider', order.deliveryProvider == 'shipday' ? 'In-House' : (order.deliveryProvider != null ? order.deliveryProvider![0].toUpperCase() + order.deliveryProvider!.substring(1) : 'N/A')),
                              if (order.deliveryId != null) _buildDeliveryRow('Shipday Order ID', order.deliveryId!),
                              _buildDeliveryRow('Assigned Rider', order.courierName ?? 'Pending'),
                              if (order.courierPhone != null)
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 8.0),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text('Rider Phone', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.w600)),
                                      Row(
                                        children: [
                                          Text(order.courierPhone!, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold)),
                                          const SizedBox(width: 8),
                                          InkWell(
                                            onTap: () => launchUrl(Uri.parse('tel:\${order.courierPhone}')),
                                            child: Container(
                                              padding: const EdgeInsets.all(4),
                                              decoration: BoxDecoration(color: Colors.grey.shade100, shape: BoxShape.circle, border: Border.all(color: Colors.grey.shade300)),
                                              child: const Icon(Icons.phone, size: 14, color: Colors.black87),
                                            ),
                                          )
                                        ],
                                      )
                                    ],
                                  ),
                                )
                              else
                                _buildDeliveryRow('Rider Phone', 'N/A'),
                              if (order.rating != null) ...[
                                const SizedBox(height: 12),
                                const Divider(height: 1, color: Colors.black12),
                                const SizedBox(height: 12),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text('Customer Feedback', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.w600)),
                                    Row(
                                      children: [
                                        ...List.generate(5, (i) => Icon(Icons.star, size: 14, color: i < (order.rating ?? 0).floor() ? Colors.amber : Colors.grey.shade300)),
                                        const SizedBox(width: 4),
                                        Text(order.rating!.toStringAsFixed(1), style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold)),
                                      ],
                                    )
                                  ],
                                )
                              ]
                            ],
                          ),
                        )
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 16),

                // Order Items
                _buildSectionHeader('Order Items (${order.items.length})'),
                Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade200)),
                  child: ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: order.items.length,
                    separatorBuilder: (_,__) => Divider(color: Colors.grey.shade200, height: 1),
                    itemBuilder: (ctx, idx) {
                      final item = order.items[idx];
                      return Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 24, height: 24,
                              decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(4)),
                              child: Center(child: Text('${item.quantity}x', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12))),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item.name, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14)),
                                  if (item.size != null) Text('Size: ${item.size}', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade600)),
                                  if (item.addOns.isNotEmpty) Text(item.addOns.join(', '), style: GoogleFonts.inter(fontSize: 11, color: Colors.grey.shade500)),
                                ],
                              ),
                            ),
                            // Use actual calculated item line total from backend
                            Text('\$${item.lineTotal.toStringAsFixed(2)}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14)),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 16),

                // Financial Summary
                _buildSectionHeader('Financial Summary'),
                Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade200)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        _buildFinancialRow('Subtotal', order.subtotal),
                        if (order.tax > 0) _buildFinancialRow('Tax', order.tax),
                        if (order.deliveryFee > 0) _buildFinancialRow('Delivery Fee', order.deliveryFee),
                        if (order.tip > 0) _buildFinancialRow('Tip', order.tip),
                        if (order.discount > 0) _buildFinancialRow('Discount', -order.discount, isGreen: true),
                        if (order.refundAmount > 0) _buildFinancialRow('Refunded', order.refundAmount, isRed: true),
                        const Divider(),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Total', style: GoogleFonts.inter(fontWeight: FontWeight.w900, fontSize: 16)),
                            Text('\$${order.total.toStringAsFixed(2)}', style: GoogleFonts.inter(fontWeight: FontWeight.w900, fontSize: 16, color: const Color(0xFF8B0000))),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(8)),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Payment Status', style: GoogleFonts.inter(fontSize: 10, color: Colors.grey.shade600, fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 4),
                                  Text(order.paymentStatus.toUpperCase(), style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: order.paymentStatus == 'paid' ? Colors.green : Colors.orange)),
                                ],
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text('Method', style: GoogleFonts.inter(fontSize: 10, color: Colors.grey.shade600, fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 4),
                                  Text(order.paymentMethod.toUpperCase(), style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ],
                          ),
                        )
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Order Journey Timeline
                _buildSectionHeader('Order Journey'),
                Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade200)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: journeyEvents.asMap().entries.map((entry) {
                        final idx = entry.key;
                        final ev = entry.value;
                        final isLast = idx == journeyEvents.length - 1;
                        
                        final isPayment = ev['type'] == 'payment';
                        final isCancel = ['cancelled', 'failed', 'refunded'].contains(ev['key']);
                        final isPreparing = ['preparing', 'ready'].contains(ev['key']);
                        final isSuccess = ['delivered', 'completed', 'picked_up'].contains(ev['key']);
                        final isRefundAction = ev['key'].toString().contains('refund');
                        final isFailedAction = ev['key'].toString().contains('fail');
                        
                        Color dotColor = Colors.blue.shade700;
                        Color dotBg = Colors.blue.shade50;
                        IconData? pIcon;
                        
                        if (isPayment) {
                          if (isRefundAction) {
                            dotColor = Colors.amber.shade700;
                            dotBg = Colors.amber.shade50;
                            pIcon = Icons.flash_on;
                          } else if (isFailedAction) {
                            dotColor = Colors.red.shade700;
                            dotBg = Colors.red.shade50;
                            pIcon = Icons.error_outline;
                          } else {
                            dotColor = Colors.purple.shade700;
                            dotBg = Colors.purple.shade50;
                            pIcon = Icons.credit_card;
                          }
                        } else {
                          if (isCancel) { dotColor = Colors.red.shade700; dotBg = Colors.red.shade50; }
                          else if (isPreparing) { dotColor = Colors.orange.shade700; dotBg = Colors.orange.shade50; }
                          else if (isSuccess) { dotColor = Colors.green.shade700; dotBg = Colors.green.shade50; }
                        }
                        
                        return Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Column(
                              children: [
                                if (isPayment)
                                  Container(
                                    width: 24, height: 24,
                                    margin: const EdgeInsets.only(right: 4),
                                    decoration: BoxDecoration(color: dotBg, shape: BoxShape.circle),
                                    child: Icon(pIcon, size: 14, color: dotColor),
                                  )
                                else
                                  Container(
                                    width: 14, height: 14,
                                    margin: const EdgeInsets.only(right: 9, top: 4, left: 5),
                                    decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2)),
                                  ),
                                if (!isLast)
                                  Container(
                                    width: 2, height: 32, // Line connecting to next
                                    margin: const EdgeInsets.only(right: 4),
                                    color: Colors.grey.shade200,
                                  ),
                              ],
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Padding(
                                padding: const EdgeInsets.only(bottom: 16.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(ev['label'], style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13, color: isPayment ? dotColor : Colors.black87)),
                                        Text(
                                          "${(ev['time'] as DateTime).hour.toString().padLeft(2, '0')}:${(ev['time'] as DateTime).minute.toString().padLeft(2, '0')} ${(ev['time'] as DateTime).month}/${(ev['time'] as DateTime).day}",
                                          style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey.shade600),
                                        ),
                                      ],
                                    ),
                                    if (ev['desc'] != null && ev['desc'].toString().isNotEmpty)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 2),
                                        child: Text(ev['desc'], style: GoogleFonts.inter(fontSize: 11, color: Colors.grey.shade600)),
                                      ),
                                    if (ev['amount'] != null)
                                      Container(
                                        margin: const EdgeInsets.only(top: 4),
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(4)),
                                        child: Text('\$${(ev['amount'] as double).toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold)),
                                      )
                                  ],
                                ),
                              ),
                            )
                          ],
                        );
                      }).toList(),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                const SizedBox(height: 24),
              ],
            ),
          ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0, left: 4),
      child: Text(title, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w900, color: const Color(0xFF8B0000), letterSpacing: 0.5)),
    );
  }

  Widget _buildFinancialRow(String label, double amount, {bool isGreen = false, bool isRed = false}) {
    Color col = Colors.black87;
    if (isGreen) col = Colors.green;
    if (isRed) col = Colors.red;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 13, color: Colors.grey.shade600, fontWeight: FontWeight.w500)),
          Text('${amount < 0 ? "-" : ""}\$${amount.abs().toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: col)),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bg = Colors.grey.shade200;
    Color fg = Colors.grey.shade700;
    switch (status) {
      case 'new': bg = Colors.red.shade50; fg = Colors.red.shade700; break;
      case 'preparing': bg = Colors.orange.shade50; fg = Colors.orange.shade700; break;
      case 'ready': bg = Colors.blue.shade50; fg = Colors.blue.shade700; break;
      case 'out_for_delivery': bg = Colors.green.shade50; fg = Colors.green.shade700; break;
      case 'delivered': case 'picked_up': case 'completed': bg = Colors.green.shade50; fg = Colors.green.shade700; break;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
      child: Text(status.toUpperCase().replaceAll('_', ' '), style: GoogleFonts.inter(color: fg, fontSize: 10, fontWeight: FontWeight.bold)),
    );
  }

  String _formatDT(DateTime? t) {
    if (t == null) return 'N/A';
    return '${t.month}/${t.day}/${t.year}  ${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
  }

  Widget _buildDeliveryRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.w600)),
          Text(value, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildStatusProgressionButton(OrderModel order) {
    String buttonText = '';
    String nextStatus = '';
    Color buttonColor = const Color(0xFF8B0000);
    IconData buttonIcon = Icons.check_circle_outline;
    
    final status = order.status.toLowerCase();
    final orderType = order.orderType.toLowerCase();

    switch (status) {
      case 'pending':
        buttonText = 'Accept Order';
        nextStatus = 'accepted';
        buttonColor = const Color(0xFF8B0000);
        buttonIcon = Icons.check;
        break;
      case 'accepted':
        buttonText = 'Start Preparing';
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
        if (orderType == 'delivery') {
          // Delivery orders: driver handles pickup, show waiting indicator
          return Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 14),
            decoration: BoxDecoration(
              color: Colors.green.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.green.shade200, width: 1.5, style: BorderStyle.solid),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(
                  width: 16, height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.green.shade700),
                ),
                const SizedBox(width: 10),
                Text('Waiting for Rider...', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.green.shade700, fontSize: 14)),
              ],
            ),
          );
        } else {
          // Pickup / Dine-in: merchant confirms customer picked up
          buttonText = 'Handed to Customer ✓';
          nextStatus = 'picked_up';
          buttonColor = Colors.blue;
          buttonIcon = Icons.handshake;
        }
        break;
      default:
        return const SizedBox.shrink();
    }

    if (buttonText.isEmpty) return const SizedBox.shrink();

    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton.icon(
        onPressed: () async {
          try {
            await context.read<OrderProvider>().updateOrderStatus(order.id, nextStatus);
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Order status updated successfully'), backgroundColor: Colors.green));
            }
          } catch (e) {
            print('Error updating order status: $e');
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString(), style: const TextStyle(color: Colors.white)), backgroundColor: Colors.red));
            }
          }
        },
        icon: Icon(buttonIcon, size: 20, color: Colors.white),
        label: Text(buttonText, style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15)),
        style: ElevatedButton.styleFrom(
          backgroundColor: buttonColor,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 2,
        ),
      ),
    );
  }
}
