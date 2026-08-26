class ItemModifier {
  final String name;
  final double price;

  ItemModifier({required this.name, required this.price});

  factory ItemModifier.fromJson(Map<String, dynamic> json) {
    return ItemModifier(
      name: json['name'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'price': price,
    };
  }
}

class MenuItemModel {
  final String id;
  final String name;
  final String description;
  final double price;
  final String? imageUrl;
  final bool isAvailable;
  
  // Dietary & Status
  final bool isVeg;
  final bool isVegan;
  final bool isSpicy;
  final bool isGlutenFree;
  final bool isBestseller;
  
  final String? prepTime;
  final String categoryId; // References CategoryModel.id
  final String? tags;

  final List<ItemModifier> sizeVariations;
  final List<ItemModifier> addOns;

  MenuItemModel({
    required this.id,
    required this.name,
    this.description = '',
    required this.price,
    this.imageUrl,
    this.isAvailable = true,
    this.isVeg = true,
    this.isVegan = false,
    this.isSpicy = false,
    this.isGlutenFree = false,
    this.isBestseller = false,
    this.prepTime,
    required this.categoryId,
    this.tags,
    this.sizeVariations = const [],
    this.addOns = const [],
  });

  factory MenuItemModel.fromJson(Map<String, dynamic> json, String catId) {
    return MenuItemModel(
      id: json['_id'] ?? '',
      name: json['name'] ?? 'Unknown Item',
      description: json['description'] ?? '',
      price: (json['price'] ?? json['basePrice'] ?? 0).toDouble(),
      imageUrl: json['image'] ?? json['imageUrl'],
      isAvailable: json['isAvailable'] ?? true,
      isVeg: json['isVeg'] ?? true,
      isVegan: json['isVegan'] ?? false,
      isSpicy: json['isSpicy'] ?? false,
      isGlutenFree: json['isGlutenFree'] ?? false,
      isBestseller: json['isBestseller'] ?? false,
      prepTime: json['prepTime']?.toString(),
      categoryId: catId,
      tags: json['tags'] is List ? (json['tags'] as List).join(', ') : json['tags']?.toString(),
      sizeVariations: (json['sizeVariations'] as List?)?.map((i) => ItemModifier.fromJson(i)).toList() ?? [],
      addOns: (json['addOns'] as List?)?.map((i) => ItemModifier.fromJson(i)).toList() ?? [],
    );
  }

  MenuItemModel copyWith({
    String? name,
    String? description,
    double? price,
    String? imageUrl,
    bool? isAvailable,
    bool? isVeg,
    bool? isVegan,
    bool? isSpicy,
    bool? isGlutenFree,
    bool? isBestseller,
    String? prepTime,
    String? categoryId,
    String? tags,
    List<ItemModifier>? sizeVariations,
    List<ItemModifier>? addOns,
  }) {
    return MenuItemModel(
      id: id,
      name: name ?? this.name,
      description: description ?? this.description,
      price: price ?? this.price,
      imageUrl: imageUrl ?? this.imageUrl,
      isAvailable: isAvailable ?? this.isAvailable,
      isVeg: isVeg ?? this.isVeg,
      isVegan: isVegan ?? this.isVegan,
      isSpicy: isSpicy ?? this.isSpicy,
      isGlutenFree: isGlutenFree ?? this.isGlutenFree,
      isBestseller: isBestseller ?? this.isBestseller,
      prepTime: prepTime ?? this.prepTime,
      categoryId: categoryId ?? this.categoryId,
      tags: tags ?? this.tags,
      sizeVariations: sizeVariations ?? this.sizeVariations,
      addOns: addOns ?? this.addOns,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'description': description,
      'price': price,
      'image': imageUrl,
      'isAvailable': isAvailable,
      'isVeg': isVeg,
      'isVegan': isVegan,
      'isSpicy': isSpicy,
      'isGlutenFree': isGlutenFree,
      'isBestseller': isBestseller,
      'prepTime': prepTime,
      'categoryId': categoryId,
      'tags': tags?.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList(),
      'sizeVariations': sizeVariations.map((e) => e.toJson()).toList(),
      'addOns': addOns.map((e) => e.toJson()).toList(),
    };
  }
}

class CategoryModel {
  final String id;
  final String name;
  final List<MenuItemModel> items;

  CategoryModel({
    required this.id,
    required this.name,
    required this.items,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    var itemsList = <MenuItemModel>[];
    if (json['items'] != null) {
      itemsList = (json['items'] as List)
          .map((i) => MenuItemModel.fromJson(i, json['_id']))
          .toList();
    }
    return CategoryModel(
      id: json['_id'] ?? '',
      name: json['name'] ?? 'Unknown Category',
      items: itemsList,
    );
  }

  CategoryModel copyWith({
    String? name,
    List<MenuItemModel>? items,
  }) {
    return CategoryModel(
      id: id,
      name: name ?? this.name,
      items: items ?? this.items,
    );
  }
}
