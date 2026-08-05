import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/services/location_service.dart';

class AddressAutocompleteField extends StatefulWidget {
  final Function(Map<String, dynamic>) onSelected;
  final TextEditingController controller;
  final Function(String)? onChanged;
  final String label;

  const AddressAutocompleteField({
    super.key,
    required this.onSelected,
    required this.controller,
    this.onChanged,
    this.label = 'Street Address *',
  });

  @override
  State<AddressAutocompleteField> createState() => _AddressAutocompleteFieldState();
}

class _AddressAutocompleteFieldState extends State<AddressAutocompleteField> {
  final LocationService _locationService = LocationService();
  bool _isLoading = false;

  // FocusNode MUST be stored in State — NOT created inside build().
  // Creating a FocusNode inline (new FocusNode()) causes a brand-new node
  // on every rebuild, which Flutter interprets as "this field just got focus"
  // and steals keyboard focus away from whichever field the user is actually
  // typing in (e.g. the phone number field above this one).
  final FocusNode _focusNode = FocusNode();

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(widget.label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        const SizedBox(height: 8),
        RawAutocomplete<Map<String, dynamic>>(
          textEditingController: widget.controller,
          focusNode: _focusNode,
          optionsBuilder: (TextEditingValue textEditingValue) async {
            final query = textEditingValue.text;
            if (query.length < 3) {
              return const Iterable<Map<String, dynamic>>.empty();
            }
            if (mounted) setState(() => _isLoading = true);
            try {
              final results = await _locationService.searchAddress(query);
              return results.cast<Map<String, dynamic>>();
            } catch (e) {
              debugPrint('Autocomplete error: $e');
              return const Iterable<Map<String, dynamic>>.empty();
            } finally {
              if (mounted) setState(() => _isLoading = false);
            }
          },
          displayStringForOption: (Map<String, dynamic> option) {
            return option['display_name'] ?? '';
          },
          onSelected: widget.onSelected,
          fieldViewBuilder: (context, controller, focusNode, onFieldSubmitted) {
            return TextField(
              controller: controller,
              focusNode: focusNode,
              onChanged: widget.onChanged,
              decoration: InputDecoration(
                filled: true,
                fillColor: Colors.white,
                hintText: 'Start typing to search...',
                suffixIcon: _isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: Padding(
                          padding: EdgeInsets.all(12.0),
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      )
                    : const Icon(Icons.search, color: Colors.grey),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.red.shade900),
                ),
              ),
            );
          },
          optionsViewBuilder: (context, onSelected, options) {
            return Align(
              alignment: Alignment.topLeft,
              child: Material(
                elevation: 4,
                borderRadius: BorderRadius.circular(8),
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    maxHeight: 250,
                    maxWidth: MediaQuery.of(context).size.width - 32,
                  ),
                  child: ListView.separated(
                    padding: EdgeInsets.zero,
                    shrinkWrap: true,
                    itemCount: options.length,
                    separatorBuilder: (context, index) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final option = options.elementAt(index);
                      return ListTile(
                        leading: const Icon(Icons.location_on_outlined, color: Colors.grey),
                        title: Text(
                          option['display_name'] ?? '',
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                        ),
                        onTap: () => onSelected(option),
                      );
                    },
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}
