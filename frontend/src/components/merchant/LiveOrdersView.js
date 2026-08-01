import React, { useState, useEffect } from 'react';
import { 
  RefreshCcw, Filter, LayoutGrid, Phone, ShoppingBag, Truck,
  CheckCircle2, AlertTriangle, ArrowRight, XCircle, Clock
} from 'lucide-react';

export default function LiveOrdersView({ 
  orders = [], 
  onAcceptOrder, 
  onRejectOrder, 
  onUpdateStatus,
  onRefresh 
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  // Group orders by status
  const getColOrders = (statuses) => orders.filter(o => statuses.includes((o.status || '').toLowerCase()));

  const columns = [
    {
      id: 'new',
      title: 'New Orders',
      color: 'pink',
      bgHeader: 'bg-red-50 text-red-600',
      badgeBg: 'bg-red-100',
      orders: getColOrders(['new', 'pending'])
    },
    {
      id: 'accepted',
      title: 'Accepted',
      color: 'orange',
      bgHeader: 'bg-orange-50 text-orange-600',
      badgeBg: 'bg-orange-100',
      orders: getColOrders(['accepted'])
    },
    {
      id: 'preparing',
      title: 'Preparing',
      color: 'purple',
      bgHeader: 'bg-purple-50 text-purple-600',
      badgeBg: 'bg-purple-100',
      orders: getColOrders(['preparing'])
    },
    {
      id: 'ready',
      title: 'Ready',
      color: 'green',
      bgHeader: 'bg-green-50 text-green-600',
      badgeBg: 'bg-green-100',
      orders: getColOrders(['ready'])
    },
    {
      id: 'out_for_delivery',
      title: 'Out for Delivery',
      color: 'blue',
      bgHeader: 'bg-blue-50 text-blue-600',
      badgeBg: 'bg-blue-100',
      orders: orders.filter(o => o.orderType === 'delivery' && o.status === 'picked_up')
    }
  ];

  // Helper to get time ago
  const getTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((new Date() - new Date(dateStr)) / 60000); // mins
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    return `${Math.floor(diff / 60)} hr ago`;
  };

  // Helper to render Order Card
  const renderCard = (order, colId) => {
    return (
      <div 
        key={order._id} 
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('orderId', order._id);
          e.dataTransfer.setData('sourceCol', colId);
        }}
        className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] p-4 flex flex-col gap-3 transition-shadow hover:shadow-md cursor-grab active:cursor-grabbing"
      >
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-bold text-[#111827]">#{order.orderNumber || order._id?.toString().slice(-6)}</p>
            <p className="text-sm font-bold text-[#374151] mt-1">{order.customerName || 'Guest'}</p>
          </div>
          <span className="text-[10px] font-medium text-[#6b7280]">{getTimeAgo(order.createdAt)}</span>
        </div>

        {/* Type & Phone */}
        <div className="flex flex-col gap-1 text-[11px] text-[#6b7280]">
          <div className="flex items-center gap-1.5">
            {order.orderType === 'pickup' ? <ShoppingBag className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
            <span className="capitalize">{order.orderType || 'Delivery'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" />
            <span>{order.customerPhone || 'N/A'}</span>
          </div>
        </div>

        {/* Items Summary & Price */}
        <div className="flex justify-between items-center pt-2 border-t border-[#f3f4f6]">
          <span className="text-xs font-bold text-[#374151]">{order.items?.length || 0} Items</span>
          <span className="text-sm font-bold text-[#111827]">${(order.total || 0).toFixed(2)}</span>
        </div>

        {/* Item List */}
        <div className="text-[11px] text-[#4b5563] space-y-1">
          {(order.items || []).slice(0, 4).map((it, idx) => (
            <p key={idx} className="flex justify-between">
              <span className="truncate pr-2">• {it.name}</span>
              <span>x{it.quantity}</span>
            </p>
          ))}
          {(order.items?.length > 4) && <p className="text-[#9ca3af] italic">+ {order.items.length - 4} more items</p>}
        </div>

        {/* Special Instructions Badge */}
        {order.specialInstructions && (
          <div className="mt-1 flex flex-wrap gap-1">
            <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 rounded px-1.5 py-0.5 max-w-full truncate">
              {order.specialInstructions}
            </span>
          </div>
        )}

        {/* Extra Info (Prep Time / Rider) */}
        {colId === 'preparing' && (
          <div className="flex items-center gap-1.5 text-[10px] text-[#6b7280] mt-1">
            <Clock className="w-3.5 h-3.5" /> Prep. Time: 15-20 min
          </div>
        )}
        {colId === 'out_for_delivery' && order.dasherName && (
          <div className="flex items-center gap-1.5 text-[10px] text-[#6b7280] mt-1">
            <User className="w-3.5 h-3.5" /> Rider: {order.dasherName}
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex flex-col gap-2 mt-auto">
          {colId === 'new' && (
            <>
              <button onClick={() => onAcceptOrder && onAcceptOrder(order._id)} className="w-full bg-[#8B0000] text-white text-xs font-bold py-2 rounded-lg hover:bg-red-900 transition-colors">Accept</button>
              <button onClick={() => onRejectOrder && onRejectOrder(order._id)} className="w-full bg-white border border-[#e5e7eb] text-[#8B0000] text-xs font-bold py-2 rounded-lg hover:bg-red-50 transition-colors">Reject</button>
            </>
          )}
          {colId === 'accepted' && (
            <button onClick={() => onUpdateStatus && onUpdateStatus(order._id, 'preparing')} className="w-full bg-[#F59E0B] text-white text-xs font-bold py-2 rounded-lg hover:bg-amber-600 transition-colors">Start Preparing</button>
          )}
          {colId === 'preparing' && (
            <button onClick={() => onUpdateStatus && onUpdateStatus(order._id, 'ready')} className="w-full bg-[#7C3AED] text-white text-xs font-bold py-2 rounded-lg hover:bg-purple-700 transition-colors">Mark as Ready</button>
          )}
          {colId === 'ready' && (
            <button onClick={() => onUpdateStatus && onUpdateStatus(order._id, 'picked_up')} className="w-full bg-[#10B981] text-white text-xs font-bold py-2 rounded-lg hover:bg-emerald-600 transition-colors">
              {order.orderType === 'pickup' ? 'Customer Picked Up' : 'Handed to Rider (Picked Up)'}
            </button>
          )}
          {colId === 'out_for_delivery' && (
            <button className="w-full bg-[#3B82F6] text-white text-xs font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5">
              <Truck className="w-3.5 h-3.5" /> Track Order
            </button>
          )}
        </div>
      </div>
    );
  };

  // Right Sidebar Stats
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());
  const completedToday = todayOrders.filter(o => ['delivered', 'completed', 'picked_up'].includes(o.status?.toLowerCase()));
  const cancelledToday = todayOrders.filter(o => ['cancelled', 'refunded'].includes(o.status?.toLowerCase()));
  
  const completedPercentage = todayOrders.length ? Math.round((completedToday.length / todayOrders.length) * 100) : 0;
  const cancelledPercentage = todayOrders.length ? Math.round((cancelledToday.length / todayOrders.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-[#111827]">Live Orders</h2>
          <p className="text-sm text-[#6b7280]">Track and manage orders in real time</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-[#e5e7eb] px-4 py-2 rounded-lg text-sm font-bold text-[#374151] hover:bg-gray-50">
            <LayoutGrid className="w-4 h-4" /> Arrange
          </button>
          <button className="flex items-center gap-2 bg-white border border-[#e5e7eb] px-4 py-2 rounded-lg text-sm font-bold text-[#374151] hover:bg-gray-50">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button onClick={onRefresh} className="flex items-center gap-2 bg-[#8B0000] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-900 transition-colors">
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        
        {/* Kanban Board (Scrollable X) */}
        <div className="flex-1 overflow-x-auto custom-scrollbar pb-4">
          <div className="flex gap-4 min-w-max h-full">
            
            {columns.map(col => (
              <div key={col.id} className="w-[280px] flex flex-col h-full bg-[#F8FAFC]">
                
                {/* Column Header */}
                <div className={`${col.bgHeader} rounded-t-xl px-4 py-3 flex justify-between items-center border border-b-0 border-[#e5e7eb] shrink-0`}>
                  <h3 className="font-bold text-sm">{col.title}</h3>
                  <span className={`${col.badgeBg} text-xs font-bold px-2 py-0.5 rounded-full`}>
                    {col.orders.length}
                  </span>
                </div>

                {/* Column Body */}
                <div 
                  className="flex-1 overflow-y-auto custom-scrollbar bg-white/50 border border-[#e5e7eb] border-t-0 rounded-b-xl p-3 space-y-3"
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const orderId = e.dataTransfer.getData('orderId');
                    const sourceCol = e.dataTransfer.getData('sourceCol');
                    if (sourceCol !== col.id && onUpdateStatus) {
                      // Map col.id to backend status
                      let targetStatus = col.id;
                      if (col.id === 'out_for_delivery') targetStatus = 'out for delivery';
                      onUpdateStatus(orderId, targetStatus);
                    }
                  }}
                >
                  {col.orders.map(order => renderCard(order, col.id))}
                  {col.orders.length === 0 && (
                    <div className="h-full flex items-center justify-center text-xs text-[#9ca3af] font-medium py-10 text-center px-4 border-2 border-dashed border-[#e5e7eb] rounded-lg">
                      No orders here
                    </div>
                  )}
                </div>

              </div>
            ))}

          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-[320px] shrink-0 overflow-y-auto custom-scrollbar pr-2 space-y-6">
          
          {/* Order Summary */}
          <div className="bg-white border border-[#f3f4f6] rounded-[20px] p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-[#111827]">Order Summary</h3>
              <select className="text-xs border border-[#e5e7eb] rounded-lg px-2 py-1 outline-none text-[#374151]">
                <option>Today</option>
                <option>This Week</option>
              </select>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#6b7280]">Total Orders</span>
                <span className="text-sm font-bold text-[#111827]">{todayOrders.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#6b7280]">Completed</span>
                <span className="text-sm font-bold text-[#10B981]">{completedToday.length} <span className="text-xs font-normal">({completedPercentage}%)</span></span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#6b7280]">Cancelled</span>
                <span className="text-sm font-bold text-[#ef4444]">{cancelledToday.length} <span className="text-xs font-normal">({cancelledPercentage}%)</span></span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-[#f3f4f6]">
                <span className="text-sm text-[#6b7280]">Avg. Prep Time</span>
                <span className="text-sm font-bold text-[#111827]">22 min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#6b7280]">Avg. Delivery Time</span>
                <span className="text-sm font-bold text-[#111827]">34 min</span>
              </div>
            </div>
            <button className="text-xs font-bold text-[#dc2626] flex items-center gap-1 mt-6 hover:underline">
              View All Orders <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Recent Completed Orders */}
          <div className="bg-white border border-[#f3f4f6] rounded-[20px] p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-[#111827]">Recent Completed Orders</h3>
              <button className="text-xs font-bold text-[#dc2626] hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              {orders.filter(o => ['delivered', 'completed'].includes(o.status?.toLowerCase())).slice(0, 4).map((order, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#6b7280]">#{order.orderNumber || order._id?.toString().slice(-6)}</span>
                      <span className="text-xs font-bold text-[#111827]">{order.customerName || 'Guest'}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                      <span className="text-[10px] text-[#6b7280]">Delivered • {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#111827]">${(order.total || 0).toFixed(2)}</span>
                </div>
              ))}
              {orders.filter(o => ['delivered', 'completed'].includes(o.status?.toLowerCase())).length === 0 && (
                <p className="text-xs text-[#9ca3af] text-center py-2">No completed orders yet.</p>
              )}
            </div>
          </div>

          {/* Kitchen Alerts */}
          <div className="bg-white border border-[#f3f4f6] rounded-[20px] p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-[#111827]">Kitchen Alerts</h3>
              <button className="text-xs font-bold text-[#dc2626] hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3 items-start border-b border-[#f3f4f6] pb-3">
                <AlertTriangle className="w-4 h-4 text-[#ef4444] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#111827]">2 Orders delayed</p>
                  <p className="text-[10px] text-[#6b7280] mt-0.5">More than 30 min</p>
                </div>
              </div>
              <div className="flex gap-3 items-start border-b border-[#f3f4f6] pb-3">
                <AlertTriangle className="w-4 h-4 text-[#ef4444] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#111827]">Low stock: Paneer</p>
                  <p className="text-[10px] text-[#6b7280] mt-0.5">Only 2.5 kg left</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-4 h-4 shrink-0 mt-0.5 bg-red-100 rounded flex items-center justify-center">
                  <XCircle className="w-3 h-3 text-[#ef4444]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#111827]">Gas stove (Kitchen 2)</p>
                  <p className="text-[10px] text-[#6b7280] mt-0.5">Maintenance required</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
