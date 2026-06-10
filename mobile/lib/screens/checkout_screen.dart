import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
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
  
  String _paymentMethod = 'Credit Card';
  String _scheduleType = 'now'; // 'now' | 'later'
  DateTime? _scheduledDateTime;

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
      }
      
      // Calculate minimum time for scheduled (now + 45 min)
      _scheduledDateTime = DateTime.now().add(const Duration(minutes: 45));

      // Trigger shipping quote fetch
      // We will look up the dropoff address: if user has a custom address, use it. Otherwise, use primary.
      final primaryAddr = auth.user != null && auth.user!['savedAddresses'] != null && (auth.user!['savedAddresses'] as List).isNotEmpty
          ? auth.user!['savedAddresses'][0]
          : '456 Oak St, San Francisco, CA 94107'; // Fallback
      cart.fetchQuote(primaryAddr);
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _notesController.dispose();
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
      final primaryAddr = auth.user != null && auth.user!['savedAddresses'] != null && (auth.user!['savedAddresses'] as List).isNotEmpty
          ? auth.user!['savedAddresses'][0]
          : '456 Oak St, San Francisco, CA 94107';
      Provider.of<CartProvider>(context, listen: false).fetchQuote(primaryAddr, scheduledTime: selected);
    }
  }

  Future<void> _submitOrder() async {
    if (!_formKey.currentState!.validate()) return;
    
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final cart = Provider.of<CartProvider>(context, listen: false);

    final address = auth.user != null && auth.user!['savedAddresses'] != null && (auth.user!['savedAddresses'] as List).isNotEmpty
        ? auth.user!['savedAddresses'][0]
        : '456 Oak St, San Francisco, CA 94107';

    // Call submit order on Provider
    final response = await cart.submitOrder(
      customerName: _nameController.text.trim(),
      customerPhone: _phoneController.text.trim(),
      dropoffAddress: address,
      paymentMethod: _paymentMethod,
      scheduledTime: _scheduleType == 'later' ? _scheduledDateTime : null,
      courierNotes: _notesController.text.trim().isNotEmpty ? _notesController.text.trim() : null,
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
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => OrderTrackingScreen(orderId: orderId)),
        );
      }
    }
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

    final address = auth.user != null && auth.user!['savedAddresses'] != null && (auth.user!['savedAddresses'] as List).isNotEmpty
        ? auth.user!['savedAddresses'][0]
        : '456 Oak St, San Francisco, CA 94107';

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
                          Text('Delivery Recipient', style: Theme.of(context).textTheme.titleMedium),
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
                                      final primaryAddr = auth.user != null && auth.user!['savedAddresses'] != null && (auth.user!['savedAddresses'] as List).isNotEmpty
                                          ? auth.user!['savedAddresses'][0]
                                          : '456 Oak St, San Francisco, CA 94107';
                                      Provider.of<CartProvider>(context, listen: false).fetchQuote(primaryAddr, scheduledTime: null);
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
                                      final primaryAddr = auth.user != null && auth.user!['savedAddresses'] != null && (auth.user!['savedAddresses'] as List).isNotEmpty
                                          ? auth.user!['savedAddresses'][0]
                                          : '456 Oak St, San Francisco, CA 94107';
                                      Provider.of<CartProvider>(context, listen: false).fetchQuote(primaryAddr, scheduledTime: _scheduledDateTime);
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
                              DropdownMenuItem(value: 'Credit Card', child: Text('Credit Card (Stripe Mock)')),
                              DropdownMenuItem(value: 'Cash on Delivery', child: Text('Cash on Delivery')),
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
                          _buildReceiptRow('Tax (8.25%)', '\$${cart.getTax().toStringAsFixed(2)}'),
                          _buildReceiptRow('Platform Fee', '\$${cart.getPlatformFee().toStringAsFixed(2)}'),
                          
                          // Shipping charging block
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
                      onPressed: cart.isSubmittingOrder || cart.isLoadingQuote || cart.deliveryQuote == null ? null : _submitOrder,
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
