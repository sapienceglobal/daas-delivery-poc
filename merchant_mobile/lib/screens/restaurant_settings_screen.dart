import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:toastification/toastification.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../providers/restaurant_provider.dart';
import '../widgets/app_drawer.dart';
import '../widgets/shared_bottom_nav.dart';

class RestaurantSettingsScreen extends StatefulWidget {
  const RestaurantSettingsScreen({Key? key}) : super(key: key);

  @override
  State<RestaurantSettingsScreen> createState() => _RestaurantSettingsScreenState();
}

class _RestaurantSettingsScreenState extends State<RestaurantSettingsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  // Controllers & State
  final _nameController = TextEditingController();
  final _cuisineController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _websiteController = TextEditingController();
  
  String _currency = 'USD (\$) - US Dollar';
  String _timezone = '(UTC-05:00) Eastern Time (ET)';
  String _dateFormat = 'MM/DD/YYYY';
  String _timeFormat = '12 Hour (AM/PM)';
  bool _enableTips = false;
  
  String _logo = '';
  
  bool _acceptsOnlineOrders = false;
  bool _autoAcceptOrders = false;
  bool _autoRefundEnabled = false;
  int _preparationTime = 20;
  double _minimumOrder = 15.0;
  
  bool _whatsappEnabled = true;
  final _whatsappNumberController = TextEditingController();
  
  String _taxType = 'Sales Tax';
  double _taxRate = 8.875;
  double _serviceCharge = 5.0;
  double _packagingCharge = 0.50;
  bool _roundOff = false;
  
  Map<String, dynamic> _operatingHours = {};

  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }
  
  Future<void> _loadData() async {
    final provider = context.read<RestaurantProvider>();
    if (provider.restaurant == null) {
      await provider.fetchMyRestaurant();
    }
    _populateFields();
  }

  void _populateFields() {
    final provider = context.read<RestaurantProvider>();
    final restaurant = provider.restaurant;
    if (restaurant == null) return;
    
    setState(() {
      _nameController.text = restaurant['name'] ?? '';
      _cuisineController.text = restaurant['cuisine'] ?? '';
      _emailController.text = restaurant['email'] ?? '';
      _phoneController.text = restaurant['phone'] ?? '';
      _addressController.text = restaurant['address'] ?? '';
      _websiteController.text = restaurant['website'] ?? '';
      
      _currency = restaurant['currency'] ?? 'USD (\$) - US Dollar';
      _timezone = restaurant['timezone'] ?? '(UTC-05:00) Eastern Time (ET)';
      _dateFormat = restaurant['dateFormat'] ?? 'MM/DD/YYYY';
      _timeFormat = restaurant['timeFormat'] ?? '12 Hour (AM/PM)';
      _enableTips = restaurant['enableTips'] ?? false;
      
      _logo = restaurant['logo'] ?? '';
      
      _acceptsOnlineOrders = restaurant['acceptsOnlineOrders'] ?? true;
      _autoAcceptOrders = restaurant['autoAcceptOrders'] ?? false;
      _autoRefundEnabled = restaurant['autoRefundEnabled'] ?? true;
      _preparationTime = restaurant['preparationTime'] ?? 20;
      _minimumOrder = (restaurant['minimumOrder'] ?? 15.0).toDouble();
      
      _taxType = restaurant['taxType'] ?? 'Sales Tax';
      _taxRate = (restaurant['taxRate'] ?? 8.875).toDouble();
      _serviceCharge = (restaurant['serviceCharge'] ?? 5.0).toDouble();
      _packagingCharge = (restaurant['packagingCharge'] ?? 0.50).toDouble();
      _roundOff = restaurant['roundOff'] ?? false;
      
      if (restaurant['notificationSettings'] != null) {
        _whatsappEnabled = restaurant['notificationSettings']['whatsappEnabled'] ?? true;
        _whatsappNumberController.text = restaurant['notificationSettings']['whatsappNumber'] ?? '';
      }
      
      _operatingHours = restaurant['operatingHours'] != null 
          ? Map<String, dynamic>.from(restaurant['operatingHours']) 
          : {
              'monday': {'open': '09:00', 'close': '22:00', 'isClosed': false},
              'tuesday': {'open': '09:00', 'close': '22:00', 'isClosed': false},
              'wednesday': {'open': '09:00', 'close': '22:00', 'isClosed': false},
              'thursday': {'open': '09:00', 'close': '22:00', 'isClosed': false},
              'friday': {'open': '09:00', 'close': '23:00', 'isClosed': false},
              'saturday': {'open': '09:00', 'close': '23:00', 'isClosed': false},
              'sunday': {'open': '09:00', 'close': '22:00', 'isClosed': false},
            };
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _nameController.dispose();
    _cuisineController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _websiteController.dispose();
    _whatsappNumberController.dispose();
    super.dispose();
  }
  
  Future<void> _saveSettings() async {
    setState(() => _isSaving = true);
    final provider = context.read<RestaurantProvider>();
    final restaurant = provider.restaurant;
    if (restaurant == null) return;
    
    final payload = {
      'name': _nameController.text,
      'cuisine': _cuisineController.text,
      'email': _emailController.text,
      'phone': _phoneController.text,
      'address': _addressController.text,
      'website': _websiteController.text,
      'currency': _currency,
      'timezone': _timezone,
      'dateFormat': _dateFormat,
      'timeFormat': _timeFormat,
      'enableTips': _enableTips,
      'acceptsOnlineOrders': _acceptsOnlineOrders,
      'autoAcceptOrders': _autoAcceptOrders,
      'autoRefundEnabled': _autoRefundEnabled,
      'preparationTime': _preparationTime,
      'minimumOrder': _minimumOrder,
      'taxType': _taxType,
      'taxRate': _taxRate,
      'serviceCharge': _serviceCharge,
      'packagingCharge': _packagingCharge,
      'roundOff': _roundOff,
      'notificationSettings': {
        'whatsappEnabled': _whatsappEnabled,
        'whatsappNumber': _whatsappNumberController.text,
      },
    };
    
    bool success = await provider.updateRestaurant(restaurant['_id'], payload);
    
    if (success) {
      final globalOpen = _operatingHours['monday']?['open'] ?? '11:30';
      final globalClose = _operatingHours['monday']?['close'] ?? '22:00';
      final Map<String, dynamic> normalizedHours = {};
      final days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (var day in days) {
        final current = Map<String, dynamic>.from(_operatingHours[day] ?? {});
        normalizedHours[day] = {
          ...current,
          'open': globalOpen,
          'close': globalClose,
          'isClosed': current['isClosed'] == true,
        };
      }
      
      bool hoursSuccess = await provider.updateHours(restaurant['_id'], {'operatingHours': normalizedHours});
      if (hoursSuccess && mounted) {
        toastification.show(
          context: context,
          type: ToastificationType.success,
          title: const Text('Settings saved successfully'),
          autoCloseDuration: const Duration(seconds: 3),
        );
      } else if (mounted) {
        toastification.show(
          context: context,
          type: ToastificationType.error,
          title: Text(provider.error),
          autoCloseDuration: const Duration(seconds: 3),
        );
      }
    } else if (mounted) {
      toastification.show(
        context: context,
        type: ToastificationType.error,
        title: Text(provider.error),
        autoCloseDuration: const Duration(seconds: 3),
      );
    }
    
    if (mounted) setState(() => _isSaving = false);
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<RestaurantProvider>();
    
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: Text(
          'Restaurant Settings',
          style: GoogleFonts.outfit(color: const Color(0xFF111827), fontSize: 20, fontWeight: FontWeight.w600),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Color(0xFF111827)),
        actions: [
          if (_isSaving)
            const Padding(
              padding: EdgeInsets.only(right: 16.0),
              child: Center(child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF8B0000)))),
            )
          else
            TextButton(
              onPressed: _saveSettings,
              child: Text('Save', style: GoogleFonts.inter(color: const Color(0xFF8B0000), fontWeight: FontWeight.bold, fontSize: 16)),
            ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: const Color(0xFF8B0000),
          unselectedLabelColor: const Color(0xFF6B7280),
          indicatorColor: const Color(0xFF8B0000),
          labelStyle: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14),
          unselectedLabelStyle: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 14),
          tabs: const [
            Tab(text: 'General'),
            Tab(text: 'Business Info'),
            Tab(text: 'Operating Hours'),
            Tab(text: 'Order Settings'),
            Tab(text: 'Taxes & Charges'),
          ],
        ),
      ),
      drawer: const AppDrawer(),
      body: provider.isLoading && provider.restaurant == null
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF8B0000)))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildGeneralTab(),
                _buildBusinessInfoTab(),
                _buildHoursTab(),
                _buildOrderSettingsTab(),
                _buildTaxesTab(),
              ],
            ),
      bottomNavigationBar: const SharedBottomNav(currentIndex: -1),
    );
  }

  // Input Field Builder
  Widget _buildTextField(String label, TextEditingController controller, {TextInputType type = TextInputType.text}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF374151), letterSpacing: 0.5)),
          const SizedBox(height: 8),
          TextField(
            controller: controller,
            keyboardType: type,
            style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF111827)),
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFE5E7EB))),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFE5E7EB))),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF8B0000))),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildDropdown(String label, String value, List<String> items, ValueChanged<String?> onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF374151), letterSpacing: 0.5)),
          const SizedBox(height: 8),
          InkWell(
            onTap: () {
              FocusScope.of(context).unfocus();
              showModalBottomSheet<String>(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (sheetCtx) {
                  return Container(
                    constraints: BoxConstraints(
                      maxHeight: MediaQuery.of(sheetCtx).size.height * 0.65,
                    ),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                    ),
                    child: SafeArea(
                      top: false,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Center(
                            child: Container(
                              margin: const EdgeInsets.only(top: 12, bottom: 8),
                              width: 38,
                              height: 4,
                              decoration: BoxDecoration(
                                color: const Color(0xFFCBD5E1),
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.fromLTRB(20, 8, 12, 12),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFFF1F2),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: const Icon(Icons.tune_rounded, color: Color(0xFF881337), size: 18),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    label,
                                    style: GoogleFonts.poppins(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: const Color(0xFF0F172A),
                                    ),
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B)),
                                  onPressed: () => Navigator.pop(sheetCtx),
                                ),
                              ],
                            ),
                          ),
                          const Divider(height: 1, color: Color(0xFFF1F5F9)),
                          Flexible(
                            child: ListView.separated(
                              shrinkWrap: true,
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              itemCount: items.length,
                              separatorBuilder: (_, index) => const Divider(height: 1, color: Color(0xFFF8FAFC)),
                              itemBuilder: (ctx, i) {
                                final opt = items[i];
                                final isSel = opt == value;
                                return InkWell(
                                  onTap: () => Navigator.pop(sheetCtx, opt),
                                  borderRadius: BorderRadius.circular(12),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                    decoration: BoxDecoration(
                                      color: isSel ? const Color(0xFFFFF1F2) : Colors.transparent,
                                      borderRadius: BorderRadius.circular(12),
                                      border: isSel ? Border.all(color: const Color(0xFFFECDD3)) : null,
                                    ),
                                    child: Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            opt,
                                            style: GoogleFonts.inter(
                                              fontSize: 13.5,
                                              fontWeight: isSel ? FontWeight.w700 : FontWeight.w500,
                                              color: isSel ? const Color(0xFF881337) : const Color(0xFF1E293B),
                                            ),
                                          ),
                                        ),
                                        if (isSel)
                                          const Icon(Icons.check_circle_rounded, color: Color(0xFF881337), size: 18),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                          const SizedBox(height: 8),
                        ],
                      ),
                    ),
                  );
                },
              ).then((chosen) {
                if (chosen != null) onChanged(chosen);
              });
            },
            borderRadius: BorderRadius.circular(12),
            child: Container(
              height: 48,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE5E7EB), width: 1.2),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      value,
                      style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF1E293B), fontWeight: FontWeight.w500),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF64748B), size: 20),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSwitchItem(String title, String subtitle, bool value, ValueChanged<bool> onChanged) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16.0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF111827))),
                const SizedBox(height: 4),
                Text(subtitle, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF6B7280))),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: const Color(0xFF8B0000),
          ),
        ],
      ),
    );
  }

  Widget _buildGeneralTab() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
      children: [
        _buildTextField('RESTAURANT NAME', _nameController),
        _buildTextField('RESTAURANT TYPE', _cuisineController),
        _buildDropdown(
          'DEFAULT CURRENCY',
          _currency,
          ['USD (\$) - US Dollar', 'EUR (€) - Euro', 'INR (₹) - Indian Rupee'],
          (val) => setState(() => _currency = val!),
        ),
        _buildDropdown(
          'TIMEZONE',
          _timezone,
          ['(UTC-05:00) Eastern Time (ET)', '(UTC-08:00) Pacific Time (PT)', '(UTC+05:30) Indian Standard Time (IST)'],
          (val) => setState(() => _timezone = val!),
        ),
        _buildDropdown(
          'DATE FORMAT',
          _dateFormat,
          ['MM/DD/YYYY', 'DD/MM/YYYY'],
          (val) => setState(() => _dateFormat = val!),
        ),
        _buildDropdown(
          'TIME FORMAT',
          _timeFormat,
          ['12 Hour (AM/PM)', '24 Hour (HH:mm)'],
          (val) => setState(() => _timeFormat = val!),
        ),
        _buildSwitchItem('Enable Tips', 'Allow customers to add tips on orders', _enableTips, (val) => setState(() => _enableTips = val)),
      ],
    );
  }

  Widget _buildBusinessInfoTab() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('RESTAURANT LOGO', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF374151), letterSpacing: 0.5)),
              const SizedBox(height: 8),
              Row(
                children: [
                  Container(
                    width: 100,
                    height: 80,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE5E7EB), style: BorderStyle.solid),
                    ),
                    clipBehavior: Clip.antiAlias,
                    alignment: Alignment.center,
                    child: _logo.isNotEmpty 
                      ? CachedNetworkImage(
                          imageUrl: _logo,
                          fit: BoxFit.contain,
                          placeholder: (context, url) => Shimmer.fromColors(
                            baseColor: const Color(0xFFE2E8F0),
                            highlightColor: const Color(0xFFF8FAFC),
                            child: Container(
                              width: 100,
                              height: 80,
                              color: Colors.white,
                              child: const Center(
                                child: Icon(Icons.image_outlined, color: Color(0xFFCBD5E1), size: 28),
                              ),
                            ),
                          ),
                          errorWidget: (context, url, error) => const Center(
                            child: Icon(Icons.broken_image_outlined, color: Colors.grey, size: 28),
                          ),
                        )
                      : Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.add_photo_alternate_outlined, color: Color(0xFF9CA3AF), size: 24),
                              const SizedBox(height: 2),
                              Text('No Logo', style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF9CA3AF), fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        OutlinedButton(
                          onPressed: () {
                            toastification.show(
                              context: context,
                              type: ToastificationType.info,
                              title: const Text('Please use the website to upload images'),
                              autoCloseDuration: const Duration(seconds: 3),
                            );
                          },
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFFD1D5DB)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          child: Text('Change Logo', style: GoogleFonts.inter(color: const Color(0xFF374151), fontWeight: FontWeight.bold)),
                        ),
                        const SizedBox(height: 4),
                        Text('PNG, JPG or SVG. Max size 2MB', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF6B7280))),
                      ],
                    ),
                  )
                ],
              )
            ],
          ),
        ),
        _buildTextField('EMAIL', _emailController, type: TextInputType.emailAddress),
        _buildTextField('PHONE', _phoneController, type: TextInputType.phone),
        _buildTextField('ADDRESS', _addressController),
        _buildTextField('WEBSITE', _websiteController, type: TextInputType.url),
      ],
    );
  }

  void _handleGlobalHourChange(String field, String value) {
    setState(() {
      final days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (var day in days) {
        final dayData = Map<String, dynamic>.from(_operatingHours[day] ?? {});
        dayData[field] = value;
        _operatingHours[day] = dayData;
      }
    });
  }

  void _handleDayClosedChange(String day, bool isClosed) {
    setState(() {
      final dayData = Map<String, dynamic>.from(_operatingHours[day] ?? {});
      dayData['isClosed'] = isClosed;
      _operatingHours[day] = dayData;
    });
  }

  Widget _buildHoursTab() {
    final days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    final globalOpen = _operatingHours['monday']?['open'] ?? '11:30';
    final globalClose = _operatingHours['monday']?['close'] ?? '22:00';
    
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
      children: [
        // 1. Standard Operating Hours Card (Global Fixed Time)
        Container(
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.only(bottom: 20),
          decoration: BoxDecoration(
            color: const Color(0xFFF9FAFB),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE5E7EB)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF1F2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.access_time_rounded, size: 18, color: Color(0xFF8B0000)),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Standard Operating Hours',
                          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF111827)),
                        ),
                        Text(
                          'These hours will apply to all open days.',
                          style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF6B7280)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('OPEN', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF6B7280))),
                        const SizedBox(height: 6),
                        _buildTimeInput('Open', globalOpen, (val) => _handleGlobalHourChange('open', val)),
                      ],
                    ),
                  ),
                  const Padding(
                    padding: EdgeInsets.fromLTRB(10, 20, 10, 0),
                    child: Text('TO', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF9CA3AF), fontSize: 13)),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('CLOSE', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF6B7280))),
                        const SizedBox(height: 6),
                        _buildTimeInput('Close', globalClose, (val) => _handleGlobalHourChange('close', val)),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        // 2. Operating Days Header
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 12),
          child: Text(
            'Operating Days',
            style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF111827)),
          ),
        ),

        // 3. Operating Days List with Open/Closed status & Toggle only
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE5E7EB)),
          ),
          child: ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: days.length,
            separatorBuilder: (ctx, idx) => const Divider(height: 1, color: Color(0xFFF3F4F6)),
            itemBuilder: (context, index) {
              final day = days[index];
              final dayData = _operatingHours[day] ?? {'open': globalOpen, 'close': globalClose, 'isClosed': false};
              final isClosed = dayData['isClosed'] == true;
              final capitalizedDay = day[0].toUpperCase() + day.substring(1);

              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                color: isClosed ? const Color(0xFFF9FAFB) : Colors.white,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      capitalizedDay,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: isClosed ? const Color(0xFF9CA3AF) : const Color(0xFF111827),
                      ),
                    ),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: isClosed ? const Color(0xFFF3F4F6) : const Color(0xFFECFDF5),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            isClosed ? 'Closed' : 'Open',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: isClosed ? const Color(0xFF9CA3AF) : const Color(0xFF059669),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Switch(
                          value: !isClosed,
                          activeThumbColor: const Color(0xFF059669),
                          activeTrackColor: const Color(0xFFA7F3D0),
                          inactiveThumbColor: const Color(0xFF9CA3AF),
                          inactiveTrackColor: const Color(0xFFE5E7EB),
                          onChanged: (val) {
                            _handleDayClosedChange(day, !val);
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
  
  Widget _buildTimeInput(String label, String value, ValueChanged<String> onChanged) {
    return GestureDetector(
      onTap: () async {
        final parts = value.split(':');
        int h = 11, m = 30;
        if (parts.length == 2) {
          h = int.tryParse(parts[0]) ?? 11;
          m = int.tryParse(parts[1]) ?? 30;
        }
        final TimeOfDay? time = await showTimePicker(
          context: context,
          initialTime: TimeOfDay(hour: h, minute: m),
          builder: (context, child) {
            return Theme(
              data: ThemeData.light().copyWith(
                colorScheme: const ColorScheme.light(primary: Color(0xFF8B0000)),
              ),
              child: child!,
            );
          },
        );
        if (time != null) {
          final hh = time.hour.toString().padLeft(2, '0');
          final mm = time.minute.toString().padLeft(2, '0');
          onChanged('$hh:$mm');
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
        decoration: BoxDecoration(
          border: Border.all(color: const Color(0xFFD1D5DB)),
          borderRadius: BorderRadius.circular(8),
          color: Colors.white,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.access_time, size: 16, color: Color(0xFF6B7280)),
            const SizedBox(width: 8),
            Text(value, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF111827))),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderSettingsTab() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
      children: [
        _buildSwitchItem('Accept Online Orders', 'Allow customers to place orders online', _acceptsOnlineOrders, (val) => setState(() => _acceptsOnlineOrders = val)),
        _buildSwitchItem('Auto Accept Orders', 'Automatically accept incoming orders', _autoAcceptOrders, (val) => setState(() => _autoAcceptOrders = val)),
        _buildSwitchItem('Auto Refund on Cancellation', 'Automatically refund customer when order is cancelled or failed', _autoRefundEnabled, (val) => setState(() => _autoRefundEnabled = val)),
        
        Container(
          margin: const EdgeInsets.only(bottom: 16.0),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE5E7EB)),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Order Preparation Time', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF111827))),
                    const SizedBox(height: 4),
                    Text('Estimated time to prepare an order', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF6B7280))),
                  ],
                ),
              ),
              Container(
                width: 80,
                child: TextField(
                  keyboardType: TextInputType.number,
                  controller: TextEditingController(text: _preparationTime.toString())..selection = TextSelection.collapsed(offset: _preparationTime.toString().length),
                  onChanged: (val) => _preparationTime = int.tryParse(val) ?? 20,
                  textAlign: TextAlign.center,
                  decoration: InputDecoration(
                    suffixText: 'min',
                    contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
            ],
          ),
        ),
        
        Container(
          margin: const EdgeInsets.only(bottom: 24.0),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE5E7EB)),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Minimum Order Amount', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF111827))),
                    const SizedBox(height: 4),
                    Text('Minimum order amount for online orders', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF6B7280))),
                  ],
                ),
              ),
              Container(
                width: 100,
                child: TextField(
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  controller: TextEditingController(text: _minimumOrder.toString())..selection = TextSelection.collapsed(offset: _minimumOrder.toString().length),
                  onChanged: (val) => _minimumOrder = double.tryParse(val) ?? 15.0,
                  decoration: InputDecoration(
                    prefixText: '\$ ',
                    contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
            ],
          ),
        ),
        
        Text('NOTIFICATION PREFERENCES', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF374151), letterSpacing: 0.5)),
        const SizedBox(height: 12),
        
        _buildSwitchItem('WhatsApp Order Alerts', 'Receive new order notifications via WhatsApp', _whatsappEnabled, (val) => setState(() => _whatsappEnabled = val)),
        
        if (_whatsappEnabled)
          _buildTextField('WHATSAPP NUMBER', _whatsappNumberController, type: TextInputType.phone),
      ],
    );
  }

  Widget _buildTaxesTab() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
      children: [
        _buildDropdown(
          'TAX TYPE',
          _taxType,
          ['Sales Tax', 'VAT', 'GST'],
          (val) => setState(() => _taxType = val!),
        ),
        
        _buildNumberItem('Tax Rate (%)', '', _taxRate, (val) => _taxRate = val, suffix: '%'),
        _buildNumberItem('Service Charge (%)', 'Applied on order subtotal', _serviceCharge, (val) => _serviceCharge = val, suffix: '%'),
        _buildNumberItem('Packaging Charge', 'Per order flat fee', _packagingCharge, (val) => _packagingCharge = val, prefix: '\$'),
        
        _buildSwitchItem('Round Off', 'Round off total amount', _roundOff, (val) => setState(() => _roundOff = val)),
      ],
    );
  }
  
  Widget _buildNumberItem(String title, String subtitle, double value, ValueChanged<double> onChanged, {String? prefix, String? suffix}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16.0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF111827))),
                if (subtitle.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(subtitle, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF6B7280))),
                ]
              ],
            ),
          ),
          Container(
            width: 100,
            child: TextField(
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              controller: TextEditingController(text: value.toString())..selection = TextSelection.collapsed(offset: value.toString().length),
              onChanged: (val) => onChanged(double.tryParse(val) ?? 0.0),
              textAlign: suffix != null ? TextAlign.right : TextAlign.left,
              decoration: InputDecoration(
                prefixText: prefix,
                suffixText: suffix,
                contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
