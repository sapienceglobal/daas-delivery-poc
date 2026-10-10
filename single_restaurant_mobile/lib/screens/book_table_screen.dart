import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/services/reservation_service.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/screens/login_screen.dart';
import 'package:intl/intl.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';
import 'package:single_restaurant_mobile/widgets/book_table/book_table_hero.dart';
import 'package:single_restaurant_mobile/widgets/book_table/book_table_form.dart';
import 'package:single_restaurant_mobile/widgets/book_table/book_table_selector.dart';
import 'package:single_restaurant_mobile/widgets/book_table/book_table_info_chips.dart';
import 'package:single_restaurant_mobile/widgets/book_table/book_table_bottom_bar.dart';

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

  final List<String> _areas = [
    'Indoor',
    'Main Dining Area',
    'Private Room',
    'Outdoor Seating',
    'Any',
  ];

  @override
  void initState() {
    super.initState();
    _selectedDate = DateTime.now().add(const Duration(days: 1));
    _selectedTime = const TimeOfDay(hour: 19, minute: 0);

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
    final restaurantId =
        restaurantProvider.restaurant?['_id'] ?? restaurantProvider.restaurant?['id'];
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
    final restaurantId =
        restaurantProvider.restaurant?['_id'] ?? restaurantProvider.restaurant?['id'];
    if (restaurantId == null) return;

    if (_selectedDate == null || _selectedTime == null) {
      ToastUtils.showError(context, 'Please select date and time');
      return;
    }

    setState(() => _isSubmitting = true);

    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate!);
    final timeStr =
        '${_selectedTime!.hour.toString().padLeft(2, '0')}:${_selectedTime!.minute.toString().padLeft(2, '0')}';

    final data = {
      'restaurantId': restaurantId,
      'date': dateStr,
      'time': timeStr,
      'partySize': _guests,
      'location': _selectedArea,
      'specialRequests': _specialRequestController.text,
      'tableId': _selectedTableId,
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

  Widget _buildSectionHeader(IconData icon, String title) {
    return Row(
      children: [
        Icon(icon, color: Colors.red.shade900, size: 22),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
        ),
      ],
    );
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
              child: ResponsiveCenter(
                maxWidth: 650,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const BookTableHero(),
                    Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildSectionHeader(
                            Icons.calendar_month_outlined,
                            'Reservation Details',
                          ),
                          const SizedBox(height: 16),
                          BookTableForm(
                            selectedDate: _selectedDate,
                            selectedTime: _selectedTime,
                            guests: _guests,
                            selectedArea: _selectedArea,
                            areas: _areas,
                            specialRequestController: _specialRequestController,
                            onSelectDate: () => _selectDate(context),
                            onSelectTime: () => _selectTime(context),
                            onGuestsChanged: (val) => setState(() => _guests = val),
                            onAreaChanged: (val) => setState(() => _selectedArea = val),
                          ),
                          const SizedBox(height: 32),
                          if (_isLoadingTables)
                            const Center(child: CircularProgressIndicator())
                          else if (_tables.isNotEmpty) ...[
                            _buildSectionHeader(
                              Icons.chair_alt_outlined,
                              'Choose Your Preferred Table',
                            ),
                            const SizedBox(height: 16),
                            BookTableSelector(
                              tables: _tables,
                              selectedTableId: _selectedTableId,
                              onTableSelected: (id) =>
                                  setState(() => _selectedTableId = id),
                            ),
                            const SizedBox(height: 32),
                          ],
                          const BookTableInfoChips(),
                          const SizedBox(height: 40),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: BookTableBottomBar(
        isSubmitting: _isSubmitting,
        onSubmit: _submitReservation,
      ),
    );
  }
}