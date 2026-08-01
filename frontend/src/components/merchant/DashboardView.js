import React, { useState, useEffect } from 'react';
import GlobalStatCard from '@/components/ui/GlobalStatCard';
import { DollarSign, ShoppingBag, ShoppingCart, Hourglass, Users, Crown, MoreVertical, BarChart3, Settings } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Link from 'next/link';

export default function DashboardView({ stats, orders, reservations, cateringInquiries, restaurant, user, analyticsData, menu, onViewAll }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Mock Data for Charts (as backend might not have this granularity yet)
  const fetchedSalesData = (analyticsData?.dailyStats || []).map(day => {
    const date = new Date(day.date);
    return {
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      revenue: day.revenue,
      orders: day.orders
    };
  });
  const defaultSalesData = [
    { name: 'Mon', revenue: 0, orders: 0 },
    { name: 'Tue', revenue: 0, orders: 0 },
    { name: 'Wed', revenue: 0, orders: 0 },
    { name: 'Thu', revenue: 0, orders: 0 },
    { name: 'Fri', revenue: 0, orders: 0 },
    { name: 'Sat', revenue: 0, orders: 0 },
    { name: 'Sun', revenue: 0, orders: 0 },
  ];
  const salesData = fetchedSalesData.length > 0 ? fetchedSalesData : defaultSalesData;

  const orderStatuses = ['new', 'accepted', 'preparing', 'ready', 'out for delivery', 'completed', 'cancelled'];
  const statusColors = {
    'new': '#DC2626',
    'accepted': '#F59E0B',
    'preparing': '#3B82F6',
    'ready': '#10B981',
    'out for delivery': '#8B5CF6',
    'completed': '#166534',
    'cancelled': '#9CA3AF'
  };

  const orderCounts = {};
  (orders || []).forEach(o => {
    const status = (o.status || '').toLowerCase();
    orderCounts[status] = (orderCounts[status] || 0) + 1;
  });

  const orderStatusData = orderStatuses.map(status => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: orderCounts[status] || 0,
    color: statusColors[status] || '#9CA3AF'
  })).filter(s => s.value > 0);

  const displayOrderStatusData = orderStatusData.length > 0 ? orderStatusData : [{ name: 'No Orders', value: 1, color: '#f3f4f6' }];

  const topItems = (analyticsData?.topItems || []).map((item, idx) => {
    const menuItem = (menu || []).find(m => m.name === item._id || m._id === item._id);
    return {
      rank: idx + 1,
      name: item._id,
      orders: item.quantitySold,
      revenue: item.revenueGenerated,
      img: menuItem?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'
    };
  });

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'preparing': return <span className="text-[#F59E0B] font-bold text-xs bg-[#F59E0B]/10 px-2 py-1 rounded-full">Preparing</span>;
      case 'new': 
      case 'pending': return <span className="text-[#DC2626] font-bold text-xs bg-[#DC2626]/10 px-2 py-1 rounded-full">New</span>;
      case 'out for delivery': return <span className="text-[#3B82F6] font-bold text-xs bg-[#3B82F6]/10 px-2 py-1 rounded-full">Out for Delivery</span>;
      case 'accepted': return <span className="text-[#10B981] font-bold text-xs bg-[#10B981]/10 px-2 py-1 rounded-full">Accepted</span>;
      case 'ready': return <span className="text-[#8B5CF6] font-bold text-xs bg-[#8B5CF6]/10 px-2 py-1 rounded-full">Ready</span>;
      case 'confirmed': return <span className="text-[#10B981] font-bold text-xs">Confirmed</span>;
      case 'contacted': return <span className="text-[#3B82F6] font-bold text-xs">Contacted</span>;
      case 'quotation sent': return <span className="text-[#F59E0B] font-bold text-xs">Quotation Sent</span>;
      default: return <span className="text-[#6b7280] font-bold text-xs capitalize">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Welcome back, {user?.name || 'Admin'}! 👋</h1>
          <p className="text-sm text-[#6b7280] mt-1">Here's what's happening with {restaurant?.name || 'Lassi Lounge'} today.</p>
        </div>
        <div className="bg-white border border-[#e5e7eb] rounded-lg px-4 py-2 text-sm text-[#374151] shadow-sm flex items-center gap-2">
          <svg className="w-4 h-4 text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          <svg className="w-4 h-4 text-[#9ca3af] ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <GlobalStatCard label="Today's Revenue" value={`$${stats?.todayRevenue?.toFixed(2) || '4,256.80'}`} icon={DollarSign} color="yellow" trendValue={18.4} />
        <GlobalStatCard label="Today's Orders" value={stats?.todayOrders || '156'} icon={ShoppingBag} color="pink" trendValue={14.7} />
        <GlobalStatCard label="Average Order Value" value={`$${(analyticsData?.summary?.aov || 0).toFixed(2)}`} icon={ShoppingCart} color="blue" />
        <GlobalStatCard label="Pending Orders" value={stats?.activeOrders || '0'} icon={Hourglass} color="orange" trendValue={4} trendLabel="vs yesterday" />
        <GlobalStatCard label="New Customers" value={analyticsData?.summary?.newCustomers || 0} icon={Users} color="green" />
        <GlobalStatCard label="Loyalty Members" value={analyticsData?.summary?.totalCustomers || 0} icon={Crown} color="purple" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Overview Line Chart */}
        <div className="bg-white p-5 rounded-[20px] shadow-sm border border-[#f3f4f6] lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-[#1f2937] flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#fef2f2] flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-[#ef4444]" />
              </div>
              Sales Overview
            </h3>
            <div className="flex items-center gap-4 text-sm font-medium">
              <div className="flex items-center gap-1.5"><div className="w-3 h-1 bg-[#8b0000] rounded-full"></div> Revenue ($)</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-1 bg-[#fefce8]0 rounded-full"></div> Orders</div>
              <select className="ml-4 bg-[#f9fafb] border border-[#e5e7eb] text-[#4b5563] rounded-lg px-2 py-1 outline-none text-xs">
                <option>This Week</option>
              </select>
            </div>
          </div>
          <div className="h-[250px] w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} tickFormatter={(val) => `${val / 1000}K`} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8b0000" strokeWidth={3} dot={{ r: 4, fill: '#8b0000', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#EAB308" strokeWidth={3} dot={{ r: 4, fill: '#EAB308', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Order Status Donut */}
        <div className="bg-white p-5 rounded-[20px] shadow-sm border border-[#f3f4f6] flex flex-col">
          <h3 className="text-base font-bold text-[#1f2937] flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-[#fef2f2] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-[#ef4444]" />
            </div>
            Order Status
          </h3>
          <div className="flex-1 flex items-center">
            <div className="w-1/2 h-[200px] relative">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={displayOrderStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                      {displayOrderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-[#111827]">{orders?.length || 0}</span>
                <span className="text-[10px] text-[#6b7280] font-medium">Total Orders</span>
              </div>
            </div>
            <div className="w-1/2 pl-4 space-y-2">
              {orderStatusData.map((stat, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }}></div>
                    <span className="text-[#374151]">{stat.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[#111827] font-bold">{stat.value}</span>
                    <span className="text-[#9ca3af] w-6 text-right">{(stat.value / Math.max(orders?.length || 1, 1) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid for Top Items & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Top Selling Items */}
        <div className="bg-white p-5 rounded-[20px] shadow-sm border border-[#f3f4f6] lg:col-span-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#1f2937]">Top Selling Items</h3>
            <select className="bg-[#f9fafb] border border-[#e5e7eb] text-[#4b5563] rounded-lg px-2 py-1 outline-none text-xs">
              <option>Today</option>
            </select>
          </div>
          <div className="space-y-4 flex-1">
            {topItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border border-[#e5e7eb] flex items-center justify-center text-[10px] font-bold text-[#6b7280]">{item.rank}</div>
                  <img src={item.img} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                  <div>
                    <h4 className="text-[13px] font-bold text-[#1f2937] group-hover:text-brand-cyan transition-colors">{item.name}</h4>
                    <p className="text-[11px] text-[#6b7280]">{item.orders} Orders</p>
                  </div>
                </div>
                <span className="text-[13px] font-bold text-[#111827]">${item.revenue.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Tables */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Recent Orders */}
          <div className="bg-white p-5 rounded-[20px] shadow-sm border border-[#f3f4f6] col-span-3 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#1f2937] flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#ef4444]" /> Recent Orders
              </h3>
              <button onClick={() => onViewAll && onViewAll('orders')} className="text-[11px] font-bold text-[#6b7280] bg-[#f9fafb] px-3 py-1 rounded-full border border-[#e5e7eb] hover:bg-[#f3f4f6]">View All</button>
            </div>
            <div className="space-y-4">
              {/* Real Data rendering */}
              {(orders || []).slice(0, 5).map((o, i) => (
                <div key={i} className="flex items-center justify-between border-b border-[#f9fafb] pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-[#fef2f2] rounded text-[#ef4444] mt-0.5"><ShoppingBag className="w-3.5 h-3.5" /></div>
                    <div>
                      <p className="text-[11px] font-bold text-[#111827]">#{o.orderNumber || o._id?.toString().slice(-6)} <span className="text-[#9ca3af] font-normal ml-1">{new Date(o.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></p>
                      <p className="text-[10px] text-[#6b7280]">{o.customerName || 'Guest'}</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#6b7280] w-16 hidden sm:block">{o.type || 'Order'}<br/>{o.items?.length || 0} Items</div>
                  <div className="text-[11px] font-bold text-[#111827] w-12">${o.total?.toFixed(2) || '0.00'}</div>
                  <div className="w-20 text-right">{getStatusBadge(o.status)}</div>
                  <button className="text-[#9ca3af] hover:text-[#4b5563]"><MoreVertical className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Reservations Today */}
          <div className="bg-white p-5 rounded-[20px] shadow-sm border border-[#f3f4f6] col-span-3 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#1f2937] flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#ef4444]" /> Reservations Today
              </h3>
              <button onClick={() => onViewAll && onViewAll('reservations')} className="text-[11px] font-bold text-[#6b7280] bg-[#f9fafb] px-3 py-1 rounded-full border border-[#e5e7eb] hover:bg-[#f3f4f6]">View All</button>
            </div>
            <div className="space-y-4">
              {(reservations || []).filter(r => new Date(r.date).toDateString() === new Date().toDateString()).slice(0, 5).map((r, i) => (
                <div key={i} className="flex items-center justify-between border-b border-[#f9fafb] pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 border border-[#fee2e2] rounded text-[#ef4444] text-[10px] font-bold flex flex-col items-center justify-center leading-none">
                      <span className="text-[8px] text-[#9ca3af]">MAY</span>
                      <span>21</span>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#111827]">{r.time}</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#374151] w-24 truncate">{r.customerName || 'Guest'}</div>
                  <div className="text-[10px] text-[#6b7280] w-16">{r.table || 'Table'}<br/>{r.partySize || r.guests} People</div>
                  <div className="w-16 text-right">{getStatusBadge(r.status)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Catering Enquiries */}
          <div className="bg-white p-5 rounded-[20px] shadow-sm border border-[#f3f4f6] col-span-3 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#1f2937] flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#ef4444]" /> Catering Enquiries
              </h3>
              <button onClick={() => onViewAll && onViewAll('catering')} className="text-[11px] font-bold text-[#6b7280] bg-[#f9fafb] px-3 py-1 rounded-full border border-[#e5e7eb] hover:bg-[#f3f4f6]">View All</button>
            </div>
            <div className="space-y-4">
              {(cateringInquiries || []).slice(0, 5).map((c, i) => (
                <div key={i} className="flex items-center justify-between border-b border-[#f9fafb] pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-[#f9fafb] border border-[#f3f4f6] rounded-full text-[#9ca3af] mt-0.5"><Users className="w-3.5 h-3.5" /></div>
                    <div>
                      <p className="text-[11px] font-bold text-[#111827]">{c.customerName || c.name || 'Guest'}</p>
                      <p className="text-[9px] text-[#9ca3af]">{c.guests || c.numberOfGuests || 0} Guests</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#6b7280] w-24 hidden sm:block truncate">{c.eventType || c.type}</div>
                  <div className="text-[10px] text-[#6b7280] w-16">{new Date(c.eventDate || c.date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  <div className="w-20 text-right">{getStatusBadge(c.status)}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-bold text-[#1f2937] mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { icon: ShoppingBag, label: 'Create Order', color: 'text-[#ef4444]', bg: 'bg-[#fef2f2]' },
            { icon: ShoppingCart, label: 'Add Food Item', color: 'text-[#f97316]', bg: 'bg-[#fff7ed]' },
            { icon: DollarSign, label: 'Create Coupon', color: 'text-[#22c55e]', bg: 'bg-[#f0fdf4]' },
            { icon: Users, label: 'Add Reservation', color: 'text-[#3b82f6]', bg: 'bg-[#eff6ff]' },
            { icon: Crown, label: 'Add Catering Enquiry', color: 'text-[#a855f7]', bg: 'bg-[#faf5ff]' },
            { icon: BarChart3, label: 'View Reports', color: 'text-[#ca8a04]', bg: 'bg-[#fefce8]' },
            { icon: Settings, label: 'Website Settings', color: 'text-[#4b5563]', bg: 'bg-[#f3f4f6]' },
          ].map((action, i) => (
            <button key={i} className="flex items-center gap-3 bg-white border border-[#e5e7eb] px-4 py-2.5 rounded-xl hover:border-brand-cyan hover:shadow-sm transition-all group">
              <div className={`p-1.5 rounded-lg ${action.bg}`}>
                <action.icon className={`w-4 h-4 ${action.color}`} />
              </div>
              <span className="text-[13px] font-bold text-[#374151] group-hover:text-[#111827]">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
