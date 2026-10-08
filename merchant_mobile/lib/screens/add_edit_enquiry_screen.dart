import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/catering_provider.dart';

class AddEditEnquiryScreen extends StatefulWidget {
  final CateringModel? existingEnquiry;

  const AddEditEnquiryScreen({super.key, this.existingEnquiry});

  @override
  State<AddEditEnquiryScreen> createState() => _AddEditEnquiryScreenState();
}

class _AddEditEnquiryScreenState extends State<AddEditEnquiryScreen> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _emailController;
  late TextEditingController _guestsController;
  late TextEditingController _notesController;

  final _nameFocus = FocusNode();
  final _phoneFocus = FocusNode();
  final _emailFocus = FocusNode();
  final _guestsFocus = FocusNode();
  final _notesFocus = FocusNode();

  final ScrollController _scrollController = ScrollController();

  DateTime _selectedDate = DateTime.now().add(const Duration(days: 7));
  String _selectedType = 'Birthday Party';
  String _selectedPackage = 'Custom / Unsure';
  String _selectedStatus = 'new';

  // Event types matching backend schema & admin website
  final List<String> _eventTypes = [
    'Birthday Party',
    'Corporate Event',
    'Wedding',
    'Family Gathering',
    'Anniversary',
    'Other',
  ];

  // Packages matching backend schema & admin website
  final List<String> _packages = [
    'Basic Package',
    'Premium Package',
    'Deluxe Package',
    'Custom / Unsure',
  ];

  // Statuses matching backend schema & admin website
  final List<Map<String, dynamic>> _statuses = [
    {'value': 'new', 'label': 'New', 'color': Color(0xFF2563EB)},
    {'value': 'in_discussion', 'label': 'In Discussion', 'color': Color(0xFFD97706)},
    {'value': 'quotation_sent', 'label': 'Quotation Sent', 'color': Color(0xFF7C3AED)},
    {'value': 'confirmed', 'label': 'Confirmed', 'color': Color(0xFF16A34A)},
    {'value': 'closed', 'label': 'Closed', 'color': Color(0xFF64748B)},
  ];

  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    final e = widget.existingEnquiry;

    _nameController = TextEditingController(text: e?.customerName ?? '');
    _phoneController = TextEditingController(text: e?.customerPhone ?? '');
    _emailController = TextEditingController(text: e?.customerEmail ?? '');
    _guestsController = TextEditingController(text: e != null ? e.guestCount.toString() : '50');
    _notesController = TextEditingController(text: e?.message ?? '');

    if (e != null) {
      _selectedDate = e.eventDate;
      if (_eventTypes.contains(e.eventType)) {
        _selectedType = e.eventType;
      }
      if (_packages.contains(e.packagePreference)) {
        _selectedPackage = e.packagePreference;
      }
      final st = e.status.toLowerCase();
      if (_statuses.any((s) => s['value'] == st)) {
        _selectedStatus = st;
      }
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _guestsController.dispose();
    _notesController.dispose();

    _nameFocus.dispose();
    _phoneFocus.dispose();
    _emailFocus.dispose();
    _guestsFocus.dispose();
    _notesFocus.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 730)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF8B0000),
              onPrimary: Colors.white,
              onSurface: Color(0xFF0F172A),
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _saveEnquiry() async {
    if (!_formKey.currentState!.validate()) return;

    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    final email = _emailController.text.trim();
    final guestCount = int.tryParse(_guestsController.text.trim()) ?? 50;

    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter customer full name')),
      );
      return;
    }
    if (phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter contact phone number')),
      );
      return;
    }
    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter customer email address')),
      );
      return;
    }
    if (guestCount < 1) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Guest count must be at least 1')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final formattedDate =
        '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, "0")}-${_selectedDate.day.toString().padLeft(2, "0")}';

    final data = <String, dynamic>{
      'customerName': name,
      'customerPhone': phone,
      'customerEmail': email,
      'eventDate': formattedDate,
      'eventType': _selectedType,
      'guestCount': guestCount,
      'packagePreference': _selectedPackage,
      'additionalNotes': _notesController.text.trim(),
      'status': _selectedStatus,
    };

    try {
      final provider = context.read<CateringProvider>();
      if (widget.existingEnquiry != null) {
        await provider.updateEnquiry(widget.existingEnquiry!.id, data);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                  const SizedBox(width: 10),
                  Text(
                    'Catering enquiry updated successfully!',
                    style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              backgroundColor: const Color(0xFF16A34A),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          );
        }
      } else {
        await provider.createEnquiry(data);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                  const SizedBox(width: 10),
                  Text(
                    'Catering enquiry recorded successfully!',
                    style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              backgroundColor: const Color(0xFF16A34A),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          );
        }
      }
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error saving enquiry: $e'),
            backgroundColor: const Color(0xFFDC2626),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.existingEnquiry != null;
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final hasKeyboard = bottomInset > 50;

    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFC),
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: Center(
          child: InkWell(
            onTap: () => Navigator.pop(context),
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFEE2E2)),
              ),
              child: const Icon(
                Icons.arrow_back_ios_new_rounded,
                color: Color(0xFF8B0000),
                size: 16,
              ),
            ),
          ),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              isEditing ? 'Edit Catering Enquiry' : 'New Catering Enquiry',
              style: GoogleFonts.poppins(
                color: const Color(0xFF0F172A),
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            Text(
              'Manage event booking & quote details',
              style: GoogleFonts.inter(
                color: const Color(0xFF64748B),
                fontWeight: FontWeight.w500,
                fontSize: 11.5,
              ),
            ),
          ],
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            color: const Color(0xFFF1F5F9),
            height: 1,
          ),
        ),
      ),
      body: SafeArea(
        top: false,
        bottom: false,
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                controller: _scrollController,
                keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.manual,
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Section 1: Contact Information
                      _buildSectionCard(
                        title: 'Contact Information',
                        subtitle: 'Client name, phone number, and official email',
                        icon: Icons.person_rounded,
                        children: [
                          _buildLabel('Full Name', required: true),
                          _buildTextField(
                            controller: _nameController,
                            focusNode: _nameFocus,
                            hintText: 'e.g. Ramesh Kumar',
                            prefixIcon: Icons.person_outline_rounded,
                            validator: (v) => v == null || v.trim().isEmpty ? 'Customer name is required' : null,
                          ),
                          const SizedBox(height: 16),

                          _buildLabel('Phone Number', required: true),
                          _buildTextField(
                            controller: _phoneController,
                            focusNode: _phoneFocus,
                            hintText: '+1 (555) 000-0000',
                            prefixIcon: Icons.phone_outlined,
                            keyboardType: TextInputType.phone,
                            validator: (v) => v == null || v.trim().isEmpty ? 'Phone number is required' : null,
                          ),
                          const SizedBox(height: 16),

                          _buildLabel('Email Address', required: true),
                          _buildTextField(
                            controller: _emailController,
                            focusNode: _emailFocus,
                            hintText: 'customer@example.com',
                            prefixIcon: Icons.mail_outline_rounded,
                            keyboardType: TextInputType.emailAddress,
                            validator: (v) {
                              if (v == null || v.trim().isEmpty) {
                                return 'Email address is required';
                              }
                              if (!v.contains('@') || !v.contains('.')) {
                                return 'Please enter a valid email address';
                              }
                              return null;
                            },
                          ),
                          Padding(
                            padding: const EdgeInsets.only(top: 6, left: 4),
                            child: Text(
                              'Used for sending quote documents and confirmation emails.',
                              style: GoogleFonts.inter(
                                fontSize: 11.5,
                                color: const Color(0xFF64748B),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Section 2: Event Details
                      _buildSectionCard(
                        title: 'Event Details',
                        subtitle: 'Schedule date, event type, guest count, and package',
                        icon: Icons.celebration_rounded,
                        children: [
                          // Event Date
                          _buildLabel('Event Date', required: true),
                          InkWell(
                            onTap: _selectDate,
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              height: 48,
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.calendar_month_rounded, size: 18, color: Color(0xFF8B0000)),
                                  const SizedBox(width: 8),
                                  Text(
                                    '${_selectedDate.day.toString().padLeft(2, '0')}/${_selectedDate.month.toString().padLeft(2, '0')}/${_selectedDate.year}',
                                    style: GoogleFonts.inter(
                                      fontSize: 13.5,
                                      fontWeight: FontWeight.w600,
                                      color: const Color(0xFF0F172A),
                                    ),
                                  ),
                                  const Spacer(),
                                  const Icon(Icons.arrow_drop_down_rounded, color: Color(0xFF64748B)),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Guest Count Stepper & Input
                          _buildLabel('Guest Count', required: true),
                          Row(
                            children: [
                              Container(
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF8FAFC),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: const Color(0xFFE2E8F0)),
                                ),
                                child: Row(
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.remove, size: 18, color: Color(0xFF475569)),
                                      onPressed: () {
                                        final current = int.tryParse(_guestsController.text.trim()) ?? 50;
                                        if (current > 10) {
                                          setState(() {
                                            _guestsController.text = (current - 10).toString();
                                          });
                                        } else if (current > 1) {
                                          setState(() {
                                            _guestsController.text = (current - 1).toString();
                                          });
                                        }
                                      },
                                    ),
                                    SizedBox(
                                      width: 60,
                                      child: TextField(
                                        controller: _guestsController,
                                        focusNode: _guestsFocus,
                                        textAlign: TextAlign.center,
                                        keyboardType: TextInputType.number,
                                        style: GoogleFonts.inter(
                                          fontSize: 15,
                                          fontWeight: FontWeight.bold,
                                          color: const Color(0xFF0F172A),
                                        ),
                                        decoration: const InputDecoration(
                                          border: InputBorder.none,
                                          isDense: true,
                                          contentPadding: EdgeInsets.zero,
                                        ),
                                      ),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.add, size: 18, color: Color(0xFF475569)),
                                      onPressed: () {
                                        final current = int.tryParse(_guestsController.text.trim()) ?? 50;
                                        setState(() {
                                          _guestsController.text = (current + 10).toString();
                                        });
                                      },
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'Estimated number of attendees',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: const Color(0xFF64748B),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // Event Type Chips
                          _buildLabel('Event Type', required: true),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: _eventTypes.map((type) {
                              final isSel = _selectedType == type;
                              return ChoiceChip(
                                label: Text(type),
                                selected: isSel,
                                onSelected: (_) => setState(() => _selectedType = type),
                                labelStyle: GoogleFonts.inter(
                                  fontSize: 12.5,
                                  fontWeight: isSel ? FontWeight.w700 : FontWeight.w500,
                                  color: isSel ? Colors.white : const Color(0xFF334155),
                                ),
                                selectedColor: const Color(0xFF8B0000),
                                backgroundColor: const Color(0xFFF8FAFC),
                                side: BorderSide(
                                  color: isSel ? const Color(0xFF8B0000) : const Color(0xFFE2E8F0),
                                ),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 16),

                          // Package Preference
                          _buildLabel('Package Preference'),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: _packages.map((pkg) {
                              final isSel = _selectedPackage == pkg;
                              return ChoiceChip(
                                label: Text(pkg),
                                selected: isSel,
                                onSelected: (_) => setState(() => _selectedPackage = pkg),
                                labelStyle: GoogleFonts.inter(
                                  fontSize: 12.5,
                                  fontWeight: isSel ? FontWeight.w700 : FontWeight.w500,
                                  color: isSel ? Colors.white : const Color(0xFF334155),
                                ),
                                selectedColor: const Color(0xFF8B0000),
                                backgroundColor: const Color(0xFFF8FAFC),
                                side: BorderSide(
                                  color: isSel ? const Color(0xFF8B0000) : const Color(0xFFE2E8F0),
                                ),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 16),

                          // Status Selection
                          _buildLabel('Enquiry Status'),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: _statuses.map((st) {
                              final isSel = _selectedStatus == st['value'];
                              final Color chipColor = st['color'] as Color;

                              return ChoiceChip(
                                label: Text(st['label'] as String),
                                selected: isSel,
                                onSelected: (_) => setState(() => _selectedStatus = st['value'] as String),
                                labelStyle: GoogleFonts.inter(
                                  fontSize: 12.5,
                                  fontWeight: isSel ? FontWeight.w700 : FontWeight.w500,
                                  color: isSel ? Colors.white : const Color(0xFF334155),
                                ),
                                selectedColor: chipColor,
                                backgroundColor: const Color(0xFFF8FAFC),
                                side: BorderSide(
                                  color: isSel ? chipColor : const Color(0xFFE2E8F0),
                                ),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Section 3: Special Requests / Additional Notes
                      _buildSectionCard(
                        title: 'Special Requests & Notes',
                        subtitle: 'Dietary preferences, venue constraints, or bespoke food items',
                        icon: Icons.notes_rounded,
                        children: [
                          _buildLabel('Additional Notes / Requirements (Optional)'),
                          _buildTextField(
                            controller: _notesController,
                            focusNode: _notesFocus,
                            hintText: 'Details about food preferences, live counters, delivery timing, or budget...',
                            prefixIcon: Icons.edit_note_rounded,
                            maxLines: 4,
                          ),
                          Padding(
                            padding: const EdgeInsets.only(top: 6, left: 4),
                            child: Text(
                              'These notes will be visible to the catering team.',
                              style: GoogleFonts.inter(
                                fontSize: 11.5,
                                color: const Color(0xFF64748B),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ),
            ),

            // Bottom Action Bar
            Container(
              padding: EdgeInsets.only(
                left: 16,
                right: 16,
                top: hasKeyboard ? 10 : 14,
                bottom: (hasKeyboard ? 8 : 14) +
                    math.max(
                      MediaQuery.of(context).padding.bottom,
                      MediaQuery.of(context).viewPadding.bottom,
                    ),
              ),
              decoration: BoxDecoration(
                color: Colors.white,
                border: const Border(
                  top: BorderSide(
                    color: Color(0xFFF1F5F9),
                    width: 1,
                  ),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 16,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: OutlinedButton(
                      onPressed: () {
                        if (hasKeyboard) {
                          FocusScope.of(context).unfocus();
                        } else {
                          Navigator.pop(context);
                        }
                      },
                      style: OutlinedButton.styleFrom(
                        backgroundColor: hasKeyboard ? const Color(0xFFF1F5F9) : const Color(0xFFF8FAFC),
                        side: BorderSide(color: hasKeyboard ? const Color(0xFFCBD5E1) : const Color(0xFFE2E8F0)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
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
                            style: GoogleFonts.inter(
                              color: const Color(0xFF475569),
                              fontWeight: FontWeight.w600,
                              fontSize: 14.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Save / Update button
                  Expanded(
                    flex: 3,
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [
                            Color(0xFF8B0000),
                            Color(0xFF991B1B),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF8B0000).withValues(alpha: 0.35),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: ElevatedButton(
                        onPressed: _isSubmitting ? null : _saveEnquiry,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: _isSubmitting
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    isEditing ? Icons.check_circle_outline_rounded : Icons.add_task_rounded,
                                    size: 18,
                                    color: Colors.white,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    isEditing ? 'Save Changes' : 'Record Enquiry',
                                    style: GoogleFonts.inter(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
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
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFFEE2E2)),
                ),
                child: Icon(icon, color: const Color(0xFF8B0000), size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.poppins(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
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
            ],
          ),
          const SizedBox(height: 14),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          const SizedBox(height: 14),
          ...children,
        ],
      ),
    );
  }

  Widget _buildLabel(String text, {bool required = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Text(
            text,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF1E293B),
            ),
          ),
          if (required) ...[
            const SizedBox(width: 4),
            const Text(
              '*',
              style: TextStyle(
                color: Color(0xFFDC2626),
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    FocusNode? focusNode,
    required String hintText,
    IconData? prefixIcon,
    int maxLines = 1,
    TextInputType keyboardType = TextInputType.text,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      focusNode: focusNode,
      maxLines: maxLines,
      keyboardType: keyboardType,
      validator: validator,
      style: GoogleFonts.inter(
        fontSize: 14,
        color: const Color(0xFF0F172A),
        fontWeight: FontWeight.w500,
      ),
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: GoogleFonts.inter(
          fontSize: 13.5,
          color: const Color(0xFF94A3B8),
          fontWeight: FontWeight.w400,
        ),
        prefixIcon: prefixIcon != null
            ? Icon(prefixIcon, color: const Color(0xFF64748B), size: 18)
            : null,
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 1.2),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 1.2),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF8B0000), width: 1.6),
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
    );
  }
}
