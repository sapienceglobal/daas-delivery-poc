import 'dart:convert';
import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';
import '../theme.dart';
import '../widgets/glass_container.dart';

class MerchantDashboardScreen extends StatefulWidget {
  const MerchantDashboardScreen({super.key});

  @override
  State<MerchantDashboardScreen> createState() => _MerchantDashboardScreenState();
}

class _MerchantDashboardScreenState extends State<MerchantDashboardScreen> {
  // Navigation
  int _activeTab = 0; // 0: Orders, 1: Menu, 2: Settings
  bool _isLoading = true;

  // Restaurant details
  Map<String, dynamic>? _restaurant;
  List<dynamic> _orders = [];

  // Register Restaurant Profile Form Controllers
  final _regNameController = TextEditingController();
  final _regCuisineController = TextEditingController();
  final _regAddressController = TextEditingController();
  final _regPhoneController = TextEditingController();
  final _regBannerController = TextEditingController();
  bool _submittingReg = false;

  // Add/Edit Menu Item Controllers
  final _itemNameController = TextEditingController();
  final _itemDescController = TextEditingController();
  final _itemPriceController = TextEditingController();
  String _itemCategory = 'Mains';
  String? _editingItemId;
  bool _savingItem = false;

  // Hours Settings Controllers
  final _openTimeController = TextEditingController(text: '09:00');
  final _closeTimeController = TextEditingController(text: '22:00');
  bool _savingSettings = false;

  // Loop alert chime
  Timer? _chimeTimer;
  bool _chimeMuted = false;

  @override
  void initState() {
    super.initState();
    _fetchMerchantProfile();
  }

  @override
  void dispose() {
    _chimeTimer?.cancel();
    _regNameController.dispose();
    _regCuisineController.dispose();
    _regAddressController.dispose();
    _regPhoneController.dispose();
    _regBannerController.dispose();
    _itemNameController.dispose();
    _itemDescController.dispose();
    _itemPriceController.dispose();
    _openTimeController.dispose();
    _closeTimeController.dispose();
    SocketService.disconnect('merchant_dashboard');
    super.dispose();
  }

  Future<void> _fetchMerchantProfile() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      if (auth.token == null) return;

      final response = await ApiService.get('/api/restaurants/merchant/my');
      final data = json.decode(response.body);
      
      if (data['success'] == true) {
        setState(() {
          _restaurant = data['restaurant'];
          _openTimeController.text = _restaurant?['openTime'] ?? '09:00';
          _closeTimeController.text = _restaurant?['closeTime'] ?? '22:00';
        });

        if (_restaurant != null) {
          await _fetchOrders();
          _connectSocket();
        }
      }
    } catch (e) {
      debugPrint('Error fetching merchant profile: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchOrders() async {
    try {
      final response = await ApiService.get('/api/orders/merchant/all');
      final data = json.decode(response.body);
      if (data['success'] == true) {
        setState(() {
          _orders = data['orders'] ?? [];
        });
        _updateChimeTimer();
      }
    } catch (e) {
      debugPrint('Error loading orders: $e');
    }
  }

  void _connectSocket() {
    SocketService.connect(
      listenerId: 'merchant_dashboard',
      restaurantId: _restaurant!['_id'],
      onNewOrder: (newOrder) {
        if (newOrder != null) {
          setState(() {
            // Avoid duplicates
            if (!_orders.any((o) => o['_id'] == newOrder['_id'])) {
              _orders.insert(0, newOrder);
            }
          });
          _playChime();
          _updateChimeTimer();
        }
      },
      onOrderUpdated: (updatedOrder) {
        if (updatedOrder != null) {
          setState(() {
            _orders = _orders.map((o) => o['_id'] == updatedOrder['_id'] ? updatedOrder : o).toList();
          });
          _updateChimeTimer();
        }
      },
    );
  }

  void _playChime() {
    if (_chimeMuted) return;
    // Play system beep sound
    SystemSound.play(SystemSoundType.click);
    Future.delayed(const Duration(milliseconds: 200), () {
      SystemSound.play(SystemSoundType.click);
    });
  }

  void _updateChimeTimer() {
    _chimeTimer?.cancel();
    final hasPending = _orders.any((o) => o['deliveryStatus'] == 'pending');
    if (hasPending) {
      _chimeTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
        _playChime();
      });
    }
  }

  void _showUploadBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: BrandColors.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        double uploadProgress = 0.0;
        bool isUploading = false;
        String uploadStatus = '';

        final presets = [
          {'name': 'Burgers', 'url': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80'},
          {'name': 'Pizza', 'url': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80'},
          {'name': 'Sushi', 'url': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80'},
          {'name': 'Desserts', 'url': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80'},
          {'name': 'Cafe', 'url': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80'},
          {'name': 'Fine Dining', 'url': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80'},
        ];

        return StatefulBuilder(
          builder: (context, setStateSheet) {
            void startMockUpload(String url, String fileName) {
              setStateSheet(() {
                isUploading = true;
                uploadProgress = 0.0;
                uploadStatus = 'Connecting to storage server...';
              });

              const steps = 15;
              int currentStep = 0;
              Timer.periodic(const Duration(milliseconds: 100), (timer) {
                currentStep++;
                setStateSheet(() {
                  uploadProgress = currentStep / steps;
                  if (currentStep < 4) {
                    uploadStatus = 'Optimizing banner dimensions...';
                  } else if (currentStep < 9) {
                    uploadStatus = 'Uploading $fileName (${(uploadProgress * 100).toInt()}%)...';
                  } else if (currentStep < 14) {
                    uploadStatus = 'Saving file references...';
                  } else {
                    uploadStatus = 'Upload complete!';
                  }
                });

                if (currentStep >= steps) {
                  timer.cancel();
                  Future.delayed(const Duration(milliseconds: 300), () {
                    if (context.mounted) {
                      _regBannerController.text = url;
                      setState(() {});
                      Navigator.of(context).pop();
                    }
                  });
                }
              });
            }

            if (isUploading) {
              return Container(
                padding: const EdgeInsets.all(24),
                height: 250,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.cloud_upload, size: 48, color: BrandColors.cyan),
                    const SizedBox(height: 16),
                    Text(
                      uploadStatus,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    const SizedBox(height: 16),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: uploadProgress,
                        backgroundColor: BrandColors.background,
                        color: BrandColors.cyan,
                        minHeight: 8,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${(uploadProgress * 100).toInt()}%',
                      style: const TextStyle(color: BrandColors.textMuted, fontSize: 12),
                    ),
                  ],
                ),
              );
            }

            return Container(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Upload Banner Image',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.white),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: () {
                      final randomIdx = Random().nextInt(presets.length);
                      final preset = presets[randomIdx];
                      startMockUpload(preset['url']!, 'device_photo_${randomIdx + 1}.jpg');
                    },
                    icon: const Icon(Icons.upload_file, color: BrandColors.background),
                    label: const Text('UPLOAD FROM DEVICE'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: BrandColors.cyan,
                      foregroundColor: BrandColors.background,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'OR SELECT CUISINE BANNER PRESET',
                    style: TextStyle(color: BrandColors.textMuted, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 100,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: presets.length,
                      itemBuilder: (context, idx) {
                        final p = presets[idx];
                        return GestureDetector(
                          onTap: () {
                            startMockUpload(p['url']!, '${p['name']!.toLowerCase()}_banner.jpg');
                          },
                          child: Container(
                            width: 120,
                            margin: const EdgeInsets.only(right: 12),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: BrandColors.border),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(11),
                              child: Stack(
                                fit: StackFit.expand,
                                children: [
                                  Image.network(
                                    p['url']!,
                                    fit: BoxFit.cover,
                                    errorBuilder: (c, e, s) => Container(color: BrandColors.border),
                                  ),
                                  Container(
                                    color: Colors.black.withOpacity(0.4),
                                  ),
                                  Center(
                                    child: Text(
                                      p['name']!,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12,
                                        shadows: [
                                          Shadow(blurRadius: 4, color: Colors.black),
                                        ],
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
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

  Future<void> _registerRestaurant() async {
    final name = _regNameController.text.trim();
    final cuisine = _regCuisineController.text.trim();
    final address = _regAddressController.text.trim();
    final phone = _regPhoneController.text.trim();
    final banner = _regBannerController.text.trim();

    if (name.isEmpty || cuisine.isEmpty || address.isEmpty || phone.isEmpty || banner.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill out all fields, including the banner image.')),
      );
      return;
    }

    setState(() {
      _submittingReg = true;
    });

    try {
      final response = await ApiService.post('/api/restaurants', {
        'name': name,
        'cuisine': cuisine,
        'address': address,
        'phone': phone,
        'banner': banner,
        'lat': 37.7749,
        'lng': -122.4194,
      });

      final data = json.decode(response.body);
      if (data['success'] == true) {
        setState(() {
          _restaurant = data['restaurant'];
        });
        await _fetchOrders();
        _connectSocket();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to link restaurant: $e')),
      );
    } finally {
      setState(() {
        _submittingReg = false;
      });
    }
  }

  Future<void> _updateOrderStatus(String orderId, String prepStatus) async {
    try {
      final response = await ApiService.put('/api/orders/$orderId/prep', {
        'status': prepStatus,
      });
      final data = json.decode(response.body);
      if (data['success'] == true) {
        setState(() {
          _orders = _orders.map((o) => o['_id'] == orderId ? data['order'] : o).toList();
        });
        _updateChimeTimer();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update status: $e')),
      );
    }
  }

  bool _hasStatusUpdateContaining(Map<String, dynamic> order, String keyword) {
    final updates = order['statusUpdates'] as List?;
    if (updates == null) return false;
    return updates.any((update) {
      final desc = update['description']?.toString().toLowerCase() ?? '';
      return desc.contains(keyword.toLowerCase());
    });
  }

  Future<void> _toggleMenuItemStock(String itemId, bool available) async {
    try {
      final restId = _restaurant!['_id'];
      final menuList = _restaurant!['menu'] as List;
      final item = menuList.firstWhere((i) => (i['_id'] ?? i['id']) == itemId);

      final response = await ApiService.put('/api/restaurants/$restId/menu/$itemId', {
        'name': item['name'],
        'description': item['description'],
        'price': item['price'],
        'category': item['category'],
        'isAvailable': available,
      });
      final data = json.decode(response.body);
      if (data['success'] == true) {
        setState(() {
          _restaurant = data['restaurant'];
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update menu item: $e')),
      );
    }
  }

  Future<void> _saveMenuItem() async {
    if (_itemNameController.text.trim().isEmpty || _itemPriceController.text.trim().isEmpty) return;

    setState(() {
      _savingItem = true;
    });

    try {
      final restId = _restaurant!['_id'];
      final price = double.parse(_itemPriceController.text.trim());
      
      final payload = {
        'name': _itemNameController.text.trim(),
        'description': _itemDescController.text.trim(),
        'price': price,
        'category': _itemCategory,
      };

      if (_editingItemId != null) {
        final res = await ApiService.put('/api/restaurants/$restId/menu/$_editingItemId', payload);
        final data = json.decode(res.body);
        if (data['success'] == true) {
          setState(() {
            _restaurant = data['restaurant'];
          });
        }
      } else {
        final res = await ApiService.post('/api/restaurants/$restId/menu', payload);
        final data = json.decode(res.body);
        if (data['success'] == true) {
          setState(() {
            _restaurant = data['restaurant'];
          });
        }
      }
      
      if (context.mounted) Navigator.of(context).pop();
      _itemNameController.clear();
      _itemDescController.clear();
      _itemPriceController.clear();
      _editingItemId = null;
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to save menu item: $e')),
      );
    } finally {
      setState(() {
        _savingItem = false;
      });
    }
  }

  Future<void> _deleteMenuItem(String itemId) async {
    if (!await _showConfirmDialog('Delete Item', 'Are you sure you want to delete this menu item?')) return;

    try {
      final restId = _restaurant!['_id'];
      final response = await ApiService.delete('/api/restaurants/$restId/menu/$itemId');
      final data = json.decode(response.body);
      if (data['success'] == true) {
        setState(() {
          _restaurant = data['restaurant'];
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to delete item: $e')),
      );
    }
  }

  Future<void> _saveSettings() async {
    setState(() {
      _savingSettings = true;
    });

    try {
      final restId = _restaurant!['_id'];
      final response = await ApiService.put('/api/restaurants/$restId', {
        'openTime': _openTimeController.text.trim(),
        'closeTime': _closeTimeController.text.trim(),
      });
      final data = json.decode(response.body);
      if (data['success'] == true) {
        setState(() {
          _restaurant = data['restaurant'];
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Operating hours updated successfully!')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to save hours: $e')),
      );
    } finally {
      setState(() {
        _savingSettings = false;
      });
    }
  }

  Future<bool> _showConfirmDialog(String title, String content) async {
    final res = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: BrandColors.card,
        title: Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Text(content, style: const TextStyle(color: BrandColors.textMuted)),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('CANCEL', style: TextStyle(color: BrandColors.textMuted))),
          ElevatedButton(onPressed: () => Navigator.of(context).pop(true), style: ElevatedButton.styleFrom(backgroundColor: BrandColors.red), child: const Text('CONFIRM')),
        ],
      ),
    );
    return res ?? false;
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator(color: BrandColors.cyan)));
    }

    if (_restaurant == null) {
      return _buildProfileRegistrationScreen();
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(_restaurant?['name'] ?? 'Merchant Portal'),
        backgroundColor: BrandColors.background,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(_chimeMuted ? Icons.volume_off : Icons.volume_up, color: BrandColors.cyan),
            onPressed: () {
              setState(() {
                _chimeMuted = !_chimeMuted;
              });
              _updateChimeTimer();
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: BrandColors.red),
            onPressed: () async {
              final auth = Provider.of<AuthProvider>(context, listen: false);
              await auth.logout();
            },
          ),
        ],
      ),
      body: IndexedStack(
        index: _activeTab,
        children: [
          _buildOrdersTab(),
          _buildMenuTab(),
          _buildSettingsTab(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _activeTab,
        backgroundColor: BrandColors.card,
        selectedItemColor: BrandColors.cyan,
        unselectedItemColor: BrandColors.textMuted,
        onTap: (idx) => setState(() => _activeTab = idx),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.list_alt), label: 'Orders'),
          BottomNavigationBarItem(icon: Icon(Icons.restaurant_menu), label: 'Menu'),
          BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'Hours'),
        ],
      ),
    );
  }

  Widget _buildOrdersTab() {
    final pendingCount = _orders.where((o) => o['deliveryStatus'] == 'pending').length;

    return RefreshIndicator(
      onRefresh: _fetchOrders,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (pendingCount > 0) ...[
            Container(
              padding: const EdgeInsets.all(16),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: BrandColors.cyan.withOpacity(0.1),
                border: Border.all(color: BrandColors.cyan.withOpacity(0.3)),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Row(
                children: [
                  const Icon(Icons.notifications_active, color: BrandColors.cyan, size: 28),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('$pendingCount PENDING ORDERS', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                        const SizedBox(height: 2),
                        const Text('Orders require acceptance to schedule courier pickups.', style: TextStyle(color: BrandColors.textMuted, fontSize: 11)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],

          if (_orders.isEmpty) ...[
            const SizedBox(height: 80),
            Center(
              child: Column(
                children: [
                  Icon(Icons.inbox_outlined, size: 48, color: BrandColors.cyan.withOpacity(0.5)),
                  const SizedBox(height: 16),
                  const Text('No orders received yet.', style: TextStyle(color: BrandColors.textMuted)),
                ],
              ),
            ),
          ] else ...[
            ..._orders.map((order) {
              final isPending = order['deliveryStatus'] == 'pending';
              final isCompleted = order['deliveryStatus'] == 'delivered' || order['deliveryStatus'] == 'refunded' || order['deliveryStatus'] == 'cancelled';
              
              return Container(
                margin: const EdgeInsets.only(bottom: 16),
                child: GlassContainer(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Order #${order['_id'].toString().substring(order['_id'].toString().length - 6).toUpperCase()}',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
                          ),
                          Text(
                            '\$${(order['subtotal'] as num).toStringAsFixed(2)}',
                            style: const TextStyle(fontWeight: FontWeight.w900, color: BrandColors.cyan, fontSize: 14),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text('Customer: ${order['customerName']} (${order['customerPhone']})', style: const TextStyle(color: BrandColors.textMuted, fontSize: 11)),
                      Text('Address: ${order['address']}', style: const TextStyle(color: BrandColors.textMuted, fontSize: 11)),
                      if (order['courierNotes'] != null)
                        Text('Courier Notes: "${order['courierNotes']}"', style: const TextStyle(color: BrandColors.green, fontSize: 11, fontStyle: FontStyle.italic)),
                      
                      const Divider(color: BrandColors.border, height: 20),
                      
                      // Items details
                      ...(order['items'] as List).map((i) => Padding(
                            padding: const EdgeInsets.symmetric(vertical: 2),
                            child: Text('• ${i['quantity']}x ${i['name']}', style: const TextStyle(fontSize: 12, color: Colors.white)),
                          )),
                      
                      const Divider(color: BrandColors.border, height: 20),
                      
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Status: ${order['deliveryStatus'].toUpperCase()}',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                              color: order['deliveryStatus'] == 'pending'
                                  ? BrandColors.cyan
                                  : isCompleted
                                      ? BrandColors.textMuted
                                      : BrandColors.blue,
                            ),
                          ),
                          if (isPending)
                            ElevatedButton(
                              onPressed: () => _updateOrderStatus(order['_id'], 'accepted'),
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                minimumSize: Size.zero,
                              ),
                              child: const Text('ACCEPT ORDER'),
                            )
                          else if (order['deliveryStatus'] == 'processing')
                            _hasStatusUpdateContaining(order, 'complete')
                                ? Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                    decoration: BoxDecoration(
                                      color: BrandColors.green.withOpacity(0.15),
                                      border: Border.all(color: BrandColors.green.withOpacity(0.3)),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: const [
                                        Icon(Icons.check_circle_outline, size: 14, color: BrandColors.green),
                                        SizedBox(width: 6),
                                        Text(
                                          'Food Ready / Dispatched',
                                          style: TextStyle(color: BrandColors.green, fontSize: 11, fontWeight: FontWeight.bold),
                                        ),
                                      ],
                                    ),
                                  )
                                : ElevatedButton(
                                    onPressed: () => _updateOrderStatus(order['_id'], 'ready'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: BrandColors.green,
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                      minimumSize: Size.zero,
                                    ),
                                    child: const Text('MARK READY'),
                                  )
                          else if (!isCompleted)
                            Text(
                              order['deliveryStatus'] == 'driver_assigned'
                                  ? 'Courier Heading to Store'
                                  : order['deliveryStatus'] == 'picked_up'
                                      ? 'Out for Delivery'
                                      : 'In Transit',
                              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                            )
                          else
                            const Text('Archived', style: TextStyle(color: BrandColors.textMuted, fontSize: 11)),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            }),
          ]
        ],
      ),
    );
  }

  Widget _buildMenuTab() {
    final menu = _restaurant?['menu'] as List? ?? [];
    
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Menu Management', style: Theme.of(context).textTheme.titleMedium),
              ElevatedButton.icon(
                onPressed: () => _showMenuItemDialog(),
                icon: const Icon(Icons.add, size: 16, color: BrandColors.background),
                label: const Text('ADD NEW'),
                style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8), minimumSize: Size.zero),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          if (menu.isEmpty) ...[
            const SizedBox(height: 80),
            const Center(child: Text('Your menu is empty. Add items to list them on the marketplace.', style: TextStyle(color: BrandColors.textMuted, fontSize: 12))),
          ] else ...[
            ...menu.map((item) {
              final itemId = item['_id'] ?? item['id'];
              final isAvailable = item['isAvailable'] != false;
              
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                child: GlassContainer(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white)),
                            const SizedBox(height: 2),
                            Text('\$${(item['price'] as num).toStringAsFixed(2)}  •  ${item['category']}', style: const TextStyle(color: BrandColors.cyan, fontSize: 11, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                      
                      // Availability Toggle
                      Row(
                        children: [
                          const Text('Stock: ', style: TextStyle(fontSize: 10, color: BrandColors.textMuted)),
                          Switch(
                            value: isAvailable,
                            activeThumbColor: BrandColors.cyan,
                            inactiveTrackColor: BrandColors.border.withOpacity(0.3),
                            onChanged: (val) => _toggleMenuItemStock(itemId, val),
                          ),
                        ],
                      ),
                      
                      IconButton(
                        icon: const Icon(Icons.edit, color: BrandColors.textMuted, size: 18),
                        onPressed: () {
                          _itemNameController.text = item['name'] ?? '';
                          _itemDescController.text = item['description'] ?? '';
                          _itemPriceController.text = '${item['price'] ?? ''}';
                          _itemCategory = item['category'] ?? 'Mains';
                          _editingItemId = itemId;
                          _showMenuItemDialog();
                        },
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, color: BrandColors.red, size: 18),
                        onPressed: () => _deleteMenuItem(itemId),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ],
        ],
      ),
    );
  }

  void _showMenuItemDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            return AlertDialog(
              backgroundColor: BrandColors.card,
              title: Text(_editingItemId == null ? 'Add Menu Item' : 'Edit Menu Item', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(controller: _itemNameController, decoration: const InputDecoration(labelText: 'Item Name')),
                    const SizedBox(height: 12),
                    TextField(controller: _itemDescController, decoration: const InputDecoration(labelText: 'Description')),
                    const SizedBox(height: 12),
                    TextField(controller: _itemPriceController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Price (USD)')),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: _itemCategory,
                      decoration: const InputDecoration(labelText: 'Category'),
                      dropdownColor: BrandColors.card,
                      items: const [
                        DropdownMenuItem(value: 'Mains', child: Text('Mains')),
                        DropdownMenuItem(value: 'Appetizers', child: Text('Appetizers')),
                        DropdownMenuItem(value: 'Drinks', child: Text('Drinks')),
                        DropdownMenuItem(value: 'Desserts', child: Text('Desserts')),
                      ],
                      onChanged: (val) {
                        if (val != null) {
                          setStateDialog(() {
                            _itemCategory = val;
                          });
                        }
                      },
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    _itemNameController.clear();
                    _itemDescController.clear();
                    _itemPriceController.clear();
                    _editingItemId = null;
                    Navigator.of(context).pop();
                  },
                  child: const Text('CANCEL', style: TextStyle(color: BrandColors.textMuted)),
                ),
                ElevatedButton(
                  onPressed: _savingItem ? null : _saveMenuItem,
                  child: _savingItem
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: BrandColors.background))
                      : const Text('SAVE'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _buildSettingsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Operating Settings', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 16),
          
          GlassContainer(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Daily Availability Hours', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 4),
                const Text('Configure times where your restaurant receives orders.', style: TextStyle(color: BrandColors.textMuted, fontSize: 11)),
                const SizedBox(height: 20),
                
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _openTimeController,
                        decoration: const InputDecoration(
                          labelText: 'Opening Time (HH:MM)',
                          hintText: 'e.g. 09:00',
                          prefixIcon: Icon(Icons.lock_open, size: 16, color: BrandColors.cyan),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextField(
                        controller: _closeTimeController,
                        decoration: const InputDecoration(
                          labelText: 'Closing Time (HH:MM)',
                          hintText: 'e.g. 22:00',
                          prefixIcon: Icon(Icons.lock_outline, size: 16, color: BrandColors.cyan),
                        ),
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 24),
                
                ElevatedButton(
                  onPressed: _savingSettings ? null : _saveSettings,
                  child: _savingSettings
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: BrandColors.background))
                      : const Text('SAVE HOURS CONFIG'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileRegistrationScreen() {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Link Restaurant'),
        backgroundColor: BrandColors.background,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: BrandColors.red),
            onPressed: () async {
              final auth = Provider.of<AuthProvider>(context, listen: false);
              await auth.logout();
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(Icons.storefront_rounded, size: 56, color: BrandColors.cyan),
            const SizedBox(height: 16),
            const Text(
              'Restaurant Profile Required',
              textAlign: TextAlign.center,
              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Colors.white),
            ),
            const SizedBox(height: 8),
            const Text(
              'Your merchant account is not linked to any restaurant. Please configure your store listing below to start receiving orders.',
              textAlign: TextAlign.center,
              style: TextStyle(color: BrandColors.textMuted, fontSize: 12, height: 1.4),
            ),
            const SizedBox(height: 32),
            
            Form(
              child: Column(
                children: [
                  TextField(controller: _regNameController, decoration: const InputDecoration(labelText: 'Restaurant Name (e.g. Burger Palace)')),
                  const SizedBox(height: 16),
                  TextField(controller: _regCuisineController, decoration: const InputDecoration(labelText: 'Cuisines (e.g. Burgers, Fast Food)')),
                  const SizedBox(height: 16),
                  TextField(controller: _regAddressController, decoration: const InputDecoration(labelText: 'Fulfillment Address (San Francisco presaved)')),
                  const SizedBox(height: 16),
                  TextField(controller: _regPhoneController, decoration: const InputDecoration(labelText: 'Fulfillment Phone Number')),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _regBannerController,
                    decoration: const InputDecoration(labelText: 'Banner Image URL (Required)'),
                    onChanged: (val) {
                      setState(() {});
                    },
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _showUploadBottomSheet(context),
                          icon: const Icon(Icons.cloud_upload_outlined, size: 16, color: BrandColors.cyan),
                          label: const Text('UPLOAD BANNER IMAGE', style: TextStyle(color: BrandColors.cyan)),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: BrandColors.cyan),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (_regBannerController.text.trim().isNotEmpty) ...[
                    Container(
                      height: 150,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: BrandColors.border),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(15),
                        child: Image.network(
                          _regBannerController.text.trim(),
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return const Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.broken_image, color: BrandColors.red, size: 32),
                                  SizedBox(height: 8),
                                  Text(
                                    'Invalid Image URL or connection error',
                                    style: TextStyle(color: BrandColors.textMuted, fontSize: 12),
                                  ),
                                ],
                              ),
                            );
                          },
                          loadingBuilder: (context, child, loadingProgress) {
                            if (loadingProgress == null) return child;
                            return const Center(
                              child: CircularProgressIndicator(color: BrandColors.cyan),
                            );
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                  const SizedBox(height: 24),
                  
                  ElevatedButton(
                    onPressed: _submittingReg ? null : _registerRestaurant,
                    child: _submittingReg
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: BrandColors.background))
                        : const Text('CREATE STORE PROFILE'),
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
