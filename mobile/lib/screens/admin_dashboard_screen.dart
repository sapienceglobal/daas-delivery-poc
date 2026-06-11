import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../theme.dart';
import '../widgets/glass_container.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  int _activeTab = 0; // 0: Partners, 1: Users, 2: Orders, 3: Analytics
  bool _isLoading = true;
  List<dynamic> _orders = [];
  List<dynamic> _restaurants = [];
  List<dynamic> _users = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchAdminData();
  }

  Future<void> _fetchAdminData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final responses = await Future.wait([
        ApiService.get('/api/orders'),
        ApiService.get('/api/restaurants/admin/all'),
        ApiService.get('/api/auth/admin/users'),
      ]);

      final ordersData = json.decode(responses[0].body);
      final restaurantsData = json.decode(responses[1].body);
      final usersData = json.decode(responses[2].body);

      if (ordersData['success'] == true &&
          restaurantsData['success'] == true &&
          usersData['success'] == true) {
        setState(() {
          _orders = ordersData['orders'] ?? [];
          _restaurants = restaurantsData['restaurants'] ?? [];
          _users = usersData['users'] ?? [];
        });
      } else {
        throw Exception('Failed to load platform data');
      }
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _refundOrder(String orderId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: BrandColors.card,
        title: const Text('Refund & Cancel Order?', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: const Text('This will cancel the order, reverse payouts, and update order status to Refunded.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('CANCEL', style: TextStyle(color: BrandColors.textMuted))),
          ElevatedButton(onPressed: () => Navigator.of(context).pop(true), style: ElevatedButton.styleFrom(backgroundColor: BrandColors.red), child: const Text('ISSUE REFUND')),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final response = await ApiService.post('/api/orders/$orderId/refund', {});
      final data = json.decode(response.body);
      if (data['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Refund issued and order cancelled successfully!')),
        );
        await _fetchAdminData();
      } else {
        throw Exception(data['message'] ?? 'Refund failed');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Refund Error: $e')),
      );
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _updateRestaurantStatus(String id, String status) async {
    setState(() {
      _isLoading = true;
    });

    try {
      final response = await ApiService.put('/api/restaurants/$id/status', {
        'status': status,
      });
      final data = json.decode(response.body);
      if (data['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Store status updated to ${status.toUpperCase()} successfully!')),
        );
        await _fetchAdminData();
      } else {
        throw Exception(data['message'] ?? 'Failed to update store status');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Update Error: $e')),
      );
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _updateUserRole(String userId, String role, String? restaurantId) async {
    setState(() {
      _isLoading = true;
    });

    try {
      final response = await ApiService.put('/api/auth/admin/users/$userId/role', {
        'role': role,
        'restaurantId': restaurantId,
      });
      final data = json.decode(response.body);
      if (data['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('User role updated successfully!')),
        );
        await _fetchAdminData();
      } else {
        throw Exception(data['message'] ?? 'Failed to update user role');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Role Update Error: $e')),
      );
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _createRestaurant(String name, String cuisine, String address, String phone, String banner, double lat, double lng) async {
    setState(() {
      _isLoading = true;
    });

    try {
      final response = await ApiService.post('/api/restaurants', {
        'name': name,
        'cuisine': cuisine,
        'address': address,
        'phone': phone,
        'banner': banner.isEmpty ? 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80' : banner,
        'coordinates': [lng, lat],
      });
      final data = json.decode(response.body);
      if (data['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Restaurant created and auto-approved successfully!')),
        );
        await _fetchAdminData();
      } else {
        throw Exception(data['message'] ?? 'Failed to create restaurant');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Creation Error: $e')),
      );
      setState(() {
        _isLoading = false;
      });
    }
  }

  // Analytics Helpers
  double _getGrossRevenue() {
    return _orders
        .where((o) => o['deliveryStatus'] != 'cancelled' && o['deliveryStatus'] != 'refunded')
        .fold(0.0, (sum, o) => sum + ((o['subtotal'] as num?)?.toDouble() ?? 0.0));
  }

  double _getPlatformEarnings() {
    final completed = _orders.where((o) => o['deliveryStatus'] != 'cancelled' && o['deliveryStatus'] != 'refunded');
    double fees = completed.length * 2.0;
    double markup = completed.fold(0.0, (sum, o) => sum + (((o['deliveryFee'] as num?)?.toDouble() ?? 0.0) * 0.2) / 100);
    return fees + markup;
  }

  List<double> _getDailySalesData() {
    final now = DateTime.now();
    final List<double> sales = List.filled(7, 0.0);
    
    for (var order in _orders) {
      if (order['deliveryStatus'] == 'cancelled' || order['deliveryStatus'] == 'refunded') continue;
      final dateStr = order['createdAt'] as String?;
      if (dateStr == null) continue;
      
      final date = DateTime.parse(dateStr).toLocal();
      final diff = now.difference(date).inDays;
      if (diff >= 0 && diff < 7) {
        sales[6 - diff] += ((order['subtotal'] as num?)?.toDouble() ?? 0.0);
      }
    }
    return sales;
  }

  List<int> _getDailyOrdersCount() {
    final now = DateTime.now();
    final List<int> counts = List.filled(7, 0);
    
    for (var order in _orders) {
      final dateStr = order['createdAt'] as String?;
      if (dateStr == null) continue;
      
      final date = DateTime.parse(dateStr).toLocal();
      final diff = now.difference(date).inDays;
      if (diff >= 0 && diff < 7) {
        counts[6 - diff] += 1;
      }
    }
    return counts;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Dashboard'),
        backgroundColor: BrandColors.background,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.swap_horiz, color: BrandColors.cyan),
            onPressed: () => Navigator.of(context).pushReplacementNamed('/customer'),
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
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: BrandColors.cyan))
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: BrandColors.red)))
              : IndexedStack(
                  index: _activeTab,
                  children: [
                    _buildRestaurantsTab(),
                    _buildUsersTab(),
                    _buildOrdersTab(),
                    _buildAnalyticsTab(),
                  ],
                ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _activeTab,
        backgroundColor: BrandColors.card,
        selectedItemColor: BrandColors.cyan,
        unselectedItemColor: BrandColors.textMuted,
        type: BottomNavigationBarType.fixed,
        onTap: (idx) => setState(() => _activeTab = idx),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.storefront_outlined), label: 'Stores'),
          BottomNavigationBarItem(icon: Icon(Icons.people_alt_outlined), label: 'Users'),
          BottomNavigationBarItem(icon: Icon(Icons.gavel_outlined), label: 'Orders'),
          BottomNavigationBarItem(icon: Icon(Icons.analytics_outlined), label: 'Analytics'),
        ],
      ),
    );
  }

  Widget _buildRestaurantsTab() {
    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateRestaurantDialog,
        backgroundColor: BrandColors.cyan,
        child: const Icon(Icons.add, color: BrandColors.background),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchAdminData,
        child: _restaurants.isEmpty
            ? const Center(child: Text('No restaurants registered.', style: TextStyle(color: BrandColors.textMuted)))
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _restaurants.length,
                itemBuilder: (context, idx) {
                  final rest = _restaurants[idx];
                  final status = rest['status'] ?? 'pending';

                  return Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    child: GlassContainer(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(rest['name'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: status == 'approved'
                                      ? BrandColors.green.withOpacity(0.15)
                                      : status == 'rejected'
                                          ? BrandColors.red.withOpacity(0.15)
                                          : Colors.amber.withOpacity(0.15),
                                  border: Border.all(
                                    color: status == 'approved'
                                        ? BrandColors.green
                                        : status == 'rejected'
                                            ? BrandColors.red
                                            : Colors.amber,
                                  ),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  status.toString().toUpperCase(),
                                  style: TextStyle(
                                    color: status == 'approved'
                                        ? BrandColors.green
                                        : status == 'rejected'
                                            ? BrandColors.red
                                            : Colors.amber,
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text('Cuisine: ${rest['cuisine'] ?? ''}', style: const TextStyle(color: BrandColors.textMuted, fontSize: 11)),
                          Text('Address: ${rest['address'] ?? ''}', style: const TextStyle(color: BrandColors.textMuted, fontSize: 11)),
                          Text('Phone: ${rest['phone'] ?? ''}', style: const TextStyle(color: BrandColors.textMuted, fontSize: 11)),
                          const Divider(color: BrandColors.border, height: 20),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              if (status != 'approved')
                                ElevatedButton.icon(
                                  onPressed: () => _updateRestaurantStatus(rest['_id'], 'approved'),
                                  icon: const Icon(Icons.check, size: 12, color: BrandColors.background),
                                  label: const Text('APPROVE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                  style: ElevatedButton.styleFrom(backgroundColor: BrandColors.green, minimumSize: Size.zero, padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                                ),
                              if (status != 'approved' && status != 'rejected')
                                const SizedBox(width: 8),
                              if (status != 'rejected')
                                OutlinedButton.icon(
                                  onPressed: () => _updateRestaurantStatus(rest['_id'], status == 'approved' ? 'pending' : 'rejected'),
                                  icon: Icon(Icons.block, size: 12, color: status == 'approved' ? Colors.amber : BrandColors.red),
                                  label: Text(status == 'approved' ? 'SUSPEND' : 'REJECT', style: TextStyle(fontSize: 10, color: status == 'approved' ? Colors.amber : BrandColors.red, fontWeight: FontWeight.bold)),
                                  style: OutlinedButton.styleFrom(
                                    side: BorderSide(color: status == 'approved' ? Colors.amber : BrandColors.red),
                                    minimumSize: Size.zero,
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }

  Widget _buildUsersTab() {
    return RefreshIndicator(
      onRefresh: _fetchAdminData,
      child: _users.isEmpty
          ? const Center(child: Text('No users registered.', style: TextStyle(color: BrandColors.textMuted)))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _users.length,
              itemBuilder: (context, idx) {
                final user = _users[idx];
                final role = user['role'] ?? 'customer';
                
                // Find linked restaurant name if merchant
                String linkedStore = '';
                if (role == 'merchant' && user['restaurantId'] != null) {
                  final store = _restaurants.firstWhere(
                    (r) => r['_id'] == user['restaurantId'],
                    orElse: () => null,
                  );
                  linkedStore = store != null ? store['name'] : 'Linked Store Unknown';
                }

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: GlassContainer(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(user['name'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                              Text(user['email'] ?? '', style: const TextStyle(color: BrandColors.textMuted, fontSize: 11, fontFamily: 'monospace')),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: role == 'admin'
                                          ? BrandColors.red.withOpacity(0.15)
                                          : role == 'merchant'
                                              ? BrandColors.cyan.withOpacity(0.15)
                                              : BrandColors.textMuted.withOpacity(0.15),
                                      border: Border.all(
                                        color: role == 'admin'
                                            ? BrandColors.red
                                            : role == 'merchant'
                                                ? BrandColors.cyan
                                                : BrandColors.textMuted,
                                      ),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      role.toString().toUpperCase(),
                                      style: TextStyle(
                                        color: role == 'admin'
                                            ? BrandColors.red
                                            : role == 'merchant'
                                                ? BrandColors.cyan
                                                : BrandColors.textMuted,
                                        fontSize: 8,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  if (role == 'merchant' && linkedStore.isNotEmpty) ...[
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        'Store: $linkedStore',
                                        style: const TextStyle(color: BrandColors.textMuted, fontSize: 10, fontStyle: FontStyle.italic),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.edit, color: BrandColors.cyan, size: 20),
                          onPressed: () => _showEditUserDialog(user),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }

  void _showEditUserDialog(Map<String, dynamic> user) {
    String selectedRole = user['role'] ?? 'customer';
    String? selectedRestaurantId = user['restaurantId'];

    // Ensure selected restaurant is valid
    if (selectedRestaurantId != null && !_restaurants.any((r) => r['_id'] == selectedRestaurantId)) {
      selectedRestaurantId = null;
    }

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            return AlertDialog(
              backgroundColor: BrandColors.card,
              title: Text('Edit User: ${user['name']}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('PLATFORM ROLE', style: TextStyle(color: BrandColors.textMuted, fontSize: 10, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    value: selectedRole,
                    dropdownColor: BrandColors.card,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: BrandColors.background,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: BrandColors.border)),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'customer', child: Text('Customer')),
                      DropdownMenuItem(value: 'merchant', child: Text('Merchant (Store Owner)')),
                      DropdownMenuItem(value: 'admin', child: Text('Admin')),
                    ],
                    onChanged: (val) {
                      if (val != null) {
                        setStateDialog(() {
                          selectedRole = val;
                        });
                      }
                    },
                  ),
                  if (selectedRole == 'merchant') ...[
                    const SizedBox(height: 16),
                    const Text('LINKED STORE', style: TextStyle(color: BrandColors.textMuted, fontSize: 10, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String?>(
                      value: selectedRestaurantId,
                      dropdownColor: BrandColors.card,
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: BrandColors.background,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: BrandColors.border)),
                      ),
                      items: [
                        const DropdownMenuItem(value: null, child: Text('-- No Store Link --')),
                        ..._restaurants.map((r) => DropdownMenuItem(
                              value: r['_id'] as String?,
                              child: Text(r['name'] ?? ''),
                            )),
                      ],
                      onChanged: (val) {
                        setStateDialog(() {
                          selectedRestaurantId = val;
                        });
                      },
                    ),
                  ],
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('CANCEL', style: TextStyle(color: BrandColors.textMuted)),
                ),
                ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    _updateUserRole(user['_id'], selectedRole, selectedRole == 'merchant' ? selectedRestaurantId : null);
                  },
                  child: const Text('SAVE'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showCreateRestaurantDialog() {
    final nameController = TextEditingController();
    final cuisineController = TextEditingController();
    final addressController = TextEditingController();
    final phoneController = TextEditingController();
    final bannerController = TextEditingController();
    double lat = 37.7749;
    double lng = -122.4194;
    bool resolving = false;

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            Future<void> resolveAddress() async {
              if (addressController.text.trim().isEmpty) return;
              setStateDialog(() {
                resolving = true;
              });
              try {
                final response = await http.get(Uri.parse(
                    'https://nominatim.openstreetmap.org/search?format=json&q=${Uri.encodeComponent(addressController.text.trim())}&countrycodes=us&limit=1'));
                final data = json.decode(response.body);
                if (data != null && data.isNotEmpty) {
                  lat = double.parse(data[0]['lat']);
                  lng = double.parse(data[0]['lon']);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Resolved location to Lat: $lat, Lng: $lng')),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Address resolution failed. Using defaults.')),
                  );
                }
              } catch (e) {
                debugPrint('Resolution failure: $e');
              } finally {
                setStateDialog(() {
                  resolving = false;
                });
              }
            }

            return AlertDialog(
              backgroundColor: BrandColors.card,
              title: const Text('Add Approved Store', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextField(
                      controller: nameController,
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                      decoration: const InputDecoration(labelText: 'STORE NAME', labelStyle: TextStyle(color: BrandColors.textMuted, fontSize: 10)),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: cuisineController,
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                      decoration: const InputDecoration(labelText: 'CUISINE TYPES', labelStyle: TextStyle(color: BrandColors.textMuted, fontSize: 10)),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: phoneController,
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                      decoration: const InputDecoration(labelText: 'CONTACT PHONE', labelStyle: TextStyle(color: BrandColors.textMuted, fontSize: 10)),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: bannerController,
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                      decoration: const InputDecoration(labelText: 'BANNER IMAGE URL (OPTIONAL)', labelStyle: TextStyle(color: BrandColors.textMuted, fontSize: 10)),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('STREET ADDRESS', style: TextStyle(color: BrandColors.textMuted, fontSize: 10)),
                        TextButton.icon(
                          onPressed: resolving ? null : resolveAddress,
                          icon: const Icon(Icons.pin_drop, size: 12, color: BrandColors.cyan),
                          label: Text(resolving ? 'Resolving...' : 'RESOLVE GPS', style: const TextStyle(fontSize: 9, color: BrandColors.cyan)),
                        ),
                      ],
                    ),
                    TextField(
                      controller: addressController,
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                      maxLines: 2,
                      decoration: const InputDecoration(hintText: 'e.g. 100 Sutter St, San Francisco, CA', hintStyle: TextStyle(color: BrandColors.textMuted, fontSize: 11)),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('CANCEL', style: TextStyle(color: BrandColors.textMuted)),
                ),
                ElevatedButton(
                  onPressed: () {
                    final name = nameController.text.trim();
                    final cuisine = cuisineController.text.trim();
                    final phone = phoneController.text.trim();
                    final address = addressController.text.trim();
                    if (name.isEmpty || cuisine.isEmpty || phone.isEmpty || address.isEmpty) return;
                    Navigator.of(context).pop();
                    _createRestaurant(name, cuisine, address, phone, bannerController.text.trim(), lat, lng);
                  },
                  child: const Text('CREATE'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _buildAnalyticsTab() {
    final gross = _getGrossRevenue();
    final earnings = _getPlatformEarnings();
    final dailySales = _getDailySalesData();
    final dailyOrders = _getDailyOrdersCount();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Platform Overview', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 16),

          // Total Earnings Blocks
          Row(
            children: [
              Expanded(
                child: GlassContainer(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('GROSS VOLUME', style: TextStyle(color: BrandColors.textMuted, fontSize: 10, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 6),
                      Text('\$${gross.toStringAsFixed(2)}', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: GlassContainer(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('PLATFORM FEES', style: TextStyle(color: BrandColors.cyan, fontSize: 10, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 6),
                      Text('\$${earnings.toStringAsFixed(2)}', style: const TextStyle(color: BrandColors.cyan, fontSize: 18, fontWeight: FontWeight.w900)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Custom Paint line chart for sales volume
          GlassContainer(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Daily Revenue (Past 7 Days)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white)),
                const SizedBox(height: 16),
                SizedBox(
                  height: 120,
                  width: double.infinity,
                  child: CustomPaint(
                    painter: AnalyticsLineChartPainter(dataPoints: dailySales),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Custom Paint bar chart for order count
          GlassContainer(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Daily Order Count (Past 7 Days)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white)),
                const SizedBox(height: 16),
                SizedBox(
                  height: 120,
                  width: double.infinity,
                  child: CustomPaint(
                    painter: AnalyticsBarChartPainter(dataPoints: dailyOrders),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildOrdersTab() {
    return RefreshIndicator(
      onRefresh: _fetchAdminData,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _orders.length,
        itemBuilder: (context, idx) {
          final order = _orders[idx];
          final isRefunded = order['refunded'] == true || order['deliveryStatus'] == 'refunded' || order['deliveryStatus'] == 'cancelled';
          final date = DateTime.parse(order['createdAt']).toLocal();

          return Container(
            margin: const EdgeInsets.only(bottom: 16),
            child: GlassContainer(
              borderColor: isRefunded ? BrandColors.red.withOpacity(0.3) : null,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '#${order['_id'].toString().substring(order['_id'].toString().length - 8).toUpperCase()}',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
                      ),
                      Text(
                        '\$${(order['subtotal'] as num).toStringAsFixed(2)}',
                        style: const TextStyle(fontWeight: FontWeight.w900, color: BrandColors.cyan, fontSize: 14),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text('Store: ${order['restaurantName']}', style: const TextStyle(color: BrandColors.textMuted, fontSize: 11)),
                  Text('Customer: ${order['customerName']} (${order['customerPhone']})', style: const TextStyle(color: BrandColors.textMuted, fontSize: 11)),
                  Text('Placed: ${DateFormat('MMM d, h:mm a').format(date)}', style: const TextStyle(color: BrandColors.textMuted, fontSize: 11)),
                  const Divider(color: BrandColors.border, height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        isRefunded ? 'STATUS: REFUNDED' : 'STATUS: ${order['deliveryStatus'].toString().toUpperCase()}',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 10,
                          color: isRefunded ? BrandColors.red : BrandColors.cyan,
                        ),
                      ),
                      if (!isRefunded)
                        ElevatedButton(
                          onPressed: () => _refundOrder(order['_id']),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: BrandColors.red,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            minimumSize: Size.zero,
                          ),
                          child: const Text('CANCEL & REFUND', style: TextStyle(fontSize: 10)),
                        )
                      else
                        const Text('Captured & Settled', style: TextStyle(color: BrandColors.textMuted, fontSize: 11, fontStyle: FontStyle.italic)),
                    ],
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

class AnalyticsLineChartPainter extends CustomPainter {
  final List<double> dataPoints;
  AnalyticsLineChartPainter({required this.dataPoints});

  @override
  void paint(Canvas canvas, Size size) {
    if (dataPoints.isEmpty) return;
    
    final paintLine = Paint()
      ..color = BrandColors.cyan
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;

    final paintFill = Paint()
      ..color = BrandColors.cyan.withOpacity(0.15)
      ..style = PaintingStyle.fill;

    final double maxVal = dataPoints.reduce((a, b) => a > b ? a : b);
    final double divisor = maxVal == 0 ? 1 : maxVal;

    final int len = dataPoints.length;
    final double stepX = size.width / (len - 1);

    final pathLine = Path();
    final pathFill = Path();

    pathFill.moveTo(0, size.height);

    for (int i = 0; i < len; i++) {
      final double x = i * stepX;
      final double ratio = dataPoints[i] / divisor;
      final double y = size.height - (ratio * (size.height - 20)) - 10;

      if (i == 0) {
        pathLine.moveTo(x, y);
      } else {
        pathLine.lineTo(x, y);
      }
      pathFill.lineTo(x, y);
    }

    pathFill.lineTo(size.width, size.height);
    pathFill.close();

    canvas.drawPath(pathFill, paintFill);
    canvas.drawPath(pathLine, paintLine);

    // Draw coordinate dots
    final paintDot = Paint()..color = Colors.white;
    for (int i = 0; i < len; i++) {
      final double x = i * stepX;
      final double ratio = dataPoints[i] / divisor;
      final double y = size.height - (ratio * (size.height - 20)) - 10;
      canvas.drawCircle(Offset(x, y), 4, paintDot);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

class AnalyticsBarChartPainter extends CustomPainter {
  final List<int> dataPoints;
  AnalyticsBarChartPainter({required this.dataPoints});

  @override
  void paint(Canvas canvas, Size size) {
    if (dataPoints.isEmpty) return;

    final paintBar = Paint()
      ..color = BrandColors.blue
      ..style = PaintingStyle.fill;

    final double maxVal = dataPoints.reduce((a, b) => a > b ? a : b).toDouble();
    final double divisor = maxVal == 0 ? 1 : maxVal;

    final int len = dataPoints.length;
    final double space = 12.0;
    final double barWidth = (size.width - (space * (len - 1))) / len;

    for (int i = 0; i < len; i++) {
      final double ratio = dataPoints[i] / divisor;
      final double height = ratio * (size.height - 20);
      
      final double left = i * (barWidth + space);
      final double top = size.height - height;
      final double right = left + barWidth;
      final double bottom = size.height;

      final rect = RRect.fromRectAndRadius(
        Rect.fromLTRB(left, top, right, bottom),
        const Radius.circular(6),
      );
      canvas.drawRRect(rect, paintBar);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
