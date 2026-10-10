import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Pure presentational responsive phone field with country picker button.
class AuthPhoneField extends StatelessWidget {
  final String selectedCountryCode;
  final String selectedCountryFlag;
  final int phoneMaxLength;
  final TextEditingController controller;
  final VoidCallback onCountryTap;
  final String? Function(String?)? validator;

  const AuthPhoneField({
    super.key,
    required this.selectedCountryCode,
    required this.selectedCountryFlag,
    required this.phoneMaxLength,
    required this.controller,
    required this.onCountryTap,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    final isCompact = MediaQuery.of(context).size.width < 360;
    final countryPadding = isCompact
        ? const EdgeInsets.symmetric(horizontal: 10, vertical: 16)
        : const EdgeInsets.symmetric(horizontal: 16, vertical: 16);

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Row(
        children: [
          InkWell(
            onTap: onCountryTap,
            borderRadius: const BorderRadius.horizontal(left: Radius.circular(8)),
            child: Padding(
              padding: countryPadding,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '$selectedCountryCode $selectedCountryFlag',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  const SizedBox(width: 4),
                  Icon(
                    Icons.keyboard_arrow_down,
                    color: Colors.grey.shade600,
                    size: 18,
                  ),
                ],
              ),
            ),
          ),
          Container(height: 24, width: 1, color: Colors.grey.shade300),
          Expanded(
            child: TextFormField(
              controller: controller,
              keyboardType: TextInputType.phone,
              inputFormatters: [
                LengthLimitingTextInputFormatter(phoneMaxLength),
              ],
              onTap: () {
                if (controller.selection.baseOffset != controller.selection.extentOffset) {
                  final extent = controller.selection.extentOffset;
                  if (extent != -1) {
                    controller.selection = TextSelection.collapsed(offset: extent);
                  }
                }
              },
              decoration: InputDecoration(
                hintText: isCompact ? 'Phone number' : 'Enter your phone number',
                hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(
                  horizontal: isCompact ? 10 : 16,
                ),
              ),
              validator: validator,
            ),
          ),
        ],
      ),
    );
  }
}
