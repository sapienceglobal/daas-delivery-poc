import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/services/api_service.dart';

class AboutChefSection extends StatelessWidget {
  final Map<String, dynamic>? cmsData;

  const AboutChefSection({super.key, this.cmsData});

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
                  'OUR CHEF & FOUNDER',
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
                TextSpan(text: 'The Heart Behind\n'),
                TextSpan(
                  text: 'Lassi Lounge',
                  style: TextStyle(color: AppColors.secondary),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'With years of experience and a deep passion for Indian cuisine, our founder & chef brings authentic recipes to life with a modern twist. Every recipe is tested, tasted and perfected to deliver the best to our guests.',
          style: TextStyle(
            fontSize: 15,
            color: Colors.black87,
            height: 1.6,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Simarjeet Gill',
          style: TextStyle(
            fontSize: 24,
            fontFamily: 'Cursive',
            color: AppColors.secondary,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 24),
        Container(
          width: double.infinity,
          height: 250,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            image: DecorationImage(
              image: (cmsData != null &&
                      cmsData!['aboutUs'] != null &&
                      cmsData!['aboutUs']['ownerImage'] != null &&
                      cmsData!['aboutUs']['ownerImage'].toString().isNotEmpty)
                  ? NetworkImage(cmsData!['aboutUs']['ownerImage'].toString().startsWith('http')
                      ? cmsData!['aboutUs']['ownerImage']
                      : '${ApiService.baseUrl}${cmsData!['aboutUs']['ownerImage']}') as ImageProvider
                  : const AssetImage('assets/images/branded/lassi-lounge/about/resturant-owner.jpeg'),
              fit: BoxFit.cover,
              alignment: const Alignment(0, -0.3),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: 10,
                offset: const Offset(0, 5),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
