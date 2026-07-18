import 'dart:convert';
import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../theme.dart';
import '../../widgets/glass_container.dart';
import 'package:intl/intl.dart';

class MerchantPromotionsScreen extends StatefulWidget {
  const MerchantPromotionsScreen({super.key});

  @override
  State<MerchantPromotionsScreen> createState() => _MerchantPromotionsScreenState();
}

class _MerchantPromotionsScreenState extends State<MerchantPromotionsScreen> {
  bool _isLoading = true;
  List<dynamic> _coupons = [];
  String? _restaurantId;

  final _codeController = TextEditingController();
  final _discountController = TextEditingController();
  final _minOrderController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _maxUsesController = TextEditingController();
  DateTime? _expiryDate;
  String _type = 'percentage'; // 'percentage', 'flat', 'free_delivery'
  bool _firstOrderOnly = false;

  @override
  void initState() {
    super.initState();
    _fetchCoupons();
  }

  @override
  void dispose() {
    _codeController.dispose();
    _discountController.dispose();
    _minOrderController.dispose();
    _descriptionController.dispose();
    _maxUsesController.dispose();
    super.dispose();
  }

  Future<void> _fetchCoupons() async {
    setState(() => _isLoading = true);
    try {
      final restRes = await ApiService.get('/api/restaurants/merchant/my');
      final restData = json.decode(restRes.body);
      if (restData['data'] != null) {
        _restaurantId = restData['data']['_id'];
      }

      // In a real app, coupon list API might support filtering or show all
      final response = await ApiService.get('/api/coupons');
      final data = json.decode(response.body);
      
      // Filter coupons that are globally applicable or specific to this restaurant
      final rawCoupons = data['data'] as List<dynamic>? ?? [];
      final filtered = rawCoupons.where((c) => c['specificRestaurant'] == null || c['specificRestaurant'] == _restaurantId).toList();
      
      setState(() {
        _coupons = filtered;
      });
    } catch (e) {
      debugPrint('Error loading coupons: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _createCoupon() async {
    if (_codeController.text.isEmpty || _expiryDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter Code and Expiry Date')));
      return;
    }
    if (_type != 'free_delivery' && _discountController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Discount Value is required')));
      return;
    }

    try {
      final payload = {
        'code': _codeController.text.toUpperCase(),
        'description': _descriptionController.text,
        'type': _type,
        'value': _type == 'free_delivery' ? 0 : (double.tryParse(_discountController.text) ?? 0),
        'minCartValue': double.tryParse(_minOrderController.text) ?? 0,
        'endDate': _expiryDate!.toIso8601String(),
        'specificRestaurant': _restaurantId,
        'firstOrderOnly': _firstOrderOnly,
        'maxUses': _maxUsesController.text.isNotEmpty ? int.tryParse(_maxUsesController.text) : null,
        'isActive': true,
      };

      final response = await ApiService.post('/api/coupons', payload);
      final resData = json.decode(response.body);

      if (resData['success'] == true) {
        _codeController.clear();
        _discountController.clear();
        _minOrderController.clear();
        _descriptionController.clear();
        _maxUsesController.clear();
        _expiryDate = null;
        _firstOrderOnly = false;
        
        if (mounted) Navigator.pop(context);
        _fetchCoupons();
        
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Coupon created successfully!'), backgroundColor: BrandColors.green));
      } else {
        throw Exception(resData['message'] ?? 'Failed to create coupon');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: BrandColors.red));
      }
    }
  }

  Future<void> _deactivateCoupon(String id) async {
    try {
      await ApiService.put('/api/coupons/$id', {'isActive': false});
      _fetchCoupons();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Promotion deactivated'), backgroundColor: BrandColors.green));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error deactivating: $e'), backgroundColor: BrandColors.red));
      }
    }
  }

  void _showAddCouponModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: BrandColors.card,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 16, right: 16, top: 16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Create New Promotion', style: TextStyle(color: BrandColors.textMain, fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _codeController,
                    style: const TextStyle(color: BrandColors.textMain),
                    decoration: const InputDecoration(labelText: 'Coupon Code (e.g. MONSOON20)', labelStyle: TextStyle(color: BrandColors.textMuted)),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _descriptionController,
                    style: const TextStyle(color: BrandColors.textMain),
                    decoration: const InputDecoration(labelText: 'Description (e.g. 20% off above \$40)', labelStyle: TextStyle(color: BrandColors.textMuted)),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          dropdownColor: BrandColors.card,
                          value: _type,
                          items: const [
                            DropdownMenuItem(value: 'percentage', child: Text('Percentage (%)', style: TextStyle(color: BrandColors.textMain))),
                            DropdownMenuItem(value: 'flat', child: Text('Fixed (\$)', style: TextStyle(color: BrandColors.textMain))),
                            DropdownMenuItem(value: 'free_delivery', child: Text('Free Delivery', style: TextStyle(color: BrandColors.textMain))),
                          ],
                          onChanged: (val) {
                            if (val != null) setModalState(() => _type = val);
                          },
                          decoration: const InputDecoration(labelText: 'Discount Type', labelStyle: TextStyle(color: BrandColors.textMuted)),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: TextField(
                          controller: _discountController,
                          keyboardType: TextInputType.number,
                          style: const TextStyle(color: BrandColors.textMain),
                          enabled: _type != 'free_delivery',
                          decoration: InputDecoration(
                            labelText: 'Discount Value', 
                            labelStyle: const TextStyle(color: BrandColors.textMuted),
                            hintText: _type == 'free_delivery' ? 'N/A' : '',
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _minOrderController,
                          keyboardType: TextInputType.number,
                          style: const TextStyle(color: BrandColors.textMain),
                          decoration: const InputDecoration(labelText: 'Min Cart Value (\$)', labelStyle: TextStyle(color: BrandColors.textMuted)),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: TextField(
                          controller: _maxUsesController,
                          keyboardType: TextInputType.number,
                          style: const TextStyle(color: BrandColors.textMain),
                          decoration: const InputDecoration(labelText: 'Max Uses (Optional)', labelStyle: TextStyle(color: BrandColors.textMuted), hintText: 'Unlimited'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SwitchListTile(
                    title: const Text('Valid for first order only', style: TextStyle(color: BrandColors.textMain, fontSize: 14)),
                    value: _firstOrderOnly,
                    activeColor: BrandColors.cyan,
                    onChanged: (val) => setModalState(() => _firstOrderOnly = val),
                  ),
                  ListTile(
                    title: Text(_expiryDate == null ? 'Select Expiry Date' : 'Expiry: ${DateFormat('MMM dd, yyyy').format(_expiryDate!)}', style: const TextStyle(color: BrandColors.textMain)),
                    trailing: const Icon(Icons.calendar_today, color: BrandColors.cyan),
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now().add(const Duration(days: 30)),
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 365)),
                      );
                      if (picked != null) {
                        setModalState(() => _expiryDate = picked);
                      }
                    },
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: BrandColors.cyan),
                      onPressed: _createCoupon,
                      child: const Text('Create Coupon', style: TextStyle(color: BrandColors.background, fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            );
          }
        );
      }
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: BrandColors.background,
      appBar: AppBar(
        title: const Text('Promotions & Coupons'),
        backgroundColor: BrandColors.card,
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: BrandColors.cyan,
        onPressed: _showAddCouponModal,
        child: const Icon(Icons.add, color: BrandColors.background),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: BrandColors.cyan))
          : _coupons.isEmpty
              ? const Center(child: Text('No active promotions', style: TextStyle(color: BrandColors.textMuted)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _coupons.length,
                  itemBuilder: (context, index) {
                    final coupon = _coupons[index];
                    final validUntil = DateTime.parse(coupon['endDate']);
                    final isExpired = validUntil.isBefore(DateTime.now());
                    final isActive = coupon['isActive'] == true;
                    
                    return GlassContainer(
                      margin: const EdgeInsets.only(bottom: 16),
                      child: ListTile(
                        leading: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: !isActive || isExpired ? BrandColors.border : BrandColors.cyan.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(Icons.local_offer, color: !isActive || isExpired ? BrandColors.textMuted : BrandColors.cyan),
                        ),
                        title: Row(
                          children: [
                            Text(coupon['code'] ?? '', style: const TextStyle(color: BrandColors.textMain, fontWeight: FontWeight.bold, fontSize: 18)),
                            const SizedBox(width: 8),
                            if (coupon['firstOrderOnly'] == true)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(color: BrandColors.cyan.withOpacity(0.2), borderRadius: BorderRadius.circular(4)),
                                child: const Text('NEW USER', style: TextStyle(color: BrandColors.cyan, fontSize: 9, fontWeight: FontWeight.bold)),
                              )
                          ],
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 4),
                            Text(
                              coupon['description'] != null && coupon['description'].toString().isNotEmpty
                                  ? coupon['description']
                                  : (coupon['type'] == 'percentage'
                                      ? '${coupon['value']}% OFF'
                                      : coupon['type'] == 'free_delivery'
                                          ? 'FREE DELIVERY'
                                          : '\$${coupon['value']} OFF'),
                              style: const TextStyle(color: BrandColors.textMain, fontSize: 13),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Min Cart: \$${coupon['minCartValue']} | Used: ${coupon['usedCount'] ?? 0} times',
                              style: const TextStyle(color: BrandColors.green, fontSize: 12),
                            ),
                            const SizedBox(height: 4),
                            Text('Expires: ${DateFormat('MMM dd, yyyy').format(validUntil)}', style: TextStyle(color: !isActive || isExpired ? BrandColors.red : BrandColors.textMuted, fontSize: 12)),
                          ],
                        ),
                        trailing: isActive && !isExpired
                            ? IconButton(
                                icon: const Icon(Icons.delete_outline, color: BrandColors.red),
                                onPressed: () => _deactivateCoupon(coupon['_id']),
                              )
                            : Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                                decoration: BoxDecoration(color: Colors.white10, borderRadius: BorderRadius.circular(4)),
                                child: const Text('INACTIVE', style: TextStyle(color: BrandColors.textMuted, fontSize: 10, fontWeight: FontWeight.bold)),
                              ),
                      ),
                    );
                  },
                ),
    );
  }
}
