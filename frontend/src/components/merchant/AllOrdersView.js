import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Filter, ChevronLeft, ChevronRight, 
  MoreVertical, ShoppingCart, Calendar, CalendarCheck, 
  ClipboardList, ShoppingBag, Bike, CheckCircle, 
  MapPin, Bell, ChevronDown, Download, Eye, Truck, UtensilsCrossed, X, Printer, PackageX, RefreshCcw, Loader2, Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/ui';
import { api } from '@/lib/api';
import { useMerchantContext } from '@/context/MerchantContext';
import { formatDate, formatTime } from '@/lib/formatters';
import StatCard from './StatCard';
import TableScrollContainer from './common/TableScrollContainer';
import PremiumDatePicker from '@/components/ui/PremiumDatePicker';

export default function AllOrdersView({ orders = [], stats: serverStats = null, pagination = null, onRowClick }) {
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

  // Load More State
  const ITEMS_PER_LOAD = 15;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
    setSelectedOrders([]);
  }, [searchQuery, dateRange, statusFilter, orderTypeFilter, paymentFilter, activeTab]);

  // 1. STATS CALCULATIONS (Strictly real data synchronized with database and mobile admin)
  const stats = useMemo(() => {
    const hasFilter = searchQuery || dateRange || statusFilter !== 'All Status' || orderTypeFilter !== 'All Types' || paymentFilter !== 'All Payment Status' || activeTab !== 'All';
    if (!hasFilter && serverStats && typeof serverStats.total === 'number' && serverStats.total > 0) {
      return {
        total: serverStats.total,
        newOrders: serverStats.new ?? 0,
        preparing: serverStats.preparing ?? 0,
        ready: serverStats.ready ?? 0,
        outForDelivery: serverStats.picked_up ?? 0,
        completed: serverStats.completed ?? 0,
        cancelled: serverStats.cancelled ?? 0
      };
    }

    let newOrders = 0, preparing = 0, ready = 0, outForDelivery = 0, completed = 0;
    
    orders.forEach(o => {
      const s = (o.status || '').toLowerCase();
      if (['new', 'pending'].includes(s)) newOrders++;
      else if (s === 'preparing') preparing++;
      else if (s === 'ready') ready++;
      else if (s === 'out_for_delivery' || (s === 'picked_up' && o.orderType === 'delivery')) outForDelivery++;
      else if (['completed', 'delivered'].includes(s) || (s === 'picked_up' && o.orderType !== 'delivery')) completed++;
    });

    const totalCount = (!hasFilter && (serverStats?.total || pagination?.total)) 
      ? (serverStats?.total || pagination?.total) 
      : orders.length;
    return { total: totalCount, newOrders, preparing, ready, outForDelivery, completed };
  }, [orders, serverStats, pagination, searchQuery, dateRange, statusFilter, orderTypeFilter, paymentFilter, activeTab]);

  // Tabs Counts
  const tabCounts = useMemo(() => {
    if (!searchQuery && !dateRange && statusFilter === 'All Status' && orderTypeFilter === 'All Types' && paymentFilter === 'All Payment Status') {
      if (serverStats && typeof serverStats.total === 'number' && serverStats.total > 0) {
        return {
          all: serverStats.total,
          dineIn: serverStats.dineIn ?? 0,
          pickup: serverStats.pickup ?? 0,
          delivery: serverStats.delivery ?? 0
        };
      }
      if (pagination && typeof pagination.total === 'number' && pagination.total > 0) {
        return {
          all: pagination.total,
          dineIn: orders.filter(o => (o.orderType || o.type || '').toLowerCase() === 'dine_in').length,
          pickup: orders.filter(o => (o.orderType || o.type || '').toLowerCase() === 'pickup').length,
          delivery: orders.filter(o => (o.orderType || o.type || '').toLowerCase() === 'delivery').length,
        };
      }
    }
    let dineIn = 0, pickup = 0, delivery = 0;
    orders.forEach(o => {
      const type = (o.orderType || o.type || '').toLowerCase();
      if (type === 'dine_in') dineIn++;
      else if (type === 'pickup') pickup++;
      else if (type === 'delivery') delivery++;
    });
    return { all: orders.length, dineIn, pickup, delivery };
  }, [orders, serverStats, pagination, searchQuery, dateRange, statusFilter, orderTypeFilter, paymentFilter]);

  // 2. FILTERING
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const orderNum = (order.orderNumber || order._id || '').toString().toLowerCase();
        const custName = (order.customerName || '').toLowerCase();
        const custPhone = (order.customerPhone || '').toLowerCase();
        if (!orderNum.includes(q) && !custName.includes(q) && !custPhone.includes(q)) return false;
      }

      if (dateRange) {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        if (orderDate !== dateRange) return false;
      }

      if (statusFilter !== 'All Status') {
        const s = (order.status || '').toLowerCase();
        const filterVal = statusFilter.toLowerCase();
        if (filterVal === 'out for delivery' && s !== 'out_for_delivery' && s !== 'out for delivery') return false;
        else if (filterVal !== 'out for delivery' && s !== filterVal) return false;
      }

      if (orderTypeFilter !== 'All Types') {
        const t = (order.orderType || order.type || '').toLowerCase();
        if (t !== orderTypeFilter.toLowerCase()) return false;
      }

      if (paymentFilter !== 'All Payment Status') {
        const ps = (order.paymentStatus || '').toLowerCase();
        if (paymentFilter === 'Paid' && ps !== 'paid') return false;
        if (paymentFilter === 'Unpaid' && ps === 'paid') return false;
      }

      if (activeTab !== 'All') {
        const t = (order.orderType || order.type || '').toLowerCase();
        if (activeTab === 'Dine-in' && t !== 'dine_in') return false;
        if (activeTab === 'Takeaway' && t !== 'pickup') return false;
        if (activeTab === 'Delivery' && t !== 'delivery') return false;
      }

      return true;
    });
  }, [orders, searchQuery, dateRange, statusFilter, orderTypeFilter, paymentFilter, activeTab]);

  // Sliced for pagination
  const displayedOrders = useMemo(() => {
    return filteredOrders.slice(0, visibleCount);
  }, [filteredOrders, visibleCount]);

  const hasMoreItems = visibleCount < filteredOrders.length;

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + ITEMS_PER_LOAD);
      setIsLoadingMore(false);
    }, 200);
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
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    const listToExport = selectedOrders.length > 0 
      ? orders.filter(o => selectedOrders.includes(o._id)) 
      : filteredOrders;

    if (listToExport.length === 0) {
      showToast('No orders to export', 'error');
      return;
    }

    const headers = ['Order ID', 'Customer Name', 'Customer Phone', 'Type', 'Status', 'Total ($)', 'Payment Method', 'Payment Status', 'Created At'];
    const rows = listToExport.map(o => [
      `"${o.orderNumber || o._id?.toString()}"`,
      `"${o.customerName || 'Guest'}"`,
      `"${o.customerPhone || 'N/A'}"`,
      `"${o.orderType || o.type || 'delivery'}"`,
      `"${o.status || 'pending'}"`,
      (o.total || 0).toFixed(2),
      `"${o.paymentMethod || 'cash'}"`,
      `"${o.paymentStatus || 'pending'}"`,
      `"${new Date(o.createdAt).toLocaleString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `orders_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkRefund = async () => {
    const validOrders = orders.filter(o => selectedOrders.includes(o._id) && o.paymentStatus === 'paid');
    if (validOrders.length === 0) {
      showToast('None of the selected orders have a paid status to refund.', 'error');
      return;
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

  const getTypeBadge = (type) => {
    const t = (type || 'delivery').toLowerCase();
    if (t === 'pickup') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/25"><ShoppingBag className="w-3.5 h-3.5" /> Takeaway</span>;
    if (t === 'dine_in') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-500 border border-purple-500/25"><UtensilsCrossed className="w-3.5 h-3.5" /> Dine-in</span>;
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/25"><Truck className="w-3.5 h-3.5" /> Delivery</span>;
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'preparing': return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-500 border border-purple-500/30">Preparing</span>;
      case 'new': 
      case 'pending': return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30">New</span>;
      case 'out for delivery':
      case 'out_for_delivery': return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-500 border border-blue-500/30">Out for Delivery</span>;
      case 'accepted': return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">Accepted</span>;
      case 'ready': return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-teal-500/15 text-teal-500 border border-teal-500/30">Ready</span>;
      case 'delivered':
      case 'picked_up':
      case 'completed': return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">Completed</span>;
      case 'cancelled': return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">Cancelled</span>;
      case 'failed': return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">Failed</span>;
      default: return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30 capitalize">{status}</span>;
    }
  };

  const getPaymentBadge = (method, pStatus, order) => {
    const ps = (pStatus || '').toLowerCase();
    const isManualRefund = order?.refundReason && ['merchant', 'bulk refund', 'refund processed'].some(r => order.refundReason.toLowerCase().includes(r));
    const isAutoRefund = order?.refunded && ps === 'refunded' && !isManualRefund;
    if (ps === 'refunded') return (
      <div className="flex flex-col gap-0.5">
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30">Refunded</span>
        {isAutoRefund && <span className="text-amber-500 font-bold text-[9px] bg-amber-500/10 px-1.5 py-0.5 rounded inline-block w-max">⚡ Auto</span>}
      </div>
    );
    if (ps === 'partially_refunded') return <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">Partial Refund</span>;
    if (ps === 'failed') return <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30">⚠️ Failed</span>;
    const isOnline = ['credit_card', 'debit_card', 'apple_pay', 'google_pay', 'stripe_online'].includes(method?.toLowerCase());
    if (ps === 'paid') return <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">Paid</span>;
    if (isOnline) return <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-500 border border-blue-500/30">Online</span>;
    if (method?.toLowerCase() === 'payment_link') return <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand/15 text-brand border border-brand/30">{ps === 'paid' ? 'Link Paid' : 'Link Pending'}</span>;
    if (method?.toLowerCase() === 'cash' || (ps === 'pending' && !isOnline)) return <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">Cash / COD</span>;
    return <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30 capitalize">{pStatus || 'Unknown'}</span>;
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 pb-12">
      
      {/* ── HEADER ROW ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-admin-text tracking-tight">
            Orders & Invoices
          </h1>
          <p className="text-xs sm:text-sm text-admin-text-secondary mt-1">
            Real-time orders, delivery tracking, billing status, and invoices.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => router.push('/merchant/pos')}
            className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:brightness-110 transition-all shadow-sm cursor-pointer"
          >
            <span className="text-base leading-none">+</span> New Order (POS)
          </button>
        </div>
      </div>

      {/* ── 6 STATS CARDS (Salon Management Luxury StatCards) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
        <StatCard
          label="Total Orders"
          value={stats.total}
          icon={ShoppingCart}
          color="bg-amber-500/15 text-amber-500"
        />
        <StatCard
          label="New Orders"
          value={stats.newOrders}
          icon={CalendarCheck}
          color="bg-rose-500/15 text-rose-500"
        />
        <StatCard
          label="Preparing"
          value={stats.preparing}
          icon={ClipboardList}
          color="bg-purple-500/15 text-purple-500"
        />
        <StatCard
          label="Ready"
          value={stats.ready}
          icon={ShoppingBag}
          color="bg-blue-500/15 text-blue-500"
        />
        <StatCard
          label="Out for Delivery"
          value={stats.outForDelivery}
          icon={Bike}
          color="bg-emerald-500/15 text-emerald-500"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle}
          color="bg-teal-500/15 text-teal-500"
        />
      </div>

      {/* ── MAIN TABLE CARD (Salon Management Luxury Table Surface) ── */}
      <div className="bg-admin-card rounded-2xl shadow-sm border border-admin-border overflow-hidden flex flex-col">
        
        {/* Filters Bar */}
        <div className="p-4 sm:p-5 border-b border-admin-border flex flex-wrap gap-3.5 items-center justify-between bg-admin-surface/40">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="w-4 h-4 text-admin-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search by Order ID, Customer, Phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-admin-border bg-admin-surface text-xs font-medium text-admin-text placeholder:text-admin-text-muted outline-none focus:border-brand transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-[140px]">
              <PremiumDatePicker 
                selected={dateRange ? new Date(dateRange + 'T00:00:00') : null}
                onChange={(d) => setDateRange(d ? d.toISOString().split('T')[0] : '')}
                className="!bg-admin-surface !py-2 !text-xs !font-bold !text-admin-text cursor-pointer w-full !border-admin-border rounded-xl"
                placeholderText="All Dates"
                isClearable={true}
              />
            </div>

            <div>
              <select 
                value={orderTypeFilter}
                onChange={(e) => setOrderTypeFilter(e.target.value)}
                className="bg-admin-surface border border-admin-border rounded-xl px-3 py-2 text-xs font-semibold text-admin-text outline-none cursor-pointer hover:border-brand/40 transition-colors"
              >
                <option>All Types</option>
                <option>Delivery</option>
                <option>Takeaway</option>
                <option>Dine-in</option>
              </select>
            </div>

            <div>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-admin-surface border border-admin-border rounded-xl px-3 py-2 text-xs font-semibold text-admin-text outline-none cursor-pointer hover:border-brand/40 transition-colors"
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

            <div>
              <select 
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="bg-admin-surface border border-admin-border rounded-xl px-3 py-2 text-xs font-semibold text-admin-text outline-none cursor-pointer hover:border-brand/40 transition-colors"
              >
                <option>All Payment Status</option>
                <option>Paid</option>
                <option>Unpaid</option>
              </select>
            </div>

            <button 
              type="button"
              onClick={() => {
                setSearchQuery('');
                setDateRange('');
                setStatusFilter('All Status');
                setOrderTypeFilter('All Types');
                setPaymentFilter('All Payment Status');
                setActiveTab('All');
              }}
              className="bg-admin-surface border border-admin-border rounded-xl px-3 py-2 text-xs font-semibold text-admin-text-secondary flex items-center gap-1.5 hover:text-admin-text hover:bg-admin-surface-light transition-colors cursor-pointer"
              title="Reset Filters"
            >
              <RefreshCcw className="w-3.5 h-3.5" /> Clear
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-xs font-semibold text-admin-text-secondary flex items-center gap-1.5 hover:text-admin-text hover:bg-admin-surface-light transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>

        {/* Channel Filter Tabs */}
        <div className="px-5 border-b border-admin-border flex items-center justify-between overflow-x-auto hide-scrollbar bg-admin-surface-light/30">
          <div className="flex items-center gap-6 min-w-max">
            {[
              { id: 'All', label: `All Orders (${tabCounts.all})` },
              { id: 'Dine-in', label: `Dine-in (${tabCounts.dineIn})` },
              { id: 'Takeaway', label: `Takeaway (${tabCounts.pickup})` },
              { id: 'Delivery', label: `Delivery (${tabCounts.delivery})` }
            ].map(tab => (
              <button 
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 text-xs font-bold transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id ? 'border-brand text-brand' : 'border-transparent text-admin-text-secondary hover:text-admin-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table wrapped in TableScrollContainer with smooth scroll arrows */}
        <TableScrollContainer innerClassName="min-h-[300px]">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead className="bg-admin-surface-light sticky top-0 z-10 border-b border-admin-border text-admin-text-secondary">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedOrders.length === displayedOrders.length && displayedOrders.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-admin-border text-brand focus:ring-brand cursor-pointer" 
                  />
                </th>
                <th className="px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider">Order ID</th>
                <th className="px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider">Type</th>
                <th className="px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider">Status</th>
                <th className="px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider">Order Time</th>
                <th className="px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider">Items</th>
                <th className="px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider">Payment</th>
                <th className="px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider">Fulfillment</th>
                <th className="px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-admin-border rounded-2xl bg-admin-surface-light/30">
                      <PackageX className="w-12 h-12 text-admin-text-muted mb-3" />
                      <p className="text-sm font-bold text-admin-text">No orders found</p>
                      <p className="text-xs text-admin-text-muted mt-1">Try adjusting your filters, search terms, or date range.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedOrders.map((order, idx) => {
                  const isSelected = selectedOrders.includes(order._id);
                  return (
                    <tr 
                      key={order._id || idx} 
                      className={`transition-colors ${
                        isSelected 
                          ? 'bg-brand/10' 
                          : 'hover:bg-admin-surface-light/40'
                      }`}
                    >
                      <td className="px-4 py-3.5 text-center">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => handleSelectOrder(order._id)}
                          className="w-4 h-4 rounded border-admin-border text-brand focus:ring-brand cursor-pointer" 
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-admin-text">
                            #{order.orderNumber || order._id?.toString().slice(-6) || 'N/A'}
                          </span>
                          {order.isRemake && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 text-[10px] font-bold tracking-wider">
                              REMADE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand/20 to-brand/5 border border-brand/30 flex items-center justify-center text-xs font-bold text-brand shrink-0">
                            {(order.customerName || 'G')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-admin-text truncate max-w-[130px]">{order.customerName || 'Guest'}</div>
                            <div className="text-[11px] text-admin-text-muted truncate max-w-[130px]">{order.customerPhone || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {getTypeBadge(order.orderType || order.type)}
                      </td>
                      <td className="px-4 py-3.5">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-xs font-bold text-admin-text">{formatTime(order.createdAt, restaurant?.timeFormat, restaurant?.timezone)}</div>
                        <div className="text-[11px] text-admin-text-muted">{formatDate(order.createdAt, restaurant?.dateFormat, restaurant?.timezone)}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-xs font-semibold text-admin-text-secondary">{order.items?.length || 0} Items</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-heading text-sm font-extrabold text-admin-text">${Number(order.total || 0).toFixed(2)}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        {getPaymentBadge(order.paymentMethod, order.paymentStatus, order)}
                      </td>
                      <td className="px-4 py-3.5">
                        {(order.orderType || order.type) === 'delivery' ? (
                          <>
                            <div className="text-xs font-semibold text-admin-text-secondary">Rider: {order.courierName || 'Assigning'}</div>
                            <div className="text-[11px] font-bold text-emerald-500">{order.status === 'out_for_delivery' ? 'ETA: 15 mins' : (order.status === 'delivered' ? 'Delivered' : '')}</div>
                          </>
                        ) : (order.orderType || order.type) === 'dine_in' ? (
                          <>
                            <div className="text-xs font-semibold text-admin-text">Table {order.tableNumber || '-'}</div>
                            <div className="text-[11px] text-admin-text-muted">{order.guestCount || 0} Guests</div>
                          </>
                        ) : (
                          <div className="text-xs text-admin-text-muted">Takeaway Counter</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => onRowClick && onRowClick(order._id)}
                            className="w-8 h-8 rounded-lg border border-admin-border bg-admin-surface flex items-center justify-center text-admin-text-secondary hover:text-brand hover:border-brand/50 transition-colors shadow-2xs cursor-pointer"
                            title="View Order Details"
                          >
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
        </TableScrollContainer>

        {/* Pagination & Load More */}
        <div className="px-6 py-4 border-t border-admin-border flex flex-col sm:flex-row items-center justify-between bg-admin-surface/30 gap-4">
          <span className="text-xs font-medium text-admin-text-muted">
            Showing <strong className="text-admin-text font-bold">{displayedOrders.length}</strong> of <strong className="text-admin-text font-bold">{filteredOrders.length}</strong> orders
          </span>

          {hasMoreItems && (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="flex items-center justify-center gap-2 w-full sm:w-[160px] h-[36px] bg-admin-surface border border-admin-border text-admin-text rounded-xl text-xs font-bold hover:bg-admin-surface-light hover:border-brand/40 transition-all shadow-2xs cursor-pointer"
            >
              {isLoadingMore ? <><Loader2 className="w-3.5 h-3.5 animate-spin text-brand" /> Loading...</> : 'Load More Orders'}
            </button>
          )}
        </div>

        {/* Floating Bulk Actions Bar */}
        {selectedOrders.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-[#090D16] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 z-50 border border-white/10 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand flex items-center justify-center text-xs font-bold text-white shadow-sm">
                {selectedOrders.length}
              </span>
              <span className="text-xs font-bold">Selected</span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { handleExportCSV(); setSelectedOrders([]); showToast('Orders exported to CSV', 'success'); }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 text-xs font-semibold hover:bg-white/20 transition-colors border border-white/10 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export Selected
              </button>
              <button 
                type="button"
                onClick={handleBulkRefund} 
                disabled={isProcessing}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold text-white transition-colors cursor-pointer ${
                  isProcessing ? 'bg-rose-900/50 cursor-not-allowed opacity-50' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isProcessing ? 'Processing...' : 'Issue Refund'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrders([])}
                className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors ml-1 cursor-pointer"
                title="Deselect all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}