import 'dart:convert';
import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../theme.dart';
import '../../widgets/glass_container.dart';
import 'merchant_pos_screen.dart';

class MerchantTablesScreen extends StatefulWidget {
  const MerchantTablesScreen({super.key});

  @override
  State<MerchantTablesScreen> createState() => _MerchantTablesScreenState();
}

class _MerchantTablesScreenState extends State<MerchantTablesScreen> {
  bool _isLoading = true;
  List<dynamic> _tables = [];
  String? _restaurantId;

  final _numberController = TextEditingController();
  final _capacityController = TextEditingController();
  String _shape = 'square'; // 'square', 'round', 'rectangle'

  @override
  void initState() {
    super.initState();
    _fetchTables();
  }

  @override
  void dispose() {
    _numberController.dispose();
    _capacityController.dispose();
    super.dispose();
  }

  Future<void> _fetchTables() async {
    setState(() => _isLoading = true);
    try {
      final restRes = await ApiService.get('/api/restaurants/merchant/my');
      final restData = json.decode(restRes.body);
      if (restData['data'] != null) {
        _restaurantId = restData['data']['_id'];
      }

      final response = await ApiService.get('/api/tables/$_restaurantId');
      final data = json.decode(response.body);
      setState(() {
        _tables = data['data'] ?? [];
      });
    } catch (e) {
      debugPrint('Error loading tables: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _createOrUpdateTable({Map<String, dynamic>? editingTable}) async {
    if (_numberController.text.isEmpty || _capacityController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all fields')));
      return;
    }

    try {
      final payload = {
        'restaurantId': _restaurantId,
        'tableNumber': _numberController.text,
        'capacity': int.tryParse(_capacityController.text) ?? 2,
        'shape': _shape,
      };

      if (editingTable != null) {
        await ApiService.put('/api/tables/${editingTable['_id']}', payload);
      } else {
        await ApiService.post('/api/tables', payload);
      }
      
      _numberController.clear();
      _capacityController.clear();
      
      if (mounted) Navigator.pop(context);
      _fetchTables();
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(editingTable != null ? 'Table updated successfully' : 'Table created successfully'), 
          backgroundColor: BrandColors.green,
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: BrandColors.red));
      }
    }
  }

  Future<void> _deleteTable(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: BrandColors.card,
        title: const Text('Delete Table?', style: TextStyle(color: BrandColors.textMain)),
        content: const Text('Are you sure you want to remove this table?', style: TextStyle(color: BrandColors.textMuted)),
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
      await ApiService.delete('/api/tables/$id');
      _fetchTables();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: BrandColors.red));
      }
    }
  }

  Future<void> _clearTable(String id) async {
    try {
      await ApiService.put('/api/tables/$id/status', {'status': 'available'});
      _fetchTables();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Table marked as available!'), backgroundColor: BrandColors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error clearing table: $e'), backgroundColor: BrandColors.red));
      }
    }
  }

  void _showAddTableModal({Map<String, dynamic>? table}) {
    if (table != null) {
      _numberController.text = table['tableNumber'] ?? '';
      _capacityController.text = (table['capacity'] ?? 2).toString();
      _shape = table['shape'] ?? 'square';
    } else {
      _numberController.clear();
      _capacityController.clear();
      _shape = 'square';
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
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(table != null ? 'Edit Table' : 'Add New Table', style: const TextStyle(color: BrandColors.textMain, fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _numberController,
                          keyboardType: TextInputType.text,
                          style: const TextStyle(color: BrandColors.textMain),
                          decoration: const InputDecoration(labelText: 'Table ID/Number', labelStyle: TextStyle(color: BrandColors.textMuted)),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: TextField(
                          controller: _capacityController,
                          keyboardType: TextInputType.number,
                          style: const TextStyle(color: BrandColors.textMain),
                          decoration: const InputDecoration(labelText: 'Seats', labelStyle: TextStyle(color: BrandColors.textMuted)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    dropdownColor: BrandColors.card,
                    value: _shape,
                    items: const [
                      DropdownMenuItem(value: 'square', child: Text('Square', style: TextStyle(color: BrandColors.textMain))),
                      DropdownMenuItem(value: 'round', child: Text('Round', style: TextStyle(color: BrandColors.textMain))),
                      DropdownMenuItem(value: 'rectangle', child: Text('Rectangle', style: TextStyle(color: BrandColors.textMain))),
                    ],
                    onChanged: (val) {
                      if (val != null) setModalState(() => _shape = val);
                    },
                    decoration: const InputDecoration(labelText: 'Shape', labelStyle: TextStyle(color: BrandColors.textMuted)),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: BrandColors.cyan),
                      onPressed: () => _createOrUpdateTable(editingTable: table),
                      child: Text(table != null ? 'Update Table' : 'Save Table', style: const TextStyle(color: BrandColors.background, fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            );
          }
        );
      }
    );
  }

  void _showMoveMergeDialog() {
    String actionType = 'move';
    String? sourceId;
    String? targetId;

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            final sourceOptions = actionType == 'move'
                ? _tables.where((t) => t['status'] == 'occupied').toList()
                : _tables;

            final targetOptions = actionType == 'move'
                ? _tables.where((t) => t['status'] == 'available').toList()
                : _tables.where((t) => t['status'] == 'occupied').toList();

            return AlertDialog(
              backgroundColor: BrandColors.card,
              title: const Text('Move or Merge Tables', style: TextStyle(color: BrandColors.textMain, fontWeight: FontWeight.bold)),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: actionType == 'move' ? BrandColors.cyan : Colors.white10,
                          ),
                          onPressed: () => setDialogState(() {
                            actionType = 'move';
                            sourceId = null;
                            targetId = null;
                          }),
                          child: Text('Move', style: TextStyle(color: actionType == 'move' ? BrandColors.background : BrandColors.textMain)),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: actionType == 'merge' ? BrandColors.cyan : Colors.white10,
                          ),
                          onPressed: () => setDialogState(() {
                            actionType = 'merge';
                            sourceId = null;
                            targetId = null;
                          }),
                          child: Text('Merge', style: TextStyle(color: actionType == 'merge' ? BrandColors.background : BrandColors.textMain)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    dropdownColor: BrandColors.card,
                    value: sourceId,
                    hint: const Text('Select Source Table', style: TextStyle(color: BrandColors.textMuted)),
                    decoration: InputDecoration(
                      labelText: actionType == 'move' ? 'Move FROM (Occupied)' : 'Merge FROM Table',
                      labelStyle: const TextStyle(color: BrandColors.textMuted),
                    ),
                    items: sourceOptions.map((t) {
                      return DropdownMenuItem<String>(
                        value: t['_id'].toString(),
                        child: Text('Table ${t['tableNumber']} (${t['status']})', style: const TextStyle(color: BrandColors.textMain)),
                      );
                    }).toList(),
                    onChanged: (val) => setDialogState(() => sourceId = val),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    dropdownColor: BrandColors.card,
                    value: targetId,
                    hint: const Text('Select Target Table', style: TextStyle(color: BrandColors.textMuted)),
                    decoration: InputDecoration(
                      labelText: actionType == 'move' ? 'Move TO (Available)' : 'Into MAIN (Occupied)',
                      labelStyle: const TextStyle(color: BrandColors.textMuted),
                    ),
                    items: targetOptions.map((t) {
                      return DropdownMenuItem<String>(
                        value: t['_id'].toString(),
                        child: Text('Table ${t['tableNumber']} (${t['status']})', style: const TextStyle(color: BrandColors.textMain)),
                      );
                    }).toList(),
                    onChanged: (val) => setDialogState(() => targetId = val),
                  ),
                ],
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
                TextButton(
                  onPressed: sourceId == null || targetId == null || sourceId == targetId
                      ? null
                      : () async {
                          Navigator.pop(context);
                          setState(() => _isLoading = true);
                          try {
                            if (actionType == 'move') {
                              await ApiService.post('/api/tables/move', {
                                'sourceTableId': sourceId,
                                'targetTableId': targetId,
                              });
                            } else {
                              await ApiService.post('/api/tables/merge', {
                                'mainTableId': targetId,
                                'mergeTableId': sourceId,
                              });
                            }
                            _fetchTables();
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Table $actionType completed successfully!'), backgroundColor: BrandColors.green),
                              );
                            }
                          } catch (e) {
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Error: $e'), backgroundColor: BrandColors.red),
                              );
                            }
                            setState(() => _isLoading = false);
                          }
                        },
                  child: const Text('Confirm', style: TextStyle(color: BrandColors.cyan)),
                )
              ],
            );
          },
        );
      },
    );
  }

  void _handleTableTap(Map<String, dynamic> table) {
    final tableNumber = table['tableNumber']?.toString();
    final tableId = table['_id']?.toString();

    if (table['status'] == 'occupied') {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          backgroundColor: BrandColors.card,
          title: Text('Table $tableNumber occupied', style: const TextStyle(color: BrandColors.textMain, fontWeight: FontWeight.bold)),
          content: const Text('Would you like to clear this table or open it in the POS terminal to add more items?', style: TextStyle(color: BrandColors.textMuted)),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                _clearTable(tableId!);
              },
              child: const Text('Clear / Free Table', style: TextStyle(color: BrandColors.green)),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => MerchantPosScreen(initialTableId: tableId, initialTableNumber: tableNumber),
                  ),
                );
              },
              child: const Text('Open POS', style: TextStyle(color: BrandColors.cyan)),
            ),
          ],
        ),
      );
    } else {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => MerchantPosScreen(initialTableId: tableId, initialTableNumber: tableNumber),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: BrandColors.background,
      appBar: AppBar(
        title: const Text('Table Management'),
        backgroundColor: BrandColors.card,
        actions: [
          IconButton(
            icon: const Icon(Icons.compare_arrows, color: BrandColors.cyan),
            onPressed: _showMoveMergeDialog,
            tooltip: 'Move / Merge',
          )
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: BrandColors.cyan,
        onPressed: () => _showAddTableModal(),
        child: const Icon(Icons.add, color: BrandColors.background),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: BrandColors.cyan))
          : _tables.isEmpty
              ? const Center(child: Text('No tables added yet', style: TextStyle(color: BrandColors.textMuted)))
              : GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 1.05,
                  ),
                  itemCount: _tables.length,
                  itemBuilder: (context, index) {
                    final table = _tables[index];
                    final isOccupied = table['status'] == 'occupied';
                    final tableNum = table['tableNumber'] ?? '';
                    final shape = table['shape'] ?? 'square';
                    
                    return GestureDetector(
                      onTap: () => _handleTableTap(table),
                      child: GlassContainer(
                        padding: const EdgeInsets.all(12),
                        child: Stack(
                          children: [
                            Align(
                              alignment: Alignment.center,
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      shape: shape == 'round' ? BoxShape.circle : BoxShape.rectangle,
                                      borderRadius: shape == 'round' ? null : BorderRadius.circular(shape == 'rectangle' ? 8 : 12),
                                      border: Border.all(color: isOccupied ? BrandColors.red : BrandColors.green, width: 3),
                                    ),
                                    child: Text(
                                      '$tableNum',
                                      style: const TextStyle(color: BrandColors.textMain, fontSize: 22, fontWeight: FontWeight.w900),
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text('${table['capacity']} Seats', style: const TextStyle(color: BrandColors.textMuted, fontSize: 13, fontWeight: FontWeight.bold)),
                                  Text(shape.toString().toUpperCase(), style: const TextStyle(color: BrandColors.cyan, fontSize: 10, fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ),
                            // Actions top bar
                            Align(
                              alignment: Alignment.topRight,
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.edit_outlined, color: BrandColors.cyan, size: 18),
                                    onPressed: () => _showAddTableModal(table: table),
                                    constraints: const BoxConstraints(),
                                    padding: EdgeInsets.zero,
                                  ),
                                  const SizedBox(width: 8),
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline, color: BrandColors.red, size: 18),
                                    onPressed: () => _deleteTable(table['_id']),
                                    constraints: const BoxConstraints(),
                                    padding: EdgeInsets.zero,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
