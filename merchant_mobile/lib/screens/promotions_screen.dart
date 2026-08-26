import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import 'package:go_router/go_router.dart';

import '../providers/promotion_provider.dart';
import '../models/promotion_model.dart';

class PromotionsScreen extends StatefulWidget {
  const PromotionsScreen({Key? key}) : super(key: key);

  @override
  State<PromotionsScreen> createState() => _PromotionsScreenState();
}

class _PromotionsScreenState extends State<PromotionsScreen> {
  String _activeTab = 'All Promotions';
  String _searchQuery = '';
  String _filterStatus = 'All Status';
  String _filterChannel = 'All Channels';

  final List<String> _tabs = ['All Promotions', 'Coupon', 'Combo Offer', 'Happy Hour', 'Seasonal Offer', 'Referral Offer'];
  final List<String> _statuses = ['All Status', 'Active', 'Expired'];
  final List<String> _channels = ['All Channels', 'Mobile', 'Web', 'Dine-In'];

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PromotionProvider>();
    final promotions = provider.promotions;
    final stats = provider.stats;
    final isLoading = provider.isLoading && promotions.isEmpty;

    // Filter logic
    final filteredPromotions = promotions.where((p) {
      bool tabMatch = _activeTab == 'All Promotions' || p.promoType == _activeTab;
      bool searchMatch = _searchQuery.isEmpty || 
          p.name.toLowerCase().contains(_searchQuery.toLowerCase()) || 
          p.code.toLowerCase().contains(_searchQuery.toLowerCase());
      
      bool isExpired = p.endDate.isBefore(DateTime.now()) || !p.isActive;
      bool statusMatch = _filterStatus == 'All Status' || 
          (_filterStatus == 'Active' && !isExpired) || 
          (_filterStatus == 'Expired' && isExpired);

      bool channelMatch = _filterChannel == 'All Channels' || p.channels.contains(_filterChannel);
      
      return tabMatch && searchMatch && statusMatch && channelMatch;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20, color: Colors.black),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/');
            }
          },
        ),
        title: Text('Promotions & Coupons', style: GoogleFonts.inter(color: Colors.black, fontWeight: FontWeight.bold)),
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFF8B0000),
        onPressed: () => _showPromotionForm(context, null),
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Create Promotion', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: RefreshIndicator(
        onRefresh: () => provider.fetchData(force: true),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 100),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (stats != null) _buildStatsRow(stats),
              
              // Search & Filters
              Container(
                color: Colors.white,
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    TextField(
                      decoration: InputDecoration(
                        hintText: 'Search by name or code...',
                        prefixIcon: const Icon(Icons.search, color: Colors.grey),
                        filled: true,
                        fillColor: Colors.grey.shade100,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        contentPadding: const EdgeInsets.symmetric(vertical: 0)
                      ),
                      onChanged: (val) => setState(() => _searchQuery = val),
                    ),
                    const SizedBox(height: 12),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildDropdown(_statuses, _filterStatus, (val) => setState(() => _filterStatus = val!)),
                          const SizedBox(width: 8),
                          _buildDropdown(_channels, _filterChannel, (val) => setState(() => _filterChannel = val!)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: _tabs.map((tab) => _buildTabChip(tab)).toList(),
                      ),
                    )
                  ],
                ),
              ),

              // List or Loading Shimmer
              if (provider.isLoading)
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(16),
                  itemCount: 4,
                  itemBuilder: (ctx, i) => _buildShimmerCard(),
                )
              else if (filteredPromotions.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 40),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(Icons.local_activity_outlined, size: 64, color: Colors.grey.shade300),
                        const SizedBox(height: 16),
                        Text('No Promotions Found.', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.grey.shade600)),
                        const SizedBox(height: 4),
                        Text('Create your first promotion to get started.', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade500)),
                      ],
                    ),
                  ),
                )
              else
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(16),
                  itemCount: filteredPromotions.length,
                  itemBuilder: (ctx, i) => _buildPromotionCard(filteredPromotions[i], provider),
                )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatsRow(Map<String, dynamic> stats) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          _buildStatCard('Total Promotions', stats['totalPromotions']?.toString() ?? '0', Colors.orange, Icons.confirmation_num),
          _buildStatCard('Active Promotions', stats['activePromotions']?.toString() ?? '0', Colors.green, Icons.percent),
          _buildStatCard('Coupons Redeemed', stats['couponsRedeemed']?.toString() ?? '0', Colors.purple, Icons.sell),
          _buildStatCard('Total Discount', '\$${stats['totalDiscount']?.toStringAsFixed(2) ?? '0.00'}', Colors.blue, Icons.money_off),
          _buildStatCard('Promo Revenue', '\$${stats['revenueFromPromo']?.toStringAsFixed(2) ?? '0.00'}', Colors.red, Icons.bar_chart),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, Color color, IconData icon) {
    return Container(
      width: 180, // Slightly wider to accommodate horizontal layout
      margin: const EdgeInsets.only(right: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias, // To crop the half-circle
      child: Stack(
        children: [
          // Decorative half-circle on the right
          Positioned(
            right: -24,
            bottom: -24,
            child: Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                color: color.withOpacity(0.06),
                shape: BoxShape.circle,
              ),
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.12),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(icon, color: color, size: 20),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        title,
                        style: GoogleFonts.inter(color: Colors.grey.shade600, fontSize: 12, fontWeight: FontWeight.bold),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  value,
                  style: GoogleFonts.inter(color: Colors.black, fontSize: 24, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDropdown(List<String> items, String current, ValueChanged<String?> onChanged) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(8),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: current,
          style: GoogleFonts.inter(fontSize: 13, color: Colors.black, fontWeight: FontWeight.w500),
          icon: const Icon(Icons.keyboard_arrow_down, size: 16, color: Colors.grey),
          onChanged: onChanged,
          items: items.map((i) => DropdownMenuItem(value: i, child: Text(i))).toList(),
        ),
      ),
    );
  }

  Widget _buildShimmerCard() {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
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
                Container(width: 100, height: 20, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(4))),
                Container(width: 30, height: 30, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle)),
              ],
            ),
            const SizedBox(height: 16),
            Container(width: 200, height: 16, color: Colors.white),
            const SizedBox(height: 8),
            Container(width: 150, height: 16, color: Colors.white),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(width: 80, height: 14, color: Colors.white),
                Container(width: 80, height: 14, color: Colors.white),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTabChip(String text) {
    final isActive = _activeTab == text;
    return GestureDetector(
      onTap: () => setState(() => _activeTab = text),
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFF8B0000) : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(text, style: GoogleFonts.inter(
          fontSize: 13, 
          fontWeight: FontWeight.bold, 
          color: isActive ? Colors.white : Colors.grey.shade700
        )),
      ),
    );
  }

  Widget _buildPromotionCard(PromotionModel promo, PromotionProvider provider) {
    bool isExpired = promo.endDate.isBefore(DateTime.now()) || !promo.isActive;
    
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: Colors.grey.shade200)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.shade100, style: BorderStyle.solid, width: 1.5)
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.local_offer, size: 12, color: Color(0xFF8B0000)),
                      const SizedBox(width: 6),
                      Text(promo.code, style: GoogleFonts.inter(fontWeight: FontWeight.w900, color: const Color(0xFF8B0000), fontSize: 13, letterSpacing: 1)),
                    ],
                  ),
                ),
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.edit, size: 18, color: Colors.grey),
                      constraints: const BoxConstraints(),
                      padding: EdgeInsets.zero,
                      onPressed: () => _showPromotionForm(context, promo),
                    ),
                    const SizedBox(width: 12),
                    IconButton(
                      icon: const Icon(Icons.delete, size: 18, color: Colors.red),
                      constraints: const BoxConstraints(),
                      padding: EdgeInsets.zero,
                      onPressed: () => _confirmDelete(promo, provider),
                    ),
                  ],
                )
              ],
            ),
            const SizedBox(height: 12),
            Text(promo.name, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 4),
            Text(
              promo.type == 'percentage' 
                ? '${promo.value}% Off${promo.maxDiscount != null ? " up to \$${promo.maxDiscount}" : ""}'
                : '\$${promo.value.toStringAsFixed(2)} Off',
              style: GoogleFonts.inter(color: Colors.green.shade700, fontWeight: FontWeight.bold, fontSize: 13),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Flexible(child: _buildInfoBadge(Icons.category, promo.promoType)),
                const SizedBox(width: 8),
                Flexible(child: _buildInfoBadge(Icons.phone_iphone, promo.channels.join(', '))),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Flexible(child: _buildInfoBadge(Icons.timer, isExpired ? 'Expired' : 'Ends ${promo.endDate.month}/${promo.endDate.day}', color: isExpired ? Colors.red : Colors.orange)),
                const SizedBox(width: 8),
                Flexible(child: _buildInfoBadge(Icons.check_circle, isExpired ? 'Inactive' : 'Active', color: isExpired ? Colors.red : Colors.green)),
              ],
            )
          ],
        ),
      ),
    );
  }

  Widget _buildInfoBadge(IconData icon, String text, {Color color = Colors.grey}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 4),
        Flexible(
          child: Text(
            text, 
            style: GoogleFonts.inter(fontSize: 12, color: color, fontWeight: FontWeight.w600),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  void _confirmDelete(PromotionModel promo, PromotionProvider provider) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Promotion'),
        content: const Text('Are you sure you want to delete this promotion? It will no longer be available to customers.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await provider.deletePromotion(promo.id);
                if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Deleted successfully')));
              } catch(e) {
                if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
              }
            },
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          )
        ],
      )
    );
  }

  void _showPromotionForm(BuildContext context, PromotionModel? existingPromo) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _PromotionFormBottomSheet(promo: existingPromo),
    );
  }
}

class _PromotionFormBottomSheet extends StatefulWidget {
  final PromotionModel? promo;
  const _PromotionFormBottomSheet({this.promo});

  @override
  State<_PromotionFormBottomSheet> createState() => _PromotionFormBottomSheetState();
}

class _PromotionFormBottomSheetState extends State<_PromotionFormBottomSheet> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _codeController;
  late TextEditingController _nameController;
  late TextEditingController _descController;
  late TextEditingController _valueController;
  late TextEditingController _minCartController;
  late TextEditingController _minOrdersController;
  late TextEditingController _maxUsesController;
  
  String _promoType = 'Coupon';
  String _discountType = 'percentage';
  String _paymentMethod = 'All';
  String _targetAudience = 'All Users';
  String _targetGroup = 'Family';
  DateTime? _endDate;
  bool _isSaving = false;
  bool _firstOrderOnly = false;

  @override
  void initState() {
    super.initState();
    final p = widget.promo;
    _codeController = TextEditingController(text: p?.code ?? '');
    _nameController = TextEditingController(text: p?.name ?? '');
    _descController = TextEditingController(text: p?.description ?? '');
    _valueController = TextEditingController(text: p?.value.toString() ?? '');
    _minCartController = TextEditingController(text: p?.minCartValue.toString() ?? '');
    _minOrdersController = TextEditingController(text: p?.minOrdersRequired.toString() ?? '');
    _maxUsesController = TextEditingController(text: p?.maxUses?.toString() ?? '');
    
    if (p != null) {
      _promoType = p.promoType;
      _discountType = (p.type == 'fixed' || p.type.isEmpty) ? 'flat' : p.type;
      _paymentMethod = p.allowedPaymentMethods.isNotEmpty ? p.allowedPaymentMethods.first : 'All';
      _targetAudience = p.targetGroup == 'All Users' ? 'All Users' : 'Specific Group';
      _targetGroup = p.targetGroup == 'All Users' ? 'Family' : p.targetGroup;
      _endDate = p.endDate;
      _firstOrderOnly = p.firstOrderOnly;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.9,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(widget.promo == null ? 'Create Promotion' : 'Edit Promotion', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context))
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('Coupon Code *'),
                              TextFormField(
                                controller: _codeController,
                                textCapitalization: TextCapitalization.characters,
                                decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'e.g. SUMMER30'),
                                validator: (v) => v!.isEmpty ? 'Required' : null,
                              ),
                            ],
                          )
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('Promo Type'),
                              DropdownButtonFormField<String>(
                                isExpanded: true,
                                value: _promoType,
                                decoration: const InputDecoration(border: OutlineInputBorder()),
                                items: ['Coupon', 'Offer', 'Seasonal Offer', 'Combo Offer'].map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                                onChanged: (v) => setState(() => _promoType = v!),
                              ),
                            ],
                          )
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _buildLabel('Name'),
                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'e.g. Summer Special 30% Off'),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('Discount Type *'),
                              DropdownButtonFormField<String>(
                                isExpanded: true,
                                value: _discountType,
                                decoration: const InputDecoration(border: OutlineInputBorder()),
                                items: const [DropdownMenuItem(value: 'percentage', child: Text('Percentage (%)')), DropdownMenuItem(value: 'flat', child: Text('Flat Amount'))],
                                onChanged: (v) => setState(() => _discountType = v!),
                              ),
                            ],
                          )
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('Value *'),
                              TextFormField(
                                controller: _valueController,
                                keyboardType: TextInputType.number,
                                decoration: InputDecoration(border: OutlineInputBorder(), hintText: _discountType == 'percentage' ? 'e.g. 30' : 'e.g. 10'),
                                validator: (v) => v!.isEmpty ? 'Required' : null,
                              ),
                            ],
                          )
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('Min. Cart Value'),
                              TextFormField(
                                controller: _minCartController,
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'e.g. 20'),
                              ),
                            ],
                          )
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('Min. Past Orders'),
                              TextFormField(
                                controller: _minOrdersController,
                                keyboardType: TextInputType.number,
                                enabled: !_firstOrderOnly,
                                decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'e.g. 5 (0 for all)'),
                              ),
                            ],
                          )
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    CheckboxListTile(
                      title: Text('Valid for First Order Only', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                      value: _firstOrderOnly,
                      contentPadding: EdgeInsets.zero,
                      controlAffinity: ListTileControlAffinity.leading,
                      activeColor: const Color(0xFF8B0000),
                      onChanged: (val) {
                        setState(() {
                          _firstOrderOnly = val ?? false;
                          if (_firstOrderOnly) {
                            _minOrdersController.text = '0';
                          }
                        });
                      },
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('Required Payment'),
                              DropdownButtonFormField<String>(
                                isExpanded: true,
                                value: _paymentMethod,
                                decoration: const InputDecoration(border: OutlineInputBorder()),
                                items: ['All', 'Credit Card', 'Apple Pay', 'Cash on Delivery'].map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                                onChanged: (v) => setState(() => _paymentMethod = v!),
                              ),
                            ],
                          )
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('Expiry Date *'),
                              InkWell(
                                onTap: () async {
                                  final date = await showDatePicker(
                                    context: context,
                                    initialDate: _endDate ?? DateTime.now().add(const Duration(days: 30)),
                                    firstDate: DateTime.now(),
                                    lastDate: DateTime.now().add(const Duration(days: 365)),
                                  );
                                  if (date != null) {
                                    setState(() => _endDate = date);
                                  }
                                },
                                child: InputDecorator(
                                  decoration: InputDecoration(
                                    border: const OutlineInputBorder(),
                                    errorText: _endDate == null ? 'Required' : null,
                                  ),
                                  child: Text(_endDate != null ? "${_endDate!.year}-${_endDate!.month.toString().padLeft(2,'0')}-${_endDate!.day.toString().padLeft(2,'0')}" : 'Select expiry date'),
                                ),
                              ),
                            ],
                          )
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('Target Audience'),
                              DropdownButtonFormField<String>(
                                isExpanded: true,
                                value: _targetAudience,
                                decoration: const InputDecoration(border: OutlineInputBorder()),
                                items: ['All Users', 'Specific Group'].map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                                onChanged: (v) => setState(() => _targetAudience = v!),
                              ),
                            ],
                          )
                        ),
                        if (_targetAudience == 'Specific Group') ...[
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel('Select Group'),
                                DropdownButtonFormField<String>(
                                  isExpanded: true,
                                  value: _targetGroup,
                                  decoration: const InputDecoration(border: OutlineInputBorder()),
                                  items: ['Family', 'Friends', 'Corporate', 'Others'].map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                                  onChanged: (v) => setState(() => _targetGroup = v!),
                                ),
                              ],
                            )
                          ),
                        ] else const Spacer(),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('Max Uses (Limit)'),
                              TextFormField(
                                controller: _maxUsesController,
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'e.g. 100 (blank for unlimited)'),
                              ),
                            ],
                          )
                        ),
                        const Spacer(),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _buildLabel('Description'),
                    TextFormField(
                      controller: _descController,
                      maxLines: 2,
                      decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'Add a description...'),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF8B0000), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                onPressed: _isSaving ? null : _save,
                child: _isSaving 
                  ? const CircularProgressIndicator(color: Colors.white)
                  : Text(widget.promo == null ? 'Create Promotion' : 'Update Promotion', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(text, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13)),
    );
  }

  void _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_endDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Expiry date is required')));
      return;
    }

    setState(() => _isSaving = true);
    final data = {
      'code': _codeController.text.trim().toUpperCase(),
      'name': _nameController.text.trim(),
      'promoType': _promoType,
      'type': _discountType,
      'value': double.tryParse(_valueController.text) ?? 0,
      'minCartValue': double.tryParse(_minCartController.text) ?? 0,
      'firstOrderOnly': _firstOrderOnly,
      'minOrdersRequired': _firstOrderOnly ? 0 : (int.tryParse(_minOrdersController.text) ?? 0),
      'allowedPaymentMethods': _paymentMethod == 'All' ? ['All'] : [_paymentMethod],
      'endDate': _endDate!.toIso8601String(),
      'maxUses': _maxUsesController.text.isNotEmpty ? int.tryParse(_maxUsesController.text) : null,
      'targetGroup': _targetAudience == 'All Users' ? 'All Users' : _targetGroup,
      'description': _descController.text.trim(),
    };

    try {
      if (widget.promo == null) {
        await context.read<PromotionProvider>().createPromotion(data);
      } else {
        await context.read<PromotionProvider>().updatePromotion(widget.promo!.id, data);
      }
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(widget.promo == null ? 'Created successfully' : 'Updated successfully')));
      }
    } catch(e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }
}
