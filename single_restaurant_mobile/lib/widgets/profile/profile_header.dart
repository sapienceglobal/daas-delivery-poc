import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/screens/edit_profile_screen.dart';
import 'package:single_restaurant_mobile/theme/app_typography.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';

class ProfileHeader extends StatelessWidget {
  final AuthProvider authProvider;
  final VoidCallback onPickImage;

  const ProfileHeader({
    super.key,
    required this.authProvider,
    required this.onPickImage,
  });

  @override
  Widget build(BuildContext context) {
    final user = authProvider.user;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF3ECE6)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onTap: onPickImage,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                CircleAvatar(
                  radius: 34,
                  backgroundColor: const Color(0xFFF4E9E6),
                  backgroundImage: (user != null &&
                          user.profilePicture != null &&
                          user.profilePicture!.isNotEmpty)
                      ? CachedNetworkImageProvider(user.profilePicture!)
                          as ImageProvider
                      : null,
                  child: (user != null &&
                          user.profilePicture != null &&
                          user.profilePicture!.isNotEmpty)
                      ? null
                      : const Icon(
                          Icons.person,
                          color: Color(0xFFB38882),
                          size: 38,
                        ),
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.12),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.edit,
                      size: 11,
                      color: Color(0xFF7A0B10),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user?.name ?? 'Guest User',
                  style: AppTypography.serifHeading(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF1E0C0E),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                if (user != null && user.phone.trim().isNotEmpty) ...[
                  Row(
                    children: [
                      const Icon(Icons.call,
                          size: 12.5, color: Color(0xFF555555)),
                      const SizedBox(width: 5),
                      Expanded(
                        child: Text(
                          user.phone,
                          style: const TextStyle(
                            color: Color(0xFF4A4A4A),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                ],
                if (user?.email != null && user!.email.isNotEmpty)
                  Row(
                    children: [
                      const Icon(Icons.mail_outline,
                          size: 12.5, color: Color(0xFF555555)),
                      const SizedBox(width: 5),
                      Expanded(
                        child: Text(
                          user.email,
                          style: const TextStyle(
                            color: Color(0xFF4A4A4A),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
          const SizedBox(width: 6),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 90),
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.topRight,
              child: GestureDetector(
                onTap: () {
                  if (user != null) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const EditProfileScreen(),
                      ),
                    );
                  } else {
                    ToastUtils.showError(
                        context, 'Please login to edit profile');
                  }
                },
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFDF0EC),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Edit Profile',
                        style: TextStyle(
                          color: Color(0xFF7A0B10),
                          fontWeight: FontWeight.bold,
                          fontSize: 11.5,
                        ),
                      ),
                      SizedBox(width: 2),
                      Icon(Icons.chevron_right,
                          color: Color(0xFF7A0B10), size: 14),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
