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
  final bool requiresPasswordForDeletion;
  final String deletionVerificationMode;
  
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
    this.requiresPasswordForDeletion = true,
    this.deletionVerificationMode = 'password',
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final social = json['socialLogin'] is Map
        ? Map<String, dynamic>.from(json['socialLogin'] as Map)
        : null;
    final hasSocial = social != null && (social['googleId'] != null || social['appleId'] != null);

    return UserModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      phone: (json['phone'] ?? '').toString(),
      role: (json['role'] ?? 'customer').toString(),
      isEmailVerified: json['isEmailVerified'] == true,
      isPhoneVerified: json['isPhoneVerified'] == true,
      profilePicture: (json['avatar'] ?? json['profileImage'] ?? json['profilePicture'])?.toString(),
      addresses: json['savedAddresses'] is List ? json['savedAddresses'] as List<dynamic> : null,
      savedCards: json['savedCards'] is List ? json['savedCards'] as List<dynamic> : null,
      favoriteItems: json['favoriteItems'] is List ? json['favoriteItems'] as List<dynamic> : null,
      loyaltyPoints: (json['loyaltyPoints'] is num) ? (json['loyaltyPoints'] as num).toInt() : 0,
      isLoyaltyMember: json['isLoyaltyMember'] == true,
      referralCode: json['referralCode']?.toString(),
      referralOnboarding: (json['referralOnboarding'] ?? 'none').toString(),
      notificationPreferences: json['notificationPreferences'] is Map
          ? Map<String, dynamic>.from(json['notificationPreferences'] as Map)
          : null,
      isSocialLogin: hasSocial,
      requiresPasswordForDeletion: json['requiresPasswordForDeletion'] is bool
          ? json['requiresPasswordForDeletion'] as bool
          : !hasSocial,
      deletionVerificationMode: (json['deletionVerificationMode'] ?? (!hasSocial ? 'password' : 'otp')).toString(),
    );
  }
}
