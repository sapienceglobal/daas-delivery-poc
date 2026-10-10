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

  @override
  Widget build(BuildContext context) {
    return SliverAppBar(
      expandedHeight: expandedHeight,
      pinned: true,
      backgroundColor: Colors.white,
      leading: Padding(
        padding: const EdgeInsets.all(8.0),
        child: CircleAvatar(
          backgroundColor: Colors.white,
          child: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.black),
            onPressed: () => Navigator.pop(context),
          ),
        ),
      ),
      actions: [
        Padding(
          padding: const EdgeInsets.all(8.0),
          child: CircleAvatar(
            backgroundColor: Colors.white,
            child: IconButton(
              icon: Icon(
                isFavorite ? Icons.favorite : Icons.favorite_border,
                color: Colors.red,
              ),
              onPressed: onToggleFavorite,
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(right: 8.0, top: 8.0, bottom: 8.0),
          child: CircleAvatar(
            backgroundColor: Colors.white,
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
                itemBuilder: (context, index) {
                  final url = images[index];
                  if (url.startsWith('http')) {
                    return CachedNetworkImage(
                      imageUrl: url,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => const Center(
                        child: CircularProgressIndicator(),
                      ),
                      errorWidget: (context, url, error) => Image.asset(
                        'assets/images/branded/lassi-lounge/menu-hero.jpg',
                        fit: BoxFit.cover,
                      ),
                    );
                  }
                  return Image.asset(url, fit: BoxFit.cover);
                },
              ),
            if (images.length > 1)
              Positioned(
                bottom: 16,
                left: 0,
                right: 0,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(
                    images.length,
                    (index) => Container(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      width: currentImageIndex == index ? 20 : 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: currentImageIndex == index
                            ? Colors.red.shade900
                            : Colors.white.withValues(alpha: 0.6),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
