import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:single_restaurant_mobile/utils/restaurant_schedule_utils.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';

class TimeSlotPickerSheet extends StatelessWidget {
  final DateTime selectedDate;
  final TimeOfDay? selectedTime;
  final Map<String, dynamic>? restaurant;
  final ValueChanged<TimeOfDay> onTimeSelected;
  final VoidCallback onChangeDate;

  const TimeSlotPickerSheet({
    super.key,
    required this.selectedDate,
    required this.selectedTime,
    required this.restaurant,
    required this.onTimeSelected,
    required this.onChangeDate,
  });

  @override
  Widget build(BuildContext context) {
    final schedule = RestaurantScheduleUtils.getScheduleForDate(restaurant, selectedDate);
    final isToday = RestaurantScheduleUtils.isToday(selectedDate, restaurant);
    final allSlots = RestaurantScheduleUtils.generateSlots(schedule);
    final grouped = RestaurantScheduleUtils.groupSlots(allSlots);
    final earliestAvailable = RestaurantScheduleUtils.getEarliestAvailableSlot(selectedDate, restaurant);
    final isAllTodaySlotsPassed = isToday && earliestAvailable == null;
    final currentNyTimeStr = RestaurantScheduleUtils.getFormattedCurrentRestaurantTime(restaurant);

    final dateFormatted = DateFormat('EEEE, MMM d, yyyy').format(selectedDate);

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.88,
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
              width: 44,
              height: 4,
              margin: const EdgeInsets.only(top: 10, bottom: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFCBD5E1),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 6, 16, 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Select Reservation Time',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 3),
                      Wrap(
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: 8,
                        runSpacing: 4,
                        children: [
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.calendar_today_outlined, size: 12.5, color: Color(0xFF64748B)),
                              const SizedBox(width: 4),
                              Text(
                                dateFormatted,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF64748B),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF2F2),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: const Color(0xFFFECDD3), width: 0.8),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.schedule, size: 11, color: Color(0xFF7A0B10)),
                                const SizedBox(width: 3.5),
                                Text(
                                  'NY Time: $currentNyTimeStr',
                                  style: const TextStyle(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF7A0B10),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Color(0xFF64748B)),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),

          const Divider(height: 1, color: Color(0xFFF1F5F9)),

          // Scrollable Body
          Flexible(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              children: [
                // Schedule Info Banner
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: schedule.isClosed
                        ? const Color(0xFFFEF2F2)
                        : (isAllTodaySlotsPassed ? const Color(0xFFFFFBEB) : const Color(0xFFF8FAFC)),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: schedule.isClosed
                          ? const Color(0xFFFECDD3)
                          : (isAllTodaySlotsPassed ? const Color(0xFFFDE68A) : const Color(0xFFE2E8F0)),
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        schedule.isClosed
                            ? Icons.cancel_outlined
                            : (isAllTodaySlotsPassed ? Icons.schedule_outlined : Icons.access_time_filled),
                        size: 20,
                        color: schedule.isClosed
                            ? const Color(0xFFDC2626)
                            : (isAllTodaySlotsPassed ? const Color(0xFFD97706) : const Color(0xFF7A0B10)),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              schedule.isClosed
                                  ? 'Restaurant is Closed on this Day'
                                  : (isAllTodaySlotsPassed
                                      ? 'Bookings Closed for Today'
                                      : 'Operating Hours: ${schedule.openStr} – ${schedule.closeStr}'),
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: schedule.isClosed
                                    ? const Color(0xFFDC2626)
                                    : (isAllTodaySlotsPassed ? const Color(0xFFB45309) : const Color(0xFF0F172A)),
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              schedule.isClosed
                                  ? 'Please change the date to select an available time.'
                                  : (isAllTodaySlotsPassed
                                      ? 'The last booking slot was at ${schedule.lastBookingStr} (30 mins before closing). Please pick a future date.'
                                      : 'Last table booking is accepted at ${schedule.lastBookingStr} (30 mins before closing).'),
                              style: TextStyle(
                                fontSize: 11.5,
                                color: schedule.isClosed
                                    ? const Color(0xFF991B1B)
                                    : (isAllTodaySlotsPassed ? const Color(0xFF92400E) : const Color(0xFF64748B)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // If Closed
                if (schedule.isClosed)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 24.0),
                    child: Center(
                      child: Column(
                        children: [
                          const Icon(Icons.event_busy, size: 48, color: Color(0xFFCBD5E1)),
                          const SizedBox(height: 12),
                          const Text(
                            'No time slots on closed days',
                            style: TextStyle(fontSize: 14, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF7A0B10),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                            ),
                            onPressed: onChangeDate,
                            icon: const Icon(Icons.calendar_month, size: 18),
                            label: const Text('Choose Another Date', style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ),
                  )
                // If all slots today have passed
                else if (isAllTodaySlotsPassed)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 24.0),
                    child: Center(
                      child: Column(
                        children: [
                          const Icon(Icons.history_toggle_off, size: 48, color: Color(0xFFFBBF24)),
                          const SizedBox(height: 12),
                          const Text(
                            'All time slots for today have ended',
                            style: TextStyle(fontSize: 14, color: Color(0xFF475569), fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF7A0B10),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                            ),
                            onPressed: onChangeDate,
                            icon: const Icon(Icons.arrow_forward_rounded, size: 18),
                            label: const Text('Book for Tomorrow or Future Date', style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ),
                  )
                // Normal Slots list
                else ...[
                  ...grouped.entries.map((entry) {
                    final category = entry.key;
                    final slots = entry.value;

                    IconData categoryIcon = Icons.wb_sunny_outlined;
                    if (category == 'Afternoon') categoryIcon = Icons.coffee_outlined;
                    if (category == 'Dinner') categoryIcon = Icons.nights_stay_outlined;

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8.0),
                          child: Row(
                            children: [
                              Icon(categoryIcon, size: 16, color: const Color(0xFF7A0B10)),
                              const SizedBox(width: 6),
                              Text(
                                category,
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                            ],
                          ),
                        ),
                        GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: MediaQuery.of(context).size.width < 360 ? 2 : 3,
                            childAspectRatio: MediaQuery.of(context).size.width < 360 ? 2.5 : 2.2,
                            crossAxisSpacing: 10,
                            mainAxisSpacing: 10,
                          ),
                          itemCount: slots.length,
                          itemBuilder: (ctx, idx) {
                            final slot = slots[idx];
                            final isAvailable = RestaurantScheduleUtils.isSlotAvailable(slot, selectedDate, restaurant);
                            final isSelected = selectedTime != null &&
                                selectedTime!.hour == slot.hour &&
                                selectedTime!.minute == slot.minute;

                            return InkWell(
                              onTap: !isAvailable
                                  ? null
                                  : () {
                                      onTimeSelected(slot);
                                      Navigator.pop(context);
                                    },
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? const Color(0xFF7A0B10)
                                      : (!isAvailable ? const Color(0xFFF1F5F9) : Colors.white),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isSelected
                                        ? const Color(0xFF7A0B10)
                                        : (!isAvailable ? const Color(0xFFE2E8F0) : const Color(0xFFCBD5E1)),
                                    width: isSelected ? 1.5 : 1.0,
                                  ),
                                  boxShadow: isSelected
                                      ? [
                                          BoxShadow(
                                            color: const Color(0xFF7A0B10).withValues(alpha: 0.25),
                                            blurRadius: 6,
                                            offset: const Offset(0, 2),
                                          )
                                        ]
                                      : null,
                                ),
                                alignment: Alignment.center,
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      RestaurantScheduleUtils.formatTimeOfDay(slot),
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                        color: isSelected
                                            ? Colors.white
                                            : (!isAvailable ? const Color(0xFF94A3B8) : const Color(0xFF1E293B)),
                                        decoration: !isAvailable ? TextDecoration.lineThrough : null,
                                      ),
                                    ),
                                    if (!isAvailable)
                                      const Text(
                                        'Passed',
                                        style: TextStyle(
                                          fontSize: 9.5,
                                          color: Color(0xFF94A3B8),
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                        const SizedBox(height: 12),
                      ],
                    );
                  }),
                  const SizedBox(height: 8),
                ],
              ],
            ),
          ),

          // Pinned Bottom Action Bar for Custom Time (Always visible, responsive, and above 3-button nav)
          if (!schedule.isClosed && !isAllTodaySlotsPassed)
            _buildCustomTimeButton(context, schedule, earliestAvailable)
          else
            const SafeArea(
              top: false,
              bottom: true,
              child: SizedBox(height: 12),
            ),
        ],
      ),
    );
  }

  Widget _buildCustomTimeButton(
    BuildContext context,
    RestaurantDaySchedule schedule,
    TimeOfDay? earliestAvailable,
  ) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        border: const Border(
          top: BorderSide(color: Color(0xFFF1F5F9), width: 1.0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
      child: SafeArea(
        top: false,
        bottom: true,
        minimum: const EdgeInsets.only(bottom: 6),
        child: InkWell(
          onTap: () async {
            final picked = await showTimePicker(
              context: context,
              initialTime: selectedTime ?? earliestAvailable ?? schedule.openTime,
              builder: (ctx, child) {
                return Theme(
                  data: Theme.of(context).copyWith(
                    colorScheme: const ColorScheme.light(
                      primary: Color(0xFF7A0B10),
                      onPrimary: Colors.white,
                      onSurface: Color(0xFF0F172A),
                    ),
                  ),
                  child: child!,
                );
              },
            );

            if (picked != null) {
              final err = RestaurantScheduleUtils.validateReservation(
                selectedDate,
                picked,
                restaurant,
              );

              if (err != null) {
                if (context.mounted) {
                  ToastUtils.showError(context, err);
                }
              } else {
                onTimeSelected(picked);
                if (context.mounted) {
                  Navigator.pop(context);
                  ToastUtils.showSuccess(
                    context,
                    'Selected ${RestaurantScheduleUtils.formatTimeOfDay(picked)}',
                  );
                }
              }
            }
          },
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.tune_rounded, size: 18, color: Color(0xFF7A0B10)),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    'Pick Custom Time (${schedule.openStr} - ${schedule.lastBookingStr})',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF0F172A),
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
