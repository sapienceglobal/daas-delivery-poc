import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/reservation_provider.dart';

class ReservationBottomSheet extends StatefulWidget {
  const ReservationBottomSheet({Key? key}) : super(key: key);

  @override
  State<ReservationBottomSheet> createState() => _ReservationBottomSheetState();
}

class _ReservationBottomSheetState extends State<ReservationBottomSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _partySizeController = TextEditingController(text: '2');
  final _specialRequestsController = TextEditingController();
  
  DateTime _selectedDate = DateTime.now();
  TimeOfDay _selectedTime = const TimeOfDay(hour: 19, minute: 0); // Default 7 PM
  String _selectedLocation = 'Indoor';
  String _selectedOccasion = 'Dinner';

  final List<String> _locations = ['Indoor', 'Outdoor', 'Private', 'Any'];
  final List<String> _occasions = ['Dinner', 'Lunch', 'Birthday', 'Anniversary', 'Corporate', 'Other'];

  bool _isSubmitting = false;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _partySizeController.dispose();
    _specialRequestsController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _selectTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _selectedTime,
    );
    if (picked != null) {
      setState(() => _selectedTime = picked);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isSubmitting = true);
    
    final formattedTime = '${_selectedTime.hour.toString().padLeft(2, "0")}:${_selectedTime.minute.toString().padLeft(2, "0")}';
    
    final data = {
      'customerName': _nameController.text.trim(),
      'customerPhone': _phoneController.text.trim(),
      'customerEmail': _emailController.text.trim(),
      'date': _selectedDate.toIso8601String(),
      'time': formattedTime,
      'partySize': int.tryParse(_partySizeController.text) ?? 2,
      'location': _selectedLocation,
      'occasion': _selectedOccasion,
      'specialRequests': _specialRequestsController.text.trim(),
      'status': 'confirmed' // default auto-confirm if created by merchant
    };

    try {
      await context.read<ReservationProvider>().createReservation(data);
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Reservation created successfully!')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: \$e')));
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + MediaQuery.of(context).padding.bottom + 12,
        left: 20,
        right: 20,
        top: 12,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(bottom: 14),
              width: 38,
              height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFFCBD5E1),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF1F2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.table_restaurant_rounded, color: Color(0xFF881337), size: 18),
                  ),
                  const SizedBox(width: 10),
                  Text('New Reservation', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
                ],
              ),
              IconButton(icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B)), onPressed: () => Navigator.pop(context)),
            ],
          ),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          const SizedBox(height: 14),
          Flexible(
            child: SingleChildScrollView(
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Date & Time Row
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildFieldLabel('Date', required: true),
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
                                  alignment: Alignment.centerLeft,
                                  child: Row(
                                    children: [
                                      const Icon(Icons.calendar_today_rounded, size: 16, color: Color(0xFF881337)),
                                      const SizedBox(width: 8),
                                      Text(
                                        '${_selectedDate.day.toString().padLeft(2, '0')}/${_selectedDate.month.toString().padLeft(2, '0')}/${_selectedDate.year}',
                                        style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF0F172A), fontWeight: FontWeight.w500),
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
                              _buildFieldLabel('Time', required: true),
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
                                  alignment: Alignment.centerLeft,
                                  child: Row(
                                    children: [
                                      const Icon(Icons.access_time_rounded, size: 16, color: Color(0xFF881337)),
                                      const SizedBox(width: 8),
                                      Text(
                                        _selectedTime.format(context),
                                        style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF0F172A), fontWeight: FontWeight.w500),
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
                    const SizedBox(height: 14),
                    _buildFieldLabel('Customer Name', required: true),
                    TextFormField(
                      controller: _nameController,
                      decoration: _fieldDec('e.g. Ramesh Kumar', prefixIcon: Icons.person_outline_rounded),
                      validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: 14),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildFieldLabel('Phone', required: true),
                              TextFormField(
                                controller: _phoneController,
                                decoration: _fieldDec('+1 234 567 8900', prefixIcon: Icons.phone_outlined),
                                keyboardType: TextInputType.phone,
                                validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildFieldLabel('Guests', required: true),
                              TextFormField(
                                controller: _partySizeController,
                                decoration: _fieldDec('2', prefixIcon: Icons.group_outlined),
                                keyboardType: TextInputType.number,
                                validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    _buildFieldLabel('Email (Optional)'),
                    TextFormField(
                      controller: _emailController,
                      decoration: _fieldDec('email@example.com', prefixIcon: Icons.mail_outline_rounded),
                      keyboardType: TextInputType.emailAddress,
                    ),
                    const SizedBox(height: 14),
                    // Seating Area & Occasion Bottom Sheet Pickers
                    Row(
                      children: [
                        Expanded(
                          child: _buildSheetDropdown(
                            label: 'Seating Area',
                            value: _selectedLocation,
                            sheetTitle: 'Select Seating Area',
                            prefixIcon: Icons.chair_rounded,
                            options: _locations,
                            onSelected: (val) => setState(() => _selectedLocation = val),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildSheetDropdown(
                            label: 'Occasion',
                            value: _selectedOccasion,
                            sheetTitle: 'Select Occasion',
                            prefixIcon: Icons.celebration_outlined,
                            options: _occasions,
                            onSelected: (val) => setState(() => _selectedOccasion = val),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    _buildFieldLabel('Special Requests'),
                    TextFormField(
                      controller: _specialRequestsController,
                      decoration: _fieldDec('Window table, high chair, dietary preferences...'),
                      maxLines: 2,
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF881337),
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: _isSubmitting ? null : _submit,
              child: _isSubmitting
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Save Reservation', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildFieldLabel(String label, {bool required = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6, left: 2),
      child: RichText(
        text: TextSpan(
          text: label,
          style: GoogleFonts.inter(
            color: const Color(0xFF1E293B),
            fontWeight: FontWeight.w600,
            fontSize: 12.5,
          ),
          children: [
            if (required)
              const TextSpan(
                text: ' *',
                style: TextStyle(color: Color(0xFFDC2626), fontWeight: FontWeight.bold),
              ),
          ],
        ),
      ),
    );
  }

  InputDecoration _fieldDec(String hint, {IconData? prefixIcon}) {
    return InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      filled: true,
      fillColor: Colors.white,
      prefixIcon: prefixIcon != null ? Icon(prefixIcon, color: const Color(0xFF881337), size: 18) : null,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 1.2)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 1.2)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF881337), width: 1.8)),
    );
  }

  Widget _buildSheetDropdown({
    required String label,
    required String value,
    required String sheetTitle,
    required List<String> options,
    required ValueChanged<String> onSelected,
    IconData? prefixIcon,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildFieldLabel(label),
        InkWell(
          onTap: () {
            FocusScope.of(context).unfocus();
            showModalBottomSheet<String>(
              context: context,
              isScrollControlled: true,
              backgroundColor: Colors.transparent,
              builder: (sheetCtx) {
                return Container(
                  constraints: BoxConstraints(
                    maxHeight: MediaQuery.of(sheetCtx).size.height * 0.65,
                  ),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                  ),
                  child: SafeArea(
                    top: false,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Center(
                          child: Container(
                            margin: const EdgeInsets.only(top: 12, bottom: 8),
                            width: 38,
                            height: 4,
                            decoration: BoxDecoration(
                              color: const Color(0xFFCBD5E1),
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(20, 8, 12, 12),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFFF1F2),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(prefixIcon ?? Icons.tune_rounded, color: const Color(0xFF881337), size: 18),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  sheetTitle,
                                  style: GoogleFonts.poppins(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFF0F172A),
                                  ),
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B)),
                                onPressed: () => Navigator.pop(sheetCtx),
                              ),
                            ],
                          ),
                        ),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        Flexible(
                          child: ListView.separated(
                            shrinkWrap: true,
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            itemCount: options.length,
                            separatorBuilder: (_, index) => const Divider(height: 1, color: Color(0xFFF8FAFC)),
                            itemBuilder: (ctx, i) {
                              final opt = options[i];
                              final isSel = opt == value;
                              return InkWell(
                                onTap: () => Navigator.pop(sheetCtx, opt),
                                borderRadius: BorderRadius.circular(12),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                  decoration: BoxDecoration(
                                    color: isSel ? const Color(0xFFFFF1F2) : Colors.transparent,
                                    borderRadius: BorderRadius.circular(12),
                                    border: isSel ? Border.all(color: const Color(0xFFFECDD3)) : null,
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          opt,
                                          style: GoogleFonts.inter(
                                            fontSize: 13.5,
                                            fontWeight: isSel ? FontWeight.w700 : FontWeight.w500,
                                            color: isSel ? const Color(0xFF881337) : const Color(0xFF1E293B),
                                          ),
                                        ),
                                      ),
                                      if (isSel)
                                        const Icon(Icons.check_circle_rounded, color: Color(0xFF881337), size: 18),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 8),
                      ],
                    ),
                  ),
                );
              },
            ).then((chosen) {
              if (chosen != null) onSelected(chosen);
            });
          },
          borderRadius: BorderRadius.circular(12),
          child: Container(
            height: 48,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    value,
                    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: const Color(0xFF0F172A)),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF64748B), size: 20),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
