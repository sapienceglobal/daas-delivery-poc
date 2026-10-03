import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:toastification/toastification.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';

import '../providers/auth_provider.dart';
import '../providers/cms_provider.dart';
import '../widgets/app_drawer.dart';
import '../widgets/shared_bottom_nav.dart';

class CmsManagementScreen extends StatefulWidget {
  const CmsManagementScreen({Key? key}) : super(key: key);

  @override
  State<CmsManagementScreen> createState() => _CmsManagementScreenState();
}

class _CmsManagementScreenState extends State<CmsManagementScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ScrollController _scrollController = ScrollController();

  static const Color _primaryRed = Color(0xFF8B0000);
  static const Color _bgGrey = Color(0xFFF8FAFC);
  static const Color _cardBorder = Color(0xFFE2E8F0);

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final auth = context.read<AuthProvider>();
    final cms = context.read<CmsProvider>();
    final restaurantId = auth.user?['restaurantId']?.toString();
    await cms.fetchCms(restaurantId ?? 'lassi-lounge');
  }

  Future<void> _saveChanges() async {
    final cms = context.read<CmsProvider>();
    final success = await cms.saveCms();
    if (!mounted) return;

    if (success) {
      toastification.show(
        context: context,
        type: ToastificationType.success,
        title: Text('CMS Updated', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        description: Text('Website content and banner changes saved successfully!', style: GoogleFonts.inter()),
        autoCloseDuration: const Duration(seconds: 3),
      );
    } else {
      toastification.show(
        context: context,
        type: ToastificationType.error,
        title: Text('Save Failed', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        description: Text(cms.error.isNotEmpty ? cms.error : 'Failed to update CMS configuration.', style: GoogleFonts.inter()),
        autoCloseDuration: const Duration(seconds: 4),
      );
    }
  }

  String _resolveImageUrl(String? url) {
    if (url == null || url.trim().isEmpty) return '';
    final trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    if (trimmed.startsWith('/')) {
      return 'https://lassiloungeny.com$trimmed';
    }
    return 'https://lassiloungeny.com/$trimmed';
  }

  Future<void> _pickAndUploadImage({
    required String uploadKey,
    required Function(String url) onUploaded,
  }) async {
    final cms = context.read<CmsProvider>();
    try {
      final result = await FilePicker.pickFiles(
        type: FileType.image,
      );

      if (result.isNotEmpty && result.first.path != null) {
        final filePath = result.first.path!;
        final url = await cms.uploadImage(filePath, uploadKey: uploadKey);
        if (url != null && url.isNotEmpty) {
          onUploaded(url);
          if (mounted) {
            toastification.show(
              context: context,
              type: ToastificationType.success,
              title: const Text('Image Uploaded'),
              autoCloseDuration: const Duration(seconds: 2),
            );
          }
        } else if (mounted) {
          toastification.show(
            context: context,
            type: ToastificationType.error,
            title: const Text('Upload Failed'),
            description: Text(cms.error.isNotEmpty ? cms.error : 'Could not upload image.'),
            autoCloseDuration: const Duration(seconds: 3),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        toastification.show(
          context: context,
          type: ToastificationType.error,
          title: const Text('File Picker Error'),
          description: Text('$e'),
          autoCloseDuration: const Duration(seconds: 3),
        );
      }
    }
  }

  void _showUrlInputDialog({
    required String title,
    required String currentUrl,
    required Function(String newUrl) onSave,
  }) {
    final controller = TextEditingController(text: currentUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Enter direct image link (e.g. https://... or Hostinger/S3 URL):',
              style: GoogleFonts.inter(fontSize: 13, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              decoration: InputDecoration(
                hintText: 'https://...',
                prefixIcon: const Icon(Icons.link, size: 20, color: Color(0xFF6B7280)),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: _primaryRed, width: 2),
                ),
              ),
              keyboardType: TextInputType.url,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: GoogleFonts.inter(color: Colors.grey.shade700)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              onSave(controller.text.trim());
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: _primaryRed,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: Text('Apply URL', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cms = context.watch<CmsProvider>();

    return Scaffold(
      backgroundColor: _bgGrey,
      appBar: AppBar(
        toolbarHeight: 64,
        title: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(
              'Website CMS',
              style: GoogleFonts.outfit(
                color: const Color(0xFF111827),
                fontSize: 19,
                fontWeight: FontWeight.w700,
                height: 1.15,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              'Content & Banner Management',
              style: GoogleFonts.inter(
                color: const Color(0xFF6B7280),
                fontSize: 11,
                fontWeight: FontWeight.w500,
                height: 1.15,
              ),
            ),
          ],
        ),
        backgroundColor: Colors.white,
        elevation: 0.5,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Color(0xFF111827)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12.0),
            child: Center(
              child: cms.isSaving
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2.5, color: _primaryRed),
                    )
                  : ElevatedButton.icon(
                      onPressed: _saveChanges,
                      icon: const Icon(Icons.check_circle_rounded, size: 15, color: Colors.white),
                      label: Text(
                        'Save',
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _primaryRed,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                        minimumSize: const Size(0, 34),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
            ),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(bottom: BorderSide(color: Color(0xFFE5E7EB), width: 1)),
            ),
            child: TabBar(
              controller: _tabController,
              isScrollable: true,
              tabAlignment: TabAlignment.start,
              labelColor: _primaryRed,
              unselectedLabelColor: const Color(0xFF64748B),
              indicatorColor: _primaryRed,
              indicatorWeight: 3,
              labelStyle: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13),
              unselectedLabelStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13),
              tabs: const [
                Tab(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.view_carousel_outlined, size: 16),
                      SizedBox(width: 6),
                      Text('Hero Banners'),
                    ],
                  ),
                ),
                Tab(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.info_outline_rounded, size: 16),
                      SizedBox(width: 6),
                      Text('About Us'),
                    ],
                  ),
                ),
                Tab(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.restaurant_outlined, size: 16),
                      SizedBox(width: 6),
                      Text('Catering'),
                    ],
                  ),
                ),
                Tab(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.table_restaurant_outlined, size: 16),
                      SizedBox(width: 6),
                      Text('Booking'),
                    ],
                  ),
                ),
                Tab(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.confirmation_number_outlined, size: 16),
                      SizedBox(width: 6),
                      Text('Promotions'),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      drawer: const AppDrawer(),
      body: cms.isLoading
          ? const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(color: _primaryRed),
                  SizedBox(height: 16),
                  Text('Loading CMS configuration...', style: TextStyle(color: Color(0xFF64748B))),
                ],
              ),
            )
          : TabBarView(
              controller: _tabController,
              children: [
                _buildHeroBannersTab(cms),
                _buildAboutUsTab(cms),
                _buildCateringTab(cms),
                _buildBookingTab(cms),
                _buildPromotionsTab(cms),
              ],
            ),
      bottomNavigationBar: const SharedBottomNav(currentIndex: -1),
    );
  }

  // -------------------------------------------------------------
  // 1. HERO BANNERS TAB
  // -------------------------------------------------------------
  Widget _buildHeroBannersTab(CmsProvider cms) {
    final banners = cms.heroBanners;

    final bannerItems = [
      {'key': 'home', 'label': 'Home Page Hero', 'desc': 'Displayed at the top of the main landing screen.'},
      {'key': 'orderOnline', 'label': 'Order Online Hero', 'desc': 'Header banner for the order online flow.'},
      {'key': 'menu', 'label': 'Menu Page Hero', 'desc': 'Header banner on the customer digital menu.'},
      {'key': 'checkout', 'label': 'Checkout Page Hero', 'desc': 'Banner shown on cart & checkout header.'},
      {'key': 'catering', 'label': 'Catering Page Hero', 'desc': 'Banner on the catering enquiry screen.'},
      {'key': 'bookTable', 'label': 'Book a Table Hero', 'desc': 'Banner on the table reservation screen.'},
    ];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildInfoCard(
          title: 'Top Page Banners',
          description:
              'Customize high-resolution headers across customer pages. Recommended aspect ratio is 16:9 (1920x1080) for best visual presentation.',
          icon: Icons.photo_size_select_actual_outlined,
        ),
        const SizedBox(height: 16),
        ...bannerItems.map((item) {
          final key = item['key']!;
          final label = item['label']!;
          final desc = item['desc']!;
          final currentUrl = banners[key]?.toString() ?? '';

          return _buildImageCard(
            label: label,
            description: desc,
            currentUrl: currentUrl,
            uploadKey: 'hero-$key',
            aspectRatio: 16 / 9,
            onUploadRequested: () => _pickAndUploadImage(
              uploadKey: 'hero-$key',
              onUploaded: (url) => cms.updateHeroBanner(key, url),
            ),
            onUrlEditRequested: () => _showUrlInputDialog(
              title: label,
              currentUrl: currentUrl,
              onSave: (url) => cms.updateHeroBanner(key, url),
            ),
            onClearRequested: () => cms.updateHeroBanner(key, ''),
          );
        }).toList(),
        const SizedBox(height: 80),
      ],
    );
  }

  // -------------------------------------------------------------
  // 2. ABOUT US TAB
  // -------------------------------------------------------------
  Widget _buildAboutUsTab(CmsProvider cms) {
    final about = cms.aboutUs;
    final ownerImage = about['ownerImage']?.toString() ?? '';
    final restaurantImage = about['restaurantImage']?.toString() ?? '';
    final gallery = (about['galleryImages'] as List<dynamic>? ?? []);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildInfoCard(
          title: 'About Us & Gallery',
          description: 'Showcase your restaurant story, head chef/owner portraits, and customer gallery images.',
          icon: Icons.auto_stories_outlined,
        ),
        const SizedBox(height: 16),

        // Owner/Chef
        _buildImageCard(
          label: 'Owner / Head Chef Portrait',
          description: 'Square portrait shown alongside the restaurant founding story.',
          currentUrl: ownerImage,
          uploadKey: 'about-ownerImage',
          aspectRatio: 1.0,
          onUploadRequested: () => _pickAndUploadImage(
            uploadKey: 'about-ownerImage',
            onUploaded: (url) => cms.updateAboutImage('ownerImage', url),
          ),
          onUrlEditRequested: () => _showUrlInputDialog(
            title: 'Owner / Chef Image',
            currentUrl: ownerImage,
            onSave: (url) => cms.updateAboutImage('ownerImage', url),
          ),
          onClearRequested: () => cms.updateAboutImage('ownerImage', ''),
        ),

        // Restaurant spread
        _buildImageCard(
          label: 'Restaurant Ambiance / Dining Spread',
          description: 'Wide photo highlighting restaurant dining room and atmosphere.',
          currentUrl: restaurantImage,
          uploadKey: 'about-restaurantImage',
          aspectRatio: 16 / 9,
          onUploadRequested: () => _pickAndUploadImage(
            uploadKey: 'about-restaurantImage',
            onUploaded: (url) => cms.updateAboutImage('restaurantImage', url),
          ),
          onUrlEditRequested: () => _showUrlInputDialog(
            title: 'Restaurant Spread Image',
            currentUrl: restaurantImage,
            onSave: (url) => cms.updateAboutImage('restaurantImage', url),
          ),
          onClearRequested: () => cms.updateAboutImage('restaurantImage', ''),
        ),

        const SizedBox(height: 24),

        // Gallery Section
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: _cardBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Visual Gallery Photos',
                        style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16, color: const Color(0xFF111827)),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${gallery.length} photos displayed in customer gallery',
                        style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                      ),
                    ],
                  ),
                  PopupMenuButton<String>(
                    onSelected: (val) {
                      if (val == 'upload') {
                        _pickAndUploadImage(
                          uploadKey: 'gallery-new',
                          onUploaded: (url) => cms.addGalleryImage(url),
                        );
                      } else if (val == 'url') {
                        _showUrlInputDialog(
                          title: 'Add Gallery Photo',
                          currentUrl: '',
                          onSave: (url) {
                            if (url.isNotEmpty) cms.addGalleryImage(url);
                          },
                        );
                      }
                    },
                    itemBuilder: (ctx) => [
                      const PopupMenuItem(
                        value: 'upload',
                        child: Row(
                          children: [
                            Icon(Icons.upload_file, size: 18, color: _primaryRed),
                            SizedBox(width: 8),
                            Text('Upload from Device'),
                          ],
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'url',
                        child: Row(
                          children: [
                            Icon(Icons.link, size: 18, color: Color(0xFF0EA5E9)),
                            SizedBox(width: 8),
                            Text('Enter Direct URL'),
                          ],
                        ),
                      ),
                    ],
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: _primaryRed,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.add_a_photo, color: Colors.white, size: 16),
                          const SizedBox(width: 6),
                          Text('Add Photo', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              if (gallery.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 40),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.collections_outlined, size: 40, color: Color(0xFF94A3B8)),
                      const SizedBox(height: 8),
                      Text('No gallery images added yet', style: GoogleFonts.inter(color: const Color(0xFF64748B), fontWeight: FontWeight.w600)),
                      const SizedBox(height: 4),
                      Text('Tap "+ Add Photo" to showcase your restaurant ambiance.', style: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 12)),
                    ],
                  ),
                )
              else
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.0,
                  ),
                  itemCount: gallery.length,
                  itemBuilder: (ctx, idx) {
                    final item = gallery[idx];
                    final rawSrc = item is Map ? item['src']?.toString() ?? '' : item.toString();
                    final resolved = _resolveImageUrl(rawSrc);

                    return Stack(
                      children: [
                        Positioned.fill(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: resolved.isNotEmpty
                                ? CachedNetworkImage(
                                    imageUrl: resolved,
                                    fit: BoxFit.cover,
                                    placeholder: (context, url) => Shimmer.fromColors(
                                      baseColor: const Color(0xFFE2E8F0),
                                      highlightColor: const Color(0xFFF8FAFC),
                                      child: Container(
                                        color: Colors.white,
                                        child: const Center(
                                          child: Icon(Icons.image_outlined, color: Color(0xFFCBD5E1), size: 28),
                                        ),
                                      ),
                                    ),
                                    errorWidget: (_, __, ___) => Container(
                                      color: const Color(0xFFF1F5F9),
                                      child: const Icon(Icons.broken_image, color: Colors.grey),
                                    ),
                                  )
                                : Container(
                                    color: const Color(0xFFF1F5F9),
                                    child: const Icon(Icons.image, color: Colors.grey),
                                  ),
                          ),
                        ),
                        // Dark gradient overlay
                        Positioned(
                          top: 6,
                          right: 6,
                          child: InkWell(
                            onTap: () {
                              _confirmDelete(
                                title: 'Delete Gallery Photo',
                                message: 'Are you sure you want to remove this photo from the gallery?',
                                onConfirm: () => cms.removeGalleryImage(idx),
                              );
                            },
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: const BoxDecoration(
                                color: Colors.black54,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.delete_outline, color: Colors.white, size: 18),
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                ),
            ],
          ),
        ),
        const SizedBox(height: 80),
      ],
    );
  }

  // -------------------------------------------------------------
  // 3. CATERING TAB
  // -------------------------------------------------------------
  Widget _buildCateringTab(CmsProvider cms) {
    final packages = cms.cateringPackages;
    final occasions = cms.cateringOccasions;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildInfoCard(
          title: 'Catering Packages & Occasions',
          description: 'Manage menu packages starting prices, popular badges, and customer catering occasion categories.',
          icon: Icons.outdoor_grill_outlined,
        ),
        const SizedBox(height: 16),

        // SECTION 1: CATERING PACKAGES
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Catering Packages',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18, color: const Color(0xFF111827)),
            ),
            ElevatedButton.icon(
              onPressed: () => _showAddPackageDialog(cms),
              icon: const Icon(Icons.add, size: 16, color: Colors.white),
              label: Text('Add Package', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
              style: ElevatedButton.styleFrom(
                backgroundColor: _primaryRed,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        if (packages.isEmpty)
          _buildEmptyPlaceholder('No catering packages added yet', 'Click "Add Package" to configure packages.')
        else
          ...packages.asMap().entries.map((entry) {
            final idx = entry.key;
            final pkg = Map<String, dynamic>.from(entry.value as Map);
            return _buildPackageItemCard(cms, idx, pkg);
          }).toList(),

        const SizedBox(height: 32),

        // SECTION 2: CATERING OCCASIONS
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Catering Occasions',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18, color: const Color(0xFF111827)),
            ),
            ElevatedButton.icon(
              onPressed: () => _showAddOccasionDialog(cms),
              icon: const Icon(Icons.add, size: 16, color: Colors.white),
              label: Text('Add Box', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0F172A),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        if (occasions.isEmpty)
          _buildEmptyPlaceholder('No catering occasions added', 'Click "Add Box" to add occasions.')
        else
          ...occasions.asMap().entries.map((entry) {
            final idx = entry.key;
            final occ = Map<String, dynamic>.from(entry.value as Map);
            return _buildOccasionItemCard(cms, idx, occ);
          }).toList(),

        const SizedBox(height: 80),
      ],
    );
  }

  Widget _buildPackageItemCard(CmsProvider cms, int index, Map<String, dynamic> pkg) {
    final rawImg = pkg['image']?.toString() ?? '';
    final resolvedImg = _resolveImageUrl(rawImg);
    final features = (pkg['features'] as List<dynamic>? ?? []).map((e) => e.toString()).toList();
    final isPopular = pkg['popular'] == true;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isPopular ? const Color(0xFFF59E0B) : _cardBorder, width: isPopular ? 1.5 : 1),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: SizedBox(
                  width: 80,
                  height: 60,
                  child: resolvedImg.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: resolvedImg,
                          fit: BoxFit.cover,
                          placeholder: (context, url) => Shimmer.fromColors(
                            baseColor: const Color(0xFFE2E8F0),
                            highlightColor: const Color(0xFFF8FAFC),
                            child: Container(
                              color: Colors.white,
                              child: const Center(
                                child: Icon(Icons.image_outlined, color: Color(0xFFCBD5E1), size: 20),
                              ),
                            ),
                          ),
                          errorWidget: (_, __, ___) => Container(color: Colors.grey.shade200, child: const Icon(Icons.broken_image, size: 20)),
                        )
                      : Container(color: Colors.grey.shade200, child: const Icon(Icons.image, size: 20)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            pkg['name']?.toString() ?? 'Unnamed Package',
                            style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16, color: const Color(0xFF111827)),
                          ),
                        ),
                        if (isPopular)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF3C7),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'POPULAR',
                              style: GoogleFonts.inter(color: const Color(0xFFD97706), fontWeight: FontWeight.w800, fontSize: 10),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Starting at \$${(pkg['price'] ?? 0).toString()}/person',
                      style: GoogleFonts.inter(color: _primaryRed, fontWeight: FontWeight.w700, fontSize: 14),
                    ),
                  ],
                ),
              ),
              PopupMenuButton<String>(
                onSelected: (val) {
                  if (val == 'edit') {
                    _showEditPackageDialog(cms, index, pkg);
                  } else if (val == 'image_upload') {
                    _pickAndUploadImage(
                      uploadKey: 'pkg-$index',
                      onUploaded: (url) {
                        pkg['image'] = url;
                        cms.updateCateringPackage(index, pkg);
                      },
                    );
                  } else if (val == 'delete') {
                    _confirmDelete(
                      title: 'Delete Package',
                      message: 'Remove package "${pkg['name']}" from catering?',
                      onConfirm: () => cms.removeCateringPackage(index),
                    );
                  }
                },
                itemBuilder: (ctx) => [
                  const PopupMenuItem(value: 'edit', child: Text('Edit Details & Price')),
                  const PopupMenuItem(value: 'image_upload', child: Text('Upload Image')),
                  const PopupMenuItem(value: 'delete', child: Text('Delete Package', style: TextStyle(color: Colors.red))),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Included Features (${features.length})',
                style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13, color: const Color(0xFF475569)),
              ),
              InkWell(
                onTap: () => _showAddFeatureDialog(cms, index, pkg),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  child: Row(
                    children: [
                      const Icon(Icons.add_circle_outline, size: 14, color: Color(0xFF0284C7)),
                      const SizedBox(width: 4),
                      Text('Add Feature', style: GoogleFonts.inter(color: const Color(0xFF0284C7), fontWeight: FontWeight.bold, fontSize: 12)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: features.asMap().entries.map((fEntry) {
              final fIdx = fEntry.key;
              final fText = fEntry.value;
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(fText, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF334155))),
                    const SizedBox(width: 4),
                    InkWell(
                      onTap: () {
                        features.removeAt(fIdx);
                        pkg['features'] = features;
                        cms.updateCateringPackage(index, pkg);
                      },
                      child: const Icon(Icons.close, size: 14, color: Color(0xFF94A3B8)),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildOccasionItemCard(CmsProvider cms, int index, Map<String, dynamic> occ) {
    final rawImg = occ['image']?.toString() ?? '';
    final resolvedImg = _resolveImageUrl(rawImg);
    final title = occ['title']?.toString() ?? 'Occasion';
    final iconName = occ['icon']?.toString() ?? 'Heart';

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _cardBorder),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: SizedBox(
              width: 70,
              height: 55,
              child: resolvedImg.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: resolvedImg,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Shimmer.fromColors(
                        baseColor: const Color(0xFFE2E8F0),
                        highlightColor: const Color(0xFFF8FAFC),
                        child: Container(
                          color: Colors.white,
                          child: const Center(
                            child: Icon(Icons.image_outlined, color: Color(0xFFCBD5E1), size: 20),
                          ),
                        ),
                      ),
                      errorWidget: (_, __, ___) => Container(color: Colors.grey.shade200, child: const Icon(Icons.broken_image, size: 20)),
                    )
                  : Container(color: Colors.grey.shade200, child: const Icon(Icons.image, size: 20)),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: const Color(0xFF111827)),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    const Icon(Icons.stars_rounded, size: 14, color: _primaryRed),
                    const SizedBox(width: 4),
                    Text(
                      'Icon: $iconName',
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.edit_outlined, size: 20, color: Color(0xFF475569)),
            onPressed: () => _showEditOccasionDialog(cms, index, occ),
            tooltip: 'Edit Occasion',
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline, size: 20, color: Color(0xFFEF4444)),
            onPressed: () => _confirmDelete(
              title: 'Delete Occasion',
              message: 'Remove occasion "$title"?',
              onConfirm: () => cms.removeCateringOccasion(index),
            ),
            tooltip: 'Delete',
          ),
        ],
      ),
    );
  }

  // -------------------------------------------------------------
  // 4. BOOKING SETTINGS TAB
  // -------------------------------------------------------------
  Widget _buildBookingTab(CmsProvider cms) {
    final bookings = cms.bookingSettings;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildInfoCard(
          title: 'Table Reservation Settings',
          description: 'Customize ambiance cards displayed on the customer "Book a Table" screen (e.g. Romantic Dinner, Private Parties).',
          icon: Icons.event_seat_outlined,
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Booking Ambiances (${bookings.length})',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18, color: const Color(0xFF111827)),
            ),
            ElevatedButton.icon(
              onPressed: () => _showAddBookingDialog(cms),
              icon: const Icon(Icons.add, size: 16, color: Colors.white),
              label: Text('Add Setting', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
              style: ElevatedButton.styleFrom(
                backgroundColor: _primaryRed,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        if (bookings.isEmpty)
          _buildEmptyPlaceholder('No booking settings found', 'Click "Add Setting" to add table booking types.')
        else
          ...bookings.asMap().entries.map((entry) {
            final idx = entry.key;
            final item = Map<String, dynamic>.from(entry.value as Map);
            final rawImg = item['image']?.toString() ?? '';
            final resolvedImg = _resolveImageUrl(rawImg);
            final title = item['title']?.toString() ?? 'Ambiance Setting';
            final desc = item['desc']?.toString() ?? '';

            return Container(
              margin: const EdgeInsets.only(bottom: 14),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: _cardBorder),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: SizedBox(
                      width: 80,
                      height: 70,
                      child: resolvedImg.isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: resolvedImg,
                              fit: BoxFit.cover,
                              placeholder: (context, url) => Shimmer.fromColors(
                                baseColor: const Color(0xFFE2E8F0),
                                highlightColor: const Color(0xFFF8FAFC),
                                child: Container(
                                  color: Colors.white,
                                  child: const Center(
                                    child: Icon(Icons.image_outlined, color: Color(0xFFCBD5E1), size: 20),
                                  ),
                                ),
                              ),
                              errorWidget: (_, __, ___) => Container(color: Colors.grey.shade200, child: const Icon(Icons.broken_image, size: 20)),
                            )
                          : Container(color: Colors.grey.shade200, child: const Icon(Icons.image, size: 20)),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: const Color(0xFF111827)),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          desc.isNotEmpty ? desc : 'No description provided.',
                          style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B), height: 1.4),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  Column(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.edit_outlined, size: 20, color: Color(0xFF475569)),
                        onPressed: () => _showEditBookingDialog(cms, idx, item),
                        tooltip: 'Edit',
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete_outline, size: 20, color: Color(0xFFEF4444)),
                        onPressed: () => _confirmDelete(
                          title: 'Delete Setting',
                          message: 'Remove "$title" from table booking settings?',
                          onConfirm: () => cms.removeBookingSetting(idx),
                        ),
                        tooltip: 'Delete',
                      ),
                    ],
                  ),
                ],
              ),
            );
          }).toList(),

        const SizedBox(height: 80),
      ],
    );
  }

  // -------------------------------------------------------------
  // 5. PROMOTIONS PLACEMENT TAB
  // -------------------------------------------------------------
  Widget _buildPromotionsTab(CmsProvider cms) {
    final promos = cms.promotions;
    final activeCoupons = cms.activeCoupons;

    final menuPageVal = promos['menuPage'];
    final mobileHomeVal = promos['mobileHome'];

    final menuPageId = menuPageVal is Map ? menuPageVal['_id']?.toString() : menuPageVal?.toString();
    final mobileHomeId = mobileHomeVal is Map ? mobileHomeVal['_id']?.toString() : mobileHomeVal?.toString();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildInfoCard(
          title: 'Coupon Placements',
          description:
              'Select which active promotional coupons should appear pinned in high-visibility locations on customer website & mobile apps.',
          icon: Icons.campaign_outlined,
        ),
        const SizedBox(height: 16),

        // Placement 1: Menu Page Sidebar
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: _cardBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(10)),
                    child: const Icon(Icons.web, color: Color(0xFF2563EB), size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Customer Web Menu (Sidebar)', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: const Color(0xFF111827))),
                        Text('Displayed prominently on left sidebar of the customer ordering website.', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _buildCouponDropdown(
                selectedId: menuPageId,
                activeCoupons: activeCoupons,
                onChanged: (newId) => cms.updatePromotionPlacement('menuPage', newId),
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // Placement 2: Mobile App Home Screen
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: _cardBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: const Color(0xFFFDF2F8), borderRadius: BorderRadius.circular(10)),
                    child: const Icon(Icons.phone_android, color: Color(0xFFDB2777), size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Customer Mobile App (Home Screen)', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: const Color(0xFF111827))),
                        Text('Banner coupon card pinned right on the mobile app home screen.', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _buildCouponDropdown(
                selectedId: mobileHomeId,
                activeCoupons: activeCoupons,
                onChanged: (newId) => cms.updatePromotionPlacement('mobileHome', newId),
              ),
            ],
          ),
        ),

        const SizedBox(height: 80),
      ],
    );
  }

  Widget _buildCouponDropdown({
    required String? selectedId,
    required List<Map<String, dynamic>> activeCoupons,
    required Function(String?) onChanged,
  }) {
    final validSelection = activeCoupons.any((c) => c['_id']?.toString() == selectedId) ? selectedId : null;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFCBD5E1)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String?>(
          value: validSelection,
          isExpanded: true,
          hint: Text('-- None (Hide Coupon) --', style: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 14)),
          items: [
            DropdownMenuItem<String?>(
              value: null,
              child: Text('-- None (Hide Coupon) --', style: GoogleFonts.inter(color: const Color(0xFF64748B), fontSize: 14)),
            ),
            ...activeCoupons.map((c) {
              final id = c['_id']?.toString() ?? '';
              final code = c['code']?.toString() ?? 'PROMO';
              final desc = c['name']?.toString() ?? c['description']?.toString() ?? '';
              return DropdownMenuItem<String?>(
                value: id,
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: _primaryRed.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(code, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: _primaryRed)),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        desc,
                        style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF1E293B)),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ],
          onChanged: (val) => onChanged(val),
        ),
      ),
    );
  }

  // -------------------------------------------------------------
  // REUSABLE COMPONENTS & DIALOGS
  // -------------------------------------------------------------
  Widget _buildInfoCard({required String title, required String description, required IconData icon}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [_primaryRed.withOpacity(0.08), const Color(0xFFFEE2E2).withOpacity(0.4)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: _primaryRed.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: _primaryRed, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: const Color(0xFF111827))),
                const SizedBox(height: 4),
                Text(description, style: GoogleFonts.inter(fontSize: 12.5, color: const Color(0xFF4B5563), height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildImageCard({
    required String label,
    required String description,
    required String currentUrl,
    required String uploadKey,
    required double aspectRatio,
    required VoidCallback onUploadRequested,
    required VoidCallback onUrlEditRequested,
    required VoidCallback onClearRequested,
  }) {
    final cms = context.watch<CmsProvider>();
    final isUploading = cms.uploadingKey == uploadKey;
    final resolvedUrl = _resolveImageUrl(currentUrl);

    return Container(
      margin: const EdgeInsets.only(bottom: 18),
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: const Color(0xFF1E293B))),
                    Text(description, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
                  ],
                ),
              ),
              if (currentUrl.isNotEmpty)
                IconButton(
                  icon: const Icon(Icons.delete_outline, size: 20, color: Color(0xFFEF4444)),
                  onPressed: onClearRequested,
                  tooltip: 'Clear Banner',
                ),
            ],
          ),
          const SizedBox(height: 12),

          // Image Container
          AspectRatio(
            aspectRatio: aspectRatio,
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              clipBehavior: Clip.antiAlias,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (resolvedUrl.isNotEmpty)
                    CachedNetworkImage(
                      imageUrl: resolvedUrl,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Shimmer.fromColors(
                        baseColor: const Color(0xFFE2E8F0),
                        highlightColor: const Color(0xFFF8FAFC),
                        child: Container(
                          color: Colors.white,
                          child: Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.image_outlined, size: 40, color: Color(0xFFCBD5E1)),
                                const SizedBox(height: 8),
                                Text(
                                  'Loading image...',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF94A3B8),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      errorWidget: (_, __, ___) => Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.broken_image_outlined, color: Color(0xFF94A3B8), size: 36),
                            const SizedBox(height: 6),
                            Text('Failed to load image preview', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8))),
                          ],
                        ),
                      ),
                    )
                  else
                    Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.add_photo_alternate_outlined, color: Color(0xFF94A3B8), size: 40),
                          const SizedBox(height: 6),
                          Text('No banner image configured', style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B), fontWeight: FontWeight.w600)),
                          Text('Choose an action below to upload', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8))),
                        ],
                      ),
                    ),

                  // Uploading overlay
                  if (isUploading)
                    Container(
                      color: Colors.black45,
                      child: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
                            const SizedBox(height: 10),
                            Text('Uploading image...', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Quick Action Buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: isUploading ? null : onUploadRequested,
                  icon: const Icon(Icons.upload_file, size: 16, color: _primaryRed),
                  label: Text('Upload Device', style: GoogleFonts.inter(color: _primaryRed, fontWeight: FontWeight.bold, fontSize: 12.5)),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFFFECACA)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: isUploading ? null : onUrlEditRequested,
                  icon: const Icon(Icons.link, size: 16, color: Color(0xFF0284C7)),
                  label: Text('Paste URL', style: GoogleFonts.inter(color: const Color(0xFF0284C7), fontWeight: FontWeight.bold, fontSize: 12.5)),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFFBAE6FD)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyPlaceholder(String title, String subtitle) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 40),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _cardBorder),
      ),
      child: Column(
        children: [
          const Icon(Icons.inbox_outlined, size: 40, color: Color(0xFF94A3B8)),
          const SizedBox(height: 8),
          Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14, color: const Color(0xFF64748B))),
          const SizedBox(height: 4),
          Text(subtitle, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8))),
        ],
      ),
    );
  }

  // --- Catering Package Dialogs ---
  void _showAddPackageDialog(CmsProvider cms) {
    final nameCtrl = TextEditingController(text: 'New Package');
    final priceCtrl = TextEditingController(text: '15.99');
    final imgCtrl = TextEditingController();
    bool isPopular = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text('Add Catering Package', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildDialogTextField('Package Name', nameCtrl, 'e.g. Deluxe Dinner Package'),
                const SizedBox(height: 12),
                _buildDialogTextField('Price (Starting From \$)', priceCtrl, '19.99', isNumber: true),
                const SizedBox(height: 12),
                _buildDialogTextField('Image URL (optional)', imgCtrl, 'https://...'),
                const SizedBox(height: 12),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  value: isPopular,
                  title: Text('Mark as "Popular" Package', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                  onChanged: (val) => setDialogState(() => isPopular = val ?? false),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text('Cancel', style: GoogleFonts.inter(color: Colors.grey.shade700)),
            ),
            ElevatedButton(
              onPressed: () {
                final price = double.tryParse(priceCtrl.text) ?? 0;
                cms.addCateringPackage(
                  name: nameCtrl.text.trim(),
                  price: price,
                  popular: isPopular,
                  image: imgCtrl.text.trim(),
                  features: ['Appetizers', 'Main Courses', 'Sides & Breads'],
                );
                Navigator.pop(ctx);
              },
              style: ElevatedButton.styleFrom(backgroundColor: _primaryRed),
              child: Text('Create Package', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  void _showEditPackageDialog(CmsProvider cms, int index, Map<String, dynamic> pkg) {
    final nameCtrl = TextEditingController(text: pkg['name']?.toString() ?? '');
    final priceCtrl = TextEditingController(text: (pkg['price'] ?? 0).toString());
    final imgCtrl = TextEditingController(text: pkg['image']?.toString() ?? '');
    bool isPopular = pkg['popular'] == true;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text('Edit Catering Package', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildDialogTextField('Package Name', nameCtrl, 'Package Name'),
                const SizedBox(height: 12),
                _buildDialogTextField('Price (Starting From \$)', priceCtrl, '0.00', isNumber: true),
                const SizedBox(height: 12),
                _buildDialogTextField('Image URL', imgCtrl, 'https://...'),
                const SizedBox(height: 12),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  value: isPopular,
                  title: Text('Mark as "Popular" Package', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                  onChanged: (val) => setDialogState(() => isPopular = val ?? false),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text('Cancel', style: GoogleFonts.inter(color: Colors.grey.shade700)),
            ),
            ElevatedButton(
              onPressed: () {
                pkg['name'] = nameCtrl.text.trim();
                pkg['price'] = double.tryParse(priceCtrl.text) ?? 0;
                pkg['image'] = imgCtrl.text.trim();
                pkg['popular'] = isPopular;
                cms.updateCateringPackage(index, pkg);
                Navigator.pop(ctx);
              },
              style: ElevatedButton.styleFrom(backgroundColor: _primaryRed),
              child: Text('Save Changes', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddFeatureDialog(CmsProvider cms, int index, Map<String, dynamic> pkg) {
    final ctrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Add Package Feature', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 17)),
        content: TextField(
          controller: ctrl,
          decoration: InputDecoration(
            hintText: 'e.g. 2 Appetizers & 1 Dessert',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              if (ctrl.text.trim().isNotEmpty) {
                final features = (pkg['features'] as List<dynamic>? ?? []).map((e) => e.toString()).toList();
                features.add(ctrl.text.trim());
                pkg['features'] = features;
                cms.updateCateringPackage(index, pkg);
              }
              Navigator.pop(ctx);
            },
            style: ElevatedButton.styleFrom(backgroundColor: _primaryRed),
            child: const Text('Add', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  // --- Catering Occasion Dialogs ---
  void _showAddOccasionDialog(CmsProvider cms) {
    final titleCtrl = TextEditingController(text: 'Celebration');
    final iconCtrl = TextEditingController(text: 'Heart');
    final imgCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Add Catering Occasion', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildDialogTextField('Occasion Title', titleCtrl, 'e.g. Weddings, Corporate Events'),
              const SizedBox(height: 12),
              _buildDialogTextField('Icon Name (Lucide/Flutter)', iconCtrl, 'Heart, Gift, Briefcase, Users, Music'),
              const SizedBox(height: 12),
              _buildDialogTextField('Image URL', imgCtrl, 'https://...'),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              cms.addCateringOccasion(
                title: titleCtrl.text.trim(),
                icon: iconCtrl.text.trim(),
                image: imgCtrl.text.trim(),
              );
              Navigator.pop(ctx);
            },
            style: ElevatedButton.styleFrom(backgroundColor: _primaryRed),
            child: const Text('Add Occasion', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showEditOccasionDialog(CmsProvider cms, int index, Map<String, dynamic> occ) {
    final titleCtrl = TextEditingController(text: occ['title']?.toString() ?? '');
    final iconCtrl = TextEditingController(text: occ['icon']?.toString() ?? '');
    final imgCtrl = TextEditingController(text: occ['image']?.toString() ?? '');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Edit Catering Occasion', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildDialogTextField('Occasion Title', titleCtrl, 'Title'),
              const SizedBox(height: 12),
              _buildDialogTextField('Icon Name', iconCtrl, 'Heart, Gift, etc.'),
              const SizedBox(height: 12),
              _buildDialogTextField('Image URL', imgCtrl, 'https://...'),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              occ['title'] = titleCtrl.text.trim();
              occ['icon'] = iconCtrl.text.trim();
              occ['image'] = imgCtrl.text.trim();
              cms.updateCateringOccasion(index, occ);
              Navigator.pop(ctx);
            },
            style: ElevatedButton.styleFrom(backgroundColor: _primaryRed),
            child: const Text('Save', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  // --- Booking Dialogs ---
  void _showAddBookingDialog(CmsProvider cms) {
    final titleCtrl = TextEditingController(text: 'Romantic Dinner');
    final descCtrl = TextEditingController(text: 'A cozy ambiance for you and your loved one.');
    final imgCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Add Booking Setting', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildDialogTextField('Setting Title', titleCtrl, 'e.g. Private Events'),
              const SizedBox(height: 12),
              _buildDialogTextField('Description', descCtrl, 'Short description of this setting...', maxLines: 3),
              const SizedBox(height: 12),
              _buildDialogTextField('Image URL', imgCtrl, 'https://...'),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              cms.addBookingSetting(
                title: titleCtrl.text.trim(),
                desc: descCtrl.text.trim(),
                image: imgCtrl.text.trim(),
              );
              Navigator.pop(ctx);
            },
            style: ElevatedButton.styleFrom(backgroundColor: _primaryRed),
            child: const Text('Add Setting', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showEditBookingDialog(CmsProvider cms, int index, Map<String, dynamic> item) {
    final titleCtrl = TextEditingController(text: item['title']?.toString() ?? '');
    final descCtrl = TextEditingController(text: item['desc']?.toString() ?? '');
    final imgCtrl = TextEditingController(text: item['image']?.toString() ?? '');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Edit Booking Setting', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildDialogTextField('Setting Title', titleCtrl, 'Title'),
              const SizedBox(height: 12),
              _buildDialogTextField('Description', descCtrl, 'Description', maxLines: 3),
              const SizedBox(height: 12),
              _buildDialogTextField('Image URL', imgCtrl, 'https://...'),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              item['title'] = titleCtrl.text.trim();
              item['desc'] = descCtrl.text.trim();
              item['image'] = imgCtrl.text.trim();
              cms.updateBookingSetting(index, item);
              Navigator.pop(ctx);
            },
            style: ElevatedButton.styleFrom(backgroundColor: _primaryRed),
            child: const Text('Save', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildDialogTextField(String label, TextEditingController ctrl, String hint, {bool isNumber = false, int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
        const SizedBox(height: 6),
        TextField(
          controller: ctrl,
          keyboardType: isNumber ? const TextInputType.numberWithOptions(decimal: true) : TextInputType.text,
          maxLines: maxLines,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: _primaryRed, width: 2)),
          ),
        ),
      ],
    );
  }

  void _confirmDelete({required String title, required String message, required VoidCallback onConfirm}) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 17, color: const Color(0xFFDC2626))),
        content: Text(message, style: GoogleFonts.inter(fontSize: 13.5, color: const Color(0xFF4B5563))),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              onConfirm();
            },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFDC2626)),
            child: const Text('Delete', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
