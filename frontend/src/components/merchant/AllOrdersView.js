import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Filter, ChevronLeft, ChevronRight, 
  MoreVertical, ShoppingCart, Calendar, CalendarCheck, 
  ClipboardList, ShoppingBag, Bike, CheckCircle, 
  MapPin, Bell, ChevronDown, Download, Eye, Truck, UtensilsCrossed, X, Printer, PackageX, RefreshCcw, Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/ui';
import { api } from '@/lib/api';
import { useMerchantContext } from '@/context/MerchantContext';
import { formatDate, formatTime } from '@/lib/formatters';
import StatCard from './StatCard';
import PremiumDatePicker from '@/components/ui/PremiumDatePicker';

export default function AllOrdersView({ orders = [], onRowClick }) {
  const router = useRouter();
  const { restaurant } = useMerchantContext();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [orderTypeFilter, setOrderTypeFilter] = useState('All Types');
  const [paymentFilter, setPaymentFilter] = useState('All Payment Status');
  const [activeTab, setActiveTab] = useState('All');
  
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // ─── LOAD MORE STATE ───
  const ITEMS_PER_LOAD = 15;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // reset list on filter change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
    setSelectedOrders([]);
  }, [searchQuery, dateRange, statusFilter, orderTypeFilter, paymentFilter, activeTab]);

  // ---------------------------------------------------------
  // 1. STATS CALCULATIONS (Strictly real data)
  // ---------------------------------------------------------
  const stats = useMemo(() => {
    let newOrders = 0, preparing = 0, ready = 0, outForDelivery = 0, completed = 0;
    
    orders.forEach(o => {
      const s = (o.status || '').toLowerCase();
      if (['new', 'pending'].includes(s)) newOrders++;
      else if (s === 'preparing') preparing++;
      else if (s === 'ready') ready++;
      else if (s === 'out_for_delivery' || (s === 'picked_up' && o.orderType === 'delivery')) outForDelivery++;
      else if (['completed', 'delivered'].includes(s) || (s === 'picked_up' && o.orderType !== 'delivery')) completed++;
    });

    return { total: orders.length, newOrders, preparing, ready, outForDelivery, completed };
  }, [orders]);

  // tabs Counts
  const tabCounts = useMemo(() => {
    let dineIn = 0, pickup = 0, delivery = 0;
    orders.forEach(o => {
      const type = (o.orderType || o.type || '').toLowerCase();
      if (type === 'dine_in') dineIn++;
      else if (type === 'pickup') pickup++;
      else delivery++;
    });
    return { all: orders.length, dineIn, pickup, delivery };
  }, [orders]);

  // ---------------------------------------------------------
  // 2. FILTERING LOGIC
  // ---------------------------------------------------------
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // search
      const searchStr = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        o._id?.toLowerCase().includes(searchStr) || 
        o.orderNumber?.toLowerCase().includes(searchStr) ||
        o.customerName?.toLowerCase().includes(searchStr) ||
        o.customerPhone?.toLowerCase().includes(searchStr);

      // status
      const matchesStatus = statusFilter === 'All Status' || (o.status || '').toLowerCase() === statusFilter.toLowerCase();
      
      // order Type Dropdown & Tab
      const oType = (o.orderType || o.type || 'delivery').toLowerCase();
      
      let matchesDropdownType = true;
      if (orderTypeFilter === 'Delivery') matchesDropdownType = oType === 'delivery';
      else if (orderTypeFilter === 'Takeaway') matchesDropdownType = oType === 'pickup';
      else if (orderTypeFilter === 'Dine-in') matchesDropdownType = oType === 'dine_in';

      let matchesTabType = true;
      if (activeTab === 'Delivery') matchesTabType = oType === 'delivery';
      else if (activeTab === 'Takeaway') matchesTabType = oType === 'pickup';
      else if (activeTab === 'Dine-in') matchesTabType = oType === 'dine_in';

      // payment Type
      const pType = (o.paymentMethod || '').toLowerCase();
      const pStatus = (o.paymentStatus || '').toLowerCase();
      let matchesPayment = true;
      if (paymentFilter === 'Paid') matchesPayment = pStatus === 'paid' || pStatus === 'completed';
      else if (paymentFilter === 'Unpaid') matchesPayment = pStatus === 'pending' || pStatus === 'unpaid';

      // date Range
      let matchesDate = true;
      if (dateRange) {
        const orderDateStr = new Date(o.createdAt).toISOString().split('T')[0];
        matchesDate = orderDateStr === dateRange;
      }

      return matchesSearch && matchesStatus && matchesDropdownType && matchesTabType && matchesPayment && matchesDate;
    }).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders, searchQuery, statusFilter, orderTypeFilter, paymentFilter, activeTab, dateRange]);

  // ---------------------------------------------------------
  // 3. LOAD MORE LOGIC
  // ---------------------------------------------------------
  const displayedOrders = useMemo(() => {
    return filteredOrders.slice(0, visibleCount);
  }, [filteredOrders, visibleCount]);

  const hasMoreItems = visibleCount < filteredOrders.length;

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + ITEMS_PER_LOAD);
      setIsLoadingMore(false);
    }, 400); // Smooth premium delay
  };

  const handleExportCSV = () => {
    const ordersToExport = selectedOrders.length > 0 
      ? orders.filter(o => selectedOrders.includes(o._id)) 
      : filteredOrders;
      
    if (!ordersToExport.length) return;
    const headers = ['Order ID', 'Customer Name', 'Phone', 'Order Type', 'Status', 'Date', 'Amount', 'Payment Method'];
    const csvContent = [
      headers.join(','),
      ...ordersToExport.map(o => [
        o._id, `"${o.customerName || 'Guest'}"`, `"${o.customerPhone || ''}"`,
        o.type || o.orderType || 'delivery', o.status || 'new',
        new Date(o.createdAt).toLocaleString(), o.total || 0, o.paymentMethod || 'cash'
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrders(displayedOrders.map(o => o._id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (id) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(orderId => orderId !== id) : [...prev, id]
    );
  };

  const handleBulkRefund = async () => {
    const validOrders = orders.filter(o => selectedOrders.includes(o._id) && o.paymentStatus !== 'refunded' && !o.refunded);
    const skipped = selectedOrders.length - validOrders.length;
    
    if (validOrders.length === 0) {
      showToast(`All ${selectedOrders.length} selected orders are already refunded.`, 'error');
      return;
    }

    if (skipped > 0) {
      showToast(`${skipped} orders skipped because they are already refunded.`, 'info');
    }

    setIsProcessing(true);
    let successCount = 0;
    for (const order of validOrders) {
      try {
        await api.post(`/api/orders/${order._id}/refund`, { reason: 'Bulk refund from dashboard' });
        successCount++;
      } catch (err) {
        showToast(`Failed to refund #${order.orderNumber || order._id.slice(-6)}: ${err.message}`, 'error');
      }
    }
    setIsProcessing(false);
    if (successCount > 0) {
      showToast(`Successfully refunded ${successCount} orders.`, 'success');
      setSelectedOrders([]);
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  // UI Helpers
  const getTypeBadge = (type) => {
    const t = (type || 'delivery').toLowerCase();
    if (t === 'pickup') return <span className="flex items-center gap-1 text-[#ea580c] text-xs font-bold"><ShoppingBag className="w-3.5 h-3.5"/> Takeaway</span>;
    if (t === 'dine_in') return <span className="flex items-center gap-1 text-[#9333ea] text-xs font-bold"><UtensilsCrossed className="w-3.5 h-3.5"/> Dine-in</span>;
    return <span className="flex items-center gap-1 text-[#16a34a] text-xs font-bold"><Truck className="w-3.5 h-3.5"/> Delivery</span>;
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'preparing': return <span className="text-[#ea580c] font-bold text-xs border border-[#ffedd5] bg-[#fff7ed] px-2 py-1 rounded">Preparing</span>;
      case 'new': 
      case 'pending': return <span className="text-[#dc2626] font-bold text-xs border border-[#fee2e2] bg-[#fef2f2] px-2 py-1 rounded">New</span>;
      case 'out for delivery':
      case 'out_for_delivery': return <span className="text-[#16a34a] font-bold text-xs border border-[#bbf7d0] bg-[#f0fdf4] px-2 py-1 rounded">Out for Delivery</span>;
      case 'accepted': return <span className="text-[#2563eb] font-bold text-xs border border-[#bfdbfe] bg-[#eff6ff] px-2 py-1 rounded">Accepted</span>;
      case 'ready': return <span className="text-[#3b82f6] font-bold text-xs border border-[#bfdbfe] bg-[#eff6ff] px-2 py-1 rounded">Ready</span>;
      case 'delivered':
      case 'picked_up':
      case 'completed': return <span className="text-[#16a34a] font-bold text-xs border border-[#bbf7d0] bg-[#f0fdf4] px-2 py-1 rounded">Completed</span>;
      case 'cancelled': return <span className="text-[#6b7280] font-bold text-xs border border-[#e5e7eb] bg-[#f9fafb] px-2 py-1 rounded">Cancelled</span>;
      case 'failed': return <span className="text-[#b91c1c] font-bold text-xs border border-[#fecaca] bg-[#fef2f2] px-2 py-1 rounded">Failed</span>;
      default: return <span className="text-[#6b7280] font-bold text-xs border border-[#e5e7eb] bg-[#f3f4f6] px-2 py-1 rounded capitalize">{status}</span>;
    }
  };

  const getPaymentBadge = (method, pStatus, order) => {
    const ps = (pStatus || '').toLowerCase();
    const isManualRefund = order?.refundReason && ['merchant', 'bulk refund', 'refund processed'].some(r => order.refundReason.toLowerCase().includes(r));
    const isAutoRefund = order?.refunded && ps === 'refunded' && !isManualRefund;
    if (ps === 'refunded') return (
      <div className="flex flex-col gap-0.5">
        <span className="text-[#dc2626] font-bold text-xs bg-[#fef2f2] px-2 py-0.5 rounded border border-[#fecaca]">Refunded</span>
        {isAutoRefund && <span className="text-[#d97706] font-bold text-[9px] bg-[#fffbeb] px-1.5 py-0.5 rounded inline-block w-max">⚡ Auto</span>}
      </div>
    );
    if (ps === 'partially_refunded') return <span className="text-[#d97706] font-bold text-xs bg-[#fffbeb] px-2 py-0.5 rounded border border-[#fde68a]">Partial Refund</span>;
    if (ps === 'failed') return <span className="text-[#dc2626] font-bold text-xs bg-[#fee2e2] px-2 py-0.5 rounded border border-[#fecaca]">⚠️ Failed</span>;
    const isOnline = ['credit_card', 'debit_card', 'apple_pay', 'google_pay', 'stripe_online'].includes(method?.toLowerCase());
    if (ps === 'paid') return <span className="text-[#16a34a] font-bold text-xs bg-[#dcfce7] px-2 py-0.5 rounded border border-[#bbf7d0]">Paid</span>;
    if (isOnline) return <span className="text-[#2563eb] font-bold text-xs bg-[#dbeafe] px-2 py-0.5 rounded border border-[#bfdbfe]">Online</span>;
    if (method?.toLowerCase() === 'payment_link') return <span className="text-[#8b0000] font-bold text-xs bg-[#fef2f2] px-2 py-0.5 rounded border border-[#fecaca]">{ps === 'paid' ? 'Link Paid' : 'Link Pending'}</span>;
    if (method?.toLowerCase() === 'cash' || (ps === 'pending' && !isOnline)) return <span className="text-[#ea580c] font-bold text-xs bg-[#ffedd5] px-2 py-0.5 rounded border border-[#fed7aa]">Cash / COD</span>;
    return <span className="text-[#6b7280] font-bold text-xs bg-[#f3f4f6] px-2 py-0.5 rounded capitalize border border-[#e5e7eb]">{pStatus || 'Unknown'}</span>;
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header aligned exactly to image */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#111827]">Orders</h1>
          <p className="text-sm text-[#6b7280] mt-1">Manage and track all restaurant orders in one place.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <button onClick={() => router.push('/merchant/pos')} className="flex items-center gap-1.5 bg-[#8b0000] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#7f0000] transition-colors shadow-sm">
            <span className="text-[14px] leading-none">+</span> New Order
          </button>
        </div>
      </div>

      {/* 6 Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[{
          label: 'Total Orders', value: stats.total, icon: ShoppingCart, color: 'text-[#ea580c]', bg: 'bg-[#ffedd5]'
        }, {
          label: 'New Orders', value: stats.newOrders, icon: CalendarCheck, color: 'text-[#991b1b]', bg: 'bg-[#fef2f2]'
        }, {
          label: 'Preparing', value: stats.preparing, icon: ClipboardList, color: 'text-[#9333ea]', bg: 'bg-[#faf5ff]'
        }, {
          label: 'Ready', value: stats.ready, icon: ShoppingBag, color: 'text-[#3b82f6]', bg: 'bg-[#eff6ff]'
        }, {
          label: 'Out for Delivery', value: stats.outForDelivery, icon: Bike, color: 'text-[#16a34a]', bg: 'bg-[#dcfce7]'
        }, {
          label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-[#d97706]', bg: 'bg-[#fef9c3]'
        }].map((stat, i) => (
          <StatCard 
            key={i}
            title={stat.label}
            value={stat.value}
            icon={stat.icon}
            iconColor={stat.color}
            iconBg={stat.bg}
          />
        ))}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[20px] shadow-sm border border-[#e5e7eb] overflow-hidden flex flex-col">
        
        {/* Filters Row */}
        <div className="p-5 border-b border-[#f3f4f6] flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 min-w-[250px] max-w-sm">
            <Search className="w-4 h-4 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search by Order ID, Customer, Phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full !pl-10 py-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] text-xs font-medium text-[#111827] outline-none focus:border-[#991b1b] transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex flex-col w-[150px]">
              <label className="text-xs font-bold text-[#6b7280] mb-1">Date Range</label>
              <PremiumDatePicker 
                selected={dateRange ? new Date(dateRange + 'T00:00:00') : null}
                onChange={(d) => setDateRange(d ? d.toISOString().split('T')[0] : '')}
                className="!bg-[#f9fafb] hover:!bg-white !py-[7.5px] !text-xs !font-bold !text-[#111827] cursor-pointer w-full"
                placeholderText="All Dates"
                isClearable={true}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-bold text-[#6b7280] mb-1">Order Type</label>
              <select 
                value={orderTypeFilter} onChange={(e) => setOrderTypeFilter(e.target.value)}
                className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2 text-xs font-bold text-[#111827] outline-none pr-6 cursor-pointer hover:bg-white transition-colors"
              >
                <option>All Types</option>
                <option>Delivery</option>
                <option>Takeaway</option>
                <option>Dine-in</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-bold text-[#6b7280] mb-1">Order Status</label>
              <select 
                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2 text-xs font-bold text-[#111827] outline-none pr-6 cursor-pointer hover:bg-white transition-colors"
              >
                <option>All Status</option>
                <option>New</option>
                <option>Accepted</option>
                <option>Preparing</option>
                <option>Ready</option>
                <option>Out for Delivery</option>
                <option>Completed</option>
                <option>Cancelled</option>
                <option>Failed</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-bold text-[#6b7280] mb-1">Payment Status</label>
              <select 
                value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}
                className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2 text-xs font-bold text-[#111827] outline-none pr-6 cursor-pointer hover:bg-white transition-colors"
              >
                <option>All Payment Status</option>
                <option>Paid</option>
                <option>Unpaid</option>
              </select>
            </div>

            <div className="flex items-end h-[50px]">
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setDateRange('');
                  setStatusFilter('All Status');
                  setOrderTypeFilter('All Types');
                  setPaymentFilter('All Payment Status');
                  setActiveTab('All');
                }}
                className="bg-white border border-[#e5e7eb] rounded-lg px-4 py-2 text-xs font-bold text-[#374151] flex items-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Clear Filters
              </button>
            </div>
            <div className="flex items-end h-[50px]">
              <button onClick={handleExportCSV} className="bg-white border border-[#e5e7eb] rounded-lg px-4 py-2 text-xs font-bold text-[#374151] flex items-center gap-2 hover:bg-gray-50 transition-colors">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Row */}
        <div className="px-5 border-b border-[#f3f4f6] flex items-center justify-between overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-8 min-w-max">
            {[
              { id: 'All', label: `All Orders (${tabCounts.all})` },
              { id: 'Dine-in', label: `Dine-in (${tabCounts.dineIn})` },
              { id: 'Takeaway', label: `Takeaway (${tabCounts.pickup})` },
              { id: 'Delivery', label: `Delivery (${tabCounts.delivery})` }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 text-xs font-extrabold transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-[#991b1b] text-[#991b1b]' : 'border-transparent text-[#6b7280] hover:text-[#374151]'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar relative">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead className="bg-[#f9fafb] sticky top-0 z-10 border-b border-[#e5e7eb]">
              <tr>
                <th className="px-4 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedOrders.length === displayedOrders.length && displayedOrders.length > 0}
                    onChange={handleSelectAll}
                    style={{ backgroundColor: 'white' }}
                    className="w-3.5 h-3.5 rounded !bg-white border-[#d1d5db] text-[#991b1b] focus:ring-[#991b1b] cursor-pointer" 
                  />
                </th>
                <th className="px-4 py-4 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider">Order ID</th>
                <th className="px-4 py-4 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider">Customer</th>
                <th className="px-4 py-4 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider">Type</th>
                <th className="px-4 py-4 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider">Status</th>
                <th className="px-4 py-4 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider">Order Time</th>
                <th className="px-4 py-4 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider">Items</th>
                <th className="px-4 py-4 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider">Amount</th>
                <th className="px-4 py-4 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider">Payment</th>
                <th className="px-4 py-4 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider">Delivery / Table</th>
                <th className="px-4 py-4 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-6 py-12">
                    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-[#e5e7eb] rounded-xl bg-[#f9fafb]">
                      <PackageX className="w-12 h-12 text-[#d1d5db] mb-3" />
                      <p className="text-sm font-bold text-[#9ca3af]">No orders found</p>
                      <p className="text-xs text-[#9ca3af] mt-1">Try adjusting your filters, search terms, or date range.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedOrders.map((order, idx) => {
                  const isSelected = selectedOrders.includes(order._id);
                  return (
                    <tr 
                      key={order._id || idx} 
                      className={`transition-colors ${isSelected ? 'bg-red-50' : 'hover:bg-gray-50/50'} ${
                        order.status === 'failed' ? 'bg-[#fff5f5]'
                        : order.refunded ? 'bg-[#fffdf0]'
                        : ''
                      }`}
                    >
                      <td className="px-4 py-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => handleSelectOrder(order._id)}
                          style={{ backgroundColor: 'white' }}
                          className="w-3.5 h-3.5 rounded !bg-white border-[#d1d5db] text-[#991b1b] focus:ring-[#991b1b] cursor-pointer" 
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-bold text-[#111827]">#{order.orderNumber || order._id?.toString().slice(-6) || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#f3f4f6] flex items-center justify-center text-xs font-bold text-[#6b7280]">
                            {(order.customerName || 'G')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[#111827]">{order.customerName || 'Guest'}</div>
                            <div className="text-xs text-[#6b7280]">{order.customerPhone || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {getTypeBadge(order.orderType || order.type)}
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-bold text-[#111827]">{formatTime(order.createdAt, restaurant?.timeFormat, restaurant?.timezone)}</div>
                        <div className="text-[11px] text-[#6b7280]">{formatDate(order.createdAt, restaurant?.dateFormat, restaurant?.timezone)}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs font-bold text-[#374151]">{order.items?.length || 0} Items</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-black text-[#111827]">${order.total?.toFixed(2) || '0.00'}</div>
                      </td>
                      <td className="px-4 py-4">
                        {getPaymentBadge(order.paymentMethod, order.paymentStatus, order)}
                      </td>
                      <td className="px-4 py-4">
                        {(order.orderType || order.type) === 'delivery' ? (
                          <>
                            <div className="text-xs font-bold text-[#374151]">Rider: {order.courierName || 'Assigning'}</div>
                            <div className="text-xs font-bold text-[#16a34a]">{order.status === 'out_for_delivery' ? 'ETA: 15 mins' : (order.status === 'delivered' ? 'Delivered' : '')}</div>
                          </>
                        ) : (order.orderType || order.type) === 'dine_in' ? (
                          <>
                            <div className="text-xs font-bold text-[#374151]">Table {order.tableNumber || '-'}</div>
                            <div className="text-xs text-[#6b7280]">{order.guestCount || 0} Guests</div>
                          </>
                        ) : (
                          <div className="text-xs font-bold text-[#374151]">-</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <button onClick={() => onRowClick && onRowClick(order._id)} className="w-8 h-8 rounded-md border border-[#e5e7eb] bg-white flex items-center justify-center text-[#6b7280] hover:text-[#991b1b] hover:border-[#991b1b] hover:bg-red-50 transition-colors shadow-sm">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── LOAD MORE BUTTON ─── */}
        <div className="px-6 py-4 border-t border-[#f3f4f6] flex flex-col sm:flex-row items-center justify-between bg-white rounded-b-[20px] gap-4">
          <span className="text-xs font-semibold text-[#6b7280]">
            Showing <strong className="text-[#374151]">{displayedOrders.length}</strong> of <strong className="text-[#374151]">{filteredOrders.length}</strong> orders
          </span>

          {hasMoreItems && (
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="flex items-center justify-center gap-2 w-full sm:w-[160px] h-[36px] bg-white border border-[#e5e7eb] text-[#374151] rounded-lg text-[13px] font-bold hover:bg-[#f9fafb] hover:text-[#8B0000] hover:border-[#8B0000] transition-all shadow-sm"
            >
              {isLoadingMore ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</> : 'Load More'}
            </button>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selectedOrders.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#111827] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#374151] flex items-center justify-center text-xs font-bold text-white">
                {selectedOrders.length}
              </span>
              <span className="text-sm font-bold">Orders Selected</span>
            </div>
            <div className="h-4 w-px bg-[#374151]"></div>
            <div className="flex items-center gap-2">
              <button onClick={() => { handleExportCSV(); setSelectedOrders([]); showToast('Orders exported to CSV', 'success'); }} className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#1f2937] text-sm font-bold hover:bg-[#374151] transition-colors border border-[#374151]">
                <Download className="w-3.5 h-3.5" /> Export Selected
              </button>
              <button 
                onClick={handleBulkRefund} 
                disabled={isProcessing}
                className={`px-4 py-1.5 rounded-full text-sm font-bold text-white transition-colors ${isProcessing ? 'bg-gray-500 cursor-not-allowed opacity-50' : 'bg-[#7f1d1d] hover:bg-[#991b1b]'}`}
              >
                {isProcessing ? 'Processing...' : 'Issue Refund'}
              </button>
              <button onClick={() => setSelectedOrders([])} className="p-1.5 rounded-full hover:bg-[#374151] text-gray-400 hover:text-white transition-colors ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}