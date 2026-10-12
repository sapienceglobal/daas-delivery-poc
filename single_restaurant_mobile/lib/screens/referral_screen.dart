import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/screens/help_support_screen.dart';
import 'package:single_restaurant_mobile/services/referral_service.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';
import 'package:single_restaurant_mobile/widgets/referral/referral_hero_section.dart';
import 'package:single_restaurant_mobile/widgets/referral/referral_rewards_card.dart';
import 'package:single_restaurant_mobile/widgets/referral/referral_code_card.dart';
import 'package:single_restaurant_mobile/widgets/referral/referral_how_it_works.dart';
import 'package:single_restaurant_mobile/widgets/referral/referral_stats_card.dart';

class ReferralScreen extends StatefulWidget {
  const ReferralScreen({super.key});

  @override
  State<ReferralScreen> createState() => _ReferralScreenState();
}

class _ReferralScreenState extends State<ReferralScreen> {
  static const String _defaultCode = 'LASSI7K92';
  final _referralService = ReferralService();
  Map<String, dynamic>? _referralData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      Map<String, dynamic>? data;

      if (authProvider.isAuthenticated) {
        data = await _referralService.getMyReferral();
      }

      // If user is guest OR if getMyReferral did not return program details:
      if (data == null || data['program'] == null) {
        final program = await _referralService.getProgram();
        if (program != null) {
          data = {
            ...?data,
            'program': program,
          };
        }
      }

      if (mounted) {
        setState(() {
          if (data != null) _referralData = data;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  num get _refereeDiscount =>
      _referralData?['program']?['refereeDiscountValue'] ?? 25;
  num get _referrerReward =>
      _referralData?['program']?['referrerRewardValue'] ?? 25;
  num get _refereeMinOrder =>
      _referralData?['program']?['refereeMinOrder'] ?? 30;
  int get _maxRewards =>
      _referralData?['program']?['maxRewardsPerReferrer'] ?? 20;
  num get _pointsEarned =>
      _referralData?['stats']?['pointsEarned'] ?? 0;
  int get _friendsRewarded =>
      _referralData?['stats']?['rewarded'] ?? 0;
  int get _friendsPending =>
      _referralData?['stats']?['pending'] ?? 0;
  int get _friendsInvited =>
      _referralData?['stats']?['invited'] ?? 0;
  List<dynamic> get _friendsList =>
      _referralData?['friends'] ?? const [];

  String _buildShareMessage(String code) {
    final d = _refereeDiscount.toInt();
    return '''
🎁 Claim \$$d OFF your first order at Lassi Lounge!

Hey! Use my referral code *$code* to get \$$d OFF your first order.

📲 Download the App from Google Play Store:
https://play.google.com/store/apps/details?id=com.lassilounge.customer

📝 Steps to get your \$$d OFF:
1️⃣ Install Lassi Lounge app from Google Play Store.
2️⃣ Sign up via Social Login or Manual Registration (verify OTP).
3️⃣ Right after signup / OTP verification, enter referral code: *$code* on the referral screen.
4️⃣ Done! Your \$$d OFF discount will be unlocked automatically.

🌐 Website:
https://lassiloungeny.com
'''.trim();
  }

  Future<void> _shareOnWhatsApp(BuildContext context, String code) async {
    final text = _buildShareMessage(code);
    final uri = Uri.parse('whatsapp://send?text=${Uri.encodeComponent(text)}');
    final fallback = Uri.parse(
        'https://api.whatsapp.com/send?text=${Uri.encodeComponent(text)}');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else if (await canLaunchUrl(fallback)) {
      await launchUrl(fallback, mode: LaunchMode.externalApplication);
    } else {
      Clipboard.setData(ClipboardData(text: text));
      if (context.mounted) {
        ToastUtils.showSuccess(context, 'Referral message copied to clipboard!');
      }
    }
  }

  Future<void> _shareOnSMS(BuildContext context, String code) async {
    final text = _buildShareMessage(code);
    final uri = Uri(scheme: 'sms', queryParameters: {'body': text});
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      Clipboard.setData(ClipboardData(text: text));
      if (context.mounted) {
        ToastUtils.showSuccess(context, 'Referral message copied to clipboard!');
      }
    }
  }

  Future<void> _shareOnInstagram(BuildContext context, String code) async {
    final text = _buildShareMessage(code);
    final uri = Uri.parse('https://instagram.com');
    Clipboard.setData(ClipboardData(text: text));
    ToastUtils.showSuccess(context, 'Referral message copied! Share on Instagram');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _copyLink(BuildContext context, String code) {
    final text = _buildShareMessage(code);
    Clipboard.setData(ClipboardData(text: text));
    ToastUtils.showSuccess(context, 'Referral invite copied to clipboard!');
  }

  void _copyCode(BuildContext context, String code) {
    Clipboard.setData(ClipboardData(text: code));
    ToastUtils.showSuccess(context, 'Referral code copied to clipboard!');
  }

  Future<void> _shareNative(BuildContext context, String code) async {
    final text = _buildShareMessage(code);
    final d = _refereeDiscount.toInt();
    // ignore: deprecated_member_use
    await Share.share(
      text,
      subject: 'Claim \$$d OFF at Lassi Lounge - Use Code $code',
    );
  }

  Widget _buildApplyCodeSection() {
    if (_isLoading) {
      return const SizedBox.shrink();
    }

    final myCoupon = _referralData?['myCoupon'] as Map<String, dynamic>?;
    final bool hasApplied =
        _referralData?['onboarding'] == 'applied' || myCoupon != null;

    if (hasApplied && myCoupon != null) {
      final couponCode = myCoupon['code'] ?? '';
      final discount = myCoupon['discount'] ?? _refereeDiscount;
      final minOrder = myCoupon['minOrder'] ?? _refereeMinOrder;
      final bool isUsed = myCoupon['used'] == true;

      return Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFFFFFDF7), Color(0xFFFEF9EE)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: const Color(0xFFE5C378)),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFFC99742).withValues(alpha: 0.12),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFDE68A),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.confirmation_num_outlined,
                    color: Color(0xFF7B1113),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'YOUR REFERRAL WELCOME COUPON',
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.7,
                          color: Color(0xFF92400E),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '\$$discount OFF First Order',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF7B1113),
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: isUsed
                        ? const Color(0xFFE5E7EB)
                        : const Color(0xFFDCFCE7),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    isUsed ? 'REDEEMED' : 'READY TO USE',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: isUsed
                          ? const Color(0xFF6B7280)
                          : const Color(0xFF15803D),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFF3ECE6)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.tag, size: 16, color: Color(0xFF7B1113)),
                      const SizedBox(width: 6),
                      Text(
                        couponCode,
                        style: const TextStyle(
                          fontFamily: 'monospace',
                          fontSize: 15,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.2,
                          color: Color(0xFF1E1E1E),
                        ),
                      ),
                    ],
                  ),
                  InkWell(
                    onTap: () {
                      Clipboard.setData(ClipboardData(text: couponCode));
                      ToastUtils.showSuccess(
                          context, 'Coupon code copied to clipboard!');
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFF7B1113),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'Copy Code',
                        style: TextStyle(
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
            const SizedBox(height: 8),
            Text(
              'Applies automatically or paste at checkout. Valid on orders of \$$minOrder or more.',
              style: const TextStyle(
                fontSize: 11.5,
                color: Color(0xFF78350F),
              ),
            ),
          ],
        ),
      );
    }

    return const SizedBox.shrink();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAF7F2),
      appBar: AppBar(
        backgroundColor: const Color(0xFFFAF7F2),
        elevation: 0,
        centerTitle: true,
        leading: Padding(
          padding: const EdgeInsets.all(8.0),
          child: InkWell(
            onTap: () => Navigator.pop(context),
            borderRadius: BorderRadius.circular(20),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ],
              ),
              child: const Icon(Icons.arrow_back,
                  color: Color(0xFF4A0E13), size: 18),
            ),
          ),
        ),
        title: Text(
          'Refer & Earn',
          style: GoogleFonts.playfairDisplay(
            color: const Color(0xFF4A0E13),
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 14),
            child: Center(
              child: InkWell(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) => const HelpSupportScreen()),
                  );
                },
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 13, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                        color: const Color(0xFF4A0E13), width: 1.1),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.headset_mic_outlined,
                          size: 15, color: Color(0xFF4A0E13)),
                      SizedBox(width: 5),
                      Text(
                        'Support',
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF4A0E13),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          final referralCode =
              authProvider.user?.referralCode ?? _defaultCode;

          return ResponsiveCenter(
            maxWidth: 650,
            child: RefreshIndicator(
              onRefresh: _loadData,
              color: const Color(0xFF7B1113),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    ReferralHeroSection(
                      refereeDiscount: _refereeDiscount,
                      referrerReward: _referrerReward,
                      isLoading: _isLoading,
                    ),
                    const SizedBox(height: 6),
                    ReferralRewardsCard(
                      refereeDiscount: _refereeDiscount,
                      referrerReward: _referrerReward,
                      refereeMinOrder: _refereeMinOrder,
                      isLoading: _isLoading,
                    ),
                    const SizedBox(height: 14),
                    ReferralCodeCard(
                      referralCode: referralCode,
                      onCopyCode: () => _copyCode(context, referralCode),
                      onShareCode: () => _shareNative(context, referralCode),
                      onShareWhatsApp: () =>
                          _shareOnWhatsApp(context, referralCode),
                      onShareSMS: () => _shareOnSMS(context, referralCode),
                      onShareInstagram: () =>
                          _shareOnInstagram(context, referralCode),
                      onCopyLink: () => _copyLink(context, referralCode),
                      onShareMore: () => _shareNative(context, referralCode),
                    ),
                    if (_referralData?['myCoupon'] != null) ...[
                      const SizedBox(height: 14),
                      _buildApplyCodeSection(),
                    ],
                    const SizedBox(height: 14),
                    ReferralStatsCard(
                      pointsEarned: _pointsEarned,
                      friendsRewarded: _friendsRewarded,
                      friendsPending: _friendsPending,
                      friendsInvited: _friendsInvited,
                      maxRewards: _maxRewards,
                      rewardValue: _referrerReward,
                      friendsList: _friendsList,
                      isLoading: _isLoading,
                    ),
                    const SizedBox(height: 14),
                    ReferralHowItWorks(
                      refereeDiscount: _refereeDiscount,
                      referrerReward: _referrerReward,
                      isLoading: _isLoading,
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
