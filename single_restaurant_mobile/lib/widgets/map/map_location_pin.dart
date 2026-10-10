import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';

class MapLocationPin extends StatelessWidget {
  const MapLocationPin({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
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
                    color: Colors.black.withValues(alpha: 0.3),
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
                color: Colors.black.withValues(alpha: 0.5),
                shape: BoxShape.circle,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
