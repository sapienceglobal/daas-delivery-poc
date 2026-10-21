import React, { useState, useEffect, useRef } from 'react';
import { 
  RefreshCcw, Filter, LayoutGrid, Phone, ShoppingBag, Truck,
  CheckCircle2, AlertTriangle, ArrowRight, XCircle, Clock,
  ChevronLeft, ChevronRight, Bell
} from 'lucide-react';
import { useMerchantContext } from '@/context/MerchantContext';
import { useRouter } from 'next/navigation';
import { formatTime } from '@/lib/formatters';
import { QRCodeSVG } from 'qrcode.react';
import { createPortal } from 'react-dom';
import { QrCode, CreditCard } from 'lucide-react';
import PaymentSimulatorModal from '@/components/checkout/PaymentSimulatorModal';
import { api } from '@/lib/api';
import { showToast } from '@/components/ui';
import DispatchControl from '@/components/merchant/DispatchControl';

export default function LiveOrdersView({ 
  orders = [], 
  onAcceptOrder, 
  onRejectOrder, 
  onUpdateStatus,
  onRefresh,
  onViewAll,
  serverTime
}) {
  const { restaurant } = useMerchantContext();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [qrModalOrder, setQrModalOrder] = useState(null);
  const [stripeModalOrder, setStripeModalOrder] = useState(null);
  const [modalTimeLeft, setModalTimeLeft] = useState(0);

  useEffect(() => {
    let interval;
    if (qrModalOrder && qrModalOrder.createdAt) {
      const calculateTimeLeft = () => {
        const createdAtTime = new Date(qrModalOrder.createdAt).getTime();
        const expiresAtTime = createdAtTime + 10 * 60 * 1000;
        const now = Date.now();
        const diff = Math.floor((expiresAtTime - now) / 1000);
        setModalTimeLeft(diff > 0 ? diff : 0);
      };
      calculateTimeLeft();
      interval = setInterval(calculateTimeLeft, 1000);
    }
    return () => clearInterval(interval);
  }, [qrModalOrder]);
  
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
      // added 1px tolerance for floating point rounding issues
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

  // window Resize Listener
  useEffect(() => {
    window.addEventListener('resize', checkForScrollPosition);
    return () => window.removeEventListener('resize', checkForScrollPosition);
  }, []);

  // mouse Wheel Horizontal Scroll Listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      // convert vertical scroll to horizontal scroll
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

  // group orders by status
  const getColOrders = (statuses) => orders.filter(o => statuses.includes((o.status || '').toLowerCase()));

  const columns = [
    {
      id: 'new',
      title: 'New Orders',
      theme: { 
        bg: 'bg-rose-500/5 dark:bg-rose-950/20', 
        text: 'text-rose-500 dark:text-rose-400', 
        badgeBg: 'bg-rose-500/20 dark:bg-rose-500/25', 
        border: 'border-rose-500/20 dark:border-rose-500/30', 
        buttonBg: 'bg-rose-600', 
        buttonHover: 'hover:bg-rose-500' 
      },
      orders: getColOrders(['new', 'pending'])
    },
    {
      id: 'accepted',
      title: 'Accepted',
      theme: { 
        bg: 'bg-amber-500/5 dark:bg-amber-950/20', 
        text: 'text-amber-500 dark:text-amber-400', 
        badgeBg: 'bg-amber-500/20 dark:bg-amber-500/25', 
        border: 'border-amber-500/20 dark:border-amber-500/30', 
        buttonBg: 'bg-amber-600', 
        buttonHover: 'hover:bg-amber-500' 
      },
      orders: getColOrders(['accepted', 'driver_assigned'])
    },
    {
      id: 'preparing',
      title: 'Preparing',
      theme: { 
        bg: 'bg-purple-500/5 dark:bg-purple-950/20', 
        text: 'text-purple-500 dark:text-purple-400', 
        badgeBg: 'bg-purple-500/20 dark:bg-purple-500/25', 
        border: 'border-purple-500/20 dark:border-purple-500/30', 
        buttonBg: 'bg-purple-600', 
        buttonHover: 'hover:bg-purple-500' 
      },
      orders: getColOrders(['preparing'])
    },
    {
      id: 'ready',
      title: 'Ready',
      theme: { 
        bg: 'bg-emerald-500/5 dark:bg-emerald-950/20', 
        text: 'text-emerald-500 dark:text-emerald-400', 
        badgeBg: 'bg-emerald-500/20 dark:bg-emerald-500/25', 
        border: 'border-emerald-500/20 dark:border-emerald-500/30', 
        buttonBg: 'bg-emerald-600', 
        buttonHover: 'hover:bg-emerald-500' 
      },
      orders: getColOrders(['ready'])
    },
    {
      id: 'out_for_delivery',
      title: 'Out for Delivery',
      theme: { 
        bg: 'bg-blue-500/5 dark:bg-blue-950/20', 
        text: 'text-blue-500 dark:text-blue-400', 
        badgeBg: 'bg-blue-500/20 dark:bg-blue-500/25', 
        border: 'border-blue-500/20 dark:border-blue-500/30', 
        buttonBg: 'bg-blue-600', 
        buttonHover: 'hover:bg-blue-500' 
      },
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
    if (t.includes('no onion') || t.includes('no garlic')) return 'text-emerald-500 bg-emerald-500/15 border-emerald-500/25';
    if (t.includes('medium')) return 'text-amber-500 bg-amber-500/15 border-amber-500/25';
    if (t.includes('extra') || t.includes('spicy')) return 'text-purple-400 bg-purple-500/15 border-purple-500/25';
    return 'text-rose-500 bg-rose-500/15 border-rose-500/25';
  };

  const renderCard = (order, col) => {
    const isDigitalPayment = ['credit_card', 'digital_wallet', 'payment_link'].includes(order.paymentMethod);
    return (
      <div 
        key={order._id} 
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('orderId', order._id);
          e.dataTransfer.setData('sourceCol', col.id);
        }}
        className="bg-admin-card rounded-2xl shadow-sm border border-admin-border p-4 flex flex-col transition-all hover:border-admin-border-light hover:shadow-md cursor-grab active:cursor-grabbing mb-3.5 last:mb-0 text-admin-text"
      >
        <div className="flex justify-between items-center mb-1">
          <p className="text-xs font-extrabold font-heading text-admin-text">#{order.orderNumber || order._id?.toString().slice(-6)}</p>
          <span className="text-[11px] font-medium text-admin-text-secondary">{getTimeAgo(order.createdAt)}</span>
        </div>

        <p className="text-xs font-bold text-admin-text mb-2">{order.customerName || 'Guest'}</p>

        <div className="flex flex-col gap-1.5 text-xs text-admin-text-secondary mb-3">
          <div className="flex items-center gap-1.5">
            {order.orderType === 'pickup' ? <ShoppingBag className="w-3.5 h-3.5 text-admin-text" /> : <Truck className="w-3.5 h-3.5 text-admin-text" />}
            <span className="font-semibold capitalize text-admin-text">{order.orderType || 'Delivery'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-admin-text-muted" />
            <span>{order.customerPhone || 'N/A'}</span>
          </div>
        </div>

        <div className="flex justify-between items-center py-2 border-y border-admin-border/60 mb-2.5">
          <span className="text-xs font-bold text-admin-text-secondary">{order.items?.length || 0} Items</span>
          <span className="text-sm font-extrabold font-heading text-brand">${(order.total || 0).toFixed(2)}</span>
        </div>

        <div className="text-xs text-admin-text font-medium space-y-1 mb-3">
          {(order.items || []).slice(0, 4).map((it, idx) => (
            <p key={idx} className="flex flex-col items-start border-b border-admin-border/40 pb-1 last:border-0 last:pb-0">
              <span className="flex-1 text-admin-text"><span className="mr-1 mt-0.5 text-admin-text-muted">•</span> {it.name} x{it.quantity}</span>
              {it.selectedSize?.name && <span className="text-[11px] text-admin-text-secondary ml-3 italic">Size: {it.selectedSize.name}</span>}
              {(it.addOns || []).map((addon, i) => (
                <span key={i} className="text-[11px] text-admin-text-secondary ml-3 italic">+ {addon.name}</span>
              ))}
            </p>
          ))}
          {(order.items?.length > 4) && <p className="text-admin-text-muted italic ml-2">+ {order.items.length - 4} more</p>}
        </div>

        {order.specialInstructions && (
          <div className="mb-3 flex flex-wrap gap-1">
            <span className={`text-[11px] font-bold border rounded-lg px-2 py-0.5 max-w-full truncate ${getSpecialInstructionColor(order.specialInstructions)}`}>
              {order.specialInstructions}
            </span>
          </div>
        )}

        {col.id === 'preparing' && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-admin-text-secondary mb-3">
            <Clock className="w-3.5 h-3.5" /> Prep. Time: 20-25 min
          </div>
        )}
        {col.id === 'out_for_delivery' && (
          <div className="flex flex-col gap-0.5 text-xs font-medium text-admin-text-secondary mb-3">
            <span>Rider: {order.courierName ? order.courierName : 'Assigning rider...'}</span>
            {order.courierPhoneForCustomer ? (
              <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> (Customer): {order.courierPhoneForCustomer}</span>
            ) : order.courierPhone && (
              <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {order.courierPhone}</span>
            )}
            {order.courierPhoneForRestaurant && (
              <span className="flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3"/> (Restaurant): {order.courierPhoneForRestaurant}</span>
            )}
          </div>
        )}

        <DispatchControl order={order} onRefresh={onRefresh} serverTime={serverTime} />

        <div className="mt-auto flex flex-col gap-2">
            {col.id === 'new' && (
              <div className="flex flex-col gap-2 mt-2">
                {order.paymentStatus !== 'paid' ? (
                  <>
                    <div className="w-full flex items-center justify-center gap-2 bg-rose-500/10 border border-rose-500/25 py-2 rounded-xl text-rose-500">
                      <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                      <span className="text-xs font-bold">Awaiting Payment...</span>
                    </div>
                    <button 
                      onClick={() => setQrModalOrder(order)} 
                      className="w-full bg-admin-surface border border-admin-border text-admin-text text-xs font-bold py-2 rounded-xl hover:bg-admin-surface-light transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <QrCode className="w-3.5 h-3.5 text-brand" /> Show QR Code
                    </button>
                    <button
                      onClick={() => setStripeModalOrder(order)}
                      className="w-full bg-admin-surface border border-blue-500/30 text-blue-500 text-xs font-bold py-2 rounded-xl hover:bg-blue-500/10 transition-colors flex items-center justify-center gap-1.5 mt-1 cursor-pointer shadow-2xs"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Charge Card (Stripe)
                    </button>
                    <button onClick={() => onRejectOrder && onRejectOrder(order._id)} className="w-full bg-admin-surface border border-rose-500/30 text-rose-500 text-xs font-bold py-2 rounded-xl hover:bg-rose-500/10 transition-colors mt-1 cursor-pointer">Cancel Order</button>
                  </>
                ) : (
                  <div className="flex gap-2 w-full">
                    <button onClick={() => onAcceptOrder && onAcceptOrder(order._id)} className={`w-full text-white text-xs font-bold py-2 rounded-xl transition-all shadow-sm cursor-pointer ${col.theme.buttonBg} ${col.theme.buttonHover}`}>Accept</button>
                    <button onClick={() => onRejectOrder && onRejectOrder(order._id)} className="w-full bg-admin-surface border border-rose-500/30 text-rose-500 text-xs font-bold py-2 rounded-xl hover:bg-rose-500/10 transition-colors cursor-pointer">Reject</button>
                  </div>
                )}
              </div>
            )}
          {col.id === 'accepted' && (
            <button onClick={() => onUpdateStatus && onUpdateStatus(order._id, 'preparing')} className={`w-full text-white text-xs font-bold py-2 rounded-xl transition-all shadow-sm cursor-pointer ${col.theme.buttonBg} ${col.theme.buttonHover}`}>Start Preparing</button>
          )}
          {col.id === 'preparing' && (
            <button onClick={() => onUpdateStatus && onUpdateStatus(order._id, 'ready')} className={`w-full text-white text-xs font-bold py-2 rounded-xl transition-all shadow-sm cursor-pointer ${col.theme.buttonBg} ${col.theme.buttonHover}`}>Mark as Ready</button>
          )}
          {col.id === 'ready' && order.orderType === 'pickup' && (
            <div className="flex flex-col gap-2">
              <div className={`w-full flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-xl border-2 border-dashed border-emerald-500/30 text-emerald-400 bg-emerald-500/10`}>
                <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                Waiting for Customer...
              </div>
              <button onClick={() => onUpdateStatus && onUpdateStatus(order._id, 'picked_up')} className={`w-full text-white text-xs font-bold py-2 rounded-xl transition-all shadow-sm cursor-pointer ${col.theme.buttonBg} ${col.theme.buttonHover}`}>
                Handed to Customer
              </button>
            </div>
          )}
          {col.id === 'ready' && order.orderType === 'delivery' && (
            <div className={`w-full flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-xl border-2 border-dashed border-emerald-500/30 text-emerald-400 bg-emerald-500/10`}>
              <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              Waiting for Rider...
            </div>
          )}
          {col.id === 'out_for_delivery' && (
            <div className="flex flex-col gap-1.5">
              <button 
                onClick={() => {
                  const url = order.thirdPartyTrackingUrl || order.trackingUrl;
                  if (url) window.open(url, '_blank');
                }}
                disabled={!order.thirdPartyTrackingUrl && !order.trackingUrl}
                className={`w-full text-white text-xs font-bold py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${col.theme.buttonBg} ${col.theme.buttonHover} ${!order.thirdPartyTrackingUrl && !order.trackingUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Truck className="w-3.5 h-3.5" /> Track Order
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // right Sidebar Stats
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());
  const completedToday = todayOrders.filter(o => ['delivered', 'completed', 'picked_up'].includes(o.status?.toLowerCase()));
  const cancelledToday = todayOrders.filter(o => ['cancelled', 'refunded'].includes(o.status?.toLowerCase()));
  
  const completedPercentage = todayOrders.length ? Math.round((completedToday.length / todayOrders.length) * 100) : 0;
  const cancelledPercentage = todayOrders.length ? Math.round((cancelledToday.length / todayOrders.length) * 100) : 0;

  return (
    <>
    <div className="flex flex-col h-full overflow-hidden bg-transparent text-admin-text relative space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center shrink-0 pt-2 px-1">
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-admin-text tracking-tight">
            Live Orders
          </h2>
          <p className="text-xs sm:text-sm text-admin-text-secondary mt-1">
            Track and manage incoming orders in real time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onRefresh} 
            className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold hover:brightness-110 transition-all shadow-sm cursor-pointer"
          >
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row flex-1 gap-6 overflow-hidden">
        
        {/* Kanban Board Container */}
        <div className="relative flex-1 overflow-hidden flex flex-col min-w-0">

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
                  <div key={col.id} className={`w-[280px] flex flex-col h-full rounded-2xl ${col.theme.bg} border ${col.theme.border} p-3.5 backdrop-blur-xs`}>
                    
                    {/* Column Header */}
                    <div className="flex justify-between items-center mb-4 shrink-0 px-1">
                      <h3 className={`font-heading font-bold text-sm ${col.theme.text}`}>{col.title}</h3>
                      <span className={`${col.theme.badgeBg} ${col.theme.text} text-xs font-extrabold px-2.5 py-0.5 rounded-full`}>
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
                          className="w-full mt-2 py-2 bg-admin-surface/70 border border-dashed border-admin-border text-admin-text-secondary rounded-xl text-xs font-bold hover:bg-admin-surface hover:text-admin-text transition-all cursor-pointer"
                        >
                          Load More ({col.orders.length - visibleCount} left)
                        </button>
                      )}

                      {/* Empty State */}
                      {col.orders.length === 0 && (
                        <div className="h-28 flex items-center justify-center text-xs text-admin-text-muted font-medium py-10 text-center px-4 border-2 border-dashed border-admin-border/60 rounded-xl bg-admin-surface/30">
                          No orders
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

          {/* Left Gradient & Scroll Button */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-admin-bg to-transparent z-50 flex items-center pointer-events-none">
              <button 
                onClick={() => scrollByAmount(-300)} 
                className="pointer-events-auto w-9 h-9 ml-1 flex items-center justify-center bg-admin-surface border border-admin-border rounded-full shadow-md text-admin-text hover:text-brand hover:bg-admin-surface-light transition-all cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 -ml-0.5" />
              </button>
            </div>
          )}

          {/* Right Gradient & Scroll Button */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-admin-bg to-transparent z-50 flex items-center justify-end pointer-events-none">
              <button 
                onClick={() => scrollByAmount(300)} 
                className="pointer-events-auto w-9 h-9 mr-1 flex items-center justify-center bg-admin-surface border border-admin-border rounded-full shadow-md text-admin-text hover:text-brand hover:bg-admin-surface-light transition-all cursor-pointer"
              >
                <ChevronRight className="w-5 h-5 ml-0.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar (Order Summary) */}
        <div className="w-full xl:w-[320px] shrink-0 overflow-y-auto custom-scrollbar pr-1 space-y-6 pb-6">
          
          {/* Notification Alerts Status */}
          {(() => {
            const push = restaurant?.notificationSettings?.pushEnabled;
            const wa = restaurant?.notificationSettings?.whatsappEnabled;
            
            let statusText = "Alerts are currently OFF";
            let detailsText = "You won't receive external notifications for new orders.";
            let bgClass = "bg-rose-500/10 border-rose-500/25";
            let textClass = "text-rose-500 dark:text-rose-400";
            let iconBgClass = "bg-rose-500/20";

            if (push && wa) {
              statusText = "All Alerts Active";
              detailsText = "Receiving via WhatsApp and Desktop Push.";
              bgClass = "bg-emerald-500/10 border-emerald-500/25";
              textClass = "text-emerald-500 dark:text-emerald-400";
              iconBgClass = "bg-emerald-500/20";
            } else if (wa) {
              statusText = "WhatsApp Alerts Active";
              detailsText = "Desktop push notifications are disabled.";
              bgClass = "bg-amber-500/10 border-amber-500/25";
              textClass = "text-amber-500 dark:text-amber-400";
              iconBgClass = "bg-amber-500/20";
            } else if (push) {
              statusText = "Push Alerts Active";
              detailsText = "WhatsApp notifications are disabled.";
              bgClass = "bg-blue-500/10 border-blue-500/25";
              textClass = "text-blue-500 dark:text-blue-400";
              iconBgClass = "bg-blue-500/20";
            }

            return (
              <div className={`${bgClass} border rounded-2xl p-4 flex flex-col gap-2 transition-colors`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl ${iconBgClass} flex items-center justify-center shrink-0`}>
                    <Bell className={`w-4 h-4 ${textClass}`} />
                  </div>
                  <div>
                    <h3 className={`text-xs font-bold font-heading ${textClass}`}>{statusText}</h3>
                    <p className={`text-xs ${textClass} mt-0.5 leading-snug opacity-90`}>
                      {detailsText}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => router.push('/merchant/settings?tab=order&scroll=notifications')}
                  className={`mt-1 self-start text-xs font-bold ${textClass} hover:underline cursor-pointer`}
                >
                  Manage Notifications &rarr;
                </button>
              </div>
            );
          })()}

          {/* Order Summary */}
          <div className="bg-admin-card border border-admin-border rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading text-sm font-bold text-admin-text">Today's Summary</h3>
            </div>
            <div className="space-y-3.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-admin-text-secondary">Total Orders</span>
                <span className="text-xs font-extrabold font-heading text-admin-text">{todayOrders.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-admin-text-secondary">Completed</span>
                <span className="text-xs font-extrabold font-heading text-emerald-500">{completedToday.length} <span className="text-xs font-medium">({completedPercentage}%)</span></span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-admin-text-secondary">Cancelled</span>
                <span className="text-xs font-extrabold font-heading text-rose-500">{cancelledToday.length} <span className="text-xs font-medium">({cancelledPercentage}%)</span></span>
              </div>
            </div>
            <button 
              onClick={() => onViewAll && onViewAll('all-orders')} 
              className="text-xs font-extrabold text-brand flex items-center gap-1 mt-5 hover:underline cursor-pointer"
            >
              View All Orders <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Recent Completed Orders */}
          <div className="bg-admin-card border border-admin-border rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading text-sm font-bold text-admin-text">Recent Completed</h3>
              <button onClick={() => onViewAll && onViewAll('all-orders')} className="text-xs font-bold text-brand hover:underline cursor-pointer">View All</button>
            </div>
            <div className="space-y-3">
              {orders.filter(o => ['delivered', 'completed'].includes(o.status?.toLowerCase())).length > 0 ? (
                orders.filter(o => ['delivered', 'completed'].includes(o.status?.toLowerCase()))
                  .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
                  .slice(0, 5).map((order, idx) => (
                  <div key={order._id || idx} className="flex justify-between items-start border-b border-admin-border/50 pb-3 last:border-0 last:pb-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-heading text-admin-text-secondary">#{order.orderNumber || order._id?.toString().slice(-6)}</span>
                        <span className="text-xs font-bold text-admin-text">{order.customerName || 'Guest'}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span className="text-[11px] font-medium text-admin-text-secondary">Delivered • {formatTime(order.createdAt, restaurant?.timeFormat, restaurant?.timezone)}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-heading text-brand">${(order.total || 0).toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-5 text-xs font-medium text-admin-text-muted border border-dashed border-admin-border rounded-xl bg-admin-surface-light/30">
                  No completed orders yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  
      {/* QR Code Modal */}
      {mounted && qrModalOrder && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-admin-surface border border-admin-border text-admin-text rounded-2xl w-full max-w-[450px] overflow-hidden shadow-2xl flex flex-col p-6 sm:p-8 text-center relative animate-in fade-in zoom-in-95">
            <button 
              onClick={() => setQrModalOrder(null)} 
              className="absolute top-4 right-4 text-admin-text-secondary hover:text-admin-text bg-admin-surface-light rounded-xl p-2 transition-colors cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl sm:text-2xl font-black font-heading text-admin-text mb-1">Pending Payment</h2>
            <p className="text-xs sm:text-sm text-admin-text-secondary mb-6">Order #{qrModalOrder._id.slice(-6).toUpperCase()}</p>

            <div className="flex justify-center bg-white p-4 border border-admin-border rounded-2xl mb-5 shadow-inner mx-auto w-fit">
              <QRCodeSVG value={`${window.location.origin}/api/orders/${qrModalOrder._id}/pay`} size={190} level="H" />
            </div>

            <div className="text-center font-bold text-xs sm:text-sm text-rose-500 mb-5 bg-rose-500/10 border border-rose-500/20 rounded-xl py-2">
              Time Remaining: {Math.floor(modalTimeLeft / 60).toString().padStart(2, '0')}:{(modalTimeLeft % 60).toString().padStart(2, '0')}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                className="w-full py-2 bg-admin-surface-light border border-admin-border rounded-xl font-bold text-admin-text hover:bg-admin-surface-hover transition-colors text-xs cursor-pointer shadow-2xs"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/api/orders/${qrModalOrder._id}/pay`);
                  alert('Link copied to clipboard!');
                }}
              >
                Copy Link
              </button>
              <button
                className={`w-full py-2 rounded-xl font-bold transition-colors text-xs cursor-pointer shadow-2xs ${(!qrModalOrder.customerPhone || qrModalOrder.customerPhone === '0000000000') ? 'opacity-50 cursor-not-allowed text-admin-text-muted border border-admin-border' : 'text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/10'}`}
                disabled={!qrModalOrder.customerPhone || qrModalOrder.customerPhone === '0000000000'}
                title={(!qrModalOrder.customerPhone || qrModalOrder.customerPhone === '0000000000') ? 'Number provide nhi kiya gaya' : 'Send WhatsApp Message'}
                onClick={() => {
                  if (qrModalOrder.customerPhone && qrModalOrder.customerPhone !== '0000000000') {
                    const payUrl = `${window.location.origin}/api/orders/${qrModalOrder._id}/pay`;
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payUrl)}`;
                    const message = `Hi${qrModalOrder.customerName ? ' ' + qrModalOrder.customerName : ''}! 👋\n\nPlease complete the payment for your order #${qrModalOrder._id.slice(-6).toUpperCase()}.\n\n🔗 *Click here to pay:* \n${payUrl}\n\n📷 *Or scan this QR code:* \n${qrUrl}\n\nThank you!`;
                    const rawPhone = qrModalOrder.customerPhone.trim();
                    const digits = rawPhone.replace(/[^\d]/g, '');
                    const intlPhone = digits.startsWith('0') ? '1' + digits.slice(1) : (digits.length === 10 ? '1' + digits : digits);
                    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`, '_blank');
                  }
                }}
              >
                WhatsApp
              </button>
              <button
                className="w-full py-2 bg-admin-surface-light border border-blue-500/30 text-blue-500 rounded-xl font-bold hover:bg-blue-500/10 transition-colors text-xs cursor-pointer shadow-2xs"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Payment Link',
                      url: `${window.location.origin}/api/orders/${qrModalOrder._id}/pay`
                    }).catch(console.error);
                  } else {
                    navigator.clipboard.writeText(`${window.location.origin}/api/orders/${qrModalOrder._id}/pay`);
                    alert('Link copied to clipboard!');
                  }
                }}
              >
                Share
              </button>
            </div>

            <div className="flex flex-col gap-2 mt-5">
              <button
                className="w-full py-2.5 bg-admin-surface-light border border-admin-border text-admin-text font-bold rounded-xl hover:bg-admin-surface-hover transition-colors text-xs sm:text-sm cursor-pointer"
                onClick={() => {
                  setQrModalOrder(null);
                }}
              >
                Run in Background
              </button>
              <button
                className="w-full py-2.5 bg-admin-surface-light border border-rose-500/30 text-rose-500 font-bold rounded-xl hover:bg-rose-500/10 transition-colors text-xs sm:text-sm cursor-pointer"
                onClick={async () => {
                  if (onRejectOrder) onRejectOrder(qrModalOrder._id);
                  setQrModalOrder(null);
                }}
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {mounted && stripeModalOrder && (
        <PaymentSimulatorModal
          isOpen={!!stripeModalOrder}
          onClose={() => setStripeModalOrder(null)}
          amount={stripeModalOrder.total}
          orderId={stripeModalOrder._id}
          checkoutData={{
            customerName: stripeModalOrder.customerName || '',
            customerEmail: stripeModalOrder.customerEmail || '',
            customerPhone: stripeModalOrder.customerPhone || ''
          }}
          onSuccess={async (paymentIntentId) => {
            setStripeModalOrder(null);
            try {
              await api.put(`/api/orders/${stripeModalOrder._id}/payment`, {
                paymentMethod: 'credit_card',
                paymentStatus: 'paid',
                stripePaymentIntentId: paymentIntentId
              });
              showToast('Order paid successfully via Stripe!', 'success');
              if (onRefresh) onRefresh();
            } catch (err) {
              showToast('Payment successful but failed to update order status. Please refresh.', 'warning');
            }
          }}
        />
      )}
    </>
  );
}
