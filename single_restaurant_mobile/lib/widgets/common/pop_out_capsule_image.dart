import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';

/// ---------------------------------------------------------------------------
/// TUNE-ABLE CONSTANTS FOR PHYSICAL DEVICE ADJUSTMENTS
/// ---------------------------------------------------------------------------
/// Oval vertical aspect ratio: Height = Width * kOvalAspectRatio
const double kOvalAspectRatio = 1.25;

/// Dish scale relative to oval width: enlarged to 1.12 for bold 3D pop-out look
const double kDishScale = 1.12;

/// Dish vertical offset percentage (-0.02 = shifted 2% upward from center)
const double kDishYOffsetPercent = -0.02;

/// Toggle contact shadow directly under the dish
const bool kEnableContactShadow = true;

/// Contact shadow opacity (black alpha 0.12 - 0.15)
const double kContactShadowAlpha = 0.14;

/// Contact shadow width factor relative to oval width
const double kContactShadowWidthFactor = 0.60;

/// Contact shadow blur radius
const double kContactShadowBlur = 8.0;

/// Category Tile Widget featuring a vertical oval backdrop with radial gradient,
/// floating 3D dish cutout with subtle contact shadow, and compact uppercase label.
class PopOutCapsuleImage extends StatelessWidget {
  final String? imageUrl;
  final IconData? icon;
  final String? label;
  final double width;
  final bool isSelected;
  final VoidCallback? onTap;
  final bool? forceClipOval;

  const PopOutCapsuleImage({
    super.key,
    this.imageUrl,
    this.icon,
    this.label,
    this.width = 74.0,
    this.isSelected = false,
    this.onTap,
    this.forceClipOval,
  });

  bool get _isOpaquePhoto {
    if (forceClipOval != null) return forceClipOval!;
    if (imageUrl == null) return false;
    final lower = imageUrl!.toLowerCase();
    return lower.endsWith('.jpg') || lower.endsWith('.jpeg');
  }

  @override
  Widget build(BuildContext context) {
    final ovalHeight = width * kOvalAspectRatio;
    final dishSize = width * kDishScale;
    final dishYOffset = ovalHeight * kDishYOffsetPercent;
    final dishTop = ((ovalHeight - dishSize) / 2) + dishYOffset;

    Widget capsuleContent = SizedBox(
      width: width,
      height: ovalHeight,
      child: Stack(
        alignment: Alignment.center,
        clipBehavior: Clip.none,
        children: [
          // 1. Oval Backdrop (Vertical Oval with Radial Gradient & Outer Shadow)
          _buildBackdrop(width, ovalHeight),

          // 2. Contact Shadow directly under the dish (if enabled)
          if (kEnableContactShadow && icon == null)
            Positioned(
              top: dishTop + (dishSize * 0.88),
              child: _buildContactShadow(width),
            ),

          // 3. Dish image (CachedNetworkImage or Asset) or Icon
          Positioned(
            top: dishTop,
            child: SizedBox(
              width: dishSize,
              height: dishSize,
              child: _buildDish(dishSize),
            ),
          ),
        ],
      ),
    );

    // If no label is provided, return just the capsule
    if (label == null || label!.isEmpty) {
      if (onTap != null) {
        return GestureDetector(
          onTap: onTap,
          behavior: HitTestBehavior.opaque,
          child: capsuleContent,
        );
      }
      return capsuleContent;
    }

    // Full Category Tile with uppercase label
    final tileWidth = (width * kDishScale).clamp(width + 4.0, width + 10.0);
    Widget tile = SizedBox(
      width: tileWidth,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          capsuleContent,
          const SizedBox(height: 6),
          Text(
            label!.toUpperCase(),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 11.0,
              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w700,
              color: isSelected
                  ? const Color(0xFF8B1E1E)
                  : AppColors.textDark,
              height: 1.15,
              letterSpacing: 0.2,
            ),
          ),
          if (isSelected) ...[
            const SizedBox(height: 3),
            Container(
              width: 16,
              height: 2.5,
              decoration: BoxDecoration(
                color: const Color(0xFF8B1E1E),
                borderRadius: BorderRadius.circular(1.5),
              ),
            ),
          ],
        ],
      ),
    );

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: tile,
      );
    }
    return tile;
  }

  Widget _buildBackdrop(double w, double h) {
    return Container(
      width: w,
      height: h,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.all(Radius.elliptical(w / 2, h / 2)),
        gradient: const RadialGradient(
          center: Alignment.center,
          radius: 0.78,
          colors: [
            Color(0xFFFDEFD5), // Soft peach/cream center
            Colors.white, // Edges fade to white
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
    );
  }

  Widget _buildContactShadow(double w) {
    final shadowWidth = w * kContactShadowWidthFactor;
    return Container(
      width: shadowWidth,
      height: 6.0,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.all(
          Radius.elliptical(shadowWidth / 2, 3.0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: kContactShadowAlpha),
            blurRadius: kContactShadowBlur,
            spreadRadius: 1.2,
            offset: const Offset(0, 1),
          ),
        ],
      ),
    );
  }

  Widget _buildDish(double size) {
    if (icon != null) {
      return Center(
        child: Icon(
          icon,
          size: size * 0.48,
          color: isSelected
              ? const Color(0xFF8B1E1E)
              : const Color(0xFF8B2500),
        ),
      );
    }

    if (imageUrl == null || imageUrl!.isEmpty) {
      return Center(
        child: Icon(
          Icons.restaurant,
          size: size * 0.45,
          color: Colors.grey.shade400,
        ),
      );
    }

    Widget imageWidget;
    if (imageUrl!.startsWith('http')) {
      imageWidget = CachedNetworkImage(
        imageUrl: imageUrl!,
        fit: BoxFit.contain,
        placeholder: (context, url) => const SizedBox(),
        errorWidget: (context, url, error) => Center(
          child: Icon(Icons.restaurant, size: size * 0.4, color: Colors.grey),
        ),
      );
    } else {
      final assetPath =
          imageUrl!.startsWith('/') ? imageUrl!.substring(1) : imageUrl!;
      imageWidget = Image.asset(
        assetPath,
        fit: BoxFit.contain,
        filterQuality: FilterQuality.high,
        errorBuilder: (context, error, stackTrace) => Center(
          child: Icon(Icons.restaurant, size: size * 0.4, color: Colors.grey),
        ),
      );
    }

    // ClipOval fallback if the image is an opaque photo (e.g., .jpg)
    if (_isOpaquePhoto) {
      return ClipOval(child: imageWidget);
    }

    return imageWidget;
  }
}
