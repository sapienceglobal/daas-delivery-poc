import 'dart:convert';
import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../theme.dart';
import '../../widgets/glass_container.dart';

class MerchantPosScreen extends StatefulWidget {
  final String? initialTableId;
  final String? initialTableNumber;

  const MerchantPosScreen({
    super.key,
    this.initialTableId,
    this.initialTableNumber,
  });

  @override
  State<MerchantPosScreen> createState() => _MerchantPosScreenState();
}

class _MerchantPosScreenState extends State<MerchantPosScreen> {
  bool _isLoading = true;
  String? _restaurantId;
  List<dynamic> _menuItems = [];
  List<dynamic> _categories = [];
  String? _activeCategoryId;

  // Cart / Ticket state
  final Map<String, int> _cart = {}; // menuItemId -> quantity
  double _total = 0.0;
  bool _isCheckingOut = false;
  String _orderType = 'takeout'; // 'takeout' or 'dine_in'
  String? _tableNumber;
  int _splitWays = 1;

  @override
  void initState() {
    super.initState();
    if (widget.initialTableNumber != null) {
      _orderType = 'dine_in';
      _tableNumber = widget.initialTableNumber;
    }
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final restRes = await ApiService.get('/api/restaurants/merchant/my');
      final restData = json.decode(restRes.body);
      
      if (restData['data'] != null) {
        // Correcting the [0] array bug: restData['data'] is a Map, not a List
        _restaurantId = restData['data']['_id'];
        
        final menuFuture = ApiService.get('/api/menu/restaurant/$_restaurantId');
        final catFuture = ApiService.get('/api/menu/categories/$_restaurantId');
        
        final results = await Future.wait([menuFuture, catFuture]);
        
        final menuData = json.decode(results[0].body);
        final catData = json.decode(results[1].body);
        
        setState(() {
          _menuItems = menuData['data'] ?? [];
          _categories = catData['data'] ?? [];
          if (_categories.isNotEmpty) {
            _activeCategoryId = _categories[0]['_id'];
          }
        });
      }
    } catch (e) {
      debugPrint('Error loading POS menu data: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _addToCart(dynamic item) {
    final id = item['_id'];
    setState(() {
      _cart[id] = (_cart[id] ?? 0) + 1;
      _calculateTotal();
    });
  }

  void _removeFromCart(dynamic item) {
    final id = item['_id'];
    setState(() {
      if (_cart.containsKey(id)) {
        if (_cart[id]! > 1) {
          _cart[id] = _cart[id]! - 1;
        } else {
          _cart.remove(id);
        }
        _calculateTotal();
      }
    });
  }

  void _calculateTotal() {
    _total = 0.0;
    _cart.forEach((id, quantity) {
      final item = _menuItems.firstWhere((m) => m['_id'] == id);
      _total += (item['price'] as num) * quantity;
    });
  }

  Future<void> _checkout() async {
    if (_cart.isEmpty) return;
    if (_orderType == 'dine_in' && (_tableNumber == null || _tableNumber!.trim().isEmpty)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter Table Number for Dine-In orders'), backgroundColor: BrandColors.red),
      );
      return;
    }

    setState(() => _isCheckingOut = true);
    try {
      final List<Map<String, dynamic>> itemsPayload = _cart.entries.map((entry) {
        final item = _menuItems.firstWhere((m) => m['_id'] == entry.key);
        return {
          'menuItemId': entry.key,
          'quantity': entry.value,
          'price': item['price'],
          'name': item['name']
        };
      }).toList();

      final payload = {
        'restaurantId': _restaurantId,
        'items': itemsPayload,
        'orderType': _orderType == 'takeout' ? 'pickup' : 'dine_in',
        'paymentMethod': 'cash',
        'address': _orderType == 'dine_in' ? 'Table $_tableNumber' : 'Walk-in Customer',
        if (_orderType == 'dine_in') 'tableNumber': _tableNumber,
      };

      final response = await ApiService.post('/api/orders', payload);
      final resData = json.decode(response.body);

      if (resData['success'] == true) {
        final orderId = resData['data']['_id'];
        
        // Advance POS orders: accept and begin preparing automatically
        await ApiService.put('/api/orders/$orderId/accept', {});
        await ApiService.put('/api/orders/$orderId/status', {'status': 'preparing'});

        setState(() {
          _cart.clear();
          _total = 0.0;
          _splitWays = 1;
        });
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Order processed and sent to Kitchen!'), backgroundColor: BrandColors.green),
          );
        }
      } else {
        throw Exception(resData['message'] ?? 'Checkout failed');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: BrandColors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isCheckingOut = false);
    }
  }

  void _showPinDialog(String mode) {
    String pin = '';
    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            Widget buildBtn(String val) {
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(4.0),
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: val == 'OK' ? BrandColors.green : (val == 'C' ? BrandColors.red.withOpacity(0.2) : Colors.white10),
                      padding: EdgeInsets.zero,
                      minimumSize: const Size(60, 48),
                    ),
                    onPressed: () async {
                      if (val == 'C') {
                        setModalState(() => pin = '');
                      } else if (val == 'OK') {
                        if (pin.length != 4) return;
                        Navigator.pop(context);
                        try {
                          final res = await ApiService.post(
                            '/api/employees/pin/clock-$mode',
                            {'pin': pin, 'restaurantId': _restaurantId},
                          );
                          final body = json.decode(res.body);
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(body['message'] ?? 'Action successful!'),
                                backgroundColor: BrandColors.green,
                              ),
                            );
                          }
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Failed: $e'), backgroundColor: BrandColors.red),
                            );
                          }
                        }
                      } else {
                        if (pin.length < 4) {
                          setModalState(() => pin += val);
                        }
                      }
                    },
                    child: Text(
                      val,
                      style: TextStyle(
                        color: val == 'OK' ? Colors.white : BrandColors.textMain,
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                      ),
                    ),
                  ),
                ),
              );
            }

            return AlertDialog(
              backgroundColor: BrandColors.card,
              title: Text(mode == 'in' ? 'Clock In' : 'Clock Out', style: const TextStyle(color: BrandColors.textMain, fontWeight: FontWeight.bold)),
              content: SizedBox(
                width: 260,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('Enter 4-digit POS PIN', style: TextStyle(color: BrandColors.textMuted)),
                    const SizedBox(height: 16),
                    Text(
                      pin.padRight(4, '•'),
                      style: const TextStyle(color: BrandColors.cyan, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 8),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [buildBtn('1'), buildBtn('2'), buildBtn('3')],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [buildBtn('4'), buildBtn('5'), buildBtn('6')],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [buildBtn('7'), buildBtn('8'), buildBtn('9')],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [buildBtn('C'), buildBtn('0'), buildBtn('OK')],
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

  @override
  Widget build(BuildContext context) {
    final filteredItems = _menuItems.where((m) => m['categoryId']?['_id'] == _activeCategoryId).toList();
    final double subtotal = _total;
    final double tax = subtotal * 0.0875;
    final double grandTotal = subtotal + tax;

    return Scaffold(
      backgroundColor: BrandColors.background,
      appBar: AppBar(
        title: const Text('POS Terminal'),
        backgroundColor: BrandColors.card,
        actions: [
          TextButton.icon(
            icon: const Icon(Icons.access_time, color: BrandColors.cyan, size: 20),
            label: const Text('Clock In', style: TextStyle(color: BrandColors.cyan)),
            onPressed: () => _showPinDialog('in'),
          ),
          const SizedBox(width: 8),
          TextButton.icon(
            icon: const Icon(Icons.exit_to_app, color: BrandColors.red, size: 20),
            label: const Text('Clock Out', style: TextStyle(color: BrandColors.red)),
            onPressed: () => _showPinDialog('out'),
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: BrandColors.cyan))
          : Row(
              children: [
                // Left side: Menu items & Categories
                Expanded(
                  flex: 2,
                  child: Column(
                    children: [
                      // Horizontal categories scrollbar
                      Container(
                        height: 60,
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _categories.length,
                          itemBuilder: (context, index) {
                            final cat = _categories[index];
                            final isActive = cat['_id'] == _activeCategoryId;
                            return Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: ChoiceChip(
                                label: Text(
                                  cat['name'] ?? '',
                                  style: TextStyle(
                                    color: isActive ? BrandColors.background : BrandColors.textMain,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                selected: isActive,
                                selectedColor: BrandColors.cyan,
                                backgroundColor: BrandColors.card,
                                showCheckmark: false,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                onSelected: (_) {
                                  setState(() => _activeCategoryId = cat['_id']);
                                },
                              ),
                            );
                          },
                        ),
                      ),
                      // Items grid
                      Expanded(
                        child: filteredItems.isEmpty
                            ? const Center(child: Text('No items in this category', style: TextStyle(color: BrandColors.textMuted)))
                            : GridView.builder(
                                padding: const EdgeInsets.all(16),
                                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: 3,
                                  crossAxisSpacing: 12,
                                  mainAxisSpacing: 12,
                                  childAspectRatio: 1.1,
                                ),
                                itemCount: filteredItems.length,
                                itemBuilder: (context, index) {
                                  final item = filteredItems[index];
                                  return GestureDetector(
                                    onTap: () => _addToCart(item),
                                    child: GlassContainer(
                                      padding: const EdgeInsets.all(8),
                                      child: Column(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Text(
                                            item['name'] ?? '',
                                            style: const TextStyle(
                                              color: BrandColors.textMain,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 14,
                                            ),
                                            textAlign: TextAlign.center,
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                          const SizedBox(height: 6),
                                          Text(
                                            '\$${(item['price'] ?? 0.0).toStringAsFixed(2)}',
                                            style: const TextStyle(color: BrandColors.cyan, fontWeight: FontWeight.bold),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                      ),
                    ],
                  ),
                ),
                // Vertical divider
                const VerticalDivider(width: 1, color: BrandColors.border),
                // Right side: POS ticket checkout card
                Container(
                  width: 350,
                  color: BrandColors.card,
                  child: Column(
                    children: [
                      // Title
                      const Padding(
                        padding: EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Icon(Icons.shopping_bag_outlined, color: BrandColors.cyan),
                            SizedBox(width: 8),
                            Text('POS Ticket', style: TextStyle(color: BrandColors.textMain, fontSize: 18, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                      // Dine-in / Takeout Toggle
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: SegmentedButton<String>(
                          style: SegmentedButton.styleFrom(
                            selectedBackgroundColor: BrandColors.cyan,
                            selectedForegroundColor: BrandColors.background,
                            foregroundColor: BrandColors.textMuted,
                          ),
                          segments: const [
                            ButtonSegment(value: 'takeout', label: Text('Takeout')),
                            ButtonSegment(value: 'dine_in', label: Text('Dine-In')),
                          ],
                          selected: {_orderType},
                          onSelectionChanged: (set) {
                            setState(() {
                              _orderType = set.first;
                              if (_orderType == 'takeout') {
                                _splitWays = 1;
                              }
                            });
                          },
                        ),
                      ),
                      // Table Input if Dine-In
                      if (_orderType == 'dine_in')
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: TextField(
                            style: const TextStyle(color: BrandColors.textMain),
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Table Number',
                              labelStyle: TextStyle(color: BrandColors.textMuted),
                              prefixIcon: Icon(Icons.table_restaurant, color: BrandColors.textMuted),
                            ),
                            controller: TextEditingController(text: _tableNumber),
                            onChanged: (val) => _tableNumber = val,
                          ),
                        ),
                      const Divider(color: BrandColors.border),
                      // Cart item list
                      Expanded(
                        child: _cart.isEmpty
                            ? const Center(child: Text('Ticket is empty', style: TextStyle(color: BrandColors.textMuted)))
                            : ListView.builder(
                                itemCount: _cart.keys.length,
                                itemBuilder: (context, index) {
                                  final id = _cart.keys.elementAt(index);
                                  final qty = _cart[id]!;
                                  final item = _menuItems.firstWhere((m) => m['_id'] == id);
                                  return ListTile(
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                                    title: Text(item['name'], style: const TextStyle(color: BrandColors.textMain, fontWeight: FontWeight.bold, fontSize: 14)),
                                    subtitle: Text('\$${item['price'].toStringAsFixed(2)}', style: const TextStyle(color: BrandColors.cyan)),
                                    trailing: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        IconButton(
                                          icon: const Icon(Icons.remove_circle_outline, color: BrandColors.red, size: 20),
                                          onPressed: () => _removeFromCart(item),
                                        ),
                                        Text('$qty', style: const TextStyle(color: BrandColors.textMain, fontWeight: FontWeight.bold)),
                                        IconButton(
                                          icon: const Icon(Icons.add_circle_outline, color: BrandColors.green, size: 20),
                                          onPressed: () => _addToCart(item),
                                        ),
                                      ],
                                    ),
                                  );
                                },
                              ),
                      ),
                      const Divider(color: BrandColors.border),
                      // Calculations
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Subtotal', style: TextStyle(color: BrandColors.textMuted)),
                                Text('\$${subtotal.toStringAsFixed(2)}', style: const TextStyle(color: BrandColors.textMain)),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Tax (8.75%)', style: TextStyle(color: BrandColors.textMuted)),
                                Text('\$${tax.toStringAsFixed(2)}', style: const TextStyle(color: BrandColors.textMain)),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Total', style: TextStyle(color: BrandColors.textMain, fontWeight: FontWeight.bold)),
                                Text('\$${grandTotal.toStringAsFixed(2)}', style: const TextStyle(color: BrandColors.green, fontSize: 18, fontWeight: FontWeight.bold)),
                              ],
                            ),
                            // Split Bill Controls (if dine-in & cart not empty)
                            if (_orderType == 'dine_in' && _cart.isNotEmpty) ...[
                              const Divider(color: BrandColors.border),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Split Bill', style: TextStyle(color: BrandColors.textMain, fontWeight: FontWeight.bold)),
                                  Row(
                                    children: [
                                      IconButton(
                                        icon: const Icon(Icons.remove_circle_outline, color: BrandColors.textMain),
                                        onPressed: () => setState(() => _splitWays = _splitWays > 1 ? _splitWays - 1 : 1),
                                      ),
                                      Text('$_splitWays', style: const TextStyle(color: BrandColors.cyan, fontWeight: FontWeight.w900, fontSize: 16)),
                                      IconButton(
                                        icon: const Icon(Icons.add_circle_outline, color: BrandColors.textMain),
                                        onPressed: () => setState(() => _splitWays = _splitWays < 10 ? _splitWays + 1 : 10),
                                      ),
                                    ],
                                  )
                                ],
                              ),
                            ]
                          ],
                        ),
                      ),
                      // Checkout Button
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        child: SizedBox(
                          width: double.infinity,
                          height: 52,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(backgroundColor: BrandColors.cyan),
                            onPressed: _cart.isEmpty || _isCheckingOut ? null : _checkout,
                            child: _isCheckingOut
                                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: BrandColors.background))
                                : Text(
                                    _splitWays > 1
                                        ? 'Pay \$${(grandTotal / _splitWays).toStringAsFixed(2)} / Person'
                                        : 'Pay \$${grandTotal.toStringAsFixed(2)}',
                                    style: const TextStyle(color: BrandColors.background, fontSize: 16, fontWeight: FontWeight.bold),
                                  ),
                          ),
                        ),
                      )
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
