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

  final TextEditingController _applyCodeController = TextEditingController();
  bool _isApplyingCode = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _applyCodeController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final data = await _referralService.getMyReferral();
    if (mounted && data != null) {
      setState(() => _referralData = data);
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
    return 'Hey! Use my referral code $code to get \$$d OFF your first order at Lassi Lounge: https://lassiloungeny.com/ref/$code';
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
        ToastUtils.showSuccess(context, 'Referral link copied to clipboard!');
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
    final d = _refereeDiscount.toInt();
    final uri = Uri.parse('https://instagram.com');
    Clipboard.setData(
        ClipboardData(text: 'Use my code $code to get \$$d OFF at Lassi Lounge!'));
    ToastUtils.showSuccess(context, 'Referral code copied! Share on Instagram');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _copyLink(BuildContext context, String code) {
    final link = 'https://lassiloungeny.com/ref/$code';
    Clipboard.setData(ClipboardData(text: link));
    ToastUtils.showSuccess(context, 'Referral link copied to clipboard!');
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
      subject: 'Get \$$d OFF at Lassi Lounge!',
    );
  }

  Future<void> _handleApplyCode() async {
    final code = _applyCodeController.text.trim().toUpperCase();
    if (code.isEmpty) {
      ToastUtils.showError(context, 'Please enter a referral code');
      return;
    }
    setState(() => _isApplyingCode = true);
    try {
      final res = await _referralService.applyCode(code);
      if (mounted) {
        _applyCodeController.clear();
        FocusScope.of(context).unfocus();
        ToastUtils.showSuccess(
            context, res['message'] ?? 'Referral code applied! Coupon unlocked.');
        await _loadData();
      }
    } catch (e) {
      if (mounted) {
        String msg = e.toString().replaceAll('Exception: ', '');
        ToastUtils.showError(context, msg);
      }
    } finally {
      if (mounted) {
        setState(() => _isApplyingCode = false);
      }
    }
  }

  Widget _buildApplyCodeSection() {
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

    if (hasApplied) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFF3ECE6)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 10,
            offset: Offset(0, 3),
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
                  color: const Color(0xFFFFF1F1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.card_giftcard_outlined,
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
                      'HAVE A REFERRAL CODE?',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.8,
                        color: Color(0xFF7B1113),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Enter your friend\'s code to unlock \$$_refereeDiscount OFF',
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: Container(
                  height: 48,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFAF7F2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE5DFD7)),
                  ),
                  child: TextField(
                    controller: _applyCodeController,
                    textCapitalization: TextCapitalization.characters,
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[A-Za-z0-9]')),
                      LengthLimitingTextInputFormatter(12),
                    ],
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.2,
                      fontSize: 14,
                      color: Color(0xFF1E1E1E),
                    ),
                    decoration: const InputDecoration(
                      hintText: 'Enter referral code',
                      hintStyle: TextStyle(
                        fontSize: 13,
                        letterSpacing: 0,
                        fontWeight: FontWeight.normal,
                        color: Color(0xFF9CA3AF),
                      ),
                      prefixIcon:
                          Icon(Icons.tag, size: 18, color: Color(0xFF7B1113)),
                      border: InputBorder.none,
                      contentPadding:
                          EdgeInsets.symmetric(vertical: 14, horizontal: 12),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: _isApplyingCode ? null : _handleApplyCode,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF7B1113),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                  ),
                  child: _isApplyingCode
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Text(
                          'Apply',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
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
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  ReferralHeroSection(
                    refereeDiscount: _refereeDiscount,
                    referrerReward: _referrerReward,
                  ),
                  const SizedBox(height: 6),
                  ReferralRewardsCard(
                    refereeDiscount: _refereeDiscount,
                    referrerReward: _referrerReward,
                    refereeMinOrder: _refereeMinOrder,
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
                  const SizedBox(height: 14),
                  _buildApplyCodeSection(),
                  const SizedBox(height: 14),
                  ReferralStatsCard(
                    pointsEarned: _pointsEarned,
                    friendsRewarded: _friendsRewarded,
                    friendsPending: _friendsPending,
                    friendsInvited: _friendsInvited,
                    maxRewards: _maxRewards,
                    rewardValue: _referrerReward,
                    friendsList: _friendsList,
                  ),
                  const SizedBox(height: 14),
                  ReferralHowItWorks(
                    refereeDiscount: _refereeDiscount,
                    referrerReward: _referrerReward,
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
