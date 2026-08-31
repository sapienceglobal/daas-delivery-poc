import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:go_router/go_router.dart';
import '../constants/app_colors.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import '../providers/analytics_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/order_provider.dart';

double _calculateTrend(num current, num previous) {
  if (previous == 0) {
    return current > 0 ? 100.0 : 0.0;
  }
  return ((current - previous) / previous) * 100.0;
}

Widget _buildTrendWidget(double trend, int selectedDays, {bool isDarkBg = false}) {
  final isPositive = trend > 0;
  final isNegative = trend < 0;
  
  Color color;
  if (isDarkBg) {
    color = Colors.white.withOpacity(0.9);
  } else {
    color = isPositive ? const Color(0xFF22C55E) : (isNegative ? const Color(0xFFEF4444) : const Color(0xFF9CA3AF));
  }

  final icon = isPositive ? '↑' : (isNegative ? '↓' : '→');
  final absVal = trend.abs().toStringAsFixed(1);
  
  String timeText = 'vs prev';
  if (selectedDays == 1) timeText = 'vs yesterday';
  else if (selectedDays == 7) timeText = 'vs prev 7 days';
  else if (selectedDays == 30) timeText = 'vs prev 30 days';
  else if (selectedDays == 90) timeText = 'vs prev 90 days';
  else if (selectedDays == 365) timeText = 'vs last year';
  
  return Wrap(
    crossAxisAlignment: WrapCrossAlignment.center,
    spacing: 4,
    runSpacing: 2,
    children: [
      Text(
        '$icon $absVal%',
        style: GoogleFonts.inter(color: color, fontSize: 11, fontWeight: FontWeight.w600),
      ),
      Text(
        timeText,
        style: GoogleFonts.inter(
          color: isDarkBg ? Colors.white.withOpacity(0.7) : const Color(0xFF9CA3AF), 
          fontSize: 10, 
          fontWeight: FontWeight.w400
        ),
      ),
    ],
  );
}

// ─────────────────────────────────────────────
// WELCOME TEXT & TIMEFRAME
// ─────────────────────────────────────────────
class WelcomeBannerText extends StatelessWidget {
  const WelcomeBannerText({Key? key}) : super(key: key);

  void _showTimeframeSheet(BuildContext parentContext) {
    showModalBottomSheet(
      context: parentContext,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (BuildContext sheetContext) {
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Select Timeframe',
                style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 16),
              _buildTimeframeOption(sheetContext, 'Today', 1),
              _buildSpecialTimeframeOption(sheetContext, 'Yesterday', 'yesterday'),
              _buildTimeframeOption(sheetContext, 'Last 7 Days', 7),
              _buildTimeframeOption(sheetContext, 'Last 30 Days', 30),
              _buildTimeframeOption(sheetContext, 'Last 90 Days', 90),
              _buildTimeframeOption(sheetContext, 'Last 365 Days', 365),
              _buildCustomTimeframeOption(sheetContext, parentContext),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTimeframeOption(BuildContext context, String label, int days) {
    final provider = context.watch<AnalyticsProvider>();
    final isSelected = provider.specialTimeframe == null && provider.selectedDays == days;

    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          color: isSelected ? const Color(0xFFFF5722) : AppColors.textPrimary,
        ),
      ),
      trailing: isSelected ? const Icon(Icons.check_circle, color: Color(0xFFFF5722)) : null,
      onTap: () {
        final auth = context.read<AuthProvider>();
        if (auth.user?['restaurantId'] != null) {
          context.read<AnalyticsProvider>().setSelectedDays(days, auth.user!['restaurantId']);
        }
        Navigator.pop(context);
      },
    );
  }

  Widget _buildSpecialTimeframeOption(BuildContext context, String label, String specialType) {
    final provider = context.watch<AnalyticsProvider>();
    final isSelected = provider.specialTimeframe == specialType;

    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          color: isSelected ? const Color(0xFFFF5722) : AppColors.textPrimary,
        ),
      ),
      trailing: isSelected ? const Icon(Icons.check_circle, color: Color(0xFFFF5722)) : null,
      onTap: () {
        final auth = context.read<AuthProvider>();
        if (auth.user?['restaurantId'] != null) {
          context.read<AnalyticsProvider>().setSpecialTimeframe(specialType, auth.user!['restaurantId']);
        }
        Navigator.pop(context);
      },
    );
  }

  Widget _buildCustomTimeframeOption(BuildContext sheetContext, BuildContext parentContext) {
    final provider = sheetContext.watch<AnalyticsProvider>();
    final isSelected = provider.specialTimeframe == 'custom';

    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(
        'Custom Date Range',
        style: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          color: isSelected ? const Color(0xFFFF5722) : AppColors.textPrimary,
        ),
      ),
      trailing: isSelected ? const Icon(Icons.check_circle, color: Color(0xFFFF5722)) : const Icon(Icons.date_range, color: Colors.grey),
      onTap: () async {
        Navigator.pop(sheetContext); // Close bottom sheet
        final DateTimeRange? picked = await showDateRangePicker(
          context: parentContext,
          firstDate: DateTime(2020),
          lastDate: DateTime.now().add(const Duration(days: 365)),
          builder: (context, child) {
            return Theme(
              data: Theme.of(context).copyWith(
                colorScheme: const ColorScheme.light(
                  primary: Color(0xFFFF5722), // header background color
                  onPrimary: Colors.white, // header text color
                  onSurface: Colors.black, // body text color
                ),
              ),
              child: child!,
            );
          },
        );
        if (picked != null) {
          if (parentContext.mounted) {
            final auth = parentContext.read<AuthProvider>();
            if (auth.user?['restaurantId'] != null) {
              parentContext.read<AnalyticsProvider>().setSpecialTimeframe(
                'custom', 
                auth.user!['restaurantId'],
                startDate: picked.start,
                endDate: picked.end
              );
            }
          }
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AnalyticsProvider>();
    final selectedDays = provider.selectedDays;
    
    String getFilterText() {
      if (provider.specialTimeframe == 'yesterday') return 'Yesterday';
      if (provider.specialTimeframe == 'custom' && provider.customStartDate != null && provider.customEndDate != null) {
        final s = provider.customStartDate!;
        final e = provider.customEndDate!;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        final sStr = '${months[s.month - 1]} ${s.day}';
        final eStr = '${months[e.month - 1]} ${e.day}';
        if (sStr == eStr) return sStr;
        return '$sStr - $eStr';
      }
      return selectedDays == 1 ? 'Today' : 'Last $selectedDays Days';
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.only(top: 8, bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Welcome back,',
            style: GoogleFonts.inter(
              color: const Color(0xFF6B7280),
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Lassi Lounge Admin! 👋',
            style: GoogleFonts.inter(
              color: const Color(0xFF1E3A8A), // Dark blue/indigo
              fontSize: 24,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            "Let's make today outstanding.",
            style: GoogleFonts.inter(
              color: const Color(0xFF6B7280),
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              GestureDetector(
                onTap: () => _showTimeframeSheet(context),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: const Color(0xFFFF5722).withOpacity(0.4)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.calendar_today, color: Color(0xFFFF5722), size: 16),
                      const SizedBox(width: 8),
                      Text(
                        getFilterText(),
                        style: GoogleFonts.inter(color: const Color(0xFFFF5722), fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(width: 4),
                      if (provider.specialTimeframe == 'custom')
                        GestureDetector(
                          onTap: () {
                            final auth = context.read<AuthProvider>();
                            if (auth.user?['restaurantId'] != null) {
                              provider.setSelectedDays(1, auth.user!['restaurantId']);
                            }
                          },
                          child: const Icon(Icons.close, color: Color(0xFFFF5722), size: 18),
                        )
                      else
                        const Icon(Icons.keyboard_arrow_down, color: Color(0xFFFF5722), size: 18),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
// REVENUE & ORDERS CARD — Orange Gradient
// ─────────────────────────────────────────────
class RevenueOrdersCard extends StatelessWidget {
  const RevenueOrdersCard({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AnalyticsProvider>();
    final data = provider.data?.summary;
    final rev = data?.totalRevenue ?? 0.0;
    final orders = data?.totalOrders ?? 0;
    final selectedDays = provider.selectedDays;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: const LinearGradient(
          colors: [Color(0xFFFF9800), Color(0xFFFF3D00)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFF5722).withOpacity(0.3),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          // Revenue Half
          Expanded(
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                  child: const Icon(Icons.attach_money, color: Color(0xFFFF5722), size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Revenue',
                        style: GoogleFonts.inter(color: Colors.white.withOpacity(0.9), fontSize: 13, fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '\$${rev.toStringAsFixed(2)}',
                        style: GoogleFonts.outfit(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 4),
                      _buildTrendWidget(_calculateTrend(rev, data?.prevRevenue ?? 0), selectedDays, isDarkBg: true),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Divider
          Container(
            height: 50,
            width: 1,
            color: Colors.white.withOpacity(0.3),
            margin: const EdgeInsets.symmetric(horizontal: 16),
          ),
          // Orders Half
          Expanded(
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                  child: const Icon(Icons.shopping_bag_outlined, color: Color(0xFFFF5722), size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Total Orders',
                        style: GoogleFonts.inter(color: Colors.white.withOpacity(0.9), fontSize: 13, fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '$orders',
                        style: GoogleFonts.outfit(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 4),
                      _buildTrendWidget(_calculateTrend(orders, data?.prevOrders ?? 0), selectedDays, isDarkBg: true),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
// DASHBOARD STATS GRID — 6 white cards
// ─────────────────────────────────────────────
class DashboardStatsGrid extends StatelessWidget {
  const DashboardStatsGrid({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AnalyticsProvider>();
    final data = provider.data?.summary;
    final isLoading = provider.isLoading;
    final selectedDays = provider.selectedDays;

    if (isLoading && data == null) {
      return Shimmer.fromColors(
        baseColor: Colors.grey.shade200,
        highlightColor: Colors.white,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final itemWidth = (constraints.maxWidth - 32) / 3; // 2 spaces of 16 = 32
            final itemHeight = 190.0; // Increased height to prevent vertical overflow
            return GridView.count(
              crossAxisCount: 3,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: itemWidth / itemHeight,
              children: List.generate(6, (_) => Container(
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
              )),
            );
          },
        ),
      );
    }

    final reservations = data?.reservationsCount ?? 0;
    final customers = data?.newCustomers ?? 0;
    final catering = data?.cateringCount ?? 0;
    final aov = data?.aov ?? 0.0;
      
    final orderProvider = context.watch<OrderProvider>();
    final liveOrders = orderProvider.orders.where((o) => ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'picked_up'].contains((o.status).toLowerCase())).length;

    return LayoutBuilder(
      builder: (context, constraints) {
        final itemWidth = (constraints.maxWidth - 32) / 3; // 2 spaces of 16 = 32
        final itemHeight = 190.0; // Increased height to prevent vertical overflow
        
        return GridView.count(
          crossAxisCount: 3,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: itemWidth / itemHeight,
          children: [
            // 1. Reservations (Orange)
            _StatCard(
              icon: Icons.calendar_today,
              watermarkIcon: Icons.calendar_today_outlined,
              iconColor: const Color(0xFFF97316), // Orange
              title: 'Reservations',
              value: '$reservations',
              trendValue: _calculateTrend(reservations, data?.prevReservationsCount ?? 0),
              selectedDays: selectedDays,
              onTap: () => context.push('/reservations'),
            ),
            // 2. Live Orders (Green)
            _StatCard(
              icon: Icons.restaurant_menu,
              watermarkIcon: Icons.room_service_outlined,
              iconColor: const Color(0xFF22C55E), // Green
              title: 'Live Orders',
              value: '$liveOrders',
              badge: _buildBadge('In Progress', const Color(0xFF22C55E)),
              selectedDays: selectedDays,
              onTap: () => context.push('/live-orders'),
            ),
            // 3. New Customers (Yellow)
            _StatCard(
              icon: Icons.people_alt,
              watermarkIcon: Icons.people_outline,
              iconColor: const Color(0xFFEAB308), // Yellow
              title: 'New Customers',
              value: '$customers',
              trendValue: _calculateTrend(customers, data?.prevCustomers ?? 0),
              selectedDays: selectedDays,
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: const Text('Please login to the website portal to use this feature.'),
                    backgroundColor: const Color(0xFF111827),
                    behavior: SnackBarBehavior.floating,
                    duration: const Duration(seconds: 2),
                  ),
                );
              },
            ),
            // 4. Catering Requests (Purple)
            _StatCard(
              icon: Icons.room_service,
              watermarkIcon: Icons.room_service_outlined,
              iconColor: const Color(0xFFA855F7), // Purple
              title: 'Catering Requests',
              value: '$catering',
              trendValue: _calculateTrend(catering, data?.prevCateringCount ?? 0),
              badge: _buildBadge('Pending', const Color(0xFFF97316)),
              selectedDays: selectedDays,
              onTap: () => context.push('/catering'),
            ),
            // 5. Average Order Value (Pink)
            _StatCard(
              icon: Icons.bar_chart,
              watermarkIcon: Icons.trending_up,
              iconColor: const Color(0xFFEC4899), // Pink
              title: 'Average Order Value',
              value: '\$${aov.toStringAsFixed(2)}',
              trendValue: _calculateTrend(aov, data?.prevAov ?? 0),
              selectedDays: selectedDays,
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: const Text('Please login to the website portal to use this feature.'),
                    backgroundColor: const Color(0xFF111827),
                    behavior: SnackBarBehavior.floating,
                    duration: const Duration(seconds: 2),
                  ),
                );
              },
            ),
            // 6. Customer Rating (Blue)
            _StatCard(
              icon: Icons.star_border,
              watermarkIcon: Icons.star_border,
              iconColor: const Color(0xFF3B82F6), // Blue
              title: 'Customer Rating',
              value: '0.0', // Backend needs to supply rating
              trendValue: 0.0, 
              selectedDays: selectedDays,
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: const Text('Please login to the website portal to use this feature.'),
                    backgroundColor: const Color(0xFF111827),
                    behavior: SnackBarBehavior.floating,
                    duration: const Duration(seconds: 2),
                  ),
                );
              },
            ),
          ],
        );
      },
    );
  }

  Widget _buildBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Wrap(
        crossAxisAlignment: WrapCrossAlignment.center,
        spacing: 4,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          Text(text, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: color)),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final IconData watermarkIcon;
  final Color iconColor;
  final String title;
  final String value;
  final double? trendValue;
  final int selectedDays;
  final Widget? badge;
  final VoidCallback? onTap;

  const _StatCard({
    required this.icon,
    required this.watermarkIcon,
    required this.iconColor,
    required this.title,
    required this.value,
    this.trendValue,
    this.selectedDays = 1,
    this.badge,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          children: [
            // Watermark Icon
            Positioned(
              right: -10,
              bottom: -10,
              child: Icon(
                watermarkIcon,
                size: 80,
                color: iconColor.withOpacity(0.08),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12), // Reduced padding to give more internal space
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Colored Icon
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: iconColor,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(icon, color: Colors.white, size: 20),
                  ),
                // Texts
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.inter(
                        color: const Color(0xFF4B5563), 
                        fontSize: 12, 
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      value,
                      style: GoogleFonts.outfit(color: const Color(0xFF111827), fontSize: 22, fontWeight: FontWeight.w700),
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    if (trendValue != null)
                      _buildTrendWidget(trendValue!, selectedDays)
                    else if (badge != null)
                      badge!,
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}
}

// ─────────────────────────────────────────────
// MOMENTUM CARD
// ─────────────────────────────────────────────
class MomentumCard extends StatelessWidget {
  const MomentumCard({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7ED), // Light orange background
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          // Left Icon/Image
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2)),
              ],
            ),
            child: const Icon(Icons.assignment_turned_in, color: Color(0xFFF97316), size: 36),
          ),
          const SizedBox(width: 16),
          // Middle Text
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Keep the momentum going! 🚀',
                  style: GoogleFonts.inter(color: const Color(0xFF111827), fontSize: 14, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 4),
                Text(
                  "You're all set to deliver an amazing\nexperience today.",
                  style: GoogleFonts.inter(color: const Color(0xFF6B7280), fontSize: 12, height: 1.4),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          // Right Button
          OutlinedButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Please login to the website dashboard to view detailed reports.', style: GoogleFonts.inter()),
                  behavior: SnackBarBehavior.floating,
                  backgroundColor: const Color(0xFF1E3A8A),
                ),
              );
            },
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFFF97316)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              backgroundColor: Colors.white,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'View Reports',
                  style: GoogleFonts.inter(color: const Color(0xFFF97316), fontSize: 12, fontWeight: FontWeight.w600),
                ),
                const SizedBox(width: 4),
                const Icon(Icons.arrow_forward, color: Color(0xFFF97316), size: 14),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
// LIVE ORDER TRACKER — Pipeline with connected dots
// ─────────────────────────────────────────────
class LiveOrderTracker extends StatelessWidget {
  const LiveOrderTracker({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Live Order Tracker',
                style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF111827)),
              ),
              GestureDetector(
                onTap: () => context.push('/all-orders'),
                child: Row(
                  children: [
                    Text(
                      'View All Orders',
                      style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFFDC2626)),
                    ),
                    const SizedBox(width: 2),
                    const Icon(Icons.arrow_forward, color: Color(0xFFDC2626), size: 14),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Pipeline
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildPipelineStep(Icons.fiber_new_outlined, 'New', '0', const Color(0xFFDC2626)),
              _buildConnector(),
              _buildPipelineStep(Icons.check_circle_outline, 'Accepted', '0', const Color(0xFF10B981)),
              _buildConnector(),
              _buildPipelineStep(Icons.restaurant_outlined, 'Preparing', '0', const Color(0xFFF97316)),
              _buildConnector(),
              _buildPipelineStep(Icons.inventory_2_outlined, 'Ready', '0', const Color(0xFF3B82F6)),
              _buildConnector(),
              _buildPipelineStep(Icons.delivery_dining, 'Out for\nDelivery', '0', const Color(0xFF0D9488)),
            ],
          ),
          const SizedBox(height: 20),

          // Empty state without New Order button
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 20),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.receipt_long_rounded, color: Colors.grey.shade400, size: 20),
                const SizedBox(width: 8),
                Text(
                  'No active orders currently',
                  style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF9CA3AF), fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPipelineStep(IconData icon, String label, String count, Color color) {
    return Expanded(
      child: Column(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w600, color: const Color(0xFF6B7280)),
            textAlign: TextAlign.center,
            maxLines: 2,
          ),
          const SizedBox(height: 2),
          Text(
            count,
            style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF111827)),
          ),
        ],
      ),
    );
  }

  Widget _buildConnector() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 30),
      child: SizedBox(
        width: 14,
        child: Row(
          children: List.generate(3, (i) => Container(
            width: 3,
            height: 3,
            margin: const EdgeInsets.symmetric(horizontal: 0.5),
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              shape: BoxShape.circle,
            ),
          )),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// QUICK ACTIONS — 2×4 grid
// ─────────────────────────────────────────────
class QuickActionsGrid extends StatelessWidget {
  const QuickActionsGrid({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF111827)),
        ),
        const SizedBox(height: 14),
        GridView.count(
          crossAxisCount: 3, // Changed from 4 to 3 for larger items
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.05, // Adjusted to make them slightly wider than square
          children: [
            _buildAction(context, Icons.restaurant_menu, 'Manage Menu', const Color(0xFFF97316), '/menu-management'),
            _buildAction(context, Icons.calendar_today, 'Table Reservation', const Color(0xFF8B5CF6), '/reservations'),
            _buildAction(context, Icons.point_of_sale, 'Point of Sale', const Color(0xFF10B981), '/pos'),
            _buildAction(context, Icons.local_offer, 'Create Coupon', const Color(0xFFDC2626), '/promotions'),
            _buildAction(context, Icons.people_alt, 'Customers & CRM', const Color(0xFFEC4899), '/crm'),
            _buildAction(context, Icons.bar_chart, 'View Reports', const Color(0xFF3B82F6), null, websiteOnly: true),
            _buildAction(context, Icons.settings, 'Settings', const Color(0xFF6B7280), null, websiteOnly: true),
          ],
        ),
      ],
    );
  }

  Widget _buildAction(BuildContext context, IconData icon, String label, Color color, String? route, {bool websiteOnly = false}) {
    return GestureDetector(
      onTap: () {
        if (websiteOnly) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Please login to the website portal to use this feature.'),
              backgroundColor: const Color(0xFF111827),
              behavior: SnackBarBehavior.floating,
              duration: const Duration(seconds: 2),
            ),
          );
        } else if (route != null) {
          context.push(route);
        }
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 28), // Increased icon size
            ),
            const SizedBox(height: 10),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: Text(
                label,
                style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFF374151)), // Increased font size
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// CHARTS SECTION — Revenue, Channel, Peak Hours
// ─────────────────────────────────────────────
class ChartsSection extends StatelessWidget {
  const ChartsSection({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AnalyticsProvider>();

    if (provider.isLoading && provider.data == null) {
      return Shimmer.fromColors(
        baseColor: Colors.grey.shade200,
        highlightColor: Colors.white,
        child: Row(
          children: [
            Expanded(child: Container(height: 180, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)))),
            const SizedBox(width: 10),
            Expanded(child: Container(height: 180, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)))),
            const SizedBox(width: 10),
            Expanded(child: Container(height: 180, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)))),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: [
          SizedBox(width: 170, child: _buildRevenueSummary(provider)),
          const SizedBox(width: 12),
          SizedBox(width: 200, child: _buildOrdersByChannel(provider)),
          const SizedBox(width: 12),
          SizedBox(width: 180, child: _buildPeakHours(provider)),
        ],
      ),
    );
  }

  Widget _buildChartCard({required String title, required Widget child}) {
    return Container(
      height: 200,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF374151))),
          const SizedBox(height: 10),
          Expanded(child: child),
        ],
      ),
    );
  }

  Widget _buildRevenueSummary(AnalyticsProvider provider) {
    final data = provider.data;
    final totalRev = data?.summary.totalRevenue ?? 0;
    final prevRev = data?.summary.prevRevenue ?? 0;

    double percentChange = 0;
    if (prevRev > 0) {
      percentChange = ((totalRev - prevRev) / prevRev) * 100;
    }

    return _buildChartCard(
      title: 'Revenue Summary',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('\$${totalRev.toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF111827))),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                decoration: BoxDecoration(
                  color: percentChange >= 0 ? const Color(0xFFD1FAE5) : const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '${percentChange >= 0 ? "↑" : "↓"} ${percentChange.abs().toStringAsFixed(1)}%',
                  style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.bold, color: percentChange >= 0 ? const Color(0xFF047857) : const Color(0xFFB91C1C)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Text('Total Revenue', style: GoogleFonts.inter(fontSize: 9, color: const Color(0xFF9CA3AF))),
          const Spacer(),
          SizedBox(
            height: 50,
            child: _buildMiniLineChart(provider),
          ),
        ],
      ),
    );
  }

  Widget _buildMiniLineChart(AnalyticsProvider provider) {
    final dailyStats = provider.data?.dailyStats ?? [];
    List<FlSpot> spots = [];
    if (dailyStats.isNotEmpty) {
      for (int i = 0; i < dailyStats.length; i++) {
        spots.add(FlSpot(i.toDouble(), dailyStats[i].revenue));
      }
    } else {
      spots = const [FlSpot(0, 0)];
    }
    return LineChart(
      LineChartData(
        gridData: FlGridData(show: false),
        titlesData: FlTitlesData(show: false),
        borderData: FlBorderData(show: false),
        lineTouchData: LineTouchData(
          touchTooltipData: LineTouchTooltipData(
            getTooltipColor: (touchedSpot) => const Color(0xFF111827).withOpacity(0.9),
            getTooltipItems: (touchedSpots) {
              return touchedSpots.map((spot) {
                return LineTooltipItem(
                  '\$${spot.y.toStringAsFixed(0)}',
                  const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10),
                );
              }).toList();
            },
          ),
        ),
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            color: const Color(0xFF6366F1),
            barWidth: 2,
            isStrokeCapRound: true,
            dotData: FlDotData(show: false),
            belowBarData: BarAreaData(
              show: true,
              gradient: LinearGradient(
                colors: [const Color(0xFF6366F1).withOpacity(0.2), const Color(0xFF6366F1).withOpacity(0.0)],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrdersByChannel(AnalyticsProvider provider) {
    final channels = provider.data?.salesByChannel ?? [];
    List<PieChartSectionData> sections = [];
    final colors = [const Color(0xFFDC2626), const Color(0xFFF97316), const Color(0xFF10B981), const Color(0xFF3B82F6)];
    final labels = ['Dine-in', 'Takeaway', 'Delivery', 'Catering'];

    final Map<String, int> channelCounts = {};
    for (var c in channels) {
      // Backend might return slightly different cases, so we map them safely
      String name = c.channel;
      if (name.toLowerCase().contains('dine')) name = 'Dine-in';
      else if (name.toLowerCase().contains('take') || name.toLowerCase().contains('pick')) name = 'Takeaway';
      else if (name.toLowerCase().contains('deliver')) name = 'Delivery';
      else if (name.toLowerCase().contains('cater')) name = 'Catering';
      
      channelCounts[name] = (channelCounts[name] ?? 0) + c.count;
    }

    int total = channelCounts.values.fold(0, (sum, count) => sum + count);

    if (total == 0) {
      sections = [PieChartSectionData(color: Colors.grey.shade300, value: 100, showTitle: false, radius: 18)];
    } else {
      for (int i = 0; i < labels.length; i++) {
        final count = channelCounts[labels[i]] ?? 0;
        if (count > 0) {
          sections.add(PieChartSectionData(
            color: colors[i % colors.length],
            value: count.toDouble(),
            showTitle: false,
            radius: 18,
          ));
        }
      }
    }

    return _buildChartCard(
      title: 'Orders by Channel',
      child: Row(
        children: [
          // Donut
          Expanded(
            flex: 3,
            child: Stack(
              alignment: Alignment.center,
              children: [
                PieChart(
                  PieChartData(
                    sectionsSpace: 2,
                    centerSpaceRadius: 28,
                    sections: sections,
                  ),
                ),
                Icon(Icons.storefront_rounded, color: Colors.grey.shade500, size: 18),
              ],
            ),
          ),
          const SizedBox(width: 8),
          // Legend
          Expanded(
            flex: 3,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: List.generate(
                labels.length,
                (i) {
                  final count = channelCounts[labels[i]] ?? 0;
                  final pct = total > 0 ? ((count / total) * 100).toStringAsFixed(0) : '0';
                  
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Row(
                      children: [
                        Container(width: 8, height: 8, decoration: BoxDecoration(color: colors[i % colors.length], shape: BoxShape.circle)),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            '${labels[i]}  $pct%',
                            style: GoogleFonts.inter(fontSize: 9, color: const Color(0xFF6B7280)),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPeakHours(AnalyticsProvider provider) {
    final heatmap = provider.data?.timeOfDayHeatmap ?? [];
    Map<int, int> ordersByHour = {};
    for (var stat in heatmap) {
      ordersByHour[stat.hour] = (ordersByHour[stat.hour] ?? 0) + stat.orders;
    }

    int maxOrders = 0;
    int peakHour = 0;
    ordersByHour.forEach((hour, orders) {
      if (orders > maxOrders) {
        maxOrders = orders;
        peakHour = hour;
      }
    });

    List<BarChartGroupData> barGroups = [];
    for (int i = 8; i <= 22; i++) {
      final val = (ordersByHour[i] ?? 0).toDouble();
      bool isPeak = val > 0 && val >= maxOrders * 0.8;
      barGroups.add(BarChartGroupData(
        x: i,
        barRods: [
          BarChartRodData(
            toY: val,
            color: isPeak ? const Color(0xFFF59E0B) : const Color(0xFFE5E7EB),
            width: 6,
            borderRadius: BorderRadius.circular(3),
          ),
        ],
      ));
    }

    String peakHourStr = peakHour == 0 ? 'N/A' : '${peakHour > 12 ? peakHour - 12 : (peakHour == 0 ? 12 : peakHour)} ${peakHour >= 12 ? 'PM' : 'AM'}';
    String peakHourEnd = '${(peakHour + 1) > 12 ? (peakHour + 1) - 12 : peakHour + 1} ${(peakHour + 1) >= 12 && (peakHour + 1) < 24 ? 'PM' : 'AM'}';

    return _buildChartCard(
      title: 'Peak Hours (By Orders)',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            maxOrders > 0 ? '$peakHourStr – $peakHourEnd' : 'N/A',
            style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF111827)),
          ),
          Text('Busiest Time', style: GoogleFonts.inter(fontSize: 9, color: const Color(0xFF9CA3AF))),
          const Spacer(),
          SizedBox(
            height: 60,
            child: barGroups.isEmpty
                ? Center(child: Text('No data', style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF9CA3AF))))
                : BarChart(
                    BarChartData(
                      gridData: FlGridData(show: false),
                      titlesData: FlTitlesData(show: false),
                      borderData: FlBorderData(show: false),
                      barTouchData: BarTouchData(
                        touchTooltipData: BarTouchTooltipData(
                          getTooltipColor: (group) => const Color(0xFF111827).withOpacity(0.9),
                          getTooltipItem: (group, groupIndex, rod, rodIndex) {
                            final hour = group.x.toInt();
                            String hourStr = '${hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour)} ${hour >= 12 ? 'PM' : 'AM'}';
                            return BarTooltipItem(
                              '$hourStr\n${rod.toY.toInt()} orders',
                              const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10),
                            );
                          },
                        ),
                      ),
                      barGroups: barGroups,
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
