import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/loyalty_provider.dart';
import 'package:single_restaurant_mobile/widgets/loyalty/loyalty_balance_card.dart';
import 'package:single_restaurant_mobile/widgets/loyalty/loyalty_transaction_tile.dart';
import 'package:single_restaurant_mobile/widgets/loyalty/loyalty_guest_view.dart';
import 'package:single_restaurant_mobile/widgets/loyalty/loyalty_join_view.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';

const _kMaroon = Color(0xFF6E1111);
const _kBackBtnBg = Color(0xFFFBE4E1);
const _kErrorBadgeBg = Color(0xFFFDECE9);

class LoyaltyScreen extends StatefulWidget {
  const LoyaltyScreen({super.key});

  @override
  State<LoyaltyScreen> createState() => _LoyaltyScreenState();
}

class _LoyaltyScreenState extends State<LoyaltyScreen> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      if (auth.user != null) {
        Provider.of<LoyaltyProvider>(context, listen: false)
            .fetchHistory(refresh: true);
      }
    });

    _scrollController.addListener(() {
      if (_scrollController.position.pixels >=
          _scrollController.position.maxScrollExtent - 200) {
        Provider.of<LoyaltyProvider>(context, listen: false).fetchHistory();
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Widget _buildErrorCard(LoyaltyProvider loyaltyProvider) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 18),
      padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 14,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Document with exclamation in circle
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 90,
                height: 90,
                decoration: const BoxDecoration(
                  color: _kErrorBadgeBg,
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Icon(
                    Icons.article_outlined,
                    color: Color(0xFFC0706B),
                    size: 46,
                  ),
                ),
              ),
              Positioned(
                right: 18,
                bottom: 18,
                child: Container(
                  width: 24,
                  height: 24,
                  decoration: const BoxDecoration(
                    color: Color(0xFFD32F2F),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Text(
                      '!',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Text(
            'Failed to load loyalty history',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: _kMaroon,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Something went wrong. Please try again.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 22),
          // Try Again Button
          ElevatedButton(
            onPressed: () {
              loyaltyProvider.fetchHistory(refresh: true);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: _kMaroon,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(24),
              ),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.refresh, size: 20, color: Colors.white),
                SizedBox(width: 8),
                Text(
                  'Try Again',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 18),
      padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 14,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Center(
        child: Column(
          children: [
            Container(
              width: 76,
              height: 76,
              decoration: const BoxDecoration(
                color: _kErrorBadgeBg,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.history,
                color: _kMaroon,
                size: 38,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'No Transactions Yet',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: Color(0xFF2B2B2B),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Your loyalty points activity will appear here.',
              style: TextStyle(color: Colors.grey.shade600, fontSize: 13.5),
            ),
          ],
        ),
      ),
    );
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
    if (!loyalty.isLoyaltyMember) {
      return LoyaltyJoinView(
        onBack: () {
          if (Navigator.canPop(context)) {
            Navigator.pop(context);
          }
        },
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFFAF6F1),
      body: SafeArea(
        child: ResponsiveCenter(
          maxWidth: 650,
          child: Column(
            children: [
              // Custom Header Bar
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
                child: SizedBox(
                  height: 48,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Align(
                        alignment: Alignment.centerLeft,
                        child: GestureDetector(
                          onTap: () => Navigator.pop(context),
                          child: Container(
                            width: 42,
                            height: 42,
                            decoration: const BoxDecoration(
                              color: _kBackBtnBg,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.arrow_back,
                                color: _kMaroon, size: 22),
                          ),
                        ),
                      ),
                      const Text(
                        'Loyalty Points',
                        style: TextStyle(
                          fontFamily: 'serif',
                          color: _kMaroon,
                          fontWeight: FontWeight.bold,
                          fontSize: 23,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Content
              Expanded(
                child: Consumer2<AuthProvider, LoyaltyProvider>(
                  builder: (context, authProvider, loyaltyProvider, child) {
                    final user = authProvider.user;
                    final points = user?.loyaltyPoints ?? 0;

                    return RefreshIndicator(
                      onRefresh: () async {
                        await loyaltyProvider.fetchHistory(refresh: true);
                        await authProvider.fetchUser();
                      },
                      color: _kMaroon,
                      child: CustomScrollView(
                        controller: _scrollController,
                        physics: const AlwaysScrollableScrollPhysics(),
                        slivers: [
                          SliverToBoxAdapter(
                            child: LoyaltyBalanceCard(points: points),
                          ),
                          SliverToBoxAdapter(
                            child: Padding(
                              padding:
                                  const EdgeInsets.fromLTRB(16, 24, 16, 14),
                              child: Text(
                                'Transaction History',
                                style: TextStyle(
                                  fontSize: 19,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.grey.shade900,
                                ),
                              ),
                            ),
                          ),
                          if (loyaltyProvider.isLoading &&
                              loyaltyProvider.transactions.isEmpty)
                            const SliverToBoxAdapter(
                              child: Padding(
                                padding: EdgeInsets.all(40.0),
                                child: Center(
                                  child: CircularProgressIndicator(
                                      color: _kMaroon),
                                ),
                              ),
                            )
                          else if (loyaltyProvider.error != null &&
                              loyaltyProvider.transactions.isEmpty)
                            SliverToBoxAdapter(
                              child: _buildErrorCard(loyaltyProvider),
                            )
                          else if (loyaltyProvider.transactions.isEmpty)
                            SliverToBoxAdapter(
                              child: _buildEmptyCard(),
                            )
                          else
                            SliverPadding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 16),
                              sliver: SliverList(
                                delegate: SliverChildBuilderDelegate(
                                  (context, index) {
                                    if (index ==
                                        loyaltyProvider.transactions.length) {
                                      return loyaltyProvider.hasMore
                                          ? const Padding(
                                              padding: EdgeInsets.all(16.0),
                                              child: Center(
                                                child: CircularProgressIndicator(
                                                    color: _kMaroon),
                                              ),
                                            )
                                          : const SizedBox(height: 40);
                                    }
                                    return LoyaltyTransactionTile(
                                      tx: loyaltyProvider.transactions[index],
                                    );
                                  },
                                  childCount:
                                      loyaltyProvider.transactions.length + 1,
                                ),
                              ),
                            ),
                          const SliverToBoxAdapter(
                            child: SizedBox(height: 30),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
