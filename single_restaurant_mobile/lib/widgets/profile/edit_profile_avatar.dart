import 'dart:io';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

const _kMaroon = Color(0xFF7A1414);

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
    const fallback = Icon(Icons.person, size: 70, color: Colors.grey);
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 172,
                height: 172,
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFFF8D9D2), Color(0xFFFBEAE4)],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFE8B4A8).withValues(alpha: 0.35),
                      blurRadius: 24,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.grey.shade200,
                    border: Border.all(color: Colors.white, width: 4),
                  ),
                  child: ClipOval(
                    child: imageFile != null
                        ? Image.file(imageFile!, fit: BoxFit.cover)
                        : (profilePictureUrl != null && profilePictureUrl!.isNotEmpty)
                            ? CachedNetworkImage(
                                imageUrl: profilePictureUrl!,
                                fit: BoxFit.cover,
                                placeholder: (context, url) => fallback,
                                errorWidget: (context, url, error) => fallback,
                              )
                            : fallback,
                  ),
                ),
              ),
              Positioned(
                bottom: 8,
                right: 4,
                child: Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: _kMaroon,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 3),
                    boxShadow: const [
                      BoxShadow(color: Color(0x33000000), blurRadius: 8, offset: Offset(0, 3)),
                    ],
                  ),
                  child: const Icon(Icons.photo_camera, color: Colors.white, size: 22),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Tap to change photo',
            style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
          ),
        ],
      ),
    );
  }
}
