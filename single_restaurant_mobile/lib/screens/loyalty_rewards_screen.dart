import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/providers/loyalty_provider.dart';
import 'package:single_restaurant_mobile/providers/checkout_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/screens/orders_screen.dart';
import 'package:single_restaurant_mobile/screens/referral_screen.dart';
import 'dart:math' as math;
import 'package:single_restaurant_mobile/utils/toast_utils.dart';

class LoyaltyRewardsScreen extends StatefulWidget {
  const LoyaltyRewardsScreen({super.key});

  @override
  State<LoyaltyRewardsScreen> createState() => _LoyaltyRewardsScreenState();
}

class _LoyaltyRewardsScreenState extends State<LoyaltyRewardsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final loyalty = Provider.of<LoyaltyProvider>(context, listen: false);
      loyalty.fetchHistory(refresh: true);
      loyalty.fetchMyCoupons();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        title: const Text('Loyalty Rewards', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 18)),
        iconTheme: const IconThemeData(color: AppColors.primary),
        actions: [
          IconButton(
            icon: const Icon(Icons.help_outline, color: AppColors.primary),
            onPressed: () => _showRulesInfoDialog(context),
          ),
        ],
      ),
      body: Consumer3<LoyaltyProvider, AuthProvider, RestaurantProvider>(
        builder: (context, loyalty, auth, restProv, child) {
          final user = auth.user;
          final firstName = user?.name.split(' ').first ?? 'Guest';
          final balance = loyalty.currentBalance;
          final isLoading = loyalty.isLoading && loyalty.transactions.isEmpty;
          final centsPerPoint = restProv.restaurant?['loyaltySettings']?['centsPerPoint'] ?? 1;
          final minMultiplier = restProv.restaurant?['loyaltySettings']?['minimumOrderMultiplier'] ?? 3;

          if (isLoading) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primary));
          }

          if (!loyalty.isLoyaltyMember) {
            return _buildJoinScreen(context, loyalty);
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.only(bottom: 40),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildWelcomeHeader(firstName, balance, centsPerPoint),
                _buildProgressSection(balance),
                _buildRedeemSection(loyalty, centsPerPoint, minMultiplier),
                _buildMyCouponsSection(loyalty),
                _buildHowToEarnSection(loyalty),
                _buildRecentActivitySection(loyalty.transactions),
                _buildExclusiveBenefitsBanner(),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showRedeemSuccessDialog(BuildContext context, String couponCode, int discountValue) {
    final messenger = ScaffoldMessenger.of(context);
    final checkout = context.read<CheckoutProvider>();
    final cart = context.read<CartProvider>();
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        contentPadding: EdgeInsets.zero,
        content: Container(
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(20)),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [Colors.green.shade600, Colors.teal.shade500]),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                ),
                child: Column(children: [
                  const Icon(Icons.check_circle, color: Colors.white, size: 48),
                  const SizedBox(height: 8),
                  const Text('Coupon Generated!', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                  Text('\$$discountValue OFF your next order', style: const TextStyle(color: Colors.white70, fontSize: 13)),
                ]),
              ),
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(couponCode, style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 18, letterSpacing: 2)),
                          GestureDetector(
                            onTap: () {
                              Clipboard.setData(ClipboardData(text: couponCode));
                              ToastUtils.showSuccess(context, 'Coupon code copied!');
                            },
                            child: const Icon(Icons.copy, color: AppColors.primary, size: 20),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text('Valid for 30 days • Single use only', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        icon: const Icon(Icons.shopping_cart, size: 18),
                        label: const Text('Apply to Cart', style: TextStyle(fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () async {
                          checkout.setCouponCode(couponCode);
                          
                          if (cart.items.isEmpty) {
                            Navigator.of(ctx).pop();
                            messenger.showSnackBar(
                              const SnackBar(content: Text('Coupon copied! Add items to cart to apply.'), backgroundColor: Colors.orange),
                            );
                            return;
                          }
                          
                          try {
                            await checkout.handleApplyCoupon(cart);
                            if (ctx.mounted) Navigator.of(ctx).pop();
                            if (checkout.couponApplied) {
                              messenger.showSnackBar(
                                const SnackBar(content: Text('Coupon applied successfully to your cart!'), backgroundColor: Colors.green),
                              );
                            } else {
                              messenger.showSnackBar(
                                const SnackBar(content: Text('Coupon set, but could not be applied.'), backgroundColor: Colors.orange),
                              );
                            }
                          } catch (e) {
                            if (ctx.mounted) Navigator.of(ctx).pop();
                            messenger.showSnackBar(
                              SnackBar(content: Text(e.toString().replaceAll('Exception: ', '')), backgroundColor: Colors.red),
                            );
                          }
                        },
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () => Navigator.of(ctx).pop(),
                      child: const Text('Use Later', style: TextStyle(color: Colors.grey)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildJoinScreen(BuildContext context, LoyaltyProvider loyalty) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.workspace_premium, size: 80, color: Colors.orange.shade400),
            const SizedBox(height: 24),
            const Text('Join Lassi Lounge Club', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Text(
              'Earn points with every order, get exclusive discounts, and claim your daily login bonus!',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16, color: Colors.grey.shade600, height: 1.5),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () async {
                  final success = await loyalty.joinProgram();
                  if (success) {
                    ToastUtils.showSuccess(context, 'Welcome to the club! You earned 50 bonus points!');
                  } else {
                    ToastUtils.showError(context, loyalty.error ?? 'Failed to join');
                  }
                },
                child: loyalty.isLoading 
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text('JOIN NOW FOR FREE', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWelcomeHeader(String name, int balance, dynamic centsPerPoint) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.orange.shade50, Colors.orange.shade100],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.orange.shade200),
      ),
      child: Stack(
        children: [
          Positioned(
            right: -20,
            top: -20,
            child: Icon(Icons.stars, size: 100, color: Colors.orange.withValues(alpha: 0.1)),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Welcome back, $name! 👋', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 4),
              Text('You\'re saving more with every order.', style: TextStyle(color: Colors.grey.shade700, fontSize: 12)),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Lassi Coins Balance', style: TextStyle(color: Colors.grey.shade800, fontSize: 11)),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.monetization_on, color: Colors.orange, size: 24),
                            const SizedBox(width: 8),
                            Text(balance.toString(), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 24, color: AppColors.primary)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text('= \$${((balance * centsPerPoint) / 100).toStringAsFixed(2)} off on your next order', style: TextStyle(color: Colors.grey.shade600, fontSize: 10)),
                      ],
                    ),
                  ),
                  Container(width: 1, height: 50, color: Colors.orange.shade300, margin: const EdgeInsets.symmetric(horizontal: 12)),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Membership Tier', style: TextStyle(color: Colors.grey.shade800, fontSize: 11)),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.workspace_premium, color: Colors.amber, size: 20),
                            const SizedBox(width: 4),
                            Text('Gold Member', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.red.shade700)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text('You\'re in our top tier!', style: TextStyle(color: Colors.grey.shade600, fontSize: 10)),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildProgressSection(int balance) {
    const int target = 1000;
    final int progress = balance > target ? target : balance;
    final double percent = progress / target;
    final int needed = target - progress;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Your Progress', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              Text('Next Tier: Platinum >', style: TextStyle(color: Colors.red.shade700, fontSize: 12, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              SizedBox(
                width: 100,
                height: 100,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 100,
                      height: 100,
                      child: CircularProgressIndicator(
                        value: percent,
                        strokeWidth: 8,
                        backgroundColor: Colors.grey.shade200,
                        color: Colors.red.shade700,
                      ),
                    ),
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.workspace_premium, color: Colors.amber, size: 24),
                        Text(progress.toString(), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
                        Text('/ $target', style: TextStyle(color: Colors.grey.shade600, fontSize: 10)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 24),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    RichText(
                      text: TextSpan(
                        style: const TextStyle(color: Colors.black87, fontSize: 13),
                        children: [
                          const TextSpan(text: 'Earn '),
                          TextSpan(text: needed.toString(), style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
                          const TextSpan(text: ' more coins\nto reach Platinum tier'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    LinearProgressIndicator(
                      value: percent,
                      backgroundColor: Colors.grey.shade200,
                      color: Colors.red.shade700,
                      minHeight: 8,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Gold', style: TextStyle(color: Colors.orange, fontWeight: FontWeight.bold, fontSize: 12)),
                        Row(
                          children: [
                            Text('Platinum', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                            const SizedBox(width: 4),
                            Icon(Icons.workspace_premium, color: Colors.grey.shade400, size: 14),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRedeemSection(LoyaltyProvider loyalty, dynamic centsPerPoint, dynamic minMultiplier) {
    final rewards = [
      {'points': 100, 'off': (100 * centsPerPoint) / 100, 'min': ((100 * centsPerPoint) / 100) * minMultiplier, 'color': Colors.blue},
      {'points': 250, 'off': (250 * centsPerPoint) / 100, 'min': ((250 * centsPerPoint) / 100) * minMultiplier, 'color': Colors.purple},
      {'points': 500, 'off': (500 * centsPerPoint) / 100, 'min': ((500 * centsPerPoint) / 100) * minMultiplier, 'color': Colors.orange},
    ];

    return Padding(
      padding: const EdgeInsets.only(top: 32.0, bottom: 24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16.0),
            child: Text('Redeem Rewards', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 220,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: rewards.length,
              itemBuilder: (context, index) {
                final reward = rewards[index];
                final color = reward['color'] as MaterialColor;
                final bool canRedeem = loyalty.currentBalance >= (reward['points'] as int);
                
                return Container(
                  width: 120,
                  margin: const EdgeInsets.only(right: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: color.shade50,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.monetization_on, color: Colors.amber, size: 20),
                      ),
                      const SizedBox(height: 12),
                      Text(reward['points'].toString(), style: TextStyle(color: color.shade700, fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 4),
                      Text('\$${(reward['off'] as num).toStringAsFixed(2)} OFF', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.black87)),
                      const SizedBox(height: 4),
                      Text('Min order \$${reward['min']}', style: TextStyle(color: Colors.grey.shade700, fontSize: 10)),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: canRedeem ? () async {
                          final res = await loyalty.redeemPoints(reward['points'] as int, (reward['off'] as num).toInt());
                          if (res['success'] && context.mounted) {
                            final couponCode = res['couponCode'] as String?;
                            _showRedeemSuccessDialog(context, couponCode ?? '', (reward['off'] as num).toInt());
                          } else if (context.mounted) {
                            ToastUtils.showError(context, res['message'] ?? 'Failed');
                          }
                        } : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: color,
                          disabledBackgroundColor: Colors.grey.shade300,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          minimumSize: const Size(80, 32),
                        ),
                        child: Text(
                          'Redeem',
                          style: TextStyle(fontSize: 12, color: canRedeem ? Colors.white : Colors.grey.shade600),
                        ),
                      )
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMyCouponsSection(LoyaltyProvider loyalty) {
    return Consumer<CheckoutProvider>(
      builder: (context, checkout, _) {
        return Padding(
          padding: const EdgeInsets.only(top: 8, bottom: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('My Coupons', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    if (loyalty.couponsLoading)
                      const SizedBox(
                        width: 14, height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 4),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  'Redeemed coupons you haven\'t used yet',
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                ),
              ),
              const SizedBox(height: 12),
              if (!loyalty.couponsLoading && loyalty.myCoupons.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.confirmation_num_outlined, color: Colors.grey.shade400, size: 28),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'No unused coupons — redeem points above!',
                            style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              else
                SizedBox(
                  height: 148,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: loyalty.myCoupons.length,
                    itemBuilder: (context, index) {
                      final coupon = loyalty.myCoupons[index];
                      final code = coupon['code'] as String? ?? '';
                      final value = coupon['value'] ?? 0;
                      final endDate = coupon['endDate'] != null
                          ? DateTime.tryParse(coupon['endDate'].toString())
                          : null;
                      final daysLeft = endDate != null
                          ? endDate.difference(DateTime.now()).inDays
                          : null;

                      // Determine this coupon's state
                      final isApplied = checkout.couponApplied && checkout.couponCode == code;
                      // Coupon is locked (fully used) — backend won't return it from my-coupons
                      // but if usedCount >= maxUses from cache it should show locked
                      final usedCount = coupon['usedCount'] ?? 0;
                      final maxUses = coupon['maxUses'] ?? 1;
                      final isLocked = usedCount >= maxUses;

                      final cardColor = isLocked
                          ? [Colors.grey.shade500, Colors.grey.shade400]
                          : isApplied
                              ? [Colors.green.shade800, Colors.teal.shade700]
                              : [Colors.green.shade700, Colors.teal.shade600];

                      return Container(
                        width: 200,
                        margin: const EdgeInsets.only(right: 12),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: cardColor,
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: [
                            BoxShadow(
                              color: (isLocked ? Colors.grey : Colors.green).withValues(alpha: 0.25),
                              blurRadius: 8,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '\$$value OFF',
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20),
                                ),
                                if (isApplied)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withValues(alpha: 0.25),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Text('Applied ✓', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                                  )
                                else if (isLocked)
                                  const Icon(Icons.lock, color: Colors.white54, size: 16)
                                else
                                  const Icon(Icons.confirmation_num, color: Colors.white60, size: 20),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                code,
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 1.5),
                              ),
                            ),
                            if (isLocked)
                              const Text('Used — order placed', style: TextStyle(color: Colors.white70, fontSize: 10))
                            else if (daysLeft != null)
                              Text(
                                daysLeft > 0 ? 'Expires in $daysLeft days' : 'Expires today',
                                style: const TextStyle(color: Colors.white70, fontSize: 10),
                              ),
                            Row(
                              children: [
                                // Copy button — disabled when locked
                                Expanded(
                                  child: GestureDetector(
                                    onTap: isLocked ? null : () {
                                      Clipboard.setData(ClipboardData(text: code));
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(content: Text('Coupon code copied!'), duration: Duration(seconds: 2)),
                                      );
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(vertical: 6),
                                      decoration: BoxDecoration(
                                        color: isLocked
                                            ? Colors.white.withValues(alpha: 0.1)
                                            : Colors.white.withValues(alpha: 0.2),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.copy, color: isLocked ? Colors.white30 : Colors.white, size: 12),
                                          const SizedBox(width: 4),
                                          Text('Copy', style: TextStyle(color: isLocked ? Colors.white30 : Colors.white, fontSize: 11)),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                // Apply/Applied/Locked button
                                Expanded(
                                  child: GestureDetector(
                                    onTap: isLocked ? null : () async {
                                      final cart = context.read<CartProvider>();
                                      // If already applied → nothing to do
                                      if (isApplied) {
                                        ToastUtils.showSuccess(context, '$code is already applied to your cart!');
                                        return;
                                      }
                                      checkout.setCouponCode(code);
                                      if (cart.items.isEmpty) {
                                        ToastUtils.showInfo(context, 'Add items to cart first!');
                                        return;
                                      }
                                      try {
                                        await checkout.handleApplyCoupon(cart);
                                        if (context.mounted) {
                                          ToastUtils.showSuccess(context, checkout.couponApplied ? '$code applied to cart! ✓' : 'Could not apply coupon');
                                        }
                                      } catch (e) {
                                        if (context.mounted) {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            SnackBar(content: Text(e.toString().replaceAll('Exception: ', '')), backgroundColor: Colors.red),
                                          );
                                        }
                                      }
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(vertical: 6),
                                      decoration: BoxDecoration(
                                        color: isLocked
                                            ? Colors.white.withValues(alpha: 0.1)
                                            : Colors.white,
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(
                                            isLocked ? Icons.lock_outline : isApplied ? Icons.check : Icons.shopping_cart,
                                            color: isLocked ? Colors.white30 : isApplied ? Colors.green.shade700 : Colors.green,
                                            size: 12,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            isLocked ? 'Used' : isApplied ? 'Applied' : 'Apply',
                                            style: TextStyle(
                                              color: isLocked ? Colors.white30 : isApplied ? Colors.green.shade700 : Colors.green,
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
            ],
          ),
        );
      },
    );
  }


  Widget _buildHowToEarnSection(LoyaltyProvider loyalty) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('How to Earn', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          _buildEarnTile(
            Icons.shopping_bag,
            'Order Food',
            'Earn 5 points for every \$1 spent',
            'Order Now',
            () { Navigator.pop(context); },
          ),
          _buildEarnTile(
            Icons.calendar_today,
            'Daily Login Bonus',
            loyalty.hasClaimedDaily
                ? 'Already claimed today — come back tomorrow!'
                : 'Open app daily to get 5 free points',
            loyalty.hasClaimedDaily ? 'Claimed ✓' : 'Claim 5 pts',
            loyalty.hasClaimedDaily
                ? null
                : () async {
                    final res = await loyalty.earnPoints('login');
                    if (context.mounted) {
                      ToastUtils.showError(context, res['message'] ?? '');
                    }
                  },
            isClaimed: loyalty.hasClaimedDaily,
          ),
          _buildEarnTile(
            Icons.rate_review,
            'Write a Review',
            'Review a delivered order — earn 20 points per order (once per order)',
            'Go to Orders',
            () { Navigator.push(context, MaterialPageRoute(builder: (_) => OrdersScreen(onBack: () => Navigator.pop(context)))); },
          ),
          _buildEarnTile(
            Icons.group_add,
            'Refer a Friend',
            'Invite friends to earn 100 points per referral',
            'Invite',
            () { Navigator.push(context, MaterialPageRoute(builder: (_) => const ReferralScreen())); },
          ),
        ],
      ),
    );
  }

  Widget _buildEarnTile(IconData icon, String title, String subtitle, String btnText, VoidCallback? onTap, {bool isClaimed = false}) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 0, vertical: 4),
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: Colors.red.shade50, shape: BoxShape.circle),
        child: Icon(icon, color: AppColors.primary, size: 24),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
      subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: Colors.grey)),
      trailing: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: isClaimed ? Colors.grey.shade300 : Colors.white,
          foregroundColor: isClaimed ? Colors.grey.shade600 : AppColors.primary,
          side: BorderSide(color: isClaimed ? Colors.transparent : AppColors.primary),
          padding: const EdgeInsets.symmetric(horizontal: 12),
          minimumSize: const Size(60, 30),
          elevation: 0,
        ),
        onPressed: onTap,
        child: Text(btnText, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildRecentActivitySection(List<dynamic> transactions) {
    // If we have actual transactions, map them. Otherwise, show mocks as per UI.
    final items = transactions.isNotEmpty 
        ? transactions 
        : [
            {'type': 'EARNED', 'title': 'Order Completed', 'desc': '#LL78451236 • 12 May 2026', 'points': 50},
            {'type': 'REDEEMED', 'title': 'Redeemed \$25 OFF', 'desc': '10 May 2026', 'points': -250},
            {'type': 'EARNED', 'title': 'Review Bonus', 'desc': '09 May 2026', 'points': 20},
          ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 16),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Recent Activity', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              Text('View History', style: TextStyle(color: Colors.red.shade700, fontSize: 12, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
        const SizedBox(height: 8),
        ...items.map((item) {
          final points = item['points'] ?? item['amount'] ?? 0;
          final isEarned = points > 0;
          final title = item['title'] ?? item['description'] ?? 'Activity';
          
          String desc = item['desc'] ?? (item['createdAt'] != null ? item['createdAt'].toString().substring(0, 10) : 'Recent');
          if (!isEarned && item['reward'] != null && item['reward']['couponId'] != null) {
            final coupon = item['reward']['couponId'];
            final code = coupon['code'] ?? '';
            final expires = coupon['expiresAt'] != null ? coupon['expiresAt'].toString().substring(0, 10) : '';
            desc = 'Code:  • Exp: ';
          }
          
          return ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
            leading: Icon(
              isEarned ? Icons.add_circle_outline : Icons.card_giftcard,
              color: isEarned ? Colors.green : Colors.blue,
              size: 24,
            ),
            title: Text(title.toString(), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            subtitle: Text(desc.toString(), style: const TextStyle(fontSize: 11)),
            trailing: Text(
              '${isEarned ? '+' : ''}$points Coins',
              style: TextStyle(fontWeight: FontWeight.bold, color: isEarned ? Colors.green : Colors.red, fontSize: 13),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildExclusiveBenefitsBanner() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.red.shade100),
      ),
      child: Row(
        children: [
          const Icon(Icons.card_giftcard, color: AppColors.primary, size: 40),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                RichText(
                  text: const TextSpan(
                    style: TextStyle(color: Colors.black87, fontSize: 13),
                    children: [
                      TextSpan(text: 'Exclusive '),
                      TextSpan(text: 'Member Benefits ', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
                      TextSpan(text: '🎉'),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                const Text('Enjoy free items, birthday surprises and special member-only offers!', style: TextStyle(fontSize: 10)),
              ],
            ),
          ),
          const SizedBox(width: 12),
          ElevatedButton(
            onPressed: () {
              ToastUtils.showInfo(context, 'This feature is coming soon!');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              minimumSize: Size.zero,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('Explore Benefits', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showRulesInfoDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(
            children: [
              const Icon(Icons.info_outline, color: AppColors.primary),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Program Rules',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'How it works:',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const SizedBox(height: 8),
              Text(
                '• You earn points on every eligible order.\n'
                '• Points can be redeemed for exclusive discounts.\n\n'
                'Please note: The restaurant reserves the right to modify the points required for rewards, or the value of points, at any time without prior notice. '
                'However, any coupons or rewards you have already redeemed will remain valid until their expiration date.',
                style: TextStyle(fontSize: 13, color: Colors.grey.shade800, height: 1.4),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Got it', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }
}
