class Customer {
  final String id;
  final String customerId;
  final String name;
  final String? email;
  final String? phone;
  final String group;
  final String loyaltyTier;
  final int totalOrders;
  final double totalSpent;
  final String? lastOrderDate;
  final String status;
  final List<String> loginPlatforms;
  final DateTime? createdAt;
  final String? backendSegment;
  final String? backendTag;
  final String? backendBadge;

  Customer({
    required this.id,
    required this.customerId,
    required this.name,
    this.email,
    this.phone,
    required this.group,
    required this.loyaltyTier,
    this.totalOrders = 0,
    this.totalSpent = 0.0,
    this.lastOrderDate,
    required this.status,
    this.loginPlatforms = const [],
    this.createdAt,
    this.backendSegment,
    this.backendTag,
    this.backendBadge,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      id: json['_id']?.toString() ?? '',
      customerId: json['customerId']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Unknown User',
      email: json['email']?.toString(),
      phone: json['phone']?.toString(),
      group: json['group']?.toString() ?? 'Others',
      loyaltyTier: json['loyaltyTier']?.toString() ?? 'Bronze',
      totalOrders: (json['totalOrders'] is num) ? (json['totalOrders'] as num).toInt() : 0,
      totalSpent: (json['totalSpent'] is num) ? (json['totalSpent'] as num).toDouble() : 0.0,
      lastOrderDate: json['lastOrderDate']?.toString(),
      status: json['status']?.toString() ?? 'Active',
      loginPlatforms: json['loginPlatforms'] != null ? List<String>.from(json['loginPlatforms']) : [],
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
      backendSegment: json['segment']?.toString(),
      backendTag: json['tag']?.toString(),
      backendBadge: json['badge']?.toString(),
    );
  }

  // --- Real Industry-Standard RFM Lifecycle Segmentation ---
  String get segment {
    if (backendSegment != null && backendSegment!.isNotEmpty) {
      return backendSegment!;
    }
    final tier = loyaltyTier.toLowerCase();
    if (totalSpent >= 100 || totalOrders >= 5 || tier == 'vip' || tier == 'gold' || tier == 'platinum') {
      return 'VIP';
    }
    if (totalOrders >= 3) {
      return 'Frequent';
    }
    if (totalOrders >= 2) {
      return 'Loyal';
    }
    final now = DateTime.now();
    final startOfMonth = DateTime(now.year, now.month, 1);
    if (createdAt != null && createdAt!.isAfter(startOfMonth)) {
      return 'New';
    }
    if (totalOrders <= 1) {
      return 'New';
    }
    return 'Regular';
  }

  String get tag {
    if (backendTag != null && backendTag!.isNotEmpty) {
      return backendTag!;
    }
    final tier = loyaltyTier.toLowerCase();
    if (totalSpent >= 100 || totalOrders >= 5 || tier == 'vip' || tier == 'gold' || tier == 'platinum') {
      return totalOrders >= 3 ? 'Frequent Customer' : 'VIP Customer';
    }
    if (totalOrders >= 3) {
      return 'Frequent Customer';
    }
    if (totalOrders >= 2) {
      return 'Loyal Customer';
    }
    final now = DateTime.now();
    final startOfMonth = DateTime(now.year, now.month, 1);
    if (createdAt != null && createdAt!.isAfter(startOfMonth)) {
      return 'New this month';
    }
    if (totalOrders <= 1) {
      return 'First time customer';
    }
    return 'Regular Customer';
  }

  String? get badge {
    if (backendBadge != null && backendBadge!.isNotEmpty) {
      return backendBadge;
    }
    final tier = loyaltyTier.toLowerCase();
    if (totalSpent >= 100 || totalOrders >= 5 || tier == 'vip' || tier == 'gold' || tier == 'platinum') {
      return 'VIP';
    }
    if (totalOrders >= 3) {
      return 'Frequent';
    }
    final now = DateTime.now();
    final startOfMonth = DateTime(now.year, now.month, 1);
    if ((createdAt != null && createdAt!.isAfter(startOfMonth)) || totalOrders <= 1) {
      return 'New';
    }
    return null;
  }
}
