import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
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
    color = Colors.white.withValues(alpha: 0.95);
  } else {
    color = isPositive
        ? const Color(0xFF16A34A)
        : (isNegative ? const Color(0xFFDC2626) : const Color(0xFF64748B));
  }

  final icon = isPositive ? '↑' : (isNegative ? '↓' : '→');
  final absVal = trend.abs().toStringAsFixed(1);

  String timeText = 'vs prev';
  if (selectedDays == 1) {
    timeText = 'vs yesterday';
  } else if (selectedDays == 7) {
    timeText = 'vs prev 7 days';
  } else if (selectedDays == 30) {
    timeText = 'vs prev 30 days';
  } else if (selectedDays == 90) {
    timeText = 'vs prev 90 days';
  } else if (selectedDays == 365) {
    timeText = 'vs last year';
  }

  return FittedBox(
    fit: BoxFit.scaleDown,
    alignment: Alignment.centerLeft,
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          '$icon $absVal%',
          style: GoogleFonts.inter(
            color: color,
            fontSize: 11.5,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(width: 4),
        Text(
          timeText,
          style: GoogleFonts.inter(
            color: isDarkBg ? Colors.white.withValues(alpha: 0.8) : const Color(0xFF64748B),
            fontSize: 11,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    ),
  );
}

/// Mini vertical sparkline bars rendered at the bottom of the stat cards
Widget _buildSparklineBars(Color barColor) {
  const heights = [5.0, 9.0, 13.0, 7.0, 15.0, 10.0, 17.0, 12.0, 19.0, 13.0, 17.0, 12.0];
  return SizedBox(
    height: 20,
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: heights
          .map(
            (h) => Container(
              width: 3.8,
              height: h,
              decoration: BoxDecoration(
                color: barColor,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          )
          .toList(),
    ),
  );
}

// ─────────────────────────────────────────────
// WELCOME BANNER & TIMEFRAME
// ─────────────────────────────────────────────
class WelcomeBannerText extends StatelessWidget {
  const WelcomeBannerText({super.key});

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
                style: GoogleFonts.inter(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
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
      trailing: isSelected
          ? const Icon(Icons.check_circle, color: Color(0xFFFF5722))
          : const Icon(Icons.date_range, color: Colors.grey),
      onTap: () async {
        Navigator.pop(sheetContext);
        final DateTimeRange? picked = await showDateRangePicker(
          context: parentContext,
          firstDate: DateTime(2020),
          lastDate: DateTime.now().add(const Duration(days: 365)),
          builder: (context, child) {
            return Theme(
              data: Theme.of(context).copyWith(
                colorScheme: const ColorScheme.light(
                  primary: Color(0xFFFF5722),
                  onPrimary: Colors.white,
                  onSurface: Colors.black,
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
                endDate: picked.end,
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
      if (provider.specialTimeframe == 'custom' &&
          provider.customStartDate != null &&
          provider.customEndDate != null) {
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
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFFFFF7F5),
            Color(0xFFFFECE5),
          ],
        ),
        border: Border.all(color: const Color(0xFFFFE0D6), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFEA580C).withValues(alpha: 0.05),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Stack(
        alignment: Alignment.centerLeft,
        children: [
          // 1. Right Dish Platter Image with smooth soft fade into the card background
          Positioned(
            right: -10,
            top: -10,
            bottom: -10,
            width: 158,
            child: ShaderMask(
              shaderCallback: (bounds) {
                return const LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: [Colors.transparent, Colors.black],
                  stops: [0.0, 0.22],
                ).createShader(bounds);
              },
              blendMode: BlendMode.dstIn,
              child: Image.asset(
                'assets/images/hero_dish.jpg',
                fit: BoxFit.cover,
                alignment: Alignment.center,
                errorBuilder: (context, error, stackTrace) => Image.asset(
                  'assets/images/branded/lassi-lounge/dishes/butter-chicken.jpg',
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ),

          // 2. Festive Red Spice / Brush Accent Strokes above the dish (Matching Mockup)
          Positioned(
            right: 136,
            top: 20,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Transform.rotate(
                  angle: -0.32,
                  child: Container(
                    width: 3.5,
                    height: 12,
                    decoration: BoxDecoration(
                      color: const Color(0xFFDC2626),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(width: 4),
                Transform.rotate(
                  angle: -0.16,
                  child: Container(
                    width: 4,
                    height: 16,
                    decoration: BoxDecoration(
                      color: const Color(0xFFDC2626),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(width: 4),
                Transform.rotate(
                  angle: 0.12,
                  child: Container(
                    width: 3.5,
                    height: 10,
                    decoration: BoxDecoration(
                      color: const Color(0xFFDC2626),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 3. Left Text Content & Timeframe Pill
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 18, 122, 18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Welcome back,',
                  style: GoogleFonts.inter(
                    color: const Color(0xFF475569),
                    fontSize: 14.5,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 3),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Flexible(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Text(
                          'Lassi Lounge',
                          style: GoogleFonts.inter(
                            color: const Color(0xFF0F265C),
                            fontSize: 21,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.3,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 5),
                    const Text('👋', style: TextStyle(fontSize: 19)),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  "Let's make today outstanding.",
                  style: GoogleFonts.inter(
                    color: const Color(0xFF64748B),
                    fontSize: 13,
                    fontWeight: FontWeight.w400,
                  ),
                ),
                const SizedBox(height: 14),
                // Red Calendar Filter Pill matching the screenshot
                GestureDetector(
                  onTap: () => _showTimeframeSheet(context),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFFEE2E2), width: 1.2),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFEF4444).withValues(alpha: 0.08),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.calendar_today_outlined, color: Color(0xFFDC2626), size: 15),
                        const SizedBox(width: 7),
                        Text(
                          getFilterText(),
                          style: GoogleFonts.inter(
                            color: const Color(0xFFDC2626),
                            fontSize: 13.5,
                            fontWeight: FontWeight.w700,
                          ),
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
                            child: const Icon(Icons.close, color: Color(0xFFDC2626), size: 16),
                          )
                        else
                          const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFFDC2626), size: 18),
                      ],
                    ),
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
// STATS CARDS ROW — Horizontally scrollable on X-axis (Zero Overflow)
// ─────────────────────────────────────────────
class RevenueOrdersCard extends StatelessWidget {
  const RevenueOrdersCard({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AnalyticsProvider>();
    final data = provider.data?.summary;
    final rev = data?.totalRevenue ?? 0.0;
    final orders = data?.totalOrders ?? 0;
    final reservations = data?.reservationsCount ?? 0;
    final customers = data?.newCustomers ?? 0;
    final catering = data?.cateringCount ?? 0;
    final aov = data?.aov ?? 0.0;
    final selectedDays = provider.selectedDays;

    final orderProvider = context.watch<OrderProvider>();
    final liveOrders = orderProvider.orders.where((o) {
      final status = o.status.toLowerCase();
      if (status == 'picked_up' && o.orderType.toLowerCase() != 'delivery') return false;
      return ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'picked_up'].contains(status);
    }).length;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: [
          // 1. Total Revenue Card (Vibrant Orange Gradient)
          _buildRevenueCard(context, rev, data?.prevRevenue ?? 0, selectedDays),
          const SizedBox(width: 14),

          // 2. Total Orders Card (White Card with Pink Bag)
          _buildOrderCard(context, orders, data?.prevOrders ?? 0, selectedDays),
          const SizedBox(width: 14),

          // 3. New Customers Card (White Card with Green People)
          _buildNewCustomersCard(context, customers, data?.prevCustomers ?? 0, selectedDays),
          const SizedBox(width: 14),

          // 4. Reservations Card (Amber)
          _buildStatItemCard(
            title: 'Reservations',
            value: '$reservations',
            icon: Icons.calendar_today_outlined,
            iconColor: const Color(0xFFEA580C),
            iconBg: const Color(0xFFFFF7ED),
            sparklineColor: const Color(0xFFFFEDD5),
            trend: _calculateTrend(reservations, data?.prevReservationsCount ?? 0),
            selectedDays: selectedDays,
            onTap: () => context.push('/reservations'),
          ),
          const SizedBox(width: 14),

          // 5. Live Orders Card (Emerald)
          _buildStatItemCard(
            title: 'Live Orders',
            value: '$liveOrders',
            icon: Icons.restaurant_menu,
            iconColor: const Color(0xFF059669),
            iconBg: const Color(0xFFECFDF5),
            sparklineColor: const Color(0xFFD1FAE5),
            badgeText: 'In Progress',
            badgeColor: const Color(0xFF059669),
            selectedDays: selectedDays,
            onTap: () => context.push('/live-orders'),
          ),
          const SizedBox(width: 14),

          // 6. Catering Requests Card (Purple)
          _buildStatItemCard(
            title: 'Catering Requests',
            value: '$catering',
            icon: Icons.room_service_outlined,
            iconColor: const Color(0xFF9333EA),
            iconBg: const Color(0xFFFAF5FF),
            sparklineColor: const Color(0xFFF3E8FF),
            badgeText: 'Pending',
            badgeColor: const Color(0xFFEA580C),
            selectedDays: selectedDays,
            onTap: () => context.push('/catering'),
          ),
          const SizedBox(width: 14),

          // 7. Average Order Value Card (Rose)
          _buildStatItemCard(
            title: 'Avg Order Value',
            value: '\$${aov.toStringAsFixed(2)}',
            icon: Icons.bar_chart_rounded,
            iconColor: const Color(0xFFE11D48),
            iconBg: const Color(0xFFFFF1F2),
            sparklineColor: const Color(0xFFFFE4E6),
            trend: _calculateTrend(aov, data?.prevAov ?? 0),
            selectedDays: selectedDays,
            onTap: () => context.push('/analytics'),
          ),
          const SizedBox(width: 14),

          // 8. Customer Rating Card (Blue)
          _buildStatItemCard(
            title: 'Customer Rating',
            value: '0.0',
            icon: Icons.star_outline_rounded,
            iconColor: const Color(0xFF0284C7),
            iconBg: const Color(0xFFF0F9FF),
            sparklineColor: const Color(0xFFE0F2FE),
            badgeText: 'Top Rated',
            badgeColor: const Color(0xFF0284C7),
            selectedDays: selectedDays,
            onTap: () => context.push('/analytics'),
          ),
        ],
      ),
    );
  }

  // Card 1: Total Revenue (Orange Gradient)
  Widget _buildRevenueCard(BuildContext context, double rev, num prevRev, int selectedDays) {
    final trend = _calculateTrend(rev, prevRev);

    return GestureDetector(
      onTap: () => context.push('/analytics'),
      child: Container(
        width: 175,
        height: 196,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFFFF7A00),
              Color(0xFFFF4500),
              Color(0xFFE02B00),
            ],
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFFFF5722).withValues(alpha: 0.35),
              blurRadius: 14,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Top White Icon Circle
            Container(
              width: 38,
              height: 38,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: Text(
                  '\$',
                  style: TextStyle(
                    color: Color(0xFFFF5722),
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            // Middle Info (Expanded to dynamically fit and vertically center)
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Total Revenue',
                    style: GoogleFonts.inter(
                      color: Colors.white.withValues(alpha: 0.95),
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '\$${rev.toStringAsFixed(2)}',
                    style: GoogleFonts.outfit(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  _buildTrendWidget(trend, selectedDays, isDarkBg: true),
                ],
              ),
            ),
            // Bottom Sparklines
            _buildSparklineBars(Colors.white.withValues(alpha: 0.4)),
          ],
        ),
      ),
    );
  }

  // Card 2: Total Orders (White Card, Pink Icon)
  Widget _buildOrderCard(BuildContext context, int orders, num prevOrders, int selectedDays) {
    final trend = _calculateTrend(orders, prevOrders);

    return GestureDetector(
      onTap: () => context.push('/all-orders'),
      child: Container(
        width: 175,
        height: 196,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: const Color(0xFFF1F5F9), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: const BoxDecoration(
                color: Color(0xFFFDF2F8),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.shopping_bag_outlined, color: Color(0xFFDB2777), size: 21),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Total Orders',
                    style: GoogleFonts.inter(
                      color: const Color(0xFF64748B),
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '$orders',
                    style: GoogleFonts.outfit(
                      color: const Color(0xFF0F172A),
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  _buildTrendWidget(trend, selectedDays),
                ],
              ),
            ),
            _buildSparklineBars(const Color(0xFFFCE7F3)),
          ],
        ),
      ),
    );
  }

  // Card 3: New Customers (White Card, Green Icon)
  Widget _buildNewCustomersCard(BuildContext context, int customers, num prevCustomers, int selectedDays) {
    final trend = _calculateTrend(customers, prevCustomers);

    return GestureDetector(
      onTap: () => context.push('/analytics'),
      child: Container(
        width: 175,
        height: 196,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: const Color(0xFFF1F5F9), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: const BoxDecoration(
                color: Color(0xFFF0FDF4),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.people_alt_outlined, color: Color(0xFF16A34A), size: 21),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'New Customers',
                    style: GoogleFonts.inter(
                      color: const Color(0xFF64748B),
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '$customers',
                    style: GoogleFonts.outfit(
                      color: const Color(0xFF0F172A),
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  _buildTrendWidget(trend, selectedDays),
                ],
              ),
            ),
            _buildSparklineBars(const Color(0xFFDCFCE7)),
          ],
        ),
      ),
    );
  }

  // Generic White Card for all remaining metrics
  Widget _buildStatItemCard({
    required String title,
    required String value,
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required Color sparklineColor,
    double? trend,
    String? badgeText,
    Color? badgeColor,
    required int selectedDays,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 175,
        height: 196,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: const Color(0xFFF1F5F9), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: iconBg,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor, size: 21),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.inter(
                      color: const Color(0xFF64748B),
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    value,
                    style: GoogleFonts.outfit(
                      color: const Color(0xFF0F172A),
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  if (trend != null)
                    _buildTrendWidget(trend, selectedDays)
                  else if (badgeText != null && badgeColor != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                      decoration: BoxDecoration(
                        color: badgeColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        badgeText,
                        style: GoogleFonts.inter(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                          color: badgeColor,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            _buildSparklineBars(sparklineColor),
          ],
        ),
      ),
    );
  }
}

// Retained for backward-compatibility; returns empty since all stats are in the horizontal carousel
class DashboardStatsGrid extends StatelessWidget {
  const DashboardStatsGrid({super.key});

  @override
  Widget build(BuildContext context) {
    return const SizedBox.shrink();
  }
}

// ─────────────────────────────────────────────
// MOMENTUM CARD (Kept for compatibility)
// ─────────────────────────────────────────────
class MomentumCard extends StatelessWidget {
  const MomentumCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7ED),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFFEDD5)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(11),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 4, offset: const Offset(0, 2)),
              ],
            ),
            child: const Icon(Icons.assignment_turned_in_outlined, color: Color(0xFFF97316), size: 30),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Keep the momentum going! 🚀',
                  style: GoogleFonts.inter(color: const Color(0xFF111827), fontSize: 14.5, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 3),
                Text(
                  "You're all set to deliver an amazing experience today.",
                  style: GoogleFonts.inter(color: const Color(0xFF6B7280), fontSize: 12, height: 1.35),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          OutlinedButton(
            onPressed: () => context.push('/analytics'),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFFF97316)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
              backgroundColor: Colors.white,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Reports',
                  style: GoogleFonts.inter(color: const Color(0xFFF97316), fontSize: 12, fontWeight: FontWeight.w700),
                ),
                const SizedBox(width: 3),
                const Icon(Icons.arrow_forward, color: Color(0xFFF97316), size: 13),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
// LIVE ORDER TRACKER — Exact 5-step pipeline with dotted connectors (Zero Overflow)
// ─────────────────────────────────────────────
class LiveOrderTracker extends StatelessWidget {
  const LiveOrderTracker({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<OrderProvider>(
      builder: (context, orderProvider, child) {
        final activeOrders = orderProvider.orders.where((o) {
          final s = o.status;
          return !['delivered', 'cancelled', 'completed'].contains(s) &&
                 !(s == 'picked_up' && o.orderType != 'delivery');
        }).toList();

        final newCount = activeOrders.where((o) => ['new', 'pending'].contains(o.status)).length;
        final acceptedCount = activeOrders.where((o) => ['accepted', 'driver_assigned'].contains(o.status)).length;
        final preparingCount = activeOrders.where((o) => o.status == 'preparing').length;
        final readyCount = activeOrders.where((o) => o.status == 'ready').length;
        final outForDeliveryCount = activeOrders.where((o) => o.orderType == 'delivery' && o.status == 'picked_up').length;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Live Order Tracker',
                  style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF0F172A),
                    letterSpacing: -0.2,
                  ),
                ),
                GestureDetector(
                  onTap: () => context.push('/all-orders'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFFCA5A5), width: 1.2),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'View All Orders',
                          style: GoogleFonts.inter(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFFDC2626),
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(Icons.arrow_forward, color: Color(0xFFDC2626), size: 14),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Card Container
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: const Color(0xFFF1F5F9), width: 1.2),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // 1. New Step
                  _buildPipelineStep(
                    badgeText: 'NEW',
                    badgeBg: const Color(0xFFFEE2E2),
                    badgeColor: const Color(0xFFDC2626),
                    label: 'New',
                    count: '$newCount',
                    onTap: () => context.push('/all-orders'),
                  ),
                  _buildDottedConnector(),

                  // 2. Accepted Step
                  _buildPipelineStep(
                    icon: Icons.check_circle_outline,
                    badgeBg: const Color(0xFFDCFCE7),
                    badgeColor: const Color(0xFF16A34A),
                    label: 'Accepted',
                    count: '$acceptedCount',
                    onTap: () => context.push('/all-orders'),
                  ),
                  _buildDottedConnector(),

                  // 3. Preparing Step
                  _buildPipelineStep(
                    icon: Icons.restaurant,
                    badgeBg: const Color(0xFFFEF3C7),
                    badgeColor: const Color(0xFFD97706),
                    label: 'Preparing',
                    count: '$preparingCount',
                    onTap: () => context.push('/all-orders'),
                  ),
                  _buildDottedConnector(),

                  // 4. Ready Step
                  _buildPipelineStep(
                    icon: Icons.inventory_2_outlined,
                    badgeBg: const Color(0xFFE0F2FE),
                    badgeColor: const Color(0xFF0284C7),
                    label: 'Ready',
                    count: '$readyCount',
                    onTap: () => context.push('/all-orders'),
                  ),
                  _buildDottedConnector(),

                  // 5. Out for Delivery Step
                  _buildPipelineStep(
                    icon: Icons.two_wheeler,
                    badgeBg: const Color(0xFFCCFBF1),
                    badgeColor: const Color(0xFF0D9488),
                    label: 'Out for\nDelivery',
                    count: '$outForDeliveryCount',
                    onTap: () => context.push('/all-orders'),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildPipelineStep({
    String? badgeText,
    IconData? icon,
    required Color badgeBg,
    required Color badgeColor,
    required String label,
    required String count,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: badgeBg,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Center(
                child: badgeText != null
                    ? Text(
                        badgeText,
                        style: GoogleFonts.inter(
                          color: badgeColor,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.5,
                        ),
                      )
                    : Icon(icon, color: badgeColor, size: 22),
              ),
            ),
            const SizedBox(height: 6),
            SizedBox(
              height: 28,
              child: Center(
                child: Text(
                  label,
                  style: GoogleFonts.inter(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF64748B),
                    height: 1.15,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                ),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              count,
              style: GoogleFonts.inter(
                fontSize: 17,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF0F172A),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDottedConnector() {
    return SizedBox(
      width: 12,
      child: Padding(
        padding: const EdgeInsets.only(bottom: 30),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            3,
            (_) => Container(
              width: 2.5,
              height: 1.5,
              margin: const EdgeInsets.symmetric(horizontal: 0.5),
              decoration: BoxDecoration(
                color: const Color(0xFFCBD5E1),
                borderRadius: BorderRadius.circular(1),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// QUICK ACTIONS — Fully Customizable 4×2 Grid with Industry-Level "Manage"
// ─────────────────────────────────────────────
class QuickActionItem {
  final String id;
  final String label;
  final String description;
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String route;

  const QuickActionItem({
    required this.id,
    required this.label,
    required this.description,
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.route,
  });
}

class QuickActionsGrid extends StatefulWidget {
  const QuickActionsGrid({super.key});

  static const List<QuickActionItem> allActions = [
    QuickActionItem(
      id: 'all-orders',
      label: 'All Orders',
      description: 'Order history, invoices & records',
      icon: Icons.receipt_long_outlined,
      iconColor: Color(0xFFE11D48),
      iconBg: Color(0xFFFDF2F8),
      route: '/all-orders',
    ),
    QuickActionItem(
      id: 'catering',
      label: 'Catering',
      description: 'Bulk event catering & inquiries',
      icon: Icons.room_service_outlined,
      iconColor: Color(0xFFEA580C),
      iconBg: Color(0xFFFFF7ED),
      route: '/catering',
    ),
    QuickActionItem(
      id: 'menu',
      label: 'Menu\nManagement',
      description: 'Dishes, prices, addons & 86 items',
      icon: Icons.local_offer_outlined,
      iconColor: Color(0xFF9333EA),
      iconBg: Color(0xFFFAF5FF),
      route: '/menu-management',
    ),
    QuickActionItem(
      id: 'promotions',
      label: 'Promotions',
      description: 'Coupons, flash discounts & offers',
      icon: Icons.campaign_outlined,
      iconColor: Color(0xFF16A34A),
      iconBg: Color(0xFFF0FDF4),
      route: '/promotions',
    ),
    QuickActionItem(
      id: 'crm',
      label: 'Customers\n& CRM',
      description: 'Customer spending, visits & VIP tags',
      icon: Icons.group_outlined,
      iconColor: Color(0xFF0284C7),
      iconBg: Color(0xFFF0F9FF),
      route: '/crm',
    ),
    QuickActionItem(
      id: 'pos',
      label: 'Create Order',
      description: 'Counter billing & walk-in order',
      icon: Icons.shopping_cart_outlined,
      iconColor: Color(0xFFD97706),
      iconBg: Color(0xFFFEF3C7),
      route: '/pos',
    ),
    QuickActionItem(
      id: 'reservations',
      label: 'Bookings',
      description: 'Table reservations & guest dining',
      icon: Icons.calendar_month_outlined,
      iconColor: Color(0xFFE11D48),
      iconBg: Color(0xFFFFF1F2),
      route: '/reservations',
    ),
    QuickActionItem(
      id: 'analytics',
      label: 'Reports &\nAnalytics',
      description: 'Revenue trends, charts & metrics',
      icon: Icons.bar_chart_rounded,
      iconColor: Color(0xFF6366F1),
      iconBg: Color(0xFFEEF2FF),
      route: '/analytics',
    ),
    QuickActionItem(
      id: 'live-orders',
      label: 'Live Orders',
      description: 'Real-time order stream & dispatch',
      icon: Icons.moped_outlined,
      iconColor: Color(0xFF0284C7),
      iconBg: Color(0xFFE0F2FE),
      route: '/live-orders',
    ),
    QuickActionItem(
      id: 'kds',
      label: 'Kitchen KDS',
      description: 'Kitchen Display Screen for cooks',
      icon: Icons.soup_kitchen_outlined,
      iconColor: Color(0xFFC026D3),
      iconBg: Color(0xFFFDF4FF),
      route: '/kds',
    ),
    QuickActionItem(
      id: 'marketing',
      label: 'Marketing',
      description: 'SMS/Email blasts & promotions',
      icon: Icons.send_outlined,
      iconColor: Color(0xFF2563EB),
      iconBg: Color(0xFFEFF6FF),
      route: '/marketing',
    ),
    QuickActionItem(
      id: 'loyalty',
      label: 'Loyalty\nRewards',
      description: 'Customer loyalty points & tiers',
      icon: Icons.card_giftcard_outlined,
      iconColor: Color(0xFFD97706),
      iconBg: Color(0xFFFEF3C7),
      route: '/loyalty',
    ),
    QuickActionItem(
      id: 'cms',
      label: 'CMS &\nBanners',
      description: 'Store homepage banners & updates',
      icon: Icons.photo_library_outlined,
      iconColor: Color(0xFF475569),
      iconBg: Color(0xFFF1F5F9),
      route: '/cms',
    ),
    QuickActionItem(
      id: 'settings',
      label: 'Store\nSettings',
      description: 'Store hours, address & profile',
      icon: Icons.storefront_outlined,
      iconColor: Color(0xFF0D9488),
      iconBg: Color(0xFFCCFBF1),
      route: '/restaurant-settings',
    ),
    QuickActionItem(
      id: 'notifications',
      label: 'Alerts &\nNotifications',
      description: 'Store alerts, system pings & logs',
      icon: Icons.notifications_none_outlined,
      iconColor: Color(0xFFDC2626),
      iconBg: Color(0xFFFEF2F2),
      route: '/notifications',
    ),
    QuickActionItem(
      id: 'support',
      label: 'Support\nMessages',
      description: 'Customer chats & help queries',
      icon: Icons.chat_bubble_outline_rounded,
      iconColor: Color(0xFF059669),
      iconBg: Color(0xFFECFDF5),
      route: '/support-messages',
    ),
  ];

  static const List<String> defaultActionIds = [
    'all-orders',
    'catering',
    'menu',
    'promotions',
    'crm',
    'pos',
    'reservations',
    'analytics',
  ];

  @override
  State<QuickActionsGrid> createState() => _QuickActionsGridState();
}

class _QuickActionsGridState extends State<QuickActionsGrid> {
  static const String _storageKey = 'dashboard_quick_actions';
  List<String> _selectedActionIds = List.from(QuickActionsGrid.defaultActionIds);

  @override
  void initState() {
    super.initState();
    _loadSavedActions();
  }

  Future<void> _loadSavedActions() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getStringList(_storageKey);
      if (saved != null && saved.isNotEmpty) {
        final validIds = saved
            .where((id) => QuickActionsGrid.allActions.any((a) => a.id == id))
            .toList();
        if (validIds.isNotEmpty && mounted) {
          setState(() {
            _selectedActionIds = validIds;
          });
        }
      }
    } catch (e) {
      debugPrint('Error loading saved quick actions: $e');
    }
  }

  Future<void> _saveActions(List<String> newIds) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(_storageKey, newIds);
    } catch (e) {
      debugPrint('Error saving quick actions: $e');
    }
    if (mounted) {
      setState(() {
        _selectedActionIds = List.from(newIds);
      });
    }
  }

  void _openManageSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => _ManageQuickActionsSheet(
        initialSelectedIds: _selectedActionIds,
        onSave: (updatedIds) {
          _saveActions(updatedIds);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: const [
                  Icon(Icons.check_circle, color: Colors.white, size: 20),
                  SizedBox(width: 10),
                  Text(
                    'Quick actions updated successfully!',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              backgroundColor: const Color(0xFF16A34A),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              margin: const EdgeInsets.all(16),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Map selected IDs to actual items
    final activeItems = _selectedActionIds
        .map((id) {
          try {
            return QuickActionsGrid.allActions.firstWhere((a) => a.id == id);
          } catch (_) {
            return null;
          }
        })
        .whereType<QuickActionItem>()
        .toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Quick Actions',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF0F172A),
                letterSpacing: -0.2,
              ),
            ),
            InkWell(
              onTap: _openManageSheet,
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Manage',
                      style: GoogleFonts.inter(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFFDC2626),
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(Icons.tune, color: Color(0xFFDC2626), size: 16),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),

        // 4 Columns Grid dynamically rendering active items
        GridView.builder(
          itemCount: activeItems.length,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 4,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 0.72,
          ),
          itemBuilder: (context, index) {
            final item = activeItems[index];
            return _buildAction(
              context,
              icon: item.icon,
              label: item.label,
              iconColor: item.iconColor,
              iconBg: item.iconBg,
              route: item.route,
            );
          },
        ),
      ],
    );
  }

  Widget _buildAction(
    BuildContext context, {
    required IconData icon,
    required String label,
    required Color iconColor,
    required Color iconBg,
    required String route,
  }) {
    return GestureDetector(
      onTap: () => context.push(route),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFF1F5F9), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Centered icon circle with right-aligned chevron >
            SizedBox(
              height: 42,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Align(
                    alignment: Alignment.center,
                    child: Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: iconBg,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(icon, color: iconColor, size: 21),
                    ),
                  ),
                  const Positioned(
                    right: 2,
                    child: Icon(
                      Icons.chevron_right,
                      size: 15,
                      color: Color(0xFF94A3B8),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 6),
            // Centered text label matching screenshot style
            Expanded(
              child: Center(
                child: Text(
                  label,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF1E293B),
                    height: 1.15,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// INDUSTRY-LEVEL MANAGE MODAL SHEET
// ─────────────────────────────────────────────
class _ManageQuickActionsSheet extends StatefulWidget {
  final List<String> initialSelectedIds;
  final ValueChanged<List<String>> onSave;

  const _ManageQuickActionsSheet({
    required this.initialSelectedIds,
    required this.onSave,
  });

  @override
  State<_ManageQuickActionsSheet> createState() => _ManageQuickActionsSheetState();
}

class _ManageQuickActionsSheetState extends State<_ManageQuickActionsSheet> {
  late List<String> _tempSelectedIds;
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tempSelectedIds = List.from(widget.initialSelectedIds);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _toggleItem(String id) {
    setState(() {
      if (_tempSelectedIds.contains(id)) {
        if (_tempSelectedIds.length <= 1) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('At least 1 quick action shortcut is required.'),
              duration: Duration(seconds: 2),
            ),
          );
          return;
        }
        _tempSelectedIds.remove(id);
      } else {
        if (_tempSelectedIds.length >= 8) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Maximum 8 shortcuts allowed. Please uncheck one first.'),
              duration: Duration(seconds: 2),
            ),
          );
          return;
        }
        _tempSelectedIds.add(id);
      }
    });
  }

  void _resetToDefault() {
    setState(() {
      _tempSelectedIds = List.from(QuickActionsGrid.defaultActionIds);
    });
  }

  @override
  Widget build(BuildContext context) {
    final filteredActions = QuickActionsGrid.allActions.where((item) {
      if (_searchQuery.trim().isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      return item.label.toLowerCase().contains(q) ||
          item.description.toLowerCase().contains(q);
    }).toList();

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          // Drag handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFFCBD5E1),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Manage Quick Actions',
                        style: GoogleFonts.inter(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Customize your dashboard grid shortcuts (pick up to 8)',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: _tempSelectedIds.length == 8
                        ? const Color(0xFFDCFCE7)
                        : const Color(0xFFFFF7ED),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: _tempSelectedIds.length == 8
                          ? const Color(0xFF86EFAC)
                          : const Color(0xFFFED7AA),
                    ),
                  ),
                  child: Text(
                    '${_tempSelectedIds.length} / 8',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: _tempSelectedIds.length == 8
                          ? const Color(0xFF15803D)
                          : const Color(0xFFC2410C),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Search Bar & Reset Defaults
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    height: 42,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: TextField(
                      controller: _searchController,
                      onChanged: (val) {
                        setState(() {
                          _searchQuery = val;
                        });
                      },
                      style: GoogleFonts.inter(fontSize: 13.5),
                      decoration: InputDecoration(
                        hintText: 'Search modules...',
                        hintStyle: GoogleFonts.inter(
                          fontSize: 13,
                          color: const Color(0xFF94A3B8),
                        ),
                        prefixIcon: const Icon(
                          Icons.search,
                          size: 18,
                          color: Color(0xFF94A3B8),
                        ),
                        suffixIcon: _searchQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, size: 16),
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() {
                                    _searchQuery = '';
                                  });
                                },
                              )
                            : null,
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.only(top: 8),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                TextButton.icon(
                  onPressed: _resetToDefault,
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFFEA580C),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                  ),
                  icon: const Icon(Icons.restart_alt, size: 16),
                  label: Text(
                    'Reset',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const Divider(height: 20, color: Color(0xFFF1F5F9)),

          // Modules list
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
              itemCount: filteredActions.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final action = filteredActions[index];
                final isSelected = _tempSelectedIds.contains(action.id);

                return InkWell(
                  onTap: () => _toggleItem(action.id),
                  borderRadius: BorderRadius.circular(16),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? const Color(0xFFFFF7ED)
                          : const Color(0xFFFAFAFA),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSelected
                            ? const Color(0xFFFDBA74)
                            : const Color(0xFFE2E8F0),
                        width: isSelected ? 1.5 : 1.0,
                      ),
                    ),
                    child: Row(
                      children: [
                        // Icon Circle
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: action.iconBg,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(action.icon, color: action.iconColor, size: 22),
                        ),
                        const SizedBox(width: 14),

                        // Title & Description
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                action.label.replaceAll('\n', ' '),
                                style: GoogleFonts.inter(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF0F172A),
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                action.description,
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: const Color(0xFF64748B),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),

                        // Checkbox indicator
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            color: isSelected
                                ? const Color(0xFFEA580C)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: isSelected
                                  ? const Color(0xFFEA580C)
                                  : const Color(0xFFCBD5E1),
                              width: 2,
                            ),
                          ),
                          child: isSelected
                              ? const Icon(
                                  Icons.check,
                                  size: 16,
                                  color: Colors.white,
                                )
                              : null,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Bottom Action Buttons
          Container(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
            decoration: BoxDecoration(
              color: Colors.white,
              border: const Border(
                top: BorderSide(color: Color(0xFFF1F5F9)),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 10,
                  offset: const Offset(0, -3),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: const BorderSide(color: Color(0xFFE2E8F0)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: Text(
                      'Cancel',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      widget.onSave(_tempSelectedIds);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFEA580C),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.check_circle_outline, size: 18),
                        const SizedBox(width: 8),
                        Text(
                          'Save & Apply (${_tempSelectedIds.length})',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
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
// CHARTS SECTION — Revenue Summary, Orders by Channel, Peak Hours (Equal Height & Dynamic Data)
// ─────────────────────────────────────────────
class ChartsSection extends StatelessWidget {
  const ChartsSection({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AnalyticsProvider>();

    if (provider.isLoading && provider.data == null) {
      return Shimmer.fromColors(
        baseColor: Colors.grey.shade200,
        highlightColor: Colors.white,
        child: Row(
          children: [
            Expanded(child: Container(height: 228, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(22)))),
            const SizedBox(width: 12),
            Expanded(child: Container(height: 228, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(22)))),
          ],
        ),
      );
    }

    // All three cards have the EXACT same height (228px) for perfect alignment
    const double cardHeight = 228.0;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 250, height: cardHeight, child: _buildRevenueSummary(context, provider)),
          const SizedBox(width: 14),
          SizedBox(width: 285, height: cardHeight, child: _buildOrdersByChannel(context, provider)),
          const SizedBox(width: 14),
          SizedBox(width: 250, height: cardHeight, child: _buildPeakHours(context, provider)),
        ],
      ),
    );
  }

  // Helper to format ISO dates (e.g. "2026-09-24") to readable text (e.g. "24 Sep")
  String _formatShortDate(String dateStr) {
    if (dateStr.isEmpty) return '';
    try {
      final parts = dateStr.split('-');
      if (parts.length >= 3) {
        final monthNum = int.tryParse(parts[1]) ?? 0;
        final day = int.tryParse(parts[2]) ?? 0;
        const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        if (monthNum >= 1 && monthNum <= 12 && day > 0) {
          return '$day ${months[monthNum]}';
        }
      }
      final dt = DateTime.tryParse(dateStr);
      if (dt != null) {
        const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return '${dt.day} ${months[dt.month]}';
      }
    } catch (_) {}
    return dateStr;
  }

  // Card 1: Revenue Summary (Equal Height & Dynamic Bars from Provider)
  Widget _buildRevenueSummary(BuildContext context, AnalyticsProvider provider) {
    final data = provider.data;
    final totalRev = data?.summary.totalRevenue ?? 0;
    final prevRev = data?.summary.prevRevenue ?? 0;
    final percentChange = _calculateTrend(totalRev, prevRev);

    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFF1F5F9), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Top Header & Values
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Revenue Summary',
                style: GoogleFonts.inter(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF0F172A),
                  letterSpacing: -0.2,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '\$${totalRev.toStringAsFixed(2)}',
                style: GoogleFonts.outfit(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 2),
              _buildTrendWidget(percentChange, provider.selectedDays),
            ],
          ),

          // Bottom Dynamic Bars (Real data mapped from provider with readable dates)
          _buildDynamicRevenueBars(provider),
        ],
      ),
    );
  }

  // Dynamic Bars mapped from real AnalyticsProvider data (dailyStats or timeOfDayHeatmap - Zero Overflow)
  Widget _buildDynamicRevenueBars(AnalyticsProvider provider) {
    final dailyStats = provider.data?.dailyStats ?? [];
    final heatmap = provider.data?.timeOfDayHeatmap ?? [];
    final totalRev = provider.data?.summary.totalRevenue ?? 0;

    // Multi-day view (Last 7 Days, 30 Days, etc.) -> Sample at most 12 recent days so it never overflows
    if (dailyStats.length > 1) {
      final sample = dailyStats.length > 12 ? dailyStats.sublist(dailyStats.length - 12) : dailyStats;
      double maxRev = 0;
      for (var d in sample) {
        if (d.revenue > maxRev) maxRev = d.revenue;
      }

      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            height: 54,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: sample.map((d) {
                final h = maxRev > 0 ? (d.revenue / maxRev) * 48.0 + 4.0 : 4.0;
                final isPositive = d.revenue > 0;
                return Expanded(
                  child: Center(
                    child: Tooltip(
                      message: '${_formatShortDate(d.date)}: \$${d.revenue.toStringAsFixed(2)}',
                      child: Container(
                        width: 5.5,
                        height: h,
                        decoration: BoxDecoration(
                          color: isPositive ? const Color(0xFFEC4899) : const Color(0xFFFCE7F3).withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(2.75),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 6),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: SizedBox(
              width: 216,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    _formatShortDate(sample.first.date),
                    style: GoogleFonts.inter(fontSize: 9.5, fontWeight: FontWeight.w600, color: const Color(0xFF94A3B8)),
                  ),
                  Text(
                    'Daily Revenue',
                    style: GoogleFonts.inter(fontSize: 9, color: const Color(0xFF94A3B8)),
                  ),
                  Text(
                    _formatShortDate(sample.last.date),
                    style: GoogleFonts.inter(fontSize: 9.5, fontWeight: FontWeight.w600, color: const Color(0xFF94A3B8)),
                  ),
                ],
              ),
            ),
          ),
        ],
      );
    }

    // Single day (Today / Yesterday) view -> Map hourly heatmap
    Map<int, int> ordersByHour = {};
    int maxOrders = 0;
    for (var stat in heatmap) {
      ordersByHour[stat.hour] = (ordersByHour[stat.hour] ?? 0) + stat.orders;
      if ((ordersByHour[stat.hour] ?? 0) > maxOrders) {
        maxOrders = ordersByHour[stat.hour]!;
      }
    }

    // 12 distribution intervals across the day
    const hours = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          height: 54,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: hours.map((h) {
              final val = ordersByHour[h] ?? 0;
              final hasData = maxOrders > 0 && val > 0;
              final height = hasData ? (val / maxOrders) * 48.0 + 6.0 : 4.0;

              return Expanded(
                child: Center(
                  child: Tooltip(
                    message: '${h > 12 ? h - 12 : (h == 0 ? 12 : h)} ${h >= 12 ? 'PM' : 'AM'}: $val orders',
                    child: Container(
                      width: 5.5,
                      height: height,
                      decoration: BoxDecoration(
                        color: hasData
                            ? const Color(0xFFEC4899)
                            : (totalRev > 0
                                ? const Color(0xFFFCE7F3)
                                : const Color(0xFFF1F5F9)),
                        borderRadius: BorderRadius.circular(2.75),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 6),
        FittedBox(
          fit: BoxFit.scaleDown,
          child: SizedBox(
            width: 216,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                '12 AM', '6 AM', '12 PM', '6 PM', '11 PM'
              ].map((label) => Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 9.5,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF94A3B8),
                ),
              )).toList(),
            ),
          ),
        ),
      ],
    );
  }

  // Card 2: Orders by Channel (Equal Height & Polished Industry-Level Layout)
  Widget _buildOrdersByChannel(BuildContext context, AnalyticsProvider provider) {
    final channels = provider.data?.salesByChannel ?? [];
    final colors = [
      const Color(0xFFDC2626), // Dine-in
      const Color(0xFFF97316), // Takeaway
      const Color(0xFFEC4899), // Delivery
      const Color(0xFF3B82F6), // Catering
    ];
    final labels = ['Dine-in', 'Takeaway', 'Delivery', 'Catering'];

    final Map<String, int> channelCounts = {};
    for (var c in channels) {
      String name = c.channel;
      if (name.toLowerCase().contains('dine')) {
        name = 'Dine-in';
      } else if (name.toLowerCase().contains('take') || name.toLowerCase().contains('pick')) {
        name = 'Takeaway';
      } else if (name.toLowerCase().contains('deliver')) {
        name = 'Delivery';
      } else if (name.toLowerCase().contains('cater')) {
        name = 'Catering';
      }
      channelCounts[name] = (channelCounts[name] ?? 0) + c.count;
    }

    int total = channelCounts.values.fold(0, (sum, count) => sum + count);

    List<PieChartSectionData> sections = [];
    if (total == 0) {
      sections = [
        PieChartSectionData(color: const Color(0xFFEC4899), value: 35, showTitle: false, radius: 15),
        PieChartSectionData(color: const Color(0xFFF97316), value: 25, showTitle: false, radius: 15),
        PieChartSectionData(color: const Color(0xFF3B82F6), value: 20, showTitle: false, radius: 15),
        PieChartSectionData(color: const Color(0xFFDC2626), value: 20, showTitle: false, radius: 15),
      ];
    } else {
      for (int i = 0; i < labels.length; i++) {
        final count = channelCounts[labels[i]] ?? 0;
        if (count > 0) {
          sections.add(
            PieChartSectionData(
              color: colors[i % colors.length],
              value: count.toDouble(),
              showTitle: false,
              radius: 15,
            ),
          );
        }
      }
      if (sections.isEmpty) {
        sections = [
          PieChartSectionData(color: Colors.grey.shade300, value: 100, showTitle: false, radius: 15),
        ];
      }
    }

    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFF1F5F9), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Header Row with Title and Pill Badge
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Orders by Channel',
                style: GoogleFonts.inter(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF0F172A),
                  letterSpacing: -0.2,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Text(
                  '$total Orders',
                  style: GoogleFonts.inter(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF475569),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 3),
          Text(
            'Channel Distribution',
            style: GoogleFonts.inter(
              fontSize: 11,
              color: const Color(0xFF64748B),
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 12),

          // Donut Chart + Legend perfectly proportioned and centered (No huge white gap)
          Expanded(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Donut Chart
                SizedBox(
                  width: 102,
                  height: 102,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      PieChart(
                        PieChartData(
                          sectionsSpace: 3,
                          centerSpaceRadius: 31,
                          sections: sections,
                        ),
                      ),
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '$total',
                            style: GoogleFonts.outfit(
                              fontSize: 20,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                          Text(
                            'Orders',
                            style: GoogleFonts.inter(
                              fontSize: 9.5,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 14),
                // Legend
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(labels.length, (i) {
                      final count = channelCounts[labels[i]] ?? 0;
                      final pct = total > 0 ? ((count / total) * 100).toStringAsFixed(0) : '0';
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 3.5),
                        child: Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: colors[i % colors.length],
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                labels[i],
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: const Color(0xFF334155),
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            Text(
                              '$count ($pct%)',
                              style: GoogleFonts.inter(
                                fontSize: 10.5,
                                fontWeight: FontWeight.w500,
                                color: const Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Card 3: Peak Hours (Equal Height with Time Axis underneath sticks)
  Widget _buildPeakHours(BuildContext context, AnalyticsProvider provider) {
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
      barGroups.add(
        BarChartGroupData(
          x: i,
          barRods: [
            BarChartRodData(
              toY: val,
              color: isPeak ? const Color(0xFFF59E0B) : const Color(0xFFE2E8F0),
              width: 5.5,
              borderRadius: BorderRadius.circular(2.75),
            ),
          ],
        ),
      );
    }

    String peakHourStr = peakHour == 0
        ? 'N/A'
        : '${peakHour > 12 ? peakHour - 12 : (peakHour == 0 ? 12 : peakHour)} ${peakHour >= 12 ? 'PM' : 'AM'}';
    String peakHourEnd =
        '${(peakHour + 1) > 12 ? (peakHour + 1) - 12 : peakHour + 1} ${(peakHour + 1) >= 12 && (peakHour + 1) < 24 ? 'PM' : 'AM'}';

    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFF1F5F9), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Peak Hours',
                style: GoogleFonts.inter(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF0F172A),
                  letterSpacing: -0.2,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                maxOrders > 0 ? '$peakHourStr – $peakHourEnd' : 'N/A',
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'Busiest Time',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: const Color(0xFF64748B),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),

          // Bottom Bars with Time axis underneath the sticks
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                height: 54,
                child: barGroups.isEmpty
                    ? Center(
                        child: Text(
                          'No data',
                          style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
                        ),
                      )
                    : BarChart(
                        BarChartData(
                          gridData: FlGridData(show: false),
                          titlesData: FlTitlesData(show: false),
                          borderData: FlBorderData(show: false),
                          barTouchData: BarTouchData(
                            enabled: true,
                            touchTooltipData: BarTouchTooltipData(
                              getTooltipColor: (group) => const Color(0xFF0F172A).withValues(alpha: 0.95),
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
              const SizedBox(height: 6),
              FittedBox(
                fit: BoxFit.scaleDown,
                child: SizedBox(
                  width: 216,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      '8 AM', '11 AM', '2 PM', '5 PM', '8 PM', '10 PM'
                    ].map((label) => Text(
                      label,
                      style: GoogleFonts.inter(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF94A3B8),
                      ),
                    )).toList(),
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

