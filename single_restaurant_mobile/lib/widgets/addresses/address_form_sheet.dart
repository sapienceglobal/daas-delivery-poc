import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/address_provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/screens/map_location_picker_screen.dart';
import 'package:single_restaurant_mobile/services/location_service.dart';
import 'package:latlong2/latlong.dart' hide Path;
import 'package:single_restaurant_mobile/theme/app_responsive.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';
import 'package:single_restaurant_mobile/widgets/addresses/address_form_fields.dart';

const _kMaroon = Color(0xFF7A1414);
const _kMaroonDark = Color(0xFF5E0F0F);
const _kCloseBg = Color(0xFFFBE4E1);

class AddressFormBottomSheet extends StatefulWidget {
  final AddressProvider provider;
  final Map<String, dynamic>? existingAddress;

  const AddressFormBottomSheet({
    super.key,
    required this.provider,
    this.existingAddress,
  });

  @override
  State<AddressFormBottomSheet> createState() => _AddressFormBottomSheetState();
}

class _AddressFormBottomSheetState extends State<AddressFormBottomSheet> {
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

  final LocationService _locationService = LocationService();

  @override
  void initState() {
    super.initState();
    _initAddressData();
  }

  void _initAddressData() {
    if (widget.existingAddress != null) {
      _labelController.text = widget.existingAddress!['label'] ?? '';
      _phoneController.text = widget.existingAddress!['phone'] ?? '';
      _lat = widget.existingAddress!['lat'] != null
          ? double.tryParse(widget.existingAddress!['lat'].toString())
          : null;
      _lng = widget.existingAddress!['lng'] != null
          ? double.tryParse(widget.existingAddress!['lng'].toString())
          : null;

      String fullAddress = widget.existingAddress!['address'] ?? '';
      final zipRegex = RegExp(r'([A-Za-z]{2})(?:,)?\s+(\d{5})(?:-\d{4})?$');
      final match = zipRegex.firstMatch(fullAddress);

      if (match != null) {
        _state = match.group(1)!.toUpperCase();
        _zipController.text = match.group(2)!;

        String rest = fullAddress.replaceAll(match.group(0)!, '').trim();
        if (rest.endsWith(',')) rest = rest.substring(0, rest.length - 1).trim();

        final parts =
            rest.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();

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
    } else {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          final user = Provider.of<AuthProvider>(context, listen: false).user;
          if (user != null && user.phone.isNotEmpty) {
            _phoneController.text = user.phone;
          }
        }
      });
    }
  }

  @override
  void dispose() {
    _labelController.dispose();
    _phoneController.dispose();
    _streetController.dispose();
    _address2Controller.dispose();
    _cityController.dispose();
    _zipController.dispose();
    super.dispose();
  }

  Future<void> _handleAutocomplete(Map<String, dynamic> data) async {
    Map<String, dynamic> details = data;

    if (data['place_id'] != null) {
      setState(() => _isLoading = true);
      final placeDetails =
          await _locationService.geocodeAddress(data['place_id'], isPlaceId: true);
      setState(() => _isLoading = false);
      if (placeDetails != null) {
        details = placeDetails;
      }
    }

    if (details['address'] != null) {
      final addr = details['address'];
      setState(() {
        _streetController.text = addr['house_number'] != null && addr['road'] != null
            ? '${addr['house_number']} ${addr['road']}'.trim()
            : addr['road'] ?? addr['suburb'] ?? details['name'] ?? data['main_text'] ?? '';

        _cityController.text =
            addr['city'] ?? addr['town'] ?? addr['village'] ?? '';
        _state = (addr['state'] ?? 'NY').toString().substring(0, 2).toUpperCase();

        String zip = (addr['postcode'] ?? '').toString().replaceAll(RegExp(r'\D'), '');
        if (zip.length > 5) zip = zip.substring(0, 5);
        _zipController.text = zip;

        _lat = double.tryParse(details['lat']?.toString() ?? '');
        _lng = double.tryParse(details['lng']?.toString() ?? details['lon']?.toString() ?? '');
      });
    }
  }

  Future<void> _pickOnMap() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => MapLocationPickerScreen(
          initialCenter: (_lat != null && _lng != null)
              ? LatLng(_lat!, _lng!)
              : null,
        ),
      ),
    );

    if (result != null && result is Map) {
      setState(() {
        _lat = result['lat'];
        _lng = result['lng'];

        final details = result['addressDetails'];
        if (details != null) {
          final road = details['road'] ?? details['pedestrian'] ?? details['neighbourhood'] ?? '';
          final houseNumber = details['house_number'] ?? '';
          _streetController.text = '$houseNumber $road'.trim();

          _cityController.text =
              details['city'] ?? details['town'] ?? details['village'] ?? details['suburb'] ?? _cityController.text;

          if (details['state'] != null) {
            String s = details['state'].toString().substring(0, 2).toUpperCase();
            if (kUsStates.contains(s)) _state = s;
          }

          if (details['postcode'] != null) {
            _zipController.text = details['postcode'].toString().substring(0, 5);
          }
        } else if (result['address'] != null) {
          _streetController.text = result['address'];
        }
      });
    }
  }

  Future<void> _saveAddress() async {
    if (_streetController.text.isEmpty ||
        _cityController.text.isEmpty ||
        _zipController.text.isEmpty) {
      ToastUtils.showError(context, 'Please fill all address fields');
      return;
    }

    setState(() => _isLoading = true);

    String baseStreet = _streetController.text;
    if (_address2Controller.text.isNotEmpty) {
      baseStreet += ', ${_address2Controller.text}';
    }
    final compiledAddress =
        '$baseStreet, ${_cityController.text}, $_state ${_zipController.text}';

    final isFirstAddress =
        widget.existingAddress == null && widget.provider.addresses.isEmpty;

    final payload = {
      'label': _labelController.text.isNotEmpty ? _labelController.text : 'Other',
      'address': compiledAddress,
      'phone': _phoneController.text,
      'lat': _lat,
      'lng': _lng,
      'isDefault': widget.existingAddress?['isDefault'] ?? isFirstAddress,
    };

    bool success;
    if (widget.existingAddress != null) {
      success = await widget.provider.editAddress(
        widget.existingAddress!['_id'],
        payload,
      );
    } else {
      success = await widget.provider.addAddress(payload);
    }

    if (mounted) {
      setState(() => _isLoading = false);
      if (success) {
        Navigator.pop(context);
        ToastUtils.showSuccess(
          context,
          widget.existingAddress != null ? 'Address updated' : 'Address added',
        );
      } else {
        ToastUtils.showError(
          context,
          widget.provider.error ?? 'Failed to save address',
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final maxHeight = mediaQuery.size.height * 0.92;
    final keyboardInset = mediaQuery.viewInsets.bottom;
    final isEdit = widget.existingAddress != null;

    return Align(
      alignment: Alignment.bottomCenter,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: AppResponsive.maxModalWidth),
        child: Container(
          constraints: BoxConstraints(maxHeight: maxHeight),
          margin: EdgeInsets.only(bottom: keyboardInset),
          decoration: const BoxDecoration(
            color: Color(0xFFFBF7F2),
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            boxShadow: [
              BoxShadow(
                color: Color(0x24000000),
                blurRadius: 24,
                offset: Offset(0, -6),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Top drag handle
              Center(
                child: Container(
                  margin: const EdgeInsets.only(top: 10, bottom: 8),
                  width: 44,
                  height: 4.5,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2.5),
                  ),
                ),
              ),

              // Header Row
              Padding(
                padding: const EdgeInsets.fromLTRB(18, 6, 16, 12),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // 3D Pin / Map illustration (Image 3)
                    Container(
                      width: 56,
                      height: 56,
                      decoration: const BoxDecoration(
                        color: Color(0xFFFBECE8),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Image.asset(
                          'assets/images/branded/lassi-lounge/address_pin_icon.png',
                          width: 46,
                          height: 46,
                          fit: BoxFit.contain,
                          errorBuilder: (ctx, err, st) =>
                              const Icon(Icons.location_on, color: _kMaroon, size: 28),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isEdit ? 'Edit Address' : 'Add New Address',
                            style: const TextStyle(
                              fontFamily: 'serif',
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: _kMaroon,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Enter your delivery address to get started',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        width: 38,
                        height: 38,
                        decoration: const BoxDecoration(
                          color: _kCloseBg,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.close, color: _kMaroon, size: 18),
                      ),
                    ),
                  ],
                ),
              ),

              // Scrollable Form Fields & Footer
              Flexible(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                        child: Column(
                          children: [
                            AddressFormFields(
                              labelController: _labelController,
                              phoneController: _phoneController,
                              streetController: _streetController,
                              address2Controller: _address2Controller,
                              cityController: _cityController,
                              zipController: _zipController,
                              state: _state,
                              onStateChanged: (val) => setState(() => _state = val),
                              onAutocompleteSelected: _handleAutocomplete,
                              onPickOnMap: _pickOnMap,
                            ),
                          ],
                        ),
                      ),

                      // NYC Monuments Skyline Footer with Save Address Button overlaid (Zero Gap, Full Monuments View)
                      Stack(
                        alignment: Alignment.topCenter,
                        children: [
                          // 1. Full-width NYC Monuments Skyline Footer (Edge-to-Edge, extends behind button)
                          Image.asset(
                            'assets/images/branded/lassi-lounge/nyc_skyline_footer.png',
                            width: double.infinity,
                            height: 230,
                            fit: BoxFit.cover,
                            alignment: Alignment.topCenter,
                            errorBuilder: (ctx, err, st) => const SizedBox(height: 80),
                          ),

                          // 2. Save Address Button overlaid seamlessly at top of watermark
                          Padding(
                            padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
                            child: Container(
                              width: double.infinity,
                              height: 52,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(16),
                                gradient: const LinearGradient(
                                  colors: [_kMaroon, _kMaroonDark],
                                ),
                                boxShadow: const [
                                  BoxShadow(
                                    color: Color(0x407A1414),
                                    blurRadius: 14,
                                    offset: Offset(0, 6),
                                  ),
                                ],
                              ),
                              child: Material(
                                color: Colors.transparent,
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(16),
                                  onTap: _isLoading ? null : _saveAddress,
                                  child: Center(
                                    child: _isLoading
                                        ? const SizedBox(
                                            width: 22,
                                            height: 22,
                                            child: CircularProgressIndicator(
                                              color: Colors.white,
                                              strokeWidth: 2,
                                            ),
                                          )
                                        : Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Text(
                                                isEdit ? 'UPDATE ADDRESS' : 'SAVE ADDRESS',
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 15.5,
                                                  letterSpacing: 0.8,
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              const Icon(
                                                Icons.arrow_forward,
                                                color: Colors.white,
                                                size: 18,
                                              ),
                                            ],
                                          ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
