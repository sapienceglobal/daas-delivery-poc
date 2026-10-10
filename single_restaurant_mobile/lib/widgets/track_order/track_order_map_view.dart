import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';

class TrackOrderMapView extends StatelessWidget {
  final Map<String, dynamic> order;
  final MapController mapController;

  const TrackOrderMapView({
    super.key,
    required this.order,
    required this.mapController,
  });

  @override
  Widget build(BuildContext context) {
    final hasRestaurant = order['restaurantLat'] != null && order['restaurantLng'] != null;
    final hasCustomer = order['addressLat'] != null && order['addressLng'] != null;
    final hasCourier = order['courierLat'] != null && order['courierLng'] != null;

    final markers = <Marker>[];
    if (hasRestaurant) {
      markers.add(
        Marker(
          point: LatLng((order['restaurantLat'] as num).toDouble(), (order['restaurantLng'] as num).toDouble()),
          width: 100,
          height: 60,
          child: _buildMapMarker(Icons.storefront, order['restaurantName'] ?? 'Restaurant', true),
        ),
      );
    }
    if (hasCustomer) {
      markers.add(
        Marker(
          point: LatLng((order['addressLat'] as num).toDouble(), (order['addressLng'] as num).toDouble()),
          width: 100,
          height: 60,
          child: _buildMapMarker(Icons.location_on, 'Dropoff', false),
        ),
      );
    }
    if (hasCourier) {
      markers.add(
        Marker(
          point: LatLng((order['courierLat'] as num).toDouble(), (order['courierLng'] as num).toDouble()),
          width: 50,
          height: 50,
          child: _buildDriverMarker(),
        ),
      );
    }

    final initialCenter = markers.isNotEmpty ? markers.first.point : const LatLng(37.7749, -122.4194);

    return Container(
      height: 250,
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFE5E5E5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade300),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          FlutterMap(
            mapController: mapController,
            options: MapOptions(
              initialCenter: initialCenter,
              initialZoom: 13.0,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.example.single_restaurant_mobile',
              ),
              MarkerLayer(markers: markers),
            ],
          ),
          if (markers.isNotEmpty)
            Positioned(
              bottom: 16,
              right: 16,
              child: Material(
                color: Colors.white,
                shape: const CircleBorder(),
                elevation: 4,
                child: InkWell(
                  customBorder: const CircleBorder(),
                  onTap: () {
                    final bounds = LatLngBounds.fromPoints(markers.map((m) => m.point).toList());
                    mapController.fitCamera(CameraFit.bounds(bounds: bounds, padding: const EdgeInsets.all(40.0)));
                  },
                  child: const Padding(
                    padding: EdgeInsets.all(12.0),
                    child: Icon(Icons.my_location, color: AppColors.secondary, size: 24),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildMapMarker(IconData icon, String label, bool isLeftAligned) {
    return Column(
      crossAxisAlignment: isLeftAligned ? CrossAxisAlignment.start : CrossAxisAlignment.end,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(4),
            boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4)],
          ),
          child: Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w500)),
        ),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.all(6),
          decoration: const BoxDecoration(
            color: AppColors.secondary,
            shape: BoxShape.circle,
            boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 4)],
          ),
          child: Icon(icon, color: Colors.white, size: 16),
        ),
      ],
    );
  }

  Widget _buildDriverMarker() {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2))],
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: const Icon(Icons.moped, color: Colors.red, size: 24),
    );
  }
}
