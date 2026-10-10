import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/widgets/home/home_dish_card.dart';

class HomeSignatureDishesCarousel extends StatelessWidget {
  final List<dynamic> dishes;

  const HomeSignatureDishesCarousel({
    super.key,
    required this.dishes,
  });

  @override
  Widget build(BuildContext context) {
    final textScaler = MediaQuery.textScalerOf(context);
    final carouselHeight =
        (200.0 * (textScaler.scale(13.0) / 13.0)).clamp(198.0, 218.0);

    return SizedBox(
      height: carouselHeight,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: dishes.length,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemBuilder: (context, index) {
          final dish = dishes[index];
          return HomeDishCard(dish: dish);
        },
      ),
    );
  }
}
