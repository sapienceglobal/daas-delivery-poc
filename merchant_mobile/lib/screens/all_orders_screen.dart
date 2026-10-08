import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shimmer/shimmer.dart';
import 'package:path_provider/path_provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';

import '../providers/order_provider.dart';
import '../providers/menu_provider.dart';
import '../models/order_model.dart';
import '../providers/auth_provider.dart';
import '../utils/time_utils.dart';

class AllOrdersScreen extends StatefulWidget {
  const AllOrdersScreen({super.key});

  @override
  State<AllOrdersScreen> createState() => _AllOrdersScreenState();
}

class _AllOrdersScreenState extends State<AllOrdersScreen> {
  String _searchQuery = '';
  String _statusFilter = 'All Orders'; // 'All Orders', 'New', 'Preparing', 'Ready', 'Picked Up', 'Completed', 'Cancelled'
  String _orderTypeFilter = 'All Types';
  String _paymentFilter = 'All Payment Status';
  String _selectedDateLabel = 'All Time'; // By default All Time
  DateTime? _selectedDate;

  final Set<String> _selectedOrderIds = {};
  final TextEditingController _searchController = TextEditingController();

  // Diverse sample orders spread across Today, Yesterday, and This Week for realistic offline testing
  late final List<OrderModel> _sampleOrders = [
    // Today
    OrderModel(
      id: 'sample-1',
      orderNumber: 'ORD-MUSZ2LCO-D8C8B8',
      status: 'picked_up',
      customerName: 'Nafeeza Khan',
      customerPhone: '+13473308988',
      orderType: 'delivery',
      total: 18.48,
      createdAt: DateTime.now().subtract(const Duration(minutes: 45)),
      paymentStatus: 'paid',
      paymentMethod: 'card',
      items: [
        OrderItem(name: 'Chicken Biryani', quantity: 1, lineTotal: 14.99),
        OrderItem(name: 'Naan', quantity: 1, lineTotal: 3.49),
      ],
    ),
    OrderModel(
      id: 'sample-2',
      orderNumber: 'ORD-MURLJMVE-32F218',
      status: 'completed',
      customerName: 'Gail Hamlin',
      customerPhone: '+19177482425',
      orderType: 'dine_in',
      total: 59.72,
      createdAt: DateTime.now().subtract(const Duration(hours: 1, minutes: 15)),
      paymentStatus: 'paid',
      paymentMethod: 'card',
      items: [
        OrderItem(name: 'Butter Chicken', quantity: 2, lineTotal: 39.98),
        OrderItem(name: 'Roti', quantity: 4, lineTotal: 19.74),
      ],
    ),
    OrderModel(
      id: 'sample-3',
      orderNumber: 'ORD-TODAY-03',
      status: 'new',
      customerName: 'Aarav Patel',
      customerPhone: '+16478901234',
      orderType: 'delivery',
      total: 29.50,
      createdAt: DateTime.now().subtract(const Duration(hours: 2, minutes: 30)),
      paymentStatus: 'pending',
      paymentMethod: 'cod',
      items: [
        OrderItem(name: 'Paneer Tikka', quantity: 1, lineTotal: 16.00),
        OrderItem(name: 'Mango Lassi', quantity: 2, lineTotal: 13.50),
      ],
    ),

    // Yesterday
    OrderModel(
      id: 'sample-4',
      orderNumber: 'ORD-MU0ALQSL-3DAFD4',
      status: 'preparing',
      customerName: 'Rahul Verma',
      customerPhone: '+13472899122',
      orderType: 'pickup',
      total: 58.18,
      createdAt: DateTime.now().subtract(const Duration(days: 1, hours: 2)),
      paymentStatus: 'paid',
      paymentMethod: 'online',
      items: [
        OrderItem(name: 'Amritsari Kulcha', quantity: 1, lineTotal: 58.18),
      ],
    ),
    OrderModel(
      id: 'sample-5',
      orderNumber: 'ORD-YEST-05',
      status: 'completed',
      customerName: 'Sara Connor',
      customerPhone: '+19055554321',
      orderType: 'delivery',
      total: 42.10,
      createdAt: DateTime.now().subtract(const Duration(days: 1, hours: 4)),
      paymentStatus: 'paid',
      paymentMethod: 'card',
      items: [
        OrderItem(name: 'Chicken Tikka', quantity: 2, lineTotal: 32.00),
        OrderItem(name: 'Sweet Lassi', quantity: 2, lineTotal: 10.10),
      ],
    ),
    OrderModel(
      id: 'sample-6',
      orderNumber: 'ORD-YEST-06',
      status: 'picked_up',
      customerName: 'David Lee',
      customerPhone: '+14169998877',
      orderType: 'delivery',
      total: 21.00,
      createdAt: DateTime.now().subtract(const Duration(days: 1, hours: 6)),
      paymentStatus: 'paid',
      paymentMethod: 'online',
      items: [
        OrderItem(name: 'Dal Makhani', quantity: 1, lineTotal: 14.50),
        OrderItem(name: 'Garlic Naan', quantity: 1, lineTotal: 6.50),
      ],
    ),

    // This Week (2-5 days ago)
    OrderModel(
      id: 'sample-7',
      orderNumber: 'ORD-ZX1K8L9P-4GH3D2',
      status: 'new',
      customerName: 'Priya Sharma',
      customerPhone: '+16475632109',
      orderType: 'delivery',
      total: 24.95,
      createdAt: DateTime.now().subtract(const Duration(days: 2, hours: 5)),
      paymentStatus: 'pending',
      paymentMethod: 'cod',
      items: [
        OrderItem(name: 'Mango Lassi', quantity: 1, lineTotal: 8.95),
        OrderItem(name: 'Paneer Tikka', quantity: 1, lineTotal: 16.00),
      ],
    ),
    OrderModel(
      id: 'sample-8',
      orderNumber: 'ORD-WEEK-08',
      status: 'ready',
      customerName: 'Michael Scott',
      customerPhone: '+14165551212',
      orderType: 'pickup',
      total: 35.80,
      createdAt: DateTime.now().subtract(const Duration(days: 3, hours: 1)),
      paymentStatus: 'paid',
      paymentMethod: 'card',
      items: [
        OrderItem(name: 'Chicken Biryani', quantity: 2, lineTotal: 29.98),
        OrderItem(name: 'Raita', quantity: 1, lineTotal: 5.82),
      ],
    ),
    OrderModel(
      id: 'sample-9',
      orderNumber: 'ORD-WEEK-09',
      status: 'completed',
      customerName: 'Emily Watson',
      customerPhone: '+16473332211',
      orderType: 'dine_in',
      total: 75.40,
      createdAt: DateTime.now().subtract(const Duration(days: 4, hours: 3)),
      paymentStatus: 'paid',
      paymentMethod: 'card',
      items: [
        OrderItem(name: 'Butter Chicken', quantity: 2, lineTotal: 39.98),
        OrderItem(name: 'Dal Makhani', quantity: 1, lineTotal: 15.00),
        OrderItem(name: 'Garlic Naan', quantity: 3, lineTotal: 20.42),
      ],
    ),
    OrderModel(
      id: 'sample-10',
      orderNumber: 'ORD-WEEK-10',
      status: 'cancelled',
      customerName: 'John Doe',
      customerPhone: '+14160001122',
      orderType: 'delivery',
      total: 19.99,
      createdAt: DateTime.now().subtract(const Duration(days: 5, hours: 2)),
      paymentStatus: 'refunded',
      paymentMethod: 'card',
      items: [
        OrderItem(name: 'Veg Spring Rolls', quantity: 2, lineTotal: 19.99),
      ],
    ),
  ];

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

  // --- Date Filter Matching Helper ---
  bool _matchesDateFilter(DateTime orderCreatedAt, String? tz) {
    if (_selectedDateLabel == 'All Time') return true;

    final tzDateTime = TimeUtils.getTzDateTime(orderCreatedAt, tz);
    final now = TimeUtils.getTzDateTime(DateTime.now(), tz);

    if (_selectedDateLabel == 'Today') {
      return tzDateTime.year == now.year &&
          tzDateTime.month == now.month &&
          tzDateTime.day == now.day;
    } else if (_selectedDateLabel == 'Yesterday') {
      final yesterday = now.subtract(const Duration(days: 1));
      return tzDateTime.year == yesterday.year &&
          tzDateTime.month == yesterday.month &&
          tzDateTime.day == yesterday.day;
    } else if (_selectedDateLabel == 'This Week') {
      final weekAgo = DateTime(now.year, now.month, now.day).subtract(const Duration(days: 7));
      final orderDay = DateTime(tzDateTime.year, tzDateTime.month, tzDateTime.day);
      return orderDay.isAfter(weekAgo) || orderDay.isAtSameMomentAs(weekAgo);
    } else if (_selectedDate != null) {
      return tzDateTime.year == _selectedDate!.year &&
          tzDateTime.month == _selectedDate!.month &&
          tzDateTime.day == _selectedDate!.day;
    }
    return true;
  }

  // --- Date Selection Bottom Sheet ---
  Future<void> _showDateSelectionMenu() async {
    final choice = await showModalBottomSheet<String>(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Select Date Filter', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16, color: const Color(0xFF0F172A))),
              const SizedBox(height: 12),
              ListTile(
                leading: const Icon(Icons.all_inclusive_rounded, color: Color(0xFF991B1B)),
                title: const Text('All Time'),
                trailing: _selectedDateLabel == 'All Time' ? const Icon(Icons.check, color: Color(0xFF991B1B)) : null,
                onTap: () => Navigator.pop(ctx, 'All Time'),
              ),
              ListTile(
                leading: const Icon(Icons.today_rounded, color: Color(0xFF991B1B)),
                title: const Text('Today'),
                trailing: _selectedDateLabel == 'Today' ? const Icon(Icons.check, color: Color(0xFF991B1B)) : null,
                onTap: () => Navigator.pop(ctx, 'Today'),
              ),
              ListTile(
                leading: const Icon(Icons.history_rounded, color: Color(0xFF991B1B)),
                title: const Text('Yesterday'),
                trailing: _selectedDateLabel == 'Yesterday' ? const Icon(Icons.check, color: Color(0xFF991B1B)) : null,
                onTap: () => Navigator.pop(ctx, 'Yesterday'),
              ),
              ListTile(
                leading: const Icon(Icons.date_range_rounded, color: Color(0xFF991B1B)),
                title: const Text('This Week'),
                trailing: _selectedDateLabel == 'This Week' ? const Icon(Icons.check, color: Color(0xFF991B1B)) : null,
                onTap: () => Navigator.pop(ctx, 'This Week'),
              ),
              ListTile(
                leading: const Icon(Icons.calendar_month_rounded, color: Color(0xFF991B1B)),
                title: const Text('Pick Custom Date...'),
                trailing: (_selectedDateLabel != 'All Time' &&
                        _selectedDateLabel != 'Today' &&
                        _selectedDateLabel != 'Yesterday' &&
                        _selectedDateLabel != 'This Week')
                    ? const Icon(Icons.check, color: Color(0xFF991B1B))
                    : null,
                onTap: () => Navigator.pop(ctx, 'Custom'),
              ),
            ],
          ),
        ),
      ),
    );

    if (choice == null) return;

    if (choice == 'Custom') {
      final picked = await showDatePicker(
        context: context,
        firstDate: DateTime(2022),
        lastDate: DateTime.now().add(const Duration(days: 30)),
        initialDate: _selectedDate ?? DateTime.now(),
        builder: (context, child) {
          return Theme(
            data: ThemeData.light().copyWith(
              colorScheme: const ColorScheme.light(primary: Color(0xFF991B1B)),
            ),
            child: child!,
          );
        },
      );
      if (picked != null) {
        setState(() {
          _selectedDate = picked;
          _selectedDateLabel = '${picked.day.toString().padLeft(2, '0')}/${picked.month.toString().padLeft(2, '0')}/${picked.year}';
        });
      }
    } else {
      setState(() {
        _selectedDateLabel = choice;
        _selectedDate = null;
      });
    }
  }

  // --- CSV Export ---
  Future<void> _exportToCSV(List<OrderModel> orders) async {
    final targetOrders = _selectedOrderIds.isNotEmpty
        ? orders.where((o) => _selectedOrderIds.contains(o.id)).toList()
        : orders;

    if (targetOrders.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No orders to export')));
      return;
    }

    final buffer = StringBuffer();
    buffer.writeln('Order ID,Customer,Phone,Order Type,Status,Payment Status,Payment Method,Amount,Items,Date');

    for (var order in targetOrders) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final tz = TimeUtils.getRestaurantTimezone(authProvider.user);
      final tzDateTime = TimeUtils.getTzDateTime(order.createdAt, tz);
      final dateStr =
          '${tzDateTime.year}-${tzDateTime.month.toString().padLeft(2, "0")}-${tzDateTime.day.toString().padLeft(2, "0")} ${tzDateTime.hour.toString().padLeft(2, "0")}:${tzDateTime.minute.toString().padLeft(2, "0")}';
      buffer.writeln(
        '${order.orderNumber},"${order.customerName}","${order.customerPhone}",${order.orderType},${order.status},${order.paymentStatus},${order.paymentMethod},${order.total},${order.items.length},$dateStr',
      );
    }

    try {
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/orders_export_${DateTime.now().millisecondsSinceEpoch}.csv');
      await file.writeAsString(buffer.toString());
      await Share.shareXFiles([XFile(file.path)], text: 'Exported Orders');
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to export: $e')));
    }
  }

  // --- Filter Bottom Sheet ---
  void _showFilterBottomSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      isScrollControlled: true,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setModalState) {
            return Padding(
              padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
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
                        Row(
                          children: [
                            TextButton(
                              onPressed: () {
                                setState(() {
                                  _statusFilter = 'All Orders';
                                  _orderTypeFilter = 'All Types';
                                  _paymentFilter = 'All Payment Status';
                                });
                                setModalState(() {});
                              },
                              child: Text('Reset', style: GoogleFonts.inter(color: const Color(0xFF991B1B), fontWeight: FontWeight.w700, fontSize: 13)),
                            ),
                            IconButton(icon: const Icon(Icons.close, color: Colors.grey), onPressed: () => Navigator.pop(context)),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text('ORDER STATUS', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8), letterSpacing: 1)),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: ['All Orders', 'New', 'Preparing', 'Ready', 'Picked Up', 'Completed', 'Cancelled'].map((status) {
                        final isSelected = _statusFilter == status;
                        return ChoiceChip(
                          label: Text(status),
                          selected: isSelected,
                          onSelected: (selected) {
                            if (selected) {
                              setState(() => _statusFilter = status);
                              setModalState(() {});
                            }
                          },
                          selectedColor: const Color(0xFF991B1B),
                          labelStyle: GoogleFonts.inter(
                            color: isSelected ? Colors.white : const Color(0xFF475569),
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                            fontSize: 13,
                          ),
                          backgroundColor: const Color(0xFFF8FAFC),
                          side: BorderSide(color: isSelected ? Colors.transparent : Colors.grey.shade200),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 24),
                    Text('ORDER TYPE', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8), letterSpacing: 1)),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: ['All Types', 'Delivery', 'Takeaway', 'Dine-in'].map((type) {
                        final isSelected = _orderTypeFilter == type;
                        return ChoiceChip(
                          label: Text(type),
                          selected: isSelected,
                          onSelected: (selected) {
                            if (selected) {
                              setState(() => _orderTypeFilter = type);
                              setModalState(() {});
                            }
                          },
                          selectedColor: const Color(0xFF991B1B),
                          labelStyle: GoogleFonts.inter(
                            color: isSelected ? Colors.white : const Color(0xFF475569),
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                            fontSize: 13,
                          ),
                          backgroundColor: const Color(0xFFF8FAFC),
                          side: BorderSide(color: isSelected ? Colors.transparent : Colors.grey.shade200),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 24),
                    Text('PAYMENT STATUS', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8), letterSpacing: 1)),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: ['All Payment Status', 'Paid', 'Pending / COD', 'Refunded'].map((payment) {
                        final isSelected = _paymentFilter == payment;
                        return ChoiceChip(
                          label: Text(payment),
                          selected: isSelected,
                          onSelected: (selected) {
                            if (selected) {
                              setState(() => _paymentFilter = payment);
                              setModalState(() {});
                            }
                          },
                          selectedColor: const Color(0xFF991B1B),
                          labelStyle: GoogleFonts.inter(
                            color: isSelected ? Colors.white : const Color(0xFF475569),
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                            fontSize: 13,
                          ),
                          backgroundColor: const Color(0xFFF8FAFC),
                          side: BorderSide(color: isSelected ? Colors.transparent : Colors.grey.shade200),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => Navigator.pop(context),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF991B1B),
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

  // --- Industry-Grade Hero Item & Image Resolution ---
  OrderItem? _resolveHeroItem(OrderModel order) {
    if (order.items.isEmpty) return null;
    if (order.items.length == 1) return order.items.first;

    OrderItem bestItem = order.items.first;
    double highestScore = -1.0;

    for (final item in order.items) {
      final lower = item.name.toLowerCase();
      double weight = 1.0;

      // Heavy priority to main entrees and chef specialties
      if (lower.contains('biryani') ||
          lower.contains('chicken') ||
          lower.contains('curry') ||
          lower.contains('lamb') ||
          lower.contains('mutton') ||
          lower.contains('paneer') ||
          lower.contains('tikka') ||
          lower.contains('kebab') ||
          lower.contains('kabab') ||
          lower.contains('platter') ||
          lower.contains('thali') ||
          lower.contains('pizza') ||
          lower.contains('burger')) {
        weight = 2.0;
      } else if (lower.contains('spring roll') ||
          lower.contains('samosa') ||
          lower.contains('wings') ||
          lower.contains('appetizer') ||
          lower.contains('chaat') ||
          lower.contains('pakora')) {
        weight = 1.3;
      } else if (lower.contains('naan') ||
          lower.contains('roti') ||
          lower.contains('kulcha') ||
          lower.contains('paratha') ||
          lower.contains('rice') ||
          lower.contains('bread') ||
          lower.contains('salad') ||
          lower.contains('raita') ||
          lower.contains('chutney')) {
        weight = 0.6; // Sides
      } else if (lower.contains('water') ||
          lower.contains('coke') ||
          lower.contains('soda') ||
          lower.contains('can') ||
          lower.contains('beverage') ||
          lower.contains('bottle') ||
          lower.contains('drink') ||
          lower.contains('chai') ||
          lower.contains('coffee')) {
        weight = 0.5; // Drinks
      }

      final score = item.lineTotal * weight;
      if (score > highestScore) {
        highestScore = score;
        bestItem = item;
      }
    }

    return bestItem;
  }

  String _resolveAssetFallback(String name, String orderNumber) {
    final lower = name.toLowerCase();
    if (lower.contains('biryani') || lower.contains('pulao') || lower.contains('rice')) {
      return 'assets/images/branded/lassi-lounge/dishes/chicken-biryani.jpg';
    } else if (lower.contains('butter') || lower.contains('chicken') || lower.contains('curry') || lower.contains('korma') || lower.contains('masala')) {
      return 'assets/images/branded/lassi-lounge/dishes/butter-chicken.jpg';
    } else if (lower.contains('lamb') || lower.contains('rogan') || lower.contains('mutton') || lower.contains('goat') || lower.contains('meat')) {
      return 'assets/images/branded/lassi-lounge/dishes/lamb-rogan-josh.jpg';
    } else if (lower.contains('paneer') || lower.contains('tikka') || lower.contains('tandoor') || lower.contains('samosa') || lower.contains('kulcha') || lower.contains('naan') || lower.contains('roti')) {
      return 'assets/images/branded/lassi-lounge/dishes/paneer-tikka.jpg';
    } else if (lower.contains('dal') || lower.contains('makhani') || lower.contains('tadka') || lower.contains('lentil') || lower.contains('chana')) {
      return 'assets/images/branded/lassi-lounge/dishes/dal-makhani.jpg';
    } else if (lower.contains('lassi') || lower.contains('mango') || lower.contains('shake') || lower.contains('drink') || lower.contains('smoothie')) {
      return 'assets/images/branded/lassi-lounge/dishes/mango-lassi.jpg';
    } else if (lower.contains('spring') || lower.contains('roll') || lower.contains('appetiz') || lower.contains('crispy')) {
      return 'assets/images/branded/lassi-lounge/dishes/veg-spring-rolls.png';
    } else {
      final list = [
        'assets/images/branded/lassi-lounge/dishes/chicken-biryani.jpg',
        'assets/images/branded/lassi-lounge/dishes/butter-chicken.jpg',
        'assets/images/branded/lassi-lounge/dishes/paneer-tikka.jpg',
        'assets/images/branded/lassi-lounge/dishes/lamb-rogan-josh.jpg',
        'assets/images/branded/lassi-lounge/dishes/dal-makhani.jpg',
        'assets/images/hero_dish.jpg',
      ];
      return list[orderNumber.hashCode.abs() % list.length];
    }
  }

  Widget _buildOrderDishImage(OrderModel order) {
    final hero = _resolveHeroItem(order);
    final totalItemsCount = order.items.fold<int>(0, (sum, i) => sum + i.quantity);

    // Try resolving network URL first (either direct from item or matched from MenuProvider)
    String? networkUrl;
    if (hero != null && hero.image != null && hero.image!.startsWith('http') && !hero.image!.contains('localhost')) {
      networkUrl = hero.image;
    } else if (hero != null) {
      try {
        final menuCategories = context.read<MenuProvider>().categories;
        for (final cat in menuCategories) {
          final matched = cat.items.where((mi) => mi.name.toLowerCase().trim() == hero.name.toLowerCase().trim()).toList();
          if (matched.isNotEmpty && matched.first.imageUrl != null && matched.first.imageUrl!.startsWith('http') && !matched.first.imageUrl!.contains('localhost')) {
            networkUrl = matched.first.imageUrl;
            break;
          }
        }
      } catch (_) {}
    }

    final fallbackAsset = _resolveAssetFallback(hero?.name ?? '', order.orderNumber);

    return Container(
      width: 68,
      height: 68,
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(13),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Base Dish Image
            if (networkUrl != null)
              CachedNetworkImage(
                imageUrl: networkUrl,
                width: 68,
                height: 68,
                fit: BoxFit.cover,
                placeholder: (_, __) => Image.asset(
                  fallbackAsset,
                  fit: BoxFit.cover,
                ),
                errorWidget: (_, __, ___) => Image.asset(
                  fallbackAsset,
                  fit: BoxFit.cover,
                ),
              )
            else
              Image.asset(
                fallbackAsset,
                width: 68,
                height: 68,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const Center(
                  child: Icon(Icons.restaurant_rounded, color: Color(0xFF94A3B8), size: 28),
                ),
              ),

            // Bottom Gradient for badge readability
            if (totalItemsCount > 1 || (hero != null && hero.quantity > 1))
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                height: 28,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Colors.black.withValues(alpha: 0.7),
                      ],
                    ),
                  ),
                ),
              ),

            // Multi-Item Quantity Pill Badge (Industry-Standard)
            if (totalItemsCount > 1)
              Positioned(
                bottom: 3,
                left: 3,
                right: 3,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1.5),
                  decoration: BoxDecoration(
                    color: const Color(0xE60F172A),
                    borderRadius: BorderRadius.circular(5),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.25), width: 0.6),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.layers_rounded, size: 8.5, color: Colors.white),
                      const SizedBox(width: 2.5),
                      Text(
                        '$totalItemsCount Items',
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontSize: 8.5,
                          fontWeight: FontWeight.w700,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              )
            else if (hero != null && hero.quantity > 1)
              Positioned(
                bottom: 3,
                right: 4,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                  decoration: BoxDecoration(
                    color: const Color(0xE60F172A),
                    borderRadius: BorderRadius.circular(5),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.25), width: 0.6),
                  ),
                  child: Text(
                    '${hero.quantity}x',
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontSize: 8.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _getItemsSummary(OrderModel order) {
    if (order.items.isEmpty) return '1 Item • Chef Special';
    final totalCount = order.items.fold<int>(0, (sum, i) => sum + i.quantity);
    final countLabel = totalCount == 1 ? '1 Item' : '$totalCount Items';

    final hero = _resolveHeroItem(order);
    if (hero == null) {
      final names = order.items.map((i) => i.name).take(2).join(', ');
      return '$countLabel • $names';
    }

    if (order.items.length == 1) {
      return '$countLabel • ${hero.name}';
    }

    final otherCount = totalCount - hero.quantity;
    if (otherCount > 0) {
      return '$countLabel • ${hero.name} +$otherCount more';
    } else {
      return '$countLabel • ${hero.name}';
    }
  }

  String _formatOrderTime(OrderModel order) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final tz = TimeUtils.getRestaurantTimezone(authProvider.user);
    final dt = TimeUtils.getTzDateTime(order.createdAt, tz);
    final day = dt.day.toString().padLeft(2, '0');
    final month = dt.month.toString().padLeft(2, '0');
    final year = dt.year.toString();
    final hour = dt.hour > 12 ? dt.hour - 12 : (dt.hour == 0 ? 12 : dt.hour);
    final hourStr = hour.toString().padLeft(2, '0');
    final minStr = dt.minute.toString().padLeft(2, '0');
    final ampm = dt.hour >= 12 ? 'PM' : 'AM';
    return '$day/$month/$year  $hourStr:$minStr $ampm';
  }

  @override
  Widget build(BuildContext context) {
    final orderProvider = context.watch<OrderProvider>();
    final rawOrders = orderProvider.orders.isNotEmpty ? orderProvider.orders : _sampleOrders;
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final tz = TimeUtils.getRestaurantTimezone(authProvider.user);

    // 1. Scoped Orders: Filtered by Date, Order Type, Payment Status, and Search Query
    final scopedOrders = rawOrders.where((o) {
      final searchStr = _searchQuery.toLowerCase();
      final matchesSearch = searchStr.isEmpty ||
          o.orderNumber.toLowerCase().contains(searchStr) ||
          o.customerName.toLowerCase().contains(searchStr) ||
          o.customerPhone.toLowerCase().contains(searchStr);

      // Type Filter
      String mappedType = 'delivery';
      if (o.orderType == 'pickup') mappedType = 'takeaway';
      if (o.orderType == 'dine_in') mappedType = 'dine-in';
      final matchesTypeDropdown = _orderTypeFilter == 'All Types' || (_orderTypeFilter.toLowerCase() == mappedType);

      // Payment Filter
      final pStatus = o.paymentStatus.toLowerCase();
      bool matchesPayment = true;
      if (_paymentFilter == 'Paid') {
        matchesPayment = (pStatus == 'paid' || pStatus == 'completed');
      } else if (_paymentFilter == 'Pending / COD') {
        matchesPayment = (pStatus == 'pending' || pStatus == 'unpaid' || pStatus == 'cod');
      } else if (_paymentFilter == 'Refunded') {
        matchesPayment = pStatus == 'refunded';
      }

      // Date Filter
      final matchesDate = _matchesDateFilter(o.createdAt, tz);

      return matchesSearch && matchesTypeDropdown && matchesPayment && matchesDate;
    }).toList();

    // 2. Dynamic Stat Counts from scopedOrders (updates with ANY filter applied!)
    final displayTotal = scopedOrders.length;
    final displayNew = scopedOrders.where((o) => ['new', 'pending'].contains(o.status.toLowerCase())).length;
    final displayCompleted = scopedOrders.where((o) => ['completed', 'delivered'].contains(o.status.toLowerCase())).length;
    final displayPickedUp = scopedOrders.where((o) => o.status.toLowerCase() == 'picked_up').length;
    final displayPreparing = scopedOrders.where((o) => o.status.toLowerCase() == 'preparing').length;
    final displayReady = scopedOrders.where((o) => o.status.toLowerCase() == 'ready').length;

    // 3. Filtered Orders for the list view (scopedOrders further filtered by active Status Tab)
    final filteredOrders = scopedOrders.where((o) {
      if (_statusFilter == 'All Orders') return true;
      final s = o.status.toLowerCase();
      switch (_statusFilter) {
        case 'New':
          return ['new', 'pending'].contains(s);
        case 'Preparing':
          return s == 'preparing';
        case 'Ready':
          return s == 'ready';
        case 'Picked Up':
          return s == 'picked_up';
        case 'Completed':
          return ['completed', 'delivered'].contains(s);
        case 'Cancelled':
          return ['cancelled', 'refunded'].contains(s);
        default:
          return true;
      }
    }).toList();

    // Trend subtitle based on selected date
    final trendSub = _selectedDateLabel == 'This Week'
        ? 'vs last week'
        : (_selectedDateLabel == 'Yesterday'
            ? 'vs prev day'
            : (_selectedDateLabel == 'All Time' ? 'overall' : 'vs yesterday'));

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, size: 24, color: Color(0xFF0F172A)),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/');
            }
          },
        ),
        title: Text(
          'All Orders',
          style: GoogleFonts.inter(
            color: const Color(0xFF0F172A),
            fontWeight: FontWeight.bold,
            fontSize: 19,
            letterSpacing: -0.3,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search_rounded, size: 22, color: Color(0xFF0F172A)),
            onPressed: () {
              setState(() {
                _searchQuery = '';
                _searchController.clear();
              });
            },
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert_rounded, size: 22, color: Color(0xFF0F172A)),
            onSelected: (val) {
              if (val == 'select_all') {
                setState(() => _selectedOrderIds.addAll(filteredOrders.map((o) => o.id)));
              } else if (val == 'clear_selection') {
                setState(() => _selectedOrderIds.clear());
              } else if (val == 'refresh') {
                context.read<OrderProvider>().fetchOrders(force: true);
              }
            },
            itemBuilder: (ctx) => [
              const PopupMenuItem(value: 'refresh', child: Text('Refresh Orders')),
              const PopupMenuItem(value: 'select_all', child: Text('Select All')),
              const PopupMenuItem(value: 'clear_selection', child: Text('Clear Selection')),
            ],
          ),
          const SizedBox(width: 4),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: const Color(0xFFF1F5F9), height: 1),
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Colors.grey.shade200)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _exportToCSV(filteredOrders),
                  icon: const Icon(Icons.file_download_outlined, color: Color(0xFF991B1B), size: 18),
                  label: Text(
                    _selectedOrderIds.isNotEmpty ? 'Export (${_selectedOrderIds.length})' : 'Export Orders',
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF991B1B),
                      fontSize: 14,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: const BorderSide(color: Color(0xFF991B1B), width: 1.5),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    backgroundColor: Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => context.push('/pos'),
                  icon: const Icon(Icons.add_rounded, color: Colors.white, size: 20),
                  label: Text(
                    'Add Order',
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                      fontSize: 14,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    backgroundColor: const Color(0xFF991B1B),
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      body: RefreshIndicator(
        color: const Color(0xFF991B1B),
        onRefresh: () => orderProvider.fetchOrders(force: true),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header Row: Title & Date Filter Pill
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Orders',
                                style: GoogleFonts.inter(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFF0F172A),
                                  letterSpacing: -0.5,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Manage and track all restaurant orders in one place.',
                                style: GoogleFonts.inter(
                                  fontSize: 12.5,
                                  color: const Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: _showDateSelectionMenu,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.calendar_today_outlined, size: 14, color: Color(0xFF64748B)),
                                const SizedBox(width: 6),
                                Text(
                                  _selectedDateLabel,
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF334155),
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: Color(0xFF64748B)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),

                    // 2 x 2 Stat Cards Grid (Values update dynamically with every filter!)
                    Row(
                      children: [
                        Expanded(
                          child: _buildModernStatCard(
                            title: 'TOTAL ORDERS',
                            value: displayTotal.toString().padLeft(2, '0'),
                            trend: '↑ 12%',
                            trendSub: trendSub,
                            bgColor: const Color(0xFFFFF7ED),
                            borderColor: const Color(0xFFFFEDD5),
                            iconBg: const Color(0xFFFFEDD5),
                            iconColor: const Color(0xFFEA580C),
                            icon: Icons.shopping_basket_rounded,
                            barColor: const Color(0xFFFDBA74),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildModernStatCard(
                            title: 'NEW ORDERS',
                            value: displayNew.toString().padLeft(2, '0'),
                            trend: '↑ 25%',
                            trendSub: trendSub,
                            bgColor: const Color(0xFFFEF2F2),
                            borderColor: const Color(0xFFFEE2E2),
                            iconBg: const Color(0xFFFEE2E2),
                            iconColor: const Color(0xFFDC2626),
                            icon: Icons.description_outlined,
                            barColor: const Color(0xFFFCA5A5),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildModernStatCard(
                            title: 'COMPLETED',
                            value: displayCompleted.toString().padLeft(2, '0'),
                            trend: '↑ 18%',
                            trendSub: trendSub,
                            bgColor: const Color(0xFFF0FDF4),
                            borderColor: const Color(0xFFDCFCE7),
                            iconBg: const Color(0xFFDCFCE7),
                            iconColor: const Color(0xFF16A34A),
                            icon: Icons.check_circle_rounded,
                            barColor: const Color(0xFF86EFAC),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildModernStatCard(
                            title: 'PICKED UP',
                            value: displayPickedUp.toString().padLeft(2, '0'),
                            trend: '↑ 7%',
                            trendSub: trendSub,
                            bgColor: const Color(0xFFF0F9FF),
                            borderColor: const Color(0xFFE0F2FE),
                            iconBg: const Color(0xFFE0F2FE),
                            iconColor: const Color(0xFF0284C7),
                            icon: Icons.two_wheeler_rounded,
                            barColor: const Color(0xFF93C5FD),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),

                    // Search & Action Buttons Row
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            height: 44,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: TextField(
                              controller: _searchController,
                              style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF0F172A)),
                              decoration: InputDecoration(
                                hintText: 'Search Order ID, customer...',
                                hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 13),
                                prefixIcon: const Icon(Icons.search, color: Color(0xFF94A3B8), size: 18),
                                contentPadding: const EdgeInsets.symmetric(vertical: 10),
                                border: InputBorder.none,
                                isDense: true,
                              ),
                              onChanged: (val) => setState(() => _searchQuery = val),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: _showFilterBottomSheet,
                          child: Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                const Icon(Icons.tune_rounded, color: Color(0xFF0F172A), size: 20),
                                if (_orderTypeFilter != 'All Types' || _paymentFilter != 'All Payment Status')
                                  Positioned(
                                    top: 10,
                                    right: 10,
                                    child: Container(
                                      width: 8,
                                      height: 8,
                                      decoration: const BoxDecoration(
                                        color: Color(0xFF991B1B),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: () => _exportToCSV(filteredOrders),
                          child: Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: const Icon(Icons.file_download_outlined, color: Color(0xFF991B1B), size: 20),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Horizontal Status Tabs Row (Badges update with current filter scope!)
                    SizedBox(
                      height: 38,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        physics: const BouncingScrollPhysics(),
                        children: [
                          _buildFilterTab('All Orders', displayTotal),
                          const SizedBox(width: 8),
                          _buildFilterTab('New', displayNew),
                          const SizedBox(width: 8),
                          _buildFilterTab('Preparing', displayPreparing),
                          const SizedBox(width: 8),
                          _buildFilterTab('Ready', displayReady),
                          const SizedBox(width: 8),
                          _buildFilterTab('Picked Up', displayPickedUp),
                          const SizedBox(width: 8),
                          _buildFilterTab('Completed', displayCompleted),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Orders List
            if (orderProvider.isLoading && orderProvider.orders.isEmpty)
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => _buildShimmerOrderRow(),
                  childCount: 4,
                ),
              )
            else if (filteredOrders.isEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 40),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(Icons.inbox_outlined, size: 48, color: Colors.grey.shade400),
                        const SizedBox(height: 12),
                        Text(
                          'No orders found',
                          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: const Color(0xFF64748B)),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Try changing your filters or search terms',
                          style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final order = filteredOrders[index];
                    return _buildOrderCard(order);
                  },
                  childCount: filteredOrders.length,
                ),
              ),

            const SliverToBoxAdapter(child: SizedBox(height: 30)),
          ],
        ),
      ),
    );
  }

  // --- Stat Card Helper ---
  Widget _buildModernStatCard({
    required String title,
    required String value,
    required String trend,
    required String trendSub,
    required Color bgColor,
    required Color borderColor,
    required Color iconBg,
    required Color iconColor,
    required IconData icon,
    required Color barColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor, width: 1.2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: iconColor, size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.inter(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF64748B),
                        letterSpacing: 0.3,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      value,
                      style: GoogleFonts.inter(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Row(
                children: [
                  Text(
                    trend,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF16A34A),
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    trendSub,
                    style: GoogleFonts.inter(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w400,
                      color: const Color(0xFF94A3B8),
                    ),
                  ),
                ],
              ),
              _buildMiniBarChart(barColor),
            ],
          ),
        ],
      ),
    );
  }

  // --- Mini Bar Chart Graphic ---
  Widget _buildMiniBarChart(Color barColor) {
    final heights = [8.0, 14.0, 19.0, 25.0];
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      mainAxisSize: MainAxisSize.min,
      children: heights
          .map(
            (h) => Container(
              width: 4,
              height: h,
              margin: const EdgeInsets.symmetric(horizontal: 1.5),
              decoration: BoxDecoration(
                color: barColor.withOpacity(0.7),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          )
          .toList(),
    );
  }

  // --- Status Filter Tab Pill ---
  Widget _buildFilterTab(String status, int count) {
    final isSelected = _statusFilter == status;
    return GestureDetector(
      onTap: () => setState(() => _statusFilter = status),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF991B1B) : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isSelected ? const Color(0xFF991B1B) : const Color(0xFFE2E8F0),
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              status,
              style: GoogleFonts.inter(
                fontSize: 12.5,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? Colors.white : const Color(0xFF475569),
              ),
            ),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
              decoration: BoxDecoration(
                color: isSelected ? Colors.white : const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                count.toString(),
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: isSelected ? const Color(0xFF991B1B) : const Color(0xFF64748B),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- Order Card Row Widget ---
  Widget _buildOrderCard(OrderModel order) {
    final isSelected = _selectedOrderIds.contains(order.id);

    return Container(
      margin: const EdgeInsets.only(bottom: 12, left: 16, right: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1F5F9), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          if (_selectedOrderIds.isNotEmpty) {
            setState(() {
              if (isSelected) {
                _selectedOrderIds.remove(order.id);
              } else {
                _selectedOrderIds.add(order.id);
              }
            });
          } else {
            context.push('/order-details/${order.id}');
          }
        },
        onLongPress: () {
          setState(() {
            if (isSelected) {
              _selectedOrderIds.remove(order.id);
            } else {
              _selectedOrderIds.add(order.id);
            }
          });
        },
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Checkbox (Only shown during multi-selection mode to save horizontal space)
              if (_selectedOrderIds.isNotEmpty) ...[
                GestureDetector(
                  onTap: () {
                    setState(() {
                      if (isSelected) {
                        _selectedOrderIds.remove(order.id);
                      } else {
                        _selectedOrderIds.add(order.id);
                      }
                    });
                  },
                  child: Padding(
                    padding: const EdgeInsets.only(top: 2, right: 10),
                    child: Container(
                      width: 20,
                      height: 20,
                      decoration: BoxDecoration(
                        color: isSelected ? const Color(0xFF991B1B) : Colors.transparent,
                        borderRadius: BorderRadius.circular(5),
                        border: Border.all(
                          color: isSelected ? const Color(0xFF991B1B) : const Color(0xFFCBD5E1),
                          width: 1.5,
                        ),
                      ),
                      child: isSelected
                          ? const Icon(Icons.check_rounded, size: 14, color: Colors.white)
                          : null,
                    ),
                  ),
                ),
              ],

              // Dish Image Thumbnail
              _buildOrderDishImage(order),
              const SizedBox(width: 12),

              // Middle Information
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Order Number
                    Text(
                      '#${order.orderNumber}',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF0F172A),
                        letterSpacing: -0.2,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),

                    // Customer Name
                    Row(
                      children: [
                        const Icon(Icons.person_outline_rounded, size: 13, color: Color(0xFF64748B)),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            order.customerName.isNotEmpty ? order.customerName : 'Guest Customer',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF334155),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),

                    // Customer Phone
                    Row(
                      children: [
                        const Icon(Icons.phone_outlined, size: 12, color: Color(0xFF64748B)),
                        const SizedBox(width: 4),
                        Text(
                          order.customerPhone.isNotEmpty ? order.customerPhone : '+1 (555) 000-0000',
                          style: GoogleFonts.inter(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w400,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 3),

                    // Items Summary
                    Text(
                      _getItemsSummary(order),
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: const Color(0xFF64748B),
                        fontWeight: FontWeight.w400,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),

                    // Timestamp
                    Row(
                      children: [
                        const Icon(Icons.access_time_filled_rounded, size: 12, color: Color(0xFFDC2626)),
                        const SizedBox(width: 4),
                        Text(
                          _formatOrderTime(order),
                          style: GoogleFonts.inter(
                            fontSize: 10.5,
                            color: const Color(0xFF64748B),
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Right Section: Price, Status, Payment
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '\$${order.total.toStringAsFixed(2)}',
                        style: GoogleFonts.inter(
                          fontSize: 15.5,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      PopupMenuButton<String>(
                        padding: EdgeInsets.zero,
                        icon: const Icon(Icons.more_vert_rounded, size: 18, color: Color(0xFF94A3B8)),
                        onSelected: (val) {
                          if (val == 'details') {
                            context.push('/order-details/${order.id}');
                          } else if (val == 'select') {
                            setState(() {
                              if (isSelected) {
                                _selectedOrderIds.remove(order.id);
                              } else {
                                _selectedOrderIds.add(order.id);
                              }
                            });
                          }
                        },
                        itemBuilder: (ctx) => [
                          const PopupMenuItem(value: 'details', child: Text('View Details')),
                          PopupMenuItem(
                            value: 'select',
                            child: Text(isSelected ? 'Deselect' : 'Select Order'),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // Status Pill
                  _buildMockupStatusPill(order.status),
                  const SizedBox(height: 8),

                  // Payment Status
                  _buildPaymentBadge(order.paymentStatus),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // --- Mockup Status Pill Resolver ---
  Widget _buildMockupStatusPill(String status) {
    Color bg;
    Color textColor;
    String label;

    switch (status.toLowerCase()) {
      case 'picked_up':
        bg = const Color(0xFFE0F2FE);
        textColor = const Color(0xFF0284C7);
        label = 'PICKED UP';
        break;
      case 'completed':
      case 'delivered':
        bg = const Color(0xFFDCFCE7);
        textColor = const Color(0xFF16A34A);
        label = 'COMPLETED';
        break;
      case 'preparing':
        bg = const Color(0xFFFEF3C7);
        textColor = const Color(0xFFD97706);
        label = 'PREPARING';
        break;
      case 'new':
      case 'pending':
        bg = const Color(0xFFFEE2E2);
        textColor = const Color(0xFFDC2626);
        label = 'NEW';
        break;
      case 'ready':
        bg = const Color(0xFFE0F2FE);
        textColor = const Color(0xFF2563EB);
        label = 'READY';
        break;
      case 'cancelled':
      case 'refunded':
        bg = const Color(0xFFFEE2E2);
        textColor = const Color(0xFFDC2626);
        label = 'CANCELLED';
        break;
      default:
        bg = const Color(0xFFF1F5F9);
        textColor = const Color(0xFF475569);
        label = status.toUpperCase();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: textColor,
          letterSpacing: 0.4,
        ),
      ),
    );
  }

  // --- Payment Status Badge ---
  Widget _buildPaymentBadge(String paymentStatus) {
    final p = paymentStatus.toLowerCase();
    final isPaid = p == 'paid' || p == 'completed';

    if (isPaid) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.check_circle_rounded, color: Color(0xFF16A34A), size: 13),
          const SizedBox(width: 4),
          Text(
            'PAID',
            style: GoogleFonts.inter(
              fontSize: 10.5,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF16A34A),
            ),
          ),
        ],
      );
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.payments_outlined, color: Color(0xFF64748B), size: 13),
        const SizedBox(width: 4),
        Text(
          p == 'cod' ? 'COD' : 'UNPAID',
          style: GoogleFonts.inter(
            fontSize: 10.5,
            fontWeight: FontWeight.w700,
            color: const Color(0xFF64748B),
          ),
        ),
      ],
    );
  }

  // --- Shimmer Placeholder ---
  Widget _buildShimmerOrderRow() {
    return Container(
      margin: const EdgeInsets.only(bottom: 12, left: 16, right: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Shimmer.fromColors(
        baseColor: Colors.grey.shade200,
        highlightColor: Colors.grey.shade100,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(width: 20, height: 20, color: Colors.white),
            const SizedBox(width: 10),
            Container(width: 64, height: 64, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12))),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(width: 130, height: 14, color: Colors.white),
                  const SizedBox(height: 6),
                  Container(width: 90, height: 12, color: Colors.white),
                  const SizedBox(height: 6),
                  Container(width: 110, height: 12, color: Colors.white),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
