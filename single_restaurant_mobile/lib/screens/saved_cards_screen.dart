import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/services/payment_service.dart';
import 'package:single_restaurant_mobile/widgets/guest_login_prompt.dart';

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
      // 1. Get Setup Intent Client Secret from backend
      final setupIntentData = await _paymentService.createSetupIntent();
      final clientSecret = setupIntentData?['clientSecret'];
      
      if (clientSecret == null) {
        throw Exception('Failed to initialize secure setup');
      }

      // 2. Initialize the SetupIntent sheet
      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          setupIntentClientSecret: clientSecret,
          style: ThemeMode.light,
          merchantDisplayName: 'Lassi Lounge',
          returnURL: 'lassilounge://stripe-redirect',
          appearance: const PaymentSheetAppearance(
            colors: PaymentSheetAppearanceColors(
              primary: AppColors.secondary,
            ),
          ),
        ),
      );

      setState(() => _isInitializingStripe = false);

      // 3. Present the sheet to the user
      await Stripe.instance.presentPaymentSheet();

      // 4. If we get here, the setup was successful.
      // Wait, we can fetch the intent via retrieveSetupIntent.
      final setupIntent = await Stripe.instance.retrieveSetupIntent(clientSecret);
      if (setupIntent.paymentMethodId != null) {
        // Save to our backend
        final success = await authProvider.addCard(
          cardId: setupIntent.paymentMethodId!,
          brand: 'Card', // We could parse more if we fetch payment method details
          last4: '****',
          expMonth: 12,
          expYear: 2099,
          title: 'Personal Card',
          isDefault: true,
        );
        
        if (success && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Card added successfully!')));
        }
      } else {
        throw Exception('Failed to retrieve payment method ID');
      }

    } catch (e) {
      setState(() => _isInitializingStripe = false);
      if (e is StripeException) {
        if (e.error.code == FailureCode.Canceled) {
          return; // User cancelled
        }
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error adding card: ${e.toString()}')));
      }
    }
  }

  void _handleDelete(String cardId) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Card'),
        content: const Text('Are you sure you want to delete this payment method?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: Colors.grey))),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await Provider.of<AuthProvider>(context, listen: false).removeCard(cardId);
              if (success && mounted) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Card deleted')));
              }
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
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
        title: const Text('Payment Methods', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 20)),
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          if (authProvider.isLoading && authProvider.user == null) {
            return const Center(child: CircularProgressIndicator(color: AppColors.secondary));
          }

          final cards = authProvider.user?.savedCards ?? [];

          return Column(
            children: [
              Expanded(
                child: cards.isEmpty
                    ? _buildEmptyState()
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: cards.length,
                        itemBuilder: (context, index) {
                          final card = cards[index];
                          return _buildCardItem(card, authProvider);
                        },
                      ),
              ),
              _buildAddCardButton(),
            ],
          );
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(color: Colors.red.shade50, shape: BoxShape.circle),
            child: Icon(Icons.credit_card, size: 64, color: Colors.red.shade300),
          ),
          const SizedBox(height: 24),
          const Text('No payment methods saved', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('Add a card to quickly pay for your next order.', style: TextStyle(color: Colors.grey, fontSize: 14)),
        ],
      ),
    );
  }

  Widget _buildCardItem(dynamic card, AuthProvider authProvider) {
    final isDefault = card['isDefault'] ?? false;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDefault ? AppColors.secondary : Colors.grey.shade300, width: isDefault ? 1.5 : 1.0),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 4))],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Container(
                  width: 50, height: 35,
                  decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(6), border: Border.all(color: Colors.grey.shade300)),
                  child: const Icon(Icons.credit_card, color: Colors.black54),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(card['title'] ?? 'Personal Card', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                          if (isDefault) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(color: AppColors.secondary, borderRadius: BorderRadius.circular(4)),
                              child: const Text('DEFAULT', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                            ),
                          ]
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text('${card['brand'] ?? 'Card'} •••• ${card['last4'] ?? '****'}', style: TextStyle(color: Colors.grey.shade600, fontSize: 13, fontWeight: FontWeight.w500)),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text('Expires', style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                    const SizedBox(height: 2),
                    Text('${(card['expMonth'] ?? 12).toString().padLeft(2, '0')}/${(card['expYear'] ?? 2099).toString().substring(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, fontFamily: 'monospace')),
                  ],
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 16.0),
            child: Row(
              children: [
                InkWell(
                  onTap: () => _handleDelete(card['_id']),
                  child: const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8.0, horizontal: 4.0),
                    child: Row(
                      children: [
                        Icon(Icons.delete_outline, size: 16, color: Colors.red),
                        SizedBox(width: 4),
                        Text('Delete', style: TextStyle(color: Colors.red, fontSize: 13, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ),
                if (!isDefault) ...[
                  Container(height: 16, width: 1, color: Colors.grey.shade300, margin: const EdgeInsets.symmetric(horizontal: 16)),
                  InkWell(
                    onTap: () async {
                      final success = await authProvider.setDefaultCard(card['_id']);
                      if (success && mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Default card updated')));
                      }
                    },
                    child: const Padding(
                      padding: EdgeInsets.symmetric(vertical: 8.0, horizontal: 4.0),
                      child: Text('Set as default', style: TextStyle(color: Colors.blue, fontSize: 13, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddCardButton() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))],
      ),
      child: SafeArea(
        child: ElevatedButton(
          onPressed: _isInitializingStripe ? null : _handleAddCard,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.secondary,
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 50),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: _isInitializingStripe
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.add, size: 20),
                    SizedBox(width: 8),
                    Text('ADD NEW CARD', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.0)),
                  ],
                ),
        ),
      ),
    );
  }
}
