import React, { useState, useEffect, useRef } from 'react';
import { 
  RefreshCcw, Filter, LayoutGrid, Phone, ShoppingBag, Truck,
  CheckCircle2, AlertTriangle, ArrowRight, XCircle, Clock,
  ChevronLeft, ChevronRight
} from 'lucide-react';

export default function LiveOrdersView({ 
  orders = [], 
  onAcceptOrder, 
  onRejectOrder, 
  onUpdateStatus,
  onRefresh,
  onViewAll
}) {
  const [mounted, setMounted] = useState(false);
  
  // ─── LOAD MORE STATE ───
  const ITEMS_PER_LOAD = 10;
  const [visibleCounts, setVisibleCounts] = useState({});

  // ─── SCROLLING LOGIC STATES & REFS ───
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkForScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      // Added 1px tolerance for floating point rounding issues
      setCanScrollLeft(scrollLeft > 1);
      setCanScrollRight(Math.ceil(scrollLeft) < scrollWidth - clientWidth - 1);
    }
  };

  // 🔥 FIX 1: First Load Buttons Fix (DOM render hone ke baad check karega)
  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      checkForScrollPosition();
    }, 150);
    return () => clearTimeout(timer);
  }, [orders, visibleCounts]); 

  // Window Resize Listener
  useEffect(() => {
    window.addEventListener('resize', checkForScrollPosition);
    return () => window.removeEventListener('resize', checkForScrollPosition);
  }, []);

  // 🔥 FIX 2: Mouse Wheel Horizontal Scroll Listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      // Agar vertical scroll ghumaya hai (aur horizontal pad/shift nahi hai)
      if (e.deltaY !== 0 && e.deltaX === 0) {
        e.preventDefault();
        container.scrollBy({ left: e.deltaY, behavior: 'auto' });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [mounted]);

  const scrollByAmount = (amount) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handleLoadMore = (colId) => {
    setVisibleCounts(prev => ({
      ...prev,
      [colId]: (prev[colId] || ITEMS_PER_LOAD) + ITEMS_PER_LOAD
    }));
  };

  const getVisibleCount = (colId) => visibleCounts[colId] || ITEMS_PER_LOAD;

  if (!mounted) return null;

  // Group orders by status
  const getColOrders = (statuses) => orders.filter(o => statuses.includes((o.status || '').toLowerCase()));

  const columns = [
    {
      id: 'new',
      title: 'New Orders',
      theme: { bg: 'bg-[#fef2f2]', text: 'text-[#991b1b]', badgeBg: 'bg-[#fee2e2]', border: 'border-[#fecaca]', buttonBg: 'bg-[#8B0000]', buttonHover: 'hover:bg-[#7f0000]' },
      orders: getColOrders(['new', 'pending'])
    },
    {
      id: 'accepted',
      title: 'Accepted',
      theme: { bg: 'bg-[#fff7ed]', text: 'text-[#9a3412]', badgeBg: 'bg-[#ffedd5]', border: 'border-[#fed7aa]', buttonBg: 'bg-[#ea580c]', buttonHover: 'hover:bg-[#c2410c]' },
      orders: getColOrders(['accepted'])
    },
    {
      id: 'preparing',
      title: 'Preparing',
      theme: { bg: 'bg-[#f5f3ff]', text: 'text-[#5b21b6]', badgeBg: 'bg-[#ede9fe]', border: 'border-[#ddd6fe]', buttonBg: 'bg-[#6d28d9]', buttonHover: 'hover:bg-[#5b21b6]' },
      orders: getColOrders(['preparing'])
    },
    {
      id: 'ready',
      title: 'Ready',
      theme: { bg: 'bg-[#f0fdf4]', text: 'text-[#166534]', badgeBg: 'bg-[#dcfce7]', border: 'border-[#bbf7d0]', buttonBg: 'bg-[#15803d]', buttonHover: 'hover:bg-[#166534]' },
      orders: getColOrders(['ready'])
    },
    {
      id: 'out_for_delivery',
      title: 'Out for Delivery',
      theme: { bg: 'bg-[#eff6ff]', text: 'text-[#1e40af]', badgeBg: 'bg-[#dbeafe]', border: 'border-[#bfdbfe]', buttonBg: 'bg-[#1d4ed8]', buttonHover: 'hover:bg-[#1e40af]' },
      orders: orders.filter(o => o.orderType === 'delivery' && o.status === 'picked_up')
    }
  ];

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((new Date() - new Date(dateStr)) / 60000); 
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    return `${Math.floor(diff / 60)} hr ago`;
  };

  const getSpecialInstructionColor = (text) => {
    const t = text.toLowerCase();
    if (t.includes('no onion') || t.includes('no garlic')) return 'text-[#166534] bg-[#f0fdf4] border-[#dcfce7]';
    if (t.includes('medium')) return 'text-[#9a3412] bg-[#fff7ed] border-[#ffedd5]';
    if (t.includes('extra') || t.includes('spicy')) return 'text-[#5b21b6] bg-[#f5f3ff] border-[#ede9fe]';
    return 'text-[#991b1b] bg-[#fef2f2] border-[#fee2e2]';
  };

  const renderCard = (order, col) => {
    return (
      <div 
        key={order._id} 
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('orderId', order._id);
          e.dataTransfer.setData('sourceCol', col.id);
        }}
        className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] p-4 flex flex-col transition-shadow hover:shadow-md cursor-grab active:cursor-grabbing mb-3 last:mb-0"
      >
        <div className="flex justify-between items-center mb-1">
          <p className="text-xs font-extrabold text-[#111827]">#{order.orderNumber || order._id?.toString().slice(-6)}</p>
          <span className="text-xs font-medium text-[#6b7280]">{getTimeAgo(order.createdAt)}</span>
        </div>

        <p className="text-xs font-bold text-[#111827] mb-2">{order.customerName || 'Guest'}</p>

        <div className="flex flex-col gap-1.5 text-xs text-[#6b7280] mb-3">
          <div className="flex items-center gap-1.5">
            {order.orderType === 'pickup' ? <ShoppingBag className="w-3.5 h-3.5 text-[#374151]" /> : <Truck className="w-3.5 h-3.5 text-[#374151]" />}
            <span className="font-medium capitalize text-[#374151]">{order.orderType || 'Delivery'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-[#9ca3af]" />
            <span>{order.customerPhone || 'N/A'}</span>
          </div>
        </div>

        <div className="flex justify-between items-center py-2 border-y border-[#f3f4f6] mb-2">
          <span className="text-xs font-bold text-[#374151]">{order.items?.length || 0} Items</span>
          <span className="text-sm font-extrabold text-[#111827]">${(order.total || 0).toFixed(2)}</span>
        </div>

        <div className="text-xs text-[#374151] font-medium space-y-1 mb-3">
          {(order.items || []).slice(0, 4).map((it, idx) => (
            <p key={idx} className="flex flex-col items-start border-b border-[#f3f4f6] pb-1 last:border-0 last:pb-0">
              <span className="flex-1 text-[#111827]"><span className="mr-1 mt-0.5">•</span> {it.name} x{it.quantity}</span>
              {it.selectedSize?.name && <span className="text-xs text-[#6b7280] ml-3 italic">Size: {it.selectedSize.name}</span>}
              {(it.addOns || []).map((addon, i) => (
                <span key={i} className="text-xs text-[#6b7280] ml-3 italic">+ {addon.name}</span>
              ))}
            </p>
          ))}
          {(order.items?.length > 4) && <p className="text-[#9ca3af] italic ml-2">+ {order.items.length - 4} more</p>}
        </div>

        {order.specialInstructions && (
          <div className="mb-3 flex flex-wrap gap-1">
            <span className={`text-xs font-bold border rounded px-1.5 py-0.5 max-w-full truncate ${getSpecialInstructionColor(order.specialInstructions)}`}>
              {order.specialInstructions}
            </span>
          </div>
        )}

        {col.id === 'preparing' && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#6b7280] mb-3">
            <Clock className="w-3.5 h-3.5" /> Prep. Time: 20-25 min
          </div>
        )}
        {col.id === 'out_for_delivery' && (
          <div className="flex flex-col gap-0.5 text-xs font-medium text-[#6b7280] mb-3">
            <span>Rider: {order.courierName ? order.courierName : 'Assigning rider...'}</span>
            {order.courierPhone && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {order.courierPhone}</span>}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2">
          {col.id === 'new' && (
            <>
              <button onClick={() => onAcceptOrder && onAcceptOrder(order._id)} className={`w-full text-white text-xs font-bold py-2 rounded-lg transition-colors ${col.theme.buttonBg} ${col.theme.buttonHover}`}>Accept</button>
              <button onClick={() => onRejectOrder && onRejectOrder(order._id)} className="w-full bg-white border border-[#fca5a5] text-[#dc2626] text-xs font-bold py-2 rounded-lg hover:bg-[#fef2f2] transition-colors">Reject</button>
            </>
          )}
          {col.id === 'accepted' && (
            <button onClick={() => onUpdateStatus && onUpdateStatus(order._id, 'preparing')} className={`w-full text-white text-xs font-bold py-2 rounded-lg transition-colors ${col.theme.buttonBg} ${col.theme.buttonHover}`}>Start Preparing</button>
          )}
          {col.id === 'preparing' && (
            <button onClick={() => onUpdateStatus && onUpdateStatus(order._id, 'ready')} className={`w-full text-white text-xs font-bold py-2 rounded-lg transition-colors ${col.theme.buttonBg} ${col.theme.buttonHover}`}>Mark as Ready</button>
          )}
          {col.id === 'ready' && (
            <button onClick={() => onUpdateStatus && onUpdateStatus(order._id, 'picked_up')} className={`w-full text-white text-xs font-bold py-2 rounded-lg transition-colors ${col.theme.buttonBg} ${col.theme.buttonHover}`}>
              {order.orderType === 'pickup' ? 'Ready for Pickup' : 'Handed to Rider'}
            </button>
          )}
          {col.id === 'out_for_delivery' && (
            <button 
              onClick={() => {
                if (order.trackingUrl) window.open(order.trackingUrl, '_blank');
              }}
              disabled={!order.trackingUrl}
              className={`w-full text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${col.theme.buttonBg} ${col.theme.buttonHover} ${!order.trackingUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
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
    <div className="flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0 pt-2 pl-2 pr-4">
        <div>
          <h2 className="text-xl font-bold text-[#111827]">Live Orders</h2>
          <p className="text-sm text-[#6b7280]">Track and manage orders in real time</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onRefresh} className="flex items-center gap-2 bg-[#8B0000] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#7f0000] transition-colors shadow-sm">
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row flex-1 gap-6 overflow-hidden pl-2">
        
        {/* Kanban Board Container */}
        <div className="relative flex-1 overflow-hidden flex flex-col min-w-0">
          
          {/* Left Gradient & Scroll Button */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-[#F8FAFC] to-transparent z-10 flex items-center">
              <button 
                onClick={() => scrollByAmount(-300)} 
                className="w-8 h-8 ml-1 flex items-center justify-center bg-white border border-[#e5e7eb] rounded-full shadow-md text-[#4b5563] hover:text-[#8B0000] hover:border-[#8B0000] transition-colors"
              >
                <ChevronLeft className="w-5 h-5 -ml-0.5" />
              </button>
            </div>
          )}

          {/* Kanban Columns (Scrollable X) */}
          <div 
            ref={scrollContainerRef}
            onScroll={checkForScrollPosition}
            className="flex-1 overflow-x-auto hide-scrollbar scroll-smooth pb-4 min-w-0 relative"
          >
            <div className="flex gap-4 h-full min-w-max px-1">
              
              {columns.map(col => {
                const visibleCount = getVisibleCount(col.id);
                const visibleOrders = col.orders.slice(0, visibleCount);
                const hasMore = col.orders.length > visibleCount;

                return (
                  <div key={col.id} className={`w-[270px] flex flex-col h-full rounded-2xl ${col.theme.bg} border ${col.theme.border} p-3`}>
                    
                    {/* Column Header */}
                    <div className="flex justify-between items-center mb-4 shrink-0 px-1">
                      <h3 className={`font-bold text-sm ${col.theme.text}`}>{col.title}</h3>
                      <span className={`${col.theme.badgeBg} ${col.theme.text} text-xs font-extrabold px-2 py-0.5 rounded-full`}>
                        {col.orders.length}
                      </span>
                    </div>

                    {/* Column Body with Drag & Drop */}
                    <div 
                      className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pb-2"
                      onDragOver={(e) => { e.preventDefault(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const orderId = e.dataTransfer.getData('orderId');
                        const sourceCol = e.dataTransfer.getData('sourceCol');
                        if (sourceCol !== col.id && onUpdateStatus) {
                          let targetStatus = col.id;
                          if (col.id === 'out_for_delivery') targetStatus = 'out for delivery';
                          onUpdateStatus(orderId, targetStatus);
                        }
                      }}
                    >
                      {/* Render Visible Orders */}
                      {visibleOrders.map(order => renderCard(order, col))}

                      {/* Load More Button for this specific column */}
                      {hasMore && (
                        <button 
                          onClick={() => handleLoadMore(col.id)}
                          className="w-full mt-2 py-2 bg-white/50 border border-dashed border-[#d1d5db] text-[#4b5563] rounded-xl text-xs font-bold hover:bg-white hover:border-solid hover:text-[#111827] transition-all"
                        >
                          Load More ({col.orders.length - visibleCount} left)
                        </button>
                      )}

                      {/* Empty State */}
                      {col.orders.length === 0 && (
                        <div className="h-24 flex items-center justify-center text-xs text-[#9ca3af] font-medium py-10 text-center px-4 border-2 border-dashed border-[#d1d5db] rounded-xl bg-white/40">
                          No orders
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

          {/* Right Gradient & Scroll Button */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-[#F8FAFC] to-transparent z-10 flex items-center justify-end">
              <button 
                onClick={() => scrollByAmount(300)} 
                className="w-8 h-8 mr-1 flex items-center justify-center bg-white border border-[#e5e7eb] rounded-full shadow-md text-[#4b5563] hover:text-[#8B0000] hover:border-[#8B0000] transition-colors"
              >
                <ChevronRight className="w-5 h-5 ml-0.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar (Order Summary) */}
        <div className="w-full xl:w-[300px] shrink-0 overflow-y-auto custom-scrollbar pr-4 space-y-6 pb-6">
          
          {/* Order Summary */}
          <div className="bg-[#F8FAFC] border border-[#e5e7eb] rounded-2xl p-5">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[13px] font-extrabold text-[#111827]">Today's Summary</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-[#6b7280]">Total Orders</span>
                <span className="text-xs font-extrabold text-[#111827]">{todayOrders.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-[#6b7280]">Completed</span>
                <span className="text-xs font-extrabold text-[#166534]">{completedToday.length} <span className="text-xs font-medium">({completedPercentage}%)</span></span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-[#6b7280]">Cancelled</span>
                <span className="text-xs font-extrabold text-[#dc2626]">{cancelledToday.length} <span className="text-xs font-medium">({cancelledPercentage}%)</span></span>
              </div>
            </div>
            <button onClick={() => onViewAll && onViewAll('all-orders')} className="text-xs font-extrabold text-[#dc2626] flex items-center gap-1 mt-6 hover:underline">
              View All Orders <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Recent Completed Orders */}
          <div className="bg-[#F8FAFC] rounded-2xl">
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="text-[13px] font-extrabold text-[#111827]">Recent Completed</h3>
              <button onClick={() => onViewAll && onViewAll('all-orders')} className="text-xs font-extrabold text-[#dc2626] hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {orders.filter(o => ['delivered', 'completed'].includes(o.status?.toLowerCase())).length > 0 ? (
                orders.filter(o => ['delivered', 'completed'].includes(o.status?.toLowerCase()))
                  .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
                  .slice(0, 5).map((order, idx) => (
                  <div key={order._id || idx} className="flex justify-between items-start border-b border-[#e5e7eb] pb-3 last:border-0 px-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#6b7280]">#{order.orderNumber || order._id?.toString().slice(-6)}</span>
                        <span className="text-xs font-bold text-[#111827]">{order.customerName || 'Guest'}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3 h-3 text-[#166534]" />
                        <span className="text-xs font-medium text-[#6b7280]">Delivered • {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#111827]">${(order.total || 0).toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs font-medium text-[#6b7280] border border-dashed border-[#d1d5db] rounded-lg">
                  No completed orders yet
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}