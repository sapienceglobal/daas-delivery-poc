import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/services/reservation_service.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/screens/login_screen.dart';
import 'package:intl/intl.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';

class BookTableScreen extends StatefulWidget {
  const BookTableScreen({super.key});

  @override
  State<BookTableScreen> createState() => _BookTableScreenState();
}

class _BookTableScreenState extends State<BookTableScreen> {
  final ReservationService _reservationService = ReservationService();
  
  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;
  int _guests = 4;
  String _selectedArea = 'Indoor';
  final TextEditingController _specialRequestController = TextEditingController();
  
  List<dynamic> _tables = [];
  bool _isLoadingTables = false;
  String? _selectedTableId;
  
  bool _isSubmitting = false;

  final List<String> _areas = ['Indoor', 'Main Dining Area', 'Private Room', 'Outdoor Seating', 'Any'];

  @override
  void initState() {
    super.initState();
    _selectedDate = DateTime.now().add(const Duration(days: 1));
    _selectedTime = const TimeOfDay(hour: 19, minute: 0); // 7:00 PM
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadTables();
    });
  }

  @override
  void dispose() {
    _specialRequestController.dispose();
    super.dispose();
  }

  Future<void> _loadTables() async {
    final restaurantProvider = Provider.of<RestaurantProvider>(context, listen: false);
    final restaurantId = restaurantProvider.restaurant?['_id'] ?? restaurantProvider.restaurant?['id'];
    if (restaurantId == null) return;
    
    setState(() => _isLoadingTables = true);
    
    final tables = await _reservationService.getTables(restaurantId);
    
    setState(() {
      _tables = tables;
      _isLoadingTables = false;
    });
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              onSurface: Colors.black,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _selectedDate) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _selectTime(BuildContext context) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: _selectedTime ?? TimeOfDay.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              onSurface: Colors.black,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _selectedTime) {
      setState(() => _selectedTime = picked);
    }
  }
  
  Future<void> _submitReservation() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (!authProvider.isAuthenticated) {
      ToastUtils.showError(context, 'Please login to book a table');
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
      return;
    }
    
    final restaurantProvider = Provider.of<RestaurantProvider>(context, listen: false);
    final restaurantId = restaurantProvider.restaurant?['_id'] ?? restaurantProvider.restaurant?['id'];
    if (restaurantId == null) return;

    if (_selectedDate == null || _selectedTime == null) {
      ToastUtils.showError(context, 'Please select date and time');
      return;
    }

    setState(() => _isSubmitting = true);

    // Format date and time
    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate!);
    final timeStr = '${_selectedTime!.hour.toString().padLeft(2, '0')}:${_selectedTime!.minute.toString().padLeft(2, '0')}';

    final data = {
      'restaurantId': restaurantId,
      'date': dateStr,
      'time': timeStr,
      'partySize': _guests,
      'location': _selectedArea,
      'specialRequests': _specialRequestController.text,
      'tableId': _selectedTableId,
      // User details mapped from auth provider
      'customerName': authProvider.user?.name ?? 'Guest',
      'customerPhone': authProvider.user?.phone ?? '',
      'customerEmail': authProvider.user?.email ?? '',
    };

    final result = await _reservationService.createReservation(data);

    setState(() => _isSubmitting = false);

    if (result['success'] == true) {
      if (mounted) {
        ToastUtils.showSuccess(context, 'Reservation submitted successfully!');
        Navigator.pop(context);
      }
    } else {
      if (mounted) {
        ToastUtils.showError(context, result['message'] ?? 'Failed to create reservation');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Book A Table',
          style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.phone_in_talk_outlined, color: Colors.black87),
            onPressed: () {},
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeroSection(),
                  Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildSectionHeader(Icons.calendar_month_outlined, 'Reservation Details'),
                        const SizedBox(height: 16),
                        _buildReservationDetailsForm(),
                        const SizedBox(height: 32),
                        
                        if (_isLoadingTables)
                          const Center(child: CircularProgressIndicator())
                        else if (_tables.isNotEmpty) ...[
                          _buildSectionHeader(Icons.chair_alt_outlined, 'Choose Your Preferred Table'),
                          const SizedBox(height: 16),
                          _buildTableSelection(),
                          const SizedBox(height: 32),
                        ],
                        
                        _buildInfoChips(),
                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBottomFooter(),
    );
  }

  Widget _buildHeroSection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      height: 250,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        image: const DecorationImage(
          image: NetworkImage('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200'),
          fit: BoxFit.cover,
        ),
      ),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
            colors: [Colors.black.withOpacity(0.9), Colors.transparent],
          ),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              children: [
                Icon(Icons.restaurant, color: Colors.amber.shade600, size: 16),
                const SizedBox(width: 8),
                Text('Reserve Your Table', style: TextStyle(color: Colors.amber.shade600, fontWeight: FontWeight.bold, fontSize: 12)),
              ],
            ),
            const SizedBox(height: 12),
            const Text(
              'Good Food Deserves\nA Great Place',
              style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold, height: 1.2),
            ),
            const SizedBox(height: 8),
            const Text(
              'Book your table in advance and\nenjoy a delightful dining experience.',
              style: TextStyle(color: Colors.white70, fontSize: 12),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                _buildHeroFeature(Icons.star_outline, 'Priority\nSeating'),
                const SizedBox(width: 24),
                _buildHeroFeature(Icons.calendar_today_outlined, 'Hassle Free\nBooking'),
                const SizedBox(width: 24),
                _buildHeroFeature(Icons.room_service_outlined, 'Best Dining\nExperience'),
              ],
            )
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
        Text(text, style: const TextStyle(color: Colors.white, fontSize: 10, height: 1.2), textAlign: TextAlign.center),
      ],
    );
  }

  Widget _buildSectionHeader(IconData icon, String title) {
    return Row(
      children: [
        Icon(icon, color: Colors.red.shade900, size: 22),
        const SizedBox(width: 8),
        Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87)),
      ],
    );
  }

  Widget _buildReservationDetailsForm() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _buildDropdownField('Date', _selectedDate != null ? DateFormat('dd MMM yyyy').format(_selectedDate!) : 'Select Date', Icons.calendar_month, () => _selectDate(context))),
            const SizedBox(width: 12),
            Expanded(child: _buildDropdownField('Time', _selectedTime != null ? _selectedTime!.format(context) : 'Select Time', Icons.access_time, () => _selectTime(context))),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildDropdownField(
                'Number of Guests', 
                '$_guests Guests', 
                Icons.person_outline, 
                () {
                  showModalBottomSheet(
                    context: context,
                    builder: (c) => ListView.builder(
                      itemCount: 20,
                      itemBuilder: (c, i) => ListTile(
                        title: Text('${i + 1} Guests'),
                        onTap: () {
                          setState(() => _guests = i + 1);
                          Navigator.pop(c);
                        },
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildDropdownField(
                'Preferred Area (Optional)', 
                _selectedArea, 
                Icons.table_restaurant_outlined, 
                () {
                  showModalBottomSheet(
                    context: context,
                    builder: (c) => ListView.builder(
                      itemCount: _areas.length,
                      shrinkWrap: true,
                      itemBuilder: (c, i) => ListTile(
                        title: Text(_areas[i]),
                        onTap: () {
                          setState(() => _selectedArea = _areas[i]);
                          Navigator.pop(c);
                        },
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey.shade200),
            borderRadius: BorderRadius.circular(12),
            color: Colors.white,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: TextField(
            controller: _specialRequestController,
            maxLines: 2,
            maxLength: 150,
            decoration: const InputDecoration(
              border: InputBorder.none,
              hintText: 'Special Request (Optional)\nE.g. Birthday celebration, window seat, etc.',
              hintStyle: TextStyle(color: Colors.grey, fontSize: 13),
              counterText: '',
            ),
            style: const TextStyle(fontSize: 14),
          ),
        ),
      Align(
          alignment: Alignment.centerRight,
          child: Padding(
            padding: const EdgeInsets.only(top: 4, right: 8),
            child: Text('0/150', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
          ),
        )
      ],
    );
  }

  Widget _buildDropdownField(String label, String value, IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade200),
          borderRadius: BorderRadius.circular(12),
          color: Colors.white,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 16, color: Colors.red.shade900),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(label, style: TextStyle(color: Colors.grey.shade600, fontSize: 11)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                Icon(Icons.keyboard_arrow_down, color: Colors.grey.shade600, size: 18),
              ],
            )
          ],
        ),
      ),
    );
  }

  Widget _buildTableSelection() {
    return SizedBox(
      height: 180,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: _tables.length,
        itemBuilder: (context, index) {
          final table = _tables[index];
          final tableId = table['_id'] ?? table['id'];
          final isSelected = _selectedTableId == tableId;
          final capacity = table['capacity'] ?? 4;
          final minCapacity = capacity > 2 ? capacity - 2 : 1;
          
          return GestureDetector(
            onTap: () {
              setState(() {
                if (isSelected) {
                  _selectedTableId = null;
                } else {
                  _selectedTableId = tableId;
                }
              });
            },
            child: Container(
              width: 140,
              margin: const EdgeInsets.only(right: 16),
              decoration: BoxDecoration(
                color: isSelected ? Colors.red.shade50 : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isSelected ? Colors.red.shade900 : Colors.grey.shade200,
                  width: isSelected ? 2 : 1,
                ),
              ),
              child: Stack(
                children: [
                  if (isSelected)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          color: Colors.red.shade900,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.check, color: Colors.white, size: 12),
                      ),
                    ),
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 60,
                          height: 60,
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey.shade400, width: 1.5),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Center(
                            child: Container(
                              width: 30,
                              height: 30,
                              decoration: BoxDecoration(
                                color: Colors.red.shade900,
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: Text(table['tableNumber'] ?? '${index + 1}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text('Table ${table['tableNumber'] ?? index + 1}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        const SizedBox(height: 4),
                        Text('Best for $minCapacity - $capacity Guests', style: TextStyle(color: Colors.grey.shade600, fontSize: 10)),
                        const Spacer(),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(vertical: 6),
                          decoration: BoxDecoration(
                            color: isSelected ? Colors.red.shade900 : Colors.white,
                            border: Border.all(color: isSelected ? Colors.transparent : Colors.grey.shade300),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Center(
                            child: Text(
                              isSelected ? 'Recommended' : 'Select',
                              style: TextStyle(
                                color: isSelected ? Colors.white : Colors.black87,
                                fontSize: 11,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                              ),
                            ),
                          ),
                        )
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildInfoChips() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.amber.shade50.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.amber.shade100),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(child: _buildInfoItem(Icons.verified_user_outlined, 'No Booking Charge', 'Reserve your table\nabsolutely free')),
          Container(width: 1, height: 40, color: Colors.amber.shade200),
          Expanded(child: _buildInfoItem(Icons.access_time, '15 Min Hold Time', 'Your table will be held\nfor 15 minutes')),
          Container(width: 1, height: 40, color: Colors.amber.shade200),
          Expanded(child: _buildInfoItem(Icons.event_busy_outlined, 'Easy Cancellation', 'Cancel up to 2 hours\nbefore reservation')),
        ],
      ),
    );
  }

  Widget _buildInfoItem(IconData icon, String title, String subtitle) {
    return Column(
      children: [
        Icon(icon, color: Colors.amber.shade700, size: 20),
        const SizedBox(height: 6),
        Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10), textAlign: TextAlign.center),
        const SizedBox(height: 4),
        Text(subtitle, style: TextStyle(color: Colors.grey.shade600, fontSize: 8), textAlign: TextAlign.center),
      ],
    );
  }

  Widget _buildBottomFooter() {
    // FIX 1: Jab keyboard open ho, tab is footer ko chupaa do taaki screen upar compress na ho
    final isKeyboardOpen = MediaQuery.of(context).viewInsets.bottom > 0;
    if (isKeyboardOpen) return const SizedBox.shrink();

    // FIX 2: SafeArea ka use (isse UI automatically system nav buttons ke upar draw hota hai)
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.all(20), // Manual padding calculations removed
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              offset: const Offset(0, -4),
              blurRadius: 10,
            )
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submitReservation,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red.shade900,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: _isSubmitting 
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(Icons.calendar_month, color: Colors.white, size: 20),
                          SizedBox(width: 8),
                          Text('Confirm Reservation', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.verified_user_outlined, color: Colors.red.shade900, size: 14),
                const SizedBox(width: 6),
                Text('Your information is safe and secure with us.', style: TextStyle(color: Colors.red.shade900, fontSize: 11)),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.support_agent_outlined, color: Colors.red.shade900, size: 16),
                  const SizedBox(width: 8),
                  Text('Need help? Call us at ', style: TextStyle(color: Colors.grey.shade700, fontSize: 13)),
                  Text('+1 (929) 123-4567', style: TextStyle(color: Colors.red.shade900, fontSize: 13, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}