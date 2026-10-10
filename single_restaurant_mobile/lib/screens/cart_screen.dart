import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/address_provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/checkout_provider.dart';
import 'package:single_restaurant_mobile/providers/loyalty_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/screens/checkout_screen.dart';
import 'package:single_restaurant_mobile/screens/loyalty_rewards_screen.dart';
import 'package:single_restaurant_mobile/screens/saved_addresses_screen.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';
import 'package:single_restaurant_mobile/widgets/cart/cart_address_selector.dart';
import 'package:single_restaurant_mobile/widgets/cart/cart_bill_summary.dart';
import 'package:single_restaurant_mobile/widgets/cart/cart_bottom_bar.dart';
import 'package:single_restaurant_mobile/widgets/cart/cart_delivery_estimate.dart';
import 'package:single_restaurant_mobile/widgets/cart/cart_delivery_toggle.dart';
import 'package:single_restaurant_mobile/widgets/cart/cart_empty_view.dart';
import 'package:single_restaurant_mobile/widgets/cart/cart_item_list.dart';
import 'package:single_restaurant_mobile/widgets/cart/cart_pickup_location.dart';
import 'package:single_restaurant_mobile/widgets/cart/cart_promotions.dart';
import 'package:single_restaurant_mobile/widgets/cart/cart_restaurant_info_sheet.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  Timer? _debounceTimer;
  double _lastSubtotal = -1;
  final TextEditingController _couponController = TextEditingController();

  void _onCartSubtotalChanged(CartProvider cartProvider, CheckoutProvider checkoutProvider) {
    if (_lastSubtotal == cartProvider.subtotal) return;
    _lastSubtotal = cartProvider.subtotal;
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      if (mounted && cartProvider.items.isNotEmpty && cartProvider.restaurant != null) {
        checkoutProvider.fetchQuoteIfNeeded(cartProvider);
      }
    });
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _couponController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final cart = context.read<CartProvider>();
      final checkout = context.read<CheckoutProvider>();
      final addressProvider = context.read<AddressProvider>();
      final auth = context.read<AuthProvider>();

      if (auth.user != null && addressProvider.addresses.isEmpty) {
        addressProvider.fetchAddresses().then((_) {
          checkout.autoSelectDefaultAddress(addressProvider, cart);
          if (checkout.etaData == null) checkout.fetchETA(cart);
        });
      } else {
        if (auth.user != null) checkout.autoSelectDefaultAddress(addressProvider, cart);
        if (checkout.etaData == null) checkout.fetchETA(cart);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: const Icon(Icons.arrow_back, color: Color(0xFF7A0B10)),
                onPressed: () => Navigator.pop(context),
              )
            : null,
        titleSpacing: 16,
        title: Consumer<CartProvider>(
          builder: (context, cart, _) {
            final itemCount = cart.items.length;
            final itemLabel = itemCount == 1 ? '1 item' : '$itemCount items';
            return FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'Your Cart',
                    style: TextStyle(
                      color: Colors.black,
                      fontWeight: FontWeight.w900,
                      fontSize: 22,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '($itemLabel)',
                    style: const TextStyle(
                      color: Colors.grey,
                      fontSize: 15,
                      fontWeight: FontWeight.normal,
                    ),
                  ),
                ],
              ),
            );
          },
        ),
        actions: [
          Consumer<CartProvider>(
            builder: (context, cart, _) => cart.items.isEmpty
                ? const SizedBox.shrink()
                : TextButton.icon(
                    onPressed: () => cart.clearCart(),
                    icon: const Icon(Icons.delete_outline, size: 18, color: Color(0xFF7A0B10)),
                    label: const Text(
                      'Clear Cart',
                      style: TextStyle(
                        color: Color(0xFF7A0B10),
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ),
          )
        ],
      ),
      body: Consumer4<CartProvider, CheckoutProvider, AddressProvider, AuthProvider>(
        builder: (context, cartProvider, checkoutProvider, addressProvider, authProvider, child) {
          if (cartProvider.isLoading && cartProvider.items.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: AppColors.secondary));
          }
          if (cartProvider.items.isEmpty) {
            return CartEmptyView(onBrowseMenu: () => Navigator.pop(context));
          }
          if (cartProvider.restaurant != null) {
            WidgetsBinding.instance.addPostFrameCallback((_) => _onCartSubtotalChanged(cartProvider, checkoutProvider));
          }

          final restProv = Provider.of<RestaurantProvider>(context, listen: false);
          final restaurant = restProv.restaurant ?? cartProvider.restaurant;
          final double subtotal = cartProvider.subtotal;
          final double deliveryFee = checkoutProvider.getDeliveryFee(cartProvider, restaurant);
          final double combinedTaxesAndFees = checkoutProvider.getTax(cartProvider, restaurant) +
              checkoutProvider.getPlatformFee() +
              checkoutProvider.getServiceFee(cartProvider, restaurant) +
              checkoutProvider.getPackagingFee(cartProvider, restaurant);
          final double loyaltyDiscount = checkoutProvider.useLoyaltyPoints
              ? ((authProvider.user?.loyaltyPoints ?? 0) / 100)
              : 0.0;
          final double totalDiscount = loyaltyDiscount + checkoutProvider.couponDiscount;
          final double total = (checkoutProvider.getTotal(cartProvider, restaurant) - loyaltyDiscount).clamp(0.0, double.infinity);

          final isDelivery = checkoutProvider.isDelivery;
          final noAddress = isDelivery && checkoutProvider.compiledAddress.isEmpty;
          final deliveryErr = isDelivery && (checkoutProvider.etaErrorFlag || checkoutProvider.quoteError != null);
          final canProceed = cartProvider.items.isNotEmpty && !noAddress && !deliveryErr;
          final errorReason = cartProvider.items.isEmpty
              ? 'Cart is empty'
              : noAddress ? 'Select an address' : deliveryErr ? 'Delivery unavailable' : '';

          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  child: ResponsiveCenter(
                    maxWidth: 700,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        CartDeliveryToggle(checkout: checkoutProvider, cart: cartProvider),
                        if (checkoutProvider.isDelivery)
                          CartAddressSelector(
                            cart: cartProvider,
                            checkout: checkoutProvider,
                            restaurant: restaurant,
                            onChangeAddress: () => Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const SavedAddressesScreen(selectingMode: true)),
                            ),
                          )
                        else
                          CartPickupLocation(
                            cart: cartProvider,
                            onTap: () => CartRestaurantInfoSheet.show(context, cartProvider.restaurant),
                          ),
                        CartDeliveryEstimate(checkout: checkoutProvider),
                        const Padding(
                          padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
                          child: Text(
                            'Items in Your Cart',
                            style: TextStyle(
                              color: Color(0xFF1E1E1E),
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                            ),
                          ),
                        ),
                        CartItemList(
                          cartProvider: cartProvider,
                          checkoutProvider: checkoutProvider,
                          restaurantProvider: restProv,
                          onHandleQty: (action) => _handleItemQty(action, checkoutProvider, cartProvider),
                        ),
                        const SizedBox(height: 12),
                        CartPromotions(
                          checkout: checkoutProvider,
                          couponController: _couponController,
                          loyaltyPoints: context.read<LoyaltyProvider>().currentBalance,
                          onApplyCoupon: () => _handleApplyCoupon(checkoutProvider, cartProvider),
                          onRemoveCoupon: () => _handleRemoveCoupon(checkoutProvider),
                          onRedeemRewards: () => Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const LoyaltyRewardsScreen()),
                          ),
                        ),
                        const SizedBox(height: 16),
                        CartBillSummary(
                          cart: cartProvider,
                          checkout: checkoutProvider,
                          subtotal: subtotal,
                          deliveryFee: deliveryFee,
                          combinedTaxesAndFees: combinedTaxesAndFees,
                          total: total,
                          saved: totalDiscount,
                        ),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
              ),
              CartBottomBar(
                total: total,
                currency: restaurant?['currency'],
                canProceed: canProceed,
                errorReason: errorReason,
                onProceed: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const CheckoutScreen()),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _handleApplyCoupon(CheckoutProvider checkout, CartProvider cart) async {
    final code = _couponController.text.trim();
    if (code.isEmpty) return;
    checkout.setCouponCode(code);
    try {
      await checkout.handleApplyCoupon(cart);
    } catch (e) {
      if (mounted) ToastUtils.showError(context, e.toString().replaceAll('Exception: ', ''));
    }
  }

  void _handleRemoveCoupon(CheckoutProvider checkout) {
    checkout.handleRemoveCoupon();
    _couponController.clear();
  }

  Future<void> _handleItemQty(
    FutureOr<void> Function() action,
    CheckoutProvider checkout,
    CartProvider cart,
  ) async {
    await action();
    if (!checkout.couponApplied) return;
    try {
      await checkout.handleApplyCoupon(cart);
    } catch (e) {
      if (mounted) ToastUtils.showInfo(context, 'Coupon removed: ${e.toString().replaceAll('Exception: ', '')}');
    }
  }
}
