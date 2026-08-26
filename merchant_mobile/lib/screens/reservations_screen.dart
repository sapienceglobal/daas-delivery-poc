import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import '../providers/reservation_provider.dart';
import '../models/reservation_model.dart';
import '../widgets/reservation_bottom_sheet.dart';
import '../widgets/app_drawer.dart';
import '../widgets/shared_app_bar.dart';
import '../widgets/shared_bottom_nav.dart';

class ReservationsScreen extends StatefulWidget {
  const ReservationsScreen({Key? key}) : super(key: key);

  @override
  State<ReservationsScreen> createState() => _ReservationsScreenState();
}

class _ReservationsScreenState extends State<ReservationsScreen> {
  DateTime _selectedDate = DateTime.now();
  String _statusFilter = 'All Status';
  String _seatingFilter = 'All Seating Areas';

  final List<String> _statuses = ['All Status', 'Confirmed', 'Pending', 'Seated', 'Completed', 'Cancelled'];
  final List<String> _seatings = ['All Seating Areas', 'Indoor', 'Outdoor Seating', 'Private Room', 'Main Dining Area'];

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ReservationProvider>();
    final allReservations = provider.reservations;

    // Filter reservations
    final filtered = allReservations.where((r) {
      bool matchDate = r.date.year == _selectedDate.year &&
          r.date.month == _selectedDate.month &&
          r.date.day == _selectedDate.day;
      
      bool matchStatus = _statusFilter == 'All Status' || r.status.toLowerCase() == _statusFilter.toLowerCase();
      
      bool matchSeating = _seatingFilter == 'All Seating Areas' || r.location.toLowerCase() == _seatingFilter.toLowerCase();

      return matchDate && matchStatus && matchSeating;
    }).toList();

    final stats = provider.getStatsForDate(_selectedDate);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: const SharedAppBar(),
      drawer: const AppDrawer(),
      body: provider.isLoading 
        ? const Center(child: CircularProgressIndicator())
        : Column(
            children: [
              _buildHorizontalCalendar(allReservations),
              _buildStatsRow(stats),
              _buildFilters(),
              Expanded(
                child: filtered.isEmpty
                    ? _buildEmptyState()
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        itemCount: filtered.length,
                        itemBuilder: (ctx, i) => _buildReservationCard(filtered[i], provider),
                      ),
              ),
            ],
          ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFF8B0000),
        onPressed: () {
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (ctx) => const ReservationBottomSheet(),
          );
        },
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('New Reservation', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      bottomNavigationBar: _buildBottomNav(context),
    );
  }

  Widget _buildHorizontalCalendar(List<ReservationModel> allReservations) {
    // Generate dates from 7 days ago to 14 days in future
    final today = DateTime.now();
    final dates = List.generate(21, (index) => today.subtract(Duration(days: 7 - index)));

    return Container(
      height: 90,
      color: Colors.white,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        controller: ScrollController(initialScrollOffset: 7 * 60.0), // Start roughly at today
        itemCount: dates.length,
        itemBuilder: (context, index) {
          final date = dates[index];
          final isSelected = date.year == _selectedDate.year &&
              date.month == _selectedDate.month &&
              date.day == _selectedDate.day;

          final hasReservation = allReservations.any((r) => 
            r.date.year == date.year && 
            r.date.month == date.month && 
            r.date.day == date.day
          );

          final weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

          return GestureDetector(
            onTap: () => setState(() => _selectedDate = date),
            child: Container(
              width: 60,
              margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFF8B0000) : Colors.transparent,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: isSelected ? const Color(0xFF8B0000) : Colors.grey.shade300),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(weekdays[date.weekday - 1], style: GoogleFonts.inter(
                    fontSize: 12,
                    color: isSelected ? Colors.white70 : Colors.grey.shade600,
                    fontWeight: FontWeight.w600,
                  )),
                  Text('${date.day}', style: GoogleFonts.inter(
                    fontSize: 16,
                    color: isSelected ? Colors.white : Colors.black,
                    fontWeight: FontWeight.bold,
                  )),
                  if (hasReservation)
                    Container(
                      margin: const EdgeInsets.only(top: 4),
                      width: 4,
                      height: 4,
                      decoration: BoxDecoration(
                        color: isSelected ? Colors.white : const Color(0xFF8B0000),
                        shape: BoxShape.circle,
                      ),
                    )
                  else
                    const SizedBox(height: 8),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatsRow(Map<String, dynamic> stats) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          _buildStatCard('Total Bookings', stats['total'].toString(), Icons.book_online, const Color(0xFFEA580C)),
          const SizedBox(width: 12),
          _buildStatCard('Confirmed', stats['confirmed'].toString(), Icons.check_circle_outline, const Color(0xFF16A34A)),
          const SizedBox(width: 12),
          _buildStatCard('Pending', stats['pending'].toString(), Icons.pending_actions, const Color(0xFFD97706)),
          const SizedBox(width: 12),
          _buildStatCard('Currently Seated', stats['seated'].toString(), Icons.event_seat, const Color(0xFF9333EA)),
          const SizedBox(width: 12),
          _buildStatCard('Expected Guests', stats['totalGuests'].toString(), Icons.people_outline, const Color(0xFF3B82F6)),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      width: 150,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade100, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.08),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Positioned(
            right: -20,
            bottom: -20,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: color.withOpacity(0.04),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(icon, color: color, size: 22),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  title.toUpperCase(),
                  style: GoogleFonts.inter(
                    color: Colors.grey.shade500, 
                    fontSize: 10, 
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: GoogleFonts.outfit(color: const Color(0xFF0F172A), fontSize: 24, fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilters() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: DropdownButtonFormField<String>(
              value: _statusFilter,
              decoration: const InputDecoration(isDense: true, border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
              items: _statuses.map((s) => DropdownMenuItem(value: s, child: Text(s, style: const TextStyle(fontSize: 13)))).toList(),
              onChanged: (v) => setState(() => _statusFilter = v!),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: DropdownButtonFormField<String>(
              value: _seatingFilter,
              decoration: const InputDecoration(isDense: true, border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
              items: _seatings.map((s) => DropdownMenuItem(value: s, child: Text(s, style: const TextStyle(fontSize: 13), overflow: TextOverflow.ellipsis))).toList(),
              onChanged: (v) => setState(() => _seatingFilter = v!),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.event_busy, size: 64, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          Text('No reservations found', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.grey.shade700, fontSize: 16)),
          Text('Try adjusting your filters or date selection.', style: GoogleFonts.inter(color: Colors.grey.shade500, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildReservationCard(ReservationModel r, ReservationProvider provider) {
    Color statusColor;
    switch (r.status) {
      case 'confirmed': statusColor = Colors.green; break;
      case 'pending': statusColor = Colors.orange; break;
      case 'seated': statusColor = Colors.blue; break;
      case 'cancelled': statusColor = Colors.red; break;
      case 'completed': statusColor = Colors.teal; break;
      default: statusColor = Colors.grey;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 1,
      shadowColor: Colors.black12,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.access_time, size: 16, color: Colors.grey),
                    const SizedBox(width: 6),
                    Text(r.time, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16)),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
                  child: Text(r.status.toUpperCase(), style: GoogleFonts.inter(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const Divider(height: 24),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  backgroundColor: Colors.grey.shade200,
                  child: Text(r.customerName[0].toUpperCase(), style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(r.customerName, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15)),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.phone, size: 12, color: Colors.grey),
                          const SizedBox(width: 4),
                          Text(r.customerPhone, style: GoogleFonts.inter(color: Colors.grey.shade700, fontSize: 13)),
                        ],
                      ),
                      if (r.occasion != null && r.occasion!.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text('Occasion: ${r.occasion}', style: GoogleFonts.inter(color: Colors.purple, fontSize: 12, fontWeight: FontWeight.w500)),
                        ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.people, size: 14, color: Colors.grey),
                        const SizedBox(width: 4),
                        Text('${r.partySize} Guests', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(r.location, style: GoogleFonts.inter(color: Colors.grey.shade600, fontSize: 12)),
                  ],
                )
              ],
            ),
            if (r.specialRequests != null && r.specialRequests!.isNotEmpty)
              Container(
                margin: const EdgeInsets.only(top: 12),
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.amber.shade50, borderRadius: BorderRadius.circular(6)),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.info_outline, size: 14, color: Colors.orange),
                    const SizedBox(width: 6),
                    Expanded(child: Text(r.specialRequests!, style: GoogleFonts.inter(fontSize: 12, color: Colors.orange.shade900))),
                  ],
                ),
              ),
            
            // Actions
            if (r.status == 'pending' || r.status == 'confirmed')
              Padding(
                padding: const EdgeInsets.only(top: 16),
                child: Row(
                  children: [
                    if (r.status == 'pending')
                      Expanded(
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(foregroundColor: Colors.green, side: const BorderSide(color: Colors.green)),
                          onPressed: () => provider.updateReservationStatus(r.id, 'confirmed'),
                          child: const Text('Confirm'),
                        ),
                      ),
                    if (r.status == 'pending') const SizedBox(width: 8),
                    if (r.status == 'confirmed')
                      Expanded(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
                          onPressed: () => provider.updateReservationStatus(r.id, 'seated'),
                          child: const Text('Mark Seated', style: TextStyle(color: Colors.white)),
                        ),
                      ),
                    if (r.status == 'confirmed') const SizedBox(width: 8),
                    if (r.status == 'pending' || r.status == 'confirmed')
                      Expanded(
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(foregroundColor: Colors.red, side: const BorderSide(color: Colors.red)),
                          onPressed: () => provider.updateReservationStatus(r.id, 'cancelled'),
                          child: const Text('Cancel'),
                        ),
                      ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomNav(BuildContext context) {
    return const SharedBottomNav(currentIndex: 3);
  }
}
