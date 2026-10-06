import 'dart:io';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shimmer/shimmer.dart';
import 'package:path_provider/path_provider.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../providers/menu_provider.dart';
import '../models/menu_model.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';
import '../widgets/shared_app_bar.dart';
import '../widgets/shared_bottom_nav.dart';

class MenuManagementScreen extends StatefulWidget {
  const MenuManagementScreen({super.key});

  @override
  State<MenuManagementScreen> createState() => _MenuManagementScreenState();
}

class _MenuManagementScreenState extends State<MenuManagementScreen> {
  String _activeCategoryId = 'all';
  String _searchQuery = '';
  String _statusFilter = 'All Status';
  String _categoryFilter = 'All Categories';
  bool _isGridView = false;
  bool _showTipBanner = true;

  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<MenuProvider>().fetchMenu();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  // --- Category Visual Style Resolver ---
  Map<String, dynamic> _getCategoryStyle(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('beverage') ||
        lower.contains('drink') ||
        lower.contains('lassi') ||
        lower.contains('shake') ||
        lower.contains('milk') ||
        lower.contains('tea') ||
        lower.contains('coffee')) {
      return {
        'bg': const Color(0xFFFEF3C7),
        'color': const Color(0xFFD97706),
        'icon': Icons.local_cafe_outlined,
      };
    } else if (lower.contains('veg main') ||
        lower.contains('greens') ||
        lower.contains('salad') ||
        lower.contains('paneer') ||
        lower.contains('dal') ||
        (lower.contains('veg') && !lower.contains('non'))) {
      return {
        'bg': const Color(0xFFDCFCE7),
        'color': const Color(0xFF16A34A),
        'icon': Icons.eco_rounded,
      };
    } else if (lower.contains('non veg') ||
        lower.contains('chicken') ||
        lower.contains('appetiz') ||
        lower.contains('meat') ||
        lower.contains('grill') ||
        lower.contains('tandoor') ||
        lower.contains('tikka') ||
        lower.contains('salmon') ||
        lower.contains('fish')) {
      return {
        'bg': const Color(0xFFFEE2E2),
        'color': const Color(0xFFDC2626),
        'icon': Icons.kebab_dining_rounded,
      };
    } else if (lower.contains('dessert') ||
        lower.contains('sweet') ||
        lower.contains('cake') ||
        lower.contains('ice cream') ||
        lower.contains('kulfi') ||
        lower.contains('jamun')) {
      return {
        'bg': const Color(0xFFF3E8FF),
        'color': const Color(0xFF9333EA),
        'icon': Icons.cake_outlined,
      };
    } else if (lower.contains('bread') ||
        lower.contains('roti') ||
        lower.contains('naan') ||
        lower.contains('paratha')) {
      return {
        'bg': const Color(0xFFFFEDD5),
        'color': const Color(0xFFEA580C),
        'icon': Icons.bakery_dining_outlined,
      };
    } else {
      return {
        'bg': const Color(0xFFE0F2FE),
        'color': const Color(0xFF0284C7),
        'icon': Icons.restaurant_menu_rounded,
      };
    }
  }

  // --- Image Fallback Resolver ---
  Widget _buildItemImage(MenuItemModel item, {double width = 72, double height = 72}) {
    if (item.imageUrl != null &&
        item.imageUrl!.isNotEmpty &&
        item.imageUrl!.startsWith('http') &&
        !item.imageUrl!.contains('localhost')) {
      return CachedNetworkImage(
        imageUrl: item.imageUrl!,
        width: width,
        height: height,
        fit: BoxFit.cover,
        placeholder: (_, __) => _buildPlaceholder(width: width, height: height),
        errorWidget: (_, __, ___) => _resolveLocalOrPlaceholder(item, width: width, height: height),
      );
    }
    return _resolveLocalOrPlaceholder(item, width: width, height: height);
  }

  Widget _resolveLocalOrPlaceholder(MenuItemModel item, {double width = 72, double height = 72}) {
    final lower = item.name.toLowerCase();
    String? localAsset;

    if (lower.contains('mango') && lower.contains('lassi')) {
      localAsset = 'assets/images/branded/lassi-lounge/dishes/mango-lassi.jpg';
    } else if (lower.contains('sweet') && lower.contains('lassi')) {
      localAsset = 'assets/images/branded/lassi-lounge/dishes/mango-lassi.jpg';
    } else if (lower.contains('salt') && lower.contains('lassi')) {
      localAsset = 'assets/images/branded/lassi-lounge/dishes/mango-lassi.jpg';
    } else if (lower.contains('butter') && lower.contains('chicken')) {
      localAsset = 'assets/images/branded/lassi-lounge/dishes/butter-chicken.jpg';
    } else if (lower.contains('chicken') && lower.contains('tikka')) {
      localAsset = 'assets/images/branded/lassi-lounge/dishes/paneer-tikka.jpg';
    } else if (lower.contains('tandoori') || lower.contains('grill') || lower.contains('salmon')) {
      localAsset = 'assets/images/branded/lassi-lounge/dishes/paneer-tikka.jpg';
    } else if (lower.contains('biryani')) {
      localAsset = 'assets/images/branded/lassi-lounge/dishes/chicken-biryani.jpg';
    } else if (lower.contains('dal') || lower.contains('makhani')) {
      localAsset = 'assets/images/branded/lassi-lounge/dishes/dal-makhani.jpg';
    } else if (lower.contains('lamb') || lower.contains('rogan')) {
      localAsset = 'assets/images/branded/lassi-lounge/dishes/lamb-rogan-josh.jpg';
    } else if (lower.contains('paneer')) {
      localAsset = 'assets/images/branded/lassi-lounge/dishes/paneer-tikka.jpg';
    } else if (lower.contains('spring') && lower.contains('roll')) {
      localAsset = 'assets/images/branded/lassi-lounge/dishes/veg-spring-rolls.png';
    }

    if (localAsset != null) {
      return Image.asset(
        localAsset,
        width: width,
        height: height,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _buildPlaceholder(width: width, height: height),
      );
    }

    return _buildPlaceholder(width: width, height: height);
  }

  Widget _buildPlaceholder({double width = 72, double height = 72}) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.image_outlined, size: 24, color: Color(0xFF94A3B8)),
          const SizedBox(height: 3),
          Text(
            'NO IMAGE',
            style: GoogleFonts.inter(
              fontSize: 8.5,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF94A3B8),
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  // --- Import / Export Handlers ---
  Future<void> _handleImportExport() async {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Import / Export Menu', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
            const SizedBox(height: 20),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFFFFEDD5), borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.upload_file_rounded, color: Color(0xFFEA580C)),
              ),
              title: Text('Import CSV', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
              subtitle: Text('Update menu items from a file', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
              onTap: () async {
                Navigator.pop(ctx);
                final result = await FilePicker.pickFiles(
                  type: FileType.custom,
                  allowedExtensions: ['csv'],
                );
                if (result != null && result.isNotEmpty && mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Importing ${result.first.name}...')));
                }
              },
            ),
            const SizedBox(height: 8),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFFFFEDD5), borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.download_rounded, color: Color(0xFFEA580C)),
              ),
              title: Text('Export CSV', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
              subtitle: Text('Download your current menu', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
              onTap: () async {
                Navigator.pop(ctx);
                final provider = context.read<MenuProvider>();
                _exportMenuToCSV(provider.categories);
              },
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Future<void> _exportMenuToCSV(List<CategoryModel> categories) async {
    final buffer = StringBuffer();
    buffer.writeln('Category,Item Name,Description,Price,Status,Type,Prep Time');

    for (var cat in categories) {
      for (var item in cat.items) {
        final type = item.isVeg ? 'Veg' : 'Non-Veg';
        final status = item.isAvailable ? 'Active' : 'Inactive';
        buffer.writeln('"${cat.name}","${item.name}","${item.description}",${item.price},$status,$type,${item.prepTime ?? ""}');
      }
    }

    try {
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/menu_export_${DateTime.now().millisecondsSinceEpoch}.csv');
      await file.writeAsString(buffer.toString());
      await Share.shareXFiles([XFile(file.path)], text: 'Exported Menu');
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to export: $e')));
    }
  }

  // --- Category Sheet ---
  void _showCategorySheet([CategoryModel? existingCat]) {
    final TextEditingController nameCtrl = TextEditingController(text: existingCat?.name ?? '');
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 20, right: 20, top: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(existingCat == null ? 'Add Category' : 'Edit Category', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
            const SizedBox(height: 16),
            TextField(
              controller: nameCtrl,
              decoration: const InputDecoration(labelText: 'Category Name', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFEA580C),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () {
                  if (nameCtrl.text.trim().isNotEmpty) {
                    if (existingCat == null) {
                      context.read<MenuProvider>().addCategory(nameCtrl.text.trim());
                    } else {
                      context.read<MenuProvider>().updateCategory(existingCat.id, nameCtrl.text.trim());
                    }
                    Navigator.pop(ctx);
                  }
                },
                child: Text(existingCat == null ? 'Save Category' : 'Update Category', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white)),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  void _confirmDeleteCategory(CategoryModel cat) {
    if (cat.items.isNotEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cannot delete a category that contains items. Move or delete them first.')));
      return;
    }

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Category?'),
        content: Text('Are you sure you want to delete "${cat.name}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              context.read<MenuProvider>().deleteCategory(cat.id);
              Navigator.pop(ctx);
              if (_activeCategoryId == cat.id) {
                setState(() => _activeCategoryId = 'all');
              }
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  List<ItemModifier> _parseModifiers(String text) {
    if (text.isEmpty) return [];
    final lines = text.split('\n');
    final List<ItemModifier> result = [];
    for (var line in lines) {
      if (line.trim().isEmpty) continue;
      final parts = line.split(':');
      if (parts.length == 2) {
        final name = parts[0].trim();
        final price = double.tryParse(parts[1].trim()) ?? 0.0;
        result.add(ItemModifier(name: name, price: price));
      }
    }
    return result;
  }

  String _modifiersToText(List<ItemModifier> mods) {
    return mods.map((m) => '${m.name}:${m.price}').join('\n');
  }

  // --- Add/Edit Menu Item Modal Sheet ---
  void _showAddItemSheet([MenuItemModel? existingItem]) {
    final nameCtrl = TextEditingController(text: existingItem?.name ?? '');
    final priceCtrl = TextEditingController(text: existingItem?.price.toString() ?? '');
    final descCtrl = TextEditingController(text: existingItem?.description ?? '');
    final prepCtrl = TextEditingController(text: existingItem?.prepTime ?? '');
    final imageCtrl = TextEditingController(text: existingItem?.imageUrl ?? '');
    final tagsCtrl = TextEditingController(text: existingItem?.tags ?? '');
    final sizeVariationsCtrl = TextEditingController(text: _modifiersToText(existingItem?.sizeVariations ?? []));
    final addOnsCtrl = TextEditingController(text: _modifiersToText(existingItem?.addOns ?? []));

    String selectedCatId = existingItem?.categoryId ?? (context.read<MenuProvider>().categories.isNotEmpty ? context.read<MenuProvider>().categories.first.id : '');

    bool isVeg = existingItem?.isVeg ?? true;
    bool isVegan = existingItem?.isVegan ?? false;
    bool isSpicy = existingItem?.isSpicy ?? false;
    bool isGlutenFree = existingItem?.isGlutenFree ?? false;
    bool isBestseller = existingItem?.isBestseller ?? false;
    bool isAvailable = existingItem?.isAvailable ?? true;

    bool isUploadingImage = false;

    Future<void> uploadImage(StateSetter setModalState, TextEditingController imageCtrl) async {
      final result = await FilePicker.pickFiles(type: FileType.image);
      if (result != null && result.isNotEmpty) {
        setModalState(() => isUploadingImage = true);
        try {
          final file = result.first;
          final request = http.MultipartRequest('POST', Uri.parse('${ApiService.baseUrl}/api/upload/multiple'));
          request.headers.addAll(ApiService.buildHeaders());

          if (file.path != null) {
            request.files.add(await http.MultipartFile.fromPath('images', file.path!));
          } else {
            throw Exception('File path not found');
          }

          final response = await request.send();
          final responseData = await response.stream.bytesToString();
          final decoded = jsonDecode(responseData);

          if (response.statusCode == 200 && decoded['data'] != null && decoded['data'].isNotEmpty) {
            imageCtrl.text = decoded['data'][0]['url'];
          } else {
            throw Exception(decoded['error'] ?? 'Upload failed');
          }
        } catch (e) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to upload image: $e')));
          }
        } finally {
          setModalState(() => isUploadingImage = false);
        }
      }
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setModalState) {
            return Container(
              height: MediaQuery.of(context).size.height * 0.9,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Column(
                children: [
                  // Header
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    decoration: BoxDecoration(
                      border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(existingItem == null ? 'Add Menu Item' : 'Edit Menu Item', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
                        IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                      ],
                    ),
                  ),

                  // Scrollable Form
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 1. Basic Information
                          Text('Basic Information', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFFEA580C))),
                          const SizedBox(height: 12),
                          TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Item Name *', border: OutlineInputBorder())),
                          const SizedBox(height: 12),
                          DropdownButtonFormField<String>(
                            decoration: const InputDecoration(labelText: 'Category *', border: OutlineInputBorder()),
                            value: selectedCatId.isNotEmpty ? selectedCatId : null,
                            items: context.read<MenuProvider>().categories.map((c) => DropdownMenuItem(value: c.id, child: Text(c.name))).toList(),
                            onChanged: (val) {
                              if (val != null) setModalState(() => selectedCatId = val);
                            },
                          ),
                          const SizedBox(height: 12),
                          TextField(controller: descCtrl, decoration: const InputDecoration(labelText: 'Description', border: OutlineInputBorder()), maxLines: 2),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(child: TextField(controller: priceCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Price (\$) *', border: OutlineInputBorder()))),
                              const SizedBox(width: 12),
                              Expanded(child: TextField(controller: prepCtrl, decoration: const InputDecoration(labelText: 'Prep Time (e.g. 15 min)', border: OutlineInputBorder()))),
                            ],
                          ),
                          const SizedBox(height: 24),

                          // 2. Media & Tags
                          Text('Media & Tags', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFFEA580C))),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: TextField(controller: imageCtrl, decoration: const InputDecoration(labelText: 'Image URL', hintText: 'https://...', border: OutlineInputBorder())),
                              ),
                              const SizedBox(width: 8),
                              isUploadingImage
                                  ? const Padding(
                                      padding: EdgeInsets.all(12.0),
                                      child: SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFFEA580C))),
                                    )
                                  : IconButton(
                                      onPressed: () => uploadImage(setModalState, imageCtrl),
                                      icon: const Icon(Icons.upload_file),
                                      color: const Color(0xFFEA580C),
                                      tooltip: 'Upload Image',
                                    ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          TextField(controller: tagsCtrl, decoration: const InputDecoration(labelText: 'Search Tags', hintText: 'spicy, popular, lassi', border: OutlineInputBorder())),
                          const SizedBox(height: 24),

                          // 3. Properties & Dietary
                          Text('Properties', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFFEA580C))),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              FilterChip(
                                label: const Text('Veg'),
                                selected: isVeg,
                                selectedColor: const Color(0xFFDCFCE7),
                                onSelected: (val) => setModalState(() => isVeg = val),
                              ),
                              FilterChip(
                                label: const Text('Vegan'),
                                selected: isVegan,
                                selectedColor: const Color(0xFFDCFCE7),
                                onSelected: (val) => setModalState(() => isVegan = val),
                              ),
                              FilterChip(
                                label: const Text('Spicy'),
                                selected: isSpicy,
                                selectedColor: const Color(0xFFFEE2E2),
                                onSelected: (val) => setModalState(() => isSpicy = val),
                              ),
                              FilterChip(
                                label: const Text('Gluten Free'),
                                selected: isGlutenFree,
                                selectedColor: const Color(0xFFFEF3C7),
                                onSelected: (val) => setModalState(() => isGlutenFree = val),
                              ),
                              FilterChip(
                                label: const Text('Bestseller'),
                                selected: isBestseller,
                                selectedColor: const Color(0xFFFFEDD5),
                                onSelected: (val) => setModalState(() => isBestseller = val),
                              ),
                              FilterChip(
                                label: const Text('Available'),
                                selected: isAvailable,
                                selectedColor: const Color(0xFFDCFCE7),
                                onSelected: (val) => setModalState(() => isAvailable = val),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),

                          // 4. Customizations & Modifiers
                          Text('Customizations', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFFEA580C))),
                          const SizedBox(height: 8),
                          TextField(
                            controller: sizeVariationsCtrl,
                            maxLines: 3,
                            decoration: const InputDecoration(
                              labelText: 'Size Variations',
                              hintText: 'e.g. Small:5.99\nLarge:9.99',
                              helperText: 'Type each option on a new line. Format -> Name:Price',
                              border: OutlineInputBorder(),
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextField(
                            controller: addOnsCtrl,
                            maxLines: 3,
                            decoration: const InputDecoration(
                              labelText: 'Add-ons',
                              hintText: 'e.g. Extra Malai:1.00\nDry Fruits:1.50',
                              helperText: 'Type each option on a new line. Format -> Name:Price',
                              border: OutlineInputBorder(),
                            ),
                          ),
                          SizedBox(height: MediaQuery.of(ctx).viewInsets.bottom + 20),
                        ],
                      ),
                    ),
                  ),

                  // Footer Actions
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(border: Border(top: BorderSide(color: Colors.grey.shade200))),
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFEA580C),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () {
                          if (nameCtrl.text.trim().isEmpty || priceCtrl.text.trim().isEmpty || selectedCatId.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill required fields (Name, Price, Category)')));
                            return;
                          }

                          final newItem = MenuItemModel(
                            id: existingItem?.id ?? '',
                            name: nameCtrl.text.trim(),
                            description: descCtrl.text.trim(),
                            price: double.tryParse(priceCtrl.text) ?? 0,
                            imageUrl: imageCtrl.text.trim().isEmpty ? null : imageCtrl.text.trim(),
                            categoryId: selectedCatId,
                            isVeg: isVeg,
                            isVegan: isVegan,
                            isSpicy: isSpicy,
                            isGlutenFree: isGlutenFree,
                            isBestseller: isBestseller,
                            isAvailable: isAvailable,
                            prepTime: prepCtrl.text.trim(),
                            tags: tagsCtrl.text.trim(),
                            sizeVariations: _parseModifiers(sizeVariationsCtrl.text),
                            addOns: _parseModifiers(addOnsCtrl.text),
                          );

                          if (existingItem == null) {
                            context.read<MenuProvider>().addMenuItem(newItem);
                          } else {
                            context.read<MenuProvider>().updateMenuItem(existingItem.id, newItem);
                          }
                          Navigator.pop(ctx);
                        },
                        child: Text(
                          existingItem == null ? 'Save Item' : 'Update Item',
                          style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final menuProvider = context.watch<MenuProvider>();
    final categories = menuProvider.categories;

    // Flatten all items
    final allItems = categories.expand((cat) => cat.items).toList();

    // Filter items based on active tab, search, status, and category pill
    final filteredItems = allItems.where((item) {
      if (_activeCategoryId != 'all' && item.categoryId != _activeCategoryId) return false;
      if (_categoryFilter != 'All Categories' && item.categoryId != _categoryFilter) return false;
      if (_searchQuery.isNotEmpty && !item.name.toLowerCase().contains(_searchQuery.toLowerCase())) return false;
      if (_statusFilter == 'Available' && !item.isAvailable) return false;
      if (_statusFilter == 'Sold Out' && item.isAvailable) return false;
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: const SharedAppBar(),
      drawer: const AppDrawer(),
      bottomNavigationBar: const SharedBottomNav(currentIndex: 4),
      body: RefreshIndicator(
        color: const Color(0xFFEA580C),
        onRefresh: () => context.read<MenuProvider>().fetchMenu(force: true),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // Header Section: Title, Subtitle, and Action Buttons
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Menu Management',
                      style: GoogleFonts.inter(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF0F172A),
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Manage your restaurant menu, categories and items.',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: const Color(0xFF64748B),
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Action Buttons Row: [⬇ Import / Export]  [+ Add Menu Item]
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: _handleImportExport,
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: Color(0xFFEA580C), width: 1.5),
                              backgroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              elevation: 0,
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.file_download_outlined, color: Color(0xFFEA580C), size: 18),
                                const SizedBox(width: 8),
                                Text(
                                  'Import / Export',
                                  style: GoogleFonts.inter(
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFFEA580C),
                                    fontSize: 13.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () => _showAddItemSheet(),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFEA580C),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              elevation: 0,
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.add_rounded, color: Colors.white, size: 20),
                                const SizedBox(width: 6),
                                Text(
                                  'Add Menu Item',
                                  style: GoogleFonts.inter(
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                    fontSize: 13.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // Horizontal Categories Carousel
            SliverToBoxAdapter(
              child: SizedBox(
                height: 110,
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  scrollDirection: Axis.horizontal,
                  children: [
                    _buildAddCategoryBtn(),
                    _buildCategoryTab('all', 'All Items', allItems.length),
                    ...categories.map((cat) => _buildDragTargetCategoryTab(cat)),
                  ],
                ),
              ),
            ),

            // Tip Banner & Search/Filters Row
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  children: [
                    if (_showTipBanner) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF7ED),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFFFEDD5)),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Padding(
                              padding: EdgeInsets.only(top: 2),
                              child: Icon(Icons.info_outline_rounded, color: Color(0xFFEA580C), size: 20),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'Tip: You can press and hold items below and drag them directly onto any category tab above to move them between categories!',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w400,
                                  height: 1.35,
                                  color: const Color(0xFF7C2D12),
                                ),
                              ),
                            ),
                            GestureDetector(
                              onTap: () => setState(() => _showTipBanner = false),
                              child: const Padding(
                                padding: EdgeInsets.only(left: 6, top: 2),
                                child: Icon(Icons.close_rounded, size: 18, color: Color(0xFF9A3412)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 14),

                    // Search and Filter Controls Row
                    _buildSearchAndFiltersRow(categories),
                    const SizedBox(height: 14),
                  ],
                ),
              ),
            ),

            // Items List / Grid or Loading Shimmer
            if (menuProvider.isLoading)
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => _buildShimmerItemRow(),
                  childCount: 5,
                ),
              )
            else if (filteredItems.isEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 40),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(Icons.restaurant_outlined, size: 48, color: Colors.grey.shade400),
                        const SizedBox(height: 12),
                        Text(
                          'No menu items found',
                          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: const Color(0xFF64748B)),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Try clearing your search or status filter',
                          style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else if (_isGridView)
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.72,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final item = filteredItems[index];
                      final catName = categories.firstWhere((c) => c.id == item.categoryId, orElse: () => CategoryModel(id: '', name: 'General', items: [])).name;
                      return _buildGridItemCard(item, catName);
                    },
                    childCount: filteredItems.length,
                  ),
                ),
              )
            else
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final item = filteredItems[index];
                    final catName = categories.firstWhere((c) => c.id == item.categoryId, orElse: () => CategoryModel(id: '', name: 'General', items: [])).name;
                    return _buildDraggableItemRow(item, catName);
                  },
                  childCount: filteredItems.length,
                ),
              ),

            const SliverToBoxAdapter(child: SizedBox(height: 40)),
          ],
        ),
      ),
    );
  }

  // --- Search and Filters Control Row ---
  Widget _buildSearchAndFiltersRow(List<CategoryModel> categories) {
    return Row(
      children: [
        // Search Box
        Expanded(
          flex: 5,
          child: Container(
            height: 42,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: TextField(
              controller: _searchController,
              style: GoogleFonts.inter(fontSize: 12.5, color: const Color(0xFF0F172A)),
              decoration: InputDecoration(
                hintText: 'Search by item name...',
                hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 12),
                prefixIcon: const Icon(Icons.search, color: Color(0xFF94A3B8), size: 18),
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
                border: InputBorder.none,
                isDense: true,
              ),
              onChanged: (val) => setState(() => _searchQuery = val),
            ),
          ),
        ),
        const SizedBox(width: 8),

        // Category Filter Button (Opens Bottom Sheet)
        _buildCategoryFilterButton(categories),
        const SizedBox(width: 6),

        // Status Pill Dropdown
        _buildCompactDropdown(
          value: _statusFilter,
          items: const ['All Status', 'Available', 'Sold Out'],
          displayMap: const {
            'All Status': 'All Status',
            'Available': 'Available',
            'Sold Out': 'Sold Out',
          },
          onChanged: (val) => setState(() => _statusFilter = val ?? 'All Status'),
        ),
        const SizedBox(width: 6),

        // View Toggle Buttons: Grid & List
        Container(
          height: 40,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          padding: const EdgeInsets.all(2),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              GestureDetector(
                onTap: () => setState(() => _isGridView = true),
                child: Container(
                  width: 32,
                  height: 34,
                  decoration: BoxDecoration(
                    color: _isGridView ? const Color(0xFFEA580C) : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.grid_view_rounded,
                    size: 16,
                    color: _isGridView ? Colors.white : const Color(0xFF94A3B8),
                  ),
                ),
              ),
              GestureDetector(
                onTap: () => setState(() => _isGridView = false),
                child: Container(
                  width: 32,
                  height: 34,
                  decoration: BoxDecoration(
                    color: !_isGridView ? const Color(0xFFEA580C) : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.format_list_bulleted_rounded,
                    size: 18,
                    color: !_isGridView ? Colors.white : const Color(0xFF94A3B8),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCompactDropdown({
    required String value,
    required List<String> items,
    required Map<String, String> displayMap,
    required Function(String?) onChanged,
  }) {
    final effectiveValue = items.contains(value) ? value : items.first;
    return Container(
      height: 40,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: effectiveValue,
          icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: Color(0xFF64748B)),
          style: GoogleFonts.inter(fontSize: 11.5, fontWeight: FontWeight.w500, color: const Color(0xFF1E293B)),
          onChanged: onChanged,
          items: items.map((e) {
            final displayText = displayMap[e] ?? e;
            return DropdownMenuItem<String>(
              value: e,
              child: Text(
                displayText,
                style: GoogleFonts.inter(fontSize: 11.5, fontWeight: FontWeight.w500, color: const Color(0xFF1E293B)),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  // --- Category Filter Button & Bottom Sheet ---
  Widget _buildCategoryFilterButton(List<CategoryModel> categories) {
    String currentLabel = 'All Categories';
    bool isCustomSelected = false;
    if (_categoryFilter != 'All Categories') {
      final matched = categories.where((c) => c.id == _categoryFilter).toList();
      if (matched.isNotEmpty) {
        currentLabel = matched.first.name;
        isCustomSelected = true;
      }
    }

    return InkWell(
      onTap: () => _showCategoryFilterSheet(categories),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        height: 40,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        decoration: BoxDecoration(
          color: isCustomSelected ? const Color(0xFFFFF7ED) : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isCustomSelected ? const Color(0xFFF97316) : const Color(0xFFE2E8F0),
            width: isCustomSelected ? 1.2 : 1.0,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isCustomSelected ? Icons.filter_alt_rounded : Icons.category_outlined,
              size: 14,
              color: isCustomSelected ? const Color(0xFFEA580C) : const Color(0xFF64748B),
            ),
            const SizedBox(width: 5),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 82),
              child: Text(
                currentLabel,
                style: GoogleFonts.inter(
                  fontSize: 11.5,
                  fontWeight: isCustomSelected ? FontWeight.w700 : FontWeight.w500,
                  color: isCustomSelected ? const Color(0xFFEA580C) : const Color(0xFF1E293B),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 4),
            Icon(
              Icons.keyboard_arrow_down_rounded,
              size: 16,
              color: isCustomSelected ? const Color(0xFFEA580C) : const Color(0xFF64748B),
            ),
          ],
        ),
      ),
    );
  }

  void _showCategoryFilterSheet(List<CategoryModel> categories) {
    final allItemsCount = categories.fold<int>(0, (sum, cat) => sum + cat.items.length);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.75,
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
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFCBD5E1),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 16, 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Filter by Category',
                          style: GoogleFonts.inter(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Select a category to view specific items',
                          style: GoogleFonts.inter(
                            fontSize: 12.5,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 20, color: Color(0xFF64748B)),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1, color: Color(0xFFF1F5F9)),

              // Category options list
              Flexible(
                child: ListView(
                  shrinkWrap: true,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  children: [
                    // "All Categories" option
                    _buildCategoryFilterOption(
                      title: 'All Categories',
                      countText: '$allItemsCount items total',
                      icon: Icons.grid_view_rounded,
                      iconColor: const Color(0xFFEA580C),
                      iconBg: const Color(0xFFFFEDD5),
                      isSelected: _categoryFilter == 'All Categories',
                      onTap: () {
                        setState(() => _categoryFilter = 'All Categories');
                        Navigator.pop(ctx);
                      },
                    ),
                    const SizedBox(height: 8),

                    // Individual Categories
                    ...categories.map((cat) {
                      final isSelected = _categoryFilter == cat.id;
                      final style = _getCategoryStyle(cat.name);
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: _buildCategoryFilterOption(
                          title: cat.name,
                          countText: '${cat.items.length} items',
                          icon: style['icon'] as IconData,
                          iconColor: style['color'] as Color,
                          iconBg: style['bg'] as Color,
                          isSelected: isSelected,
                          onTap: () {
                            setState(() => _categoryFilter = cat.id);
                            Navigator.pop(ctx);
                          },
                        ),
                      );
                    }),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  Widget _buildCategoryFilterOption({
    required String title,
    required String countText,
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFFFF7ED) : const Color(0xFFFAFAFA),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? const Color(0xFFF97316) : const Color(0xFFE2E8F0),
            width: isSelected ? 1.4 : 1.0,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: iconBg,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                      color: isSelected ? const Color(0xFFEA580C) : const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    countText,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Container(
                width: 22,
                height: 22,
                decoration: const BoxDecoration(
                  color: Color(0xFFEA580C),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check, size: 14, color: Colors.white),
              )
            else
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFFCBD5E1), width: 1.5),
                ),
              ),
          ],
        ),
      ),
    );
  }

  // --- Category Carousel Cards ---
  Widget _buildCategoryTab(String id, String name, int count) {
    final isActive = _activeCategoryId == id;
    return GestureDetector(
      onTap: () => setState(() => _activeCategoryId = id),
      child: Container(
        margin: const EdgeInsets.only(right: 10),
        width: 96,
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFFFFF7ED) : Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isActive ? const Color(0xFFF97316) : const Color(0xFFF1F5F9),
            width: isActive ? 1.5 : 1.2,
          ),
          boxShadow: [
            if (!isActive)
              BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 2)),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: const BoxDecoration(
                color: Color(0xFFFFEDD5),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.grid_view_rounded, size: 18, color: Color(0xFFEA580C)),
            ),
            const SizedBox(height: 8),
            Text(
              name,
              style: GoogleFonts.inter(
                fontWeight: FontWeight.w700,
                fontSize: 12,
                color: isActive ? const Color(0xFFEA580C) : const Color(0xFF1E293B),
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
            ),
            const SizedBox(height: 2),
            Text(
              count.toString(),
              style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w500, color: const Color(0xFF94A3B8)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDragTargetCategoryTab(CategoryModel cat) {
    final style = _getCategoryStyle(cat.name);
    return DragTarget<String>(
      onWillAcceptWithDetails: (details) => true,
      onAcceptWithDetails: (details) {
        final itemId = details.data;
        context.read<MenuProvider>().moveItemToCategory(itemId, cat.id);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Moved item to ${cat.name}')));
      },
      builder: (context, candidateData, rejectedData) {
        final isActive = _activeCategoryId == cat.id;
        final isHovered = candidateData.isNotEmpty;

        return GestureDetector(
          onTap: () => setState(() => _activeCategoryId = cat.id),
          child: Container(
            margin: const EdgeInsets.only(right: 10),
            width: 96,
            decoration: BoxDecoration(
              color: (isHovered || isActive) ? const Color(0xFFFFF7ED) : Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: isHovered
                    ? const Color(0xFFEA580C)
                    : (isActive ? const Color(0xFFF97316) : const Color(0xFFF1F5F9)),
                width: (isActive || isHovered) ? 1.5 : 1.2,
              ),
              boxShadow: [
                if (!isActive && !isHovered)
                  BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 2)),
              ],
            ),
            child: Stack(
              children: [
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: style['bg'] as Color,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(style['icon'] as IconData, size: 20, color: style['color'] as Color),
                      ),
                      const SizedBox(height: 8),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: Text(
                          cat.name,
                          style: GoogleFonts.inter(
                            fontWeight: FontWeight.w700,
                            fontSize: 12,
                            color: isActive ? const Color(0xFFEA580C) : const Color(0xFF1E293B),
                          ),
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        cat.items.length.toString(),
                        style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w500, color: const Color(0xFF94A3B8)),
                      ),
                    ],
                  ),
                ),
                Positioned(
                  top: 6,
                  right: 2,
                  child: PopupMenuButton<String>(
                    padding: EdgeInsets.zero,
                    child: Container(
                      width: 22,
                      height: 22,
                      alignment: Alignment.topRight,
                      child: const Icon(
                        Icons.more_vert_rounded,
                        size: 16,
                        color: Color(0xFF94A3B8),
                      ),
                    ),
                    itemBuilder: (ctx) => [
                      const PopupMenuItem(value: 'edit', child: Text('Edit')),
                      const PopupMenuItem(value: 'delete', child: Text('Delete', style: TextStyle(color: Colors.red))),
                    ],
                    onSelected: (val) {
                      if (val == 'edit') {
                        _showCategorySheet(cat);
                      } else if (val == 'delete') {
                        _confirmDeleteCategory(cat);
                      }
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildAddCategoryBtn() {
    return GestureDetector(
      onTap: () => _showCategorySheet(),
      child: Container(
        width: 96,
        margin: const EdgeInsets.only(right: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: const BoxDecoration(
                color: Color(0xFFF1F5F9),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.add_rounded, size: 20, color: Color(0xFF64748B)),
            ),
            const SizedBox(height: 8),
            Text(
              'New Category',
              style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 11.5, color: const Color(0xFF64748B)),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  // --- Draggable & Standard Item Row ---
  Widget _buildDraggableItemRow(MenuItemModel item, String catName) {
    return LongPressDraggable<String>(
      data: item.id,
      feedback: Material(
        elevation: 8,
        borderRadius: BorderRadius.circular(16),
        color: Colors.transparent,
        child: SizedBox(
          width: MediaQuery.of(context).size.width - 32,
          child: Opacity(opacity: 0.9, child: _buildItemRow(item, catName)),
        ),
      ),
      childWhenDragging: Opacity(opacity: 0.35, child: _buildItemRow(item, catName)),
      child: _buildItemRow(item, catName),
    );
  }

  Widget _buildItemRow(MenuItemModel item, String catName) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12, left: 16, right: 16),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1F5F9), width: 1),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.025), blurRadius: 6, offset: const Offset(0, 2)),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Left: Image Thumbnail (72x72)
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: _buildItemImage(item, width: 72, height: 72),
          ),
          const SizedBox(width: 14),

          // Middle: Title, Category pill, Price
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  item.name,
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                    color: const Color(0xFF0F172A),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    catName,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '\$${item.price.toStringAsFixed(2)}',
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.w800,
                    fontSize: 15.5,
                    color: const Color(0xFFDC2626),
                  ),
                ),
              ],
            ),
          ),

          // Right: Availability badge, Orange switch, 3-dots
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Availability Pill
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: item.isAvailable ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: item.isAvailable ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      item.isAvailable ? 'Available' : 'Sold Out',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: item.isAvailable ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 6),

              // Orange Switch Toggle
              Transform.scale(
                scale: 0.8,
                child: Switch(
                  value: item.isAvailable,
                  activeColor: const Color(0xFFEA580C),
                  activeTrackColor: const Color(0xFFFFEDD5),
                  inactiveThumbColor: const Color(0xFF94A3B8),
                  inactiveTrackColor: const Color(0xFFE2E8F0),
                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  onChanged: (val) {
                    context.read<MenuProvider>().toggleItemAvailability(item.id, val);
                  },
                ),
              ),

              // 3-dots Popup Menu
              _buildActionsMenu(item),
            ],
          ),
        ],
      ),
    );
  }

  // --- Grid Item Card ---
  Widget _buildGridItemCard(MenuItemModel item, String catName) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.025), blurRadius: 6, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                child: SizedBox(
                  width: double.infinity,
                  height: 110,
                  child: _buildItemImage(item, width: double.infinity, height: 110),
                ),
              ),
              Positioned(
                top: 6,
                right: 6,
                child: _buildActionsMenu(item),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.name,
                  style: GoogleFonts.inter(fontSize: 13.5, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(6)),
                  child: Text(catName, style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF64748B))),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('\$${item.price.toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w800, color: const Color(0xFFDC2626))),
                    Transform.scale(
                      scale: 0.75,
                      child: Switch(
                        value: item.isAvailable,
                        activeColor: const Color(0xFFEA580C),
                        activeTrackColor: const Color(0xFFFFEDD5),
                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        onChanged: (val) {
                          context.read<MenuProvider>().toggleItemAvailability(item.id, val);
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionsMenu(MenuItemModel item) {
    return SizedBox(
      width: 24,
      height: 24,
      child: PopupMenuButton(
        padding: EdgeInsets.zero,
        icon: const Icon(Icons.more_vert, size: 20, color: Color(0xFF94A3B8)),
        itemBuilder: (ctx) => [
          const PopupMenuItem(value: 'edit', child: Text('Edit')),
          const PopupMenuItem(value: 'delete', child: Text('Delete', style: TextStyle(color: Colors.red))),
        ],
        onSelected: (val) {
          if (val == 'edit') _showAddItemSheet(item);
          if (val == 'delete') context.read<MenuProvider>().deleteMenuItem(item.id);
        },
      ),
    );
  }

  Widget _buildShimmerItemRow() {
    return Container(
      margin: const EdgeInsets.only(bottom: 12, left: 16, right: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Shimmer.fromColors(
        baseColor: Colors.grey.shade200,
        highlightColor: Colors.grey.shade100,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(width: 72, height: 72, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12))),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(width: 120, height: 16, color: Colors.white),
                  const SizedBox(height: 8),
                  Container(width: 80, height: 12, color: Colors.white),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(width: 50, height: 16, color: Colors.white),
                      Container(width: 34, height: 20, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10))),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
