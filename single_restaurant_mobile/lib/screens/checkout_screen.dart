import 'dart:io' show Platform;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/checkout_provider.dart';
import 'package:single_restaurant_mobile/screens/main_screen.dart';
import 'package:single_restaurant_mobile/screens/track_order_screen.dart';
import 'package:cached_network_image/cached_network_image.dart';

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
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildOrderSummary(cart),
              const SizedBox(height: 16),
              _buildFulfillmentEstimate(checkout),
              const SizedBox(height: 24),
              const Text('PAYMENT METHOD', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: Colors.black87)),
              const SizedBox(height: 12),
              _buildPaymentMethods(checkout),
              const SizedBox(height: 24),
              const Text('BILL DETAILS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: Colors.black87)),
              const SizedBox(height: 12),
              _buildBillDetails(cart, checkout, auth),
              const SizedBox(height: 100), // Spacing for bottom bar
            ],
          ),
        ),
      ),
      bottomSheet: _buildBottomAction(cart, checkout, auth),
    );
  }

  Widget _buildOrderSummary(CartProvider cart) {
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
                                  ],
                                ),
                              ),
                              Text('\$${(price * quantity).toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
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
                                  onTap: () => cart.updateQuantity(cart.items.indexOf(item), quantity + 1),
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

  Widget _buildPaymentMethods(CheckoutProvider checkout) {
    return Container(
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

          // Saved Card
          _buildPaymentOption(
            customIcon: Image.network('https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/320px-Visa_Inc._logo.svg.png', width: 32, height: 20, fit: BoxFit.contain, errorBuilder: (_,__,___) => Icon(Icons.credit_card, color: Colors.grey.shade600)),
            title: 'Visa ending in 4242',
            subtitle: 'Recommended',
            value: 'saved_card_4242',
            groupValue: checkout.paymentMethod,
            onChanged: (val) => checkout.setPaymentMethod(val!),
          ),
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

  Widget _buildBillDetails(CartProvider cart, CheckoutProvider checkout, AuthProvider auth) {
    final subtotal = cart.subtotal;
    final deliveryFee = checkout.getDeliveryFee(cart);
    final platformFee = checkout.getPlatformFee();
    final serviceFee = checkout.getServiceFee(cart);
    final tax = cart.tax;
    final loyaltyDiscount = checkout.useLoyaltyPoints ? ((auth.user?.loyaltyPoints ?? 0) / 100) : 0.0;
    final totalDiscount = checkout.couponDiscount + loyaltyDiscount;
    final total = checkout.getTotal(cart) - loyaltyDiscount;

    return Container(
      decoration: const BoxDecoration(color: Colors.transparent),
      child: Column(
        children: [
          _buildBillRow('Subtotal (${cart.items.length} items)', subtotal),
          if (checkout.isDelivery) _buildBillRow('Delivery Fee', deliveryFee, isInfo: true),
          _buildBillRow('Platform Fee', platformFee, isInfo: true),
          _buildBillRow('Service Fee (3%)', serviceFee, isInfo: true),
          _buildBillRow('Taxes', tax, isInfo: true),
          if (totalDiscount > 0)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 6.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Discount', style: TextStyle(color: Colors.green.shade700, fontSize: 14)),
                  Text('-\$${totalDiscount.toStringAsFixed(2)}', style: TextStyle(color: Colors.green.shade700, fontWeight: FontWeight.bold, fontSize: 14)),
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
              Text('\$${total.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF7A0B10))),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBillRow(String title, double amount, {bool isInfo = false}) {
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
          Text('\$${amount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        ],
      ),
    );
  }

  Widget _buildBottomAction(CartProvider cart, CheckoutProvider checkout, AuthProvider auth) {
    final total = checkout.getTotal(cart);
    final isCartEmpty = cart.items.isEmpty;
    final canProceed = !isCartEmpty;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: canProceed ? const Color(0xFF5E0C0F) : Colors.grey.shade500,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              flex: 1,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('\$${total.toStringAsFixed(2)}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                  Row(
                    children: const [
                      Text('View Details', style: TextStyle(color: Colors.white70, fontSize: 12)),
                      Icon(Icons.keyboard_arrow_up, color: Colors.white70, size: 14),
                    ],
                  ),
                ],
              ),
            ),
            Container(width: 1, height: 40, color: Colors.white24),
            const SizedBox(width: 16),
            Expanded(
              flex: 2,
              child: GestureDetector(
                onTap: (checkout.isPlacingOrder || !canProceed) ? null : () async {
                  if (checkout.isDelivery && checkout.compiledAddress.isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a delivery address in Cart')));
                    return;
                  }

                  try {
                    final orderId = await checkout.handlePlaceOrder(context, cart, auth);
                    if (orderId != null && mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Order placed successfully!')));
                      Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const MainScreen()), (route) => false);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => TrackOrderScreen(orderId: orderId)));
                    }
                  } catch (e) {
                    if (mounted) {
                      String msg = e.toString();
                      if (msg.contains('canceled')) {
                        msg = 'Payment was canceled.';
                      }
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
                    }
                  }
                },
                child: checkout.isPlacingOrder 
                  ? const Center(child: SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)))
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Text('PLACE ORDER', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 1.0)),
                        SizedBox(width: 8),
                        Icon(Icons.arrow_forward, color: Colors.white, size: 20),
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
