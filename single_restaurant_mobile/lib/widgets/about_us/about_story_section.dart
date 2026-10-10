import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/services/api_service.dart';

class AboutStorySection extends StatelessWidget {
  final Map<String, dynamic>? cmsData;

  const AboutStorySection({super.key, this.cmsData});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Flexible(
              child: FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  'OUR STORY',
                  style: TextStyle(
                    color: AppColors.secondary,
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                    letterSpacing: 2.0,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Container(
                height: 1.5,
                color: AppColors.secondary.withValues(alpha: 0.5),
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerLeft,
          child: RichText(
            text: const TextSpan(
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w800,
                height: 1.2,
                color: Colors.black,
              ),
              children: [
                TextSpan(text: 'A Passion For Authentic\n'),
                TextSpan(
                  text: 'Indian Cuisine',
                  style: TextStyle(color: AppColors.primary),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'Lassi Lounge was born from a simple idea – to bring the rich, diverse and soulful flavors of India to the heart of New York. From the bustling streets of Delhi to the royal kitchens of Punjab, our recipes are crafted with love, tradition and the finest ingredients.',
          style: TextStyle(
            fontSize: 15,
            color: Colors.black87,
            height: 1.6,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 12),
        const Text(
          'Every dish we serve is a reflection of our culture, our memories and our promise to deliver an experience you\'ll want to come back to.',
          style: TextStyle(
            fontSize: 15,
            color: Colors.black87,
            height: 1.6,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 24),
        Container(
          width: double.infinity,
          height: 200,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            image: DecorationImage(
              image: (cmsData != null &&
                      cmsData!['aboutUs'] != null &&
                      cmsData!['aboutUs']['restaurantImage'] != null &&
                      cmsData!['aboutUs']['restaurantImage'].toString().isNotEmpty)
                  ? NetworkImage(cmsData!['aboutUs']['restaurantImage'].toString().startsWith('http')
                      ? cmsData!['aboutUs']['restaurantImage']
                      : '${ApiService.baseUrl}${cmsData!['aboutUs']['restaurantImage']}') as ImageProvider
                  : const AssetImage('assets/images/branded/lassi-lounge/about/lassi-lounge-restaurant_image.jpeg'),
              fit: BoxFit.cover,
            ),
          ),
        ),
      ],
    );
  }
}
