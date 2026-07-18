import 'dart:convert';
import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../theme.dart';
import '../../widgets/glass_container.dart';

class MerchantMenuScreen extends StatefulWidget {
  const MerchantMenuScreen({super.key});

  @override
  State<MerchantMenuScreen> createState() => _MerchantMenuScreenState();
}

class _MerchantMenuScreenState extends State<MerchantMenuScreen> {
  bool _isLoading = true;
  String? _restaurantId;
  List<dynamic> _menuItems = [];
  List<dynamic> _categories = [];

  // Controllers for Add/Edit Menu Item
  final _nameController = TextEditingController();
  final _descController = TextEditingController();
  final _priceController = TextEditingController();
  final _imageController = TextEditingController();
  String? _selectedCategoryId;
  bool _isVeg = false;
  bool _isSpicy = false;
  bool _isBestseller = false;
  bool _isAvailable = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    _priceController.dispose();
    _imageController.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final restRes = await ApiService.get('/api/restaurants/merchant/my');
      final restData = json.decode(restRes.body);
      if (restData['data'] != null) {
        _restaurantId = restData['data']['_id'];
        
        // Fetch Categories & Menu Items in parallel
        final results = await Future.wait([
          ApiService.get('/api/menu/categories/$_restaurantId'),
          ApiService.get('/api/menu/restaurant/$_restaurantId'),
        ]);

        final catData = json.decode(results[0].body);
        final menuData = json.decode(results[1].body);

        setState(() {
          _categories = catData['data'] ?? [];
          _menuItems = menuData['data'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Error loading menu: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _saveItem({Map<String, dynamic>? editingItem}) async {
    if (_nameController.text.isEmpty || _priceController.text.isEmpty || _selectedCategoryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill Name, Price, and select Category')));
      return;
    }

    try {
      final payload = {
        'restaurantId': _restaurantId,
        'categoryId': _selectedCategoryId,
        'name': _nameController.text,
        'description': _descController.text,
        'price': double.tryParse(_priceController.text) ?? 0.0,
        'image': _imageController.text.isEmpty ? null : _imageController.text,
        'isVeg': _isVeg,
        'isSpicy': _isSpicy,
        'isBestseller': _isBestseller,
        'isAvailable': _isAvailable,
      };

      if (editingItem != null) {
        await ApiService.put('/api/menu/items/${editingItem['_id']}', payload);
      } else {
        await ApiService.post('/api/menu/items', payload);
      }

      if (mounted) Navigator.pop(context);
      _fetchData();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to save item: $e'), backgroundColor: BrandColors.red));
    }
  }

  Future<void> _toggleAvailability(String itemId) async {
    try {
      final response = await ApiService.patch('/api/menu/items/$itemId/toggle', {});
      if (response.statusCode >= 200 && response.statusCode < 300) {
        _fetchData();
      } else {
        throw Exception(response.body);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to toggle status: $e'), backgroundColor: BrandColors.red));
    }
  }

  Future<void> _deleteItem(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: BrandColors.card,
        title: const Text('Delete Menu Item?', style: TextStyle(color: BrandColors.textMain)),
        content: const Text('Are you sure you want to delete this menu item?', style: TextStyle(color: BrandColors.textMuted)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: BrandColors.red)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await ApiService.delete('/api/menu/items/$id');
      _fetchData();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Delete failed: $e'), backgroundColor: BrandColors.red));
    }
  }

  // Category CRUD operations
  Future<void> _createCategory(String name) async {
    if (name.trim().isEmpty) return;
    try {
      await ApiService.post('/api/menu/categories', {
        'restaurantId': _restaurantId,
        'name': name.trim(),
      });
      _fetchData();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to create category: $e'), backgroundColor: BrandColors.red));
    }
  }

  Future<void> _updateCategory(String id, String newName) async {
    if (newName.trim().isEmpty) return;
    try {
      await ApiService.put('/api/menu/categories/$id', {
        'name': newName.trim(),
      });
      _fetchData();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to update category: $e'), backgroundColor: BrandColors.red));
    }
  }

  Future<void> _deleteCategory(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: BrandColors.card,
        title: const Text('Delete Category?', style: TextStyle(color: BrandColors.textMain)),
        content: const Text('Are you sure you want to delete this category? All items inside this category will remain, but category association will be deleted.', style: TextStyle(color: BrandColors.textMuted)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: BrandColors.red)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await ApiService.delete('/api/menu/categories/$id');
      _fetchData();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Category delete failed: $e'), backgroundColor: BrandColors.red));
    }
  }

  void _showCategoryDialog({String? id, String? currentName}) {
    final textController = TextEditingController(text: currentName ?? '');
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: BrandColors.card,
        title: Text(id == null ? 'Create Category' : 'Rename Category', style: const TextStyle(color: BrandColors.textMain)),
        content: TextField(
          controller: textController,
          autofocus: true,
          style: const TextStyle(color: BrandColors.textMain),
          decoration: const InputDecoration(
            hintText: 'Category Name (e.g. Sides, Mains)',
            hintStyle: TextStyle(color: BrandColors.textMuted),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              if (id == null) {
                _createCategory(textController.text);
              } else {
                _updateCategory(id, textController.text);
              }
            },
            child: const Text('Save', style: TextStyle(color: BrandColors.cyan)),
          ),
        ],
      ),
    );
  }

  // CSV Import Dialog with Paste & Preset template options
  void _showCSVImportDialog() {
    final textController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: BrandColors.card,
        title: const Text('Bulk Import Menu (CSV)', style: TextStyle(color: BrandColors.textMain)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Paste CSV contents (CSV Header format below):',
                style: TextStyle(color: BrandColors.textMuted, fontSize: 12),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.all(6),
                color: Colors.white.withOpacity(0.05),
                child: const Text(
                  'name,category,price,description,image,veg,spicy',
                  style: TextStyle(fontFamily: 'monospace', fontSize: 10, color: BrandColors.cyan),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: textController,
                maxLines: 6,
                style: const TextStyle(color: BrandColors.textMain, fontSize: 13, fontFamily: 'monospace'),
                decoration: const InputDecoration(
                  hintText: 'French Fries,Sides,3.99,Crispy golden fries,,true,false\nOnion Rings,Sides,4.99,Golden batter rings,,true,false',
                  hintStyle: TextStyle(color: BrandColors.textMuted, fontSize: 11),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              const Text('OR USE TEMPLATE SAMPLES:', style: TextStyle(color: BrandColors.textMuted, fontWeight: FontWeight.bold, fontSize: 11)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [
                  ActionChip(
                    backgroundColor: Colors.white.withOpacity(0.05),
                    label: const Text('Sides Menu Sample 🍟', style: TextStyle(color: BrandColors.cyan, fontSize: 11)),
                    onPressed: () {
                      textController.text =
                          'French Fries,Sides,3.99,Crispy golden fries,,true,false\nMozzarella Sticks,Sides,5.99,Cheesy fried sticks,,true,false';
                    },
                  ),
                  ActionChip(
                    backgroundColor: Colors.white.withOpacity(0.05),
                    label: const Text('Burgers Menu Sample 🍔', style: TextStyle(color: BrandColors.cyan, fontSize: 11)),
                    onPressed: () {
                      textController.text =
                          'Veggie Burger,Burgers,8.99,Delicious vegetable patty,,true,false\nSpicy Paneer Burger,Burgers,9.99,Paneer patty with spicy mayo,,true,true';
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _importCSV(textController.text);
            },
            child: const Text('Import', style: TextStyle(color: BrandColors.green, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Future<void> _importCSV(String csvContent) async {
    if (csvContent.trim().isEmpty) return;
    try {
      final lines = csvContent.split('\n');
      if (lines.isEmpty) return;

      final headers = lines[0].toLowerCase().split(',');
      final List<Map<String, dynamic>> items = [];

      for (int i = 1; i < lines.length; i++) {
        final line = lines[i].trim();
        if (line.isEmpty) continue;

        final parts = line.split(',');
        final Map<String, dynamic> item = {};

        for (int j = 0; j < parts.length; j++) {
          if (j >= headers.length) break;
          final header = headers[j].trim();
          final val = parts[j].trim();

          if (header == 'name') {
            item['name'] = val;
          } else if (header == 'category') {
            item['category'] = val;
          } else if (header == 'price') {
            item['price'] = double.tryParse(val) ?? 0.0;
          } else if (header == 'description') {
            item['description'] = val;
          } else if (header == 'image') {
            item['image'] = val.isEmpty ? null : val;
          } else if (header == 'veg') {
            item['isVeg'] = val.toLowerCase() == 'true';
          } else if (header == 'spicy') {
            item['isSpicy'] = val.toLowerCase() == 'true';
          }
        }

        if (item.containsKey('name')) {
          items.add(item);
        }
      }

      if (items.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No valid items found in CSV'), backgroundColor: BrandColors.red),
        );
        return;
      }

      final payload = {
        'restaurantId': _restaurantId,
        'items': items,
      };

      final response = await ApiService.post('/api/menu/bulk-import', payload);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${items.length} items successfully imported!'), backgroundColor: BrandColors.green),
        );
        _fetchData();
      } else {
        throw Exception(response.body);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('CSV Import failed: $e'), backgroundColor: BrandColors.red),
      );
    }
  }

  void _showItemModal({Map<String, dynamic>? item}) {
    if (item != null) {
      _nameController.text = item['name'] ?? '';
      _descController.text = item['description'] ?? '';
      _priceController.text = (item['price'] ?? 0.0).toString();
      _imageController.text = item['image'] ?? '';
      _selectedCategoryId = item['categoryId'] is Map ? item['categoryId']['_id'] : item['categoryId']?.toString();
      _isVeg = item['isVeg'] ?? false;
      _isSpicy = item['isSpicy'] ?? false;
      _isBestseller = item['isBestseller'] ?? false;
      _isAvailable = item['isAvailable'] ?? true;
    } else {
      _nameController.clear();
      _descController.clear();
      _priceController.clear();
      _imageController.clear();
      _selectedCategoryId = _categories.isNotEmpty ? _categories.first['_id'] : null;
      _isVeg = false;
      _isSpicy = false;
      _isBestseller = false;
      _isAvailable = true;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: BrandColors.card,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 16, right: 16, top: 16),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(item != null ? 'Edit Menu Item' : 'Add Menu Item', style: const TextStyle(color: BrandColors.textMain, fontSize: 20, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _nameController,
                      style: const TextStyle(color: BrandColors.textMain),
                      decoration: const InputDecoration(labelText: 'Item Name', labelStyle: TextStyle(color: BrandColors.textMuted)),
                    ),
                    TextField(
                      controller: _descController,
                      style: const TextStyle(color: BrandColors.textMain),
                      decoration: const InputDecoration(labelText: 'Description', labelStyle: TextStyle(color: BrandColors.textMuted)),
                    ),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _priceController,
                            keyboardType: TextInputType.number,
                            style: const TextStyle(color: BrandColors.textMain),
                            decoration: const InputDecoration(labelText: 'Price (\$)', labelStyle: TextStyle(color: BrandColors.textMuted)),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            dropdownColor: BrandColors.card,
                            value: _selectedCategoryId,
                            hint: const Text('Category', style: TextStyle(color: BrandColors.textMuted)),
                            items: _categories.map<DropdownMenuItem<String>>((c) {
                              return DropdownMenuItem<String>(
                                value: c['_id'],
                                child: Text(c['name'] ?? '', style: const TextStyle(color: BrandColors.textMain)),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) setModalState(() => _selectedCategoryId = val);
                            },
                            decoration: const InputDecoration(labelText: 'Category', labelStyle: TextStyle(color: BrandColors.textMuted)),
                          ),
                        ),
                      ],
                    ),
                    TextField(
                      controller: _imageController,
                      style: const TextStyle(color: BrandColors.textMain),
                      decoration: const InputDecoration(labelText: 'Image URL (Optional)', labelStyle: TextStyle(color: BrandColors.textMuted)),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Checkbox(
                              value: _isVeg,
                              activeColor: BrandColors.cyan,
                              onChanged: (val) => setModalState(() => _isVeg = val ?? false),
                            ),
                            const Text('Veg 🌱', style: TextStyle(color: BrandColors.textMain)),
                          ],
                        ),
                        Row(
                          children: [
                            Checkbox(
                              value: _isSpicy,
                              activeColor: BrandColors.cyan,
                              onChanged: (val) => setModalState(() => _isSpicy = val ?? false),
                            ),
                            const Text('Spicy 🌶️', style: TextStyle(color: BrandColors.textMain)),
                          ],
                        ),
                      ],
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Checkbox(
                              value: _isBestseller,
                              activeColor: BrandColors.cyan,
                              onChanged: (val) => setModalState(() => _isBestseller = val ?? false),
                            ),
                            const Text('Bestseller 🔥', style: TextStyle(color: BrandColors.textMain)),
                          ],
                        ),
                        Row(
                          children: [
                            Checkbox(
                              value: _isAvailable,
                              activeColor: BrandColors.cyan,
                              onChanged: (val) => setModalState(() => _isAvailable = val ?? true),
                            ),
                            const Text('Available ✅', style: TextStyle(color: BrandColors.textMain)),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: BrandColors.cyan),
                        onPressed: () => _saveItem(editingItem: item),
                        child: const Text('Save Item', style: TextStyle(color: BrandColors.background, fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            );
          }
        );
      }
    );
  }

  @override
  Widget build(BuildContext context) {
    // Group menu items by category for categorized list view
    final Map<String, List<dynamic>> groupedItems = {};
    for (final cat in _categories) {
      groupedItems[cat['_id']] = [];
    }
    groupedItems['uncategorized'] = [];

    for (final item in _menuItems) {
      final catId = item['categoryId'] is Map 
          ? item['categoryId']['_id'] 
          : item['categoryId']?.toString();
      
      if (catId != null && groupedItems.containsKey(catId)) {
        groupedItems[catId]!.add(item);
      } else {
        groupedItems['uncategorized']!.add(item);
      }
    }

    return Scaffold(
      backgroundColor: BrandColors.background,
      appBar: AppBar(
        title: const Text('Menu Catalog'),
        backgroundColor: BrandColors.card,
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchData),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: BrandColors.cyan,
        onPressed: () {
          if (_categories.isEmpty) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Please add a category first using the category actions'), backgroundColor: BrandColors.red),
            );
            return;
          }
          _showItemModal();
        },
        child: const Icon(Icons.add, color: BrandColors.background),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: BrandColors.cyan))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // 1. Bulk Import CSV Header Card
                GlassContainer(
                  padding: const EdgeInsets.all(16),
                  margin: const EdgeInsets.only(bottom: 24),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Bulk Import Menu',
                              style: TextStyle(color: BrandColors.textMain, fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Upload a CSV file (Headers: Name, Category, Price, Description, Image, Veg, Spicy)',
                              style: TextStyle(color: BrandColors.textMuted, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white.withOpacity(0.05),
                          side: const BorderSide(color: BrandColors.cyan, width: 0.5),
                        ),
                        onPressed: _showCSVImportDialog,
                        icon: const Icon(Icons.upload_file_outlined, color: BrandColors.cyan, size: 16),
                        label: const Text('Import CSV', style: TextStyle(color: BrandColors.cyan, fontSize: 12, fontWeight: FontWeight.bold)),
                      )
                    ],
                  ),
                ),

                // 2. Category Actions Bar
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Categories & Items', style: TextStyle(color: BrandColors.textMain, fontWeight: FontWeight.bold, fontSize: 18)),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(backgroundColor: BrandColors.cyan.withOpacity(0.15)),
                      onPressed: () => _showCategoryDialog(),
                      icon: const Icon(Icons.category_outlined, color: BrandColors.cyan, size: 16),
                      label: const Text('New Category', style: TextStyle(color: BrandColors.cyan, fontSize: 12, fontWeight: FontWeight.bold)),
                    )
                  ],
                ),
                const SizedBox(height: 16),

                // 3. Categorized Items Lists
                ..._categories.map((cat) {
                  final items = groupedItems[cat['_id']] ?? [];
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Category Header
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${cat['name']} (${items.length})',
                            style: const TextStyle(color: BrandColors.textMain, fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          Row(
                            children: [
                              TextButton.icon(
                                onPressed: () => _showCategoryDialog(id: cat['_id'], currentName: cat['name']),
                                icon: const Icon(Icons.edit_outlined, size: 14, color: BrandColors.textMuted),
                                label: const Text('Edit', style: TextStyle(color: BrandColors.textMuted, fontSize: 11)),
                              ),
                              TextButton.icon(
                                onPressed: () => _deleteCategory(cat['_id']),
                                icon: const Icon(Icons.delete_outline, size: 14, color: BrandColors.red),
                                label: const Text('Delete', style: TextStyle(color: BrandColors.red, fontSize: 11)),
                              ),
                            ],
                          )
                        ],
                      ),
                      const SizedBox(height: 8),

                      if (items.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                          child: Text('No items in this category', style: TextStyle(color: BrandColors.textMuted, fontSize: 12, fontStyle: FontStyle.italic)),
                        )
                      else
                        ...items.map((item) {
                          final double price = (item['price'] ?? 0.0).toDouble();
                          final bool isAvail = item['isAvailable'] ?? true;

                          return GlassContainer(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: Row(
                              children: [
                                if (item['image'] != null && item['image'].toString().isNotEmpty)
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: Image.network(item['image'], width: 50, height: 50, fit: BoxFit.cover, errorBuilder: (_,__,___) => const Icon(Icons.fastfood, color: BrandColors.textMuted)),
                                  )
                                else
                                  const SizedBox(width: 50, height: 50, child: Icon(Icons.fastfood, color: BrandColors.textMuted)),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Text(
                                              item['name'] ?? '',
                                              style: TextStyle(
                                                fontWeight: FontWeight.bold,
                                                color: isAvail ? BrandColors.textMain : BrandColors.textMuted,
                                                fontSize: 15,
                                                decoration: isAvail ? null : TextDecoration.lineThrough,
                                              ),
                                            ),
                                          ),
                                          if (item['isBestseller'] == true)
                                            const Padding(padding: EdgeInsets.only(left: 4), child: Text('🔥', style: TextStyle(fontSize: 11))),
                                          if (item['isVeg'] == true)
                                            const Padding(padding: EdgeInsets.only(left: 4), child: Text('🌱', style: TextStyle(fontSize: 11))),
                                          if (item['isSpicy'] == true)
                                            const Padding(padding: EdgeInsets.only(left: 4), child: Text('🌶️', style: TextStyle(fontSize: 11))),
                                        ],
                                      ),
                                      Text(item['description'] ?? '', style: const TextStyle(color: BrandColors.textMuted, fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis),
                                      const SizedBox(height: 2),
                                      Row(
                                        children: [
                                          Text('\$${price.toStringAsFixed(2)}', style: const TextStyle(color: BrandColors.green, fontWeight: FontWeight.bold, fontSize: 13)),
                                          const SizedBox(width: 8),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: isAvail ? Colors.green.withOpacity(0.12) : Colors.red.withOpacity(0.12),
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: Text(
                                              isAvail ? 'Available' : 'Stocked Out',
                                              style: TextStyle(color: isAvail ? Colors.green : Colors.red, fontSize: 10, fontWeight: FontWeight.bold),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 8),
                                // Stock Out/In Toggle + Edit Buttons
                                Row(
                                  children: [
                                    OutlinedButton(
                                      style: OutlinedButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        minimumSize: Size.zero,
                                        side: BorderSide(color: isAvail ? Colors.red.withOpacity(0.5) : Colors.green.withOpacity(0.5)),
                                      ),
                                      onPressed: () => _toggleAvailability(item['_id']),
                                      child: Text(
                                        isAvail ? 'Stock Out' : 'Restock',
                                        style: TextStyle(color: isAvail ? Colors.red : Colors.green, fontSize: 10, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.edit_outlined, color: BrandColors.cyan, size: 18),
                                      onPressed: () => _showItemModal(item: item),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.delete_outline, color: BrandColors.red, size: 18),
                                      onPressed: () => _deleteItem(item['_id']),
                                    ),
                                  ],
                                )
                              ],
                            ),
                          );
                        }),
                      const Divider(color: BrandColors.border, height: 32),
                    ],
                  );
                }),

                // Uncategorized Section
                if (groupedItems['uncategorized']!.isNotEmpty) ...[
                  const Text('Uncategorized Items', style: TextStyle(color: BrandColors.textMain, fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 8),
                  ...groupedItems['uncategorized']!.map((item) {
                    final double price = (item['price'] ?? 0.0).toDouble();
                    final bool isAvail = item['isAvailable'] ?? true;

                    return GlassContainer(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        children: [
                          if (item['image'] != null && item['image'].toString().isNotEmpty)
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.network(item['image'], width: 50, height: 50, fit: BoxFit.cover, errorBuilder: (_,__,___) => const Icon(Icons.fastfood, color: BrandColors.textMuted)),
                            )
                          else
                            const SizedBox(width: 50, height: 50, child: Icon(Icons.fastfood, color: BrandColors.textMuted)),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(item['name'] ?? '', style: TextStyle(fontWeight: FontWeight.bold, color: isAvail ? BrandColors.textMain : BrandColors.textMuted, fontSize: 15, decoration: isAvail ? null : TextDecoration.lineThrough)),
                                Text(item['description'] ?? '', style: const TextStyle(color: BrandColors.textMuted, fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis),
                                const SizedBox(height: 2),
                                Row(
                                  children: [
                                    Text('\$${price.toStringAsFixed(2)}', style: const TextStyle(color: BrandColors.green, fontWeight: FontWeight.bold, fontSize: 13)),
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: isAvail ? Colors.green.withOpacity(0.12) : Colors.red.withOpacity(0.12),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        isAvail ? 'Available' : 'Stocked Out',
                                        style: TextStyle(color: isAvail ? Colors.green : Colors.red, fontSize: 10, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Row(
                            children: [
                              OutlinedButton(
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  minimumSize: Size.zero,
                                  side: BorderSide(color: isAvail ? Colors.red.withOpacity(0.5) : Colors.green.withOpacity(0.5)),
                                ),
                                onPressed: () => _toggleAvailability(item['_id']),
                                child: Text(
                                  isAvail ? 'Stock Out' : 'Restock',
                                  style: TextStyle(color: isAvail ? Colors.red : Colors.green, fontSize: 10, fontWeight: FontWeight.bold),
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.edit_outlined, color: BrandColors.cyan, size: 18),
                                onPressed: () => _showItemModal(item: item),
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete_outline, color: BrandColors.red, size: 18),
                                onPressed: () => _deleteItem(item['_id']),
                              ),
                            ],
                          )
                        ],
                      ),
                    );
                  }),
                ]
              ],
            ),
    );
  }
}
