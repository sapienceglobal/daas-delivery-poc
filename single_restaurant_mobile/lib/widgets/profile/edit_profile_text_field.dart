import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:country_picker/country_picker.dart';

const _kMaroon = Color(0xFF7A1414);
const _kFieldFill = Color(0xFFFCF6F2);
const _kFieldBorder = Color(0xFFF1E4DC);
const _kIconBg = Color(0xFFFBE3DF);

class EditProfileTextField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final IconData icon;
  final bool readOnly;
  final bool isRequired;
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
    this.isRequired = true,
    this.keyboardType,
    this.validator,
    this.inputFormatters,
    this.prefixWidget,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: const [
          BoxShadow(color: Color(0x0F000000), blurRadius: 12, offset: Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text.rich(
            TextSpan(
              text: label,
              children: [
                if (isRequired)
                  const TextSpan(
                    text: ' *',
                    style: TextStyle(color: Color(0xFFD32F2F)),
                  ),
              ],
            ),
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w500,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 12),
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
            style: TextStyle(
              fontSize: 15.5,
              color: readOnly ? Colors.black54 : Colors.black87,
            ),
            decoration: InputDecoration(
              prefixIcon: Padding(
                padding: const EdgeInsets.only(left: 10, right: 12),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: const BoxDecoration(
                        color: _kIconBg,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(icon, color: _kMaroon, size: 20),
                    ),
                    if (prefixWidget != null) ...[
                      const SizedBox(width: 12),
                      prefixWidget!,
                    ],
                  ],
                ),
              ),
              prefixIconConstraints: const BoxConstraints(minHeight: 56),
              filled: true,
              fillColor: _kFieldFill,
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
                borderSide: BorderSide(
                  color: readOnly ? _kFieldBorder : _kMaroon,
                  width: readOnly ? 1 : 1.4,
                ),
              ),
              errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: Color(0xFFD32F2F)),
              ),
              contentPadding: const EdgeInsets.symmetric(vertical: 18, horizontal: 4),
            ),
          ),
        ],
      ),
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
      borderRadius: BorderRadius.circular(8),
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
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(width: 8),
          Text(
            selectedCountryCode,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 15,
              color: Colors.black87,
            ),
          ),
          const SizedBox(width: 6),
          Text(selectedCountryFlag, style: const TextStyle(fontSize: 18)),
          const Icon(Icons.arrow_drop_down, size: 22, color: Color(0xFFE0A9A0)),
          const SizedBox(width: 10),
          Container(width: 1, height: 26, color: Colors.grey.shade300),
          const SizedBox(width: 6),
        ],
      ),
    );
  }
}
