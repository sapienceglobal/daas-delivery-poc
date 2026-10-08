import 'dart:io';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../providers/menu_provider.dart';
import '../models/menu_model.dart';
import '../services/api_service.dart';

class AddEditMenuItemScreen extends StatefulWidget {
  final MenuItemModel? existingItem;

  const AddEditMenuItemScreen({super.key, this.existingItem});

  @override
  State<AddEditMenuItemScreen> createState() => _AddEditMenuItemScreenState();
}

class _AddEditMenuItemScreenState extends State<AddEditMenuItemScreen> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _nameController;
  late TextEditingController _priceController;
  late TextEditingController _descController;
  late TextEditingController _prepTimeController;
  late TextEditingController _imageUrlController;
  late TextEditingController _tagsController;
  late TextEditingController _sizeVariationsController;
  late TextEditingController _addOnsController;

  final _nameFocus = FocusNode();
  final _priceFocus = FocusNode();
  final _descFocus = FocusNode();
  final _prepFocus = FocusNode();
  final _imageFocus = FocusNode();
  final _tagsFocus = FocusNode();
  final _sizesFocus = FocusNode();
  final _addOnsFocus = FocusNode();

  final ScrollController _scrollController = ScrollController();

  String _selectedCategoryId = '';
  bool _isVeg = true;
  bool _isVegan = false;
  bool _isSpicy = false;
  bool _isGlutenFree = false;
  bool _isBestseller = false;
  bool _isAvailable = true;

  bool _isUploadingImage = false;
  bool _isLoading = false;
  File? _localImageFile;

  @override
  void initState() {
    super.initState();
    final item = widget.existingItem;

    _nameController = TextEditingController(text: item?.name ?? '');
    _priceController = TextEditingController(text: item != null ? item.price.toString() : '');
    _descController = TextEditingController(text: item?.description ?? '');
    _prepTimeController = TextEditingController(text: item?.prepTime ?? '');
    _imageUrlController = TextEditingController(text: item?.imageUrl ?? '');
    _tagsController = TextEditingController(text: item?.tags ?? '');
    _sizeVariationsController = TextEditingController(text: _modifiersToText(item?.sizeVariations ?? []));
    _addOnsController = TextEditingController(text: _modifiersToText(item?.addOns ?? []));

    _selectedCategoryId = item?.categoryId ?? '';
    _isVeg = item?.isVeg ?? true;
    _isVegan = item?.isVegan ?? false;
    _isSpicy = item?.isSpicy ?? false;
    _isGlutenFree = item?.isGlutenFree ?? false;
    _isBestseller = item?.isBestseller ?? false;
    _isAvailable = item?.isAvailable ?? true;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_selectedCategoryId.isEmpty) {
        final categories = context.read<MenuProvider>().categories;
        if (categories.isNotEmpty) {
          setState(() {
            _selectedCategoryId = categories.first.id;
          });
        }
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _nameController.dispose();
    _priceController.dispose();
    _descController.dispose();
    _prepTimeController.dispose();
    _imageUrlController.dispose();
    _tagsController.dispose();
    _sizeVariationsController.dispose();
    _addOnsController.dispose();

    _nameFocus.dispose();
    _priceFocus.dispose();
    _descFocus.dispose();
    _prepFocus.dispose();
    _imageFocus.dispose();
    _tagsFocus.dispose();
    _sizesFocus.dispose();
    _addOnsFocus.dispose();
    super.dispose();
  }

  String _modifiersToText(List<ItemModifier> mods) {
    return mods.map((m) => '${m.name}:${m.price}').join('\n');
  }

  List<ItemModifier> _parseModifiers(String text) {
    if (text.trim().isEmpty) return [];
    final lines = text.split('\n');
    final List<ItemModifier> result = [];
    for (var line in lines) {
      if (line.trim().isEmpty) continue;
      final parts = line.split(':');
      if (parts.length == 2) {
        final name = parts[0].trim();
        final price = double.tryParse(parts[1].trim()) ?? 0.0;
        result.add(ItemModifier(name: name, price: price));
      }
    }
    return result;
  }

  Future<void> _pickAndUploadImage() async {
    try {
      final result = await FilePicker.pickFiles(type: FileType.image);
      if (result.isNotEmpty && result.first.path != null) {
        final path = result.first.path!;
        setState(() {
          _localImageFile = File(path);
          _isUploadingImage = true;
        });

        final uploadedUrl = await ApiService.uploadImage(
          path,
          folder: 'restaurant-platform/dishes',
        );

        if (uploadedUrl != null && uploadedUrl.isNotEmpty) {
          setState(() {
            _imageUrlController.text = uploadedUrl;
          });
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Row(
                  children: const [
                    Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
                    SizedBox(width: 8),
                    Text('Dish image uploaded successfully!'),
                  ],
                ),
                backgroundColor: const Color(0xFF16A34A),
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            );
          }
        } else {
          throw Exception('Server did not return image URL');
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to upload image: $e'),
            backgroundColor: const Color(0xFFDC2626),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploadingImage = false);
    }
  }

  Future<void> _saveMenuItem() async {
    FocusScope.of(context).unfocus();

    if (_isUploadingImage) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Image is still uploading, please wait a moment...'),
          backgroundColor: Color(0xFFEA580C),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final name = _nameController.text.trim();
    final priceStr = _priceController.text.trim();

    if (name.isEmpty) {
      _nameFocus.requestFocus();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter Item Name')),
      );
      return;
    }

    if (priceStr.isEmpty || double.tryParse(priceStr) == null) {
      _priceFocus.requestFocus();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid Price')),
      );
      return;
    }

    if (_selectedCategoryId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a Category')),
      );
      return;
    }

    // If a local image was picked but upload didn't succeed earlier, attempt upload now
    if (_localImageFile != null && _imageUrlController.text.trim().isEmpty) {
      setState(() => _isUploadingImage = true);
      try {
        final uploadedUrl = await ApiService.uploadImage(
          _localImageFile!.path,
          folder: 'restaurant-platform/dishes',
        );
        if (uploadedUrl != null && uploadedUrl.isNotEmpty) {
          _imageUrlController.text = uploadedUrl;
        }
      } catch (e) {
        if (mounted) {
          final proceed = await showDialog<bool>(
            context: context,
            builder: (ctx) => AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: const Text('Image Upload Incomplete'),
              content: Text(
                'Could not upload dish photo: $e\n\nWould you like to save this item without a photo or retry?',
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx, false),
                  child: const Text('Cancel & Retry'),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEA580C)),
                  onPressed: () => Navigator.pop(ctx, true),
                  child: const Text('Save Without Photo', style: TextStyle(color: Colors.white)),
                ),
              ],
            ),
          );
          if (proceed != true) {
            setState(() => _isUploadingImage = false);
            return;
          }
        }
      } finally {
        if (mounted) setState(() => _isUploadingImage = false);
      }
    }

    setState(() => _isLoading = true);

    try {
      final newItem = MenuItemModel(
        id: widget.existingItem?.id ?? '',
        name: name,
        description: _descController.text.trim(),
        price: double.tryParse(priceStr) ?? 0.0,
        imageUrl: _imageUrlController.text.trim().isEmpty ? null : _imageUrlController.text.trim(),
        categoryId: _selectedCategoryId,
        isVeg: _isVeg,
        isVegan: _isVegan,
        isSpicy: _isSpicy,
        isGlutenFree: _isGlutenFree,
        isBestseller: _isBestseller,
        isAvailable: _isAvailable,
        prepTime: _prepTimeController.text.trim().isEmpty ? null : _prepTimeController.text.trim(),
        tags: _tagsController.text.trim().isEmpty ? null : _tagsController.text.trim(),
        sizeVariations: _parseModifiers(_sizeVariationsController.text),
        addOns: _parseModifiers(_addOnsController.text),
      );

      if (!mounted) return;
      final menuProvider = context.read<MenuProvider>();
      if (widget.existingItem == null) {
        await menuProvider.addMenuItem(newItem);
      } else {
        await menuProvider.updateMenuItem(widget.existingItem!.id, newItem);
      }

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    widget.existingItem == null
                        ? 'Menu item created successfully!'
                        : 'Menu item updated successfully!',
                    style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
            backgroundColor: const Color(0xFF16A34A),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error saving menu item: $e'),
            backgroundColor: const Color(0xFFDC2626),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // --- UI Builder Helpers (Salon Management Form Layout & Style) ---

  Widget _buildLabel(String text, {bool required = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 2),
      child: RichText(
        text: TextSpan(
          text: text,
          style: GoogleFonts.inter(
            color: const Color(0xFF1E293B),
            fontWeight: FontWeight.w600,
            fontSize: 13.5,
            letterSpacing: -0.2,
          ),
          children: [
            if (required)
              const TextSpan(
                text: ' *',
                style: TextStyle(
                  color: Color(0xFFDC2626),
                  fontWeight: FontWeight.bold,
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: const Color(0xFFF1F5F9),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFEA580C).withValues(alpha: 0.03),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.015),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF7ED),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  icon,
                  color: const Color(0xFFEA580C),
                  size: 18,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.poppins(
                        color: const Color(0xFF0F172A),
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        letterSpacing: -0.2,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: GoogleFonts.inter(
                        color: const Color(0xFF64748B),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          ...children,
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hintText,
    FocusNode? focusNode,
    IconData? prefixIcon,
    Widget? suffixIcon,
    int maxLines = 1,
    TextInputType? keyboardType,
    ValueChanged<String>? onChanged,
  }) {
    return TextFormField(
      controller: controller,
      focusNode: focusNode,
      maxLines: maxLines,
      keyboardType: keyboardType,
      onChanged: onChanged,
      scrollPadding: const EdgeInsets.only(top: 20.0, bottom: 44.0),
      cursorColor: const Color(0xFFEA580C),
      style: GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: const Color(0xFF0F172A),
      ),
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: GoogleFonts.inter(
          color: const Color(0xFF94A3B8),
          fontSize: 13.5,
          fontWeight: FontWeight.normal,
        ),
        prefixIcon: prefixIcon != null
            ? Container(
                margin: const EdgeInsets.all(8),
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF7ED),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  prefixIcon,
                  color: const Color(0xFFEA580C),
                  size: 18,
                ),
              )
            : null,
        suffixIcon: suffixIcon,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        filled: true,
        fillColor: Colors.white,
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(
            color: Color(0xFFE2E8F0),
            width: 1.2,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(
            color: Color(0xFFEA580C),
            width: 1.8,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(
            color: Color(0xFFDC2626),
            width: 1.2,
          ),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(
            color: Color(0xFFDC2626),
            width: 1.8,
          ),
        ),
      ),
    );
  }

  Widget _buildPhotoUploader() {
    final hasUrl = _imageUrlController.text.trim().isNotEmpty;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: const Color(0xFFF1F5F9),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFEA580C).withValues(alpha: 0.04),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.015),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Header Row
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF7ED),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.image_outlined,
                  color: Color(0xFFEA580C),
                  size: 18,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'Dish Photo & Media',
                          style: GoogleFonts.poppins(
                            color: const Color(0xFF0F172A),
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                            letterSpacing: -0.2,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF7ED),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFFFFEDD5)),
                          ),
                          child: Text(
                            'Optional',
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFFEA580C),
                            ),
                          ),
                        ),
                      ],
                    ),
                    Text(
                      'Upload photo from device or provide direct image URL',
                      style: GoogleFonts.inter(
                        color: const Color(0xFF64748B),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Upload Box Row (Thumbnail + Upload button)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                // Thumbnail Preview
                GestureDetector(
                  onTap: _pickAndUploadImage,
                  child: Stack(
                    children: [
                      Container(
                        width: 74,
                        height: 74,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          color: Colors.white,
                          border: Border.all(
                            color: const Color(0xFFEA580C),
                            width: 2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFEA580C).withValues(alpha: 0.18),
                              blurRadius: 10,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(14),
                          child: Builder(
                            builder: (context) {
                              if (_isUploadingImage) {
                                return const Center(
                                  child: SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.2,
                                      color: Color(0xFFEA580C),
                                    ),
                                  ),
                                );
                              }

                              if (_localImageFile != null) {
                                return Image.file(
                                  _localImageFile!,
                                  fit: BoxFit.cover,
                                  width: 74,
                                  height: 74,
                                );
                              }

                              if (hasUrl) {
                                return CachedNetworkImage(
                                  imageUrl: _imageUrlController.text.trim(),
                                  fit: BoxFit.cover,
                                  width: 74,
                                  height: 74,
                                  placeholder: (context, url) => Container(
                                    color: const Color(0xFFF1F5F9),
                                    child: const Icon(Icons.fastfood_rounded, color: Color(0xFFCBD5E1), size: 26),
                                  ),
                                  errorWidget: (context, url, error) => Container(
                                    color: const Color(0xFFF1F5F9),
                                    child: const Icon(Icons.broken_image_rounded, color: Color(0xFF94A3B8), size: 26),
                                  ),
                                );
                              }

                              return Container(
                                color: const Color(0xFFFFF7ED),
                                child: const Icon(
                                  Icons.fastfood_rounded,
                                  color: Color(0xFFEA580C),
                                  size: 30,
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: -2,
                        right: -2,
                        child: Container(
                          padding: const EdgeInsets.all(5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEA580C),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                          child: const Icon(
                            Icons.camera_alt_rounded,
                            color: Colors.white,
                            size: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 14),

                // Actions Column
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _isUploadingImage
                            ? 'Uploading dish photo...'
                            : (hasUrl || _localImageFile != null
                                ? 'Photo Ready'
                                : 'Select photo from device'),
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF1E293B),
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        'Supports JPG, PNG, WebP up to 10MB',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: const Color(0xFF64748B),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          InkWell(
                            onTap: _isUploadingImage ? null : _pickAndUploadImage,
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEA580C),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.cloud_upload_outlined, color: Colors.white, size: 14),
                                  const SizedBox(width: 4),
                                  Text(
                                    _isUploadingImage ? 'Uploading...' : 'Upload File',
                                    style: GoogleFonts.inter(
                                      color: Colors.white,
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          if (hasUrl || _localImageFile != null) ...[
                            const SizedBox(width: 8),
                            InkWell(
                              onTap: () {
                                setState(() {
                                  _localImageFile = null;
                                  _imageUrlController.clear();
                                });
                              },
                              borderRadius: BorderRadius.circular(8),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFEF2F2),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: const Color(0xFFFECACA), width: 1),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.delete_outline_rounded, color: Color(0xFFEF4444), size: 14),
                                    const SizedBox(width: 3),
                                    Text(
                                      'Remove',
                                      style: GoogleFonts.inter(
                                        color: const Color(0xFFEF4444),
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 14),

          // Direct Image URL Field (Placed right here, marked Optional)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildLabel('Direct Image URL (Optional)'),
              if (hasUrl)
                Text(
                  'Connected',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF16A34A),
                  ),
                ),
            ],
          ),
          _buildTextField(
            controller: _imageUrlController,
            focusNode: _imageFocus,
            hintText: 'https://api.lassiloungeny.com/uploads/... or paste URL',
            prefixIcon: Icons.link_rounded,
            suffixIcon: hasUrl
                ? IconButton(
                    icon: const Icon(Icons.clear_rounded, size: 18, color: Color(0xFF94A3B8)),
                    onPressed: () => setState(() => _imageUrlController.clear()),
                  )
                : null,
            onChanged: (_) => setState(() {}),
          ),
        ],
      ),
    );
  }

  // --- Category Bottom Sheet Selector ---
  Widget _buildCategorySelector(List<CategoryModel> categories) {
    final selectedCategory = categories.firstWhere(
      (c) => c.id == _selectedCategoryId,
      orElse: () => categories.isNotEmpty
          ? categories.first
          : CategoryModel(id: '', name: 'Select Category', items: []),
    );

    return InkWell(
      onTap: () => _showCategoryBottomSheet(categories),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF7ED),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.category_outlined,
                color: Color(0xFFEA580C),
                size: 18,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    selectedCategory.name.isNotEmpty ? selectedCategory.name : 'Select Category',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: selectedCategory.id.isNotEmpty
                          ? const Color(0xFF0F172A)
                          : const Color(0xFF94A3B8),
                    ),
                  ),
                  Text(
                    selectedCategory.id.isNotEmpty
                        ? '${selectedCategory.items.length} item${selectedCategory.items.length == 1 ? '' : 's'} in category'
                        : 'Choose menu section',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(
                      fontSize: 11.5,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.keyboard_arrow_down_rounded,
                color: Color(0xFF64748B),
                size: 20,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCategoryBottomSheet(List<CategoryModel> categories) {
    FocusScope.of(context).unfocus();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        String searchQuery = '';
        return StatefulBuilder(
          builder: (context, setModalState) {
            final filteredCategories = searchQuery.trim().isEmpty
                ? categories
                : categories
                    .where((c) =>
                        c.name.toLowerCase().contains(searchQuery.toLowerCase()))
                    .toList();

            return Container(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.75,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Drag handle
                  Center(
                    child: Container(
                      margin: const EdgeInsets.only(top: 12, bottom: 8),
                      width: 44,
                      height: 4.5,
                      decoration: BoxDecoration(
                        color: const Color(0xFFCBD5E1),
                        borderRadius: BorderRadius.circular(2.5),
                      ),
                    ),
                  ),

                  // Header
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF7ED),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.category_rounded,
                            color: Color(0xFFEA580C),
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Select Menu Category',
                                style: GoogleFonts.poppins(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: const Color(0xFF0F172A),
                                ),
                              ),
                              Text(
                                'Assign this item to an active catalog section',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: const Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: () => Navigator.pop(ctx),
                          icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ),

                  // Search Bar if > 4 categories
                  if (categories.length > 4)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                      child: TextField(
                        onChanged: (val) => setModalState(() => searchQuery = val),
                        decoration: InputDecoration(
                          hintText: 'Search categories...',
                          hintStyle: GoogleFonts.inter(
                            fontSize: 13,
                            color: const Color(0xFF94A3B8),
                          ),
                          prefixIcon: const Icon(Icons.search_rounded,
                              size: 18, color: Color(0xFF94A3B8)),
                          contentPadding:
                              const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          filled: true,
                          fillColor: const Color(0xFFF8FAFC),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFFEA580C)),
                          ),
                        ),
                      ),
                    ),

                  const Divider(height: 1, color: Color(0xFFF1F5F9)),

                  // Category List
                  Flexible(
                    child: filteredCategories.isEmpty
                        ? Padding(
                            padding: const EdgeInsets.all(32),
                            child: Column(
                              children: [
                                const Icon(Icons.search_off_rounded,
                                    size: 40, color: Color(0xFF94A3B8)),
                                const SizedBox(height: 8),
                                Text(
                                  'No categories found matching "$searchQuery"',
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    color: const Color(0xFF64748B),
                                  ),
                                ),
                              ],
                            ),
                          )
                        : ListView.separated(
                            shrinkWrap: true,
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            itemCount: filteredCategories.length,
                            separatorBuilder: (_, _) => const SizedBox(height: 8),
                            itemBuilder: (context, index) {
                              final cat = filteredCategories[index];
                              final isSelected = cat.id == _selectedCategoryId;

                              return InkWell(
                                onTap: () {
                                  setState(() => _selectedCategoryId = cat.id);
                                  Navigator.pop(ctx);
                                },
                                borderRadius: BorderRadius.circular(14),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 14, vertical: 12),
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? const Color(0xFFFFF7ED)
                                        : const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(
                                      color: isSelected
                                          ? const Color(0xFFEA580C)
                                          : const Color(0xFFE2E8F0),
                                      width: isSelected ? 1.6 : 1,
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: isSelected
                                              ? const Color(0xFFEA580C)
                                              : Colors.white,
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(
                                          Icons.fastfood_rounded,
                                          size: 16,
                                          color: isSelected
                                              ? Colors.white
                                              : const Color(0xFF64748B),
                                        ),
                                      ),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              cat.name,
                                              style: GoogleFonts.inter(
                                                fontSize: 14,
                                                fontWeight: isSelected
                                                    ? FontWeight.bold
                                                    : FontWeight.w600,
                                                color: isSelected
                                                    ? const Color(0xFFEA580C)
                                                    : const Color(0xFF0F172A),
                                              ),
                                            ),
                                            Text(
                                              '${cat.items.length} dish${cat.items.length == 1 ? '' : 'es'} in catalog',
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: GoogleFonts.inter(
                                                fontSize: 11.5,
                                                color: const Color(0xFF64748B),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      if (isSelected)
                                        const Icon(
                                          Icons.check_circle_rounded,
                                          color: Color(0xFFEA580C),
                                          size: 20,
                                        ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                  ),

                  // Bottom padding safe area (protects against Android 3 navigation buttons)
                  SizedBox(
                    height: math.max(
                          MediaQuery.of(ctx).padding.bottom,
                          MediaQuery.of(ctx).viewPadding.bottom,
                        ) + 16,
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  // --- Prep Time Quick Bottom Sheet ---
  void _showPrepTimeBottomSheet() {
    FocusScope.of(context).unfocus();
    final times = ['5 min', '10 min', '15 min', '20 min', '25 min', '30 min', '40 min', '45 min', '60 min'];
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 44,
                height: 4.5,
                decoration: BoxDecoration(
                  color: const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(2.5),
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF7ED),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.timer_outlined, color: Color(0xFFEA580C), size: 18),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'Select Typical Prep Time',
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: times.map((t) {
                  final isSelected = _prepTimeController.text.trim().toLowerCase() == t.toLowerCase();
                  return InkWell(
                    onTap: () {
                      setState(() => _prepTimeController.text = t);
                      Navigator.pop(ctx);
                    },
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: isSelected ? const Color(0xFFEA580C) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isSelected ? const Color(0xFFEA580C) : const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: Text(
                        t,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: isSelected ? Colors.white : const Color(0xFF1E293B),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              SizedBox(
                height: math.max(
                      MediaQuery.of(ctx).padding.bottom,
                      MediaQuery.of(ctx).viewPadding.bottom,
                    ) + 16,
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDietarySelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildLabel('Dietary Classification', required: true),
        Row(
          children: [
            // Vegetarian Option
            Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _isVeg = true),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: _isVeg ? const Color(0xFFDCFCE7) : Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: _isVeg ? const Color(0xFF16A34A) : const Color(0xFFE2E8F0),
                      width: _isVeg ? 1.6 : 1.2,
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.eco_rounded,
                        size: 18,
                        color: _isVeg ? const Color(0xFF16A34A) : const Color(0xFF64748B),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Vegetarian',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: _isVeg ? FontWeight.w700 : FontWeight.w500,
                          color: _isVeg ? const Color(0xFF16A34A) : const Color(0xFF475569),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),

            // Non-Vegetarian Option
            Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _isVeg = false),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: !_isVeg ? const Color(0xFFFEE2E2) : Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: !_isVeg ? const Color(0xFFDC2626) : const Color(0xFFE2E8F0),
                      width: !_isVeg ? 1.6 : 1.2,
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.restaurant_rounded,
                        size: 18,
                        color: !_isVeg ? const Color(0xFFDC2626) : const Color(0xFF64748B),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Non-Veg',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: !_isVeg ? FontWeight.w700 : FontWeight.w500,
                          color: !_isVeg ? const Color(0xFFDC2626) : const Color(0xFF475569),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildPropertyToggleTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
      decoration: BoxDecoration(
        color: value ? iconBg.withValues(alpha: 0.25) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: value ? iconColor.withValues(alpha: 0.4) : const Color(0xFFE2E8F0),
          width: value ? 1.4 : 1.0,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: iconColor, size: 17),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.w600,
                    fontSize: 13.5,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                Text(
                  subtitle,
                  style: GoogleFonts.inter(
                    fontSize: 11.5,
                    color: const Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
          Transform.scale(
            scale: 0.8,
            child: Switch(
              value: value,
              activeThumbColor: iconColor,
              activeTrackColor: iconBg,
              inactiveThumbColor: const Color(0xFF94A3B8),
              inactiveTrackColor: const Color(0xFFE2E8F0),
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              onChanged: onChanged,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.existingItem != null;
    final categories = context.watch<MenuProvider>().categories;
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final hasKeyboard = bottomInset > 50;

    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFC),
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: Center(
          child: InkWell(
            onTap: () => Navigator.pop(context),
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF7ED),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFFEDD5)),
              ),
              child: const Icon(
                Icons.arrow_back_ios_new_rounded,
                color: Color(0xFFEA580C),
                size: 16,
              ),
            ),
          ),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              isEditing ? 'Edit Menu Item' : 'Add Menu Item',
              style: GoogleFonts.poppins(
                color: const Color(0xFF0F172A),
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            Text(
              'Lassi Lounge Catalog & Inventory',
              style: GoogleFonts.inter(
                color: const Color(0xFFEA580C),
                fontWeight: FontWeight.w600,
                fontSize: 11.5,
              ),
            ),
          ],
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            color: const Color(0xFFF1F5F9),
            height: 1,
          ),
        ),
      ),
      body: SafeArea(
        top: false,
        bottom: false,
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                controller: _scrollController,
                keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.manual,
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
                child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Dish Photo Uploader Card (includes unified optional Image URL field)
                    _buildPhotoUploader(),
                    const SizedBox(height: 16),

                    // Section 1: Basic Information
                    _buildSectionCard(
                      title: 'Basic Information',
                      subtitle: 'Item title, category, description & pricing',
                      icon: Icons.restaurant_menu_rounded,
                      children: [
                        _buildLabel('Item Name', required: true),
                        _buildTextField(
                          controller: _nameController,
                          focusNode: _nameFocus,
                          hintText: 'e.g. Mango Mastani Lassi',
                          prefixIcon: Icons.fastfood_outlined,
                        ),
                        const SizedBox(height: 16),

                        _buildLabel('Category', required: true),
                        _buildCategorySelector(categories),
                        const SizedBox(height: 16),

                        _buildLabel('Description (Optional)'),
                        _buildTextField(
                          controller: _descController,
                          focusNode: _descFocus,
                          hintText: 'Describe flavors, rich ingredients, and special highlights...',
                          prefixIcon: Icons.notes_rounded,
                          maxLines: 3,
                        ),
                        const SizedBox(height: 16),

                        // Price & Prep Time side-by-side
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _buildLabel('Base Price (\$)', required: true),
                                  _buildTextField(
                                    controller: _priceController,
                                    focusNode: _priceFocus,
                                    hintText: '4.99',
                                    prefixIcon: Icons.attach_money_rounded,
                                    keyboardType:
                                        const TextInputType.numberWithOptions(decimal: true),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _buildLabel('Prep Time'),
                                  _buildTextField(
                                    controller: _prepTimeController,
                                    focusNode: _prepFocus,
                                    hintText: 'e.g. 15 min',
                                    prefixIcon: Icons.timer_outlined,
                                    suffixIcon: IconButton(
                                      icon: const Icon(Icons.arrow_drop_down_rounded,
                                          color: Color(0xFF64748B), size: 24),
                                      onPressed: _showPrepTimeBottomSheet,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Section 2: Search & Discovery Tags
                    _buildSectionCard(
                      title: 'Search & Discovery Tags',
                      subtitle: 'Keywords that help customers discover this dish in search',
                      icon: Icons.tag_rounded,
                      children: [
                        _buildLabel('Search Tags (Optional)'),
                        _buildTextField(
                          controller: _tagsController,
                          focusNode: _tagsFocus,
                          hintText: 'e.g. popular, sweet, kesar, summer, bestseller',
                          prefixIcon: Icons.search_rounded,
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Separate tags with commas or spaces to boost visibility in customer searches',
                          style: GoogleFonts.inter(
                            fontSize: 11.5,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Section 3: Dietary & Menu Flags
                    _buildSectionCard(
                      title: 'Dietary & Menu Flags',
                      subtitle: 'Dietary classification, badges and instant stock status',
                      icon: Icons.eco_rounded,
                      children: [
                        _buildDietarySelector(),
                        const SizedBox(height: 18),

                        _buildPropertyToggleTile(
                          title: 'Bestseller Ribbon',
                          subtitle: 'Highlight this item prominently in top recommendations',
                          icon: Icons.star_rounded,
                          iconColor: const Color(0xFFD97706),
                          iconBg: const Color(0xFFFEF3C7),
                          value: _isBestseller,
                          onChanged: (val) => setState(() => _isBestseller = val),
                        ),
                        _buildPropertyToggleTile(
                          title: 'Spicy Note',
                          subtitle: 'Mark spicy taste icon for spice-sensitive customers',
                          icon: Icons.local_fire_department_rounded,
                          iconColor: const Color(0xFFDC2626),
                          iconBg: const Color(0xFFFEE2E2),
                          value: _isSpicy,
                          onChanged: (val) => setState(() => _isSpicy = val),
                        ),
                        _buildPropertyToggleTile(
                          title: '100% Vegan',
                          subtitle: 'Plant-based recipe containing zero milk or dairy',
                          icon: Icons.grass_rounded,
                          iconColor: const Color(0xFF059669),
                          iconBg: const Color(0xFFD1FAE5),
                          value: _isVegan,
                          onChanged: (val) => setState(() => _isVegan = val),
                        ),
                        _buildPropertyToggleTile(
                          title: 'Gluten Free',
                          subtitle: 'Completely safe for customers with gluten intolerance',
                          icon: Icons.grain_rounded,
                          iconColor: const Color(0xFF7C3AED),
                          iconBg: const Color(0xFFEDE9FE),
                          value: _isGlutenFree,
                          onChanged: (val) => setState(() => _isGlutenFree = val),
                        ),
                        _buildPropertyToggleTile(
                          title: 'Currently Available',
                          subtitle: 'Enable or disable customer ordering in real time',
                          icon: Icons.check_circle_rounded,
                          iconColor: const Color(0xFF16A34A),
                          iconBg: const Color(0xFFDCFCE7),
                          value: _isAvailable,
                          onChanged: (val) => setState(() => _isAvailable = val),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Section 4: Customizations & Modifiers
                    _buildSectionCard(
                      title: 'Customizations & Modifiers',
                      subtitle: 'Portion sizes, toppings and extra add-ons',
                      icon: Icons.tune_rounded,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF7ED),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFFFEDD5)),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.info_outline_rounded,
                                  color: Color(0xFFEA580C), size: 18),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Enter each option on a new line in Name:Price format.\nExample:\nRegular:4.99\nLarge:6.99',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    height: 1.4,
                                    color: const Color(0xFF7C2D12),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 14),

                        _buildLabel('Size Variations'),
                        _buildTextField(
                          controller: _sizeVariationsController,
                          focusNode: _sizesFocus,
                          hintText: 'Small:3.99\nMedium:4.99\nLarge:6.49',
                          prefixIcon: Icons.format_size_rounded,
                          maxLines: 3,
                        ),
                        const SizedBox(height: 16),

                        _buildLabel('Add-ons & Extras'),
                        _buildTextField(
                          controller: _addOnsController,
                          focusNode: _addOnsFocus,
                          hintText: 'Extra Malai:1.00\nDry Fruits:1.50\nKesar Syrup:0.75',
                          prefixIcon: Icons.add_circle_outline_rounded,
                          maxLines: 3,
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ),

          // Bottom Action Bar
          Container(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: hasKeyboard ? 10 : 14,
              bottom: (hasKeyboard ? 8 : 14) +
                  math.max(
                    MediaQuery.of(context).padding.bottom,
                    MediaQuery.of(context).viewPadding.bottom,
                  ),
            ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: const Border(
                    top: BorderSide(
                      color: Color(0xFFF1F5F9),
                      width: 1,
                    ),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.06),
                      blurRadius: 16,
                      offset: const Offset(0, -4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    // Action 1: Done/Hide Keyboard (when keyboard active) or Cancel (when keyboard closed)
                    Expanded(
                      flex: 2,
                      child: OutlinedButton(
                        onPressed: () {
                          if (hasKeyboard) {
                            FocusScope.of(context).unfocus();
                          } else {
                            Navigator.pop(context);
                          }
                        },
                        style: OutlinedButton.styleFrom(
                          backgroundColor: hasKeyboard ? const Color(0xFFF1F5F9) : const Color(0xFFF8FAFC),
                          side: BorderSide(color: hasKeyboard ? const Color(0xFFCBD5E1) : const Color(0xFFE2E8F0)),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            if (hasKeyboard) ...[
                              const Icon(Icons.keyboard_hide_rounded, size: 18, color: Color(0xFF475569)),
                              const SizedBox(width: 6),
                            ],
                            Text(
                              hasKeyboard ? 'Done' : 'Cancel',
                              style: GoogleFonts.inter(
                                color: const Color(0xFF475569),
                                fontWeight: FontWeight.w600,
                                fontSize: 14.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),

                    // Save / Update button
                    Expanded(
                      flex: 3,
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [
                              Color(0xFFEA580C),
                              Color(0xFFDC2626),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFEA580C).withValues(alpha: 0.35),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _saveMenuItem,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.transparent,
                            shadowColor: Colors.transparent,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(
                                      Icons.check_circle_rounded,
                                      color: Colors.white,
                                      size: 18,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      isEditing ? 'Update Menu Item' : 'Save Menu Item',
                                      style: GoogleFonts.inter(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 15,
                                      ),
                                    ),
                                  ],
                                ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
