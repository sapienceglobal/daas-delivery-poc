import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/address_provider.dart';
import 'package:single_restaurant_mobile/providers/checkout_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/widgets/guest_login_prompt.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';
import 'package:single_restaurant_mobile/widgets/addresses/address_card.dart';
import 'package:single_restaurant_mobile/widgets/addresses/address_top_banner.dart';
import 'package:single_restaurant_mobile/widgets/addresses/address_form_sheet.dart';

class SavedAddressesScreen extends StatefulWidget {
  final bool selectingMode;
  const SavedAddressesScreen({super.key, this.selectingMode = false});

  @override
  State<SavedAddressesScreen> createState() => _SavedAddressesScreenState();
}

class _SavedAddressesScreenState extends State<SavedAddressesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AddressProvider>(context, listen: false).fetchAddresses();
    });
  }

  void _onAddressSelected(String id, AddressProvider provider) {
    if (widget.selectingMode) {
      final checkout = Provider.of<CheckoutProvider>(context, listen: false);
      final cart = Provider.of<CartProvider>(context, listen: false);
      checkout.handleSelectSavedAddress(
        provider.addresses.firstWhere((a) => a['_id'] == id),
        cart,
      );
      Navigator.pop(context);
    } else {
      final address = provider.addresses.firstWhere((a) => a['_id'] == id);
      if (address['isDefault'] != true) {
        provider.setDefaultAddress(id);
      }
    }
  }

  void _showAddressBottomSheet(
    BuildContext context,
    AddressProvider provider, {
    Map<String, dynamic>? existingAddress,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return AddressFormBottomSheet(
          provider: provider,
          existingAddress: existingAddress,
        );
      },
    );
  }

  IconData _getIconForLabel(String? label) {
    if (label == null) return Icons.map_outlined;
    final lower = label.toLowerCase();
    if (lower.contains('home')) return Icons.home_outlined;
    if (lower.contains('work') || lower.contains('office')) return Icons.work_outline;
    return Icons.map_outlined;
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
            'Saved Addresses',
            style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 20),
          ),
          centerTitle: true,
        ),
        body: const GuestLoginPrompt(
          icon: Icons.location_on_outlined,
          title: 'Login to manage addresses',
          subtitle: 'Save your home, work, and other addresses for quick delivery.',
        ),
      );
    }

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
          'Saved Addresses',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 20),
        ),
        centerTitle: true,
      ),
      body: Consumer<AddressProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.addresses.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: AppColors.secondary));
          }

          final defaultAddressIndex =
              provider.addresses.indexWhere((a) => a['isDefault'] == true);
          final hasDefault = defaultAddressIndex != -1;

          return ResponsiveCenter(
            maxWidth: 650,
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const AddressTopBanner(),
                  if (hasDefault) ...[
                    const Padding(
                      padding: EdgeInsets.fromLTRB(16, 24, 16, 8),
                      child: Text(
                        'Default Address',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                    ),
                    AddressCard(
                      id: provider.addresses[defaultAddressIndex]['_id'],
                      title: provider.addresses[defaultAddressIndex]['label'] ?? 'Home',
                      address: provider.addresses[defaultAddressIndex]['address'] ?? '',
                      phone: provider.addresses[defaultAddressIndex]['phone'] ?? '',
                      icon: _getIconForLabel(provider.addresses[defaultAddressIndex]['label']),
                      isDefault: true,
                      selectingMode: widget.selectingMode,
                      onTap: () => _onAddressSelected(
                        provider.addresses[defaultAddressIndex]['_id'],
                        provider,
                      ),
                      onEdit: () => _showAddressBottomSheet(
                        context,
                        provider,
                        existingAddress: provider.addresses[defaultAddressIndex],
                      ),
                      onDelete: () => provider.deleteAddress(
                        provider.addresses[defaultAddressIndex]['_id'],
                      ),
                    ),
                  ],
                  if (provider.addresses.isNotEmpty) ...[
                    const Padding(
                      padding: EdgeInsets.fromLTRB(16, 24, 16, 8),
                      child: Text(
                        'All Addresses',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                    ),
                    for (int i = 0; i < provider.addresses.length; i++)
                      if (i != defaultAddressIndex)
                        AddressCard(
                          id: provider.addresses[i]['_id'],
                          title: provider.addresses[i]['label'] ?? 'Other',
                          address: provider.addresses[i]['address'] ?? '',
                          phone: provider.addresses[i]['phone'] ?? '',
                          icon: _getIconForLabel(provider.addresses[i]['label']),
                          isDefault: false,
                          iconBgColor: Colors.blue.shade50,
                          iconColor: Colors.blue.shade700,
                          selectingMode: widget.selectingMode,
                          onTap: () => _onAddressSelected(provider.addresses[i]['_id'], provider),
                          onEdit: () => _showAddressBottomSheet(
                            context,
                            provider,
                            existingAddress: provider.addresses[i],
                          ),
                          onDelete: () => provider.deleteAddress(provider.addresses[i]['_id']),
                        ),
                  ],
                  AddNewAddressCard(
                    onTap: () => _showAddressBottomSheet(
                      context,
                      Provider.of<AddressProvider>(context, listen: false),
                    ),
                  ),
                  const AddressFooterBanner(),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
