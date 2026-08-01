import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/address_provider.dart';
import 'package:single_restaurant_mobile/widgets/address_autocomplete_field.dart';
import 'package:single_restaurant_mobile/providers/checkout_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/widgets/guest_login_prompt.dart';

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

          final defaultAddressIndex = provider.addresses.indexWhere((a) => a['isDefault'] == true);
          final hasDefault = defaultAddressIndex != -1;

          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildTopBanner(),
                
                if (hasDefault) ...[
                  const Padding(
                    padding: EdgeInsets.fromLTRB(16, 24, 16, 8),
                    child: Text('Default Address', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                  _buildAddressCard(
                    id: provider.addresses[defaultAddressIndex]['_id'],
                    title: provider.addresses[defaultAddressIndex]['label'] ?? 'Home',
                    address: provider.addresses[defaultAddressIndex]['address'] ?? '',
                    phone: provider.addresses[defaultAddressIndex]['phone'] ?? '',
                    icon: _getIconForLabel(provider.addresses[defaultAddressIndex]['label']),
                    isDefault: true,
                    provider: provider,
                  ),
                ],

                if (provider.addresses.isNotEmpty) ...[
                  const Padding(
                    padding: EdgeInsets.fromLTRB(16, 24, 16, 8),
                    child: Text('All Addresses', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                  for (int i = 0; i < provider.addresses.length; i++)
                    if (i != defaultAddressIndex)
                      _buildAddressCard(
                        id: provider.addresses[i]['_id'],
                        title: provider.addresses[i]['label'] ?? 'Other',
                        address: provider.addresses[i]['address'] ?? '',
                        phone: provider.addresses[i]['phone'] ?? '',
                        icon: _getIconForLabel(provider.addresses[i]['label']),
                        isDefault: false,
                        iconBgColor: Colors.blue.shade50,
                        iconColor: Colors.blue.shade700,
                        provider: provider,
                      ),
                ],

                _buildAddNewAddress(),
                _buildFooterBanner(),
                const SizedBox(height: 32),
              ],
            ),
          );
        },
      ),
    );
  }

  IconData _getIconForLabel(String? label) {
    if (label == null) return Icons.map_outlined;
    final lower = label.toLowerCase();
    if (lower.contains('home')) return Icons.home_outlined;
    if (lower.contains('work') || lower.contains('office')) return Icons.work_outline;
    return Icons.map_outlined;
  }

  Widget _buildTopBanner() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7F0), // Light orange/beige
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4)],
            ),
            child: const Icon(Icons.location_on, color: AppColors.secondary, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Your saved addresses for quick & easy checkout', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 4),
                Text('Select an address during checkout to place your order', style: TextStyle(color: Colors.grey.shade700, fontSize: 11)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          const Icon(Icons.map_outlined, color: Colors.orange, size: 40), // Placeholder for map illustration
        ],
      ),
    );
  }

  Widget _buildAddressCard({
    required String id,
    required String title,
    required String address,
    required String phone,
    required IconData icon,
    required bool isDefault,
    Color? iconBgColor,
    Color? iconColor,
    required AddressProvider provider,
  }) {
    final bgColor = isDefault ? const Color(0xFFFFF0F0) : Colors.white;
    final borderColor = isDefault ? Colors.red.shade200 : AppColors.divider;
    final leadingIconColor = isDefault ? AppColors.secondary : Colors.grey;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Radio button
          InkWell(
            onTap: () {
              if (widget.selectingMode) {
                final checkout = Provider.of<CheckoutProvider>(context, listen: false);
                final cart = Provider.of<CartProvider>(context, listen: false);
                checkout.handleSelectSavedAddress(provider.addresses.firstWhere((a) => a['_id'] == id), cart);
                Navigator.pop(context);
              } else if (!isDefault) {
                provider.setDefaultAddress(id);
              }
            },
            child: Padding(
              padding: const EdgeInsets.only(top: 8.0, right: 12.0),
              child: Icon(
                widget.selectingMode ? Icons.circle_outlined : (isDefault ? Icons.radio_button_checked : Icons.radio_button_unchecked),
                color: widget.selectingMode ? Colors.grey : leadingIconColor,
                size: 20,
              ),
            ),
          ),
          // Circle Icon
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDefault ? Colors.red.shade100 : (iconBgColor ?? Colors.grey.shade100),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: isDefault ? AppColors.secondary : (iconColor ?? Colors.grey.shade700), size: 24),
          ),
          // Details
          Expanded(
            child: InkWell(
              onTap: () {
                if (widget.selectingMode) {
                  final checkout = Provider.of<CheckoutProvider>(context, listen: false);
                  final cart = Provider.of<CartProvider>(context, listen: false);
                  checkout.handleSelectSavedAddress(provider.addresses.firstWhere((a) => a['_id'] == id), cart);
                  Navigator.pop(context);
                }
              },
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      if (isDefault) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            border: Border.all(color: Colors.red.shade200),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text('DEFAULT', style: TextStyle(color: Colors.red, fontSize: 8, fontWeight: FontWeight.bold)),
                        ),
                      ]
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(address, style: const TextStyle(color: Colors.black87, fontSize: 13, height: 1.4)),
                  const SizedBox(height: 8),
                  Text(phone, style: const TextStyle(color: Colors.black87, fontSize: 13)),
                ],
              ),
            ),
          ),
          // Actions (Edit / Delete)
          Row(
            children: [
              InkWell(
                onTap: () => _showAddressBottomSheet(
                  context, 
                  provider, 
                  existingAddress: provider.addresses.firstWhere((a) => a['_id'] == id)
                ),
                child: _buildActionItem(Icons.edit_outlined, 'Edit')
              ),
              Container(height: 30, width: 1, color: AppColors.divider, margin: const EdgeInsets.symmetric(horizontal: 8)),
              InkWell(
                onTap: () => provider.deleteAddress(id),
                child: _buildActionItem(Icons.delete_outline, 'Delete')
              ),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildActionItem(IconData icon, String label) {
    return Column(
      children: [
        Icon(icon, color: Colors.black87, size: 20),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(color: AppColors.secondary, fontSize: 11, fontWeight: FontWeight.w500)),
      ],
    );
  }

  Widget _buildAddNewAddress() {
    return InkWell(
      onTap: () => _showAddressBottomSheet(context, Provider.of<AddressProvider>(context, listen: false)),
      child: Container(
        margin: const EdgeInsets.all(16),
        child: CustomPaint(
          painter: DashedRectPainter(color: Colors.grey.shade400, strokeWidth: 1.5, gap: 5.0),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 24),
            alignment: Alignment.center,
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.secondary, width: 1.5),
                  ),
                  child: const Icon(Icons.add, color: AppColors.secondary, size: 20),
                ),
                const SizedBox(height: 12),
                const Text('Add New Address', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 4),
                const Text('Save a new address for faster checkout', style: TextStyle(color: Colors.grey, fontSize: 12)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFooterBanner() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7F0), // Light orange/beige
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4)],
            ),
            child: const Icon(Icons.security, color: Colors.brown, size: 24),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Text('Your addresses are secure and\nused only for delivering your orders.', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, height: 1.4)),
          ),
          const SizedBox(width: 8),
          const Icon(Icons.delivery_dining, color: AppColors.secondary, size: 40), // Placeholder for scooter illustration
        ],
      ),
    );
  }

  void _showAddressBottomSheet(BuildContext context, AddressProvider provider, {Map<String, dynamic>? existingAddress}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) {
        return _AddressFormBottomSheet(provider: provider, existingAddress: existingAddress);
      },
    );
  }
}

class _AddressFormBottomSheet extends StatefulWidget {
  final AddressProvider provider;
  final Map<String, dynamic>? existingAddress;

  const _AddressFormBottomSheet({required this.provider, this.existingAddress});

  @override
  State<_AddressFormBottomSheet> createState() => _AddressFormBottomSheetState();
}

class _AddressFormBottomSheetState extends State<_AddressFormBottomSheet> {
  final _labelController = TextEditingController();
  final _phoneController = TextEditingController();
  final _streetController = TextEditingController();
  final _address2Controller = TextEditingController();
  final _cityController = TextEditingController();
  final _zipController = TextEditingController();
  
  String _state = 'NY';
  double? _lat;
  double? _lng;
  bool _isLoading = false;

  final usStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  ];

  @override
  void initState() {
    super.initState();
    if (widget.existingAddress != null) {
      _labelController.text = widget.existingAddress!['label'] ?? '';
      _phoneController.text = widget.existingAddress!['phone'] ?? '';
      _lat = widget.existingAddress!['lat'] != null ? double.tryParse(widget.existingAddress!['lat'].toString()) : null;
      _lng = widget.existingAddress!['lng'] != null ? double.tryParse(widget.existingAddress!['lng'].toString()) : null;

      String fullAddress = widget.existingAddress!['address'] ?? '';
      final zipRegex = RegExp(r'([A-Za-z]{2})(?:,)?\s+(\d{5})(?:-\d{4})?$');
      final match = zipRegex.firstMatch(fullAddress);
      
      if (match != null) {
        _state = match.group(1)!.toUpperCase();
        _zipController.text = match.group(2)!;
        
        String rest = fullAddress.replaceAll(match.group(0)!, '').trim();
        if (rest.endsWith(',')) rest = rest.substring(0, rest.length - 1).trim();
        
        final parts = rest.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
        
        if (parts.isNotEmpty) {
          _cityController.text = parts.last;
          parts.removeLast();
        }
        
        if (parts.isNotEmpty) {
          _streetController.text = parts.first;
          if (parts.length > 1) {
            _address2Controller.text = parts.sublist(1).join(', ');
          } else {
            _address2Controller.text = '';
          }
        } else {
          _streetController.text = '';
          _address2Controller.text = '';
        }
      } else {
        _streetController.text = fullAddress;
        _address2Controller.text = '';
      }
    }
  }

  void _handleAutocomplete(Map<String, dynamic> data) {
    if (data['address'] != null) {
      final addr = data['address'];
      setState(() {
        _streetController.text = addr['road'] ?? addr['suburb'] ?? data['name'] ?? '';
        _cityController.text = addr['city'] ?? addr['town'] ?? addr['village'] ?? '';
        _state = (addr['state'] ?? 'NY').toString().substring(0, 2).toUpperCase();
        
        String zip = (addr['postcode'] ?? '').toString().replaceAll(RegExp(r'\D'), '');
        if (zip.length > 5) zip = zip.substring(0, 5);
        _zipController.text = zip;
        
        _lat = double.tryParse(data['lat'].toString());
        _lng = double.tryParse(data['lon'].toString());
      });
    }
  }

  Future<void> _saveAddress() async {
    if (_streetController.text.isEmpty || _cityController.text.isEmpty || _zipController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all address fields')));
      return;
    }

    setState(() => _isLoading = true);

    String baseStreet = _streetController.text;
    if (_address2Controller.text.isNotEmpty) {
      baseStreet += ', ${_address2Controller.text}';
    }
    final compiledAddress = '$baseStreet, ${_cityController.text}, $_state ${_zipController.text}';

    final payload = {
      'label': _labelController.text.isNotEmpty ? _labelController.text : 'Other',
      'address': compiledAddress,
      'phone': _phoneController.text,
      'lat': _lat,
      'lng': _lng,
      'isDefault': widget.existingAddress?['isDefault'] ?? false,
    };

    bool success;
    if (widget.existingAddress != null) {
      success = await widget.provider.editAddress(widget.existingAddress!['_id'], payload);
    } else {
      success = await widget.provider.addAddress(payload);
    }

    if (mounted) {
      setState(() => _isLoading = false);
      if (success) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(widget.existingAddress != null ? 'Address updated' : 'Address added')));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(widget.provider.error ?? 'Failed to save address')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 20, right: 20, top: 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(widget.existingAddress != null ? 'Edit Address' : 'Add New Address', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            
            // Label & Phone
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Label (Home/Work)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _labelController,
                        decoration: _inputDecoration('e.g. Home'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Phone', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        decoration: _inputDecoration('Phone number'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            // Autocomplete Street
            AddressAutocompleteField(
              controller: _streetController,
              label: 'Street Address *',
              onSelected: _handleAutocomplete,
            ),
            const SizedBox(height: 16),
            
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Apt, Suite, Floor (Optional)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 6),
                TextField(
                  controller: _address2Controller,
                  decoration: _inputDecoration('Apt, Suite, Floor'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            // City & State
            Row(
              children: [
                Expanded(
                  flex: 2,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('City *', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _cityController,
                        decoration: _inputDecoration('City'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 1,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('State *', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(height: 6),
                      DropdownButtonFormField<String>(
                        value: usStates.contains(_state) ? _state : 'NY',
                        decoration: _inputDecoration(''),
                        items: usStates.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                        onChanged: (v) {
                          if (v != null) setState(() => _state = v);
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            // Zip Code
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Zip Code *', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 6),
                TextField(
                  controller: _zipController,
                  keyboardType: TextInputType.number,
                  decoration: _inputDecoration('Zip Code'),
                ),
              ],
            ),
            
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _saveAddress,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.secondary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _isLoading 
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('SAVE ADDRESS', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.0)),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: Colors.grey.shade50,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.secondary)),
    );
  }
}


// Custom painter for dashed rectangle border
class DashedRectPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  final double gap;

  DashedRectPainter({this.color = Colors.black, this.strokeWidth = 1.0, this.gap = 5.0});

  @override
  void paint(Canvas canvas, Size size) {
    var paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke;

    var path = Path();
    path.addRRect(RRect.fromRectAndRadius(Rect.fromLTWH(0, 0, size.width, size.height), const Radius.circular(12)));

    // Create dashed path
    var dashPath = Path();
    bool addLine = true;
    double distance = 0.0;
    for (var metric in path.computeMetrics()) {
      while (distance < metric.length) {
        if (addLine) {
          dashPath.addPath(metric.extractPath(distance, distance + gap), Offset.zero);
        }
        distance += gap;
        addLine = !addLine;
      }
      distance = 0.0; // Reset for next metric (if any)
    }

    canvas.drawPath(dashPath, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
