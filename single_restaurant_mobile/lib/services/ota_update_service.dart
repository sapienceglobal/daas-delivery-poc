import 'dart:io';
import 'package:flutter/material.dart';
import 'package:in_app_update/in_app_update.dart';
import 'package:url_launcher/url_launcher.dart';

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

    if (isManual) {
      if (!context.mounted) return;
      showDialog(
        context: context,
        barrierDismissible: true,
        builder: (ctx) => const _UpdateDialog(),
      );
      return;
    }

    // Silent background check for automatic app start flow
    try {
      final updateInfo = await InAppUpdate.checkForUpdate().timeout(
        const Duration(seconds: 4),
      );
      if (updateInfo.updateAvailability == UpdateAvailability.updateAvailable) {
        if (updateInfo.immediateUpdateAllowed) {
          await InAppUpdate.performImmediateUpdate();
        } else if (updateInfo.flexibleUpdateAllowed) {
          await InAppUpdate.startFlexibleUpdate();
          await InAppUpdate.completeFlexibleUpdate();
        }
      }
    } catch (e) {
      debugPrint('Background Play Store In-App Update check skipped: $e');
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
}

enum _UpdateStep {
  checking,
  upToDate,
  updateAvailable,
  playStoreOption,
}

class _UpdateDialog extends StatefulWidget {
  const _UpdateDialog();

  @override
  State<_UpdateDialog> createState() => _UpdateDialogState();
}

class _UpdateDialogState extends State<_UpdateDialog> {
  _UpdateStep _step = _UpdateStep.checking;
  AppUpdateInfo? _updateInfo;

  @override
  void initState() {
    super.initState();
    _performCheck();
  }

  Future<void> _performCheck() async {
    try {
      final info = await InAppUpdate.checkForUpdate().timeout(
        const Duration(seconds: 4),
      );
      if (!mounted) return;
      if (info.updateAvailability == UpdateAvailability.updateAvailable) {
        setState(() {
          _updateInfo = info;
          _step = _UpdateStep.updateAvailable;
        });
      } else {
        setState(() {
          _step = _UpdateStep.upToDate;
        });
      }
    } catch (e) {
      debugPrint('In-app update check exception: $e');
      if (!mounted) return;
      // In sideloaded APK, debug build, or when Google Play client cannot check:
      setState(() {
        _step = _UpdateStep.playStoreOption;
      });
    }
  }

  Future<void> _startUpdate() async {
    try {
      if (_updateInfo != null) {
        if (_updateInfo!.immediateUpdateAllowed) {
          await InAppUpdate.performImmediateUpdate();
          return;
        } else if (_updateInfo!.flexibleUpdateAllowed) {
          await InAppUpdate.startFlexibleUpdate();
          await InAppUpdate.completeFlexibleUpdate();
          return;
        }
      }
    } catch (_) {}
    // Fallback: open Play Store directly
    await OtaUpdateService.openPlayStore();
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.white,
      elevation: 6,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 360),
        child: Padding(
          padding: const EdgeInsets.all(22),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              _buildIcon(),
              const SizedBox(height: 18),
              _buildTitle(),
              const SizedBox(height: 8),
              _buildMessage(),
              const SizedBox(height: 22),
              _buildActions(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildIcon() {
    switch (_step) {
      case _UpdateStep.checking:
        return Container(
          width: 64,
          height: 64,
          decoration: const BoxDecoration(
            color: Color(0xFFFFF1F1),
            shape: BoxShape.circle,
          ),
          padding: const EdgeInsets.all(17),
          child: const CircularProgressIndicator(
            strokeWidth: 3,
            valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF7B1113)),
          ),
        );
      case _UpdateStep.upToDate:
        return Container(
          width: 64,
          height: 64,
          decoration: const BoxDecoration(
            color: Color(0xFFECFDF5),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.check_circle_rounded,
            color: Color(0xFF16A34A),
            size: 38,
          ),
        );
      case _UpdateStep.updateAvailable:
        return Container(
          width: 64,
          height: 64,
          decoration: const BoxDecoration(
            color: Color(0xFFFFF1F1),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.system_update_rounded,
            color: Color(0xFF7B1113),
            size: 36,
          ),
        );
      case _UpdateStep.playStoreOption:
        return Container(
          width: 64,
          height: 64,
          decoration: const BoxDecoration(
            color: Color(0xFFFEF3C7),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.storefront_rounded,
            color: Color(0xFFD97706),
            size: 34,
          ),
        );
    }
  }

  Widget _buildTitle() {
    String title;
    switch (_step) {
      case _UpdateStep.checking:
        title = 'Checking for Updates';
        break;
      case _UpdateStep.upToDate:
        title = "You're All Up to Date!";
        break;
      case _UpdateStep.updateAvailable:
        title = 'New Update Available!';
        break;
      case _UpdateStep.playStoreOption:
        title = 'Google Play Store';
        break;
    }
    return Text(
      title,
      textAlign: TextAlign.center,
      style: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: Color(0xFF1F2937),
      ),
    );
  }

  Widget _buildMessage() {
    String msg;
    switch (_step) {
      case _UpdateStep.checking:
        msg = 'Connecting to Google Play Store to check for the latest version...';
        break;
      case _UpdateStep.upToDate:
        msg = 'Lassi Lounge is running the latest official version. No update required.';
        break;
      case _UpdateStep.updateAvailable:
        msg = 'A new version with performance improvements and bug fixes is ready to install.';
        break;
      case _UpdateStep.playStoreOption:
        msg = 'View the official Google Play Store page directly to check for the latest updates and release details.';
        break;
    }
    return Text(
      msg,
      textAlign: TextAlign.center,
      style: const TextStyle(
        fontSize: 13,
        color: Color(0xFF6B7280),
        height: 1.35,
      ),
    );
  }

  Widget _buildActions() {
    switch (_step) {
      case _UpdateStep.checking:
        return SizedBox(
          width: double.infinity,
          height: 44,
          child: OutlinedButton(
            onPressed: () => Navigator.of(context).pop(),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFFE5E7EB)),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'Cancel',
              style: TextStyle(
                color: Color(0xFF6B7280),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        );
      case _UpdateStep.upToDate:
        return SizedBox(
          width: double.infinity,
          height: 44,
          child: ElevatedButton(
            onPressed: () => Navigator.of(context).pop(),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF7B1113),
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'Got It',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        );
      case _UpdateStep.updateAvailable:
        return Row(
          children: [
            Expanded(
              child: SizedBox(
                height: 44,
                child: OutlinedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFFE5E7EB)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Later',
                    style: TextStyle(
                      color: Color(0xFF6B7280),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: SizedBox(
                height: 44,
                child: ElevatedButton(
                  onPressed: _startUpdate,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF7B1113),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Update',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      case _UpdateStep.playStoreOption:
        return Row(
          children: [
            Expanded(
              child: SizedBox(
                height: 44,
                child: OutlinedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFFE5E7EB)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Close',
                    style: TextStyle(
                      color: Color(0xFF6B7280),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: SizedBox(
                height: 44,
                child: ElevatedButton.icon(
                  onPressed: () {
                    OtaUpdateService.openPlayStore();
                    Navigator.of(context).pop();
                  },
                  icon: const Icon(Icons.open_in_new_rounded, size: 16),
                  label: const Text(
                    'Open Store',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF7B1113),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
    }
  }
}
