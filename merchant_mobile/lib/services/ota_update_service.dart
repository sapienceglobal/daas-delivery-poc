import 'dart:io';
import 'package:flutter/material.dart';
import 'package:in_app_update/in_app_update.dart';
import 'package:url_launcher/url_launcher.dart';

class OtaUpdateService {
  static const String packageName = 'com.lassilounge.merchant_mobile';
  static bool _hasCheckedForUpdate = false;

  /// Check for app updates using official Google Play In-App Updates
  Future<void> checkForUpdate(
    BuildContext context, {
    bool isManual = false,
  }) async {
    if (!isManual && _hasCheckedForUpdate) return;
    if (!isManual) _hasCheckedForUpdate = true;

    // Google Play In-App Update API (Native Play Store update only)
    if (Platform.isAndroid) {
      try {
        final updateInfo = await InAppUpdate.checkForUpdate();
        if (updateInfo.updateAvailability == UpdateAvailability.updateAvailable) {
          if (updateInfo.immediateUpdateAllowed) {
            await InAppUpdate.performImmediateUpdate();
            return;
          } else if (updateInfo.flexibleUpdateAllowed) {
            await InAppUpdate.startFlexibleUpdate();
            await InAppUpdate.completeFlexibleUpdate();
            return;
          }
        } else if (isManual &&
            updateInfo.updateAvailability == UpdateAvailability.updateNotAvailable) {
          if (context.mounted) {
            _showUpToDateSnackBar(context);
          }
          return;
        }
      } catch (e) {
        // Throws if the app is running in debug or was not installed via Play Store.
        debugPrint('Play Store In-App Update check skipped or error: $e');
        if (isManual && context.mounted) {
          _showPlayStoreRedirectOption(context);
        }
      }
    }
  }

  /// Launch Google Play Store directly to Merchant App page
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
        backgroundColor: const Color(0xFFDC2626),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        margin: const EdgeInsets.all(16),
      ),
    );
  }
}
