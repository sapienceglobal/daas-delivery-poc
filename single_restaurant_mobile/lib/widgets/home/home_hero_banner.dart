import 'dart:async';
import 'package:flutter/material.dart';

class HomeHeroBanner extends StatefulWidget {
  final dynamic restaurant;
  final VoidCallback onOrderNow;
  final void Function(int slideIndex)? onSlideTap;

  const HomeHeroBanner({
    super.key,
    required this.restaurant,
    required this.onOrderNow,
    this.onSlideTap,
  });

  @override
  State<HomeHeroBanner> createState() => _HomeHeroBannerState();
}

class _HomeHeroBannerState extends State<HomeHeroBanner> {
  late final PageController _pageController;
  int _currentPage = 0;
  Timer? _autoSlideTimer;

  static const List<Map<String, String>> _slides = [
    {
      'tag': 'Authentic',
      'title': 'INDIAN\nFLAVORS',
      'subtitle': 'Delicious food, delivered\nhot and fresh to your doorstep!',
      'cta': 'ORDER NOW',
      'image': 'assets/images/branded/lassi-lounge/hero-curry.jpg',
    },
    {
      'tag': 'Royal Dum',
      'title': 'HYDERABADI\nBIRYANI',
      'subtitle': 'Slow-cooked fragrant basmati rice\ninfused with rich royal spices!',
      'cta': 'EXPLORE NOW',
      'image': 'assets/images/branded/lassi-lounge/hero-biryani.jpg',
    },
    {
      'tag': 'Refreshing',
      'title': 'SIGNATURE\nLASSI & DRINKS',
      'subtitle': 'Chilled thick mango lassi &\ntraditional hand-churned blends!',
      'cta': 'ORDER DRINKS',
      'image': 'assets/images/branded/lassi-lounge/hero-lassi.jpg',
    },
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _startAutoSlide();
  }

  void _startAutoSlide() {
    _autoSlideTimer?.cancel();
    _autoSlideTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!mounted || !_pageController.hasClients) return;
      final next = (_currentPage + 1) % _slides.length;
      _pageController.animateToPage(
        next,
        duration: const Duration(milliseconds: 600),
        curve: Curves.easeInOutCubic,
      );
    });
  }

  @override
  void dispose() {
    _autoSlideTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  Widget _buildSlideImage(int index, String assetPath) {
    return Image.asset(
      assetPath,
      fit: BoxFit.cover,
      alignment: Alignment.centerRight,
      errorBuilder: (context, error, stackTrace) => Image.asset(
        'assets/images/branded/lassi-lounge/menu-hero.jpg',
        fit: BoxFit.cover,
        alignment: Alignment.centerRight,
      ),
    );
  }


  @override
  Widget build(BuildContext context) {
    final textScaler = MediaQuery.textScalerOf(context);
    final minHeroHeight =
        (220.0 * (textScaler.scale(14.0) / 14.0)).clamp(215.0, 265.0);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Container(
        height: minHeroHeight,
        width: double.infinity,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          color: const Color(0xFF16100C),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.14),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: Stack(
            children: [
              // Swipeable Carousel Pages
              PageView.builder(
                controller: _pageController,
                itemCount: _slides.length,
                onPageChanged: (index) {
                  setState(() {
                    _currentPage = index;
                  });
                  _startAutoSlide();
                },
                itemBuilder: (context, index) {
                  final slide = _slides[index];
                  return Stack(
                    children: [
                      // Background Image aligned to right
                      Positioned.fill(
                        child: _buildSlideImage(index, slide['image']!),
                      ),

                      // Gradient overlay (dark readable left to transparent right)
                      Positioned.fill(
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.centerLeft,
                              end: Alignment.centerRight,
                              colors: [
                                const Color(0xFF140D0A).withValues(alpha: 0.95),
                                const Color(0xFF140D0A).withValues(alpha: 0.85),
                                Colors.black.withValues(alpha: 0.25),
                                Colors.transparent,
                              ],
                              stops: const [0.0, 0.45, 0.75, 1.0],
                            ),
                          ),
                        ),
                      ),

                      // Slide Content
                      Padding(
                        padding:
                            const EdgeInsets.fromLTRB(20.0, 18.0, 20.0, 16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              slide['tag']!,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 22,
                                fontWeight: FontWeight.normal,
                                letterSpacing: 0.5,
                              ),
                            ),
                            Text(
                              slide['title']!,
                              style: const TextStyle(
                                color: Color(0xFFF5B027),
                                fontSize: 27,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.5,
                                height: 1.05,
                              ),
                            ),
                            const SizedBox(height: 7),
                            Text(
                              slide['subtitle']!,
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 11.5,
                                height: 1.25,
                                fontWeight: FontWeight.w400,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 12),
                            ElevatedButton(
                              onPressed: () {
                                if (widget.onSlideTap != null) {
                                  widget.onSlideTap!(index);
                                } else {
                                  widget.onOrderNow();
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFF7B928),
                                foregroundColor: Colors.black,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(22),
                                ),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 18,
                                  vertical: 9,
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    slide['cta']!,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w900,
                                      fontSize: 11.5,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                  const SizedBox(width: 5),
                                  const Icon(Icons.arrow_forward, size: 15),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  );
                },
              ),

              // Interactive 3 Dots Indicator at bottom center
              Positioned(
                bottom: 11,
                left: 0,
                right: 0,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(_slides.length, (i) {
                    final isActive = i == _currentPage;
                    return GestureDetector(
                      onTap: () {
                        _pageController.animateToPage(
                          i,
                          duration: const Duration(milliseconds: 400),
                          curve: Curves.easeInOut,
                        );
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        width: isActive ? 9 : 6,
                        height: isActive ? 9 : 6,
                        decoration: BoxDecoration(
                          color: isActive
                              ? const Color(0xFFB71C1C)
                              : Colors.white.withValues(alpha: 0.65),
                          shape: BoxShape.circle,
                        ),
                      ),
                    );
                  }),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
