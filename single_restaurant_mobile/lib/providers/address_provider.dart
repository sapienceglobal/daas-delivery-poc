import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/services/address_service.dart';

class AddressProvider with ChangeNotifier {
  final AddressService _addressService = AddressService();
  
  List<dynamic> _addresses = [];
  bool _isLoading = false;
  String? _error;

  List<dynamic> get addresses => _addresses;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchAddresses() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _addressService.getAddresses();
      if (data != null) {
        _addresses = data;
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> addAddress(Map<String, dynamic> addressData) async {
    _isLoading = true;
    notifyListeners();
    
    final success = await _addressService.addAddress(addressData);
    if (success) {
      await fetchAddresses(); // Refresh list
    } else {
      _isLoading = false;
      _error = 'Failed to add address';
      notifyListeners();
    }
    return success;
  }

  Future<bool> editAddress(String id, Map<String, dynamic> addressData) async {
    _isLoading = true;
    notifyListeners();
    
    final success = await _addressService.editAddress(id, addressData);
    if (success) {
      await fetchAddresses();
    } else {
      _isLoading = false;
      _error = 'Failed to edit address';
      notifyListeners();
    }
    return success;
  }

  Future<bool> deleteAddress(String id) async {
    _isLoading = true;
    notifyListeners();
    
    final success = await _addressService.deleteAddress(id);
    if (success) {
      await fetchAddresses();
    } else {
      _isLoading = false;
      _error = 'Failed to delete address';
      notifyListeners();
    }
    return success;
  }
  
  Future<bool> setDefaultAddress(String id) async {
    _isLoading = true;
    notifyListeners();
    
    final success = await _addressService.setDefaultAddress(id);
    if (success) {
      await fetchAddresses();
    } else {
      _isLoading = false;
      _error = 'Failed to set default address';
      notifyListeners();
    }
    return success;
  }
}
