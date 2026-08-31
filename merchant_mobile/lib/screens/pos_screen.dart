import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import 'dart:ui' as ui;
import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:intl_phone_field/intl_phone_field.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter/services.dart';
import 'package:toastification/toastification.dart';
import 'package:flutter_stripe/flutter_stripe.dart';

import '../providers/menu_provider.dart';
import '../models/menu_model.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';

class CartItem {
  final MenuItemModel item;
  int quantity;
  final ItemModifier? selectedSize;
  final List<ItemModifier> selectedExtras;
  final String instructions;

  CartItem({
    required this.item,
    this.quantity = 1,
    this.selectedSize,
    this.selectedExtras = const [],
    this.instructions = '',
  });

  double get unitPrice {
    double base = selectedSize?.price ?? item.price;
    for (var extra in selectedExtras) {
      base += extra.price;
    }
    return base;
  }

  double get totalPrice => unitPrice * quantity;

  // Custom equality check to group identical items in cart
  bool isSameConfiguration(CartItem other) {
    if (item.id != other.item.id) return false;
    if (selectedSize?.name != other.selectedSize?.name) return false;
    if (instructions != other.instructions) return false;
    
    if (selectedExtras.length != other.selectedExtras.length) return false;
    final thisExtraNames = selectedExtras.map((e) => e.name).toSet();
    final otherExtraNames = other.selectedExtras.map((e) => e.name).toSet();
    return thisExtraNames.containsAll(otherExtraNames);
  }
}

class PosScreen extends StatefulWidget {
  const PosScreen({Key? key}) : super(key: key);

  @override
  State<PosScreen> createState() => _PosScreenState();
}

class _PosScreenState extends State<PosScreen> {
  String _activeCategoryId = 'all';
  List<CartItem> _cartItems = [];
  bool _isGeneratingOrder = false;
  String _searchQuery = '';

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  String _fullPhoneNumber = '';
  final TextEditingController _emailController = TextEditingController();

  String _orderType = 'pickup';
  String _paymentMethod = 'payment_link';
  final TextEditingController _tableController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();

  // Validation States
  bool _isNameTouched = false;
  bool _isPhoneTouched = false;
  bool _isEmailTouched = false;

  double? _addressLat;
  double? _addressLng;

  final TextEditingController _couponController = TextEditingController();
  String _appliedCouponCode = '';
  double _couponDiscount = 0.0;
  bool _isApplyingCoupon = false;

  double _deliveryFee = 0.0;
  bool _isFetchingQuote = false;
  String? _deliveryQuoteError;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<MenuProvider>().fetchMenu();
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _tableController.dispose();
    _addressController.dispose();
    _couponController.dispose();
    super.dispose();
  }

  // --- Validation Logic ---
  bool get _isNameValid => RegExp(r"^[a-zA-Z\s\-'.]+$").hasMatch(_nameController.text.trim());
  bool get _isPhoneValid => RegExp(r"^\+?[0-9]{10,15}$").hasMatch(_fullPhoneNumber);
  bool get _isEmailValid => RegExp(r"^[^\s@]+@[^\s@]+\.[^\s@]+$").hasMatch(_emailController.text.trim());
  
  bool get _canCheckout {
    if (_cartItems.isEmpty) return false;
    if (_nameController.text.isEmpty || !_isNameValid) return false;
    if (_fullPhoneNumber.isEmpty || !_isPhoneValid) return false;
    if (_emailController.text.isNotEmpty && !_isEmailValid) return false;
    return true;
  }

  bool get _isPaymentValid {
    if (_orderType == 'delivery') {
      if (_addressLat == null || _addressLng == null) return false;
      if (_isFetchingQuote) return false;
      if (_deliveryQuoteError != null) return false;
    }
    return true;
  }

  // --- Cart Logic ---
  int get _cartItemCount => _cartItems.fold(0, (sum, item) => sum + item.quantity);
  
  double get _cartTotal => _cartItems.fold(0.0, (sum, item) => sum + item.totalPrice);

  Map<String, double> _calculateSummary(MenuProvider menuProvider) {
    final subtotal = _cartTotal;
    
    final taxRateMultiplier = menuProvider.taxRate < 1 ? menuProvider.taxRate : (menuProvider.taxRate / 100);
    final tax = (subtotal * taxRateMultiplier * 100).round() / 100;
    
    final serviceChargeMultiplier = menuProvider.serviceCharge < 1 ? menuProvider.serviceCharge : (menuProvider.serviceCharge / 100);
    final serviceFee = (subtotal * serviceChargeMultiplier * 100).round() / 100;
    
    final packagingFee = menuProvider.packagingCharge;
    
    final deliveryFee = _orderType == 'delivery' ? _deliveryFee : 0.0;
    
    double rawTotal = subtotal + tax + deliveryFee + serviceFee + packagingFee - _couponDiscount;
    if (rawTotal < 0) rawTotal = 0;
    
    final total = menuProvider.roundOff ? rawTotal.roundToDouble() : rawTotal;
    
    return {
      'subtotal': subtotal,
      'tax': tax,
      'serviceFee': serviceFee,
      'packagingFee': packagingFee,
      'deliveryFee': deliveryFee,
      'discount': _couponDiscount,
      'total': total,
    };
  }

  void _addConfigurationToCart(CartItem newItem) {
    setState(() {
      final existingIndex = _cartItems.indexWhere((it) => it.isSameConfiguration(newItem));
      if (existingIndex >= 0) {
        _cartItems[existingIndex].quantity += newItem.quantity;
      } else {
        _cartItems.add(newItem);
      }
    });
  }

  void _incrementCartItem(int index) {
    setState(() {
      _cartItems[index].quantity++;
    });
  }

  void _decrementCartItem(int index) {
    setState(() {
      if (_cartItems[index].quantity > 1) {
        _cartItems[index].quantity--;
      } else {
        _cartItems.removeAt(index);
      }
    });
  }

  void _handleItemTap(MenuItemModel item) {
    if (item.sizeVariations.isNotEmpty || item.addOns.isNotEmpty) {
      _showCustomizationModal(item);
    } else {
      _addConfigurationToCart(CartItem(item: item));
    }
  }

  // --- UI Modals ---

  void _showCustomizationModal(MenuItemModel item) {
    ItemModifier? selectedSize = item.sizeVariations.isNotEmpty ? item.sizeVariations.first : null;
    List<ItemModifier> selectedExtras = [];
    TextEditingController instructionsController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          
          double calculatePreviewTotal() {
            double base = selectedSize?.price ?? item.price;
            for (var extra in selectedExtras) {
              base += extra.price;
            }
            return base;
          }

          return Container(
            constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.9),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.all(16.0),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2))],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item.name, style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold)),
                            if (item.description.isNotEmpty)
                              Text(item.description, style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade600), maxLines: 2, overflow: TextOverflow.ellipsis),
                          ],
                        ),
                      ),
                      IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                    ],
                  ),
                ),
                
                // Body
                Flexible(
                  child: ListView(
                    shrinkWrap: true,
                    padding: const EdgeInsets.all(16),
                    children: [
                      if (item.sizeVariations.isNotEmpty) ...[
                        Text('Choose Size', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        ...item.sizeVariations.map((size) {
                          return RadioListTile<ItemModifier>(
                            title: Text(size.name, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                            subtitle: Text('\$${size.price.toStringAsFixed(2)}', style: GoogleFonts.inter(color: Colors.grey.shade600)),
                            value: size,
                            groupValue: selectedSize,
                            activeColor: const Color(0xFF8B0000),
                            onChanged: (val) => setModalState(() => selectedSize = val),
                          );
                        }).toList(),
                        const SizedBox(height: 24),
                      ],
                      
                      if (item.addOns.isNotEmpty) ...[
                        Text('Extras & Add-ons', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        ...item.addOns.map((extra) {
                          final isSelected = selectedExtras.contains(extra);
                          return CheckboxListTile(
                            title: Text(extra.name, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                            subtitle: Text('+\$${extra.price.toStringAsFixed(2)}', style: GoogleFonts.inter(color: Colors.grey.shade600)),
                            value: isSelected,
                            activeColor: const Color(0xFF8B0000),
                            onChanged: (val) {
                              setModalState(() {
                                if (val == true) {
                                  selectedExtras.add(extra);
                                } else {
                                  selectedExtras.remove(extra);
                                }
                              });
                            },
                          );
                        }).toList(),
                        const SizedBox(height: 24),
                      ],
                      
                      Text('Special Instructions', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      TextField(
                        controller: instructionsController,
                        maxLines: 3,
                        decoration: InputDecoration(
                          hintText: 'E.g. No onions, extra spicy...',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      )
                    ],
                  ),
                ),
                
                // Footer
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))],
                  ),
                  child: SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF8B0000),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      onPressed: () {
                        _addConfigurationToCart(CartItem(
                          item: item,
                          selectedSize: selectedSize,
                          selectedExtras: List.from(selectedExtras),
                          instructions: instructionsController.text.trim(),
                        ));
                        Navigator.pop(ctx);
                      },
                      child: Text('Add to Cart - \$${calculatePreviewTotal().toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                    ),
                  ),
                )
              ],
            ),
          );
        }
      ),
    );
  }

  void _showCartBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          return Container(
            constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.9),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Your Cart', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold)),
                      IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                    ],
                  ),
                ),
                Flexible(
                  child: ListView(
                    shrinkWrap: true,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: [
                      // Customer Info Form
                      Text('Customer Info (Optional)', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      
                      // Name Field
                      TextField(
                        controller: _nameController,
                        onChanged: (val) {
                          setState(() => _isNameTouched = true);
                          setModalState(() {});
                        },
                        decoration: InputDecoration(
                          labelText: 'Name',
                          prefixIcon: const Icon(Icons.person),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: _nameController.text.isEmpty ? Colors.grey : (_isNameValid ? Colors.green : Colors.red),
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: _nameController.text.isEmpty ? Colors.blue : (_isNameValid ? Colors.green : Colors.red),
                              width: 2,
                            ),
                          ),
                          suffixIcon: _nameController.text.isNotEmpty 
                              ? Icon(_isNameValid ? Icons.check_circle : Icons.error, color: _isNameValid ? Colors.green : Colors.red)
                              : null,
                        ),
                      ),
                      const SizedBox(height: 12),
                      
                      // Phone Field
                      IntlPhoneField(
                        controller: _phoneController,
                        initialCountryCode: 'US',
                        decoration: InputDecoration(
                          labelText: 'Phone',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: _fullPhoneNumber.isEmpty ? Colors.grey : (_isPhoneValid ? Colors.green : Colors.red),
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: _fullPhoneNumber.isEmpty ? Colors.blue : (_isPhoneValid ? Colors.green : Colors.red),
                              width: 2,
                            ),
                          ),
                          suffixIcon: _fullPhoneNumber.isNotEmpty 
                              ? Icon(_isPhoneValid ? Icons.check_circle : Icons.error, color: _isPhoneValid ? Colors.green : Colors.red)
                              : null,
                        ),
                        onChanged: (phone) {
                          setState(() {
                            _isPhoneTouched = true;
                            _fullPhoneNumber = phone.completeNumber;
                          });
                          setModalState(() {});
                        },
                      ),
                      const SizedBox(height: 12),
                      
                      // Email Field
                      TextField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        onChanged: (val) {
                          setState(() => _isEmailTouched = true);
                          setModalState(() {});
                        },
                        decoration: InputDecoration(
                          labelText: 'Email',
                          prefixIcon: const Icon(Icons.email),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: _emailController.text.isEmpty ? Colors.grey : (_isEmailValid ? Colors.green : Colors.red),
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: _emailController.text.isEmpty ? Colors.blue : (_isEmailValid ? Colors.green : Colors.red),
                              width: 2,
                            ),
                          ),
                          suffixIcon: _emailController.text.isNotEmpty 
                              ? Icon(_isEmailValid ? Icons.check_circle : Icons.error, color: _isEmailValid ? Colors.green : Colors.red)
                              : null,
                        ),
                      ),
                      
                      const SizedBox(height: 24),
                      const Divider(),
                      const SizedBox(height: 16),
                      Text('Order Items', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      
                      if (_cartItems.isEmpty)
                        Padding(
                          padding: const EdgeInsets.all(32.0),
                          child: Center(child: Text('Cart is empty', style: GoogleFonts.inter(color: Colors.grey))),
                        )
                      else
                        ..._cartItems.asMap().entries.map((entry) {
                          final i = entry.key;
                          final cartItem = entry.value;
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 16.0),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(cartItem.item.name, style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                                      
                                      // Customizations Text
                                      if (cartItem.selectedSize != null || cartItem.selectedExtras.isNotEmpty || cartItem.instructions.isNotEmpty)
                                        Padding(
                                          padding: const EdgeInsets.only(top: 4.0),
                                          child: Text(
                                            [
                                              if (cartItem.selectedSize != null) 'Size: ${cartItem.selectedSize!.name}',
                                              if (cartItem.selectedExtras.isNotEmpty) 'Extras: ${cartItem.selectedExtras.map((e) => e.name).join(', ')}',
                                              if (cartItem.instructions.isNotEmpty) 'Note: ${cartItem.instructions}'
                                            ].join('\n'),
                                            style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade600),
                                          ),
                                        ),
                                        
                                      const SizedBox(height: 4),
                                      Text('\$${cartItem.unitPrice.toStringAsFixed(2)} each', style: GoogleFonts.inter(color: Colors.grey.shade600, fontSize: 13)),
                                    ],
                                  ),
                                ),
                                Row(
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.remove_circle_outline, color: Colors.red),
                                      onPressed: () {
                                        _decrementCartItem(i);
                                        setModalState(() {});
                                      },
                                    ),
                                    Text('${cartItem.quantity}', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
                                    IconButton(
                                      icon: const Icon(Icons.add_circle_outline, color: Colors.green),
                                      onPressed: () {
                                        _incrementCartItem(i);
                                        setModalState(() {});
                                      },
                                    ),
                                  ],
                                )
                              ],
                            ),
                          );
                        }).toList(),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))],
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Total (excl. tax)', style: GoogleFonts.inter(fontSize: 16, color: Colors.grey.shade600)),
                          Text('\$${_cartTotal.toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                            disabledBackgroundColor: Colors.grey.shade300,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          onPressed: !_canCheckout ? null : () {
                            Navigator.pop(ctx);
                            _showPaymentSelectionModal();
                          },
                          child: Text('Continue to Payment', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                        ),
                      )
                    ],
                  ),
                )
              ],
            ),
          );
        }
      ),
    );
  }

  Future<Iterable<Map<String, dynamic>>> _fetchAddressSuggestions(String query) async {
    if (query.isEmpty) return const Iterable.empty();
    try {
      final res = await ApiService.get('/api/location/autocomplete?q=${Uri.encodeComponent(query)}');
      final data = jsonDecode(res.body);
      if (data != null && data is List) {
        return data.cast<Map<String, dynamic>>();
      }
    } catch (e) {
      debugPrint('Autocomplete error: $e');
    }
    return const Iterable.empty();
  }

  Future<void> _fetchDeliveryQuote(StateSetter setPaymentState) async {
    if (_addressLat == null || _addressLng == null || _cartItems.isEmpty) return;
    setPaymentState(() { _isFetchingQuote = true; _deliveryQuoteError = null; _deliveryFee = 0.0; });
    try {
      final payload = {
        'restaurantId': context.read<MenuProvider>().restaurantId,
        'addressLat': _addressLat,
        'addressLng': _addressLng,
        'address': _addressController.text,
        'items': _cartItems.map((c) => {'menuItemId': c.item.id, 'quantity': c.quantity, 'price': c.item.price}).toList(),
      };
      final res = await ApiService.post('/api/orders/delivery-quote', payload);
      final data = jsonDecode(res.body);
      if (data['success'] && data['data'] != null) {
        setPaymentState(() {
          _deliveryFee = (data['data']['fee'] as num).toDouble();
        });
      } else {
        setPaymentState(() {
          _deliveryQuoteError = data['message'] ?? 'Failed to get delivery quote';
        });
      }
    } catch (e) {
      debugPrint('Failed to get delivery quote: $e');
      setPaymentState(() {
        _deliveryQuoteError = 'Delivery unavailable. Address may be too far.';
      });
    } finally {
      setPaymentState(() { _isFetchingQuote = false; });
    }
  }

  Future<void> _applyCoupon(StateSetter setPaymentState) async {
    final code = _couponController.text.trim();
    if (code.isEmpty) return;
    setPaymentState(() => _isApplyingCoupon = true);
    try {
      final payload = {
        'code': code,
        'cartValue': _cartTotal,
        'restaurantId': context.read<MenuProvider>().restaurantId,
      };
      final res = await ApiService.post('/api/coupons/validate', payload);
      final data = jsonDecode(res.body);
      if (res.statusCode == 200 && data['success']) {
        setPaymentState(() {
          _appliedCouponCode = code;
          _couponDiscount = (data['data']['discountAmount'] as num).toDouble();
        });
        toastification.show(context: context, title: const Text('Coupon Applied!'), type: ToastificationType.success, autoCloseDuration: const Duration(seconds: 3));
      } else {
        throw Exception(data['message'] ?? 'Invalid coupon');
      }
    } catch (e) {
      toastification.show(context: context, title: const Text('Failed to apply coupon'), description: Text(e.toString()), type: ToastificationType.error, autoCloseDuration: const Duration(seconds: 3));
      setPaymentState(() { _appliedCouponCode = ''; _couponDiscount = 0.0; });
    } finally {
      setPaymentState(() => _isApplyingCoupon = false);
    }
  }

  void _showPaymentSelectionModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setPaymentState) {
          Widget paymentButton(String value, String label, IconData icon) {
            final isSelected = _paymentMethod == value;
            return Expanded(
              child: InkWell(
                onTap: () {
                  setState(() => _paymentMethod = value);
                  setPaymentState(() {});
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0xFFFEF2F2) : Colors.white,
                    border: Border.all(color: isSelected ? const Color(0xFF8B0000) : Colors.grey.shade300, width: 2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    children: [
                      Icon(icon, color: isSelected ? const Color(0xFF8B0000) : Colors.grey, size: 28),
                      const SizedBox(height: 8),
                      Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: isSelected ? const Color(0xFF8B0000) : Colors.grey)),
                    ],
                  ),
                ),
              ),
            );
          }

          Widget orderTypeButton(String value, String label) {
            final isSelected = _orderType == value;
            return Expanded(
              child: InkWell(
                onTap: () {
                  setState(() => _orderType = value);
                  if (value != 'delivery') {
                    _deliveryFee = 0.0; // reset
                  }
                  setPaymentState(() {});
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: isSelected ? Colors.black : Colors.white,
                    border: Border.all(color: isSelected ? Colors.black : Colors.grey.shade300),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(label, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: isSelected ? Colors.white : Colors.black)),
                ),
              ),
            );
          }

          return Container(
            constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.9),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Payment & Delivery', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold)),
                      IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                    ],
                  ),
                ),
                Flexible(
                  child: ListView(
                    shrinkWrap: true,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: [
                      Text('Order Type', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          orderTypeButton('pickup', 'Pickup'),
                          const SizedBox(width: 8),
                          orderTypeButton('delivery', 'Delivery'),
                        ],
                      ),
                      const SizedBox(height: 16),
                      if (_orderType == 'dine_in') ...[
                        TextField(
                          controller: _tableController,
                          decoration: InputDecoration(
                            labelText: 'Table Number',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                      if (_orderType == 'delivery') ...[
                        Autocomplete<Map<String, dynamic>>(
                          optionsBuilder: (TextEditingValue textEditingValue) {
                            return _fetchAddressSuggestions(textEditingValue.text);
                          },
                          displayStringForOption: (option) => option['display_name'] ?? option['main_text'] ?? '',
                          onSelected: (option) async {
                            _addressController.text = option['display_name'] ?? option['main_text'] ?? '';
                            if (option['place_id'] != null) {
                              try {
                                final res = await ApiService.get('/api/location/place?place_id=${option['place_id']}');
                                final data = jsonDecode(res.body);
                                if (data['lat'] != null && data['lng'] != null) {
                                  setState(() {
                                    _addressLat = (data['lat'] as num).toDouble();
                                    _addressLng = (data['lng'] as num).toDouble();
                                  });
                                  _fetchDeliveryQuote(setPaymentState);
                                }
                              } catch (e) {
                                debugPrint('Failed to get place details: $e');
                              }
                            }
                          },
                          fieldViewBuilder: (context, controller, focusNode, onFieldSubmitted) {
                            // Link controller changes to our _addressController
                            controller.addListener(() {
                              if (_addressController.text != controller.text) {
                                _addressController.text = controller.text;
                                if (_addressLat != null || _addressLng != null || _deliveryQuoteError != null || _deliveryFee != 0.0) {
                                  _addressLat = null;
                                  _addressLng = null;
                                  _deliveryQuoteError = null;
                                  _deliveryFee = 0.0;
                                  setPaymentState(() {});
                                }
                              }
                            });
                            // Make sure initial value matches if any
                            if (controller.text.isEmpty && _addressController.text.isNotEmpty) {
                              controller.text = _addressController.text;
                            }
                            return TextField(
                              controller: controller,
                              focusNode: focusNode,
                              decoration: InputDecoration(
                                labelText: 'Delivery Address',
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                prefixIcon: const Icon(Icons.location_on),
                              ),
                            );
                          },
                          optionsViewBuilder: (context, onSelected, options) {
                            return Align(
                              alignment: Alignment.topLeft,
                              child: Material(
                                elevation: 4.0,
                                child: ConstrainedBox(
                                  constraints: BoxConstraints(
                                    maxHeight: 200, 
                                    maxWidth: MediaQuery.of(context).size.width - 32
                                  ),
                                  child: ListView.builder(
                                    padding: EdgeInsets.zero,
                                    shrinkWrap: true,
                                    itemCount: options.length,
                                    itemBuilder: (BuildContext context, int index) {
                                      final option = options.elementAt(index);
                                      return ListTile(
                                        leading: const Icon(Icons.location_city),
                                        title: Text(option['main_text'] ?? ''),
                                        subtitle: Text(option['secondary_text'] ?? ''),
                                        onTap: () => onSelected(option),
                                      );
                                    },
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                        if (_deliveryQuoteError != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(_deliveryQuoteError!, style: GoogleFonts.inter(color: Colors.red, fontSize: 12)),
                          ),
                        const SizedBox(height: 16),
                      ],
                      const Divider(),
                      const SizedBox(height: 16),
                      Text('Payment Method', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          paymentButton('cash', 'Cash', Icons.attach_money),
                          const SizedBox(width: 12),
                          paymentButton('card_terminal', 'Card', Icons.credit_card),
                          const SizedBox(width: 12),
                          paymentButton('payment_link', 'QR Link', Icons.qr_code),
                        ],
                      ),
                      const SizedBox(height: 32),
                      
                      // Coupon and Order Summary
                      Text('Coupon', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _couponController,
                              decoration: InputDecoration(
                                labelText: 'Coupon Code',
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                suffixIcon: _appliedCouponCode.isNotEmpty ? const Icon(Icons.check_circle, color: Colors.green) : null,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.black,
                              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            onPressed: _isApplyingCoupon ? null : () => _applyCoupon(setPaymentState),
                            child: _isApplyingCoupon 
                                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) 
                                : Text('Apply', style: GoogleFonts.inter(color: Colors.white)),
                          )
                        ],
                      ),
                      const SizedBox(height: 24),
                      Text('Order Summary', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      
                      Builder(builder: (context) {
                        final summary = _calculateSummary(context.read<MenuProvider>());
                        Widget row(String title, double value, {bool bold = false, bool isDiscount = false}) {
                          if (value == 0 && title != 'Subtotal' && title != 'Total') return const SizedBox();
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(title, style: GoogleFonts.inter(fontWeight: bold ? FontWeight.bold : FontWeight.normal, fontSize: bold ? 18 : 14)),
                                Text(isDiscount ? '-\$${value.toStringAsFixed(2)}' : '\$${value.toStringAsFixed(2)}', 
                                     style: GoogleFonts.inter(fontWeight: bold ? FontWeight.bold : FontWeight.normal, fontSize: bold ? 18 : 14, color: isDiscount ? Colors.green : Colors.black)),
                              ],
                            ),
                          );
                        }
                        
                        return Column(
                          children: [
                            row('Subtotal', summary['subtotal']!),
                            row(context.read<MenuProvider>().taxType, summary['tax']!),
                            if (summary['serviceFee']! > 0) row('Service Fee', summary['serviceFee']!),
                            if (summary['packagingFee']! > 0) row('Packaging Fee', summary['packagingFee']!),
                            if (_orderType == 'delivery') 
                              _isFetchingQuote 
                                ? Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text('Delivery Fee'), const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))])
                                : row('Delivery Fee', summary['deliveryFee']!),
                            row('Discount', summary['discount']!, isDiscount: true),
                            const Divider(height: 24),
                            row('Total', summary['total']!, bold: true),
                          ],
                        );
                      }),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))],
                  ),
                  child: SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _isPaymentValid ? const Color(0xFF10B981) : Colors.grey.shade400,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      onPressed: (!_isPaymentValid || _isGeneratingOrder) ? null : () {
                        setPaymentState(() => _isGeneratingOrder = true);
                        _placeOrder().then((_) {
                          setPaymentState(() => _isGeneratingOrder = false);
                        });
                      },
                      child: _isGeneratingOrder
                          ? const CircularProgressIndicator(color: Colors.white)
                          : Text('Charge \$${_calculateSummary(context.read<MenuProvider>())['total']!.toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                    ),
                  ),
                )
              ],
            ),
          );
        }
      ),
    );
  }

  void _showPaymentModal(String paymentUrl, String orderId) {
    final socket = SocketService();
    socket.on('order_status_changed', (data) {
        if (data['_id'] == orderId && (data['paymentStatus'] == 'paid' || data['status'] == 'accepted')) {
          Navigator.of(context).pop(); // Close QR modal
          Navigator.of(context).pop(); // Close Cart bottom sheet
          setState(() {
            _cartItems.clear();
            _nameController.clear();
            _phoneController.clear();
            _emailController.clear();
            _isNameTouched = false;
            _isPhoneTouched = false;
            _isEmailTouched = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Payment Successful! Order Accepted.'), backgroundColor: Colors.green),
          );
        }
      });

    int remainingSeconds = 600; // 10 minutes
    Timer? countdownTimer;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) {
          if (countdownTimer == null) {
            countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
              if (remainingSeconds > 0) {
                setState(() => remainingSeconds--);
              } else {
                timer.cancel();
                Navigator.of(ctx).pop();
                ScaffoldMessenger.of(ctx).showSnackBar(
                  const SnackBar(content: Text('Payment link expired. System will cancel automatically.'), backgroundColor: Colors.orange),
                );
              }
            });
          }

          final minutes = (remainingSeconds ~/ 60).toString().padLeft(2, '0');
          final seconds = (remainingSeconds % 60).toString().padLeft(2, '0');

          return Dialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('Waiting for Payment', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text('Have the customer scan the QR code to pay.', textAlign: TextAlign.center, style: GoogleFonts.inter(color: Colors.grey.shade600, fontSize: 14)),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: remainingSeconds <= 60 ? Colors.red.withOpacity(0.1) : Colors.orange.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20)
                    ),
                    child: Text('Expires in $minutes:$seconds', style: GoogleFonts.inter(
                      color: remainingSeconds <= 60 ? Colors.red : Colors.orange.shade800,
                      fontWeight: FontWeight.bold,
                      fontSize: 14
                    )),
                  ),
                  const SizedBox(height: 16),
                  QrImageView(
                    data: paymentUrl,
                    version: QrVersions.auto,
                    size: 200.0,
                    backgroundColor: Colors.white,
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF3F4F6), foregroundColor: Colors.black),
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: paymentUrl));
                          ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Link Copied!')));
                        },
                        icon: const Icon(Icons.copy, size: 16),
                        label: const Text('Copy'),
                      ),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF25D366), foregroundColor: Colors.white),
                        onPressed: () async {
                          final url = Uri.parse('https://wa.me/?text=${Uri.encodeComponent("Please pay for your order here: $paymentUrl")}');
                          if (await canLaunchUrl(url)) {
                            await launchUrl(url, mode: LaunchMode.externalApplication);
                          } else {
                            ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Could not open WhatsApp')));
                          }
                        },
                        icon: const Icon(Icons.chat, size: 16),
                        label: const Text('WhatsApp'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            countdownTimer?.cancel();
                            Navigator.of(ctx).pop(); // Close modal
                            Navigator.of(context).pop(); // Close bottom sheet
                            setState(() {
                              _cartItems.clear();
                              _nameController.clear();
                              _phoneController.clear();
                              _emailController.clear();
                              _isNameTouched = false;
                              _isPhoneTouched = false;
                              _isEmailTouched = false;
                            });
                            ScaffoldMessenger.of(ctx).showSnackBar(
                              const SnackBar(content: Text('Order running in background.'), backgroundColor: Colors.blue),
                            );
                          },
                          child: const Text('Hide'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextButton(
                          style: TextButton.styleFrom(foregroundColor: Colors.red),
                          onPressed: () {
                            countdownTimer?.cancel();
                            _cancelOrder(orderId);
                          },
                          child: const Text('Cancel Order'),
                        ),
                      ),
                    ],
                  )
                ],
              ),
            ),
          );
        }
      ),
    ).then((_) {
      countdownTimer?.cancel();
      socket.off('order_status_changed');
    });
  }

  // --- API Actions ---
  
  Future<void> _placeOrder() async {
    if (!_canCheckout) return;

    try {
      List<Map<String, dynamic>> orderItems = _cartItems.map((cartItem) {
        return {
          'menuItemId': cartItem.item.id,
          'name': cartItem.item.name,
          'quantity': cartItem.quantity,
          'price': cartItem.item.price, // Base price of item
          'selectedSize': cartItem.selectedSize != null ? {
            'name': cartItem.selectedSize!.name,
            'price': cartItem.selectedSize!.price
          } : null,
          'selectedAddOns': cartItem.selectedExtras.map((e) => {
            'name': e.name,
            'price': e.price
          }).toList(),
          'specialInstructions': cartItem.instructions,
        };
      }).toList();

      final menuProvider = context.read<MenuProvider>();
      
      final payload = {
        'restaurantId': menuProvider.restaurantId,
        'platform': 'in_store',
        'orderType': _orderType,
        'paymentMethod': _paymentMethod == 'card_terminal' ? 'credit_card' : _paymentMethod,
        'customerName': _nameController.text.trim(),
        'customerPhone': _fullPhoneNumber,
        'customerEmail': _emailController.text.trim(),
        if (_orderType == 'dine_in') 'tableNumber': _tableController.text.trim(),
        if (_orderType == 'delivery') 'address': _addressController.text.trim(),
        if (_orderType == 'delivery' && _addressLat != null) 'addressLat': _addressLat,
        if (_orderType == 'delivery' && _addressLng != null) 'addressLng': _addressLng,
        if (_appliedCouponCode.isNotEmpty) 'couponCode': _appliedCouponCode,
        'items': orderItems,
      };
      
      final total = _calculateSummary(menuProvider)['total']!;

      String? stripePaymentIntentId;

      if (_paymentMethod == 'card_terminal') {
        // Real Stripe Checkout via Payment Sheet
        final intentPayload = {
          ...payload,
          'amount': total.toStringAsFixed(2),
        };
        final intentRes = await ApiService.post('/api/payments/create-intent', intentPayload);
        final intentData = jsonDecode(intentRes.body);

        if (intentData['data'] == null && intentData['clientSecret'] == null) {
          throw Exception(intentData['message'] ?? 'Failed to initialize payment');
        }
        
        final pData = intentData['data'] ?? intentData;
        
        await Stripe.instance.initPaymentSheet(
          paymentSheetParameters: SetupPaymentSheetParameters(
            paymentIntentClientSecret: pData['clientSecret'],
            customerEphemeralKeySecret: pData['ephemeralKey'],
            customerId: pData['customerId'] ?? pData['customer'],
            merchantDisplayName: 'Lassi Lounge NY',
            appearance: const PaymentSheetAppearance(
              colors: PaymentSheetAppearanceColors(
                primary: Color(0xFF8B0000),
              ),
            ),
          )
        );

        await Stripe.instance.presentPaymentSheet();
        stripePaymentIntentId = pData['paymentIntentId'] ?? pData['paymentIntent'];
        
        // Add it to payload for order creation
        payload['stripePaymentIntentId'] = stripePaymentIntentId!;
      }

      final res = await ApiService.post('/api/orders', payload);
      final data = jsonDecode(res.body);

      if (data['success'] && data['data'] != null) {
        final orderId = data['data']['_id'];
        
        if (_paymentMethod == 'payment_link') {
          // Call payment API to generate Stripe link
          final linkPayload = {
            'orderId': orderId,
            'amount': total.toStringAsFixed(2),
            if (_emailController.text.trim().isNotEmpty) 'customerEmail': _emailController.text.trim(),
          };

          final linkRes = await ApiService.post('/api/payments/create-link', linkPayload);
          final linkData = jsonDecode(linkRes.body);
          
          final paymentUrl = linkData['data']?['url'] ?? linkData['url'];

          if (paymentUrl != null) {
            Navigator.of(context).pop(); // Close selection modal
            _showPaymentModal(paymentUrl, orderId);
          } else {
            throw Exception('Failed to generate payment URL');
          }
        } else {
          // Cash or Terminal
          Navigator.of(context).pop(); // Close selection modal
          setState(() {
            _cartItems.clear();
            _nameController.clear();
            _phoneController.clear();
            _emailController.clear();
            _tableController.clear();
            _addressController.clear();
            _couponController.clear();
            _appliedCouponCode = '';
            _couponDiscount = 0.0;
            _deliveryFee = 0.0;
            _addressLat = null;
            _addressLng = null;
            _deliveryQuoteError = null;
            _isNameTouched = false;
            _isPhoneTouched = false;
            _isEmailTouched = false;
          });
          toastification.show(
            context: context,
            title: const Text('Order Placed Successfully!'),
            type: ToastificationType.success,
            autoCloseDuration: const Duration(seconds: 4),
          );
        }
      } else {
        throw Exception(data['message'] ?? 'Unknown error');
      }
    } catch (e) {
      final errorStr = e.toString().toLowerCase();
      if ((e is StripeException && e.error.code == FailureCode.Canceled) || errorStr.contains('cancel')) {
        toastification.show(
          context: context,
          title: const Text('Payment Cancelled'),
          type: ToastificationType.info,
          autoCloseDuration: const Duration(seconds: 3),
        );
        return;
      }

      toastification.show(
        context: context,
        title: const Text('Failed to generate order'),
        description: Text(e.toString()),
        type: ToastificationType.error,
        autoCloseDuration: const Duration(seconds: 4),
      );
    }
  }

  Future<void> _cancelOrder(String orderId) async {
    try {
      await ApiService.put('/api/orders/$orderId/reject', {'reason': 'Cancelled at POS'});
      Navigator.of(context).pop(); // Close QR modal
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Order Cancelled'), backgroundColor: Colors.orange),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to cancel order: $e'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final menuProvider = context.watch<MenuProvider>();
    final categories = menuProvider.categories;
    
    final uiCategories = [
      CategoryModel(id: 'all', name: 'All', items: categories.expand((c) => c.items).toList())
    ];
    uiCategories.addAll(categories);

    final activeCat = uiCategories.firstWhere((c) => c.id == _activeCategoryId, orElse: () => uiCategories.first);
    final displayedItems = activeCat.items.where((item) => item.name.toLowerCase().contains(_searchQuery.toLowerCase())).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text('Point of Sale', style: GoogleFonts.inter(color: Colors.black, fontWeight: FontWeight.bold)),
      ),
      body: menuProvider.isLoading && !menuProvider.isInitialized
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: Column(
                children: [
                // Search bar
                Container(
                  color: Colors.white,
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                  child: TextField(
                    onChanged: (val) {
                      setState(() {
                        _searchQuery = val;
                        if (_searchQuery.isNotEmpty) {
                          _activeCategoryId = 'all';
                        }
                      });
                    },
                    decoration: InputDecoration(
                      hintText: 'Search items...',
                      hintStyle: GoogleFonts.inter(color: Colors.grey.shade500),
                      prefixIcon: Icon(Icons.search, color: Colors.grey.shade400),
                      filled: true,
                      fillColor: const Color(0xFFF3F4F6),
                      contentPadding: const EdgeInsets.symmetric(vertical: 0),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
                // Category tabs
                Container(
                  color: Colors.white,
                  height: 60,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    itemCount: uiCategories.length,
                    itemBuilder: (ctx, i) {
                      final cat = uiCategories[i];
                      final isActive = cat.id == _activeCategoryId;
                      return GestureDetector(
                        onTap: () => setState(() => _activeCategoryId = cat.id),
                        child: Container(
                          margin: const EdgeInsets.only(right: 12),
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                          decoration: BoxDecoration(
                            color: isActive ? const Color(0xFF111827) : const Color(0xFFF3F4F6),
                            borderRadius: BorderRadius.circular(30),
                          ),
                          child: Text(
                            cat.name,
                            style: GoogleFonts.inter(
                              color: isActive ? Colors.white : Colors.black87,
                              fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                // Items Grid
                Expanded(
                  child: GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      childAspectRatio: 0.8,
                    ),
                    itemCount: displayedItems.length,
                    itemBuilder: (ctx, i) {
                      final item = displayedItems[i];
                      // Find if this specific un-customized item is in cart
                      // (For customized items, they should use the modal to add more anyway)
                      final simpleItemIndex = _cartItems.indexWhere((it) => it.item.id == item.id && it.selectedSize == null && it.selectedExtras.isEmpty && it.instructions.isEmpty);
                      final qty = simpleItemIndex >= 0 ? _cartItems[simpleItemIndex].quantity : 0;
                      final hasCustomizations = item.sizeVariations.isNotEmpty || item.addOns.isNotEmpty;

                      return Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Expanded(
                              child: item.imageUrl != null && item.imageUrl!.isNotEmpty
                                  ? ClipRRect(
                                      borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                                      child: Image.network(item.imageUrl!, fit: BoxFit.cover),
                                    )
                                  : Container(
                                      decoration: const BoxDecoration(
                                        color: Color(0xFFF3F4F6),
                                        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                                      ),
                                      child: const Icon(Icons.fastfood, size: 40, color: Colors.grey),
                                    ),
                            ),
                            Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.name,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '\$${item.price.toStringAsFixed(2)}',
                                    style: GoogleFonts.inter(color: Colors.grey.shade600, fontSize: 14),
                                  ),
                                  const SizedBox(height: 8),
                                  (qty > 0 && !hasCustomizations)
                                      ? Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            GestureDetector(
                                              onTap: () => _decrementCartItem(simpleItemIndex),
                                              child: Container(
                                                padding: const EdgeInsets.all(4),
                                                decoration: BoxDecoration(color: Colors.red.shade100, shape: BoxShape.circle),
                                                child: const Icon(Icons.remove, size: 16, color: Colors.red),
                                              ),
                                            ),
                                            Text('$qty', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                                            GestureDetector(
                                              onTap: () => _incrementCartItem(simpleItemIndex),
                                              child: Container(
                                                padding: const EdgeInsets.all(4),
                                                decoration: BoxDecoration(color: Colors.green.shade100, shape: BoxShape.circle),
                                                child: const Icon(Icons.add, size: 16, color: Colors.green),
                                              ),
                                            ),
                                          ],
                                        )
                                      : SizedBox(
                                          width: double.infinity,
                                          height: 32,
                                          child: ElevatedButton(
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: Colors.black,
                                              padding: EdgeInsets.zero,
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                            ),
                                            onPressed: () => _handleItemTap(item),
                                            child: Text(hasCustomizations ? 'Customize' : 'Add to Cart', style: const TextStyle(fontSize: 12, color: Colors.white)),
                                          ),
                                        ),
                                ],
                              ),
                            )
                          ],
                        ),
                      );
                    },
                  ),
                ),
                // Persistent Cart Bar
                if (_cartItemCount > 0)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))],
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('$_cartItemCount Items', style: GoogleFonts.inter(color: Colors.grey.shade600, fontSize: 14)),
                              Text('\$${_cartTotal.toStringAsFixed(2)}', style: GoogleFonts.inter(fontWeight: FontWeight.w900, fontSize: 20)),
                            ],
                          ),
                        ),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          onPressed: _showCartBottomSheet,
                          child: Text('View Cart', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                        )
                      ],
                    ),
                  )
              ],
            ),
          ),
    );
  }
}





