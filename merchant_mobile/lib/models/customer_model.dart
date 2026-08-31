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
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      id: json['_id'] ?? '',
      customerId: json['customerId'] ?? '',
      name: json['name'] ?? 'Unknown User',
      email: json['email'],
      phone: json['phone'],
      group: json['group'] ?? 'Others',
      loyaltyTier: json['loyaltyTier'] ?? 'Bronze',
      totalOrders: json['totalOrders'] ?? 0,
      totalSpent: (json['totalSpent'] ?? 0).toDouble(),
      lastOrderDate: json['lastOrderDate'],
      status: json['status'] ?? 'Active',
      loginPlatforms: json['loginPlatforms'] != null ? List<String>.from(json['loginPlatforms']) : [],
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
    );
  }
}
