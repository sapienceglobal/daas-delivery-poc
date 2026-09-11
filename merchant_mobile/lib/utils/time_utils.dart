import 'package:timezone/timezone.dart' as tz;
import 'package:intl/intl.dart';

class TimeUtils {
  static String mapTimezone(String? timezoneStr) {
    if (timezoneStr == null) return tz.local.name;
    if (timezoneStr.contains('Eastern Time') ||
        timezoneStr.contains('UTC-05:00') ||
        timezoneStr.contains('UTC-5:00') ||
        timezoneStr.contains('UTC-04:00') ||
        timezoneStr.contains('UTC-4:00')) {
      return 'America/New_York';
    }
    if (timezoneStr.contains('Pacific Time') ||
        timezoneStr.contains('UTC-08:00') ||
        timezoneStr.contains('UTC-8:00')) {
      return 'America/Los_Angeles';
    }
    if (timezoneStr.contains('Indian Standard Time') ||
        timezoneStr.contains('UTC+05:30') ||
        timezoneStr.contains('UTC+5:30')) {
      return 'Asia/Kolkata';
    }
    return tz.local.name;
  }

  static String? getRestaurantTimezone(Map<String, dynamic>? user) {
    if (user == null) return null;
    
    if (user.containsKey('timezone') && user['timezone'] != null) {
      return user['timezone'].toString();
    }
    
    // Fallback for legacy cached users
    final resId = user['restaurantId'];
    if (resId is Map && resId.containsKey('timezone')) {
      return resId['timezone']?.toString();
    }
    return null;
  }

  static tz.TZDateTime getTzDateTime(
    DateTime? time,
    String? restaurantTimezone,
  ) {
    final defaultTime = time ?? DateTime.now();
    final ianaTz = mapTimezone(restaurantTimezone);
    try {
      final location = tz.getLocation(ianaTz);
      return tz.TZDateTime.from(defaultTime.toUtc(), location);
    } catch (e) {
      // If timezone fails, fallback to local time parsing (or UTC if the error is severe)
      return tz.TZDateTime.from(defaultTime.toUtc(), tz.getLocation('UTC'));
    }
  }

  static String formatDateTimeWithTz(
    DateTime? time,
    String? restaurantTimezone,
  ) {
    if (time == null) return 'N/A';

    try {
      final tzDateTime = getTzDateTime(time, restaurantTimezone);

      final String formattedDate =
          '${tzDateTime.month.toString().padLeft(2, '0')}/${tzDateTime.day.toString().padLeft(2, '0')}/${tzDateTime.year}';

      // format time using 12 hour AM/PM
      final timeFormatter = DateFormat('hh:mm a');
      final String formattedTime = timeFormatter.format(tzDateTime);

      return '$formattedDate  $formattedTime';
    } catch (e) {
      // Fallback
      return '${time.month}/${time.day}/${time.year}  ${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
    }
  }
}
