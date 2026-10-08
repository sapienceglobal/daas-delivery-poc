import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class CmsProvider with ChangeNotifier {
  Map<String, dynamic> _cmsData = {
    'heroBanners': {
      'home': '',
      'menu': '',
      'orderOnline': '',
      'checkout': '',
      'catering': '',
      'bookTable': '',
    },
    'aboutUs': {
      'ownerImage': '',
      'restaurantImage': '',
      'galleryImages': <Map<String, dynamic>>[],
    },
    'cateringOccasions': <Map<String, dynamic>>[],
    'cateringPackages': <Map<String, dynamic>>[],
    'bookingSettings': <Map<String, dynamic>>[],
    'promotions': {
      'menuPage': null,
      'mobileHome': null,
    },
  };

  List<Map<String, dynamic>> _activeCoupons = [];
  bool _isLoading = false;
  bool _isSaving = false;
  String? _uploadingKey;
  String _error = '';

  Map<String, dynamic> get cmsData => _cmsData;
  Map<String, dynamic> get heroBanners => _cmsData['heroBanners'] as Map<String, dynamic>? ?? {};
  Map<String, dynamic> get aboutUs => _cmsData['aboutUs'] as Map<String, dynamic>? ?? {};
  List<dynamic> get cateringOccasions => _cmsData['cateringOccasions'] as List<dynamic>? ?? [];
  List<dynamic> get cateringPackages => _cmsData['cateringPackages'] as List<dynamic>? ?? [];
  List<dynamic> get bookingSettings => _cmsData['bookingSettings'] as List<dynamic>? ?? [];
  Map<String, dynamic> get promotions => _cmsData['promotions'] as Map<String, dynamic>? ?? {};
  List<Map<String, dynamic>> get activeCoupons => _activeCoupons;

  bool get isLoading => _isLoading;
  bool get isSaving => _isSaving;
  String? get uploadingKey => _uploadingKey;
  String get error => _error;

  Future<void> fetchCms(String? restaurantId) async {
    if (restaurantId == null || restaurantId.isEmpty) return;

    _isLoading = true;
    _error = '';
    notifyListeners();

    try {
      final res = await ApiService.get('/api/cms?restaurantId=$restaurantId');
      final decoded = jsonDecode(res.body);

      if (res.statusCode == 200 && decoded['data'] != null) {
        final data = decoded['data'];
        _cmsData = {
          'heroBanners': Map<String, dynamic>.from(data['heroBanners'] ?? {
            'home': '',
            'menu': '',
            'orderOnline': '',
            'checkout': '',
            'catering': '',
            'bookTable': '',
          }),
          'aboutUs': {
            'ownerImage': data['aboutUs']?['ownerImage'] ?? '',
            'restaurantImage': data['aboutUs']?['restaurantImage'] ?? '',
            'galleryImages': (data['aboutUs']?['galleryImages'] as List<dynamic>? ?? [])
                .map((e) => Map<String, dynamic>.from(e is Map ? e : {'src': e.toString(), 'alt': 'Gallery'}))
                .toList(),
          },
          'cateringOccasions': (data['cateringOccasions'] as List<dynamic>? ?? [])
              .map((e) => Map<String, dynamic>.from(e as Map))
              .toList(),
          'cateringPackages': (data['cateringPackages'] as List<dynamic>? ?? [])
              .map((e) {
                final m = Map<String, dynamic>.from(e as Map);
                if (m['features'] is List) {
                  m['features'] = (m['features'] as List).map((f) => f.toString()).toList();
                } else {
                  m['features'] = <String>[];
                }
                return m;
              })
              .toList(),
          'bookingSettings': (data['bookingSettings'] as List<dynamic>? ?? [])
              .map((e) => Map<String, dynamic>.from(e as Map))
              .toList(),
          'promotions': {
            'menuPage': data['promotions']?['menuPage'],
            'mobileHome': data['promotions']?['mobileHome'],
          },
        };
      } else {
        _error = decoded['message'] ?? 'Failed to load CMS data';
      }

      await fetchActiveCoupons();
    } catch (e) {
      _error = 'Error loading CMS: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchActiveCoupons() async {
    try {
      final res = await ApiService.get('/api/coupons/active');
      final decoded = jsonDecode(res.body);
      if (res.statusCode == 200 && decoded['data'] != null) {
        final List<dynamic> list = decoded['data'];
        _activeCoupons = list.map((c) => Map<String, dynamic>.from(c as Map)).toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Failed to load active coupons for CMS: $e');
    }
  }

  Future<bool> saveCms() async {
    _isSaving = true;
    _error = '';
    notifyListeners();

    try {
      final payload = {
        'heroBanners': _cmsData['heroBanners'],
        'aboutUs': _cmsData['aboutUs'],
        'cateringOccasions': _cmsData['cateringOccasions'],
        'cateringPackages': _cmsData['cateringPackages'],
        'bookingSettings': _cmsData['bookingSettings'],
        'promotions': {
          'menuPage': _extractCouponId(_cmsData['promotions']?['menuPage']),
          'mobileHome': _extractCouponId(_cmsData['promotions']?['mobileHome']),
        },
      };

      final res = await ApiService.put('/api/cms', payload);
      final decoded = jsonDecode(res.body);

      if (res.statusCode == 200 && (decoded['success'] == true || decoded['data'] != null)) {
        _isSaving = false;
        notifyListeners();
        return true;
      } else {
        _error = decoded['message'] ?? 'Failed to save CMS configuration';
        _isSaving = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Error saving CMS: $e';
      _isSaving = false;
      notifyListeners();
      return false;
    }
  }

  String? _extractCouponId(dynamic val) {
    if (val == null) return null;
    if (val is Map) return val['_id'] ?? val['id'];
    final str = val.toString().trim();
    return str.isEmpty ? null : str;
  }

  Future<String?> uploadImage(String filePath, {String? uploadKey}) async {
    _uploadingKey = uploadKey;
    notifyListeners();

    try {
      final url = await ApiService.uploadImage(filePath, folder: 'restaurant-platform/cms');
      if (url != null && url.isNotEmpty) {
        return url;
      } else {
        _error = 'Image upload failed';
        return null;
      }
    } catch (e) {
      _error = 'Upload error: $e';
      return null;
    } finally {
      _uploadingKey = null;
      notifyListeners();
    }
  }

  // --- Hero Banners ---
  void updateHeroBanner(String key, String url) {
    final banners = Map<String, dynamic>.from(_cmsData['heroBanners'] ?? {});
    banners[key] = url;
    _cmsData['heroBanners'] = banners;
    notifyListeners();
  }

  // --- About Us ---
  void updateAboutImage(String key, String url) {
    final about = Map<String, dynamic>.from(_cmsData['aboutUs'] ?? {});
    about[key] = url;
    _cmsData['aboutUs'] = about;
    notifyListeners();
  }

  void addGalleryImage(String url, {String alt = 'Gallery Image'}) {
    final about = Map<String, dynamic>.from(_cmsData['aboutUs'] ?? {});
    final gallery = List<Map<String, dynamic>>.from(about['galleryImages'] ?? []);
    gallery.insert(0, {'src': url, 'alt': alt});
    about['galleryImages'] = gallery;
    _cmsData['aboutUs'] = about;
    notifyListeners();
  }

  void removeGalleryImage(int index) {
    final about = Map<String, dynamic>.from(_cmsData['aboutUs'] ?? {});
    final gallery = List<Map<String, dynamic>>.from(about['galleryImages'] ?? []);
    if (index >= 0 && index < gallery.length) {
      gallery.removeAt(index);
      about['galleryImages'] = gallery;
      _cmsData['aboutUs'] = about;
      notifyListeners();
    }
  }

  // --- Catering Packages ---
  void addCateringPackage({
    String? name,
    double price = 0,
    bool popular = false,
    String image = '',
    List<String>? features,
  }) {
    final packages = List<Map<String, dynamic>>.from(_cmsData['cateringPackages'] ?? []);
    packages.insert(0, {
      'id': 'pkg-${DateTime.now().millisecondsSinceEpoch}',
      'name': name ?? 'New Package',
      'price': price,
      'popular': popular,
      'image': image,
      'features': features ?? ['Feature 1'],
    });
    _cmsData['cateringPackages'] = packages;
    notifyListeners();
  }

  void updateCateringPackage(int index, Map<String, dynamic> updated) {
    final packages = List<Map<String, dynamic>>.from(_cmsData['cateringPackages'] ?? []);
    if (index >= 0 && index < packages.length) {
      packages[index] = updated;
      _cmsData['cateringPackages'] = packages;
      notifyListeners();
    }
  }

  void removeCateringPackage(int index) {
    final packages = List<Map<String, dynamic>>.from(_cmsData['cateringPackages'] ?? []);
    if (index >= 0 && index < packages.length) {
      packages.removeAt(index);
      _cmsData['cateringPackages'] = packages;
      notifyListeners();
    }
  }

  // --- Catering Occasions ---
  void addCateringOccasion({
    String title = '',
    String image = '',
    String icon = 'Heart',
  }) {
    final occasions = List<Map<String, dynamic>>.from(_cmsData['cateringOccasions'] ?? []);
    occasions.insert(0, {
      'title': title,
      'image': image,
      'icon': icon,
    });
    _cmsData['cateringOccasions'] = occasions;
    notifyListeners();
  }

  void updateCateringOccasion(int index, Map<String, dynamic> updated) {
    final occasions = List<Map<String, dynamic>>.from(_cmsData['cateringOccasions'] ?? []);
    if (index >= 0 && index < occasions.length) {
      occasions[index] = updated;
      _cmsData['cateringOccasions'] = occasions;
      notifyListeners();
    }
  }

  void removeCateringOccasion(int index) {
    final occasions = List<Map<String, dynamic>>.from(_cmsData['cateringOccasions'] ?? []);
    if (index >= 0 && index < occasions.length) {
      occasions.removeAt(index);
      _cmsData['cateringOccasions'] = occasions;
      notifyListeners();
    }
  }

  // --- Booking Settings ---
  void addBookingSetting({
    String title = '',
    String desc = '',
    String image = '',
  }) {
    final bookings = List<Map<String, dynamic>>.from(_cmsData['bookingSettings'] ?? []);
    bookings.insert(0, {
      'title': title,
      'desc': desc,
      'image': image,
    });
    _cmsData['bookingSettings'] = bookings;
    notifyListeners();
  }

  void updateBookingSetting(int index, Map<String, dynamic> updated) {
    final bookings = List<Map<String, dynamic>>.from(_cmsData['bookingSettings'] ?? []);
    if (index >= 0 && index < bookings.length) {
      bookings[index] = updated;
      _cmsData['bookingSettings'] = bookings;
      notifyListeners();
    }
  }

  void removeBookingSetting(int index) {
    final bookings = List<Map<String, dynamic>>.from(_cmsData['bookingSettings'] ?? []);
    if (index >= 0 && index < bookings.length) {
      bookings.removeAt(index);
      _cmsData['bookingSettings'] = bookings;
      notifyListeners();
    }
  }

  // --- Promotions Placement ---
  void updatePromotionPlacement(String placementKey, dynamic couponVal) {
    final promos = Map<String, dynamic>.from(_cmsData['promotions'] ?? {});
    promos[placementKey] = couponVal;
    _cmsData['promotions'] = promos;
    notifyListeners();
  }
}
