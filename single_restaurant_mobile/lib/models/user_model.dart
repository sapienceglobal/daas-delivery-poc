class UserModel {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String role;
  final bool isEmailVerified;
  final bool isPhoneVerified;
  final String? profilePicture;
  
  // For customers
  final List<dynamic>? addresses;
  final List<dynamic>? savedCards;
  final int loyaltyPoints;
  final String? referralCode;
  
  UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.role,
    this.isEmailVerified = false,
    this.isPhoneVerified = false,
    this.profilePicture,
    this.addresses,
    this.savedCards,
    this.loyaltyPoints = 0,
    this.referralCode,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      role: json['role'] ?? 'customer',
      isEmailVerified: json['isEmailVerified'] ?? false,
      isPhoneVerified: json['isPhoneVerified'] ?? false,
      profilePicture: json['profilePicture'],
      addresses: json['savedAddresses'] as List<dynamic>?,
      savedCards: json['savedCards'] as List<dynamic>?,
      loyaltyPoints: json['loyaltyPoints'] ?? 0,
      referralCode: json['referralCode'],
    );
  }
}
