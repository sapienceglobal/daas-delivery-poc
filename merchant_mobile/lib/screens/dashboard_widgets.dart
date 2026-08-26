import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:go_router/go_router.dart';
import '../constants/app_colors.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import '../providers/analytics_provider.dart';
import '../providers/auth_provider.dart';
// --- Welcome Banner ---
class WelcomeBanner extends StatelessWidget {
  const WelcomeBanner({Key? key}) : super(key: key);

  void _showTimeframeSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (BuildContext context) {
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
              _buildTimeframeOption(context, 'Today', 1),
              _buildTimeframeOption(context, 'Last 7 Days', 7),
              _buildTimeframeOption(context, 'Last 30 Days', 30),
              _buildTimeframeOption(context, 'Last 90 Days', 90),
              _buildTimeframeOption(context, 'Last 365 Days', 365),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTimeframeOption(BuildContext context, String label, int days) {
    final provider = context.watch<AnalyticsProvider>();
    final isSelected = provider.selectedDays == days;

    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          color: isSelected ? const Color(0xFFDC2626) : AppColors.textPrimary,
        ),
      ),
      trailing: isSelected
          ? const Icon(Icons.check_circle, color: Color(0xFFDC2626))
          : null,
      onTap: () {
        final auth = context.read<AuthProvider>();
        if (auth.user?['restaurantId'] != null) {
          context.read<AnalyticsProvider>().setSelectedDays(days, auth.user!['restaurantId']);
        }
        Navigator.pop(context);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final selectedDays = context.watch<AnalyticsProvider>().selectedDays;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF1E1B4B)], // Slate to Deep Navy
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1E1B4B).withOpacity(0.4),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // Decorative Abstract Shape
          Positioned(
            right: -20,
            top: -40,
            child: Container(
              width: 150,
              height: 150,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [const Color(0xFF6366F1).withOpacity(0.3), Colors.transparent],
                ),
              ),
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Good Morning,',
                      style: GoogleFonts.outfit(
                        color: Colors.white.withOpacity(0.7),
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Lassi Lounge',
                      style: GoogleFonts.outfit(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        letterSpacing: -0.5,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              GestureDetector(
                onTap: () => _showTimeframeSheet(context),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(color: Colors.white.withOpacity(0.2)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.calendar_month, color: Colors.white.withOpacity(0.9), size: 14),
                      const SizedBox(width: 8),
                      Text(
                        selectedDays == 1 ? 'Today' : 'Last $selectedDays Days',
                        style: GoogleFonts.inter(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(width: 4),
                      const Icon(Icons.keyboard_arrow_down, color: Colors.white, size: 16),
                    ],
                  ),
                ),
              )
            ],
          ),
        ],
      ),
    );
  }
}

// --- Summary Stats Grid ---
class SummaryStatsGrid extends StatelessWidget {
  const SummaryStatsGrid({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDesktop = MediaQuery.of(context).size.width > 800;
    final isTablet = MediaQuery.of(context).size.width > 600;
    final crossAxisCount = isDesktop ? 4 : (isTablet ? 3 : 2);
    final childAspectRatio = isDesktop ? 1.4 : (isTablet ? 1.2 : 1.0);

    final provider = context.watch<AnalyticsProvider>();
    final data = provider.data?.summary;
    final isLoading = provider.isLoading;

    if (isLoading && data == null) {
      return Shimmer.fromColors(
        baseColor: Colors.grey.shade200,
        highlightColor: Colors.white,
        child: GridView.count(
          crossAxisCount: crossAxisCount,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: childAspectRatio,
          children: List.generate(4, (index) => Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
          )),
        ),
      );
    }

    final rev = data?.totalRevenue ?? 0.0;
    final orders = data?.totalOrders ?? 0;
    final reservations = data?.reservationsCount ?? 0;
    final customers = data?.newCustomers ?? 0;
    final catering = data?.cateringCount ?? 0;

    return GridView.count(
      crossAxisCount: crossAxisCount,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: childAspectRatio,
      children: [
        _buildStatCard('Revenue', '\$${rev.toStringAsFixed(2)}', Icons.attach_money, const Color(0xFFEF4444), [2, 4, 3, 5, 4, 7]),
        _buildStatCard('Total Orders', '$orders', Icons.shopping_cart_outlined, const Color(0xFFF97316), [1, 2, 1, 3, 2, 4]),
        _buildStatCard('Reservations', '$reservations', Icons.calendar_today_outlined, const Color(0xFF8B5CF6), [3, 2, 5, 4, 6, 8]),
        _buildStatCard('Live Orders', '0', Icons.restaurant_outlined, const Color(0xFF3B82F6), [1, 1, 1, 1, 1, 1], badge: 'In Progress'), // Live Orders usually isn't historical, keep 0 for now or bind to socket
        _buildStatCard('New Customers', '$customers', Icons.people_outline, const Color(0xFF10B981), [2, 1, 3, 1, 2, 1]),
        _buildStatCard('Catering Requests', '$catering', Icons.card_giftcard, const Color(0xFFEAB308), [1, 3, 2, 4, 3, 5], badge: '$catering Total', badgeColor: const Color(0xFFFEF08A), badgeTextColor: const Color(0xFFB45309)),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color, List<double> chartData, {String? badge, Color? badgeColor, Color? badgeTextColor}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade100, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.08),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias, // To crop the half-circle
      child: Stack(
        children: [
          // Decorative half-circle on the right
          Positioned(
            right: -24,
            bottom: -24,
            child: Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                color: color.withOpacity(0.06), // slightly more transparent since it might overlap with text
                shape: BoxShape.circle,
              ),
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(icon, color: color, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        title.toUpperCase(),
                        style: GoogleFonts.inter(
                          color: Colors.grey.shade500, 
                          fontSize: 11, 
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      value,
                      style: GoogleFonts.outfit(color: AppColors.textPrimary, fontSize: 28, fontWeight: FontWeight.w800),
                    ),
                    if (badge != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: badgeColor ?? const Color(0xFFD1FAE5),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          badge,
                          style: GoogleFonts.inter(
                            color: badgeTextColor ?? const Color(0xFF047857),
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// --- Live Order Tracker ---
class LiveOrderTracker extends StatelessWidget {
  const LiveOrderTracker({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade100, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.08),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'LIVE ORDERS',
                style: GoogleFonts.inter(fontWeight: FontWeight.w800, color: AppColors.textPrimary, letterSpacing: 0.5),
              ),
              GestureDetector(
                onTap: () {
                  context.push('/live-orders');
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDC2626).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: Color(0xFFDC2626),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'View All',
                        style: GoogleFonts.inter(color: const Color(0xFFDC2626), fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: Row(
              children: [
                _buildStatusCard('New', '0', Icons.notifications_active_outlined, const Color(0xFFEF4444)),
                const SizedBox(width: 12),
                _buildStatusCard('Accepted', '0', Icons.thumb_up_outlined, const Color(0xFFF97316)),
                const SizedBox(width: 12),
                _buildStatusCard('Preparing', '0', Icons.local_fire_department_outlined, const Color(0xFF8B5CF6)),
                const SizedBox(width: 12),
                _buildStatusCard('Ready', '0', Icons.check_circle_outline, const Color(0xFF10B981)),
                const SizedBox(width: 12),
                _buildStatusCard('Delivery', '0', Icons.delivery_dining, const Color(0xFF3B82F6)),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 32),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC), // Slate 50
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)), // Slate 200
            ),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.grey.withOpacity(0.1),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      )
                    ]
                  ),
                  child: Icon(Icons.restaurant_menu, size: 32, color: Colors.grey.shade400),
                ),
                const SizedBox(height: 16),
                Text('No active orders right now', style: GoogleFonts.inter(color: const Color(0xFF64748B), fontWeight: FontWeight.w500)),
              ],
            ),
          ),

        ],
      ),
    );
  }

  Widget _buildStatusCard(String title, String count, IconData icon, Color color) {
    return Container(
      width: 110,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 12),
          Text(title, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF475569))),
          const SizedBox(height: 4),
          Text(count, style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }
}

// --- Quick Actions Grid ---
class QuickActionsGrid extends StatelessWidget {
  const QuickActionsGrid({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDesktop = MediaQuery.of(context).size.width > 800;
    final isTablet = MediaQuery.of(context).size.width > 600;
    final crossAxisCount = isDesktop ? 6 : (isTablet ? 4 : 3);
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'QUICK ACTIONS',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 16),
        GridView.count(
          crossAxisCount: crossAxisCount,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 1.0,
          children: [
            _buildActionCard('Add New Order', Icons.shopping_bag_outlined, const Color(0xFFDC2626)),
            _buildActionCard('Manage Menu', Icons.receipt_long_outlined, const Color(0xFFF97316)),
            _buildActionCard('Create Coupon', Icons.local_offer_outlined, const Color(0xFFEF4444)),
            _buildActionCard('Table Reservation', Icons.calendar_today_outlined, const Color(0xFF8B5CF6)),
            _buildActionCard('Manage Customers', Icons.people_outline, const Color(0xFF10B981)),
            _buildActionCard('View Reports', Icons.bar_chart, const Color(0xFF8B5CF6)),
            _buildActionCard('Manage Staff', Icons.person_outline, const Color(0xFFF97316)),
            _buildActionCard('Settings', Icons.settings_outlined, const Color(0xFF6B7280)),
          ],
        ),
      ],
    );
  }

  Widget _buildActionCard(String title, IconData icon, Color color) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
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
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.textPrimary),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

// --- Charts Section ---
class ChartsSection extends StatelessWidget {
  const ChartsSection({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.of(context).size.width <= 600;
    final provider = context.watch<AnalyticsProvider>();

    if (provider.isLoading && provider.data == null) {
      Widget skeletonCard(double height) {
        return Container(
          height: height,
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
        );
      }
      
      if (isMobile) {
        return Shimmer.fromColors(
          baseColor: Colors.grey.shade200,
          highlightColor: Colors.white,
          child: Column(
            children: [
              skeletonCard(300),
              const SizedBox(height: 16),
              skeletonCard(300),
              const SizedBox(height: 16),
              skeletonCard(300),
            ],
          ),
        );
      }

      return Shimmer.fromColors(
        baseColor: Colors.grey.shade200,
        highlightColor: Colors.white,
        child: Row(
          children: [
            Expanded(child: skeletonCard(350)),
            const SizedBox(width: 16),
            Expanded(child: skeletonCard(350)),
            const SizedBox(width: 16),
            Expanded(child: skeletonCard(350)),
          ],
        ),
      );
    }

    if (isMobile) {
      return Column(
        children: [
          _buildRevenueSummary(provider),
          const SizedBox(height: 16),
          _buildOrdersByChannel(provider),
          const SizedBox(height: 16),
          _buildPeakHours(provider),
        ],
      );
    }

    return Row(
      children: [
        Expanded(child: _buildRevenueSummary(provider)),
        const SizedBox(width: 16),
        Expanded(child: _buildOrdersByChannel(provider)),
        const SizedBox(width: 16),
        Expanded(child: _buildPeakHours(provider)),
      ],
    );
  }

  Widget _buildChartCard({required String title, required Widget child}) {
    return Container(
      width: double.infinity,
      height: 250,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade100, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.08),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.textPrimary, letterSpacing: 0.5)),
          const SizedBox(height: 20),
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

    final dailyStats = data?.dailyStats ?? [];
    List<FlSpot> spots = [];
    if (dailyStats.isNotEmpty) {
      for (int i = 0; i < dailyStats.length; i++) {
        spots.add(FlSpot(i.toDouble(), dailyStats[i].revenue));
      }
    } else {
      spots = const [FlSpot(0, 0)];
    }

    return _buildChartCard(
      title: 'REVENUE SUMMARY',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('\$${totalRev.toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                  Text('Total Revenue', style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary)),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: percentChange >= 0 ? const Color(0xFFD1FAE5) : const Color(0xFFFEE2E2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(percentChange >= 0 ? Icons.arrow_upward : Icons.arrow_downward, color: percentChange >= 0 ? const Color(0xFF047857) : const Color(0xFFB91C1C), size: 10),
                        Text('${percentChange.abs().toStringAsFixed(1)}%', style: GoogleFonts.inter(fontSize: 10, color: percentChange >= 0 ? const Color(0xFF047857) : const Color(0xFFB91C1C), fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text('vs prev period', style: GoogleFonts.inter(fontSize: 9, color: AppColors.textSecondary)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: LineChart(
              LineChartData(
                gridData: FlGridData(show: false),
                titlesData: FlTitlesData(show: false),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: spots,
                    isCurved: true,
                    color: const Color(0xFF6366F1), // Indigo
                    barWidth: 4,
                    isStrokeCapRound: true,
                    dotData: FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true, 
                      gradient: LinearGradient(
                        colors: [
                          const Color(0xFF6366F1).withOpacity(0.3),
                          const Color(0xFF6366F1).withOpacity(0.0),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ],
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
    final colors = [const Color(0xFF8B5CF6), const Color(0xFFEF4444), const Color(0xFF10B981), const Color(0xFF3B82F6), const Color(0xFFF59E0B)];

    if (channels.isEmpty) {
      sections = [PieChartSectionData(color: Colors.grey.shade300, value: 100, showTitle: false, radius: 20)];
    } else {
      for (int i = 0; i < channels.length; i++) {
        sections.add(PieChartSectionData(
          color: colors[i % colors.length],
          value: channels[i].count.toDouble(),
          showTitle: false,
          radius: 20,
        ));
      }
    }

    return _buildChartCard(
      title: 'ORDERS BY CHANNEL',
      child: Center(
        child: SizedBox(
          width: 120,
          height: 120,
          child: Stack(
            children: [
              PieChart(
                PieChartData(
                  sectionsSpace: 2,
                  centerSpaceRadius: 40,
                  sections: sections,
                ),
              ),
              Center(
                child: Icon(Icons.storefront, color: Colors.grey.shade600, size: 24),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPeakHours(AnalyticsProvider provider) {
    final heatmap = provider.data?.timeOfDayHeatmap ?? [];
    List<BarChartGroupData> barGroups = [];
    
    // Aggregate by hour for simplicity in this chart
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

    if (maxOrders == 0) {
      return _buildChartCard(
        title: 'PEAK HOURS (BY ORDERS)',
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const Icon(Icons.bar_chart, color: Color(0xFFD1D5DB), size: 32),
              const SizedBox(height: 8),
              Text(
                'No peak hour data available',
                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF9CA3AF)),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    for (int i = 8; i <= 22; i++) { // Assuming open 8 AM to 10 PM
      barGroups.add(_makeBar(i, (ordersByHour[i] ?? 0).toDouble(), maxOrders.toDouble()));
    }

    String peakHourStr = peakHour == 0 ? 'N/A' : '${peakHour > 12 ? peakHour - 12 : (peakHour == 0 ? 12 : peakHour)} ${peakHour >= 12 ? 'PM' : 'AM'}';

    return _buildChartCard(
      title: 'PEAK HOURS (BY ORDERS)',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('$peakHourStr – ${peakHour + 1 > 12 ? peakHour + 1 - 12 : peakHour + 1} ${peakHour + 1 >= 12 && peakHour + 1 < 24 ? 'PM' : 'AM'}', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          Text('Busiest Time', style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary)),
          const SizedBox(height: 16),
          Expanded(
            child: BarChart(
              BarChartData(
                gridData: FlGridData(show: false),
                titlesData: FlTitlesData(show: false),
                borderData: FlBorderData(show: false),
                barGroups: barGroups.isEmpty ? [_makeBar(0, 0, 0)] : barGroups,
              ),
            ),
          ),
        ],
      ),
    );
  }

  BarChartGroupData _makeBar(int x, double y, double maxY) {
    bool isPeak = y > 0 && y >= maxY * 0.8;
    return BarChartGroupData(
      x: x,
      barRods: [
        BarChartRodData(
          toY: y,
          color: isPeak ? const Color(0xFFF59E0B) : const Color(0xFFE2E8F0),
          width: 12,
          borderRadius: BorderRadius.circular(6),
        ),
      ],
    );
  }
}
