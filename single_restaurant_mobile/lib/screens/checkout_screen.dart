import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/address_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/checkout_provider.dart';
import 'package:single_restaurant_mobile/screens/saved_addresses_screen.dart';
import 'package:single_restaurant_mobile/screens/main_screen.dart';
import 'package:single_restaurant_mobile/screens/track_order_screen.dart';
import 'package:single_restaurant_mobile/widgets/address_autocomplete_field.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _instructionsController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _address2Controller = TextEditingController();
  final TextEditingController _cityController = TextEditingController();
  final TextEditingController _zipController = TextEditingController();
  final TextEditingController _couponController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _prefillData();
    });
  }

  void _prefillData() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final checkoutProvider = Provider.of<CheckoutProvider>(context, listen: false);
    final addressProvider = Provider.of<AddressProvider>(context, listen: false);
    
    if (authProvider.user != null) {
      final name = authProvider.user!.name;
      final phone = authProvider.user!.phone;
      _nameController.text = name;
      _phoneController.text = phone;
      checkoutProvider.setUserDetails(name, phone, authProvider.user!.email);
      
      if (addressProvider.addresses.isEmpty) {
        addressProvider.fetchAddresses();
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _instructionsController.dispose();
    _addressController.dispose();
    _address2Controller.dispose();
    _cityController.dispose();
    _zipController.dispose();
    _couponController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFCF9F2),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.red),
          onPressed: () {
            final checkoutProvider = Provider.of<CheckoutProvider>(context, listen: false);
            if (checkoutProvider.step > 1) {
              checkoutProvider.setStep(checkoutProvider.step - 1);
            } else {
              Navigator.pop(context);
            }
          },
        ),
        title: const Text(
          'Checkout',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 20),
        ),
      ),
      body: Consumer<CheckoutProvider>(
        builder: (context, checkout, child) {
          return Column(
            children: [
              _buildStepper(checkout.step),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16.0),
                  child: _buildCurrentStep(checkout),
                ),
              ),
              _buildBottomAction(checkout),
            ],
          );
        },
      ),
    );
  }

  Widget _buildStepper(int currentStep) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16.0, horizontal: 24.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _buildStep(1, 'Delivery', isActive: currentStep >= 1, isCurrent: currentStep == 1),
          _buildStepDivider(),
          _buildStep(2, 'Payment', isActive: currentStep >= 2, isCurrent: currentStep == 2),
          _buildStepDivider(),
          _buildStep(3, 'Review', isActive: currentStep >= 3, isCurrent: currentStep == 3),
        ],
      ),
    );
  }

  Widget _buildStep(int stepNumber, String title, {bool isActive = false, bool isCurrent = false}) {
    return Column(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: isActive ? Colors.red.shade900 : Colors.white,
            shape: BoxShape.circle,
            border: Border.all(
              color: isActive ? Colors.red.shade900 : Colors.grey.shade400,
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            '$stepNumber',
            style: TextStyle(
              color: isActive ? Colors.white : Colors.grey.shade600,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          title,
          style: TextStyle(
            fontSize: 12,
            color: isCurrent ? Colors.red.shade900 : (isActive ? Colors.black87 : Colors.grey.shade600),
            fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ],
    );
  }

  Widget _buildStepDivider() {
    return Expanded(
      child: Container(
        height: 1,
        color: Colors.grey.shade300,
        margin: const EdgeInsets.symmetric(horizontal: 4).copyWith(bottom: 20),
      ),
    );
  }

  Widget _buildCurrentStep(CheckoutProvider checkout) {
    switch (checkout.step) {
      case 1: return _buildStep1Delivery(checkout);
      case 2: return _buildStep2Payment(checkout);
      case 3: return _buildStep3Review(checkout);
      default: return const SizedBox();
    }
  }

  // ==========================================
  // STEP 1: DELIVERY INFO
  // ==========================================
  Widget _buildStep1Delivery(CheckoutProvider checkout) {
    final cart = Provider.of<CartProvider>(context, listen: false);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader(Icons.location_on_outlined, 'Delivery Information'),
        const SizedBox(height: 16),
        _buildDeliveryOptions(checkout, cart),
        const SizedBox(height: 24),
        
        _buildTextField(label: 'Full Name *', controller: _nameController, icon: Icons.person_outline, onChanged: (v) => checkout.setUserDetails(v, checkout.phone, checkout.email)),
        const SizedBox(height: 16),
        _buildTextField(label: 'Phone Number *', controller: _phoneController, icon: Icons.phone_outlined, keyboardType: TextInputType.phone, onChanged: (v) => checkout.setUserDetails(checkout.fullName, v, checkout.email)),
        const SizedBox(height: 16),
        
        if (checkout.isDelivery) ...[
          _buildAddressSelection(checkout, cart),
          const SizedBox(height: 24),
        ],

        _buildTextField(label: 'Delivery Instructions (Optional)', controller: _instructionsController, maxLines: 3, onChanged: checkout.setDeliveryInstructions),
      ],
    );
  }

  Widget _buildDeliveryOptions(CheckoutProvider checkout, CartProvider cart) {
    return Row(
      children: [
        Expanded(
          child: GestureDetector(
            onTap: () => checkout.setDelivery(true, cart),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
              decoration: BoxDecoration(
                color: checkout.isDelivery ? Colors.white : Colors.transparent,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: checkout.isDelivery ? Colors.red.shade900 : Colors.grey.shade300, width: 1.5),
                boxShadow: checkout.isDelivery ? [BoxShadow(color: Colors.red.withOpacity(0.05), blurRadius: 8, offset: const Offset(0, 4))] : [],
              ),
              child: Stack(
                children: [
                  Row(
                    children: [
                      Icon(Icons.delivery_dining, color: Colors.red.shade900, size: 32),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Delivery', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          Text('30-45 mins', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                        ],
                      ),
                    ],
                  ),
                  if (checkout.isDelivery) Positioned(top: 0, right: 0, child: Icon(Icons.check_circle, color: Colors.red.shade900, size: 20)),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: GestureDetector(
            onTap: () => checkout.setDelivery(false, cart),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
              decoration: BoxDecoration(
                color: !checkout.isDelivery ? Colors.white : Colors.transparent,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: !checkout.isDelivery ? Colors.red.shade900 : Colors.grey.shade300, width: 1.5),
                boxShadow: !checkout.isDelivery ? [BoxShadow(color: Colors.red.withOpacity(0.05), blurRadius: 8, offset: const Offset(0, 4))] : [],
              ),
              child: Stack(
                children: [
                  Row(
                    children: [
                      Icon(Icons.shopping_bag_outlined, color: Colors.red.shade900, size: 32),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Pickup', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          Text('15-20 mins', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                        ],
                      ),
                    ],
                  ),
                  if (!checkout.isDelivery) Positioned(top: 0, right: 0, child: Icon(Icons.check_circle, color: Colors.red.shade900, size: 20)),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAddressSelection(CheckoutProvider checkout, CartProvider cart) {
    const usStates = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => checkout.handleUseCurrentLocation(cart),
                  icon: checkout.isLocationLoading 
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) 
                    : const Icon(Icons.my_location, size: 16),
                  label: const Text('Use Current Location', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.red.shade900,
                    side: BorderSide(color: Colors.red.shade900),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Consumer<AddressProvider>(
            builder: (context, addressProvider, _) {
              if (addressProvider.addresses.isEmpty) return const SizedBox.shrink();
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Saved Addresses:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: addressProvider.addresses.map((addr) {
                      return InkWell(
                        onTap: () {
                          checkout.handleSelectSavedAddress(addr, cart);
                          _addressController.text = checkout.addressLine1;
                          _address2Controller.text = checkout.addressLine2;
                          _cityController.text = checkout.city;
                          _zipController.text = checkout.zipCode;
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey.shade300),
                            borderRadius: BorderRadius.circular(8),
                            color: Colors.grey.shade50,
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.location_on, size: 14, color: Colors.grey),
                              const SizedBox(width: 4),
                              Text(addr['label'] ?? 'Address', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),
                ],
              );
            },
          ),
          const Divider(),
          const SizedBox(height: 8),
          const Text('Or enter manually:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
          const SizedBox(height: 12),
          
          AddressAutocompleteField(
            controller: _addressController,
            label: 'Street Address *',
            onChanged: (v) => checkout.setAddressLine1(v, cart),
            onSelected: (result) {
              checkout.handleAutocompleteSelection(result, cart);
              _addressController.text = checkout.addressLine1;
              // we don't change address2 on autocomplete usually, but sync it
              _address2Controller.text = checkout.addressLine2;
              _cityController.text = checkout.city;
              _zipController.text = checkout.zipCode;
            },
          ),
          
          const SizedBox(height: 12),
          _buildTextField(
            label: 'Apt, Suite, Floor (Optional)',
            controller: _address2Controller,
            onChanged: (v) => checkout.setAddressLine2(v, cart),
          ),
          
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(flex: 2, child: _buildTextField(label: 'City', controller: _cityController, onChanged: (v) => checkout.setCity(v, cart))),
              const SizedBox(width: 8),
              Expanded(
                flex: 1, 
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('State', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: usStates.contains(checkout.state) ? checkout.state : 'NY',
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.red.shade900)),
                      ),
                      items: usStates.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                      onChanged: (v) {
                        if (v != null) checkout.setStateCode(v, cart);
                      },
                    ),
                  ],
                )
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildTextField(label: 'Zip Code', controller: _zipController, onChanged: (v) => checkout.setZipCode(v, cart)),
          
          const SizedBox(height: 16),
          if (checkout.quoteLoading)
            const Row(children: [SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)), SizedBox(width: 8), Text('Calculating delivery fee...', style: TextStyle(color: Colors.grey))])
          else if (checkout.quoteError != null)
            Text(checkout.quoteError!, style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 12))
          else if (checkout.deliveryQuote != null)
            Text('Delivery Fee: \$${checkout.getDeliveryFee(cart).toStringAsFixed(2)}', style: TextStyle(color: Colors.green.shade700, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  // ==========================================
  // STEP 2: PAYMENT & OFFERS
  // ==========================================
  Widget _buildStep2Payment(CheckoutProvider checkout) {
    final cart = Provider.of<CartProvider>(context, listen: false);
    final authProvider = Provider.of<AuthProvider>(context);
    final savedCards = authProvider.user?.savedCards ?? [];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader(Icons.payment, 'Payment Method & Offers'),
        const SizedBox(height: 16),
        
        // Coupons
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.grey.shade300)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Have a coupon?', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              if (checkout.couponApplied)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('${checkout.couponCode} applied! (-\$${checkout.couponDiscount.toStringAsFixed(2)})', style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                    IconButton(icon: const Icon(Icons.close, color: Colors.red), onPressed: checkout.handleRemoveCoupon),
                  ],
                )
              else
                Row(
                  children: [
                    Expanded(child: _buildTextField(label: '', controller: _couponController, onChanged: checkout.setCouponCode)),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: checkout.couponLoading ? null : () => checkout.handleApplyCoupon(cart),
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.black, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
                      child: checkout.couponLoading ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('Apply'),
                    ),
                  ],
                ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        
        // Tips
        if (checkout.isDelivery) ...[
          const Text('Driver Tip', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [2.0, 4.0, 6.0, 0.0].map((t) {
              final isSelected = checkout.tip == t;
              return Expanded(
                child: GestureDetector(
                  onTap: () => checkout.setTip(t),
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: isSelected ? Colors.red.shade900 : Colors.white,
                      border: Border.all(color: isSelected ? Colors.red.shade900 : Colors.grey.shade300),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(t == 0.0 ? 'None' : '\$$t', style: TextStyle(color: isSelected ? Colors.white : Colors.black, fontWeight: FontWeight.bold)),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 24),
        ],

        // Payment Method
        const Text('Payment Method', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.grey.shade300)),
          child: Column(
            children: [
              if (savedCards.isNotEmpty) ...[
                ...savedCards.map((card) {
                  return Column(
                    children: [
                      RadioListTile(
                        value: card['cardId'],
                        groupValue: checkout.paymentMethod,
                        onChanged: (v) => checkout.setPaymentMethod(v.toString()),
                        title: Row(
                          children: [
                            const Icon(Icons.credit_card),
                            const SizedBox(width: 8),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(card['title'] ?? 'Personal Card', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                Text('${card['brand'] ?? 'Card'} •••• ${card['last4'] ?? '****'}', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                              ],
                            ),
                          ],
                        ),
                        activeColor: Colors.red.shade900,
                      ),
                      const Divider(height: 1),
                    ],
                  );
                }),
              ],
              RadioListTile(
                value: 'credit_card',
                groupValue: checkout.paymentMethod,
                onChanged: (v) => checkout.setPaymentMethod(v.toString()),
                title: const Row(children: [Icon(Icons.add_card), SizedBox(width: 8), Text('Add New Card (Credit/Debit)')]),
                activeColor: Colors.red.shade900,
              ),
              const Divider(height: 1),
              RadioListTile(
                value: 'apple_pay',
                groupValue: checkout.paymentMethod,
                onChanged: (v) => checkout.setPaymentMethod(v.toString()),
                title: const Row(children: [Icon(Icons.apple), SizedBox(width: 8), Text('Apple Pay')]),
                activeColor: Colors.red.shade900,
              ),
              const Divider(height: 1),
              RadioListTile(
                value: 'google_pay',
                groupValue: checkout.paymentMethod,
                onChanged: (v) => checkout.setPaymentMethod(v.toString()),
                title: const Row(children: [Icon(Icons.phone_android), SizedBox(width: 8), Text('Google Pay')]),
                activeColor: Colors.red.shade900,
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ==========================================
  // STEP 3: REVIEW
  // ==========================================
  Widget _buildStep3Review(CheckoutProvider checkout) {
    final cart = Provider.of<CartProvider>(context, listen: false);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader(Icons.receipt_long, 'Order Summary'),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.grey.shade300)),
          child: Column(
            children: [
              _buildSummaryRow('Subtotal', cart.subtotal),
              _buildSummaryRow('Tax', cart.tax),
              if (checkout.isDelivery) _buildSummaryRow('Delivery Fee', checkout.getDeliveryFee(cart)),
              _buildSummaryRow('Platform Fee', checkout.getPlatformFee()),
              _buildSummaryRow('Service Fee', checkout.getServiceFee(cart)),
              if (checkout.tip > 0) _buildSummaryRow('Tip', checkout.tip),
              if (checkout.couponApplied) _buildSummaryRow('Coupon Discount', -checkout.couponDiscount, isDiscount: true),
              const Divider(height: 32),
              _buildSummaryRow('Total', checkout.getTotal(cart), isBold: true),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: Colors.orange.shade50, borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.orange.shade100)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Deliver to:', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black54)),
              const SizedBox(height: 4),
              Text(checkout.isDelivery ? checkout.compiledAddress : 'Store Pickup', style: const TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              const Text('Payment:', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black54)),
              const SizedBox(height: 4),
              Text(
                (checkout.paymentMethod.startsWith('pm_') || checkout.paymentMethod.startsWith('card_')) 
                  ? 'Saved Card' 
                  : checkout.paymentMethod == 'credit_card' ? 'Online Card Payment' : 'Cash on Delivery', 
                style: const TextStyle(fontWeight: FontWeight.bold)
              ),
            ],
          ),
        )
      ],
    );
  }

  Widget _buildSummaryRow(String label, double amount, {bool isBold = false, bool isDiscount = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontWeight: isBold ? FontWeight.bold : FontWeight.normal, fontSize: isBold ? 18 : 14, color: isDiscount ? Colors.green : Colors.black87)),
          Text(
            isDiscount ? '-\$${amount.abs().toStringAsFixed(2)}' : '\$${amount.toStringAsFixed(2)}',
            style: TextStyle(fontWeight: isBold ? FontWeight.bold : FontWeight.normal, fontSize: isBold ? 18 : 14, color: isDiscount ? Colors.green : Colors.black87),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // HELPERS
  // ==========================================
  Widget _buildSectionHeader(IconData icon, String title) {
    return Row(
      children: [
        Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: Colors.red.shade50, shape: BoxShape.circle), child: Icon(icon, color: Colors.red.shade900, size: 20)),
        const SizedBox(width: 12),
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87)),
      ],
    );
  }

  Widget _buildTextField({required String label, required TextEditingController controller, IconData? icon, TextInputType keyboardType = TextInputType.text, int maxLines = 1, Function(String)? onChanged}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label.isNotEmpty) ...[Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)), const SizedBox(height: 8)],
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          onChanged: onChanged,
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white,
            prefixIcon: icon != null ? Icon(icon, color: Colors.grey.shade600) : null,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.red.shade900)),
          ),
        ),
      ],
    );
  }

  Widget _buildBottomAction(CheckoutProvider checkout) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFFFCF9F2), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))]),
      child: SafeArea(
        child: ElevatedButton(
          onPressed: checkout.isPlacingOrder || checkout.quoteLoading ? null : () async {
            final cart = Provider.of<CartProvider>(context, listen: false);
            final auth = Provider.of<AuthProvider>(context, listen: false);
            
            if (checkout.step == 1) {
              if (checkout.fullName.isEmpty || checkout.phone.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill Name and Phone')));
                return;
              }
              if (checkout.isDelivery) {
                if (checkout.compiledAddress.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a delivery address')));
                  return;
                }
                if (checkout.deliveryQuote == null || checkout.quoteError != null) {
                  await checkout.fetchQuoteIfNeeded(cart);
                  if (checkout.quoteError != null) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(checkout.quoteError!)));
                    return;
                  }
                  if (checkout.deliveryQuote == null) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to calculate delivery fee.')));
                    return;
                  }
                }
              }
              checkout.setStep(2);
            } else if (checkout.step == 2) {
              checkout.setStep(3);
            } else if (checkout.step == 3) {
              try {
                final orderId = await checkout.handlePlaceOrder(context, cart, auth);
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Order placed successfully!')));
                if (orderId != null) {
                  Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => TrackOrderScreen(orderId: orderId)), (route) => false);
                } else {
                  Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const MainScreen()), (route) => false);
                }
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
              }
            }
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.red.shade900,
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 56),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
          child: checkout.isPlacingOrder 
            ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  checkout.step == 3 ? 'PLACE ORDER' : 'CONTINUE',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 1.0),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.arrow_forward, size: 20),
              ],
            ),
        ),
      ),
    );
  }
}
