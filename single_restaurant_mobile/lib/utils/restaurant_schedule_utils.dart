import 'package:flutter/material.dart';
import 'package:timezone/data/latest.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;
import 'package:single_restaurant_mobile/utils/time_utils.dart';

/// Represents operating schedule and table booking boundaries for a single day.
class RestaurantDaySchedule {
  final String dayName;
  final bool isClosed;
  final TimeOfDay openTime;
  final TimeOfDay closeTime;
  final TimeOfDay lastBookingTime; // Exactly 30 minutes before closeTime
  final String openStr;
  final String closeStr;
  final String lastBookingStr;

  RestaurantDaySchedule({
    required this.dayName,
    required this.isClosed,
    required this.openTime,
    required this.closeTime,
    required this.lastBookingTime,
    required this.openStr,
    required this.closeStr,
    required this.lastBookingStr,
  });

  int get openMinutes => openTime.hour * 60 + openTime.minute;
  int get closeMinutes => closeTime.hour * 60 + closeTime.minute;
  int get lastBookingMinutes => lastBookingTime.hour * 60 + lastBookingTime.minute;
}

class RestaurantScheduleUtils {
  static const List<String> weekDays = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  static bool _timezoneInitialized = false;

  /// Ensures the timezone database is loaded
  static void ensureTimezoneInitialized() {
    if (_timezoneInitialized) return;
    try {
      if (tz.timeZoneDatabase.locations.isEmpty) {
        tz_data.initializeTimeZones();
      }
      _timezoneInitialized = true;
    } catch (_) {
      try {
        tz_data.initializeTimeZones();
        _timezoneInitialized = true;
      } catch (_) {}
    }
  }

  /// Determines the IANA timezone of the restaurant (defaults to 'America/New_York')
  static String getRestaurantTimezone([Map<String, dynamic>? restaurant]) {
    if (restaurant != null) {
      final raw = restaurant['timezone']?.toString().trim();
      if (raw != null && raw.isNotEmpty) {
        return TimeUtils.mapTimezone(raw);
      }
    }
    return 'America/New_York';
  }

  /// Gets current time in the restaurant's local timezone (New York time)
  static tz.TZDateTime getNowInRestaurantTimezone([Map<String, dynamic>? restaurant]) {
    ensureTimezoneInitialized();
    final tzName = getRestaurantTimezone(restaurant);
    try {
      final loc = tz.getLocation(tzName);
      return tz.TZDateTime.now(loc);
    } catch (_) {
      try {
        return tz.TZDateTime.now(tz.getLocation('America/New_York'));
      } catch (_) {
        return tz.TZDateTime.now(tz.local);
      }
    }
  }

  /// Gets today's date in restaurant local time (New York date)
  static DateTime getTodayInRestaurantTimezone([Map<String, dynamic>? restaurant]) {
    final nowNy = getNowInRestaurantTimezone(restaurant);
    return DateTime(nowNy.year, nowNy.month, nowNy.day);
  }

  /// Timezone abbreviation e.g. "EDT" or "EST"
  static String getTimezoneAbbreviation([Map<String, dynamic>? restaurant]) {
    final nowNy = getNowInRestaurantTimezone(restaurant);
    return nowNy.timeZoneName.isNotEmpty ? nowNy.timeZoneName : 'EDT';
  }

  /// Formatted current time in restaurant e.g. "11:45 AM EDT"
  static String getFormattedCurrentRestaurantTime([Map<String, dynamic>? restaurant]) {
    final nowNy = getNowInRestaurantTimezone(restaurant);
    final tod = TimeOfDay(hour: nowNy.hour, minute: nowNy.minute);
    return '${formatTimeOfDay(tod)} ${nowNy.timeZoneName}';
  }

  /// Extracts the day's operating hours from restaurant data, calculating
  /// opening time, closing time, and last booking time (closing - 30 minutes).
  static RestaurantDaySchedule getScheduleForDate(
    Map<String, dynamic>? restaurant,
    DateTime date,
  ) {
    final dayKey = weekDays[(date.weekday - 1).clamp(0, 6)];

    bool isClosed = false;
    String openStr = '11:00';
    String closeStr = '22:00';

    if (restaurant != null) {
      final opHours = restaurant['operatingHours'];
      if (opHours is Map) {
        final dayData = opHours[dayKey];
        if (dayData is Map) {
          isClosed = dayData['isClosed'] == true;
          if (dayData['open'] != null && dayData['open'].toString().trim().isNotEmpty) {
            openStr = dayData['open'].toString().trim();
          }
          if (dayData['close'] != null && dayData['close'].toString().trim().isNotEmpty) {
            closeStr = dayData['close'].toString().trim();
          }
        }
      } else {
        if (restaurant['openTime'] != null &&
            restaurant['openTime'].toString().trim().isNotEmpty) {
          openStr = restaurant['openTime'].toString().trim();
        }
        if (restaurant['closeTime'] != null &&
            restaurant['closeTime'].toString().trim().isNotEmpty) {
          closeStr = restaurant['closeTime'].toString().trim();
        }
      }
    }

    final openTod = parseTimeString(openStr, const TimeOfDay(hour: 11, minute: 0));
    final closeTod = parseTimeString(closeStr, const TimeOfDay(hour: 22, minute: 0));

    // Calculate last booking time: strictly 30 minutes before closing time
    final closeMins = closeTod.hour * 60 + closeTod.minute;
    int lastMins = closeMins - 30;
    if (lastMins < 0) lastMins += 24 * 60;
    final lastBookingTod = TimeOfDay(hour: (lastMins ~/ 60) % 24, minute: lastMins % 60);

    return RestaurantDaySchedule(
      dayName: dayKey,
      isClosed: isClosed,
      openTime: openTod,
      closeTime: closeTod,
      lastBookingTime: lastBookingTod,
      openStr: formatTimeOfDay(openTod),
      closeStr: formatTimeOfDay(closeTod),
      lastBookingStr: formatTimeOfDay(lastBookingTod),
    );
  }

  /// Parses "HH:mm" 24h string into TimeOfDay
  static TimeOfDay parseTimeString(String raw, TimeOfDay fallback) {
    try {
      final parts = raw.split(':');
      if (parts.isNotEmpty) {
        final h = int.parse(parts[0].trim());
        final m = parts.length > 1 ? int.parse(parts[1].trim()) : 0;
        return TimeOfDay(hour: h.clamp(0, 23), minute: m.clamp(0, 59));
      }
    } catch (_) {}
    return fallback;
  }

  /// Formats TimeOfDay into friendly 12-hour format e.g. "11:30 AM" or "9:30 PM"
  static String formatTimeOfDay(TimeOfDay tod) {
    final hour = tod.hour;
    final minute = tod.minute.toString().padLeft(2, '0');
    final ampm = hour >= 12 ? 'PM' : 'AM';
    final h12 = hour % 12 == 0 ? 12 : hour % 12;
    return '$h12:$minute $ampm';
  }

  /// Checks if given date is today in the restaurant's timezone (New York)
  static bool isToday(DateTime date, [Map<String, dynamic>? restaurant]) {
    final nowNy = getNowInRestaurantTimezone(restaurant);
    return date.year == nowNy.year && date.month == nowNy.month && date.day == nowNy.day;
  }

  /// Checks if given date is strictly in the past relative to the restaurant's timezone
  static bool isPastDate(DateTime date, [Map<String, dynamic>? restaurant]) {
    final todayNy = getTodayInRestaurantTimezone(restaurant);
    final dateStart = DateTime(date.year, date.month, date.day);
    return dateStart.isBefore(todayNy);
  }

  /// Generates 30-minute booking slots from openTime up to lastBookingTime (close - 30 mins)
  static List<TimeOfDay> generateSlots(RestaurantDaySchedule schedule) {
    if (schedule.isClosed) return [];

    final openMins = schedule.openMinutes;
    final lastBookingMins = schedule.lastBookingMinutes;
    if (lastBookingMins < openMins) return [];

    final List<TimeOfDay> slots = [];
    int current = openMins;

    while (current <= lastBookingMins) {
      slots.add(TimeOfDay(hour: (current ~/ 60) % 24, minute: current % 60));
      current += 30; // 30-minute intervals
    }

    // Ensure lastBookingTime itself is present as the final slot if not aligned
    if (slots.isNotEmpty) {
      final lastSlotMins = slots.last.hour * 60 + slots.last.minute;
      if (lastSlotMins < lastBookingMins) {
        slots.add(schedule.lastBookingTime);
      }
    }

    return slots;
  }

  /// Checks if a time slot is in the future in New York time (for today, slot must be > current NY time)
  static bool isSlotAvailable(
    TimeOfDay slot,
    DateTime date, [
    Map<String, dynamic>? restaurant,
  ]) {
    if (!isToday(date, restaurant)) return true;
    final nowNy = getNowInRestaurantTimezone(restaurant);
    final currentMins = nowNy.hour * 60 + nowNy.minute;
    final slotMins = slot.hour * 60 + slot.minute;
    return slotMins > currentMins;
  }

  /// Validates a date and time against restaurant operating hours and New York time.
  /// Returns null if valid, or a user-facing error message if invalid.
  static String? validateReservation(
    DateTime? date,
    TimeOfDay? time,
    Map<String, dynamic>? restaurant,
  ) {
    if (date == null) return 'Please select a reservation date';
    if (time == null) return 'Please select a reservation time';

    if (isPastDate(date, restaurant)) {
      return 'Past dates cannot be selected. Please choose today or a future date.';
    }

    final schedule = getScheduleForDate(restaurant, date);
    if (schedule.isClosed) {
      return 'The restaurant is closed on this day. Please select another date.';
    }

    final timeMins = time.hour * 60 + time.minute;
    final openMins = schedule.openMinutes;
    final lastBookingMins = schedule.lastBookingMinutes;

    if (timeMins < openMins) {
      return 'Restaurant opens at ${schedule.openStr}. Please select a time between ${schedule.openStr} and ${schedule.lastBookingStr}.';
    }

    if (timeMins > lastBookingMins) {
      return 'Last table booking is accepted at ${schedule.lastBookingStr} (30 minutes before closing at ${schedule.closeStr}).';
    }

    if (isToday(date, restaurant)) {
      final nowNy = getNowInRestaurantTimezone(restaurant);
      final currentMins = nowNy.hour * 60 + nowNy.minute;
      final tzAbbr = nowNy.timeZoneName.isNotEmpty ? ' (${nowNy.timeZoneName})' : '';
      if (currentMins >= lastBookingMins) {
        return 'All booking slots for today have ended$tzAbbr. Please select tomorrow or a future date.';
      }
      if (timeMins <= currentMins) {
        final currentTod = TimeOfDay(hour: nowNy.hour, minute: nowNy.minute);
        return 'Please select a future time. Current restaurant time in New York is ${formatTimeOfDay(currentTod)}$tzAbbr.';
      }
    }

    return null;
  }

  /// Returns the earliest valid future slot for the given date in New York time, or null if none available.
  static TimeOfDay? getEarliestAvailableSlot(
    DateTime date,
    Map<String, dynamic>? restaurant,
  ) {
    final schedule = getScheduleForDate(restaurant, date);
    if (schedule.isClosed) return null;

    final slots = generateSlots(schedule);
    for (final slot in slots) {
      if (isSlotAvailable(slot, date, restaurant)) {
        return slot;
      }
    }
    return null;
  }

  /// Categorizes slots into Lunch, Afternoon, and Dinner sections
  static Map<String, List<TimeOfDay>> groupSlots(List<TimeOfDay> slots) {
    final Map<String, List<TimeOfDay>> groups = {
      'Lunch': [],
      'Afternoon': [],
      'Dinner': [],
    };

    for (final slot in slots) {
      final mins = slot.hour * 60 + slot.minute;
      if (mins < 15 * 60 + 30) {
        // Before 3:30 PM
        groups['Lunch']!.add(slot);
      } else if (mins < 18 * 60) {
        // 3:30 PM to 6:00 PM
        groups['Afternoon']!.add(slot);
      } else {
        // 6:00 PM onwards
        groups['Dinner']!.add(slot);
      }
    }

    // Remove empty groups
    groups.removeWhere((key, value) => value.isEmpty);
    return groups;
  }
}
