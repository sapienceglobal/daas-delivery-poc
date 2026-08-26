import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import 'package:url_launcher/url_launcher.dart';
import '../constants/app_colors.dart';
import '../widgets/app_drawer.dart';
import '../widgets/shared_bottom_nav.dart';
import '../providers/catering_provider.dart';
import 'package:go_router/go_router.dart';

class CateringScreen extends StatefulWidget {
  const CateringScreen({Key? key}) : super(key: key);

  @override
  State<CateringScreen> createState() => _CateringScreenState();
}

class _CateringScreenState extends State<CateringScreen> {
  String _statusFilter = 'All';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CateringProvider>().fetchEnquiries();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<CateringProvider>();
    
    final filteredEnquiries = provider.enquiries.where((e) {
      if (_statusFilter == 'All') return true;
      return e.status.toLowerCase() == _statusFilter.toLowerCase();
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
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
        title: Text('Catering Enquiries', style: GoogleFonts.inter(color: Colors.black, fontWeight: FontWeight.bold)),
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      drawer: const AppDrawer(),
      body: RefreshIndicator(
        onRefresh: () => context.read<CateringProvider>().fetchEnquiries(force: true),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Catering Enquiries',
                style: GoogleFonts.inter(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Manage your bulk and catering event requests.',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 24),
              
              // Filter Row
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildFilterChip('All'),
                    const SizedBox(width: 8),
                    _buildFilterChip('New'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Contacted'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Confirmed'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Cancelled'),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              
              // Enquiries List or Loading Shimmer
              if (provider.isLoading)
                Column(
                  children: List.generate(4, (index) => _buildShimmerCard()),
                )
              else if (provider.error != null)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 40),
                    child: Text(
                      provider.error!,
                      style: GoogleFonts.inter(color: Colors.red),
                    ),
                  ),
                )
              else if (filteredEnquiries.isEmpty)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 40),
                    child: Text(
                      'No enquiries found.',
                      style: GoogleFonts.inter(color: Colors.grey.shade500),
                    ),
                  ),
                )
              else
                ...filteredEnquiries.map((e) => _buildEnquiryCard(e)).toList(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label) {
    final isSelected = _statusFilter == label;
    return ChoiceChip(
      label: Text(
        label,
        style: GoogleFonts.inter(
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          color: isSelected ? Colors.white : Colors.black87,
        ),
      ),
      selected: isSelected,
      selectedColor: const Color(0xFFDC2626), // App Red
      backgroundColor: Colors.white,
      onSelected: (selected) {
        if (selected) {
          setState(() => _statusFilter = label);
        }
      },
    );
  }

  Widget _buildShimmerCard() {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
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
                Container(width: 120, height: 20, color: Colors.white),
                Container(width: 60, height: 20, color: Colors.white),
              ],
            ),
            const SizedBox(height: 12),
            Container(width: 180, height: 14, color: Colors.white),
            const SizedBox(height: 8),
            Container(width: 100, height: 14, color: Colors.white),
            const SizedBox(height: 16),
            Container(width: double.infinity, height: 14, color: Colors.white),
            const SizedBox(height: 4),
            Container(width: double.infinity, height: 14, color: Colors.white),
          ],
        ),
      ),
    );
  }

  Widget _buildEnquiryCard(CateringModel enquiry) {
    Color statusBg;
    Color statusText;
    switch (enquiry.status.toLowerCase()) {
      case 'new':
      case 'pending':
        statusBg = const Color(0xFFFEF2F2);
        statusText = const Color(0xFFDC2626);
        break;
      case 'contacted':
      case 'in_discussion':
      case 'quotation_sent':
        statusBg = const Color(0xFFEFF6FF);
        statusText = const Color(0xFF2563EB);
        break;
      case 'converted':
      case 'confirmed':
        statusBg = const Color(0xFFF0FDF4);
        statusText = const Color(0xFF16A34A);
        break;
      default:
        statusBg = const Color(0xFFF3F4F6);
        statusText = const Color(0xFF4B5563);
    }

    final dateStr = '${enquiry.eventDate.day.toString().padLeft(2, '0')}/${enquiry.eventDate.month.toString().padLeft(2, '0')}/${enquiry.eventDate.year}';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                enquiry.customerName,
                style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  enquiry.status.toUpperCase().replaceAll('_', ' '),
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: statusText,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.event, size: 16, color: Colors.grey),
              const SizedBox(width: 8),
              Text(
                '$dateStr | ${enquiry.eventType}',
                style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade700, fontWeight: FontWeight.w500),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.group, size: 16, color: Colors.grey),
              const SizedBox(width: 8),
              Text(
                '${enquiry.guestCount} Guests',
                style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade700, fontWeight: FontWeight.w500),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.phone, size: 16, color: Colors.grey),
              const SizedBox(width: 8),
              Text(
                enquiry.customerPhone,
                style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade700),
              ),
              const SizedBox(width: 16),
              const Icon(Icons.email, size: 16, color: Colors.grey),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  enquiry.customerEmail,
                  style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade700),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          if (enquiry.packagePreference.isNotEmpty) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.local_offer, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Text(
                  enquiry.packagePreference,
                  style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade700),
                ),
              ],
            ),
          ],
          if (enquiry.budgetRange.isNotEmpty) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.attach_money, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Text(
                  enquiry.budgetRange,
                  style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade700),
                ),
              ],
            ),
          ],
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(),
          ),
          Text(
            'Message:',
            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade700),
          ),
          const SizedBox(height: 4),
          Text(
            enquiry.message.isEmpty ? 'No message provided.' : enquiry.message,
            style: GoogleFonts.inter(fontSize: 14, color: Colors.black87),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton.icon(
                onPressed: () async {
                  final uri = Uri.parse('tel:${enquiry.customerPhone}');
                  if (await canLaunchUrl(uri)) {
                    await launchUrl(uri);
                  } else {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not launch phone dialer')));
                    }
                  }
                },
                icon: const Icon(Icons.call, size: 16),
                label: const Text('Call'),
                style: TextButton.styleFrom(
                  foregroundColor: const Color(0xFFDC2626), // Match filter chip selected color
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: () => _showManageBottomSheet(context, enquiry),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFDC2626), // Match filter chip selected color
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('Manage'),
              ),
            ],
          )
        ],
      ),
    );
  }

  void _showManageBottomSheet(BuildContext context, CateringModel enquiry) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
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
                      Text('Manage Enquiry', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
                      IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text('Update Status', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey.shade700)),
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
                      'closed'
                    ].map((status) {
                      final isSelected = enquiry.status.toLowerCase() == status;
                      return ChoiceChip(
                        label: Text(status.toUpperCase().replaceAll('_', ' '), style: GoogleFonts.inter(fontSize: 12, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal, color: isSelected ? Colors.white : Colors.black87)),
                        selected: isSelected,
                        selectedColor: const Color(0xFFDC2626),
                        backgroundColor: Colors.grey.shade100,
                        onSelected: (selected) async {
                          if (selected && !isSelected) {
                            try {
                              await context.read<CateringProvider>().updateStatus(enquiry.id, status);
                              if (ctx.mounted) Navigator.pop(ctx);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Status updated to ${status.toUpperCase()}')));
                              }
                            } catch (e) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to update status: $e'), backgroundColor: Colors.red));
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
}
