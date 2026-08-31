import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:convert';
import '../../services/api_service.dart';
import '../../models/customer_model.dart';
import 'crm_modals.dart';

class CustomerProfileModal extends StatefulWidget {
  final Customer customer;
  final String restaurantId;
  final VoidCallback onTriggerPromo;

  const CustomerProfileModal({
    Key? key,
    required this.customer,
    required this.restaurantId,
    required this.onTriggerPromo,
  }) : super(key: key);

  @override
  State<CustomerProfileModal> createState() => _CustomerProfileModalState();
}

class _CustomerProfileModalState extends State<CustomerProfileModal> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _profileData;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _fetchProfileData();
  }

  Future<void> _fetchProfileData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final res = await ApiService.getCustomerProfile(widget.restaurantId, widget.customer.id);
      setState(() {
        _profileData = json.decode(res.body)['data'];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Drawer(
      width: 600, // Large side drawer
      backgroundColor: Colors.white,
      child: SafeArea(
        child: Column(
          children: [
          // Header
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: Colors.grey.shade200))
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(colors: [Color(0xFF8B0000), Color(0xFF5a0000)]),
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    widget.customer.name.isNotEmpty ? widget.customer.name[0].toUpperCase() : 'U',
                    style: GoogleFonts.outfit(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(widget.customer.name, style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.bold, color: const Color(0xFF111827))),
                          const SizedBox(width: 8),
                          if (widget.customer.loyaltyTier != 'Bronze')
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.amber.shade100,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.amber.shade300)
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.star, size: 12, color: Colors.orange),
                                  const SizedBox(width: 4),
                                  Text(widget.customer.loyaltyTier, style: GoogleFonts.inter(fontSize: 10, color: Colors.orange.shade900, fontWeight: FontWeight.bold)),
                                ],
                              ),
                            )
                        ],
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 16,
                        runSpacing: 8,
                        children: [
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.email, size: 14, color: const Color(0xFF6B7280)),
                              const SizedBox(width: 4),
                              Text(widget.customer.email ?? 'No email', style: GoogleFonts.inter(color: const Color(0xFF6B7280), fontSize: 13)),
                            ],
                          ),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.phone, size: 14, color: const Color(0xFF6B7280)),
                              const SizedBox(width: 4),
                              Text(widget.customer.phone ?? 'No phone', style: GoogleFonts.inter(color: const Color(0xFF6B7280), fontSize: 13)),
                            ],
                          ),
                          if (widget.customer.loginPlatforms.isNotEmpty)
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.devices, size: 14, color: const Color(0xFF6B7280)),
                                const SizedBox(width: 4),
                                Text(widget.customer.loginPlatforms.join(', '), style: GoogleFonts.inter(color: const Color(0xFF6B7280), fontSize: 13)),
                              ],
                            ),
                        ],
                      )
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                )
              ],
            ),
          ),
          // Tabs
          TabBar(
            controller: _tabController,
            labelColor: const Color(0xFF8B0000),
            unselectedLabelColor: const Color(0xFF6B7280),
            indicatorColor: const Color(0xFF8B0000),
            labelStyle: GoogleFonts.inter(fontWeight: FontWeight.bold),
            tabs: const [
              Tab(text: '360° Overview'),
              Tab(text: 'Order History'),
              Tab(text: 'Loyalty & Rewards'),
            ],
          ),
          // Content
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(child: Text(_error!))
                    : TabBarView(
                        controller: _tabController,
                        children: [
                          _buildOverviewTab(),
                          _buildOrdersTab(),
                          _buildLoyaltyTab(),
                        ],
                      ),
          )
        ],
      ),
      ),
    );
  }

  Widget _buildOverviewTab() {
    final stats = _profileData?['stats'] ?? {};
    final promos = _profileData?['promos'] as List? ?? [];
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Stat grid
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 1.4,
            children: [
              _buildMetricCard('Lifetime Value', '\$${(stats['totalSpent'] ?? 0).toStringAsFixed(2)}', Icons.trending_up, Colors.green),
              _buildMetricCard('Total Orders', '${stats['totalOrders'] ?? 0}', Icons.shopping_bag, Colors.blue),
              _buildMetricCard('Avg Order Value', '\$${stats['aov'] ?? '0.00'}', Icons.show_chart, Colors.purple),
              _buildMetricCard('Total Savings', '\$${(stats['totalSavings'] ?? 0).toStringAsFixed(2)}', Icons.savings, Colors.teal),
              _buildMetricCard('Last Order', stats['lastOrderDate'] != null ? stats['lastOrderDate'].toString().substring(0, 10) : 'Never', Icons.schedule, Colors.orange),
              _buildMetricCard('Account Status', widget.customer.status, Icons.verified_user, Colors.indigo),
            ],
          ),
          const SizedBox(height: 24),
          
          // Send Offer Card
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF8B0000), Color(0xFF5a0000)]),
              borderRadius: BorderRadius.circular(16)
            ),
            child: Column(
              children: [
                const Icon(Icons.card_giftcard, color: Colors.white, size: 40),
                const SizedBox(height: 12),
                Text('Send Special Offer', style: GoogleFonts.outfit(fontSize: 18, color: Colors.white, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text('Boost retention by sending a personalized promo code directly to this customer via Email/SMS.', 
                     textAlign: TextAlign.center, style: GoogleFonts.inter(color: Colors.white70, fontSize: 13)),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: widget.onTriggerPromo,
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: const Color(0xFF8B0000)),
                  child: const Text('Create Promo Code'),
                )
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Promo History
          if (promos.isNotEmpty) ...[
            Text('Promo History', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF111827))),
            const SizedBox(height: 12),
            ...promos.map((p) => ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(p['code'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: const Color(0xFF111827))),
              subtitle: Text('${p['type'] == 'percentage' ? '${p['value']}%' : '\$${p['value']}'} OFF', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF6B7280))),
              trailing: Text(p['isActive'] == true ? 'Active' : 'Expired', style: GoogleFonts.inter(color: p['isActive'] == true ? Colors.green : const Color(0xFF6B7280), fontWeight: FontWeight.bold, fontSize: 12)),
            ))
          ]
        ],
      ),
    );
  }

  Widget _buildOrdersTab() {
    final orders = _profileData?['orders'] as List? ?? [];
    if (orders.isEmpty) {
      return Center(child: Text("No Order History", style: GoogleFonts.inter(color: Colors.grey)));
    }

    return ListView.separated(
      padding: const EdgeInsets.all(24),
      itemCount: orders.length,
      separatorBuilder: (c, i) => const Divider(),
      itemBuilder: (ctx, i) {
        final order = orders[i];
        final items = order['items'] as List? ?? [];
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Order #${order['orderNumber'] ?? order['_id']?.toString().substring(0,6).toUpperCase()}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: const Color(0xFF111827))),
                Text('\$${(order['total'] ?? 0).toStringAsFixed(2)}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16, color: const Color(0xFF111827))),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('${order['status']?.toString().toUpperCase()} • ${order['orderType']?.toString().toUpperCase()}', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: order['status'] == 'completed' || order['status'] == 'delivered' ? Colors.green : Colors.orange)),
                Text(order['createdAt'] != null ? order['createdAt'].toString().substring(0, 16).replaceFirst('T', ' ') : '', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF6B7280))),
              ],
            ),
            if (order['paymentMethod'] != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text('Payment: ${order['paymentMethod']?.toString().toUpperCase()}', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF6B7280))),
              ),
            if (order['couponCode'] != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text('Coupon Used: ${order['couponCode']}', style: GoogleFonts.inter(fontSize: 12, color: Colors.blue.shade700, fontWeight: FontWeight.bold)),
              ),
            const SizedBox(height: 12),
            ...items.map((item) {
               final name = item['name'] is Map ? item['name']['name'] : item['name'];
               return Padding(
                 padding: const EdgeInsets.only(bottom: 4),
                 child: Row(
                   children: [
                     Expanded(
                       child: Row(
                         children: [
                           Text('${item['quantity']}x', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: const Color(0xFF111827))),
                           const SizedBox(width: 8),
                           Expanded(child: Text(name.toString(), style: GoogleFonts.inter(color: const Color(0xFF6B7280)), overflow: TextOverflow.ellipsis)),
                         ],
                       ),
                     ),
                     Text('\$${(item['price'] ?? 0).toStringAsFixed(2)}', style: GoogleFonts.inter(color: const Color(0xFF111827))),
                   ],
                 ),
               );
            }),
          ],
        );
      },
    );
  }

  Widget _buildLoyaltyTab() {
    final loyalty = _profileData?['loyalty'] ?? {};
    final history = loyalty['history'] as List? ?? [];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF111827), Color(0xFF1f2937)]),
              borderRadius: BorderRadius.circular(16)
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('AVAILABLE BALANCE', style: GoogleFonts.inter(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Text('${loyalty['points'] ?? 0}', style: GoogleFonts.outfit(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold)),
                        const SizedBox(width: 8),
                        const Icon(Icons.star, color: Colors.amber, size: 24)
                      ],
                    )
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('CURRENT TIER', style: GoogleFonts.inter(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text('${loyalty['tier'] ?? 'Bronze'}', style: GoogleFonts.outfit(color: Colors.amber, fontSize: 24, fontWeight: FontWeight.bold)),
                  ],
                )
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text('Points History', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF111827))),
          const SizedBox(height: 16),
          if (history.isEmpty)
             Text("No Activity Yet", style: GoogleFonts.inter(color: const Color(0xFF6B7280)))
          else
            ...history.map((h) => ListTile(
               contentPadding: EdgeInsets.zero,
               title: Text(h['description'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14, color: const Color(0xFF111827))),
               subtitle: Text(h['createdAt'] != null ? h['createdAt'].toString().substring(0, 10) : '', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF6B7280))),
               trailing: Text('${h['points'] > 0 ? '+' : ''}${h['points']}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: h['points'] > 0 ? Colors.green : Colors.red)),
            ))
        ],
      ),
    );
  }

  Widget _buildMetricCard(String title, String value, IconData icon, Color color) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Positioned(
            right: -10,
            bottom: -10,
            child: Icon(
              icon,
              size: 80,
              color: color.withOpacity(0.08),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: Colors.white, size: 20),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.inter(
                        color: const Color(0xFF4B5563), 
                        fontSize: 12, 
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      value,
                      style: GoogleFonts.outfit(color: const Color(0xFF111827), fontSize: 22, fontWeight: FontWeight.w700),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
