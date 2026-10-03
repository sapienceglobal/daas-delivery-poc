import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:toastification/toastification.dart';

import '../providers/support_messages_provider.dart';
import '../widgets/app_drawer.dart';
import '../widgets/shared_bottom_nav.dart';

class SupportMessagesScreen extends StatefulWidget {
  const SupportMessagesScreen({Key? key}) : super(key: key);

  @override
  State<SupportMessagesScreen> createState() => _SupportMessagesScreenState();
}

class _SupportMessagesScreenState extends State<SupportMessagesScreen> {
  final TextEditingController _searchController = TextEditingController();

  static const Color _primaryRed = Color(0xFF8B0000);
  static const Color _bgGrey = Color(0xFFF8FAFC);
  static const Color _cardBorder = Color(0xFFE2E8F0);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SupportMessagesProvider>().fetchMessages();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _handleReply(Map<String, dynamic> msg) async {
    final email = msg['email']?.toString() ?? '';
    final subject = 'Re: ${msg['subject'] ?? 'Customer Inquiry'}';
    final body = '\n\n--- Original Inquiry ---\nFrom: ${msg['name']}\nMessage: ${msg['message']}';

    final uri = Uri(
      scheme: 'mailto',
      path: email,
      queryParameters: {
        'subject': subject,
        'body': body,
      },
    );

    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      } else {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }

      if (msg['status'] == 'new' && mounted) {
        final provider = context.read<SupportMessagesProvider>();
        await provider.updateMessageStatus(msg['_id'], 'replied');
      }
    } catch (e) {
      if (mounted) {
        toastification.show(
          context: context,
          type: ToastificationType.warning,
          title: const Text('Email Client'),
          description: Text('Could not open default mail client. Replying to: $email'),
          autoCloseDuration: const Duration(seconds: 4),
        );
      }
    }
  }

  void _showDetailModal(Map<String, dynamic> msg) {
    final provider = context.read<SupportMessagesProvider>();
    final isNew = msg['status'] == 'new';

    // Auto mark as read if it was new when viewing detail
    if (isNew) {
      provider.updateMessageStatus(msg['_id'], 'read');
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final currentStatus = msg['status']?.toString() ?? 'new';

          DateTime? createdAt;
          if (msg['createdAt'] != null) {
            createdAt = DateTime.tryParse(msg['createdAt'].toString());
          }
          final dateStr = createdAt != null
              ? '${createdAt.month}/${createdAt.day}/${createdAt.year} at ${createdAt.hour % 12 == 0 ? 12 : createdAt.hour % 12}:${createdAt.minute.toString().padLeft(2, '0')} ${createdAt.hour >= 12 ? 'PM' : 'AM'}'
              : 'Recent';

          return Container(
            height: MediaQuery.of(context).size.height * 0.75,
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              children: [
                // Modal Handle & Header
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 16, 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(color: _primaryRed.withOpacity(0.1), shape: BoxShape.circle),
                            child: const Icon(Icons.mail_outline_rounded, color: _primaryRed, size: 20),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Customer Inquiry', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16, color: const Color(0xFF111827))),
                              Text('Received: $dateStr', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B))),
                            ],
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: Color(0xFF64748B)),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),

                // Body
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.all(20),
                    children: [
                      // Sender Card
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: _cardBorder),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 24,
                              backgroundColor: _primaryRed.withOpacity(0.12),
                              child: Text(
                                (msg['name']?.toString().isNotEmpty == true) ? msg['name'][0].toUpperCase() : 'C',
                                style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: _primaryRed, fontSize: 18),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    msg['name']?.toString() ?? 'Customer',
                                    style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: const Color(0xFF111827)),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    msg['email']?.toString() ?? '',
                                    style: GoogleFonts.inter(fontSize: 12.5, color: const Color(0xFF64748B)),
                                  ),
                                ],
                              ),
                            ),
                            _buildStatusBadge(currentStatus),
                          ],
                        ),
                      ),
                      const SizedBox(height: 18),

                      // Subject
                      Text('Subject', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF64748B))),
                      const SizedBox(height: 4),
                      Text(
                        msg['subject']?.toString() ?? 'No Subject',
                        style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 17, color: const Color(0xFF1E293B)),
                      ),
                      const SizedBox(height: 16),

                      // Message Body
                      Text('Message', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF64748B))),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: _cardBorder),
                        ),
                        child: Text(
                          msg['message']?.toString() ?? '',
                          style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF334155), height: 1.5),
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Status changer pills
                      Text('Change Status', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF64748B))),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          _buildStatusPill(msg, 'new', 'Mark as New', currentStatus, setModalState),
                          const SizedBox(width: 8),
                          _buildStatusPill(msg, 'read', 'Mark as Read', currentStatus, setModalState),
                          const SizedBox(width: 8),
                          _buildStatusPill(msg, 'replied', 'Mark as Replied', currentStatus, setModalState),
                        ],
                      ),
                    ],
                  ),
                ),

                // Footer Reply Button
                SafeArea(
                  top: false,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      border: Border(top: BorderSide(color: Color(0xFFF1F5F9))),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => Navigator.pop(ctx),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: Text('Close', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: const Color(0xFF475569))),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          flex: 2,
                          child: ElevatedButton.icon(
                            onPressed: () {
                              Navigator.pop(ctx);
                              _handleReply(msg);
                            },
                            icon: const Icon(Icons.reply_rounded, color: Colors.white, size: 18),
                            label: Text('Reply via Email', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF0F172A),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
        },
      ),
    );
  }

  Widget _buildStatusPill(
    Map<String, dynamic> msg,
    String targetStatus,
    String label,
    String currentStatus,
    StateSetter setModalState,
  ) {
    final isSelected = currentStatus == targetStatus;
    return InkWell(
      onTap: () async {
        final provider = context.read<SupportMessagesProvider>();
        final success = await provider.updateMessageStatus(msg['_id'], targetStatus);
        if (success) {
          setModalState(() {
            msg['status'] = targetStatus;
          });
        }
      },
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: isSelected ? Colors.white : const Color(0xFF475569)),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final support = context.watch<SupportMessagesProvider>();
    final query = _searchController.text.toLowerCase().trim();

    final filtered = support.messages.where((msg) {
      if (query.isNotEmpty) {
        final name = msg['name']?.toString().toLowerCase() ?? '';
        final email = msg['email']?.toString().toLowerCase() ?? '';
        final subject = msg['subject']?.toString().toLowerCase() ?? '';
        final message = msg['message']?.toString().toLowerCase() ?? '';

        return name.contains(query) || email.contains(query) || subject.contains(query) || message.contains(query);
      }
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: _bgGrey,
      appBar: AppBar(
        title: Column(
          children: [
            Text(
              'Support Messages',
              style: GoogleFonts.outfit(color: const Color(0xFF111827), fontSize: 20, fontWeight: FontWeight.bold),
            ),
            Text(
              'Customer Inquiries & Support Tickets',
              style: GoogleFonts.inter(color: const Color(0xFF6B7280), fontSize: 11, fontWeight: FontWeight.w500),
            ),
          ],
        ),
        backgroundColor: Colors.white,
        elevation: 0.5,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Color(0xFF111827)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF475569)),
            tooltip: 'Refresh',
            onPressed: () => support.fetchMessages(),
          ),
        ],
      ),
      drawer: const AppDrawer(),
      body: support.isLoading
          ? const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(color: _primaryRed),
                  SizedBox(height: 16),
                  Text('Loading support messages...', style: TextStyle(color: Color(0xFF64748B))),
                ],
              ),
            )
          : RefreshIndicator(
              color: _primaryRed,
              onRefresh: () => support.fetchMessages(),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // 4 Stat Cards
                  _buildStatsGrid(support),
                  const SizedBox(height: 18),

                  // Search & Filter Header
                  _buildSearchAndFilters(support),
                  const SizedBox(height: 14),

                  // Messages Feed
                  if (filtered.isEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 48),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: _cardBorder),
                      ),
                      child: Column(
                        children: [
                          const Icon(Icons.mark_email_read_outlined, size: 44, color: Color(0xFF94A3B8)),
                          const SizedBox(height: 10),
                          Text('No support messages found', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: const Color(0xFF64748B))),
                          const SizedBox(height: 4),
                          Text('Customer contact inquiries from website & app appear here.', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8))),
                        ],
                      ),
                    )
                  else
                    ...filtered.map((msg) => _buildMessageCard(msg)).toList(),

                  const SizedBox(height: 80),
                ],
              ),
            ),
      bottomNavigationBar: const SharedBottomNav(currentIndex: -1),
    );
  }

  // -------------------------------------------------------------
  // STATS GRID
  // -------------------------------------------------------------
  Widget _buildStatsGrid(SupportMessagesProvider support) {
    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.45,
      children: [
        _buildStatTile('Total Messages', support.totalMessages.toString(), Icons.mail_outline_rounded, const Color(0xFF3B82F6), const Color(0xFFEFF6FF)),
        _buildStatTile('New Inquiries', support.newMessagesCount.toString(), Icons.mark_email_unread_rounded, const Color(0xFFEA580C), const Color(0xFFFFF7ED)),
        _buildStatTile('Replied', support.repliedMessagesCount.toString(), Icons.check_circle_outline_rounded, const Color(0xFF10B981), const Color(0xFFECFDF5)),
        _buildStatTile('Read', support.readMessagesCount.toString(), Icons.drafts_outlined, const Color(0xFF64748B), const Color(0xFFF8FAFC)),
      ],
    );
  }

  Widget _buildStatTile(String title, String value, IconData icon, Color color, Color bgColor) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _cardBorder),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: GoogleFonts.inter(fontSize: 11.5, fontWeight: FontWeight.w600, color: const Color(0xFF64748B))),
              Container(
                padding: const EdgeInsets.all(5),
                decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(6)),
                child: Icon(icon, color: color, size: 16),
              ),
            ],
          ),
          Text(value, style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold, color: const Color(0xFF111827))),
        ],
      ),
    );
  }

  // -------------------------------------------------------------
  // SEARCH & FILTERS
  // -------------------------------------------------------------
  Widget _buildSearchAndFilters(SupportMessagesProvider support) {
    return Column(
      children: [
        // Search Input
        TextField(
          controller: _searchController,
          onChanged: (_) => setState(() {}),
          decoration: InputDecoration(
            hintText: 'Search by customer, email, or subject...',
            hintStyle: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
            prefixIcon: const Icon(Icons.search, size: 20, color: Color(0xFF94A3B8)),
            suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear, size: 18, color: Color(0xFF94A3B8)),
                    onPressed: () {
                      _searchController.clear();
                      setState(() {});
                    },
                  )
                : null,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _cardBorder)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _cardBorder)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _primaryRed, width: 2)),
          ),
        ),
        const SizedBox(height: 10),

        // Filter Pills
        Row(
          children: [
            _buildFilterPill(support, 'all', 'All Messages'),
            const SizedBox(width: 8),
            _buildFilterPill(support, 'new', 'New'),
            const SizedBox(width: 8),
            _buildFilterPill(support, 'read', 'Read'),
            const SizedBox(width: 8),
            _buildFilterPill(support, 'replied', 'Replied'),
          ],
        ),
      ],
    );
  }

  Widget _buildFilterPill(SupportMessagesProvider support, String filterKey, String label) {
    final isSelected = support.statusFilter == filterKey;

    return InkWell(
      onTap: () => support.fetchMessages(status: filterKey),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? _primaryRed : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? _primaryRed : _cardBorder),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : const Color(0xFF64748B),
          ),
        ),
      ),
    );
  }

  // -------------------------------------------------------------
  // MESSAGE CARD
  // -------------------------------------------------------------
  Widget _buildMessageCard(Map<String, dynamic> msg) {
    final status = msg['status']?.toString().toLowerCase() ?? 'new';
    final isNew = status == 'new';
    final isReplied = status == 'replied';

    final name = msg['name']?.toString() ?? 'Customer';
    final email = msg['email']?.toString() ?? '';
    final subject = msg['subject']?.toString() ?? 'No Subject';
    final message = msg['message']?.toString() ?? '';

    DateTime? createdAt;
    if (msg['createdAt'] != null) {
      createdAt = DateTime.tryParse(msg['createdAt'].toString());
    }

    final dateStr = createdAt != null ? '${createdAt.month}/${createdAt.day}/${createdAt.year}' : 'Recent';
    final timeStr = createdAt != null
        ? '${createdAt.hour % 12 == 0 ? 12 : createdAt.hour % 12}:${createdAt.minute.toString().padLeft(2, '0')} ${createdAt.hour >= 12 ? 'PM' : 'AM'}'
        : '';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isNew ? const Color(0xFFFFFBEB) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isNew ? const Color(0xFFFDE68A) : _cardBorder,
          width: isNew ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 6, offset: const Offset(0, 2)),
        ],
      ),
      child: InkWell(
        onTap: () => _showDetailModal(msg),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top sender row
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: _primaryRed.withOpacity(0.1),
                    child: Text(
                      name.isNotEmpty ? name[0].toUpperCase() : 'C',
                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: _primaryRed, fontSize: 16),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              name,
                              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14.5, color: const Color(0xFF111827)),
                            ),
                            _buildStatusBadge(status),
                          ],
                        ),
                        Text(email, style: GoogleFonts.inter(fontSize: 11.5, color: const Color(0xFF64748B))),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Subject & Message Snippet
              Text(
                subject,
                style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14.5, color: const Color(0xFF1E293B)),
              ),
              const SizedBox(height: 4),
              Text(
                message,
                style: GoogleFonts.inter(fontSize: 12.5, color: const Color(0xFF475569), height: 1.4),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 12),
              const Divider(height: 1),
              const SizedBox(height: 10),

              // Footer time & Quick Actions
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.access_time_rounded, size: 14, color: Color(0xFF94A3B8)),
                      const SizedBox(width: 4),
                      Text('$dateStr • $timeStr', style: GoogleFonts.inter(fontSize: 11.5, color: const Color(0xFF94A3B8))),
                    ],
                  ),
                  Row(
                    children: [
                      if (isNew)
                        TextButton(
                          onPressed: () {
                            context.read<SupportMessagesProvider>().updateMessageStatus(msg['_id'], 'read');
                          },
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: Text('Mark Read', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF64748B))),
                        ),
                      const SizedBox(width: 10),
                      ElevatedButton.icon(
                        onPressed: () => _handleReply(msg),
                        icon: const Icon(Icons.reply_rounded, size: 14, color: Colors.white),
                        label: Text('Reply', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0F172A),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  static Widget _buildStatusBadge(String status) {
    if (status == 'new') {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(color: const Color(0xFFFFF7ED), borderRadius: BorderRadius.circular(6), border: Border.all(color: const Color(0xFFFFEDD5))),
        child: Text('NEW', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: const Color(0xFFEA580C))),
      );
    }
    if (status == 'replied') {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(color: const Color(0xFFECFDF5), borderRadius: BorderRadius.circular(6), border: Border.all(color: const Color(0xFFA7F3D0))),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle_rounded, size: 12, color: Color(0xFF10B981)),
            const SizedBox(width: 3),
            Text('REPLIED', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: const Color(0xFF10B981))),
          ],
        ),
      );
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: const Color(0xFFF3F4F6), borderRadius: BorderRadius.circular(6)),
      child: Text('READ', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: const Color(0xFF6B7280))),
    );
  }
}
