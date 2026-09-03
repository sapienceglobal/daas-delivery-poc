import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shimmer/shimmer.dart';
import 'package:path_provider/path_provider.dart';
import '../constants/app_colors.dart';
import '../providers/order_provider.dart';
import '../models/order_model.dart';
import 'package:go_router/go_router.dart';
import 'dashboard_widgets.dart';

class AllOrdersScreen extends StatefulWidget {
  const AllOrdersScreen({Key? key}) : super(key: key);

  @override
  State<AllOrdersScreen> createState() => _AllOrdersScreenState();
}

class _AllOrdersScreenState extends State<AllOrdersScreen> {
  String _searchQuery = '';
  String _orderTypeFilter = 'All Types';
  String _statusFilter = 'All Status';
  String _paymentFilter = 'All Payment Status';
  DateTime? _selectedDate;
  String _activeTab = 'All Orders'; // 'All Orders', 'Dine-in', 'Takeaway', 'Delivery'

  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrderProvider>().fetchOrders();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _clearFilters() {
    setState(() {
      _searchQuery = '';
      _searchController.clear();
      _orderTypeFilter = 'All Types';
      _statusFilter = 'All Status';
      _paymentFilter = 'All Payment Status';
      _selectedDate = null;
    });
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      initialDate: _selectedDate ?? DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: ThemeData.light().copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFFDC2626), // App red
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _exportToCSV(List<OrderModel> orders) async {
    if (orders.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No orders to export')));
      return;
    }
    
    // Create CSV content
    final buffer = StringBuffer();
    buffer.writeln('Order ID,Customer,Phone,Order Type,Status,Payment Status,Payment Method,Amount,Items,Date');
    
    for (var order in orders) {
      final dateStr = '${order.createdAt.year}-${order.createdAt.month.toString().padLeft(2, "0")}-${order.createdAt.day.toString().padLeft(2, "0")} ${order.createdAt.hour.toString().padLeft(2, "0")}:${order.createdAt.minute.toString().padLeft(2, "0")}';
      buffer.writeln('${order.orderNumber},"${order.customerName}","${order.customerPhone}",${order.orderType},${order.status},${order.paymentStatus},${order.paymentMethod},${order.total},${order.items.length},$dateStr');
    }

    try {
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/orders_export_${DateTime.now().millisecondsSinceEpoch}.csv');
      await file.writeAsString(buffer.toString());
      
      await Share.shareXFiles([XFile(file.path)], text: 'Exported Orders');
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to export: $e')));
    }
  }

  void _showFilterBottomSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      isScrollControlled: true,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
              ),
              child: Container(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Filter Orders', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
                        IconButton(
                          icon: const Icon(Icons.close, color: Colors.grey),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    
                    Text('ORDER STATUS', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8), letterSpacing: 1)),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: ['All Status', 'New', 'Accepted', 'Preparing', 'Ready', 'Out for Delivery', 'Completed', 'Cancelled']
                          .map((status) => ChoiceChip(
                                label: Text(status),
                                selected: _statusFilter == status,
                                onSelected: (selected) {
                                  if (selected) {
                                    setState(() => _statusFilter = status);
                                    setModalState(() {});
                                  }
                                },
                                selectedColor: const Color(0xFFDC2626),
                                labelStyle: GoogleFonts.inter(
                                  color: _statusFilter == status ? Colors.white : const Color(0xFF475569),
                                  fontWeight: _statusFilter == status ? FontWeight.w600 : FontWeight.w500,
                                  fontSize: 13,
                                ),
                                backgroundColor: const Color(0xFFF8FAFC),
                                side: BorderSide(color: _statusFilter == status ? Colors.transparent : Colors.grey.shade200),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                              ))
                          .toList(),
                    ),
                    const SizedBox(height: 24),
                    
                    Text('ORDER TYPE', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8), letterSpacing: 1)),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: ['All Types', 'Delivery', 'Takeaway', 'Dine-in']
                          .map((type) => ChoiceChip(
                                label: Text(type),
                                selected: _orderTypeFilter == type,
                                onSelected: (selected) {
                                  if (selected) {
                                    setState(() => _orderTypeFilter = type);
                                    setModalState(() {});
                                  }
                                },
                                selectedColor: const Color(0xFFDC2626),
                                labelStyle: GoogleFonts.inter(
                                  color: _orderTypeFilter == type ? Colors.white : const Color(0xFF475569),
                                  fontWeight: _orderTypeFilter == type ? FontWeight.w600 : FontWeight.w500,
                                  fontSize: 13,
                                ),
                                backgroundColor: const Color(0xFFF8FAFC),
                                side: BorderSide(color: _orderTypeFilter == type ? Colors.transparent : Colors.grey.shade200),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                              ))
                          .toList(),
                    ),
                    const SizedBox(height: 24),
                    
                    Text('PAYMENT STATUS', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8), letterSpacing: 1)),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: ['All Payment Status', 'Paid', 'Unpaid', 'Refunded']
                          .map((payment) => ChoiceChip(
                                label: Text(payment),
                                selected: _paymentFilter == payment,
                                onSelected: (selected) {
                                  if (selected) {
                                    setState(() => _paymentFilter = payment);
                                    setModalState(() {});
                                  }
                                },
                                selectedColor: const Color(0xFFDC2626),
                                labelStyle: GoogleFonts.inter(
                                  color: _paymentFilter == payment ? Colors.white : const Color(0xFF475569),
                                  fontWeight: _paymentFilter == payment ? FontWeight.w600 : FontWeight.w500,
                                  fontSize: 13,
                                ),
                                backgroundColor: const Color(0xFFF8FAFC),
                                side: BorderSide(color: _paymentFilter == payment ? Colors.transparent : Colors.grey.shade200),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                              ))
                          .toList(),
                    ),
                    const SizedBox(height: 32),
                    
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => Navigator.pop(context),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFDC2626),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text('Apply Filters', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final orderProvider = context.watch<OrderProvider>();
    final allOrders = orderProvider.orders;

    // Apply Filters
    final filteredOrders = allOrders.where((o) {
      // Search
      final searchStr = _searchQuery.toLowerCase();
      final matchesSearch = searchStr.isEmpty ||
          o.orderNumber.toLowerCase().contains(searchStr) ||
          o.customerName.toLowerCase().contains(searchStr) ||
          o.customerPhone.toLowerCase().contains(searchStr);

      // Status Filter
      final matchesStatus = _statusFilter == 'All Status' ||
          (o.status.toLowerCase() == _statusFilter.toLowerCase());

      // Type Filter
      String mappedType = 'delivery';
      if (o.orderType == 'pickup') mappedType = 'takeaway';
      if (o.orderType == 'dine_in') mappedType = 'dine-in';
      
      final matchesTypeDropdown = _orderTypeFilter == 'All Types' ||
          (_orderTypeFilter.toLowerCase() == mappedType);

      // Tab Filter
      bool matchesTab = true;
      if (_activeTab == 'Dine-in') matchesTab = mappedType == 'dine-in';
      if (_activeTab == 'Takeaway') matchesTab = mappedType == 'takeaway';
      if (_activeTab == 'Delivery') matchesTab = mappedType == 'delivery';

      // Payment Filter
      final pStatus = o.paymentStatus.toLowerCase();
      bool matchesPayment = true;
      if (_paymentFilter == 'Paid') matchesPayment = (pStatus == 'paid' || pStatus == 'completed');
      if (_paymentFilter == 'Unpaid') matchesPayment = (pStatus == 'pending' || pStatus == 'unpaid');
      if (_paymentFilter == 'Refunded') matchesPayment = pStatus == 'refunded';

      // Date Filter
      bool matchesDate = true;
      if (_selectedDate != null) {
        final orderDate = DateTime(o.createdAt.year, o.createdAt.month, o.createdAt.day);
        final filterDate = DateTime(_selectedDate!.year, _selectedDate!.month, _selectedDate!.day);
        matchesDate = orderDate.isAtSameMomentAs(filterDate);
      }

      return matchesSearch && matchesStatus && matchesTypeDropdown && matchesTab && matchesPayment && matchesDate;
    }).toList();

    // Stats calculations from raw `allOrders` (not filtered)
    int countTotal = allOrders.length;
    int countNew = allOrders.where((o) => ['new', 'pending'].contains(o.status)).length;
    int countPreparing = allOrders.where((o) => o.status == 'preparing').length;
    int countReady = allOrders.where((o) => o.status == 'ready').length;
    int countOut = allOrders.where((o) => o.status == 'picked_up' && o.orderType == 'delivery').length;
    int countCompleted = allOrders.where((o) => ['completed', 'delivered'].contains(o.status)).length;

    // Tab counts from raw `allOrders`
    int tabDineIn = allOrders.where((o) => o.orderType == 'dine_in').length;
    int tabTakeaway = allOrders.where((o) => o.orderType == 'pickup').length;
    int tabDelivery = allOrders.where((o) => o.orderType == 'delivery').length;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC), // Ultra soft slate
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20, color: Color(0xFF0F172A)),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/');
            }
          },
        ),
        title: Text('All Orders', style: GoogleFonts.inter(color: const Color(0xFF0F172A), fontWeight: FontWeight.bold, letterSpacing: -0.5)),
        iconTheme: const IconThemeData(color: Color(0xFF0F172A)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: Colors.grey.shade200, height: 1),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/pos'),
        backgroundColor: const Color(0xFFDC2626),
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: RefreshIndicator(
        onRefresh: () => orderProvider.fetchOrders(force: true),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Header
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Orders',
                                    style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Manage and track all restaurant orders in one place.',
                                    style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),

                        // Stats Horizontal Scroll
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          physics: const BouncingScrollPhysics(),
                          child: Row(
                            children: [
                              _buildStatCard('Total Orders', countTotal.toString(), Icons.shopping_cart_outlined, const Color(0xFFEA580C)),
                              const SizedBox(width: 12),
                              _buildStatCard('New Orders', countNew.toString(), Icons.inbox_outlined, const Color(0xFF991B1B)),
                              const SizedBox(width: 12),
                              _buildStatCard('Preparing', countPreparing.toString(), Icons.local_fire_department_outlined, const Color(0xFF9333EA)),
                              const SizedBox(width: 12),
                              _buildStatCard('Ready', countReady.toString(), Icons.check_circle_outline, const Color(0xFF3B82F6)),
                              const SizedBox(width: 12),
                              _buildStatCard('Out for Delivery', countOut.toString(), Icons.directions_bike, const Color(0xFF16A34A)),
                              const SizedBox(width: 12),
                              _buildStatCard('Completed', countCompleted.toString(), Icons.done_all, const Color(0xFFD97706)),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Search and Filter Section
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _searchController,
                                decoration: InputDecoration(
                                  hintText: 'Search Order ID or Customer...',
                                  hintStyle: GoogleFonts.inter(color: Colors.grey.shade400, fontSize: 13),
                                  prefixIcon: const Icon(Icons.search, color: Colors.grey, size: 20),
                                  filled: true,
                                  fillColor: Colors.white,
                                  contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide(color: Colors.grey.shade200),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide(color: Colors.grey.shade200),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: const BorderSide(color: Color(0xFFDC2626)),
                                  ),
                                ),
                                onChanged: (val) {
                                  setState(() {
                                    _searchQuery = val;
                                  });
                                },
                              ),
                            ),
                            const SizedBox(width: 12),
                            InkWell(
                              onTap: _showFilterBottomSheet,
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: Colors.grey.shade200),
                                ),
                                child: Stack(
                                  clipBehavior: Clip.none,
                                  children: [
                                    const Icon(Icons.tune, color: Color(0xFF0F172A), size: 22),
                                    if (_statusFilter != 'All Status' || _orderTypeFilter != 'All Types' || _paymentFilter != 'All Payment Status')
                                      Positioned(
                                        top: -2,
                                        right: -2,
                                        child: Container(
                                          width: 10,
                                          height: 10,
                                          decoration: const BoxDecoration(color: Color(0xFFDC2626), shape: BoxShape.circle),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            InkWell(
                              onTap: () => _exportToCSV(filteredOrders),
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: Colors.grey.shade200),
                                ),
                                child: const Icon(Icons.download_rounded, color: Color(0xFFDC2626), size: 22),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                      ],
                    ),
                  ),
                ),
                
                // Orders List
                if (orderProvider.isLoading)
                  SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => _buildShimmerOrderRow(),
                      childCount: 5,
                    ),
                  )
                else
                  SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final order = filteredOrders[index];
                        return _buildOrderRow(order);
                      },
                      childCount: filteredOrders.length,
                    ),
                  ),
                const SliverToBoxAdapter(child: SizedBox(height: 40)), // Bottom padding
              ],
            ),
      ),
    );
  }

  Widget _buildShimmerOrderRow() {
    return Container(
      margin: const EdgeInsets.only(bottom: 12, left: 16, right: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Shimmer.fromColors(
        baseColor: Colors.grey.shade200,
        highlightColor: Colors.grey.shade100,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(width: 120, height: 16, color: Colors.white),
                Container(width: 60, height: 16, color: Colors.white),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Container(width: 32, height: 32, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle)),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(width: 100, height: 14, color: Colors.white),
                    const SizedBox(height: 4),
                    Container(width: 80, height: 12, color: Colors.white),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderRow(OrderModel order) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12, left: 16, right: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          context.push('/order-details/${order.id}');
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Row: Order ID and Amount
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Text('#${order.orderNumber}', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14, color: const Color(0xFF0F172A))),
                      const SizedBox(width: 8),
                      Text(
                        '${order.createdAt.hour.toString().padLeft(2, "0")}:${order.createdAt.minute.toString().padLeft(2, "0")} ${order.createdAt.hour >= 12 ? "PM" : "AM"}',
                        style: GoogleFonts.inter(color: Colors.grey.shade500, fontSize: 11, fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                  Text('\$${order.total.toStringAsFixed(2)}', style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 15, color: const Color(0xFF0F172A))),
                ],
              ),
              const SizedBox(height: 16),
              
              // Middle Row: Customer and Status
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: const BoxDecoration(color: Color(0xFFF1F5F9), shape: BoxShape.circle),
                          child: Icon(
                            order.orderType == 'pickup' ? Icons.shopping_bag_outlined : 
                            order.orderType == 'dine_in' ? Icons.restaurant_outlined : Icons.directions_bike_outlined,
                            size: 16, color: const Color(0xFF475569),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(order.customerName, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13, color: const Color(0xFF0F172A)), maxLines: 1, overflow: TextOverflow.ellipsis),
                              const SizedBox(height: 2),
                              Text(order.customerPhone, style: GoogleFonts.inter(color: Colors.grey.shade500, fontSize: 12)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      _buildModernStatusBadge(order.status),
                      const SizedBox(height: 6),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            (order.paymentStatus == 'paid' || order.paymentStatus == 'completed') ? Icons.check_circle : 
                            order.paymentStatus == 'refunded' ? Icons.cancel : Icons.pending, 
                            size: 12, 
                            color: (order.paymentStatus == 'paid' || order.paymentStatus == 'completed') ? const Color(0xFF10B981) : 
                                   order.paymentStatus == 'refunded' ? const Color(0xFFEF4444) : const Color(0xFFF59E0B)
                          ),
                          const SizedBox(width: 4),
                          Text(order.paymentStatus.toUpperCase(), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey.shade500)),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildModernStatusBadge(String status) {
    Color bgColor;
    Color textColor;
    String label;
    
    switch (status.toLowerCase()) {
      case 'new':
      case 'pending':
        bgColor = const Color(0xFFFEF2F2);
        textColor = const Color(0xFFDC2626);
        label = 'New';
        break;
      case 'accepted':
      case 'preparing':
        bgColor = const Color(0xFFFFF7ED); // Orange 50
        textColor = const Color(0xFFEA580C); // Orange 600
        label = status.toLowerCase() == 'accepted' ? 'Accepted' : 'Preparing';
        break;
      case 'ready':
      case 'picked_up':
        bgColor = const Color(0xFFEFF6FF); // Blue 50
        textColor = const Color(0xFF2563EB); // Blue 600
        label = status.toLowerCase() == 'ready' ? 'Ready' : 'Picked Up';
        break;
      case 'completed':
      case 'delivered':
        bgColor = const Color(0xFFF0FDF4); // Green 50
        textColor = const Color(0xFF16A34A); // Green 600
        label = 'Completed';
        break;
      case 'cancelled':
      case 'refunded':
        bgColor = const Color(0xFFFEF2F2); // Red 50
        textColor = const Color(0xFFDC2626); // App theme red
        label = 'Cancelled';
        break;
      default:
        bgColor = const Color(0xFFF1F5F9);
        textColor = const Color(0xFF475569);
        label = status;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: textColor.withOpacity(0.2)),
      ),
      child: Text(
        label.toUpperCase(),
        style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.bold, color: textColor, letterSpacing: 0.5),
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      width: 150,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade100, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.08),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Positioned(
            right: -20,
            bottom: -20,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: color.withOpacity(0.04),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(icon, color: color, size: 22),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  title.toUpperCase(),
                  style: GoogleFonts.inter(
                    color: Colors.grey.shade500, 
                    fontSize: 10, 
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: GoogleFonts.outfit(color: AppColors.textPrimary, fontSize: 24, fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

