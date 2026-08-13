import 'dart:io' show Platform;
import 'package:flutter/material.dart';
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

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  bool _isSummaryExpanded = true;

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
      bottomSheet: _buildBottomAction(cart, checkout, auth, restaurant),
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
          // Apple Pay
          if (Platform.isIOS)
            _buildPaymentOption(
              customIcon: Image.network('https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Apple_Pay_logo.svg/320px-Apple_Pay_logo.svg.png', width: 32, height: 20, fit: BoxFit.contain, errorBuilder: (_,__,___) => Icon(Icons.apple, color: Colors.grey.shade600)),
              title: 'Apple Pay',
              value: 'apple_pay',
              groupValue: checkout.paymentMethod,
              onChanged: (val) => checkout.setPaymentMethod(val!),
              isFirst: true,
            ),
          if (Platform.isIOS) const Divider(height: 1, indent: 48),

          // Google Pay
          if (Platform.isAndroid)
            _buildPaymentOption(
              customIcon: Image.network('https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/320px-Google_Pay_Logo.svg.png', width: 32, height: 20, fit: BoxFit.contain, errorBuilder: (_,__,___) => Icon(Icons.g_mobiledata, color: Colors.grey.shade600)),
              title: 'Google Pay',
              value: 'google_pay',
              groupValue: checkout.paymentMethod,
              onChanged: (val) => checkout.setPaymentMethod(val!),
              isFirst: !Platform.isIOS,
            ),
          if (Platform.isAndroid) const Divider(height: 1, indent: 48),

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
                  ),
                  if (Platform.isAndroid || card != auth.user!.savedCards!.last)
                    const Divider(height: 1, indent: 48),
                ],
              );
            }),
          
          if (auth.user?.savedCards == null || auth.user!.savedCards!.isEmpty)
            const Divider(height: 1, indent: 48),

          // Add New Card
          _buildPaymentOption(
            icon: Icons.add_card,
            title: 'Add New Card',
            value: 'credit_card',
            groupValue: checkout.paymentMethod,
            onChanged: (val) => checkout.setPaymentMethod(val!),
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
                  Text(title, style: TextStyle(fontWeight: isSelected ? FontWeight.bold : FontWeight.normal, fontSize: 14)),
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
          if (checkout.isDelivery) _buildBillRow('Delivery Fee', deliveryFee, restaurant?['currency'], isInfo: true),
          _buildBillRow('Platform Fee', platformFee, restaurant?['currency'], isInfo: true),
          if (serviceFee > 0) _buildBillRow('Service Fee', serviceFee, restaurant?['currency'], isInfo: true),
          if (packagingFee > 0) _buildBillRow('Packaging Fee', packagingFee, restaurant?['currency'], isInfo: true),
          _buildBillRow(restaurant?['taxType'] ?? 'Taxes', tax, restaurant?['currency'], isInfo: true),
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

  Widget _buildBillRow(String title, double amount, String? currencySetting, {bool isInfo = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Text(title, style: TextStyle(color: Colors.grey.shade800, fontSize: 14)),
              if (isInfo) ...[
                const SizedBox(width: 4),
                Icon(Icons.info_outline, size: 14, color: Colors.grey.shade500),
              ]
            ],
          ),
          Text(Formatters.formatCurrency(amount, currencySetting), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        ],
      ),
    );
  }

  Widget _buildBottomAction(CartProvider cart, CheckoutProvider checkout, AuthProvider auth, Map<String, dynamic>? restaurant) {
    final total = checkout.getTotal(cart, restaurant);
    final isCartEmpty = cart.items.isEmpty;
    final canProceed = !isCartEmpty && checkout.couponPaymentError == null;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5)),
        ],
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        child: Row(
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
                  : const Text('Place Order', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, letterSpacing: 0.5)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
