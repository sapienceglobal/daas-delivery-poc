import 'package:flutter/material.dart';

class PartnerCard extends StatelessWidget {
  final String partnerName;
  final Color logoColor;
  final Color logoTextColor;
  final Color accentColor;
  final String deliveryTime;
  final String benefitText;
  final String rating;
  final String reviews;
  final Widget? customLogoWidget;
  final VoidCallback? onOrderTap;

  const PartnerCard({
    super.key,
    required this.partnerName,
    required this.logoColor,
    required this.logoTextColor,
    required this.accentColor,
    required this.deliveryTime,
    required this.benefitText,
    required this.rating,
    required this.reviews,
    this.customLogoWidget,
    this.onOrderTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: logoColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: customLogoWidget ??
                      Text(
                        partnerName.split(' ').join('\n'),
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: logoTextColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          height: 1.1,
                        ),
                      ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            partnerName,
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                              color: Colors.black87,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 6,
                                height: 6,
                                decoration: BoxDecoration(color: accentColor, shape: BoxShape.circle),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'Open',
                                style: TextStyle(
                                  color: accentColor,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    _buildIconTextRow(Icons.check_circle_outline, deliveryTime),
                    const SizedBox(height: 3),
                    _buildIconTextRow(Icons.local_offer_outlined, benefitText),
                    const SizedBox(height: 3),
                    _buildIconTextRow(Icons.location_on_outlined, 'Live order tracking'),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Row(
                    children: [
                      Icon(Icons.star, color: Colors.amber.shade600, size: 14),
                      const SizedBox(width: 3),
                      Text(
                        rating,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                    ],
                  ),
                  Text(
                    reviews,
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 10),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            height: 40,
            child: OutlinedButton(
              onPressed: onOrderTap ?? () {},
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: accentColor, width: 1.5),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: FittedBox(
                fit: BoxFit.scaleDown,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Order on $partnerName',
                      style: TextStyle(
                        color: accentColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Icon(Icons.open_in_new, color: accentColor, size: 16),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIconTextRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 13, color: Colors.grey.shade700),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            text,
            style: TextStyle(color: Colors.grey.shade700, fontSize: 11),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
