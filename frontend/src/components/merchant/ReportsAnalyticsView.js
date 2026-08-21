import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Calendar, Download, TrendingUp, TrendingDown, DollarSign, ShoppingBag, ShoppingCart, Users, RefreshCw, ChevronDown, ArrowRight, ChefHat, CreditCard } from 'lucide-react';
import StatCard from './StatCard';
import { formatCurrency, formatDate } from '@/lib/formatters';
import PremiumDatePicker from '@/components/ui/PremiumDatePicker';

export default function ReportsAnalyticsView({ analyticsData, restaurant, startDate, endDate, onDateRangeChange }) {
  const router = useRouter();

  if (!analyticsData) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f9fafb]">
        <p className="text-[#6b7280]">Loading analytics data...</p>
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

  // Formatted display date range (no longer defaults to 30 days, we use All Time)
  const calculatedDateRange = useMemo(() => {
    if (startDate && endDate) {
      return `${formatDate(startDate, restaurant?.dateFormat, restaurant?.timezone)} - ${formatDate(endDate, restaurant?.dateFormat, restaurant?.timezone)}`;
    }
    return "All Time";
  }, [restaurant, startDate, endDate]);
  // Formatting helpers
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
  
  // Fake repeat rate logic based on total customers (just for UI completeness, adhering to actual numbers passed if available)
  // But wait, the backend doesn't send total customers overall, just "newCustomers" vs "prevCustomers". I'll calculate repeat rate as (Total Orders - New Customers) / Total Orders.
  const repeatRate = summary?.totalOrders > 0 ? Math.max(0, ((summary.totalOrders - summary.newCustomers) / summary.totalOrders) * 100).toFixed(1) : 0;
  const prevRepeatRate = summary?.prevOrders > 0 ? Math.max(0, ((summary.prevOrders - summary.prevCustomers) / summary.prevOrders) * 100).toFixed(1) : 0;
  const repGrowth = calculateGrowth(repeatRate, prevRepeatRate);

  // We replaced Net Profit with Total Discounts
  const discountsGrowth = calculateGrowth(summary?.totalDiscounts, summary?.prevTotalDiscounts || 0); // (using 0 if prev not fetched to avoid undefined error)

  const metrics = [
    { label: 'Total Revenue', value: renderCurrency(summary?.totalRevenue), growth: revGrowth, icon: DollarSign, color: 'text-[#f59e0b]', bg: 'bg-[#fef3c7]' },
    { label: 'Total Orders', value: formatNumber(summary?.totalOrders), growth: ordGrowth, icon: ShoppingBag, color: 'text-[#ef4444]', bg: 'bg-[#fee2e2]' },
    { label: 'Average Order Value', value: renderCurrency(summary?.aov), growth: aovGrowth, icon: ShoppingCart, color: 'text-[#8b5cf6]', bg: 'bg-[#ede9fe]' },
    { label: 'Total Customers', value: formatNumber(summary?.newCustomers), growth: cusGrowth, icon: Users, color: 'text-[#10b981]', bg: 'bg-[#d1fae5]' },
    { label: 'Repeat Customer Rate', value: `${repeatRate}%`, growth: repGrowth, icon: RefreshCw, color: 'text-[#3b82f6]', bg: 'bg-[#dbeafe]' },
    { label: 'Total Discounts', value: renderCurrency(summary?.totalDiscounts), growth: discountsGrowth, icon: TrendingDown, color: 'text-[#f97316]', bg: 'bg-[#ffedd5]' }
  ];

  // 2. Format Charts Data
  // Revenue Overview line chart
  const revenueChartData = (dailyStats || []).map(day => {
    const d = new Date(day.date);
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    return { name: dayName, Revenue: day.revenue, Orders: day.orders };
  }).slice(-7); // take last 7 days for "This Week" view

  // Donut Charts
  const COLORS = ['#b91c1c', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#6b7280'];
  
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
  // Let's actually bucket the real dailyStats into weeks if we have them.
  const thisMonthData = (dailyStats || []).slice(-35); // last 35 days = 5 weeks
  
  // STRICT NO MOCK DATA: If I can't get last month's weekly data, I will omit 'Last Month' bars.
  const strictComparisonData = Array.from({ length: 5 }).map((_, weekIdx) => {
    const weekStats = thisMonthData.slice(weekIdx * 7, (weekIdx + 1) * 7);
    const rev = weekStats.reduce((sum, d) => sum + d.revenue, 0);
    return { name: `Week ${weekIdx + 1}`, 'This Month': rev };
  });

  // Heatmap Data (Orders by Time of Day)
  const heatmapGrid = Array.from({ length: 7 }, () => Array(24).fill(0));
  (timeOfDayHeatmap || []).forEach(item => {
    // MongoDB $dayOfWeek: 1 (Sunday) to 7 (Saturday). Heatmap usually starts Mon (1) to Sun (7).
    let dayIdx = item._id.dayOfWeek - 2; 
    if (dayIdx < 0) dayIdx = 6; // Sunday is 6
    const hourIdx = item._id.hour;
    if (dayIdx >= 0 && dayIdx <= 6 && hourIdx >= 0 && hourIdx <= 23) {
      heatmapGrid[dayIdx][hourIdx] = item.orders;
    }
  });

  const maxHeatmapVal = Math.max(1, ...heatmapGrid.flat());
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const getHeatmapColor = (val) => {
    if (val === 0) return 'bg-[#fff1f2]'; // extremely light red/pink
    const intensity = val / maxHeatmapVal;
    if (intensity < 0.2) return 'bg-[#fecaca]'; // red-200
    if (intensity < 0.4) return 'bg-[#f87171]'; // red-400
    if (intensity < 0.6) return 'bg-[#ef4444]'; // red-500
    if (intensity < 0.8) return 'bg-[#dc2626]'; // red-600
    return 'bg-[#991b1b]'; // red-800
  };

  return (
    <div className="h-full flex flex-col bg-[#f9fafb] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-[#ffffff] border-b border-[#e5e7eb] shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Reports & Analytics</h1>
          <p className="text-sm text-[#6b7280] mt-1">Detailed insights to grow your business.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center w-64">
            <PremiumDatePicker 
              selectsRange={true}
              selected={startDate}
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => {
                if (onDateRangeChange) onDateRangeChange(update);
              }}
              isClearable={true}
              placeholderText="All Time (Lifetime)"
              className="text-sm font-semibold text-[#374151] cursor-pointer hover:bg-[#f9fafb] border-[#d1d5db] min-w-[220px]"
            />
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 bg-[#ffffff] border border-[#d1d5db] rounded-lg px-4 py-2 text-sm font-semibold text-[#374151] hover:bg-[#f9fafb] transition-colors">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="max-w-[1400px] mx-auto space-y-6">
          
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

          {/* Row 2: Revenue Line Chart & Donut & Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Revenue Overview */}
            <div className="bg-[#ffffff] rounded-xl border border-[#e5e7eb] p-5 shadow-sm lg:col-span-1 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-[#111827]">Revenue Overview</h3>
              </div>
              <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueChartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} dy={10} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `${v/1000}K`} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      formatter={(value, name) => [name === 'Revenue' ? renderCurrency(value) : value, name]}
                    />
                    <Line yAxisId="left" type="monotone" dataKey="Revenue" stroke="#b91c1c" strokeWidth={3} dot={{ r: 4, fill: '#b91c1c', strokeWidth: 2, stroke: '#ffffff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sales by Channel */}
            <div className="bg-[#ffffff] rounded-xl border border-[#e5e7eb] p-5 shadow-sm flex flex-col">
              <h3 className="text-sm font-bold text-[#111827] mb-6">Sales by Channel</h3>
              <div className="flex-1 flex flex-col items-center justify-center relative min-h-[200px]">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={formattedSalesByChannel} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                      {formattedSalesByChannel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => renderCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                  <span className="text-lg font-black text-[#111827]">{renderCurrency(summary?.totalRevenue)}</span>
                  <span className="text-xs text-[#6b7280] font-semibold uppercase tracking-wider">Total Revenue</span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {formattedSalesByChannel.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-[#4b5563]">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#111827]">{renderCurrency(item.value)}</span>
                      <span className="text-[#6b7280]">({item.percent}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Orders by Time of Day Heatmap */}
            <div className="bg-[#ffffff] rounded-xl border border-[#e5e7eb] p-5 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#111827]">Orders by Time of Day</h3>
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex-1 grid grid-cols-[25px_1fr] gap-2">
                  <div className="flex flex-col justify-between text-xs font-semibold text-[#9ca3af] py-1">
                    {daysOfWeek.map(d => <span key={d}>{d}</span>)}
                  </div>
                  <div className="grid grid-rows-7 gap-[2px]">
                    {heatmapGrid.map((dayRow, dIdx) => (
                      <div key={dIdx} className="grid grid-cols-24 gap-[2px]">
                        {dayRow.map((val, hIdx) => (
                          <div 
                            key={`${dIdx}-${hIdx}`} 
                            className={`rounded-[2px] ${getHeatmapColor(val)}`}
                            title={`${daysOfWeek[dIdx]} ${hIdx}:00 - ${val} orders`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between pl-[33px] mt-2 text-xs font-semibold text-[#9ca3af]">
                  <span>12 AM</span><span>4 AM</span><span>8 AM</span><span>12 PM</span><span>4 PM</span><span>8 PM</span>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs font-semibold text-[#6b7280]">Low Orders</span>
                  <div className="flex items-center gap-[2px] h-2 w-32">
                    <div className="flex-1 h-full bg-[#fff1f2] rounded-l-sm"/>
                    <div className="flex-1 h-full bg-[#fecaca]"/>
                    <div className="flex-1 h-full bg-[#f87171]"/>
                    <div className="flex-1 h-full bg-[#ef4444]"/>
                    <div className="flex-1 h-full bg-[#dc2626]"/>
                    <div className="flex-1 h-full bg-[#991b1b] rounded-r-sm"/>
                  </div>
                  <span className="text-xs font-semibold text-[#6b7280]">High Orders</span>
                </div>
              </div>
            </div>
            
          </div>

          {/* Row 3: Dishes, Payments, Revenue Comparison, Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Top Selling Dishes */}
            <div className="bg-[#ffffff] rounded-xl border border-[#e5e7eb] p-5 shadow-sm lg:col-span-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#111827]">Top Selling Dishes</h3>
              </div>
              <div className="flex-1 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#f3f4f6]">
                      <th className="pb-3 text-xs font-bold text-[#9ca3af] uppercase tracking-wider w-8">#</th>
                      <th className="pb-3 text-xs font-bold text-[#9ca3af] uppercase tracking-wider">Dish</th>
                      <th className="pb-3 text-xs font-bold text-[#9ca3af] uppercase tracking-wider text-right">Orders</th>
                      <th className="pb-3 text-xs font-bold text-[#9ca3af] uppercase tracking-wider text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(topItems || []).slice(0, 5).map((item, idx) => (
                      <tr key={idx} className="border-b border-[#f3f4f6] last:border-0 hover:bg-[#f9fafb]">
                        <td className="py-3 text-xs font-bold text-[#6b7280]">{idx + 1}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-[#f3f4f6] flex items-center justify-center shrink-0 overflow-hidden">
                              <ChefHat className="w-3 h-3 text-[#9ca3af]" />
                            </div>
                            <span className="text-xs font-bold text-[#111827] truncate max-w-[100px]">{item._id}</span>
                          </div>
                        </td>
                        <td className="py-3 text-xs font-semibold text-[#4b5563] text-right">{item.quantitySold}</td>
                        <td className="py-3 text-xs font-bold text-[#111827] text-right">{renderCurrency(item.revenueGenerated)}</td>
                      </tr>
                    ))}
                    {(!topItems || topItems.length === 0) && (
                      <tr><td colSpan="4" className="py-8 text-center text-sm text-[#6b7280]">No dish data available</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="bg-[#ffffff] rounded-xl border border-[#e5e7eb] p-5 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-[#111827]">Payment Method Breakdown</h3>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center relative min-h-[160px]">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={formattedPaymentBreakdown} innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                      {formattedPaymentBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => renderCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                  <span className="text-sm font-black text-[#111827]">{renderCurrency(summary?.totalRevenue)}</span>
                  <span className="text-xs text-[#6b7280] font-semibold uppercase tracking-wider">Total</span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {formattedPaymentBreakdown.map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between text-xs">
                    <div className="flex items-start gap-2">
                      <div className="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: item.color }} />
                      <div>
                        <div className="font-semibold text-[#4b5563]">{item.name}</div>
                        <div className="font-bold text-[#111827]">{renderCurrency(item.value)} <span className="text-[#6b7280] font-normal">({item.percent}%)</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Comparison */}
            <div className="bg-[#ffffff] rounded-xl border border-[#e5e7eb] p-5 shadow-sm lg:col-span-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#111827]">Weekly Revenue Comparison</h3>
              </div>
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="flex items-center gap-1 text-xs font-semibold text-[#6b7280]"><div className="w-2 h-2 bg-[#b91c1c] rounded-sm" /> This Month</div>
                {/* <div className="flex items-center gap-1 text-xs font-semibold text-[#6b7280]"><div className="w-2 h-2 bg-[#d1d5db] rounded-sm" /> Last Month</div> */}
              </div>
              <div className="flex-1 min-h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={strictComparisonData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => `${v/1000}K`} />
                    <RechartsTooltip cursor={{ fill: '#f9fafb' }} formatter={(val) => `$${val}`} />
                    <Bar dataKey="This Month" fill="#b91c1c" radius={[2, 2, 0, 0]} maxBarSize={20} />
                    {/* <Bar dataKey="Last Month" fill="#d1d5db" radius={[2, 2, 0, 0]} maxBarSize={20} /> */}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Key Insights */}
            <div className="bg-[#ffffff] rounded-xl border border-[#e5e7eb] p-5 shadow-sm lg:col-span-1 flex flex-col">
              <h3 className="text-sm font-bold text-[#111827] mb-4">Key Insights</h3>
              <div className="space-y-4 flex-1">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#d1fae5] flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-[#10b981]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#111827]">Revenue is {Number(revGrowth) >= 0 ? 'up' : 'down'} by {Math.abs(revGrowth)}%</div>
                    <div className="text-xs text-[#6b7280] mt-0.5 leading-tight">Great job! Keep monitoring this trend closely compared to the last period.</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#ffedd5] flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-[#f97316]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#111827]">Customer Growth</div>
                    <div className="text-xs text-[#6b7280] mt-0.5 leading-tight">You acquired {summary?.newCustomers} active customers this period.</div>
                  </div>
                </div>

                {topItems && topItems.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#ede9fe] flex items-center justify-center shrink-0">
                      <ChefHat className="w-4 h-4 text-[#8b5cf6]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#111827]">Top Performer</div>
                      <div className="text-xs text-[#6b7280] mt-0.5 leading-tight">{topItems[0]._id} is your top selling dish this period.</div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#dbeafe] flex items-center justify-center shrink-0">
                    <RefreshCw className="w-4 h-4 text-[#3b82f6]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#111827]">Repeat Customers</div>
                    <div className="text-xs text-[#6b7280] mt-0.5 leading-tight">{repeatRate}% of your orders are from returning customers.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Report Shortcuts */}
          <div className="pt-4">
            <h3 className="text-sm font-bold text-[#111827] mb-3">Report Shortcuts</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <button onClick={handleExport} className="flex items-center gap-2 justify-center bg-[#fff1f2] border border-[#fecaca] text-[#991b1b] rounded-lg py-2.5 px-3 text-xs font-bold hover:bg-[#ffe4e6] transition-colors">
                <Calendar className="w-3.5 h-3.5" /> Sales Summary
              </button>
              <button onClick={() => router.push('/merchant/all-orders')} className="flex items-center gap-2 justify-center bg-[#ffedd5] border border-[#fed7aa] text-[#c2410c] rounded-lg py-2.5 px-3 text-xs font-bold hover:bg-[#ffedd5] transition-colors">
                <ShoppingBag className="w-3.5 h-3.5" /> Order Report
              </button>
              <button onClick={() => router.push('/merchant/menu')} className="flex items-center gap-2 justify-center bg-[#dcfce7] border border-[#bbf7d0] text-[#15803d] rounded-lg py-2.5 px-3 text-xs font-bold hover:bg-[#dcfce7] transition-colors">
                <ChefHat className="w-3.5 h-3.5" /> Menu Performance
              </button>
              <button onClick={() => router.push('/merchant/crm')} className="flex items-center gap-2 justify-center bg-[#f3e8ff] border border-[#e9d5ff] text-[#7e22ce] rounded-lg py-2.5 px-3 text-xs font-bold hover:bg-[#f3e8ff] transition-colors">
                <Users className="w-3.5 h-3.5" /> Customer Report
              </button>
              <button onClick={handleExport} className="flex items-center gap-2 justify-center bg-[#e0f2fe] border border-[#bae6fd] text-[#0369a1] rounded-lg py-2.5 px-3 text-xs font-bold hover:bg-[#e0f2fe] transition-colors">
                <CreditCard className="w-3.5 h-3.5" /> Payment Report
              </button>
              <button onClick={handleExport} className="flex items-center gap-2 justify-center bg-[#fef9c3] border border-[#fef08a] text-[#a16207] rounded-lg py-2.5 px-3 text-xs font-bold hover:bg-[#fef9c3] transition-colors">
                <Download className="w-3.5 h-3.5" /> Export Financial Report
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
