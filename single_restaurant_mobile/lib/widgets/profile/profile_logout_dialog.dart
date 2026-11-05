import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/address_provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/checkout_provider.dart';
import 'package:single_restaurant_mobile/providers/loyalty_provider.dart';
import 'package:single_restaurant_mobile/providers/notification_provider.dart';
import 'package:single_restaurant_mobile/providers/order_provider.dart';
import 'package:single_restaurant_mobile/screens/login_screen.dart';
import 'package:single_restaurant_mobile/widgets/common/app_dialog.dart';

class ProfileLogoutDialog {
  static void show(BuildContext context, AuthProvider authProvider) {
    final isGuest = !authProvider.isAuthenticated;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogCtx) {
        bool isLoggingOut = false;
        return StatefulBuilder(
          builder: (context, setState) {
            return AppDialog(
              title: isGuest ? 'Exit Guest Mode' : 'Confirm Logout',
              message: isGuest
                  ? 'Are you sure you want to exit guest mode and return to the login screen?'
                  : 'Are you sure you want to log out of your account?',
              icon: Icons.logout_rounded,
              iconColor: AppColors.brandRed,
              isDestructive: true,
              isLoading: isLoggingOut,
              primaryActionText: isGuest ? 'Exit' : 'Logout',
              secondaryActionText: 'Cancel',
              onSecondaryAction: isLoggingOut ? null : () => Navigator.pop(dialogCtx),
              onPrimaryAction: isLoggingOut
                  ? null
                  : () async {
                      setState(() {
                        isLoggingOut = true;
                      });
                      try {
                        if (context.mounted) {
                          Provider.of<CartProvider>(context, listen: false).clearCart();
                          Provider.of<AddressProvider>(context, listen: false).clear();
                          Provider.of<OrderProvider>(context, listen: false).clear();
                          Provider.of<LoyaltyProvider>(context, listen: false).clear();
                          Provider.of<CheckoutProvider>(context, listen: false).reset();
                          Provider.of<NotificationProvider>(context, listen: false).clear();
                        }
                        await authProvider.logout();
                      } catch (_) {}

                      if (dialogCtx.mounted) {
                        Navigator.pop(dialogCtx);
                      }
                      if (context.mounted) {
                        Navigator.of(context).pushAndRemoveUntil(
                          MaterialPageRoute(builder: (context) => const LoginScreen()),
                          (route) => false,
                        );
                      }
                    },
            );
          },
        );
      },
    );
  }
}
