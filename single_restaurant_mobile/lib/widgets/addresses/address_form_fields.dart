import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/widgets/address_autocomplete_field.dart';

const List<String> kUsStates = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const _kMaroon = Color(0xFF7A1414);
const _kBadgeBg = Color(0xFFFDE8E5);
const _kFieldFill = Color(0xFFFDFBF9);
const _kFieldBorder = Color(0xFFF0E6DE);

class AddressFormFields extends StatelessWidget {
  final TextEditingController labelController;
  final TextEditingController phoneController;
  final TextEditingController streetController;
  final TextEditingController address2Controller;
  final TextEditingController cityController;
  final TextEditingController zipController;
  final String state;
  final ValueChanged<String> onStateChanged;
  final ValueSetter<Map<String, dynamic>> onAutocompleteSelected;
  final VoidCallback onPickOnMap;

  const AddressFormFields({
    super.key,
    required this.labelController,
    required this.phoneController,
    required this.streetController,
    required this.address2Controller,
    required this.cityController,
    required this.zipController,
    required this.state,
    required this.onStateChanged,
    required this.onAutocompleteSelected,
    required this.onPickOnMap,
  });

  Widget _buildFieldBadge(IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(left: 8, right: 10),
      child: Container(
        width: 38,
        height: 38,
        decoration: const BoxDecoration(
          color: _kBadgeBg,
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: _kMaroon, size: 20),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint, IconData icon, {Widget? suffix}) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(color: Colors.grey.shade500, fontSize: 14.5),
      prefixIcon: _buildFieldBadge(icon),
      prefixIconConstraints: const BoxConstraints(minWidth: 54, minHeight: 46),
      suffixIcon: suffix,
      filled: true,
      fillColor: _kFieldFill,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: _kFieldBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: _kFieldBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: _kMaroon, width: 1.5),
      ),
    );
  }

  Widget _buildLabel(String text, {bool isRequired = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text.rich(
        TextSpan(
          text: text,
          children: [
            if (isRequired)
              const TextSpan(
                text: ' *',
                style: TextStyle(color: Color(0xFFD32F2F), fontWeight: FontWeight.bold),
              ),
          ],
        ),
        style: const TextStyle(
          fontWeight: FontWeight.w700,
          fontSize: 14,
          color: Color(0xFF262626),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Row 1: Label (Home/Work) & Phone
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('Label (Home/Work)'),
                  PopupMenuButton<String>(
                    tooltip: 'Select label',
                    color: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    onSelected: (val) => labelController.text = val,
                    itemBuilder: (ctx) => [
                      const PopupMenuItem(value: 'Home', child: Text('Home')),
                      const PopupMenuItem(value: 'Work', child: Text('Work')),
                      const PopupMenuItem(value: 'Other', child: Text('Other')),
                    ],
                    child: TextField(
                      controller: labelController,
                      decoration: _inputDecoration(
                        'e.g. Home',
                        Icons.home_outlined,
                        suffix: const Icon(Icons.keyboard_arrow_down, color: _kMaroon),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('Phone'),
                  TextField(
                    controller: phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: _inputDecoration(
                      '+918851114187',
                      Icons.phone_outlined,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 18),

        // Row 2: Street Address *
        _buildLabel('Street Address', isRequired: true),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: AddressAutocompleteField(
                controller: streetController,
                showLabel: false,
                onSelected: onAutocompleteSelected,
                customDecoration: _inputDecoration(
                  'Start typing to search...',
                  Icons.location_on_outlined,
                ),
              ),
            ),
            const SizedBox(width: 10),
            GestureDetector(
              onTap: onPickOnMap,
              child: Container(
                width: 58,
                height: 52,
                decoration: BoxDecoration(
                  color: _kBadgeBg,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFF3CBC4)),
                ),
                child: const Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.map_outlined, color: _kMaroon, size: 20),
                    SizedBox(height: 2),
                    Text(
                      'Map',
                      style: TextStyle(
                        color: _kMaroon,
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        Padding(
          padding: const EdgeInsets.only(top: 6, bottom: 4),
          child: Text(
            'Search for your address or enter manually',
            style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
          ),
        ),
        const SizedBox(height: 14),

        // Row 3: Apt, Suite, Floor (Optional)
        _buildLabel('Apt, Suite, Floor (Optional)'),
        TextField(
          controller: address2Controller,
          decoration: _inputDecoration(
            'Apt, Suite, Floor',
            Icons.apartment_outlined,
          ),
        ),
        const SizedBox(height: 18),

        // Row 4: City * & State *
        Row(
          children: [
            Expanded(
              flex: 5,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('City', isRequired: true),
                  TextField(
                    controller: cityController,
                    decoration: _inputDecoration(
                      'City',
                      Icons.location_city_outlined,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 4,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('State', isRequired: true),
                  DropdownButtonFormField<String>(
                    initialValue: kUsStates.contains(state) ? state : 'NY',
                    dropdownColor: Colors.white,
                    icon: const Icon(Icons.keyboard_arrow_down, color: _kMaroon),
                    decoration: _inputDecoration('', Icons.place_outlined),
                    items: kUsStates
                        .map((s) => DropdownMenuItem(
                              value: s,
                              child: Text(
                                s,
                                style: const TextStyle(fontWeight: FontWeight.w600),
                              ),
                            ))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) onStateChanged(v);
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 18),

        // Row 5: Zip Code *
        _buildLabel('Zip Code', isRequired: true),
        TextField(
          controller: zipController,
          keyboardType: TextInputType.number,
          decoration: _inputDecoration(
            'Zip Code',
            Icons.markunread_mailbox_outlined,
          ),
        ),
        const SizedBox(height: 8),
      ],
    );
  }
}
