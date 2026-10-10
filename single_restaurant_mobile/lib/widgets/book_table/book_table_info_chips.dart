import 'package:flutter/material.dart';

class BookTableInfoChips extends StatelessWidget {
  const BookTableInfoChips({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.amber.shade50.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.amber.shade100),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: _buildInfoItem(
              Icons.verified_user_outlined,
              'No Booking Charge',
              'Reserve your table\nabsolutely free',
            ),
          ),
          Container(width: 1, height: 40, color: Colors.amber.shade200),
          Expanded(
            child: _buildInfoItem(
              Icons.access_time,
              '15 Min Hold Time',
              'Your table will be held\nfor 15 minutes',
            ),
          ),
          Container(width: 1, height: 40, color: Colors.amber.shade200),
          Expanded(
            child: _buildInfoItem(
              Icons.event_busy_outlined,
              'Easy Cancellation',
              'Cancel up to 2 hours\nbefore reservation',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoItem(IconData icon, String title, String subtitle) {
    return Column(
      children: [
        Icon(icon, color: Colors.amber.shade700, size: 20),
        const SizedBox(height: 6),
        Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: TextStyle(color: Colors.grey.shade600, fontSize: 8),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}
