import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../models/customer_model.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';
import '../widgets/shared_app_bar.dart';
import '../widgets/app_drawer.dart';
import 'crm/crm_modals.dart';
import 'crm/customer_profile_modal.dart';

class CrmScreen extends StatefulWidget {
  const CrmScreen({Key? key}) : super(key: key);

  @override
  State<CrmScreen> createState() => _CrmScreenState();
}

class _CrmScreenState extends State<CrmScreen> {
  final FocusNode _searchFocusNode = FocusNode();
  bool _isLoading = true;
  List<Customer> _allCustomers = [];
  List<Customer> _filteredCustomers = [];
  String _searchQuery = '';
  String _selectedGroup = 'All';
  String _selectedTier = 'All';
  String _selectedStatus = 'All';
  
  List<String> _selectedCustomerIds = [];
  
  Map<String, dynamic> _stats = {
    'totalCustomers': 0,
    'newCustomers': 0,
    'loyaltyMembers': 0,
    'repeatCustomers': 0
  };

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchCustomers();
    });
  }

  @override
  void dispose() {
    _searchFocusNode.dispose();
    super.dispose();
  }

  void _unfocusSearch() {
    if (_searchFocusNode.hasFocus) {
      _searchFocusNode.unfocus();
    }
    FocusManager.instance.primaryFocus?.unfocus();
  }

  Future<void> _fetchCustomers() async {
    setState(() => _isLoading = true);
    try {
      final auth = context.read<AuthProvider>();
      final restaurantId = auth.user?['restaurantId'];
      if (restaurantId == null) return;

      final response = await ApiService.getCustomers(restaurantId);
      final data = json.decode(response.body);
      
      final List<dynamic> customersData = data['data'] ?? [];
      _allCustomers = customersData.map((e) => Customer.fromJson(e)).toList();
      
      final now = DateTime.now();
      final startOfMonth = DateTime(now.year, now.month, 1);
      
      int newCustomersCount = 0;
      int loyaltyMembersCount = 0;
      int repeatCustomersCount = 0;
      
      for (var c in _allCustomers) {
        if (c.createdAt != null && c.createdAt!.isAfter(startOfMonth)) newCustomersCount++;
        if (c.loyaltyTier != null && c.loyaltyTier != 'Bronze') loyaltyMembersCount++;
        if (c.totalOrders > 1) repeatCustomersCount++;
      }
      
      _stats = {
        'totalCustomers': _allCustomers.length,
        'newCustomers': newCustomersCount,
        'loyaltyMembers': loyaltyMembersCount,
        'repeatCustomers': repeatCustomersCount,
      };
      
      _applyFilters();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to load customers: $e')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _applyFilters() {
    setState(() {
      _filteredCustomers = _allCustomers.where((c) {
        final matchesSearch = c.name.toLowerCase().contains(_searchQuery.toLowerCase()) || 
                              (c.phone != null && c.phone!.contains(_searchQuery)) ||
                              (c.email != null && c.email!.toLowerCase().contains(_searchQuery.toLowerCase()));
        final matchesGroup = _selectedGroup == 'All' || c.group == _selectedGroup;
        final matchesTier = _selectedTier == 'All' || c.loyaltyTier == _selectedTier;
        final matchesStatus = _selectedStatus == 'All' || c.status == _selectedStatus;
        return matchesSearch && matchesGroup && matchesTier && matchesStatus;
      }).toList();
    });
  }

  void _toggleSelection(String id) {
    setState(() {
      if (_selectedCustomerIds.contains(id)) {
        _selectedCustomerIds.remove(id);
      } else {
        _selectedCustomerIds.add(id);
      }
    });
  }

  void _clearSelection() {
    setState(() => _selectedCustomerIds.clear());
    _applyFilters();
  }

  Future<void> _exportToCsv() async {
    try {
      final List<String> headers = [
        "Customer Name", "Customer ID", "Phone", "Email", "Group", 
        "Loyalty Tier", "Total Orders", "Total Spent", "Last Order Date", "Status"
      ];
      
      final List<List<String>> rows = _filteredCustomers.map((c) => [
        c.name.replaceAll('"', '""'),
        c.customerId,
        c.phone ?? '',
        c.email ?? '',
        c.group,
        c.loyaltyTier,
        c.totalOrders.toString(),
        c.totalSpent.toStringAsFixed(2),
        c.lastOrderDate ?? '',
        c.status,
      ]).toList();

      String csvContent = headers.join(',') + '\n';
      for (var row in rows) {
        csvContent += row.map((cell) => '"$cell"').join(',') + '\n';
      }

      final directory = await getTemporaryDirectory();
      final path = '${directory.path}/customers_${DateTime.now().toIso8601String().split('T').first}.csv';
      final file = File(path);
      await file.writeAsString(csvContent);

      await Share.shareXFiles([XFile(path)], text: 'Customer Export');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to export: $e')));
      }
    }
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
                  style: GoogleFonts.outfit(color: const Color(0xFF111827), fontSize: 24, fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showFilterBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Filter Customers', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold)),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    
                    Text('GROUP', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8), letterSpacing: 1)),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: ['All', 'App User', 'Guest', 'Family', 'Friends', 'Corporate', 'Others']
                          .map((group) => ChoiceChip(
                                label: Text(group),
                                selected: _selectedGroup == group,
                                onSelected: (selected) {
                                  if (selected) {
                                    setState(() => _selectedGroup = group);
                                    setModalState(() {});
                                    _applyFilters();
                                  }
                                },
                                selectedColor: const Color(0xFFDC2626),
                                labelStyle: GoogleFonts.inter(
                                  color: _selectedGroup == group ? Colors.white : const Color(0xFF475569),
                                  fontWeight: _selectedGroup == group ? FontWeight.w600 : FontWeight.w500,
                                  fontSize: 13,
                                ),
                                backgroundColor: const Color(0xFFF8FAFC),
                                side: BorderSide(color: _selectedGroup == group ? Colors.transparent : Colors.grey.shade200),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                              ))
                          .toList(),
                    ),
                    const SizedBox(height: 24),

                    Text('LOYALTY TIER', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8), letterSpacing: 1)),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: ['All', 'Bronze', 'Silver', 'Gold', 'Platinum']
                          .map((tier) => ChoiceChip(
                                label: Text(tier),
                                selected: _selectedTier == tier,
                                onSelected: (selected) {
                                  if (selected) {
                                    setState(() => _selectedTier = tier);
                                    setModalState(() {});
                                    _applyFilters();
                                  }
                                },
                                selectedColor: const Color(0xFFDC2626),
                                labelStyle: GoogleFonts.inter(
                                  color: _selectedTier == tier ? Colors.white : const Color(0xFF475569),
                                  fontWeight: _selectedTier == tier ? FontWeight.w600 : FontWeight.w500,
                                  fontSize: 13,
                                ),
                                backgroundColor: const Color(0xFFF8FAFC),
                                side: BorderSide(color: _selectedTier == tier ? Colors.transparent : Colors.grey.shade200),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                              ))
                          .toList(),
                    ),
                    const SizedBox(height: 24),
                    
                    Text('STATUS', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8), letterSpacing: 1)),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: ['All', 'Active', 'Inactive']
                          .map((status) => ChoiceChip(
                                label: Text(status),
                                selected: _selectedStatus == status,
                                onSelected: (selected) {
                                  if (selected) {
                                    setState(() => _selectedStatus = status);
                                    setModalState(() {});
                                    _applyFilters();
                                  }
                                },
                                selectedColor: const Color(0xFFDC2626),
                                labelStyle: GoogleFonts.inter(
                                  color: _selectedStatus == status ? Colors.white : const Color(0xFF475569),
                                  fontWeight: _selectedStatus == status ? FontWeight.w600 : FontWeight.w500,
                                  fontSize: 13,
                                ),
                                backgroundColor: const Color(0xFFF8FAFC),
                                side: BorderSide(color: _selectedStatus == status ? Colors.transparent : Colors.grey.shade200),
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
                        child: Text('Done', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
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
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
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
        title: Text('Customers & CRM', style: GoogleFonts.inter(color: const Color(0xFF0F172A), fontWeight: FontWeight.bold, letterSpacing: -0.5)),
        iconTheme: const IconThemeData(color: Color(0xFF0F172A)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: Colors.grey.shade200, height: 1),
        ),
      ),
      body: SafeArea(
        child: GestureDetector(
          onTap: _unfocusSearch,
        child: Stack(
          children: [
            Column(
              children: [
                Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    // Header
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                      color: Colors.white,
                      child: Wrap(
                        alignment: WrapAlignment.spaceBetween,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: 16,
                        runSpacing: 16,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'Customers',
                                style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Manage your customer base, send promos, and view insights.',
                                style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade600),
                              ),
                            ],
                          ),
                          Wrap(
                            spacing: 12,
                            runSpacing: 12,
                            children: [
                              ElevatedButton.icon(
                                onPressed: _exportToCsv,
                                icon: const Icon(Icons.download, size: 18),
                                label: const Text('Export'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.white,
                                  foregroundColor: Colors.grey.shade700,
                                  elevation: 0,
                                  side: BorderSide(color: Colors.grey.shade300),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                              ),
                              ElevatedButton.icon(
                                onPressed: () {
                                   final auth = context.read<AuthProvider>();
                                   final restaurantId = auth.user?['restaurantId'];
                                    if (restaurantId != null) {
                                     _unfocusSearch();
                                     CrmModals.showAddEditCustomerModal(context, restaurantId, _fetchCustomers);
                                   }
                                },
                                icon: const Icon(Icons.add, size: 18),
                                label: const Text('Add Customer'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF8B0000),
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                              )
                            ],
                          )
                        ],
                      ),
                    ),
                    
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 20),
                      child: Column(
                        children: [
                          // Stats
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        physics: const BouncingScrollPhysics(),
                        child: Row(
                          children: [
                            _buildStatCard('Total Customers', '${_stats['totalCustomers']}', Icons.people, const Color(0xFF3B82F6)),
                            const SizedBox(width: 12),
                            _buildStatCard('New This Month', '${_stats['newCustomers']}', Icons.person_add, const Color(0xFF10B981)),
                            const SizedBox(width: 12),
                            _buildStatCard('Loyalty Members', '${_stats['loyaltyMembers']}', Icons.star, const Color(0xFFF59E0B)),
                            const SizedBox(width: 12),
                            _buildStatCard('Repeat Customers', '${_stats['repeatCustomers']}', Icons.refresh, const Color(0xFF8B5CF6)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      
                      // Table Container
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: Column(
                          children: [
                            // Filters
                            Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: TextField(
                                      focusNode: _searchFocusNode,
                                      onChanged: (val) {
                                        _searchQuery = val;
                                        _applyFilters();
                                      },
                                      decoration: InputDecoration(
                                        hintText: 'Search customers...',
                                        prefixIcon: const Icon(Icons.search, color: Colors.grey),
                                        contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
                                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
                                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFDC2626))),
                                      ),
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
                                          if (_selectedGroup != 'All' || _selectedTier != 'All' || _selectedStatus != 'All')
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
                                ],
                              ),
                            ),
                            
                            // Customer Table List
                            if (_isLoading)
                               const Padding(
                                 padding: EdgeInsets.all(40),
                                 child: Center(child: CircularProgressIndicator()),
                               )
                            else if (_filteredCustomers.isEmpty)
                               const Padding(
                                 padding: EdgeInsets.all(40),
                                 child: Center(child: Text("No customers found.")),
                               )
                            else
                              ListView.separated(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: _filteredCustomers.length,
                                separatorBuilder: (ctx, i) => const Divider(height: 1),
                                itemBuilder: (ctx, i) {
                                  final c = _filteredCustomers[i];
                                  final isSelected = _selectedCustomerIds.contains(c.id);
                                  return InkWell(
                                    onTap: () => _toggleSelection(c.id),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                                      color: isSelected ? const Color(0xFF8B0000).withOpacity(0.04) : Colors.transparent,
                                      child: Row(
                                        children: [
                                          Checkbox(
                                            value: isSelected,
                                            onChanged: (_) => _toggleSelection(c.id),
                                            activeColor: const Color(0xFF8B0000),
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                                          ),
                                          const SizedBox(width: 4),
                                          // Avatar
                                          Container(
                                            width: 44,
                                            height: 44,
                                            decoration: const BoxDecoration(
                                              gradient: LinearGradient(colors: [Color(0xFF8B0000), Color(0xFF5a0000)]),
                                              shape: BoxShape.circle,
                                            ),
                                            alignment: Alignment.center,
                                            child: Text(
                                              c.name.isNotEmpty ? c.name[0].toUpperCase() : 'U',
                                              style: GoogleFonts.outfit(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                                            ),
                                          ),
                                          const SizedBox(width: 10),
                                          // Details
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Row(
                                                  children: [
                                                    Flexible(
                                                      child: Text(c.name, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: const Color(0xFF111827)), overflow: TextOverflow.ellipsis),
                                                    ),
                                                    if (c.loyaltyTier != 'Bronze' && c.loyaltyTier != 'All') ...[
                                                      const SizedBox(width: 8),
                                                      Container(
                                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                        decoration: BoxDecoration(
                                                          color: Colors.amber.shade50,
                                                          borderRadius: BorderRadius.circular(12),
                                                          border: Border.all(color: Colors.amber.shade200)
                                                        ),
                                                        child: Row(
                                                          children: [
                                                            const Icon(Icons.star, size: 10, color: Colors.orange),
                                                            const SizedBox(width: 2),
                                                            Text(c.loyaltyTier.toUpperCase(), style: GoogleFonts.inter(fontSize: 9, color: Colors.orange.shade900, fontWeight: FontWeight.bold)),
                                                          ],
                                                        ),
                                                      )
                                                    ]
                                                  ],
                                                ),
                                                const SizedBox(height: 6),
                                                if (c.phone != null && c.phone!.isNotEmpty) ...[
                                                  Row(
                                                    children: [
                                                      Icon(Icons.phone, size: 12, color: Colors.grey.shade400),
                                                      const SizedBox(width: 6),
                                                      Expanded(
                                                        child: Text(c.phone!, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF6B7280)), overflow: TextOverflow.ellipsis),
                                                      ),
                                                    ],
                                                  ),
                                                  const SizedBox(height: 4),
                                                ],
                                                if (c.email != null && c.email!.isNotEmpty) ...[
                                                  Row(
                                                    children: [
                                                      Icon(Icons.email, size: 12, color: Colors.grey.shade400),
                                                      const SizedBox(width: 6),
                                                      Expanded(
                                                        child: Text(c.email!, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF6B7280)), overflow: TextOverflow.ellipsis),
                                                      ),
                                                    ],
                                                  ),
                                                ],
                                              ],
                                            ),
                                          ),
                                          // Stats
                                          Column(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            crossAxisAlignment: CrossAxisAlignment.end,
                                            children: [
                                              Text('\$${c.totalSpent.toStringAsFixed(2)}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: const Color(0xFF10B981))),
                                              const SizedBox(height: 2),
                                              Text('${c.totalOrders} Orders', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade500, fontWeight: FontWeight.w500)),
                                            ],
                                          ),
                                          const SizedBox(width: 10),
                                          // Action
                                          Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              InkWell(
                                                borderRadius: BorderRadius.circular(6),
                                                onTap: () {
                                                  final auth = context.read<AuthProvider>();
                                                  final restaurantId = auth.user?['restaurantId'];
                                                  if (restaurantId != null) {
                                                    _unfocusSearch();
                                                    CrmModals.showAddEditCustomerModal(context, restaurantId, _fetchCustomers, customer: c);
                                                  }
                                                },
                                                child: Container(
                                                  padding: const EdgeInsets.all(6),
                                                  decoration: BoxDecoration(
                                                    color: Colors.grey.shade50,
                                                    borderRadius: BorderRadius.circular(6),
                                                    border: Border.all(color: Colors.grey.shade200),
                                                  ),
                                                  child: const Icon(Icons.edit_outlined, color: Color(0xFF475569), size: 16),
                                                ),
                                              ),
                                              const SizedBox(width: 6),
                                              InkWell(
                                                borderRadius: BorderRadius.circular(6),
                                                onTap: () {
                                                  final auth = context.read<AuthProvider>();
                                                  final restaurantId = auth.user?['restaurantId'];
                                                  if (restaurantId != null) {
                                                    _unfocusSearch();
                                                  showGeneralDialog(
                                                      context: context,
                                                      barrierDismissible: true,
                                                      barrierLabel: 'Dismiss',
                                                      barrierColor: Colors.black.withOpacity(0.5),
                                                      transitionDuration: const Duration(milliseconds: 300),
                                                      pageBuilder: (context, anim1, anim2) {
                                                        return Align(
                                                          alignment: Alignment.centerRight,
                                                          child: CustomerProfileModal(
                                                            customer: c,
                                                            restaurantId: restaurantId,
                                                            onTriggerPromo: () {
                                                              Navigator.pop(context); // Close drawer
                                                              CrmModals.showSendPromoModal(context, restaurantId, [c.id], () {
                                                                _fetchCustomers();
                                                              });
                                                            },
                                                          ),
                                                        );
                                                      },
                                                      transitionBuilder: (context, anim1, anim2, child) {
                                                        return SlideTransition(
                                                          position: Tween<Offset>(begin: const Offset(1, 0), end: Offset.zero).animate(anim1),
                                                          child: child,
                                                        );
                                                      },
                                                    );
                                                  }
                                                },
                                                child: Container(
                                                  padding: const EdgeInsets.all(6),
                                                  decoration: BoxDecoration(
                                                    color: Colors.grey.shade50,
                                                    borderRadius: BorderRadius.circular(6),
                                                    border: Border.all(color: Colors.grey.shade200),
                                                  ),
                                                  child: const Icon(Icons.remove_red_eye_outlined, color: Color(0xFF475569), size: 16),
                                                ),
                                              ),
                                            ],
                                          )
                                    ],
                                  ),
                                    ),
                                  );
                                },
                              )
                          ],
                        ),
                      )
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    ),

          // Floating Bulk Action Bar
          if (_selectedCustomerIds.isNotEmpty)
            Positioned(
              bottom: 24,
              left: 16,
              right: 16,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF111827),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 20, offset: const Offset(0, 10))
                    ]
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.chevron_left, color: Colors.grey, size: 20),
                      const SizedBox(width: 4),
                      Flexible(
                        child: SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6)
                        ),
                        child: Text('${_selectedCustomerIds.length} Selected', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                      ),
                      const SizedBox(width: 16),
                      Container(width: 1, height: 24, color: Colors.white.withOpacity(0.2)),
                      const SizedBox(width: 16),
                      _buildBulkActionButton(Icons.discount, 'Promo', () {
                        final auth = context.read<AuthProvider>();
                        final restaurantId = auth.user?['restaurantId'];
                        if (restaurantId != null) {
                          CrmModals.showSendPromoModal(context, restaurantId, _selectedCustomerIds, () {
                            _clearSelection();
                            _fetchCustomers();
                          });
                        }
                      }),
                      _buildBulkActionButton(Icons.group, 'Group', () {
                        final auth = context.read<AuthProvider>();
                        final restaurantId = auth.user?['restaurantId'];
                        if (restaurantId != null) {
                          CrmModals.showAssignGroupModal(context, restaurantId, _selectedCustomerIds, () {
                            _clearSelection();
                            _fetchCustomers();
                          });
                        }
                      }),
                      _buildBulkActionButton(Icons.delete, 'Delete', () {
                        final auth = context.read<AuthProvider>();
                        final restaurantId = auth.user?['restaurantId'];
                        if (restaurantId != null) {
                          CrmModals.showDeleteModal(context, restaurantId, _selectedCustomerIds, () {
                            _clearSelection();
                            _fetchCustomers();
                          });
                        }
                      }, isDestructive: true),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.grey, size: 20),
                        onPressed: _clearSelection,
                      )
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(Icons.chevron_right, color: Colors.grey, size: 20),
                    ],
                  ),
                ),
              ),
            )
          ],
        ),
      ),
      ),
    );
  }

  Widget _buildBulkActionButton(IconData icon, String label, VoidCallback onTap, {bool isDestructive = false}) {
    return Padding(
      padding: const EdgeInsets.only(right: 8.0),
      child: InkWell(
        onTap: () {
          _unfocusSearch();
          onTap();
        },
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            children: [
              Icon(icon, size: 16, color: isDestructive ? Colors.red.shade400 : Colors.grey.shade300),
              const SizedBox(width: 6),
              Text(
                label,
                style: GoogleFonts.inter(
                  color: isDestructive ? Colors.red.shade400 : Colors.grey.shade300,
                  fontSize: 13,
                  fontWeight: FontWeight.bold
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
