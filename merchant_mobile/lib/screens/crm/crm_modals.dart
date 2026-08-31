import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/api_service.dart';

class CrmModals {
  static Future<void> showSendPromoModal(BuildContext context, String restaurantId, List<String> targetIds, VoidCallback onSuccess) async {
    final titleController = TextEditingController();
    final messageController = TextEditingController();
    final discountValueController = TextEditingController(text: '10');
    String discountType = 'percentage';
    bool isLoading = false;

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Row(
            children: [
              const Icon(Icons.card_giftcard, color: Color(0xFF8B0000)),
              const SizedBox(width: 8),
              Text('Send Promotion', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
            ],
          ),
          content: SizedBox(
            width: 500,
            child: SingleChildScrollView(
              child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Sending to ${targetIds.length} customer(s). They will receive an App Notification and a Unique Coupon Code.', style: GoogleFonts.inter(fontSize: 13, color: Colors.grey.shade600)),
                const SizedBox(height: 16),
                _buildLabel('Offer Title'),
                TextField(controller: titleController, decoration: _inputDec('e.g. Special VIP Discount')),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildLabel('Discount Type'),
                          DropdownButtonFormField<String>(
                            value: discountType,
                            isExpanded: true,
                            items: const [
                              DropdownMenuItem(value: 'percentage', child: Text('Percentage (%)', overflow: TextOverflow.ellipsis)),
                              DropdownMenuItem(value: 'fixed', child: Text('Fixed Amount (\$)', overflow: TextOverflow.ellipsis)),
                            ],
                            onChanged: (v) => setState(() => discountType = v!),
                            decoration: _inputDec(''),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildLabel('Value'),
                          TextField(controller: discountValueController, keyboardType: TextInputType.number, decoration: _inputDec('')),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _buildLabel('Message Body'),
                TextField(controller: messageController, maxLines: 3, decoration: _inputDec('Write a nice message...')),
              ],
            ),
          ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF8B0000), foregroundColor: Colors.white),
              onPressed: isLoading ? null : () async {
                if (titleController.text.trim().isEmpty) {
                  ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Offer Title is required'), backgroundColor: Colors.red));
                  return;
                }
                if (discountValueController.text.trim().isEmpty || double.tryParse(discountValueController.text.trim()) == null) {
                  ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Valid Discount Value is required'), backgroundColor: Colors.red));
                  return;
                }
                if (messageController.text.trim().isEmpty) {
                  ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Message Body is required'), backgroundColor: Colors.red));
                  return;
                }
                setState(() => isLoading = true);
                try {
                  await ApiService.sendPromo(restaurantId, {
                    'userIds': targetIds,
                    'title': titleController.text,
                    'message': messageController.text,
                    'discountType': discountType,
                    'discountValue': double.tryParse(discountValueController.text) ?? 10.0,
                  });
                  if (ctx.mounted) {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Promo sent successfully!'), backgroundColor: Colors.green));
                    onSuccess();
                  }
                } catch (e) {
                  if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('Failed: $e'), backgroundColor: Colors.red));
                } finally {
                  if (ctx.mounted) setState(() => isLoading = false);
                }
              },
              child: isLoading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('Send Now'),
            )
          ],
        ),
      ),
    );
  }

  static Future<void> showAssignGroupModal(BuildContext context, String restaurantId, List<String> targetIds, VoidCallback onSuccess) async {
    String selectedGroup = 'App User';
    bool isLoading = false;
    final groups = ['App User', 'Guest', 'Family', 'Friends', 'Corporate', 'Others'];

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Text('Assign Group', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
          content: SizedBox(
            width: 400,
            child: Column(
              mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Select a group for ${targetIds.length} customer(s).', style: GoogleFonts.inter(fontSize: 13, color: Colors.grey.shade600)),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: selectedGroup,
                items: groups.map((g) => DropdownMenuItem(value: g, child: Text(g))).toList(),
                onChanged: (v) => setState(() => selectedGroup = v!),
                decoration: _inputDec('Group'),
              ),
            ],
          ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF111827), foregroundColor: Colors.white),
              onPressed: isLoading ? null : () async {
                setState(() => isLoading = true);
                try {
                  await ApiService.bulkUpdateCustomers(restaurantId, {
                    'customerIds': targetIds,
                    'updateData': {'group': selectedGroup},
                  });
                  if (ctx.mounted) {
                    Navigator.pop(ctx);
                    onSuccess();
                  }
                } catch (e) {
                  if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('Failed: $e'), backgroundColor: Colors.red));
                } finally {
                  if (ctx.mounted) setState(() => isLoading = false);
                }
              },
              child: isLoading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('Save'),
            )
          ],
        ),
      ),
    );
  }

  static Future<void> showChangeStatusModal(BuildContext context, String restaurantId, List<String> targetIds, VoidCallback onSuccess) async {
    String selectedStatus = 'Active';
    bool isLoading = false;

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Text('Change Status', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
          content: SizedBox(
            width: 400,
            child: Column(
              mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Update status for ${targetIds.length} customer(s).', style: GoogleFonts.inter(fontSize: 13, color: Colors.grey.shade600)),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: selectedStatus,
                items: ['Active', 'Inactive'].map((g) => DropdownMenuItem(value: g, child: Text(g))).toList(),
                onChanged: (v) => setState(() => selectedStatus = v!),
                decoration: _inputDec('Status'),
              ),
            ],
          ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF111827), foregroundColor: Colors.white),
              onPressed: isLoading ? null : () async {
                setState(() => isLoading = true);
                try {
                  await ApiService.bulkUpdateCustomers(restaurantId, {
                    'customerIds': targetIds,
                    'updateData': {'status': selectedStatus},
                  });
                  if (ctx.mounted) {
                    Navigator.pop(ctx);
                    onSuccess();
                  }
                } catch (e) {
                  if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('Failed: $e'), backgroundColor: Colors.red));
                } finally {
                  if (ctx.mounted) setState(() => isLoading = false);
                }
              },
              child: isLoading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('Save'),
            )
          ],
        ),
      ),
    );
  }

  static Future<void> showDeleteModal(BuildContext context, String restaurantId, List<String> targetIds, VoidCallback onSuccess) async {
    bool isLoading = false;

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Text('Delete Customers?', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.red.shade700)),
          content: SizedBox(
            width: 400,
            child: Text('Are you sure you want to delete ${targetIds.length} customer(s)? This will archive their profiles.', style: GoogleFonts.inter()),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: Colors.black))),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red.shade700, foregroundColor: Colors.white),
              onPressed: isLoading ? null : () async {
                setState(() => isLoading = true);
                try {
                  await ApiService.bulkDeleteCustomers(restaurantId, targetIds);
                  if (ctx.mounted) {
                    Navigator.pop(ctx);
                    onSuccess();
                  }
                } catch (e) {
                  if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('Failed: $e'), backgroundColor: Colors.red));
                } finally {
                  if (ctx.mounted) setState(() => isLoading = false);
                }
              },
              child: isLoading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('Yes, Delete'),
            )
          ],
        ),
      ),
    );
  }

  static Future<void> showAddEditCustomerModal(BuildContext context, String restaurantId, VoidCallback onSuccess, {dynamic customer}) async {
    final nameController = TextEditingController(text: customer?.name ?? '');
    final emailController = TextEditingController(text: customer?.email ?? '');
    final phoneController = TextEditingController(text: customer?.phone ?? '');
    String selectedGroup = customer?.group ?? 'App User';
    bool isLoading = false;
    final groups = ['App User', 'Guest', 'Family', 'Friends', 'Corporate', 'Others'];

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Text(customer == null ? 'Add Customer' : 'Edit Customer', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
          content: SizedBox(
            width: 450,
            child: SingleChildScrollView(
              child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildLabel('Name *'),
                TextField(controller: nameController, decoration: _inputDec('John Doe')),
                const SizedBox(height: 12),
                _buildLabel('Email'),
                TextField(controller: emailController, decoration: _inputDec('john@example.com'), keyboardType: TextInputType.emailAddress),
                const SizedBox(height: 12),
                _buildLabel('Phone'),
                TextField(controller: phoneController, decoration: _inputDec('+1 234 567 8900'), keyboardType: TextInputType.phone),
                const SizedBox(height: 12),
                _buildLabel('Group'),
                DropdownButtonFormField<String>(
                  value: selectedGroup,
                  items: groups.map((g) => DropdownMenuItem(value: g, child: Text(g))).toList(),
                  onChanged: (v) => setState(() => selectedGroup = v!),
                  decoration: _inputDec('Group'),
                ),
              ],
            ),
          ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF8B0000), foregroundColor: Colors.white),
              onPressed: isLoading ? null : () async {
                if (nameController.text.trim().isEmpty) {
                  ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Name is required'), backgroundColor: Colors.red));
                  return;
                }
                if (emailController.text.trim().isNotEmpty && !emailController.text.contains('@')) {
                  ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Please enter a valid email'), backgroundColor: Colors.red));
                  return;
                }
                setState(() => isLoading = true);
                
                final payload = {
                  'name': nameController.text.trim(),
                  'email': emailController.text.trim(),
                  'phone': phoneController.text.trim(),
                  'group': selectedGroup
                };

                try {
                  if (customer == null) {
                    await ApiService.createCustomer(restaurantId, payload);
                  } else {
                    await ApiService.updateCustomer(restaurantId, customer.id, payload);
                  }
                  if (ctx.mounted) {
                    Navigator.pop(ctx);
                    onSuccess();
                  }
                } catch (e) {
                  if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('Failed: $e'), backgroundColor: Colors.red));
                } finally {
                  if (ctx.mounted) setState(() => isLoading = false);
                }
              },
              child: isLoading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('Save'),
            )
          ],
        ),
      ),
    );
  }

  static Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(text, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade700)),
    );
  }

  static InputDecoration _inputDec(String hint) {
    return InputDecoration(
      hintText: hint,
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF8B0000))),
    );
  }
}
