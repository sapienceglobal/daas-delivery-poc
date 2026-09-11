import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tzData;
import 'package:intl/intl.dart';

void main() {
  tzData.initializeTimeZones();
  final location = tz.getLocation('America/New_York');
  final utcTime = DateTime.utc(2026, 9, 10, 15, 53);
  final tzTime = tz.TZDateTime.from(utcTime, location);
  print('tzTime.hour: ${tzTime.hour}');
  final format = DateFormat('hh:mm a');
  print('Formatted: ${format.format(tzTime)}');
}
