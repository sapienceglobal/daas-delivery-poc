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
import 'package:go_router/go_router.dart';

import '../constants/app_colors.dart';
import '../providers/menu_provider.dart';
import '../models/menu_model.dart';
import '../services/api_service.dart';

class MenuManagementScreen extends StatefulWidget {
  const MenuManagementScreen({Key? key}) : super(key: key);

  @override
  State<MenuManagementScreen> createState() => _MenuManagementScreenState();
}

class _MenuManagementScreenState extends State<MenuManagementScreen> {
  String _activeCategoryId = 'all';
  String _searchQuery = '';
  String _statusFilter = 'All Status';
  String _typeFilter = 'All Types';

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
            Text('Import / Export Menu', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),
            ListTile(
              leading: const Icon(Icons.upload_file, color: AppColors.textPrimary),
              title: const Text('Import CSV'),
              subtitle: const Text('Update menu items from a file'),
              onTap: () async {
                Navigator.pop(ctx);
                final result = await FilePicker.pickFiles(
                  type: FileType.custom,
                  allowedExtensions: ['csv'],
                );
                if (result != null && result.isNotEmpty && mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Importing ${result.first.name}...')));
                  // Actual API call for bulk import would go here
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.download, color: AppColors.textPrimary),
              title: const Text('Export CSV'),
              subtitle: const Text('Download your current menu'),
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
            Text(existingCat == null ? 'Add Category' : 'Edit Category', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            TextField(
              controller: nameCtrl,
              decoration: const InputDecoration(labelText: 'Category Name', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF991B1B), padding: const EdgeInsets.symmetric(vertical: 14)),
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
    
    bool isVeg = existingItem?.isVeg ?? false;
    bool isVegan = existingItem?.isVegan ?? false;
    bool isSpicy = existingItem?.isSpicy ?? false;
    bool isGlutenFree = existingItem?.isGlutenFree ?? false;
    bool isBestseller = existingItem?.isBestseller ?? false;
    bool isAvailable = existingItem?.isAvailable ?? true;
    
    bool _isUploadingImage = false;

    Future<void> _uploadImage(StateSetter setModalState, TextEditingController imageCtrl) async {
      final result = await FilePicker.pickFiles(type: FileType.image);
      if (result != null && result.isNotEmpty) {
        setModalState(() => _isUploadingImage = true);
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
          setModalState(() => _isUploadingImage = false);
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
                borderRadius: BorderRadius.vertical(top: Radius.circular(20))
              ),
              child: Column(
                children: [
                  // Header
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    decoration: BoxDecoration(
                      border: Border(bottom: BorderSide(color: Colors.grey.shade200))
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(existingItem == null ? 'Add Menu Item' : 'Edit Menu Item', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
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
                          Text('Basic Information', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF991B1B))),
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
                              Expanded(child: TextField(controller: prepCtrl, decoration: const InputDecoration(labelText: 'Prep Time (e.g. 15)', border: OutlineInputBorder()))),
                            ],
                          ),
                          const SizedBox(height: 24),

                          // 2. Media & Tags
                          Text('Media & Tags', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF991B1B))),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: TextField(controller: imageCtrl, decoration: const InputDecoration(labelText: 'Image URL', hintText: 'https://...', border: OutlineInputBorder())),
                              ),
                              const SizedBox(width: 8),
                              _isUploadingImage ? 
                                const Padding(
                                  padding: EdgeInsets.all(12.0),
                                  child: SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2)),
                                ) :
                                IconButton(
                                  onPressed: () => _uploadImage(setModalState, imageCtrl),
                                  icon: const Icon(Icons.upload_file),
                                  color: const Color(0xFF991B1B),
                                  tooltip: 'Upload Image',
                                ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          TextField(controller: tagsCtrl, decoration: const InputDecoration(labelText: 'Search Tags', hintText: 'spicy, popular, healthy', border: OutlineInputBorder())),
                          const SizedBox(height: 24),

                          // 3. Properties
                          Text('Properties', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF991B1B))),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 12,
                            runSpacing: 12,
                            children: [
                              FilterChip(
                                label: const Text('Vegetarian'),
                                selected: isVeg,
                                selectedColor: Colors.green.shade100,
                                checkmarkColor: Colors.green.shade800,
                                onSelected: (val) => setModalState(() => isVeg = val)
                              ),
                              FilterChip(
                                label: const Text('Vegan'),
                                selected: isVegan,
                                selectedColor: Colors.teal.shade100,
                                checkmarkColor: Colors.teal.shade800,
                                onSelected: (val) => setModalState(() => isVegan = val)
                              ),
                              FilterChip(
                                label: const Text('Spicy'),
                                selected: isSpicy,
                                selectedColor: Colors.red.shade100,
                                checkmarkColor: Colors.red.shade800,
                                onSelected: (val) => setModalState(() => isSpicy = val)
                              ),
                              FilterChip(
                                label: const Text('Gluten Free'),
                                selected: isGlutenFree,
                                selectedColor: Colors.orange.shade100,
                                checkmarkColor: Colors.orange.shade800,
                                onSelected: (val) => setModalState(() => isGlutenFree = val)
                              ),
                              FilterChip(
                                label: const Text('Bestseller'),
                                selected: isBestseller,
                                selectedColor: Colors.amber.shade100,
                                checkmarkColor: Colors.amber.shade800,
                                onSelected: (val) => setModalState(() => isBestseller = val)
                              ),
                              FilterChip(
                                label: const Text('Active (Available)'),
                                selected: isAvailable,
                                selectedColor: Colors.blue.shade100,
                                checkmarkColor: Colors.blue.shade800,
                                onSelected: (val) => setModalState(() => isAvailable = val)
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),

                          // 4. Modifiers & Variations
                          Row(
                            children: [
                              Text('Modifiers & Variations', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF991B1B))),
                              IconButton(
                                icon: const Icon(Icons.info_outline, size: 20, color: Colors.grey),
                                tooltip: 'How to format',
                                onPressed: () {
                                  showDialog(
                                    context: context,
                                    builder: (ctx) => AlertDialog(
                                      title: const Text('Formatting Modifiers'),
                                      content: const Text(
                                        'Please enter each option on a new line. Separate the name and price with a colon (:).\n\n'
                                        'Example for Size Variations:\n'
                                        'Small:5.99\n'
                                        'Medium:7.99\n'
                                        'Large:9.99\n\n'
                                        'Example for Add-ons:\n'
                                        'Extra Cheese:2.00\n'
                                        'Spicy Sauce:0.50'
                                      ),
                                      actions: [
                                        TextButton(
                                          onPressed: () => Navigator.pop(ctx),
                                          child: const Text('Got it!'),
                                        ),
                                      ],
                                    ),
                                  );
                                },
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          TextField(
                            controller: sizeVariationsCtrl,
                            maxLines: 3,
                            decoration: const InputDecoration(
                              labelText: 'Size Variations', 
                              hintText: 'e.g. Small:5.99\nLarge:9.99', 
                              helperText: 'Type each option on a new line. Format -> Name:Price',
                              border: OutlineInputBorder()
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextField(
                            controller: addOnsCtrl,
                            maxLines: 3,
                            decoration: const InputDecoration(
                              labelText: 'Add-ons', 
                              hintText: 'e.g. Extra Cheese:2.00\nExtra Sauce:0.50', 
                              helperText: 'Type each option on a new line. Format -> Name:Price',
                              border: OutlineInputBorder()
                            ),
                          ),
                          
                          SizedBox(height: MediaQuery.of(ctx).viewInsets.bottom + 20), // Dynamic padding for keyboard
                        ],
                      ),
                    ),
                  ),

                  // Footer Actions
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      border: Border(top: BorderSide(color: Colors.grey.shade200))
                    ),
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF991B1B), padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                        onPressed: () {
                          if (nameCtrl.text.trim().isEmpty || priceCtrl.text.trim().isEmpty || selectedCatId.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill required fields (Name, Price, Category)')));
                            return;
                          }
                          
                          final newItem = MenuItemModel(
                            id: existingItem?.id ?? '', // backend generates if new
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
                        child: Text(existingItem == null ? 'Save Item' : 'Update Item', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16)),
                      ),
                    ),
                  )
                ],
              ),
            );
          }
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

    // Filter items
    final filteredItems = allItems.where((item) {
      if (_activeCategoryId != 'all' && item.categoryId != _activeCategoryId) return false;
      if (_searchQuery.isNotEmpty && !item.name.toLowerCase().contains(_searchQuery.toLowerCase())) return false;
      if (_statusFilter == 'Active' && !item.isAvailable) return false;
      if (_statusFilter == 'Inactive' && item.isAvailable) return false;
      if (_typeFilter == 'Veg' && !item.isVeg) return false;
      if (_typeFilter == 'Non-Veg' && item.isVeg) return false;
      return true;
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
        title: Text('Menu Management', style: GoogleFonts.inter(color: Colors.black, fontWeight: FontWeight.bold)),
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: RefreshIndicator(
        onRefresh: () => context.read<MenuProvider>().fetchMenu(force: true),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Header
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Menu Management', style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                                const SizedBox(height: 4),
                                Text('Manage your restaurant menu, categories and items.', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: _handleImportExport,
                                icon: const Icon(Icons.download, size: 16, color: Colors.black87),
                                label: Text('Import / Export', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.black87)),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: _showAddItemSheet,
                                icon: const Icon(Icons.add, size: 16, color: Colors.white),
                                label: Text('Add Menu Item', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white)),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF991B1B),
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),

                      ],
                    ),
                  ),
                ),
                
                // Sticky Categories List
                SliverPersistentHeader(
                  pinned: true,
                  delegate: _StickyCategoryDelegate(
                    height: 120, // 110 height + 10 padding
                    child: SizedBox(
                      height: 110,
                          child: ListView(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            scrollDirection: Axis.horizontal,
                            children: [
                              _buildCategoryTab('all', 'All Items', allItems.length),
                              ...categories.map((cat) => _buildDragTargetCategoryTab(cat)),
                              _buildAddCategoryBtn(),
                            ],
                          ),
                        ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      children: [
                        const SizedBox(height: 8),
                        // Drag info tip
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(8), border: Border.all(color: const Color(0xFFBFDBFE))),
                          child: Row(
                            children: [
                              const Icon(Icons.info_outline, color: Color(0xFF2563EB), size: 20),
                              const SizedBox(width: 12),
                              Expanded(child: Text('Tip: You can press and hold items below and drag them directly onto any category tab above to move them between categories!', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500, color: const Color(0xFF1D4ED8)))),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Search and Filters
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade200)),
                          child: Row(
                            children: [
                              Expanded(
                                flex: 2,
                                child: TextField(
                                  controller: _searchController,
                                  decoration: InputDecoration(
                                    hintText: 'Search by item name...',
                                    hintStyle: GoogleFonts.inter(color: Colors.grey.shade400, fontSize: 12),
                                    prefixIcon: const Icon(Icons.search, color: Colors.grey, size: 20),
                                    filled: true,
                                    fillColor: Colors.grey.shade50,
                                    contentPadding: const EdgeInsets.symmetric(vertical: 0),
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade200)),
                                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade200)),
                                  ),
                                  onChanged: (val) => setState(() => _searchQuery = val),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _buildDropdownFilter(_statusFilter, ['All Status', 'Active', 'Inactive'], (val) => setState(() => _statusFilter = val!)),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _buildDropdownFilter(_typeFilter, ['All Types', 'Veg', 'Non-Veg'], (val) => setState(() => _typeFilter = val!)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                
                // Items List or Loading Shimmer
                if (menuProvider.isLoading)
                  SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => _buildShimmerItemRow(),
                      childCount: 5,
                    ),
                  )
                else
                  SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final item = filteredItems[index];
                        final catName = categories.firstWhere((c) => c.id == item.categoryId, orElse: () => CategoryModel(id: '', name: 'Unknown', items: [])).name;
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
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(width: 70, height: 70, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12))),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(width: 120, height: 16, color: Colors.white),
                  const SizedBox(height: 8),
                  Container(width: 80, height: 12, color: Colors.white),
                  const SizedBox(height: 12),
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

  Widget _buildCategoryTab(String id, String name, int count) {
    final isActive = _activeCategoryId == id;
    return GestureDetector(
      onTap: () => setState(() => _activeCategoryId = id),
      child: Container(
        margin: const EdgeInsets.only(right: 12),
        width: 100,
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFFFEF2F2) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isActive ? const Color(0xFFFECACA) : Colors.transparent, width: 2),
          boxShadow: [if (!isActive) BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 2))],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.hexagon_outlined, size: 24, color: isActive ? const Color(0xFF991B1B) : const Color(0xFFF87171)),
            const SizedBox(height: 8),
            Text(name, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: isActive ? const Color(0xFF991B1B) : Colors.grey.shade700), textAlign: TextAlign.center, maxLines: 1),
            const SizedBox(height: 4),
            Text(count.toString(), style: GoogleFonts.inter(fontSize: 10, color: Colors.grey.shade500)),
          ],
        ),
      ),
    );
  }

  Widget _buildDragTargetCategoryTab(CategoryModel cat) {
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
            margin: const EdgeInsets.only(right: 12),
            width: 100,
            decoration: BoxDecoration(
              color: isHovered ? const Color(0xFFFEF2F2) : (isActive ? const Color(0xFFFEF2F2) : Colors.white),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isHovered ? const Color(0xFF991B1B) : (isActive ? const Color(0xFFFECACA) : Colors.transparent), 
                width: 2
              ),
              boxShadow: [if (!isActive && !isHovered) BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 2))],
            ),
            child: Stack(
              children: [
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.hexagon_outlined, size: 24, color: (isActive || isHovered) ? const Color(0xFF991B1B) : const Color(0xFFF87171)),
                      const SizedBox(height: 8),
                      Text(cat.name, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: (isActive || isHovered) ? const Color(0xFF991B1B) : Colors.grey.shade700), textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 4),
                      Text(cat.items.length.toString(), style: GoogleFonts.inter(fontSize: 10, color: Colors.grey.shade500)),
                    ],
                  ),
                ),
                Positioned(
                  top: 4,
                  right: 4,
                  child: PopupMenuButton(
                    padding: EdgeInsets.zero,
                    icon: const Icon(Icons.more_vert, size: 16, color: Colors.grey),
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
                )
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
        width: 100,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade300, width: 2, style: BorderStyle.solid), // dashed ideally, solid for now
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.add, size: 24, color: Colors.grey),
            const SizedBox(height: 8),
            Text('New Category', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  Widget _buildDropdownFilter(String value, List<String> items, Function(String?) onChanged) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isDense: true,
          isExpanded: true,
          icon: const Icon(Icons.keyboard_arrow_down, size: 16),
          style: GoogleFonts.inter(fontSize: 12, color: Colors.black87),
          onChanged: onChanged,
          items: items.map((e) => DropdownMenuItem(value: e, child: Text(e, maxLines: 1, overflow: TextOverflow.ellipsis))).toList(),
        ),
      ),
    );
  }

  Widget _buildDraggableItemRow(MenuItemModel item, String catName) {
    return LongPressDraggable<String>(
      data: item.id,
      feedback: Material(
        elevation: 8,
        color: Colors.transparent,
        child: SizedBox(
          width: MediaQuery.of(context).size.width - 32,
          child: Opacity(opacity: 0.8, child: _buildItemRow(item, catName)),
        ),
      ),
      childWhenDragging: Opacity(opacity: 0.3, child: _buildItemRow(item, catName)),
      child: _buildItemRow(item, catName),
    );
  }

  Widget _buildItemRow(MenuItemModel item, String catName) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12, left: 16, right: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 4)),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: item.imageUrl != null && item.imageUrl!.startsWith('http')
                ? Image.network(item.imageUrl!, width: 70, height: 70, fit: BoxFit.cover, errorBuilder: (_,__,___) => _buildPlaceholder())
                : _buildPlaceholder(),
          ),
          const SizedBox(width: 12),
          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title, Veg/Non-Veg icon, and Actions
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(item.name, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14), maxLines: 2, overflow: TextOverflow.ellipsis),
                    ),
                    const SizedBox(width: 8),
                    Icon(
                      item.isVeg ? Icons.stop_circle_outlined : Icons.stop_circle, 
                      color: item.isVeg ? Colors.green : Colors.red, 
                      size: 16
                    ),
                    const SizedBox(width: 8),
                    _buildActionsMenu(item),
                  ],
                ),
                const SizedBox(height: 4),
                // Category & Prep Time
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(4)),
                      child: Text(catName, style: GoogleFonts.inter(fontSize: 10, color: Colors.grey.shade700)),
                    ),
                    const SizedBox(width: 8),
                    if (item.prepTime != null && item.prepTime!.isNotEmpty)
                      Text('⏱ ${item.prepTime}', style: GoogleFonts.inter(fontSize: 10, color: Colors.grey.shade500)),
                  ],
                ),
                const SizedBox(height: 8),
                // Price and Availability Switch
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('\$${item.price.toStringAsFixed(2)}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14, color: const Color(0xFF8B0000))),
                    Transform.scale(
                      scale: 0.7,
                      child: Switch(
                        value: item.isAvailable,
                        activeColor: Colors.green,
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
        icon: const Icon(Icons.more_vert, size: 18, color: Colors.grey),
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

  Widget _buildPlaceholder() {
    return Container(
      width: 40, height: 40,
      decoration: BoxDecoration(color: Colors.grey.shade100, shape: BoxShape.circle),
      child: Center(child: Text('NO\nIMG', style: GoogleFonts.inter(fontSize: 8, color: Colors.grey.shade400, fontWeight: FontWeight.bold), textAlign: TextAlign.center)),
    );
  }

  Widget _buildBadge(String text, Color color, Color bg, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 8, color: color),
          const SizedBox(width: 4),
          Text(text, style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }
}

class _StickyCategoryDelegate extends SliverPersistentHeaderDelegate {
  final Widget child;
  final double height;

  _StickyCategoryDelegate({required this.child, required this.height});

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: AppColors.background, // Match background to prevent overlapping issues
      padding: const EdgeInsets.only(top: 8, bottom: 2),
      child: child,
    );
  }

  @override
  double get maxExtent => height;

  @override
  double get minExtent => height;

  @override
  bool shouldRebuild(covariant _StickyCategoryDelegate oldDelegate) {
    return true; // We always rebuild because category selection state or data might change
  }
}
