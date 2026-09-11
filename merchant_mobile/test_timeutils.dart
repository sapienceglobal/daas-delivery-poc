import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tzData;
import 'package:intl/intl.dart';

String mapTimezone(String? timezoneStr) {
  if (timezoneStr == null) return tz.local.name;
  if (timezoneStr.contains('Eastern Time')) return 'America/New_York';
  return tz.local.name;
}

String formatDateTimeWithTz(DateTime time, String? timezoneStr) {
  try {
    String ianaTz = mapTimezone(timezoneStr);
    final location = tz.getLocation(ianaTz);
    final tzDateTime = tz.TZDateTime.from(time.toUtc(), location);
    
    final timeFormatter = DateFormat('hh:mm a');
    final formattedTime = timeFormatter.format(tzDateTime);
    
    return formattedTime;
  } catch (e) {
    return 'fallback: \${time.hour}:\${time.minute} | Error: \$e';
  }
}

void main() {
  tzData.initializeTimeZones();
  tz.setLocalLocation(tz.getLocation('Asia/Kolkata')); // simulate India

  final utcTime = DateTime.utc(2026, 9, 10, 15, 53);
  print(formatDateTimeWithTz(utcTime, "(UTC-05:00) Eastern Time (ET)"));
  print(formatDateTimeWithTz(utcTime, null));
  print(formatDateTimeWithTz(utcTime, "Invalid/String"));
}
