import 'package:country_picker/country_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:single_restaurant_mobile/providers/checkout_provider.dart';

class CheckoutContactInfo extends StatelessWidget {
  final CheckoutProvider checkout;
  final TextEditingController nameController;
  final TextEditingController phoneController;
  final String selectedCountryCode;
  final String selectedCountryFlag;
  final int phoneMaxLength;
  final bool isEditingContact;
  final VoidCallback onToggleEditing;
  final void Function(Country) onCountrySelected;

  const CheckoutContactInfo({
    super.key,
    required this.checkout,
    required this.nameController,
    required this.phoneController,
    required this.selectedCountryCode,
    required this.selectedCountryFlag,
    required this.phoneMaxLength,
    required this.isEditingContact,
    required this.onToggleEditing,
    required this.onCountrySelected,
  });

  @override
  Widget build(BuildContext context) {
    final hasPhone = checkout.hasValidPhone;
    final hasName = checkout.hasValidName;
    final isComplete = checkout.isContactComplete;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: !isComplete ? const Color(0xFFEF4444).withOpacity(0.4) : Colors.grey.shade200,
          width: !isComplete ? 1.5 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          InkWell(
            onTap: onToggleEditing,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: isComplete ? const Color(0xFFF0FDF4) : const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      isComplete ? Icons.person_outline : Icons.person_off_outlined,
                      size: 18,
                      color: isComplete ? const Color(0xFF16A34A) : const Color(0xFFEF4444),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'CONTACT DETAILS',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.2,
                            color: Colors.black54,
                          ),
                        ),
                        const SizedBox(height: 3),
                        if (isComplete && !isEditingContact)
                          Text(
                            '${checkout.fullName} • ${checkout.phone}',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Colors.black87,
                            ),
                            overflow: TextOverflow.ellipsis,
                          )
                        else if (!isComplete)
                          const Text(
                            'Phone number required for delivery updates',
                            style: TextStyle(
                              fontSize: 12,
                              color: Color(0xFFEF4444),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (isComplete)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: isEditingContact ? Colors.grey.shade100 : const Color(0xFFF5F0ED),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        isEditingContact ? 'Done' : 'Edit',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: isEditingContact ? Colors.grey.shade700 : const Color(0xFF7A0B10),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // Editable Fields
          if (isEditingContact || !isComplete) ...[
            Divider(height: 1, color: Colors.grey.shade100),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
              child: Column(
                children: [
                  _buildContactField(
                    label: 'Full Name',
                    controller: nameController,
                    icon: Icons.person_outline,
                    keyboardType: TextInputType.name,
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r"^[a-zA-Z\s\-'.]*")),
                    ],
                    hasError: !hasName,
                    errorText: 'Valid Name is required',
                    onChanged: (val) {
                      checkout.setUserDetails(val, checkout.phone, checkout.email);
                    },
                  ),
                  const SizedBox(height: 12),
                  _buildContactField(
                    label: 'Phone Number',
                    controller: phoneController,
                    icon: Icons.phone_outlined,
                    keyboardType: TextInputType.phone,
                    prefixWidget: _buildCountryPicker(context),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'^[0-9\s\-()]*')),
                      LengthLimitingTextInputFormatter(phoneMaxLength),
                    ],
                    hasError: !hasPhone,
                    errorText: 'Enter a valid phone number (min 7 digits)',
                    onChanged: (val) {
                      checkout.setUserDetails(
                        checkout.fullName,
                        '$selectedCountryCode${val.trim()}',
                        checkout.email,
                      );
                    },
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.info_outline, size: 13, color: Colors.grey.shade400),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'The restaurant and driver will use this number to reach you',
                          style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildContactField({
    required String label,
    required TextEditingController controller,
    required IconData icon,
    required TextInputType keyboardType,
    required bool hasError,
    required String errorText,
    required ValueChanged<String> onChanged,
    List<TextInputFormatter>? inputFormatters,
    Widget? prefixWidget,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: hasError ? const Color(0xFFEF4444) : Colors.grey.shade600,
          ),
        ),
        const SizedBox(height: 5),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFFF9F9F9),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: hasError ? const Color(0xFFEF4444).withOpacity(0.5) : Colors.grey.shade300,
            ),
          ),
          child: TextField(
            controller: controller,
            keyboardType: keyboardType,
            inputFormatters: inputFormatters,
            onChanged: onChanged,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
            decoration: InputDecoration(
              contentPadding: const EdgeInsets.symmetric(vertical: 12),
              prefixIcon: prefixWidget ??
                  Icon(icon, size: 18, color: hasError ? const Color(0xFFEF4444) : Colors.grey.shade500),
              border: InputBorder.none,
              hintText: 'Enter $label',
              hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13),
            ),
          ),
        ),
        if (hasError) ...[
          const SizedBox(height: 4),
          Text(
            errorText,
            style: const TextStyle(fontSize: 11, color: Color(0xFFEF4444), fontWeight: FontWeight.w500),
          ),
        ],
      ],
    );
  }

  Widget _buildCountryPicker(BuildContext context) {
    return InkWell(
      onTap: () {
        showCountryPicker(
          context: context,
          showPhoneCode: true,
          countryListTheme: CountryListThemeData(
            bottomSheetHeight: MediaQuery.of(context).size.height * 0.7,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            inputDecoration: InputDecoration(
              labelText: 'Search Country',
              hintText: 'Start typing to search',
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(borderSide: BorderSide(color: Colors.grey.shade300)),
            ),
          ),
          onSelect: onCountrySelected,
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '$selectedCountryCode $selectedCountryFlag',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87),
            ),
            const SizedBox(width: 4),
            Icon(Icons.keyboard_arrow_down, color: Colors.grey.shade500, size: 16),
            const SizedBox(width: 8),
            Container(width: 1, height: 20, color: Colors.grey.shade300),
            const SizedBox(width: 8),
          ],
        ),
      ),
    );
  }
}
