import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

class ShimmerBox extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;

  const ShimmerBox({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = 8.0,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    );
  }
}

class ShimmerCircle extends StatelessWidget {
  final double size;

  const ShimmerCircle({super.key, required this.size});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
      ),
    );
  }
}

class BaseShimmer extends StatelessWidget {
  final Widget child;

  const BaseShimmer({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade300,
      highlightColor: Colors.grey.shade100,
      child: child,
    );
  }
}

class HomeShimmer extends StatelessWidget {
  const HomeShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return BaseShimmer(
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 16),
            // Hero Banner
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16.0),
              child: ShimmerBox(width: double.infinity, height: 200, borderRadius: 16),
            ),
            const SizedBox(height: 24),
            // Section Title
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16.0),
              child: ShimmerBox(width: 150, height: 20),
            ),
            const SizedBox(height: 16),
            // Categories Row
            SizedBox(
              height: 100,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: 5,
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                itemBuilder: (_, __) => const Padding(
                  padding: EdgeInsets.only(right: 16.0),
                  child: Column(
                    children: [
                      ShimmerCircle(size: 70),
                      SizedBox(height: 8),
                      ShimmerBox(width: 50, height: 10),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            // Promos Row
            SizedBox(
              height: 150,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: 2,
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                itemBuilder: (_, __) => const Padding(
                  padding: EdgeInsets.only(right: 16.0),
                  child: ShimmerBox(width: 250, height: 150, borderRadius: 12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class MenuShimmer extends StatelessWidget {
  const MenuShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return BaseShimmer(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Categories Tab Bar
          SizedBox(
            height: 50,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: 4,
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              itemBuilder: (_, __) => const Padding(
                padding: EdgeInsets.only(right: 12.0),
                child: ShimmerBox(width: 80, height: 30, borderRadius: 20),
              ),
            ),
          ),
          const SizedBox(height: 8),
          // Menu Items List
          Expanded(
            child: ListView.builder(
              itemCount: 5,
              padding: const EdgeInsets.all(16.0),
              itemBuilder: (_, __) => Padding(
                padding: const EdgeInsets.only(bottom: 16.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Item Image
                    const ShimmerBox(width: 100, height: 100, borderRadius: 12),
                    const SizedBox(width: 16),
                    // Item Details
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const ShimmerBox(width: double.infinity, height: 20),
                          const SizedBox(height: 8),
                          const ShimmerBox(width: 150, height: 14),
                          const SizedBox(height: 8),
                          const ShimmerBox(width: 100, height: 14),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: const [
                              ShimmerBox(width: 60, height: 20),
                              ShimmerBox(width: 80, height: 30, borderRadius: 8),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
