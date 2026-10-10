import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

class ImageHelper {
  static String getDishImageUrl(Map<String, dynamic> item) {
    if (item['image'] != null && item['image'].toString().startsWith('http')) {
      return item['image'];
    }
    
    // Fallback based on name using Unsplash URLs so we don't increase APK size
    final name = (item['name'] ?? '').toLowerCase();
    
    // Always use the production URL for static fallback images.
    // This avoids issues where the local Next.js server on port 3000 is not 
    // accessible from the mobile device due to localhost binding or firewalls.
    final String basePath = 'https://lassiloungeny.com/images/branded/lassi-lounge/dishes';
    
    if (name.contains('butter chicken')) return '$basePath/butter-chicken.png';
    if (name.contains('cheese naan')) return '$basePath/cheese-naan.jpg';
    if (name.contains('chicken pakora')) return '$basePath/chicken-pakora.jpg';
    if (name.contains('chicken tikka masala')) return '$basePath/chicken-tikka-masala.jpg';
    if (name.contains('garlic naan')) return '$basePath/garlic-naan.png';
    if (name.contains('kesar badam') || name.contains('badam milk') || name.contains('kesarbadammilk')) return '$basePath/kesar-badam-milk.jpg';
    if (name.contains('rogan josh') || name.contains('lamb')) return '$basePath/lamb-rogan-josh.jpg';
    if (name.contains('masala chai') || name.contains('tea')) return '$basePath/masala-chai.jpg';
    if (name.contains('salt lassi') || name.contains('salted lassi')) return '$basePath/salt-lassi.jpg';
    if (name.contains('sweet lassi')) return '$basePath/sweet-lassi.jpg';
    if (name.contains('mango lassi')) return '$basePath/mango-lassi.jpg';
    if (name.contains('samosa')) return '$basePath/samosa.jpg';
    if (name.contains('tandoori chiken') || name.contains('tandoori chicken')) return '$basePath/tandoori-chiken.png';
    if (name.contains('paneer tikka')) return '$basePath/paneer-tikka.jpg';
    if (name.contains('tandoori roti')) return '$basePath/tandoori-roti.png';
    
    if (name.contains('biryani')) return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80';
    if (name.contains('dal makhani')) return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80';
    if (name.contains('roll') || name.contains('spring')) return 'https://images.unsplash.com/photo-1546714088-b2dc43bdf1e6?auto=format&fit=crop&w=400&q=80';
    
    // Generic fallback
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
  }

  static Widget buildDishImage(Map<String, dynamic> item, {BoxFit fit = BoxFit.cover}) {
    final url = getDishImageUrl(item);
    if (url.startsWith('http')) {
      return CachedNetworkImage(
        imageUrl: url,
        fit: fit,
        placeholder: (context, url) => Container(color: Colors.grey.shade200),
        errorWidget: (context, url, error) => Container(color: Colors.grey.shade300, child: const Icon(Icons.error, color: Colors.grey)),
      );
    }
    // Just in case a local asset path is returned from backend or something
    final assetPath = url.startsWith('/') ? url.substring(1) : url;
    return Image.asset(
      assetPath,
      fit: fit,
      errorBuilder: (context, error, stackTrace) => Container(color: Colors.grey.shade300),
    );
  }

  static String getCategoryImageUrl(Map<String, dynamic> category) {
    final name = (category['name'] ?? '').toLowerCase();

    const basePath = 'assets/images/branded/lassi-lounge/categories';

    // 13 Distinct 3D Category Assets for complete coverage
    if (name.contains('thali')) {
      return '$basePath/special_thali_3d.png';
    }
    if (name.contains('momo')) {
      return '$basePath/momos_3d.png';
    }
    if (name.contains('amritsar') || name.contains('kulcha') || name.contains('bhature')) {
      return '$basePath/amritsar_special_3d.png';
    }
    if (name.contains('combo')) {
      return '$basePath/rice_combo_3d.png';
    }
    if (name.contains('paratha')) {
      return '$basePath/parathas_3d.png';
    }
    if ((name.contains('non') || name.contains('chicken') || name.contains('meat')) &&
        (name.contains('appetizer') || name.contains('snack') || name.contains('starter') || name.contains('tikka'))) {
      return '$basePath/non_veg_appetizer_3d.png';
    }
    if (name.contains('rice') || name.contains('biryani') || name.contains('pulao')) {
      return '$basePath/rice_dishes_3d.png';
    }
    if (name.contains('appetizer') ||
        name.contains('snack') ||
        name.contains('starter') ||
        name.contains('samosa') ||
        name.contains('chaat')) {
      return '$basePath/snacks_3d.png';
    }
    if (name.contains('non') ||
        name.contains('chicken') ||
        name.contains('mutton') ||
        name.contains('goat') ||
        name.contains('meat') ||
        name.contains('fish') ||
        name.contains('seafood')) {
      return '$basePath/non_veg_main_3d.png';
    }
    if (name.contains('dessert') ||
        name.contains('sweet') ||
        name.contains('mithai') ||
        name.contains('jamun') ||
        name.contains('kulfi') ||
        name.contains('ice cream')) {
      return '$basePath/desserts_3d.png';
    }
    if (name.contains('beverage') ||
        name.contains('drink') ||
        name.contains('lassi') ||
        name.contains('shake') ||
        name.contains('tea') ||
        name.contains('chai') ||
        name.contains('coffee') ||
        name.contains('juice')) {
      return '$basePath/beverages_3d.png';
    }
    if (name.contains('bread') ||
        name.contains('naan') ||
        name.contains('roti')) {
      return '$basePath/breads_3d.png';
    }

    if (category['image'] != null &&
        category['image'].toString().isNotEmpty &&
        category['image'].toString().startsWith('http')) {
      return category['image'];
    }

    return '$basePath/veg_main_3d.png';
  }

  static Widget buildCategoryImage(
    Map<String, dynamic> category, {
    BoxFit fit = BoxFit.contain,
  }) {
    final url = getCategoryImageUrl(category);
    if (url.startsWith('http')) {
      return CachedNetworkImage(
        imageUrl: url,
        fit: fit,
        placeholder: (context, url) => Container(color: Colors.transparent),
        errorWidget: (context, url, error) => Container(
          color: Colors.transparent,
          child: const Icon(Icons.restaurant, color: Colors.grey, size: 28),
        ),
      );
    }
    final assetPath = url.startsWith('/') ? url.substring(1) : url;
    return Image.asset(
      assetPath,
      fit: fit,
      filterQuality: FilterQuality.high,
      errorBuilder: (context, error, stackTrace) =>
          Container(color: Colors.transparent),
    );
  }
}
