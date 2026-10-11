import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:toastification/toastification.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/services/navigation_service.dart';
import 'package:single_restaurant_mobile/widgets/cart/cart_item_added_toast.dart';

class ToastUtils {
  static void showSuccess(BuildContext context, String message) {
    if (message.toLowerCase().contains('added to cart')) {
      showCartSuccess(context, message: 'Item added to cart successfully!');
      return;
    }

    toastification.dismissAll();
    toastification.show(
      context: context,
      type: ToastificationType.success,
      style: ToastificationStyle.flatColored,
      title: Text(message, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
      alignment: Alignment.topCenter,
      autoCloseDuration: const Duration(seconds: 3),
      primaryColor: Colors.green.shade700,
      backgroundColor: Colors.white,
      foregroundColor: Colors.black87,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      borderRadius: BorderRadius.circular(12),
      showProgressBar: false,
      closeButtonShowType: CloseButtonShowType.none,
      boxShadow: lowModeShadow,
    );
  }

  static void showCartSuccess(
    BuildContext context, {
    String message = 'Item added to cart successfully!',
    int? itemCount,
  }) {
    toastification.dismissAll();

    final targetContext = (context.mounted)
        ? context
        : (NavigationService.navigatorKey.currentContext ?? context);

    int count = itemCount ?? 1;
    try {
      final p = Provider.of<CartProvider>(targetContext, listen: false);
      count = p.itemCount > 0 ? p.itemCount : 1;
    } catch (_) {
      try {
        final navContext = NavigationService.navigatorKey.currentContext;
        if (navContext != null) {
          final p = Provider.of<CartProvider>(navContext, listen: false);
          count = p.itemCount > 0 ? p.itemCount : 1;
        }
      } catch (_) {}
    }

    toastification.showCustom(
      context: targetContext,
      alignment: Alignment.topCenter,
      autoCloseDuration: const Duration(seconds: 4),
      builder: (BuildContext builderContext, ToastificationItem holder) {
        return CartItemAddedToast(
          message: message,
          initialCount: count,
          onDismiss: () => toastification.dismiss(holder),
        );
      },
    );
  }

  static void showError(BuildContext context, String message) {
    toastification.dismissAll();
    toastification.show(
      context: context,
      type: ToastificationType.error,
      style: ToastificationStyle.flatColored,
      title: Text(message, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
      alignment: Alignment.topCenter,
      autoCloseDuration: const Duration(seconds: 4),
      primaryColor: Colors.red.shade700,
      backgroundColor: Colors.white,
      foregroundColor: Colors.black87,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      borderRadius: BorderRadius.circular(12),
      showProgressBar: false,
      closeButtonShowType: CloseButtonShowType.none,
      boxShadow: lowModeShadow,
    );
  }

  static void showInfo(BuildContext context, String message) {
    toastification.dismissAll();
    toastification.show(
      context: context,
      type: ToastificationType.info,
      style: ToastificationStyle.flatColored,
      title: Text(message, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
      alignment: Alignment.topCenter,
      autoCloseDuration: const Duration(seconds: 3),
      primaryColor: const Color(0xFF7A0B10), // Brand Primary
      backgroundColor: Colors.white,
      foregroundColor: Colors.black87,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      borderRadius: BorderRadius.circular(12),
      showProgressBar: false,
      closeButtonShowType: CloseButtonShowType.none,
      boxShadow: lowModeShadow,
    );
  }
}
