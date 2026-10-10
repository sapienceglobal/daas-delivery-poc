import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/address_provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/screens/map_location_picker_screen.dart';
import 'package:single_restaurant_mobile/services/location_service.dart';
import 'package:latlong2/latlong.dart' hide Path;
import 'package:single_restaurant_mobile/utils/toast_utils.dart';
import 'package:single_restaurant_mobile/widgets/common/app_bottom_sheet.dart';
import 'package:single_restaurant_mobile/widgets/common/app_button.dart';
import 'package:single_restaurant_mobile/widgets/addresses/address_form_fields.dart';

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
    return AppBottomSheet(
      title: widget.existingAddress != null ? 'Edit Address' : 'Add New Address',
      stickyFooter: AppButton(
        text: widget.existingAddress != null ? 'UPDATE ADDRESS' : 'SAVE ADDRESS',
        isLoading: _isLoading,
        onPressed: _isLoading ? null : _saveAddress,
        variant: AppButtonVariant.primary,
        size: AppButtonSize.large,
      ),
      child: SingleChildScrollView(
        child: AddressFormFields(
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
      ),
    );
  }
}
