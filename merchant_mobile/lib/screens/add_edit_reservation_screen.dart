import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/reservation_provider.dart';
import '../models/reservation_model.dart';

class AddEditReservationScreen extends StatefulWidget {
  final ReservationModel? existingReservation;

  const AddEditReservationScreen({super.key, this.existingReservation});

  @override
  State<AddEditReservationScreen> createState() => _AddEditReservationScreenState();
}

class _AddEditReservationScreenState extends State<AddEditReservationScreen> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _emailController;
  late TextEditingController _partySizeController;
  late TextEditingController _specialRequestsController;

  final _nameFocus = FocusNode();
  final _phoneFocus = FocusNode();
  final _emailFocus = FocusNode();
  final _partyFocus = FocusNode();
  final _requestsFocus = FocusNode();

  final ScrollController _scrollController = ScrollController();

  DateTime _selectedDate = DateTime.now();
  TimeOfDay _selectedTime = const TimeOfDay(hour: 19, minute: 0);
  String _selectedLocation = 'Indoor';
  String _selectedOccasion = 'Dinner';
  String _selectedStatus = 'confirmed';

  // Seating Areas strictly matching admin website ReservationModal & backend
  final List<Map<String, String>> _locations = [
    {'value': 'Indoor', 'label': 'Indoor (Main Dining)'},
    {'value': 'Outdoor', 'label': 'Outdoor (Patio)'},
    {'value': 'Private', 'label': 'Private Room'},
    {'value': 'Any', 'label': 'Any Available'},
  ];

  // Occasions strictly matching admin website ReservationModal
  final List<String> _occasions = [
    'Dinner',
    'Lunch',
    'Birthday',
    'Anniversary',
    'Corporate',
    'Other',
  ];

  // Statuses strictly matching admin website ReservationModal & backend
  final List<Map<String, dynamic>> _statuses = [
    {'value': 'pending', 'label': 'Pending', 'color': Color(0xFFD97706)},
    {'value': 'confirmed', 'label': 'Confirmed', 'color': Color(0xFF16A34A)},
    {'value': 'seated', 'label': 'Seated', 'color': Color(0xFF2563EB)},
    {'value': 'completed', 'label': 'Completed', 'color': Color(0xFF0D9488)},
    {'value': 'cancelled', 'label': 'Cancelled', 'color': Color(0xFFDC2626)},
  ];

  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    final r = widget.existingReservation;

    _nameController = TextEditingController(text: r?.customerName ?? '');
    _phoneController = TextEditingController(text: r?.customerPhone ?? '');
    _emailController = TextEditingController(text: r?.customerEmail ?? '');
    _partySizeController = TextEditingController(text: r != null ? r.partySize.toString() : '2');
    _specialRequestsController = TextEditingController(text: r?.specialRequests ?? '');

    if (r != null) {
      _selectedDate = r.date;
      final timeParts = r.time.split(':');
      if (timeParts.length == 2) {
        _selectedTime = TimeOfDay(
          hour: int.tryParse(timeParts[0]) ?? 19,
          minute: int.tryParse(timeParts[1]) ?? 0,
        );
      }

      // Normalize existing location to admin web values
      final loc = r.location;
      if (loc == 'Outdoor Seating') {
        _selectedLocation = 'Outdoor';
      } else if (loc == 'Private Room') {
        _selectedLocation = 'Private';
      } else if (loc == 'Main Dining Area') {
        _selectedLocation = 'Indoor';
      } else if (_locations.any((l) => l['value'] == loc)) {
        _selectedLocation = loc;
      }

      // Normalize occasion
      if (r.occasion != null) {
        if (r.occasion == 'Business') {
          _selectedOccasion = 'Corporate';
        } else if (_occasions.contains(r.occasion)) {
          _selectedOccasion = r.occasion!;
        }
      }

      // Normalize status
      final st = r.status.toLowerCase();
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
    _partySizeController.dispose();
    _specialRequestsController.dispose();

    _nameFocus.dispose();
    _phoneFocus.dispose();
    _emailFocus.dispose();
    _partyFocus.dispose();
    _requestsFocus.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
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

  Future<void> _selectTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _selectedTime,
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
      setState(() => _selectedTime = picked);
    }
  }

  Future<void> _saveReservation() async {
    if (!_formKey.currentState!.validate()) return;

    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    final partySize = int.tryParse(_partySizeController.text.trim()) ?? 2;

    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter guest name')),
      );
      return;
    }
    if (phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter contact phone number')),
      );
      return;
    }
    if (partySize < 1) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Party size must be at least 1')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final formattedTime =
        '${_selectedTime.hour.toString().padLeft(2, "0")}:${_selectedTime.minute.toString().padLeft(2, "0")}';
    final formattedDate =
        '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, "0")}-${_selectedDate.day.toString().padLeft(2, "0")}';

    // Payload matching backend Reservation model and Admin ReservationModal.js exactly
    final data = <String, dynamic>{
      'customerName': name,
      'customerPhone': phone,
      'customerEmail': _emailController.text.trim().isEmpty ? null : _emailController.text.trim(),
      'date': formattedDate,
      'time': formattedTime,
      'partySize': partySize,
      'location': _selectedLocation,
      'occasion': _selectedOccasion,
      'specialRequests': _specialRequestsController.text.trim().isEmpty ? null : _specialRequestsController.text.trim(),
      'status': _selectedStatus,
    };

    try {
      final provider = context.read<ReservationProvider>();
      if (widget.existingReservation != null) {
        await provider.updateReservation(widget.existingReservation!.id, data);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                  const SizedBox(width: 10),
                  Text(
                    'Reservation updated successfully!',
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
        await provider.createReservation(data);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                  const SizedBox(width: 10),
                  Text(
                    'Reservation created successfully!',
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
            content: Text('Error saving reservation: $e'),
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
    final isEditing = widget.existingReservation != null;
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
              isEditing ? 'Edit Reservation' : 'New Reservation',
              style: GoogleFonts.poppins(
                color: const Color(0xFF0F172A),
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            Text(
              'Manage guest details & table booking',
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
                      // Section 1: Customer Details (Guest Information)
                      _buildSectionCard(
                        title: 'Guest Information',
                        subtitle: 'Primary contact name, phone, and optional email',
                        icon: Icons.person_rounded,
                        children: [
                          _buildLabel('Full Name', required: true),
                          _buildTextField(
                            controller: _nameController,
                            focusNode: _nameFocus,
                            hintText: 'e.g. John Doe',
                            prefixIcon: Icons.person_outline_rounded,
                            validator: (v) => v == null || v.trim().isEmpty ? 'Guest full name is required' : null,
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

                          _buildLabel('Email Address'),
                          _buildTextField(
                            controller: _emailController,
                            focusNode: _emailFocus,
                            hintText: 'john@example.com',
                            prefixIcon: Icons.mail_outline_rounded,
                            keyboardType: TextInputType.emailAddress,
                          ),
                          Padding(
                            padding: const EdgeInsets.only(top: 6, left: 4),
                            child: Text(
                              'Used for sending booking confirmation emails.',
                              style: GoogleFonts.inter(
                                fontSize: 11.5,
                                color: const Color(0xFF64748B),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Section 2: Booking Info (Reservation Details)
                      _buildSectionCard(
                        title: 'Reservation Details',
                        subtitle: 'Schedule date, time, party size, and seating area',
                        icon: Icons.calendar_today_rounded,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    _buildLabel('Date', required: true),
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
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    _buildLabel('Time', required: true),
                                    InkWell(
                                      onTap: _selectTime,
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
                                            const Icon(Icons.access_time_rounded, size: 18, color: Color(0xFF8B0000)),
                                            const SizedBox(width: 8),
                                            Text(
                                              _selectedTime.format(context),
                                              style: GoogleFonts.inter(
                                                fontSize: 13.5,
                                                fontWeight: FontWeight.w600,
                                                color: const Color(0xFF0F172A),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // Party Size Stepper & Input
                          _buildLabel('Party Size (Guests)', required: true),
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
                                        final current = int.tryParse(_partySizeController.text.trim()) ?? 2;
                                        if (current > 1) {
                                          setState(() {
                                            _partySizeController.text = (current - 1).toString();
                                          });
                                        }
                                      },
                                    ),
                                    SizedBox(
                                      width: 50,
                                      child: TextField(
                                        controller: _partySizeController,
                                        focusNode: _partyFocus,
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
                                        final current = int.tryParse(_partySizeController.text.trim()) ?? 2;
                                        setState(() {
                                          _partySizeController.text = (current + 1).toString();
                                        });
                                      },
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'Number of guests attending',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: const Color(0xFF64748B),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // Status Selection
                          _buildLabel('Status'),
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
                          const SizedBox(height: 16),

                          // Seating Area Selection
                          _buildLabel('Seating Area'),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: _locations.map((loc) {
                              final isSel = _selectedLocation == loc['value'];
                              return ChoiceChip(
                                label: Text(loc['label']!),
                                selected: isSel,
                                onSelected: (_) => setState(() => _selectedLocation = loc['value']!),
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

                          // Occasion Selection
                          _buildLabel('Occasion'),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: _occasions.map((occ) {
                              final isSel = _selectedOccasion == occ;
                              return ChoiceChip(
                                label: Text(occ),
                                selected: isSel,
                                onSelected: (_) => setState(() => _selectedOccasion = occ),
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
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Section 3: Special Requests
                      _buildSectionCard(
                        title: 'Special Requests',
                        subtitle: 'Guest preferences and dietary notes for floor staff',
                        icon: Icons.notes_rounded,
                        children: [
                          _buildLabel('Notes & Requests (Optional)'),
                          _buildTextField(
                            controller: _specialRequestsController,
                            focusNode: _requestsFocus,
                            hintText: 'E.g. Allergies, high chair required, window seat preferred...',
                            prefixIcon: Icons.edit_note_rounded,
                            maxLines: 4,
                          ),
                          Padding(
                            padding: const EdgeInsets.only(top: 6, left: 4),
                            child: Text(
                              'These notes will be visible to the floor staff.',
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
                        onPressed: _isSubmitting ? null : _saveReservation,
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
                                    isEditing ? 'Save Changes' : 'Confirm Reservation',
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
