import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:go_router/go_router.dart';
import '../constants/app_colors.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import '../providers/analytics_provider.dart';
import '../providers/auth_provider.dart';

// ─────────────────────────────────────────────
// WELCOME BANNER — Red gradient, collapsible
// ─────────────────────────────────────────────
class WelcomeBanner extends StatelessWidget {
  const WelcomeBanner({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      child: Stack(
        children: [
          // 1. Full-screen textured background (revealed when over-scrolling down)
          Positioned.fill(
            child: Image.asset(
              'assets/images/branded/lassi-lounge/splash-bg.jpg',
              fit: BoxFit.cover,
            ),
          ),
          // 2. The main hero image at the top (with the Lassi glass)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 190,
            child: Image.asset(
              'assets/images/branded/lassi-lounge/hero-spread.jpg',
              fit: BoxFit.cover,
            ),
          ),
          // 3. Gradient overlay to blend the hero image and make text readable
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 190,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFF991B1B), // Solid dark red on left
                    const Color(0xFFB91C1C).withValues(alpha: 0.95), // Mostly solid red
                    const Color(0xFFDC2626).withValues(alpha: 0.6), // Fading red
                    Colors.transparent, // Fully transparent on the far right
                  ],
                  stops: const [0.0, 0.4, 0.75, 1.0],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class WelcomeBannerText extends StatelessWidget {
  const WelcomeBannerText({Key? key}) : super(key: key);

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
                style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
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
      trailing: isSelected ? const Icon(Icons.check_circle, color: Color(0xFFDC2626)) : null,
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
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 36),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Welcome back,',
            style: GoogleFonts.inter(
              color: Colors.white.withValues(alpha: 0.9),
              fontSize: 14,
              fontWeight: FontWeight.w400,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Lassi Lounge Admin! 👋',
            style: GoogleFonts.inter(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            "Let's make today outstanding.",
            style: GoogleFonts.inter(
              color: Colors.white.withValues(alpha: 0.8),
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 14),
          GestureDetector(
            onTap: () => _showTimeframeSheet(context),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    selectedDays == 1 ? 'Today' : 'Last $selectedDays Days',
                    style: GoogleFonts.inter(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(width: 4),
                  const Icon(Icons.keyboard_arrow_down, color: Colors.white, size: 16),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
// DASHBOARD STATS GRID — 6 cards matching web dashboard
// ─────────────────────────────────────────────
class DashboardStatsGrid extends StatelessWidget {
  const DashboardStatsGrid({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AnalyticsProvider>();
    final data = provider.data?.summary;
    final isLoading = provider.isLoading;

    if (isLoading && data == null) {
      return Shimmer.fromColors(
        baseColor: Colors.grey.shade200,
        highlightColor: Colors.white,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final itemWidth = (constraints.maxWidth - 12) / 2;
            final itemHeight = 155.0; // Increased to 155.0 to prevent 5px overflow
            return GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: itemWidth / itemHeight,
              children: List.generate(6, (_) => Container(
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
              )),
            );
          },
        ),
      );
    }

    final rev = data?.totalRevenue ?? 0.0;
    final orders = data?.totalOrders ?? 0;
    final reservations = data?.reservationsCount ?? 0;
    final customers = data?.newCustomers ?? 0;
    final catering = data?.cateringCount ?? 0;
    final liveOrders = 0; // Replace with actual live orders when available

    return LayoutBuilder(
      builder: (context, constraints) {
        final itemWidth = (constraints.maxWidth - 12) / 2;
        final itemHeight = 155.0; // Increased to 155.0 to prevent 5px overflow
        
        return GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: itemWidth / itemHeight,
          children: [
        // 1. Revenue
        _StatCard(
          icon: Icons.attach_money,
          iconBgColor: const Color(0xFFFEF2F2),
          iconColor: const Color(0xFF991B1B),
          title: 'Revenue',
          value: '\$${rev.toStringAsFixed(2)}',
        ),
        // 2. Total Orders
        _StatCard(
          icon: Icons.shopping_cart_outlined,
          iconBgColor: const Color(0xFFFFF7ED),
          iconColor: const Color(0xFFEA580C),
          title: 'Total Orders',
          value: '$orders',
        ),
        // 3. Reservations
        _StatCard(
          icon: Icons.calendar_today_outlined,
          iconBgColor: const Color(0xFFFAF5FF),
          iconColor: const Color(0xFF7C3AED),
          title: 'Reservations',
          value: '$reservations',
        ),
        // 4. Live Orders
        _StatCard(
          icon: Icons.restaurant_outlined,
          iconBgColor: const Color(0xFFEFF6FF),
          iconColor: const Color(0xFF2563EB),
          title: 'Live Orders',
          value: '$liveOrders',
          footer: _buildStatusFooter('In Progress', const Color(0xFFDCFCE7), const Color(0xFF166534), const Color(0xFF16A34A)),
        ),
        // 5. New Customers
        _StatCard(
          icon: Icons.people_outline,
          iconBgColor: const Color(0xFFDCFCE7),
          iconColor: const Color(0xFF16A34A),
          title: 'New Customers',
          value: '$customers',
        ),
        // 6. Catering Requests
        _StatCard(
          icon: Icons.card_giftcard_outlined,
          iconBgColor: const Color(0xFFFEFCE8),
          iconColor: const Color(0xFFCA8A04),
          title: 'Catering Requests',
          value: '$catering',
          footer: _buildStatusFooter('Pending', const Color(0xFFFFF7ED), const Color(0xFFEA580C), const Color(0xFFEA580C)),
        ),
          ],
        );
      },
    );
  }

  Widget _buildStatusFooter(String text, Color bg, Color textColor, Color dotColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: bg.withValues(alpha: 0.8)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle),
          ),
          const SizedBox(width: 4),
          Text(text, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: textColor)),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final Color iconBgColor;
  final Color iconColor;
  final String title;
  final String value;
  final Widget? footer;

  const _StatCard({
    required this.icon,
    required this.iconBgColor,
    required this.iconColor,
    required this.title,
    required this.value,
    this.footer,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade100, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.08),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Positioned(
            right: -20,
            bottom: -20,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.04),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: iconBgColor,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: iconColor, size: 26),
                ),
                const SizedBox(height: 12),
                Text(
                  title,
                  style: GoogleFonts.inter(
                    color: const Color(0xFF1E293B), 
                    fontSize: 13, 
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Flexible(
                      child: Text(
                        value,
                        style: GoogleFonts.outfit(color: const Color(0xFF0F172A), fontSize: 24, fontWeight: FontWeight.w800),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (footer != null) ...[
                      const SizedBox(width: 4),
                      footer!,
                    ],
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
            _buildAction(context, Icons.people, 'Manage Customers', const Color(0xFF10B981), null, websiteOnly: true),
            _buildAction(context, Icons.local_offer, 'Create Coupon', const Color(0xFFDC2626), '/promotions'),
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

    if (channels.isEmpty) {
      sections = [PieChartSectionData(color: Colors.grey.shade300, value: 100, showTitle: false, radius: 18)];
    } else {
      for (int i = 0; i < channels.length; i++) {
        sections.add(PieChartSectionData(
          color: colors[i % colors.length],
          value: channels[i].count.toDouble(),
          showTitle: false,
          radius: 18,
        ));
      }
    }

    double total = channels.fold(0, (sum, c) => sum + c.count);

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
                channels.isEmpty ? labels.length : channels.length.clamp(0, 4),
                (i) {
                  final pct = channels.isNotEmpty && total > 0
                      ? ((channels[i].count / total) * 100).toStringAsFixed(0)
                      : '0';
                  final label = channels.isNotEmpty ? channels[i].channel : labels[i];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Row(
                      children: [
                        Container(width: 8, height: 8, decoration: BoxDecoration(color: colors[i % colors.length], shape: BoxShape.circle)),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            '$label  $pct%',
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
                      barGroups: barGroups,
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
