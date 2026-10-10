import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/services/location_service.dart';
import 'package:single_restaurant_mobile/widgets/address_autocomplete_field.dart';
import 'package:single_restaurant_mobile/widgets/map/map_bottom_sheet.dart';
import 'package:single_restaurant_mobile/widgets/map/map_location_pin.dart';

class MapLocationPickerScreen extends StatefulWidget {
  final LatLng? initialCenter;

  const MapLocationPickerScreen({super.key, this.initialCenter});

  @override
  State<MapLocationPickerScreen> createState() => _MapLocationPickerScreenState();
}

class _MapLocationPickerScreenState extends State<MapLocationPickerScreen> {
  late final MapController _mapController;
  LatLng _center = const LatLng(40.7128, -74.0060); // Default NYC
  bool _isLoadingLocation = false;
  bool _isGeocoding = false;
  String _currentAddress = '';
  Map<String, dynamic>? _addressDetails;

  final TextEditingController _searchController = TextEditingController();
  final LocationService _locationService = LocationService();
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _mapController = MapController();
    if (widget.initialCenter != null) {
      _center = widget.initialCenter!;
      _performReverseGeocode(_center);
    } else {
      _getCurrentLocation();
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    _mapController.dispose();
    super.dispose();
  }

  Future<void> _getCurrentLocation() async {
    setState(() => _isLoadingLocation = true);
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() => _isLoadingLocation = false);
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() => _isLoadingLocation = false);
        return;
      }

      Position position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
      setState(() {
        _center = LatLng(position.latitude, position.longitude);
        _isLoadingLocation = false;
      });
      _mapController.move(_center, 17.0);
      _performReverseGeocode(_center);
    } catch (e) {
      setState(() => _isLoadingLocation = false);
      debugPrint('Error getting location: $e');
    }
  }

  Future<void> _performReverseGeocode(LatLng position) async {
    setState(() => _isGeocoding = true);
    try {
      final data = await _locationService.reverseGeocode(position.latitude, position.longitude);

      if (data != null) {
        setState(() {
          _currentAddress = data['display_name'] ?? 'Unknown Location';
          _addressDetails = data['address'];

          if (_addressDetails != null) {
            final road = _addressDetails!['road'] ?? _addressDetails!['pedestrian'] ?? _addressDetails!['neighbourhood'] ?? '';
            final house = _addressDetails!['house_number'] ?? '';
            String shortAddr = [house, road].where((e) => e.toString().trim().isNotEmpty).join(' ');

            final city = _addressDetails!['city'] ?? _addressDetails!['town'] ?? _addressDetails!['village'] ?? '';
            if (shortAddr.isEmpty) shortAddr = city;

            if (shortAddr.isNotEmpty) {
              _currentAddress = '$shortAddr, $city';
            }
          }
        });
      }
    } catch (e) {
      debugPrint('Reverse geocode error: $e');
      setState(() {
        _currentAddress = 'Unable to fetch address. Please enter manually.';
        _addressDetails = null;
      });
    } finally {
      if (mounted) setState(() => _isGeocoding = false);
    }
  }

  void _onMapEvent(MapEvent event) {
    if (event is MapEventMove) {
      setState(() {
        _center = event.camera.center;
      });
    } else if (event is MapEventMoveEnd) {
      if (_debounce?.isActive ?? false) _debounce!.cancel();
      _debounce = Timer(const Duration(milliseconds: 600), () {
        _performReverseGeocode(_center);
      });
    }
  }

  void _handleConfirm() {
    Navigator.pop(context, {
      'address': _currentAddress,
      'lat': _center.latitude,
      'lng': _center.longitude,
      'addressDetails': _addressDetails,
    });
  }

  @override
  Widget build(BuildContext context) {
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
          'Confirm Location',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 20),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: AddressAutocompleteField(
                controller: _searchController,
                label: '',
                onSelected: (data) async {
                  String? latStr = data['lat']?.toString();
                  String? lonStr = data['lon']?.toString() ?? data['lng']?.toString();

                  if (data['place_id'] != null) {
                    setState(() => _isGeocoding = true);
                    final details = await _locationService.geocodeAddress(data['place_id'], isPlaceId: true);
                    if (mounted) setState(() => _isGeocoding = false);
                    if (details != null) {
                      latStr = details['lat']?.toString();
                      lonStr = details['lon']?.toString() ?? details['lng']?.toString();
                    }
                  }

                  if (latStr != null && lonStr != null) {
                    final lat = double.tryParse(latStr);
                    final lon = double.tryParse(lonStr);
                    if (lat != null && lon != null) {
                      final newCenter = LatLng(lat, lon);
                      _mapController.move(newCenter, 17.0);
                      setState(() {
                        _center = newCenter;
                      });
                      _performReverseGeocode(newCenter);
                    }
                  }
                },
              ),
            ),
          ),
          Expanded(
            child: Stack(
              children: [
                FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: _center,
                    initialZoom: 17.0,
                    onMapEvent: _onMapEvent,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
                      userAgentPackageName: 'com.sapienceglobal.daas.poc',
                    ),
                  ],
                ),
                const MapLocationPin(),
                Positioned(
                  right: 16,
                  bottom: 16,
                  child: FloatingActionButton(
                    heroTag: 'locate_me_fab',
                    backgroundColor: Colors.white,
                    onPressed: _getCurrentLocation,
                    child: _isLoadingLocation
                        ? const CircularProgressIndicator(color: AppColors.secondary)
                        : const Icon(Icons.my_location, color: AppColors.secondary),
                  ),
                ),
              ],
            ),
          ),
          MapBottomSheet(
            currentAddress: _currentAddress,
            isGeocoding: _isGeocoding,
            onConfirm: _handleConfirm,
          ),
        ],
      ),
    );
  }
}
