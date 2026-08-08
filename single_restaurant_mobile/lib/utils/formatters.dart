import 'package:intl/intl.dart';

class Formatters {
  static String formatCurrency(double amount, String? currencySetting) {
    String code = 'USD';
    String symbol = '\$';
    
    if (currencySetting != null) {
      if (currencySetting.contains('EUR')) { code = 'EUR'; symbol = '€'; }
      else if (currencySetting.contains('INR')) { code = 'INR'; symbol = '₹'; }
      else if (currencySetting.contains('GBP')) { code = 'GBP'; symbol = '£'; }
    }

    final formatter = NumberFormat.currency(
      locale: 'en_US',
      name: code,
      symbol: symbol,
      decimalDigits: 2,
    );
    return formatter.format(amount);
  }
}
