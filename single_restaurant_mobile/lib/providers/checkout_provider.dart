import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:single_restaurant_mobile/services/order_service.dart';
import 'package:single_restaurant_mobile/services/coupon_service.dart';
import 'package:single_restaurant_mobile/services/location_service.dart';
import 'package:single_restaurant_mobile/services/payment_service.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/address_provider.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'dart:async';

class CheckoutProvider with ChangeNotifier {
  final OrderService _orderService = OrderService();
  final CouponService _couponService = CouponService();
  final LocationService _locationService = LocationService();
  final PaymentService _paymentService = PaymentService();

  int _step = 1;

  bool _isDelivery = true;
  String _addressLine1 = '';
  String _addressLine2 = '';
  String _addressLabel = 'Home';
  String _city = '';
  String _state = 'NY';
  String _zipCode = '';
  double? _addressLat;
  double? _addressLng;
  bool _addressVerified = false;

  // User Details
  String _fullName = '';
  String _phone = '';
  String _email = '';

  // Order Details
  String _deliveryInstructions = '';
  double _tip = 0.0;
  String _paymentMethod = 'credit_card';

  // Coupon & Quotes
  String _couponCode = '';
  double _couponDiscount = 0.0;
  bool _couponApplied = false;
  bool _couponLoading = false;
  List<String> _allowedPaymentMethods = ['All'];
  
  bool _useLoyaltyPoints = false;

  Map<String, dynamic>? _deliveryQuote;
  String? _quoteError;
  bool _quoteLoading = false;
  
  Map<String, dynamic>? _etaData;
  bool _etaLoading = false;
  bool _etaErrorFlag = false;
  bool _isLocationLoading = false;
  
  bool _isPlacingOrder = false;
  
  Timer? _addressDebounce;

  // Getters
  int get step => _step;
  bool get isDelivery => _isDelivery;
  String get addressLine1 => _addressLine1;
  String get addressLine2 => _addressLine2;
  String get addressLabel => _addressLabel;
  String get city => _city;
  String get state => _state;
  String get zipCode => _zipCode;
  String get fullName => _fullName;
  String get phone => _phone;
  String get email => _email;
  String get deliveryInstructions => _deliveryInstructions;
  double get tip => _tip;
  String get paymentMethod => _paymentMethod;
  String get couponCode => _couponCode;
  double get couponDiscount => _couponDiscount;
  bool get couponApplied => _couponApplied;
  bool get couponLoading => _couponLoading;
  List<String> get allowedPaymentMethods => _allowedPaymentMethods;

  String? get couponPaymentError {
    if (!_couponApplied) return null;
    if (_allowedPaymentMethods.isEmpty || _allowedPaymentMethods.contains('All')) return null;
    
    final methods = _allowedPaymentMethods.map((m) => m.toLowerCase().replaceAll('_', ' ')).toList();
    final current = _paymentMethod.toLowerCase().replaceAll('_', ' ');
    final normalizedCurrent = (current == 'saved card 4242' || current.startsWith('pm ') || current.startsWith('card ')) ? 'credit card' : current;

    if (!methods.contains(normalizedCurrent)) {
      return 'This offer is only valid with: ${_allowedPaymentMethods.join(', ')}';
    }
    return null;
  }

  bool get useLoyaltyPoints => _useLoyaltyPoints;
  Map<String, dynamic>? get deliveryQuote => _deliveryQuote;
  String? get quoteError => _quoteError;
  bool get quoteLoading => _quoteLoading;
  
  Map<String, dynamic>? get etaData => _etaData;
  bool get etaLoading => _etaLoading;
  bool get etaErrorFlag => _etaErrorFlag;
  bool get isLocationLoading => _isLocationLoading;
  bool get isPlacingOrder => _isPlacingOrder;
  bool get addressVerified => _addressVerified;

  String get compiledAddress {
    if (_addressLine1.trim().isEmpty) return '';
    String base = _addressLine1.trim();
    if (_addressLine2.trim().isNotEmpty) {
      base += ', ${_addressLine2.trim()}';
    }
    String cityStr = _city.trim().isNotEmpty ? ', ${_city.trim()}' : '';
    String stateStr = _state.trim().isNotEmpty ? ', ${_state.trim()}' : '';
    String zipStr = _zipCode.trim().isNotEmpty ? ' ${_zipCode.trim()}' : '';
    return '$base$cityStr$stateStr$zipStr';
  }

  void setStep(int val) {
    _step = val;
    notifyListeners();
  }

  /// Resets all checkout state. Call this on logout or after order completion.
  void reset() {
    _step = 1;
    _isDelivery = true;
    _addressLine1 = '';
    _addressLine2 = '';
    _addressLabel = 'Home';
    _city = '';
    _state = 'NY';
    _zipCode = '';
    _addressLat = null;
    _addressLng = null;
    _addressVerified = false;
    _fullName = '';
    _phone = '';
    _email = '';
    _deliveryInstructions = '';
    _tip = 0.0;
    _paymentMethod = 'credit_card';
    _couponCode = '';
    _couponDiscount = 0.0;
    _couponApplied = false;
    _couponLoading = false;
    _allowedPaymentMethods = ['All'];
    _useLoyaltyPoints = false;
    _deliveryQuote = null;
    _quoteError = null;
    _quoteLoading = false;
    _etaData = null;
    _etaLoading = false;
    _etaErrorFlag = false;
    _isPlacingOrder = false;
    _addressDebounce?.cancel();
    notifyListeners();
  }

  void setDelivery(bool val, CartProvider cart) {
    _isDelivery = val;
    if (val) {
      fetchQuoteIfNeeded(cart);
    } else {
      _deliveryQuote = null;
      _quoteError = null;
    }
    notifyListeners();
  }

  void setUserDetails(String name, String phoneStr, String emailStr) {
    _fullName = name;
    _phone = phoneStr;
    _email = emailStr;
    notifyListeners();
  }

  void setTip(double val) {
    _tip = val;
    notifyListeners();
  }

  void toggleLoyaltyPoints(bool val) {
    _useLoyaltyPoints = val;
    notifyListeners();
  }

  void setCouponCode(String code) {
    _couponCode = code;
    _couponApplied = false;
    _couponDiscount = 0.0;
    notifyListeners();
  }

  void autoSelectDefaultAddress(AddressProvider addressProvider, CartProvider cart) {
    if (addressProvider.addresses.isEmpty) return;
    // Find the address marked as default; fall back to the first one
    final defaultAddr = addressProvider.addresses.firstWhere(
      (a) => a['isDefault'] == true,
      orElse: () => addressProvider.addresses.first,
    );
    // Always apply the saved default address so cart always shows it pre-selected
    handleSelectSavedAddress(defaultAddr, cart);
  }

  void _onAddressChanged(CartProvider cart) {
    if (_addressDebounce?.isActive ?? false) _addressDebounce!.cancel();
    _addressDebounce = Timer(const Duration(milliseconds: 1500), () {
      if (_isDelivery && _addressLine1.trim().isNotEmpty) {
        fetchQuoteIfNeeded(cart);
      }
    });
  }

  void setAddressLine1(String val, CartProvider cart) {
    _addressLine1 = val;
    _addressVerified = false;
    _addressLat = null;
    _addressLng = null;
    _deliveryQuote = null;
    _quoteError = null;
    notifyListeners();
    _onAddressChanged(cart);
  }

  void setAddressLine2(String val, CartProvider cart) {
    _addressLine2 = val;
    _deliveryQuote = null;
    notifyListeners();
    _onAddressChanged(cart);
  }
  
  void setCity(String val, CartProvider cart) {
    _city = val;
    _deliveryQuote = null;
    notifyListeners();
    _onAddressChanged(cart);
  }
  
  void setStateCode(String val, CartProvider cart) {
    _state = val;
    _deliveryQuote = null;
    notifyListeners();
    _onAddressChanged(cart);
  }

  
  void setZipCode(String val, CartProvider cart) {
    _zipCode = val;
    _deliveryQuote = null;
    notifyListeners();
    _onAddressChanged(cart);
  }

  void setDeliveryInstructions(String val) {
    _deliveryInstructions = val;
    notifyListeners();
  }

  void setPaymentMethod(String val) {
    _paymentMethod = val;
    notifyListeners();
  }
  


  void handleSelectSavedAddress(Map<String, dynamic> addrObj, CartProvider cart) {
    final rawAddress = addrObj['address'] ?? addrObj['addressLine1'];
    if (rawAddress == null || rawAddress.toString().isEmpty) return;
    
    _addressLine1 = rawAddress;
    _addressLabel = addrObj['label'] ?? 'Other';
    _city = '';
    _state = 'NY';
    _zipCode = '';
    
    final zipRegex = RegExp(r'([A-Za-z]{2})(?:,)?\s+(\d{5})(?:-\d{4})?$');
    final match = zipRegex.firstMatch(rawAddress);
    
    if (match != null) {
      _state = match.group(1)!.toUpperCase();
      _zipCode = match.group(2)!;
      
      String rest = rawAddress.replaceAll(match.group(0)!, '').trim();
      if (rest.endsWith(',')) rest = rest.substring(0, rest.length - 1).trim();
      
      final parts = rest.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
      
      if (parts.isNotEmpty) {
        _city = parts.last;
        parts.removeLast();
      }
      
      if (parts.isNotEmpty) {
        _addressLine1 = parts.first;
        if (parts.length > 1) {
          _addressLine2 = parts.sublist(1).join(', ');
        } else {
          _addressLine2 = '';
        }
      } else {
        _addressLine1 = '';
        _addressLine2 = '';
      }
    }
    
    _addressLat = addrObj['lat'] != null ? double.tryParse(addrObj['lat'].toString()) : (addrObj['location']?['coordinates'] != null ? addrObj['location']['coordinates'][1] : null);
    _addressLng = addrObj['lng'] != null ? double.tryParse(addrObj['lng'].toString()) : (addrObj['location']?['coordinates'] != null ? addrObj['location']['coordinates'][0] : null);
    _addressVerified = true;
    _quoteError = null;
    notifyListeners();
    
    fetchQuoteIfNeeded(cart);
  }

  Future<void> handleUseCurrentLocation(CartProvider cart) async {
    _isLocationLoading = true;
    _quoteLoading = true;
    _quoteError = null;
    notifyListeners();

    try {
      final pos = await _locationService.getCurrentLocation();
      if (pos != null) {
        final data = await _locationService.reverseGeocode(pos.latitude, pos.longitude);
        if (data != null && data['address'] != null) {
          final addr = data['address'];
          _addressLine1 = addr['road'] ?? addr['suburb'] ?? '';
          _city = addr['city'] ?? addr['town'] ?? addr['village'] ?? '';
          _state = (addr['state'] ?? 'NY').toString().substring(0, 2).toUpperCase();
          _zipCode = (addr['postcode'] ?? '').toString().replaceAll(RegExp(r'\D'), '');
          if (_zipCode.length > 5) _zipCode = _zipCode.substring(0, 5);
          
          _addressLat = pos.latitude;
          _addressLng = pos.longitude;
          _addressVerified = true;
          
          fetchQuoteIfNeeded(cart);
        } else {
          _quoteError = 'Unable to parse location details.';
        }
      }
    } catch (e) {
      _quoteError = 'Failed to get location: $e';
    } finally {
      _isLocationLoading = false;
      _quoteLoading = false;
      notifyListeners();
    }
  }

  void handleAutocompleteSelection(Map<String, dynamic> data, CartProvider cart) {
    if (data['address'] != null) {
      final addr = data['address'];
      _addressLine1 = addr['road'] ?? addr['suburb'] ?? data['name'] ?? '';
      _city = addr['city'] ?? addr['town'] ?? addr['village'] ?? addr['county'] ?? addr['municipality'] ?? '';
      _state = (addr['state'] ?? 'NY').toString().substring(0, 2).toUpperCase();
      _zipCode = (addr['postcode'] ?? '').toString().replaceAll(RegExp(r'\D'), '');
      if (_zipCode.length > 5) _zipCode = _zipCode.substring(0, 5);
      
      // Keep addressLine2 as it is, or clear it if it's a completely new address.
      // Usually autocomplete doesn't give Apt/Suite numbers.
      
      _addressLat = double.tryParse(data['lat'].toString());
      _addressLng = double.tryParse(data['lon'].toString());
      _addressVerified = true;
      _quoteError = null;
      
      fetchQuoteIfNeeded(cart);
      notifyListeners();
    }
  }

  Future<void> fetchQuoteIfNeeded(CartProvider cart) async {
    fetchETA(cart); // Fetch ETA in parallel
    if (!_isDelivery || cart.restaurant == null || cart.items.isEmpty) {
      _quoteError = 'Missing delivery info, restaurant, or cart items.';
      notifyListeners();
      return;
    }
    if (compiledAddress.isEmpty) {
      _quoteError = 'Please enter a valid address.';
      notifyListeners();
      return;
    }
    
    _quoteLoading = true;
    _quoteError = null;
    notifyListeners();
    
    try {
      double? lat = _addressLat;
      double? lng = _addressLng;
      
      if (lat == null || lng == null) {
        final geocodeData = await _locationService.geocodeAddress(compiledAddress);
        if (geocodeData != null) {
          lat = double.parse(geocodeData['lat'].toString());
          lng = double.parse(geocodeData['lon'].toString());
          _addressLat = lat;
          _addressLng = lng;
          _addressVerified = true;
        }
      }
      
      final checkoutItems = cart.items.map((item) => {
        'menuItemId': item['menuItemId'] ?? item['_id'] ?? item['id'],
        'quantity': item['quantity'] ?? item['qty'] ?? 1,
        'selectedSize': item['selectedSize'],
        'addOns': item['addOns'],
      }).toList();

      final payload = {
        'restaurantId': cart.restaurant!['_id'] ?? cart.restaurant!['id'] ?? cart.restaurant!['slug'] ?? 'lassi-lounge',
        'address': compiledAddress,
        'addressLat': lat,
        'addressLng': lng,
        'items': checkoutItems,
      };

      print('Fetching delivery quote with payload: $payload');
      final data = await _orderService.getDeliveryQuote(payload);
      print('Quote received: $data');
      
      _deliveryQuote = data;
      _quoteError = null;
    } catch (e) {
      print('Error fetching quote: $e');
      _deliveryQuote = null;
      _quoteError = e.toString();
    } finally {
      _quoteLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchETA(CartProvider cart) async {
    if (cart.restaurant == null) return;
    
    _etaLoading = true;
    _etaErrorFlag = false;
    notifyListeners();
    
    try {
      final restaurantId = 'lassi-lounge'; // force use lassi-lounge slug
      final addr = _isDelivery && compiledAddress.isNotEmpty ? compiledAddress : null;
      _etaData = await _orderService.getRestaurantETA(restaurantId, addr);
      if (_etaData == null) {
        _etaErrorFlag = true;
      }
    } catch (e) {
      _etaData = null;
      _etaErrorFlag = true;
    } finally {
      _etaLoading = false;
      notifyListeners();
    }
  }

  Future<void> handleApplyCoupon(CartProvider cart) async {
    if (_couponCode.trim().isEmpty) return;
    _couponLoading = true;
    notifyListeners();
    
    try {
      final data = await _couponService.validateCoupon(_couponCode, cart.subtotal, cart.restaurant!['_id'], _paymentMethod);
      _couponDiscount = (data?['discount'] ?? 0).toDouble();
      
      final allowed = data?['allowedPaymentMethods'];
      _allowedPaymentMethods = (allowed is List) ? allowed.map((e) => e.toString()).toList() : ['All'];
      
      _couponApplied = true;
    } catch (e) {
      _couponDiscount = 0.0;
      _couponApplied = false;
      rethrow;
    } finally {
      _couponLoading = false;
      notifyListeners();
    }
  }

  void handleRemoveCoupon() {
    _couponApplied = false;
    _couponDiscount = 0.0;
    _couponCode = '';
    _allowedPaymentMethods = ['All'];
    notifyListeners();
  }

  // Cost calculations
  double getDeliveryFee(CartProvider cart, Map<String, dynamic>? restaurant) {
    if (!_isDelivery) return 0.0;
    if (_deliveryQuote != null && _deliveryQuote!['deliveryFee'] != null) {
      return (_deliveryQuote!['deliveryFee'] as num).toDouble();
    }
    if (_quoteError == null && compiledAddress.isNotEmpty) {
      return ((restaurant?['deliveryFee'] as num?)?.toDouble() ?? 2.99);
    }
    return 0.0;
  }

  double getPlatformFee() => 2.0;

  double getServiceFee(CartProvider cart, Map<String, dynamic>? restaurant) {
    if (cart.subtotal <= 0) return 0.0;
    final rawServiceCharge = (restaurant?['serviceCharge'] as num?)?.toDouble() ?? 3.0;
    final serviceChargeMultiplier = rawServiceCharge < 1 ? rawServiceCharge : (rawServiceCharge / 100);
    return double.parse((cart.subtotal * serviceChargeMultiplier).toStringAsFixed(2));
  }

  double getPackagingFee(CartProvider cart, Map<String, dynamic>? restaurant) {
    return cart.subtotal > 0 ? ((restaurant?['packagingCharge'] as num?)?.toDouble() ?? 0.0) : 0.0;
  }

  double getTax(CartProvider cart, Map<String, dynamic>? restaurant) {
    final rawTaxRate = (restaurant?['taxRate'] as num?)?.toDouble() ?? 8.875;
    final taxRateMultiplier = rawTaxRate < 1 ? rawTaxRate : (rawTaxRate / 100);
    return cart.subtotal * taxRateMultiplier;
  }
  
  double getTotal(CartProvider cart, Map<String, dynamic>? restaurant) {
    double t = cart.subtotal + getTax(cart, restaurant) + getDeliveryFee(cart, restaurant) + getPlatformFee() + getServiceFee(cart, restaurant) + getPackagingFee(cart, restaurant) + _tip - _couponDiscount;
    if (restaurant?['roundOff'] == true) {
      t = t.roundToDouble();
    }
    return t > 0 ? t : 0.0;
  }

  Future<String?> handlePlaceOrder(BuildContext context, CartProvider cart, AuthProvider auth, Map<String, dynamic>? restaurant) async {
    if (cart.restaurant?['minimumOrder'] != null && cart.subtotal < (cart.restaurant!['minimumOrder'] as num).toDouble()) {
      throw Exception('Minimum order amount is \$${(cart.restaurant!['minimumOrder'] as num).toStringAsFixed(2)}');
    }
    if (_isDelivery && cart.restaurant?['acceptsOnlineOrders'] == false) {
      throw Exception('Restaurant is not accepting delivery orders right now');
    }
    if (!_isDelivery && cart.restaurant?['acceptsPickup'] == false) {
      throw Exception('Restaurant is not accepting pickup orders right now');
    }
    if (_isDelivery && compiledAddress.isEmpty) {
      throw Exception('Please enter a delivery address');
    }
    if (_isDelivery && _quoteError != null) {
      throw Exception(_quoteError);
    }
    
    _isPlacingOrder = true;
    notifyListeners();

    try {
      String? paymentIntentId;
      
      final checkoutItems = cart.items.map((item) => {
        'menuItemId': item['menuItemId'] ?? item['_id'] ?? item['id'],
        'quantity': item['quantity'] ?? item['qty'] ?? 1,
        'selectedSize': item['selectedSize'],
        'addOns': item['addOns'],
        'specialInstructions': item['specialInstructions'] ?? '',
      }).toList();

      final String finalPaymentMethod = (_paymentMethod == 'saved_card_4242' || _paymentMethod.startsWith('pm_') || _paymentMethod.startsWith('card_')) ? 'credit_card' : _paymentMethod;

      final checkoutPayload = {
        'restaurantId': cart.restaurant!['_id'] ?? cart.restaurant!['id'] ?? cart.restaurant!['slug'] ?? 'lassi-lounge',
        'items': checkoutItems,
        'orderType': _isDelivery ? 'delivery' : 'pickup',
        'tip': _tip,
        'couponCode': _couponApplied ? _couponCode : null,
        'useLoyaltyPoints': _useLoyaltyPoints,
        'address': compiledAddress,
        'addressLat': _addressLat,
        'addressLng': _addressLng,
        'specialInstructions': _deliveryInstructions,
        'paymentMethod': finalPaymentMethod,
      };

      if (_paymentMethod == 'credit_card') {
        // Stripe integration for new card
        final responseData = await _paymentService.createIntent(getTotal(cart, restaurant), checkoutPayload);
        if (responseData == null) throw Exception('Failed to initialize payment');
        
        final clientSecret = responseData['clientSecret'];
        final ephemeralKeySecret = responseData['ephemeralKey'];
        final customerId = responseData['customerId'];
        
        if (clientSecret == null) throw Exception('Failed to initialize payment');

        await Stripe.instance.initPaymentSheet(
          paymentSheetParameters: SetupPaymentSheetParameters(
            paymentIntentClientSecret: clientSecret,
            customerId: customerId,
            customerEphemeralKeySecret: ephemeralKeySecret,
            merchantDisplayName: 'Lassi Lounge',
            style: ThemeMode.light,
            linkDisplayParams: const LinkDisplayParams(linkDisplay: LinkDisplay.never),
            billingDetails: BillingDetails(
              email: _email,
              name: _fullName,
              phone: _phone,
            ),
            // DO NOT set returnURL — it tells Stripe redirect methods (like Link) are acceptable
            // which causes checkout.link.com to open on mobile.
            // payment_method_types: ['card'] is set server-side to enforce this.
            allowsDelayedPaymentMethods: false,
            appearance: const PaymentSheetAppearance(
              colors: PaymentSheetAppearanceColors(
                primary: Color(0xFF7A0B10), // Red
              ),
            ),
          ),
        );

        await Stripe.instance.presentPaymentSheet();
        paymentIntentId = responseData['paymentIntentId'] ?? 'stripe_success';
      } else if (_paymentMethod.startsWith('pm_') || _paymentMethod.startsWith('card_')) {
        // Stripe integration for saved card
        final intentData = await _paymentService.createIntent(getTotal(cart, restaurant), checkoutPayload);
        final clientSecret = intentData?['clientSecret'];
        
        if (clientSecret == null) throw Exception('Failed to initialize payment');

        final paymentIntent = await Stripe.instance.confirmPayment(
          paymentIntentClientSecret: clientSecret,
          data: PaymentMethodParams.cardFromMethodId(
            paymentMethodData: PaymentMethodDataCardFromMethod(
              paymentMethodId: _paymentMethod,
            ),
          ),
        );
        
        paymentIntentId = paymentIntent.id;
        // In this case, backend order route still needs 'credit_card' as the top level payment method type
        // so it passes verifyCardPayment. We'll set finalOrderPayload.paymentMethod = 'credit_card' below.
      } else if (_paymentMethod == 'google_pay') {
        final intentData = await _paymentService.createIntent(getTotal(cart, restaurant), checkoutPayload);
        final clientSecret = intentData?['clientSecret'];
        
        if (clientSecret == null) throw Exception('Failed to initialize payment');

        final paymentIntent = await Stripe.instance.confirmPlatformPayPaymentIntent(
          clientSecret: clientSecret,
          confirmParams: const PlatformPayConfirmParams.googlePay(
            googlePay: GooglePayParams(
              testEnv: true,
              merchantName: 'Lassi Lounge',
              merchantCountryCode: 'US',
              currencyCode: 'USD',
            ),
          ),
        );
        paymentIntentId = paymentIntent.id;
      } else if (_paymentMethod == 'apple_pay') {
        final intentData = await _paymentService.createIntent(getTotal(cart, restaurant), checkoutPayload);
        final clientSecret = intentData?['clientSecret'];
        
        if (clientSecret == null) throw Exception('Failed to initialize payment');

        final paymentIntent = await Stripe.instance.confirmPlatformPayPaymentIntent(
          clientSecret: clientSecret,
          confirmParams: PlatformPayConfirmParams.applePay(
            applePay: ApplePayParams(
              merchantCountryCode: 'US',
              currencyCode: 'USD',
              cartItems: [
                ApplePayCartSummaryItem.immediate(
                  label: 'Lassi Lounge Order',
                  amount: getTotal(cart, restaurant).toStringAsFixed(2),
                ),
              ],
            ),
          ),
        );
        paymentIntentId = paymentIntent.id;
      } else if (_paymentMethod == 'saved_card_4242') {
        paymentIntentId = 'pi_demo_saved_card';
      }

      final finalOrderPayload = {
        ...checkoutPayload,
        'courierNotes': _deliveryInstructions,
        'stripePaymentIntentId': paymentIntentId,
      };

      final orderData = await _orderService.createOrder(finalOrderPayload);
      
      await cart.clearCart();
      return orderData?['_id'];
    } catch (e) {
      if (e is StripeException) {
        throw Exception('Payment was cancelled or failed.');
      }
      rethrow;
    } finally {
      _isPlacingOrder = false;
      notifyListeners();
    }
  }
}
