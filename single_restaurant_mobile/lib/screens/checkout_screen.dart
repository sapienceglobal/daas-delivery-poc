import 'package:country_picker/country_picker.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/checkout_provider.dart';
import 'package:single_restaurant_mobile/providers/loyalty_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/screens/help_support_screen.dart';
import 'package:single_restaurant_mobile/screens/main_screen.dart';
import 'package:single_restaurant_mobile/screens/terms_screen.dart';
import 'package:single_restaurant_mobile/screens/track_order_screen.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';
import 'package:single_restaurant_mobile/widgets/checkout/checkout_bill_details.dart';
import 'package:single_restaurant_mobile/widgets/checkout/checkout_bottom_bar.dart';
import 'package:single_restaurant_mobile/widgets/checkout/checkout_contact_info.dart';
import 'package:single_restaurant_mobile/widgets/checkout/checkout_fulfillment_estimate.dart';
import 'package:single_restaurant_mobile/widgets/checkout/checkout_order_summary.dart';
import 'package:single_restaurant_mobile/widgets/checkout/checkout_payment_methods.dart';
import 'package:single_restaurant_mobile/widgets/checkout/checkout_tipping_section.dart';
import 'package:single_restaurant_mobile/widgets/guest_login_prompt.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  bool _userDetailsInitialized = false;
  bool _isEditingContact = false;
  late TextEditingController _nameController;
  late TextEditingController _phoneController;

  String _selectedCountryCode = '+1';
  String _selectedCountryFlag = '🇺🇸';
  int _phoneMaxLength = 10;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _phoneController = TextEditingController();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _initUserDetailsOnce(CheckoutProvider checkout, AuthProvider auth) {
    if (_userDetailsInitialized) return;
    _userDetailsInitialized = true;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = auth.user;
      checkout.initFromUser(
        name: user?.name,
        email: user?.email,
        phone: user?.phone,
      );

      setState(() {
        _nameController.text = checkout.fullName;

        String p = checkout.phone;
        if (p.startsWith('+1') && p.length > 2) {
          _selectedCountryCode = '+1';
          _selectedCountryFlag = '🇺🇸';
          _phoneMaxLength = 10;
          _phoneController.text = p.substring(2);
        } else if (p.startsWith('+91') && p.length > 3) {
          _selectedCountryCode = '+91';
          _selectedCountryFlag = '🇮🇳';
          _phoneMaxLength = 10;
          _phoneController.text = p.substring(3);
        } else {
          _phoneController.text = p;
        }

        if (checkout.isPhoneMissing) {
          _isEditingContact = true;
        }
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final cart = Provider.of<CartProvider>(context);
    final checkout = Provider.of<CheckoutProvider>(context);
    final auth = Provider.of<AuthProvider>(context);
    final restProv = Provider.of<RestaurantProvider>(context);
    final restaurant = restProv.restaurant ?? cart.restaurant;

    if (auth.user == null) {
      return Scaffold(
        backgroundColor: const Color(0xFFFCF9F2),
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          centerTitle: true,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Color(0xFF7A0B10)),
            onPressed: () => Navigator.pop(context),
          ),
          title: const Text('Checkout', style: TextStyle(color: Colors.black, fontSize: 18, fontWeight: FontWeight.bold)),
        ),
        body: const GuestLoginPrompt(
          icon: Icons.shopping_bag_outlined,
          title: 'Login to Checkout',
          subtitle: 'Create an account to securely save your addresses and payment methods for faster checkout.',
        ),
      );
    }

    _initUserDetailsOnce(checkout, auth);

    final total = checkout.getTotal(cart, restaurant);
    final isCartEmpty = cart.items.isEmpty;
    final canProceed = !isCartEmpty && checkout.couponPaymentError == null && checkout.isContactComplete;

    return Scaffold(
      backgroundColor: const Color(0xFFFCF9F2),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF7A0B10)),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Checkout', style: TextStyle(color: Colors.black, fontSize: 18, fontWeight: FontWeight.bold)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: Center(
              child: GestureDetector(
                onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const HelpSupportScreen()));
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    border: Border.all(color: const Color(0xFF7A0B10)),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    children: const [
                      Icon(Icons.headset_mic_outlined, color: Color(0xFF7A0B10), size: 16),
                      SizedBox(width: 4),
                      Text('Support', style: TextStyle(color: Color(0xFF7A0B10), fontSize: 12, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
            ),
          )
        ],
      ),
      body: Consumer<LoyaltyProvider>(
        builder: (context, loyalty, _) {
          return SingleChildScrollView(
            child: ResponsiveCenter(
              maxWidth: 700,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CheckoutOrderSummary(cart: cart, restaurant: restaurant),
                    const SizedBox(height: 16),
                    CheckoutContactInfo(
                      checkout: checkout,
                      nameController: _nameController,
                      phoneController: _phoneController,
                      selectedCountryCode: _selectedCountryCode,
                      selectedCountryFlag: _selectedCountryFlag,
                      phoneMaxLength: _phoneMaxLength,
                      isEditingContact: _isEditingContact,
                      onToggleEditing: () => setState(() => _isEditingContact = !_isEditingContact),
                      onCountrySelected: (Country country) {
                        setState(() {
                          _selectedCountryCode = '+${country.phoneCode}';
                          _selectedCountryFlag = country.flagEmoji;
                          _phoneMaxLength = country.example.isNotEmpty ? country.example.length : 15;
                          if (_phoneController.text.length > _phoneMaxLength) {
                            _phoneController.text = _phoneController.text.substring(0, _phoneMaxLength);
                          }
                        });
                        checkout.setUserDetails(
                          checkout.fullName,
                          '$_selectedCountryCode${_phoneController.text.trim()}',
                          checkout.email,
                        );
                      },
                    ),
                    const SizedBox(height: 16),
                    CheckoutFulfillmentEstimate(
                      checkout: checkout,
                      onChange: () => Navigator.pop(context),
                    ),
                    const SizedBox(height: 24),
                    const Text('PAYMENT METHOD', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: Colors.black87)),
                    const SizedBox(height: 12),
                    CheckoutPaymentMethods(checkout: checkout, auth: auth),
                    const SizedBox(height: 24),
                    if (restaurant?['enableTips'] != false) ...[
                      const Text('ADD A TIP', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: Colors.black87)),
                      const SizedBox(height: 12),
                      CheckoutTippingSection(checkout: checkout, cart: cart, restaurant: restaurant),
                      const SizedBox(height: 24),
                    ],
                    const Text('BILL DETAILS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: Colors.black87)),
                    const SizedBox(height: 12),
                    CheckoutBillDetails(
                      cart: cart,
                      checkout: checkout,
                      loyalty: loyalty,
                      restaurant: restaurant,
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
          );
        },
      ),
      bottomNavigationBar: CheckoutBottomBar(
        total: total,
        currency: restaurant?['currency'],
        isPlacingOrder: checkout.isPlacingOrder,
        canProceed: canProceed,
        isContactComplete: checkout.isContactComplete,
        onPlaceOrder: () => _handlePlaceOrder(context, cart, checkout, auth, restaurant),
        onTermsTap: () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const TermsScreen()));
        },
      ),
    );
  }

  Future<void> _handlePlaceOrder(
    BuildContext context,
    CartProvider cart,
    CheckoutProvider checkout,
    AuthProvider auth,
    Map<String, dynamic>? restaurant,
  ) async {
    if (checkout.isDelivery && checkout.compiledAddress.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a delivery address in Cart')),
      );
      return;
    }

    try {
      final orderId = await checkout.handlePlaceOrder(context, cart, auth, restaurant);
      if (orderId != null && mounted) {
        context.read<LoyaltyProvider>().fetchHistory(refresh: true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Order placed successfully!')),
        );
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const MainScreen()),
          (route) => false,
        );
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => TrackOrderScreen(orderId: orderId)),
        );
      }
    } catch (e) {
      if (mounted) {
        String msg = e.toString();
        if (msg.contains('canceled') || msg.contains('cancelled')) {
          msg = 'Payment was canceled.';
        } else {
          msg = msg.replaceAll('Exception: ', '');
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg), backgroundColor: Colors.red),
        );
      }
    }
  }
}
