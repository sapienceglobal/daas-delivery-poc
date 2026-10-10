import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Card item for "BEST OFFERS FOR YOU" matching the screenshot.
class OfferCardItem extends StatefulWidget {
  final dynamic coupon;
  final VoidCallback onInfoTap;

  const OfferCardItem({
    super.key,
    required this.coupon,
    required this.onInfoTap,
  });

  @override
  State<OfferCardItem> createState() => _OfferCardItemState();
}

class _OfferCardItemState extends State<OfferCardItem> {
  bool _isCopied = false;

  void _copyCode() {
    final code = (widget.coupon['code'] ?? '').toString();
    if (code.isEmpty) return;
    Clipboard.setData(ClipboardData(text: code));
    setState(() => _isCopied = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _isCopied = false);
    });
  }

  IconData _getCouponIcon() {
    final type = (widget.coupon['type'] ?? '').toString().toLowerCase();
    final desc = (widget.coupon['description'] ?? '').toString().toLowerCase();
    if (type == 'percentage') return Icons.percent;
    if (type == 'free_delivery' || desc.contains('delivery')) {
      return Icons.local_shipping_outlined;
    }
    return Icons.card_giftcard_outlined;
  }

  String _formatValidity(dynamic endDate) {
    if (endDate == null) return 'Limited time offer';
    try {
      final dt = DateTime.parse(endDate.toString());
      final d = dt.day.toString().padLeft(2, '0');
      final m = dt.month.toString().padLeft(2, '0');
      return 'Valid till $d/$m/${dt.year}';
    } catch (_) {
      return 'Limited time offer';
    }
  }

  @override
  Widget build(BuildContext context) {
    final coupon = widget.coupon;
    final String code = (coupon['code'] ?? '').toString();
    final String type = (coupon['type'] ?? '').toString().toLowerCase();
    final String title = type == 'percentage'
        ? '${coupon['value'] ?? 0}% OFF'
        : type == 'free_delivery'
            ? 'Free Delivery'
            : '\$${coupon['value'] ?? 0} OFF';

    final num minCart = coupon['minCartValue'] ?? 0;
    final String subtitle = minCart > 0
        ? 'on orders above \$$minCart'
        : (coupon['description'] ?? 'Exclusive offer');

    return Container(
      width: 160,
      margin: const EdgeInsets.only(right: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Info icon button at top right
          Positioned(
            top: 4,
            right: 4,
            child: IconButton(
              icon: Icon(
                Icons.info_outline,
                size: 16,
                color: Colors.grey.shade500,
              ),
              onPressed: widget.onInfoTap,
              splashRadius: 16,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
            ),
          ),

          // Content
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 14, 10, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Circular icon badge
                Container(
                  width: 42,
                  height: 42,
                  decoration: const BoxDecoration(
                    color: Color(0xFFFDE8E8),
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Icon(
                    _getCouponIcon(),
                    color: const Color(0xFF8B1E1E),
                    size: 20,
                  ),
                ),
                const SizedBox(height: 8),

                // Title
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1E1E1E),
                    height: 1.1,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),

                // Subtitle
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey.shade600,
                    height: 1.15,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const Spacer(),

                // Copyable Code Box
                InkWell(
                  onTap: _copyCode,
                  borderRadius: BorderRadius.circular(6),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4.5),
                    decoration: BoxDecoration(
                      color: _isCopied ? const Color(0xFFE8F5E9) : Colors.white,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: _isCopied
                            ? Colors.green.shade600
                            : const Color(0xFF8B1E1E).withValues(alpha: 0.6),
                        width: 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (!_isCopied) ...[
                          const Text(
                            'Code: ',
                            style: TextStyle(
                              fontSize: 10,
                              color: Color(0xFF555555),
                            ),
                          ),
                          Flexible(
                            child: Text(
                              code,
                              style: const TextStyle(
                                fontSize: 10.5,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF8B1E1E),
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(
                            Icons.copy_outlined,
                            size: 11,
                            color: Color(0xFF8B1E1E),
                          ),
                        ] else ...[
                          Icon(Icons.check, size: 12, color: Colors.green.shade700),
                          const SizedBox(width: 4),
                          Text(
                            'COPIED',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: Colors.green.shade700,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 6),

                // Validity date
                Text(
                  _formatValidity(coupon['endDate']),
                  style: TextStyle(
                    fontSize: 9.5,
                    color: Colors.grey.shade500,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
