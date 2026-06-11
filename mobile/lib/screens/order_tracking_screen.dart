import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'dart:ui' show Path, PathMetric;
import 'package:flutter/material.dart';
import 'package:intl/intl.dart' hide TextDirection;
import '../services/api_service.dart';
import '../services/socket_service.dart';
import '../theme.dart';
import '../widgets/glass_container.dart';

class OrderTrackingScreen extends StatefulWidget {
  final String orderId;
  const OrderTrackingScreen({super.key, required this.orderId});

  @override
  State<OrderTrackingScreen> createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends State<OrderTrackingScreen> {
  Map<String, dynamic>? _order;
  bool _isLoading = true;
  String? _error;

  bool _isInteractingWithMap = false;

  // Rating state
  int _rating = 5;
  final _reviewController = TextEditingController();
  bool _submittingRating = false;
  bool _ratingSuccess = false;

  final List<Map<String, String>> _statusSteps = [
    { 'key': 'pending', 'label': 'Order Confirmed', 'desc': 'Preparing your meal' },
    { 'key': 'accepted', 'label': 'Order Accepted', 'desc': 'Restaurant has accepted your order' },
    { 'key': 'preparing', 'label': 'Food Preparing', 'desc': 'Restaurant is preparing your food' },
    { 'key': 'cooking', 'label': 'Food Cooking', 'desc': 'Restaurant is cooking your food' },
    { 'key': 'ready', 'label': 'Ready & Packed', 'desc': 'Food is ready and packed' },
    { 'key': 'driver_assigned', 'label': 'Courier Heading to Store', 'desc': 'Courier heading to restaurant' },
    { 'key': 'picked_up', 'label': 'Out for Delivery', 'desc': 'Courier heading to your address' },
    { 'key': 'delivered', 'label': 'Delivered', 'desc': 'Order hand-off complete' }
  ];

  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    _fetchDetails();
    _connectSocket();
    _startPolling();
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    SocketService.disconnect('order_tracking');
    _reviewController.dispose();
    super.dispose();
  }

  void _startPolling() {
    _pollingTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      final status = _order?['deliveryStatus'];
      if (status == 'delivered' || status == 'cancelled' || status == 'failed') {
        _pollingTimer?.cancel();
        return;
      }
      _fetchDetails();
    });
  }

  Future<void> _fetchDetails() async {
    try {
      final response = await ApiService.get('/api/orders/${widget.orderId}');
      final data = json.decode(response.body);
      setState(() {
        _order = data['order'];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  void _connectSocket() {
    SocketService.connect(
      listenerId: 'order_tracking',
      onOrderUpdated: (updatedData) {
        if (updatedData != null && (updatedData['_id'] == widget.orderId || updatedData['id'] == widget.orderId)) {
          setState(() {
            _order = updatedData;
          });
        }
      },
    );
  }

  int _getStatusIndex(String? status) {
    if (status == null) return 0;
    const mapping = {
      'pending': 0,
      'accepted': 1,
      'preparing': 2,
      'cooking': 3,
      'ready': 4,
      'processing': 4,
      'quote_created': 4,
      'driver_assigned': 5,
      'picked_up': 6,
      'delivered': 7
    };
    return mapping[status] ?? 0;
  }

  Future<void> _submitRating() async {
    setState(() {
      _submittingRating = true;
    });

    try {
      final response = await ApiService.post('/api/orders/${widget.orderId}/rate', {
        'rating': _rating,
        'review': _reviewController.text.trim(),
      });
      final data = json.decode(response.body);
      if (data['success'] == true) {
        setState(() {
          _ratingSuccess = true;
          _order = data['order'];
        });
      } else {
        throw Exception(data['message'] ?? 'Rating submission failed.');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to submit rating: $e')),
      );
    } finally {
      setState(() {
        _submittingRating = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final statusIdx = _getStatusIndex(_order?['deliveryStatus']);
    final isRefunded = _order?['refunded'] == true || _order?['deliveryStatus'] == 'refunded' || _order?['deliveryStatus'] == 'cancelled';
    final isDelivered = _order?['deliveryStatus'] == 'delivered';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Track Order'),
        backgroundColor: BrandColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).popUntil((route) => route.isFirst),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: BrandColors.cyan))
          : _error != null
              ? Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(_error!, style: const TextStyle(color: BrandColors.red))))
              : SingleChildScrollView(
                  physics: _isInteractingWithMap
                      ? const NeverScrollableScrollPhysics()
                      : const BouncingScrollPhysics(),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Status Header
                      GlassContainer(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('ORDER ID', style: const TextStyle(color: BrandColors.textMuted, fontSize: 10, letterSpacing: 1, fontWeight: FontWeight.bold)),
                                    const SizedBox(height: 2),
                                    Text('#${widget.orderId.substring(widget.orderId.length - 8).toUpperCase()}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: isRefunded
                                        ? BrandColors.red.withOpacity(0.15)
                                        : isDelivered
                                            ? BrandColors.green.withOpacity(0.15)
                                            : BrandColors.cyan.withOpacity(0.15),
                                    border: Border.all(
                                      color: isRefunded
                                          ? BrandColors.red.withOpacity(0.5)
                                          : isDelivered
                                              ? BrandColors.green.withOpacity(0.5)
                                              : BrandColors.cyan.withOpacity(0.5),
                                    ),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(
                                    isRefunded
                                        ? 'REFUNDED'
                                        : _order?['deliveryStatus']?.toUpperCase() ?? '',
                                    style: TextStyle(
                                      color: isRefunded
                                          ? BrandColors.red
                                          : isDelivered
                                              ? BrandColors.green
                                              : BrandColors.cyan,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 10,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const Divider(color: BrandColors.border, height: 24),
                            if (_order?['scheduledTime'] != null) ...[
                              Row(
                                children: [
                                  const Icon(Icons.schedule, color: BrandColors.cyan, size: 16),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Scheduled Delivery: ${DateFormat('EEE, MMM d, yyyy h:mm a').format(DateTime.parse(_order!['scheduledTime']).toLocal())}',
                                    style: const TextStyle(color: BrandColors.cyan, fontSize: 13, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                            ],
                            Text('Estimated Delivery Time: ${_order?['deliveryTime'] ?? '25-35 min'}', style: const TextStyle(color: BrandColors.textMain, fontSize: 13, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Interactive OSM map tracker
                      if (!isRefunded) ...[
                        GlassContainer(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('Courier Location Mapping', style: Theme.of(context).textTheme.titleMedium),
                                  if (_order?['deliveryId'] != null)
                                    Text(
                                      'ID: ${_order!['deliveryId'].toString().length > 10 ? _order!['deliveryId'].toString().substring(_order!['deliveryId'].toString().length - 10) : _order!['deliveryId']}',
                                      style: const TextStyle(color: BrandColors.textMuted, fontSize: 10, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 20),
                              Listener(
                                onPointerDown: (_) {
                                  setState(() {
                                    _isInteractingWithMap = true;
                                  });
                                },
                                onPointerUp: (_) {
                                  setState(() {
                                    _isInteractingWithMap = false;
                                  });
                                },
                                onPointerCancel: (_) {
                                  setState(() {
                                    _isInteractingWithMap = false;
                                  });
                                },
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(16),
                                  child: Container(
                                    height: 250,
                                    width: double.infinity,
                                    color: const Color(0xFF0F172A),
                                    child: InteractiveStreetMap(
                                      order: _order,
                                      statusIndex: statusIdx,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 16),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: BrandColors.background.withOpacity(0.4),
                                  border: Border.all(color: BrandColors.border),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text(
                                            'Live Tracking Network Connected',
                                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            'Your order is tracked via our secure delivery partner gateway. Updates and courier coordinates are synced instantly on the map.',
                                            style: TextStyle(color: BrandColors.textMuted, fontSize: 9.5, height: 1.3),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                      decoration: BoxDecoration(
                                        color: BrandColors.cyan.withOpacity(0.05),
                                        border: Border.all(color: BrandColors.cyan.withOpacity(0.25)),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: const Text(
                                        'ONLINE GPS SYNC',
                                        style: TextStyle(color: BrandColors.cyan, fontSize: 9, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (statusIdx >= 2) ...[
                                const SizedBox(height: 12),
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: BrandColors.background.withOpacity(0.4),
                                    border: Border.all(color: BrandColors.border),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: const [
                                          Icon(Icons.directions_car_filled_rounded, color: BrandColors.cyan, size: 14),
                                          SizedBox(width: 6),
                                          Text(
                                            'DOORDASH DISPATCH TRACKER',
                                            style: TextStyle(color: BrandColors.cyan, fontWeight: FontWeight.bold, fontSize: 10, letterSpacing: 1),
                                          ),
                                        ],
                                      ),
                                      const Divider(color: BrandColors.border, height: 16),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          const Text('Dasher Name:', style: TextStyle(color: BrandColors.textMuted, fontSize: 10.5)),
                                          Text(_order?['dasherName'] ?? 'Awaiting assignment', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10.5)),
                                        ],
                                      ),
                                      const SizedBox(height: 6),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          const Text('Dasher Phone:', style: TextStyle(color: BrandColors.textMuted, fontSize: 10.5)),
                                          Text(_order?['dasherPhone'] ?? '—', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10.5)),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Refund alert block
                      if (isRefunded) ...[
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: BrandColors.red.withOpacity(0.1),
                            border: Border.all(color: BrandColors.red.withOpacity(0.3)),
                            borderRadius: BorderRadius.circular(24),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.warning_amber_rounded, color: BrandColors.red, size: 28),
                              SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Order Cancelled & Payout Reversed', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                                    SizedBox(height: 2),
                                    Text('This transaction has been refunded back to the payment source.', style: TextStyle(color: BrandColors.textMuted, fontSize: 11)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Linear timeline step indicator
                      GlassContainer(
                        child: ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _statusSteps.length,
                          itemBuilder: (context, idx) {
                            final step = _statusSteps[idx];
                            final isDone = idx <= statusIdx;
                            final isActive = idx == statusIdx;
                            
                            Color stepColor = isDone ? BrandColors.cyan : BrandColors.textMuted;
                            if (isDelivered && idx == _statusSteps.length - 1) {
                              stepColor = BrandColors.green;
                            }

                            return IntrinsicHeight(
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Column(
                                    children: [
                                      Container(
                                        width: 16,
                                        height: 16,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: isActive ? BrandColors.background : stepColor,
                                          border: Border.all(color: stepColor, width: isActive ? 4 : 1.5),
                                        ),
                                      ),
                                      if (idx < _statusSteps.length - 1)
                                        Expanded(
                                          child: Container(
                                            width: 2,
                                            color: idx < statusIdx ? BrandColors.cyan : BrandColors.border.withOpacity(0.3),
                                          ),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Padding(
                                      padding: const EdgeInsets.only(bottom: 20),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            step['label']!,
                                            style: TextStyle(
                                              fontSize: 13,
                                              fontWeight: isDone ? FontWeight.bold : FontWeight.normal,
                                              color: isDone ? Colors.white : BrandColors.textMuted,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(step['desc']!, style: const TextStyle(fontSize: 11, color: BrandColors.textMuted)),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Rating screen if delivered
                      if (isDelivered && !_ratingSuccess && _order?['rating'] == null) ...[
                        GlassContainer(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Text('Rate Your Delivery', style: Theme.of(context).textTheme.titleMedium),
                              const SizedBox(height: 12),
                              const Text('How was your dining and courier experience? Please leave your star feedback below.', style: TextStyle(color: BrandColors.textMuted, fontSize: 11)),
                              const SizedBox(height: 16),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: List.generate(5, (idx) {
                                  final starVal = idx + 1;
                                  return IconButton(
                                    icon: Icon(
                                      starVal <= _rating ? Icons.star : Icons.star_border,
                                      color: BrandColors.cyan,
                                      size: 36,
                                    ),
                                    onPressed: () => setState(() => _rating = starVal),
                                  );
                                }),
                              ),
                              const SizedBox(height: 12),
                              TextField(
                                controller: _reviewController,
                                decoration: const InputDecoration(labelText: 'Review comment (Optional)'),
                                maxLines: 2,
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: _submittingRating ? null : _submitRating,
                                child: _submittingRating
                                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: BrandColors.background))
                                    : const Text('SUBMIT FEEDBACK'),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],

                      if (_ratingSuccess || _order?['rating'] != null) ...[
                        GlassContainer(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Your Rating & Feedback', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white)),
                              const SizedBox(height: 12),
                              Row(
                                children: List.generate(5, (idx) {
                                  final ratingVal = _order?['rating'] ?? _rating;
                                  return Icon(
                                    idx < ratingVal ? Icons.star : Icons.star_border,
                                    color: BrandColors.cyan,
                                    size: 20,
                                  );
                                }),
                              ),
                              if (_order?['review'] != null && _order?['review'].toString().isNotEmpty == true) ...[
                                const SizedBox(height: 8),
                                Text('"${_order?['review']}"', style: const TextStyle(color: BrandColors.textMuted, fontSize: 12, fontStyle: FontStyle.italic)),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],
                    ],
                  ),
                ),
    );
  }
}

class InteractiveStreetMap extends StatefulWidget {
  final Map<String, dynamic>? order;
  final int statusIndex;
  
  const InteractiveStreetMap({
    super.key,
    required this.order,
    required this.statusIndex,
  });

  @override
  State<InteractiveStreetMap> createState() => _InteractiveStreetMapState();
}

class _InteractiveStreetMapState extends State<InteractiveStreetMap> {
  late TransformationController _transformationController;

  List<double> getRestaurantCoords(String? name) {
    final norm = (name ?? '').toLowerCase();
    if (norm.contains('burger')) return [37.7915, -122.3970];
    if (norm.contains('wasabi') || norm.contains('zen')) return [37.7924, -122.4018];
    if (norm.contains('pizza')) return [37.7912, -122.4022];
    if (norm.contains('taco') || norm.contains('fiesta')) return [37.7905, -122.4048];
    if (norm.contains('taj') || norm.contains('mahal')) return [37.7892, -122.4082];
    return [37.7915, -122.3970]; // Default
  }

  List<double> getCustomerCoords(String? address) {
    final norm = (address ?? '').toLowerCase();
    if (norm.contains('oak st')) return [37.7760, -122.4285];
    if (norm.contains('geary')) return [37.7878, -122.4075];
    if (norm.contains('valencia')) return [37.7562, -122.4215];
    if (norm.contains('lombard')) return [37.8021, -122.4189];
    return [37.7749, -122.4194]; // Default
  }

  double _lonToTileX(double lon, int zoom) {
    return (lon + 180.0) / 360.0 * pow(2.0, zoom);
  }

  double _latToTileY(double lat, int zoom) {
    return (1.0 - log(tan(lat * pi / 180.0) + 1.0 / cos(lat * pi / 180.0)) / pi) / 2.0 * pow(2.0, zoom);
  }

  @override
  void initState() {
    super.initState();
    _transformationController = TransformationController();
  }

  @override
  void dispose() {
    _transformationController.dispose();
    super.dispose();
  }

  void _centerMap(double viewW, double viewH, double midPixelX, double midPixelY) {
    final double tx = viewW / 2.0 - midPixelX;
    final double ty = viewH / 2.0 - midPixelY;
    
    final currentMatrix = _transformationController.value;
    final double currentTx = currentMatrix.storage[12];
    final double currentTy = currentMatrix.storage[13];
    final double currentScale = currentMatrix.storage[0];
    
    if ((currentTx - tx).abs() > 0.1 || (currentTy - ty).abs() > 0.1 || (currentScale - 1.0).abs() > 0.1) {
      final targetMatrix = Matrix4.identity()..translate(tx, ty);
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          _transformationController.value = targetMatrix;
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final rCoords = getRestaurantCoords(widget.order?['restaurantName']);
    final cCoords = getCustomerCoords(widget.order?['address']);
    
    final rLat = rCoords[0];
    final rLng = rCoords[1];
    final cLat = cCoords[0];
    final cLng = cCoords[1];

    final centerLat = (rLat + cLat) / 2.0;
    final centerLng = (rLng + cLng) / 2.0;

    const int zoom = 13;
    final double centerFractionalX = _lonToTileX(centerLng, zoom);
    final double centerFractionalY = _latToTileY(centerLat, zoom);

    final int centerX = centerFractionalX.floor();
    final int centerY = centerFractionalY.floor();

    final int topLeftX = centerX - 1;
    final int topLeftY = centerY - 1;

    // Calculate pixel coordinates on the 768x768 stack
    final double rX = (_lonToTileX(rLng, zoom) - topLeftX) * 256.0;
    final double rY = (_latToTileY(rLat, zoom) - topLeftY) * 256.0;

    final double cX = (_lonToTileX(cLng, zoom) - topLeftX) * 256.0;
    final double cY = (_latToTileY(cLat, zoom) - topLeftY) * 256.0;

    // L-shaped midpoint coords
    final double mX = cX;
    final double mY = rY;

    // Scooter position logic
    double statusT = 0.0;
    final status = widget.order?['deliveryStatus'];
    if (status == 'pending' || status == 'processing' || status == 'quote_created') {
      statusT = 0.05; // Sitting at restaurant
    } else if (status == 'driver_assigned') {
      statusT = 0.15;
    } else if (status == 'picked_up') {
      statusT = 0.55;
    } else if (status == 'delivered') {
      statusT = 1.0;
    } else {
      statusT = 0.55;
    }

    double dLat, dLng;
    final dynamic rawLat = widget.order?['dasherLat'];
    final dynamic rawLng = widget.order?['dasherLng'];
    if (rawLat != null && rawLng != null && rawLat != 0 && rawLng != 0) {
      dLat = (rawLat as num).toDouble();
      dLng = (rawLng as num).toDouble();
    } else {
      // Interpolated coordinates
      if (statusT <= 0.5) {
        final double segmentT = statusT / 0.5;
        dLat = rLat;
        dLng = rLng + (cLng - rLng) * segmentT;
      } else {
        final double segmentT = (statusT - 0.5) / 0.5;
        dLat = rLat + (cLat - rLat) * segmentT;
        dLng = cLng;
      }
    }

    final double scooterX = (_lonToTileX(dLng, zoom) - topLeftX) * 256.0;
    final double scooterY = (_latToTileY(dLat, zoom) - topLeftY) * 256.0;

    return LayoutBuilder(
      builder: (context, constraints) {
        final double viewW = constraints.maxWidth;
        final double viewH = constraints.maxHeight;

        final double midPixelX = (centerFractionalX - topLeftX) * 256.0;
        final double midPixelY = (centerFractionalY - topLeftY) * 256.0;

        _centerMap(viewW, viewH, midPixelX, midPixelY);

        return InteractiveViewer(
          transformationController: _transformationController,
          maxScale: 3.0,
          minScale: 0.6,
          boundaryMargin: EdgeInsets.all(max(viewW, viewH)),
          constrained: false,
          child: SizedBox(
            width: 768,
            height: 768,
            child: Stack(
              children: [
                // Background Vector street map fallback (drawn under the tiles)
                Positioned.fill(
                  child: CustomPaint(
                    painter: VectorMapPainter(
                      rX: rX,
                      rY: rY,
                      cX: cX,
                      cY: cY,
                    ),
                  ),
                ),

                // 1. Render OSM Tiles in 3x3 grid
                for (int y = 0; y < 3; y++)
                  for (int x = 0; x < 3; x++)
                    Positioned(
                      left: x * 256.0,
                      top: y * 256.0,
                      child: Container(
                        width: 256,
                        height: 256,
                        color: Colors.transparent,
                        child: Image.network(
                          'https://a.basemaps.cartocdn.com/dark_all/$zoom/${topLeftX + x}/${topLeftY + y}.png',
                          headers: const {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                          },
                          width: 256,
                          height: 256,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return const SizedBox.shrink();
                          },
                        ),
                      ),
                    ),

                // 2. Custom Painter for Dotted Route line
                Positioned.fill(
                  child: CustomPaint(
                    painter: MapRouteLinePainter(
                      restaurant: Offset(rX, rY),
                      midpoint: Offset(mX, mY),
                      customer: Offset(cX, cY),
                    ),
                  ),
                ),

                // 3. Restaurant Marker
                Positioned(
                  left: rX - 16,
                  top: rY - 16,
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: BrandColors.background,
                      shape: BoxShape.circle,
                      border: Border.all(color: BrandColors.cyan, width: 2),
                      boxShadow: [
                        BoxShadow(color: BrandColors.cyan.withOpacity(0.5), blurRadius: 15),
                      ],
                    ),
                    child: const Center(
                      child: Text('R', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                    ),
                  ),
                ),

                // 4. Customer Home Marker
                Positioned(
                  left: cX - 16,
                  top: cY - 16,
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: BrandColors.background,
                      shape: BoxShape.circle,
                      border: Border.all(color: BrandColors.green, width: 2),
                      boxShadow: [
                        BoxShadow(color: BrandColors.green.withOpacity(0.5), blurRadius: 15),
                      ],
                    ),
                    child: const Center(
                      child: Text('H', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                    ),
                  ),
                ),

                // 5. Courier/Scooter Pulse Marker
                Positioned(
                  left: scooterX - 20,
                  top: scooterY - 20,
                  child: ScooterPulseMarker(
                    status: widget.order?['deliveryStatus'] ?? 'pending',
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class MapRouteLinePainter extends CustomPainter {
  final Offset restaurant;
  final Offset midpoint;
  final Offset customer;

  MapRouteLinePainter({
    required this.restaurant,
    required this.midpoint,
    required this.customer,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = BrandColors.cyan
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final path = Path()
      ..moveTo(restaurant.dx, restaurant.dy)
      ..lineTo(midpoint.dx, midpoint.dy)
      ..lineTo(customer.dx, customer.dy);

    _drawDashedPath(canvas, path, paint, [8, 8]);
  }

  void _drawDashedPath(Canvas canvas, Path path, Paint paint, List<double> dashPattern) {
    final Path dest = Path();
    for (final PathMetric metric in path.computeMetrics()) {
      double distance = 0.0;
      bool draw = true;
      while (distance < metric.length) {
        final double len = dashPattern[draw ? 0 : 1];
        if (draw) {
          dest.addPath(
            metric.extractPath(distance, (distance + len).clamp(0.0, metric.length)),
            Offset.zero,
          );
        }
        distance += len;
        draw = !draw;
      }
    }
    canvas.drawPath(dest, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class VectorMapPainter extends CustomPainter {
  final double rX;
  final double rY;
  final double cX;
  final double cY;

  VectorMapPainter({
    required this.rX,
    required this.rY,
    required this.cX,
    required this.cY,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // 1. Draw Map Background (Dark Theme)
    final paintBg = Paint()..color = const Color(0xFF0F172A); // slate-900
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), paintBg);

    // 2. Draw River / Waterway (Background Detail)
    final paintRiver = Paint()
      ..color = const Color(0xFF1E293B)
      ..style = PaintingStyle.fill;
    final riverPath = Path()
      ..moveTo(0, size.height * 0.85)
      ..cubicTo(size.width * 0.3, size.height * 0.9, size.width * 0.4, size.height * 0.4, size.width, size.height * 0.2)
      ..lineTo(size.width, 0)
      ..lineTo(0, 0)
      ..close();
    canvas.drawPath(riverPath, paintRiver);

    final paintWaterLine = Paint()
      ..color = const Color(0xFF38BDF8).withOpacity(0.08)
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;
    final waterPath = Path()
      ..moveTo(0, size.height * 0.8)
      ..cubicTo(size.width * 0.3, size.height * 0.85, size.width * 0.4, size.height * 0.35, size.width, size.height * 0.15);
    canvas.drawPath(waterPath, paintWaterLine);

    // 3. Draw Street Grids (Gray Asphalt Lines) at rX, rY, cX, cY
    final paintRoad = Paint()
      ..color = BrandColors.border.withOpacity(0.35)
      ..strokeWidth = 14
      ..strokeCap = StrokeCap.square
      ..style = PaintingStyle.stroke;

    final paintRoadCenterline = Paint()
      ..color = Colors.white.withOpacity(0.2)
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke;

    // Draw Roads
    canvas.drawLine(Offset(0, rY), Offset(size.width, rY), paintRoad);
    canvas.drawLine(Offset(0, cY), Offset(size.width, cY), paintRoad);
    canvas.drawLine(Offset(rX, 0), Offset(rX, size.height), paintRoad);
    canvas.drawLine(Offset(cX, 0), Offset(cX, size.height), paintRoad);

    // Draw Road center dash lines
    canvas.drawLine(Offset(0, rY), Offset(size.width, rY), paintRoadCenterline);
    canvas.drawLine(Offset(0, cY), Offset(size.width, cY), paintRoadCenterline);
    canvas.drawLine(Offset(rX, 0), Offset(rX, size.height), paintRoadCenterline);
    canvas.drawLine(Offset(cX, 0), Offset(cX, size.height), paintRoadCenterline);

    // 4. Render labels
    final textPainter = TextPainter(textDirection: TextDirection.ltr);
    textPainter.text = TextSpan(
      text: 'MARKET ST',
      style: TextStyle(color: Colors.white.withOpacity(0.15), fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 1),
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(24, rY - 12));

    textPainter.text = TextSpan(
      text: 'MISSION ST',
      style: TextStyle(color: Colors.white.withOpacity(0.15), fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 1),
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(24, cY - 12));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class ScooterPulseMarker extends StatefulWidget {
  final String status;
  const ScooterPulseMarker({super.key, required this.status});

  @override
  State<ScooterPulseMarker> createState() => _ScooterPulseMarkerState();
}

class _ScooterPulseMarkerState extends State<ScooterPulseMarker> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isError = widget.status == 'cancelled' || widget.status == 'failed';
    final isDelivered = widget.status == 'delivered';
    
    final markerColor = isError 
        ? BrandColors.red 
        : (isDelivered ? BrandColors.green : const Color(0xFFF97316));
        
    final iconText = isError ? '✕' : (isDelivered ? '✔️' : '🛵');

    return AnimatedBuilder(
      animation: _pulseController,
      builder: (context, child) {
        return SizedBox(
          width: 40,
          height: 40,
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Pulsing ring
              if (!isError && !isDelivered)
                Container(
                  width: 14 + (22 * _pulseController.value),
                  height: 14 + (22 * _pulseController.value),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: markerColor.withOpacity(0.4 * (1.0 - _pulseController.value)),
                    border: Border.all(
                      color: markerColor.withOpacity(0.8 * (1.0 - _pulseController.value)),
                      width: 1.5,
                    ),
                  ),
                ),
              // Scooter icon container
              Container(
                width: 26,
                height: 26,
                decoration: BoxDecoration(
                  color: markerColor,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                  boxShadow: const [
                    BoxShadow(color: Colors.black38, blurRadius: 4, offset: Offset(0, 2)),
                  ],
                ),
                child: Center(
                  child: Text(
                    iconText,
                    style: TextStyle(
                      fontSize: isDelivered || isError ? 11 : 14,
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
