import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/services/payment_service.dart';
import 'package:single_restaurant_mobile/widgets/guest_login_prompt.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';
import 'package:single_restaurant_mobile/widgets/common/app_dialog.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';
import 'package:single_restaurant_mobile/widgets/cards/saved_card_item.dart';
import 'package:single_restaurant_mobile/widgets/cards/saved_cards_empty_view.dart';
import 'package:single_restaurant_mobile/widgets/cards/add_card_button.dart';

class SavedCardsScreen extends StatefulWidget {
  const SavedCardsScreen({super.key});

  @override
  State<SavedCardsScreen> createState() => _SavedCardsScreenState();
}

class _SavedCardsScreenState extends State<SavedCardsScreen> {
  final PaymentService _paymentService = PaymentService();
  bool _isInitializingStripe = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AuthProvider>(context, listen: false).fetchUser();
    });
  }

  Future<void> _handleAddCard() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    setState(() => _isInitializingStripe = true);

    try {
      final setupIntentData = await _paymentService.createSetupIntent();
      final clientSecret = setupIntentData?['clientSecret'];
      final ephemeralKeySecret = setupIntentData?['ephemeralKey'];
      final customerId = setupIntentData?['customerId'];

      if (clientSecret == null) {
        throw Exception('Failed to initialize secure setup');
      }

      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          setupIntentClientSecret: clientSecret,
          customerId: customerId,
          customerEphemeralKeySecret: ephemeralKeySecret,
          style: ThemeMode.light,
          merchantDisplayName: 'Lassi Lounge',
          linkDisplayParams: const LinkDisplayParams(linkDisplay: LinkDisplay.never),
          billingDetails: BillingDetails(
            email: authProvider.user?.email,
            name: authProvider.user?.name,
            phone: authProvider.user?.phone,
          ),
          allowsDelayedPaymentMethods: false,
          appearance: const PaymentSheetAppearance(
            colors: PaymentSheetAppearanceColors(
              primary: AppColors.secondary,
            ),
          ),
        ),
      );

      setState(() => _isInitializingStripe = false);

      await Stripe.instance.presentPaymentSheet();

      final setupIntent = await Stripe.instance.retrieveSetupIntent(clientSecret);
      final success = await authProvider.addCard(
        cardId: setupIntent.paymentMethodId,
        brand: 'Card',
        last4: '****',
        expMonth: 12,
        expYear: 2099,
        title: 'Personal Card',
        isDefault: true,
      );

      if (success && mounted) {
        ToastUtils.showSuccess(context, 'Card added successfully!');
      }
    } catch (e) {
      setState(() => _isInitializingStripe = false);
      if (e is StripeException) {
        if (e.error.code == FailureCode.Canceled) {
          return;
        }
      }
      if (mounted) {
        ToastUtils.showError(context, 'Error adding card: ${e.toString()}');
      }
    }
  }

  void _handleDelete(String cardId) {
    showDialog(
      context: context,
      builder: (ctx) => AppDialog(
        title: 'Delete Card',
        message: 'Are you sure you want to delete this payment method?',
        icon: Icons.credit_card_off_rounded,
        iconColor: AppColors.brandRed,
        isDestructive: true,
        primaryActionText: 'Delete',
        onPrimaryAction: () async {
          Navigator.pop(ctx);
          final success =
              await Provider.of<AuthProvider>(context, listen: false).removeCard(cardId);
          if (success && mounted) {
            ToastUtils.showInfo(context, 'Card deleted');
          }
        },
        secondaryActionText: 'Cancel',
        onSecondaryAction: () => Navigator.pop(ctx),
      ),
    );
  }

  Future<void> _handleSetDefault(String cardId) async {
    final success =
        await Provider.of<AuthProvider>(context, listen: false).setDefaultCard(cardId);
    if (success && mounted) {
      ToastUtils.showSuccess(context, 'Default card updated');
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    if (authProvider.user == null) {
      return Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: AppColors.secondary),
            onPressed: () => Navigator.pop(context),
          ),
          title: const Text(
            'Payment Methods',
            style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 18),
          ),
          centerTitle: true,
        ),
        body: const GuestLoginPrompt(
          icon: Icons.credit_card_outlined,
          title: 'Login to manage cards',
          subtitle: 'Securely save your payment methods for faster checkout.',
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFFAF8F5),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.secondary),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Payment Methods',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 20),
        ),
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          if (authProvider.isLoading && authProvider.user == null) {
            return const Center(child: CircularProgressIndicator(color: AppColors.secondary));
          }

          final cards = authProvider.user?.savedCards ?? [];

          return ResponsiveCenter(
            maxWidth: 600,
            child: Column(
              children: [
                Expanded(
                  child: cards.isEmpty
                      ? const SavedCardsEmptyView()
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: cards.length,
                          itemBuilder: (context, index) {
                            final card = cards[index];
                            final isDefault = card['isDefault'] ?? false;
                            return SavedCardItem(
                              card: card,
                              onDelete: () => _handleDelete(card['_id']),
                              onSetDefault: isDefault
                                  ? null
                                  : () => _handleSetDefault(card['_id']),
                            );
                          },
                        ),
                ),
                AddCardButton(
                  isInitializing: _isInitializingStripe,
                  onPressed: _isInitializingStripe ? null : _handleAddCard,
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
