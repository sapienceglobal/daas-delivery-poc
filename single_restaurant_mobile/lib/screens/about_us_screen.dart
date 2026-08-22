import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';

import 'dart:convert';
import 'package:single_restaurant_mobile/services/api_service.dart';

class AboutUsScreen extends StatefulWidget {
  const AboutUsScreen({super.key});

  @override
  State<AboutUsScreen> createState() => _AboutUsScreenState();
}

class _AboutUsScreenState extends State<AboutUsScreen> {
  Map<String, dynamic>? cmsData;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchCmsData();
  }

  Future<void> _fetchCmsData() async {
    try {
      final response = await ApiService.get('/api/cms?restaurantId=lassi-lounge');
      final data = json.decode(response.body);
      if (data['success'] == true) {
        setState(() {
          cmsData = data['data'];
          isLoading = false;
        });
      } else {
        setState(() => isLoading = false);
      }
    } catch (e) {
      debugPrint('Failed to load CMS data: $e');
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFCF9F2),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.secondary),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'About Lassi Lounge',
          style: TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: isLoading 
          ? const Center(child: CircularProgressIndicator(color: AppColors.secondary))
          : SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
              // Hero Image
              Container(
                width: double.infinity,
                height: 250,
                decoration: const BoxDecoration(
                  image: DecorationImage(
                    image: AssetImage('assets/images/branded/lassi-lounge/story/restaurant-interior.jpg'),
                  fit: BoxFit.cover,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Chef & Philosophy Section
                  Row(
                    children: [
                      const Text(
                        'OUR CHEF & FOUNDER',
                        style: TextStyle(
                          color: AppColors.secondary,
                          fontWeight: FontWeight.w900,
                          fontSize: 12,
                          letterSpacing: 2.0,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Container(
                          height: 1.5,
                          color: AppColors.secondary.withOpacity(0.5),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  
                  RichText(
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
                  
                  // Chef Name
                  const Text(
                    'Simarjeet Gill',
                    style: TextStyle(
                      fontSize: 24,
                      fontFamily: 'Cursive', // Ensure cursive font or fallback
                      color: AppColors.secondary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Chef Image
                  Container(
                    width: double.infinity,
                    height: 250,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      image: DecorationImage(
                        image: (cmsData != null && cmsData!['aboutUs'] != null && cmsData!['aboutUs']['ownerImage'] != null && cmsData!['aboutUs']['ownerImage'].toString().isNotEmpty)
                            ? NetworkImage(cmsData!['aboutUs']['ownerImage'].toString().startsWith('http') 
                                ? cmsData!['aboutUs']['ownerImage']
                                : '${ApiService.baseUrl}${cmsData!['aboutUs']['ownerImage']}') as ImageProvider
                            : const AssetImage('assets/images/branded/lassi-lounge/about/resturant-owner.jpeg'),
                        fit: BoxFit.cover,
                        alignment: const Alignment(0, -0.3),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 10,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 40),
                  
                  // Features Section
                  _buildFeatureItem(
                    icon: Icons.restaurant_menu,
                    title: 'Authentic Recipes',
                    description: 'Traditional recipes crafted by experienced chefs.',
                  ),
                  const SizedBox(height: 24),
                  _buildFeatureItem(
                    icon: Icons.eco,
                    title: 'Fresh Ingredients',
                    description: 'We use the freshest & highest quality ingredients.',
                  ),
                  const SizedBox(height: 24),
                  _buildFeatureItem(
                    icon: Icons.celebration,
                    title: 'Warm Ambience',
                    description: 'Perfect place for family, friends & special occasions.',
                  ),
                  const SizedBox(height: 40),

                  // Our Story Section (Moved to bottom)
                  Row(
                    children: [
                      const Text(
                        'OUR STORY',
                        style: TextStyle(
                          color: AppColors.secondary,
                          fontWeight: FontWeight.w900,
                          fontSize: 12,
                          letterSpacing: 2.0,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Container(
                          height: 1.5,
                          color: AppColors.secondary.withOpacity(0.5),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  
                  RichText(
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
                  
                  // Our Story Image
                  Container(
                    width: double.infinity,
                    height: 200,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      image: DecorationImage(
                        image: (cmsData != null && cmsData!['aboutUs'] != null && cmsData!['aboutUs']['restaurantImage'] != null && cmsData!['aboutUs']['restaurantImage'].toString().isNotEmpty)
                            ? NetworkImage(cmsData!['aboutUs']['restaurantImage'].toString().startsWith('http') 
                                ? cmsData!['aboutUs']['restaurantImage']
                                : '${ApiService.baseUrl}${cmsData!['aboutUs']['restaurantImage']}') as ImageProvider
                            : const AssetImage('assets/images/branded/lassi-lounge/about/lassi-lounge-restaurant_image.jpeg'),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

  Widget _buildFeatureItem({required IconData icon, required String title, required String description}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.secondary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: AppColors.secondary, size: 28),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: const TextStyle(
                  fontSize: 14,
                  color: Colors.black87,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
