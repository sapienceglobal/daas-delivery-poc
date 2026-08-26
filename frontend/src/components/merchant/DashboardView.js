import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, Clock, Users, ArrowRight, ExternalLink, Activity, 
  MapPin, CheckCircle, XCircle, ChevronDown, Check, X, RefreshCw,
  ShoppingCart, Calendar, Gift, UtensilsCrossed, Bell, User,
  ShoppingBag, FileText, Tag, BarChart3, UserCircle, Settings,
  CheckCircle2, Star
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { notificationAPI } from '@/lib/api';
import StatCard from './StatCard';

export default function DashboardView({ stats, orders, reservations, cateringInquiries, restaurant, user, analyticsData, menu, timeframe, onTimeframeChange, onViewAll }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const today = new Date();
  today.setHours(0,0,0,0);

  const cutoffDate = new Date();
  if (timeframe === 1) {
    cutoffDate.setHours(0, 0, 0, 0);
  } else if (timeframe) {
    cutoffDate.setDate(cutoffDate.getDate() - timeframe);
    cutoffDate.setHours(0, 0, 0, 0);
  } else {
    // default to epoch if no timeframe (shouldn't happen)
    cutoffDate.setTime(0);
  }

  const filteredOrders = (orders || []).filter(o => new Date(o.createdAt) >= cutoffDate);
  const filteredReservations = (reservations || []).filter(r => new Date(r.createdAt || r.date) >= cutoffDate);
  const filteredCatering = (cateringInquiries || []).filter(c => new Date(c.createdAt || c.eventDate) >= cutoffDate);

  // ---------------------------------------------------------
  // 1. TOP STATS CALCULATIONS (Strictly real data)
  // ---------------------------------------------------------
  const totalRevenue = analyticsData?.summary?.totalRevenue || 0;
  const totalOrders = analyticsData?.summary?.totalOrders || 0;
  
  const activeOrdersCount = filteredOrders.filter(o => ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'picked_up'].includes((o.status || '').toLowerCase())).length;
  const newCustomers = analyticsData?.summary?.newCustomers || 0;
  
  // pending Catering
  const pendingCateringCount = filteredCatering.filter(c => (c.status || '').toLowerCase() === 'pending').length;

  // ---------------------------------------------------------
  // 2. LIVE ORDER TRACKER
  // ---------------------------------------------------------
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
    .filter(o => ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'picked_up'].includes((o.status || '').toLowerCase()))
    .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // ---------------------------------------------------------
  // 3. CHARTS DATA (Strictly real data)
  // ---------------------------------------------------------
  const fetchedSalesData = (analyticsData?.dailyStats || []).map(day => ({
    name: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    revenue: day.revenue,
    orders: day.orders
  }));
  const salesData = fetchedSalesData.length > 0 ? fetchedSalesData : [{ name: 'Data', revenue: totalRevenue, orders: totalOrders }];

  const totalChannels = (analyticsData?.salesByChannel || []).reduce((sum, c) => sum + c.count, 0);
  const channelDataRaw = (analyticsData?.salesByChannel || []).map(c => {
    let color = '#f59e0b'; // pickup
    if (c._id === 'delivery') color = '#b91c1c';
    if (c._id === 'dine_in') color = '#16a34a';
    return { name: c._id.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), value: c.count, color };
  }).filter(d => d.value > 0);
  const channelData = channelDataRaw.length > 0 ? channelDataRaw : [];

  // peak Hours Bar Chart (grouped by hour of day from analyticsData)
  const heatmap = analyticsData?.timeOfDayHeatmap || [];
  const hoursMap = {};
  heatmap.forEach(entry => {
    const hr = entry._id.hour;
    hoursMap[hr] = (hoursMap[hr] || 0) + entry.orders;
  });
  const peakHoursData = [0, 4, 8, 12, 16, 20].map(h => {
    let sum = 0;
    for(let i=h; i<h+4; i++) sum += (hoursMap[i] || 0);
    let label = '';
    if (h === 0) label = '12 AM';
    else if (h === 12) label = '12 PM';
    else label = h < 12 ? `${h} AM` : `${h-12} PM`;
    return { name: label, orders: sum };
  });
  const hasPeakData = peakHoursData.some(d => d.orders > 0);

  // ---------------------------------------------------------
  // 4. BOTTOM LISTS DATA
  // ---------------------------------------------------------
  const topItems = (analyticsData?.topItems || []).slice(0, 5).map((item, idx) => {
    const menuItem = (menu || []).find(m => m.name === item._id || m._id === item._id);
    return {
      rank: idx + 1,
      name: item._id,
      orders: item.quantitySold,
      revenue: item.revenueGenerated,
      img: menuItem?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'
    };
  });

  const upcomingReservations = filteredReservations
    .filter(r => new Date(r.date) >= today)
    .sort((a,b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4);

  const upcomingCatering = filteredCatering
    .filter(c => new Date(c.eventDate || c.date || Date.now()) >= today)
    .sort((a,b) => new Date(a.eventDate || a.date || Date.now()) - new Date(b.eventDate || b.date || Date.now()))
    .slice(0, 3);

  return (
    <div className="space-y-6 pb-10">
      
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Dashboard</h1>
          <p className="text-sm text-[#6b7280] mt-1">Welcome back, {user?.name || 'Admin'}! Let's make today outstanding.</p>
        </div>
        <div>
          <select 
            value={timeframe} 
            onChange={(e) => onTimeframeChange(Number(e.target.value))}
            className="text-sm font-bold text-[#374151] border-2 border-[#e5e7eb] rounded-xl bg-white px-4 py-2.5 outline-none hover:border-[#d1d5db] transition-colors focus:border-[#991b1b] focus:ring-2 focus:ring-[#991b1b]/20"
          >
            <option value={1}>Today</option>
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
            <option value={365}>Last 365 Days</option>
          </select>
        </div>
      </div>

      {/* Top Stats Grid (6 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          iconColor="text-[#991b1b]"
          iconBg="bg-[#fef2f2]"
        />
        <StatCard
          title="Total Orders"
          value={totalOrders}
          icon={ShoppingCart}
          iconColor="text-[#ea580c]"
          iconBg="bg-[#fff7ed]"
        />
        <StatCard
          title="Reservations"
          value={filteredReservations.length}
          icon={Calendar}
          iconColor="text-[#7c3aed]"
          iconBg="bg-[#faf5ff]"
        />
        <StatCard
          title="Live Orders"
          value={activeOrdersCount}
          icon={UtensilsCrossed}
          iconColor="text-[#2563eb]"
          iconBg="bg-[#eff6ff]"
          footer={
            <div className="inline-flex items-center gap-1.5 bg-[#dcfce7] text-[#166534] px-2 py-0.5 rounded-md border border-[#bbf7d0]">
              <span className="w-1.5 h-1.5 bg-[#16a34a] rounded-full"></span>
              <span className="text-[10px] font-bold">In Progress</span>
            </div>
          }
        />
        <StatCard
          title="New Customers"
          value={newCustomers}
          icon={Users}
          iconColor="text-[#16a34a]"
          iconBg="bg-[#dcfce7]"
        />
        <StatCard
          title="Catering Requests"
          value={filteredCatering.length}
          icon={Gift}
          iconColor="text-[#ca8a04]"
          iconBg="bg-[#fefce8]"
          footer={
            <div className="inline-flex items-center justify-center bg-[#fff7ed] text-[#ea580c] px-2 py-0.5 rounded-md border border-[#ffedd5]">
              <span className="text-[10px] font-bold">{pendingCateringCount} Pending</span>
            </div>
          }
        />
      </div>

      {/* Row 2: Tracker and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Live Order Tracker */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[13px] font-extrabold text-[#111827] uppercase tracking-wider">Live Order Tracker</h3>
            <button onClick={() => onViewAll && onViewAll('live_orders')} className="text-xs font-extrabold text-[#991b1b] hover:underline flex items-center gap-1">View All Orders <ArrowRight className="w-3 h-3"/></button>
          </div>
          
          {/* Timeline Graphic */}
          <div className="relative flex justify-between items-center mb-8 px-4">
            <div className="absolute top-4 left-6 right-6 h-1 bg-[#f3f4f6] -z-10"></div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[#fef2f2] border-2 border-[#fca5a5] text-[#991b1b] flex items-center justify-center shadow-sm z-10"><ShoppingBag className="w-4 h-4"/></div>
              <div className="text-center">
                <p className="text-xs font-bold text-[#374151]">New</p>
                <p className="text-[13px] font-extrabold text-[#991b1b]">{orderCounts.new}</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[#fff7ed] border-2 border-[#fdba74] text-[#ea580c] flex items-center justify-center shadow-sm z-10"><CheckCircle2 className="w-4 h-4"/></div>
              <div className="text-center">
                <p className="text-xs font-bold text-[#374151]">Accepted</p>
                <p className="text-[13px] font-extrabold text-[#ea580c]">{orderCounts.accepted}</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[#f5f3ff] border-2 border-[#c4b5fd] text-[#7c3aed] flex items-center justify-center shadow-sm z-10"><Clock className="w-4 h-4"/></div>
              <div className="text-center">
                <p className="text-xs font-bold text-[#374151]">Preparing</p>
                <p className="text-[13px] font-extrabold text-[#7c3aed]">{orderCounts.preparing}</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[#f0fdf4] border-2 border-[#86efac] text-[#16a34a] flex items-center justify-center shadow-sm z-10"><ShoppingBag className="w-4 h-4"/></div>
              <div className="text-center">
                <p className="text-xs font-bold text-[#374151]">Ready</p>
                <p className="text-[13px] font-extrabold text-[#16a34a]">{orderCounts.ready}</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[#eff6ff] border-2 border-[#93c5fd] text-[#2563eb] flex items-center justify-center shadow-sm z-10"><UtensilsCrossed className="w-4 h-4"/></div>
              <div className="text-center">
                <p className="text-xs font-bold text-[#374151]">Out for Delivery</p>
                <p className="text-[13px] font-extrabold text-[#2563eb]">{orderCounts.delivery}</p>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="space-y-3">
            {recentActiveOrders.map(o => (
              <div key={o._id} className="flex justify-between items-center text-xs font-bold border-b border-[#f3f4f6] pb-3 last:border-0 last:pb-0">
                <span className="w-16 text-[#6b7280]">#{o.orderNumber || o._id?.toString().slice(-6)}</span>
                <span className="flex-1 text-[#111827] truncate pr-4">{o.items?.[0]?.name || 'Custom Order'} {o.items?.length > 1 ? `+${o.items.length - 1} more` : ''}</span>
                <span className="w-20 text-[#ea580c] bg-[#fff7ed] px-2 py-0.5 rounded text-center border border-[#ffedd5] capitalize">{o.orderType || 'Delivery'}</span>
                <span className="w-16 text-right text-[#6b7280]">{new Date(o.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
            {recentActiveOrders.length === 0 && (
              <div className="text-center text-xs font-bold text-[#9ca3af] py-8 border border-dashed border-[#e5e7eb] rounded-xl bg-[#f9fafb] flex flex-col items-center gap-2">
                <UtensilsCrossed className="w-6 h-6 text-[#d1d5db]" />
                <p>No active orders currently</p>
              </div>
            )}
            <button onClick={() => onViewAll && onViewAll('live-orders')} className="text-xs font-extrabold text-[#991b1b] flex items-center gap-1 mt-4 hover:underline">
              <div className="w-3 h-3 rounded-full border border-[#991b1b] flex items-center justify-center text-[8px]">+</div> New Order
            </button>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm">
          <h3 className="text-[13px] font-extrabold text-[#111827] uppercase tracking-wider mb-5">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-[calc(100%-2.5rem)]">
            {[
              { icon: ShoppingBag, label: 'Add New Order', color: 'text-[#991b1b]', onClick: () => onViewAll && onViewAll('all-orders') },
              { icon: FileText, label: 'Manage Menu', color: 'text-[#991b1b]', onClick: () => onViewAll && onViewAll('menu') },
              { icon: Tag, label: 'Create Coupon', color: 'text-[#991b1b]', onClick: () => onViewAll && onViewAll('promotions') },
              { icon: Calendar, label: 'Table Reservation', color: 'text-[#7c3aed]', onClick: () => onViewAll && onViewAll('reservations') },
              { icon: Users, label: 'Manage Customers', color: 'text-[#16a34a]', onClick: () => onViewAll && onViewAll('crm') },
              { icon: BarChart3, label: 'View Reports', color: 'text-[#9333ea]', onClick: () => onViewAll && onViewAll('analytics') },
              { icon: UserCircle, label: 'Manage Staff', color: 'text-[#ea580c]', onClick: () => onViewAll && onViewAll('employees') },
              { icon: Settings, label: 'Settings', color: 'text-[#4b5563]', onClick: () => onViewAll && onViewAll('settings') },
            ].map((action, i) => (
              <button key={i} onClick={action.onClick} className="flex flex-col items-center justify-center gap-2 border border-[#f3f4f6] bg-white rounded-xl p-3 hover:border-[#e5e7eb] hover:bg-[#f9fafb] hover:shadow-md transition-all group cursor-pointer">
                <action.icon className={`w-6 h-6 ${action.color} group-hover:scale-110 transition-transform`} strokeWidth={1.5}/>
                <span className="text-xs font-bold text-[#374151] text-center leading-tight group-hover:text-[#111827]">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Row 3: Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Revenue Summary */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[13px] font-extrabold text-[#111827] uppercase tracking-wider">Revenue Summary</h3>
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#111827]">${(analyticsData?.summary?.totalRevenue || 0).toFixed(2)}</h2>
            {analyticsData?.summary?.totalRevenue !== undefined && analyticsData?.summary?.prevRevenue !== undefined && (
              <p className={`text-xs font-extrabold flex items-center gap-1 mt-1 ${analyticsData.summary.totalRevenue >= analyticsData.summary.prevRevenue ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                {analyticsData.summary.totalRevenue >= analyticsData.summary.prevRevenue ? '↑' : '↓'} 
                {analyticsData.summary.prevRevenue > 0 
                  ? Math.abs(((analyticsData.summary.totalRevenue - analyticsData.summary.prevRevenue) / analyticsData.summary.prevRevenue) * 100).toFixed(1)
                  : 100}%
                <span className="text-[#9ca3af] font-medium">vs previous period</span>
              </p>
            )}
          </div>
          <div className="h-[140px] w-full mt-4">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af', fontWeight: 'bold' }} dy={5} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af', fontWeight: 'bold' }} tickFormatter={(val) => `${val/1000}K`} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }} />
                  <Line type="monotone" dataKey="revenue" stroke="#991b1b" strokeWidth={3} dot={{ r: 3, fill: '#991b1b', strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Orders by Channel */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[13px] font-extrabold text-[#111827] uppercase tracking-wider">Orders by Channel</h3>
          </div>
          
          {channelData.length > 0 ? (
            <div className="flex items-center flex-1">
            <div className="w-[120px] h-[120px] relative">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={channelData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value" stroke="none">
                      {channelData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-[#111827]">{totalOrders}</span>
                <span className="text-[8px] font-bold text-[#6b7280] leading-tight">Total Orders</span>
              </div>
            </div>
            <div className="flex-1 pl-4 space-y-2">
              {channelData.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: c.color}}></div>
                    <span className="text-[#374151]">{c.name}</span>
                  </div>
                  <div className="flex gap-1.5 text-right">
                    <span className="text-[#111827]">{c.value}</span>
                    <span className="text-[#9ca3af] font-medium w-6 text-right">({totalOrders > 0 ? Math.round(c.value/totalOrders*100) : 0}%)</span>
                  </div>
                </div>
              ))}
            </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-6 border border-dashed border-[#e5e7eb] rounded-xl bg-[#f9fafb]">
              <PieChart className="w-8 h-8 text-[#d1d5db] mb-2" />
              <p className="text-xs font-bold text-[#9ca3af]">No channel data available</p>
            </div>
          )}
        </div>

        {/* Peak Hours */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[13px] font-extrabold text-[#111827] uppercase tracking-wider">Peak Hours (By Orders)</h3>
          </div>
          {hasPeakData ? (
            <div className="h-[180px] w-full mt-2">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakHoursData} margin={{ top: 20, right: 0, bottom: 0, left: -25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af', fontWeight: 'bold' }} dy={5} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af', fontWeight: 'bold' }} />
                    <RechartsTooltip cursor={{fill: '#fef2f2'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }} />
                    <Bar dataKey="orders" fill="#991b1b" radius={[2, 2, 0, 0]} barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-6 border border-dashed border-[#e5e7eb] rounded-xl bg-[#f9fafb]">
              <BarChart className="w-8 h-8 text-[#d1d5db] mb-2" />
              <p className="text-xs font-bold text-[#9ca3af]">No peak hour data available</p>
            </div>
          )}
        </div>

      </div>

      {/* Row 4: Lists & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Top Selling Items */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-[13px] font-extrabold text-[#111827] uppercase tracking-wider">Top Selling Items</h3>
          </div>
          <div className="space-y-4">
            {topItems.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-xs font-bold">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#fef2f2] text-[#991b1b] border border-[#fca5a5] flex items-center justify-center text-xs">{item.rank}</div>
                  <span className="text-[#111827] truncate max-w-[80px]">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#991b1b]">{item.orders} Orders</span>
                  <span className="text-[#111827] font-extrabold w-12 text-right">${item.revenue.toFixed(2)}</span>
                </div>
              </div>
            ))}
            {topItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 border border-dashed border-[#e5e7eb] rounded-xl bg-[#f9fafb]">
                <UtensilsCrossed className="w-8 h-8 text-[#d1d5db] mb-2" />
                <p className="text-xs font-bold text-[#9ca3af]">No top items data available</p>
              </div>
            )}
          </div>
          <button onClick={() => onViewAll && onViewAll('analytics')} className="text-xs font-extrabold text-[#991b1b] hover:underline flex items-center gap-1 mt-4">Full Report <ArrowRight className="w-3 h-3"/></button>
        </div>

        {/* Catering & Events */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-[13px] font-extrabold text-[#111827] uppercase tracking-wider">Catering & Events</h3>
          </div>
          <div className="space-y-4">
            {upcomingCatering.map((c, i) => (
              <div key={i} className="flex justify-between items-start text-xs font-bold border-b border-[#f3f4f6] pb-3 last:border-0 last:pb-0">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded bg-[#fff7ed] text-[#ea580c] flex items-center justify-center mt-0.5"><Gift className="w-3.5 h-3.5"/></div>
                  <div>
                    <p className="text-[#111827]">{c.eventType || c.type || 'Event'}</p>
                    <p className="text-xs text-[#6b7280] font-medium">{new Date(c.eventDate || c.date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {c.guests || c.numberOfGuests || 0} Pax</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs border ${c.status==='confirmed' ? 'bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]' : 'bg-[#fff7ed] text-[#ea580c] border-[#ffedd5]'} capitalize`}>{c.status || 'Pending'}</span>
              </div>
            ))}
            {upcomingCatering.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 border border-dashed border-[#e5e7eb] rounded-xl bg-[#f9fafb]">
                <Gift className="w-8 h-8 text-[#d1d5db] mb-2" />
                <p className="text-xs font-bold text-[#9ca3af]">No upcoming events</p>
              </div>
            )}
          </div>
          <button onClick={() => onViewAll && onViewAll('catering')} className="text-xs font-extrabold text-[#991b1b] hover:underline flex items-center gap-1 mt-4">View Schedule <ArrowRight className="w-3 h-3"/></button>
        </div>



        {/* Quick Stats */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm flex flex-col">
          <h3 className="text-[13px] font-extrabold text-[#111827] uppercase tracking-wider mb-5">Quick Stats</h3>
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#374151]">
                <div className="w-6 h-6 rounded bg-[#eff6ff] text-[#2563eb] flex items-center justify-center"><DollarSign className="w-3.5 h-3.5"/></div>
                Average Order Value
              </div>
              <span className="text-xs font-black text-[#111827]">${(analyticsData?.summary?.aov || 0).toFixed(2)}</span>
            </div>
            

          </div>
          
          <div className="mt-4 pt-4 border-t border-[#f3f4f6]">
            <button onClick={() => onViewAll && onViewAll('analytics')} className="w-full text-center text-xs font-extrabold text-[#991b1b] hover:underline">View Detailed Reports</button>
          </div>
        </div>

      </div>

    </div>
  );
}
