import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:toastification/toastification.dart';

import '../providers/auth_provider.dart';
import '../providers/marketing_provider.dart';
import '../widgets/app_drawer.dart';
import '../widgets/shared_bottom_nav.dart';

class MarketingScreen extends StatefulWidget {
  const MarketingScreen({Key? key}) : super(key: key);

  @override
  State<MarketingScreen> createState() => _MarketingScreenState();
}

class _MarketingScreenState extends State<MarketingScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _messageController = TextEditingController();
  final TextEditingController _actionUrlController = TextEditingController();
  String _imageUrl = '';
  String _selectedAudience = 'all_customers';

  static const Color _primaryRed = Color(0xFF8B0000);
  static const Color _bgGrey = Color(0xFFF8FAFC);
  static const Color _cardBorder = Color(0xFFE2E8F0);

  // Quick preset templates
  final List<Map<String, String>> _templates = [
    {
      'name': 'Weekend Special',
      'title': 'Weekend Feast: 20% OFF! 🎉',
      'message': 'Treat yourself and your family with delicious Biryani, Curries, and fresh Mango Lassi. Use code WEEKEND20 at checkout!',
      'actionUrl': '/menu',
    },
    {
      'name': 'Free Lassi Offer',
      'title': 'Free Mango Lassi Today! 🥭',
      'message': 'Order your favorite meal today and get a complimentary chilled Mango Lassi on orders over \$25. Limited time offer!',
      'actionUrl': '/menu',
    },
    {
      'name': 'Happy Hours',
      'title': 'Happy Hour Specials (4 PM - 7 PM) ⏰',
      'message': 'Enjoy exclusive 15% discount on all appetizers and chaats. Order online now for fast delivery!',
      'actionUrl': '/category/appetizers',
    },
    {
      'name': 'We Miss You',
      'title': 'We Miss You! Here is \$5 OFF 🎁',
      'message': 'It has been a while! Enjoy \$5 off your next lunch or dinner with us. Tap to browse freshly made specials.',
      'actionUrl': '/menu',
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _titleController.dispose();
    _messageController.dispose();
    _actionUrlController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final auth = context.read<AuthProvider>();
    final restaurantId = auth.user?['restaurantId']?.toString();
    await context.read<MarketingProvider>().fetchCampaigns(restaurantId);
  }

  void _applyTemplate(Map<String, String> t) {
    setState(() {
      _titleController.text = t['title'] ?? '';
      _messageController.text = t['message'] ?? '';
      _actionUrlController.text = t['actionUrl'] ?? '';
    });
    toastification.show(
      context: context,
      type: ToastificationType.info,
      title: Text('Template Applied: ${t['name']}'),
      autoCloseDuration: const Duration(seconds: 2),
    );
  }

  Future<void> _pickAndUploadImage() async {
    final marketing = context.read<MarketingProvider>();
    try {
      final result = await FilePicker.pickFiles(type: FileType.image);
      if (result.isNotEmpty && result.first.path != null) {
        final filePath = result.first.path!;
        final url = await marketing.uploadHeroImage(filePath);
        if (url != null && url.isNotEmpty) {
          setState(() => _imageUrl = url);
          if (mounted) {
            toastification.show(
              context: context,
              type: ToastificationType.success,
              title: const Text('Hero Image Uploaded'),
              autoCloseDuration: const Duration(seconds: 2),
            );
          }
        }
      }
    } catch (e) {
      if (mounted) {
        toastification.show(
          context: context,
          type: ToastificationType.error,
          title: const Text('Upload Error'),
          description: Text('$e'),
          autoCloseDuration: const Duration(seconds: 3),
        );
      }
    }
  }

  void _showUrlInputDialog() {
    final controller = TextEditingController(text: _imageUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Image Link URL', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Paste direct link to hero image:', style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B))),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              decoration: InputDecoration(
                hintText: 'https://...',
                prefixIcon: const Icon(Icons.link, size: 20, color: Color(0xFF64748B)),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _primaryRed, width: 2)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              setState(() => _imageUrl = controller.text.trim());
              Navigator.pop(ctx);
            },
            style: ElevatedButton.styleFrom(backgroundColor: _primaryRed),
            child: const Text('Apply', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _confirmAndBroadcast() {
    final title = _titleController.text.trim();
    final message = _messageController.text.trim();

    if (title.isEmpty || message.isEmpty) {
      toastification.show(
        context: context,
        type: ToastificationType.warning,
        title: const Text('Missing Fields'),
        description: const Text('Please enter both Campaign Title and Message.'),
        autoCloseDuration: const Duration(seconds: 3),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: _primaryRed.withOpacity(0.1), shape: BoxShape.circle),
              child: const Icon(Icons.campaign, color: _primaryRed, size: 24),
            ),
            const SizedBox(width: 12),
            Text('Broadcast Campaign', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Are you sure you want to broadcast this message to all selected app customers? Push notifications cannot be undone once sent.',
              style: GoogleFonts.inter(fontSize: 13.5, color: const Color(0xFF475569), height: 1.4),
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(12)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13, color: const Color(0xFF1E293B))),
                  const SizedBox(height: 4),
                  Text(message, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)), maxLines: 2, overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final auth = context.read<AuthProvider>();
              final marketing = context.read<MarketingProvider>();
              final restaurantId = auth.user?['restaurantId']?.toString();

              final success = await marketing.broadcastCampaign(
                title: title,
                message: message,
                imageUrl: _imageUrl.isNotEmpty ? _imageUrl : null,
                actionUrl: _actionUrlController.text.trim().isNotEmpty ? _actionUrlController.text.trim() : null,
                audience: _selectedAudience,
                restaurantId: restaurantId,
              );

              if (mounted) {
                if (success) {
                  _titleController.clear();
                  _messageController.clear();
                  _actionUrlController.clear();
                  setState(() => _imageUrl = '');
                  _tabController.animateTo(1); // Switch to history tab

                  toastification.show(
                    context: context,
                    type: ToastificationType.success,
                    title: const Text('Broadcast Sent!'),
                    description: const Text('Push notification dispatched to customer devices.'),
                    autoCloseDuration: const Duration(seconds: 4),
                  );
                } else {
                  toastification.show(
                    context: context,
                    type: ToastificationType.error,
                    title: const Text('Broadcast Failed'),
                    description: Text(marketing.error.isNotEmpty ? marketing.error : 'Could not send push notification.'),
                    autoCloseDuration: const Duration(seconds: 4),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: _primaryRed,
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Yes, Send Broadcast', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final marketing = context.watch<MarketingProvider>();

    return Scaffold(
      backgroundColor: _bgGrey,
      appBar: AppBar(
        title: Column(
          children: [
            Text(
              'Push Marketing',
              style: GoogleFonts.outfit(color: const Color(0xFF111827), fontSize: 20, fontWeight: FontWeight.bold),
            ),
            Text(
              'Targeted Customer Notifications',
              style: GoogleFonts.inter(color: const Color(0xFF6B7280), fontSize: 11, fontWeight: FontWeight.w500),
            ),
          ],
        ),
        backgroundColor: Colors.white,
        elevation: 0.5,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Color(0xFF111827)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            color: Colors.white,
            child: TabBar(
              controller: _tabController,
              labelColor: _primaryRed,
              unselectedLabelColor: const Color(0xFF64748B),
              indicatorColor: _primaryRed,
              indicatorWeight: 3,
              labelStyle: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14),
              unselectedLabelStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14),
              tabs: [
                const Tab(icon: Icon(Icons.edit_note_rounded, size: 18), text: 'Compose & Preview'),
                Tab(
                  icon: const Icon(Icons.history_rounded, size: 18),
                  text: 'Broadcasts (${marketing.campaigns.length})',
                ),
              ],
            ),
          ),
        ),
      ),
      drawer: const AppDrawer(),
      body: marketing.isLoading
          ? const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(color: _primaryRed),
                  SizedBox(height: 16),
                  Text('Loading Marketing Campaigns...', style: TextStyle(color: Color(0xFF64748B))),
                ],
              ),
            )
          : TabBarView(
              controller: _tabController,
              children: [
                _buildComposeTab(marketing),
                _buildHistoryTab(marketing),
              ],
            ),
      bottomNavigationBar: const SharedBottomNav(currentIndex: -1),
    );
  }

  // -------------------------------------------------------------
  // 1. COMPOSE & PREVIEW TAB
  // -------------------------------------------------------------
  Widget _buildComposeTab(MarketingProvider marketing) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Intro Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [_primaryRed.withOpacity(0.08), const Color(0xFFFCE7F3).withOpacity(0.5)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFFBCFE8)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: _primaryRed.withOpacity(0.12), shape: BoxShape.circle),
                child: const Icon(Icons.campaign_rounded, color: _primaryRed, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Push Notification Broadcast',
                      style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: const Color(0xFF111827)),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Create and broadcast marketing messages directly to your customers\' phone lock screens to boost daily orders and repeat sales.',
                      style: GoogleFonts.inter(fontSize: 12.5, color: const Color(0xFF4B5563), height: 1.4),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Quick Preset Templates
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Quick Templates', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13, color: const Color(0xFF334155))),
            const SizedBox(height: 8),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _templates.map((t) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 8.0),
                    child: ActionChip(
                      backgroundColor: Colors.white,
                      side: const BorderSide(color: Color(0xFFCBD5E1)),
                      label: Text(t['name']!, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B))),
                      avatar: const Icon(Icons.bolt_rounded, size: 16, color: Color(0xFFF59E0B)),
                      onPressed: () => _applyTemplate(t),
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
        const SizedBox(height: 18),

        // Main Compose Card
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: _cardBorder),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 6, offset: const Offset(0, 2)),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Compose Message', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16, color: const Color(0xFF111827))),
              const SizedBox(height: 16),

              // Title
              _buildFormLabel('Campaign Title *'),
              const SizedBox(height: 6),
              TextField(
                controller: _titleController,
                onChanged: (_) => setState(() {}),
                decoration: _inputDecoration('e.g. Weekend Special: 20% OFF!', icon: Icons.title_rounded),
              ),
              const SizedBox(height: 16),

              // Message
              _buildFormLabel('Promotional Message *'),
              const SizedBox(height: 6),
              TextField(
                controller: _messageController,
                onChanged: (_) => setState(() {}),
                maxLines: 3,
                decoration: _inputDecoration('Type your promotional notification message...', icon: Icons.message_rounded),
              ),
              const SizedBox(height: 16),

              // Hero Image (Optional)
              _buildFormLabel('Hero Image (Optional)'),
              const SizedBox(height: 6),
              if (_imageUrl.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFCBD5E1), style: BorderStyle.solid),
                  ),
                  child: Column(
                    children: [
                      if (marketing.isUploadingImage)
                        const SizedBox(
                          width: 28,
                          height: 28,
                          child: CircularProgressIndicator(color: _primaryRed, strokeWidth: 2.5),
                        )
                      else ...[
                        const Icon(Icons.add_photo_alternate_outlined, size: 36, color: Color(0xFF94A3B8)),
                        const SizedBox(height: 8),
                        Text('Add rich image banner to notification', style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B), fontWeight: FontWeight.w600)),
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            OutlinedButton.icon(
                              onPressed: _pickAndUploadImage,
                              icon: const Icon(Icons.upload_file, size: 16, color: _primaryRed),
                              label: Text('Upload Device', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: _primaryRed)),
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: Color(0xFFFECACA)),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                            ),
                            const SizedBox(width: 10),
                            OutlinedButton.icon(
                              onPressed: _showUrlInputDialog,
                              icon: const Icon(Icons.link, size: 16, color: Color(0xFF0284C7)),
                              label: Text('Paste URL', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF0284C7))),
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: Color(0xFFBAE6FD)),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                )
              else
                Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: AspectRatio(
                        aspectRatio: 16 / 9,
                        child: Image.network(
                          _imageUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            color: Colors.grey.shade200,
                            child: const Center(child: Icon(Icons.broken_image, color: Colors.grey)),
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      top: 8,
                      right: 8,
                      child: InkWell(
                        onTap: () => setState(() => _imageUrl = ''),
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                          child: const Icon(Icons.close, color: Colors.white, size: 18),
                        ),
                      ),
                    ),
                  ],
                ),
              const SizedBox(height: 16),

              // Action URL
              _buildFormLabel('Action URL / Deep Link (Optional)'),
              const SizedBox(height: 6),
              TextField(
                controller: _actionUrlController,
                decoration: _inputDecoration('e.g. /menu or /category/specials', icon: Icons.link_rounded),
              ),
              const SizedBox(height: 16),

              // Target Audience
              _buildFormLabel('Target Audience'),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFCBD5E1)),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedAudience,
                    isExpanded: true,
                    icon: const Icon(Icons.arrow_drop_down, color: Color(0xFF64748B)),
                    items: const [
                      DropdownMenuItem(value: 'all_customers', child: Text('All App Users (Everyone)')),
                      DropdownMenuItem(value: 'inactive_30_days', child: Text('Inactive Users (30+ Days)')),
                      DropdownMenuItem(value: 'favorites_only', child: Text('Loyalty / Favorites Members')),
                    ],
                    onChanged: (val) {
                      if (val != null) setState(() => _selectedAudience = val);
                    },
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Send Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: marketing.isSending ? null : _confirmAndBroadcast,
                  icon: marketing.isSending
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Icon(Icons.send_rounded, size: 18, color: Colors.white),
                  label: Text(
                    marketing.isSending ? 'Broadcasting Push...' : 'Send Broadcast Now',
                    style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _primaryRed,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    shadowColor: _primaryRed.withOpacity(0.3),
                    elevation: 3,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Live Phone Notification Preview
        _buildPhoneMockupPreview(),
        const SizedBox(height: 80),
      ],
    );
  }

  // -------------------------------------------------------------
  // REALISTIC LIVE PHONE NOTIFICATION PREVIEW
  // -------------------------------------------------------------
  Widget _buildPhoneMockupPreview() {
    final title = _titleController.text.trim();
    final message = _messageController.text.trim();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.phone_iphone_rounded, color: Color(0xFF64748B), size: 20),
            const SizedBox(width: 8),
            Text(
              'Live Customer Phone Preview',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16, color: const Color(0xFF1E293B)),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Phone Frame
        Center(
          child: Container(
            width: 310,
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(32),
              border: Border.all(color: const Color(0xFF1E293B), width: 6),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.18), blurRadius: 20, offset: const Offset(0, 10)),
              ],
            ),
            child: Column(
              children: [
                // Top Notch
                Container(
                  width: 120,
                  height: 18,
                  decoration: const BoxDecoration(
                    color: Color(0xFF0F172A),
                    borderRadius: BorderRadius.vertical(bottom: Radius.circular(12)),
                  ),
                ),

                // Lock Screen Wallpaper Area
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.purple.shade900, Colors.indigo.shade900, Colors.black],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                  child: Column(
                    children: [
                      // Lock Screen Clock
                      Text('9:41', style: GoogleFonts.inter(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w300)),
                      Text('Wednesday, October 2', style: GoogleFonts.inter(color: Colors.white70, fontSize: 12)),
                      const SizedBox(height: 24),

                      // Push Notification Card
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.92),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 10, offset: const Offset(0, 4)),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Header
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      width: 20,
                                      height: 20,
                                      decoration: BoxDecoration(
                                        color: _primaryRed,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: const Center(
                                        child: Text('L', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11)),
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Text('LASSI LOUNGE', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 11, color: const Color(0xFF1E293B))),
                                  ],
                                ),
                                Text('now', style: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 11)),
                              ],
                            ),
                            const SizedBox(height: 8),

                            // Hero Image in Notification (if attached)
                            if (_imageUrl.isNotEmpty) ...[
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: AspectRatio(
                                  aspectRatio: 16 / 9,
                                  child: Image.network(
                                    _imageUrl,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) => Container(color: Colors.grey.shade300, child: const Icon(Icons.image, size: 24)),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 8),
                            ],

                            // Title & Message
                            Text(
                              title.isNotEmpty ? title : 'Weekend Special - 20% OFF!',
                              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13, color: const Color(0xFF0F172A)),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              message.isNotEmpty ? message : 'Order your favorite dishes today and get instant delivery.',
                              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF334155), height: 1.3),
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),

                // Bottom home bar
                Container(
                  width: 100,
                  height: 4,
                  margin: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2)),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // -------------------------------------------------------------
  // 2. CAMPAIGN HISTORY TAB
  // -------------------------------------------------------------
  Widget _buildHistoryTab(MarketingProvider marketing) {
    final campaigns = marketing.campaigns;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Top 3 Metrics
        Row(
          children: [
            Expanded(
              child: _buildMetricTile(
                title: 'Total Sent',
                value: marketing.totalCampaigns.toString(),
                icon: Icons.campaign_rounded,
                color: const Color(0xFF3B82F6),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildMetricTile(
                title: 'Delivered',
                value: marketing.successfulBroadcasts.toString(),
                icon: Icons.check_circle_rounded,
                color: const Color(0xFF16A34A),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildMetricTile(
                title: 'Reach',
                value: marketing.totalReach.toString(),
                icon: Icons.devices_rounded,
                color: const Color(0xFF9333EA),
              ),
            ),
          ],
        ),
        const SizedBox(height: 18),

        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Broadcast History', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 17, color: const Color(0xFF111827))),
            Text('${campaigns.length} total', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
          ],
        ),
        const SizedBox(height: 12),

        if (campaigns.isEmpty)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 48),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: _cardBorder),
            ),
            child: Column(
              children: [
                const Icon(Icons.inbox_outlined, size: 44, color: Color(0xFF94A3B8)),
                const SizedBox(height: 10),
                Text('No campaigns sent yet', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: const Color(0xFF64748B))),
                const SizedBox(height: 4),
                Text('Switch to "Compose & Preview" to broadcast your first campaign.', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8))),
              ],
            ),
          )
        else
          ...campaigns.map((c) => _buildCampaignHistoryCard(c)).toList(),

        const SizedBox(height: 80),
      ],
    );
  }

  Widget _buildMetricTile({required String title, required String value, required IconData icon, required Color color}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 6),
          Text(value, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 20, color: const Color(0xFF111827))),
          Text(title, style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B))),
        ],
      ),
    );
  }

  Widget _buildCampaignHistoryCard(Map<String, dynamic> c) {
    final status = c['status']?.toString().toLowerCase() ?? 'sent';
    final isSent = status == 'sent';
    final isFailed = status == 'failed';
    final title = c['title']?.toString() ?? 'Campaign';
    final message = c['message']?.toString() ?? '';
    final imageUrl = c['imageUrl']?.toString() ?? '';
    final successCount = c['successCount'] ?? 0;
    final audience = c['audience']?.toString() ?? 'all_customers';

    DateTime? createdAt;
    if (c['createdAt'] != null) {
      createdAt = DateTime.tryParse(c['createdAt'].toString());
    }

    final dateStr = createdAt != null ? '${createdAt.month}/${createdAt.day}/${createdAt.year}' : 'Recent';

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _cardBorder),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 6, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Status & Date
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isSent ? const Color(0xFFDCFCE7) : (isFailed ? const Color(0xFFFEE2E2) : const Color(0xFFFEF3C7)),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  children: [
                    Icon(
                      isSent ? Icons.check_circle : (isFailed ? Icons.cancel : Icons.access_time),
                      size: 13,
                      color: isSent ? const Color(0xFF16A34A) : (isFailed ? const Color(0xFFDC2626) : const Color(0xFFD97706)),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      status.toUpperCase(),
                      style: GoogleFonts.inter(
                        fontSize: 10.5,
                        fontWeight: FontWeight.bold,
                        color: isSent ? const Color(0xFF16A34A) : (isFailed ? const Color(0xFFDC2626) : const Color(0xFFD97706)),
                      ),
                    ),
                  ],
                ),
              ),
              Text(dateStr, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8))),
            ],
          ),
          const SizedBox(height: 12),

          // Content with optional thumbnail
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (imageUrl.isNotEmpty) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: SizedBox(
                    width: 70,
                    height: 55,
                    child: Image.network(
                      imageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(color: Colors.grey.shade200, child: const Icon(Icons.broken_image, size: 20)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: const Color(0xFF1E293B))),
                    const SizedBox(height: 4),
                    Text(message, style: GoogleFonts.inter(fontSize: 12.5, color: const Color(0xFF64748B), height: 1.3), maxLines: 2, overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Divider(height: 1),
          const SizedBox(height: 10),

          // Footer stats & actions
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(6)),
                    child: Text(
                      audience == 'all_customers' ? 'All Users' : audience.replaceAll('_', ' '),
                      style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF475569), fontWeight: FontWeight.w600),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text('Delivered: $successCount devices', style: GoogleFonts.inter(fontSize: 11.5, color: const Color(0xFF64748B), fontWeight: FontWeight.bold)),
                ],
              ),
              InkWell(
                onTap: () {
                  setState(() {
                    _titleController.text = title;
                    _messageController.text = message;
                    _imageUrl = imageUrl;
                    _tabController.animateTo(0);
                  });
                  toastification.show(
                    context: context,
                    type: ToastificationType.info,
                    title: const Text('Loaded into Composer'),
                    autoCloseDuration: const Duration(seconds: 2),
                  );
                },
                child: Row(
                  children: [
                    const Icon(Icons.copy_rounded, size: 14, color: _primaryRed),
                    const SizedBox(width: 4),
                    Text('Reuse', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: _primaryRed)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFormLabel(String label) {
    return Text(label, style: GoogleFonts.inter(fontSize: 12.5, fontWeight: FontWeight.bold, color: const Color(0xFF334155)));
  }

  InputDecoration _inputDecoration(String hint, {required IconData icon}) {
    return InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
      prefixIcon: Icon(icon, size: 20, color: const Color(0xFF94A3B8)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _primaryRed, width: 2)),
    );
  }
}
