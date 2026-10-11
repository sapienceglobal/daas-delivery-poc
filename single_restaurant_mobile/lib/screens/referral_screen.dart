import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
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

  @override
  void initState() {
    super.initState();
    _loadData();
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
                    onShareCode: () =>
                        _shareOnWhatsApp(context, referralCode),
                    onShareWhatsApp: () =>
                        _shareOnWhatsApp(context, referralCode),
                    onShareSMS: () => _shareOnSMS(context, referralCode),
                    onShareInstagram: () =>
                        _shareOnInstagram(context, referralCode),
                    onCopyLink: () => _copyLink(context, referralCode),
                    onShareMore: () => _shareOnSMS(context, referralCode),
                  ),
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
