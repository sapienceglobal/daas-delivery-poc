import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import 'dart:async';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../services/api_service.dart';
import '../theme.dart';
import '../widgets/glass_container.dart';
import 'restaurant_menu_screen.dart';
import 'checkout_screen.dart';
import 'order_history_screen.dart';
import 'order_tracking_screen.dart';
import '../widgets/cart_bottom_sheet.dart';

class CustomerHomeScreen extends StatefulWidget {
  const CustomerHomeScreen({super.key});

  @override
  State<CustomerHomeScreen> createState() => _CustomerHomeScreenState();
}

class _CustomerHomeScreenState extends State<CustomerHomeScreen> {
  // Location States
  final List<Map<String, dynamic>> _presetAddresses = [
    { 'label': 'Oak St (Default)', 'address': '456 Oak St, San Francisco, CA 94107', 'lat': 37.7749, 'lng': -122.4092 },
    { 'label': 'Union Square', 'address': '233 Geary St, San Francisco, CA 94102', 'lat': 37.7879, 'lng': -122.4075 },
    { 'label': 'Mission District', 'address': '1010 Valencia St, San Francisco, CA 94110', 'lat': 37.7599, 'lng': -122.4211 },
    { 'label': 'Lombard St', 'address': '1000 Lombard St, San Francisco, CA 94109', 'lat': 37.8021, 'lng': -122.4194 }
  ];

  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  late String _selectedAddress;
  late double _lat;
  late double _lng;
  
  final _customAddressController = TextEditingController();
  List<dynamic> _suggestions = [];
  bool _isLoadingSuggestions = false;
  Timer? _debounce;
  bool _showAddressModal = false;

  // Search & Categories States
  final _searchController = TextEditingController();
  String _searchTerm = '';
  String _selectedCategory = 'All';

  // Restaurants State
  List<dynamic> _restaurants = [];
  bool _isLoadingRestaurants = true;
  String? _restaurantError;

  @override
  void initState() {
    super.initState();
    _selectedAddress = _presetAddresses[0]['address'];
    _lat = _presetAddresses[0]['lat'];
    _lng = _presetAddresses[0]['lng'];
    
    // Fetch restaurants & latest orders on init
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      auth.fetchProfile(); // Load orders & latest user details
      if (auth.user != null && auth.user!['savedAddresses'] != null && (auth.user!['savedAddresses'] as List).isNotEmpty) {
        setState(() {
          _selectedAddress = auth.user!['savedAddresses'][0];
        });
        _geocodeAddress(_selectedAddress);
      } else {
        _fetchRestaurants();
      }
    });

    _searchController.addListener(() {
      setState(() {
        _searchTerm = _searchController.text;
      });
    });
  }

  @override
  void dispose() {
    _customAddressController.dispose();
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _fetchRestaurants() async {
    setState(() {
      _isLoadingRestaurants = true;
      _restaurantError = null;
    });

    try {
      final response = await ApiService.get('/api/restaurants?lat=$_lat&lng=$_lng');
      final data = json.decode(response.body);
      if (data['success'] == true) {
        setState(() {
          _restaurants = data['restaurants'] ?? [];
        });
      } else {
        throw Exception(data['message'] ?? 'Failed to load restaurants.');
      }
    } catch (e) {
      setState(() {
        _restaurantError = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      setState(() {
        _isLoadingRestaurants = false;
      });
    }
  }

  void _onAddressChanged(String address, double lat, double lng) {
    setState(() {
      _selectedAddress = address;
      _lat = lat;
      _lng = lng;
      _showAddressModal = false;
      _customAddressController.clear();
      _suggestions.clear();
    });
    _fetchRestaurants();
  }

  Future<void> _geocodeAddress(String address) async {
    try {
      final url = Uri.parse('https://nominatim.openstreetmap.org/search?format=json&q=${Uri.encodeComponent(address)}&countrycodes=us&limit=1');
      final res = await http.get(url, headers: {
        'User-Agent': 'SapienceGlobalPoCDeliveryApp/1.0 (adars.gemini.antigravity)'
      });
      final data = json.decode(res.body);
      if (data != null && data.isNotEmpty) {
        setState(() {
          _lat = double.parse(data[0]['lat']);
          _lng = double.parse(data[0]['lon']);
        });
        _fetchRestaurants();
      }
    } catch (e) {
      debugPrint('Geocoding error: $e');
      _fetchRestaurants(); // fallback to current coords
    }
  }

  void _searchAddress(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () async {
      if (query.trim().length < 4) {
        setState(() {
          _suggestions = [];
        });
        return;
      }

      setState(() {
        _isLoadingSuggestions = true;
      });

      try {
        final url = Uri.parse('https://nominatim.openstreetmap.org/search?format=json&q=${Uri.encodeComponent(query)}&countrycodes=us&limit=5');
        final res = await http.get(url, headers: {
          'User-Agent': 'SapienceGlobalPoCDeliveryApp/1.0 (adars.gemini.antigravity)'
        });
        final data = json.decode(res.body);
        setState(() {
          _suggestions = data ?? [];
        });
      } catch (e) {
        debugPrint('OSM suggestions error: $e');
      } finally {
        setState(() {
          _isLoadingSuggestions = false;
        });
      }
    });
  }

  bool _isRestaurantOpen(Map<String, dynamic> rest) {
    final openTime = rest['openTime'] as String?;
    final closeTime = rest['closeTime'] as String?;
    if (openTime == null || closeTime == null) return true;

    final now = DateTime.now();
    final currentTimeMinutes = now.hour * 60 + now.minute;

    try {
      final openParts = openTime.split(':').map(int.parse).toList();
      final closeParts = closeTime.split(':').map(int.parse).toList();
      
      final openMinutes = openParts[0] * 60 + openParts[1];
      final closeMinutes = closeParts[0] * 60 + closeParts[1];

      return currentTimeMinutes >= openMinutes && currentTimeMinutes <= closeMinutes;
    } catch (_) {
      return true;
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final cart = Provider.of<CartProvider>(context);

    // Filter local listings
    final categories = ['All', 'Burgers', 'Sushi', 'Pizza', 'Mexican', 'Indian'];
    final filtered = _restaurants.where((rest) {
      final name = (rest['name'] as String).toLowerCase();
      final cuisine = (rest['cuisine'] as String).toLowerCase();
      final query = _searchTerm.toLowerCase();
      final matchesSearch = name.contains(query) || cuisine.contains(query);
      
      final matchesCat = _selectedCategory == 'All' || cuisine.contains(_selectedCategory.toLowerCase());
      return matchesSearch && matchesCat;
    }).toList();

    // Check for active orders to show Swiggy/Zomato style live footer tracking bar
    final activeOrders = auth.userOrders.where((o) {
      final s = o['deliveryStatus'];
      return s != 'delivered' && s != 'cancelled' && s != 'failed';
    }).toList();
    final hasActiveOrder = activeOrders.isNotEmpty;
    final activeOrder = hasActiveOrder ? activeOrders.first : null;

    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(
        backgroundColor: BrandColors.background,
        elevation: 0,
        centerTitle: false,
        title: InkWell(
          onTap: () => setState(() => _showAddressModal = true),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Text('DELIVER TO', style: TextStyle(fontSize: 10, color: BrandColors.textMuted, fontWeight: FontWeight.bold, letterSpacing: 1)),
                  SizedBox(width: 4),
                  Icon(Icons.keyboard_arrow_down, size: 12, color: BrandColors.cyan),
                ],
              ),
              const SizedBox(height: 2),
              Text(
                _selectedAddress,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_pin, color: BrandColors.cyan, size: 28),
            onPressed: () => _scaffoldKey.currentState?.openDrawer(),
          ),
        ],
      ),
      drawer: _buildProfileDrawer(context, auth),
      body: Stack(
        children: [
          RefreshIndicator(
            onRefresh: _fetchRestaurants,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 160), // bottom padding so active order popup / view cart doesn't cover items
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [


                  // Search input bar
                  GlassContainer(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    child: TextField(
                      controller: _searchController,
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                      decoration: const InputDecoration(
                        icon: Icon(Icons.search, color: BrandColors.cyan, size: 20),
                        hintText: 'Search cuisines, burgers, sushi...',
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        contentPadding: EdgeInsets.zero,
                        filled: false,
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Categories Horizontal Selector
                  Text('Categories', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 12),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: categories.map((cat) {
                        final isSelected = _selectedCategory == cat;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: InkWell(
                            onTap: () => setState(() => _selectedCategory = cat),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                              decoration: BoxDecoration(
                                color: isSelected ? BrandColors.cyan : BrandColors.card,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: isSelected ? BrandColors.cyan : BrandColors.border),
                              ),
                              child: Text(
                                cat,
                                style: TextStyle(
                                  color: isSelected ? BrandColors.background : Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Nearby Restaurants Header
                  Text('Nearby Restaurants', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 12),

                  if (_isLoadingRestaurants) ...[
                    const SizedBox(height: 40),
                    const Center(child: CircularProgressIndicator(color: BrandColors.cyan)),
                  ] else if (_restaurantError != null) ...[
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 40),
                      child: Center(
                        child: Text(_restaurantError!, style: const TextStyle(color: BrandColors.red, fontSize: 13)),
                      ),
                    ),
                  ] else if (filtered.isEmpty) ...[
                    _buildEmptyState()
                  ] else ...[
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: filtered.length,
                      itemBuilder: (context, idx) {
                        final rest = filtered[idx];
                        final open = _isRestaurantOpen(rest);
                        return _buildRestaurantCard(rest, open);
                      },
                    ),
                  ],
                ],
              ),
            ),
          ),

          // Pulsing active order tracking banner (Swiggy / Zomato style)
          if (hasActiveOrder)
            Positioned(
              bottom: cart.cartItems.isNotEmpty ? 85 : 16,
              left: 16,
              right: 16,
              child: _buildActiveOrderFloatingCard(activeOrder!),
            ),
        ],
      ),
      floatingActionButton: cart.cartItems.isNotEmpty
          ? FloatingActionButton.extended(
              backgroundColor: BrandColors.green,
              icon: const Icon(Icons.shopping_bag, color: BrandColors.background),
              label: Text(
                'View Cart (${cart.cartItems.fold<int>(0, (s, i) => s + (i['quantity'] as int))}) - \$${cart.getGrandTotal().toStringAsFixed(2)}',
                style: const TextStyle(color: BrandColors.background, fontWeight: FontWeight.bold),
              ),
              onPressed: () async {
                await showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  backgroundColor: Colors.transparent,
                  builder: (context) => const CartBottomSheet(),
                );
                // Refresh profile on return to check for new active orders
                if (context.mounted) {
                  Provider.of<AuthProvider>(context, listen: false).fetchProfile();
                }
              },
            )
          : null,
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      bottomSheet: _showAddressModal ? _buildAddressModalBottomSheet() : null,
    );
  }

  Widget _buildRestaurantCard(Map<String, dynamic> rest, bool open) {
    return InkWell(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(builder: (context) => RestaurantMenuScreen(restaurant: rest)),
        ).then((_) {
          setState(() {}); // refresh home state if cart updates
        });
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        child: GlassContainer(
          padding: EdgeInsets.zero,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Banner
              Stack(
                children: [
                  Image.network(
                    rest['banner'] ?? 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
                    height: 150,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(height: 150, color: BrandColors.border),
                  ),
                  if (!open)
                    Positioned.fill(
                      child: Container(
                        color: BrandColors.background.withOpacity(0.8),
                        child: Center(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: BrandColors.red.withOpacity(0.2),
                              border: Border.all(color: BrandColors.red.withOpacity(0.5)),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              'Closed Now (${rest['openTime'] ?? '09:00'} - ${rest['closeTime'] ?? '22:00'})',
                              style: const TextStyle(color: BrandColors.red, fontWeight: FontWeight.bold, fontSize: 11),
                            ),
                          ),
                        ),
                      ),
                    ),
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: BrandColors.background.withOpacity(0.8),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: BrandColors.border),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.star, color: BrandColors.cyan, size: 14),
                          const SizedBox(width: 4),
                          Text('${rest['rating'] ?? '4.5'}', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              // Content
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      rest['name'] ?? '',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      rest['cuisine'] ?? '',
                      style: const TextStyle(fontSize: 12, color: BrandColors.textMuted),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        const Icon(Icons.access_time, color: BrandColors.cyan, size: 14),
                        const SizedBox(width: 4),
                        Text(rest['deliveryTime'] ?? '25-35 min', style: const TextStyle(color: BrandColors.textMuted, fontSize: 11)),
                        const SizedBox(width: 16),
                        const Icon(Icons.location_on_outlined, color: BrandColors.cyan, size: 14),
                        const SizedBox(width: 4),
                        Text(rest['distance'] ?? '1.2 mi', style: const TextStyle(color: BrandColors.textMuted, fontSize: 11)),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Column(
      children: [
        const SizedBox(height: 40),
        Icon(Icons.location_off, size: 48, color: BrandColors.cyan.withOpacity(0.5)),
        const SizedBox(height: 16),
        const Text(
          'Outside Our Service Range',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
        ),
        const SizedBox(height: 8),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 24),
          child: Text(
            'We don\'t have any partner restaurants serving this address. Please switch to one of the San Francisco test presets (e.g. Oak St) from the top location bar.',
            textAlign: TextAlign.center,
            style: TextStyle(color: BrandColors.textMuted, fontSize: 12),
          ),
        ),
      ],
    );
  }

  Widget _buildErrorState(String err) {
    return Column(
      children: [
        const SizedBox(height: 40),
        const Icon(Icons.cloud_off_rounded, size: 48, color: BrandColors.red),
        const SizedBox(height: 16),
        const Text(
          'Connection failure',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
        ),
        const SizedBox(height: 8),
        Text(
          err,
          textAlign: TextAlign.center,
          style: const TextStyle(color: BrandColors.textMuted, fontSize: 12),
        ),
      ],
    );
  }

  Widget _buildAddressModalBottomSheet() {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    return Container(
      color: BrandColors.background,
      height: 420,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('SELECT DELIVERY ADDRESS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: BrandColors.cyan, letterSpacing: 1)),
              IconButton(
                icon: const Icon(Icons.close, color: BrandColors.textMuted),
                onPressed: () => setState(() => _showAddressModal = false),
              ),
            ],
          ),
          const Divider(color: BrandColors.border),
          const SizedBox(height: 10),

          // Search Field
          TextField(
            controller: _customAddressController,
            onChanged: _searchAddress,
            decoration: InputDecoration(
              labelText: 'Search custom address...',
              prefixIcon: const Icon(Icons.search, color: BrandColors.textMuted),
              suffix: _isLoadingSuggestions
                  ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 1.5, color: BrandColors.cyan))
                  : null,
            ),
          ),
          const SizedBox(height: 12),

          // Autocomplete suggestions / list
          Expanded(
            child: _suggestions.isNotEmpty
                ? ListView.builder(
                    itemCount: _suggestions.length,
                    itemBuilder: (context, idx) {
                      final item = _suggestions[idx];
                      return ListTile(
                        leading: const Icon(Icons.location_on, color: BrandColors.textMuted, size: 18),
                        title: Text(item['display_name'] ?? '', maxLines: 2, style: const TextStyle(fontSize: 12, color: Colors.white)),
                        onTap: () {
                          final lat = double.parse(item['lat']);
                          final lng = double.parse(item['lon']);
                          _onAddressChanged(item['display_name'], lat, lng);
                        },
                      );
                    },
                  )
                : ListView(
                    children: [
                      // Saved Addresses
                      if (auth.user != null && auth.user!['savedAddresses'] != null && (auth.user!['savedAddresses'] as List).isNotEmpty) ...[
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 4),
                          child: Text('SAVED ADDRESSES', style: TextStyle(fontSize: 10, color: BrandColors.cyan, fontWeight: FontWeight.bold)),
                        ),
                        ...(auth.user!['savedAddresses'] as List).map((addr) {
                          return ListTile(
                            leading: const Icon(Icons.home_outlined, color: BrandColors.cyan, size: 18),
                            title: Text(addr, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: Colors.white)),
                            onTap: () {
                              setState(() {
                                _selectedAddress = addr;
                                _showAddressModal = false;
                              });
                              _geocodeAddress(addr);
                            },
                          );
                        }),
                        const SizedBox(height: 10),
                      ],

                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 4),
                        child: Text('PRESET TEST ADDRESSES', style: TextStyle(fontSize: 10, color: BrandColors.textMuted, fontWeight: FontWeight.bold)),
                      ),
                      ..._presetAddresses.map((preset) {
                        return ListTile(
                          leading: const Icon(Icons.location_city, color: BrandColors.textMuted, size: 18),
                          title: Text(preset['label'], style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                          subtitle: Text(preset['address'], maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11, color: BrandColors.textMuted)),
                          onTap: () => _onAddressChanged(preset['address'], preset['lat'], preset['lng']),
                        );
                      }),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileDrawer(BuildContext context, AuthProvider auth) {
    return Drawer(
      child: Container(
        color: BrandColors.background,
        child: Column(
          children: [
            UserAccountsDrawerHeader(
              decoration: const BoxDecoration(color: BrandColors.card),
              currentAccountPicture: const CircleAvatar(
                backgroundColor: BrandColors.cyan,
                child: Icon(Icons.person, color: BrandColors.background, size: 40),
              ),
              accountName: Text(auth.user?['name'] ?? 'Guest User', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
              accountEmail: Text(auth.user?['email'] ?? 'Sign in to order food', style: const TextStyle(color: BrandColors.textMuted)),
            ),
            
            // Dynamic Portal Switchers
            if (auth.user != null && (auth.user!['role'] == 'merchant' || auth.user!['role'] == 'admin')) ...[
              ListTile(
                leading: const Icon(Icons.storefront, color: BrandColors.cyan),
                title: const Text('Go to Merchant Portal', style: TextStyle(color: Colors.white)),
                onTap: () {
                  Navigator.of(context).pop();
                  Navigator.of(context).pushReplacementNamed('/merchant');
                },
              ),
            ],
            if (auth.user != null && auth.user!['role'] == 'admin') ...[
              ListTile(
                leading: const Icon(Icons.admin_panel_settings, color: BrandColors.blue),
                title: const Text('Go to Admin Dashboard', style: TextStyle(color: Colors.white)),
                onTap: () {
                  Navigator.of(context).pop();
                  Navigator.of(context).pushReplacementNamed('/admin');
                },
              ),
            ],
            const Divider(color: BrandColors.border),

            // Saved address and order history editor trigger
            if (auth.user != null) ...[
              ListTile(
                leading: const Icon(Icons.history, color: BrandColors.cyan),
                title: const Text('Order History', style: TextStyle(color: Colors.white)),
                onTap: () {
                  Navigator.of(context).pop();
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (context) => const OrderHistoryScreen()),
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.location_on, color: BrandColors.textMuted),
                title: const Text('Manage Addresses', style: TextStyle(color: Colors.white)),
                onTap: () {
                  Navigator.of(context).pop();
                  _showSavedAddressesDialog(context, auth);
                },
              ),
            ],

            const Spacer(),
            ListTile(
              leading: const Icon(Icons.logout, color: BrandColors.red),
              title: const Text('Logout', style: TextStyle(color: BrandColors.red)),
              onTap: () async {
                await auth.logout();
                if (context.mounted) {
                  Navigator.of(context).pop();
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showSavedAddressesDialog(BuildContext context, AuthProvider auth) {
    final newAddrController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: BrandColors.card,
              title: const Text('Manage Saved Addresses', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
              content: SizedBox(
                width: double.maxFinite,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: newAddrController,
                      decoration: const InputDecoration(
                        labelText: 'Add New Address...',
                        suffixIcon: Icon(Icons.add, color: BrandColors.cyan),
                      ),
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: () async {
                        if (newAddrController.text.trim().isEmpty) return;
                        final ok = await auth.addAddress(newAddrController.text.trim());
                        if (ok) {
                          newAddrController.clear();
                          setDialogState(() {});
                        }
                      },
                      style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 10)),
                      child: const Text('ADD ADDRESS'),
                    ),
                    const SizedBox(height: 16),
                    const Divider(color: BrandColors.border),
                    const SizedBox(height: 8),
                    Flexible(
                      child: auth.user?['savedAddresses'] == null || (auth.user!['savedAddresses'] as List).isEmpty
                          ? const Text('No saved addresses yet.', style: TextStyle(color: BrandColors.textMuted, fontSize: 12))
                          : ListView.builder(
                              shrinkWrap: true,
                              itemCount: (auth.user!['savedAddresses'] as List).length,
                              itemBuilder: (context, idx) {
                                final addr = auth.user!['savedAddresses'][idx];
                                return ListTile(
                                  contentPadding: EdgeInsets.zero,
                                  title: Text(addr, style: const TextStyle(fontSize: 12, color: Colors.white)),
                                  trailing: IconButton(
                                    icon: const Icon(Icons.delete, color: BrandColors.red, size: 18),
                                    onPressed: () async {
                                      final ok = await auth.deleteAddress(idx);
                                      if (ok) {
                                        setDialogState(() {});
                                      }
                                    },
                                  ),
                                );
                              },
                            ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Close', style: TextStyle(color: BrandColors.cyan)),
                )
              ],
            );
          },
        );
      },
    );
  }

  Widget _buildActiveOrderFloatingCard(Map<String, dynamic> order) {
    final orderId = order['_id'] ?? order['id'] ?? '';
    final status = order['deliveryStatus'] ?? 'pending';
    final restaurantName = order['restaurantName'] ?? 'Restaurant';
    
    // Status descriptions
    String statusDesc = 'Preparing your order...';
    if (status == 'processing') statusDesc = 'Dispatching courier...';
    if (status == 'driver_assigned') statusDesc = 'Courier en route to restaurant...';
    if (status == 'picked_up') statusDesc = 'Out for delivery!';
    
    return InkWell(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => OrderTrackingScreen(orderId: orderId),
          ),
        ).then((_) {
          // Refresh profile on return to check for status updates
          Provider.of<AuthProvider>(context, listen: false).fetchProfile();
        });
      },
      child: GlassContainer(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            // Pulsing dot indicator
            Container(
              width: 10,
              height: 10,
              decoration: const BoxDecoration(
                color: BrandColors.green,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(color: BrandColors.green, blurRadius: 8, spreadRadius: 2),
                ],
              ),
            ),
            const SizedBox(width: 12),
            const Icon(Icons.delivery_dining, color: BrandColors.cyan, size: 28),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    restaurantName,
                    style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 13),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    statusDesc,
                    style: const TextStyle(color: BrandColors.textMuted, fontSize: 11),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const Text(
              'TRACK',
              style: TextStyle(color: BrandColors.cyan, fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 0.5),
            ),
            const SizedBox(width: 4),
            const Icon(Icons.arrow_forward_ios, color: BrandColors.cyan, size: 12),
          ],
        ),
      ),
    );
  }
}
