import 'dart:io' show Platform;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:country_picker/country_picker.dart';
import 'package:just_the_tooltip/just_the_tooltip.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/checkout_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/screens/main_screen.dart';
import 'package:single_restaurant_mobile/screens/track_order_screen.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:single_restaurant_mobile/utils/cart_helper.dart';
import 'package:single_restaurant_mobile/widgets/guest_login_prompt.dart';
import 'package:single_restaurant_mobile/providers/loyalty_provider.dart';
import 'package:single_restaurant_mobile/utils/formatters.dart';
import 'package:flutter/gestures.dart';
import 'package:single_restaurant_mobile/screens/terms_screen.dart';
import 'package:single_restaurant_mobile/screens/help_support_screen.dart';
class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  bool _isSummaryExpanded = true;
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
        
        // Attempt to extract country code if present
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
        
        // Auto-open the contact editing section if phone is missing
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
        backgroundColor: const Color(0xFFFCF9F2), // Light cream background
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

    // Auto-populate contact details from the logged-in user (once)
    _initUserDetailsOnce(checkout, auth);

    return Scaffold(
      backgroundColor: const Color(0xFFFCF9F2), // Light cream background
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
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildOrderSummary(cart, restaurant),
                  const SizedBox(height: 16),
                  _buildContactInfoSection(checkout, auth),
                  const SizedBox(height: 16),
                  _buildFulfillmentEstimate(checkout),
                  const SizedBox(height: 24),
                  const Text('PAYMENT METHOD', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: Colors.black87)),
                  const SizedBox(height: 12),
                  _buildPaymentMethods(checkout, auth),
                  const SizedBox(height: 24),
                  const SizedBox(height: 24),
                  if (restaurant?['enableTips'] != false) ...[
                    const Text('ADD A TIP', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: Colors.black87)),
                    const SizedBox(height: 12),
                    _buildTippingUI(checkout, cart, restaurant),
                    const SizedBox(height: 24),
                  ],
                  // Loyalty coins redeemed via coupon on cart screen only
                  const Text('BILL DETAILS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: Colors.black87)),
                  const SizedBox(height: 12),
                  _buildBillDetails(cart, checkout, loyalty, restaurant),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          );
        },
      ),
      bottomNavigationBar: _buildBottomAction(cart, checkout, auth, restaurant),
    );
  }

  // ── Contact Info Section ─────────────────────────────────────────────────
  Widget _buildContactInfoSection(CheckoutProvider checkout, AuthProvider auth) {
    final hasPhone = checkout.hasValidPhone;
    final hasName = checkout.hasValidName;
    final isComplete = checkout.isContactComplete;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: !isComplete ? const Color(0xFFEF4444).withOpacity(0.4) : Colors.grey.shade200,
          width: !isComplete ? 1.5 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          InkWell(
            onTap: () => setState(() => _isEditingContact = !_isEditingContact),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: isComplete ? const Color(0xFFF0FDF4) : const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      isComplete ? Icons.person_outline : Icons.person_off_outlined,
                      size: 18,
                      color: isComplete ? const Color(0xFF16A34A) : const Color(0xFFEF4444),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'CONTACT DETAILS',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: Colors.black54),
                        ),
                        const SizedBox(height: 3),
                        if (isComplete && !_isEditingContact)
                          Text(
                            '${checkout.fullName} • ${checkout.phone}',
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.black87),
                            overflow: TextOverflow.ellipsis,
                          )
                        else if (!isComplete)
                          const Text(
                            'Phone number required for delivery updates',
                            style: TextStyle(fontSize: 12, color: Color(0xFFEF4444), fontWeight: FontWeight.w500),
                          ),
                      ],
                    ),
                  ),
                  if (isComplete)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: _isEditingContact ? Colors.grey.shade100 : const Color(0xFFF5F0ED),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        _isEditingContact ? 'Done' : 'Edit',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: _isEditingContact ? Colors.grey.shade700 : const Color(0xFF7A0B10),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // Editable Fields (expanded when editing or phone missing)
          if (_isEditingContact || !isComplete) ...[
            Divider(height: 1, color: Colors.grey.shade100),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
              child: Column(
                children: [
                  // Name Field
                  _buildContactField(
                    label: 'Full Name',
                    controller: _nameController,
                    icon: Icons.person_outline,
                    keyboardType: TextInputType.name,
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r"^[a-zA-Z\s\-'.]*")),
                    ],
                    hasError: !hasName,
                    errorText: 'Valid Name is required',
                    onChanged: (val) {
                      checkout.setUserDetails(val, checkout.phone, checkout.email);
                    },
                  ),
                  const SizedBox(height: 12),
                  // Phone Field
                  _buildContactField(
                    label: 'Phone Number',
                    controller: _phoneController,
                    icon: Icons.phone_outlined,
                    keyboardType: TextInputType.phone,
                    prefixWidget: _buildCountryPicker(),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'^[0-9\s\-()]*')), // removed + since it's in the country code now
                      LengthLimitingTextInputFormatter(_phoneMaxLength),
                    ],
                    hasError: !hasPhone,
                    errorText: 'Enter a valid phone number (min 7 digits)',
                    onChanged: (val) {
                      checkout.setUserDetails(checkout.fullName, '$_selectedCountryCode${val.trim()}', checkout.email);
                    },
                  ),
                  const SizedBox(height: 8),
                  // Info text
                  Row(
                    children: [
                      Icon(Icons.info_outline, size: 13, color: Colors.grey.shade400),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'The restaurant and driver will use this number to reach you',
                          style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildContactField({
    required String label,
    required TextEditingController controller,
    required IconData icon,
    required TextInputType keyboardType,
    required bool hasError,
    required String errorText,
    required ValueChanged<String> onChanged,
    List<TextInputFormatter>? inputFormatters,
    Widget? prefixWidget,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: hasError ? const Color(0xFFEF4444) : Colors.grey.shade600,
          ),
        ),
        const SizedBox(height: 5),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFFF9F9F9),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: hasError ? const Color(0xFFEF4444).withOpacity(0.5) : Colors.grey.shade300,
            ),
          ),
          child: TextField(
            controller: controller,
            keyboardType: keyboardType,
            inputFormatters: inputFormatters,
            onChanged: onChanged,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
            decoration: InputDecoration(
              contentPadding: const EdgeInsets.symmetric(vertical: 12),
              prefixIcon: prefixWidget ?? Icon(icon, size: 18, color: hasError ? const Color(0xFFEF4444) : Colors.grey.shade500),
              border: InputBorder.none,
              hintText: 'Enter $label',
              hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13),
            ),
          ),
        ),
        if (hasError) ...[
          const SizedBox(height: 4),
          Text(
            errorText,
            style: const TextStyle(fontSize: 11, color: Color(0xFFEF4444), fontWeight: FontWeight.w500),
          ),
        ],
      ],
    );
  }

  Widget _buildCountryPicker() {
    return InkWell(
      onTap: () {
        showCountryPicker(
          context: context,
          showPhoneCode: true,
          countryListTheme: CountryListThemeData(
            bottomSheetHeight: MediaQuery.of(context).size.height * 0.7,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            inputDecoration: InputDecoration(
              labelText: 'Search Country',
              hintText: 'Start typing to search',
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(borderSide: BorderSide(color: Colors.grey.shade300)),
            ),
          ),
          onSelect: (Country country) {
            setState(() {
              _selectedCountryCode = '+${country.phoneCode}';
              _selectedCountryFlag = country.flagEmoji;
              _phoneMaxLength = country.example.isNotEmpty ? country.example.length : 15;
              
              if (_phoneController.text.length > _phoneMaxLength) {
                _phoneController.text = _phoneController.text.substring(0, _phoneMaxLength);
              }
            });
            // Update provider with new country code
            final checkout = context.read<CheckoutProvider>();
            checkout.setUserDetails(checkout.fullName, '$_selectedCountryCode${_phoneController.text.trim()}', checkout.email);
          },
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('$_selectedCountryCode $_selectedCountryFlag', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
            const SizedBox(width: 4),
            Icon(Icons.keyboard_arrow_down, color: Colors.grey.shade500, size: 16),
            const SizedBox(width: 8),
            Container(width: 1, height: 20, color: Colors.grey.shade300),
            const SizedBox(width: 8),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderSummary(CartProvider cart, Map<String, dynamic>? restaurant) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          InkWell(
            onTap: () {
              setState(() {
                _isSummaryExpanded = !_isSummaryExpanded;
              });
            },
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('ORDER SUMMARY', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: Colors.black87)),
                  Row(
                    children: [
                      Text('${cart.items.length} Items', style: const TextStyle(color: Color(0xFF7A0B10), fontWeight: FontWeight.bold, fontSize: 14)),
                      const SizedBox(width: 4),
                      Icon(_isSummaryExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down, color: const Color(0xFF7A0B10)),
                    ],
                  ),
                ],
              ),
            ),
          ),
          if (_isSummaryExpanded) ...[
            const Divider(height: 1, thickness: 1),
            ...cart.items.map((item) {
              final quantity = (item['quantity'] ?? item['qty'] ?? 1) as int;
              final price = (item['price'] as num).toDouble();
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        width: 50,
                        height: 50,
                        color: Colors.grey.shade200,
                        child: item['image'] != null && item['image'].toString().startsWith('http')
                            ? CachedNetworkImage(
                                imageUrl: item['image'],
                                fit: BoxFit.cover,
                                errorWidget: (_, __, ___) => Image.asset('assets/images/branded/lassi-lounge/categories/appetizers.jpg', fit: BoxFit.cover),
                              )
                            : Image.asset('assets/images/branded/lassi-lounge/categories/appetizers.jpg', fit: BoxFit.cover),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(item['name'] ?? 'Item', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                    if (item['selectedSize'] != null)
                                      Text(item['selectedSize']['name'], style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                                    if (item['addOns'] != null && (item['addOns'] as List).isNotEmpty)
                                      ...((item['addOns'] as List).map((a) => Text('+ ${a['name']}', style: TextStyle(color: Colors.grey.shade500, fontSize: 11)))),
                                  ],
                                ),
                              ),
                              Text(Formatters.formatCurrency(price * quantity, restaurant?['currency']), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: Colors.red.shade100),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                InkWell(
                                  onTap: () => cart.updateQuantity(cart.items.indexOf(item), quantity - 1),
                                  child: const Padding(
                                    padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    child: Icon(Icons.remove, size: 16, color: Color(0xFF7A0B10)),
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 4),
                                  child: Text('$quantity', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                ),
                                InkWell(
                                  onTap: () {
                                    final restProv = Provider.of<RestaurantProvider>(context, listen: false);
                                    AddToCartHelper.handleAddToCart(context, item, cart, restProv);
                                  },
                                  child: const Padding(
                                    padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    child: Icon(Icons.add, size: 16, color: Color(0xFF7A0B10)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ]
        ],
      ),
    );
  }

  Widget _buildFulfillmentEstimate(CheckoutProvider checkout) {
    String etaText = '30-40 mins';
    if (checkout.etaLoading) {
      etaText = 'Calculating...';
    } else if (checkout.etaData != null) {
      if (checkout.isDelivery) {
        if (checkout.etaData!['isOutOfRange'] == true) {
          etaText = 'Out of range';
        } else if (checkout.etaData!['deliveryTime'] != null) {
          etaText = 'In ${checkout.etaData!['deliveryTime']} mins';
        }
      } else {
        if (checkout.etaData!['prepTime'] != null) {
          etaText = 'In ${checkout.etaData!['prepTime']} mins';
        } else {
          etaText = 'In 15-20 mins';
        }
      }
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          const Icon(Icons.access_time, color: Color(0xFF7A0B10)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(checkout.isDelivery ? 'Estimated Delivery Time' : 'Estimated Pickup Time', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                const SizedBox(height: 4),
                Text(etaText, style: const TextStyle(color: Color(0xFF7A0B10), fontWeight: FontWeight.bold, fontSize: 16)),
              ],
            ),
          ),
          OutlinedButton(
            onPressed: () => Navigator.pop(context),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFF7A0B10)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              minimumSize: const Size(0, 36),
            ),
            child: const Text('Change', style: TextStyle(color: Color(0xFF7A0B10), fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentMethods(CheckoutProvider checkout, AuthProvider auth) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            children: [
          // Saved Cards
          if (auth.user?.savedCards != null && auth.user!.savedCards!.isNotEmpty)
            ...auth.user!.savedCards!.map((card) {
              return Column(
                children: [
                  _buildPaymentOption(
                    icon: Icons.credit_card,
                    title: '${card['brand'] ?? 'Card'} ending in ${card['last4'] ?? '****'}',
                    subtitle: card['isDefault'] == true ? 'Recommended' : null,
                    value: card['cardId'] ?? card['id'] ?? card['_id'] ?? '',
                    groupValue: checkout.paymentMethod,
                    onChanged: (val) => checkout.setPaymentMethod(val!),
                    isFirst: card == auth.user!.savedCards!.first,
                  ),
                  const Divider(height: 1, indent: 48),
                ],
              );
            }),
          
          if (auth.user?.savedCards == null || auth.user!.savedCards!.isEmpty)
            const SizedBox(height: 0), // No divider needed if first

          // Pay with Card / Mobile Wallets (Secure Stripe Checkout)
          _buildPaymentOption(
            icon: Icons.lock_outline,
            title: 'Pay with Card / Mobile Wallets',
            subtitle: '100% Secure via Stripe',
            value: 'credit_card',
            groupValue: checkout.paymentMethod,
            onChanged: (val) => checkout.setPaymentMethod(val!),
            isFirst: auth.user?.savedCards == null || auth.user!.savedCards!.isEmpty,
            isLast: true,
          ),
        ],
      ),
    ),
    if (checkout.couponPaymentError != null)
      Padding(
        padding: const EdgeInsets.only(top: 12.0),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.red.shade50,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.red.shade200),
          ),
          child: Row(
            children: [
              Icon(Icons.error_outline, color: Colors.red.shade700, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  checkout.couponPaymentError!,
                  style: TextStyle(color: Colors.red.shade700, fontSize: 13, fontWeight: FontWeight.w600),
                ),
              ),
              TextButton(
                onPressed: checkout.handleRemoveCoupon,
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text('Remove', style: TextStyle(color: Color(0xFF7A0B10), fontWeight: FontWeight.bold, fontSize: 12)),
              )
            ],
          ),
        ),
      ),
      ],
    );
  }

  Widget _buildPaymentOption({
    Widget? customIcon,
    IconData? icon,
    required String title,
    String? subtitle,
    required String value,
    required String groupValue,
    required Function(String?) onChanged,
    bool isFirst = false,
    bool isLast = false,
  }) {
    final isSelected = value == groupValue;
    return InkWell(
      onTap: () => onChanged(value),
      borderRadius: BorderRadius.vertical(
        top: isFirst ? const Radius.circular(12) : Radius.zero,
        bottom: isLast ? const Radius.circular(12) : Radius.zero,
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
        child: Row(
          children: [
            SizedBox(
              width: 32,
              child: customIcon ?? Icon(icon, color: isSelected ? const Color(0xFF7A0B10) : Colors.grey.shade600),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Row(
                children: [
                  Flexible(
                    child: Text(title, style: TextStyle(fontWeight: isSelected ? FontWeight.bold : FontWeight.normal, fontSize: 14)),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.green.shade50,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: Colors.green.shade200),
                      ),
                      child: Text(subtitle, style: TextStyle(color: Colors.green.shade700, fontSize: 10, fontWeight: FontWeight.bold)),
                    )
                  ]
                ],
              ),
            ),
            Icon(
              isSelected ? Icons.check_circle : Icons.circle_outlined,
              color: isSelected ? const Color(0xFF7A0B10) : Colors.grey.shade400,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTippingUI(CheckoutProvider checkout, CartProvider cart, Map<String, dynamic>? restaurant) {
    final subtotal = cart.subtotal;
    final List<int> tipPercentages = [10, 15, 20];
    
    return Row(
      children: [
        ...tipPercentages.map((percent) {
          final tipAmount = (subtotal * percent) / 100;
          final isSelected = checkout.tip == tipAmount;
          return Expanded(
            child: GestureDetector(
              onTap: () => checkout.setTip(tipAmount),
              child: Container(
                margin: const EdgeInsets.only(right: 8),
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFF7A0B10) : Colors.white,
                  border: Border.all(color: isSelected ? const Color(0xFF7A0B10) : Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: [
                    Text('$percent%', style: TextStyle(
                      color: isSelected ? Colors.white : Colors.black87,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    )),
                    const SizedBox(height: 4),
                    Text(Formatters.formatCurrency(tipAmount, restaurant?['currency']), style: TextStyle(
                      color: isSelected ? Colors.white70 : Colors.grey.shade600,
                      fontSize: 12,
                    )),
                  ],
                ),
              ),
            ),
          );
        }),
        Expanded(
          child: GestureDetector(
            onTap: () => checkout.setTip(0),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: checkout.tip == 0.0 ? const Color(0xFF7A0B10) : Colors.white,
                border: Border.all(color: checkout.tip == 0.0 ? const Color(0xFF7A0B10) : Colors.grey.shade300),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  Text('None', style: TextStyle(
                    color: checkout.tip == 0.0 ? Colors.white : Colors.black87,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  )),
                  const SizedBox(height: 4),
                  Text(Formatters.formatCurrency(0, restaurant?['currency']), style: TextStyle(
                    color: checkout.tip == 0.0 ? Colors.white70 : Colors.grey.shade600,
                    fontSize: 12,
                  )),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLassiCoinsSection(CheckoutProvider checkout, LoyaltyProvider loyalty, CartProvider cart) {
    final balance = loyalty.currentBalance;
    final maxDiscount = (balance / 100); // 100 coins = $1
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.orange.shade50, Colors.amber.shade50],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.orange.shade200),
      ),
      child: Row(
        children: [
          const Icon(Icons.monetization_on, color: Colors.orange, size: 32),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Lassi Coins', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                Text(
                  checkout.useLoyaltyPoints
                      ? 'Using $balance coins = \$${maxDiscount.toStringAsFixed(2)} off'
                      : 'You have $balance coins = \$${maxDiscount.toStringAsFixed(2)} available',
                  style: TextStyle(color: Colors.grey.shade700, fontSize: 12),
                ),
              ],
            ),
          ),
          Switch(
            value: checkout.useLoyaltyPoints,
            onChanged: (val) => checkout.toggleLoyaltyPoints(val),
            activeColor: const Color(0xFF7A0B10),
          ),
        ],
      ),
    );
  }

  Widget _buildBillDetails(CartProvider cart, CheckoutProvider checkout, LoyaltyProvider loyalty, Map<String, dynamic>? restaurant) {
    final subtotal = cart.subtotal;
    final deliveryFee = checkout.getDeliveryFee(cart, restaurant);
    final platformFee = checkout.getPlatformFee();
    final serviceFee = checkout.getServiceFee(cart, restaurant);
    final packagingFee = checkout.getPackagingFee(cart, restaurant);
    final tax = checkout.getTax(cart, restaurant);
    final couponDiscount = checkout.couponDiscount;
    
    final double maxRedeemable = checkout.getTotal(cart, restaurant);
    final double calculatedLoyalty = checkout.useLoyaltyPoints ? (loyalty.currentBalance / 100) : 0.0;
    final double loyaltyDiscount = calculatedLoyalty > maxRedeemable ? maxRedeemable : calculatedLoyalty;
    
    double total = maxRedeemable - loyaltyDiscount;
    if (total < 0) total = 0.0;

    return Container(
      decoration: const BoxDecoration(color: Colors.transparent),
      child: Column(
        children: [
          _buildBillRow('Subtotal (${cart.items.length} items)', subtotal, restaurant?['currency']),
          if (checkout.isDelivery) _buildBillRow('Delivery Fee', deliveryFee, restaurant?['currency'], isInfo: true, tooltipMessage: 'Fee charged for delivery based on distance and local market conditions.'),
          if (platformFee > 0) _buildBillRow('Platform Fee', platformFee, restaurant?['currency'], isInfo: true, tooltipMessage: 'Fee to maintain the platform and operations.'),
          if (serviceFee > 0) _buildBillRow('Service Fee', serviceFee, restaurant?['currency'], isInfo: true, tooltipMessage: 'Fee for the restaurant service.'),
          if (packagingFee > 0) _buildBillRow('Packaging Fee', packagingFee, restaurant?['currency'], isInfo: true, tooltipMessage: 'Fee for safe packaging of your order.'),
          _buildBillRow(restaurant?['taxType'] ?? 'Taxes', tax, restaurant?['currency'], isInfo: true, tooltipMessage: 'Estimated state and local sales taxes applied to your order.'),
          if (checkout.tip > 0) _buildBillRow('Tip', checkout.tip, restaurant?['currency']),
          if (couponDiscount > 0)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 6.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(children: [
                    Icon(Icons.local_offer_outlined, color: Colors.green.shade700, size: 14),
                    const SizedBox(width: 4),
                    Text('Coupon Discount', style: TextStyle(color: Colors.green.shade700, fontSize: 14)),
                  ]),
                  Text('-${Formatters.formatCurrency(couponDiscount, restaurant?['currency'])}', style: TextStyle(color: Colors.green.shade700, fontWeight: FontWeight.bold, fontSize: 14)),
                ],
              ),
            ),
          if (loyaltyDiscount > 0)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 6.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(children: [
                    Icon(Icons.monetization_on, color: Colors.green.shade700, size: 14),
                    const SizedBox(width: 4),
                    Text('Loyalty Points Used', style: TextStyle(color: Colors.green.shade700, fontSize: 14)),
                  ]),
                  Text('-${Formatters.formatCurrency(loyaltyDiscount, restaurant?['currency'])}', style: TextStyle(color: Colors.green.shade700, fontWeight: FontWeight.bold, fontSize: 14)),
                ],
              ),
            ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8.0),
            child: Divider(height: 1, thickness: 1, color: Colors.grey),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total Amount', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              Text(Formatters.formatCurrency(total, restaurant?['currency']), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF7A0B10))),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBillRow(String title, double amount, String? currencySetting, {bool isInfo = false, String? tooltipMessage}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Text(title, style: const TextStyle(fontSize: 14, color: Colors.black87)),
              if (isInfo) ...[
                const SizedBox(width: 4),
                JustTheTooltip(
                  content: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Text(
                      tooltipMessage ?? '',
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                      softWrap: true,
                    ),
                  ),
                  backgroundColor: const Color(0xFF1A1A1A),
                  triggerMode: TooltipTriggerMode.tap,
                  tailLength: 6.0,
                  tailBaseWidth: 12.0,
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  borderRadius: BorderRadius.circular(8),
                  child: const Icon(Icons.info_outline, size: 14, color: Colors.grey),
                ),
              ],
            ],
          ),
          Text(
            Formatters.formatCurrency(amount, currencySetting),
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomAction(CartProvider cart, CheckoutProvider checkout, AuthProvider auth, Map<String, dynamic>? restaurant) {
    final total = checkout.getTotal(cart, restaurant);
    final isCartEmpty = cart.items.isEmpty;
    final canProceed = !isCartEmpty && checkout.couponPaymentError == null && checkout.isContactComplete;

    return Container(
      padding: EdgeInsets.only(
        left: 24, 
        right: 24, 
        top: 16, 
        bottom: 16 + MediaQuery.of(context).padding.bottom
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5)),
        ],
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Total Payment', style: TextStyle(color: Colors.grey.shade600, fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  Text(Formatters.formatCurrency(total, restaurant?['currency']), style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 22)),
                ],
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              flex: 1,
              child: ElevatedButton(
                onPressed: (checkout.isPlacingOrder || !canProceed) ? null : () async {
                  if (checkout.isDelivery && checkout.compiledAddress.isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a delivery address in Cart')));
                    return;
                  }

                  try {
                    final orderId = await checkout.handlePlaceOrder(context, cart, auth, restaurant);
                    if (orderId != null && mounted) {
                      // Refresh loyalty balance to reflect points earned
                      context.read<LoyaltyProvider>().fetchHistory(refresh: true);
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Order placed successfully!')));
                      Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const MainScreen()), (route) => false);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => TrackOrderScreen(orderId: orderId)));
                    }
                  } catch (e) {
                    if (mounted) {
                      String msg = e.toString();
                      if (msg.contains('canceled') || msg.contains('cancelled')) {
                        msg = 'Payment was canceled.';
                      } else {
                        msg = msg.replaceAll('Exception: ', '');
                      }
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
                    }
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF7A0B10),
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: Colors.grey.shade300,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: checkout.isPlacingOrder 
                  ? const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5)),
                        SizedBox(width: 10),
                        Text('Processing...', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      ],
                    )
                  : !checkout.isContactComplete
                    ? const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.phone_outlined, size: 16),
                          SizedBox(width: 6),
                          Text('Add Phone to Order', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 0.3)),
                        ],
                      )
                    : const Text('Place Order', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, letterSpacing: 0.5)),
              ),
            ),
            ],
            ),
            const SizedBox(height: 12),
            Center(
              child: RichText(
                textAlign: TextAlign.center,
                text: TextSpan(
                  style: TextStyle(fontSize: 11, color: Colors.grey.shade600, height: 1.4),
                  children: [
                    const TextSpan(text: 'By placing this order, you agree to our\n'),
                    TextSpan(
                      text: 'Terms, Cancellation & Refund Policy.',
                      style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF7A0B10), decoration: TextDecoration.underline),
                      recognizer: TapGestureRecognizer()..onTap = () {
                        Navigator.push(context, MaterialPageRoute(builder: (_) => const TermsScreen()));
                      },
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
