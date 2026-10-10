import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';

/// Pure presentational text field + label for auth screens.
class AuthTextField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final String hintText;
  final IconData icon;
  final bool isPassword;
  final bool? isVisible;
  final VoidCallback? onVisibilityToggle;
  final String? Function(String?)? validator;
  final ValueChanged<String>? onChanged;
  final TextInputType keyboardType;
  final bool hasError;
  final Widget? trailingLabelAction;

  const AuthTextField({
    super.key,
    required this.label,
    required this.controller,
    required this.hintText,
    required this.icon,
    this.isPassword = false,
    this.isVisible,
    this.onVisibilityToggle,
    this.validator,
    this.onChanged,
    this.keyboardType = TextInputType.text,
    this.hasError = false,
    this.trailingLabelAction,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(bottom: 8.0, left: 4.0),
                child: Text(
                  label,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ),
            ),
            ?trailingLabelAction,
          ],
        ),
        TextFormField(
          controller: controller,
          obscureText: isPassword && !(isVisible ?? false),
          validator: validator,
          keyboardType: keyboardType,
          onChanged: onChanged,
          onTap: () {
            if (controller.selection.baseOffset != controller.selection.extentOffset) {
              final extent = controller.selection.extentOffset;
              if (extent != -1) {
                controller.selection = TextSelection.collapsed(offset: extent);
              }
            }
          },
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
            prefixIcon: Icon(icon, color: Colors.grey, size: 20),
            suffixIcon: isPassword
                ? IconButton(
                    icon: Icon(
                      isVisible! ? Icons.visibility : Icons.visibility_off,
                      color: Colors.grey,
                      size: 20,
                    ),
                    onPressed: onVisibilityToggle,
                  )
                : null,
            contentPadding: const EdgeInsets.symmetric(vertical: 16),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(
                color: hasError ? Colors.red.shade300 : Colors.grey.shade300,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.secondary),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Colors.red),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Colors.red),
            ),
          ),
        ),
      ],
    );
  }
}
