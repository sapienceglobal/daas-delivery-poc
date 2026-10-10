import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/loyalty_provider.dart';
import 'package:single_restaurant_mobile/widgets/loyalty/loyalty_balance_card.dart';
import 'package:single_restaurant_mobile/widgets/loyalty/loyalty_transaction_tile.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';

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
      Provider.of<LoyaltyProvider>(context, listen: false)
          .fetchHistory(refresh: true);
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAF8F5),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.secondary),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Loyalty Points',
          style: TextStyle(
              color: Colors.black, fontWeight: FontWeight.bold, fontSize: 20),
        ),
        centerTitle: true,
      ),
      body: Consumer2<AuthProvider, LoyaltyProvider>(
        builder: (context, authProvider, loyaltyProvider, child) {
          final user = authProvider.user;
          final points = user?.loyaltyPoints ?? 0;

          return RefreshIndicator(
            onRefresh: () async {
              await loyaltyProvider.fetchHistory(refresh: true);
              await authProvider.fetchUser();
            },
            color: AppColors.secondary,
            child: ResponsiveCenter(
              maxWidth: 650,
              child: CustomScrollView(
                controller: _scrollController,
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverToBoxAdapter(
                    child: LoyaltyBalanceCard(points: points),
                  ),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
                      child: Text(
                        'Transaction History',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
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
                                color: AppColors.secondary)),
                      ),
                    )
                  else if (loyaltyProvider.error != null &&
                      loyaltyProvider.transactions.isEmpty)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(40.0),
                        child: Center(
                          child: Text(
                            loyaltyProvider.error!,
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: Colors.red),
                          ),
                        ),
                      ),
                    )
                  else if (loyaltyProvider.transactions.isEmpty)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(40.0),
                        child: Center(
                          child: Column(
                            children: [
                              Icon(Icons.history,
                                  size: 64, color: Colors.grey.shade300),
                              const SizedBox(height: 16),
                              Text(
                                'No transactions yet.',
                                style: TextStyle(
                                    color: Colors.grey.shade600, fontSize: 16),
                              ),
                            ],
                          ),
                        ),
                      ),
                    )
                  else
                    SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          if (index == loyaltyProvider.transactions.length) {
                            return loyaltyProvider.hasMore
                                ? const Padding(
                                    padding: EdgeInsets.all(16.0),
                                    child: Center(
                                        child: CircularProgressIndicator(
                                            color: AppColors.secondary)),
                                  )
                                : const SizedBox(height: 40);
                          }
                          return LoyaltyTransactionTile(
                              tx: loyaltyProvider.transactions[index]);
                        },
                        childCount: loyaltyProvider.transactions.length + 1,
                      ),
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
