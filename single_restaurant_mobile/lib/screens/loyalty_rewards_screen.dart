import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/loyalty_provider.dart';
import 'dart:math' as math;

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
      Provider.of<LoyaltyProvider>(context, listen: false).fetchHistory(refresh: true);
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
            onPressed: () {},
          ),
        ],
      ),
      body: Consumer2<LoyaltyProvider, AuthProvider>(
        builder: (context, loyalty, auth, child) {
          final user = auth.user;
          final firstName = user?.name.split(' ').first ?? 'Guest';
          final balance = loyalty.currentBalance;
          final isLoading = loyalty.isLoading && loyalty.transactions.isEmpty;

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
                _buildWelcomeHeader(firstName, balance),
                _buildProgressSection(balance),
                _buildRedeemSection(loyalty),
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
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Welcome to the club! You earned 50 bonus points!'), backgroundColor: Colors.green),
                    );
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(loyalty.error ?? 'Failed to join'), backgroundColor: Colors.red),
                    );
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

  Widget _buildWelcomeHeader(String name, int balance) {
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
                        Text('= \$${(balance / 100).toStringAsFixed(2)} off on your next order', style: TextStyle(color: Colors.grey.shade600, fontSize: 10)),
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

  Widget _buildRedeemSection(LoyaltyProvider loyalty) {
    final rewards = [
      {'points': 100, 'off': 10, 'min': 50, 'color': Colors.blue},
      {'points': 250, 'off': 25, 'min': 100, 'color': Colors.purple},
      {'points': 500, 'off': 50, 'min': 150, 'color': Colors.orange},
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
            height: 180,
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
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.monetization_on, color: color, size: 18),
                          const SizedBox(width: 4),
                          Text(reward['points'].toString(), style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: color)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text('\$${reward['off']} OFF', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 4),
                      Text('Min order \$${reward['min']}', style: TextStyle(color: Colors.grey.shade700, fontSize: 10)),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: canRedeem ? () async {
                          final res = await loyalty.redeemPoints(reward['points'] as int, reward['off'] as int);
                          if (res['success']) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Success! Coupon ${res['couponCode']} generated & can be used in Cart!'), backgroundColor: Colors.green, duration: const Duration(seconds: 4)),
                            );
                          } else {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(res['message'] ?? 'Failed'), backgroundColor: Colors.red),
                            );
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

  Widget _buildHowToEarnSection(LoyaltyProvider loyalty) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('How to Earn', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          _buildEarnTile(Icons.shopping_bag, 'Order Food', 'Earn 5 points for every \$1 spent', 'Order Now', () {
             Navigator.pop(context);
          }),
          _buildEarnTile(Icons.calendar_today, 'Daily Login Bonus', 'Open app daily to get 5 free points', 'Claim 5 pts', () async {
             final res = await loyalty.earnPoints('login');
             if (context.mounted) {
               ScaffoldMessenger.of(context).showSnackBar(
                 SnackBar(content: Text(res['message'] ?? ''), backgroundColor: res['success'] == true ? Colors.green : Colors.red),
               );
             }
          }),
          _buildEarnTile(Icons.rate_review, 'Write a Review', 'Share your experience to get 20 points', 'Review', () async {
             final res = await loyalty.earnPoints('review');
             if (context.mounted) {
               ScaffoldMessenger.of(context).showSnackBar(
                 SnackBar(content: Text(res['message'] ?? ''), backgroundColor: res['success'] == true ? Colors.green : Colors.red),
               );
             }
          }),
          _buildEarnTile(Icons.group_add, 'Refer a Friend', 'Invite friends and get 100 points', 'Invite', () async {
             final res = await loyalty.earnPoints('refer');
             if (context.mounted) {
               ScaffoldMessenger.of(context).showSnackBar(
                 SnackBar(content: Text(res['message'] ?? ''), backgroundColor: res['success'] == true ? Colors.green : Colors.red),
               );
             }
          }),
        ],
      ),
    );
  }

  Widget _buildEarnTile(IconData icon, String title, String subtitle, String btnText, VoidCallback onTap) {
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
          backgroundColor: Colors.white,
          foregroundColor: AppColors.primary,
          side: const BorderSide(color: AppColors.primary),
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
          final isEarned = (item['type'] == 'EARNED' || item['amount'] != null && item['amount'] > 0 || (item['points'] != null && item['points'] > 0));
          final points = item['points'] ?? item['amount'] ?? 0;
          final title = item['title'] ?? item['description'] ?? 'Activity';
          final desc = item['desc'] ?? (item['createdAt'] != null ? item['createdAt'].toString().substring(0, 10) : 'Recent');
          
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
            onPressed: () {},
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
}
