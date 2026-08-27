class AnalyticsSummary {
  final double totalRevenue;
  final double prevRevenue;
  final int totalOrders;
  final int prevOrders;
  final double aov;
  final double prevAov;
  final int newCustomers;
  final int prevCustomers;
  final double totalDiscounts;
  final int cateringCount;
  final int prevCateringCount;
  final int reservationsCount;
  final int prevReservationsCount;

  AnalyticsSummary({
    required this.totalRevenue,
    required this.prevRevenue,
    required this.totalOrders,
    required this.prevOrders,
    required this.aov,
    required this.prevAov,
    required this.newCustomers,
    required this.prevCustomers,
    required this.totalDiscounts,
    required this.cateringCount,
    required this.prevCateringCount,
    required this.reservationsCount,
    required this.prevReservationsCount,
  });

  factory AnalyticsSummary.fromJson(Map<String, dynamic> json) {
    return AnalyticsSummary(
      totalRevenue: (json['totalRevenue'] ?? 0).toDouble(),
      prevRevenue: (json['prevRevenue'] ?? 0).toDouble(),
      totalOrders: json['totalOrders'] ?? 0,
      prevOrders: json['prevOrders'] ?? 0,
      aov: (json['aov'] ?? 0).toDouble(),
      prevAov: (json['prevAov'] ?? 0).toDouble(),
      newCustomers: json['newCustomers'] ?? 0,
      prevCustomers: json['prevCustomers'] ?? 0,
      totalDiscounts: (json['totalDiscounts'] ?? 0).toDouble(),
      cateringCount: json['cateringCount'] ?? 0,
      prevCateringCount: json['prevCateringCount'] ?? 0,
      reservationsCount: json['reservationsCount'] ?? 0,
      prevReservationsCount: json['prevReservationsCount'] ?? 0,
    );
  }
}

class DailyStat {
  final String date;
  final double revenue;
  final int orders;

  DailyStat({
    required this.date,
    required this.revenue,
    required this.orders,
  });

  factory DailyStat.fromJson(Map<String, dynamic> json) {
    return DailyStat(
      date: json['date'] ?? '',
      revenue: (json['revenue'] ?? 0).toDouble(),
      orders: json['orders'] ?? 0,
    );
  }
}

class SalesByChannel {
  final String channel;
  final int count;
  final double revenue;

  SalesByChannel({
    required this.channel,
    required this.count,
    required this.revenue,
  });

  factory SalesByChannel.fromJson(Map<String, dynamic> json) {
    return SalesByChannel(
      channel: json['_id'] ?? 'unknown',
      count: json['count'] ?? 0,
      revenue: (json['revenue'] ?? 0).toDouble(),
    );
  }
}

class TopItem {
  final String name;
  final int quantitySold;
  final double revenueGenerated;

  TopItem({
    required this.name,
    required this.quantitySold,
    required this.revenueGenerated,
  });

  factory TopItem.fromJson(Map<String, dynamic> json) {
    return TopItem(
      name: json['_id'] ?? 'Unknown Item',
      quantitySold: json['quantitySold'] ?? 0,
      revenueGenerated: (json['revenueGenerated'] ?? 0).toDouble(),
    );
  }
}

class TimeOfDayStat {
  final int dayOfWeek; // 1 (Sunday) to 7 (Saturday)
  final int hour;
  final int orders;

  TimeOfDayStat({
    required this.dayOfWeek,
    required this.hour,
    required this.orders,
  });

  factory TimeOfDayStat.fromJson(Map<String, dynamic> json) {
    final id = json['_id'] ?? {};
    return TimeOfDayStat(
      dayOfWeek: id['dayOfWeek'] ?? 1,
      hour: id['hour'] ?? 0,
      orders: json['orders'] ?? 0,
    );
  }
}

class AnalyticsData {
  final AnalyticsSummary summary;
  final List<DailyStat> dailyStats;
  final List<SalesByChannel> salesByChannel;
  final List<TopItem> topItems;
  final List<TimeOfDayStat> timeOfDayHeatmap;

  AnalyticsData({
    required this.summary,
    required this.dailyStats,
    required this.salesByChannel,
    required this.topItems,
    required this.timeOfDayHeatmap,
  });

  factory AnalyticsData.fromJson(Map<String, dynamic> json) {
    return AnalyticsData(
      summary: AnalyticsSummary.fromJson(json['summary'] ?? {}),
      dailyStats: (json['dailyStats'] as List<dynamic>?)
              ?.map((e) => DailyStat.fromJson(e))
              .toList() ??
          [],
      salesByChannel: (json['salesByChannel'] as List<dynamic>?)
              ?.map((e) => SalesByChannel.fromJson(e))
              .toList() ??
          [],
      topItems: (json['topItems'] as List<dynamic>?)
              ?.map((e) => TopItem.fromJson(e))
              .toList() ??
          [],
      timeOfDayHeatmap: (json['timeOfDayHeatmap'] as List<dynamic>?)
              ?.map((e) => TimeOfDayStat.fromJson(e))
              .toList() ??
          [],
    );
  }
}
