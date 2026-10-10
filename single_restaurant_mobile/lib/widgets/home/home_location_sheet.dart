import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/address_provider.dart';
import 'package:single_restaurant_mobile/screens/saved_addresses_screen.dart';
import 'package:single_restaurant_mobile/theme/app_radius.dart';
import 'package:single_restaurant_mobile/theme/app_spacing.dart';
import 'package:single_restaurant_mobile/widgets/common/app_bottom_sheet.dart';
import 'package:single_restaurant_mobile/widgets/common/app_button.dart';

class HomeLocationSheet extends StatelessWidget {
  const HomeLocationSheet({super.key});

  static void show(BuildContext context) {
    AppBottomSheet.show(
      context: context,
      builder: (context) => const HomeLocationSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppBottomSheet(
      title: 'Select a location',
      stickyFooter: AppButton(
        icon: const Icon(Icons.add_rounded, size: 20),
        text: 'ADD NEW ADDRESS',
        variant: AppButtonVariant.primary,
        size: AppButtonSize.large,
        onPressed: () {
          Navigator.pop(context);
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) =>
                  const SavedAddressesScreen(selectingMode: false),
            ),
          );
        },
      ),
      child: Consumer<AddressProvider>(
        builder: (context, addrProv, _) {
          if (addrProv.isLoading && addrProv.addresses.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(AppSpacing.xxl),
                child: CircularProgressIndicator(color: AppColors.brandRed),
              ),
            );
          }

          if (addrProv.addresses.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(AppSpacing.xxl),
                child: Text(
                  'No saved addresses. Add one below.',
                  style: TextStyle(color: AppColors.textLight),
                ),
              ),
            );
          }

          return ListView.separated(
            shrinkWrap: true,
            itemCount: addrProv.addresses.length,
            separatorBuilder: (context, index) =>
                const SizedBox(height: AppSpacing.sm),
            itemBuilder: (context, index) {
              final addr = addrProv.addresses[index];
              final isDefault = addr['isDefault'] == true;

              return InkWell(
                onTap: () {
                  addrProv.setDefaultAddress(addr['_id']);
                  Navigator.pop(context);
                },
                borderRadius: AppRadius.borderMd,
                child: Container(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  decoration: BoxDecoration(
                    color: isDefault
                        ? AppColors.brandRed.withValues(alpha: 0.04)
                        : AppColors.resolveSurface(context),
                    border: Border.all(
                      color:
                          isDefault ? AppColors.brandRed : AppColors.border,
                      width: isDefault ? 1.5 : 1.0,
                    ),
                    borderRadius: AppRadius.borderMd,
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(AppSpacing.sm),
                        decoration: BoxDecoration(
                          color: isDefault
                              ? AppColors.brandRed.withValues(alpha: 0.12)
                              : AppColors.borderSubtle,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          addr['label']?.toString().toLowerCase() == 'home'
                              ? Icons.home_rounded
                              : Icons.location_on_rounded,
                          color: isDefault
                              ? AppColors.brandRed
                              : AppColors.textLight,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              addr['label'] ?? 'Address',
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: AppSpacing.xxs),
                            Text(
                              addr['address'] ?? '',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: AppColors.textLight,
                                fontSize: 12.5,
                                height: 1.3,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (isDefault) ...[
                        const SizedBox(width: AppSpacing.sm),
                        const Icon(
                          Icons.check_circle_rounded,
                          color: AppColors.brandRed,
                          size: 20,
                        ),
                      ],
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
