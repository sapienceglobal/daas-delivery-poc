import 'package:flutter/material.dart';

class BookTableHero extends StatelessWidget {
  const BookTableHero({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      constraints: const BoxConstraints(minHeight: 250),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        image: const DecorationImage(
          image: AssetImage('assets/images/branded/lassi-lounge/menu-hero.jpg'),
          fit: BoxFit.cover,
        ),
      ),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
            colors: [Colors.black.withValues(alpha: 0.9), Colors.transparent],
          ),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Row(
                children: [
                  Icon(Icons.restaurant, color: Colors.amber.shade600, size: 16),
                  const SizedBox(width: 8),
                  Text(
                    'Reserve Your Table',
                    style: TextStyle(
                      color: Colors.amber.shade600,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Good Food Deserves\nA Great Place',
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
                height: 1.2,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Book your table in advance and\nenjoy a delightful dining experience.',
              style: TextStyle(color: Colors.white70, fontSize: 12),
            ),
            const SizedBox(height: 16),
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Row(
                children: [
                  _buildHeroFeature(Icons.star_outline, 'Priority\nSeating'),
                  const SizedBox(width: 24),
                  _buildHeroFeature(Icons.calendar_today_outlined, 'Hassle Free\nBooking'),
                  const SizedBox(width: 24),
                  _buildHeroFeature(Icons.room_service_outlined, 'Best Dining\nExperience'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeroFeature(IconData icon, String text) {
    return Column(
      children: [
        Icon(icon, color: Colors.amber.shade600, size: 20),
        const SizedBox(height: 4),
        Text(
          text,
          style: const TextStyle(color: Colors.white, fontSize: 10, height: 1.2),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}
