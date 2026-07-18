import 'dart:convert';
import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../theme.dart';
import '../../widgets/glass_container.dart';

class MerchantInventoryScreen extends StatefulWidget {
  const MerchantInventoryScreen({super.key});

  @override
  State<MerchantInventoryScreen> createState() => _MerchantInventoryScreenState();
}

class _MerchantInventoryScreenState extends State<MerchantInventoryScreen> with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  String? _restaurantId;
  List<dynamic> _inventory = [];
  List<dynamic> _suppliers = [];
  late TabController _tabController;

  // Controllers for Add Inventory Item
  final _itemNameController = TextEditingController();
  final _itemUnitController = TextEditingController();
  final _itemLowStockController = TextEditingController();
  final _itemCostController = TextEditingController();

  // Controllers for Add/Edit Supplier
  final _supNameController = TextEditingController();
  final _supContactController = TextEditingController();
  final _supPhoneController = TextEditingController();
  final _supEmailController = TextEditingController();
  final _supAddressController = TextEditingController();
  final _supItemsController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        _fetchData();
      }
    });
    _fetchData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _itemNameController.dispose();
    _itemUnitController.dispose();
    _itemLowStockController.dispose();
    _itemCostController.dispose();
    _supNameController.dispose();
    _supContactController.dispose();
    _supPhoneController.dispose();
    _supEmailController.dispose();
    _supAddressController.dispose();
    _supItemsController.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final restRes = await ApiService.get('/api/restaurants/merchant/my');
      final restData = json.decode(restRes.body);
      if (restData['data'] != null) {
        _restaurantId = restData['data']['_id'];
      }

      if (_tabController.index == 0) {
        final invRes = await ApiService.get('/api/inventory/restaurant/$_restaurantId');
        final invData = json.decode(invRes.body);
        setState(() {
          _inventory = invData['data'] ?? [];
        });
      } else {
        final supRes = await ApiService.get('/api/suppliers/restaurant/$_restaurantId');
        final supData = json.decode(supRes.body);
        setState(() {
          _suppliers = supData['data'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Error fetching inventory/suppliers: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // --- Inventory Actions ---

  Future<void> _addInventoryItem() async {
    if (_itemNameController.text.isEmpty || _itemUnitController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill Name and Unit')));
      return;
    }
    try {
      final payload = {
        'name': _itemNameController.text,
        'unit': _itemUnitController.text,
        'lowStockThreshold': int.tryParse(_itemLowStockController.text) ?? 5,
        'costPerUnit': double.tryParse(_itemCostController.text) ?? 0.0,
      };

      await ApiService.post('/api/inventory/restaurant/$_restaurantId', payload);
      _itemNameController.clear();
      _itemUnitController.clear();
      _itemLowStockController.clear();
      _itemCostController.clear();
      
      if (mounted) Navigator.pop(context);
      _fetchData();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error adding item: $e'), backgroundColor: BrandColors.red));
    }
  }

  void _showReceiveShipmentDialog(String itemId) {
    final qtyControl = TextEditingController();
    final costControl = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: BrandColors.card,
        title: const Text('Receive Shipment', style: TextStyle(color: BrandColors.textMain, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: qtyControl,
              keyboardType: TextInputType.number,
              style: const TextStyle(color: BrandColors.textMain),
              decoration: const InputDecoration(labelText: 'Quantity Received', labelStyle: TextStyle(color: BrandColors.textMuted)),
            ),
            TextField(
              controller: costControl,
              keyboardType: TextInputType.number,
              style: const TextStyle(color: BrandColors.textMain),
              decoration: const InputDecoration(labelText: 'Actual Cost Per Unit (\$)', labelStyle: TextStyle(color: BrandColors.textMuted)),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              if (qtyControl.text.isEmpty) return;
              Navigator.pop(context);
              setState(() => _isLoading = true);
              try {
                await ApiService.post('/api/inventory/$itemId/receive', {
                  'quantity': double.tryParse(qtyControl.text) ?? 0.0,
                  'costPerUnit': double.tryParse(costControl.text) ?? 0.0,
                });
                _fetchData();
              } catch (e) {
                if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: BrandColors.red));
                setState(() => _isLoading = false);
              }
            },
            child: const Text('Add to Stock', style: TextStyle(color: BrandColors.cyan)),
          )
        ],
      ),
    );
  }

  void _showWastageDialog(String itemId) {
    final qtyControl = TextEditingController();
    final reasonControl = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: BrandColors.card,
        title: const Text('Log Wastage', style: TextStyle(color: BrandColors.textMain, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: qtyControl,
              keyboardType: TextInputType.number,
              style: const TextStyle(color: BrandColors.textMain),
              decoration: const InputDecoration(labelText: 'Quantity Wasted', labelStyle: TextStyle(color: BrandColors.textMuted)),
            ),
            TextField(
              controller: reasonControl,
              style: const TextStyle(color: BrandColors.textMain),
              decoration: const InputDecoration(labelText: 'Reason / Notes', labelStyle: TextStyle(color: BrandColors.textMuted)),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              if (qtyControl.text.isEmpty) return;
              Navigator.pop(context);
              setState(() => _isLoading = true);
              try {
                await ApiService.post('/api/inventory/$itemId/wastage', {
                  'quantity': double.tryParse(qtyControl.text) ?? 0.0,
                  'reason': reasonControl.text,
                });
                _fetchData();
              } catch (e) {
                if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: BrandColors.red));
                setState(() => _isLoading = false);
              }
            },
            child: const Text('Log Wastage', style: TextStyle(color: BrandColors.cyan)),
          )
        ],
      ),
    );
  }

  // --- Supplier Actions ---

  Future<void> _saveSupplier({Map<String, dynamic>? editingSupplier}) async {
    if (_supNameController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Company name is required')));
      return;
    }

    try {
      final itemsList = _supItemsController.text
          .split(',')
          .map((i) => i.trim())
          .where((i) => i.isNotEmpty)
          .toList();

      final payload = {
        'name': _supNameController.text,
        'contactName': _supContactController.text,
        'phone': _supPhoneController.text,
        'email': _supEmailController.text,
        'address': _supAddressController.text,
        'itemsProvided': itemsList,
      };

      if (editingSupplier != null) {
        await ApiService.put('/api/suppliers/${editingSupplier['_id']}', payload);
      } else {
        await ApiService.post('/api/suppliers/restaurant/$_restaurantId', payload);
      }

      _supNameController.clear();
      _supContactController.clear();
      _supPhoneController.clear();
      _supEmailController.clear();
      _supAddressController.clear();
      _supItemsController.clear();

      if (mounted) Navigator.pop(context);
      _fetchData();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error saving: $e'), backgroundColor: BrandColors.red));
    }
  }

  Future<void> _deleteSupplier(String id) async {
    try {
      await ApiService.delete('/api/suppliers/$id');
      _fetchData();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error deleting: $e'), backgroundColor: BrandColors.red));
    }
  }

  void _showSupplierModal({Map<String, dynamic>? supplier}) {
    if (supplier != null) {
      _supNameController.text = supplier['name'] ?? '';
      _supContactController.text = supplier['contactName'] ?? '';
      _supPhoneController.text = supplier['phone'] ?? '';
      _supEmailController.text = supplier['email'] ?? '';
      _supAddressController.text = supplier['address'] ?? '';
      _supItemsController.text = (supplier['itemsProvided'] as List?)?.join(', ') ?? '';
    } else {
      _supNameController.clear();
      _supContactController.clear();
      _supPhoneController.clear();
      _supEmailController.clear();
      _supAddressController.clear();
      _supItemsController.clear();
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: BrandColors.card,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 16, right: 16, top: 16),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(supplier != null ? 'Edit Supplier' : 'Add Supplier', style: const TextStyle(color: BrandColors.textMain, fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                TextField(
                  controller: _supNameController,
                  style: const TextStyle(color: BrandColors.textMain),
                  decoration: const InputDecoration(labelText: 'Company Name', labelStyle: TextStyle(color: BrandColors.textMuted)),
                ),
                TextField(
                  controller: _supContactController,
                  style: const TextStyle(color: BrandColors.textMain),
                  decoration: const InputDecoration(labelText: 'Contact Person', labelStyle: TextStyle(color: BrandColors.textMuted)),
                ),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _supPhoneController,
                        style: const TextStyle(color: BrandColors.textMain),
                        decoration: const InputDecoration(labelText: 'Phone', labelStyle: TextStyle(color: BrandColors.textMuted)),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextField(
                        controller: _supEmailController,
                        style: const TextStyle(color: BrandColors.textMain),
                        decoration: const InputDecoration(labelText: 'Email', labelStyle: TextStyle(color: BrandColors.textMuted)),
                      ),
                    ),
                  ],
                ),
                TextField(
                  controller: _supAddressController,
                  style: const TextStyle(color: BrandColors.textMain),
                  decoration: const InputDecoration(labelText: 'Address', labelStyle: TextStyle(color: BrandColors.textMuted)),
                ),
                TextField(
                  controller: _supItemsController,
                  style: const TextStyle(color: BrandColors.textMain),
                  decoration: const InputDecoration(labelText: 'Items (comma separated)', labelStyle: TextStyle(color: BrandColors.textMuted), hintText: 'e.g. Tomato, Cheese, Beef'),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: BrandColors.cyan),
                    onPressed: () => _saveSupplier(editingSupplier: supplier),
                    child: const Text('Save Supplier', style: TextStyle(color: BrandColors.background, fontSize: 16, fontWeight: FontWeight.bold)),
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

  void _showAddInventoryModal() {
    _itemNameController.clear();
    _itemUnitController.text = 'kg';
    _itemLowStockController.text = '5';
    _itemCostController.text = '0.00';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: BrandColors.card,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 16, right: 16, top: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Add Inventory Item', style: TextStyle(color: BrandColors.textMain, fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              TextField(
                controller: _itemNameController,
                style: const TextStyle(color: BrandColors.textMain),
                decoration: const InputDecoration(labelText: 'Item Name', labelStyle: TextStyle(color: BrandColors.textMuted)),
              ),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _itemUnitController,
                      style: const TextStyle(color: BrandColors.textMain),
                      decoration: const InputDecoration(labelText: 'Unit (e.g. kg, pieces)', labelStyle: TextStyle(color: BrandColors.textMuted)),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextField(
                      controller: _itemLowStockController,
                      keyboardType: TextInputType.number,
                      style: const TextStyle(color: BrandColors.textMain),
                      decoration: const InputDecoration(labelText: 'Low Stock Alert Level', labelStyle: TextStyle(color: BrandColors.textMuted)),
                    ),
                  ),
                ],
              ),
              TextField(
                controller: _itemCostController,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: BrandColors.textMain),
                decoration: const InputDecoration(labelText: 'Default Cost Per Unit (\$)', labelStyle: TextStyle(color: BrandColors.textMuted)),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: BrandColors.cyan),
                  onPressed: _addInventoryItem,
                  child: const Text('Save Item', style: TextStyle(color: BrandColors.background, fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      }
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: BrandColors.background,
      appBar: AppBar(
        title: const Text('Inventory & Suppliers'),
        backgroundColor: BrandColors.card,
        bottom: TabBar(
          controller: _tabController,
          labelColor: BrandColors.cyan,
          unselectedLabelColor: BrandColors.textMuted,
          indicatorColor: BrandColors.cyan,
          tabs: const [
            Tab(icon: Icon(Icons.inventory), text: 'Inventory'),
            Tab(icon: Icon(Icons.local_shipping), text: 'Suppliers'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: BrandColors.cyan,
        onPressed: () {
          if (_tabController.index == 0) {
            _showAddInventoryModal();
          } else {
            _showSupplierModal();
          }
        },
        child: const Icon(Icons.add, color: BrandColors.background),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Tab 1: Inventory
          _isLoading
              ? const Center(child: CircularProgressIndicator(color: BrandColors.cyan))
              : _inventory.isEmpty
                  ? const Center(child: Text('No inventory items found', style: TextStyle(color: BrandColors.textMuted)))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _inventory.length,
                      itemBuilder: (context, index) {
                        final item = _inventory[index];
                        final double qty = (item['quantity'] as num).toDouble();
                        final double threshold = (item['lowStockThreshold'] as num).toDouble();
                        final bool isLowStock = qty <= threshold;
                        final double val = (item['totalValue'] ?? 0.0).toDouble();
                        
                        return GlassContainer(
                          margin: const EdgeInsets.only(bottom: 16),
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
                                        Text(item['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, color: BrandColors.textMain, fontSize: 16)),
                                        const SizedBox(height: 2),
                                        Text('Value: \$${val.toStringAsFixed(2)}', style: const TextStyle(color: BrandColors.textMuted, fontSize: 12)),
                                      ],
                                    ),
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        '$qty ${item['unit']}',
                                        style: TextStyle(
                                          color: isLowStock ? BrandColors.red : BrandColors.green,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 18,
                                        ),
                                      ),
                                      if (isLowStock)
                                        const Text('Low Stock Alert!', style: TextStyle(color: BrandColors.red, fontSize: 10, fontWeight: FontWeight.bold)),
                                    ],
                                  )
                                ],
                              ),
                              const Divider(color: BrandColors.border),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(backgroundColor: BrandColors.green.withOpacity(0.2), elevation: 0),
                                    onPressed: () => _showReceiveShipmentDialog(item['_id']),
                                    child: const Text('Receive', style: TextStyle(color: BrandColors.green, fontSize: 12)),
                                  ),
                                  const SizedBox(width: 8),
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(backgroundColor: BrandColors.red.withOpacity(0.2), elevation: 0),
                                    onPressed: () => _showWastageDialog(item['_id']),
                                    child: const Text('Wastage', style: TextStyle(color: BrandColors.red, fontSize: 12)),
                                  ),
                                ],
                              )
                            ],
                          ),
                        );
                      },
                    ),
          // Tab 2: Suppliers
          _isLoading
              ? const Center(child: CircularProgressIndicator(color: BrandColors.cyan))
              : _suppliers.isEmpty
                  ? const Center(child: Text('No suppliers added yet', style: TextStyle(color: BrandColors.textMuted)))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _suppliers.length,
                      itemBuilder: (context, index) {
                        final sup = _suppliers[index];
                        final itemsProvided = (sup['itemsProvided'] as List?)?.join(', ') ?? 'Not specified';
                        
                        return GlassContainer(
                          margin: const EdgeInsets.only(bottom: 16),
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
                                        Text(sup['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, color: BrandColors.textMain, fontSize: 18)),
                                        if (sup['contactName'] != null)
                                          Text(sup['contactName'], style: const TextStyle(color: BrandColors.textMuted, fontSize: 13)),
                                      ],
                                    ),
                                  ),
                                  Row(
                                    children: [
                                      IconButton(
                                        icon: const Icon(Icons.edit_outlined, color: BrandColors.cyan, size: 20),
                                        onPressed: () => _showSupplierModal(supplier: sup),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.delete_outline, color: BrandColors.red, size: 20),
                                        onPressed: () => _deleteSupplier(sup['_id']),
                                      ),
                                    ],
                                  )
                                ],
                              ),
                              const SizedBox(height: 8),
                              if (sup['phone'] != null && sup['phone'].toString().isNotEmpty)
                                Text('📞 Phone: ${sup['phone']}', style: const TextStyle(color: BrandColors.textMain, fontSize: 13)),
                              if (sup['email'] != null && sup['email'].toString().isNotEmpty)
                                Text('✉️ Email: ${sup['email']}', style: const TextStyle(color: BrandColors.textMain, fontSize: 13)),
                              if (sup['address'] != null && sup['address'].toString().isNotEmpty)
                                Text('📍 Address: ${sup['address']}', style: const TextStyle(color: BrandColors.textMain, fontSize: 13)),
                              const Divider(color: BrandColors.border),
                              Text('Provides: $itemsProvided', style: const TextStyle(color: BrandColors.cyan, fontSize: 12, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        );
                      },
                    ),
        ],
      ),
    );
  }
}
