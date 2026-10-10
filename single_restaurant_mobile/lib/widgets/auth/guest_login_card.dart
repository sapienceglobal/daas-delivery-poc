import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/widgets/three_dots_loading.dart';

/// Clean presentational card for "Continue as Guest" matching reference design.
class GuestLoginCard extends StatelessWidget {
  final VoidCallback onTap;
  final bool isLoading;

  const GuestLoginCard({
    super.key,
    required this.onTap,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        color: isLoading ? const Color(0xFFFFF0EC) : const Color(0xFFFFF7F5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isLoading ? const Color(0xFF800A12) : const Color(0xFFF3CBC4),
          width: 1.2,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: isLoading ? null : onTap,
          borderRadius: BorderRadius.circular(16),
          splashColor: const Color(0xFF800A12).withValues(alpha: 0.1),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 8.0),
            child: Row(
              children: [
                const Icon(
                  Icons.person,
                  color: Color(0xFF800A12),
                  size: 24,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'Continue as Guest',
                        style: TextStyle(
                          color: Color(0xFF800A12),
                          fontWeight: FontWeight.bold,
                          fontSize: 13.5,
                        ),
                      ),
                      const SizedBox(height: 2),
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 200),
                        child: Text(
                          isLoading
                              ? 'Entering menu as guest...'
                              : 'You can explore our menu and start ordering without creating an account.',
                          key: ValueKey<bool>(isLoading),
                          style: TextStyle(
                            color: isLoading
                                ? const Color(0xFF800A12)
                                : const Color(0xFF6B7280),
                            fontSize: 10.5,
                            fontWeight: isLoading
                                ? FontWeight.w600
                                : FontWeight.normal,
                            height: 1.25,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  width: 36,
                  height: 24,
                  child: Center(
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 220),
                      child: isLoading
                          ? const ThreeDotsLoading(
                              key: ValueKey('guest_loader'),
                              color: Color(0xFF800A12),
                              size: 6.5,
                            )
                          : const Icon(
                              Icons.chevron_right,
                              key: ValueKey('guest_chevron'),
                              color: Color(0xFF800A12),
                              size: 20,
                            ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
