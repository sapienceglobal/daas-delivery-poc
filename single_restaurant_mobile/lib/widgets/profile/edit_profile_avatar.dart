import 'dart:io';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';

class EditProfileAvatar extends StatelessWidget {
  final File? imageFile;
  final String? profilePictureUrl;
  final VoidCallback onTap;

  const EditProfileAvatar({
    super.key,
    required this.imageFile,
    required this.profilePictureUrl,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Stack(
        children: [
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.grey.shade200,
              border: Border.all(color: Colors.white, width: 4),
              boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10)],
            ),
            child: ClipOval(
              child: imageFile != null
                  ? Image.file(imageFile!, fit: BoxFit.cover)
                  : (profilePictureUrl != null && profilePictureUrl!.isNotEmpty)
                      ? CachedNetworkImage(
                          imageUrl: profilePictureUrl!,
                          fit: BoxFit.cover,
                          placeholder: (context, url) =>
                              const Icon(Icons.person, size: 50, color: Colors.grey),
                          errorWidget: (context, url, error) =>
                              const Icon(Icons.person, size: 50, color: Colors.grey),
                        )
                      : const Icon(Icons.person, size: 50, color: Colors.grey),
            ),
          ),
          Positioned(
            bottom: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.secondary,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
              ),
              child: const Icon(Icons.camera_alt, color: Colors.white, size: 16),
            ),
          ),
        ],
      ),
    );
  }
}
