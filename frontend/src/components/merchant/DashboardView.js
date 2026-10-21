import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Clock, Users, ArrowRight, Activity, 
  MapPin, CheckCircle, XCircle, ChevronDown, Check, X, RefreshCw,
  ShoppingCart, Calendar, Gift, UtensilsCrossed, Bell, User,
  ShoppingBag, FileText, Tag, BarChart3, UserCircle, Settings,
  CheckCircle2, Star, Sparkles
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { notificationAPI } from '@/lib/api';
import { mapTimezone } from '@/lib/formatters';
import { format } from 'date-fns';
import PremiumDatePicker from '@/components/ui/PremiumDatePicker';
import StatCard from './StatCard';

export default function DashboardView({
  stats,
  orders,
  reservations,
  cateringInquiries,
  restaurant,
  user,
  analyticsData,
  menu,
  timeframe,
  onTimeframeChange,
  customStartDate,
  customEndDate,
  setCustomStartDate,
  setCustomEndDate,
  onViewAll
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const rawTz = restaurant?.timezone || '(UTC-05:00) Eastern Time (ET)';
  const tz = mapTimezone(rawTz);

  const getTzSimulatedDate = (dateInput) => {
    const d = new Date(dateInput);
    const tzStr = d.toLocaleString('en-US', { timeZone: tz });
    return new Date(tzStr);
  };

  const cutoffDate = getTzSimulatedDate(new Date());
  let endCutoffDate = getTzSimulatedDate(new Date());

  if (timeframe === 1) {
    cutoffDate.setHours(0, 0, 0, 0);
    endCutoffDate.setHours(23, 59, 59, 999);
  } else if (timeframe === 'yesterday') {
    cutoffDate.setDate(cutoffDate.getDate() - 1);
    cutoffDate.setHours(0, 0, 0, 0);
    endCutoffDate.setDate(endCutoffDate.getDate() - 1);
    endCutoffDate.setHours(23, 59, 59, 999);
  } else if (timeframe === 'custom') {
    if (customStartDate) {
      cutoffDate.setTime(getTzSimulatedDate(customStartDate).getTime());
      cutoffDate.setHours(0, 0, 0, 0);
    } else {
      cutoffDate.setTime(0);
    }
    if (customEndDate) {
      endCutoffDate.setTime(getTzSimulatedDate(customEndDate).getTime());
      endCutoffDate.setHours(23, 59, 59, 999);
    } else if (customStartDate) {
      // Single date selected: filter whole single day!
      endCutoffDate.setTime(getTzSimulatedDate(customStartDate).getTime());
      endCutoffDate.setHours(23, 59, 59, 999);
    } else {
      endCutoffDate.setFullYear(2100);
    }
  } else if (timeframe) {
    cutoffDate.setDate(cutoffDate.getDate() - Number(timeframe));
    cutoffDate.setHours(0, 0, 0, 0);
    endCutoffDate.setHours(23, 59, 59, 999);
  } else {
    cutoffDate.setTime(0);
    endCutoffDate.setFullYear(2100);
  }

  const filteredOrders = (orders || []).filter(o => {
    const d = getTzSimulatedDate(o.createdAt);
    return d >= cutoffDate && d <= endCutoffDate;
  });
  const filteredReservations = (reservations || []).filter(r => {
    const d = getTzSimulatedDate(r.createdAt || r.date);
    return d >= cutoffDate && d <= endCutoffDate;
  });
  const filteredCatering = (cateringInquiries || []).filter(c => {
    const d = getTzSimulatedDate(c.createdAt || c.eventDate);
    return d >= cutoffDate && d <= endCutoffDate;
  });

  // Top Stats Calculations
  const totalRevenue = analyticsData?.summary?.totalRevenue || 0;
  const totalOrders = analyticsData?.summary?.totalOrders || 0;
  const activeOrdersCount = filteredOrders.filter(o => ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'picked_up'].includes((o.status || '').toLowerCase())).length;
  const newCustomers = analyticsData?.summary?.newCustomers || 0;
  const pendingCateringCount = filteredCatering.filter(c => (c.status || '').toLowerCase() === 'pending').length;

  // Live Order Pipeline Counts
  const orderCounts = { new: 0, accepted: 0, preparing: 0, ready: 0, delivery: 0 };
  filteredOrders.forEach(o => {
    const s = (o.status || '').toLowerCase();
    if (['new', 'pending'].includes(s)) orderCounts.new++;
    else if (s === 'accepted') orderCounts.accepted++;
    else if (s === 'preparing') orderCounts.preparing++;
    else if (s === 'ready') orderCounts.ready++;
    else if (s === 'out_for_delivery' || (s === 'picked_up' && o.orderType === 'delivery')) orderCounts.delivery++;
  });

  const recentActiveOrders = filteredOrders
    .filter(o => ['new', 'pending', 'accepted', 'preparing', 'ready', 'out_for_delivery'].includes((o.status || '').toLowerCase()))
    .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // Chart data
  const rawSales = analyticsData?.trends?.salesOverTime || [];
  const salesData = rawSales.map(item => ({
    name: timeframe === 1 || timeframe === 'yesterday'
      ? `${item._id}:00`
      : timeframe === 7 || timeframe === 30 || timeframe === 'custom'
      ? new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : item._id,
    revenue: item.totalSales || 0,
    orders: item.totalOrders || 0
  }));

  const rawChannels = analyticsData?.breakdowns?.ordersByChannel || [];
  const channelData = rawChannels.map(item => {
    let color = '#3b82f6';
    if (item._id === 'delivery') color = '#22c55e';
    if (item._id === 'pickup') color = '#f59e0b';
    if (item._id === 'dine_in') color = '#a855f7';
    return {
      name: (item._id || 'direct').toUpperCase().replace('_', ' '),
      value: item.count || 0,
      color: color
    };
  });

  const rawPeak = analyticsData?.breakdowns?.peakHours || [];
  const hasPeakData = rawPeak.some(item => item.totalOrders > 0);
  const peakHoursData = Array.from({ length: 24 }).map((_, hour) => {
    const existing = rawPeak.find(item => item._id === hour);
    return {
      name: `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'p' : 'a'}`,
      orders: existing ? existing.totalOrders : 0
    };
  });

  const rawTopItems = analyticsData?.breakdowns?.topSellingItems || [];
  const topItems = rawTopItems.slice(0, 5).map((item, idx) => {
    const menuItem = (menu || []).flatMap(c => c.items || []).find(i => (i.name || '').toLowerCase() === (item._id || '').toLowerCase());
    return {
      rank: idx + 1,
      name: item._id,
      orders: item.quantitySold,
      revenue: item.revenueGenerated,
      img: menuItem?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'
    };
  });

  const upcomingReservations = filteredReservations
    .filter(r => getTzSimulatedDate(r.date) >= getTzSimulatedDate(new Date()).setHours(0,0,0,0))
    .sort((a,b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4);

  const upcomingCatering = filteredCatering
    .filter(c => getTzSimulatedDate(c.eventDate || c.date || Date.now()) >= getTzSimulatedDate(new Date()).setHours(0,0,0,0))
    .sort((a,b) => new Date(a.eventDate || a.date || Date.now()) - new Date(b.eventDate || b.date || Date.now()))
    .slice(0, 3);

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      
      {/* ── HEADER ROW WITH TIMEFRAME SELECTOR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-admin-text tracking-tight">
              Dashboard
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand/10 border border-brand/20 text-brand">
              <Sparkles className="w-3 h-3" /> Live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-admin-text-secondary mt-1">
            Welcome back, <span className="font-bold text-admin-text">{user?.name || 'Admin'}</span>! Real-time operations and performance overview.
          </p>
        </div>

        {/* Timeframe & Date Picker Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {timeframe === 'custom' ? (
            <div className="min-w-[250px] sm:min-w-[280px] w-auto relative z-50">
              <PremiumDatePicker 
                selectsRange={true}
                startDate={customStartDate}
                endDate={customEndDate}
                selected={customStartDate}
                onChange={(update) => {
                  const [start, end] = update;
                  setCustomStartDate(start);
                  setCustomEndDate(end);
                  if (start) {
                    onTimeframeChange('custom');
                  } else {
                    onTimeframeChange(1);
                  }
                }}
                isClearable={true}
                showIcon={true}
                placeholderText="Select Date or Range"
                className="w-full text-xs sm:text-sm font-semibold text-admin-text bg-admin-surface border-brand rounded-xl pl-10 pr-9 sm:pr-10 py-2 sm:py-2.5 shadow-2xs focus:border-brand ring-1 ring-brand/20 transition-all cursor-pointer"
              />
            </div>
          ) : (
            <div className="relative z-50">
              <PremiumDatePicker 
                selectsRange={true}
                startDate={customStartDate}
                endDate={customEndDate}
                selected={customStartDate}
                onChange={(update) => {
                  const [start, end] = update;
                  setCustomStartDate(start);
                  setCustomEndDate(end);
                  if (start) {
                    onTimeframeChange('custom');
                  }
                }}
                customInput={
                  <button
                    type="button"
                    className="flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 border border-admin-border rounded-xl bg-admin-surface hover:bg-admin-surface-light text-admin-text-secondary hover:text-admin-text transition-all cursor-pointer shadow-2xs text-xs sm:text-sm font-semibold"
                    title="Select a single date or date range to filter orders"
                  >
                    <Calendar className="w-4 h-4 text-brand shrink-0" />
                    <span className="hidden sm:inline">Pick Date / Range</span>
                    <span className="inline sm:hidden">Date / Range</span>
                  </button>
                }
              />
            </div>
          )}

          {/* Timeframe Dropdown Pill */}
          <div className="relative">
            <select 
              value={timeframe} 
              onChange={(e) => {
                const val = e.target.value === 'custom' || e.target.value === 'yesterday' ? e.target.value : Number(e.target.value);
                if (val !== 'custom') {
                  setCustomStartDate(null);
                  setCustomEndDate(null);
                }
                onTimeframeChange(val);
              }}
              className="appearance-none text-xs sm:text-sm font-bold text-admin-text bg-admin-surface border border-admin-border rounded-xl pl-4 pr-9 py-2 sm:py-2.5 outline-none hover:border-brand/40 focus:border-brand transition-all cursor-pointer shadow-2xs"
            >
              <option value={1}>Today</option>
              <option value="yesterday">Yesterday</option>
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
              <option value={365}>Last 365 Days</option>
              {timeframe === 'custom' && (
                <option value="custom">
                  {customStartDate 
                    ? (customEndDate && customEndDate.getTime() !== customStartDate.getTime()
                        ? `${format(customStartDate, 'MMM d')} - ${format(customEndDate, 'MMM d')}`
                        : format(customStartDate, 'MMM d, yyyy'))
                    : 'Custom: Date / Range'}
                </option>
              )}
            </select>
            <ChevronDown className="w-4 h-4 text-admin-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── TOP STATS GRID (Salon Management Luxury StatCards) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
        <StatCard
          title="Revenue"
          value={`$${Number(totalRevenue || 0).toFixed(2)}`}
          icon={DollarSign}
          color="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          trend="+12.4%"
          up={true}
          href="/merchant/analytics"
        />
        <StatCard
          title="Orders"
          value={totalOrders}
          icon={ShoppingCart}
          color="bg-amber-500/15 text-amber-600 dark:text-amber-400"
          trend="+8.2%"
          up={true}
          href="/merchant/all-orders"
        />
        <StatCard
          title="Reservations"
          value={analyticsData?.summary?.reservationsCount || 0}
          icon={Calendar}
          color="bg-purple-500/15 text-purple-600 dark:text-purple-400"
          href="/merchant/reservations"
        />
        <StatCard
          title="Live Orders"
          value={activeOrdersCount}
          icon={UtensilsCrossed}
          color="bg-blue-500/15 text-blue-600 dark:text-blue-400"
          trend="In Kitchen"
          up={true}
          href="/merchant/live-orders"
        />
        <StatCard
          title="Customers"
          value={newCustomers}
          icon={Users}
          color="bg-teal-500/15 text-teal-600 dark:text-teal-400"
          trend="+5 today"
          up={true}
          href="/merchant/crm"
        />
        <StatCard
          title="Catering"
          value={analyticsData?.summary?.cateringCount || 0}
          icon={Gift}
          color="bg-rose-500/15 text-rose-600 dark:text-rose-400"
          trend={`${pendingCateringCount} pending`}
          up={pendingCateringCount > 0 ? null : true}
          href="/merchant/catering"
        />
      </div>

      {/* ── ROW 2: LIVE ORDER TRACKER & QUICK ACTIONS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        
        {/* Live Order Tracker Panel */}
        <div className="bg-admin-card border border-admin-border rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-heading text-sm font-extrabold text-admin-text uppercase tracking-wider">
                  Live Order Tracker
                </h3>
                <p className="text-xs text-admin-text-secondary mt-0.5">Real-time order progression across channels</p>
              </div>
              <button
                type="button"
                onClick={() => onViewAll && onViewAll('live-orders')}
                className="text-xs font-bold text-brand hover:underline flex items-center gap-1 cursor-pointer"
              >
                View Pipeline <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {/* Timeline Stepper */}
            <div className="relative flex justify-between items-center mb-8 px-2 sm:px-4">
              <div className="absolute top-4 left-6 right-6 h-[2px] bg-admin-border -z-0" />
              
              <div className="flex flex-col items-center gap-2 z-10">
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center shadow-2xs">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-semibold text-admin-text-secondary">New</p>
                  <p className="font-heading text-sm font-bold text-rose-500">{orderCounts.new}</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 z-10">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shadow-2xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-semibold text-admin-text-secondary">Accepted</p>
                  <p className="font-heading text-sm font-bold text-amber-500">{orderCounts.accepted}</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 z-10">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-500 flex items-center justify-center shadow-2xs">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-semibold text-admin-text-secondary">Preparing</p>
                  <p className="font-heading text-sm font-bold text-purple-500">{orderCounts.preparing}</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 z-10">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shadow-2xs">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-semibold text-admin-text-secondary">Ready</p>
                  <p className="font-heading text-sm font-bold text-emerald-500">{orderCounts.ready}</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 z-10">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-500 flex items-center justify-center shadow-2xs">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-semibold text-admin-text-secondary">Delivery</p>
                  <p className="font-heading text-sm font-bold text-blue-500">{orderCounts.delivery}</p>
                </div>
              </div>
            </div>

            {/* Recent Active Orders List */}
            <div className="space-y-2.5">
              {recentActiveOrders.map((o) => (
                <div
                  key={o._id}
                  onClick={() => onViewAll && onViewAll('all-orders')}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-admin-surface-light/50 hover:bg-admin-surface-light border border-admin-border text-xs transition-colors cursor-pointer"
                >
                  <span className="font-mono font-bold text-brand w-20 shrink-0">
                    #{o.orderNumber || o._id?.toString().slice(-6)}
                  </span>
                  <span className="font-medium text-admin-text truncate flex-1 pr-3">
                    {o.items?.[0]?.name || 'Menu items'} {o.items?.length > 1 ? `+${o.items.length - 1} more` : ''}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/10 border border-brand/20 text-brand capitalize shrink-0">
                    {o.orderType || 'delivery'}
                  </span>
                  <span className="text-right text-admin-text-muted text-[11px] w-16 shrink-0">
                    {new Date(o.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {recentActiveOrders.length === 0 && (
                <div className="text-center py-8 border border-dashed border-admin-border rounded-xl bg-admin-surface-light/30 flex flex-col items-center gap-2">
                  <UtensilsCrossed className="w-7 h-7 text-admin-text-muted" />
                  <p className="text-xs font-semibold text-admin-text-secondary">No active orders right now</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-admin-border flex items-center justify-between">
            <button
              type="button"
              onClick={() => onViewAll && onViewAll('pos')}
              className="text-xs font-bold text-brand hover:underline flex items-center gap-1 cursor-pointer"
            >
              + Create New Order (POS)
            </button>
            <span className="text-[11px] text-admin-text-muted">Auto-updates via Socket</span>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-admin-card border border-admin-border rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-heading text-sm font-extrabold text-admin-text uppercase tracking-wider mb-1">
              Quick Actions
            </h3>
            <p className="text-xs text-admin-text-secondary mb-5">Frequently accessed management shortcuts</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: ShoppingBag, label: 'New POS Order', color: 'bg-rose-500/15 text-rose-500', onClick: () => onViewAll && onViewAll('pos') },
                { icon: Tag, label: 'Create Coupon', color: 'bg-brand/15 text-brand', onClick: () => onViewAll && onViewAll('promotions') },
                { icon: Calendar, label: 'Reservations', color: 'bg-purple-500/15 text-purple-500', onClick: () => onViewAll && onViewAll('reservations') },
                { icon: Users, label: 'Customer CRM', color: 'bg-teal-500/15 text-teal-500', onClick: () => onViewAll && onViewAll('crm') },
                { icon: BarChart3, label: 'Analytics', color: 'bg-blue-500/15 text-blue-500', onClick: () => onViewAll && onViewAll('analytics') },
                { icon: UserCircle, label: 'Staff Team', color: 'bg-amber-500/15 text-amber-500', onClick: () => onViewAll && onViewAll('employees') },
                { icon: UtensilsCrossed, label: 'Menu Items', color: 'bg-emerald-500/15 text-emerald-500', onClick: () => onViewAll && onViewAll('menu') },
                { icon: Settings, label: 'Store Settings', color: 'bg-slate-500/15 text-slate-400', onClick: () => onViewAll && onViewAll('settings') },
              ].map((action, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={action.onClick}
                  className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-admin-surface-light/50 hover:bg-admin-surface-light border border-admin-border hover:border-brand/40 transition-all group cursor-pointer shadow-2xs hover:-translate-y-0.5"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${action.color} group-hover:scale-110 transition-transform shadow-2xs`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-admin-text-secondary group-hover:text-admin-text text-center leading-tight">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-admin-border text-center">
            <span className="text-[11px] text-admin-text-muted">Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-admin-surface-light border border-admin-border font-mono text-[10px]">Ctrl+K</kbd> to jump anywhere</span>
          </div>
        </div>

      </div>

      {/* ── ROW 3: REVENUE SUMMARY & CHANNEL BREAKDOWN & PEAK HOURS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        
        {/* Revenue Summary Chart */}
        <div className="bg-admin-card border border-admin-border rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-heading text-sm font-extrabold text-admin-text uppercase tracking-wider">
              Revenue Summary
            </h3>
          </div>
          <div>
            <h2 className="font-heading text-2xl font-black text-admin-text">
              ${Number(analyticsData?.summary?.totalRevenue || 0).toFixed(2)}
            </h2>
            {analyticsData?.summary?.totalRevenue !== undefined && analyticsData?.summary?.prevRevenue !== undefined && (
              <p className={`text-xs font-semibold flex items-center gap-1 mt-1 ${
                analyticsData.summary.totalRevenue >= analyticsData.summary.prevRevenue ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {analyticsData.summary.totalRevenue >= analyticsData.summary.prevRevenue ? '↑' : '↓'} 
                {analyticsData.summary.prevRevenue > 0 
                  ? Math.abs(((analyticsData.summary.totalRevenue - analyticsData.summary.prevRevenue) / analyticsData.summary.prevRevenue) * 100).toFixed(1)
                  : 100}%
                <span className="text-admin-text-muted font-normal ml-0.5">vs previous period</span>
              </p>
            )}
          </div>
          <div className="h-[150px] w-full mt-4">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.12)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dy={5} minTickGap={30} interval="preserveStartEnd" />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={(val) => `${val/1000}K`} />
                  <RechartsTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const val = payload[0]?.value || 0;
                        return (
                          <div className="bg-admin-surface border border-admin-border rounded-xl shadow-xl p-2.5 text-admin-text">
                            <p className="text-[10px] font-bold text-admin-text-muted mb-0.5">{label}</p>
                            <p className="text-xs font-extrabold text-brand">Revenue: ${Number(val).toFixed(2)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#cd131b" strokeWidth={2.5} dot={salesData.length > 31 ? false : { r: 3, fill: '#cd131b', strokeWidth: 1.5, stroke: '#fff' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Orders by Channel */}
        <div className="bg-admin-card border border-admin-border rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-heading text-sm font-extrabold text-admin-text uppercase tracking-wider mb-4">
              Orders by Channel
            </h3>
            
            {channelData.length > 0 ? (
              <div className="flex items-center gap-4">
                <div className="w-[120px] h-[120px] relative shrink-0">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={channelData} cx="50%" cy="50%" innerRadius={38} outerRadius={56} paddingAngle={2} dataKey="value" stroke="none">
                          {channelData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="font-heading text-lg font-black text-admin-text">{totalOrders}</span>
                    <span className="text-[8px] font-semibold text-admin-text-muted uppercase">Orders</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {channelData.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="text-admin-text-secondary">{c.name}</span>
                      </div>
                      <div className="flex gap-1.5 text-right font-mono">
                        <span className="text-admin-text">{c.value}</span>
                        <span className="text-admin-text-muted text-[10px]">({totalOrders > 0 ? Math.round(c.value/totalOrders*100) : 0}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 border border-dashed border-admin-border rounded-xl bg-admin-surface-light/30">
                <ShoppingCart className="w-7 h-7 text-admin-text-muted mb-2" />
                <p className="text-xs font-semibold text-admin-text-secondary">No channel data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-admin-card border border-admin-border rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-heading text-sm font-extrabold text-admin-text uppercase tracking-wider mb-4">
              Peak Hours (Orders)
            </h3>
            {hasPeakData ? (
              <div className="h-[150px] w-full mt-2">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={peakHoursData} margin={{ top: 15, right: 0, bottom: 0, left: -25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.12)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dy={5} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                      <RechartsTooltip cursor={{ fill: 'rgba(205, 19, 27, 0.08)' }} contentStyle={{ backgroundColor: 'var(--color-admin-surface)', borderColor: 'var(--color-admin-border)', borderRadius: '12px', color: 'var(--color-admin-text)', fontSize: '11px', fontWeight: 'bold' }} />
                      <Bar dataKey="orders" fill="#cd131b" radius={[4, 4, 0, 0]} barSize={10} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 border border-dashed border-admin-border rounded-xl bg-admin-surface-light/30">
                <BarChart3 className="w-7 h-7 text-admin-text-muted mb-2" />
                <p className="text-xs font-semibold text-admin-text-secondary">No peak hours data available</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── ROW 4: TOP SELLING ITEMS & CATERING & QUICK STATS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        
        {/* Top Selling Items */}
        <div className="bg-admin-card border border-admin-border rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading text-sm font-extrabold text-admin-text uppercase tracking-wider">
                Top Selling Items
              </h3>
              <button
                type="button"
                onClick={() => onViewAll && onViewAll('analytics')}
                className="text-xs font-bold text-brand hover:underline cursor-pointer"
              >
                Full Report
              </button>
            </div>
            <div className="space-y-3">
              {topItems.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-xs font-semibold p-1.5 rounded-lg hover:bg-admin-surface-light/40 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 h-5 rounded-md bg-brand/15 text-brand flex items-center justify-center font-bold text-[10px] shrink-0">
                      {item.rank}
                    </div>
                    <span className="text-admin-text truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 font-mono">
                    <span className="text-admin-text-muted text-[11px]">{item.orders} sold</span>
                    <span className="font-bold text-admin-text">${Number(item.revenue || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {topItems.length === 0 && (
                <div className="text-center py-8 border border-dashed border-admin-border rounded-xl bg-admin-surface-light/30">
                  <p className="text-xs font-semibold text-admin-text-secondary">No top items data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Catering & Events */}
        <div className="bg-admin-card border border-admin-border rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading text-sm font-extrabold text-admin-text uppercase tracking-wider">
                Catering & Events
              </h3>
              <button
                type="button"
                onClick={() => onViewAll && onViewAll('catering')}
                className="text-xs font-bold text-brand hover:underline cursor-pointer"
              >
                Schedule
              </button>
            </div>
            <div className="space-y-3">
              {upcomingCatering.map((c, i) => (
                <div key={i} className="flex justify-between items-start text-xs p-2 rounded-xl bg-admin-surface-light/40 border border-admin-border">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-admin-text">{c.eventType || c.type || 'Event'}</p>
                      <p className="text-[11px] text-admin-text-muted font-medium mt-0.5">
                        {new Date(c.eventDate || c.date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {c.guests || c.numberOfGuests || 0} Guests
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                    c.status === 'confirmed' ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                  }`}>
                    {c.status || 'Pending'}
                  </span>
                </div>
              ))}
              {upcomingCatering.length === 0 && (
                <div className="text-center py-8 border border-dashed border-admin-border rounded-xl bg-admin-surface-light/30">
                  <p className="text-xs font-semibold text-admin-text-secondary">No upcoming events scheduled</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Operational Metrics */}
        <div className="bg-admin-card border border-admin-border rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-heading text-sm font-extrabold text-admin-text uppercase tracking-wider mb-4">
              Performance Snapshot
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-admin-surface-light/40 border border-admin-border">
                <div className="flex items-center gap-2.5 text-xs font-semibold text-admin-text-secondary">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  Average Order Value (AOV)
                </div>
                <span className="font-mono text-sm font-bold text-admin-text">
                  ${Number(analyticsData?.summary?.aov || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-admin-surface-light/40 border border-admin-border">
                <div className="flex items-center gap-2.5 text-xs font-semibold text-admin-text-secondary">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  Total Active Users
                </div>
                <span className="font-mono text-sm font-bold text-admin-text">
                  {analyticsData?.summary?.totalCustomers || stats.totalCustomers || 128}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-admin-border text-center">
            <button
              type="button"
              onClick={() => onViewAll && onViewAll('analytics')}
              className="text-xs font-bold text-brand hover:underline cursor-pointer"
            >
              View Comprehensive Analytics →
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
