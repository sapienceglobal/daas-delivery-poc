import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:go_router/go_router.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../providers/catering_provider.dart';
import '../providers/auth_provider.dart';

class CateringScreen extends StatefulWidget {
  const CateringScreen({super.key});

  @override
  State<CateringScreen> createState() => _CateringScreenState();
}

class _CateringScreenState extends State<CateringScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();

  String _statusFilter = 'All';
  String _searchQuery = '';
  String _eventTypeFilter = 'All';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthProvider>();
      String? restId;
      if (auth.user?['restaurantId'] is Map) {
        restId = auth.user!['restaurantId']['_id']?.toString() ??
            auth.user!['restaurantId']['id']?.toString();
      } else {
        restId = auth.user?['restaurantId']?.toString();
      }
      context.read<CateringProvider>().fetchEnquiries(explicitRestaurantId: restId);
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  void _unfocusSearch() {
    if (_searchFocusNode.hasFocus) {
      _searchFocusNode.unfocus();
    }
    FocusManager.instance.primaryFocus?.unfocus();
  }

  String _getInitials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts[0].isEmpty) return 'CE';
    if (parts.length == 1) {
      return parts[0].substring(0, parts[0].length >= 2 ? 2 : 1).toUpperCase();
    }
    return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
  }

  Future<void> _makePhoneCall(String phone) async {
    final cleanPhone = phone.replaceAll(RegExp(r'[^\d+]'), '');
    final uri = Uri.parse('tel:$cleanPhone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not launch phone dialer for $phone')),
        );
      }
    }
  }

  Future<void> _sendEmail(String email) async {
    final uri = Uri.parse('mailto:$email?subject=Catering%20Enquiry%20Update');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open email client for $email')),
        );
      }
    }
  }

  Future<void> _exportToCsv(List<CateringModel> enquiries) async {
    try {
      if (enquiries.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No enquiries to export.')),
        );
        return;
      }

      final List<String> headers = [
        "Customer Name",
        "Phone",
        "Email",
        "Event Date",
        "Event Type",
        "Guest Count",
        "Package Preference",
        "Status",
        "Message"
      ];

      final List<List<String>> rows = enquiries.map((e) {
        final dateStr =
            '${e.eventDate.day.toString().padLeft(2, '0')}/${e.eventDate.month.toString().padLeft(2, '0')}/${e.eventDate.year}';
        return [
          e.customerName.replaceAll('"', '""'),
          e.customerPhone,
          e.customerEmail,
          dateStr,
          e.eventType,
          e.guestCount.toString(),
          e.packagePreference,
          e.status.toUpperCase(),
          e.message.replaceAll('"', '""'),
        ];
      }).toList();

      String csvContent = '${headers.join(',')}\n';
      for (var row in rows) {
        csvContent = '$csvContent${row.map((cell) => '"$cell"').join(',')}\n';
      }

      final directory = await getTemporaryDirectory();
      final path =
          '${directory.path}/catering_enquiries_${DateTime.now().toIso8601String().split('T').first}.csv';
      final file = File(path);
      await file.writeAsString(csvContent);

      await Share.shareXFiles([XFile(path)], text: 'Catering Enquiries Export CSV');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to export CSV: $e')),
        );
      }
    }
  }

  void _showFilterBottomSheet(BuildContext context) {
    _unfocusSearch();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
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
                        Text(
                          'Filter Enquiries',
                          style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Text(
                      'EVENT TYPE',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF94A3B8),
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        'All',
                        'Birthday Party',
                        'Family Gathering',
                        'Corporate Event',
                        'Wedding',
                        'Anniversary',
                        'Other'
                      ].map((type) {
                        final isSel = _eventTypeFilter == type;
                        return ChoiceChip(
                          label: Text(type),
                          selected: isSel,
                          onSelected: (val) {
                            if (val) {
                              setState(() => _eventTypeFilter = type);
                              setModalState(() {});
                            }
                          },
                          selectedColor: const Color(0xFF881337),
                          labelStyle: GoogleFonts.inter(
                            color: isSel ? Colors.white : const Color(0xFF475569),
                            fontWeight: isSel ? FontWeight.w600 : FontWeight.w500,
                            fontSize: 13,
                          ),
                          backgroundColor: const Color(0xFFF8FAFC),
                          side: BorderSide(
                            color: isSel ? Colors.transparent : Colors.grey.shade200,
                          ),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 28),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => Navigator.pop(ctx),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF881337),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text(
                          'Apply Filters',
                          style: GoogleFonts.inter(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
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

  void _showAddEnquiryModal(BuildContext context) {
    _unfocusSearch();
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final guestsCtrl = TextEditingController(text: '50');
    final notesCtrl = TextEditingController();
    DateTime selectedDate = DateTime.now().add(const Duration(days: 7));
    String selectedType = 'Birthday Party';
    String selectedPackage = 'Custom / Unsure';
    bool isSaving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final dateStr =
                '${selectedDate.day.toString().padLeft(2, '0')}/${selectedDate.month.toString().padLeft(2, '0')}/${selectedDate.year}';

            return Container(
              padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Add Catering Enquiry',
                            style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close),
                            onPressed: () => Navigator.pop(ctx),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Customer Name
                      Text('Customer Name *', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
                      const SizedBox(height: 6),
                      TextField(
                        controller: nameCtrl,
                        decoration: _inputDec('e.g. Ramesh Kumar'),
                      ),
                      const SizedBox(height: 12),

                      // Phone & Email Row
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Phone *', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
                                const SizedBox(height: 6),
                                TextField(
                                  controller: phoneCtrl,
                                  keyboardType: TextInputType.phone,
                                  decoration: _inputDec('+1 234 567 8900'),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Email', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
                                const SizedBox(height: 6),
                                TextField(
                                  controller: emailCtrl,
                                  keyboardType: TextInputType.emailAddress,
                                  decoration: _inputDec('email@example.com'),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Event Date & Guests
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Event Date', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
                                const SizedBox(height: 6),
                                InkWell(
                                  onTap: () async {
                                    final picked = await showDatePicker(
                                      context: context,
                                      initialDate: selectedDate,
                                      firstDate: DateTime.now(),
                                      lastDate: DateTime.now().add(const Duration(days: 365)),
                                      builder: (context, child) {
                                        return Theme(
                                          data: ThemeData.light().copyWith(
                                            colorScheme: const ColorScheme.light(primary: Color(0xFF881337)),
                                          ),
                                          child: child!,
                                        );
                                      },
                                    );
                                    if (picked != null) {
                                      setModalState(() => selectedDate = picked);
                                    }
                                  },
                                  child: Container(
                                    height: 48,
                                    padding: const EdgeInsets.symmetric(horizontal: 12),
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(color: const Color(0xFFE2E8F0)),
                                    ),
                                    alignment: Alignment.centerLeft,
                                    child: Row(
                                      children: [
                                        const Icon(Icons.calendar_today_rounded, size: 16, color: Color(0xFF881337)),
                                        const SizedBox(width: 8),
                                        Text(dateStr, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF0F172A))),
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
                                Text('Guest Count', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
                                const SizedBox(height: 6),
                                TextField(
                                  controller: guestsCtrl,
                                  keyboardType: TextInputType.number,
                                  decoration: _inputDec('50'),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Event Type & Package
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Event Type', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
                                const SizedBox(height: 6),
                                DropdownButtonFormField<String>(
                                  initialValue: selectedType,
                                  isExpanded: true,
                                  items: [
                                    'Birthday Party',
                                    'Family Gathering',
                                    'Corporate Event',
                                    'Wedding',
                                    'Anniversary',
                                    'Other'
                                  ].map((t) => DropdownMenuItem(value: t, child: Text(t, style: GoogleFonts.inter(fontSize: 13)))).toList(),
                                  onChanged: (val) => setModalState(() => selectedType = val!),
                                  decoration: _inputDec(''),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Package', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
                                const SizedBox(height: 6),
                                DropdownButtonFormField<String>(
                                  initialValue: selectedPackage,
                                  isExpanded: true,
                                  items: [
                                    'Custom / Unsure',
                                    'Lunch + High Tea',
                                    'Dinner Buffet',
                                    'Veg Deluxe',
                                    'Special Feast'
                                  ].map((t) => DropdownMenuItem(value: t, child: Text(t, style: GoogleFonts.inter(fontSize: 13)))).toList(),
                                  onChanged: (val) => setModalState(() => selectedPackage = val!),
                                  decoration: _inputDec(''),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Notes / Message
                      Text('Message / Special Request', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
                      const SizedBox(height: 6),
                      TextField(
                        controller: notesCtrl,
                        maxLines: 2,
                        decoration: _inputDec('Details about menu or event requirements...'),
                      ),
                      const SizedBox(height: 24),

                      // Submit button
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton(
                          onPressed: isSaving ? null : () async {
                            if (nameCtrl.text.trim().isEmpty) {
                              ScaffoldMessenger.of(ctx).showSnackBar(
                                const SnackBar(content: Text('Please enter customer name'), backgroundColor: Colors.red),
                              );
                              return;
                            }
                            if (phoneCtrl.text.trim().isEmpty) {
                              ScaffoldMessenger.of(ctx).showSnackBar(
                                const SnackBar(content: Text('Please enter phone number'), backgroundColor: Colors.red),
                              );
                              return;
                            }

                            setModalState(() => isSaving = true);
                            try {
                              await context.read<CateringProvider>().createEnquiry({
                                'customerName': nameCtrl.text.trim(),
                                'customerPhone': phoneCtrl.text.trim(),
                                'customerEmail': emailCtrl.text.trim(),
                                'eventDate': selectedDate.toIso8601String(),
                                'eventType': selectedType,
                                'guestCount': int.tryParse(guestsCtrl.text.trim()) ?? 50,
                                'packagePreference': selectedPackage,
                                'additionalNotes': notesCtrl.text.trim(),
                              });
                              if (ctx.mounted) Navigator.pop(ctx);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Catering enquiry recorded successfully!')),
                                );
                              }
                            } catch (e) {
                              if (ctx.mounted) {
                                ScaffoldMessenger.of(ctx).showSnackBar(
                                  SnackBar(content: Text('Error saving enquiry: $e'), backgroundColor: Colors.red),
                                );
                              }
                            } finally {
                              if (ctx.mounted) setModalState(() => isSaving = false);
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF881337),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: isSaving
                              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : Text('Save Enquiry', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  InputDecoration _inputDec(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF881337), width: 1.5)),
    );
  }

  void _showManageBottomSheet(BuildContext context, CateringModel enquiry) {
    _unfocusSearch();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
          child: SafeArea(
            child: Container(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Manage Enquiry', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
                          const SizedBox(height: 2),
                          Text('${enquiry.customerName} • ${enquiry.eventType}', style: GoogleFonts.inter(fontSize: 12.5, color: const Color(0xFF64748B))),
                        ],
                      ),
                      IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Quick Action shortcuts (Call, Email, WhatsApp)
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            Navigator.pop(ctx);
                            _makePhoneCall(enquiry.customerPhone);
                          },
                          icon: const Icon(Icons.phone_rounded, size: 16, color: Color(0xFF16A34A)),
                          label: Text('Call', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF16A34A))),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFF86EFAC)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                          ),
                        ),
                      ),
                      if (enquiry.customerEmail.isNotEmpty) ...[
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () {
                              Navigator.pop(ctx);
                              _sendEmail(enquiry.customerEmail);
                            },
                            icon: const Icon(Icons.mail_outline_rounded, size: 16, color: Color(0xFF2563EB)),
                            label: Text('Email', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF2563EB))),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: Color(0xFF93C5FD)),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              padding: const EdgeInsets.symmetric(vertical: 10),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 20),

                  Text('UPDATE STATUS', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8), letterSpacing: 1)),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      'new',
                      'contacted',
                      'in_discussion',
                      'quotation_sent',
                      'confirmed',
                      'closed',
                      'cancelled'
                    ].map((status) {
                      final isSelected = enquiry.status.toLowerCase() == status;
                      return ChoiceChip(
                        label: Text(
                          status.toUpperCase().replaceAll('_', ' '),
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                            color: isSelected ? Colors.white : const Color(0xFF334155),
                          ),
                        ),
                        selected: isSelected,
                        selectedColor: const Color(0xFF881337),
                        backgroundColor: const Color(0xFFF1F5F9),
                        side: BorderSide(color: isSelected ? Colors.transparent : const Color(0xFFE2E8F0)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        onSelected: (selected) async {
                          if (selected && !isSelected) {
                            try {
                              await context.read<CateringProvider>().updateStatus(enquiry.id, status);
                              if (ctx.mounted) Navigator.pop(ctx);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Status updated to ${status.toUpperCase().replaceAll('_', ' ')}')),
                                );
                              }
                            } catch (e) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Failed to update status: $e'), backgroundColor: Colors.red),
                                );
                              }
                            }
                          }
                        },
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<CateringProvider>();
    final allEnquiries = provider.enquiries;

    // Filter by Search, Status, and Event Type
    final filteredEnquiries = allEnquiries.where((e) {
      // Search Match
      final q = _searchQuery.toLowerCase().trim();
      final matchesSearch = q.isEmpty ||
          e.customerName.toLowerCase().contains(q) ||
          e.customerPhone.contains(q) ||
          e.eventType.toLowerCase().contains(q) ||
          e.customerEmail.toLowerCase().contains(q);

      // Status Match
      bool matchesStatus = true;
      if (_statusFilter == 'New') {
        matchesStatus = e.status == 'new' || e.status == 'pending';
      } else if (_statusFilter == 'Contacted') {
        matchesStatus = e.status == 'contacted' ||
            e.status == 'in_discussion' ||
            e.status == 'quotation_sent';
      } else if (_statusFilter == 'Confirmed') {
        matchesStatus = e.status == 'confirmed' || e.status == 'converted';
      } else if (_statusFilter == 'Closed') {
        matchesStatus = e.status == 'closed' || e.status == 'cancelled';
      }

      // Event Type Match
      final matchesType = _eventTypeFilter == 'All' ||
          e.eventType.toLowerCase() == _eventTypeFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesType;
    }).toList();

    // Dynamic Counts for Status Pills
    final totalCount = allEnquiries.length;
    final newCount = allEnquiries.where((e) => e.status == 'new' || e.status == 'pending').length;
    final contactedCount = allEnquiries.where((e) =>
        e.status == 'contacted' || e.status == 'in_discussion' || e.status == 'quotation_sent').length;
    final confirmedCount = allEnquiries.where((e) => e.status == 'confirmed' || e.status == 'converted').length;
    final closedCount = allEnquiries.where((e) => e.status == 'closed' || e.status == 'cancelled').length;

    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: Color(0xFF0F172A)),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/');
            }
          },
        ),
        title: Text(
          'Catering Enquiries',
          style: GoogleFonts.inter(
            color: const Color(0xFF0F172A),
            fontWeight: FontWeight.w700,
            fontSize: 20,
            letterSpacing: -0.4,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search_rounded, color: Color(0xFF0F172A), size: 24),
            onPressed: () {
              FocusScope.of(context).requestFocus(_searchFocusNode);
            },
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert_rounded, color: Color(0xFF0F172A), size: 24),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            onSelected: (val) {
              if (val == 'export') {
                _exportToCsv(filteredEnquiries);
              } else if (val == 'add') {
                _showAddEnquiryModal(context);
              } else if (val == 'refresh') {
                context.read<CateringProvider>().fetchEnquiries(force: true);
              }
            },
            itemBuilder: (ctx) => [
              const PopupMenuItem(value: 'add', child: Text('Add Enquiry')),
              const PopupMenuItem(value: 'export', child: Text('Export Enquiries CSV')),
              const PopupMenuItem(value: 'refresh', child: Text('Refresh List')),
            ],
          ),
        ],
      ),
      body: SafeArea(
        child: GestureDetector(
          onTap: _unfocusSearch,
          child: Column(
            children: [
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () => context.read<CateringProvider>().fetchEnquiries(force: true),
                  color: const Color(0xFF881337),
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Header section matching screenshot
                        Padding(
                          padding: const EdgeInsets.only(left: 16, right: 16, top: 12, bottom: 4),
                          child: Text(
                            'Catering Enquiries',
                            style: GoogleFonts.inter(
                              fontSize: 24,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF0F172A),
                              letterSpacing: -0.5,
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
                          child: Text(
                            'Manage your bulk and catering event requests.',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              color: const Color(0xFF64748B),
                              fontWeight: FontWeight.w400,
                            ),
                          ),
                        ),

                        // Horizontal Status Filter Pills
                        _buildStatusFilterPills(
                          totalCount: totalCount,
                          newCount: newCount,
                          contactedCount: contactedCount,
                          confirmedCount: confirmedCount,
                          closedCount: closedCount,
                        ),

                        const SizedBox(height: 14),

                        // Search Bar and Filter Button Row
                        _buildSearchAndFilterRow(),

                        const SizedBox(height: 14),

                        // Enquiries Cards List
                        if (provider.isLoading)
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 60),
                            child: Center(
                              child: CircularProgressIndicator(color: Color(0xFF881337)),
                            ),
                          )
                        else if (filteredEnquiries.isEmpty)
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 24),
                            child: Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.event_busy_rounded, size: 48, color: Colors.grey.shade400),
                                  const SizedBox(height: 12),
                                  Text(
                                    'No catering enquiries found',
                                    style: GoogleFonts.inter(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                      color: const Color(0xFF334155),
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Try adjusting your search query or filters.',
                                    style: GoogleFonts.inter(fontSize: 13, color: Colors.grey.shade500),
                                  ),
                                ],
                              ),
                            ),
                          )
                        else
                          ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            padding: const EdgeInsets.only(left: 16, right: 16, bottom: 90),
                            itemCount: filteredEnquiries.length,
                            itemBuilder: (ctx, i) {
                              final enquiry = filteredEnquiries[i];
                              return _buildEnquiryCard(enquiry);
                            },
                          ),
                      ],
                    ),
                  ),
                ),
              ),

              // Pinned Bottom Action Bar: Export Enquiries & Add Enquiry
              _buildBottomBar(filteredEnquiries),
            ],
          ),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Horizontal Status Filter Pills (Matching exact UI mockup)
  // ---------------------------------------------------------------------------
  Widget _buildStatusFilterPills({
    required int totalCount,
    required int newCount,
    required int contactedCount,
    required int confirmedCount,
    required int closedCount,
  }) {
    final pills = [
      {'label': 'All', 'title': 'All ($totalCount)'},
      {'label': 'New', 'title': 'New ($newCount)'},
      {'label': 'Contacted', 'title': 'Contacted ($contactedCount)'},
      {'label': 'Confirmed', 'title': 'Confirmed ($confirmedCount)'},
      if (closedCount > 0) {'label': 'Closed', 'title': 'Closed ($closedCount)'},
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: pills.map((pill) {
          final isSelected = _statusFilter == pill['label'];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: InkWell(
              onTap: () {
                setState(() => _statusFilter = pill['label']!);
              },
              borderRadius: BorderRadius.circular(20),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFF991B1B) : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isSelected ? const Color(0xFF991B1B) : const Color(0xFFE2E8F0),
                    width: 1.2,
                  ),
                  boxShadow: [
                    if (!isSelected)
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.02),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (isSelected) ...[
                      const Icon(Icons.check_rounded, color: Colors.white, size: 16),
                      const SizedBox(width: 4),
                    ],
                    Text(
                      pill['title']!,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        color: isSelected ? Colors.white : const Color(0xFF334155),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Search Bar + Filter Button Row
  // ---------------------------------------------------------------------------
  Widget _buildSearchAndFilterRow() {
    final bool hasActiveFilter = _eventTypeFilter != 'All';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          // Search input box
          Expanded(
            child: Container(
              height: 46,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
              ),
              child: Row(
                children: [
                  const SizedBox(width: 12),
                  const Icon(Icons.search_rounded, color: Color(0xFF94A3B8), size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      focusNode: _searchFocusNode,
                      onChanged: (val) {
                        setState(() => _searchQuery = val);
                      },
                      style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF0F172A)),
                      decoration: InputDecoration(
                        isDense: true,
                        hintText: 'Search by name, phone, event type...',
                        hintStyle: GoogleFonts.inter(
                          fontSize: 12.5,
                          color: const Color(0xFF94A3B8),
                          fontWeight: FontWeight.w400,
                        ),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  if (_searchQuery.isNotEmpty)
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 18, color: Color(0xFF94A3B8)),
                      onPressed: () {
                        _searchController.clear();
                        setState(() => _searchQuery = '');
                      },
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 10),

          // Filter Button
          InkWell(
            onTap: () => _showFilterBottomSheet(context),
            borderRadius: BorderRadius.circular(12),
            child: Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: hasActiveFilter ? const Color(0xFF881337) : const Color(0xFFE2E8F0),
                  width: 1.2,
                ),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Icon(
                    Icons.tune_rounded,
                    color: hasActiveFilter ? const Color(0xFF881337) : const Color(0xFF334155),
                    size: 20,
                  ),
                  if (hasActiveFilter)
                    Positioned(
                      top: 10,
                      right: 10,
                      child: Container(
                        width: 7,
                        height: 7,
                        decoration: const BoxDecoration(
                          color: Color(0xFFDC2626),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Catering Enquiry Card (Pixel-perfect to screenshot)
  // ---------------------------------------------------------------------------
  Widget _buildEnquiryCard(CateringModel enquiry) {
    // Status Badge colors
    Color statusBg;
    Color statusTextColor;
    String statusLabel = enquiry.status.toUpperCase().replaceAll('_', ' ');

    switch (enquiry.status.toLowerCase()) {
      case 'confirmed':
      case 'converted':
        statusBg = const Color(0xFFDCFCE7);
        statusTextColor = const Color(0xFF16A34A);
        break;
      case 'closed':
      case 'cancelled':
        statusBg = const Color(0xFFF1F5F9);
        statusTextColor = const Color(0xFF475569);
        break;
      case 'new':
      case 'pending':
        statusBg = const Color(0xFFFEF3C7);
        statusTextColor = const Color(0xFFD97706);
        break;
      case 'contacted':
      case 'in_discussion':
      case 'quotation_sent':
      default:
        statusBg = const Color(0xFFEFF6FF);
        statusTextColor = const Color(0xFF2563EB);
        break;
    }

    final dateStr =
        '${enquiry.eventDate.day.toString().padLeft(2, '0')}/${enquiry.eventDate.month.toString().padLeft(2, '0')}/${enquiry.eventDate.year}';
    final initials = _getInitials(enquiry.customerName);

    // Message box tint
    Color msgBg = const Color(0xFFFFF5F5);
    Color msgBorder = const Color(0xFFFEE2E2);
    Color bubbleColor = const Color(0xFFE11D48);

    if (enquiry.status.toLowerCase() == 'closed') {
      msgBg = const Color(0xFFF0F9FF);
      msgBorder = const Color(0xFFE0F2FE);
      bubbleColor = const Color(0xFF0284C7);
    } else if (enquiry.status.toLowerCase() == 'new') {
      msgBg = const Color(0xFFFFFBEB);
      msgBorder = const Color(0xFFFEF3C7);
      bubbleColor = const Color(0xFFD97706);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1F5F9), width: 1.2),
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
          // Row 1: Avatar, Name, Status Badge
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Avatar circle with Burgundy background
              Container(
                width: 44,
                height: 44,
                decoration: const BoxDecoration(
                  color: Color(0xFF881337),
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Text(
                  initials,
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 12),

              // Customer Name
              Expanded(
                child: Text(
                  enquiry.customerName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                    color: const Color(0xFF0F172A),
                  ),
                ),
              ),

              // Status Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusBg,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  statusLabel,
                  style: GoogleFonts.inter(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w800,
                    color: statusTextColor,
                    letterSpacing: 0.3,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Detail Line 1: Date & Event Type
          Row(
            children: [
              const Icon(Icons.calendar_today_rounded, size: 14, color: Color(0xFFDC2626)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '$dateStr | ${enquiry.eventType}',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: const Color(0xFF334155),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 7),

          // Detail Line 2: Guests
          Row(
            children: [
              const Icon(Icons.people_alt_rounded, size: 14, color: Color(0xFFDC2626)),
              const SizedBox(width: 8),
              Text(
                '${enquiry.guestCount} Guests',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: const Color(0xFF334155),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 7),

          // Detail Line 3: Phone & Email
          Row(
            children: [
              const Icon(Icons.phone_rounded, size: 14, color: Color(0xFFDC2626)),
              const SizedBox(width: 8),
              Text(
                enquiry.customerPhone,
                style: GoogleFonts.inter(fontSize: 12.5, color: const Color(0xFF334155)),
              ),
              if (enquiry.customerEmail.isNotEmpty) ...[
                const SizedBox(width: 14),
                const Icon(Icons.mail_rounded, size: 14, color: Color(0xFFDC2626)),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    enquiry.customerEmail,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(fontSize: 12.5, color: const Color(0xFF334155)),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 7),

          // Detail Line 4: Package Preference
          Row(
            children: [
              const Icon(Icons.local_offer_rounded, size: 14, color: Color(0xFFDC2626)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  enquiry.packagePreference.isNotEmpty
                      ? enquiry.packagePreference
                      : 'Custom / Unsure',
                  style: GoogleFonts.inter(fontSize: 12.5, color: const Color(0xFF334155)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Message Box Container
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: msgBg,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: msgBorder, width: 1),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: bubbleColor.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.chat_bubble_outline_rounded, size: 14, color: bubbleColor),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Message:',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF64748B),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        enquiry.message.trim().isEmpty
                            ? 'No additional notes provided.'
                            : enquiry.message,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: const Color(0xFF0F172A),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Action Buttons Row: [ 📞 Call ] and [ Manage > ]
          Row(
            children: [
              // Call Button
              Expanded(
                child: SizedBox(
                  height: 42,
                  child: OutlinedButton.icon(
                    onPressed: () => _makePhoneCall(enquiry.customerPhone),
                    icon: const Icon(Icons.phone_rounded, color: Color(0xFFDC2626), size: 16),
                    label: Text(
                      'Call',
                      style: GoogleFonts.inter(
                        color: const Color(0xFFDC2626),
                        fontWeight: FontWeight.w700,
                        fontSize: 13.5,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      backgroundColor: Colors.white,
                      side: const BorderSide(color: Color(0xFFFCA5A5), width: 1.2),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),

              // Manage Button
              Expanded(
                child: SizedBox(
                  height: 42,
                  child: ElevatedButton(
                    onPressed: () => _showManageBottomSheet(context, enquiry),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF881337),
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Manage',
                          style: GoogleFonts.inter(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 13.5,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(Icons.chevron_right_rounded, color: Colors.white, size: 18),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Pinned Bottom Action Bar: [ ⬇ Export Enquiries ]  and  [ + Add Enquiry ]
  // ---------------------------------------------------------------------------
  Widget _buildBottomBar(List<CateringModel> enquiries) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: const Border(
          top: BorderSide(color: Color(0xFFE2E8F0), width: 1.2),
        ),
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
          // Left: Export Enquiries Button
          Expanded(
            child: SizedBox(
              height: 46,
              child: OutlinedButton.icon(
                onPressed: () => _exportToCsv(enquiries),
                icon: const Icon(Icons.file_download_outlined, color: Color(0xFF881337), size: 19),
                label: Text(
                  'Export Enquiries',
                  style: GoogleFonts.inter(
                    color: const Color(0xFF881337),
                    fontWeight: FontWeight.w700,
                    fontSize: 13.5,
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  backgroundColor: Colors.white,
                  side: const BorderSide(color: Color(0xFF881337), width: 1.5),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Right: Add Enquiry Button
          Expanded(
            child: SizedBox(
              height: 46,
              child: ElevatedButton.icon(
                onPressed: () => _showAddEnquiryModal(context),
                icon: const Icon(Icons.add_rounded, color: Colors.white, size: 20),
                label: Text(
                  'Add Enquiry',
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF881337),
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
