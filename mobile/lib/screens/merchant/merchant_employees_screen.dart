import 'dart:convert';
import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../theme.dart';
import '../../widgets/glass_container.dart';

class MerchantEmployeesScreen extends StatefulWidget {
  const MerchantEmployeesScreen({super.key});

  @override
  State<MerchantEmployeesScreen> createState() => _MerchantEmployeesScreenState();
}

class _MerchantEmployeesScreenState extends State<MerchantEmployeesScreen> with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  String? _restaurantId;
  List<dynamic> _employees = [];
  List<dynamic> _payroll = [];
  late TabController _tabController;

  // Hiring Form Controllers
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _pinController = TextEditingController();
  String _role = 'waiter';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        _fetchData();
      }
    });
    _fetchData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _pinController.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final restRes = await ApiService.get('/api/restaurants/merchant/my');
      final restData = json.decode(restRes.body);
      if (restData['data'] != null) {
        _restaurantId = restData['data']['_id'];
      }

      if (_tabController.index == 2) {
        // Payroll report tab
        final payRes = await ApiService.get('/api/employees/restaurant/$_restaurantId/payroll');
        final payData = json.decode(payRes.body);
        setState(() {
          _payroll = payData['data'] ?? [];
        });
      } else {
        // Staff / Schedules tab
        final empRes = await ApiService.get('/api/employees/restaurant/$_restaurantId');
        final empData = json.decode(empRes.body);
        setState(() {
          _employees = empData['data'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Error loading employee/payroll data: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _hireEmployee() async {
    if (_firstNameController.text.isEmpty || _lastNameController.text.isEmpty || _phoneController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill First Name, Last Name, and Phone')));
      return;
    }
    if (_pinController.text.isNotEmpty && _pinController.text.length != 4) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('PIN must be exactly 4 digits')));
      return;
    }

    try {
      final payload = {
        'firstName': _firstNameController.text,
        'lastName': _lastNameController.text,
        'phone': _phoneController.text,
        'role': _role,
        if (_pinController.text.isNotEmpty) 'pin': _pinController.text,
      };

      await ApiService.post('/api/employees/restaurant/$_restaurantId', payload);
      
      _firstNameController.clear();
      _lastNameController.clear();
      _phoneController.clear();
      _pinController.clear();
      _role = 'waiter';

      if (mounted) Navigator.pop(context);
      _fetchData();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e'), backgroundColor: BrandColors.red));
    }
  }

  Future<void> _removeEmployee(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: BrandColors.card,
        title: const Text('Fire Employee?', style: TextStyle(color: BrandColors.textMain)),
        content: const Text('Are you sure you want to remove this employee from staff?', style: TextStyle(color: BrandColors.textMuted)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Remove', style: TextStyle(color: BrandColors.red)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await ApiService.delete('/api/employees/$id');
      _fetchData();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: BrandColors.red));
    }
  }

  Future<void> _updateSchedule(String empId, String day, String field, dynamic value) async {
    try {
      final emp = _employees.firstWhere((e) => e['_id'] == empId);
      final List<dynamic> oldSchedule = List.from(emp['schedule'] ?? []);
      
      final int dayIdx = oldSchedule.indexWhere((s) => s['day'] == day);
      if (dayIdx >= 0) {
        oldSchedule[dayIdx] = Map<String, dynamic>.from(oldSchedule[dayIdx]);
        oldSchedule[dayIdx][field] = value;
      } else {
        oldSchedule.add({
          'day': day,
          'startTime': '09:00',
          'endTime': '17:00',
          'isOff': false,
          field: value
        });
      }

      await ApiService.put('/api/employees/$empId/schedule', oldSchedule);
      _fetchData();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Schedule update failed: $e'), backgroundColor: BrandColors.red));
    }
  }

  bool _isClockedIn(Map<String, dynamic> emp) {
    final List<dynamic>? attendance = emp['attendance'] as List?;
    if (attendance == null || attendance.isEmpty) return false;
    final today = DateTime.now();
    final todayStr = today.toIso8601String().split('T')[0];
    
    return attendance.any((a) {
      final aDate = a['date']?.toString().split('T')[0];
      return aDate == todayStr && a['clockIn'] != null && a['clockOut'] == null;
    });
  }

  void _showHireModal() {
    _firstNameController.clear();
    _lastNameController.clear();
    _phoneController.clear();
    _pinController.clear();
    _role = 'waiter';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: BrandColors.card,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 16, right: 16, top: 16),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('Hire Staff Member', style: TextStyle(color: BrandColors.textMain, fontSize: 20, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _firstNameController,
                            style: const TextStyle(color: BrandColors.textMain),
                            decoration: const InputDecoration(labelText: 'First Name', labelStyle: TextStyle(color: BrandColors.textMuted)),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: TextField(
                            controller: _lastNameController,
                            style: const TextStyle(color: BrandColors.textMain),
                            decoration: const InputDecoration(labelText: 'Last Name', labelStyle: TextStyle(color: BrandColors.textMuted)),
                          ),
                        ),
                      ],
                    ),
                    TextField(
                      controller: _phoneController,
                      style: const TextStyle(color: BrandColors.textMain),
                      decoration: const InputDecoration(labelText: 'Phone Number', labelStyle: TextStyle(color: BrandColors.textMuted)),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      dropdownColor: BrandColors.card,
                      value: _role,
                      items: const [
                        DropdownMenuItem(value: 'waiter', child: Text('Waiter', style: TextStyle(color: BrandColors.textMain))),
                        DropdownMenuItem(value: 'chef', child: Text('Chef', style: TextStyle(color: BrandColors.textMain))),
                        DropdownMenuItem(value: 'cashier', child: Text('Cashier', style: TextStyle(color: BrandColors.textMain))),
                        DropdownMenuItem(value: 'manager', child: Text('Manager', style: TextStyle(color: BrandColors.textMain))),
                      ],
                      onChanged: (val) {
                        if (val != null) setModalState(() => _role = val);
                      },
                      decoration: const InputDecoration(labelText: 'Role', labelStyle: TextStyle(color: BrandColors.textMuted)),
                    ),
                    TextField(
                      controller: _pinController,
                      keyboardType: TextInputType.number,
                      maxLength: 4,
                      style: const TextStyle(color: BrandColors.textMain),
                      decoration: const InputDecoration(labelText: '4-Digit POS PIN (Optional)', labelStyle: TextStyle(color: BrandColors.textMuted)),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: BrandColors.cyan),
                        onPressed: _hireEmployee,
                        child: const Text('Hire Employee', style: TextStyle(color: BrandColors.background, fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            );
          }
        );
      }
    );
  }

  void _showTimePickerDialog(String empId, String day, String field, String initialTime) async {
    final parts = initialTime.split(':');
    final initialHour = int.tryParse(parts[0]) ?? 9;
    final initialMinute = int.tryParse(parts[1]) ?? 0;

    final picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay(hour: initialHour, minute: initialMinute),
    );

    if (picked != null) {
      final hourStr = picked.hour.toString().padLeft(2, '0');
      final minuteStr = picked.minute.toString().padLeft(2, '0');
      _updateSchedule(empId, day, field, '$hourStr:$minuteStr');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: BrandColors.background,
      appBar: AppBar(
        title: const Text('Employee Management'),
        backgroundColor: BrandColors.card,
        bottom: TabBar(
          controller: _tabController,
          labelColor: BrandColors.cyan,
          unselectedLabelColor: BrandColors.textMuted,
          indicatorColor: BrandColors.cyan,
          tabs: const [
            Tab(icon: Icon(Icons.people), text: 'Staff'),
            Tab(icon: Icon(Icons.schedule), text: 'Schedules'),
            Tab(icon: Icon(Icons.monetization_on), text: 'Payroll'),
          ],
        ),
      ),
      floatingActionButton: _tabController.index == 0
          ? FloatingActionButton(
              backgroundColor: BrandColors.cyan,
              onPressed: _showHireModal,
              child: const Icon(Icons.add, color: BrandColors.background),
            )
          : null,
      body: TabBarView(
        controller: _tabController,
        children: [
          // Tab 1: Staff
          _isLoading
              ? const Center(child: CircularProgressIndicator(color: BrandColors.cyan))
              : _employees.isEmpty
                  ? const Center(child: Text('No staff hired yet', style: TextStyle(color: BrandColors.textMuted)))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _employees.length,
                      itemBuilder: (context, index) {
                        final emp = _employees[index];
                        final isClocked = _isClockedIn(emp);
                        return GlassContainer(
                          margin: const EdgeInsets.only(bottom: 16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      CircleAvatar(
                                        backgroundColor: BrandColors.cyan.withOpacity(0.2),
                                        child: Text(
                                          '${emp['firstName']?[0]}${emp['lastName']?[0]}',
                                          style: const TextStyle(color: BrandColors.cyan, fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text('${emp['firstName']} ${emp['lastName']}', style: const TextStyle(fontWeight: FontWeight.bold, color: BrandColors.textMain, fontSize: 16)),
                                          Text(emp['phone'] ?? '', style: const TextStyle(color: BrandColors.textMuted, fontSize: 12)),
                                        ],
                                      )
                                    ],
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(color: BrandColors.cyan.withOpacity(0.15), borderRadius: BorderRadius.circular(6)),
                                    child: Text(emp['role'].toString().toUpperCase(), style: const TextStyle(color: BrandColors.cyan, fontSize: 11, fontWeight: FontWeight.bold)),
                                  )
                                ],
                              ),
                              const Divider(color: BrandColors.border),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(Icons.key, color: BrandColors.textMuted, size: 18),
                                      const SizedBox(width: 6),
                                      const Text('POS PIN: ', style: TextStyle(color: BrandColors.textMuted, fontSize: 13)),
                                      Text(emp['pin'] ?? 'None', style: const TextStyle(color: BrandColors.textMain, fontWeight: FontWeight.w900, fontSize: 14)),
                                    ],
                                  ),
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(6),
                                        decoration: BoxDecoration(shape: BoxShape.circle, color: isClocked ? BrandColors.green : Colors.grey),
                                      ),
                                      const SizedBox(width: 6),
                                      Text(isClocked ? 'Clocked In' : 'Clocked Out', style: TextStyle(color: isClocked ? BrandColors.green : BrandColors.textMuted, fontSize: 12, fontWeight: FontWeight.bold)),
                                      const SizedBox(width: 16),
                                      TextButton(
                                        onPressed: () => _removeEmployee(emp['_id']),
                                        child: const Text('Fire', style: TextStyle(color: BrandColors.red)),
                                      )
                                    ],
                                  )
                                ],
                              )
                            ],
                          ),
                        );
                      },
                    ),
          // Tab 2: Schedules
          _isLoading
              ? const Center(child: CircularProgressIndicator(color: BrandColors.cyan))
              : _employees.isEmpty
                  ? const Center(child: Text('No employees found', style: TextStyle(color: BrandColors.textMuted)))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _employees.length,
                      itemBuilder: (context, index) {
                        final emp = _employees[index];
                        final schedule = emp['schedule'] as List? ?? [];
                        
                        return Card(
                          color: BrandColors.card,
                          margin: const EdgeInsets.only(bottom: 20),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('${emp['firstName']} ${emp['lastName']} - ${emp['role'].toString().toUpperCase()}', style: const TextStyle(color: BrandColors.textMain, fontWeight: FontWeight.w900, fontSize: 16)),
                                const SizedBox(height: 12),
                                // Weekdays row
                                SingleChildScrollView(
                                  scrollDirection: Axis.horizontal,
                                  child: Row(
                                    children: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) {
                                      final shift = schedule.firstWhere((s) => s['day'] == day, orElse: () => {'day': day, 'isOff': true, 'startTime': '09:00', 'endTime': '17:00'});
                                      final isOff = shift['isOff'] == true;

                                      return Container(
                                        width: 110,
                                        margin: const EdgeInsets.only(right: 8),
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: isOff ? Colors.white10 : BrandColors.cyan.withOpacity(0.08),
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(color: isOff ? Colors.white10 : BrandColors.cyan.withOpacity(0.3)),
                                        ),
                                        child: Column(
                                          children: [
                                            Text(day.substring(0, 3).toUpperCase(), style: const TextStyle(color: BrandColors.textMuted, fontSize: 11, fontWeight: FontWeight.bold)),
                                            Checkbox(
                                              value: !isOff,
                                              activeColor: BrandColors.cyan,
                                              onChanged: (val) => _updateSchedule(emp['_id'], day, 'isOff', val == false),
                                            ),
                                            if (!isOff) ...[
                                              InkWell(
                                                onTap: () => _showTimePickerDialog(emp['_id'], day, 'startTime', shift['startTime']),
                                                child: Text(shift['startTime'], style: const TextStyle(color: BrandColors.textMain, fontSize: 12, decoration: TextDecoration.underline)),
                                              ),
                                              const SizedBox(height: 4),
                                              InkWell(
                                                onTap: () => _showTimePickerDialog(emp['_id'], day, 'endTime', shift['endTime']),
                                                child: Text(shift['endTime'], style: const TextStyle(color: BrandColors.textMain, fontSize: 12, decoration: TextDecoration.underline)),
                                              ),
                                            ] else
                                              const Text('Off Day', style: TextStyle(color: BrandColors.textMuted, fontSize: 12, fontStyle: FontStyle.italic)),
                                          ],
                                        ),
                                      );
                                    }).toList(),
                                  ),
                                )
                              ],
                            ),
                          ),
                        );
                      },
                    ),
          // Tab 3: Payroll
          _isLoading
              ? const Center(child: CircularProgressIndicator(color: BrandColors.cyan))
              : _payroll.isEmpty
                  ? const Center(child: Text('No payroll reports available', style: TextStyle(color: BrandColors.textMuted)))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _payroll.length,
                      itemBuilder: (context, index) {
                        final record = _payroll[index];
                        final double hours = (record['totalHours'] ?? 0.0).toDouble();
                        final double owed = (record['amountOwed'] ?? 0.0).toDouble();
                        final payType = record['payType'] ?? 'hourly';
                        
                        return GlassContainer(
                          margin: const EdgeInsets.only(bottom: 16),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('${record['firstName']} ${record['lastName']}', style: const TextStyle(fontWeight: FontWeight.bold, color: BrandColors.textMain, fontSize: 16)),
                                  Text('${record['role'].toString().toUpperCase()} • $payType', style: const TextStyle(color: BrandColors.textMuted, fontSize: 12)),
                                ],
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text('\$${owed.toStringAsFixed(2)}', style: const TextStyle(color: BrandColors.green, fontWeight: FontWeight.bold, fontSize: 18)),
                                  Text('Hours: ${hours.toStringAsFixed(1)}h', style: const TextStyle(color: BrandColors.textMuted, fontSize: 12)),
                                ],
                              )
                            ],
                          ),
                        );
                      },
                    ),
        ],
      ),
    );
  }
}
