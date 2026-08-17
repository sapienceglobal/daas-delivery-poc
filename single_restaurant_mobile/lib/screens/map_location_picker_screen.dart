import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/widgets/address_autocomplete_field.dart';
import 'package:single_restaurant_mobile/services/location_service.dart';

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
    String finalAddress = _currentAddress;

    Navigator.pop(context, {
      'address': finalAddress,
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
          // Search Bar Container
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
                label: '', // No label needed
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
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 30.0), // Adjust to center the pin point
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppColors.secondary,
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 2),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.3),
                                    blurRadius: 8,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: const Icon(Icons.location_on, color: Colors.white, size: 24),
                            ),
                            Container(
                              width: 6,
                              height: 6,
                              decoration: BoxDecoration(
                                color: Colors.black.withOpacity(0.5),
                                shape: BoxShape.circle,
                              ),
                            )
                          ],
                        ),
                      ),
                    ),

                    // Locate Me FAB
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
              
              // Bottom Details Sheet
              Container(
                padding: EdgeInsets.fromLTRB(20, 24, 20, MediaQuery.of(context).padding.bottom + 20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: const Offset(0, -5),
                    )
                  ],
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Location Address Display
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.location_on, color: AppColors.secondary, size: 24),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Delivery Location', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                const SizedBox(height: 4),
                                if (_isGeocoding)
                                  const Row(
                                    children: [
                                      SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2)),
                                      SizedBox(width: 8),
                                      Text('Fetching address...', style: TextStyle(color: Colors.grey, fontSize: 12)),
                                    ],
                                  )
                                else
                                  Text(
                                    _currentAddress,
                                    style: TextStyle(color: Colors.grey.shade700, fontSize: 13),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    
                    // Confirm Button
                    SizedBox(
                      height: 50,
                      child: ElevatedButton(
                        onPressed: (_isGeocoding || _currentAddress.isEmpty) ? null : _handleConfirm,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.secondary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Confirm Location', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      ),
                    ),
                  ],
                ),
              ),
        ],
      ),
    );
  }
}
