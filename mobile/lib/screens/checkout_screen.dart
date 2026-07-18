import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'dart:convert';
import 'dart:async';
import 'package:http/http.dart' as http;
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../services/api_service.dart';
import '../theme.dart';
import '../widgets/glass_container.dart';
import 'order_tracking_screen.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();

  // Input states
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _notesController = TextEditingController();
  final _couponController = TextEditingController();

  String _paymentMethod = 'credit_card';
  String _scheduleType = 'now'; // 'now' | 'later'
  DateTime? _scheduledDateTime;
  String? _selectedDeliveryAddress;
  double? _addressLat;
  double? _addressLng;

  @override
  void initState() {
    super.initState();
    // Prefill user details if logged in
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final cart = Provider.of<CartProvider>(context, listen: false);

      if (auth.user != null) {
        _nameController.text = auth.user!['name'] ?? '';
        _phoneController.text = auth.user!['phone'] ?? '';
        auth.fetchProfile();
      }

      // Calculate minimum time for scheduled (now + 45 min)
      _scheduledDateTime = DateTime.now().add(const Duration(minutes: 45));

      // Trigger shipping quote fetch
      // We will look up the dropoff address: if user has a custom address, use it. Otherwise, use primary.
      final primaryAddrRaw = auth.user != null && auth.user!['savedAddresses'] != null && (auth.user!['savedAddresses'] as List).isNotEmpty
          ? auth.user!['savedAddresses'][0]
          : '456 Oak St, San Francisco, CA 94107'; // Fallback
      final primaryAddr = primaryAddrRaw is Map ? primaryAddrRaw['address'] : primaryAddrRaw.toString();
      final primaryLat = primaryAddrRaw is Map ? (primaryAddrRaw['lat'] as num?)?.toDouble() : null;
      final primaryLng = primaryAddrRaw is Map ? (primaryAddrRaw['lng'] as num?)?.toDouble() : null;
      setState(() {
        _selectedDeliveryAddress = primaryAddr;
        _addressLat = primaryLat;
        _addressLng = primaryLng;
      });
      cart.fetchQuote(_selectedDeliveryAddress!, lat: _addressLat, lng: _addressLng);
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _notesController.dispose();
    _couponController.dispose();
    super.dispose();
  }

  Future<void> _selectDateTime() async {
    final now = DateTime.now();
    final initialDate = now.add(const Duration(minutes: 45));

    final date = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: now,
      lastDate: now.add(const Duration(days: 7)),
      builder: (context, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: const ColorScheme.dark(
              primary: BrandColors.cyan,
              surface: BrandColors.card,
            ),
          ),
          child: child!,
        );
      },
    );

    if (date == null) return;

    if (!context.mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initialDate),
    );

    if (time == null) return;

    final selected = DateTime(date.year, date.month, date.day, time.hour, time.minute);
    if (selected.isBefore(now.add(const Duration(minutes: 40)))) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Scheduled delivery must be at least 45 minutes in the future.')),
        );
      }
      return;
    }

    setState(() {
      _scheduledDateTime = selected;
    });
    if (mounted) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final primaryAddrRaw = auth.user != null && auth.user!['savedAddresses'] != null && (auth.user!['savedAddresses'] as List).isNotEmpty
          ? auth.user!['savedAddresses'][0]
          : '456 Oak St, San Francisco, CA 94107';
      final primaryAddr = primaryAddrRaw is Map ? (primaryAddrRaw['address'] ?? primaryAddrRaw.toString()) : primaryAddrRaw.toString();
      Provider.of<CartProvider>(context, listen: false).fetchQuote(primaryAddr, scheduledTime: selected, lat: _addressLat, lng: _addressLng);
    }
  }

  Future<void> _submitOrder() async {
    if (!_formKey.currentState!.validate()) return;

    final cart = Provider.of<CartProvider>(context, listen: false);

    final address = _selectedDeliveryAddress ?? '456 Oak St, San Francisco, CA 94107';

    String? paymentIntentId;

    if (_paymentMethod == 'credit_card') {
      try {
        final paymentIntentPayload = cart.buildCheckoutPayload(
          dropoffAddress: address,
          scheduledTime: _scheduleType == 'later' ? _scheduledDateTime : null,
        );
        final intentRes = await ApiService.post('/api/payments/create-intent', {
          ...paymentIntentPayload,
          'currency': 'usd',
        });

        final intentData = json.decode(intentRes.body);

        paymentIntentId = intentData['paymentIntentId'] ?? intentData['data']?['paymentIntentId'];
        final clientSecret = intentData['clientSecret'] ?? intentData['data']?['clientSecret'];

        if (clientSecret == null) throw Exception('Failed to create payment intent');

        await Stripe.instance.initPaymentSheet(
          paymentSheetParameters: SetupPaymentSheetParameters(
            paymentIntentClientSecret: clientSecret,
            merchantDisplayName: 'DaaS Delivery',
          ),
        );

        await Stripe.instance.presentPaymentSheet();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Payment failed: $e'), backgroundColor: BrandColors.red));
        }
        return;
      }
    }

    // Call submit order on Provider
    final response = await cart.submitOrder(
      customerName: _nameController.text.trim(),
      customerPhone: _phoneController.text.trim(),
      dropoffAddress: address,
      paymentMethod: _paymentMethod,
      scheduledTime: _scheduleType == 'later' ? _scheduledDateTime : null,
      courierNotes: _notesController.text.trim().isNotEmpty ? _notesController.text.trim() : null,
      stripePaymentIntentId: paymentIntentId,
    );

    if (response != null && response['success'] == true) {
      final order = response['order'];
      final orderId = order['_id'] ?? order['id'];

      // If Stripe Redirect, open a mock dialog mimicking checkout
      if (response['paymentUrl'] != null) {
        if (!context.mounted) return;
        _showMockStripePaymentSheet(orderId);
      } else {
        // Direct cash order
        if (!context.mounted) return;
        Provider.of<AuthProvider>(context, listen: false).fetchProfile();
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => OrderTrackingScreen(orderId: orderId)),
        );
      }
    }
  }

  void _showAddressSelectionBottomSheet(BuildContext context, AuthProvider auth) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: BrandColors.card,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        final newAddrController = TextEditingController();
        List<dynamic> localSuggestions = [];
        bool localIsLoading = false;
        Timer? localDebounce;

        final addresses = auth.user != null && auth.user!['savedAddresses'] != null
            ? (auth.user!['savedAddresses'] as List)
            : [];

        return StatefulBuilder(
          builder: (context, setModalState) {
            void searchOsm(String query) {
              if (localDebounce?.isActive ?? false) localDebounce!.cancel();
              if (query.length < 3) {
                setModalState(() {
                  localSuggestions = [];
                });
                return;
              }
              localDebounce = Timer(const Duration(milliseconds: 600), () async {
                setModalState(() => localIsLoading = true);
                try {
                  final url = Uri.parse('https://nominatim.openstreetmap.org/search?format=json&q=${Uri.encodeComponent(query)}&countrycodes=us&limit=5');
                  final res = await http.get(url, headers: {'User-Agent': 'SapienceGlobalPoC/1.0'});
                  final data = json.decode(res.body);
                  setModalState(() {
                    localSuggestions = data ?? [];
                  });
                } catch (_) {} finally {
                  setModalState(() => localIsLoading = false);
                }
              });
            }

            return Padding(
              padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom + 20, left: 20, right: 20, top: 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Select Delivery Address', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  TextField(
                    controller: newAddrController,
                    onChanged: searchOsm,
                    decoration: InputDecoration(
                      labelText: 'Search new address...',
                      suffixIcon: localIsLoading
                          ? const Padding(padding: EdgeInsets.all(12), child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: BrandColors.cyan)))
                          : const Icon(Icons.search, color: BrandColors.cyan),
                    ),
                  ),
                  if (localSuggestions.isNotEmpty)
                    Container(
                      constraints: const BoxConstraints(maxHeight: 150),
                      margin: const EdgeInsets.only(top: 8),
                      child: ListView.builder(
                        shrinkWrap: true,
                        itemCount: localSuggestions.length,
                        itemBuilder: (ctx, idx) {
                          final item = localSuggestions[idx];
                          return ListTile(
                            dense: true,
                            leading: const Icon(Icons.location_pin, color: BrandColors.cyan, size: 16),
                            title: Text(item['display_name'] ?? '', maxLines: 2, style: const TextStyle(fontSize: 11, color: Colors.white)),
                            onTap: () {
                              final addrString = item['display_name'];
                              final lat = double.tryParse(item['lat']?.toString() ?? '');
                              final lng = double.tryParse(item['lon']?.toString() ?? '');
                              setState(() {
                                _selectedDeliveryAddress = addrString;
                                _addressLat = lat;
                                _addressLng = lng;
                              });
                              Provider.of<CartProvider>(context, listen: false).fetchQuote(addrString, lat: lat, lng: lng);
                              Navigator.pop(context);
                            },
                          );
                        },
                      ),
                    ),
                  const SizedBox(height: 16),
                  const Divider(color: BrandColors.border),
                  const SizedBox(height: 8),
                  if (addresses.isEmpty)
                    const Padding(
                      padding: EdgeInsets.only(bottom: 20),
                      child: Text('No saved addresses yet.', style: TextStyle(color: BrandColors.textMuted, fontSize: 12)),
                    )
                  else
                    ...addresses.map((addrRaw) {
                      if (addrRaw is String) return const SizedBox.shrink();
                      final addr = addrRaw as Map<String, dynamic>;
                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: const Icon(Icons.home, color: BrandColors.cyan),
                        title: Text(addr['label'] ?? 'Saved', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                        subtitle: Text(addr['address'] ?? '', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: BrandColors.textMuted)),
                        onTap: () {
                          final addrString = addr['address'];
                          final lat = (addr['lat'] as num?)?.toDouble();
                          final lng = (addr['lng'] as num?)?.toDouble();
                          setState(() {
                            _selectedDeliveryAddress = addrString;
                            _addressLat = lat;
                            _addressLng = lng;
                          });
                          Provider.of<CartProvider>(context, listen: false).fetchQuote(addrString, lat: lat, lng: lng);
                          Navigator.pop(context);
                        },
                      );
                    }).toList(),
                    const SizedBox(height: 20),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showMockStripePaymentSheet(String orderId) {
    showModalBottomSheet(
      context: context,
      isDismissible: false,
      enableDrag: false,
      backgroundColor: BrandColors.card,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(30))),
      builder: (context) {
        bool processing = false;
        return StatefulBuilder(
          builder: (context, setStateSheet) {
            return Container(
              padding: const EdgeInsets.all(24),
              height: 320,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.payment, color: BrandColors.cyan, size: 24),
                      SizedBox(width: 8),
                      Text('STRIPE SECURE CHECKOUT', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1.2, color: Colors.white)),
                    ],
                  ),
                  const Divider(color: BrandColors.border, height: 24),
                  const SizedBox(height: 12),
                  const Text('Confirm Payment simulation', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white)),
                  const SizedBox(height: 8),
                  const Text(
                    'This acts as a secure external Stripe session card frame. Confirming this mimics a successful card swipe captured callback.',
                    style: TextStyle(color: BrandColors.textMuted, fontSize: 12),
                  ),
                  const Spacer(),
                  ElevatedButton(
                    onPressed: processing ? null : () async {
                      setStateSheet(() => processing = true);

                      try {
                        // Trigger payment confirmation webhook/API mock
                        await ApiService.post('/api/orders/$orderId/confirm-payment', {});
                        if (context.mounted) {
                          Provider.of<AuthProvider>(context, listen: false).fetchProfile();
                          Navigator.of(context).pop(); // dismiss sheet
                          Navigator.of(context).pushReplacement(
                            MaterialPageRoute(builder: (context) => OrderTrackingScreen(orderId: orderId)),
                          );
                        }
                      } catch (err) {
                        setStateSheet(() => processing = false);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Payment captures failed: $err')),
                          );
                        }
                      }
                    },
                    style: ElevatedButton.styleFrom(backgroundColor: BrandColors.green),
                    child: processing
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: BrandColors.background))
                        : const Text('AUTHORIZE & PAY NOW'),
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
    final auth = Provider.of<AuthProvider>(context);
    final cart = Provider.of<CartProvider>(context);

    final address = _selectedDeliveryAddress ?? '456 Oak St, San Francisco, CA 94107';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Checkout Details'),
        backgroundColor: BrandColors.background,
        elevation: 0,
      ),
      body: cart.cartItems.isEmpty
          ? const Center(child: Text('Your cart is empty', style: TextStyle(color: BrandColors.textMuted)))
          : Form(
              key: _formKey,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Error block
                    if (cart.checkoutError != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: BrandColors.red.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: BrandColors.red.withOpacity(0.3)),
                        ),
                        child: Text(
                          cart.checkoutError!,
                          style: const TextStyle(color: BrandColors.red, fontSize: 12),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Cart Overview
                    GlassContainer(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Order Summary', style: Theme.of(context).textTheme.titleMedium),
                          const SizedBox(height: 12),
                          ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: cart.cartItems.length,
                            itemBuilder: (context, idx) {
                              final item = cart.cartItems[idx];
                              return Padding(
                                padding: const EdgeInsets.symmetric(vertical: 6),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text('${item['quantity']}x  ${item['name']}', style: const TextStyle(fontSize: 13, color: Colors.white)),
                                    Text('\$${(item['price'] * item['quantity']).toStringAsFixed(2)}', style: const TextStyle(fontSize: 13, color: BrandColors.textMuted)),
                                  ],
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Recipient details
                    GlassContainer(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(cart.orderType == 'delivery' ? 'Delivery Recipient' : 'Pickup Details', style: Theme.of(context).textTheme.titleMedium),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _nameController,
                            decoration: const InputDecoration(labelText: 'Recipient Name'),
                            validator: (val) => val == null || val.trim().isEmpty ? 'Enter recipient name' : null,
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _phoneController,
                            keyboardType: TextInputType.phone,
                            decoration: const InputDecoration(labelText: 'Recipient Phone'),
                            validator: (val) => val == null || val.trim().isEmpty ? 'Enter phone number' : null,
                          ),
                          const SizedBox(height: 16),
                          if (cart.orderType == 'delivery')
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(Icons.location_on, color: BrandColors.cyan, size: 20),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('DELIVERY ADDRESS', style: TextStyle(fontSize: 10, color: BrandColors.textMuted, fontWeight: FontWeight.bold)),
                                      const SizedBox(height: 2),
                                      Text(address, style: const TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.w600)),
                                    ],
                                  ),
                                ),
                                TextButton(
                                  onPressed: () {
                                    _showAddressSelectionBottomSheet(context, auth);
                                  },
                                  child: const Text('Change', style: TextStyle(color: BrandColors.cyan, fontSize: 12)),
                                ),
                              ],
                            ),
                        ],
                      ),
                    ),
                    // Show error banner if quote failed
                    if (cart.orderType == 'delivery' && cart.checkoutError != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.red.withOpacity(0.12),
                            border: Border.all(color: Colors.red.withOpacity(0.4)),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.warning_amber_rounded, color: Colors.red, size: 16),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  '${cart.checkoutError!} Please change address or switch to Pickup.',
                                  style: const TextStyle(color: Colors.red, fontSize: 12),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    const SizedBox(height: 16),

                    // Order Type
                    GlassContainer(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Order Type', style: Theme.of(context).textTheme.titleMedium),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: RadioListTile<String>(
                                  title: const Text('Delivery', style: TextStyle(fontSize: 12, color: Colors.white)),
                                  value: 'delivery',
                                  groupValue: cart.orderType,
                                  activeColor: BrandColors.cyan,
                                  contentPadding: EdgeInsets.zero,
                                  onChanged: (val) {
                                    if (val != null) {
                                      cart.setOrderType(val);
                                      cart.fetchQuote(_selectedDeliveryAddress!, scheduledTime: _scheduleType == 'later' ? _scheduledDateTime : null, lat: _addressLat, lng: _addressLng);
                                    }
                                  },
                                ),
                              ),
                              Expanded(
                                child: RadioListTile<String>(
                                  title: const Text('Pickup', style: TextStyle(fontSize: 12, color: Colors.white)),
                                  value: 'pickup',
                                  groupValue: cart.orderType,
                                  activeColor: BrandColors.cyan,
                                  contentPadding: EdgeInsets.zero,
                                  onChanged: (val) {
                                    if (val != null) {
                                      cart.setOrderType(val);
                                      cart.fetchQuote(_selectedDeliveryAddress!, scheduledTime: _scheduleType == 'later' ? _scheduledDateTime : null, lat: _addressLat, lng: _addressLng);
                                    }
                                  },
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Delivery scheduling
                    GlassContainer(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Delivery Schedule', style: Theme.of(context).textTheme.titleMedium),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: RadioListTile<String>(
                                  title: const Text('Deliver Now', style: TextStyle(fontSize: 12, color: Colors.white)),
                                  value: 'now',
                                  groupValue: _scheduleType,
                                  activeColor: BrandColors.cyan,
                                  contentPadding: EdgeInsets.zero,
                                  onChanged: (val) {
                                    if (val != null) {
                                      setState(() => _scheduleType = val);
                                      final auth = Provider.of<AuthProvider>(context, listen: false);
                                      Provider.of<CartProvider>(context, listen: false).fetchQuote(_selectedDeliveryAddress!, scheduledTime: null, lat: _addressLat, lng: _addressLng);
                                    }
                                  },
                                ),
                              ),
                              Expanded(
                                child: RadioListTile<String>(
                                  title: const Text('Schedule Later', style: TextStyle(fontSize: 12, color: Colors.white)),
                                  value: 'later',
                                  groupValue: _scheduleType,
                                  activeColor: BrandColors.cyan,
                                  contentPadding: EdgeInsets.zero,
                                  onChanged: (val) {
                                    if (val != null) {
                                      setState(() => _scheduleType = val);
                                      final auth = Provider.of<AuthProvider>(context, listen: false);
                                      Provider.of<CartProvider>(context, listen: false).fetchQuote(_selectedDeliveryAddress!, scheduledTime: _scheduledDateTime, lat: _addressLat, lng: _addressLng);
                                    }
                                  },
                                ),
                              ),
                            ],
                          ),
                          if (_scheduleType == 'later') ...[
                            const SizedBox(height: 12),
                            InkWell(
                              onTap: _selectDateTime,
                              child: Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  border: Border.all(color: BrandColors.border),
                                  borderRadius: BorderRadius.circular(16),
                                  color: BrandColors.background.withOpacity(0.4),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      DateFormat('EEE, MMM d, yyyy  h:mm a').format(_scheduledDateTime!),
                                      style: const TextStyle(fontSize: 13, color: Colors.white, fontWeight: FontWeight.bold),
                                    ),
                                    const Icon(Icons.calendar_today, color: BrandColors.cyan, size: 18),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Tip Selection
                    GlassContainer(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Add a Tip', style: Theme.of(context).textTheme.titleMedium),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [0.0, 2.0, 3.0, 5.0, 8.0].map((amt) {
                              final isSelected = cart.tipAmount == amt;
                              return ChoiceChip(
                                label: Text(amt == 0 ? 'No Tip' : '\$${amt.toInt()}'),
                                selected: isSelected,
                                selectedColor: BrandColors.green.withOpacity(0.2),
                                backgroundColor: BrandColors.background.withOpacity(0.4),
                                labelStyle: TextStyle(color: isSelected ? BrandColors.green : Colors.white),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  side: BorderSide(color: isSelected ? BrandColors.green : BrandColors.border),
                                ),
                                onSelected: (_) => cart.setTipAmount(amt),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Coupon & Loyalty
                    GlassContainer(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Coupon Code', style: Theme.of(context).textTheme.titleMedium),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: _couponController,
                                  decoration: const InputDecoration(labelText: 'Enter coupon code'),
                                  textCapitalization: TextCapitalization.characters,
                                  enabled: !cart.isApplyingCoupon && cart.couponCode == null,
                                ),
                              ),
                              const SizedBox(width: 8),
                              if (cart.couponCode == null)
                                ElevatedButton(
                                  onPressed: cart.isApplyingCoupon ? null : () {
                                    cart.applyCoupon(_couponController.text);
                                  },
                                  style: ElevatedButton.styleFrom(backgroundColor: BrandColors.cyan, padding: const EdgeInsets.symmetric(horizontal: 16)),
                                  child: cart.isApplyingCoupon
                                      ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                      : const Text('Apply', style: TextStyle(color: Colors.black)),
                                )
                              else
                                TextButton(
                                  onPressed: () {
                                    _couponController.clear();
                                    cart.clearCoupon();
                                  },
                                  child: const Text('Remove', style: TextStyle(color: BrandColors.red)),
                                ),
                            ],
                          ),
                          if (auth.user != null && auth.user!['loyaltyPoints'] != null && auth.user!['loyaltyPoints'] > 0) ...[
                            const SizedBox(height: 16),
                            const Divider(color: BrandColors.border),
                            SwitchListTile(
                              title: const Text('Use Loyalty Points', style: TextStyle(color: Colors.white, fontSize: 13)),
                              subtitle: Text('Balance: ${auth.user!['loyaltyPoints']} pts (\$${(auth.user!['loyaltyPoints'] / 100).toStringAsFixed(2)})', style: const TextStyle(color: BrandColors.cyan, fontSize: 11)),
                              value: cart.useLoyaltyPoints,
                              activeColor: BrandColors.cyan,
                              contentPadding: EdgeInsets.zero,
                              onChanged: (val) {
                                cart.toggleLoyaltyPoints(val, auth.user!['loyaltyPoints']);
                              },
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Instructions & Payments
                    GlassContainer(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Instructions & Payments', style: Theme.of(context).textTheme.titleMedium),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _notesController,
                            maxLines: 2,
                            decoration: const InputDecoration(labelText: 'Courier Notes (e.g. Leave at gate)'),
                          ),
                          const SizedBox(height: 16),
                          DropdownButtonFormField<String>(
                            initialValue: _paymentMethod,
                            decoration: const InputDecoration(labelText: 'Payment Method'),
                            items: const [
                              DropdownMenuItem(value: 'credit_card', child: Text('Credit Card (Stripe)')),
                              DropdownMenuItem(value: 'cash', child: Text('Cash on Delivery')),
                            ],
                            onChanged: (val) {
                              if (val != null) {
                                setState(() {
                                  _paymentMethod = val;
                                });
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Financial calculations
                    GlassContainer(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Receipt Details', style: Theme.of(context).textTheme.titleMedium),
                          const SizedBox(height: 16),
                          _buildReceiptRow('Subtotal', '\$${cart.getCartSubtotal().toStringAsFixed(2)}'),
                          _buildReceiptRow('Tax', '\$${cart.getTax().toStringAsFixed(2)}'),
                          _buildReceiptRow('Platform Fee', '\$${cart.getPlatformFee().toStringAsFixed(2)}'),
                          _buildReceiptRow('Service Fee', '\$${cart.getServiceFee().toStringAsFixed(2)}'),

                          // Shipping charging block
                          if (cart.orderType == 'delivery') ...[
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 6),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Delivery Fee', style: TextStyle(color: BrandColors.textMuted, fontSize: 13)),
                                  cart.isLoadingQuote
                                      ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 1.5, color: BrandColors.cyan))
                                      : Text('\$${cart.getDeliveryFee().toStringAsFixed(2)}', style: const TextStyle(color: Colors.white, fontSize: 13)),
                                ],
                              ),
                            ),
                            if (cart.deliveryQuote != null)
                              Padding(
                                padding: const EdgeInsets.symmetric(vertical: 6),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('Delivery ETA', style: TextStyle(color: BrandColors.textMuted, fontSize: 13)),
                                    Text(
                                      cart.deliveryQuote!['deliveryTime'] != null
                                        ? DateFormat('h:mm a').format(DateTime.parse(cart.deliveryQuote!['deliveryTime']).toLocal())
                                        : (cart.deliveryQuote!['fallback'] == true ? 'At checkout' : 'Calculating'),
                                      style: const TextStyle(color: Colors.white, fontSize: 13)
                                    ),
                                  ],
                                ),
                              ),
                          ],

                          if (cart.tipAmount > 0)
                            _buildReceiptRow('Tip', '\$${cart.tipAmount.toStringAsFixed(2)}', color: BrandColors.green),
                          if (cart.couponDiscount > 0)
                            _buildReceiptRow('Coupon Discount', '-\$${cart.couponDiscount.toStringAsFixed(2)}', color: BrandColors.green),
                          if (cart.useLoyaltyPoints && cart.loyaltyDiscountPoints > 0)
                            _buildReceiptRow('Loyalty Points (-${cart.loyaltyDiscountPoints})', '-\$${(cart.loyaltyDiscountPoints / 100).toStringAsFixed(2)}', color: BrandColors.cyan),

                          const Divider(color: BrandColors.border, height: 24),
                          _buildReceiptRow(
                            'Grand Total',
                            '\$${cart.getGrandTotal().toStringAsFixed(2)}',
                            isBold: true,
                            color: BrandColors.cyan,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Submit order trigger button
                    ElevatedButton(
                      onPressed: cart.isSubmittingOrder ||
                        (cart.orderType == 'delivery' && (cart.isLoadingQuote || cart.deliveryQuote == null || cart.checkoutError != null))
                        ? null : _submitOrder,
                      style: ElevatedButton.styleFrom(backgroundColor: BrandColors.green),
                      child: cart.isSubmittingOrder
                          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: BrandColors.background))
                          : const Text('CONFIRM PLACE ORDER'),
                    ),
                    const SizedBox(height: 36),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildReceiptRow(String label, String value, {bool isBold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: isBold ? Colors.white : BrandColors.textMuted, fontSize: 13, fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
          Text(value, style: TextStyle(color: color ?? Colors.white, fontSize: 13, fontWeight: isBold ? FontWeight.w900 : FontWeight.normal)),
        ],
      ),
    );
  }
}
