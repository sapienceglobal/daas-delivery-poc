import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../services/api_service.dart';
import '../../theme.dart';
import '../../widgets/glass_container.dart';

class MerchantAnalyticsScreen extends StatefulWidget {
  const MerchantAnalyticsScreen({super.key});

  @override
  State<MerchantAnalyticsScreen> createState() => _MerchantAnalyticsScreenState();
}

class _MerchantAnalyticsScreenState extends State<MerchantAnalyticsScreen> {
  bool _isLoading = true;
  String? _restaurantId;
  Map<String, dynamic>? _analyticsData;
  int _days = 30; // Default period

  // AI Forecast State
  bool _aiLoading = false;
  Map<String, dynamic>? _aiForecast;

  @override
  void initState() {
    super.initState();
    _fetchAnalytics();
  }

  Future<void> _fetchAnalytics() async {
    setState(() => _isLoading = true);
    try {
      final restRes = await ApiService.get('/api/restaurants/merchant/my');
      final restData = json.decode(restRes.body);
      if (restData['data'] != null) {
        _restaurantId = restData['data']['_id'];
        
        final analyticsRes = await ApiService.get('/api/analytics/restaurant/$_restaurantId?days=$_days');
        final aData = json.decode(analyticsRes.body);
        if (aData['success'] == true) {
          setState(() {
            _analyticsData = aData['data'];
          });
        }
      }
    } catch (e) {
      debugPrint('Error loading analytics: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _generateAiForecast() async {
    if (_restaurantId == null) return;
    setState(() => _aiLoading = true);
    try {
      final response = await ApiService.post('/api/ai/predict', {'restaurantId': _restaurantId});
      final resData = json.decode(response.body);
      if (resData['success'] == true) {
        setState(() {
          _aiForecast = resData['data'];
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('AI Forecast generated successfully!'), backgroundColor: BrandColors.green),
          );
        }
      } else {
        throw Exception(resData['message'] ?? 'Failed to forecast');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('AI Forecast failed: $e'), backgroundColor: BrandColors.red));
      }
    } finally {
      if (mounted) setState(() => _aiLoading = false);
    }
  }

  Widget _buildSummaryCard(String title, String value, IconData icon, Color color) {
    return Expanded(
      child: GlassContainer(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(title, style: const TextStyle(color: BrandColors.textMuted, fontSize: 13, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(value, style: const TextStyle(color: BrandColors.textMain, fontSize: 18, fontWeight: FontWeight.w900)),
          ],
        ),
      ),
    );
  }

  Widget _buildRevenueChart(List<dynamic>? dailyData) {
    if (dailyData == null || dailyData.isEmpty) {
      return const Center(child: Text('No revenue data available', style: TextStyle(color: BrandColors.textMuted)));
    }

    final List<FlSpot> spots = [];
    double maxRevenue = 100;
    for (int i = 0; i < dailyData.length; i++) {
      final rev = (dailyData[i]['revenue'] as num).toDouble();
      if (rev > maxRevenue) maxRevenue = rev;
      spots.add(FlSpot(i.toDouble(), rev));
    }

    return SizedBox(
      height: 200,
      child: LineChart(
        LineChartData(
          gridData: const FlGridData(show: false),
          titlesData: const FlTitlesData(
            leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
            topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
            bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          ),
          borderData: FlBorderData(show: false),
          minX: 0,
          maxX: (dailyData.length - 1).toDouble(),
          minY: 0,
          maxY: maxRevenue * 1.15,
          lineBarsData: [
            LineChartBarData(
              spots: spots,
              isCurved: true,
              color: BrandColors.cyan,
              barWidth: 4,
              isStrokeCapRound: true,
              dotData: const FlDotData(show: false),
              belowBarData: BarAreaData(
                show: true,
                color: BrandColors.cyan.withOpacity(0.15),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final summary = _analyticsData?['summary'];
    final dailyStats = _analyticsData?['dailyStats'] as List<dynamic>?;
    final topItems = _analyticsData?['topItems'] as List<dynamic>? ?? [];

    return Scaffold(
      backgroundColor: BrandColors.background,
      appBar: AppBar(
        title: const Text('Advanced Analytics'),
        backgroundColor: BrandColors.card,
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchAnalytics),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: BrandColors.cyan))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Period Selector Bar
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Period Trend', style: TextStyle(color: BrandColors.textMain, fontSize: 18, fontWeight: FontWeight.w900)),
                      Row(
                        children: [7, 30, 90].map((d) {
                          final isSelected = _days == d;
                          return Padding(
                            padding: const EdgeInsets.only(left: 6),
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: isSelected ? BrandColors.cyan : Colors.white10,
                                padding: const EdgeInsets.symmetric(horizontal: 12),
                                minimumSize: const Size(60, 32),
                              ),
                              onPressed: () {
                                setState(() {
                                  _days = d;
                                });
                                _fetchAnalytics();
                              },
                              child: Text('${d}d', style: TextStyle(color: isSelected ? BrandColors.background : BrandColors.textMain, fontSize: 12, fontWeight: FontWeight.bold)),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Summary cards
                  if (summary != null) ...[
                    Row(
                      children: [
                        _buildSummaryCard(
                          'Revenue', 
                          '\$${(summary['totalRevenue'] ?? 0.0).toStringAsFixed(2)}', 
                          Icons.attach_money, 
                          BrandColors.green
                        ),
                        const SizedBox(width: 12),
                        _buildSummaryCard(
                          'Orders', 
                          '${summary['totalOrders'] ?? 0}', 
                          Icons.shopping_bag_outlined, 
                          BrandColors.cyan
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _buildSummaryCard(
                          'Avg. Ticket (AOV)', 
                          '\$${(summary['aov'] ?? 0.0).toStringAsFixed(2)}', 
                          Icons.receipt_long_outlined, 
                          Colors.orange
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 24),
                  // Revenue Chart
                  const Text('Revenue Trend', style: TextStyle(color: BrandColors.textMain, fontSize: 18, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 12),
                  GlassContainer(
                    padding: const EdgeInsets.all(16),
                    child: _buildRevenueChart(dailyStats),
                  ),
                  const SizedBox(height: 24),
                  // Top Items Progress Bars
                  const Text('Top Selling Items', style: TextStyle(color: BrandColors.textMain, fontSize: 18, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 12),
                  GlassContainer(
                    padding: const EdgeInsets.all(16),
                    child: topItems.isEmpty
                        ? const Center(child: Text('No item sales logged in this period', style: TextStyle(color: BrandColors.textMuted)))
                        : Column(
                            children: topItems.map((item) {
                              final int sold = item['quantitySold'] ?? 0;
                              final double revenue = (item['revenueGenerated'] ?? 0.0).toDouble();
                              final int maxSold = topItems.first['quantitySold'] ?? 1;
                              final double progress = sold / maxSold;

                              return Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(item['_id'] ?? 'Unknown Item', style: const TextStyle(color: BrandColors.textMain, fontWeight: FontWeight.bold, fontSize: 14)),
                                        Text('$sold sold (\$${revenue.toStringAsFixed(2)})', style: const TextStyle(color: BrandColors.cyan, fontSize: 12, fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(4),
                                      child: LinearProgressIndicator(
                                        value: progress,
                                        backgroundColor: Colors.white10,
                                        color: BrandColors.cyan,
                                        minHeight: 8,
                                      ),
                                    )
                                  ],
                                ),
                              );
                            }).toList(),
                          ),
                  ),
                  const SizedBox(height: 24),
                  // AI Forecast Section
                  const Text('Predictive AI Forecast', style: TextStyle(color: BrandColors.textMain, fontSize: 18, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 12),
                  GlassContainer(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.auto_awesome, color: BrandColors.cyan),
                            SizedBox(width: 8),
                            Text('Demand Forecasting', style: TextStyle(color: BrandColors.textMain, fontWeight: FontWeight.bold, fontSize: 15)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Text('Generate a machine-learning based sales volume and order estimate for the next 7 days based on historical restaurant traffic.', style: TextStyle(color: BrandColors.textMuted, fontSize: 13)),
                        const SizedBox(height: 16),
                        if (_aiForecast == null)
                          SizedBox(
                            width: double.infinity,
                            height: 48,
                            child: ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(backgroundColor: BrandColors.cyan),
                              icon: const Icon(Icons.psychology, color: BrandColors.background),
                              label: _aiLoading
                                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: BrandColors.background))
                                  : const Text('Generate Forecast', style: TextStyle(color: BrandColors.background, fontWeight: FontWeight.bold)),
                              onPressed: _aiLoading ? null : _generateAiForecast,
                            ),
                          )
                        else ...[
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(color: BrandColors.cyan.withOpacity(0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: BrandColors.cyan.withOpacity(0.2))),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('AI Insight', style: TextStyle(color: BrandColors.cyan, fontWeight: FontWeight.bold, fontSize: 12)),
                                const SizedBox(height: 4),
                                Text(_aiForecast!['insight'] ?? '', style: const TextStyle(color: BrandColors.textMain, fontSize: 13, height: 1.4)),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                          const Text('7-Day Predictions', style: TextStyle(color: BrandColors.textMain, fontWeight: FontWeight.bold, fontSize: 13)),
                          const SizedBox(height: 8),
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: (_aiForecast!['predictions'] as List).map((p) {
                                return Container(
                                  margin: const EdgeInsets.only(right: 8),
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(color: Colors.white10, borderRadius: BorderRadius.circular(10)),
                                  child: Column(
                                    children: [
                                      Text('Day ${p['day']}', style: const TextStyle(color: BrandColors.textMuted, fontSize: 11, fontWeight: FontWeight.bold)),
                                      const SizedBox(height: 4),
                                      Text('\$${(p['predictedRevenue'] as num).toStringAsFixed(0)}', style: const TextStyle(color: BrandColors.textMain, fontWeight: FontWeight.bold, fontSize: 14)),
                                      Text('${p['predictedOrders']} ord', style: const TextStyle(color: BrandColors.textMuted, fontSize: 10)),
                                    ],
                                  ),
                                );
                              }).toList(),
                            ),
                          )
                        ]
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
