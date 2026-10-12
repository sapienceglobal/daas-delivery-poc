import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/theme/app_spacing.dart';
import 'package:single_restaurant_mobile/widgets/common/app_bottom_sheet.dart';
import 'package:single_restaurant_mobile/utils/restaurant_schedule_utils.dart';

class BookTableForm extends StatelessWidget {
  final DateTime? selectedDate;
  final TimeOfDay? selectedTime;
  final int guests;
  final TextEditingController specialRequestController;
  final VoidCallback onSelectDate;
  final VoidCallback onSelectTime;
  final ValueChanged<int> onGuestsChanged;
  final Map<String, dynamic>? restaurant;

  const BookTableForm({
    super.key,
    required this.selectedDate,
    required this.selectedTime,
    required this.guests,
    required this.specialRequestController,
    required this.onSelectDate,
    required this.onSelectTime,
    required this.onGuestsChanged,
    this.restaurant,
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
                selectedTime != null
                    ? RestaurantScheduleUtils.formatTimeOfDay(selectedTime!)
                    : 'Select Time',
                Icons.access_time,
                onSelectTime,
              ),
            ),
          ],
        ),
        if (selectedDate != null) ...[
          const SizedBox(height: 8),
          _buildScheduleBadge(selectedDate!, restaurant),
        ],
        const SizedBox(height: 12),
        _buildDropdownField(
          'Number of Guests',
          '$guests Guests',
          Icons.people_alt_outlined,
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
                  'Special Request (Optional)\nE.g. Birthday celebration, high chair, etc.',
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
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
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

  Widget _buildScheduleBadge(DateTime date, Map<String, dynamic>? restaurant) {
    final schedule = RestaurantScheduleUtils.getScheduleForDate(restaurant, date);
    final isToday = RestaurantScheduleUtils.isToday(date, restaurant);
    final earliestAvailable = RestaurantScheduleUtils.getEarliestAvailableSlot(date, restaurant);
    final isAllTodaySlotsPassed = isToday && earliestAvailable == null;
    final tzAbbr = RestaurantScheduleUtils.getTimezoneAbbreviation(restaurant);

    if (schedule.isClosed) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFFFEF2F2),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFFECDD3)),
        ),
        child: const Row(
          children: [
            Icon(Icons.event_busy, size: 15, color: Color(0xFFDC2626)),
            SizedBox(width: 8),
            Expanded(
              child: Text(
                'Restaurant is closed on this date. Please pick another date.',
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF991B1B),
                ),
              ),
            ),
          ],
        ),
      );
    }

    if (isAllTodaySlotsPassed) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFFFFFBEB),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFFDE68A)),
        ),
        child: Row(
          children: [
            const Icon(Icons.history_toggle_off, size: 15, color: Color(0xFFD97706)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Today\'s bookings ended in NY (last slot was ${schedule.lastBookingStr}). Pick tomorrow.',
                style: const TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF92400E),
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          const Icon(Icons.access_time_filled, size: 15, color: Color(0xFF7A0B10)),
          const SizedBox(width: 8),
          Expanded(
            child: RichText(
              text: TextSpan(
                style: const TextStyle(fontSize: 11.5, color: Color(0xFF475569)),
                children: [
                  const TextSpan(text: 'Hours (NY): ', style: TextStyle(fontWeight: FontWeight.w600)),
                  TextSpan(text: '${schedule.openStr} – ${schedule.closeStr}  •  '),
                  const TextSpan(
                    text: 'Last: ',
                    style: TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF7A0B10)),
                  ),
                  TextSpan(
                    text: '${schedule.lastBookingStr} $tzAbbr',
                    style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF7A0B10)),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
