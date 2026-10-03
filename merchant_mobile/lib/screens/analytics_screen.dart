import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';

import '../providers/analytics_provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/app_drawer.dart';
import '../widgets/shared_bottom_nav.dart';
import '../constants/app_colors.dart';
import '../models/analytics_model.dart';

enum ReportType {
  master,
  salesLedger,
  paymentReconciliation,
  productPerformance,
}

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({Key? key}) : super(key: key);

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  // Selected cell info for the heatmap tooltip
  String? _heatmapSelectionText;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthProvider>();
      final restaurantId = auth.user?['restaurantId'];
      if (restaurantId != null) {
        final provider = context.read<AnalyticsProvider>();
        if (provider.reportsData == null) {
          provider.fetchReportsAnalytics(restaurantId);
        }
      }
    });
  }

  String _formatCurrency(num value) {
    final formatter = NumberFormat('#,##0.00', 'en_US');
    return '\$${formatter.format(value)}';
  }

  String _formatCompact(num value) {
    if (value >= 1000000) return '\$${(value / 1000000).toStringAsFixed(1)}M';
    if (value >= 1000) return '\$${(value / 1000).toStringAsFixed(1)}K';
    return '\$${value.toStringAsFixed(0)}';
  }

  String _formatNumber(num value) {
    final formatter = NumberFormat('#,##0', 'en_US');
    return formatter.format(value);
  }

  double _calculateGrowth(num current, num previous) {
    if (previous == 0) return current > 0 ? 100.0 : 0.0;
    return ((current - previous) / previous) * 100.0;
  }

  String _getCurrentTimeframeLabel(AnalyticsProvider provider) {
    final activeDays = provider.reportsDays;
    final specialTf = provider.reportsSpecialTimeframe;

    if (specialTf == 'all') {
      return 'All Time';
    } else if (specialTf == 'yesterday') {
      return 'Yesterday';
    } else if (specialTf == 'custom' &&
        provider.reportsStartDate != null &&
        provider.reportsEndDate != null) {
      return '${DateFormat('MMM d, yyyy').format(provider.reportsStartDate!)} - ${DateFormat('MMM d, yyyy').format(provider.reportsEndDate!)}';
    } else if (activeDays == 1 && specialTf == null) {
      return 'Today';
    } else if (activeDays == 7 && specialTf == null) {
      return 'Last 7 Days';
    } else if (activeDays == 30 && specialTf == null) {
      return 'Last 30 Days';
    } else if (activeDays == 90 && specialTf == null) {
      return 'Last 90 Days';
    }
    return 'All Time';
  }

  Future<void> _exportAdvanceReport(
    AnalyticsData data,
    ReportType type,
    String timeframeLabel, {
    String restaurantName = 'Lassi Lounge',
  }) async {
    try {
      final buffer = StringBuffer();
      final now = DateTime.now();
      final dateFormatted = DateFormat('yyyy-MM-dd HH:mm:ss').format(now);
      final refCode =
          'RPT-${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}-${now.millisecond}';

      String reportTitle = 'EXECUTIVE MASTER PERFORMANCE AUDIT';
      String filePrefix = 'Executive_Master_Report';
      if (type == ReportType.salesLedger) {
        reportTitle = 'SALES & DAILY TRANSACTION LEDGER';
        filePrefix = 'Sales_Ledger_Report';
      } else if (type == ReportType.paymentReconciliation) {
        reportTitle = 'PAYMENT RECONCILIATION & TENDER AUDIT';
        filePrefix = 'Payment_Reconciliation_Report';
      } else if (type == ReportType.productPerformance) {
        reportTitle = 'MENU PERFORMANCE & PRODUCT AUDIT';
        filePrefix = 'Menu_Performance_Report';
      }

      // ── Header Block ──
      buffer.writeln('================================================================================');
      buffer.writeln('$restaurantName - $reportTitle');
      buffer.writeln('================================================================================');
      buffer.writeln('Report Reference ID,$refCode');
      buffer.writeln('Merchant / Business Name,"$restaurantName"');
      buffer.writeln('Reporting Scope / Timeframe,"$timeframeLabel"');
      buffer.writeln('Generated On (Local Time),"$dateFormatted"');
      buffer.writeln('Reporting Currency,USD (\$)');
      buffer.writeln('Standard Format,RFC 4180 CSV (Universal Excel / Google Sheets / QuickBooks)');
      buffer.writeln('');

      final summary = data.summary;
      final repeatRate = summary.totalOrders > 0
          ? (((summary.totalOrders - summary.newCustomers) / summary.totalOrders) * 100)
              .clamp(0.0, 100.0)
          : 0.0;
      final netRevenue = summary.totalRevenue - summary.totalDiscounts;

      // ── Section 1: Executive KPI Summary (Included in Master & Sales) ──
      if (type == ReportType.master || type == ReportType.salesLedger) {
        buffer.writeln('--------------------------------------------------------------------------------');
        buffer.writeln('SECTION 1: KEY PERFORMANCE INDICATORS (FINANCIAL SUMMARY)');
        buffer.writeln('--------------------------------------------------------------------------------');
        buffer.writeln('Metric,Current Period Value,Prior Period Comparison,Status Indicator');
        buffer.writeln(
            'Gross Revenue,\$${summary.totalRevenue.toStringAsFixed(2)},${_calculateGrowth(summary.totalRevenue, summary.prevRevenue).toStringAsFixed(1)}%,${summary.totalRevenue >= summary.prevRevenue ? "Growth" : "Contracted"}');
        buffer.writeln(
            'Total Order Count,${summary.totalOrders},${_calculateGrowth(summary.totalOrders, summary.prevOrders).toStringAsFixed(1)}%,Volume Metric');
        buffer.writeln(
            'Average Order Value (AOV),\$${summary.aov.toStringAsFixed(2)},${_calculateGrowth(summary.aov, summary.prevAov).toStringAsFixed(1)}%,Ticket Size');
        buffer.writeln(
            'Total Diners / Customers,${summary.newCustomers},${_calculateGrowth(summary.newCustomers, summary.prevCustomers).toStringAsFixed(1)}%,Acquisition');
        buffer.writeln(
            'Repeat Customer Rate,${repeatRate.toStringAsFixed(1)}%,${_calculateGrowth(repeatRate, 0).toStringAsFixed(1)}%,Retention Health');
        buffer.writeln(
            'Total Promotional Discounts,\$${summary.totalDiscounts.toStringAsFixed(2)},0.0%,Deductions');
        buffer.writeln(
            'Net Realized Revenue,\$${netRevenue.toStringAsFixed(2)},${_calculateGrowth(netRevenue, 0).toStringAsFixed(1)}%,Net Yield');
        buffer.writeln('');
      }

      // ── Section 2: Channels (Included in Master) ──
      if (type == ReportType.master) {
        buffer.writeln('--------------------------------------------------------------------------------');
        buffer.writeln('SECTION 2: REVENUE DISTRIBUTION BY ORDER CHANNEL');
        buffer.writeln('--------------------------------------------------------------------------------');
        buffer.writeln('Channel Identifier,Display Name,Orders Completed,Gross Revenue (\$),Revenue Share (%)');
        for (final ch in data.salesByChannel) {
          String chName = ch.channel;
          if (chName == 'dine_in') chName = 'Dine-In Service';
          else if (chName == 'delivery') chName = 'Online Delivery';
          else if (chName == 'pickup') chName = 'Takeaway / Pickup';
          else if (chName == 'web') chName = 'Website Direct';
          else if (chName == 'app') chName = 'Mobile Application';
          final share = summary.totalRevenue > 0
              ? (ch.revenue / summary.totalRevenue * 100).toStringAsFixed(1)
              : '0.0';
          buffer.writeln('"${ch.channel}","$chName",${ch.count},\$${ch.revenue.toStringAsFixed(2)},$share%');
        }
        buffer.writeln('');
      }

      // ── Section 3: Payments (Included in Master & PaymentReconciliation) ──
      if (type == ReportType.master || type == ReportType.paymentReconciliation) {
        buffer.writeln('--------------------------------------------------------------------------------');
        buffer.writeln('SECTION 3: PAYMENT TENDER & REGISTER RECONCILIATION');
        buffer.writeln('--------------------------------------------------------------------------------');
        buffer.writeln('Tender Category,Original Tender Key,Transactions,Reconciled Amount (\$),Share of Total (%)');
        for (final p in data.paymentMethodBreakdown) {
          String catName = 'Digital Wallets & Others';
          final m = p.method.toLowerCase();
          if (m == 'upi' || m == 'credit_card' || m.contains('card') || m.contains('online')) {
            catName = 'Online Payment (UPI / Credit / Debit Card)';
          } else if (m == 'cash') {
            catName = 'Cash Tender (In-Register)';
          }
          final share = summary.totalRevenue > 0
              ? (p.revenue / summary.totalRevenue * 100).toStringAsFixed(1)
              : '0.0';
          buffer.writeln('"$catName","${p.method}",${p.count},\$${p.revenue.toStringAsFixed(2)},$share%');
        }
        buffer.writeln('');
      }

      // ── Section 4: Top Dishes / Products (Included in Master & ProductPerformance) ──
      if (type == ReportType.master || type == ReportType.productPerformance) {
        buffer.writeln('--------------------------------------------------------------------------------');
        buffer.writeln('SECTION 4: MENU ITEM PERFORMANCE & PRODUCT AUDIT');
        buffer.writeln('--------------------------------------------------------------------------------');
        buffer.writeln('Sales Rank,Product / Dish Name,Units Sold,Gross Revenue Generated (\$),Average Unit Price (\$)');
        int rank = 1;
        for (final item in data.topItems) {
          final avgPrice = item.quantitySold > 0
              ? (item.revenueGenerated / item.quantitySold).toStringAsFixed(2)
              : '0.00';
          buffer.writeln(
              '$rank,"${item.name.replaceAll('"', '""')}",${item.quantitySold},\$${item.revenueGenerated.toStringAsFixed(2)},\$$avgPrice');
          rank++;
        }
        buffer.writeln('');
      }

      // ── Section 5: Daily Ledger (Included in Master & SalesLedger) ──
      if (type == ReportType.master || type == ReportType.salesLedger) {
        buffer.writeln('--------------------------------------------------------------------------------');
        buffer.writeln('SECTION 5: TIME-SERIES DAILY TRANSACTION LOG');
        buffer.writeln('--------------------------------------------------------------------------------');
        buffer.writeln('Date,Day of Week,Order Volume,Daily Gross Revenue (\$),Average Ticket Size (\$)');
        for (final d in data.dailyStats) {
          DateTime? dt = DateTime.tryParse(d.date);
          String dayName = dt != null ? DateFormat('EEEE').format(dt) : 'N/A';
          final aov = d.orders > 0 ? (d.revenue / d.orders).toStringAsFixed(2) : '0.00';
          buffer.writeln('${d.date},$dayName,${d.orders},\$${d.revenue.toStringAsFixed(2)},\$$aov');
        }
        buffer.writeln('');
      }

      // ── Footer ──
      buffer.writeln('================================================================================');
      buffer.writeln('END OF REPORT - CONFIDENTIAL & PROPRIETARY');
      buffer.writeln('Generated by DAAS Delivery Merchant Mobile Suite');
      buffer.writeln('================================================================================');

      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/${filePrefix}_${now.millisecondsSinceEpoch}.csv');
      await file.writeAsString(buffer.toString());

      await Share.shareXFiles([XFile(file.path)], text: '$restaurantName - $reportTitle');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to generate report: $e')),
        );
      }
    }
  }

  void _showExportReportsModal(
    BuildContext context,
    AnalyticsData data,
    String timeframeLabel, {
    String restaurantName = 'Lassi Lounge',
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: SafeArea(
            top: false,
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Drag Handle
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: const Color(0xFFE2E8F0),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFF1F2),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.assessment_rounded, color: Color(0xFFB91C1C), size: 22),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Executive Report Center',
                                style: GoogleFonts.outfit(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: const Color(0xFF111827),
                                ),
                              ),
                              Text(
                                'Institutional-grade audit & spreadsheet reports',
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  color: const Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: Color(0xFF64748B)),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Scope Pill
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.calendar_month_rounded, size: 14, color: Color(0xFFB91C1C)),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'Active Scope: $timeframeLabel',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF334155),
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFECFDF5),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'CSV / EXCEL',
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF059669),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 1. Featured Master Audit
                  _buildReportOptionCard(
                    title: 'Master Executive Performance Audit',
                    subtitle:
                        'Full multi-dimensional audit: KPIs, Sales Channels, Payment Tenders, Menu Products, and Time-Series Daily Ledger.',
                    tag: 'FLAGSHIP • FULL AUDIT',
                    tagColor: const Color(0xFFB91C1C),
                    tagBg: const Color(0xFFFFF1F2),
                    icon: Icons.auto_graph_rounded,
                    iconColor: const Color(0xFFB91C1C),
                    isFeatured: true,
                    onExport: () {
                      Navigator.pop(ctx);
                      _exportAdvanceReport(data, ReportType.master, timeframeLabel,
                          restaurantName: restaurantName);
                    },
                  ),
                  const SizedBox(height: 12),

                  // 2. Sales & Daily Ledger
                  _buildReportOptionCard(
                    title: 'Sales & Daily Revenue Ledger',
                    subtitle:
                        'Time-series date-by-date accounting ledger with order volume, daily gross earnings, and average ticket size.',
                    tag: 'FINANCIAL',
                    tagColor: const Color(0xFFC2410C),
                    tagBg: const Color(0xFFFFEDD5),
                    icon: Icons.receipt_long_rounded,
                    iconColor: const Color(0xFFC2410C),
                    onExport: () {
                      Navigator.pop(ctx);
                      _exportAdvanceReport(data, ReportType.salesLedger, timeframeLabel,
                          restaurantName: restaurantName);
                    },
                  ),
                  const SizedBox(height: 12),

                  // 3. Payment Reconciliation
                  _buildReportOptionCard(
                    title: 'Payment Tender Reconciliation',
                    subtitle:
                        'Cash-in-register, UPI, credit/debit card, and digital wallet tender balancing audit for cashier shifts.',
                    tag: 'TENDER AUDIT',
                    tagColor: const Color(0xFF0369A1),
                    tagBg: const Color(0xFFE0F2FE),
                    icon: Icons.account_balance_wallet_rounded,
                    iconColor: const Color(0xFF0369A1),
                    onExport: () {
                      Navigator.pop(ctx);
                      _exportAdvanceReport(
                          data, ReportType.paymentReconciliation, timeframeLabel,
                          restaurantName: restaurantName);
                    },
                  ),
                  const SizedBox(height: 12),

                  // 4. Menu & Product Performance
                  _buildReportOptionCard(
                    title: 'Menu Item & Product Sales Ranking',
                    subtitle:
                        'Product volume ranking, dish revenue contribution, and item price metrics for kitchen inventory.',
                    tag: 'OPERATIONS',
                    tagColor: const Color(0xFF15803D),
                    tagBg: const Color(0xFFDCFCE7),
                    icon: Icons.restaurant_menu_rounded,
                    iconColor: const Color(0xFF15803D),
                    onExport: () {
                      Navigator.pop(ctx);
                      _exportAdvanceReport(
                          data, ReportType.productPerformance, timeframeLabel,
                          restaurantName: restaurantName);
                    },
                  ),
                  const SizedBox(height: 16),

                  // Standard info
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.info_outline, size: 16, color: Color(0xFF64748B)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Universal RFC-4180 format. Directly compatible with Excel, Google Sheets, Numbers, QuickBooks & POS software.',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildReportOptionCard({
    required String title,
    required String subtitle,
    required String tag,
    required Color tagColor,
    required Color tagBg,
    required IconData icon,
    required Color iconColor,
    required VoidCallback onExport,
    bool isFeatured = false,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isFeatured ? const Color(0xFFFECACA) : const Color(0xFFE2E8F0),
          width: isFeatured ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: tagBg,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: iconColor, size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            title,
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF111827),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                      decoration: BoxDecoration(
                        color: tagBg,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        tag,
                        style: GoogleFonts.inter(
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          color: tagColor,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: GoogleFonts.inter(
              fontSize: 11.5,
              color: const Color(0xFF64748B),
              height: 1.35,
            ),
          ),
          const SizedBox(height: 10),
          Align(
            alignment: Alignment.centerRight,
            child: ElevatedButton.icon(
              onPressed: onExport,
              style: ElevatedButton.styleFrom(
                backgroundColor: isFeatured ? const Color(0xFFB91C1C) : const Color(0xFF0F172A),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                elevation: 0,
              ),
              icon: const Icon(Icons.file_download_outlined, size: 15),
              label: Text(
                'Generate & Export CSV',
                style: GoogleFonts.inter(fontSize: 11.5, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showDateRangePickerModal(BuildContext context, String restaurantId) async {
    final provider = context.read<AnalyticsProvider>();
    final initialStart = provider.reportsStartDate ?? DateTime.now().subtract(const Duration(days: 30));
    final initialEnd = provider.reportsEndDate ?? DateTime.now();

    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      initialDateRange: DateTimeRange(start: initialStart, end: initialEnd),
      builder: (context, child) {
        return Theme(
          data: ThemeData.light().copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFFB91C1C),
              onPrimary: Colors.white,
              surface: Colors.white,
              onSurface: Color(0xFF111827),
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      provider.setReportsSpecialTimeframe(
        'custom',
        restaurantId,
        startDate: picked.start,
        endDate: picked.end,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final restaurantId = auth.user?['restaurantId'] ?? '';

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: Text(
          'Reports & Analytics',
          style: GoogleFonts.outfit(
            color: const Color(0xFF111827),
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: Color(0xFF111827)),
        actions: [
          IconButton(
            tooltip: 'Export Report',
            icon: Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF1F2),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFFECACA)),
              ),
              child: const Icon(Icons.download_rounded, size: 18, color: Color(0xFFB91C1C)),
            ),
            onPressed: () {
              final provider = context.read<AnalyticsProvider>();
              if (provider.reportsData != null) {
                final label = _getCurrentTimeframeLabel(provider);
                final restName = auth.user?['restaurantName'] ?? 'Lassi Lounge';
                _showExportReportsModal(
                  context,
                  provider.reportsData!,
                  label,
                  restaurantName: restName,
                );
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Analytics data is still loading. Please wait...'),
                    duration: Duration(seconds: 2),
                  ),
                );
              }
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      drawer: const AppDrawer(),
      body: Consumer<AnalyticsProvider>(
        builder: (context, provider, child) {
          if (provider.isReportsLoading && provider.reportsData == null) {
            return const Center(
              child: CircularProgressIndicator(color: Color(0xFFB91C1C)),
            );
          }

          if (provider.reportsError.isNotEmpty && provider.reportsData == null) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: const BoxDecoration(
                        color: Color(0xFFFEE2E2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.error_outline, size: 40, color: Color(0xFFEF4444)),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Failed to load analytics',
                      style: GoogleFonts.outfit(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      provider.reportsError,
                      style: GoogleFonts.inter(color: Colors.grey, fontSize: 13),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFB91C1C),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () {
                        if (restaurantId.isNotEmpty) {
                          provider.fetchReportsAnalytics(restaurantId);
                        }
                      },
                      icon: const Icon(Icons.refresh_rounded, size: 18),
                      label: const Text('Try Again'),
                    ),
                  ],
                ),
              ),
            );
          }

          final data = provider.reportsData;
          if (data == null) {
            return const Center(child: Text('No analytics data available'));
          }

          final summary = data.summary;

          // Repeat customer rate calculation
          final double repeatRate = summary.totalOrders > 0
              ? (((summary.totalOrders - summary.newCustomers) / summary.totalOrders) * 100)
                  .clamp(0.0, 100.0)
              : 0.0;
          final double prevRepeatRate = summary.prevOrders > 0
              ? (((summary.prevOrders - summary.prevCustomers) / summary.prevOrders) * 100)
                  .clamp(0.0, 100.0)
              : 0.0;

          return RefreshIndicator(
            onRefresh: () async {
              if (restaurantId.isNotEmpty) {
                await provider.fetchReportsAnalytics(restaurantId);
              }
            },
            color: const Color(0xFFB91C1C),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // --- Independent Filter Bar ---
                  _buildIndependentFilterBar(context, provider, restaurantId),
                  const SizedBox(height: 18),

                  // --- Top 6 Metrics Cards ---
                  _buildTopMetricsGrid(summary, repeatRate, prevRepeatRate),
                  const SizedBox(height: 22),

                  // --- Revenue Overview Chart ---
                  _buildRevenueChart(data.dailyStats),
                  const SizedBox(height: 20),

                  // --- Sales by Channel Donut Chart ---
                  _buildSalesByChannel(data.salesByChannel, summary.totalRevenue),
                  const SizedBox(height: 20),

                  // --- Payment Method Breakdown Donut Chart ---
                  _buildPaymentMethodBreakdown(data.paymentMethodBreakdown, summary.totalRevenue),
                  const SizedBox(height: 20),

                  // --- Weekly Revenue Comparison Bar Chart ---
                  _buildWeeklyRevenueComparison(data.dailyStats),
                  const SizedBox(height: 20),

                  // --- Orders by Time of Day Heatmap ---
                  _buildHeatmapCard(data.timeOfDayHeatmap),
                  const SizedBox(height: 20),

                  // --- Top Selling Dishes ---
                  _buildTopItems(data.topItems),
                  const SizedBox(height: 20),

                  // --- Key Insights ---
                  _buildKeyInsights(summary, repeatRate, data.topItems),
                  const SizedBox(height: 20),

                  // --- Report Shortcuts ---
                  _buildReportShortcuts(context, data),
                  const SizedBox(height: 80),
                ],
              ),
            ),
          );
        },
      ),
      bottomNavigationBar: const SharedBottomNav(currentIndex: -1),
    );
  }

  // ─────────────────────────────────────────────
  // INDEPENDENT FILTER BAR (Analytics Screen Only)
  // ─────────────────────────────────────────────
  Widget _buildIndependentFilterBar(
    BuildContext context,
    AnalyticsProvider provider,
    String restaurantId,
  ) {
    final activeDays = provider.reportsDays;
    final specialTf = provider.reportsSpecialTimeframe;

    final currentLabel = _getCurrentTimeframeLabel(provider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Timeframe Filter',
                    style: GoogleFonts.outfit(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF111827),
                    ),
                  ),
                  Text(
                    'Showing: $currentLabel',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: const Color(0xFF6B7280),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            InkWell(
              onTap: () => _showDateRangePickerModal(context, restaurantId),
              borderRadius: BorderRadius.circular(10),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: specialTf == 'custom'
                        ? const Color(0xFFB91C1C)
                        : const Color(0xFFD1D5DB),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.02),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.calendar_month_rounded,
                      size: 16,
                      color: specialTf == 'custom'
                          ? const Color(0xFFB91C1C)
                          : const Color(0xFF4B5563),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Custom Range',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: specialTf == 'custom'
                            ? const Color(0xFFB91C1C)
                            : const Color(0xFF374151),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        // Horizontal filter chips
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          child: Row(
            children: [
              _buildFilterChip(
                label: 'All Time',
                isSelected: specialTf == 'all',
                onTap: () => provider.setReportsSpecialTimeframe('all', restaurantId),
              ),
              _buildFilterChip(
                label: 'Today',
                isSelected: specialTf == null && activeDays == 1,
                onTap: () => provider.setReportsDays(1, restaurantId),
              ),
              _buildFilterChip(
                label: 'Yesterday',
                isSelected: specialTf == 'yesterday',
                onTap: () => provider.setReportsSpecialTimeframe('yesterday', restaurantId),
              ),
              _buildFilterChip(
                label: '7 Days',
                isSelected: specialTf == null && activeDays == 7,
                onTap: () => provider.setReportsDays(7, restaurantId),
              ),
              _buildFilterChip(
                label: '30 Days',
                isSelected: specialTf == null && activeDays == 30,
                onTap: () => provider.setReportsDays(30, restaurantId),
              ),
              _buildFilterChip(
                label: '90 Days',
                isSelected: specialTf == null && activeDays == 90,
                onTap: () => provider.setReportsDays(90, restaurantId),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFilterChip({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(right: 8.0),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFFB91C1C) : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isSelected ? const Color(0xFFB91C1C) : const Color(0xFFE5E7EB),
            ),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: const Color(0xFFB91C1C).withOpacity(0.25),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    )
                  ]
                : [],
          ),
          child: Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              color: isSelected ? Colors.white : const Color(0xFF4B5563),
            ),
          ),
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────
  // 6 STATS CARDS (Top Metrics)
  // ─────────────────────────────────────────────
  Widget _buildTopMetricsGrid(
    AnalyticsSummary summary,
    double repeatRate,
    double prevRepeatRate,
  ) {
    final revGrowth = _calculateGrowth(summary.totalRevenue, summary.prevRevenue);
    final ordGrowth = _calculateGrowth(summary.totalOrders, summary.prevOrders);
    final aovGrowth = _calculateGrowth(summary.aov, summary.prevAov);
    final cusGrowth = _calculateGrowth(summary.newCustomers, summary.prevCustomers);
    final repGrowth = _calculateGrowth(repeatRate, prevRepeatRate);
    final discGrowth = _calculateGrowth(summary.totalDiscounts, 0);

    final metrics = [
      _MetricData(
        title: 'Total Revenue',
        value: _formatCurrency(summary.totalRevenue),
        growth: revGrowth,
        icon: Icons.currency_exchange_rounded,
        iconColor: const Color(0xFFF59E0B),
        iconBg: const Color(0xFFFEF3C7),
      ),
      _MetricData(
        title: 'Total Orders',
        value: _formatNumber(summary.totalOrders),
        growth: ordGrowth,
        icon: Icons.shopping_bag_outlined,
        iconColor: const Color(0xFFEF4444),
        iconBg: const Color(0xFFFEE2E2),
      ),
      _MetricData(
        title: 'Avg Order Value',
        value: _formatCurrency(summary.aov),
        growth: aovGrowth,
        icon: Icons.shopping_cart_outlined,
        iconColor: const Color(0xFF8B5CF6),
        iconBg: const Color(0xFFEDE9FE),
      ),
      _MetricData(
        title: 'Total Customers',
        value: _formatNumber(summary.newCustomers),
        growth: cusGrowth,
        icon: Icons.people_alt_outlined,
        iconColor: const Color(0xFF10B981),
        iconBg: const Color(0xFFD1FAE5),
      ),
      _MetricData(
        title: 'Repeat Customer Rate',
        value: '${repeatRate.toStringAsFixed(1)}%',
        growth: repGrowth,
        icon: Icons.sync_rounded,
        iconColor: const Color(0xFF3B82F6),
        iconBg: const Color(0xFFDBEAFE),
      ),
      _MetricData(
        title: 'Total Discounts',
        value: _formatCurrency(summary.totalDiscounts),
        growth: discGrowth,
        icon: Icons.local_offer_outlined,
        iconColor: const Color(0xFFF97316),
        iconBg: const Color(0xFFFFEDD5),
      ),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.16,
      ),
      itemCount: metrics.length,
      itemBuilder: (context, index) {
        final m = metrics[index];
        final isPositive = m.growth >= 0;
        final growthColor = isPositive ? const Color(0xFF10B981) : const Color(0xFFEF4444);

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
          clipBehavior: Clip.antiAlias,
          child: Stack(
            children: [
              // Bottom Right Half Circle (identical to Customers CRM stats card)
              Positioned(
                right: -20,
                bottom: -20,
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: m.iconColor.withOpacity(0.05),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
              Positioned(
                right: -8,
                bottom: -8,
                child: Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: m.iconColor.withOpacity(0.03),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: m.iconColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(m.icon, color: m.iconColor, size: 20),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3.5),
                          decoration: BoxDecoration(
                            color: growthColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                isPositive ? Icons.arrow_upward_rounded : Icons.arrow_downward_rounded,
                                size: 10,
                                color: growthColor,
                              ),
                              const SizedBox(width: 2),
                              Text(
                                '${m.growth.abs().toStringAsFixed(1)}%',
                                style: GoogleFonts.inter(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: growthColor,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          m.title.toUpperCase(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.inter(
                            color: Colors.grey.shade500,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 3),
                        FittedBox(
                          fit: BoxFit.scaleDown,
                          alignment: Alignment.centerLeft,
                          child: Text(
                            m.value,
                            style: GoogleFonts.outfit(
                              color: const Color(0xFF111827),
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
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
      },
    );
  }

  // ─────────────────────────────────────────────
  // REVENUE OVERVIEW (Line Chart)
  // ─────────────────────────────────────────────
  Widget _buildRevenueChart(List<DailyStat> stats) {
    if (stats.isEmpty) {
      return _buildCardWrapper(
        title: 'Revenue Overview',
        child: const Center(
          child: Padding(
            padding: EdgeInsets.symmetric(vertical: 30),
            child: Text('No revenue data for this timeframe', style: TextStyle(color: Colors.grey)),
          ),
        ),
      );
    }

    final double maxY = stats.fold(
            0.0, (prev, element) => element.revenue > prev ? element.revenue : prev) *
        1.2;

    List<FlSpot> spots = [];
    for (int i = 0; i < stats.length; i++) {
      spots.add(FlSpot(i.toDouble(), stats[i].revenue));
    }

    return _buildCardWrapper(
      title: 'Revenue Overview',
      subtitle: 'Daily earnings trend & fluctuations',
      child: SizedBox(
        height: 240,
        child: LineChart(
          LineChartData(
            gridData: FlGridData(
              show: true,
              drawVerticalLine: false,
              horizontalInterval: maxY == 0 ? 1 : (maxY / 4),
              getDrawingHorizontalLine: (value) => FlLine(
                color: const Color(0xFFF3F4F6),
                strokeWidth: 1,
                dashArray: [4, 4],
              ),
            ),
            titlesData: FlTitlesData(
              show: true,
              rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
              topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
              bottomTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  reservedSize: 28,
                  interval: (stats.length / 5).ceilToDouble() == 0
                      ? 1
                      : (stats.length / 5).ceilToDouble(),
                  getTitlesWidget: (value, meta) {
                    if (value < 0 || value >= stats.length || value != value.toInt()) {
                      return const SizedBox();
                    }
                    final stat = stats[value.toInt()];
                    DateTime? date = DateTime.tryParse(stat.date);
                    if (date == null) return const SizedBox();
                    return Padding(
                      padding: const EdgeInsets.only(top: 8.0),
                      child: Text(
                        DateFormat('MMM d').format(date),
                        style: GoogleFonts.inter(color: const Color(0xFF9CA3AF), fontSize: 10),
                      ),
                    );
                  },
                ),
              ),
              leftTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  reservedSize: 45,
                  getTitlesWidget: (value, meta) {
                    if (value == 0) return const SizedBox();
                    return Text(
                      _formatCompact(value),
                      style: GoogleFonts.inter(color: const Color(0xFF9CA3AF), fontSize: 10),
                    );
                  },
                ),
              ),
            ),
            borderData: FlBorderData(show: false),
            minX: 0,
            maxX: (stats.length - 1).toDouble() > 0 ? (stats.length - 1).toDouble() : 1,
            minY: 0,
            maxY: maxY == 0 ? 100 : maxY,
            lineTouchData: LineTouchData(
              touchTooltipData: LineTouchTooltipData(
                getTooltipColor: (_) => const Color(0xFF111827),
                tooltipRoundedRadius: 8,
                getTooltipItems: (touchedSpots) {
                  return touchedSpots.map((spot) {
                    final idx = spot.x.toInt();
                    String dateStr = '';
                    if (idx >= 0 && idx < stats.length) {
                      DateTime? date = DateTime.tryParse(stats[idx].date);
                      if (date != null) dateStr = DateFormat('MMM d, yyyy').format(date);
                    }
                    return LineTooltipItem(
                      '$dateStr\n',
                      GoogleFonts.inter(color: Colors.white70, fontSize: 10),
                      children: [
                        TextSpan(
                          text: _formatCurrency(spot.y),
                          style: GoogleFonts.outfit(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    );
                  }).toList();
                },
              ),
            ),
            lineBarsData: [
              LineChartBarData(
                spots: spots,
                isCurved: true,
                curveSmoothness: 0.35,
                color: const Color(0xFFB91C1C),
                barWidth: 3,
                isStrokeCapRound: true,
                dotData: FlDotData(show: stats.length <= 14),
                belowBarData: BarAreaData(
                  show: true,
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      const Color(0xFFB91C1C).withOpacity(0.25),
                      const Color(0xFFB91C1C).withOpacity(0.0),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────
  // SALES BY CHANNEL (Donut Chart)
  // ─────────────────────────────────────────────
  Widget _buildSalesByChannel(List<SalesByChannel> channels, double totalRevenue) {
    if (channels.isEmpty) {
      return _buildCardWrapper(
        title: 'Sales by Channel',
        child: const Center(
          child: Padding(
            padding: EdgeInsets.symmetric(vertical: 30),
            child: Text('No channel sales data', style: TextStyle(color: Colors.grey)),
          ),
        ),
      );
    }

    final colors = [
      const Color(0xFFB91C1C),
      const Color(0xFFF59E0B),
      const Color(0xFF10B981),
      const Color(0xFF3B82F6),
      const Color(0xFF8B5CF6),
      const Color(0xFF6B7280),
    ];

    final sortedChannels = List<SalesByChannel>.from(channels)
      ..sort((a, b) => b.revenue.compareTo(a.revenue));

    return _buildCardWrapper(
      title: 'Sales by Channel',
      subtitle: 'Breakdown of orders across order channels',
      child: Column(
        children: [
          SizedBox(
            height: 190,
            child: Stack(
              alignment: Alignment.center,
              children: [
                PieChart(
                  PieChartData(
                    sectionsSpace: 3,
                    centerSpaceRadius: 52,
                    sections: sortedChannels.asMap().entries.map((entry) {
                      final index = entry.key;
                      final item = entry.value;
                      final percentage =
                          totalRevenue > 0 ? (item.revenue / totalRevenue * 100) : 0;
                      return PieChartSectionData(
                        color: colors[index % colors.length],
                        value: item.revenue <= 0 ? 1 : item.revenue,
                        title: '${percentage.toStringAsFixed(0)}%',
                        radius: 26,
                        titleStyle: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      );
                    }).toList(),
                  ),
                ),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      _formatCompact(totalRevenue),
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF111827),
                      ),
                    ),
                    Text(
                      'Total Rev',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        color: const Color(0xFF6B7280),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Legend list
          Column(
            children: sortedChannels.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              String displayChannel = item.channel;
              if (displayChannel == 'dine_in') displayChannel = 'Dine In';
              if (displayChannel == 'delivery') displayChannel = 'Online Delivery';
              if (displayChannel == 'pickup') displayChannel = 'Takeaway';
              if (displayChannel == 'web') displayChannel = 'Website';
              if (displayChannel == 'app') displayChannel = 'Mobile App';

              final percentage =
                  totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toStringAsFixed(1) : '0';

              return Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Row(
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: colors[index % colors.length],
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        displayChannel,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: const Color(0xFF4B5563),
                        ),
                      ),
                    ),
                    Text(
                      _formatCurrency(item.revenue),
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '($percentage%)',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: const Color(0xFF9CA3AF),
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────
  // PAYMENT METHOD BREAKDOWN (Donut Chart)
  // ─────────────────────────────────────────────
  Widget _buildPaymentMethodBreakdown(
    List<PaymentMethodStat> paymentStats,
    double totalRevenue,
  ) {
    if (paymentStats.isEmpty) {
      return _buildCardWrapper(
        title: 'Payment Method Breakdown',
        child: const Center(
          child: Padding(
            padding: EdgeInsets.symmetric(vertical: 30),
            child: Text('No payment method data available', style: TextStyle(color: Colors.grey)),
          ),
        ),
      );
    }

    final colors = [
      const Color(0xFF3B82F6), // Blue for UPI / Online
      const Color(0xFF10B981), // Emerald for Cash
      const Color(0xFFF59E0B), // Amber for Wallets
      const Color(0xFF8B5CF6), // Purple
      const Color(0xFF6B7280),
    ];

    // Standardize naming
    Map<String, double> groupedMap = {};
    for (var p in paymentStats) {
      String name = 'Wallets/Other';
      final m = p.method.toLowerCase();
      if (m == 'upi' || m == 'credit_card' || m.contains('card') || m.contains('online')) {
        name = 'Online (UPI/Card)';
      } else if (m == 'cash') {
        name = 'Cash';
      }
      groupedMap[name] = (groupedMap[name] ?? 0.0) + p.revenue;
    }

    final entries = groupedMap.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return _buildCardWrapper(
      title: 'Payment Method Breakdown',
      subtitle: 'Customer payment distribution',
      child: Column(
        children: [
          SizedBox(
            height: 190,
            child: Stack(
              alignment: Alignment.center,
              children: [
                PieChart(
                  PieChartData(
                    sectionsSpace: 3,
                    centerSpaceRadius: 52,
                    sections: entries.asMap().entries.map((entry) {
                      final index = entry.key;
                      final item = entry.value;
                      final percentage =
                          totalRevenue > 0 ? (item.value / totalRevenue * 100) : 0;
                      return PieChartSectionData(
                        color: colors[index % colors.length],
                        value: item.value <= 0 ? 1 : item.value,
                        title: '${percentage.toStringAsFixed(0)}%',
                        radius: 26,
                        titleStyle: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      );
                    }).toList(),
                  ),
                ),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      _formatCompact(totalRevenue),
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF111827),
                      ),
                    ),
                    Text(
                      'Payments',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        color: const Color(0xFF6B7280),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Column(
            children: entries.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              final percentage =
                  totalRevenue > 0 ? ((item.value / totalRevenue) * 100).toStringAsFixed(1) : '0';

              return Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Row(
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: colors[index % colors.length],
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        item.key,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: const Color(0xFF4B5563),
                        ),
                      ),
                    ),
                    Text(
                      _formatCurrency(item.value),
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '($percentage%)',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: const Color(0xFF9CA3AF),
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────
  // WEEKLY REVENUE COMPARISON (Bar Chart)
  // ─────────────────────────────────────────────
  Widget _buildWeeklyRevenueComparison(List<DailyStat> stats) {
    if (stats.isEmpty) {
      return _buildCardWrapper(
        title: 'Weekly Revenue Comparison',
        child: const Center(
          child: Padding(
            padding: EdgeInsets.symmetric(vertical: 30),
            child: Text('No weekly revenue data available', style: TextStyle(color: Colors.grey)),
          ),
        ),
      );
    }

    // Takes last 35 days (5 weeks) like the website
    final thisMonthData = stats.length > 35 ? stats.sublist(stats.length - 35) : stats;

    List<double> weeklyTotals = [];
    for (int w = 0; w < 5; w++) {
      final startIndex = w * 7;
      if (startIndex < thisMonthData.length) {
        final endIndex = (startIndex + 7 <= thisMonthData.length)
            ? startIndex + 7
            : thisMonthData.length;
        final weekStats = thisMonthData.sublist(startIndex, endIndex);
        final sum = weekStats.fold(0.0, (prev, s) => prev + s.revenue);
        weeklyTotals.add(sum);
      } else {
        weeklyTotals.add(0.0);
      }
    }

    final maxVal = weeklyTotals.fold(0.0, (prev, val) => val > prev ? val : prev) * 1.25;

    return _buildCardWrapper(
      title: 'Weekly Revenue Comparison',
      subtitle: 'Revenue generated across recent weeks',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: const Color(0xFFB91C1C),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 6),
              Text(
                'This Month (by week)',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF6B7280),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 200,
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: maxVal == 0 ? 100 : maxVal,
                barTouchData: BarTouchData(
                  touchTooltipData: BarTouchTooltipData(
                    getTooltipColor: (_) => const Color(0xFF111827),
                    tooltipRoundedRadius: 8,
                    getTooltipItem: (group, groupIndex, rod, rodIndex) {
                      return BarTooltipItem(
                        'Week ${group.x + 1}\n',
                        GoogleFonts.inter(color: Colors.white70, fontSize: 10),
                        children: [
                          TextSpan(
                            text: _formatCurrency(rod.toY),
                            style: GoogleFonts.outfit(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ),
                titlesData: FlTitlesData(
                  show: true,
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 45,
                      getTitlesWidget: (value, meta) {
                        if (value == 0) return const SizedBox();
                        return Text(
                          _formatCompact(value),
                          style: GoogleFonts.inter(color: const Color(0xFF9CA3AF), fontSize: 10),
                        );
                      },
                    ),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 28,
                      getTitlesWidget: (value, meta) {
                        final idx = value.toInt();
                        if (idx >= 0 && idx < 5) {
                          return Padding(
                            padding: const EdgeInsets.only(top: 8.0),
                            child: Text(
                              'Week ${idx + 1}',
                              style: GoogleFonts.inter(
                                color: const Color(0xFF4B5563),
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          );
                        }
                        return const SizedBox();
                      },
                    ),
                  ),
                ),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (value) => FlLine(
                    color: const Color(0xFFF3F4F6),
                    strokeWidth: 1,
                    dashArray: [4, 4],
                  ),
                ),
                borderData: FlBorderData(show: false),
                barGroups: weeklyTotals.asMap().entries.map((entry) {
                  return BarChartGroupData(
                    x: entry.key,
                    barRods: [
                      BarChartRodData(
                        toY: entry.value,
                        color: const Color(0xFFB91C1C),
                        width: 22,
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                      ),
                    ],
                  );
                }).toList(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────
  // ORDERS BY TIME OF DAY (Heatmap Grid)
  // ─────────────────────────────────────────────
  Widget _buildHeatmapCard(List<TimeOfDayStat> heatmap) {
    final heatmapGrid = List.generate(7, (_) => List.filled(24, 0));
    for (final item in heatmap) {
      int dayIdx = item.dayOfWeek - 2;
      if (dayIdx < 0) dayIdx = 6; // Sunday is 6
      final hourIdx = item.hour;
      if (dayIdx >= 0 && dayIdx < 7 && hourIdx >= 0 && hourIdx < 24) {
        heatmapGrid[dayIdx][hourIdx] = item.orders;
      }
    }

    int maxOrders = 1;
    for (final row in heatmapGrid) {
      for (final count in row) {
        if (count > maxOrders) maxOrders = count;
      }
    }

    final daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    Color getHeatmapColor(int val) {
      if (val == 0) return const Color(0xFFFFF1F2);
      final intensity = val / maxOrders;
      if (intensity < 0.2) return const Color(0xFFFECACA);
      if (intensity < 0.4) return const Color(0xFFF87171);
      if (intensity < 0.6) return const Color(0xFFEF4444);
      if (intensity < 0.8) return const Color(0xFFDC2626);
      return const Color(0xFF991B1B);
    }

    return _buildCardWrapper(
      title: 'Orders by Time of Day',
      subtitle: 'Peak customer ordering hours heatmap',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_heatmapSelectionText != null)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFF111827),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.info_outline, size: 14, color: Colors.white70),
                  const SizedBox(width: 6),
                  Text(
                    _heatmapSelectionText!,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),

          // Scrollable Heatmap
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Day of week labels
                    Column(
                      children: daysOfWeek.map((d) {
                        return Container(
                          height: 18,
                          alignment: Alignment.centerLeft,
                          padding: const EdgeInsets.only(right: 8),
                          child: Text(
                            d,
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF9CA3AF),
                            ),
                          ),
                        );
                      }).toList(),
                    ),

                    // 7 Rows x 24 Columns Grid
                    Column(
                      children: List.generate(7, (dIdx) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 3.0),
                          child: Row(
                            children: List.generate(24, (hIdx) {
                              final orders = heatmapGrid[dIdx][hIdx];
                              final cellColor = getHeatmapColor(orders);
                              final hourLabel = hIdx == 0
                                  ? '12 AM'
                                  : hIdx < 12
                                      ? '$hIdx AM'
                                      : hIdx == 12
                                          ? '12 PM'
                                          : '${hIdx - 12} PM';

                              return GestureDetector(
                                onTap: () {
                                  setState(() {
                                    _heatmapSelectionText =
                                        '${daysOfWeek[dIdx]}, $hourLabel • $orders orders';
                                  });
                                },
                                child: Container(
                                  width: 14,
                                  height: 15,
                                  margin: const EdgeInsets.symmetric(horizontal: 1.5),
                                  decoration: BoxDecoration(
                                    color: cellColor,
                                    borderRadius: BorderRadius.circular(2.5),
                                  ),
                                ),
                              );
                            }),
                          ),
                        );
                      }),
                    ),
                  ],
                ),
                const SizedBox(height: 6),

                // Hour labels along the bottom
                Padding(
                  padding: const EdgeInsets.only(left: 36.0),
                  child: Row(
                    children: [
                      _buildHourTick('12A'),
                      const SizedBox(width: 48),
                      _buildHourTick('4A'),
                      const SizedBox(width: 48),
                      _buildHourTick('8A'),
                      const SizedBox(width: 48),
                      _buildHourTick('12P'),
                      const SizedBox(width: 48),
                      _buildHourTick('4P'),
                      const SizedBox(width: 48),
                      _buildHourTick('8P'),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Intensity Legend
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Low Orders',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: const Color(0xFF6B7280),
                ),
              ),
              Row(
                children: [
                  _buildLegendBlock(const Color(0xFFFFF1F2)),
                  _buildLegendBlock(const Color(0xFFFECACA)),
                  _buildLegendBlock(const Color(0xFFF87171)),
                  _buildLegendBlock(const Color(0xFFEF4444)),
                  _buildLegendBlock(const Color(0xFFDC2626)),
                  _buildLegendBlock(const Color(0xFF991B1B)),
                ],
              ),
              Text(
                'High Orders',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: const Color(0xFF6B7280),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHourTick(String text) {
    return Text(
      text,
      style: GoogleFonts.inter(
        fontSize: 10,
        fontWeight: FontWeight.w600,
        color: const Color(0xFF9CA3AF),
      ),
    );
  }

  Widget _buildLegendBlock(Color color) {
    return Container(
      width: 16,
      height: 8,
      margin: const EdgeInsets.symmetric(horizontal: 1),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(1.5),
      ),
    );
  }

  // ─────────────────────────────────────────────
  // TOP SELLING DISHES
  // ─────────────────────────────────────────────
  Widget _buildTopItems(List<TopItem> items) {
    if (items.isEmpty) {
      return _buildCardWrapper(
        title: 'Top Selling Dishes',
        child: const Center(
          child: Padding(
            padding: EdgeInsets.symmetric(vertical: 30),
            child: Text('No item sales data available', style: TextStyle(color: Colors.grey)),
          ),
        ),
      );
    }

    final top5 = items.take(5).toList();

    return _buildCardWrapper(
      title: 'Top Selling Dishes',
      subtitle: 'Most popular and highest revenue menu items',
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: top5.length,
        separatorBuilder: (context, index) => const Divider(height: 18, color: Color(0xFFF3F4F6)),
        itemBuilder: (context, index) {
          final item = top5[index];
          final badgeColor = index == 0
              ? const Color(0xFFF59E0B) // Gold for #1
              : index == 1
                  ? const Color(0xFF9CA3AF) // Silver for #2
                  : index == 2
                      ? const Color(0xFFD97706) // Bronze for #3
                      : const Color(0xFFB91C1C);

          return Row(
            children: [
              Container(
                width: 26,
                height: 26,
                decoration: BoxDecoration(
                  color: badgeColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                alignment: Alignment.center,
                child: Text(
                  '${index + 1}',
                  style: GoogleFonts.outfit(
                    color: badgeColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.restaurant_rounded, size: 18, color: Color(0xFF6B7280)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF111827),
                      ),
                    ),
                    Text(
                      '${item.quantitySold} orders sold',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: const Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                _formatCurrency(item.revenueGenerated),
                style: GoogleFonts.outfit(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF10B981),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  // ─────────────────────────────────────────────
  // KEY INSIGHTS
  // ─────────────────────────────────────────────
  Widget _buildKeyInsights(
    AnalyticsSummary summary,
    double repeatRate,
    List<TopItem> topItems,
  ) {
    final revGrowth = _calculateGrowth(summary.totalRevenue, summary.prevRevenue);
    final isRevUp = revGrowth >= 0;
    final topDish = topItems.isNotEmpty ? topItems.first.name : null;

    return _buildCardWrapper(
      title: 'Key Insights',
      subtitle: 'Automated executive highlights',
      child: Column(
        children: [
          _buildInsightRow(
            icon: isRevUp ? Icons.trending_up_rounded : Icons.trending_down_rounded,
            iconColor: isRevUp ? const Color(0xFF10B981) : const Color(0xFFEF4444),
            iconBg: isRevUp ? const Color(0xFFD1FAE5) : const Color(0xFFFEE2E2),
            title: 'Revenue is ${isRevUp ? 'up' : 'down'} by ${revGrowth.abs().toStringAsFixed(1)}%',
            subtitle: isRevUp
                ? 'Great job! Keep monitoring this positive sales velocity compared to last period.'
                : 'Revenue dropped slightly. Review discounts and menu promos to boost sales.',
          ),
          const SizedBox(height: 12),
          _buildInsightRow(
            icon: Icons.people_alt_rounded,
            iconColor: const Color(0xFFF97316),
            iconBg: const Color(0xFFFFEDD5),
            title: 'Customer Growth',
            subtitle: 'You acquired ${summary.newCustomers} active customers in this period.',
          ),
          if (topDish != null) ...[
            const SizedBox(height: 12),
            _buildInsightRow(
              icon: Icons.star_rounded,
              iconColor: const Color(0xFF8B5CF6),
              iconBg: const Color(0xFFEDE9FE),
              title: 'Top Performer: $topDish',
              subtitle: '$topDish is your top selling dish generating the highest order volume.',
            ),
          ],
          const SizedBox(height: 12),
          _buildInsightRow(
            icon: Icons.sync_rounded,
            iconColor: const Color(0xFF3B82F6),
            iconBg: const Color(0xFFDBEAFE),
            title: 'Repeat Customers: ${repeatRate.toStringAsFixed(1)}%',
            subtitle:
                '${repeatRate.toStringAsFixed(1)}% of your orders are placed by returning loyal diners.',
          ),
        ],
      ),
    );
  }

  Widget _buildInsightRow({
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String title,
    required String subtitle,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: iconBg,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: iconColor, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF111827),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: const Color(0xFF6B7280),
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────
  // REPORT SHORTCUTS
  // ─────────────────────────────────────────────
  Widget _buildReportShortcuts(BuildContext context, AnalyticsData data) {
    final provider = context.read<AnalyticsProvider>();
    final auth = context.read<AuthProvider>();
    final restaurantName = auth.user?['restaurantName'] ?? 'Lassi Lounge';
    final timeframeLabel = _getCurrentTimeframeLabel(provider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Report Shortcuts',
          style: GoogleFonts.outfit(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF111827),
          ),
        ),
        const SizedBox(height: 12),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          childAspectRatio: 2.5,
          children: [
            _buildShortcutButton(
              icon: Icons.calendar_month_rounded,
              title: 'Sales Summary',
              color: const Color(0xFF991B1B),
              bg: const Color(0xFFFFF1F2),
              border: const Color(0xFFFECACA),
              onTap: () => _exportAdvanceReport(
                data,
                ReportType.salesLedger,
                timeframeLabel,
                restaurantName: restaurantName,
              ),
            ),
            _buildShortcutButton(
              icon: Icons.shopping_bag_outlined,
              title: 'Order Report',
              color: const Color(0xFFC2410C),
              bg: const Color(0xFFFFEDD5),
              border: const Color(0xFFFED7AA),
              onTap: () => context.push('/all-orders'),
            ),
            _buildShortcutButton(
              icon: Icons.restaurant_menu_rounded,
              title: 'Menu Performance',
              color: const Color(0xFF15803D),
              bg: const Color(0xFFDCFCE7),
              border: const Color(0xFFBBF7D0),
              onTap: () => _exportAdvanceReport(
                data,
                ReportType.productPerformance,
                timeframeLabel,
                restaurantName: restaurantName,
              ),
            ),
            _buildShortcutButton(
              icon: Icons.people_outline_rounded,
              title: 'Customer CRM',
              color: const Color(0xFF7E22CE),
              bg: const Color(0xFFF3E8FF),
              border: const Color(0xFFE9D5FF),
              onTap: () => context.push('/crm'),
            ),
            _buildShortcutButton(
              icon: Icons.credit_card_rounded,
              title: 'Payment Report',
              color: const Color(0xFF0369A1),
              bg: const Color(0xFFE0F2FE),
              border: const Color(0xFFBAE6FD),
              onTap: () => _exportAdvanceReport(
                data,
                ReportType.paymentReconciliation,
                timeframeLabel,
                restaurantName: restaurantName,
              ),
            ),
            _buildShortcutButton(
              icon: Icons.download_rounded,
              title: 'Financial CSV',
              color: const Color(0xFFA16207),
              bg: const Color(0xFFFEF9C3),
              border: const Color(0xFFFEF08A),
              onTap: () => _exportAdvanceReport(
                data,
                ReportType.master,
                timeframeLabel,
                restaurantName: restaurantName,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildShortcutButton({
    required IconData icon,
    required String title,
    required Color color,
    required Color bg,
    required Color border,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: border),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────
  // REUSABLE CARD WRAPPER
  // ─────────────────────────────────────────────
  Widget _buildCardWrapper({
    required String title,
    String? subtitle,
    required Widget child,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF3F4F6)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.outfit(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF111827),
            ),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: GoogleFonts.inter(
                fontSize: 11,
                color: const Color(0xFF6B7280),
              ),
            ),
          ],
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }
}

class _MetricData {
  final String title;
  final String value;
  final double growth;
  final IconData icon;
  final Color iconColor;
  final Color iconBg;

  _MetricData({
    required this.title,
    required this.value,
    required this.growth,
    required this.icon,
    required this.iconColor,
    required this.iconBg,
  });
}
