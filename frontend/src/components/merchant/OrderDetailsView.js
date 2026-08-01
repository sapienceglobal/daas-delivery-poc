import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Printer, RefreshCcw, MoreVertical, 
  FileText, Truck, CreditCard, Wallet, Calendar, Clock, User, DollarSign,
  MapPin, Phone, Mail, CheckCircle2, MessageSquare, Send
} from 'lucide-react';
import { orderAPI } from '@/lib/api';
import { showToast } from '@/components/ui';

export default function OrderDetailsView({ order: initialOrder, onBack, onUpdateStatus, onRefresh }) {
  const [order, setOrder] = useState(initialOrder);
  const [mounted, setMounted] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Optionally fetch fresh order data on mount to get latest notes
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

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      const res = await orderAPI.addNote(order._id, noteText);
      setOrder(res.data);
      setNoteText('');
      showToast('Note added', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to add note', 'error');
    } finally {
      setAddingNote(false);
    }
  };

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
      case 'preparing': return <span className="text-[#F59E0B] font-bold text-xs bg-[#F59E0B]/10 px-3 py-1.5 rounded-lg">Preparing</span>;
      case 'new': 
      case 'pending': return <span className="text-[#DC2626] font-bold text-xs bg-[#DC2626]/10 px-3 py-1.5 rounded-lg">New</span>;
      case 'out for delivery': return <span className="text-[#3B82F6] font-bold text-xs bg-[#3B82F6]/10 px-3 py-1.5 rounded-lg">Out for Delivery</span>;
      case 'accepted': return <span className="text-[#10B981] font-bold text-xs bg-[#10B981]/10 px-3 py-1.5 rounded-lg">Accepted</span>;
      case 'ready': return <span className="text-[#8B5CF6] font-bold text-xs bg-[#8B5CF6]/10 px-3 py-1.5 rounded-lg">Ready</span>;
      case 'delivered':
      case 'completed': return <span className="text-[#10B981] font-bold text-xs bg-[#10B981]/10 px-3 py-1.5 rounded-lg">Completed</span>;
      case 'cancelled': return <span className="text-[#6b7280] font-bold text-xs bg-[#f3f4f6] px-3 py-1.5 rounded-lg">Cancelled</span>;
      case 'refunded': return <span className="text-[#ef4444] font-bold text-xs bg-[#fef2f2] px-3 py-1.5 rounded-lg">Refunded</span>;
      default: return <span className="text-[#6b7280] font-bold text-xs capitalize bg-gray-100 px-3 py-1.5 rounded-lg">{status}</span>;
    }
  };

  // Helper for timeline steps
  const steps = [
    { label: 'Order Placed', statuses: ['pending', 'new'] },
    { label: 'Payment Successful', statuses: ['paid', 'accepted'] },
    { label: 'Preparing', statuses: ['preparing', 'ready'] },
    { label: 'Out for Delivery', statuses: ['out_for_delivery', 'out for delivery'] },
    { label: 'Delivered', statuses: ['delivered', 'completed'] }
  ];

  let currentStepIndex = 0;
  const oStatus = (order.status || '').toLowerCase();
  if (['delivered', 'completed'].includes(oStatus)) currentStepIndex = 5;
  else if (['out for delivery', 'out_for_delivery'].includes(oStatus)) currentStepIndex = 3;
  else if (['preparing', 'ready'].includes(oStatus)) currentStepIndex = 2;
  else if (['accepted'].includes(oStatus)) currentStepIndex = 1;
  else currentStepIndex = 0;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="text-sm text-[#6b7280] mb-2 flex items-center gap-2">
            <button onClick={onBack} className="hover:text-[#111827] flex items-center gap-1 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Dashboard
            </button>
            <span>&gt;</span>
            <button onClick={onBack} className="hover:text-[#111827] transition-colors">All Orders</button>
            <span>&gt;</span>
            <span className="text-[#111827] font-medium">Order Details</span>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-[#111827]">Order #{order.orderNumber || order._id?.toString().slice(-6)}</h1>
            {getStatusBadge(order.status)}
          </div>
          <p className="text-sm text-[#6b7280] mt-1">
            Order placed on {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-[#e5e7eb] rounded-lg px-4 py-2 text-sm text-[#374151] shadow-sm flex items-center gap-2 hover:bg-gray-50 transition-colors font-medium">
            <Printer className="w-4 h-4 text-[#6b7280]" /> Print Invoice
          </button>
          <button className="bg-white border border-[#e5e7eb] rounded-lg px-4 py-2 text-sm text-[#374151] shadow-sm flex items-center gap-2 hover:bg-gray-50 transition-colors font-medium">
            <RefreshCcw className="w-4 h-4 text-[#6b7280]" /> Refund Order
          </button>
          <button className="bg-white border border-[#e5e7eb] rounded-lg p-2 text-[#6b7280] shadow-sm hover:bg-gray-50 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Order Information Card */}
          <div className="bg-white rounded-[20px] p-6 shadow-sm border border-[#f3f4f6]">
            <h3 className="text-base font-bold text-[#111827] mb-6">Order Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#f3f4f6] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-[#6b7280]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-0.5">Order ID</p>
                  <p className="text-sm font-bold text-[#111827]">#{order.orderNumber || order._id?.toString().slice(-6)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#f3f4f6] flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4 text-[#6b7280]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-0.5">Order Type</p>
                  <p className="text-sm font-bold text-[#111827] capitalize">{order.orderType || 'Delivery'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#f3f4f6] flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4 text-[#6b7280]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-0.5">Payment Method</p>
                  {['credit_card', 'apple_pay', 'google_pay'].includes((order.paymentMethod || '').toLowerCase()) ? (
                     <span className="text-[#10B981] font-bold text-[10px] bg-[#10B981]/10 px-2 py-1 rounded-full">Online Paid</span>
                  ) : (
                     <span className="text-[#3B82F6] font-bold text-[10px] bg-[#3B82F6]/10 px-2 py-1 rounded-full capitalize">{order.paymentMethod?.replace('_', ' ')}</span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#f3f4f6] flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4 text-[#6b7280]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-0.5">Payment Status</p>
                  <span className={`font-bold text-[10px] px-2 py-1 rounded-full capitalize ${order.paymentStatus === 'paid' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#F59E0B]/10 text-[#F59E0B]'}`}>
                    {order.paymentStatus || 'Pending'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#f3f4f6] flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-[#6b7280]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-0.5">Order Date & Time</p>
                  <p className="text-xs font-bold text-[#111827]">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#f3f4f6] flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-[#6b7280]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-0.5">Delivery Date & Time</p>
                  <p className="text-xs font-bold text-[#111827]">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, {new Date(new Date(order.createdAt).getTime() + 45*60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#f3f4f6] flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-[#6b7280]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-0.5">Delivery Partner</p>
                  <p className="text-sm font-bold text-[#111827]">{order.dasherName || 'Pending'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#f3f4f6] flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4 text-[#6b7280]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-0.5">Delivery Fee</p>
                  <p className="text-sm font-bold text-[#111827]">${(order.deliveryFee || 0).toFixed(2)}</p>
                </div>
              </div>

            </div>
          </div>

          {/* Grid for Customer and Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Customer & Delivery Details */}
            <div className="bg-white rounded-[20px] p-6 shadow-sm border border-[#f3f4f6] flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-[#111827]">Customer & Delivery Details</h3>
                <button className="text-xs font-bold text-[#6b7280] border border-[#e5e7eb] rounded px-2 py-1 hover:bg-gray-50">Edit</button>
              </div>

              <div className="flex gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-[#e5e7eb] flex items-center justify-center shrink-0 text-lg font-bold text-[#6b7280]">
                  {(order.customerName || 'G')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111827]">{order.customerName || 'Guest Customer'}</p>
                  <p className="text-xs text-[#6b7280] mt-1 flex items-center gap-1.5"><Phone className="w-3 h-3" /> {order.customerPhone || 'N/A'}</p>
                  {order.customerEmail && <p className="text-xs text-[#6b7280] mt-1 flex items-center gap-1.5"><Mail className="w-3 h-3" /> {order.customerEmail}</p>}
                </div>
              </div>

              <div className="flex items-start gap-4 mb-6 bg-gray-50 rounded-xl p-4 border border-[#f3f4f6] flex-1">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                  <MapPin className="w-4 h-4 text-[#6b7280]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-1">Delivery Address</p>
                  <p className="text-xs font-medium text-[#374151] leading-relaxed">{order.address || 'Pickup Order'}</p>
                  <button className="text-[10px] font-bold text-[#111827] border border-[#e5e7eb] bg-white rounded px-2 py-1 mt-3 flex items-center gap-1.5 hover:bg-gray-50 shadow-sm">
                    <MapPin className="w-3 h-3" /> View on Map
                  </button>
                </div>
              </div>

              <div className="border-t border-[#f3f4f6] pt-4 mt-auto">
                <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3 h-3" /> Delivery Instructions
                </p>
                <p className="text-xs text-[#374151]">
                  {order.specialInstructions || order.courierNotes || 'Please ring the doorbell. Leave at the doorstep if not available.'}
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-[20px] p-6 shadow-sm border border-[#f3f4f6] flex flex-col h-full">
              <h3 className="text-base font-bold text-[#111827] mb-6">Order Summary</h3>
              
              <div className="space-y-3 flex-1 text-sm text-[#4b5563]">
                <div className="flex justify-between items-center">
                  <span>Item Total</span>
                  <span className="font-medium text-[#111827]">${(order.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Delivery Fee</span>
                  <span className="font-medium text-[#111827]">${(order.deliveryFee || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Packaging Charges</span>
                  <span className="font-medium text-[#111827]">$1.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Taxes (8.875%)</span>
                  <span className="font-medium text-[#111827]">${(order.tax || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-[#f3f4f6] pt-4 mt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#111827]">Total Amount</span>
                  <span className="text-lg font-bold text-[#111827]">${(order.total || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-[#374151]">Amount Paid</span>
                  <span className="text-sm font-bold text-[#10B981]">${(order.paymentStatus === 'paid' ? order.total : 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-[#374151]">You Saved</span>
                  <span className="text-sm font-bold text-[#10B981]">${(order.discount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Order Items Table */}
          <div className="bg-white rounded-[20px] shadow-sm border border-[#f3f4f6] overflow-hidden">
            <div className="p-6 border-b border-[#f3f4f6]">
              <h3 className="text-base font-bold text-[#111827]">Order Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f9fafb]">
                    <th className="px-6 py-3 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider w-1/2">Item</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider text-center">Qty</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider text-right">Unit Price</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {(order.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {item.image ? (
                             <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                             <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold shrink-0">
                               {item.name?.substring(0,2).toUpperCase()}
                             </div>
                          )}
                          <div>
                            <p className="text-sm font-bold text-[#111827]">{item.name}</p>
                            <p className="text-xs text-[#6b7280] mt-1 line-clamp-2">
                              {[item.selectedSize?.name, ...(item.addOns || []).map(a => a.name)].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-[#374151]">{item.quantity}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-[#4b5563]">${(item.price || 0).toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-[#111827]">${(item.lineTotal || (item.price * item.quantity)).toFixed(2)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-[#f3f4f6] flex justify-between items-center bg-[#f9fafb]">
              <span className="text-sm text-[#6b7280]">Total Items: {(order.items || []).reduce((acc, it) => acc + it.quantity, 0)}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm text-[#6b7280]">Item Total</span>
                <span className="text-lg font-bold text-[#111827]">${(order.subtotal || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          
          {/* Order Timeline */}
          <div className="bg-white rounded-[20px] p-6 shadow-sm border border-[#f3f4f6]">
            <h3 className="text-base font-bold text-[#111827] mb-6">Order Timeline</h3>
            <div className="relative pl-3 space-y-6">
              <div className="absolute left-[15px] top-2 bottom-6 w-0.5 bg-[#e5e7eb] -z-10"></div>
              
              {steps.map((step, idx) => {
                const isCompleted = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                
                let iconBg = 'bg-white border-[#e5e7eb]';
                let iconColor = 'text-[#e5e7eb]';
                if (isCompleted) {
                  iconBg = 'bg-[#10B981] border-[#10B981]';
                  iconColor = 'text-white';
                } else if (isCurrent) {
                  iconBg = 'bg-[#F59E0B] border-4 border-[#fef3c7]';
                  iconColor = 'text-white';
                }

                // Try to find timestamp in statusUpdates
                const update = order.statusUpdates?.find(u => step.statuses.includes(u.status.toLowerCase()));
                const timeStr = update?.timestamp 
                  ? `${new Date(update.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${new Date(update.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` 
                  : (isCompleted || isCurrent ? 'Just now' : 'Pending');

                return (
                  <div key={idx} className="flex gap-4 relative z-10">
                    <div className="mt-0.5 shrink-0">
                      {isCompleted ? (
                        <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center ring-4 ring-white">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      ) : isCurrent ? (
                        <div className="w-5 h-5 rounded-full bg-[#F59E0B] flex items-center justify-center ring-4 ring-[#fef3c7]">
                          <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-white border-2 border-[#e5e7eb] ring-4 ring-white"></div>
                      )}
                    </div>
                    <div className={`flex-1 ${isCurrent ? 'bg-[#fffbeb] p-3 rounded-lg -mt-3 border border-[#fde68a]' : ''}`}>
                      <p className={`text-sm font-bold ${isCurrent ? 'text-[#b45309]' : isCompleted ? 'text-[#111827]' : 'text-[#6b7280]'}`}>{step.label}</p>
                      <p className={`text-xs mt-1 ${isCurrent ? 'text-[#d97706]' : 'text-[#9ca3af]'}`}>{timeStr}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Notes */}
          <div className="bg-white rounded-[20px] p-6 shadow-sm border border-[#f3f4f6]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#111827]">Order Notes</h3>
              <button className="text-xs font-bold text-[#374151] border border-[#e5e7eb] rounded px-2 py-1 hover:bg-gray-50">Add Note</button>
            </div>

            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Type a note..." 
                className="flex-1 text-sm border border-[#e5e7eb] rounded-lg px-3 py-2 outline-none focus:border-brand-cyan/50"
                onKeyDown={e => e.key === 'Enter' && handleAddNote()}
              />
              <button 
                onClick={handleAddNote}
                disabled={addingNote || !noteText.trim()}
                className="bg-[#111827] text-white p-2 rounded-lg hover:bg-black disabled:opacity-50 flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {(order.adminNotes || []).slice().reverse().map((note, idx) => (
                <div key={idx} className="bg-[#fffbeb] rounded-lg p-3 border border-[#fde68a]">
                  <p className="text-xs text-[#374151] mb-2 leading-relaxed">{note.text}</p>
                  <div className="flex justify-between items-center text-[10px] text-[#9ca3af]">
                    <span>- {note.author}</span>
                    <span>{new Date(note.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, {new Date(note.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
              
              {/* Optional: Add special instructions as a note */}
              {order.specialInstructions && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <p className="text-xs text-[#374151] mb-2 leading-relaxed">{order.specialInstructions}</p>
                  <div className="flex justify-between items-center text-[10px] text-[#9ca3af]">
                    <span>- Customer Instruction</span>
                    <span>{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              )}

              {(!order.adminNotes?.length && !order.specialInstructions) && (
                <p className="text-xs text-[#9ca3af] text-center py-4 border border-dashed border-[#e5e7eb] rounded-lg">No notes added yet.</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-[20px] p-6 shadow-sm border border-[#f3f4f6]">
            <h3 className="text-base font-bold text-[#111827] mb-4">Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => window.print()} className="flex items-center justify-center gap-2 border border-[#e5e7eb] rounded-lg py-2.5 text-xs font-bold text-[#374151] hover:bg-gray-50 transition-colors">
                <Printer className="w-3.5 h-3.5" /> Print Invoice
              </button>
              <button 
                onClick={handleRefund}
                disabled={isRefunding || order.status === 'refunded' || order.paymentStatus === 'refunded'}
                className="flex items-center justify-center gap-2 border border-[#fca5a5] rounded-lg py-2.5 text-xs font-bold text-[#ef4444] hover:bg-[#fef2f2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${isRefunding ? 'animate-spin' : ''}`} /> 
                {isRefunding ? 'Refunding...' : order.status === 'refunded' ? 'Refunded' : 'Refund Order'}
              </button>
              <a href={`sms:${order.customerPhone || ''}`} className="flex items-center justify-center gap-2 border border-[#e5e7eb] rounded-lg py-2.5 text-xs font-bold text-[#374151] hover:bg-gray-50 transition-colors">
                <MessageSquare className="w-3.5 h-3.5" /> Send SMS
              </a>
              <a href={`tel:${order.customerPhone || ''}`} className="flex items-center justify-center gap-2 border border-[#e5e7eb] rounded-lg py-2.5 text-xs font-bold text-[#374151] hover:bg-gray-50 transition-colors">
                <Phone className="w-3.5 h-3.5" /> Call Customer
              </a>
              <button 
                onClick={() => {
                  if (onUpdateStatus) onUpdateStatus(order._id, 'cancelled');
                }}
                className="col-span-2 flex items-center justify-center gap-2 border border-[#fca5a5] rounded-lg py-2.5 text-xs font-bold text-[#ef4444] hover:bg-[#fef2f2] transition-colors mt-2"
              >
                Cancel Order
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
