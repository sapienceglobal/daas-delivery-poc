import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class WelcomeOfferCard extends StatefulWidget {
  final Map<String, dynamic> coupon;
  const WelcomeOfferCard({super.key, required this.coupon});

  @override
  State<WelcomeOfferCard> createState() => _WelcomeOfferCardState();
}

class _WelcomeOfferCardState extends State<WelcomeOfferCard>
    with SingleTickerProviderStateMixin {
  bool _isCopied = false;
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _scaleAnimation =
        Tween<double>(begin: 1.0, end: 1.1).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.elasticOut,
    ));
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _copyCode() {
    if (_isCopied) return;
    Clipboard.setData(ClipboardData(text: widget.coupon['code']));
    setState(() {
      _isCopied = true;
    });
    _animationController.forward().then((_) => _animationController.reverse());

    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() {
          _isCopied = false;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final coupon = widget.coupon;
    final isPercentage = coupon['type'] == 'percentage' || coupon['discountType'] == 'percentage';
    final val = coupon['value'] ?? coupon['discountValue'] ?? 20;
    final discountStr = isPercentage ? '$val% OFF' : '\$$val OFF';
    final titleStr = coupon['promoType']?.toString().toUpperCase() ?? 'FIRST ORDER OFFER';
    final desc = coupon['description'] ??
        'Enjoy $discountStr on your very first order on our Website and App!';
    final code = (coupon['code'] ?? 'WELCOME20').toString().toUpperCase();

    return Container(
      width: 220,
      height: 185,
      margin: const EdgeInsets.only(left: 16, right: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF6E0D14),
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF6E0D14).withValues(alpha: 0.25),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: Stack(
          children: [
            // Decorative gold mandala corner pattern watermark
            Positioned(
              top: -15,
              right: -15,
              child: Opacity(
                opacity: 0.28,
                child: Image.asset(
                  'assets/images/branded/lassi-lounge/mandala_pattern.png',
                  width: 110,
                  height: 110,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) => const SizedBox(),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.card_giftcard,
                        color: Color(0xFFE5A93C),
                        size: 15,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          titleStr,
                          style: const TextStyle(
                            color: Color(0xFFE5A93C),
                            fontWeight: FontWeight.w800,
                            fontSize: 10,
                            letterSpacing: 0.7,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 5),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      discountStr,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 27,
                        fontWeight: FontWeight.w900,
                        height: 1.05,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Expanded(
                    child: Text(
                      desc,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.9),
                        fontSize: 10.5,
                        fontWeight: FontWeight.w400,
                        height: 1.2,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  GestureDetector(
                    onTap: _copyCode,
                    child: ScaleTransition(
                      scale: _scaleAnimation,
                      child: CustomPaint(
                        painter: _DashedBorderPainter(
                          color: _isCopied
                              ? const Color(0xFFE5A93C)
                              : const Color(0xFFE5A93C).withValues(alpha: 0.8),
                          borderRadius: 8,
                        ),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: _isCopied
                                ? const Color(0xFFE5A93C)
                                : Colors.black.withValues(alpha: 0.20),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  _isCopied ? 'CODE COPIED!' : 'CODE: $code',
                                  style: TextStyle(
                                    color: _isCopied
                                        ? const Color(0xFF6E0D14)
                                        : const Color(0xFFFFD275),
                                    fontWeight: FontWeight.w800,
                                    fontSize: 10.5,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Icon(
                                  _isCopied ? Icons.check : Icons.copy_rounded,
                                  color: _isCopied
                                      ? const Color(0xFF6E0D14)
                                      : const Color(0xFFFFD275),
                                  size: 13,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DashedBorderPainter extends CustomPainter {
  final Color color;
  final double borderRadius;
  static const double strokeWidth = 1.1;
  static const double dashWidth = 4.0;
  static const double dashSpace = 3.0;

  _DashedBorderPainter({
    required this.color,
    this.borderRadius = 8.0,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke;

    final rrect = RRect.fromRectAndRadius(
      Rect.fromLTWH(strokeWidth / 2, strokeWidth / 2, size.width - strokeWidth, size.height - strokeWidth),
      Radius.circular(borderRadius),
    );

    final path = Path()..addRRect(rrect);
    final metrics = path.computeMetrics();

    for (final metric in metrics) {
      double distance = 0.0;
      while (distance < metric.length) {
        final len = (distance + dashWidth < metric.length) ? dashWidth : metric.length - distance;
        final extractPath = metric.extractPath(distance, distance + len);
        canvas.drawPath(extractPath, paint);
        distance += dashWidth + dashSpace;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DashedBorderPainter oldDelegate) {
    return oldDelegate.color != color || oldDelegate.borderRadius != borderRadius;
  }
}

