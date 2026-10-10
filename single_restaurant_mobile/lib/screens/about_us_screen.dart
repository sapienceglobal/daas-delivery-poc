import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/services/api_service.dart';
import 'package:single_restaurant_mobile/widgets/about_us/about_chef_section.dart';
import 'package:single_restaurant_mobile/widgets/about_us/about_features_list.dart';
import 'package:single_restaurant_mobile/widgets/about_us/about_story_section.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';

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
                child: ResponsiveCenter(
                  maxWidth: 650,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
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
                            AboutChefSection(cmsData: cmsData),
                            const SizedBox(height: 40),
                            const AboutFeaturesList(),
                            const SizedBox(height: 40),
                            AboutStorySection(cmsData: cmsData),
                            const SizedBox(height: 40),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
      ),
    );
  }
}
