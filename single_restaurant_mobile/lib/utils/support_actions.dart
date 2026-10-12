import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/screens/main_screen.dart';
import 'package:single_restaurant_mobile/screens/loyalty_rewards_screen.dart';
import 'package:single_restaurant_mobile/screens/saved_addresses_screen.dart';
import 'package:single_restaurant_mobile/screens/saved_cards_screen.dart';
import 'package:single_restaurant_mobile/screens/edit_profile_screen.dart';
import 'package:single_restaurant_mobile/screens/notification_settings_screen.dart';
import 'package:single_restaurant_mobile/screens/favorites_screen.dart';
import 'package:single_restaurant_mobile/services/navigation_service.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';
import 'package:url_launcher/url_launcher.dart';

class SupportActions {
  static const String defaultPhone = '+1 347-233-3733';
  static const String defaultEmail = 'lassiloungeny@gmail.com';

  static Future<void> makePhoneCall(BuildContext context, [String? phone]) async {
    final target = (phone != null && phone.trim().isNotEmpty) ? phone : defaultPhone;
    final cleanPhone = target.replaceAll(RegExp(r'[^\d+]'), '');
    final Uri launchUri = Uri(
      scheme: 'tel',
      path: cleanPhone,
    );
    final targetCtx = NavigationService.navigatorKey.currentContext ?? context;
    try {
      if (await canLaunchUrl(launchUri)) {
        await launchUrl(launchUri);
      } else {
        if (targetCtx.mounted) {
          ToastUtils.showInfo(targetCtx, 'Could not open dialer for $target');
        }
      }
    } catch (_) {
      if (targetCtx.mounted) {
        ToastUtils.showInfo(targetCtx, 'Calling $target');
      }
    }
  }

  static Future<void> openWhatsApp(BuildContext context, [String? phone]) async {
    final target = (phone != null && phone.trim().isNotEmpty) ? phone : defaultPhone;
    final cleanDigits = target.replaceAll(RegExp(r'\D'), '');
    final Uri launchUri = Uri.parse('https://wa.me/$cleanDigits');
    final targetCtx = NavigationService.navigatorKey.currentContext ?? context;
    try {
      if (await canLaunchUrl(launchUri)) {
        await launchUrl(launchUri, mode: LaunchMode.externalApplication);
      } else {
        if (targetCtx.mounted) {
          ToastUtils.showInfo(targetCtx, 'WhatsApp not installed or could not open');
        }
      }
    } catch (_) {
      if (targetCtx.mounted) {
        ToastUtils.showInfo(targetCtx, 'Opening WhatsApp for $target');
      }
    }
  }

  static Future<void> sendEmail(BuildContext context, [String? email]) async {
    final target = (email != null && email.trim().isNotEmpty) ? email : defaultEmail;
    final Uri launchUri = Uri(
      scheme: 'mailto',
      path: target,
      query: 'subject=Support Inquiry - Lassi Lounge',
    );
    final targetCtx = NavigationService.navigatorKey.currentContext ?? context;
    try {
      if (await canLaunchUrl(launchUri)) {
        await launchUrl(launchUri);
      } else {
        if (targetCtx.mounted) {
          ToastUtils.showInfo(targetCtx, 'Could not open mail client for $target');
        }
      }
    } catch (_) {
      if (targetCtx.mounted) {
        ToastUtils.showInfo(targetCtx, 'Emailing $target');
      }
    }
  }

  static void handleAction(
    BuildContext context,
    String actionType, {
    String? phone,
    String? email,
  }) {
    final nav = NavigationService.navigatorKey.currentState ?? Navigator.of(context);
    switch (actionType) {
      case 'call':
        makePhoneCall(context, phone);
        break;
      case 'whatsapp':
        openWhatsApp(context, phone);
        break;
      case 'email':
        sendEmail(context, email);
        break;
      case 'addresses':
        nav.push(
          MaterialPageRoute(builder: (_) => const SavedAddressesScreen()),
        );
        break;
      case 'loyalty':
        nav.push(
          MaterialPageRoute(builder: (_) => const LoyaltyRewardsScreen()),
        );
        break;
      case 'cards':
        nav.push(
          MaterialPageRoute(builder: (_) => const SavedCardsScreen()),
        );
        break;
      case 'edit_profile':
        nav.push(
          MaterialPageRoute(builder: (_) => const EditProfileScreen()),
        );
        break;
      case 'notifications':
        nav.push(
          MaterialPageRoute(builder: (_) => const NotificationSettingsScreen()),
        );
        break;
      case 'favorites':
        nav.push(
          MaterialPageRoute(builder: (_) => const FavoritesScreen()),
        );
        break;
      case 'track_order':
      case 'orders':
        nav.pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const MainScreen(initialIndex: 3)),
          (route) => false,
        );
        break;
      case 'menu':
        nav.pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const MainScreen(initialIndex: 1)),
          (route) => false,
        );
        break;
      case 'offers':
        nav.pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const MainScreen(initialIndex: 2)),
          (route) => false,
        );
        break;
      case 'home':
        nav.pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const MainScreen(initialIndex: 0)),
          (route) => false,
        );
        break;
      default:
        makePhoneCall(context, phone);
        break;
    }
  }
}
