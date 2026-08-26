class PromotionModel {
  final String id;
  final String code;
  final String name;
  final String promoType;
  final List<String> channels;
  final String description;
  final String type; // 'fixed' or 'percentage'
  final double value;
  final double? maxDiscount;
  final double minCartValue;
  final bool firstOrderOnly;
  final int minOrdersRequired;
  final List<String> allowedPaymentMethods;
  final String targetGroup;
  final int? maxUses;
  final int usedCount;
  final DateTime startDate;
  final DateTime endDate;
  final bool isActive;

  PromotionModel({
    required this.id,
    required this.code,
    required this.name,
    required this.promoType,
    this.channels = const ['Mobile', 'Web'],
    this.description = '',
    required this.type,
    required this.value,
    this.maxDiscount,
    this.minCartValue = 0,
    this.firstOrderOnly = false,
    this.minOrdersRequired = 0,
    this.allowedPaymentMethods = const ['All'],
    this.targetGroup = 'All Users',
    this.maxUses,
    this.usedCount = 0,
    required this.startDate,
    required this.endDate,
    this.isActive = true,
  });

  factory PromotionModel.fromJson(Map<String, dynamic> json) {
    return PromotionModel(
      id: json['_id'] ?? '',
      code: json['code'] ?? '',
      name: json['name'] ?? 'Promo Offer',
      promoType: json['promoType'] ?? 'Coupon',
      channels: json['channels'] != null ? List<String>.from(json['channels']) : ['Mobile', 'Web'],
      description: json['description'] ?? '',
      type: json['type'] ?? 'fixed',
      value: (json['value'] ?? 0).toDouble(),
      maxDiscount: json['maxDiscount'] != null ? (json['maxDiscount']).toDouble() : null,
      minCartValue: (json['minCartValue'] ?? 0).toDouble(),
      firstOrderOnly: json['firstOrderOnly'] ?? false,
      minOrdersRequired: json['minOrdersRequired'] ?? 0,
      allowedPaymentMethods: json['allowedPaymentMethods'] != null ? List<String>.from(json['allowedPaymentMethods']) : ['All'],
      targetGroup: json['targetGroup'] ?? 'All Users',
      maxUses: json['maxUses'],
      usedCount: json['usedCount'] ?? 0,
      startDate: json['startDate'] != null ? DateTime.parse(json['startDate']) : DateTime.now(),
      endDate: json['endDate'] != null ? DateTime.parse(json['endDate']) : DateTime.now().add(const Duration(days: 30)),
      isActive: json['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'code': code,
      'name': name,
      'promoType': promoType,
      'channels': channels,
      'description': description,
      'type': type,
      'value': value,
      'maxDiscount': maxDiscount,
      'minCartValue': minCartValue,
      'firstOrderOnly': firstOrderOnly,
      'minOrdersRequired': minOrdersRequired,
      'allowedPaymentMethods': allowedPaymentMethods,
      'targetGroup': targetGroup,
      'maxUses': maxUses,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'isActive': isActive,
    };
  }
}
