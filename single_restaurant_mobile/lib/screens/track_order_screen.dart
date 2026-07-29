import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/order_provider.dart';
import 'package:single_restaurant_mobile/services/socket_service.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'dart:async';

class TrackOrderScreen extends StatefulWidget {
  final String orderId;

  const TrackOrderScreen({super.key, required this.orderId});

  @override
  State<TrackOrderScreen> createState() => _TrackOrderScreenState();
}

class _TrackOrderScreenState extends State<TrackOrderScreen> {
  Map<String, dynamic>? get _order => Provider.of<OrderProvider>(context, listen: false).getTrackedOrder(widget.orderId);
  bool _isLoading = true;
  String? _error;
  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    _fetchOrder();
    
    // Fallback polling in case of long disconnections
    _pollingTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      _fetchOrder(isBackground: true);
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchOrder({bool isBackground = false}) async {
    if (!isBackground) {
      setState(() => _isLoading = true);
    }
    
    final provider = Provider.of<OrderProvider>(context, listen: false);
    await provider.fetchTrackedOrder(widget.orderId, silent: isBackground);
    
    if (mounted) {
      setState(() {
        final order = provider.getTrackedOrder(widget.orderId);
        if (order != null) {
          _error = null;
        } else if (!isBackground) {
          _error = 'Failed to load order details';
        }
        if (!isBackground) _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAF8F5), // Very light beige background from UI
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.secondary),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Track Order',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 24),
        ),
        centerTitle: false,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16.0, top: 12.0, bottom: 12.0),
            child: OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.headset_mic_outlined, color: AppColors.secondary, size: 16),
              label: const Text('Support', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold)),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.secondary),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                padding: const EdgeInsets.symmetric(horizontal: 12),
              ),
            ),
          )
        ],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: AppColors.secondary))
        : _error != null
          ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
          : Builder(builder: (context) {
              final provider = Provider.of<OrderProvider>(context);
              final _order = provider.getTrackedOrder(widget.orderId);

              if (_order == null) {
                return const Center(child: Text('Order not found'));
              }
              
              return SingleChildScrollView(
                child: Column(
                  children: [
                    _buildHeaderInfo(),
                    _buildProgressTracker(),
                    _buildMapPlaceholder(),
                    if (_order!['deliveryId'] != null) _buildDriverProfile(),
                    _buildOrderDetails(),
                    const SizedBox(height: 16),
                    _buildEstimatedTime(),
                    const SizedBox(height: 32), // Padding for bottom
                  ],
                ),
              );
            }),
    );
  }

  Widget _buildHeaderInfo() {
    final items = _order!['items'] as List?;
    final imagePath = (items != null && items.isNotEmpty && items[0]['image'] != null)
        ? items[0]['image']
        : 'assets/images/branded/lassi-lounge/categories/appetizers.jpg';
        
    final status = _order!['status'] as String;
    String displayStatus = status.replaceAll('_', ' ').toUpperCase();

    return Container(
      margin: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: imagePath.toString().startsWith('http')
                ? CachedNetworkImage(
                    imageUrl: imagePath,
                    width: 80,
                    height: 80,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => const CircularProgressIndicator(),
                    errorWidget: (context, url, error) => Image.asset('assets/images/branded/lassi-lounge/categories/appetizers.jpg', width: 80, height: 80, fit: BoxFit.cover),
                  )
                : Image.asset(
                    imagePath,
                    width: 80,
                    height: 80,
                    fit: BoxFit.cover,
                  ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Order #${_order!['orderNumber'] ?? _order!['_id'].toString().substring(0, 6)}',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.orange.shade100,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(displayStatus, style: const TextStyle(color: Colors.deepOrange, fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  _formatDate(_order!['createdAt']),
                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                ),
                const SizedBox(height: 8),
                if (status == 'on_the_way' || status == 'picked_up' || status == 'out_for_delivery') ...[
                  const Row(
                    children: [
                      Icon(Icons.moped, color: AppColors.secondary, size: 16),
                      SizedBox(width: 8),
                      Text('Your order is on the way', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 13)),
                    ],
                  ),
                  Padding(
                    padding: const EdgeInsets.only(left: 24.0, top: 2),
                    child: Text(
                      _order!['estimatedDelivery'] ?? 'Arriving soon',
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ),
                ] else if (status == 'preparing') ...[
                  const Row(
                    children: [
                      Icon(Icons.soup_kitchen, color: AppColors.secondary, size: 16),
                      SizedBox(width: 8),
                      Text('Your order is being prepared', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 13)),
                    ],
                  ),
                ]
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildProgressTracker() {
    final status = _order!['status'] as String;
    final isDelivery = _order!['orderType'] == 'delivery';

    final statusRank = isDelivery
      ? {'pending': 0, 'accepted': 1, 'preparing': 2, 'ready': 3, 'picked_up': 4, 'out_for_delivery': 4, 'delivered': 5, 'cancelled': -1}
      : {'pending': 0, 'accepted': 1, 'preparing': 2, 'ready': 3, 'delivered': 4, 'cancelled': -1};

    final currentRank = statusRank[status] ?? 0;

    final steps = isDelivery
      ? [
          {'id': 'received', 'label': 'Order Received', 'desc': "We've received your order and payment.", 'icon': Icons.receipt_long},
          {'id': 'accepted', 'label': 'Order Accepted', 'desc': 'Restaurant has accepted your order.', 'icon': Icons.check_circle_outline},
          {'id': 'preparing', 'label': 'Preparing Your Order', 'desc': 'Our chef is preparing your delicious food.', 'icon': Icons.soup_kitchen},
          {'id': 'ready', 'label': 'Food Ready', 'desc': 'Your food has been prepared.', 'icon': Icons.room_service},
          {'id': 'transit', 'label': 'Out for Delivery', 'desc': 'Your order is on the way.', 'icon': Icons.moped},
          {'id': 'delivered', 'label': 'Delivered', 'desc': 'Enjoy your meal!', 'icon': Icons.home_outlined},
        ]
      : [
          {'id': 'received', 'label': 'Order Received', 'desc': "We've received your order and payment.", 'icon': Icons.receipt_long},
          {'id': 'accepted', 'label': 'Order Accepted', 'desc': 'Restaurant has accepted your order.', 'icon': Icons.check_circle_outline},
          {'id': 'preparing', 'label': 'Preparing Your Order', 'desc': 'Our chef is preparing your delicious food.', 'icon': Icons.soup_kitchen},
          {'id': 'ready', 'label': _order!['orderType'] == 'dine_in' ? 'Served to Table' : 'Ready for Pickup', 'desc': _order!['orderType'] == 'dine_in' ? 'Your food is ready and being served.' : 'Your order is ready to be collected.', 'icon': Icons.room_service},
          {'id': 'delivered', 'label': _order!['orderType'] == 'dine_in' ? 'Completed' : 'Collected', 'desc': 'We hope you enjoy your meal!', 'icon': Icons.check_circle},
        ];

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: List.generate(steps.length, (index) {
          final step = steps[index];
          bool isCompleted = currentRank >= index;
          bool isActive = currentRank == index;
          if (status == 'cancelled') {
            isCompleted = false;
            isActive = false;
          }

          return IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Timeline line and icon
                Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: isCompleted || isActive ? AppColors.secondary : Colors.grey.shade200,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(step['icon'] as IconData, color: isCompleted || isActive ? Colors.white : Colors.grey, size: 16),
                    ),
                    if (index < steps.length - 1)
                      Expanded(
                        child: Container(
                          width: 2,
                          color: currentRank > index ? AppColors.secondary : Colors.grey.shade200,
                        ),
                      ),
                  ],
                ),
                const SizedBox(width: 16),
                // Text Content
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 24.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          step['label'] as String,
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: isActive ? FontWeight.bold : FontWeight.w600,
                            color: isCompleted || isActive ? Colors.black87 : Colors.grey,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          step['desc'] as String,
                          style: TextStyle(
                            fontSize: 13,
                            color: isCompleted || isActive ? Colors.black54 : Colors.grey.shade400,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        }),
      ),
    );
  }

  Widget _buildMapPlaceholder() {
    return Container(
      height: 200,
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFE5E5E5), // Light map background
        borderRadius: BorderRadius.circular(16),
        image: const DecorationImage(
          image: AssetImage('assets/images/branded/lassi-lounge/categories/beverages.jpg'), // Generic placeholder until map is implemented
          fit: BoxFit.cover,
          colorFilter: ColorFilter.mode(Colors.white70, BlendMode.lighten), // fade it to look like a map
        ),
      ),
      child: Stack(
        children: [
          // Simulated route line
          Positioned(
            top: 60,
            left: 60,
            right: 60,
            bottom: 60,
            child: CustomPaint(
              painter: RoutePainter(),
            ),
          ),
          // Restaurant Marker
          Positioned(
            top: 40,
            left: 40,
            child: _buildMapMarker(Icons.storefront, _order!['restaurantName'] ?? 'Restaurant', true),
          ),
          // Driver Marker
          Positioned(
            top: 100,
            left: 140,
            child: _buildDriverMarker(),
          ),
          // Destination Marker
          Positioned(
            top: 60,
            right: 40,
            child: _buildMapMarker(Icons.location_on, 'Your Address', false),
          ),
        ],
      ),
    );
  }

  Widget _buildMapMarker(IconData icon, String label, bool isLeftAligned) {
    return Column(
      crossAxisAlignment: isLeftAligned ? CrossAxisAlignment.start : CrossAxisAlignment.end,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(4),
            boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4)],
          ),
          child: Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w500)),
        ),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.all(6),
          decoration: const BoxDecoration(
            color: AppColors.secondary,
            shape: BoxShape.circle,
            boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 4)],
          ),
          child: Icon(icon, color: Colors.white, size: 16),
        ),
      ],
    );
  }

  Widget _buildDriverMarker() {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2))],
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: const Icon(Icons.moped, color: Colors.red, size: 24),
    );
  }

  Widget _buildDriverProfile() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: Colors.grey.shade200,
            backgroundImage: const AssetImage('assets/images/branded/lassi-lounge/reviews/amit-v.jpg'),
            onBackgroundImageError: (exception, stackTrace) {}, // Ignore if mock fails
            child: const Icon(Icons.person, color: Colors.grey, size: 30), // Fallback
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Your Delivery Partner', style: TextStyle(color: Colors.grey, fontSize: 11)),
                const SizedBox(height: 2),
                const Row(
                  children: [
                    Text('Delivery Agent', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.phone_outlined, color: AppColors.secondary, size: 14),
                    const SizedBox(width: 4),
                    const Text('Call Driver', style: TextStyle(fontSize: 12)),
                  ],
                ),
              ],
            ),
          ),
          OutlinedButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.phone, color: AppColors.secondary, size: 16),
            label: const Text('Call', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold)),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: AppColors.secondary),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildOrderDetails() {
    final items = _order!['items'] as List?;
    
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Order Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 16),
          
          if (items != null)
            for (var item in items) ...[
              _buildItemRow(item['image'], item['name'] ?? 'Item', item['quantity'] ?? 1, '\$${(item['price'] ?? 0).toStringAsFixed(2)}'),
              const SizedBox(height: 12),
            ],
          
          const SizedBox(height: 4),
          Row(
            children: [
              const Text('View Full Details', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right, color: AppColors.secondary, size: 16),
            ],
          ),
          const Divider(height: 32),
          _buildPriceRow('Subtotal', '\$${(_order!['subtotal'] ?? 0).toStringAsFixed(2)}'),
          const SizedBox(height: 8),
          _buildPriceRow('Delivery Fee', '\$${(_order!['deliveryFee'] ?? 0).toStringAsFixed(2)}'),
          const SizedBox(height: 8),
          _buildPriceRow('Taxes & Charges', '\$${(_order!['tax'] ?? 0).toStringAsFixed(2)}'),
          
          if ((_order!['discount'] ?? 0) > 0) ...[
            const SizedBox(height: 8),
            _buildPriceRow('Discount', '-\$${(_order!['discount']).toStringAsFixed(2)}', isDiscount: true),
          ],
          
          const SizedBox(height: 16),
          const Divider(height: 1, color: Colors.transparent), 
          Container(
            margin: const EdgeInsets.symmetric(vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Total Amount', style: TextStyle(fontWeight: FontWeight.bold)),
                Text('\$${(_order!['total'] ?? 0).toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.secondary, fontSize: 18)),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildItemRow(String? img, String name, int qty, String price) {
    final imagePath = img ?? 'assets/images/branded/lassi-lounge/categories/appetizers.jpg';
    return Row(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: imagePath.startsWith('http')
              ? CachedNetworkImage(
                  imageUrl: imagePath,
                  width: 36,
                  height: 36,
                  fit: BoxFit.cover,
                  errorWidget: (context, url, error) => Image.asset('assets/images/branded/lassi-lounge/categories/appetizers.jpg', width: 36, height: 36, fit: BoxFit.cover),
                )
              : Image.asset(imagePath, width: 36, height: 36, fit: BoxFit.cover),
        ),
        const SizedBox(width: 12),
        Expanded(child: Text(name, style: const TextStyle(fontWeight: FontWeight.w500))),
        Text('x $qty', style: const TextStyle(color: Colors.grey)),
        const SizedBox(width: 24),
        Text(price, style: const TextStyle(fontWeight: FontWeight.w500)),
      ],
    );
  }

  Widget _buildPriceRow(String label, String value, {bool isDiscount = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(color: isDiscount ? Colors.green : Colors.black87)),
        Text(value, style: TextStyle(color: isDiscount ? Colors.green : Colors.black, fontWeight: isDiscount ? FontWeight.bold : FontWeight.w500)),
      ],
    );
  }

  Widget _buildEstimatedTime() {
    final pickupTime = _order!['pickupTime'];
    final deliveryTime = _order!['deliveryTime'];
    
    if (pickupTime == null && deliveryTime == null) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFDF7F3), // Very light orange/beige
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.orange.shade100),
      ),
      child: Row(
        children: [
          const Icon(Icons.timer_outlined, color: AppColors.secondary, size: 28),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Estimated Delivery Time', style: TextStyle(color: Colors.grey, fontSize: 12)),
                const SizedBox(height: 2),
                Text(
                  deliveryTime != null ? _formatTime(deliveryTime) : 'Calculating...',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.secondary)
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.divider),
            ),
            child: const Row(
              children: [
                Text('View Details', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                SizedBox(width: 4),
                Icon(Icons.keyboard_arrow_down, size: 16),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String? isoString) {
    if (isoString == null) return '';
    try {
      final date = DateTime.parse(isoString).toLocal();
      final monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      final month = monthNames[date.month - 1];
      final hour = date.hour > 12 ? date.hour - 12 : (date.hour == 0 ? 12 : date.hour);
      final amPm = date.hour >= 12 ? 'PM' : 'AM';
      final min = date.minute.toString().padLeft(2, '0');
      return '$month ${date.day}, ${date.year} • $hour:$min $amPm';
    } catch (e) {
      return isoString;
    }
  }
  
  String _formatTime(String isoString) {
    try {
      final date = DateTime.parse(isoString).toLocal();
      final hour = date.hour > 12 ? date.hour - 12 : (date.hour == 0 ? 12 : date.hour);
      final amPm = date.hour >= 12 ? 'PM' : 'AM';
      final min = date.minute.toString().padLeft(2, '0');
      return '$hour:$min $amPm';
    } catch (e) {
      return isoString;
    }
  }
}

class RoutePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.secondary
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final path = Path();
    // Rough coordinates to match the UI image map line
    path.moveTo(0, 0); // Start at store (top leftish)
    path.lineTo(20, 50);
    path.lineTo(120, 50); // Driver position
    path.lineTo(200, 40); // End at destination (top rightish)
    
    // In a real implementation this would map LatLng to local coordinates.
    // We just draw a line to look like the mockup.
    
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
