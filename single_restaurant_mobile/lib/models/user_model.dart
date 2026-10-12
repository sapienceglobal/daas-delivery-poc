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
  final List<dynamic>? favoriteItems;
  final int loyaltyPoints;
  final bool isLoyaltyMember;
  final String? referralCode;
  final String referralOnboarding;
  final Map<String, dynamic>? notificationPreferences;
  final bool isSocialLogin;
  
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
    this.favoriteItems,
    this.loyaltyPoints = 0,
    this.isLoyaltyMember = false,
    this.referralCode,
    this.referralOnboarding = 'none',
    this.notificationPreferences,
    this.isSocialLogin = false,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final social = json['socialLogin'] as Map<String, dynamic>?;
    final hasSocial = social != null && (social['googleId'] != null || social['appleId'] != null);

    return UserModel(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      role: json['role'] ?? 'customer',
      isEmailVerified: json['isEmailVerified'] ?? false,
      isPhoneVerified: json['isPhoneVerified'] ?? false,
      profilePicture: json['avatar'] ?? json['profileImage'] ?? json['profilePicture'],
      addresses: json['savedAddresses'] as List<dynamic>?,
      savedCards: json['savedCards'] as List<dynamic>?,
      favoriteItems: json['favoriteItems'] as List<dynamic>?,
      loyaltyPoints: json['loyaltyPoints'] ?? 0,
      isLoyaltyMember: json['isLoyaltyMember'] ?? false,
      referralCode: json['referralCode'],
      referralOnboarding: json['referralOnboarding'] ?? 'none',
      notificationPreferences: json['notificationPreferences'] as Map<String, dynamic>?,
      isSocialLogin: hasSocial,
    );
  }
}
