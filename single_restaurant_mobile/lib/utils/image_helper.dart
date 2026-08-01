import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

class ImageHelper {
  static String getDishImageUrl(Map<String, dynamic> item) {
    if (item['image'] != null && item['image'].toString().startsWith('http')) {
      return item['image'];
    }
    
    // Fallback based on name using Unsplash URLs so we don't increase APK size
    final name = (item['name'] ?? '').toLowerCase();
    
    if (name.contains('butter chicken')) return 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&q=80';
    if (name.contains('rogan josh') || name.contains('lamb')) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
    if (name.contains('paneer tikka')) return 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&q=80';
    if (name.contains('biryani')) return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80';
    if (name.contains('dal makhani')) return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80';
    if (name.contains('lassi')) return 'https://images.unsplash.com/photo-1572451069698-c689f925b4ff?auto=format&fit=crop&w=400&q=80';
    if (name.contains('roll') || name.contains('spring')) return 'https://images.unsplash.com/photo-1546714088-b2dc43bdf1e6?auto=format&fit=crop&w=400&q=80';
    if (name.contains('samosa')) return 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80';
    if (name.contains('palak paneer') || name.contains('spinach')) return 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=400&q=80';
    if (name.contains('naan') || name.contains('bread')) return 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?auto=format&fit=crop&w=400&q=80';
    if (name.contains('corn')) return 'https://images.unsplash.com/photo-1626804475297-41609ea004eb?auto=format&fit=crop&w=400&q=80';
    
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
    return Image.asset(
      url,
      fit: fit,
      errorBuilder: (context, error, stackTrace) => Container(color: Colors.grey.shade300),
    );
  }

  static String getCategoryImageUrl(Map<String, dynamic> category) {
    if (category['image'] != null && category['image'].toString().startsWith('http')) {
      return category['image'];
    }
    
    final name = (category['name'] ?? '').toLowerCase();
    
    if (name.contains('appetizer')) return 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80';
    if (name.contains('main course')) return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80';
    if (name.contains('bread')) return 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?auto=format&fit=crop&w=400&q=80';
    if (name.contains('dessert')) return 'https://images.unsplash.com/photo-1546714088-b2dc43bdf1e6?auto=format&fit=crop&w=400&q=80';
    if (name.contains('beverage')) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
    if (name.contains('salad')) return 'https://images.unsplash.com/photo-1626804475297-41609ea004eb?auto=format&fit=crop&w=400&q=80';
    if (name.contains('biryani')) return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80';
    if (name.contains('tandoori')) return 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&q=80';
    if (name.contains('special')) return 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&q=80';
    
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
  }

  static Widget buildCategoryImage(Map<String, dynamic> category, {BoxFit fit = BoxFit.cover}) {
    final url = getCategoryImageUrl(category);
    if (url.startsWith('http')) {
      return CachedNetworkImage(
        imageUrl: url,
        fit: fit,
        placeholder: (context, url) => Container(color: Colors.grey.shade200),
        errorWidget: (context, url, error) => Container(color: Colors.grey.shade300, child: const Icon(Icons.error, color: Colors.grey)),
      );
    }
    return Image.asset(
      url,
      fit: fit,
      errorBuilder: (context, error, stackTrace) => Container(color: Colors.grey.shade300),
    );
  }
}
