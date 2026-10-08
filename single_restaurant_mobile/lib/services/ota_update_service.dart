import 'dart:io';
import 'package:flutter/material.dart';
import 'package:in_app_update/in_app_update.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';

class OtaUpdateService {
  static const String packageName = 'com.lassilounge.customer';
  static bool _hasCheckedForUpdate = false;

  /// Check for app updates using Google Play official In-App Updates
  Future<void> checkForUpdate(
    BuildContext context, {
    bool isManual = false,
  }) async {
    if (!isManual && _hasCheckedForUpdate) return;
    if (!isManual) _hasCheckedForUpdate = true;

    if (!Platform.isAndroid) return;

    if (isManual && context.mounted) {
      _showCheckingDialog(context);
    }

    try {
      final updateInfo = await InAppUpdate.checkForUpdate();

      if (isManual && context.mounted) {
        Navigator.of(context, rootNavigator: true).maybePop();
      }

      if (updateInfo.updateAvailability == UpdateAvailability.updateAvailable) {
        if (updateInfo.immediateUpdateAllowed) {
          await InAppUpdate.performImmediateUpdate();
        } else if (updateInfo.flexibleUpdateAllowed) {
          await InAppUpdate.startFlexibleUpdate();
          await InAppUpdate.completeFlexibleUpdate();
        }
      } else {
        if (isManual && context.mounted) {
          _showUpToDateSnackBar(context);
        }
      }
    } catch (e) {
      debugPrint('Play Store In-App Update error or not downloaded from store: $e');
      if (isManual && context.mounted) {
        Navigator.of(context, rootNavigator: true).maybePop();
        _showPlayStoreRedirectOption(context);
      }
    }
  }

  /// Launch Google Play Store directly to Lassi Lounge App page
  static Future<void> openPlayStore() async {
    final marketUri = Uri.parse('market://details?id=$packageName');
    final webUri = Uri.parse(
        'https://play.google.com/store/apps/details?id=$packageName');

    try {
      if (await canLaunchUrl(marketUri)) {
        await launchUrl(marketUri, mode: LaunchMode.externalApplication);
      } else {
        await launchUrl(webUri, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      debugPrint('Could not open Play Store: $e');
      try {
        await launchUrl(webUri, mode: LaunchMode.externalApplication);
      } catch (_) {}
    }
  }

  void _showCheckingDialog(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        elevation: 0,
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const SizedBox(
                  width: 32,
                  height: 32,
                  child: CircularProgressIndicator(
                    strokeWidth: 3,
                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Checking for updates...',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2D3436),
                  letterSpacing: 0.5,
                  decoration: TextDecoration.none,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Connecting to Google Play Store',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade500,
                  decoration: TextDecoration.none,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showUpToDateSnackBar(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.check_circle,
                color: Colors.white,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'App is up to date on Google Play!',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF43A047),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  void _showPlayStoreRedirectOption(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Row(
          children: [
            Icon(Icons.info_outline, color: Colors.white, size: 20),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                'Check latest version directly on Google Play Store',
                style: TextStyle(fontSize: 13),
              ),
            ),
          ],
        ),
        action: SnackBarAction(
          label: 'Open',
          textColor: Colors.white,
          onPressed: openPlayStore,
        ),
        backgroundColor: AppColors.secondary,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        margin: const EdgeInsets.all(16),
      ),
    );
  }
}
