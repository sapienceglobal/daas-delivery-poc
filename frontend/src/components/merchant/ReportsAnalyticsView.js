import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { 
  Calendar, Download, TrendingUp, TrendingDown, DollarSign, ShoppingBag, 
  ShoppingCart, Users, RefreshCw, ChefHat, CreditCard, Sparkles 
} from 'lucide-react';
import StatCard from './StatCard';
import { formatCurrency, formatDate } from '@/lib/formatters';
import PremiumDatePicker from '@/components/ui/PremiumDatePicker';

export default function ReportsAnalyticsView({ 
  analyticsData, 
  restaurant, 
  startDate, 
  endDate, 
  activePreset = 'all',
  onSelectPreset,
  onDateRangeChange 
}) {
  const router = useRouter();
  const [hoveredSlot, setHoveredSlot] = useState(null);

  if (!analyticsData) {
    return (
      <div className="h-64 flex items-center justify-center bg-admin-card rounded-2xl border border-admin-border">
        <p className="text-admin-text-muted text-sm font-semibold">Loading analytics data...</p>
      </div>
    );
  }

  const { summary, dailyStats, salesByChannel, paymentMethodBreakdown, timeOfDayHeatmap, topItems } = analyticsData;

  const handleExport = () => {
    if (!dailyStats) return;
    
    const headers = ['Date', 'Revenue ($)', 'Orders'];
    const rows = dailyStats.map(d => [d.date, d.revenue, d.orders]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // formatted display date range (no longer defaults to 30 days, we use All Time)
  const calculatedDateRange = useMemo(() => {
    if (startDate && endDate) {
      if (startDate.toDateString?.() === endDate.toDateString?.()) {
        return formatDate(startDate, restaurant?.dateFormat, restaurant?.timezone);
      }
      return `${formatDate(startDate, restaurant?.dateFormat, restaurant?.timezone)} - ${formatDate(endDate, restaurant?.dateFormat, restaurant?.timezone)}`;
    }
    if (startDate) {
      return formatDate(startDate, restaurant?.dateFormat, restaurant?.timezone);
    }
    return "All Time";
  }, [restaurant, startDate, endDate]);

  // formatting helpers
  const renderCurrency = (val) => formatCurrency(val, restaurant?.currency);
  const formatNumber = (val) => (val || 0).toLocaleString('en-US');
  const calculateGrowth = (current, prev) => {
    if (!prev || prev === 0) return current > 0 ? 100 : 0;
    return (((current - prev) / prev) * 100).toFixed(1);
  };

  // 1. Top Metrics
  const revGrowth = calculateGrowth(summary?.totalRevenue, summary?.prevRevenue);
  const ordGrowth = calculateGrowth(summary?.totalOrders, summary?.prevOrders);
  const aovGrowth = calculateGrowth(summary?.aov, summary?.prevAov);
  const cusGrowth = calculateGrowth(summary?.newCustomers, summary?.prevCustomers);
  
  const repeatRate = summary?.totalOrders > 0 ? Math.max(0, ((summary.totalOrders - summary.newCustomers) / summary.totalOrders) * 100).toFixed(1) : 0;
  const prevRepeatRate = summary?.prevOrders > 0 ? Math.max(0, ((summary.prevOrders - summary.prevCustomers) / summary.prevOrders) * 100).toFixed(1) : 0;
  const repGrowth = calculateGrowth(repeatRate, prevRepeatRate);

  const discountsGrowth = calculateGrowth(summary?.totalDiscounts, summary?.prevTotalDiscounts || 0);

  const metrics = [
    { label: 'Total Revenue', value: renderCurrency(summary?.totalRevenue), growth: revGrowth, icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Total Orders', value: formatNumber(summary?.totalOrders), growth: ordGrowth, icon: ShoppingBag, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'Average Order Value', value: renderCurrency(summary?.aov), growth: aovGrowth, icon: ShoppingCart, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Total Customers', value: formatNumber(summary?.newCustomers), growth: cusGrowth, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Repeat Customer Rate', value: `${repeatRate}%`, growth: repGrowth, icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Total Discounts', value: renderCurrency(summary?.totalDiscounts), growth: discountsGrowth, icon: TrendingDown, color: 'text-orange-500', bg: 'bg-orange-500/10' }
  ];

  // 2. Format Charts Data
  const revenueChartData = (dailyStats || []).map(day => {
    const d = new Date(day.date + 'T00:00:00');
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    const shortDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { 
      name: (dailyStats || []).length > 7 ? shortDate : dayName, 
      fullName: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      Revenue: day.revenue || 0, 
      Orders: day.orders || 0 
    };
  });

  // donut Charts
  const COLORS = ['#cd131b', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#6b7280'];
  
  const formattedSalesByChannel = (salesByChannel || []).map((c, i) => ({
    name: c._id === 'dine_in' ? 'Dine In' : c._id === 'delivery' ? 'Online Delivery' : c._id === 'pickup' ? 'Takeaway' : 'Others',
    value: c.revenue,
    percent: summary?.totalRevenue > 0 ? ((c.revenue / summary.totalRevenue) * 100).toFixed(1) : 0,
    color: COLORS[i % COLORS.length]
  })).sort((a, b) => b.value - a.value);

  const formattedPaymentBreakdown = (paymentMethodBreakdown || []).map((p, i) => ({
    name: p._id === 'upi' ? 'Online (UPI/Card)' : p._id === 'credit_card' ? 'Online (UPI/Card)' : p._id === 'cash' ? 'Cash' : 'Wallets/Other',
    value: p.revenue,
    percent: summary?.totalRevenue > 0 ? ((p.revenue / summary.totalRevenue) * 100).toFixed(1) : 0,
    color: COLORS[i % COLORS.length]
  })).sort((a, b) => b.value - a.value);

  // Revenue Comparison
  const thisMonthData = (dailyStats || []).slice(-35); // last 35 days = 5 weeks
  
  const strictComparisonData = Array.from({ length: 5 }).map((_, weekIdx) => {
    const weekStats = thisMonthData.slice(weekIdx * 7, (weekIdx + 1) * 7);
    const rev = weekStats.reduce((sum, d) => sum + d.revenue, 0);
    return { name: `Week ${weekIdx + 1}`, 'This Month': rev };
  });

  // Heatmap Data (Orders by Time of Day)
  const heatmapGrid = Array.from({ length: 7 }, () => Array(24).fill(0));
  const heatmapRevenueGrid = Array.from({ length: 7 }, () => Array(24).fill(0));
  (timeOfDayHeatmap || []).forEach(item => {
    let dayIdx = item._id.dayOfWeek - 2; 
    if (dayIdx < 0) dayIdx = 6;
    const hourIdx = item._id.hour;
    if (dayIdx >= 0 && dayIdx <= 6 && hourIdx >= 0 && hourIdx <= 23) {
      heatmapGrid[dayIdx][hourIdx] = item.orders;
      if (item.revenue) heatmapRevenueGrid[dayIdx][hourIdx] = item.revenue;
    }
  });

  const maxHeatmapVal = Math.max(1, ...heatmapGrid.flat());
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const getHeatmapColor = (val) => {
    if (val === 0) return 'bg-brand/5 dark:bg-brand/10';
    const intensity = val / maxHeatmapVal;
    if (intensity < 0.2) return 'bg-red-200 dark:bg-red-900/40';
    if (intensity < 0.4) return 'bg-red-400 dark:bg-red-800/60';
    if (intensity < 0.6) return 'bg-red-500 dark:bg-red-700';
    if (intensity < 0.8) return 'bg-red-600 dark:bg-red-600';
    return 'bg-red-700 dark:bg-red-500';
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      
      {/* ── HEADER ROW WITH CONTROLS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-admin-text tracking-tight">
              Reports & Analytics
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand/10 border border-brand/20 text-brand">
              <Sparkles className="w-3 h-3" /> Live Insights
            </span>
          </div>
          <p className="text-xs sm:text-sm text-admin-text-secondary mt-1">
            Detailed performance analytics, sales trends, and business intelligence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Quick Preset Pills */}
          <div className="hidden sm:flex items-center bg-admin-surface border border-admin-border rounded-xl p-1 gap-1">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7d', label: '7D' },
              { id: '30d', label: '30D' },
              { id: 'this_month', label: 'This Month' },
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPreset?.(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePreset === p.id 
                    ? 'bg-brand text-white shadow-xs' 
                    : 'text-admin-text-secondary hover:text-admin-text hover:bg-admin-surface-light'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range Picker Button */}
          <div className="min-w-[240px] sm:min-w-[270px] w-auto relative z-50">
            <PremiumDatePicker 
              selectsRange={true}
              selected={startDate}
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => {
                if (onDateRangeChange) onDateRangeChange(update);
              }}
              isClearable={true}
              showIcon={true}
              placeholderText="Pick Date or Range"
              className={`w-full text-xs sm:text-sm font-semibold rounded-xl pl-10 pr-9 sm:pr-10 py-2 sm:py-2.5 border transition-all cursor-pointer shadow-2xs ${
                activePreset === 'custom' || startDate
                  ? 'border-brand text-admin-text bg-brand/5 ring-1 ring-brand/20'
                  : 'border-admin-border text-admin-text bg-admin-surface hover:bg-admin-surface-light hover:border-brand/40'
              }`}
            />
          </div>

          {/* Export Report Button */}
          <button 
            type="button"
            onClick={handleExport} 
            className="flex items-center gap-2 bg-admin-surface hover:bg-admin-surface-light border border-admin-border rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-admin-text transition-all shadow-2xs cursor-pointer hover:border-brand/40"
          >
            <Download className="w-4 h-4 text-admin-text-muted" /> 
            <span className="hidden sm:inline">Export</span> Report
          </button>
        </div>
      </div>

      {/* ── TOP METRICS ROW ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
        {metrics.map((m, i) => (
          <StatCard 
            key={i}
            title={m.label}
            value={m.value}
            icon={m.icon}
            iconColor={m.color}
            iconBg={m.bg}
            trend={{
              direction: Number(m.growth) >= 0 ? 'up' : 'down',
              value: `${Math.abs(Number(m.growth))}%`,
              subtitle: 'vs last period'
            }}
          />
        ))}
      </div>

      {/* ── ROW 2: REVENUE LINE CHART, CHANNEL DONUT & HEATMAP ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        
        {/* Revenue Overview */}
        <div className="bg-admin-card rounded-2xl border border-admin-border p-5 sm:p-6 shadow-xs lg:col-span-1 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-admin-text">Revenue Overview</h3>
          </div>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueChartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-admin-border opacity-40" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-admin-text-muted, #94a3b8)' }} dy={10} minTickGap={30} interval="preserveStartEnd" />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-admin-text-muted, #94a3b8)' }} tickFormatter={(v) => `${v/1000}K`} />
                <RechartsTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0]?.payload;
                      const val = payload[0]?.value || 0;
                      return (
                        <div className="bg-admin-card border border-admin-border rounded-xl shadow-xl p-3 z-50 text-admin-text">
                          <p className="text-xs font-bold text-admin-text-muted mb-1">{item?.fullName || item?.name}</p>
                          <p className="text-sm font-extrabold text-brand">Revenue: {renderCurrency(val)}</p>
                          <p className="text-xs font-semibold text-admin-text-secondary mt-0.5">Orders: {item?.Orders || 0}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line yAxisId="left" type="monotone" dataKey="Revenue" stroke="var(--color-brand, #cd131b)" strokeWidth={3} dot={revenueChartData.length > 31 ? false : { r: 4, fill: 'var(--color-brand, #cd131b)', strokeWidth: 2, stroke: 'var(--color-admin-card, #ffffff)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Channel */}
        <div className="bg-admin-card rounded-2xl border border-admin-border p-5 sm:p-6 shadow-xs flex flex-col">
          <h3 className="text-sm font-bold text-admin-text mb-6">Sales by Channel</h3>
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[200px]">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={formattedSalesByChannel} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                  {formattedSalesByChannel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value) => renderCurrency(value)} 
                  contentStyle={{ backgroundColor: 'var(--color-admin-card, #1e1e35)', borderColor: 'var(--color-admin-border, #e5e7eb)', borderRadius: '0.75rem', color: 'var(--color-admin-text, #fff)' }}
                  wrapperStyle={{ zIndex: 100 }} 
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2 z-0">
              <span className="text-lg font-black text-admin-text">{renderCurrency(summary?.totalRevenue)}</span>
              <span className="text-xs text-admin-text-muted font-semibold uppercase tracking-wider">Total Revenue</span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {formattedSalesByChannel.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-semibold text-admin-text-secondary">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-admin-text">{renderCurrency(item.value)}</span>
                  <span className="text-admin-text-muted">({item.percent}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orders by Time of Day Heatmap */}
        <div className="bg-admin-card rounded-2xl border border-admin-border p-5 sm:p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-admin-text">Orders by Time of Day</h3>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="flex-1 grid grid-cols-[25px_1fr] gap-2">
              <div className="flex flex-col justify-between text-xs font-semibold text-admin-text-muted py-1">
                {daysOfWeek.map(d => <span key={d}>{d}</span>)}
              </div>
              <div className="grid grid-rows-7 gap-[2px]">
                {heatmapGrid.map((dayRow, dIdx) => (
                  <div key={dIdx} className="grid grid-cols-24 gap-[2px]">
                    {dayRow.map((val, hIdx) => (
                      <div 
                        key={`${dIdx}-${hIdx}`} 
                        className={`rounded-[2px] transition-transform hover:scale-125 cursor-pointer ${getHeatmapColor(val)}`}
                        onMouseEnter={() => setHoveredSlot({ day: daysOfWeek[dIdx], hour: hIdx, orders: val, revenue: heatmapRevenueGrid[dIdx][hIdx] })}
                        onMouseLeave={() => setHoveredSlot(null)}
                        title={`${daysOfWeek[dIdx]} ${hIdx}:00 - ${val} orders`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between pl-[33px] mt-2 text-xs font-semibold text-admin-text-muted">
              <span>12 AM</span><span>4 AM</span><span>8 AM</span><span>12 PM</span><span>4 PM</span><span>8 PM</span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-4 pt-3 border-t border-admin-border">
              <div className="flex items-center gap-[2px] h-2 w-28 shrink-0">
                <span className="text-[10px] text-admin-text-muted mr-1">Low</span>
                <div className="flex-1 h-full bg-brand/5 rounded-l-sm"/>
                <div className="flex-1 h-full bg-red-200 dark:bg-red-900/40"/>
                <div className="flex-1 h-full bg-red-400 dark:bg-red-800/60"/>
                <div className="flex-1 h-full bg-red-500 dark:bg-red-700"/>
                <div className="flex-1 h-full bg-red-600 dark:bg-red-600"/>
                <div className="flex-1 h-full bg-red-700 dark:bg-red-500 rounded-r-sm"/>
                <span className="text-[10px] text-admin-text-muted ml-1">High</span>
              </div>
              <div className="text-xs font-bold text-admin-text sm:text-right w-full sm:w-auto">
                {hoveredSlot ? (
                  <span>{hoveredSlot.day} at {hoveredSlot.hour === 0 ? '12:00 AM' : hoveredSlot.hour === 12 ? '12:00 PM' : hoveredSlot.hour > 12 ? `${hoveredSlot.hour - 12}:00 PM` : `${hoveredSlot.hour}:00 AM`} ({hoveredSlot.orders} {hoveredSlot.orders === 1 ? 'order' : 'orders'} {hoveredSlot.revenue ? `• ${renderCurrency(hoveredSlot.revenue)}` : ''})</span>
                ) : (
                  <span className="text-admin-text-muted font-medium text-[11px]">Hover over slot to view details</span>
                )}
              </div>
            </div>
          </div>
        </div>
        
      </div>

      {/* ── ROW 3: DISHES, PAYMENTS, REVENUE COMPARISON & INSIGHTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 sm:gap-6">
        
        {/* Top Selling Dishes */}
        <div className="bg-admin-card rounded-2xl border border-admin-border p-5 sm:p-6 shadow-xs lg:col-span-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-admin-text">Top Selling Dishes</h3>
          </div>
          <div className="flex-1 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-admin-border">
                  <th className="pb-3 text-xs font-bold text-admin-text-muted uppercase tracking-wider w-8">#</th>
                  <th className="pb-3 text-xs font-bold text-admin-text-muted uppercase tracking-wider">Dish</th>
                  <th className="pb-3 text-xs font-bold text-admin-text-muted uppercase tracking-wider text-right">Orders</th>
                  <th className="pb-3 text-xs font-bold text-admin-text-muted uppercase tracking-wider text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {(topItems || []).slice(0, 5).map((item, idx) => (
                  <tr key={idx} className="border-b border-admin-border/50 last:border-0 hover:bg-admin-surface-light/50 transition-colors">
                    <td className="py-3 text-xs font-bold text-admin-text-muted">{idx + 1}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-admin-surface border border-admin-border/50 flex items-center justify-center shrink-0 overflow-hidden">
                          <ChefHat className="w-3 h-3 text-admin-text-muted" />
                        </div>
                        <span className="text-xs font-bold text-admin-text truncate max-w-[100px]">{item._id}</span>
                      </div>
                    </td>
                    <td className="py-3 text-xs font-semibold text-admin-text-secondary text-right">{item.quantitySold}</td>
                    <td className="py-3 text-xs font-bold text-admin-text text-right">{renderCurrency(item.revenueGenerated)}</td>
                  </tr>
                ))}
                {(!topItems || topItems.length === 0) && (
                  <tr><td colSpan="4" className="py-8 text-center text-sm text-admin-text-muted">No dish data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="bg-admin-card rounded-2xl border border-admin-border p-5 sm:p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-admin-text">Payment Method Breakdown</h3>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[160px]">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={formattedPaymentBreakdown} innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                  {formattedPaymentBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value) => renderCurrency(value)} 
                  contentStyle={{ backgroundColor: 'var(--color-admin-card, #1e1e35)', borderColor: 'var(--color-admin-border, #e5e7eb)', borderRadius: '0.75rem', color: 'var(--color-admin-text, #fff)' }}
                  wrapperStyle={{ zIndex: 100 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2 z-0">
              <span className="text-sm font-black text-admin-text">{renderCurrency(summary?.totalRevenue)}</span>
              <span className="text-xs text-admin-text-muted font-semibold uppercase tracking-wider">Total</span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {formattedPaymentBreakdown.map((item, idx) => (
              <div key={idx} className="flex items-start justify-between text-xs">
                <div className="flex items-start gap-2">
                  <div className="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: item.color }} />
                  <div>
                    <div className="font-semibold text-admin-text-secondary">{item.name}</div>
                    <div className="font-bold text-admin-text">{renderCurrency(item.value)} <span className="text-admin-text-muted font-normal">({item.percent}%)</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Revenue Comparison */}
        <div className="bg-admin-card rounded-2xl border border-admin-border p-5 sm:p-6 shadow-xs lg:col-span-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-admin-text">Weekly Revenue Comparison</h3>
          </div>
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-admin-text-secondary"><div className="w-2.5 h-2.5 bg-brand rounded-sm" /> This Month</div>
          </div>
          <div className="flex-1 min-h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strictComparisonData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-admin-border opacity-40" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-admin-text-muted, #94a3b8)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-admin-text-muted, #94a3b8)' }} tickFormatter={(v) => `${v/1000}K`} />
                <RechartsTooltip 
                  cursor={{ fill: 'var(--color-admin-surface-light, rgba(255,255,255,0.05))' }} 
                  contentStyle={{ backgroundColor: 'var(--color-admin-card, #1e1e35)', borderColor: 'var(--color-admin-border, #e5e7eb)', borderRadius: '0.75rem', color: 'var(--color-admin-text, #fff)' }}
                  formatter={(val) => `$${val}`} 
                />
                <Bar dataKey="This Month" fill="var(--color-brand, #cd131b)" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Insights */}
        <div className="bg-admin-card rounded-2xl border border-admin-border p-5 sm:p-6 shadow-xs lg:col-span-1 flex flex-col">
          <h3 className="text-sm font-bold text-admin-text mb-4">Key Insights</h3>
          <div className="space-y-4 flex-1">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <div className="text-xs font-bold text-admin-text">Revenue is {Number(revGrowth) >= 0 ? 'up' : 'down'} by {Math.abs(revGrowth)}%</div>
                <div className="text-xs text-admin-text-secondary mt-0.5 leading-tight">Keep monitoring this trend closely compared to the last period.</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <div className="text-xs font-bold text-admin-text">Customer Growth</div>
                <div className="text-xs text-admin-text-secondary mt-0.5 leading-tight">You acquired {summary?.newCustomers} active customers this period.</div>
              </div>
            </div>

            {topItems && topItems.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <ChefHat className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <div className="text-xs font-bold text-admin-text">Top Performer</div>
                  <div className="text-xs text-admin-text-secondary mt-0.5 leading-tight">{topItems[0]._id} is your top selling dish this period.</div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <div className="text-xs font-bold text-admin-text">Repeat Customers</div>
                <div className="text-xs text-admin-text-secondary mt-0.5 leading-tight">{repeatRate}% of your orders are from returning customers.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── REPORT SHORTCUTS ── */}
      <div className="pt-2">
        <h3 className="text-sm font-bold text-admin-text mb-3">Report Shortcuts</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 justify-center bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl py-2.5 px-3 text-xs font-bold hover:bg-red-500/15 transition-all shadow-2xs cursor-pointer">
            <Calendar className="w-3.5 h-3.5" /> Sales Summary
          </button>
          <button onClick={() => router.push('/merchant/all-orders')} className="flex items-center gap-2 justify-center bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl py-2.5 px-3 text-xs font-bold hover:bg-orange-500/15 transition-all shadow-2xs cursor-pointer">
            <ShoppingBag className="w-3.5 h-3.5" /> Order Report
          </button>
          <button onClick={() => router.push('/merchant/menu')} className="flex items-center gap-2 justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl py-2.5 px-3 text-xs font-bold hover:bg-emerald-500/15 transition-all shadow-2xs cursor-pointer">
            <ChefHat className="w-3.5 h-3.5" /> Menu Performance
          </button>
          <button onClick={() => router.push('/merchant/crm')} className="flex items-center gap-2 justify-center bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl py-2.5 px-3 text-xs font-bold hover:bg-purple-500/15 transition-all shadow-2xs cursor-pointer">
            <Users className="w-3.5 h-3.5" /> Customer Report
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 justify-center bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 rounded-xl py-2.5 px-3 text-xs font-bold hover:bg-sky-500/15 transition-all shadow-2xs cursor-pointer">
            <CreditCard className="w-3.5 h-3.5" /> Payment Report
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 justify-center bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl py-2.5 px-3 text-xs font-bold hover:bg-amber-500/15 transition-all shadow-2xs cursor-pointer">
            <Download className="w-3.5 h-3.5" /> Export Financial
          </button>
        </div>
      </div>

    </div>
  );
}
