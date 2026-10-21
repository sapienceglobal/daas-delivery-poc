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

    // Measure the exact rendered width of discountTitle (up to the last 'F' in "OFF")
    final TextPainter tp = TextPainter(
      text: TextSpan(
        text: discountTitle,
        style: const TextStyle(
          fontSize: 31,
          fontWeight: FontWeight.w900,
          letterSpacing: -0.6,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    final double discountWidth = tp.width;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      height: 172,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        boxShadow: const [
          BoxShadow(
            color: Color(0x354C0810),
            blurRadius: 14,
            offset: Offset(0, 6),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Full Background Food Photography (Curry in copper bowl + Naan on red background)
          if (networkImageUrl != null && networkImageUrl.startsWith('http'))
            CachedNetworkImage(
              imageUrl: networkImageUrl,
              fit: BoxFit.cover,
              alignment: Alignment.centerRight,
              placeholder: (context, url) => Container(color: const Color(0xFF4C0810)),
              errorWidget: (context, url, error) => Image.asset(
                'assets/images/branded/lassi-lounge/hero-offer-curry.jpg',
                fit: BoxFit.cover,
                alignment: Alignment.centerRight,
                errorBuilder: (ctx, err, st) => Image.asset(
                  'assets/images/branded/lassi-lounge/hero-curry.jpg',
                  fit: BoxFit.cover,
                  alignment: Alignment.centerRight,
                ),
              ),
            )
          else
            Image.asset(
              'assets/images/branded/lassi-lounge/hero-offer-curry.jpg',
              fit: BoxFit.cover,
              alignment: Alignment.centerRight,
              errorBuilder: (ctx, err, st) => Image.asset(
                'assets/images/branded/lassi-lounge/hero-curry.jpg',
                fit: BoxFit.cover,
                alignment: Alignment.centerRight,
              ),
            ),

          // 2. Rich Dark Red Gradient on the left side to ensure high-contrast text readability (Original gradient)
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                stops: [0.0, 0.38, 0.62, 1.0],
                colors: [
                  Color(0xFF5A0812),
                  Color(0xF05A0812),
                  Color(0x555A0812),
                  Colors.transparent,
                ],
              ),
            ),
          ),

          // 3. Subtle gold sparkle star near top-center
          const Positioned(
            top: 34,
            left: 178,
            child: Icon(Icons.star, color: Color(0xFFFFD56B), size: 13),
          ),

          // 4. Dynamic Backend Text & Actions Overlay
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 14, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Top: "EXCLUSIVE OFFER" badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFB800),
                    borderRadius: BorderRadius.circular(6),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x25000000),
                        blurRadius: 4,
                        offset: Offset(0, 1),
                      ),
                    ],
                  ),
                  child: const Text(
                    'EXCLUSIVE OFFER',
                    style: TextStyle(
                      fontSize: 9.5,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF1E1E1E),
                      letterSpacing: 0.4,
                    ),
                  ),
                ),

                // Center: Discount headline
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Get FLAT',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 13.5,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.3,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 1),
                    Text(
                      discountTitle,
                      style: const TextStyle(
                        color: Color(0xFFFFC72C),
                        fontSize: 31,
                        fontWeight: FontWeight.w900,
                        height: 1.05,
                        letterSpacing: -0.6,
                      ),
                    ),
                    const SizedBox(height: 2),
                    ConstrainedBox(
                      constraints: BoxConstraints(maxWidth: discountWidth),
                      child: Text(
                        subtitle,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.95),
                          fontSize: 10.5,
                          fontWeight: FontWeight.w400,
                          height: 1.16,
                        ),
                        maxLines: 4,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),

                // Bottom: Promo code pill & Min order terms
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    InkWell(
                      onTap: () => _copyCode(context, code),
                      borderRadius: BorderRadius.circular(6),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 9, vertical: 3.5),
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.65),
                            width: 1,
                          ),
                          borderRadius: BorderRadius.circular(6),
                          color: Colors.black.withValues(alpha: 0.22),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Text(
                              'Code: ',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 11,
                              ),
                            ),
                            Text(
                              code,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(width: 5),
                            const Icon(
                              Icons.copy_outlined,
                              color: Colors.white,
                              size: 12.5,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 2.5),
                    Text(
                      'Min. order \$$minCartValue • T&C Apply',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.8),
                        fontSize: 9,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
