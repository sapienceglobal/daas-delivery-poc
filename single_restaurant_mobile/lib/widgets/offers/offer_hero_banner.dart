import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';

/// Featured top hero banner for Offers Screen.
/// Displays dynamic backend coupon with food image, rich maroon gradient,
/// copyable coupon code pill, and discount headline.
class OfferHeroBanner extends StatelessWidget {
  final dynamic coupon;

  const OfferHeroBanner({
    super.key,
    required this.coupon,
  });

  void _copyCode(BuildContext context, String code) {
    Clipboard.setData(ClipboardData(text: code));
    ToastUtils.showSuccess(context, 'Promo code $code copied!');
  }

  @override
  Widget build(BuildContext context) {
    final String code = (coupon['code'] ?? 'WELCOME20').toString();
    final bool isPercentage = coupon['type'] == 'percentage';
    final String discountTitle = isPercentage
        ? '${coupon['value'] ?? 20}% OFF'
        : '\$${coupon['value'] ?? 20} OFF';
    final String subtitle = coupon['firstOrderOnly'] == true
        ? 'on your first order'
        : (coupon['description'] ?? 'on all orders');
    final num minCartValue = coupon['minCartValue'] ?? 0;
    final String? networkImageUrl = coupon['image']?.toString();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: const LinearGradient(
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
          colors: [
            Color(0xFF4C0810),
            Color(0xFF6B111C),
            Color(0xFF540A12),
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF4C0810).withValues(alpha: 0.25),
            blurRadius: 12,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          // 1. Right side food dish image with smooth fade blend
          Positioned(
            right: 0,
            top: 0,
            bottom: 0,
            width: 175,
            child: Stack(
              children: [
                Positioned.fill(
                  child: networkImageUrl != null && networkImageUrl.startsWith('http')
                      ? CachedNetworkImage(
                          imageUrl: networkImageUrl,
                          fit: BoxFit.cover,
                          errorWidget: (context, url, error) => Image.asset(
                            'assets/images/branded/lassi-lounge/hero-curry.jpg',
                            fit: BoxFit.cover,
                            alignment: Alignment.centerRight,
                          ),
                        )
                      : Image.asset(
                          'assets/images/branded/lassi-lounge/hero-curry.jpg',
                          fit: BoxFit.cover,
                          alignment: Alignment.centerRight,
                        ),
                ),
                Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.centerLeft,
                        end: Alignment.centerRight,
                        colors: [
                          const Color(0xFF4C0810),
                          const Color(0xFF4C0810).withValues(alpha: 0.0),
                        ],
                        stops: const [0.0, 0.45],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 2. Decorative gold sparkle stars
          const Positioned(
            top: 36,
            left: 175,
            child: Icon(Icons.star, color: Color(0xFFFFD56B), size: 14),
          ),
          const Positioned(
            top: 52,
            left: 195,
            child: Icon(Icons.star, color: Color(0xFFFFD56B), size: 10),
          ),

          // 3. Left Text & Action Content
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 130, 10),
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // "EXCLUSIVE OFFER" pill
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFB800),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      'EXCLUSIVE OFFER',
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF1E1E1E),
                        letterSpacing: 0.4,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),

                  // "Get FLAT"
                  const Text(
                    'Get FLAT',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14.5,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.2,
                    ),
                  ),

                  // Large discount headline
                  Text(
                    discountTitle,
                    style: const TextStyle(
                      color: Color(0xFFFFC72C),
                      fontSize: 30,
                      fontWeight: FontWeight.w900,
                      height: 1.05,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 2),

                  // Subtitle
                  Text(
                    subtitle,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12.5,
                      fontWeight: FontWeight.w400,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),

                  // Copyable Coupon Code Box
                  InkWell(
                    onTap: () => _copyCode(context, code),
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.6),
                          width: 1,
                        ),
                        borderRadius: BorderRadius.circular(6),
                        color: Colors.black.withValues(alpha: 0.15),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text(
                            'Code: ',
                            style: TextStyle(color: Colors.white70, fontSize: 11),
                          ),
                          Text(
                            code,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Icon(
                            Icons.copy_outlined,
                            color: Colors.white,
                            size: 13,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),

                  // Terms line
                  Text(
                    'Min. order \$$minCartValue • T&C Apply',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.75),
                      fontSize: 9.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
