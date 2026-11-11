import 'package:flutter/material.dart';

/// Industry-level helper to determine whether spice levels apply to a menu item,
/// preventing beverages (e.g., Mango Lassi), desserts, and plain sides/breads
/// from displaying hardcoded "Mild" spice indicators or selectors.
class SpiceHelper {
  static const List<String> _beverageKeywords = [
    'lassi',
    'shake',
    'milkshake',
    'smoothie',
    'badam milk',
    'rose milk',
    'thandai',
    'chai',
    'masala tea',
    'iced tea',
    'green tea',
    'black tea',
    'coffee',
    'espresso',
    'latte',
    'cappuccino',
    'cold coffee',
    'soda',
    'water',
    'mineral water',
    'sparkling water',
    'juice',
    'drink',
    'beverage',
    'lemonade',
    'nimbu',
    'shikanji',
    'mojito',
    'cooler',
    'mocktail',
    'thumbs up',
    'thums up',
    'limca',
    'coke',
    'coca cola',
    'coca-cola',
    'diet coke',
    'pepsi',
    'sprite',
    'fanta',
    'mirinda',
    '7up',
    'mountain dew',
    'ginger ale',
    'red bull',
    'chaas',
    'buttermilk',
    'kokum',
    'rooh afza',
    'sharbat',
    'falooda',
  ];

  static const List<String> _dessertKeywords = [
    'dessert',
    'sweet',
    'mithai',
    'gulab jamun',
    'kala jamun',
    'rasmalai',
    'rasgulla',
    'rajbhog',
    'chamcham',
    'kulfi',
    'ice cream',
    'gelato',
    'halwa',
    'gajar',
    'moong dal halwa',
    'sooji',
    'kheer',
    'phirni',
    'rabri',
    'rabdi',
    'jalebi',
    'imarti',
    'barfi',
    'burfi',
    'kalakand',
    'milk cake',
    'laddu',
    'ladoo',
    'peda',
    'sandesh',
    'shrikhand',
    'basundi',
    'payasam',
    'shahi tukda',
    'double ka meetha',
    'meetha',
    'paan',
    'brownie',
    'pastry',
    'cheesecake',
    'tiramisu',
    'mousse',
    'pudding',
    'custard',
    'churro',
    'waffle',
  ];

  static const List<String> _plainBreadOrSideKeywords = [
    'plain naan',
    'butter naan',
    'garlic naan',
    'cheese naan',
    'peshawari naan',
    'kashmiri naan',
    'roti',
    'tandoori roti',
    'plain roti',
    'butter roti',
    'rumali roti',
    'missi roti',
    'lachha paratha',
    'plain paratha',
    'pudina paratha',
    'extra bhatura',
    'plain bhatura',
    'single bhatura',
    'extra puri',
    'plain puri',
    'extra pav',
    'plain rice',
    'steamed rice',
    'basmati rice',
    'jeera rice',
    'cumin rice',
    'saffron rice',
    'peas pulao',
    'raita',
    'plain dahi',
    'curd',
    'yogurt',
    'yoghurt',
    'papad',
    'green salad',
    'kachumber salad',
    'onion salad',
  ];

  static const List<String> _savouryOverrideKeywords = [
    'chhole',
    'chole',
    'curry',
    'masala',
    'tikka',
    'paneer',
    'chicken',
    'lamb',
    'mutton',
    'goat',
    'fish',
    'prawn',
    'shrimp',
    'biryani',
    'momo',
    'manchurian',
    'chilli',
    'chili',
    'schezwan',
    'chaat',
    'samosa',
    'pakora',
    'tikki',
    'kebab',
    'kabab',
    'vindaloo',
    'madras',
    'kadai',
    'karahi',
    'korma',
    'rogan josh',
    'bhuna',
    'dal',
    'daal',
    'rajma',
    'kofta',
    'saag',
    'palak',
    'aloo',
    'gobi',
    'bhindi',
    'baingan',
    'thali',
    'combo',
    'amritsari kulcha',
    'stuffed kulcha',
    'masala kulcha',
    'keema',
    'achari',
    'hari mirch',
    'mirchi',
  ];

  static String _normalizedName(Map<String, dynamic> item) {
    return (item['name'] ?? '').toString().toLowerCase().trim();
  }

  static String _normalizedCategory(Map<String, dynamic> item) {
    final cat = item['categoryName'] ??
        (item['category'] is Map ? item['category']['name'] : item['category']) ??
        '';
    return cat.toString().toLowerCase().trim();
  }

  static String _normalizedDescription(Map<String, dynamic> item) {
    return (item['description'] ?? '').toString().toLowerCase().trim();
  }

  static bool _containsAny(String text, List<String> keywords) {
    if (text.isEmpty) return false;
    for (final kw in keywords) {
      if (text.contains(kw)) return true;
    }
    return false;
  }

  static bool isBeverage(Map<String, dynamic> item) {
    final name = _normalizedName(item);
    final category = _normalizedCategory(item);
    if (_containsAny(category, ['beverage', 'drink', 'lassi', 'shake', 'chai', 'coffee', 'juice', 'mocktail', 'cooler'])) {
      return true;
    }
    if (name == 'tea' || name.endsWith(' tea') || name.startsWith('tea ')) {
      return true;
    }
    return _containsAny(name, _beverageKeywords);
  }

  static bool isDessert(Map<String, dynamic> item) {
    final name = _normalizedName(item);
    final category = _normalizedCategory(item);
    final desc = _normalizedDescription(item);
    if (_containsAny(category, ['dessert', 'sweet', 'mithai', 'ice cream', 'kulfi'])) {
      return true;
    }
    if (_containsAny(name, _dessertKeywords)) {
      return true;
    }
    if ((desc.contains('sweet mango') || desc.contains('sweetened yogurt') || desc.contains('sugar syrup')) &&
        !_containsAny(name, _savouryOverrideKeywords)) {
      return true;
    }
    return false;
  }

  static bool isPlainBreadOrSide(Map<String, dynamic> item) {
    final name = _normalizedName(item);
    final category = _normalizedCategory(item);

    if (_containsAny(name, _savouryOverrideKeywords)) {
      return false;
    }

    if (_containsAny(name, _plainBreadOrSideKeywords)) {
      return true;
    }

    if (_containsAny(category, ['bread', 'naan', 'roti', 'raita'])) {
      return true;
    }

    return false;
  }

  /// Returns true if the customer should be able to choose a spice level
  /// (Mild, Medium, Spicy, Extra Spicy) for this item on the detail screen.
  static bool canCustomizeSpice(Map<String, dynamic> item) {
    if (isBeverage(item) || isDessert(item)) {
      return false;
    }
    if (item['isSpicy'] == true) {
      return true;
    }
    if (isPlainBreadOrSide(item)) {
      return false;
    }
    return true;
  }

  /// Returns true when the Menu Card (on MenuScreen) should display a spice indicator badge.
  /// Shows for all savoury dishes where spice is applicable (Mild / Medium / Spicy),
  /// and hides completely for beverages (Mango Lassi, drinks), desserts (sweets), and plain breads/raita.
  static bool shouldShowMenuSpiceBadge(Map<String, dynamic> item) {
    return canCustomizeSpice(item);
  }

  /// Returns the spice label to display on MenuItemCard when [shouldShowMenuSpiceBadge] is true.
  static String getMenuSpiceBadgeText(Map<String, dynamic> item) {
    final selected = item['selectedSpiceLevel'];
    if (selected != null && selected.toString().trim().isNotEmpty) {
      return selected.toString().trim();
    }
    final customSpice = item['spiceLevel'] ?? item['spicyLevel'];
    if (customSpice != null && customSpice.toString().trim().isNotEmpty) {
      return customSpice.toString().trim();
    }
    final isSpicy = item['isSpicy'] == true;
    return isSpicy ? 'Medium' : 'Mild';
  }

  /// Returns how many flame icons (out of 3) to highlight on MenuItemCard.
  static int getActiveFlameCount(String spiceLabel) {
    final lower = spiceLabel.toLowerCase();
    if (lower.contains('extra') || lower.contains('hot') || lower == 'spicy') {
      return 3;
    }
    if (lower.contains('medium')) {
      return 2;
    }
    return 1;
  }

  /// Returns a context-aware highlight icon and label for non-spicy items on ItemDetailInfo.
  static ({IconData icon, String label}) getNonSpicyHighlight(Map<String, dynamic> item) {
    if (isBeverage(item)) {
      final name = _normalizedName(item);
      if (name.contains('chai') || name.contains('tea') || (name.contains('coffee') && !name.contains('cold'))) {
        return (icon: Icons.emoji_food_beverage_rounded, label: 'Served Hot');
      }
      return (icon: Icons.ac_unit_rounded, label: 'Served Chilled');
    }
    if (isDessert(item)) {
      return (icon: Icons.auto_awesome_rounded, label: 'Sweet Treat');
    }
    return (icon: Icons.verified_outlined, label: 'Freshly Made');
  }
}

