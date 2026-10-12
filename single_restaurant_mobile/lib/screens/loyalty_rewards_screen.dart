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
import 'package:single_restaurant_mobile/utils/toast_utils.dart';
import 'package:single_restaurant_mobile/widgets/common/app_dialog.dart';
import 'package:single_restaurant_mobile/widgets/loyalty/loyalty_guest_view.dart';
import 'package:single_restaurant_mobile/widgets/loyalty/loyalty_join_view.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';

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
    final authProvider = Provider.of<AuthProvider>(context);
    if (authProvider.user == null) {
      return LoyaltyGuestView(
        onBack: () {
          if (Navigator.canPop(context)) {
            Navigator.pop(context);
          }
        },
      );
    }

    final loyalty = Provider.of<LoyaltyProvider>(context);

    // If customer is logged in but has not joined Loyalty Rewards yet
    if (!loyalty.isLoyaltyMember) {
      if (loyalty.isLoading && loyalty.transactions.isEmpty) {
        return const Scaffold(
          backgroundColor: Color(0xFFFEFAF0),
          body: Center(child: CircularProgressIndicator(color: AppColors.primary)),
        );
      }
      return LoyaltyJoinView(
        onBack: () {
          if (Navigator.canPop(context)) {
            Navigator.pop(context);
          }
        },
        onHelp: () => _showRulesInfoDialog(context),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFFEFAF0),
      appBar: AppBar(
        backgroundColor: const Color(0xFFFEFAF0),
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back,
            color: Color(0xFF8B0D18),
            size: 24,
          ),
          onPressed: () {
            if (Navigator.canPop(context)) {
              Navigator.pop(context);
            }
          },
        ),
        title: const Text(
          'Loyalty Rewards',
          style: TextStyle(
            color: Color(0xFF1E1E1E),
            fontWeight: FontWeight.w800,
            fontSize: 19,
            letterSpacing: -0.2,
          ),
        ),
        actions: [
          IconButton(
            onPressed: () => _showRulesInfoDialog(context),
            icon: Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFD97706), width: 1.8),
              ),
              child: const Center(
                child: Text(
                  '?',
                  style: TextStyle(
                    color: Color(0xFFD97706),
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                    height: 1.1,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: ResponsiveCenter(
          maxWidth: 600,
          child: Consumer2<LoyaltyProvider, RestaurantProvider>(
            builder: (context, loyalty, restProv, child) {
              final user = authProvider.user;
              final firstName = user?.name.split(' ').first ?? 'Guest';
              final balance = loyalty.currentBalance;
              final isLoading = loyalty.isLoading && loyalty.transactions.isEmpty;
              final centsPerPoint = restProv.restaurant?['loyaltySettings']?['centsPerPoint'] ?? 1;
              final minMultiplier = restProv.restaurant?['loyaltySettings']?['minimumOrderMultiplier'] ?? 3;

              if (isLoading) {
                return const Center(child: CircularProgressIndicator(color: Color(0xFF8B0D18)));
              }

              return SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
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
        ),
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
      builder: (ctx) => AppDialog(
        icon: Icons.check_circle_outline_rounded,
        iconColor: const Color(0xFF16A34A),
        title: 'Coupon Generated!',
        message: '\$$discountValue OFF your next order',
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBF0),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFF2DFB8)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    couponCode,
                    style: const TextStyle(
                      color: Color(0xFF1E1E1E),
                      fontWeight: FontWeight.w900,
                      fontSize: 18,
                      letterSpacing: 2,
                    ),
                  ),
                  GestureDetector(
                    onTap: () {
                      Clipboard.setData(ClipboardData(text: couponCode));
                      ToastUtils.showSuccess(context, 'Coupon code copied!');
                    },
                    child: const Icon(Icons.copy, color: Color(0xFF8B0D18), size: 20),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Valid for 30 days • Single use only',
              style: TextStyle(color: Color(0xFF6B7280), fontSize: 12),
            ),
          ],
        ),
        primaryActionText: 'Apply to Cart',
        secondaryActionText: 'Use Later',
        onSecondaryAction: () => Navigator.of(ctx).pop(),
        onPrimaryAction: () async {
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
    );
  }


  Widget _buildWelcomeHeader(String name, int balance, dynamic centsPerPoint) {
    final dollarOff = ((balance * centsPerPoint) / 100).toStringAsFixed(2);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF6E1111), Color(0xFF430805)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: const Color(0xFFC88A2E).withValues(alpha: 0.35),
          width: 1.2,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x356A0C0C),
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Background ambient circular glow
          Positioned(
            right: -30,
            top: -30,
            child: Container(
              width: 160,
              height: 160,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.04),
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Welcome back, $name! 👋',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 17,
                  color: Colors.white,
                  letterSpacing: -0.2,
                ),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                    decoration: BoxDecoration(
                      color: const Color(0xFFC88A2E).withValues(alpha: 0.25),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: const Color(0xFFFFD56B).withValues(alpha: 0.7),
                        width: 1,
                      ),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.workspace_premium, color: Color(0xFFFFD56B), size: 14),
                        SizedBox(width: 4),
                        Text(
                          'Gold Member',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 11,
                            color: Color(0xFFFFE082),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'You\'re saving more with every order.',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.82),
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.22),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.08),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Lassi Coins Balance',
                            style: TextStyle(
                              color: Color(0xFFFFDFBA),
                              fontSize: 11.5,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Image.asset(
                                'assets/images/branded/lassi-lounge/loyalty_feat_coins.png',
                                width: 26,
                                height: 26,
                                fit: BoxFit.contain,
                                errorBuilder: (context, error, stackTrace) => const Icon(
                                  Icons.monetization_on,
                                  color: Color(0xFFFFD56B),
                                  size: 24,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                balance.toString(),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w900,
                                  fontSize: 26,
                                  color: Color(0xFFFFE082),
                                  height: 1,
                                ),
                              ),
                              const SizedBox(width: 4),
                              const Text(
                                'PTS',
                                style: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 12,
                                  color: Colors.white70,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '= \$$dollarOff off on next order',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.85),
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      width: 1,
                      height: 54,
                      color: const Color(0xFFC88A2E).withValues(alpha: 0.35),
                      margin: const EdgeInsets.symmetric(horizontal: 14),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Status Perks',
                            style: TextStyle(
                              color: Color(0xFFFFDFBA),
                              fontSize: 11.5,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 6),
                          const Row(
                            children: [
                              Icon(Icons.stars, color: Color(0xFFFFD56B), size: 20),
                              SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  'Top Tier Active',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 13.5,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Earn 5x coins per order',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.85),
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
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
        ],
      ),
    );
  }

  Widget _buildProgressSection(int balance) {
    const int target = 1000;
    final int progress = balance > target ? target : balance;
    final double percent = progress / target;
    final int needed = target - progress;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF3ECE6)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              Text(
                'Your Progress',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                  color: Color(0xFF1E1E1E),
                ),
              ),
              Row(
                children: [
                  Text(
                    'Next Tier: Platinum',
                    style: TextStyle(
                      color: Color(0xFF8B0D18),
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  SizedBox(width: 2),
                  Icon(Icons.chevron_right, size: 16, color: Color(0xFF8B0D18)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              SizedBox(
                width: 96,
                height: 96,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 96,
                      height: 96,
                      child: CircularProgressIndicator(
                        value: percent,
                        strokeWidth: 8,
                        backgroundColor: const Color(0xFFF9EAE8),
                        color: const Color(0xFF8B0D18),
                      ),
                    ),
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.workspace_premium, color: Color(0xFFD97706), size: 24),
                        const SizedBox(height: 2),
                        Text(
                          progress.toString(),
                          style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            fontSize: 19,
                            color: Color(0xFF1E1E1E),
                          ),
                        ),
                        Text(
                          '/ $target',
                          style: const TextStyle(
                            color: Color(0xFF6B7280),
                            fontSize: 10.5,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 22),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    RichText(
                      text: TextSpan(
                        style: const TextStyle(color: Color(0xFF374151), fontSize: 13, height: 1.35),
                        children: [
                          const TextSpan(text: 'Earn '),
                          TextSpan(
                            text: needed.toString(),
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF8B0D18),
                            ),
                          ),
                          const TextSpan(text: ' more coins\nto reach Platinum tier'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: LinearProgressIndicator(
                        value: percent,
                        backgroundColor: const Color(0xFFF9EAE8),
                        color: const Color(0xFF8B0D18),
                        minHeight: 8,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: const [
                        Text(
                          'Gold',
                          style: TextStyle(
                            color: Color(0xFFD97706),
                            fontWeight: FontWeight.w800,
                            fontSize: 12,
                          ),
                        ),
                        Row(
                          children: [
                            Text(
                              'Platinum',
                              style: TextStyle(
                                color: Color(0xFF6B7280),
                                fontWeight: FontWeight.w600,
                                fontSize: 12,
                              ),
                            ),
                            SizedBox(width: 4),
                            Icon(Icons.workspace_premium, color: Color(0xFF9CA3AF), size: 14),
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
      {
        'points': 100,
        'off': (100 * centsPerPoint) / 100,
        'min': ((100 * centsPerPoint) / 100) * minMultiplier,
        'bg': const Color(0xFFFFFBF0),
        'border': const Color(0xFFF2DFB8),
        'accent': const Color(0xFFB45309),
      },
      {
        'points': 250,
        'off': (250 * centsPerPoint) / 100,
        'min': ((250 * centsPerPoint) / 100) * minMultiplier,
        'bg': const Color(0xFFFFF4F4),
        'border': const Color(0xFFFAD1D1),
        'accent': const Color(0xFF8B0D18),
      },
      {
        'points': 500,
        'off': (500 * centsPerPoint) / 100,
        'min': ((500 * centsPerPoint) / 100) * minMultiplier,
        'bg': const Color(0xFFFFF8EC),
        'border': const Color(0xFFF6DEB0),
        'accent': const Color(0xFFC27803),
      },
    ];

    return Padding(
      padding: const EdgeInsets.only(top: 14.0, bottom: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Redeem Rewards',
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 16.5,
                    color: Color(0xFF1E1E1E),
                  ),
                ),
                Text(
                  '${loyalty.currentBalance} Coins Available',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF8B0D18),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 228,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: rewards.length,
              itemBuilder: (context, index) {
                final reward = rewards[index];
                final bg = reward['bg'] as Color;
                final border = reward['border'] as Color;
                final accent = reward['accent'] as Color;
                final int pts = reward['points'] as int;
                final num off = reward['off'] as num;
                final bool canRedeem = loyalty.currentBalance >= pts;

                return Container(
                  width: 132,
                  margin: const EdgeInsets.only(right: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: bg,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: border, width: 1.2),
                    boxShadow: [
                      BoxShadow(
                        color: accent.withValues(alpha: 0.08),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(7),
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        child: Image.asset(
                          'assets/images/branded/lassi-lounge/loyalty_feat_coins.png',
                          width: 24,
                          height: 24,
                          fit: BoxFit.contain,
                          errorBuilder: (context, error, stackTrace) => const Icon(
                            Icons.monetization_on,
                            color: Color(0xFFD97706),
                            size: 20,
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: accent.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '$pts pts',
                          style: TextStyle(
                            color: accent,
                            fontWeight: FontWeight.w800,
                            fontSize: 12,
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '\$${off.toStringAsFixed(2)} OFF',
                        style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 17,
                          color: Color(0xFF1E1E1E),
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        'Min order \$${reward['min']}',
                        style: const TextStyle(
                          color: Color(0xFF6B7280),
                          fontSize: 10.5,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const Spacer(),
                      SizedBox(
                        width: double.infinity,
                        height: 34,
                        child: ElevatedButton(
                          onPressed: canRedeem
                              ? () async {
                                  final res = await loyalty.redeemPoints(pts, off.toInt());
                                  if (res['success'] && context.mounted) {
                                    final couponCode = res['couponCode'] as String?;
                                    _showRedeemSuccessDialog(context, couponCode ?? '', off.toInt());
                                  } else if (context.mounted) {
                                    ToastUtils.showError(context, res['message'] ?? 'Failed');
                                  }
                                }
                              : null,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF8B0D18),
                            disabledBackgroundColor: const Color(0xFFE5E7EB),
                            padding: EdgeInsets.zero,
                            elevation: canRedeem ? 2 : 0,
                            shadowColor: const Color(0xFF8B0D18).withValues(alpha: 0.3),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                          child: Text(
                            'Redeem',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: canRedeem ? Colors.white : const Color(0xFF9CA3AF),
                            ),
                          ),
                        ),
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
                    const Text(
                      'My Coupons',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 16.5,
                        color: Color(0xFF1E1E1E),
                      ),
                    ),
                    if (loyalty.couponsLoading)
                      const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Color(0xFF8B0D18),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 4),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  'Redeemed coupons you haven\'t used yet',
                  style: TextStyle(color: Color(0xFF6B7280), fontSize: 12),
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
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFFF3ECE6)),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x06000000),
                          blurRadius: 8,
                          offset: Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: const BoxDecoration(
                            color: Color(0xFFFFF1F1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.confirmation_num_outlined,
                            color: Color(0xFF8B0D18),
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 14),
                        const Expanded(
                          child: Text(
                            'No unused coupons — redeem points above!',
                            style: TextStyle(
                              color: Color(0xFF6B7280),
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              else
                SizedBox(
                  height: 154,
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
                      final daysLeft = endDate?.difference(DateTime.now()).inDays;

                      // Determine this coupon's state
                      final isApplied = checkout.couponApplied && checkout.couponCode == code;
                      final usedCount = coupon['usedCount'] ?? 0;
                      final maxUses = coupon['maxUses'] ?? 1;
                      final isLocked = usedCount >= maxUses;

                      final cardColor = isLocked
                          ? [const Color(0xFF6B7280), const Color(0xFF4B5563)]
                          : isApplied
                              ? [const Color(0xFF166534), const Color(0xFF14532D)]
                              : [const Color(0xFF8B0D18), const Color(0xFF5A0810)];

                      return Container(
                        width: 206,
                        margin: const EdgeInsets.only(right: 12),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: cardColor,
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: (isLocked
                                      ? Colors.grey
                                      : isApplied
                                          ? const Color(0xFF166534)
                                          : const Color(0xFF8B0D18))
                                  .withValues(alpha: 0.28),
                              blurRadius: 10,
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
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 20,
                                  ),
                                ),
                                if (isApplied)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFFD56B),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Text(
                                      'Applied ✓',
                                      style: TextStyle(
                                        color: Color(0xFF14532D),
                                        fontSize: 9.5,
                                        fontWeight: FontWeight.w900,
                                      ),
                                    ),
                                  )
                                else if (isLocked)
                                  const Icon(Icons.lock, color: Colors.white54, size: 16)
                                else
                                  const Icon(Icons.confirmation_num, color: Color(0xFFFFD56B), size: 20),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.18),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
                              ),
                              child: Text(
                                code,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 13,
                                  letterSpacing: 1.5,
                                ),
                              ),
                            ),
                            if (isLocked)
                              const Text('Used — order placed', style: TextStyle(color: Colors.white70, fontSize: 10.5))
                            else if (daysLeft != null)
                              Text(
                                daysLeft > 0 ? 'Expires in $daysLeft days' : 'Expires today',
                                style: const TextStyle(color: Colors.white70, fontSize: 10.5),
                              ),
                            Row(
                              children: [
                                // Copy button
                                Expanded(
                                  child: GestureDetector(
                                    onTap: isLocked
                                        ? null
                                        : () {
                                            Clipboard.setData(ClipboardData(text: code));
                                            ToastUtils.showSuccess(context, 'Coupon code copied!');
                                          },
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(vertical: 6),
                                      decoration: BoxDecoration(
                                        color: isLocked
                                            ? Colors.white.withValues(alpha: 0.1)
                                            : Colors.white.withValues(alpha: 0.2),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.copy, color: isLocked ? Colors.white30 : Colors.white, size: 12),
                                          const SizedBox(width: 4),
                                          Text(
                                            'Copy',
                                            style: TextStyle(
                                              color: isLocked ? Colors.white30 : Colors.white,
                                              fontSize: 11,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                // Apply / Applied / Locked button
                                Expanded(
                                  child: GestureDetector(
                                    onTap: isLocked
                                        ? null
                                        : () async {
                                            final cart = context.read<CartProvider>();
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
                                                ToastUtils.showSuccess(
                                                  context,
                                                  checkout.couponApplied
                                                      ? '$code applied to cart! ✓'
                                                      : 'Could not apply coupon',
                                                );
                                              }
                                            } catch (e) {
                                              if (context.mounted) {
                                                ToastUtils.showError(
                                                  context,
                                                  e.toString().replaceAll('Exception: ', ''),
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
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(
                                            isLocked
                                                ? Icons.lock_outline
                                                : isApplied
                                                    ? Icons.check
                                                    : Icons.shopping_cart,
                                            color: isLocked
                                                ? Colors.white30
                                                : isApplied
                                                    ? const Color(0xFF14532D)
                                                    : const Color(0xFF8B0D18),
                                            size: 12,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            isLocked ? 'Used' : isApplied ? 'Applied' : 'Apply',
                                            style: TextStyle(
                                              color: isLocked
                                                  ? Colors.white30
                                                  : isApplied
                                                      ? const Color(0xFF14532D)
                                                      : const Color(0xFF8B0D18),
                                              fontSize: 11,
                                              fontWeight: FontWeight.w800,
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
    final restProv = Provider.of<RestaurantProvider>(context);
    final loyaltySettings = restProv.restaurant?['loyaltySettings'] as Map<String, dynamic>?;
    final num pointsPerDollar = loyaltySettings?['pointsPerDollar'] ?? 1;
    final String ptsLabel = pointsPerDollar == 1 ? '1 point' : '$pointsPerDollar points';
    final String orderFoodSubtitle = 'Earn $ptsLabel for every \$1 spent';

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF3ECE6)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              Text(
                'How to Earn',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                  color: Color(0xFF1E1E1E),
                ),
              ),
              Icon(Icons.stars, color: Color(0xFFD97706), size: 20),
            ],
          ),
          const SizedBox(height: 12),
          _buildEarnTile(
            Icons.shopping_bag_outlined,
            'Order Food',
            orderFoodSubtitle,
            'Order Now',
            () {
              Navigator.pop(context);
            },
          ),
          const Divider(height: 16, color: Color(0xFFF3ECE6)),
          _buildEarnTile(
            Icons.calendar_today_outlined,
            'Daily Login Bonus',
            loyalty.hasClaimedDaily
                ? 'Already claimed today — come back tomorrow!'
                : 'Open app daily to get 5 free points',
            loyalty.hasClaimedDaily ? 'Claimed ✓' : 'Claim 5 pts',
            loyalty.hasClaimedDaily
                ? null
                : () async {
                    final res = await loyalty.earnPoints('login');
                    if (!mounted) return;
                    ToastUtils.showError(context, res['message'] ?? '');
                  },
            isClaimed: loyalty.hasClaimedDaily,
            isSpecial: !loyalty.hasClaimedDaily,
          ),
          const Divider(height: 16, color: Color(0xFFF3ECE6)),
          _buildEarnTile(
            Icons.rate_review_outlined,
            'Write a Review',
            'Review a delivered order — earn 20 points',
            'Go to Orders',
            () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => OrdersScreen(onBack: () => Navigator.pop(context)),
                ),
              );
            },
          ),
          const Divider(height: 16, color: Color(0xFFF3ECE6)),
          _buildEarnTile(
            Icons.group_add_outlined,
            'Refer a Friend',
            'Invite friends to earn 100 points per referral',
            'Invite',
            () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ReferralScreen()),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildEarnTile(
    IconData icon,
    String title,
    String subtitle,
    String btnText,
    VoidCallback? onTap, {
    bool isClaimed = false,
    bool isSpecial = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isSpecial ? const Color(0xFFFFFBEB) : const Color(0xFFFFF1F1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: isSpecial ? const Color(0xFFD97706) : const Color(0xFF8B0D18),
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 13.5,
                    color: Color(0xFF1E1E1E),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 11.5,
                    color: Color(0xFF6B7280),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: isClaimed
                  ? const Color(0xFFF3F4F6)
                  : isSpecial
                      ? const Color(0xFFD97706)
                      : const Color(0xFF8B0D18),
              foregroundColor: isClaimed ? const Color(0xFF9CA3AF) : Colors.white,
              elevation: isClaimed ? 0 : 2,
              shadowColor: isClaimed
                  ? Colors.transparent
                  : const Color(0xFF8B0D18).withValues(alpha: 0.25),
              padding: const EdgeInsets.symmetric(horizontal: 12),
              minimumSize: const Size(64, 32),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            onPressed: onTap,
            child: Text(
              btnText,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentActivitySection(List<dynamic> transactions) {
    final items = transactions.isNotEmpty
        ? transactions
        : [
            {'type': 'EARNED', 'title': 'Order Completed', 'desc': '#LL78451236 • 12 May 2026', 'points': 50},
            {'type': 'REDEEMED', 'title': 'Redeemed \$25 OFF', 'desc': '10 May 2026', 'points': -250},
            {'type': 'EARNED', 'title': 'Review Bonus', 'desc': '09 May 2026', 'points': 20},
          ];

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF3ECE6)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              Text(
                'Recent Activity',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                  color: Color(0xFF1E1E1E),
                ),
              ),
              Row(
                children: [
                  Text(
                    'History',
                    style: TextStyle(
                      color: Color(0xFF8B0D18),
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  SizedBox(width: 2),
                  Icon(Icons.chevron_right, size: 16, color: Color(0xFF8B0D18)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...items.asMap().entries.map((entry) {
            final index = entry.key;
            final item = entry.value;
            final points = item['points'] ?? item['amount'] ?? 0;
            final isEarned = points > 0;
            final title = item['title'] ?? item['description'] ?? 'Activity';

            String desc = item['desc'] ?? (item['createdAt'] != null ? item['createdAt'].toString().substring(0, 10) : 'Recent');
            if (!isEarned && item['reward'] != null && item['reward']['couponId'] != null) {
              final coupon = item['reward']['couponId'];
              final code = coupon['code'] ?? '';
              final expires = coupon['expiresAt'] != null ? coupon['expiresAt'].toString().substring(0, 10) : '';
              desc = 'Code: $code • Exp: $expires';
            }

            return Column(
              children: [
                if (index > 0)
                  const Divider(height: 16, color: Color(0xFFF3ECE6)),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(9),
                        decoration: BoxDecoration(
                          color: isEarned
                              ? const Color(0xFFE8F6ED)
                              : const Color(0xFFFFF1F1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          isEarned
                              ? Icons.add_circle_outline
                              : Icons.remove_circle_outline,
                          color: isEarned
                              ? const Color(0xFF16A34A)
                              : const Color(0xFF8B0D18),
                          size: 18,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              title.toString(),
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 13,
                                color: Color(0xFF1E1E1E),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              desc.toString(),
                              style: const TextStyle(
                                fontSize: 11,
                                color: Color(0xFF6B7280),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        '${isEarned ? '+' : ''}$points Coins',
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          color: isEarned
                              ? const Color(0xFF16A34A)
                              : const Color(0xFF8B0D18),
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            );
          }),
        ],
      ),
    );
  }

  Widget _buildExclusiveBenefitsBanner() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFFF8EC), Color(0xFFFFF1D6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF5DCAC), width: 1.2),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0C000000),
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Image.asset(
                'assets/images/branded/lassi-lounge/loyalty_feat_gift.png',
                width: 30,
                height: 30,
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) => const Icon(
                  Icons.card_giftcard,
                  color: Color(0xFF8B0D18),
                  size: 26,
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                RichText(
                  text: const TextSpan(
                    style: TextStyle(color: Color(0xFF1E1E1E), fontSize: 13.5),
                    children: [
                      TextSpan(text: 'Exclusive '),
                      TextSpan(
                        text: 'Member Benefits ',
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF8B0D18),
                        ),
                      ),
                      TextSpan(text: '🎉'),
                    ],
                  ),
                ),
                const SizedBox(height: 3),
                const Text(
                  'Enjoy free items, birthday surprises & special member-only offers!',
                  style: TextStyle(
                    fontSize: 11,
                    color: Color(0xFF6B7280),
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          ElevatedButton(
            onPressed: () {
              ToastUtils.showInfo(context, 'This feature is coming soon!');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF8B0D18),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              minimumSize: Size.zero,
              elevation: 2,
              shadowColor: const Color(0xFF8B0D18).withValues(alpha: 0.3),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text(
              'Explore',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
    );
  }

  void _showRulesInfoDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) {
        return AppDialog(
          icon: Icons.info_outline_rounded,
          iconColor: const Color(0xFF8B0D18),
          title: 'Program Rules',
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
          primaryActionText: 'Got it',
          onPrimaryAction: () => Navigator.pop(ctx),
        );
      },
    );
  }
}
