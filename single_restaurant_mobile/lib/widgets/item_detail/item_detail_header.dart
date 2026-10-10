import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:single_restaurant_mobile/utils/image_helper.dart';

class ItemDetailHeader extends StatelessWidget {
  final List<String> images;
  final Map<String, dynamic> item;
  final int currentImageIndex;
  final ValueChanged<int> onPageChanged;
  final bool isFavorite;
  final VoidCallback onToggleFavorite;
  final Widget cartIcon;
  final double expandedHeight;

  const ItemDetailHeader({
    super.key,
    required this.images,
    required this.item,
    required this.currentImageIndex,
    required this.onPageChanged,
    required this.isFavorite,
    required this.onToggleFavorite,
    required this.cartIcon,
    required this.expandedHeight,
  });

  void _showGalleryDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogCtx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: Stack(
          alignment: Alignment.topRight,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: SizedBox(
                width: double.infinity,
                height: 380,
                child: PageView.builder(
                  itemCount: images.length,
                  itemBuilder: (_, i) => _buildImageWidget(images[i]),
                ),
              ),
            ),
            Positioned(
              top: 10,
              right: 10,
              child: CircleAvatar(
                backgroundColor: Colors.black54,
                radius: 18,
                child: IconButton(
                  padding: EdgeInsets.zero,
                  icon: const Icon(Icons.close, color: Colors.white, size: 20),
                  onPressed: () => Navigator.pop(dialogCtx),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImageWidget(String url) {
    if (url.startsWith('http')) {
      return CachedNetworkImage(
        imageUrl: url,
        fit: BoxFit.cover,
        placeholder: (context, url) => const Center(
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
        errorWidget: (context, url, error) => Image.asset(
          'assets/images/branded/lassi-lounge/menu-hero.jpg',
          fit: BoxFit.cover,
        ),
      );
    }
    return Image.asset(url, fit: BoxFit.cover);
  }

  @override
  Widget build(BuildContext context) {
    return SliverAppBar(
      expandedHeight: expandedHeight,
      pinned: true,
      elevation: 0,
      backgroundColor: Colors.white,
      leading: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.12),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.black87, size: 20),
            onPressed: () => Navigator.pop(context),
          ),
        ),
      ),
      actions: [
        Padding(
          padding: const EdgeInsets.all(8.0),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.12),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: IconButton(
              icon: Icon(
                isFavorite ? Icons.favorite : Icons.favorite_border,
                color: const Color(0xFF8B1818),
                size: 20,
              ),
              onPressed: onToggleFavorite,
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(right: 12.0, top: 8.0, bottom: 8.0),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.12),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: cartIcon,
          ),
        ),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            if (images.length == 1)
              ImageHelper.buildDishImage(item, fit: BoxFit.cover)
            else
              PageView.builder(
                itemCount: images.length,
                onPageChanged: onPageChanged,
                itemBuilder: (_, index) => _buildImageWidget(images[index]),
              ),
            // Pagination Dots (Only shown if multiple images exist)
            if (images.length > 1)
              Positioned(
                bottom: 28,
                left: 0,
                right: 0,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(
                    images.length,
                    (index) {
                      final isActive =
                          (currentImageIndex % images.length) == index;
                      return Container(
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        width: isActive ? 7 : 5,
                        height: isActive ? 7 : 5,
                        decoration: BoxDecoration(
                          color: isActive
                              ? Colors.white
                              : Colors.white.withValues(alpha: 0.45),
                          shape: BoxShape.circle,
                        ),
                      );
                    },
                  ),
                ),
              ),
            // View Image overlay pill
            Positioned(
              bottom: 28,
              right: 16,
              child: GestureDetector(
                onTap: () => _showGalleryDialog(context),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.55),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.25),
                      width: 0.8,
                    ),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.image_outlined,
                          color: Colors.white, size: 13),
                      SizedBox(width: 5),
                      Text(
                        'View Image',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      SizedBox(width: 2),
                      Icon(Icons.chevron_right,
                          color: Colors.white, size: 13),
                    ],
                  ),
                ),
              ),
            ),
            // Curved sheet overlap
            Positioned(
              bottom: -1,
              left: 0,
              right: 0,
              child: Container(
                height: 22,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius:
                      BorderRadius.vertical(top: Radius.circular(28)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
