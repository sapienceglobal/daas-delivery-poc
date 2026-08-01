import React, { useState, useMemo, useEffect } from 'react';
import GlobalStatCard from '@/components/ui/GlobalStatCard';
import { 
  Search, Filter, ChevronLeft, ChevronRight, 
  MoreVertical, ShoppingBag, ShoppingCart, Truck, Calendar, Download, 
  DollarSign, CheckCircle, XCircle, Wallet, ClipboardList
} from 'lucide-react';

export default function AllOrdersView({ orders = [], onRowClick }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [orderTypeFilter, setOrderTypeFilter] = useState('All Order Types');
  const [paymentFilter, setPaymentFilter] = useState('All Payment Types');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Stats Calculations
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const completedOrders = orders.filter(o => ['completed', 'delivered'].includes((o.status || '').toLowerCase())).length;
    const cancelledOrders = orders.filter(o => (o.status || '').toLowerCase() === 'cancelled').length;
    const refundedOrders = orders.filter(o => (o.paymentStatus || '').toLowerCase() === 'refunded').length;

    return { totalOrders, totalRevenue, avgOrderValue, completedOrders, cancelledOrders, refundedOrders };
  }, [orders]);

  // Filtering Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Search
      const searchStr = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        o._id?.toLowerCase().includes(searchStr) || 
        o.orderNumber?.toLowerCase().includes(searchStr) ||
        o.customerName?.toLowerCase().includes(searchStr) ||
        o.customerPhone?.toLowerCase().includes(searchStr);

      // Status
      const matchesStatus = statusFilter === 'All Status' || (o.status || '').toLowerCase() === statusFilter.toLowerCase();
      
      // Order Type
      const oType = (o.orderType || o.type || '').toLowerCase();
      const matchesType = orderTypeFilter === 'All Order Types' || 
        (orderTypeFilter === 'Delivery' && oType === 'delivery') ||
        (orderTypeFilter === 'Pickup' && oType === 'pickup');

      // Payment Type
      const pType = (o.paymentMethod || '').toLowerCase();
      const matchesPayment = paymentFilter === 'All Payment Types' ||
        (paymentFilter === 'Online Paid' && ['credit_card', 'debit_card', 'apple_pay', 'google_pay'].includes(pType)) ||
        (paymentFilter === 'Cash on Delivery' && pType === 'cash');

      return matchesSearch && matchesStatus && matchesType && matchesPayment;
    });
  }, [orders, searchQuery, statusFilter, orderTypeFilter, paymentFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'preparing': return <span className="text-[#F59E0B] font-bold text-xs bg-[#F59E0B]/10 px-2 py-1 rounded-full">Preparing</span>;
      case 'new': 
      case 'pending': return <span className="text-[#DC2626] font-bold text-xs bg-[#DC2626]/10 px-2 py-1 rounded-full">New</span>;
      case 'out for delivery': return <span className="text-[#3B82F6] font-bold text-xs bg-[#3B82F6]/10 px-2 py-1 rounded-full">Out for Delivery</span>;
      case 'accepted': return <span className="text-[#10B981] font-bold text-xs bg-[#10B981]/10 px-2 py-1 rounded-full">Accepted</span>;
      case 'ready': return <span className="text-[#8B5CF6] font-bold text-xs bg-[#8B5CF6]/10 px-2 py-1 rounded-full">Ready</span>;
      case 'delivered':
      case 'completed': return <span className="text-[#10B981] font-bold text-xs bg-[#10B981]/10 px-2 py-1 rounded-full">Completed</span>;
      case 'cancelled': return <span className="text-[#6b7280] font-bold text-xs bg-[#f3f4f6] px-2 py-1 rounded-full">Cancelled</span>;
      case 'refunded': return <span className="text-[#ef4444] font-bold text-xs bg-[#fef2f2] px-2 py-1 rounded-full">Refunded</span>;
      default: return <span className="text-[#6b7280] font-bold text-xs capitalize">{status}</span>;
    }
  };

  const getPaymentBadge = (method) => {
    const isOnline = ['credit_card', 'debit_card', 'apple_pay', 'google_pay'].includes(method?.toLowerCase());
    if (isOnline) return <span className="text-[#10B981] font-bold text-[10px] bg-[#10B981]/10 px-2 py-1 rounded-full">Online Paid</span>;
    return <span className="text-[#3B82F6] font-bold text-[10px] bg-[#3B82F6]/10 px-2 py-1 rounded-full">Cash on Delivery</span>;
  };

  const handleExportCSV = () => {
    if (!filteredOrders.length) return;
    
    const headers = ['Order ID', 'Order Number', 'Date', 'Customer Name', 'Phone', 'Order Type', 'Payment Method', 'Total', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredOrders.map(o => {
        return [
          o._id,
          o.orderNumber || '',
          new Date(o.createdAt).toLocaleString(),
          `"${o.customerName || 'Guest'}"`,
          `"${o.customerPhone || ''}"`,
          o.type || o.orderType || 'delivery',
          o.paymentMethod || 'cash',
          o.total || 0,
          o.status || 'new'
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">All Orders</h1>
          <p className="text-sm text-[#6b7280] mt-1">View and manage all customer orders in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-[#e5e7eb] rounded-lg px-4 py-2 text-sm text-[#374151] shadow-sm flex items-center gap-2 cursor-pointer hover:bg-gray-50">
            <Calendar className="w-4 h-4 text-[#6b7280]" />
            May 21 - May 27, 2025
          </div>
          <button onClick={handleExportCSV} className="bg-white border border-[#e5e7eb] rounded-lg px-4 py-2 text-sm text-[#374151] shadow-sm flex items-center gap-2 cursor-pointer hover:bg-gray-50 font-medium">
            <Download className="w-4 h-4 text-[#6b7280]" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <GlobalStatCard label="Total Orders" value={stats.totalOrders} icon={ClipboardList} color="pink" />
        <GlobalStatCard label="Total Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} icon={DollarSign} color="yellow" />
        <GlobalStatCard label="Average Order Value" value={`$${stats.avgOrderValue.toFixed(2)}`} icon={ShoppingCart} color="blue" />
        <GlobalStatCard label="Completed Orders" value={stats.completedOrders} icon={CheckCircle} color="green" />
        <GlobalStatCard label="Cancelled Orders" value={stats.cancelledOrders} icon={XCircle} color="red" />
        <GlobalStatCard label="Refunded Orders" value={stats.refundedOrders} icon={Wallet} color="red" />
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[20px] shadow-sm border border-[#f3f4f6] overflow-hidden">
        
        {/* Filters Row */}
        <div className="p-4 border-b border-[#f3f4f6] flex flex-wrap gap-4 items-center justify-between bg-white">
          <div className="relative flex-1 min-w-[250px] max-w-md">
            <Search className="w-4 h-4 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by Order ID, Customer or Phone..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#e5e7eb] text-sm text-[#1f2937] outline-none focus:border-brand-cyan/50"
            />
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <select 
              value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#4b5563] outline-none"
            >
              <option>All Status</option>
              <option>New</option>
              <option>Accepted</option>
              <option>Preparing</option>
              <option>Ready</option>
              <option>Out for Delivery</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>

            <select 
              value={orderTypeFilter} onChange={(e) => { setOrderTypeFilter(e.target.value); setCurrentPage(1); }}
              className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#4b5563] outline-none"
            >
              <option>All Order Types</option>
              <option>Delivery</option>
              <option>Pickup</option>
            </select>

            <select 
              value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setCurrentPage(1); }}
              className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#4b5563] outline-none"
            >
              <option>All Payment Types</option>
              <option>Online Paid</option>
              <option>Cash on Delivery</option>
            </select>

            <button className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#4b5563] flex items-center gap-2 hover:bg-gray-50">
              <Filter className="w-4 h-4" /> Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#f3f4f6]">
                <th className="px-6 py-4 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider whitespace-nowrap">Order ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider whitespace-nowrap">Customer</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider whitespace-nowrap">Order Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider whitespace-nowrap">Items</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider whitespace-nowrap">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider whitespace-nowrap">Payment</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider whitespace-nowrap">Date & Time</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f9fafb]">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-10 text-center text-sm text-gray-500">
                    No orders found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order, idx) => {
                  const type = (order.orderType || order.type || 'delivery').toLowerCase();
                  return (
                    <tr 
                      key={order._id || idx} 
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => onRowClick && onRowClick(order._id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-[12px] font-bold text-[#111827]">#{order.orderNumber || order._id?.toString().slice(-6) || 'N/A'}</div>
                        <div className="text-[11px] text-[#9ca3af] mt-0.5">{new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#f3f4f6] flex items-center justify-center text-xs font-bold text-[#6b7280]">
                            {(order.customerName || 'G')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[12px] font-bold text-[#111827]">{order.customerName || 'Guest'}</div>
                            <div className="text-[11px] text-[#6b7280]">{order.customerPhone || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-[12px] text-[#374151]">
                          {type === 'pickup' ? <ShoppingBag className="w-4 h-4 text-[#9ca3af]" /> : <Truck className="w-4 h-4 text-[#9ca3af]" />}
                          <span className="capitalize">{type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-[12px] font-bold text-[#374151]">{order.items?.length || 0} Items</div>
                        <button className="text-[10px] font-bold text-[#ef4444] hover:underline mt-0.5">View Items</button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-[12px] font-bold text-[#111827]">${order.total?.toFixed(2) || '0.00'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentBadge(order.paymentMethod)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-[11px] text-[#374151]">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        <div className="text-[11px] text-[#9ca3af]">{new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button className="text-[#9ca3af] hover:text-[#374151] transition-colors p-1">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredOrders.length > 0 && (
          <div className="px-6 py-4 border-t border-[#f3f4f6] flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-b-[20px]">
            <div className="text-xs text-[#6b7280]">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} results
            </div>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e5e7eb] text-[#4b5563] disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {/* Page Numbers (Simplified for demo) */}
              {[...Array(Math.min(3, totalPages))].map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                    currentPage === i + 1 
                      ? 'bg-[#8b0000] text-white border border-[#8b0000]' 
                      : 'border border-[#e5e7eb] text-[#4b5563] hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              
              {totalPages > 3 && <span className="text-[#9ca3af]">...</span>}
              
              {totalPages > 3 && (
                <button 
                  onClick={() => setCurrentPage(totalPages)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                    currentPage === totalPages 
                      ? 'bg-[#8b0000] text-white border border-[#8b0000]' 
                      : 'border border-[#e5e7eb] text-[#4b5563] hover:bg-gray-50'
                  }`}
                >
                  {totalPages}
                </button>
              )}

              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e5e7eb] text-[#4b5563] disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <select 
                className="ml-2 bg-white border border-[#e5e7eb] rounded-lg px-2 py-1.5 text-xs text-[#4b5563] outline-none"
              >
                <option>10 / page</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
