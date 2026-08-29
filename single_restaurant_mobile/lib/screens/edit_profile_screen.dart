import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';
import 'package:flutter/services.dart';
import 'package:country_picker/country_picker.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _emailController;
  
  File? _imageFile;
  final ImagePicker _picker = ImagePicker();
  bool _isSaving = false;
  
  String _selectedCountryCode = '+1';
  String _selectedCountryFlag = '🇺🇸';
  int _phoneMaxLength = 10;
  void initState() {
    super.initState();
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    _nameController = TextEditingController(text: user?.name ?? '');
    _emailController = TextEditingController(text: user?.email ?? '');
    
    String p = user?.phone ?? '';
    if (p.startsWith('+1') && p.length > 2) {
      _selectedCountryCode = '+1';
      _selectedCountryFlag = '🇺🇸';
      _phoneMaxLength = 10;
      p = p.substring(2);
    } else if (p.startsWith('+91') && p.length > 3) {
      _selectedCountryCode = '+91';
      _selectedCountryFlag = '🇮🇳';
      _phoneMaxLength = 10;
      p = p.substring(3);
    }
    _phoneController = TextEditingController(text: p);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final pickedFile = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (pickedFile != null) {
      setState(() {
        _imageFile = File(pickedFile.path);
      });
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() {
      _isSaving = true;
    });
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.updateProfile(
      name: _nameController.text.trim(),
      phone: '$_selectedCountryCode${_phoneController.text.trim()}',
      imagePath: _imageFile?.path,
    );
    
    if (mounted) {
      setState(() {
        _isSaving = false;
      });
      
      if (success) {
        ToastUtils.showSuccess(context, 'Profile updated successfully!');
        Navigator.pop(context);
      } else {
        ToastUtils.showError(context, authProvider.error ?? 'Failed to update profile');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.secondary),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Edit Profile', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 18)),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Avatar Section
              GestureDetector(
                onTap: _pickImage,
                child: Stack(
                  children: [
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.grey.shade200,
                        border: Border.all(color: Colors.white, width: 4),
                        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10)],
                      ),
                      child: ClipOval(
                        child: _imageFile != null
                            ? Image.file(_imageFile!, fit: BoxFit.cover)
                            : (user?.profilePicture != null && user!.profilePicture!.isNotEmpty)
                                ? CachedNetworkImage(
                                    imageUrl: user.profilePicture!,
                                    fit: BoxFit.cover,
                                    placeholder: (context, url) => const Icon(Icons.person, size: 50, color: Colors.grey),
                                    errorWidget: (context, url, error) => const Icon(Icons.person, size: 50, color: Colors.grey),
                                  )
                                : const Icon(Icons.person, size: 50, color: Colors.grey),
                      ),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: AppColors.secondary,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        child: const Icon(Icons.camera_alt, color: Colors.white, size: 16),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              
              // Form Fields
              _buildTextField(
                label: 'Full Name',
                controller: _nameController,
                icon: Icons.person_outline,
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r"^[a-zA-Z\s\-'.]*")),
                ],
                validator: (value) {
                  if (value == null || value.trim().isEmpty) return 'Name is required';
                  if (value.trim().length < 2) return 'Enter a valid name';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              
              _buildTextField(
                label: 'Email Address',
                controller: _emailController,
                icon: Icons.email_outlined,
                readOnly: true,
              ),
              const SizedBox(height: 16),
              
              _buildTextField(
                label: 'Phone Number',
                controller: _phoneController,
                icon: Icons.phone_outlined,
                keyboardType: TextInputType.phone,
                prefixWidget: _buildCountryPicker(),
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'^[0-9\s\-()]*')),
                  LengthLimitingTextInputFormatter(_phoneMaxLength),
                ],
                validator: (value) {
                  if (value == null || value.trim().isEmpty) return 'Phone number is required';
                  final digits = value.replaceAll(RegExp(r'[^0-9]'), '');
                  if (digits.length < 7) return 'Enter a valid phone number';
                  return null;
                },
              ),
              const SizedBox(height: 40),
              
              // Save Button
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _saveProfile,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.secondary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  child: _isSaving
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Save Changes', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    required IconData icon,
    bool readOnly = false,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
    List<TextInputFormatter>? inputFormatters,
    Widget? prefixWidget,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey.shade700)),
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
            prefixIcon: prefixWidget ?? Icon(icon, color: readOnly ? Colors.grey.shade400 : AppColors.secondary),
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

  Widget _buildCountryPicker() {
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
          onSelect: (Country country) {
            setState(() {
              _selectedCountryCode = '+${country.phoneCode}';
              _selectedCountryFlag = country.flagEmoji;
              _phoneMaxLength = country.example.isNotEmpty ? country.example.length : 15;
              
              if (_phoneController.text.length > _phoneMaxLength) {
                _phoneController.text = _phoneController.text.substring(0, _phoneMaxLength);
              }
            });
          },
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('$_selectedCountryCode $_selectedCountryFlag', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
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
