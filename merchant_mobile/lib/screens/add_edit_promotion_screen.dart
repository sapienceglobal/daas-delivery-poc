import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../models/promotion_model.dart';
import '../providers/promotion_provider.dart';

class AddEditPromotionScreen extends StatefulWidget {
  final PromotionModel? promo;

  const AddEditPromotionScreen({super.key, this.promo});

  @override
  State<AddEditPromotionScreen> createState() => _AddEditPromotionScreenState();
}

class _AddEditPromotionScreenState extends State<AddEditPromotionScreen> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _codeController;
  late TextEditingController _nameController;
  late TextEditingController _descController;
  late TextEditingController _valueController;
  late TextEditingController _minCartController;
  late TextEditingController _minOrdersController;
  late TextEditingController _maxUsesController;

  final _codeFocus = FocusNode();
  final _nameFocus = FocusNode();
  final _descFocus = FocusNode();
  final _valueFocus = FocusNode();
  final _minCartFocus = FocusNode();
  final _minOrdersFocus = FocusNode();
  final _maxUsesFocus = FocusNode();

  String _promoType = 'Coupon';
  String _discountType = 'percentage'; // 'percentage' or 'flat'
  String _paymentMethod = 'All Methods';
  String _targetAudience = 'All Users';
  String _targetGroup = 'Family';
  DateTime? _endDate;
  DateTime _startDate = DateTime.now();
  bool _firstOrderOnly = false;
  bool _isActive = true;
  bool _isSaving = false;

  final List<String> _promoTypes = ['Coupon', 'Offer', 'Seasonal Offer', 'Combo Offer'];
  final List<String> _paymentMethods = ['All Methods', 'Credit Card', 'Apple Pay', 'Cash on Delivery'];
  final List<String> _targetGroups = ['Family', 'Friends', 'Corporate', 'Others'];

  @override
  void initState() {
    super.initState();
    final p = widget.promo;

    _codeController = TextEditingController(text: p?.code ?? '');
    _nameController = TextEditingController(text: p?.name ?? '');
    _descController = TextEditingController(text: p?.description ?? '');
    _valueController = TextEditingController(text: p != null ? p.value.toString() : '');
    _minCartController = TextEditingController(text: p != null && p.minCartValue > 0 ? p.minCartValue.toString() : '');
    _minOrdersController = TextEditingController(text: p != null && p.minOrdersRequired > 0 ? p.minOrdersRequired.toString() : '');
    _maxUsesController = TextEditingController(text: p?.maxUses != null ? p!.maxUses.toString() : '');

    if (p != null) {
      _promoType = _promoTypes.contains(p.promoType) ? p.promoType : 'Coupon';
      _discountType = (p.type == 'fixed' || p.type.isEmpty) ? 'flat' : p.type;
      String pm = p.allowedPaymentMethods.isNotEmpty ? p.allowedPaymentMethods.first : 'All Methods';
      if (pm == 'All') pm = 'All Methods';
      _paymentMethod = _paymentMethods.contains(pm) ? pm : 'All Methods';
      _targetAudience = p.targetGroup == 'All Users' ? 'All Users' : 'Specific Group';
      _targetGroup = p.targetGroup == 'All Users' ? 'Family' : p.targetGroup;
      _endDate = p.endDate;
      _startDate = p.startDate;
      _firstOrderOnly = p.firstOrderOnly;
      _isActive = p.isActive;
    } else {
      _endDate = DateTime.now().add(const Duration(days: 30));
    }
  }

  @override
  void dispose() {
    _codeController.dispose();
    _nameController.dispose();
    _descController.dispose();
    _valueController.dispose();
    _minCartController.dispose();
    _minOrdersController.dispose();
    _maxUsesController.dispose();

    _codeFocus.dispose();
    _nameFocus.dispose();
    _descFocus.dispose();
    _valueFocus.dispose();
    _minCartFocus.dispose();
    _minOrdersFocus.dispose();
    _maxUsesFocus.dispose();
    super.dispose();
  }

  Future<void> _pickExpiryDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _endDate ?? now.add(const Duration(days: 30)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 730)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFFEA580C),
              onPrimary: Colors.white,
              onSurface: Color(0xFF0F172A),
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => _endDate = picked);
    }
  }

  Future<void> _savePromotion() async {
    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please correct the errors in the form'),
          backgroundColor: Color(0xFFDC2626),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    if (_endDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select an expiry date'),
          backgroundColor: Color(0xFFDC2626),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() => _isSaving = true);

    final payload = {
      'code': _codeController.text.trim().toUpperCase(),
      'name': _nameController.text.trim().isEmpty ? _codeController.text.trim().toUpperCase() : _nameController.text.trim(),
      'promoType': _promoType,
      'type': _discountType,
      'value': double.tryParse(_valueController.text.trim()) ?? 0.0,
      'minCartValue': double.tryParse(_minCartController.text.trim()) ?? 0.0,
      'firstOrderOnly': _firstOrderOnly,
      'minOrdersRequired': _firstOrderOnly ? 0 : (int.tryParse(_minOrdersController.text.trim()) ?? 0),
      'allowedPaymentMethods': _paymentMethod == 'All Methods' ? ['All'] : [_paymentMethod],
      'startDate': _startDate.toIso8601String(),
      'endDate': _endDate!.toIso8601String(),
      'maxUses': _maxUsesController.text.trim().isNotEmpty ? int.tryParse(_maxUsesController.text.trim()) : null,
      'targetGroup': _targetAudience == 'All Users' ? 'All Users' : _targetGroup,
      'description': _descController.text.trim(),
      'isActive': _isActive,
    };

    try {
      final provider = context.read<PromotionProvider>();
      if (widget.promo == null) {
        await provider.createPromotion(payload);
      } else {
        await provider.updatePromotion(widget.promo!.id, payload);
      }

      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                const SizedBox(width: 10),
                Text(
                  widget.promo == null ? 'Promotion created successfully!' : 'Promotion updated successfully!',
                  style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                ),
              ],
            ),
            backgroundColor: const Color(0xFF16A34A),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save promotion: $e'),
            backgroundColor: const Color(0xFFDC2626),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.promo != null;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        leading: Padding(
          padding: const EdgeInsets.only(left: 12),
          child: Center(
            child: InkWell(
              onTap: () => Navigator.of(context).pop(),
              borderRadius: BorderRadius.circular(12),
              child: Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF7ED),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFFFEDD5)),
                ),
                child: const Icon(
                  Icons.arrow_back_rounded,
                  color: Color(0xFFEA580C),
                  size: 20,
                ),
              ),
            ),
          ),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              isEdit ? 'Edit Promotion' : 'Create Promotion',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF0F172A),
              ),
            ),
            Text(
              'Lassi Lounge Deals & Discounts',
              style: GoogleFonts.inter(
                fontSize: 12,
                color: const Color(0xFF64748B),
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            color: Colors.grey.shade200,
            height: 1,
          ),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.manual,
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
                child: Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      // ── Section 1: Coupon Identity & Type ──
                      _buildSectionCard(
                        title: 'Promotion Identity',
                        icon: Icons.confirmation_number_outlined,
                        subtitle: 'Code & Category',
                        children: [
                          _buildTextField(
                            controller: _codeController,
                            focusNode: _codeFocus,
                            label: 'Coupon Code *',
                            hintText: 'e.g. SUMMER30',
                            prefixIcon: Icons.local_offer_outlined,
                            textCapitalization: TextCapitalization.characters,
                            isRequired: true,
                            validator: (v) {
                              if (v == null || v.trim().isEmpty) {
                                return 'Coupon code is required';
                              }
                              if (v.trim().length < 3) {
                                return 'Code must be at least 3 characters';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 14),
                          _buildTextField(
                            controller: _nameController,
                            focusNode: _nameFocus,
                            label: 'Name',
                            hintText: 'e.g. Summer Special 30% Off',
                            prefixIcon: Icons.campaign_outlined,
                            isRequired: false,
                          ),
                          const SizedBox(height: 14),
                          _buildDropdownField<String>(
                            label: 'Promo Type',
                            value: _promoType,
                            items: _promoTypes,
                            prefixIcon: Icons.category_outlined,
                            onChanged: (val) {
                              if (val != null) setState(() => _promoType = val);
                            },
                          ),
                          const SizedBox(height: 14),
                          _buildTextField(
                            controller: _descController,
                            focusNode: _descFocus,
                            label: 'Description',
                            hintText: 'Brief details about the offer...',
                            prefixIcon: Icons.notes_rounded,
                            maxLines: 3,
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // ── Section 2: Discount & Rules ──
                      _buildSectionCard(
                        title: 'Discount & Pricing Rules',
                        icon: Icons.percent_rounded,
                        subtitle: 'Values & thresholds',
                        children: [
                          // Segmented Discount Type Selector
                          Text(
                            'Discount Type *',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF334155),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: _buildDiscountTypePill(
                                   typeKey: 'percentage',
                                  label: 'Percentage (%)',
                                  icon: Icons.percent_rounded,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _buildDiscountTypePill(
                                  typeKey: 'flat',
                                  label: 'Flat Amount (\$)',
                                  icon: Icons.attach_money_rounded,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: _buildTextField(
                                  controller: _valueController,
                                  focusNode: _valueFocus,
                                  label: 'Value *',
                                  hintText: _discountType == 'percentage' ? 'e.g. 30' : 'e.g. 10',
                                  prefixIcon: _discountType == 'percentage' ? Icons.percent_rounded : Icons.attach_money_rounded,
                                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                  isRequired: true,
                                  validator: (v) {
                                    if (v == null || v.trim().isEmpty) return 'Value is required';
                                    final parsed = double.tryParse(v.trim());
                                    if (parsed == null || parsed <= 0) return 'Must be > 0';
                                    if (_discountType == 'percentage' && parsed > 100) return 'Max 100%';
                                    return null;
                                  },
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _buildTextField(
                                  controller: _minCartController,
                                  focusNode: _minCartFocus,
                                  label: 'Min. Cart Value',
                                  hintText: 'e.g. 20',
                                  prefixIcon: Icons.shopping_bag_outlined,
                                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // ── Section 3: Validity & Usage Limits ──
                      _buildSectionCard(
                        title: 'Validity & Usage Limits',
                        icon: Icons.access_time_rounded,
                        subtitle: 'Expiry & restrictions',
                        children: [
                          // Expiry Date Picker Card
                          Text(
                            'Expiry Date *',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF334155),
                            ),
                          ),
                          const SizedBox(height: 6),
                          InkWell(
                            onTap: _pickExpiryDate,
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.grey.shade200),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 34,
                                    height: 34,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFFF7ED),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Icon(
                                      Icons.calendar_month_rounded,
                                      color: Color(0xFFEA580C),
                                      size: 18,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          _endDate != null
                                              ? DateFormat('EEEE, dd MMM yyyy').format(_endDate!)
                                              : 'Choose expiry date',
                                          style: GoogleFonts.inter(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600,
                                            color: const Color(0xFF0F172A),
                                          ),
                                        ),
                                        Text(
                                          _endDate != null
                                              ? 'Active until 11:59 PM'
                                              : 'Tap to select coupon expiration',
                                          style: GoogleFonts.inter(
                                            fontSize: 11,
                                            color: const Color(0xFF64748B),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const Icon(
                                    Icons.arrow_forward_ios_rounded,
                                    size: 14,
                                    color: Color(0xFF94A3B8),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 14),

                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: _buildTextField(
                                  controller: _maxUsesController,
                                  focusNode: _maxUsesFocus,
                                  label: 'Max Uses (Limit)',
                                  hintText: 'e.g. 100 (blank for unlimited)',
                                  prefixIcon: Icons.repeat_rounded,
                                  keyboardType: TextInputType.number,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _buildTextField(
                                  controller: _minOrdersController,
                                  focusNode: _minOrdersFocus,
                                  label: 'Min. Past Orders',
                                  hintText: _firstOrderOnly ? 'N/A' : 'e.g. 5 (0 for all)',
                                  prefixIcon: Icons.history_rounded,
                                  keyboardType: TextInputType.number,
                                  enabled: !_firstOrderOnly,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),

                          // Switch Tiles: First Time Customers Only & Active Status
                          _buildSwitchTile(
                            title: 'First Time Customers Only',
                            subtitle: 'Restrict this discount exclusively to brand-new customers',
                            icon: Icons.person_add_alt_1_rounded,
                            value: _firstOrderOnly,
                            onChanged: (val) {
                              setState(() {
                                _firstOrderOnly = val;
                                if (_firstOrderOnly) {
                                  _minOrdersController.clear();
                                }
                              });
                            },
                          ),
                          const SizedBox(height: 10),
                          _buildSwitchTile(
                            title: 'Active Promotion',
                            subtitle: 'When enabled, customers can apply this promo immediately',
                            icon: Icons.power_settings_new_rounded,
                            value: _isActive,
                            onChanged: (val) => setState(() => _isActive = val),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // ── Section 4: Targeting & Payments ──
                      _buildSectionCard(
                        title: 'Targeting & Payment Methods',
                        icon: Icons.group_work_outlined,
                        subtitle: 'Customer groups & tender',
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: _buildDropdownField<String>(
                                  label: 'Target Audience',
                                  value: _targetAudience,
                                  items: ['All Users', 'Specific Group'],
                                  prefixIcon: Icons.people_outline_rounded,
                                  onChanged: (val) {
                                    if (val != null) setState(() => _targetAudience = val);
                                  },
                                ),
                              ),
                              if (_targetAudience == 'Specific Group') ...[
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _buildDropdownField<String>(
                                    label: 'Select Group',
                                    value: _targetGroup,
                                    items: _targetGroups,
                                    prefixIcon: Icons.group_add_outlined,
                                    onChanged: (val) {
                                      if (val != null) setState(() => _targetGroup = val);
                                    },
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 14),
                          _buildDropdownField<String>(
                            label: 'Required Payment',
                            value: _paymentMethod,
                            items: _paymentMethods,
                            prefixIcon: Icons.payment_rounded,
                            onChanged: (val) {
                              if (val != null) setState(() => _paymentMethod = val);
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
            ),

            // ── Sticky Bottom Action Bar ──
            _buildBottomActionBar(isEdit),
          ],
        ),
      ),
    );
  }

  // ── Segmented Discount Type Pill ──
  Widget _buildDiscountTypePill({
    required String typeKey,
    required String label,
    required IconData icon,
  }) {
    final isSelected = _discountType == typeKey;

    return InkWell(
      onTap: () => setState(() => _discountType = typeKey),
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFFFF7ED) : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? const Color(0xFFEA580C) : Colors.grey.shade200,
            width: isSelected ? 1.8 : 1.0,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? const Color(0xFFEA580C) : const Color(0xFF64748B),
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? const Color(0xFFEA580C) : const Color(0xFF64748B),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Reusable Section Card Builder (Salon style + Lassi Lounge Theme) ──
  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    String? subtitle,
    required List<Widget> children,
  }) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF7ED),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: const Color(0xFFEA580C), size: 17),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                    if (subtitle != null)
                      Text(
                        subtitle,
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: const Color(0xFF64748B),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Divider(color: Colors.grey.shade100, height: 1),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    );
  }

  // ── Reusable Text Field Builder ──
  Widget _buildTextField({
    required TextEditingController controller,
    required FocusNode focusNode,
    required String label,
    required String hintText,
    required IconData prefixIcon,
    bool isRequired = false,
    int maxLines = 1,
    TextInputType keyboardType = TextInputType.text,
    TextCapitalization textCapitalization = TextCapitalization.none,
    String? Function(String?)? validator,
    bool enabled = true,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: enabled ? const Color(0xFF334155) : const Color(0xFF94A3B8),
              ),
            ),
            if (isRequired)
              const Text(
                ' *',
                style: TextStyle(color: Color(0xFFDC2626), fontWeight: FontWeight.bold),
              ),
          ],
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          focusNode: focusNode,
          enabled: enabled,
          scrollPadding: const EdgeInsets.only(top: 20.0, bottom: 44.0),
          maxLines: maxLines,
          keyboardType: keyboardType,
          textCapitalization: textCapitalization,
          validator: validator,
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: enabled ? const Color(0xFF0F172A) : const Color(0xFF94A3B8),
          ),
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: GoogleFonts.inter(
              fontSize: 13,
              color: const Color(0xFF94A3B8),
            ),
            filled: true,
            fillColor: enabled ? const Color(0xFFF8FAFC) : const Color(0xFFF1F5F9),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            prefixIcon: Padding(
              padding: const EdgeInsets.only(left: 12, right: 10),
              child: Icon(
                prefixIcon,
                size: 19,
                color: enabled ? const Color(0xFFEA580C) : const Color(0xFF94A3B8),
              ),
            ),
            prefixIconConstraints: const BoxConstraints(minWidth: 40, minHeight: 40),
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
              borderSide: const BorderSide(color: Color(0xFFEA580C), width: 1.6),
            ),
            disabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey.shade200),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFDC2626), width: 1.2),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFDC2626), width: 1.6),
            ),
          ),
        ),
      ],
    );
  }

  // ── Reusable Dropdown Tile with Modal Bottom Sheet ──
  Widget _buildDropdownField<T>({
    required String label,
    required T value,
    required List<T> items,
    required IconData prefixIcon,
    required void Function(T?) onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF334155),
          ),
        ),
        const SizedBox(height: 6),
        InkWell(
          onTap: () => _showSelectorBottomSheet<T>(
            label: label,
            selectedValue: value,
            items: items,
            prefixIcon: prefixIcon,
            onChanged: onChanged,
          ),
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Row(
              children: [
                Icon(prefixIcon, size: 19, color: const Color(0xFFEA580C)),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    value.toString(),
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: const Icon(
                    Icons.keyboard_arrow_down_rounded,
                    size: 18,
                    color: Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _showSelectorBottomSheet<T>({
    required String label,
    required T selectedValue,
    required List<T> items,
    required IconData prefixIcon,
    required void Function(T?) onChanged,
  }) {
    FocusScope.of(context).unfocus();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.65,
          ),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Drag handle
              Center(
                child: Container(
                  margin: const EdgeInsets.only(top: 12, bottom: 8),
                  width: 44,
                  height: 4.5,
                  decoration: BoxDecoration(
                    color: const Color(0xFFCBD5E1),
                    borderRadius: BorderRadius.circular(2.5),
                  ),
                ),
              ),

              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF7ED),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        prefixIcon,
                        color: const Color(0xFFEA580C),
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Select $label',
                            style: GoogleFonts.poppins(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                          Text(
                            'Choose the applicable option for this promo',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(ctx),
                      icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B)),
                    ),
                  ],
                ),
              ),

              const Divider(height: 1, color: Color(0xFFF1F5F9)),

              // Options List
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final item = items[index];
                    final isSelected = item == selectedValue;
                    final subtitle = _getOptionSubtitle(item.toString());

                    return InkWell(
                      onTap: () {
                        onChanged(item);
                        Navigator.pop(ctx);
                      },
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFFFFF7ED) : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: isSelected ? const Color(0xFFEA580C) : const Color(0xFFE2E8F0),
                            width: isSelected ? 1.6 : 1.0,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: isSelected ? const Color(0xFFEA580C) : Colors.white,
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                isSelected ? Icons.check_rounded : prefixIcon,
                                size: 15,
                                color: isSelected ? Colors.white : const Color(0xFF64748B),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.toString(),
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                                      color: isSelected ? const Color(0xFFEA580C) : const Color(0xFF0F172A),
                                    ),
                                  ),
                                  if (subtitle.isNotEmpty)
                                    Text(
                                      subtitle,
                                      style: GoogleFonts.inter(
                                        fontSize: 11.5,
                                        color: const Color(0xFF64748B),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                            if (isSelected)
                              const Icon(
                                Icons.check_circle_rounded,
                                color: Color(0xFFEA580C),
                                size: 20,
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),

              SizedBox(
                height: math.max(
                      MediaQuery.of(ctx).padding.bottom,
                      MediaQuery.of(ctx).viewPadding.bottom,
                    ) + 16,
              ),
            ],
          ),
        );
      },
    );
  }

  String _getOptionSubtitle(String opt) {
    switch (opt) {
      case 'Coupon':
        return 'Standard promo code applied by customer at checkout';
      case 'Offer':
        return 'Direct deal applied automatically to eligible items';
      case 'Seasonal Offer':
        return 'Special festive, weekend, or holiday seasonal discount';
      case 'Combo Offer':
        return 'Exclusive multi-item bundle or pairing promotion';
      case 'All Users':
        return 'Applicable to every registered and new customer';
      case 'Specific Group':
        return 'Restricted to selected customer loyalty cohorts';
      case 'Family':
        return 'Family pack and group customer segment';
      case 'Friends':
        return 'Social and casual hangout cohort';
      case 'Corporate':
        return 'Business and office bulk ordering accounts';
      case 'Others':
        return 'General segmented customer cohort';
      case 'All':
        return 'Valid across all digital and cash payment tenders';
      case 'Credit Card':
        return 'Online credit/debit card payment gateway';
      case 'Apple Pay':
        return 'Apple Pay mobile wallet checkout';
      case 'Cash on Delivery':
        return 'Pay at doorstep upon receiving order';
      default:
        return '';
    }
  }

  // ── Reusable Switch Tile Builder ──
  Widget _buildSwitchTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required bool value,
    required void Function(bool) onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: value ? const Color(0xFFFFF7ED) : Colors.grey.shade100,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              icon,
              size: 17,
              color: value ? const Color(0xFFEA580C) : const Color(0xFF94A3B8),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                Text(
                  subtitle,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: const Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            activeThumbColor: const Color(0xFFEA580C),
            activeTrackColor: const Color(0xFFFFEDD5),
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }

  Widget _buildBottomActionBar(bool isEdit) {
    final hasKeyboard = MediaQuery.of(context).viewInsets.bottom > 50;
    final bottomInset = hasKeyboard
        ? 8.0
        : (14.0 +
            math.max(
              MediaQuery.of(context).padding.bottom,
              MediaQuery.of(context).viewPadding.bottom,
            ));
    return Container(
      padding: EdgeInsets.fromLTRB(16, hasKeyboard ? 10 : 12, 16, bottomInset),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey.shade200)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: OutlinedButton(
              onPressed: _isSaving
                  ? null
                  : () {
                      if (hasKeyboard) {
                        FocusScope.of(context).unfocus();
                      } else {
                        Navigator.of(context).pop();
                      }
                    },
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF475569),
                backgroundColor: hasKeyboard ? const Color(0xFFF1F5F9) : Colors.transparent,
                side: BorderSide(color: hasKeyboard ? const Color(0xFFCBD5E1) : Colors.grey.shade300),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (hasKeyboard) ...[
                    const Icon(Icons.keyboard_hide_rounded, size: 18, color: Color(0xFF475569)),
                    const SizedBox(width: 6),
                  ],
                  Text(
                    hasKeyboard ? 'Done' : 'Cancel',
                    style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 3,
            child: Container(
              height: 48,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFEA580C), Color(0xFFDC2626)],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFEA580C).withValues(alpha: 0.35),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ElevatedButton(
                onPressed: _isSaving ? null : _savePromotion,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  shadowColor: Colors.transparent,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _isSaving
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
                          const SizedBox(width: 8),
                          Text(
                            isEdit ? 'Update Promo' : 'Create Promo',
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
