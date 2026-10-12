import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/loyalty_provider.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';

class LoyaltyJoinView extends StatelessWidget {
  final VoidCallback? onBack;
  final VoidCallback? onHelp;

  const LoyaltyJoinView({
    super.key,
    this.onBack,
    this.onHelp,
  });

  Widget _buildFeatureCard({
    required String imageAsset,
    required String title,
    required String subtitle,
  }) {
    return Column(
      children: [
        Container(
          width: 58,
          height: 58,
          decoration: const BoxDecoration(
            color: Color(0xFFFFF1F1),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Image.asset(
              imageAsset,
              width: 38,
              height: 38,
              fit: BoxFit.contain,
              errorBuilder: (context, error, stackTrace) => const Icon(
                Icons.stars,
                color: Color(0xFF8B0D18),
                size: 28,
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Text(
          title,
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 13.5,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1E1E1E),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 11.5,
            color: Color(0xFF6B7280),
            height: 1.25,
          ),
        ),
      ],
    );
  }

  Widget _buildBrandLogo() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            const Text(
              'Lassi ',
              style: TextStyle(
                fontFamily: 'serif',
                fontSize: 30,
                fontWeight: FontWeight.w900,
                color: Color(0xFF8B0D18),
                letterSpacing: -0.5,
              ),
            ),
            Stack(
              clipBehavior: Clip.none,
              children: [
                const Text(
                  'Lounge',
                  style: TextStyle(
                    fontFamily: 'serif',
                    fontSize: 30,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFFC88A2E),
                    letterSpacing: -0.5,
                  ),
                ),
                Positioned(
                  top: -12,
                  right: 16,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Transform.rotate(
                        angle: -0.28,
                        child: const Icon(Icons.eco, size: 14, color: Color(0xFF8A7228)),
                      ),
                      Transform.rotate(
                        angle: 0.28,
                        child: const Icon(Icons.eco, size: 12, color: Color(0xFF9E8434)),
                      ),
                    ],
                  ),
                ),
                const Positioned(
                  top: -2,
                  right: -9,
                  child: Text(
                    '®',
                    style: TextStyle(
                      fontSize: 9.5,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF8B0D18),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 3),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 32,
              height: 1,
              color: const Color(0xFF8B0D18).withValues(alpha: 0.35),
            ),
            const SizedBox(width: 8),
            const Text(
              'INDIAN RESTAURANT',
              style: TextStyle(
                fontSize: 9.5,
                fontWeight: FontWeight.w700,
                letterSpacing: 2.2,
                color: Color(0xFF4A181C),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              width: 32,
              height: 1,
              color: const Color(0xFF8B0D18).withValues(alpha: 0.35),
            ),
          ],
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFEFAF0),
      appBar: AppBar(
        backgroundColor: const Color(0xFFFEFAF0),
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back,
            color: Color(0xFF8B0D18),
            size: 24,
          ),
          onPressed: onBack ?? () {
            if (Navigator.canPop(context)) {
              Navigator.pop(context);
            }
          },
        ),
        centerTitle: true,
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
            onPressed: onHelp,
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
      body: LayoutBuilder(
        builder: (context, constraints) {
          final isSmall = constraints.maxHeight < 680;

          return Stack(
            children: [
              // 1. Subtle top-right Mandala watermark
              Positioned(
                top: 0,
                right: -60,
                child: IgnorePointer(
                  child: Opacity(
                    opacity: 0.05,
                    child: Image.asset(
                      'assets/images/branded/lassi-lounge/mandala_pattern.png',
                      width: 260,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => const SizedBox(),
                    ),
                  ),
                ),
              ),

              // 2. Bottom authentic food photography (Kadhai curry & garlic naan)
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: IgnorePointer(
                  child: Image.asset(
                    'assets/images/branded/lassi-lounge/empty_cart_bottom_food.png',
                    width: double.infinity,
                    height: isSmall ? 110 : 150,
                    fit: BoxFit.cover,
                    alignment: Alignment.bottomCenter,
                    errorBuilder: (context, error, stackTrace) => const SizedBox(),
                  ),
                ),
              ),

              // 3. Foreground content
              SafeArea(
                top: false,
                bottom: true,
                child: ResponsiveCenter(
                  maxWidth: 550,
                  alignment: Alignment.topCenter,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    child: Column(
                      children: [
                        const SizedBox(height: 12),

                        // Logo: Lassi Lounge INDIAN RESTAURANT
                        _buildBrandLogo(),

                        const SizedBox(height: 14),

                        // Hero 3D Gold Medal Illustration
                        SizedBox(
                          height: isSmall ? 190 : 230,
                          child: Image.asset(
                            'assets/images/branded/lassi-lounge/loyalty_join_medal.png',
                            fit: BoxFit.contain,
                            errorBuilder: (context, error, stackTrace) => const Icon(
                              Icons.military_tech_rounded,
                              size: 100,
                              color: Color(0xFFE5A93C),
                            ),
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Title: Join Lassi Lounge Rewards
                        RichText(
                          textAlign: TextAlign.center,
                          text: TextSpan(
                            style: TextStyle(
                              fontSize: isSmall ? 22 : 25.5,
                              fontWeight: FontWeight.w900,
                              color: const Color(0xFF1E1E1E),
                              letterSpacing: -0.4,
                              height: 1.25,
                            ),
                            children: const [
                              TextSpan(text: 'Join '),
                              TextSpan(
                                text: 'Lassi Lounge Rewards',
                                style: TextStyle(
                                  color: Color(0xFF8B0D18),
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 10),

                        // Subtitle
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: Text(
                            'Earn points with every order, get exclusive discounts, and claim your daily login bonus!',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: isSmall ? 13 : 14.5,
                              color: const Color(0xFF4B5563),
                              height: 1.45,
                              fontWeight: FontWeight.w400,
                            ),
                          ),
                        ),

                        const SizedBox(height: 24),

                        // Three Feature Cards Row
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: _buildFeatureCard(
                                  imageAsset:
                                      'assets/images/branded/lassi-lounge/loyalty_feat_coins.png',
                                  title: 'Earn Points',
                                  subtitle: 'Get points with\nevery order',
                                ),
                              ),
                              Container(
                                margin: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
                                width: 1,
                                height: 50,
                                color: const Color(0xFFEBE0D2),
                              ),
                              Expanded(
                                child: _buildFeatureCard(
                                  imageAsset:
                                      'assets/images/branded/lassi-lounge/loyalty_feat_gift.png',
                                  title: 'Exclusive Offers',
                                  subtitle: 'Member-only\ndiscounts',
                                ),
                              ),
                              Container(
                                margin: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
                                width: 1,
                                height: 50,
                                color: const Color(0xFFEBE0D2),
                              ),
                              Expanded(
                                child: _buildFeatureCard(
                                  imageAsset:
                                      'assets/images/branded/lassi-lounge/loyalty_feat_calendar.png',
                                  title: 'Daily Bonus',
                                  subtitle: 'Claim rewards\nevery day',
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 28),

                        // Big Rounded JOIN NOW FOR FREE Button
                        Consumer<LoyaltyProvider>(
                          builder: (context, loyalty, _) {
                            return Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              child: SizedBox(
                                width: double.infinity,
                                height: 52,
                                child: ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF8B0D18),
                                    foregroundColor: Colors.white,
                                    elevation: 4,
                                    shadowColor: const Color(0xFF8B0D18).withValues(alpha: 0.35),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                  ),
                                  onPressed: loyalty.isLoading
                                      ? null
                                      : () async {
                                          final success = await loyalty.joinProgram();
                                          if (success) {
                                            if (context.mounted) {
                                              ToastUtils.showSuccess(
                                                context,
                                                'Welcome to Loyalty Rewards! You earned 50 bonus points!',
                                              );
                                            }
                                          } else {
                                            if (context.mounted) {
                                              ToastUtils.showError(
                                                context,
                                                loyalty.error ?? 'Failed to join loyalty program',
                                              );
                                            }
                                          }
                                        },
                                  child: loyalty.isLoading
                                      ? const SizedBox(
                                          width: 22,
                                          height: 22,
                                          child: CircularProgressIndicator(
                                            color: Colors.white,
                                            strokeWidth: 2.5,
                                          ),
                                        )
                                      : const Row(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Text(
                                              'JOIN NOW FOR FREE',
                                              style: TextStyle(
                                                fontSize: 15,
                                                fontWeight: FontWeight.w900,
                                                letterSpacing: 0.5,
                                                color: Colors.white,
                                              ),
                                            ),
                                            SizedBox(width: 8),
                                            Icon(
                                              Icons.arrow_forward,
                                              size: 18,
                                              color: Colors.white,
                                            ),
                                          ],
                                        ),
                                ),
                              ),
                            );
                          },
                        ),

                        const SizedBox(height: 10),

                        // Subtext below button
                        const Text(
                          "It's quick, easy and 100% free!",
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF6B7280),
                          ),
                        ),

                        // Bottom spacing to comfortably clear the bottom food artwork
                        SizedBox(height: isSmall ? 100 : 140),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
