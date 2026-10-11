import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:single_restaurant_mobile/models/user_model.dart';
import 'package:single_restaurant_mobile/widgets/auth/auth_input_helper.dart';

/// Contact details section for table reservations.
/// Displays user account summary when logged in (with a Change button),
/// or editable inputs with country flag picker and industry-level validation.
class BookTableContactDetails extends StatelessWidget {
  final GlobalKey<FormState> formKey;
  final bool isLoggedIn;
  final bool isCustomContact;
  final VoidCallback onToggleCustomContact;
  final UserModel? user;
  final TextEditingController nameController;
  final TextEditingController phoneController;
  final TextEditingController emailController;
  final String selectedCountryCode;
  final String selectedCountryFlag;
  final int phoneMaxLength;
  final VoidCallback onPickCountry;

  const BookTableContactDetails({
    super.key,
    required this.formKey,
    required this.isLoggedIn,
    required this.isCustomContact,
    required this.onToggleCustomContact,
    this.user,
    required this.nameController,
    required this.phoneController,
    required this.emailController,
    required this.selectedCountryCode,
    required this.selectedCountryFlag,
    required this.phoneMaxLength,
    required this.onPickCountry,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoggedIn && user != null && !isCustomContact) {
      final hasPhone = user!.phone.trim().isNotEmpty;
      return Form(
        key: formKey,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: Colors.red.shade50,
                    child: Icon(Icons.person, color: Colors.red.shade900, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user!.name.isNotEmpty ? user!.name : 'Registered Customer',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                        if (user!.email.isNotEmpty)
                          Text(
                            user!.email,
                            style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                          ),
                      ],
                    ),
                  ),
                  InkWell(
                    onTap: onToggleCustomContact,
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.red.shade200),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.edit_outlined, size: 13, color: Colors.red.shade900),
                          const SizedBox(width: 4),
                          Text(
                            'Change',
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.bold,
                              color: Colors.red.shade900,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              if (hasPhone) ...[
                const SizedBox(height: 12),
                Divider(height: 1, color: Colors.grey.shade200),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Icon(Icons.phone_outlined, size: 16, color: Colors.grey.shade600),
                    const SizedBox(width: 8),
                    Text(
                      user!.phone,
                      style: const TextStyle(fontSize: 13, color: Colors.black87),
                    ),
                  ],
                ),
              ] else ...[
                const SizedBox(height: 14),
                _buildFieldLabel('Phone Number'),
                _buildPhoneField(),
              ],
            ],
          ),
        ),
      );
    }

    // Editable Mode (Guest or Logged-In User who tapped "Change")
    return Form(
      key: formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (isLoggedIn)
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildFieldLabel('Full Name'),
                  InkWell(
                    onTap: onToggleCustomContact,
                    borderRadius: BorderRadius.circular(6),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.person_outline, size: 14, color: Colors.red.shade900),
                          const SizedBox(width: 4),
                          Text(
                            'Use My Profile',
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.bold,
                              color: Colors.red.shade900,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            )
          else
            _buildFieldLabel('Full Name'),
          _buildNameField(),
          const SizedBox(height: 12),
          _buildFieldLabel('Phone Number'),
          _buildPhoneField(),
          const SizedBox(height: 12),
          _buildFieldLabel('Email Address', isOptional: true),
          _buildEmailField(),
        ],
      ),
    );
  }

  Widget _buildFieldLabel(String label, {bool isOptional = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 5),
      child: Row(
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.bold,
              color: Color(0xFF111827),
            ),
          ),
          if (isOptional) ...[
            const SizedBox(width: 4),
            Text(
              '(Optional)',
              style: TextStyle(fontSize: 11.5, color: Colors.grey.shade500),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildNameField() {
    return TextFormField(
      controller: nameController,
      textCapitalization: TextCapitalization.words,
      style: const TextStyle(fontSize: 13.5, color: Color(0xFF1F2937)),
      decoration: AuthInputHelper.inputDecoration(
        hint: 'Enter your full name',
        icon: Icons.person_outline,
      ),
      validator: (val) {
        if (val == null || val.trim().isEmpty) return 'Full name is required';
        if (val.trim().length < 2) return 'Enter a valid full name';
        return null;
      },
    );
  }

  Widget _buildPhoneField() {
    return TextFormField(
      controller: phoneController,
      keyboardType: TextInputType.phone,
      inputFormatters: [
        LengthLimitingTextInputFormatter(phoneMaxLength),
      ],
      style: const TextStyle(fontSize: 13.5, color: Color(0xFF1F2937)),
      decoration: InputDecoration(
        hintText: 'Enter phone number',
        hintStyle: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 13.0),
        prefixIcon: InkWell(
          onTap: onPickCountry,
          borderRadius: const BorderRadius.horizontal(left: Radius.circular(12)),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            margin: const EdgeInsets.only(right: 8),
            decoration: const BoxDecoration(
              border: Border(right: BorderSide(color: Color(0xFFE5E7EB), width: 1.2)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '$selectedCountryCode $selectedCountryFlag',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
                ),
                const SizedBox(width: 4),
                const Icon(Icons.keyboard_arrow_down, size: 16, color: Color(0xFF6B7280)),
              ],
            ),
          ),
        ),
        contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
        filled: true,
        fillColor: Colors.white,
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE5E7EB), width: 1.2),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF800A12), width: 1.2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.red.shade300, width: 1.2),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.red.shade700, width: 1.2),
        ),
      ),
      validator: (val) {
        if (val == null || val.trim().isEmpty) return 'Phone number is required';
        if (val.trim().length < 7) return 'Enter a valid phone number';
        return null;
      },
    );
  }

  Widget _buildEmailField() {
    return TextFormField(
      controller: emailController,
      keyboardType: TextInputType.emailAddress,
      style: const TextStyle(fontSize: 13.5, color: Color(0xFF1F2937)),
      decoration: AuthInputHelper.inputDecoration(
        hint: 'Enter your email address',
        icon: Icons.mail_outline,
      ),
      validator: (val) {
        if (val == null || val.trim().isEmpty) return null;
        final regex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
        if (!regex.hasMatch(val.trim())) return 'Enter a valid email address';
        return null;
      },
    );
  }
}
