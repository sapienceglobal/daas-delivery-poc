import 'package:go_router/go_router.dart';
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
import 'package:cached_network_image/cached_network_image.dart';

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
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  final Set<String> _favoriteItemIds = {};

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
    _searchController.dispose();
    _searchFocusNode.dispose();
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
    if (_orderType == 'delivery') {
      if (_fullPhoneNumber.isEmpty || !_isPhoneValid) return false;
    } else {
      if (_fullPhoneNumber.isEmpty && _emailController.text.isEmpty) return false;
      if (_fullPhoneNumber.isNotEmpty && !_isPhoneValid) return false;
    }
    
    if (_emailController.text.isNotEmpty && !_isEmailValid) return false;
    return true;
  }

  bool get _isPaymentValid {
    if (!_canCheckout) return false;
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

  void _incrementItem(MenuItemModel item) {
    setState(() {
      final lastIndex = _cartItems.lastIndexWhere((it) => it.item.id == item.id);
      if (lastIndex >= 0) {
        _cartItems[lastIndex].quantity++;
      } else {
        _addConfigurationToCart(CartItem(item: item));
      }
    });
  }

  void _decrementItem(MenuItemModel item) {
    setState(() {
      final lastIndex = _cartItems.lastIndexWhere((it) => it.item.id == item.id);
      if (lastIndex >= 0) {
        if (_cartItems[lastIndex].quantity > 1) {
          _cartItems[lastIndex].quantity--;
        } else {
          _cartItems.removeAt(lastIndex);
        }
      }
    });
  }

  bool _isItemCustomizable(MenuItemModel item) {
    return item.sizeVariations.isNotEmpty || item.addOns.isNotEmpty;
  }

  void _handleItemTap(MenuItemModel item) {
    if (_isItemCustomizable(item)) {
      _showCustomizationModal(item);
    } else {
      _addConfigurationToCart(CartItem(item: item));
    }
  }

  // --- UI Modals ---

  void _showCustomizationModal(MenuItemModel item) {
    // Strictly use real backend data from MongoDB - zero mock/fallback data
    final sizes = item.sizeVariations;
    final addons = item.addOns;

    ItemModifier? selectedSize = sizes.isNotEmpty ? sizes.first : null;
    final List<ItemModifier> selectedExtras = [];
    int modalQuantity = 1;
    final TextEditingController instructionsController = TextEditingController();

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
            return base * modalQuantity;
          }

          final existingInCart = _cartItems.where((it) => it.item.id == item.id).toList();

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
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      )
                    ],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.name,
                              style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold),
                            ),
                            if (item.description.trim().isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 2.0),
                                child: Text(
                                  item.description.trim(),
                                  style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade600),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                ),

                // Body
                Flexible(
                  child: ListView(
                    shrinkWrap: true,
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Active items already in cart for this dish
                      if (existingInCart.isNotEmpty) ...[
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF0FDF4),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFBBF7D0)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.shopping_bag_outlined, size: 16, color: Color(0xFF16A34A)),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Already in Current Order:',
                                    style: GoogleFonts.inter(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                      color: const Color(0xFF166534),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              ...existingInCart.map((cartItem) {
                                final cartIndex = _cartItems.indexOf(cartItem);
                                return Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 3),
                                  child: Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: Colors.white,
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border.all(color: const Color(0xFF86EFAC)),
                                        ),
                                        child: Text(
                                          cartItem.selectedSize?.name ?? 'Standard',
                                          style: GoogleFonts.inter(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color: const Color(0xFF166534),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          '\$${cartItem.unitPrice.toStringAsFixed(2)} × ${cartItem.quantity} = \$${cartItem.totalPrice.toStringAsFixed(2)}',
                                          style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF14532D)),
                                        ),
                                      ),
                                      GestureDetector(
                                        onTap: () {
                                          _decrementCartItem(cartIndex);
                                          setModalState(() {});
                                          setState(() {});
                                        },
                                        child: Container(
                                          width: 24,
                                          height: 24,
                                          decoration: const BoxDecoration(
                                            color: Color(0xFFFEE2E2),
                                            shape: BoxShape.circle,
                                          ),
                                          child: const Icon(Icons.remove, size: 14, color: Color(0xFFDC2626)),
                                        ),
                                      ),
                                      Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 8),
                                        child: Text('${cartItem.quantity}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13)),
                                      ),
                                      GestureDetector(
                                        onTap: () {
                                          _incrementCartItem(cartIndex);
                                          setModalState(() {});
                                          setState(() {});
                                        },
                                        child: Container(
                                          width: 24,
                                          height: 24,
                                          decoration: const BoxDecoration(
                                            color: Color(0xFFDCFCE7),
                                            shape: BoxShape.circle,
                                          ),
                                          child: const Icon(Icons.add, size: 14, color: Color(0xFF16A34A)),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }).toList(),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Choose Size (ONLY if sizes are present in backend)
                      if (sizes.isNotEmpty) ...[
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Choose Size',
                              style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFEF2F2),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                'Required',
                                style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF991B1B)),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        ...sizes.map((size) {
                          final isSelected = selectedSize?.name == size.name;
                          return GestureDetector(
                            onTap: () => setModalState(() => selectedSize = size),
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              decoration: BoxDecoration(
                                color: isSelected ? const Color(0xFFFEF2F2) : Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isSelected ? const Color(0xFF991B1B) : const Color(0xFFE2E8F0),
                                  width: isSelected ? 1.5 : 1,
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    isSelected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                                    color: isSelected ? const Color(0xFF991B1B) : Colors.grey.shade400,
                                    size: 20,
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      size.name,
                                      style: GoogleFonts.inter(
                                        fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                                        fontSize: 14,
                                        color: isSelected ? const Color(0xFF991B1B) : const Color(0xFF0F172A),
                                      ),
                                    ),
                                  ),
                                  Text(
                                    '\$${size.price.toStringAsFixed(2)}',
                                    style: GoogleFonts.inter(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                      color: isSelected ? const Color(0xFF991B1B) : const Color(0xFF334155),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }).toList(),
                        const SizedBox(height: 16),
                      ],

                      // Extras & Add-ons (ONLY if addons exist in backend)
                      if (addons.isNotEmpty) ...[
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Extras & Add-ons',
                              style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
                            ),
                            Text(
                              'Optional',
                              style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade500),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        ...addons.map((extra) {
                          final isSelected = selectedExtras.contains(extra);
                          return GestureDetector(
                            onTap: () {
                              setModalState(() {
                                if (isSelected) {
                                  selectedExtras.remove(extra);
                                } else {
                                  selectedExtras.add(extra);
                                }
                              });
                            },
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              decoration: BoxDecoration(
                                color: isSelected ? const Color(0xFFFEF2F2) : Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isSelected ? const Color(0xFF991B1B) : const Color(0xFFE2E8F0),
                                  width: isSelected ? 1.5 : 1,
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    isSelected ? Icons.check_box : Icons.check_box_outline_blank,
                                    color: isSelected ? const Color(0xFF991B1B) : Colors.grey.shade400,
                                    size: 20,
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      extra.name,
                                      style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14),
                                    ),
                                  ),
                                  Text(
                                    '+\$${extra.price.toStringAsFixed(2)}',
                                    style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14, color: const Color(0xFF991B1B)),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }).toList(),
                        const SizedBox(height: 16),
                      ],

                      Text(
                        'Special Instructions',
                        style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: instructionsController,
                        maxLines: 2,
                        decoration: InputDecoration(
                          hintText: 'E.g. Less sugar, extra ice, no onions...',
                          hintStyle: GoogleFonts.inter(fontSize: 13, color: Colors.grey.shade400),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF991B1B), width: 1.5)),
                        ),
                      ),
                    ],
                  ),
                ),

                // Footer with Quantity Stepper & Add Button
                Container(
                  padding: EdgeInsets.fromLTRB(16, 12, 16, 12 + MediaQuery.paddingOf(context).bottom),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 10, offset: const Offset(0, -4)),
                    ],
                  ),
                  child: Row(
                    children: [
                      // Quantity Stepper
                      Container(
                        height: 48,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove, size: 18),
                              onPressed: () {
                                if (modalQuantity > 1) {
                                  setModalState(() => modalQuantity--);
                                }
                              },
                            ),
                            Text(
                              '$modalQuantity',
                              style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            IconButton(
                              icon: const Icon(Icons.add, size: 18),
                              onPressed: () {
                                setModalState(() => modalQuantity++);
                              },
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),

                      // Add to Cart Button
                      Expanded(
                        child: SizedBox(
                          height: 48,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF991B1B),
                              elevation: 0,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            ),
                            onPressed: () {
                              _addConfigurationToCart(CartItem(
                                item: item,
                                quantity: modalQuantity,
                                selectedSize: selectedSize,
                                selectedExtras: List.from(selectedExtras),
                                instructions: instructionsController.text.trim(),
                              ));
                              Navigator.pop(ctx);
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    'Added $modalQuantity× ${item.name}${selectedSize != null ? ' (${selectedSize!.name})' : ''} to order',
                                    style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                                  ),
                                  backgroundColor: const Color(0xFF16A34A),
                                  duration: const Duration(milliseconds: 1500),
                                ),
                              );
                            },
                            child: Text(
                              'Add to Cart - \$${calculatePreviewTotal().toStringAsFixed(2)}',
                              style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
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
                          labelText: 'Phone (Required if no email)',
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
                          labelText: 'Email (Required if no phone)',
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
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12.0),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Text(
                                              cartItem.item.name,
                                              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14.5, color: const Color(0xFF0F172A)),
                                            ),
                                          ),
                                          if (cartItem.selectedSize != null)
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFFEF2F2),
                                                borderRadius: BorderRadius.circular(6),
                                                border: Border.all(color: const Color(0xFFFECDD3)),
                                              ),
                                              child: Text(
                                                cartItem.selectedSize!.name,
                                                style: GoogleFonts.inter(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.bold,
                                                  color: const Color(0xFF991B1B),
                                                ),
                                              ),
                                            ),
                                        ],
                                      ),
                                      
                                      // Customizations Text
                                      if (cartItem.selectedExtras.isNotEmpty)
                                        Padding(
                                          padding: const EdgeInsets.only(top: 4.0),
                                          child: Text(
                                            '+ ${cartItem.selectedExtras.map((e) => e.name).join(', ')}',
                                            style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade600),
                                          ),
                                        ),
                                      if (cartItem.instructions.isNotEmpty)
                                        Padding(
                                          padding: const EdgeInsets.only(top: 2.0),
                                          child: Text(
                                            'Note: ${cartItem.instructions}',
                                            style: GoogleFonts.inter(fontSize: 11, fontStyle: FontStyle.italic, color: Colors.grey.shade500),
                                          ),
                                        ),
                                        
                                      const SizedBox(height: 6),
                                      Text(
                                        '\$${cartItem.unitPrice.toStringAsFixed(2)} × ${cartItem.quantity} = \$${cartItem.totalPrice.toStringAsFixed(2)}',
                                        style: GoogleFonts.inter(color: const Color(0xFF991B1B), fontWeight: FontWeight.bold, fontSize: 13),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    GestureDetector(
                                      onTap: () {
                                        _decrementCartItem(i);
                                        setModalState(() {});
                                      },
                                      child: Container(
                                        width: 28,
                                        height: 28,
                                        decoration: const BoxDecoration(
                                          color: Color(0xFFFEE2E2),
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(Icons.remove, size: 15, color: Color(0xFFDC2626)),
                                      ),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 8),
                                      child: Text(
                                        '${cartItem.quantity}',
                                        style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                    GestureDetector(
                                      onTap: () {
                                        _incrementCartItem(i);
                                        setModalState(() {});
                                      },
                                      child: Container(
                                        width: 28,
                                        height: 28,
                                        decoration: const BoxDecoration(
                                          color: Color(0xFFDCFCE7),
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(Icons.add, size: 15, color: Color(0xFF16A34A)),
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    GestureDetector(
                                      onTap: () {
                                        setState(() {
                                          _cartItems.removeAt(i);
                                        });
                                        setModalState(() {});
                                      },
                                      child: Container(
                                        width: 28,
                                        height: 28,
                                        decoration: BoxDecoration(
                                          color: Colors.grey.shade100,
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(Icons.delete_outline_rounded, size: 16, color: Colors.grey.shade600),
                                      ),
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
                      if (_orderType == 'delivery' && (_fullPhoneNumber.isEmpty || !_isPhoneValid)) ...[
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.red.shade200)),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Icon(Icons.error_outline, color: Colors.red.shade700, size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text('Phone number is required for delivery. Please close this sheet and add it to customer info.', style: GoogleFonts.inter(color: Colors.red.shade700, fontSize: 13, fontWeight: FontWeight.w600)),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
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
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFF3F4F6), 
                            foregroundColor: Colors.black,
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
                          ),
                          onPressed: () {
                            Clipboard.setData(ClipboardData(text: paymentUrl));
                            ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Link Copied!')));
                          },
                          icon: const Icon(Icons.copy, size: 16),
                          label: const Text('Copy', overflow: TextOverflow.ellipsis, maxLines: 1),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Opacity(
                          opacity: (_fullPhoneNumber.trim().isEmpty || _fullPhoneNumber.trim() == '0000000000') ? 0.4 : 1.0,
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF25D366), 
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
                              disabledBackgroundColor: const Color(0xFF25D366).withOpacity(0.5),
                              disabledForegroundColor: Colors.white,
                            ),
                            onPressed: (_fullPhoneNumber.trim().isEmpty || _fullPhoneNumber.trim() == '0000000000') ? null : () async {
                              final qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${Uri.encodeComponent(paymentUrl)}';
                              final message = 'Hi! 👋\n\nPlease complete the payment for your order.\n\n🔗 *Click here to pay:* \n$paymentUrl\n\n📷 *Or scan this QR code:* \n$qrUrl\n\nThank you!';
                              final rawPhone = _fullPhoneNumber.trim();
                              
                              // Strip everything except digits for international format
                              final digits = rawPhone.replaceAll(RegExp(r'[^\d]'), '');
                              // If 10 digits (US without country code), prepend 1
                              final intlPhone = digits.length == 10 ? '1$digits' : digits;
                              final waUrl = 'https://wa.me/$intlPhone?text=${Uri.encodeComponent(message)}';
                              
                              final url = Uri.parse(waUrl);
                              if (await canLaunchUrl(url)) {
                                await launchUrl(url, mode: LaunchMode.externalApplication);
                              } else {
                                ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Could not open WhatsApp')));
                              }
                            },
                            icon: const Icon(Icons.chat, size: 16),
                            label: const Text('WhatsApp', overflow: TextOverflow.ellipsis, maxLines: 1),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.blue.shade100)),
                    child: Text('Note: If you want to change the payment method or check status, go to the Live Orders page.', textAlign: TextAlign.center, style: GoogleFonts.inter(color: Colors.blue.shade800, fontSize: 12, fontWeight: FontWeight.w500)),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF111827),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () {
                        countdownTimer?.cancel();
                        socket.off('order_status_changed');
                        Navigator.of(ctx).pop();
                        Navigator.of(context).pop();
                        context.go('/live-orders');
                      },
                      child: Text('Go to Live Orders', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(height: 12),
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
          'price': cartItem.unitPrice,
          'selectedSize': cartItem.selectedSize != null ? {
            'name': cartItem.selectedSize!.name,
            'price': cartItem.selectedSize!.price
          } : null,
          'addOns': cartItem.selectedExtras.map((e) => {
            'name': e.name,
            'price': e.price
          }).toList(),
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

  String _getDishDescription(MenuItemModel item) {
    return item.description;
  }

  IconData _getCategoryIcon(String catName) {
    final lower = catName.toLowerCase();
    if (lower == 'all') return Icons.grid_view_rounded;
    if (lower.contains('beverag') || lower.contains('drink') || lower.contains('lassi') || lower.contains('juice') || lower.contains('shake') || lower.contains('tea') || lower.contains('chai') || lower.contains('coffee')) {
      return Icons.local_drink_rounded;
    }
    if (lower.contains('veg starter') || lower.contains('starter') || lower.contains('salad') || lower.contains('veg')) {
      return Icons.eco_rounded;
    }
    if (lower.contains('non veg') || lower.contains('chicken') || lower.contains('meat') || lower.contains('tandoor') || lower.contains('grill')) {
      return Icons.kebab_dining_rounded;
    }
    if (lower.contains('main') || lower.contains('curry') || lower.contains('gravy') || lower.contains('biryani') || lower.contains('rice') || lower.contains('thali')) {
      return Icons.dinner_dining_rounded;
    }
    if (lower.contains('dessert') || lower.contains('sweet') || lower.contains('ice cream') || lower.contains('kulfi')) {
      return Icons.icecream_rounded;
    }
    if (lower.contains('bread') || lower.contains('naan') || lower.contains('roti')) {
      return Icons.bakery_dining_rounded;
    }
    return Icons.restaurant_menu_rounded;
  }

  Color _getCategoryColor(String catName) {
    final lower = catName.toLowerCase();
    if (lower == 'all') return const Color(0xFF991B1B);
    if (lower.contains('beverag') || lower.contains('drink') || lower.contains('lassi')) {
      return const Color(0xFFEF4444);
    }
    if (lower.contains('veg')) {
      return const Color(0xFF16A34A);
    }
    if (lower.contains('non veg') || lower.contains('chicken')) {
      return const Color(0xFFDC2626);
    }
    if (lower.contains('main') || lower.contains('curry')) {
      return const Color(0xFFD97706);
    }
    if (lower.contains('dessert')) {
      return const Color(0xFFEC4899);
    }
    return const Color(0xFF881337);
  }

  @override
  Widget build(BuildContext context) {
    final menuProvider = context.watch<MenuProvider>();
    final rawCategories = menuProvider.categories;

    if (menuProvider.isLoading && rawCategories.isEmpty) {
      return Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A), size: 22),
            onPressed: () => Navigator.pop(context),
          ),
          title: Text(
            'Create Order',
            style: GoogleFonts.inter(
              color: const Color(0xFF0F172A),
              fontWeight: FontWeight.w800,
              fontSize: 20,
            ),
          ),
        ),
        body: const Center(
          child: CircularProgressIndicator(color: Color(0xFF991B1B)),
        ),
      );
    }

    final uiCategories = [
      CategoryModel(
        id: 'all',
        name: 'All',
        items: rawCategories.expand((c) => c.items).toList(),
      )
    ];
    uiCategories.addAll(rawCategories);

    final activeCat = uiCategories.firstWhere((c) => c.id == _activeCategoryId, orElse: () => uiCategories.first);
    final displayedItems = activeCat.items.where((item) => item.name.toLowerCase().contains(_searchQuery.toLowerCase())).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A), size: 22),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Create Order',
          style: GoogleFonts.inter(
            color: const Color(0xFF0F172A),
            fontWeight: FontWeight.w800,
            fontSize: 20,
          ),
        ),
        actions: [
          // Search icon button
          Container(
            margin: const EdgeInsets.only(right: 14),
            width: 38,
            height: 38,
            decoration: const BoxDecoration(
              color: Color(0xFFF1F5F9),
              shape: BoxShape.circle,
            ),
            child: IconButton(
              padding: EdgeInsets.zero,
              icon: const Icon(Icons.search_rounded, color: Color(0xFF334155), size: 20),
              onPressed: () {
                _searchFocusNode.requestFocus();
              },
            ),
          ),
        ],
      ),
      body: menuProvider.isLoading && !menuProvider.isInitialized
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              bottom: false,
              child: Column(
                children: [
                  // Search Bar
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 10),
                    child: TextField(
                      focusNode: _searchFocusNode,
                      controller: _searchController,
                      onChanged: (val) {
                        setState(() {
                          _searchQuery = val;
                          if (_searchQuery.isNotEmpty) {
                            _activeCategoryId = 'all';
                          }
                        });
                      },
                      style: GoogleFonts.inter(fontSize: 13.5, color: const Color(0xFF0F172A)),
                      decoration: InputDecoration(
                        hintText: 'Search for dishes, e.g. Biryani, Naan, Butter Chicken...',
                        hintStyle: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8), fontWeight: FontWeight.w400),
                        prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF94A3B8), size: 20),
                        suffixIcon: _searchQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear_rounded, size: 18, color: Color(0xFF94A3B8)),
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() => _searchQuery = '');
                                },
                              )
                            : null,
                        filled: true,
                        fillColor: const Color(0xFFF1F5F9),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: const BorderSide(color: Color(0xFF991B1B), width: 1.5),
                        ),
                      ),
                    ),
                  ),

                  // Category Tabs
                  Container(
                    color: Colors.white,
                    height: 52,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: uiCategories.length,
                      itemBuilder: (ctx, i) {
                        final cat = uiCategories[i];
                        final isActive = cat.id == _activeCategoryId;
                        final icon = _getCategoryIcon(cat.name);
                        final iconColor = _getCategoryColor(cat.name);

                        return GestureDetector(
                          onTap: () => setState(() => _activeCategoryId = cat.id),
                          child: Container(
                            margin: const EdgeInsets.only(right: 10),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6.5),
                                  decoration: BoxDecoration(
                                    color: isActive ? const Color(0xFF991B1B) : const Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                      color: isActive ? const Color(0xFF991B1B) : const Color(0xFFE2E8F0),
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        icon,
                                        size: 15,
                                        color: isActive ? Colors.white : iconColor,
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        cat.name,
                                        style: GoogleFonts.inter(
                                          color: isActive ? Colors.white : const Color(0xFF334155),
                                          fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                                          fontSize: 12.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (isActive) ...[
                                  const SizedBox(height: 3),
                                  Container(
                                    width: 28,
                                    height: 3,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF991B1B),
                                      borderRadius: BorderRadius.circular(2),
                                    ),
                                  ),
                                ] else ...[
                                  const SizedBox(height: 6),
                                ],
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),

                  // Food Items Grid
                  Expanded(
                    child: displayedItems.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.search_off_rounded, size: 52, color: Colors.grey.shade400),
                                const SizedBox(height: 12),
                                Text(
                                  'No dishes found',
                                  style: GoogleFonts.inter(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF64748B),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Try searching with a different term',
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    color: const Color(0xFF94A3B8),
                                  ),
                                ),
                              ],
                            ),
                          )
                        : LayoutBuilder(
                            builder: (ctx, constraints) {
                              final availableWidth = constraints.maxWidth;
                              final textScale = MediaQuery.textScalerOf(ctx).scale(1.0).clamp(1.0, 1.3);

                              // Responsive crossAxisCount based on screen width:
                              // Phones (< 600): 2 columns
                              // Tablets (600 - 899): 3 columns
                              // Large screens (>= 900): 4 columns
                              final crossAxisCount = availableWidth >= 900 ? 4 : (availableWidth >= 600 ? 3 : 2);
                              const spacing = 12.0;
                              const padding = 16.0;
                              final itemWidth = (availableWidth - (padding * 2) - ((crossAxisCount - 1) * spacing)) / crossAxisCount;

                              // Responsive image height proportional to card width
                              final imageHeight = (itemWidth * 0.65).clamp(100.0, 135.0);

                              // Content area height (title + price + button + paddings) dynamically adapts to font scale
                              final contentHeight = (126.0 * textScale).clamp(126.0, 155.0);
                              final totalHeight = imageHeight + contentHeight;
                              final childAspectRatio = itemWidth / totalHeight;

                              return GridView.builder(
                                padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: crossAxisCount,
                                  crossAxisSpacing: spacing,
                                  mainAxisSpacing: 14,
                                  childAspectRatio: childAspectRatio,
                                ),
                                itemCount: displayedItems.length,
                                itemBuilder: (ctx, i) {
                                  final item = displayedItems[i];
                                  return _buildFoodCard(item, imageHeight: imageHeight);
                                },
                              );
                            },
                          ),
                  ),

                  // Persistent Cart Bar
                  if (_cartItemCount > 0) _buildPersistentCartBar(),
                ],
              ),
            ),
    );
  }

  Widget _buildFoodCard(MenuItemModel item, {double? imageHeight}) {
    final isFav = _favoriteItemIds.contains(item.id);
    final desc = _getDishDescription(item).trim();

    return GestureDetector(
      onTap: () => _handleItemTap(item),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Image with top-left favorite & top-right veg/non-veg badge
            SizedBox(
              height: imageHeight ?? 125,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                    child: _buildPosItemImage(item),
                  ),
                  // Top Left: Favorite / Heart button
                  Positioned(
                    top: 8,
                    left: 8,
                    child: GestureDetector(
                      onTap: () {
                        setState(() {
                          if (isFav) {
                            _favoriteItemIds.remove(item.id);
                          } else {
                            _favoriteItemIds.add(item.id);
                          }
                        });
                      },
                      child: Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.25),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          isFav ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                          color: isFav ? Colors.red : Colors.white,
                          size: 16,
                        ),
                      ),
                    ),
                  ),
                  // Top Right: Veg / Non-Veg badge
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      width: 18,
                      height: 18,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(
                          color: item.isVeg ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                          width: 1.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 2,
                          ),
                        ],
                      ),
                      child: Center(
                        child: Container(
                          width: 7,
                          height: 7,
                          decoration: BoxDecoration(
                            color: item.isVeg ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // Item info & action button (Expanded to fill card, spaceBetween pins button cleanly to bottom)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            item.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.bold,
                              fontSize: 13.0,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '\$${item.price.toStringAsFixed(2)}',
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.w700,
                              fontSize: 12.5,
                              color: const Color(0xFF991B1B),
                            ),
                          ),
                          if (desc.isNotEmpty) ...[
                            const SizedBox(height: 1),
                            Text(
                              desc,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.inter(
                                fontSize: 9.5,
                                color: const Color(0xFF64748B),
                                height: 1.15,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 4),
                    _buildItemAction(item),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildItemAction(MenuItemModel item) {
    final totalItemQty = _cartItems.where((it) => it.item.id == item.id).fold(0, (sum, it) => sum + it.quantity);
    final hasCustomizations = _isItemCustomizable(item);

    if (totalItemQty == 0) {
      return SizedBox(
        width: double.infinity,
        height: 34,
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF991B1B),
            foregroundColor: Colors.white,
            elevation: 0,
            padding: const EdgeInsets.symmetric(horizontal: 4),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
          onPressed: () => _handleItemTap(item),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(hasCustomizations ? Icons.tune_rounded : Icons.shopping_cart_outlined, size: 14, color: Colors.white),
              const SizedBox(width: 5),
              Flexible(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    hasCustomizations ? 'Customize' : 'Add to Cart',
                    maxLines: 1,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (hasCustomizations) {
      return SizedBox(
        height: 34,
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFFECDD3)),
              ),
              child: FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  '$totalItemQty in cart',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF991B1B),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 4),
            Expanded(
              child: SizedBox(
                height: 34,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF991B1B),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(horizontal: 2),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: () => _showCustomizationModal(item),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.add_rounded, size: 13, color: Colors.white),
                      const SizedBox(width: 2),
                      Flexible(
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text(
                            'Add / Sizes',
                            maxLines: 1,
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    return SizedBox(
      height: 34,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          GestureDetector(
            onTap: () => _decrementItem(item),
            child: Container(
              width: 28,
              height: 28,
              decoration: const BoxDecoration(
                color: Color(0xFFFEE2E2),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.remove_rounded, size: 15, color: Color(0xFFDC2626)),
            ),
          ),
          SizedBox(
            width: 32,
            child: Center(
              child: Text(
                '$totalItemQty',
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  color: const Color(0xFF0F172A),
                ),
              ),
            ),
          ),
          GestureDetector(
            onTap: () => _incrementItem(item),
            child: Container(
              width: 28,
              height: 28,
              decoration: const BoxDecoration(
                color: Color(0xFFDCFCE7),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.add_rounded, size: 15, color: Color(0xFF16A34A)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCartThumbPreview(MenuItemModel item) {
    if (item.imageUrl != null &&
        item.imageUrl!.isNotEmpty &&
        item.imageUrl!.startsWith('http') &&
        !item.imageUrl!.contains('localhost')) {
      return CachedNetworkImage(
        imageUrl: item.imageUrl!,
        fit: BoxFit.cover,
        width: 44,
        height: 44,
        errorWidget: (_, __, ___) => _buildPosItemFallback(item),
      );
    }
    return _buildPosItemFallback(item);
  }

  Widget _buildPersistentCartBar() {
    final lastItem = _cartItems.isNotEmpty ? _cartItems.last.item : null;
    final bottomInset = MediaQuery.paddingOf(context).bottom;

    return Container(
      padding: EdgeInsets.fromLTRB(16, 8, 16, 8 + bottomInset),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(22)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Top handle indicator
          Container(
            margin: const EdgeInsets.only(bottom: 8),
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: const Color(0xFFE2E8F0),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Row(
            children: [
              if (lastItem != null) ...[
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: _buildCartThumbPreview(lastItem),
                      ),
                    ),
                    Positioned(
                      top: -4,
                      right: -4,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                        constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                        decoration: const BoxDecoration(
                          color: Color(0xFF991B1B),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            '$_cartItemCount',
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 12),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '$_cartItemCount ${_cartItemCount == 1 ? "Item" : "Items"}',
                      style: GoogleFonts.inter(
                        color: const Color(0xFF64748B),
                        fontSize: 12.5,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Text(
                      '\$${_cartTotal.toStringAsFixed(2)}',
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.w800,
                        fontSize: 18,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF991B1B),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: _showCartBottomSheet,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.shopping_cart_outlined, size: 17, color: Colors.white),
                    const SizedBox(width: 6),
                    Text(
                      'View Cart',
                      style: GoogleFonts.inter(
                        fontSize: 13.5,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(Icons.chevron_right_rounded, size: 18, color: Colors.white),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPosItemImage(MenuItemModel item) {
    if (item.imageUrl != null &&
        item.imageUrl!.isNotEmpty &&
        item.imageUrl!.startsWith('http') &&
        !item.imageUrl!.contains('localhost')) {
      return CachedNetworkImage(
        imageUrl: item.imageUrl!,
        fit: BoxFit.cover,
        width: double.infinity,
        height: double.infinity,
        placeholder: (_, __) => Container(
          color: const Color(0xFFF1F5F9),
          child: const Center(
            child: SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF991B1B)),
            ),
          ),
        ),
        errorWidget: (_, __, ___) => _buildPosItemFallback(item),
      );
    }
    return _buildPosItemFallback(item);
  }

  Widget _buildPosItemFallback(MenuItemModel item) {
    final lower = item.name.toLowerCase();
    String? localAsset;
    if (item.imageUrl != null && item.imageUrl!.isNotEmpty && item.imageUrl!.startsWith('assets/')) {
      localAsset = item.imageUrl;
    } else if (lower.contains('kesar') || (lower.contains('badam') && lower.contains('milk'))) {
      localAsset = 'assets/images/branded/lassi-lounge/dishes/kesar-badam-milk.jpg';
    } else if (lower.contains('mango') && lower.contains('lassi')) {
      localAsset = 'assets/images/branded/lassi-lounge/dishes/mango-lassi.jpg';
    } else if (lower.contains('sweet') && lower.contains('lassi')) {
      localAsset = 'assets/images/branded/lassi-lounge/dishes/sweet-lassi.jpg';
    } else if (lower.contains('salt') && lower.contains('lassi')) {
      localAsset = 'assets/images/branded/lassi-lounge/dishes/salt-lassi.jpg';
    } else if (lower.contains('chai') || lower.contains('tea')) {
      localAsset = 'assets/images/branded/lassi-lounge/dishes/masala-chai.jpg';
    } else if (lower.contains('lassi')) {
      localAsset = 'assets/images/branded/lassi-lounge/dishes/mango-lassi.jpg';
    } else if (lower.contains('butter') && lower.contains('chicken')) {
      localAsset = 'assets/images/branded/lassi-lounge/dishes/butter-chicken.jpg';
    } else if (lower.contains('chicken') && lower.contains('tikka')) {
      localAsset = 'assets/images/branded/lassi-lounge/dishes/paneer-tikka.jpg';
    } else if (lower.contains('tandoori') || lower.contains('grill') || lower.contains('salmon')) {
      localAsset = 'assets/images/branded/lassi-lounge/dishes/paneer-tikka.jpg';
    } else if (lower.contains('biryani')) {
      localAsset = 'assets/images/branded/lassi-lounge/dishes/chicken-biryani.jpg';
    } else if (lower.contains('dal') || lower.contains('makhani')) {
      localAsset = 'assets/images/branded/lassi-lounge/dishes/dal-makhani.jpg';
    } else if (lower.contains('lamb') || lower.contains('rogan')) {
      localAsset = 'assets/images/branded/lassi-lounge/dishes/lamb-rogan-josh.jpg';
    } else if (lower.contains('paneer')) {
      localAsset = 'assets/images/branded/lassi-lounge/dishes/paneer-tikka.jpg';
    } else if (lower.contains('spring') && lower.contains('roll')) {
      localAsset = 'assets/images/branded/lassi-lounge/dishes/veg-spring-rolls.png';
    }

    if (localAsset != null) {
      return Image.asset(
        localAsset,
        fit: BoxFit.cover,
        width: double.infinity,
        height: double.infinity,
        errorBuilder: (_, __, ___) => _buildGenericFoodPlaceholder(item),
      );
    }

    return _buildGenericFoodPlaceholder(item);
  }

  Widget _buildGenericFoodPlaceholder(MenuItemModel item) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFFFF7ED), Color(0xFFFFEDD5)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              _getCategoryIcon(item.name),
              size: 34,
              color: const Color(0xFFEA580C),
            ),
            const SizedBox(height: 4),
            Text(
              'Lassi Lounge',
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF9A3412),
              ),
            ),
          ],
        ),
      ),
    );
  }
}





