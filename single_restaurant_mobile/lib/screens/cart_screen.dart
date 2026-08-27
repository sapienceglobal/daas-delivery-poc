import 'package:single_restaurant_mobile/utils/toast_utils.dart';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';
import 'package:just_the_tooltip/just_the_tooltip.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/checkout_provider.dart';
import 'package:single_restaurant_mobile/providers/address_provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/widgets/cart_item_card.dart';
import 'package:single_restaurant_mobile/screens/main_screen.dart';
import 'package:single_restaurant_mobile/screens/checkout_screen.dart';
import 'package:single_restaurant_mobile/providers/loyalty_provider.dart';
import 'package:single_restaurant_mobile/screens/loyalty_rewards_screen.dart';
import 'package:single_restaurant_mobile/utils/cart_helper.dart';
import 'package:single_restaurant_mobile/screens/saved_addresses_screen.dart';
import 'package:single_restaurant_mobile/utils/formatters.dart';
import 'package:url_launcher/url_launcher.dart';

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
    if (_lastSubtotal != cartProvider.subtotal) {
      _lastSubtotal = cartProvider.subtotal;
      
      // Cancel previous timer
      if (_debounceTimer?.isActive ?? false) {
        _debounceTimer!.cancel();
      }
      
      // Debounce the backend validation
      _debounceTimer = Timer(const Duration(milliseconds: 500), () {
        if (mounted && cartProvider.items.isNotEmpty && cartProvider.restaurant != null) {
          checkoutProvider.fetchQuoteIfNeeded(cartProvider);
        }
      });
    }
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
      final cart = Provider.of<CartProvider>(context, listen: false);
      final checkout = Provider.of<CheckoutProvider>(context, listen: false);
      final addressProvider = Provider.of<AddressProvider>(context, listen: false);
      final auth = Provider.of<AuthProvider>(context, listen: false);
      
      if (auth.user != null) {
        if (addressProvider.addresses.isEmpty) {
          addressProvider.fetchAddresses().then((_) {
            checkout.autoSelectDefaultAddress(addressProvider, cart);
            if (checkout.etaData == null) checkout.fetchETA(cart);
          });
        } else {
          checkout.autoSelectDefaultAddress(addressProvider, cart);
          if (checkout.etaData == null) checkout.fetchETA(cart);
        }
      } else {
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
        leading: Navigator.canPop(context) ? IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF7A0B10)),
          onPressed: () => Navigator.pop(context),
        ) : null,
        titleSpacing: 16,
        title: Consumer<CartProvider>(
          builder: (context, cart, _) {
            final itemCount = cart.items.length;
            return Row(
              children: [
                const Text(
                  'Your Cart',
                  style: TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 22, fontFamily: 'Serif'), // Approximating the bold serif look
                ),
                const SizedBox(width: 8),
                Text(
                  '($itemCount items)',
                  style: const TextStyle(color: Colors.grey, fontSize: 15, fontWeight: FontWeight.normal),
                ),
              ],
            );
          },
        ),
        actions: [
          Consumer<CartProvider>(
            builder: (context, cart, _) {
              if (cart.items.isEmpty) return const SizedBox.shrink();
              return TextButton.icon(
                onPressed: () => cart.clearCart(),
                icon: const Icon(Icons.delete_outline, size: 18, color: Color(0xFF7A0B10)),
                label: const Text('Clear Cart', style: TextStyle(color: Color(0xFF7A0B10), fontWeight: FontWeight.w600, fontSize: 13)),
              );
            },
          )
        ], 
      ),
      body: Consumer4<CartProvider, CheckoutProvider, AddressProvider, AuthProvider>(
        builder: (context, cartProvider, checkoutProvider, addressProvider, authProvider, child) {
          if (cartProvider.isLoading && cartProvider.items.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: AppColors.secondary));
          }

          if (cartProvider.items.isEmpty) {
            return _buildEmptyCart(context);
          }

          // Ensure ETA is fetched once cart is loaded and on subtotal changes
          if (cartProvider.restaurant != null) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              _onCartSubtotalChanged(cartProvider, checkoutProvider);
            });
          }

          final restProv = Provider.of<RestaurantProvider>(context, listen: false);
          final restaurant = restProv.restaurant ?? cartProvider.restaurant;

          // Calculations
          double subtotal = cartProvider.subtotal;
          double deliveryFee = checkoutProvider.getDeliveryFee(cartProvider, restaurant);
          double platformFee = checkoutProvider.getPlatformFee();
          double serviceFee = checkoutProvider.getServiceFee(cartProvider, restaurant);
          double packagingFee = checkoutProvider.getPackagingFee(cartProvider, restaurant);
          double tax = checkoutProvider.getTax(cartProvider, restaurant);
          double combinedTaxesAndFees = tax + platformFee + serviceFee + packagingFee;
          
          double loyaltyDiscount = checkoutProvider.useLoyaltyPoints ? ((authProvider.user?.loyaltyPoints ?? 0) / 100) : 0.0;
          double couponDiscount = checkoutProvider.couponDiscount;
          double totalDiscount = loyaltyDiscount + couponDiscount;
          
          double total = checkoutProvider.getTotal(cartProvider, restaurant) - loyaltyDiscount;
          if (total < 0) total = 0.0;

          // Determine if we can proceed
          bool canProceed = true;
          String errorReason = '';

          if (cartProvider.items.isEmpty) {
            canProceed = false;
            errorReason = 'Cart is empty';
          } else if (checkoutProvider.isDelivery) {
            if (checkoutProvider.compiledAddress.isEmpty) {
              canProceed = false;
              errorReason = 'Select an address';
            } else if (checkoutProvider.etaErrorFlag || checkoutProvider.quoteError != null) {
              canProceed = false;
              errorReason = 'Delivery unavailable';
            }
          }

          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Delivery/Pickup Toggle
                      _buildDeliveryToggle(context, checkoutProvider, cartProvider),

                      // Address Selector or Pickup Location
                      if (checkoutProvider.isDelivery)
                        _buildAddressSelector(context, cartProvider, checkoutProvider, addressProvider)
                      else
                        _buildPickupLocation(cartProvider),
                      
                      // Estimated Delivery Box
                      _buildDeliveryEstimate(checkoutProvider),
                      
                      const SizedBox(height: 16),
                      
                      // Items List
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0),
                        child: Column(
                          children: cartProvider.items.asMap().entries.map((entry) {
                            final index = entry.key;
                            final item = entry.value;
                            final currentQty = (item['quantity'] ?? item['qty'] ?? 1) as int;
                            
                            return CartItemCard(
                              item: item,
                              onIncrement: () async {
                                final restaurantProvider = Provider.of<RestaurantProvider>(context, listen: false);
                                AddToCartHelper.handleAddToCart(context, item, cartProvider, restaurantProvider);
                                if (checkoutProvider.couponApplied) {
                                  try {
                                    await checkoutProvider.handleApplyCoupon(cartProvider);
                                  } catch (e) {
                                    if (context.mounted) {
                                      ToastUtils.showInfo(context, 'Coupon removed: ${e.toString().replaceAll('Exception: ', '')}');
                                    }
                                  }
                                }
                              },
                              onDecrement: () async {
                                cartProvider.updateQuantity(index, currentQty - 1);
                                if (checkoutProvider.couponApplied) {
                                  try {
                                    await checkoutProvider.handleApplyCoupon(cartProvider);
                                  } catch (e) {
                                    if (context.mounted) {
                                      ToastUtils.showInfo(context, 'Coupon removed: ${e.toString().replaceAll('Exception: ', '')}');
                                    }
                                  }
                                }
                              },
                              onDelete: () async {
                                cartProvider.removeItem(index);
                                if (checkoutProvider.couponApplied) {
                                  try {
                                    await checkoutProvider.handleApplyCoupon(cartProvider);
                                  } catch (e) {
                                    if (context.mounted) {
                                      ToastUtils.showInfo(context, 'Coupon removed: ${e.toString().replaceAll('Exception: ', '')}');
                                    }
                                  }
                                }
                              },
                            );
                          }).toList(),
                        ),
                      ),
                      
                      const SizedBox(height: 16),
                      
                      // Coupon and Rewards
                      _buildPromotions(context, checkoutProvider, cartProvider, authProvider),
                      
                      const SizedBox(height: 24),
                      
                      // Bill Summary
                      _buildBillSummary(cartProvider, checkoutProvider, subtotal, deliveryFee, combinedTaxesAndFees, total, totalDiscount),
                      
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),
              // Sticky Bottom Bar
              _buildBottomBar(context, total, canProceed: canProceed, errorReason: errorReason),
            ],
          );
        },
      ),
    );
  }

  Widget _buildDeliveryToggle(BuildContext context, CheckoutProvider checkout, CartProvider cart) {
    return Container(
      margin: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 8),
      decoration: BoxDecoration(
        color: Colors.grey.shade200,
        borderRadius: BorderRadius.circular(25),
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => checkout.setDelivery(true, cart),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: checkout.isDelivery ? const Color(0xFF7A0B10) : Colors.transparent,
                  borderRadius: BorderRadius.circular(25),
                  boxShadow: checkout.isDelivery ? const [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))] : null,
                ),
                child: Center(
                  child: Text('Delivery', style: TextStyle(
                    color: checkout.isDelivery ? Colors.white : Colors.black87,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  )),
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => checkout.setDelivery(false, cart),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: !checkout.isDelivery ? const Color(0xFF7A0B10) : Colors.transparent,
                  borderRadius: BorderRadius.circular(25),
                  boxShadow: !checkout.isDelivery ? const [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))] : null,
                ),
                child: Center(
                  child: Text('Pickup', style: TextStyle(
                    color: !checkout.isDelivery ? Colors.white : Colors.black87,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  )),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPickupLocation(CartProvider cart) {
    return GestureDetector(
      onTap: () => _showRestaurantInfoSheet(context, cart),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: const Color(0xFFFFF9F5), borderRadius: BorderRadius.circular(8)),
            child: const Icon(Icons.storefront_outlined, color: Color(0xFF7A0B10), size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Pickup from', style: TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text(
                  cart.restaurant?['name'] ?? 'Lassi Lounge',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  cart.restaurant?['address'] ?? '123 Main St, City',
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: Colors.grey),
        ],
      ),
      ),
    );
  }

  Widget _buildAddressSelector(BuildContext context, CartProvider cart, CheckoutProvider checkout, AddressProvider addressProvider) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF3F4F6), width: 1.5),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4)),
        ]
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFFFCE8E8),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.location_on, color: Color(0xFF7A0B10), size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Delivering to', style: TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text(
                  checkout.addressVerified && checkout.addressLine1.isNotEmpty 
                      ? '${checkout.addressLabel} - ${checkout.addressLine1}' 
                      : 'Select a delivery address',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                if (checkout.quoteLoading)
                  const Row(children: [SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2)), SizedBox(width: 6), Text('Calculating delivery fee...', style: TextStyle(color: Colors.grey, fontSize: 12))])
                else if (checkout.quoteError != null)
                  Text(checkout.quoteError!, style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 12))
                else if (checkout.deliveryQuote != null && checkout.addressVerified)
                  Text('Delivery Available (${Formatters.formatCurrency(checkout.getDeliveryFee(cart, Provider.of<RestaurantProvider>(context, listen: false).restaurant ?? cart.restaurant), cart.restaurant?['currency'])})', style: TextStyle(color: Colors.green.shade700, fontWeight: FontWeight.bold, fontSize: 12)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          OutlinedButton(
            onPressed: () {
              // Open address selection
              Navigator.push(context, MaterialPageRoute(builder: (_) => const SavedAddressesScreen(selectingMode: true)));
            },
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFF7A0B10)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
              minimumSize: const Size(60, 32),
            ),
            child: const Text('Change', style: TextStyle(color: Color(0xFF7A0B10), fontSize: 12, fontWeight: FontWeight.bold)),
          )
        ],
      ),
    );
  }

  Widget _buildDeliveryEstimate(CheckoutProvider checkout) {
    String etaText = '30-40 mins';
    if (checkout.etaLoading) {
      etaText = 'Calculating...';
    } else if (checkout.etaData != null) {
      if (checkout.isDelivery) {
        if (checkout.etaData!['isOutOfRange'] == true) {
          etaText = 'Out of range';
        } else if (checkout.etaData!['deliveryTime'] != null) {
          etaText = '${checkout.etaData!['deliveryTime']} mins';
        }
      } else {
        if (checkout.etaData!['prepTime'] != null) {
          etaText = '${checkout.etaData!['prepTime']} mins';
        } else {
          etaText = '15-20 mins';
        }
      }
    }

    final isError = checkout.isDelivery && checkout.etaData?['isOutOfRange'] == true;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF9F5), // Light beige
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(checkout.isDelivery ? Icons.local_shipping_outlined : Icons.shopping_bag_outlined, color: const Color(0xFF7A0B10), size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: RichText(
                    text: TextSpan(
                      text: checkout.isDelivery ? 'Estimated Delivery: ' : 'Estimated Pickup: ',
                      style: const TextStyle(color: Colors.black87, fontSize: 12),
                      children: [
                        TextSpan(text: etaText, style: TextStyle(fontWeight: FontWeight.bold, color: isError ? Colors.red : const Color(0xFF7A0B10))),
                      ]
                    ),
                  ),
                ),
              ],
            ),
          ),
          Container(width: 1, height: 20, color: Colors.grey.shade300),
          Expanded(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Icon(Icons.bolt, color: Color(0xFF7A0B10), size: 18),
                SizedBox(width: 4),
                Text('Fast & Hot Delivery', style: TextStyle(color: Colors.black87, fontSize: 12, fontWeight: FontWeight.w600)),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildPromotions(BuildContext context, CheckoutProvider checkout, CartProvider cart, AuthProvider auth) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Column(
        children: [
          // Coupon Box
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(12), topRight: Radius.circular(12)),
              border: Border.all(color: const Color(0xFFF3F4F6)),
            ),
            child: checkout.couponApplied 
              ? Row(
                  children: [
                    const Icon(Icons.check_circle, color: Colors.green, size: 24),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('\'${checkout.couponCode}\' applied', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.green)),
                          const SizedBox(height: 2),
                          const Text('You got a discount on this order!', style: TextStyle(color: Colors.green, fontSize: 12)),
                        ],
                      ),
                    ),
                    GestureDetector(
                      onTap: () {
                        checkout.handleRemoveCoupon();
                        _couponController.clear();
                      },
                      child: const Text('REMOVE', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 12)),
                    )
                  ],
                )
              : Row(
                  children: [
                    Expanded(
                      child: SizedBox(
                        height: 44,
                        child: TextField(
                          controller: _couponController,
                          textCapitalization: TextCapitalization.characters,
                          style: const TextStyle(fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'Enter coupon code',
                            hintStyle: const TextStyle(fontSize: 14, color: Colors.grey),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF7A0B10))),
                            prefixIcon: const Icon(Icons.local_offer_outlined, color: Colors.grey, size: 20),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    GestureDetector(
                      onTap: checkout.couponLoading ? null : () async {
                        if (_couponController.text.trim().isNotEmpty) {
                          checkout.setCouponCode(_couponController.text.trim());
                          try {
                            await checkout.handleApplyCoupon(cart);
                          } catch (e) {
                            ToastUtils.showError(context, e.toString().replaceAll('Exception: ', ''));
                          }
                        }
                      },
                      child: checkout.couponLoading 
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Color(0xFF7A0B10), strokeWidth: 2))
                          : const Text('APPLY', style: TextStyle(color: Color(0xFF7A0B10), fontWeight: FontWeight.bold, fontSize: 14)),
                    )
                  ],
                ),
          ),
          // Rewards Box
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(12), bottomRight: Radius.circular(12)),
              border: Border.all(color: const Color(0xFFF3F4F6)),
            ),
            child: Row(
              children: [
                const Icon(Icons.workspace_premium, color: Color(0xFFF59E0B), size: 28), // Golden Crown approx
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Lassi Lounge Rewards', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      const SizedBox(height: 2),
                      RichText(
                        text: TextSpan(
                          text: 'You have ',
                          style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                          children: [
                            TextSpan(text: '${context.read<LoyaltyProvider>().currentBalance} points', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF7A0B10))),
                          ]
                        ),
                      ),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: () {
                    Navigator.push(context, MaterialPageRoute(builder: (context) => const LoyaltyRewardsScreen()));
                  },
                  child: Row(
                    children: [
                      Text('Redeem Now', style: const TextStyle(color: Color(0xFF7A0B10), fontWeight: FontWeight.bold, fontSize: 14)),
                      const Icon(Icons.chevron_right, color: Color(0xFF7A0B10), size: 18),
                    ],
                  ),
                )
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildBillSummary(CartProvider cart, CheckoutProvider checkout, double subtotal, double deliveryFee, double combinedTaxesAndFees, double total, double saved) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFF3F4F6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Bill Summary', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
          const SizedBox(height: 16),
          _buildBillRow('Item Total (${cart.items.length} items)', subtotal),
          const SizedBox(height: 10),
          if (!checkout.isDelivery)
            _buildBillRow('Delivery Fee', 0, info: true, tooltipMessage: 'Fee charged for delivery based on distance and local market conditions.', textValue: '\$0.00')
          else if (checkout.quoteLoading)
            _buildBillRow('Delivery Fee', 0, info: true, tooltipMessage: 'Fee charged for delivery based on distance and local market conditions.', textValue: 'Calculating...', color: Colors.grey)
          else if (checkout.quoteError != null)
            _buildBillRow('Delivery Fee', 0, info: true, tooltipMessage: 'Fee charged for delivery based on distance and local market conditions.', textValue: 'Unavailable', color: Colors.red)
          else
            _buildBillRow('Delivery Fee', deliveryFee, info: true, tooltipMessage: 'Fee charged for delivery based on distance and local market conditions.'),
          const SizedBox(height: 10),
          _buildBillRow('Taxes & Fees', combinedTaxesAndFees, info: true, tooltipMessage: 'Estimated state and local sales taxes applied to your order.'),
          
          if (saved > 0) ...[
             const SizedBox(height: 10),
             _buildBillRow('Discounts', -saved, color: Colors.green),
          ],
          
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16.0),
            child: Text('------------------------------------------------', style: TextStyle(color: Colors.grey, letterSpacing: 2), maxLines: 1, overflow: TextOverflow.clip),
          ),
          
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('To Pay', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
              Text(Formatters.formatCurrency(total, cart.restaurant?['currency']), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: Color(0xFF7A0B10))),
            ],
          ),
          if (saved > 0) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.sell, color: Colors.green, size: 14),
                const SizedBox(width: 6),
                Text('You saved ${Formatters.formatCurrency(saved, cart.restaurant?['currency'])} on this order', style: const TextStyle(color: Colors.green, fontSize: 12, fontWeight: FontWeight.bold)),
              ],
            ),
          ]
        ],
      ),
    );
  }

  Widget _buildBillRow(String label, double value, {bool info = false, String? tooltipMessage, Color? color, String? textValue}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Text(label, style: const TextStyle(color: Color(0xFF4B5563), fontSize: 14)),
            if (info) ...[
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
            ]
          ],
        ),
        Text(textValue ?? (value < 0 ? '-${Formatters.formatCurrency(-value, null)}' : Formatters.formatCurrency(value, null)), style: TextStyle(fontWeight: FontWeight.w700, color: color ?? const Color(0xFF1F2937))),
      ],
    );
  }

  Widget _buildBottomBar(BuildContext context, double total, {bool canProceed = true, String errorReason = ''}) {
    return SafeArea(
      bottom: true,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.only(left: 16, right: 16, bottom: 16, top: 16),
        decoration: const BoxDecoration(
          color: Colors.white,
        ),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        decoration: BoxDecoration(
          color: canProceed ? const Color(0xFF7A0B10) : Colors.grey.shade400,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(Formatters.formatCurrency(total, Provider.of<RestaurantProvider>(context, listen: false).restaurant?['currency']), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
              ],
            ),
            Container(width: 1, height: 30, color: Colors.white24, margin: const EdgeInsets.symmetric(horizontal: 16)),
            Expanded(
              child: InkWell(
                onTap: canProceed ? () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const CheckoutScreen()));
                } : null,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Flexible(
                      child: Text(canProceed ? 'Proceed to Checkout' : errorReason, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15), overflow: TextOverflow.ellipsis),
                    ),
                    if (canProceed) ...[
                      const SizedBox(width: 8),
                      const Icon(Icons.arrow_forward, color: Colors.white, size: 18),
                    ]
                  ],
                ),
              ),
            )
          ],
        ),
      ),
      ),
    );
  }

  Widget _buildEmptyCart(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.shopping_bag_outlined, size: 80, color: Colors.grey),
          const SizedBox(height: 16),
          const Text('Your cart is empty', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('Add some delicious items from the menu.', style: TextStyle(color: Colors.grey)),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.secondary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('BROWSE MENU'),
          )
        ],
      ),
    );
  }

  void _showRestaurantInfoSheet(BuildContext context, CartProvider cart) {
    final restaurant = cart.restaurant;
    if (restaurant == null) return;

    final name = restaurant['name'] ?? 'Lassi Lounge';
    final address = restaurant['address'] ?? '123 Main St, City';
    final phone = restaurant['phone'] ?? '';
    final email = restaurant['email'] ?? '';
    
    // For maps, we try coordinates if available, otherwise just search address
    final loc = restaurant['location'];
    final lat = loc != null && loc['coordinates'] != null ? loc['coordinates'][1] : null;
    final lng = loc != null && loc['coordinates'] != null ? loc['coordinates'][0] : null;

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF7A0B10))),
              const SizedBox(height: 8),
              Text(address, style: const TextStyle(fontSize: 14, color: Colors.black87)),
              const SizedBox(height: 24),
              if (phone.isNotEmpty)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.phone, color: Color(0xFF7A0B10)),
                  title: Text(phone),
                  onTap: () async {
                    final uri = Uri.parse('tel:$phone');
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(uri);
                    }
                  },
                ),
              if (email.isNotEmpty)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.email, color: Color(0xFF7A0B10)),
                  title: Text(email),
                  onTap: () async {
                    final uri = Uri.parse('mailto:$email');
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(uri);
                    }
                  },
                ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () async {
                    final targetAddress = '94-08 118th St, South Richmond Hill, NY 11419, United States';
                    final uri = Uri.parse('https://maps.google.com/?q=${Uri.encodeComponent(targetAddress)}');
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(uri, mode: LaunchMode.externalApplication);
                    }
                  },
                  icon: const Icon(Icons.map, color: Colors.white),
                  label: const Text('Get Directions', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF7A0B10),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
