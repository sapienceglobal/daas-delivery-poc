import 'package:flutter/material.dart';

class SupportFaqItem {
  final String id;
  final String category;
  final String categoryTitle;
  final IconData icon;
  final String question;
  final String answer;
  final List<String> tags;
  final String? actionLabel;
  final String? actionType;

  const SupportFaqItem({
    required this.id,
    required this.category,
    required this.categoryTitle,
    required this.icon,
    required this.question,
    required this.answer,
    required this.tags,
    this.actionLabel,
    this.actionType,
  });
}

class SupportFaqData {
  static const List<SupportFaqItem> allFaqs = [
    // ----------------- ORDER ISSUES -----------------
    SupportFaqItem(
      id: 'order_1',
      category: 'order',
      categoryTitle: 'Order Issues',
      icon: Icons.cancel_outlined,
      question: 'How do I cancel my order?',
      answer:
          'You can cancel your order directly from the order details screen while the status is "Order Placed / Pending". Once the kitchen accepts and starts cooking your food, automated cancellation is locked to prevent food wastage. For urgent assistance, please tap "Call Restaurant" immediately.',
      tags: ['cancel order', 'cancel', 'cancellation', 'stop order', 'change mind', 'mistake', 'cancel active order'],
      actionLabel: 'Call Restaurant',
      actionType: 'call',
    ),
    SupportFaqItem(
      id: 'order_2',
      category: 'order',
      categoryTitle: 'Order Issues',
      icon: Icons.inventory_2_outlined,
      question: 'What if an item is missing or incorrect in my order?',
      answer:
          'We sincerely apologize for any mix-up! Please reach out to us right away via "Call Us" or "WhatsApp" with your Order ID and a quick photo of the items received. Our kitchen team will immediately dispatch a fresh replacement or process an instant refund for the missing item.',
      tags: ['wrong item', 'missing item', 'incorrect item', 'missing', 'incorrect', 'bad food', 'damaged', 'cold', 'wrong food', 'replacement'],
      actionLabel: 'WhatsApp Support',
      actionType: 'whatsapp',
    ),
    SupportFaqItem(
      id: 'order_3',
      category: 'order',
      categoryTitle: 'Order Issues',
      icon: Icons.edit_note_outlined,
      question: 'Can I customize spices or add cooking instructions?',
      answer:
          'Yes! On each food item page and inside the Cart, you will find a "Special Instructions" box. You can specify spice level (Mild, Medium, Spicy), dietary restrictions, or food allergies. The kitchen reviews these notes before cooking.',
      tags: ['customize', 'spice', 'allergies', 'special instructions', 'notes', 'customization'],
      actionLabel: 'View Menu',
      actionType: 'menu',
    ),
    SupportFaqItem(
      id: 'order_4',
      category: 'order',
      categoryTitle: 'Order Issues',
      icon: Icons.map_outlined,
      question: 'How do I track my live order in real time?',
      answer:
          'Go to the "Orders" tab and tap your ongoing order. You will see a live interactive MapLibre GPS map with the restaurant location, your delivery partner\'s live position, the route polyline, and real-time preparation status updates (Placed → Cooking → Out for Delivery → Delivered).',
      tags: ['track live order', 'track order', 'live tracking', 'where is my order', 'status', 'active order', 'map', 'track', 'live order', 'order tracking', 'gps'],
      actionLabel: 'Track Active Order',
      actionType: 'track_order',
    ),

    // ----------------- REFUNDS & PAYMENTS -----------------
    SupportFaqItem(
      id: 'refund_1',
      category: 'refund',
      categoryTitle: 'Refunds & Payments',
      icon: Icons.currency_exchange,
      question: 'What is the refund timeline for cancelled orders or payments?',
      answer:
          'Once a cancellation or refund is approved, our automated billing gateway initiates the refund instantly. For Credit & Debit cards processed via Stripe, funds reflect in your bank account within 3 to 5 business days, depending on your bank issuer. Cash on Delivery orders incur zero charges.',
      tags: ['refund timeline', 'refund', 'money back', 'credit card', 'bank', 'stripe', 'timeline', 'delay', 'refund status', 'refund time'],
      actionLabel: 'Call Billing Support',
      actionType: 'call',
    ),
    SupportFaqItem(
      id: 'refund_2',
      category: 'refund',
      categoryTitle: 'Refunds & Payments',
      icon: Icons.error_outline,
      question: 'What should I do if payment failed or money was deducted?',
      answer:
          'Do not worry! If a network interruption occurred during checkout, your funds are completely safe. The payment gateway (Stripe) automatically voids unconfirmed charges, and your bank will release the temporary authorization hold back into your account within 24 to 48 hours.',
      tags: ['payment failed', 'deducted', 'failed', 'double charge', 'pending', 'otp', 'card declined', 'payment error', 'failed payment'],
      actionLabel: 'Contact Billing Support',
      actionType: 'call',
    ),
    SupportFaqItem(
      id: 'refund_3',
      category: 'refund',
      categoryTitle: 'Refunds & Payments',
      icon: Icons.credit_card_outlined,
      question: 'Which payment methods are accepted in the app?',
      answer:
          'We accept all major Credit & Debit cards (Visa, MasterCard, American Express, Discover) secured via Stripe with 3D Secure verification. Depending on your device and store settings, Apple Pay, Google Pay, and Cash on Delivery (COD) are also available.',
      tags: ['payment methods', 'cards', 'visa', 'mastercard', 'cod', 'cash', 'apple pay', 'google pay', 'payment method'],
      actionLabel: 'Manage Saved Cards',
      actionType: 'cards',
    ),
    SupportFaqItem(
      id: 'refund_4',
      category: 'refund',
      categoryTitle: 'Refunds & Payments',
      icon: Icons.verified_user_outlined,
      question: 'Are my saved card details secure?',
      answer:
          '100% secure. We never store full card numbers or CVVs on our servers. All card storage and payment processing is handled through Stripe, an industry-leading PCI-DSS Level 1 certified payment provider with bank-grade encryption.',
      tags: ['secure', 'safe', 'card details', 'cvv', 'pci', 'privacy', 'stripe', 'security'],
      actionLabel: 'Manage Saved Cards',
      actionType: 'cards',
    ),

    // ----------------- DELIVERY SUPPORT -----------------
    SupportFaqItem(
      id: 'delivery_1',
      category: 'delivery',
      categoryTitle: 'Delivery Support',
      icon: Icons.phone_in_talk_outlined,
      question: 'How do I contact my delivery partner or driver?',
      answer:
          'As soon as your order status updates to "Out for Delivery", a direct "Call Delivery Partner" button appears on your live tracking screen. You can call the driver directly to provide building gate codes, apartment landmarks, or parking instructions.',
      tags: ['contact driver', 'driver', 'rider', 'call driver', 'delivery partner', 'phone', 'contact rider', 'call partner'],
      actionLabel: 'Track Delivery',
      actionType: 'track_order',
    ),
    SupportFaqItem(
      id: 'delivery_2',
      category: 'delivery',
      categoryTitle: 'Delivery Support',
      icon: Icons.access_time_rounded,
      question: 'What should I do if my delivery is delayed?',
      answer:
          'Standard delivery takes 25 to 45 minutes depending on distance and fresh kitchen preparation. You can monitor the real-time ETA countdown on the tracking screen. If your order is running more than 15 minutes past the estimated delivery time, tap "Call Restaurant" for priority assistance.',
      tags: ['delay', 'late', 'traffic', 'eta', 'waiting', 'slow delivery', 'delayed delivery', 'late order'],
      actionLabel: 'Call Restaurant',
      actionType: 'call',
    ),
    SupportFaqItem(
      id: 'delivery_3',
      category: 'delivery',
      categoryTitle: 'Delivery Support',
      icon: Icons.edit_location_alt_outlined,
      question: 'Can I change my delivery address after placing an order?',
      answer:
          'Because delivery routing and rider dispatch are calculated based on GPS distance, you cannot modify the delivery address in the app after placing the order. Please call our restaurant helpline immediately so our dispatch team can assist you if the new location is nearby.',
      tags: ['change address', 'wrong address', 'update location', 'drop off', 'mistake address'],
      actionLabel: 'Call Helpline',
      actionType: 'call',
    ),
    SupportFaqItem(
      id: 'delivery_4',
      category: 'delivery',
      categoryTitle: 'Delivery Support',
      icon: Icons.door_front_door_outlined,
      question: 'Do you offer contactless doorstep delivery?',
      answer:
          'Yes! During checkout or in your saved address instructions, you can leave a note such as "Leave at front door" or "Leave with doorman". The delivery partner will drop the package safely and notify you.',
      tags: ['contactless', 'doorstep', 'front door', 'safety', 'instructions', 'contactless delivery'],
      actionLabel: 'Manage Addresses',
      actionType: 'addresses',
    ),

    // ----------------- ACCOUNT & APP HELP -----------------
    SupportFaqItem(
      id: 'account_1',
      category: 'account',
      categoryTitle: 'Account & App Help',
      icon: Icons.home_work_outlined,
      question: 'How do I save and manage multiple delivery addresses?',
      answer:
          'Navigate to Profile > Saved Addresses. You can add Home, Work, or Custom addresses using GPS auto-pinning, house/flat numbers, street names, and landmark directions for effortless one-tap checkout.',
      tags: ['saved address', 'saved addresses', 'address', 'home', 'work', 'new address', 'location', 'gps', 'delivery address', 'manage address'],
      actionLabel: 'Manage Addresses',
      actionType: 'addresses',
    ),
    SupportFaqItem(
      id: 'account_2',
      category: 'account',
      categoryTitle: 'Account & App Help',
      icon: Icons.person_outline,
      question: 'Can I browse and use the app without logging in (Guest Mode)?',
      answer:
          'Yes! In Guest Mode, you can browse our full menu, customize dishes, and view ongoing discount offers. You will only be prompted to log in when you want to place an order, save delivery addresses, or access your loyalty reward points.',
      tags: ['guest', 'guest mode', 'login', 'signup', 'account', 'register', 'without login'],
      actionLabel: 'Explore Menu',
      actionType: 'menu',
    ),
    SupportFaqItem(
      id: 'account_3',
      category: 'account',
      categoryTitle: 'Account & App Help',
      icon: Icons.notifications_none_outlined,
      question: 'How do I manage notification settings and alerts?',
      answer:
          'Go to Profile > Notification Settings. You can toggle push notifications for real-time order status updates, kitchen progress, driver arrival, and exclusive seasonal promotions.',
      tags: ['notifications', 'alerts', 'push notification', 'promos', 'settings'],
      actionLabel: 'Notification Settings',
      actionType: 'notifications',
    ),
    SupportFaqItem(
      id: 'account_4',
      category: 'account',
      categoryTitle: 'Account & App Help',
      icon: Icons.manage_accounts_outlined,
      question: 'How do I edit my name, email, or profile photo?',
      answer:
          'Go to Profile > Edit Profile. You can update your name, email address, and select a stylish avatar picture. Tap "Save Changes" to update your profile across the app.',
      tags: ['edit profile', 'change name', 'email', 'avatar', 'photo', 'update account'],
      actionLabel: 'Edit Profile',
      actionType: 'edit_profile',
    ),

    // ----------------- OFFERS & LOYALTY -----------------
    SupportFaqItem(
      id: 'offers_1',
      category: 'offers',
      categoryTitle: 'Offers & Promotions',
      icon: Icons.stars_outlined,
      question: 'How do Loyalty Reward Points work and how do I redeem them?',
      answer:
          'Every completed order automatically earns reward points in your Loyalty Wallet! You can view your points balance and history in Profile > Loyalty Rewards. During checkout, you can redeem available points for an instant cash discount on your bill.',
      tags: ['loyalty points', 'loyalty', 'points', 'rewards', 'coins', 'cashback', 'wallet', 'redeem', 'reward points'],
      actionLabel: 'View Loyalty Rewards',
      actionType: 'loyalty',
    ),
    SupportFaqItem(
      id: 'offers_2',
      category: 'offers',
      categoryTitle: 'Offers & Promotions',
      icon: Icons.local_offer_outlined,
      question: 'How do I apply coupon codes for discounts?',
      answer:
          'On the Cart or Checkout screen, tap "Apply Coupon". You can pick from available store promotions or enter a special promotional promo code. The discount will instantly reflect on your item total before you proceed to payment.',
      tags: ['apply coupon', 'coupon', 'promo code', 'discount', 'voucher', 'deal', 'offer', 'coupons'],
      actionLabel: 'View Current Offers',
      actionType: 'offers',
    ),
    SupportFaqItem(
      id: 'offers_3',
      category: 'offers',
      categoryTitle: 'Offers & Promotions',
      icon: Icons.rule_folder_outlined,
      question: 'Can I combine multiple coupons and loyalty points together?',
      answer:
          'You can apply one promotional coupon per order. However, you can freely combine that active coupon with your earned Loyalty Points redemption for maximum savings!',
      tags: ['combine', 'multiple coupons', 'rules', 'points and coupons'],
      actionLabel: 'View Current Offers',
      actionType: 'offers',
    ),
  ];

  static List<SupportFaqItem> getByCategory(String categoryKey) {
    return allFaqs.where((item) => item.category == categoryKey).toList();
  }

  static List<SupportFaqItem> search(String query) {
    final clean = query.trim().toLowerCase();
    if (clean.isEmpty) return allFaqs;

    // Tokens (words with 2+ characters)
    final queryTokens = clean
        .split(RegExp(r'[^a-zA-Z0-9]+'))
        .where((t) => t.length > 1)
        .toList();

    return allFaqs.where((item) {
      final qLower = item.question.toLowerCase();
      final aLower = item.answer.toLowerCase();
      final catLower = item.categoryTitle.toLowerCase();
      final tagsLower = item.tags.map((t) => t.toLowerCase()).toList();

      // 1. Direct exact phrase match in tags, question, category
      if (tagsLower.contains(clean)) return true;
      if (qLower.contains(clean) || catLower.contains(clean)) return true;

      // 2. Direct exact phrase match in tags partially (tag contains clean or clean contains tag)
      if (tagsLower.any((t) => t.contains(clean) || clean.contains(t))) return true;

      // 3. Direct exact phrase match in answer
      if (aLower.contains(clean)) return true;

      // 4. Token-based matching:
      // If every token from the query appears in the item's combined text
      if (queryTokens.isNotEmpty) {
        final combined = '$qLower $catLower ${tagsLower.join(' ')} $aLower';
        if (queryTokens.every((token) => combined.contains(token))) {
          return true;
        }

        // If query has 2+ words, also match if all words match in question + tags
        final headerCombined = '$qLower ${tagsLower.join(' ')}';
        final matchedCount = queryTokens.where((t) => headerCombined.contains(t)).length;
        if (matchedCount >= 2 && matchedCount >= queryTokens.length - 1) {
          return true;
        }
      }

      return false;
    }).toList();
  }
}
