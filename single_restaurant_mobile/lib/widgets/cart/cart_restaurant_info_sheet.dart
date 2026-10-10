import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/theme/app_spacing.dart';
import 'package:single_restaurant_mobile/widgets/common/app_bottom_sheet.dart';
import 'package:single_restaurant_mobile/widgets/common/app_button.dart';
import 'package:url_launcher/url_launcher.dart';

class CartRestaurantInfoSheet {
  static void show(BuildContext context, Map<String, dynamic>? restaurant) {
    if (restaurant == null) return;

    final name = restaurant['name'] ?? 'Lassi Lounge';
    final address = restaurant['address'] ?? '123 Main St, City';
    final phone = restaurant['phone'] ?? '';
    final email = restaurant['email'] ?? '';

    // For maps, try coordinates if available, otherwise fallback address
    final loc = restaurant['location'];
    final lat = loc != null && loc['coordinates'] != null ? loc['coordinates'][1] : null;
    final lng = loc != null && loc['coordinates'] != null ? loc['coordinates'][0] : null;

    AppBottomSheet.show(
      context: context,
      builder: (ctx) => AppBottomSheet(
        title: name,
        subtitle: address,
        stickyFooter: AppButton(
          icon: const Icon(Icons.map, size: 20),
          text: 'Get Directions',
          variant: AppButtonVariant.primary,
          size: AppButtonSize.large,
          onPressed: () async {
            final targetAddress = (lat != null && lng != null)
                ? '$lat,$lng'
                : '94-08 118th St, South Richmond Hill, NY 11419, United States';
            final uri = Uri.parse('https://maps.google.com/?q=${Uri.encodeComponent(targetAddress)}');
            if (await canLaunchUrl(uri)) {
              await launchUrl(uri, mode: LaunchMode.externalApplication);
            }
          },
        ),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (phone.isNotEmpty)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.phone, color: AppColors.brandRed),
                  title: Text(phone, style: const TextStyle(fontWeight: FontWeight.w600)),
                  onTap: () async {
                    final uri = Uri.parse('tel:$phone');
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(uri);
                    }
                  },
                ),
              if (email.isNotEmpty)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.email, color: AppColors.brandRed),
                  title: Text(email, style: const TextStyle(fontWeight: FontWeight.w600)),
                  onTap: () async {
                    final uri = Uri.parse('mailto:$email');
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(uri);
                    }
                  },
                ),
              const SizedBox(height: AppSpacing.md),
            ],
          ),
        ),
      ),
    );
  }
}
