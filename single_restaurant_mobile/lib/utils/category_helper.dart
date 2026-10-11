/// Helper utility to provide rich, restaurant-grade descriptions for menu categories.
class CategoryHelper {
  static const Map<String, String> _catalog = {
    'all':
        'Explore our full signature selection of authentic Punjabi curries, tandoori grills, handcrafted momos, and traditional lassis.',
    'momos':
        'Handcrafted Himalayan dumplings packed with seasoned fillings and fresh herbs, steamed or fried crisp, served with fiery house chili dips.',
    'amritsar special':
        'Legendary Amritsari kulchas baked crisp in the clay tandoor, spicy chole, and authentic street-style Punjabi favorites.',
    'appetizers / snacks':
        'Crispy samosas, zesty chaats, spiced fritters, and mouth-watering starters to kick off your dining feast.',
    'appetizers':
        'Crispy samosas, zesty chaats, spiced fritters, and mouth-watering starters to kick off your dining feast.',
    'non veg appetizer':
        'Smoky tandoori chicken, succulent kebabs, and clay-oven grilled skewers marinated in royal aromatic spices.',
    'tandoori specials':
        'Charred clay-oven delicacies and sizzling skewers infused with rich yogurt marinades and freshly ground spices.',
    'non veg main course':
        'Tender slow-simmered chicken, mutton, and goat curries cooked in rich, aromatic, and flavorful homestyle gravies.',
    'curries & mains':
        'Authentic regional curries slow-simmered in fragrant gravies of browned onions, tomatoes, and whole spices.',
    'veg main course':
        'Rich paneer gravies, slow-cooked dal makhani, and garden-fresh vegetables simmered with traditional North Indian spices.',
    'paratha\'s':
        'Golden-crisped, buttery whole wheat parathas generously stuffed with spiced potatoes, cauliflower, and fresh paneer.',
    'parathas':
        'Golden-crisped, buttery whole wheat parathas generously stuffed with spiced potatoes, cauliflower, and fresh paneer.',
    'naan / roti':
        'Piping hot tandoori rotis, fluffy garlic naans, and flaky layered parathas freshly baked on clay oven walls.',
    'breads':
        'Clay-oven flatbreads, buttered naans, whole wheat rotis, and flaky stuffed breads baked fresh to order.',
    'rice dishes':
        'Aromatic dum-cooked basmati biryanis and fragrant jeera rice layered with saffron, mint, and whole roasted spices.',
    'biryani & rice':
        'Royal long-grain basmati rice preparations slow-cooked in sealed pots with saffron, tender meats, or fresh vegetables.',
    'rice combo':
        'Comforting homestyle bowls of steaming basmati rice paired with creamy rajma, spicy chole, or fragrant kadhi.',
    'special thali':
        'A royal complete feast featuring chef\'s signature dal, seasonal sabzi, fresh dahi, and hot tawa rotis.',
    'beverages':
        'Our world-famous thick churned mango lassis, refreshing coolers, and authentic spiced masala chai brewed fresh daily.',
    'drinks':
        'Refreshing chilled sodas, traditional coolers, and handcrafted beverages to complement your meal.',
    'desserts':
        'Indulgent Indian sweets including warm melt-in-mouth gulab jamuns, chilled saffron rasmalai, and rich gajar halwa.',
    'street food & chaat':
        'Legendary Indian street delicacies bursting with tangy chutneys, crunchy sev, and vibrant aromatic spices.',
    'soups & salads':
        'Crisp farm-fresh salads, cooling herb raitas, and warming spiced shorba soups.',
    'salads & sides':
        'Fresh garden salads tossed with house vinaigrettes and wholesome, flavorful accompaniments.',
    'accompaniments':
        'Traditional sides including cooling cucumber raita, mixed pickles, fresh onions, and crispy spiced lentil papads.',
  };

  /// Returns an appetizing description for the given category map.
  static String getCategoryDescription(dynamic category) {
    if (category is! Map) {
      return 'Flavorful dishes prepared fresh daily with authentic spices, premium ingredients, and homestyle care.';
    }

    final dynamic rawDesc = category['description'];
    final String existing = rawDesc != null ? rawDesc.toString().trim() : '';
    final String name = (category['name'] ?? '').toString().trim();

    // If existing description is present and non-empty (and not legacy generic placeholder), use it
    if (existing.isNotEmpty && existing != 'Indian drinks') {
      return existing;
    }

    return getCatalogDescription(name);
  }

  /// Finds the best matching description by category name.
  static String getCatalogDescription(String name) {
    final key = name.toLowerCase().trim();
    if (_catalog.containsKey(key)) {
      return _catalog[key]!;
    }

    for (final entry in _catalog.entries) {
      if (key.contains(entry.key) || entry.key.contains(key)) {
        return entry.value;
      }
    }

    // Keyword fallbacks
    if (key.contains('momo')) return _catalog['momos']!;
    if (key.contains('biryani') || key.contains('rice')) return _catalog['rice dishes']!;
    if (key.contains('naan') || key.contains('roti') || key.contains('bread')) return _catalog['naan / roti']!;
    if (key.contains('curry') || key.contains('entree') || key.contains('main')) return _catalog['veg main course']!;
    if (key.contains('drink') || key.contains('lassi') || key.contains('beverage')) return _catalog['beverages']!;
    if (key.contains('dessert') || key.contains('sweet') || key.contains('halwa')) return _catalog['desserts']!;
    if (key.contains('starter') || key.contains('appetizer') || key.contains('snack') || key.contains('chaat')) {
      return _catalog['appetizers / snacks']!;
    }

    return 'Flavorful dishes prepared fresh daily with authentic spices, premium ingredients, and homestyle care.';
  }
}
