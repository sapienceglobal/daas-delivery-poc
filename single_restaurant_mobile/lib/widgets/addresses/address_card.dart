import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';

class AddressCard extends StatelessWidget {
  final String id;
  final String title;
  final String address;
  final String phone;
  final IconData icon;
  final bool isDefault;
  final Color? iconBgColor;
  final Color? iconColor;
  final bool selectingMode;
  final VoidCallback onTap;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const AddressCard({
    super.key,
    required this.id,
    required this.title,
    required this.address,
    required this.phone,
    required this.icon,
    required this.isDefault,
    this.iconBgColor,
    this.iconColor,
    this.selectingMode = false,
    required this.onTap,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final bgColor = isDefault ? const Color(0xFFFFF0F0) : Colors.white;
    final borderColor = isDefault ? Colors.red.shade200 : AppColors.divider;
    final leadingIconColor = isDefault ? AppColors.secondary : Colors.grey;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Radio button / selection indicator
          InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.only(top: 8.0, right: 12.0),
              child: Icon(
                selectingMode
                    ? Icons.circle_outlined
                    : (isDefault
                        ? Icons.radio_button_checked
                        : Icons.radio_button_unchecked),
                color: selectingMode ? Colors.grey : leadingIconColor,
                size: 20,
              ),
            ),
          ),
          // Circle Icon
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDefault
                  ? Colors.red.shade100
                  : (iconBgColor ?? Colors.grey.shade100),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: isDefault
                  ? AppColors.secondary
                  : (iconColor ?? Colors.grey.shade700),
              size: 24,
            ),
          ),
          // Details
          Expanded(
            child: InkWell(
              onTap: onTap,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      if (isDefault) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            border: Border.all(color: Colors.red.shade200),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'DEFAULT',
                            style: TextStyle(
                              color: Colors.red,
                              fontSize: 8,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    address,
                    style: const TextStyle(
                      color: Colors.black87,
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    phone,
                    style: const TextStyle(
                      color: Colors.black87,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Actions (Edit / Delete)
          Row(
            children: [
              InkWell(
                onTap: onEdit,
                child: _buildActionItem(Icons.edit_outlined, 'Edit'),
              ),
              Container(
                height: 30,
                width: 1,
                color: AppColors.divider,
                margin: const EdgeInsets.symmetric(horizontal: 8),
              ),
              InkWell(
                onTap: onDelete,
                child: _buildActionItem(Icons.delete_outline, 'Delete'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionItem(IconData icon, String label) {
    return Column(
      children: [
        Icon(icon, color: Colors.black87, size: 20),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            color: AppColors.secondary,
            fontSize: 11,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
