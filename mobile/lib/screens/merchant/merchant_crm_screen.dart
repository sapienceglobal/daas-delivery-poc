import 'dart:convert';
import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../theme.dart';
import '../../widgets/glass_container.dart';
import 'package:intl/intl.dart';

class MerchantCrmScreen extends StatefulWidget {
  const MerchantCrmScreen({super.key});

  @override
  State<MerchantCrmScreen> createState() => _MerchantCrmScreenState();
}

class _MerchantCrmScreenState extends State<MerchantCrmScreen> {
  bool _isLoading = true;
  String? _restaurantId;
  List<dynamic> _customers = [];
  String _searchQuery = '';

  // Campaign Form Controllers
  final _campTitleController = TextEditingController();
  final _campMsgController = TextEditingController();
  String _targetSegment = 'All'; // 'All', 'VIP', 'Regular', 'New'
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    _fetchCustomers();
  }

  @override
  void dispose() {
    _campTitleController.dispose();
    _campMsgController.dispose();
    super.dispose();
  }

  Future<void> _fetchCustomers() async {
    setState(() => _isLoading = true);
    try {
      final restRes = await ApiService.get('/api/restaurants/merchant/my');
      final restData = json.decode(restRes.body);
      if (restData['data'] != null) {
        _restaurantId = restData['data']['_id'];
      }

      final response = await ApiService.get('/api/crm/restaurant/$_restaurantId/customers');
      final data = json.decode(response.body);
      setState(() {
        _customers = data['data'] ?? [];
      });
    } catch (e) {
      debugPrint('Error loading customers: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _sendCampaign() async {
    if (_campMsgController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Message cannot be empty')));
      return;
    }

    setState(() => _isSending = true);
    try {
      // Filter target users matching the segment
      List<dynamic> targetUsers = _customers;
      if (_targetSegment != 'All') {
        targetUsers = _customers.where((c) => c['segment'] == _targetSegment).toList();
      }

      final List<String> userIds = targetUsers
          .map<String?>((c) => c['userId']?.toString())
          .where((id) => id != null)
          .cast<String>()
          .toList();

      if (userIds.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('No registered customers found in segment: $_targetSegment'), backgroundColor: BrandColors.red),
        );
        setState(() => _isSending = false);
        return;
      }

      final payload = {
        'userIds': userIds,
        'title': _campTitleController.text,
        'message': _campMsgController.text,
      };

      final response = await ApiService.post('/api/crm/restaurant/$_restaurantId/promo', payload);
      final resData = json.decode(response.body);

      if (resData['success'] == true) {
        _campTitleController.clear();
        _campMsgController.clear();
        _targetSegment = 'All';
        
        if (mounted) Navigator.pop(context);
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Marketing campaign sent successfully!'), backgroundColor: BrandColors.green),
        );
      } else {
        throw Exception(resData['message'] ?? 'Failed to send campaign');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: BrandColors.red));
      }
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  void _showCampaignModal() {
    _campTitleController.clear();
    _campMsgController.clear();
    _targetSegment = 'All';

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
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Send Marketing Campaign', style: TextStyle(color: BrandColors.textMain, fontSize: 20, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    const Text('Send push notifications to registered customers.', style: TextStyle(color: BrandColors.textMuted, fontSize: 13)),
                    const SizedBox(height: 16),
                    // Segment picker
                    const Text('Target Segment', style: TextStyle(color: BrandColors.textMuted, fontSize: 12, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Row(
                      children: ['All', 'VIP', 'Regular', 'New'].map((seg) {
                        final isActive = _targetSegment == seg;
                        return Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: isActive ? BrandColors.cyan : Colors.white10,
                                padding: EdgeInsets.zero,
                              ),
                              onPressed: () => setModalState(() => _targetSegment = seg),
                              child: Text(seg, style: TextStyle(color: isActive ? BrandColors.background : BrandColors.textMain, fontWeight: FontWeight.bold, fontSize: 13)),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _campTitleController,
                      style: const TextStyle(color: BrandColors.textMain),
                      decoration: const InputDecoration(labelText: 'Notification Title', labelStyle: TextStyle(color: BrandColors.textMuted)),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _campMsgController,
                      maxLines: 3,
                      style: const TextStyle(color: BrandColors.textMain),
                      decoration: const InputDecoration(labelText: 'Message Body', labelStyle: TextStyle(color: BrandColors.textMuted)),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: BrandColors.cyan),
                        onPressed: _isSending ? null : _sendCampaign,
                        child: _isSending
                            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: BrandColors.background))
                            : const Text('Send Campaign', style: TextStyle(color: BrandColors.background, fontSize: 16, fontWeight: FontWeight.bold)),
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

  Color _getSegmentColor(String? segment) {
    switch (segment) {
      case 'VIP':
        return Colors.orange;
      case 'Regular':
        return BrandColors.cyan;
      case 'New':
        return Colors.green;
      default:
        return BrandColors.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _customers.where((c) {
      final name = c['name']?.toString().toLowerCase() ?? '';
      final phone = c['phone']?.toString() ?? '';
      final query = _searchQuery.toLowerCase();
      return name.contains(query) || phone.contains(query);
    }).toList();

    return Scaffold(
      backgroundColor: BrandColors.background,
      appBar: AppBar(
        title: const Text('CRM & Marketing'),
        backgroundColor: BrandColors.card,
        actions: [
          IconButton(
            icon: const Icon(Icons.campaign, color: BrandColors.cyan),
            onPressed: _showCampaignModal,
            tooltip: 'Send Campaign',
          )
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: BrandColors.cyan))
          : Column(
              children: [
                // Search bar
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: TextField(
                    style: const TextStyle(color: BrandColors.textMain),
                    onChanged: (val) => setState(() => _searchQuery = val),
                    decoration: const InputDecoration(
                      hintText: 'Search by name or phone...',
                      hintStyle: TextStyle(color: BrandColors.textMuted),
                      prefixIcon: Icon(Icons.search, color: BrandColors.textMuted),
                    ),
                  ),
                ),
                // Customer list
                Expanded(
                  child: filtered.isEmpty
                      ? const Center(child: Text('No customers found', style: TextStyle(color: BrandColors.textMuted)))
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: filtered.length,
                          itemBuilder: (context, index) {
                            final c = filtered[index];
                            final segment = c['segment'] ?? 'New';
                            final double spend = (c['totalSpend'] ?? 0.0).toDouble();
                            final int orders = c['totalOrders'] ?? 0;
                            final lastDate = DateTime.parse(c['lastOrderDate'] ?? DateTime.now().toIso8601String());

                            return GlassContainer(
                              margin: const EdgeInsets.only(bottom: 12),
                              child: ListTile(
                                leading: CircleAvatar(
                                  backgroundColor: _getSegmentColor(segment).withOpacity(0.15),
                                  child: Icon(segment == 'VIP' ? Icons.star : Icons.person, color: _getSegmentColor(segment)),
                                ),
                                title: Text(c['name'] ?? 'Walk-in Customer', style: const TextStyle(color: BrandColors.textMain, fontWeight: FontWeight.bold)),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const SizedBox(height: 2),
                                    Text(c['phone'] ?? '', style: const TextStyle(color: BrandColors.textMuted, fontSize: 12)),
                                    const SizedBox(height: 4),
                                    Text('Last Order: ${DateFormat('MMM dd, yyyy').format(lastDate)}', style: const TextStyle(color: BrandColors.textMuted, fontSize: 11)),
                                  ],
                                ),
                                trailing: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text('\$${spend.toStringAsFixed(2)}', style: const TextStyle(color: BrandColors.green, fontWeight: FontWeight.bold, fontSize: 15)),
                                    Text('$orders orders', style: const TextStyle(color: BrandColors.textMuted, fontSize: 11)),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
    );
  }
}
