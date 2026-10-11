import 'dart:convert';
import 'package:single_restaurant_mobile/services/api_service.dart';

class ReferralService {
  /// Fetch public program configuration (dynamic values, texts, T&C)
  Future<Map<String, dynamic>?> getProgram() async {
    try {
      final response = await ApiService.get('/api/referrals/program');
      final data = json.decode(response.body);
      if (data['success'] == true && data['data'] != null) {
        return Map<String, dynamic>.from(data['data']);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Fetch logged-in user's referral details, stats, myCoupon, and program info
  Future<Map<String, dynamic>?> getMyReferral() async {
    try {
      final response = await ApiService.get('/api/referrals/me');
      final data = json.decode(response.body);
      if (data['success'] == true && data['data'] != null) {
        return Map<String, dynamic>.from(data['data']);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Apply a friend's referral code during onboarding or first order
  Future<Map<String, dynamic>> applyCode(String code) async {
    final response = await ApiService.post('/api/referrals/apply', {
      'code': code.trim().toUpperCase(),
    });
    final data = json.decode(response.body);
    if (data['success'] == true) {
      return Map<String, dynamic>.from(data['data'] ?? {});
    }
    throw Exception(data['message'] ?? 'Failed to apply referral code');
  }

  /// Mark referral onboarding as skipped (one-time prompt dismissed)
  Future<bool> skipOnboarding() async {
    try {
      final response = await ApiService.post('/api/referrals/skip', {});
      final data = json.decode(response.body);
      return data['success'] == true;
    } catch (_) {
      return false;
    }
  }
}
