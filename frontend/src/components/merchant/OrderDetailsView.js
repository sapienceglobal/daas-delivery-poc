import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Printer, Send, ChevronDown, MoreVertical, 
  MapPin, Bell, Calendar, Clock, Edit, Phone, Mail, FileText,
  CheckCircle, MessageSquare, Bike, RefreshCcw, XCircle, FileClock
} from 'lucide-react';
import { orderAPI } from '@/lib/api';
import { showToast } from '@/components/ui';
import { useMerchantContext } from '@/context/MerchantContext';
import { formatCurrency, formatDate, formatTime } from '@/lib/formatters';

export default function OrderDetailsView({ order: initialOrder, onBack, onUpdateStatus, onRefresh }) {
  const { restaurant } = useMerchantContext();
  const [order, setOrder] = useState(initialOrder);
  const [mounted, setMounted] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchOrder = async () => {
      try {
        const res = await orderAPI.getRestaurantOrders(initialOrder.restaurantId, `_id=${initialOrder._id}`);
        const freshOrder = res.data?.data?.find(o => o._id === initialOrder._id);
        if (freshOrder) setOrder(freshOrder);
      } catch (err) {
        console.error('Failed to fetch fresh order details', err);
      }
    };
    fetchOrder();
  }, [initialOrder]);

  if (!mounted || !order) return null;

  const handleRefund = async () => {
    if (order.status === 'refunded' || order.paymentStatus === 'refunded') {
      showToast('Order is already refunded', 'info');
      return;
    }
    const confirmRefund = window.confirm('Are you sure you want to refund this order?');
    if (!confirmRefund) return;
    
    setIsRefunding(true);
    try {
      await orderAPI.refund(order._id, { reason: 'Merchant initiated refund' });
      showToast('Order refunded successfully', 'success');
      if (onRefresh) onRefresh();
      setOrder({ ...order, status: 'refunded', paymentStatus: 'refunded' });
    } catch (err) {
      showToast(err.message || 'Failed to refund order', 'error');
    } finally {
      setIsRefunding(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'preparing': return <span className="text-[#ea580c] font-bold text-xs bg-[#ffedd5] px-2 py-1 rounded">Preparing</span>;
      case 'new': 
      case 'pending': return <span className="text-[#dc2626] font-bold text-xs bg-[#fef2f2] px-2 py-1 rounded">New</span>;
      case 'out for delivery':
      case 'out_for_delivery': return <span className="text-[#16a34a] font-bold text-xs bg-[#dcfce7] px-2 py-1 rounded">Out for Delivery</span>;
      case 'accepted': return <span className="text-[#2563eb] font-bold text-xs bg-[#dbeafe] px-2 py-1 rounded">Accepted</span>;
      case 'ready': return <span className="text-[#3b82f6] font-bold text-xs bg-[#dbeafe] px-2 py-1 rounded">Ready</span>;
      case 'delivered':
      case 'picked_up':
      case 'completed': return <span className="text-[#16a34a] font-bold text-xs bg-[#dcfce7] px-2 py-1 rounded">Completed</span>;
      case 'cancelled': return <span className="text-[#6b7280] font-bold text-xs bg-[#f3f4f6] px-2 py-1 rounded">Cancelled</span>;
      case 'refunded': return <span className="text-[#ef4444] font-bold text-xs bg-[#fef2f2] px-2 py-1 rounded">Refunded</span>;
      default: return <span className="text-[#6b7280] font-bold text-xs bg-[#f3f4f6] px-2 py-1 rounded capitalize">{status}</span>;
    }
  };

  const getPaymentBadge = (status) => {
    if (status?.toLowerCase() === 'paid') return <span className="text-[#16a34a] font-bold text-xs bg-[#dcfce7] px-2 py-1 rounded">Paid</span>;
    if (status?.toLowerCase() === 'refunded') return <span className="text-[#ef4444] font-bold text-xs bg-[#fef2f2] px-2 py-1 rounded">Refunded</span>;
    return <span className="text-[#ea580c] font-bold text-xs bg-[#ffedd5] px-2 py-1 rounded capitalize">{status || 'Pending'}</span>;
  };

  const oStatus = (order.status || '').toLowerCase();
  
  let timelineSteps = [
    { key: 'placed', label: 'Order Placed', entity: 'By Customer' },
    { key: 'accepted', label: 'Order Confirmed', entity: 'System' },
    { key: 'preparing', label: 'Preparing', entity: 'Kitchen' },
    { key: 'ready', label: 'Ready for Pickup', entity: 'Kitchen' },
    { key: 'out_for_delivery', label: 'Out for Delivery', entity: 'Rider' },
    { key: 'delivered', label: 'Delivered', entity: 'Pending' }
  ];

  if (['cancelled', 'refunded'].includes(oStatus)) {
    timelineSteps = [
      { key: 'placed', label: 'Order Placed', entity: 'By Customer' },
      { key: 'cancelled', label: 'Order Cancelled', entity: 'System' }
    ];
  }

  // Helper to extract timestamp from statusUpdates array
  const getTimestampForStatus = (statusKey) => {
    let aliases = [];
    if (statusKey === 'placed') aliases = ['new', 'pending'];
    if (statusKey === 'accepted') aliases = ['accepted', 'paid'];
    if (statusKey === 'preparing') aliases = ['preparing'];
    if (statusKey === 'ready') aliases = ['ready'];
    if (statusKey === 'out_for_delivery') aliases = ['out_for_delivery', 'picked_up'];
    if (statusKey === 'delivered') aliases = ['delivered', 'completed'];
    if (statusKey === 'cancelled') aliases = ['cancelled', 'refunded'];

    const match = (order.statusUpdates || []).find(u => aliases.includes(u.status?.toLowerCase()));
    return match?.timestamp;
  };

  let currentStepIndex = 0;
  if (['cancelled', 'refunded'].includes(oStatus)) currentStepIndex = 1;
  else if (['delivered', 'completed'].includes(oStatus)) currentStepIndex = 5;
  else if (['out for delivery', 'out_for_delivery', 'picked_up'].includes(oStatus)) currentStepIndex = 4;
  else if (['ready'].includes(oStatus)) currentStepIndex = 3;
  else if (['preparing'].includes(oStatus)) currentStepIndex = 2;
  else if (['accepted'].includes(oStatus)) currentStepIndex = 1;

  const totalItems = (order.items || []).reduce((acc, it) => acc + it.quantity, 0);

  return (
    <div className="space-y-6 pb-10">
      
      {/* Top Header Row 1 */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#111827]">Order Details</h1>
          <p className="text-sm text-[#6b7280] mt-1">View and manage order information</p>
        </div>
        <div></div>
      </div>

      {/* Top Header Row 2 (Actions) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[#991b1b] font-bold text-xs border border-[#e5e7eb] bg-white px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Orders
        </button>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 text-[#374151] font-bold text-xs border border-[#e5e7eb] bg-white px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            <Printer className="w-3.5 h-3.5 text-[#6b7280]" /> Print Invoice
          </button>
        </div>
      </div>

      {/* Top 4 Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* Card 1: Order Summary */}
        <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-[18px] font-black text-[#111827]">#{order.orderNumber || order._id?.toString().slice(-6) || 'N/A'}</h2>
              {getStatusBadge(order.status)}
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-[#6b7280]">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#374151]" /> {formatDate(order.createdAt, restaurant?.dateFormat, restaurant?.timezone)}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#374151]" /> {formatTime(order.createdAt, restaurant?.timeFormat, restaurant?.timezone)}</span>
              <span>Via Website</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#f3f4f6]">
            <div className="text-center">
              <p className="text-[14px] font-black text-[#111827]">{totalItems}</p>
              <p className="text-xs font-bold text-[#6b7280]">Items</p>
            </div>
            <div className="text-center">
              <p className="text-[14px] font-black text-[#111827]">{formatCurrency(order.total, restaurant?.currency)}</p>
              <p className="text-xs font-bold text-[#6b7280]">Order Amount</p>
            </div>
            <div className="text-center">
              <p className={`text-[14px] font-black ${order.paymentStatus === 'paid' ? 'text-[#16a34a]' : order.paymentStatus === 'refunded' ? 'text-[#dc2626]' : 'text-[#ea580c]'}`}>
                {order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatus === 'refunded' ? 'Refunded' : 'Unpaid'}
              </p>
              <p className="text-xs font-bold text-[#6b7280]">Payment Status</p>
            </div>
            {(order.orderType || order.type) === 'delivery' && (
              <div className="text-center">
                <p className="text-[14px] font-black text-[#111827]">{order.dasherName ? order.dasherName.split(' ')[0] : 'N/A'}</p>
                <p className="text-xs font-bold text-[#6b7280]">Rider</p>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Customer Info */}
        <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-5 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-bold text-[#6b7280] mb-4">Customer Information</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#f3f4f6] flex items-center justify-center text-[12px] font-bold text-[#6b7280]">
              {(order.customerName || 'G')[0].toUpperCase()}
            </div>
            <div>
              <p className="text-[13px] font-black text-[#111827]">{order.customerName || 'Guest Customer'}</p>
              <p className="text-xs text-[#6b7280]">{order.customerPhone || 'No Phone Number'}</p>
            </div>
          </div>
          <div className="space-y-2 mt-auto">
            {order.customerEmail && (
               <p className="text-xs font-bold text-[#374151] flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-[#9ca3af]" /> {order.customerEmail}</p>
            )}
            <div className="text-xs font-bold text-[#374151] flex items-start gap-2">
               <MapPin className="w-3.5 h-3.5 text-[#9ca3af] shrink-0 mt-0.5" /> 
               <span className="leading-tight line-clamp-2">{order.address || 'Pickup / Dine-in (No Address)'}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Delivery Info */}
        <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-5 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-[#6b7280]">Delivery Information</h3>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs font-bold text-[#6b7280]">Delivery Type</p>
                <p className="text-xs font-bold text-[#111827] capitalize">{order.orderType || order.type || 'Delivery'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-[#6b7280]">Delivery Address</p>
                <p className="text-xs text-[#374151] leading-tight line-clamp-3">{order.address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-[#6b7280]">Delivery Instructions</p>
                <p className="text-xs text-[#374151] leading-tight line-clamp-2">{order.specialInstructions || order.courierNotes || 'None'}</p>
              </div>
            </div>
            <div className="w-16 h-16 bg-[#f3f4f6] rounded-lg shrink-0 flex items-center justify-center border border-[#e5e7eb]">
              <MapPin className="w-6 h-6 text-[#9ca3af]" />
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-[#f3f4f6] flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-[#111827]">Rider: {order.dasherName || 'Assigning...'}</p>
              <p className="text-xs text-[#6b7280]">{order.dasherPhone || 'N/A'}</p>
            </div>
            <a href={`tel:${order.dasherPhone || ''}`} className="w-6 h-6 rounded border border-[#e5e7eb] flex items-center justify-center text-[#374151] hover:bg-gray-50">
              <Phone className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Card 4: Payment Info */}
        <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-5 shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-[#6b7280]">Payment Information</h3>
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#6b7280]">Payment Method</span>
              <span className="font-bold text-[#16a34a] capitalize">{order.paymentMethod?.replace('_', ' ') || 'Cash'}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#6b7280]">Payment Status</span>
              {getPaymentBadge(order.paymentStatus)}
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#6b7280]">Transaction ID</span>
              <span className="font-bold text-[#111827]">{order.transactionId || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#6b7280]">Paid At</span>
              <span className="text-[#111827]">{order.paymentTime ? `${formatDate(order.paymentTime, restaurant?.dateFormat, restaurant?.timezone)} ${formatTime(order.paymentTime, restaurant?.timeFormat, restaurant?.timezone)}` : 'N/A'}</span>
            </div>
          </div>
          
          <div className="border-t border-[#f3f4f6] pt-3 mt-3 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#6b7280]">Subtotal</span>
              <span className="font-bold text-[#111827]">{formatCurrency(order.subtotal, restaurant?.currency)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#6b7280]">{restaurant?.taxType || 'Tax'}</span>
              <span className="font-bold text-[#111827]">{formatCurrency(order.tax, restaurant?.currency)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#6b7280]">Delivery Fee</span>
              <span className="font-bold text-[#111827]">{formatCurrency(order.deliveryFee, restaurant?.currency)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#6b7280]">Tip</span>
              <span className="font-bold text-[#111827]">{formatCurrency(order.tip, restaurant?.currency)}</span>
            </div>
            <div className="flex justify-between items-center text-[12px] pt-1 mt-1 border-t border-[#f3f4f6]">
              <span className="font-black text-[#111827]">Total Amount</span>
              <span className="font-black text-[#dc2626]">{formatCurrency(order.total, restaurant?.currency)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Middle Grid (Items, Timeline, Notes) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Order Items Table (Col 1 & 2 maybe? No, let's follow the image where Items is large, Timeline is mid, Notes is right) */}
        {/* Wait, the image shows Items (left half), Timeline (mid quarter), Notes/History (right quarter) */}
        <div className="lg:col-span-1 xl:col-span-1 bg-white border border-[#e5e7eb] rounded-[16px] shadow-sm flex flex-col" style={{gridColumn: 'span 1.5'}}>
           {/* Items Table */}
           <div className="p-5 border-b border-[#f3f4f6]">
             <h3 className="text-[12px] font-bold text-[#111827]">Order Items</h3>
           </div>
           <div className="overflow-x-auto flex-1">
             <table className="w-full text-left">
               <thead>
                 <tr className="border-b border-[#f3f4f6]">
                   <th className="px-5 py-3 text-xs font-bold text-[#6b7280] uppercase">Item</th>
                   <th className="px-5 py-3 text-xs font-bold text-[#6b7280] uppercase text-right">Price</th>
                   <th className="px-5 py-3 text-xs font-bold text-[#6b7280] uppercase text-center">Qty</th>
                   <th className="px-5 py-3 text-xs font-bold text-[#6b7280] uppercase text-right">Total</th>
                   <th className="px-5 py-3 text-xs font-bold text-[#6b7280] uppercase text-right">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-[#f9fafb]">
                 {(order.items || []).map((item, idx) => (
                   <tr key={idx}>
                     <td className="px-5 py-3">
                       <div className="flex items-center gap-3">
                         {item.image ? (
                           <img src={item.image} alt={item.name} className="w-8 h-8 rounded object-cover" />
                         ) : (
                           <div className="w-8 h-8 rounded bg-[#ffedd5] flex items-center justify-center text-xs font-bold text-[#ea580c] shrink-0">
                             {item.name?.substring(0,2).toUpperCase()}
                           </div>
                         )}
                         <div>
                           <p className="text-xs font-bold text-[#111827]">{item.name}</p>
                           <p className="text-xs text-[#6b7280] mt-0.5 line-clamp-1">
                             {[item.selectedSize?.name, ...(item.addOns || []).map(a => a.name)].filter(Boolean).join(', ')}
                           </p>
                         </div>
                       </div>
                     </td>
                     <td className="px-5 py-3 text-xs font-bold text-[#374151] text-right">{formatCurrency(item.price, restaurant?.currency)}</td>
                     <td className="px-5 py-3 text-xs font-bold text-[#111827] text-center">{item.quantity}</td>
                     <td className="px-5 py-3 text-xs font-bold text-[#111827] text-right">{formatCurrency((item.lineTotal || (item.price * item.quantity)), restaurant?.currency)}</td>
                     <td className="px-5 py-3 text-right">
                       <span className="text-[#16a34a] font-bold text-xs border border-[#dcfce7] px-1.5 py-0.5 rounded">Delivered</span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           
           <div className="p-5 flex flex-col items-end justify-between border-t border-[#f3f4f6]">
              <div className="w-[200px] space-y-1.5">
                 <div className="flex justify-between items-center text-xs">
                   <span className="font-bold text-[#6b7280]">Subtotal</span>
                   <span className="font-bold text-[#111827]">{formatCurrency(order.subtotal, restaurant?.currency)}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                   <span className="font-bold text-[#6b7280]">{restaurant?.taxType || 'Tax'}</span>
                   <span className="font-bold text-[#111827]">{formatCurrency(order.tax, restaurant?.currency)}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                   <span className="font-bold text-[#6b7280]">Delivery Fee</span>
                   <span className="font-bold text-[#111827]">{formatCurrency(order.deliveryFee, restaurant?.currency)}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                   <span className="font-bold text-[#6b7280]">Tip</span>
                   <span className="font-bold text-[#111827]">{formatCurrency(order.tip, restaurant?.currency)}</span>
                 </div>
                 <div className="flex justify-between items-center text-[13px] pt-2 mt-2 border-t border-[#f3f4f6]">
                   <span className="font-black text-[#dc2626]">Total Amount</span>
                   <span className="font-black text-[#dc2626]">{formatCurrency(order.total, restaurant?.currency)}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Order Status Timeline */}
        <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-5 shadow-sm">
          <h3 className="text-[12px] font-bold text-[#111827] mb-6">Order Status Timeline</h3>
          
          <div className="relative pl-3 space-y-6">
            <div className="absolute left-[15px] top-2 bottom-6 w-0.5 bg-[#e5e7eb] -z-10"></div>
            
            {timelineSteps.map((step, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              
              const stepTime = getTimestampForStatus(step.key);
              const timeStr = stepTime 
                ? `${formatDate(stepTime, restaurant?.dateFormat, restaurant?.timezone)} - ${formatTime(stepTime, restaurant?.timeFormat, restaurant?.timezone)}`
                : (isCompleted || isCurrent ? 'Just now' : 'Pending');

              return (
                <div key={idx} className="flex gap-4 relative z-10">
                  <div className="mt-0.5 shrink-0">
                    {isCompleted || (isCurrent && ['cancelled', 'refunded'].includes(oStatus)) ? (
                      <div className={`w-5 h-5 rounded-full ${['cancelled', 'refunded'].includes(oStatus) && isCurrent ? 'bg-[#dc2626]' : 'bg-[#16a34a]'} flex items-center justify-center ring-4 ring-white`}>
                        {['cancelled', 'refunded'].includes(oStatus) && isCurrent ? <XCircle className="w-3 h-3 text-white" /> : <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                    ) : isCurrent ? (
                      <div className="w-5 h-5 rounded-full bg-[#ea580c] flex items-center justify-center ring-4 ring-white">
                         <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-white border-2 border-[#d1d5db] ring-4 ring-white"></div>
                    )}
                  </div>
                  <div className="flex-1 -mt-1">
                    <div className="flex justify-between items-center">
                       <p className={`text-xs font-bold ${isCurrent || isCompleted ? 'text-[#111827]' : 'text-[#9ca3af]'}`}>{step.label}</p>
                       <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isCompleted || isCurrent ? 'bg-[#f3f4f6] text-[#6b7280]' : 'text-[#9ca3af]'}`}>{step.entity}</span>
                    </div>
                    <p className={`text-xs mt-0.5 ${isCurrent ? 'text-[#ea580c] font-bold' : 'text-[#9ca3af]'}`}>{timeStr}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {((order.orderType || order.type) === 'delivery' && !['delivered', 'completed', 'cancelled', 'refunded'].includes(oStatus)) && (
            <div className="mt-8 bg-[#fffbeb] border border-[#fde68a] rounded-lg p-3 flex items-center justify-between">
               <div>
                 <p className="text-xs font-bold text-[#b45309]">Estimated Delivery Time</p>
                 <p className="text-[12px] font-black text-[#92400e] mt-0.5">
                    {formatTime(new Date(new Date(order.createdAt).getTime() + 45 * 60000), restaurant?.timeFormat, restaurant?.timezone)}
                 </p>
               </div>
               <Clock className="w-6 h-6 text-[#d97706] opacity-50" />
            </div>
          )}
        </div>

        {/* Order Notes & History */}
        <div className="flex flex-col gap-4">
           {/* Order Notes */}
           <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-5 shadow-sm">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-[12px] font-bold text-[#111827]">Order Notes</h3>
             </div>
             
             <div className="space-y-4">
               <div>
                 <p className="text-xs font-bold text-[#111827] mb-1">Customer Note</p>
                 <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 text-xs text-[#374151]">
                   {order.specialInstructions || 'No instructions provided.'}
                 </div>
               </div>
               
               <div>
                 <p className="text-xs font-bold text-[#d97706] mb-1">Internal Note</p>
                 <div className="bg-[#fffbeb] border border-[#fde68a] rounded-lg p-3 text-xs text-[#b45309]">
                   {order.adminNotes?.length > 0 ? order.adminNotes[order.adminNotes.length - 1].text : 'No internal notes added.'}
                 </div>
               </div>
             </div>
           </div>

           {/* Order History */}
           <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-5 shadow-sm flex-1">
             <h3 className="text-[12px] font-bold text-[#111827] mb-4">Order History</h3>
             <div className="space-y-3 relative pl-2">
               <div className="absolute left-[11px] top-1 bottom-1 w-px border-l border-dashed border-[#d1d5db]"></div>
               
               {timelineSteps.filter((s, i) => i <= currentStepIndex).map((step, idx) => {
                 const stepTime = getTimestampForStatus(step.key);
                 const timeOnly = stepTime ? new Date(stepTime).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'}) : 'Pending';
                 
                 // Pick color based on step type to match image
                 let dotColor = 'bg-[#16a34a] border-[#16a34a]';
                 if (step.key === 'preparing' || step.key === 'ready') dotColor = 'bg-[#f59e0b] border-[#f59e0b]';
                 if (step.key === 'out_for_delivery') dotColor = 'bg-white border-[#3b82f6] border-2';
                 if (step.key === 'cancelled') dotColor = 'bg-[#dc2626] border-[#dc2626]';
                 
                 return (
                   <div key={idx} className="flex justify-between items-center relative z-10">
                     <div className="flex items-center gap-2">
                       <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></div>
                       <span className="text-xs font-bold text-[#374151]">{step.label}</span>
                     </div>
                     <span className="text-xs text-[#6b7280]">{timeOnly}</span>
                   </div>
                 );
               })}
             </div>
           </div>
        </div>

      </div>

      {/* Bottom Action Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {/* Recommended Actions */}
        <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-5 shadow-sm flex flex-col justify-center">
          <h3 className="text-xs font-bold text-[#111827] mb-3">Recommended Actions</h3>
          <div className="flex flex-wrap gap-2">
            <a href={`tel:${order.customerPhone || ''}`} className="flex-1 min-w-[120px] border border-[#e5e7eb] rounded-lg p-2 flex items-center gap-2 hover:bg-gray-50 transition-colors">
              <Phone className="w-3.5 h-3.5 text-[#3b82f6]" />
              <div>
                <p className="text-xs font-bold text-[#111827] leading-tight">Contact Customer</p>
                <p className="text-[8px] text-[#6b7280]">Call or Message</p>
              </div>
            </a>
            <button 
              onClick={async () => {
                try {
                  await orderAPI.remake(order._id);
                  showToast('Order sent to kitchen for remake', 'success');
                  if (onRefresh) onRefresh();
                } catch (err) {
                  showToast('Failed to remake order', 'error');
                }
              }} 
              className="flex-1 min-w-[120px] border border-[#e5e7eb] rounded-lg p-2 flex items-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <RefreshCcw className="w-3.5 h-3.5 text-[#16a34a]" />
              <div>
                <p className="text-xs font-bold text-[#111827] leading-tight">Remake Order</p>
                <p className="text-[8px] text-[#6b7280]">Send KOT ($0)</p>
              </div>
            </button>
            <button onClick={handleRefund} disabled={isRefunding || order.status === 'refunded'} className="flex-1 min-w-[120px] border border-[#e5e7eb] rounded-lg p-2 flex items-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50">
              <FileClock className="w-3.5 h-3.5 text-[#dc2626]" />
              <div>
                <p className="text-xs font-bold text-[#111827] leading-tight">Refund</p>
                <p className="text-[8px] text-[#6b7280]">{isRefunding ? 'Processing...' : 'Process Refund'}</p>
              </div>
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-5 shadow-sm flex flex-col justify-center">
          <h3 className="text-xs font-bold text-[#111827] mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-2 h-full">
            <button onClick={() => window.print()} className="flex-1 min-w-[100px] border border-[#e5e7eb] rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors py-3">
              <Printer className="w-3.5 h-3.5 text-[#374151]" />
              <span className="text-xs font-bold text-[#111827]">Print KOT</span>
            </button>
            <button onClick={() => window.print()} className="flex-1 min-w-[100px] border border-[#e5e7eb] rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors py-3">
              <Printer className="w-3.5 h-3.5 text-[#374151]" />
              <span className="text-xs font-bold text-[#111827]">Print Invoice</span>
            </button>
            <button 
              onClick={async () => {
                try {
                  await orderAPI.sendInvoice(order._id);
                  showToast('Invoice sent successfully!', 'success');
                } catch (err) {
                  showToast('Failed to send invoice', 'error');
                }
              }} 
              className="flex-1 min-w-[100px] border border-[#e5e7eb] rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors py-3"
            >
              <Send className="w-3.5 h-3.5 text-[#374151]" />
              <span className="text-xs font-bold text-[#111827]">Email Invoice</span>
            </button>
            <button onClick={() => onUpdateStatus && onUpdateStatus(order._id, 'cancelled')} className="flex-1 min-w-[100px] border border-[#fecaca] bg-[#fef2f2] rounded-lg flex items-center justify-center gap-2 hover:bg-[#fee2e2] transition-colors py-3">
              <XCircle className="w-3.5 h-3.5 text-[#dc2626]" />
              <span className="text-xs font-bold text-[#dc2626]">Cancel Order</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
