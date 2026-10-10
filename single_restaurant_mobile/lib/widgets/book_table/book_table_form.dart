import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/theme/app_spacing.dart';
import 'package:single_restaurant_mobile/widgets/common/app_bottom_sheet.dart';

class BookTableForm extends StatelessWidget {
  final DateTime? selectedDate;
  final TimeOfDay? selectedTime;
  final int guests;
  final String selectedArea;
  final List<String> areas;
  final TextEditingController specialRequestController;
  final VoidCallback onSelectDate;
  final VoidCallback onSelectTime;
  final ValueChanged<int> onGuestsChanged;
  final ValueChanged<String> onAreaChanged;

  const BookTableForm({
    super.key,
    required this.selectedDate,
    required this.selectedTime,
    required this.guests,
    required this.selectedArea,
    required this.areas,
    required this.specialRequestController,
    required this.onSelectDate,
    required this.onSelectTime,
    required this.onGuestsChanged,
    required this.onAreaChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildDropdownField(
                'Date',
                selectedDate != null
                    ? DateFormat('dd MMM yyyy').format(selectedDate!)
                    : 'Select Date',
                Icons.calendar_month,
                onSelectDate,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildDropdownField(
                'Time',
                selectedTime != null ? selectedTime!.format(context) : 'Select Time',
                Icons.access_time,
                onSelectTime,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildDropdownField(
                'Number of Guests',
                '$guests Guests',
                Icons.person_outline,
                () {
                  AppBottomSheet.show(
                    context: context,
                    builder: (sheetCtx) => AppBottomSheet(
                      title: 'Number of Guests',
                      child: ListView.separated(
                        shrinkWrap: true,
                        itemCount: 20,
                        separatorBuilder: (_, index) => const Divider(height: 1),
                        itemBuilder: (c, i) {
                          final guestCount = i + 1;
                          final isSelected = guests == guestCount;
                          return ListTile(
                            title: Text(
                              '$guestCount Guests',
                              style: TextStyle(
                                fontWeight:
                                    isSelected ? FontWeight.bold : FontWeight.normal,
                                color: isSelected
                                    ? AppColors.secondary
                                    : AppColors.textDark,
                              ),
                            ),
                            trailing: isSelected
                                ? const Icon(Icons.check_circle_rounded,
                                    color: AppColors.secondary)
                                : null,
                            contentPadding:
                                const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
                            onTap: () {
                              onGuestsChanged(guestCount);
                              Navigator.pop(sheetCtx);
                            },
                          );
                        },
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildDropdownField(
                'Preferred Area (Optional)',
                selectedArea,
                Icons.table_restaurant_outlined,
                () {
                  AppBottomSheet.show(
                    context: context,
                    builder: (sheetCtx) => AppBottomSheet(
                      title: 'Preferred Area',
                      child: ListView.separated(
                        shrinkWrap: true,
                        itemCount: areas.length,
                        separatorBuilder: (_, index) => const Divider(height: 1),
                        itemBuilder: (c, i) {
                          final area = areas[i];
                          final isSelected = selectedArea == area;
                          return ListTile(
                            title: Text(
                              area,
                              style: TextStyle(
                                fontWeight:
                                    isSelected ? FontWeight.bold : FontWeight.normal,
                                color: isSelected
                                    ? AppColors.secondary
                                    : AppColors.textDark,
                              ),
                            ),
                            trailing: isSelected
                                ? const Icon(Icons.check_circle_rounded,
                                    color: AppColors.secondary)
                                : null,
                            contentPadding:
                                const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
                            onTap: () {
                              onAreaChanged(area);
                              Navigator.pop(sheetCtx);
                            },
                          );
                        },
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey.shade200),
            borderRadius: BorderRadius.circular(12),
            color: Colors.white,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: TextField(
            controller: specialRequestController,
            maxLines: 2,
            maxLength: 150,
            decoration: const InputDecoration(
              border: InputBorder.none,
              hintText:
                  'Special Request (Optional)\nE.g. Birthday celebration, window seat, etc.',
              hintStyle: TextStyle(color: Colors.grey, fontSize: 13),
              counterText: '',
            ),
            style: const TextStyle(fontSize: 14),
          ),
        ),
        Align(
          alignment: Alignment.centerRight,
          child: Padding(
            padding: const EdgeInsets.only(top: 4, right: 8),
            child: Text(
              '${specialRequestController.text.length}/150',
              style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdownField(
    String label,
    String value,
    IconData icon,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade200),
          borderRadius: BorderRadius.circular(12),
          color: Colors.white,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 16, color: Colors.red.shade900),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    label,
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 11),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    value,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                ),
                Icon(Icons.keyboard_arrow_down, color: Colors.grey.shade600, size: 18),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
