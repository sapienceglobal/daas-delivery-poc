import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Printer, Send, Calendar, Clock, 
  MapPin, Phone, Mail, FileText,
  CheckCircle, XCircle, FileClock, RefreshCcw,
  AlertTriangle, ShieldAlert, Zap, ArrowDownLeft,
  CreditCard, Info, Activity, Eye,
  Globe, Smartphone
} from 'lucide-react';
import { orderAPI } from '@/lib/api';
import { showToast, ConfirmModal } from '@/components/ui';
import { useMerchantContext } from '@/context/MerchantContext';
import { useSocket } from '@/context/SocketContext';
import { formatCurrency, formatDate, formatTime } from '@/lib/formatters';

// ─── Payment Event config ────────────────────────────────────────────────────
const PAYMENT_EVENT_CONFIG = {
  payment_initiated:      { icon: CreditCard,    color: '#6366f1', bg: '#ede9fe', label: 'Payment Initiated' },
  payment_confirmed:      { icon: CheckCircle,   color: '#16a34a', bg: '#dcfce7', label: 'Payment Confirmed' },
  payment_failed:         { icon: XCircle,       color: '#dc2626', bg: '#fef2f2', label: 'Payment Failed' },
  order_saved:            { icon: FileText,      color: '#2563eb', bg: '#dbeafe', label: 'Order Saved to System' },
  order_creation_failed:  { icon: AlertTriangle, color: '#dc2626', bg: '#fef2f2', label: 'Order Creation Failed' },
  auto_refund_triggered:  { icon: Zap,           color: '#d97706', bg: '#fffbeb', label: 'Auto-Refund Initiated' },
  auto_refund_succeeded:  { icon: ArrowDownLeft, color: '#16a34a', bg: '#dcfce7', label: 'Auto-Refund Completed' },
  auto_refund_failed:     { icon: ShieldAlert,   color: '#dc2626', bg: '#fef2f2', label: 'Auto-Refund Failed' },
  manual_refund:          { icon: FileClock,     color: '#7c3aed', bg: '#f5f3ff', label: 'Manual Refund Processed' },
  loyalty_rollback:       { icon: RefreshCcw,    color: '#0891b2', bg: '#e0f2fe', label: 'Loyalty Points Reversed' },
  status_change:          { icon: Activity,      color: '#6b7280', bg: '#f3f4f6', label: 'Status Updated' },
};

function fmtAmt(amount, currency) {
  if (!amount && amount !== 0) return '';
  return ` · ${formatCurrency(amount, currency)}`;
}

export default function OrderDetailsView({ order: initialOrder, onBack, onUpdateStatus, onRefresh }) {
  const { restaurant } = useMerchantContext();
  const { on, off } = useSocket();
  const currency = restaurant?.currency || 'USD';

  const [order, setOrder] = useState(initialOrder);
  const [mounted, setMounted] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRemakingOrder, setIsRemakingOrder] = useState(false);
  const [isSendingInvoice, setIsSendingInvoice] = useState(false);
  const [paymentAudit, setPaymentAudit] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [showAudit, setShowAudit] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchFreshOrder();
    fetchPaymentAuditSilent();
  }, [initialOrder._id]);

  useEffect(() => {
    const handleStatusChanged = (payload) => {
      if (payload.orderId === initialOrder._id || payload._id === initialOrder._id) {
        fetchFreshOrder();
        fetchPaymentAuditSilent();
      }
    };

    on('order_status_changed', handleStatusChanged);
    on('order_updated', handleStatusChanged);

    return () => {
      off('order_status_changed', handleStatusChanged);
      off('order_updated', handleStatusChanged);
    };
  }, [initialOrder._id, on, off]);

  const fetchPaymentAuditSilent = async () => {
    try {
      const res = await orderAPI.getPaymentEvents(initialOrder._id);
      setPaymentAudit(res.data);
    } catch (err) {
      console.error('Failed to load payment audit trail', err);
    }
  };

  const fetchFreshOrder = async () => {
    try {
      const res = await orderAPI.getRestaurantOrders(initialOrder.restaurantId, `_id=${initialOrder._id}`);
      const freshOrder = res.data?.find ? res.data.find(o => o._id === initialOrder._id) : null;
      if (freshOrder) setOrder(freshOrder);
    } catch (err) {
      console.error('Failed to fetch fresh order details', err);
    }
  };

  const fetchPaymentAudit = async () => {
    if (paymentAudit) { setShowAudit(v => !v); return; }
    setAuditLoading(true);
    try {
      const res = await orderAPI.getPaymentEvents(order._id);
      setPaymentAudit(res.data);
      setShowAudit(true);
    } catch (err) {
      showToast('Failed to load payment audit trail', 'error');
    } finally {
      setAuditLoading(false);
    }
  };

  // ─── Local State ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'audit'
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  if (!mounted || !order) return null;

  // ─── Derived state ────────────────────────────────────────────────────────
  const oStatus = (order.status || '').toLowerCase();
  const isTerminal = ['delivered', 'cancelled', 'failed', 'refunded'].includes(oStatus);
  const isRefunded = order.refunded === true || order.paymentStatus === 'refunded';
  const isPartialRefund = order.paymentStatus === 'partially_refunded';
  const hasAutoRefund = (order.paymentEvents || []).some(e => e.event === 'auto_refund_triggered');
  const autoRefundSucceeded = isRefunded || (order.paymentEvents || []).some(e => e.event === 'auto_refund_succeeded');
  const autoRefundFailed = !autoRefundSucceeded && (order.paymentEvents || []).some(e => e.event === 'auto_refund_failed');
  const canRefund = !isRefunded && ['paid', 'partially_refunded'].includes(order.paymentStatus);
  const canCancel = !isTerminal;
  const totalItems = (order.items || []).reduce((acc, it) => acc + it.quantity, 0);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleRefund = async () => {
    if (!canRefund) {
      showToast(isRefunded ? 'This order has already been refunded' : 'Order is not eligible for refund', 'info');
      return;
    }
    setConfirmConfig({
      isOpen: true,
      title: 'Issue Refund',
      message: `Refund ${formatCurrency(order.total - (order.refundAmount || 0), currency)} to the customer's card? This action cannot be reversed.`,
      onConfirm: async () => {
        setIsRefunding(true);
        try {
          await orderAPI.refund(order._id, { reason: 'Merchant initiated refund' });
          showToast('Order refunded successfully', 'success');
          await fetchFreshOrder();
          setPaymentAudit(null); // reset so next expand fetches fresh
          if (onRefresh) onRefresh();
        } catch (err) {
          showToast(err.message || 'Failed to refund order', 'error');
        } finally {
          setIsRefunding(false);
        }
      }
    });
  };

  const handleCancel = async () => {
    if (!canCancel) {
      showToast(`Order is already ${oStatus} — cannot cancel`, 'info');
      return;
    }
    setConfirmConfig({
      isOpen: true,
      title: 'Cancel Order',
      message: 'Are you sure you want to cancel this order? If it has been paid, an auto-refund will be issued automatically.',
      onConfirm: async () => {
        setIsCancelling(true);
        try {
          await orderAPI.updateStatus(order._id, 'cancelled');
          showToast('Order cancelled — auto-refund will be processed', 'success');
          await fetchFreshOrder();
          setPaymentAudit(null);
          if (onRefresh) onRefresh();
        } catch (err) {
          showToast(err.message || 'Failed to cancel order', 'error');
        } finally {
          setIsCancelling(false);
        }
      }
    });
  };

  const handleRemake = async () => {
    setIsRemakingOrder(true);
    try {
      await orderAPI.remake(order._id);
      showToast('Remake order sent to kitchen ($0 charge)', 'success');
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast('Failed to create remake order', 'error');
    } finally {
      setIsRemakingOrder(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!order.customerEmail) {
      showToast('No customer email on file — cannot send invoice', 'error');
      return;
    }
    setIsSendingInvoice(true);
    try {
      await orderAPI.sendInvoice(order._id);
      showToast(`Invoice emailed to ${order.customerEmail}`, 'success');
    } catch (err) {
      showToast('Failed to send invoice email', 'error');
    } finally {
      setIsSendingInvoice(false);
    }
  };

  const handlePrintKOT = () => {
    const url = orderAPI.getKotUrl(order._id);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handlePrintInvoice = () => {
    const url = orderAPI.getInvoiceUrl(order._id);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // ─── Badges ───────────────────────────────────────────────────────────────
  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    const map = {
      preparing:      ['#ea580c', '#ffedd5', 'Preparing'],
      pending:        ['#dc2626', '#fef2f2', 'New'],
      new:            ['#dc2626', '#fef2f2', 'New'],
      out_for_delivery:['#16a34a','#dcfce7','Out for Delivery'],
      accepted:       ['#2563eb', '#dbeafe', 'Accepted'],
      ready:          ['#3b82f6', '#dbeafe', 'Ready'],
      delivered:      ['#16a34a', '#dcfce7', 'Completed'],
      picked_up:      ['#16a34a', '#dcfce7', 'Completed'],
      completed:      ['#16a34a', '#dcfce7', 'Completed'],
      cancelled:      ['#6b7280', '#f3f4f6', 'Cancelled'],
      refunded:       ['#ef4444', '#fef2f2', 'Refunded'],
      failed:         ['#991b1b', '#fee2e2', 'Failed'],
    };
    const [color, bg, label] = map[s] || ['#6b7280', '#f3f4f6', status];
    return <span style={{ color, background: bg }} className="font-bold text-xs px-2 py-1 rounded">{label}</span>;
  };

  const getPaymentBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'paid')               return <span className="text-[#16a34a] font-bold text-xs bg-[#dcfce7] px-2 py-1 rounded">Paid</span>;
    if (s === 'refunded')           return <span className="text-[#ef4444] font-bold text-xs bg-[#fef2f2] px-2 py-1 rounded">Refunded</span>;
    if (s === 'partially_refunded') return <span className="text-[#d97706] font-bold text-xs bg-[#fffbeb] px-2 py-1 rounded">Partial Refund</span>;
    if (s === 'failed')             return <span className="text-[#dc2626] font-bold text-xs bg-[#fee2e2] px-2 py-1 rounded">Failed</span>;
    return <span className="text-[#ea580c] font-bold text-xs bg-[#ffedd5] px-2 py-1 rounded capitalize">{status || 'Pending'}</span>;
  };

  // ─── Timeline ─────────────────────────────────────────────────────────────
  let timelineSteps = [
    { key: 'placed',       label: 'Order Placed',        entity: 'Customer' },
    { key: 'accepted',     label: 'Order Confirmed',      entity: 'System' },
    { key: 'preparing',    label: 'Preparing',            entity: 'Kitchen' },
    { key: 'ready',        label: 'Ready for Pickup',     entity: 'Kitchen' },
    { key: 'out_for_delivery', label: 'Out for Delivery', entity: 'Rider' },
    { key: 'delivered',    label: 'Delivered',            entity: 'Pending' }
  ];
  if (['cancelled', 'refunded', 'failed'].includes(oStatus)) {
    timelineSteps = [
      { key: 'placed',    label: 'Order Placed',   entity: 'Customer' },
      { key: 'cancelled', label: oStatus === 'failed' ? 'Order Failed' : 'Order Cancelled', entity: 'System' }
    ];
  }

  const getTimestampForStatus = (statusKey) => {
    const aliases = {
      placed: ['new', 'pending'], accepted: ['accepted', 'paid'], preparing: ['preparing'],
      ready: ['ready'], out_for_delivery: ['out_for_delivery', 'picked_up'],
      delivered: ['delivered', 'completed'], cancelled: ['cancelled', 'refunded', 'failed']
    };
    const match = (order.statusUpdates || []).find(u => (aliases[statusKey] || [statusKey]).includes(u.status?.toLowerCase()));
    return match?.timestamp;
  };

  let currentStepIndex = 0;
  if (['cancelled', 'refunded', 'failed'].includes(oStatus)) currentStepIndex = 1;
  else if (['delivered', 'completed'].includes(oStatus)) currentStepIndex = 5;
  else if (['out_for_delivery', 'picked_up'].includes(oStatus)) currentStepIndex = 4;
  else if (oStatus === 'ready') currentStepIndex = 3;
  else if (oStatus === 'preparing') currentStepIndex = 2;
  else if (oStatus === 'accepted') currentStepIndex = 1;

  return (
    <div className="space-y-6 pb-20">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 text-[#6b7280] transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[28px] font-black text-[#111827]">#{order.orderNumber || order._id?.toString().slice(-6) || 'N/A'}</h1>
            {getStatusBadge(order.status)}
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-[#6b7280] ml-10">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDate(order.createdAt, restaurant?.dateFormat, restaurant?.timezone)}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {formatTime(order.createdAt, restaurant?.timeFormat, restaurant?.timezone)}</span>
            <span className="flex items-center gap-1.5 capitalize text-[#111827] bg-[#f3f4f6] px-2 py-0.5 rounded-full">{order.orderType?.replace(/_/g, ' ') || 'Delivery'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handlePrintKOT} className="flex items-center gap-1.5 text-[#374151] font-bold text-xs border border-[#e5e7eb] bg-white px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
            <Printer className="w-3.5 h-3.5 text-[#6b7280]" /> KOT
          </button>
          <button onClick={handlePrintInvoice} className="flex items-center gap-1.5 text-[#374151] font-bold text-xs border border-[#e5e7eb] bg-white px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
            <FileText className="w-3.5 h-3.5 text-[#6b7280]" /> Invoice
          </button>
        </div>
      </div>

      {/* ── Auto-Refund / Failed Alerts ─────────────────────────────────────── */}
      {oStatus === 'failed' && !hasAutoRefund && (
        <div className="bg-[#fef2f2] border border-[#fecaca] rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <div className="w-9 h-9 rounded-full bg-[#fee2e2] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-[#dc2626]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#991b1b]">Order Failed — Payment may need manual review</p>
            <p className="text-xs text-[#dc2626] mt-1">Check the Order Journey below for details.</p>
          </div>
        </div>
      )}
      
      {hasAutoRefund && (
        <div className={`border rounded-xl p-4 flex items-start gap-3 shadow-sm ${
          autoRefundFailed ? 'bg-[#fef2f2] border-[#fecaca]' : autoRefundSucceeded ? 'bg-[#fffbeb] border-[#fde68a]' : 'bg-[#eff6ff] border-[#bfdbfe]'
        }`}>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
            autoRefundFailed ? 'bg-[#fee2e2]' : autoRefundSucceeded ? 'bg-[#fef3c7]' : 'bg-[#dbeafe]'
          }`}>
            {autoRefundFailed ? <ShieldAlert className="w-5 h-5 text-[#dc2626]" /> : autoRefundSucceeded ? <Zap className="w-5 h-5 text-[#d97706]" /> : <Info className="w-5 h-5 text-[#2563eb]" />}
          </div>
          <div>
            <p className={`text-sm font-bold ${autoRefundFailed ? 'text-[#991b1b]' : autoRefundSucceeded ? 'text-[#92400e]' : 'text-[#1e40af]'}`}>
              {autoRefundFailed ? '⚠️ Auto-Refund Failed — Manual action required' : autoRefundSucceeded ? `⚡ Auto-Refund Processed — ${formatCurrency(order.refundAmount || order.total, currency)} was automatically returned to customer's card` : '🔄 Auto-Refund Initiated — Processing...'}
            </p>
            {order.refundReason && (
              <p className={`text-xs mt-1 ${autoRefundFailed ? 'text-[#dc2626]' : autoRefundSucceeded ? 'text-[#b45309]' : 'text-[#3b82f6]'}`}>
                Reason: <span className="font-semibold">{order.refundReason.replace(/_/g, ' ')}</span>
              </p>
            )}
            {autoRefundFailed && (
              <p className="text-xs text-[#dc2626] mt-1 font-medium">Contact Stripe dashboard or initiate a manual refund below.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Main 2-Column Layout ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN: 65% width */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Customer & Delivery Card */}
          <div className="bg-white border border-[#e5e7eb] rounded-[16px] shadow-sm overflow-hidden flex flex-col md:flex-row">
            <div className="p-5 border-b md:border-b-0 md:border-r border-[#f3f4f6] flex-1 bg-[#fcfaf5]">
              <h3 className="text-[11px] font-black text-[#8b0000] uppercase tracking-wider mb-4">Customer Details</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#ebdcc1] flex items-center justify-center text-[16px] font-black text-[#8b0000]">
                  {(order.customerName || 'G')[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[16px] font-black text-[#111827]">{order.customerName || 'Guest Customer'}</p>
                  </div>
                  <p className="text-[13px] font-bold text-[#6b7280] mb-1">{order.customerPhone || 'No Phone Number'}</p>
                  
                  {/* Explicit Platform Indicator */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] font-bold text-[#8b0000] uppercase tracking-wider">Source:</span>
                    <span className="text-[12px] font-bold text-[#111827] flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-[#e5e7eb] shadow-sm">
                      {order.orderSource === 'app' ? (
                        <><Smartphone className="w-3.5 h-3.5 text-green-600" /> Mobile App</>
                      ) : (
                        <><Globe className="w-3.5 h-3.5 text-blue-600" /> Website</>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {order.customerEmail && (
                  <p className="text-[13px] font-bold text-[#374151] flex items-center gap-2"><Mail className="w-4 h-4 text-[#9ca3af]" /> {order.customerEmail}</p>
                )}
                <div className="flex gap-2 mt-4">
                  <a href={`tel:${order.customerPhone || ''}`} className="flex-1 bg-white border border-[#e5e7eb] py-2 rounded-lg text-center text-xs font-bold text-[#111827] hover:bg-gray-50 flex justify-center items-center gap-1.5 shadow-sm transition-colors"><Phone className="w-3.5 h-3.5" /> Call</a>
                </div>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-[11px] font-black text-[#8b0000] uppercase tracking-wider mb-4">Fulfillment Details</h3>
                {order.orderType === 'dine_in' && order.tableNumber ? (
                  <p className="text-sm font-bold text-[#111827] flex items-center gap-2"><MapPin className="w-4 h-4 text-[#6b7280]" /> Table {order.tableNumber}</p>
                ) : (
                  <p className="text-[13px] font-bold text-[#374151] flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#9ca3af] shrink-0 mt-0.5" />
                    <span className="leading-tight">{order.address || 'Pickup (No Address Provided)'}</span>
                  </p>
                )}
                {order.specialInstructions && (
                  <div className="mt-4 bg-[#fffbeb] border border-[#fde68a] p-3 rounded-lg">
                    <p className="text-[10px] font-bold text-[#b45309] uppercase tracking-wider mb-1">Customer Notes</p>
                    <p className="text-xs text-[#92400e] font-medium leading-relaxed">{order.specialInstructions}</p>
                  </div>
                )}
              </div>
              {order.orderType === 'delivery' && (
                <div className="mt-4 pt-4 border-t border-[#f3f4f6] flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Assigned Rider</p>
                    <p className="text-[13px] font-bold text-[#111827] mt-0.5">{order.courierName || 'Pending Assignment'}</p>
                  </div>
                  {order.courierPhone && (
                    <a href={`tel:${order.courierPhone}`} className="w-8 h-8 rounded-full bg-[#f3f4f6] flex items-center justify-center text-[#374151] hover:bg-[#e5e7eb] transition-colors"><Phone className="w-3.5 h-3.5" /></a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white border border-[#e5e7eb] rounded-[16px] shadow-sm flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f3f4f6] flex justify-between items-center bg-[#f9fafb]">
              <h3 className="text-[13px] font-black text-[#111827]">Order Items <span className="text-[#6b7280] font-normal">({totalItems})</span></h3>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#f3f4f6]">
                    <th className="px-5 py-3 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Item</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider text-right">Price</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider text-center">Qty</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {(order.items || []).map((item, idx) => (
                    <tr key={idx} className="group hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover border border-[#e5e7eb] shadow-sm" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#f3f4f6] flex items-center justify-center text-xs font-black text-[#9ca3af] shrink-0 border border-[#e5e7eb]">
                              {item.name?.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-[14px] font-bold text-[#111827]">{item.name}</p>
                            {(item.selectedSize || (item.addOns && item.addOns.length > 0)) && (
                              <p className="text-[12px] text-[#6b7280] mt-1 leading-tight max-w-[250px]">
                                {[item.selectedSize?.name, ...(item.addOns || []).map(a => a.name)].filter(Boolean).join(', ')}
                              </p>
                            )}
                            {item.specialInstructions && (
                              <p className="text-[11px] text-[#d97706] mt-1 italic block">"{item.specialInstructions}"</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[13px] font-bold text-[#374151] text-right">{formatCurrency(item.price, currency)}</td>
                      <td className="px-5 py-4 text-[14px] font-black text-[#111827] text-center">{item.quantity}</td>
                      <td className="px-5 py-4 text-[14px] font-black text-[#111827] text-right">{formatCurrency(item.lineTotal || (item.price * item.quantity), currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Financial Summary */}
            <div className="bg-[#fcfaf5] p-5 border-t border-[#e5e7eb] flex justify-end">
              <div className="w-full sm:w-[320px] space-y-2">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="font-bold text-[#6b7280]">Subtotal</span>
                  <span className="font-bold text-[#111827]">{formatCurrency(order.subtotal, currency)}</span>
                </div>
                {(order.tax || 0) > 0 && (
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="font-bold text-[#6b7280]">{restaurant?.taxType || 'Tax'}</span>
                    <span className="font-bold text-[#111827]">{formatCurrency(order.tax, currency)}</span>
                  </div>
                )}
                {(order.deliveryFee || 0) > 0 && (
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="font-bold text-[#6b7280]">Delivery Fee</span>
                    <span className="font-bold text-[#111827]">{formatCurrency(order.deliveryFee, currency)}</span>
                  </div>
                )}
                {(order.tip || 0) > 0 && (
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="font-bold text-[#6b7280]">Tip</span>
                    <span className="font-bold text-[#111827]">{formatCurrency(order.tip, currency)}</span>
                  </div>
                )}
                {(order.discount || 0) > 0 && (
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="font-bold text-[#16a34a]">Discount</span>
                    <span className="font-bold text-[#16a34a]">-{formatCurrency(order.discount, currency)}</span>
                  </div>
                )}
                {(order.refundAmount || 0) > 0 && (
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="font-bold text-[#dc2626]">Refunded</span>
                    <span className="font-bold text-[#dc2626]">{formatCurrency(order.refundAmount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-[16px] pt-3 mt-3 border-t border-[#e5e7eb]">
                  <span className="font-black text-[#111827]">Total</span>
                  <span className="font-black text-[#8b0000]">{formatCurrency(order.total, currency)}</span>
                </div>
                
                {/* Payment Badge Footer */}
                <div className="flex justify-between items-center pt-3 mt-3 border-t border-dashed border-[#e5e7eb]">
                  <span className="text-[11px] font-bold text-[#6b7280] uppercase">Payment Status</span>
                  {getPaymentBadge(order.paymentStatus)}
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[11px] font-bold text-[#6b7280] uppercase">Method</span>
                  <span className="text-[11px] font-bold text-[#374151] uppercase">{order.paymentMethod?.replace(/_/g, ' ') || 'Cash'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 35% width */}
        <div className="lg:col-span-1 flex flex-col gap-6">

          {/* Action Center */}
          <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-5 shadow-sm">
            <h3 className="text-[11px] font-black text-[#8b0000] uppercase tracking-wider mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleRemake} disabled={isRemakingOrder}
                className="col-span-2 border border-[#e5e7eb] rounded-lg py-2.5 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors font-bold text-[13px] text-[#111827] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {isRemakingOrder ? (
                  <div className="w-4 h-4 border-2 border-[#16a34a] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <RefreshCcw className="w-4 h-4 text-[#16a34a]" />
                )}
                {isRemakingOrder ? 'Creating…' : 'Remake Order ($0)'}
              </button>

              <button onClick={handleSendInvoice} disabled={isSendingInvoice || !order.customerEmail}
                className={`border rounded-lg py-2.5 flex items-center justify-center gap-2 font-bold text-[13px] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${!order.customerEmail && !isSendingInvoice ? 'border-[#e5e7eb] bg-[#f9fafb] text-[#9ca3af]' : 'border-[#e5e7eb] hover:bg-gray-50 text-[#111827]'}`}>
                {isSendingInvoice ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isSendingInvoice ? 'Sending...' : 'Email'}
              </button>

              <button onClick={handleRefund} disabled={isRefunding || !canRefund}
                className={`border rounded-lg py-2.5 flex items-center justify-center gap-2 font-bold text-[13px] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${!canRefund && !isRefunding ? 'border-[#e5e7eb] bg-[#f9fafb] text-[#9ca3af]' : 'border-[#e5e7eb] hover:bg-gray-50 text-[#111827]'}`}>
                {isRefunding ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileClock className="w-4 h-4" />
                )}
                {isRefunding ? 'Refunding...' : (isRefunded ? 'Refunded' : 'Refund')}
              </button>

              <button onClick={handleCancel} disabled={isCancelling || !canCancel}
                className={`col-span-2 border rounded-lg py-2.5 flex items-center justify-center gap-2 font-bold text-[13px] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${!canCancel && !isCancelling ? 'border-[#e5e7eb] bg-[#f9fafb] text-[#9ca3af]' : 'border-[#fecaca] bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2]'}`}>
                {isCancelling ? (
                  <div className="w-4 h-4 border-2 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                {isCancelling ? 'Cancelling…' : 'Cancel Order'}
              </button>
            </div>
          </div>

          {/* Unified Order Journey Feed */}
          <div className="bg-white border border-[#e5e7eb] rounded-[16px] shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f3f4f6] bg-[#fcfaf5]">
              <h3 className="text-[11px] font-black text-[#8b0000] uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4" /> Order Journey
              </h3>
            </div>
            <div className="p-5 flex-1 custom-scrollbar overflow-y-auto max-h-[600px]">
              <div className="relative pl-3">
                {/* Vertical Pipeline Line */}
                <div className="absolute left-[19px] top-4 bottom-4 w-px bg-[#e5e7eb] -z-10" />
                
                {(() => {
                  // Merge statusUpdates and paymentAudit events into a single timeline
                  let events = [];
                  
                  // 1. Add status updates
                  (order.statusUpdates || []).forEach(su => {
                    let label = su.status?.replace(/_/g, ' ');
                    let key = su.status?.toLowerCase();
                    
                    // Override label if this is a refund event (backend pushes it as 'cancelled')
                    if (su.description && su.description.toLowerCase().includes('refund of') && su.description.toLowerCase().includes('processed')) {
                      label = 'Refunded';
                      key = 'refunded';
                    }

                    events.push({
                      type: 'status',
                      key: key,
                      label: label,
                      desc: su.description,
                      time: su.timestamp ? new Date(su.timestamp) : null,
                      original: su
                    });
                  });

                  // 2. Add payment events if loaded
                  if (paymentAudit && paymentAudit.events) {
                    paymentAudit.events.forEach(pe => {
                      events.push({
                        type: 'payment',
                        key: pe.event,
                        label: PAYMENT_EVENT_CONFIG[pe.event]?.label || pe.event,
                        desc: pe.reason || pe.error || null,
                        amount: pe.amount,
                        config: PAYMENT_EVENT_CONFIG[pe.event] || PAYMENT_EVENT_CONFIG.status_change,
                        time: pe.timestamp ? new Date(pe.timestamp) : null,
                        original: pe
                      });
                    });
                  }

                  // 3. Add base pipeline placeholders (if they haven't happened yet)
                  timelineSteps.forEach((ts, idx) => {
                    const isCompleted = idx < currentStepIndex;
                    const isCurrent = idx === currentStepIndex;
                    if (!isCompleted && !isCurrent) {
                      events.push({
                        type: 'pipeline_future',
                        key: ts.key,
                        label: ts.label,
                        desc: ts.entity,
                        time: null
                      });
                    }
                  });

                  // Sort: chronological for completed events, then future pipeline at the bottom
                  events.sort((a, b) => {
                    if (a.time && b.time) return a.time.getTime() - b.time.getTime();
                    if (a.time && !b.time) return -1;
                    if (!a.time && b.time) return 1;
                    // Both future
                    return 0;
                  });

                  return events.map((ev, i) => {
                    const isFuture = ev.type === 'pipeline_future';
                    const isCancel = ['cancelled', 'failed', 'refunded'].includes(ev.key);
                    const isPreparing = ['preparing', 'ready'].includes(ev.key);
                    const isSuccess = ['delivered', 'completed', 'picked_up'].includes(ev.key);
                    
                    let dotClass = "w-[14px] h-[14px] rounded-full border-2 border-[#d1d5db] bg-white ring-4 ring-white";
                    if (!isFuture) {
                      if (ev.type === 'payment') {
                        // Payment dots use their config bg
                        dotClass = `w-6 h-6 -ml-[5px] rounded-full flex items-center justify-center ring-4 ring-white shadow-sm`;
                      } else {
                        // Status dots
                        dotClass = `w-[14px] h-[14px] rounded-full ring-4 ring-white shadow-sm ${
                          isCancel ? 'bg-[#dc2626]' : isPreparing ? 'bg-[#ea580c]' : isSuccess ? 'bg-[#16a34a]' : 'bg-[#2563eb]'
                        }`;
                      }
                    }

                    return (
                      <div key={i} className="flex gap-4 relative z-10 mb-6 last:mb-0">
                        <div className="mt-1 shrink-0">
                          {ev.type === 'payment' ? (
                            <div className={dotClass} style={{ backgroundColor: ev.config.bg }}>
                              <ev.config.icon className="w-3 h-3" style={{ color: ev.config.color }} />
                            </div>
                          ) : (
                            <div className={dotClass} />
                          )}
                        </div>
                        <div className="flex-1 -mt-0.5">
                          <div className="flex justify-between items-start">
                            <p className={`text-[13px] font-bold capitalize ${isFuture ? 'text-[#9ca3af]' : ev.type==='payment' ? '' : 'text-[#111827]'}`}
                               style={ev.type === 'payment' ? { color: ev.config.color } : {}}>
                              {ev.label}
                            </p>
                            {ev.time && (
                              <span className="text-[10px] font-bold text-[#6b7280] ml-2 shrink-0 whitespace-nowrap bg-[#f3f4f6] px-1.5 py-0.5 rounded">
                                {formatTime(ev.time, restaurant?.timeFormat, restaurant?.timezone)}
                              </span>
                            )}
                          </div>
                          
                          {ev.desc && (
                            <p className={`text-[11px] mt-0.5 leading-snug ${isFuture ? 'text-[#9ca3af]' : 'text-[#6b7280]'}`}>
                              {ev.desc}
                            </p>
                          )}
                          
                          {ev.amount != null && ev.type === 'payment' && (
                            <p className="text-[11px] font-black text-[#111827] mt-1 bg-[#f3f4f6] inline-block px-2 py-0.5 rounded">
                              {formatCurrency(ev.amount, currency)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}

              </div>
            </div>
            
            {/* Internal Note Input placeholder */}
            <div className="p-4 border-t border-[#f3f4f6] bg-[#f9fafb]">
               <div className="text-[10px] font-bold text-[#6b7280] uppercase mb-2">Internal Note</div>
               {order.adminNotes?.length > 0 ? (
                 <div className="bg-[#fffbeb] border border-[#fde68a] rounded p-2 text-xs text-[#b45309] font-medium leading-tight">
                   {order.adminNotes[order.adminNotes.length - 1].text}
                 </div>
               ) : (
                 <p className="text-[11px] text-[#9ca3af] italic">No internal notes added.</p>
               )}
            </div>
          </div>
        </div>

      </div>

      <ConfirmModal
        {...confirmConfig}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />
    </div>
  );
}
