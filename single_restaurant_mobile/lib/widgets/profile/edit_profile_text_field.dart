import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:country_picker/country_picker.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';

class EditProfileTextField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final IconData icon;
  final bool readOnly;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;
  final List<TextInputFormatter>? inputFormatters;
  final Widget? prefixWidget;

  const EditProfileTextField({
    super.key,
    required this.label,
    required this.controller,
    required this.icon,
    this.readOnly = false,
    this.keyboardType,
    this.validator,
    this.inputFormatters,
    this.prefixWidget,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: Colors.grey.shade700,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          readOnly: readOnly,
          keyboardType: keyboardType,
          inputFormatters: inputFormatters,
          validator: validator,
          onTap: () {
            if (controller.selection.baseOffset != controller.selection.extentOffset) {
              final extent = controller.selection.extentOffset;
              if (extent != -1) {
                controller.selection = TextSelection.collapsed(offset: extent);
              }
            }
          },
          style: TextStyle(color: readOnly ? Colors.grey.shade600 : Colors.black87),
          decoration: InputDecoration(
            prefixIcon: prefixWidget ??
                Icon(
                  icon,
                  color: readOnly ? Colors.grey.shade400 : AppColors.secondary,
                ),
            filled: true,
            fillColor: readOnly ? Colors.grey.shade100 : Colors.grey.shade50,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey.shade200),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.secondary),
            ),
            contentPadding: const EdgeInsets.symmetric(vertical: 16),
          ),
        ),
      ],
    );
  }
}

class EditProfileCountryPicker extends StatelessWidget {
  final String selectedCountryCode;
  final String selectedCountryFlag;
  final ValueSetter<Country> onSelect;

  const EditProfileCountryPicker({
    super.key,
    required this.selectedCountryCode,
    required this.selectedCountryFlag,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
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
          onSelect: onSelect,
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '$selectedCountryCode $selectedCountryFlag',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 13,
                color: Colors.black87,
              ),
            ),
            const SizedBox(width: 4),
            const Icon(Icons.arrow_drop_down, size: 20, color: Colors.black54),
            const SizedBox(width: 8),
            Container(width: 1, height: 20, color: Colors.grey.shade300),
            const SizedBox(width: 12),
          ],
        ),
      ),
    );
  }
}
