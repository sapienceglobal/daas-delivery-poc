import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:country_picker/country_picker.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/services/reservation_service.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';
import 'package:single_restaurant_mobile/widgets/book_table/book_table_hero.dart';
import 'package:single_restaurant_mobile/widgets/book_table/book_table_form.dart';
import 'package:single_restaurant_mobile/widgets/book_table/book_table_contact_details.dart';
import 'package:single_restaurant_mobile/widgets/book_table/book_table_info_chips.dart';
import 'package:single_restaurant_mobile/widgets/book_table/book_table_bottom_bar.dart';
import 'package:single_restaurant_mobile/widgets/book_table/time_slot_picker_sheet.dart';
import 'package:single_restaurant_mobile/utils/restaurant_schedule_utils.dart';

class BookTableScreen extends StatefulWidget {
  const BookTableScreen({super.key});

  @override
  State<BookTableScreen> createState() => _BookTableScreenState();
}

class _BookTableScreenState extends State<BookTableScreen> {
  final ReservationService _reservationService = ReservationService();
  final GlobalKey<FormState> _contactFormKey = GlobalKey<FormState>();

  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;
  int _guests = 4;
  final TextEditingController _specialRequestController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();

  String _selectedCountryCode = '+1';
  String _selectedCountryFlag = '🇺🇸';
  int _phoneMaxLength = 10;
  bool _isSubmitting = false;
  bool _isCustomContact = false;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _selectedDate = now.add(const Duration(days: 1));
    _selectedTime = const TimeOfDay(hour: 19, minute: 0);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _populateFromProfile();
      final restProv = Provider.of<RestaurantProvider>(context, listen: false);
      if (restProv.restaurant == null) {
        restProv.fetchRestaurantData().then((_) {
          if (mounted) _initializeValidDateTime();
        });
      } else {
        _initializeValidDateTime();
      }
    });
  }

  void _initializeValidDateTime() {
    final restProv = Provider.of<RestaurantProvider>(context, listen: false);
    final restaurant = restProv.restaurant;
    final nowNy = RestaurantScheduleUtils.getNowInRestaurantTimezone(restaurant);
    final todayNy = DateTime(nowNy.year, nowNy.month, nowNy.day);

    // Check if today in New York has available future slots
    final todaySchedule = RestaurantScheduleUtils.getScheduleForDate(restaurant, todayNy);
    final todaySlot = RestaurantScheduleUtils.getEarliestAvailableSlot(todayNy, restaurant);

    if (!todaySchedule.isClosed && todaySlot != null) {
      setState(() {
        _selectedDate = todayNy;
        _selectedTime = todaySlot;
      });
    } else {
      // Find the first open day from tomorrow onwards
      DateTime candidate = todayNy.add(const Duration(days: 1));
      for (int i = 0; i < 7; i++) {
        final candSchedule = RestaurantScheduleUtils.getScheduleForDate(restaurant, candidate);
        if (!candSchedule.isClosed) {
          final candSlot = RestaurantScheduleUtils.getEarliestAvailableSlot(candidate, restaurant);
          const TimeOfDay preferredTime = TimeOfDay(hour: 19, minute: 0);
          final preferredErr = RestaurantScheduleUtils.validateReservation(candidate, preferredTime, restaurant);

          setState(() {
            _selectedDate = candidate;
            _selectedTime = preferredErr == null ? preferredTime : (candSlot ?? candSchedule.openTime);
          });
          break;
        }
        candidate = candidate.add(const Duration(days: 1));
      }
    }
  }

  void _populateFromProfile() {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (auth.isAuthenticated && auth.user != null) {
      _nameController.text = auth.user!.name;
      final raw = auth.user!.phone.trim();
      if (raw.startsWith('+1')) {
        _selectedCountryCode = '+1';
        _selectedCountryFlag = '🇺🇸';
        _phoneController.text = raw.substring(2).trim();
      } else if (raw.startsWith('+91')) {
        _selectedCountryCode = '+91';
        _selectedCountryFlag = '🇮🇳';
        _phoneController.text = raw.substring(3).trim();
      } else if (raw.isNotEmpty) {
        _phoneController.text = raw;
      }
      _emailController.text = auth.user!.email;
    }
  }

  void _toggleCustomContact() {
    setState(() {
      _isCustomContact = !_isCustomContact;
      if (!_isCustomContact) _populateFromProfile();
    });
  }

  @override
  void dispose() {
    _specialRequestController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  void _openCountryPicker() {
    showCountryPicker(
      context: context,
      showPhoneCode: true,
      countryListTheme: CountryListThemeData(
        bottomSheetHeight: MediaQuery.of(context).size.height * 0.7,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        inputDecoration: const InputDecoration(
          labelText: 'Search Country',
          hintText: 'Start typing to search',
          prefixIcon: Icon(Icons.search),
        ),
      ),
      onSelect: (Country c) {
        setState(() {
          _selectedCountryCode = '+${c.phoneCode}';
          _selectedCountryFlag = c.flagEmoji;
          _phoneMaxLength = c.example.isNotEmpty ? c.example.length : 15;
        });
      },
    );
  }

  String _getRestaurantPhone(Map<String, dynamic>? restaurant) {
    if (restaurant == null) return '';

    final phone = restaurant['phone']?.toString().trim() ?? '';
    if (phone.isNotEmpty) return phone;

    final bInfo = restaurant['businessInfo'];
    if (bInfo is Map) {
      final bPhone = bInfo['phone']?.toString().trim() ?? '';
      if (bPhone.isNotEmpty) return bPhone;

      final bBizPhone = bInfo['businessPhone']?.toString().trim() ?? '';
      if (bBizPhone.isNotEmpty) return bBizPhone;

      final bOwnerPhone = bInfo['ownerPhone']?.toString().trim() ?? '';
      if (bOwnerPhone.isNotEmpty) return bOwnerPhone;

      final bMobile = bInfo['mobile']?.toString().trim() ?? '';
      if (bMobile.isNotEmpty) return bMobile;
    }

    final contactPhone = restaurant['contactPhone']?.toString().trim() ?? '';
    if (contactPhone.isNotEmpty) return contactPhone;

    final ownerPhone = restaurant['ownerPhone']?.toString().trim() ?? '';
    if (ownerPhone.isNotEmpty) return ownerPhone;

    return '';
  }

  String _formatDisplayPhone(String raw) {
    if (raw.isEmpty) return '+1 (347) 233-3733';
    if (raw.contains('(') || raw.contains('-') || raw.contains(' ')) {
      return raw;
    }
    final digits = raw.replaceAll(RegExp(r'\D'), '');
    if (digits.length == 10) {
      return '+1 (${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}';
    } else if (digits.length == 11 && digits.startsWith('1')) {
      return '+1 (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7)}';
    }
    return raw;
  }

  Future<void> _callRestaurant(String rawPhone) async {
    final phoneToDial = rawPhone.trim().isNotEmpty ? rawPhone.trim() : '+1 (347) 233-3733';
    // Clean to valid digits with optional leading plus
    final clean = phoneToDial.replaceAll(RegExp(r'[^\d+]'), '');
    final dialNumber = clean.isNotEmpty ? clean : '+13472333733';

    final phoneUri = Uri.parse('tel:$dialNumber');
    bool launched = false;
    try {
      launched = await launchUrl(phoneUri, mode: LaunchMode.externalApplication);
      if (!launched) {
        launched = await launchUrl(phoneUri);
      }
    } catch (_) {
      try {
        launched = await launchUrl(phoneUri);
      } catch (_) {
        launched = false;
      }
    }

    if (!launched && mounted) {
      // In case device or emulator has no dialer app installed or queries are blocked before rebuild
      try {
        await Clipboard.setData(ClipboardData(text: dialNumber));
        if (mounted) {
          ToastUtils.showInfo(context, 'Number copied to clipboard: $dialNumber');
        }
      } catch (_) {
        if (mounted) {
          ToastUtils.showError(context, 'Could not open phone dialer');
        }
      }
    }
  }

  Future<void> _selectDate() async {
    final restaurantProvider = Provider.of<RestaurantProvider>(context, listen: false);
    final restaurant = restaurantProvider.restaurant;
    final nowNy = RestaurantScheduleUtils.getNowInRestaurantTimezone(restaurant);
    final firstDate = DateTime(nowNy.year, nowNy.month, nowNy.day);
    final initialDate = (_selectedDate != null && !_selectedDate!.isBefore(firstDate))
        ? _selectedDate!
        : firstDate;

    final picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: firstDate, // Strictly today or future dates in New York Time!
      lastDate: firstDate.add(const Duration(days: 90)),
      builder: (ctx, child) {
        return Theme(
          data: Theme.of(ctx).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF7A0B10),
              onPrimary: Colors.white,
              onSurface: Color(0xFF0F172A),
            ),
          ),
          child: child!,
        );
      },
    );

    if (!mounted || picked == null) return;
    final schedule = RestaurantScheduleUtils.getScheduleForDate(restaurant, picked);

    if (schedule.isClosed) {
      if (mounted) {
        ToastUtils.showError(
          context,
          'Lassi Lounge is closed on ${DateFormat('EEEE, MMM d').format(picked)}. Please pick another date.',
        );
      }
    } else if (RestaurantScheduleUtils.isToday(picked, restaurant)) {
      final currentMins = nowNy.hour * 60 + nowNy.minute;
      if (currentMins >= schedule.lastBookingMinutes) {
        if (mounted) {
          ToastUtils.showInfo(
            context,
            'All booking slots for today have ended (last booking slot was ${schedule.lastBookingStr} ${nowNy.timeZoneName}). Please pick tomorrow or a future date.',
          );
        }
      }
    }

    setState(() {
      _selectedDate = picked;
      // Check if currently selected time is valid for the newly chosen date
      final timeError = RestaurantScheduleUtils.validateReservation(
        picked,
        _selectedTime,
        restaurant,
      );
      if (timeError != null) {
        final earliest = RestaurantScheduleUtils.getEarliestAvailableSlot(picked, restaurant);
        if (earliest != null) {
          _selectedTime = earliest;
        }
      }
    });
  }

  void _selectTime() {
    final restaurantProvider = Provider.of<RestaurantProvider>(context, listen: false);
    final restaurant = restaurantProvider.restaurant;
    final date = _selectedDate ?? RestaurantScheduleUtils.getTodayInRestaurantTimezone(restaurant);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => TimeSlotPickerSheet(
        selectedDate: date,
        selectedTime: _selectedTime,
        restaurant: restaurant,
        onTimeSelected: (TimeOfDay picked) {
          setState(() => _selectedTime = picked);
        },
        onChangeDate: () {
          Navigator.pop(ctx);
          _selectDate();
        },
      ),
    );
  }

  Future<void> _submitReservation() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final restaurantProvider = Provider.of<RestaurantProvider>(context, listen: false);

    if (_selectedDate == null || _selectedTime == null) {
      ToastUtils.showError(context, 'Please select date and time');
      return;
    }

    // Strict industry-level validation against merchant operating hours and closing buffer
    final validationError = RestaurantScheduleUtils.validateReservation(
      _selectedDate,
      _selectedTime,
      restaurantProvider.restaurant,
    );

    if (validationError != null) {
      ToastUtils.showError(context, validationError);
      return;
    }

    final isLoggedIn = authProvider.isAuthenticated && authProvider.user != null;
    final hasUserPhone = isLoggedIn && authProvider.user!.phone.trim().isNotEmpty;
    final needsValidation = !isLoggedIn || _isCustomContact || !hasUserPhone;

    if (needsValidation) {
      if (!(_contactFormKey.currentState?.validate() ?? false)) return;
    }

    setState(() => _isSubmitting = true);

    var restaurantId =
        restaurantProvider.restaurant?['_id'] ?? restaurantProvider.restaurant?['id'];
    if (restaurantId == null) {
      await restaurantProvider.fetchRestaurantData();
      restaurantId =
          restaurantProvider.restaurant?['_id'] ?? restaurantProvider.restaurant?['id'];
    }

    if (restaurantId == null) {
      setState(() => _isSubmitting = false);
      if (mounted) ToastUtils.showError(context, 'Restaurant details not loaded. Please try again.');
      return;
    }

    final String customerName;
    final String customerPhone;
    final String customerEmail;

    if (isLoggedIn && !_isCustomContact && hasUserPhone) {
      customerName = authProvider.user!.name.trim();
      customerPhone = authProvider.user!.phone.trim();
      customerEmail = authProvider.user!.email.trim();
    } else {
      customerName = _nameController.text.trim();
      final raw = _phoneController.text.trim();
      customerPhone = raw.startsWith('+') ? raw : '$_selectedCountryCode$raw';
      customerEmail = _emailController.text.trim();
    }

    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate!);
    final timeStr =
        '${_selectedTime!.hour.toString().padLeft(2, '0')}:${_selectedTime!.minute.toString().padLeft(2, '0')}';

    final data = {
      'restaurantId': restaurantId,
      'date': dateStr,
      'time': timeStr,
      'partySize': _guests,
      'location': 'Any',
      'specialRequests': _specialRequestController.text.trim(),
      'customerName': customerName,
      'customerPhone': customerPhone,
      if (customerEmail.isNotEmpty) 'customerEmail': customerEmail,
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
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final restaurantProvider = Provider.of<RestaurantProvider>(context);
    final isLoggedIn = authProvider.isAuthenticated && authProvider.user != null;

    final rawPhone = _getRestaurantPhone(restaurantProvider.restaurant);
    final displayPhone = _formatDisplayPhone(rawPhone);

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
            tooltip: 'Call $displayPhone',
            onPressed: () => _callRestaurant(rawPhone),
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
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 8),
                    const BookTableHero(),
                    Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildSectionHeader(Icons.calendar_month_outlined, 'Reservation Schedule'),
                          const SizedBox(height: 16),
                          BookTableForm(
                            selectedDate: _selectedDate,
                            selectedTime: _selectedTime,
                            guests: _guests,
                            specialRequestController: _specialRequestController,
                            onSelectDate: _selectDate,
                            onSelectTime: _selectTime,
                            onGuestsChanged: (val) => setState(() => _guests = val),
                            restaurant: restaurantProvider.restaurant,
                          ),
                          const SizedBox(height: 28),
                          _buildSectionHeader(
                            Icons.contact_phone_outlined,
                            (isLoggedIn && !_isCustomContact) ? 'Guest Information' : 'Contact Details',
                          ),
                          const SizedBox(height: 14),
                          BookTableContactDetails(
                            formKey: _contactFormKey,
                            isLoggedIn: isLoggedIn,
                            isCustomContact: _isCustomContact,
                            onToggleCustomContact: _toggleCustomContact,
                            user: authProvider.user,
                            nameController: _nameController,
                            phoneController: _phoneController,
                            emailController: _emailController,
                            selectedCountryCode: _selectedCountryCode,
                            selectedCountryFlag: _selectedCountryFlag,
                            phoneMaxLength: _phoneMaxLength,
                            onPickCountry: _openCountryPicker,
                          ),
                          const SizedBox(height: 32),
                          const BookTableInfoChips(),
                          const SizedBox(height: 30),
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
        phoneNumber: displayPhone,
        onCall: () => _callRestaurant(rawPhone),
      ),
    );
  }
}