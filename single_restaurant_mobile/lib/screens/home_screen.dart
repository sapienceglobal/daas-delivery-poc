import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:single_restaurant_mobile/screens/cart_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: _buildAppBar(context),
      body: Consumer<RestaurantProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.restaurant == null) {
            return const Center(child: CircularProgressIndicator(color: AppColors.secondary));
          }

          if (provider.error != null && provider.restaurant == null) {
            return Center(child: Text('Error: ${provider.error}', style: const TextStyle(color: Colors.red)));
          }

          final restaurant = provider.restaurant;
          final categories = provider.menu;
          final signatureDishes = provider.getSignatureDishes();

          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),
                _buildHeroBanner(restaurant),
                const SizedBox(height: 24),
                
                if (categories.isNotEmpty) ...[
                  _buildSectionTitle('EXPLORE OUR MENU', () {}),
                  _buildCategoriesCarousel(categories),
                  const SizedBox(height: 24),
                ],

                _buildDeliveryPartners(),
                const SizedBox(height: 24),
                
                if (signatureDishes.isNotEmpty) ...[
                  _buildSectionTitle('OUR SIGNATURE DISHES', () {}),
                  _buildSignatureDishesCarousel(signatureDishes),
                  const SizedBox(height: 32),
                ]
              ],
            ),
          );
        },
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context) {
    return AppBar(
      backgroundColor: AppColors.background,
      elevation: 0,
      title: Row(
        children: [
          const Icon(Icons.location_on, color: Colors.red, size: 28),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Deliver to',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textLight,
                      fontSize: 12,
                    ),
              ),
              Row(
                children: [
                  Text(
                    '34 Union Avenue, Patiala', // Ideally from AddressProvider default address
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: AppColors.textDark,
                        ),
                  ),
                  const Icon(Icons.keyboard_arrow_down, color: AppColors.textDark),
                ],
              ),
            ],
          ),
        ],
      ),
      actions: [
        Padding(
          padding: const EdgeInsets.only(right: 8.0),
          child: Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_none_outlined, size: 28),
                onPressed: () {},
                color: AppColors.textDark,
              ),
              Positioned(
                right: 8,
                top: 12,
                child: Container(
                  width: 10,
                  height: 10,
                  decoration: const BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                ),
              )
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(right: 16.0),
          child: Consumer<CartProvider>(
            builder: (context, cart, child) {
              return Stack(
                alignment: Alignment.center,
                children: [
                  IconButton(
                    icon: const Icon(Icons.shopping_cart_outlined, size: 26),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const CartScreen()),
                      );
                    },
                    color: AppColors.textDark,
                  ),
                  if (cart.itemCount > 0)
                    Positioned(
                      right: 4,
                      top: 4,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                        child: Text(
                          '${cart.itemCount}',
                          style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                    )
                ],
              );
            },
          ),
        )
      ],
    );
  }

  Widget _buildHeroBanner(Map<String, dynamic>? restaurant) {
    final bannerUrl = restaurant?['banner'];
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Container(
        height: 200,
        width: double.infinity,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: Colors.grey.shade200,
        ),
        child: Stack(
          children: [
            // Background Image
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: bannerUrl != null && bannerUrl.toString().startsWith('http')
                  ? CachedNetworkImage(
                      imageUrl: bannerUrl,
                      fit: BoxFit.cover,
                      width: double.infinity,
                      height: double.infinity,
                      placeholder: (context, url) => const Center(child: CircularProgressIndicator()),
                      errorWidget: (context, url, error) => Image.asset('assets/images/branded/lassi-lounge/menu-hero.jpg', fit: BoxFit.cover, width: double.infinity, height: double.infinity),
                    )
                  : Image.asset(
                      'assets/images/branded/lassi-lounge/menu-hero.jpg',
                      fit: BoxFit.cover,
                      width: double.infinity,
                      height: double.infinity,
                    ),
            ),
            // Gradient Overlay
            Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: [
                    Colors.black.withOpacity(0.8),
                    Colors.transparent,
                  ],
                ),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'Craving something\ndelicious?',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Get it delivered hot\nand fresh!',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.black,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    ),
                    child: const Text(
                      'ORDER NOW',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title, VoidCallback onViewAll) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
          TextButton(
            onPressed: onViewAll,
            child: const Text(
              'View All',
              style: TextStyle(
                color: Colors.red,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoriesCarousel(List<dynamic> categories) {
    return Column(
      children: [
        SizedBox(
          height: 120,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: categories.length,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemBuilder: (context, index) {
              final category = categories[index];
              final imageUrl = category['image'];
              final name = category['name'] ?? 'Category';

              return Padding(
                padding: const EdgeInsets.only(right: 16.0),
                child: Column(
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.red, width: 2), // Red border like UI
                      ),
                      child: ClipOval(
                        child: imageUrl != null && imageUrl.toString().startsWith('http')
                            ? CachedNetworkImage(
                                imageUrl: imageUrl,
                                fit: BoxFit.cover,
                                placeholder: (context, url) => const CircularProgressIndicator(),
                                errorWidget: (context, url, error) => Image.asset('assets/images/branded/lassi-lounge/categories/appetizers.jpg', fit: BoxFit.cover),
                              )
                            : Image.asset('assets/images/branded/lassi-lounge/categories/appetizers.jpg', fit: BoxFit.cover), // Fallback mock
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      name,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildDeliveryPartners() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16.0),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.red.withOpacity(0.3)),
          color: Colors.white,
        ),
        child: Column(
          children: [
            const Text(
              'DELIVERING WITH',
              style: TextStyle(
                color: Colors.grey,
                fontWeight: FontWeight.bold,
                fontSize: 12,
                letterSpacing: 1.0,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                SvgPicture.asset('assets/images/branded/lassi-lounge/partners/ubereats.svg', height: 24),
                Container(height: 30, width: 1, color: Colors.red.withOpacity(0.3)),
                SvgPicture.asset('assets/images/branded/lassi-lounge/partners/doordash.svg', height: 24),
                Container(height: 30, width: 1, color: Colors.red.withOpacity(0.3)),
                SvgPicture.asset('assets/images/branded/lassi-lounge/partners/grubhub.svg', height: 24),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSignatureDishesCarousel(List<dynamic> dishes) {
    return Column(
      children: [
        SizedBox(
          height: 280,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: dishes.length,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemBuilder: (context, index) {
              final dish = dishes[index];
              final imageUrl = dish['image'];
              final name = dish['name'] ?? 'Dish';
              final price = dish['price']?.toString() ?? '0';

              return Container(
                width: 180,
                margin: const EdgeInsets.only(right: 16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.cardShadow,
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Stack(
                      children: [
                        ClipRRect(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                          child: imageUrl != null && imageUrl.toString().startsWith('http')
                              ? CachedNetworkImage(
                                  imageUrl: imageUrl,
                                  height: 140,
                                  width: double.infinity,
                                  fit: BoxFit.cover,
                                  placeholder: (context, url) => const Center(child: CircularProgressIndicator()),
                                  errorWidget: (context, url, error) => Image.asset('assets/images/branded/lassi-lounge/categories/main-course.jpg', height: 140, width: double.infinity, fit: BoxFit.cover),
                                )
                              : Image.asset(
                                  'assets/images/branded/lassi-lounge/categories/main-course.jpg',
                                  height: 140,
                                  width: double.infinity,
                                  fit: BoxFit.cover,
                                ),
                        ),
                        Positioned(
                          top: 8,
                          right: 8,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(0.5),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.favorite_border, color: Colors.white, size: 20),
                          ),
                        )
                      ],
                    ),
                    Padding(
                      padding: const EdgeInsets.all(12.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '\$$price', // Format to whatever currency your backend returns, assuming $ here or dynamic
                                style: const TextStyle(
                                  color: Colors.red,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                              Consumer<CartProvider>(
                                builder: (context, cart, child) {
                                  final dishId = dish['_id'] ?? dish['id'];
                                  final cartItemIndex = cart.items.indexWhere((i) {
                                    final iId = i['menuItemId'] ?? i['_id'] ?? i['id'];
                                    return iId == dishId;
                                  });

                                  if (cartItemIndex > -1) {
                                    final cartItem = cart.items[cartItemIndex];
                                    final quantity = (cartItem['quantity'] ?? cartItem['qty'] ?? 1) as int;

                                    return Container(
                                      decoration: BoxDecoration(
                                        color: Colors.red.shade50,
                                        border: Border.all(color: Colors.red),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          InkWell(
                                            onTap: () => cart.updateQuantity(cartItemIndex, quantity - 1),
                                            child: const Padding(
                                              padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                              child: Icon(Icons.remove, size: 16, color: Colors.red),
                                            ),
                                          ),
                                          Text(
                                            '$quantity',
                                            style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.red),
                                          ),
                                          InkWell(
                                            onTap: () => cart.updateQuantity(cartItemIndex, quantity + 1),
                                            child: const Padding(
                                              padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                              child: Icon(Icons.add, size: 16, color: Colors.red),
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  }

                                  return InkWell(
                                    onTap: () {
                                      final restProv = Provider.of<RestaurantProvider>(context, listen: false);
                                      cart.addItem(dish, restaurantData: restProv.restaurant);
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(
                                          content: Text('${name} added to cart!'),
                                          duration: const Duration(seconds: 1),
                                          action: SnackBarAction(
                                            label: 'VIEW',
                                            onPressed: () {
                                              Navigator.push(context, MaterialPageRoute(builder: (context) => const CartScreen()));
                                            },
                                          ),
                                        )
                                      );
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                      decoration: BoxDecoration(
                                        border: Border.all(color: Colors.red),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: const Text(
                                        'Add +',
                                        style: TextStyle(
                                          color: Colors.red,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
