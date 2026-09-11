import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tzData;

void main() {
  tzData.initializeTimeZones();
  print(tz.timeZoneDatabase.locations.keys.contains('Asia/Calcutta'));
  print(tz.timeZoneDatabase.locations.keys.contains('Asia/Kolkata'));
}
