import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Printer, Send, Calendar, Clock, 
  MapPin, Phone, Mail, FileText,
  CheckCircle, XCircle, FileClock, RefreshCcw,
  AlertTriangle, ShieldAlert, Zap, ArrowDownLeft,
  CreditCard, Info, Activity, Eye
} from 'lucide-react';
import { orderAPI } from '@/lib/api';
import { showToast } from '@/components/ui';
import { useMerchantContext } from '@/context/MerchantContext';
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
  }, [initialOrder._id]);

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

  if (!mounted || !order) return null;

  // ─── Derived state ────────────────────────────────────────────────────────
  const oStatus = (order.status || '').toLowerCase();
  const isTerminal = ['delivered', 'cancelled', 'failed', 'refunded'].includes(oStatus);
  const isRefunded = order.refunded === true || order.paymentStatus === 'refunded';
  const isPartialRefund = order.paymentStatus === 'partially_refunded';
  const hasAutoRefund = (order.paymentEvents || []).some(e => e.event === 'auto_refund_triggered');
  const autoRefundSucceeded = (order.paymentEvents || []).some(e => e.event === 'auto_refund_succeeded');
  const autoRefundFailed = (order.paymentEvents || []).some(e => e.event === 'auto_refund_failed');
  const canRefund = !isRefunded && ['paid', 'partially_refunded'].includes(order.paymentStatus);
  const canCancel = !isTerminal;
  const totalItems = (order.items || []).reduce((acc, it) => acc + it.quantity, 0);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleRefund = async () => {
    if (!canRefund) {
      showToast(isRefunded ? 'This order has already been refunded' : 'Order is not eligible for refund', 'info');
      return;
    }
    const confirmRefund = window.confirm(`Refund ${formatCurrency(order.total - (order.refundAmount || 0), currency)} to the customer's card?`);
    if (!confirmRefund) return;
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
  };

  const handleCancel = async () => {
    if (!canCancel) {
      showToast(`Order is already ${oStatus} — cannot cancel`, 'info');
      return;
    }
    const confirm = window.confirm('Cancel this order? If paid, an auto-refund will be issued automatically.');
    if (!confirm) return;
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
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#111827]">Order Details</h1>
          <p className="text-sm text-[#6b7280] mt-1">View and manage order information</p>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[#991b1b] font-bold text-xs border border-[#e5e7eb] bg-white px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Orders
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={fetchPaymentAudit} disabled={auditLoading}
            className="flex items-center gap-1.5 text-[#374151] font-bold text-xs border border-[#e5e7eb] bg-white px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
            <Activity className="w-3.5 h-3.5 text-[#6b7280]" />
            {auditLoading ? 'Loading...' : showAudit ? 'Hide Audit Log' : 'View Payment Audit'}
          </button>
          <button onClick={handlePrintInvoice} className="flex items-center gap-1.5 text-[#374151] font-bold text-xs border border-[#e5e7eb] bg-white px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            <Printer className="w-3.5 h-3.5 text-[#6b7280]" /> Print Invoice
          </button>
        </div>
      </div>

      {/* ── Auto-Refund Banner ───────────────────────────────────────────────── */}
      {hasAutoRefund && (
        <div className={`border rounded-xl p-4 flex items-start gap-3 ${
          autoRefundFailed
            ? 'bg-[#fef2f2] border-[#fecaca]'
            : autoRefundSucceeded
              ? 'bg-[#fffbeb] border-[#fde68a]'
              : 'bg-[#eff6ff] border-[#bfdbfe]'
        }`}>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
            autoRefundFailed ? 'bg-[#fee2e2]' : autoRefundSucceeded ? 'bg-[#fef3c7]' : 'bg-[#dbeafe]'
          }`}>
            {autoRefundFailed
              ? <ShieldAlert className="w-5 h-5 text-[#dc2626]" />
              : autoRefundSucceeded
                ? <Zap className="w-5 h-5 text-[#d97706]" />
                : <Info className="w-5 h-5 text-[#2563eb]" />
            }
          </div>
          <div>
            <p className={`text-sm font-bold ${
              autoRefundFailed ? 'text-[#991b1b]' : autoRefundSucceeded ? 'text-[#92400e]' : 'text-[#1e40af]'
            }`}>
              {autoRefundFailed
                ? '⚠️ Auto-Refund Failed — Manual action required'
                : autoRefundSucceeded
                  ? `⚡ Auto-Refund Processed — ${formatCurrency(order.refundAmount || order.total, currency)} was automatically returned to customer's card`
                  : '🔄 Auto-Refund Initiated — Processing...'}
            </p>
            {order.refundReason && (
              <p className={`text-xs mt-1 ${
                autoRefundFailed ? 'text-[#dc2626]' : autoRefundSucceeded ? 'text-[#b45309]' : 'text-[#3b82f6]'
              }`}>
                Reason: <span className="font-semibold">{order.refundReason.replace(/_/g, ' ')}</span>
              </p>
            )}
            {autoRefundFailed && (
              <p className="text-xs text-[#dc2626] mt-1 font-medium">
                Contact Stripe dashboard or initiate a manual refund below.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Failed Order Banner ──────────────────────────────────────────────── */}
      {oStatus === 'failed' && !hasAutoRefund && (
        <div className="bg-[#fef2f2] border border-[#fecaca] rounded-xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-[#fee2e2] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-[#dc2626]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#991b1b]">Order Failed — Payment may need manual review</p>
            <p className="text-xs text-[#dc2626] mt-1">Check the Payment Audit Log for details.</p>
          </div>
        </div>
      )}

      {/* ── Payment Audit Log (expandable) ──────────────────────────────────── */}
      {showAudit && paymentAudit && (
        <div className="bg-white border border-[#e5e7eb] rounded-[16px] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#f3f4f6] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#6366f1]" />
              <h3 className="text-[13px] font-bold text-[#111827]">Payment Audit Trail</h3>
              <span className="text-xs text-[#9ca3af]">— Full event log for {paymentAudit.orderNumber}</span>
            </div>
            <div className="flex items-center gap-3">
              {paymentAudit.stripePaymentIntentId && (
                <span className="font-mono text-[10px] bg-[#f3f4f6] text-[#6b7280] px-2 py-1 rounded">
                  {paymentAudit.stripePaymentIntentId.slice(0, 24)}…
                </span>
              )}
            </div>
          </div>
          <div className="p-5">
            {(paymentAudit.events || []).length === 0 ? (
              <p className="text-xs text-[#9ca3af] text-center py-4">No payment events recorded yet.</p>
            ) : (
              <div className="relative pl-4">
                {/* Vertical line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-[#e5e7eb]" />
                <div className="space-y-4">
                  {(paymentAudit.events || []).map((ev, idx) => {
                    const cfg = PAYMENT_EVENT_CONFIG[ev.event] || PAYMENT_EVENT_CONFIG.status_change;
                    const Icon = cfg.icon;
                    const isLatest = idx === paymentAudit.events.length - 1;
                    return (
                      <div key={idx} className="flex gap-3 relative z-10">
                        <div className="shrink-0 mt-0.5">
                          <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center ring-4 ring-white"
                            style={{ background: cfg.bg }}>
                            <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                              {ev.type === 'status_update' && ev.description && (
                                <span className="text-xs text-[#6b7280] ml-2">— {ev.description}</span>
                              )}
                              {ev.amount != null && (
                                <span className="text-xs font-semibold text-[#374151] ml-2">
                                  {formatCurrency(ev.amount, currency)}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#9ca3af] whitespace-nowrap shrink-0">
                              {ev.timestamp ? new Date(ev.timestamp).toLocaleString('en-US', {
                                month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
                              }) : '—'}
                            </span>
                          </div>
                          {ev.stripeRefundId && (
                            <p className="text-[10px] font-mono text-[#9ca3af] mt-0.5">Refund: {ev.stripeRefundId}</p>
                          )}
                          {ev.error && (
                            <p className="text-[10px] text-[#dc2626] mt-0.5 bg-[#fef2f2] px-2 py-1 rounded">
                              Error: {ev.error}
                            </p>
                          )}
                          {ev.reason && ev.event !== 'status_change' && (
                            <p className="text-[10px] text-[#6b7280] mt-0.5">
                              Reason: {ev.reason.replace(/_/g, ' ')}
                            </p>
                          )}
                          {ev.triggeredBy && ev.triggeredBy !== 'system' && (
                            <span className="text-[10px] bg-[#f3f4f6] text-[#6b7280] px-1.5 py-0.5 rounded mt-0.5 inline-block capitalize">
                              {ev.triggeredBy}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
            </div>
          </div>
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#f3f4f6]">
            <div className="text-center">
              <p className="text-[14px] font-black text-[#111827]">{totalItems}</p>
              <p className="text-xs font-bold text-[#6b7280]">Items</p>
            </div>
            <div className="text-center">
              <p className="text-[14px] font-black text-[#111827]">{formatCurrency(order.total, currency)}</p>
              <p className="text-xs font-bold text-[#6b7280]">Order Amount</p>
            </div>
            <div className="text-center">
              <p className={`text-[14px] font-black ${
                order.paymentStatus === 'paid' ? 'text-[#16a34a]'
                : order.paymentStatus === 'refunded' ? 'text-[#dc2626]'
                : order.paymentStatus === 'partially_refunded' ? 'text-[#d97706]'
                : 'text-[#ea580c]'}`}>
                {order.paymentStatus === 'paid' ? 'Paid'
                  : order.paymentStatus === 'refunded' ? 'Refunded'
                  : order.paymentStatus === 'partially_refunded' ? 'Partial'
                  : 'Unpaid'}
              </p>
              <p className="text-xs font-bold text-[#6b7280]">Payment</p>
            </div>
            {(order.orderType) === 'delivery' && (
              <div className="text-center">
                <p className="text-[14px] font-black text-[#111827]">{order.courierName ? order.courierName.split(' ')[0] : 'TBD'}</p>
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
          <h3 className="text-xs font-bold text-[#6b7280] mb-4">Delivery Information</h3>
          <div className="flex gap-4">
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs font-bold text-[#6b7280]">Type</p>
                <p className="text-xs font-bold text-[#111827] capitalize">{order.orderType?.replace('_', ' ') || 'Delivery'}</p>
              </div>
              {order.tableNumber && (
                <div>
                  <p className="text-xs font-bold text-[#6b7280]">Table</p>
                  <p className="text-xs font-bold text-[#111827]">{order.tableNumber}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-[#6b7280]">Address</p>
                <p className="text-xs text-[#374151] leading-tight line-clamp-3">{order.address || 'N/A'}</p>
              </div>
              {order.specialInstructions && (
                <div>
                  <p className="text-xs font-bold text-[#6b7280]">Instructions</p>
                  <p className="text-xs text-[#374151] line-clamp-2">{order.specialInstructions}</p>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#f3f4f6] flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-[#111827]">Rider: {order.courierName || 'Assigning...'}</p>
              <p className="text-xs text-[#6b7280]">{order.courierPhone || 'N/A'}</p>
            </div>
            <a href={`tel:${order.courierPhone || ''}`} className="w-6 h-6 rounded border border-[#e5e7eb] flex items-center justify-center text-[#374151] hover:bg-gray-50">
              <Phone className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Card 4: Payment Info */}
        <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-5 shadow-sm flex flex-col h-full">
          <h3 className="text-xs font-bold text-[#6b7280] mb-4">Payment Information</h3>
          <div className="space-y-2 flex-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#6b7280]">Method</span>
              <span className="font-bold text-[#16a34a] capitalize">{order.paymentMethod?.replace('_', ' ') || 'Cash'}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#6b7280]">Status</span>
              {getPaymentBadge(order.paymentStatus)}
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#6b7280]">Stripe ID</span>
              <span className="font-mono text-[10px] text-[#9ca3af] truncate max-w-[100px]">
                {order.stripePaymentIntentId ? `${order.stripePaymentIntentId.slice(0, 18)}…` : 'N/A'}
              </span>
            </div>
            {(order.refundAmount || 0) > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#6b7280]">Refunded</span>
                <span className="font-bold text-[#dc2626]">{formatCurrency(order.refundAmount, currency)}</span>
              </div>
            )}
          </div>
          <div className="border-t border-[#f3f4f6] pt-3 mt-3 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#6b7280]">Subtotal</span>
              <span className="font-bold text-[#111827]">{formatCurrency(order.subtotal, currency)}</span>
            </div>
            {(order.tax || 0) > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#6b7280]">{restaurant?.taxType || 'Tax'}</span>
                <span className="font-bold text-[#111827]">{formatCurrency(order.tax, currency)}</span>
              </div>
            )}
            {(order.deliveryFee || 0) > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#6b7280]">Delivery Fee</span>
                <span className="font-bold text-[#111827]">{formatCurrency(order.deliveryFee, currency)}</span>
              </div>
            )}
            {(order.tip || 0) > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#6b7280]">Tip</span>
                <span className="font-bold text-[#111827]">{formatCurrency(order.tip, currency)}</span>
              </div>
            )}
            {(order.discount || 0) > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#6b7280]">Discount</span>
                <span className="font-bold text-[#16a34a]">-{formatCurrency(order.discount, currency)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-[12px] pt-1 mt-1 border-t border-[#f3f4f6]">
              <span className="font-black text-[#111827]">Total</span>
              <span className="font-black text-[#dc2626]">{formatCurrency(order.total, currency)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Middle: Items + Timeline + Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Order Items */}
        <div className="lg:col-span-1 bg-white border border-[#e5e7eb] rounded-[16px] shadow-sm flex flex-col">
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
                            {item.name?.substring(0, 2).toUpperCase()}
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
                    <td className="px-5 py-3 text-xs font-bold text-[#374151] text-right">{formatCurrency(item.price, currency)}</td>
                    <td className="px-5 py-3 text-xs font-bold text-[#111827] text-center">{item.quantity}</td>
                    <td className="px-5 py-3 text-xs font-bold text-[#111827] text-right">{formatCurrency(item.lineTotal || (item.price * item.quantity), currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Order-level totals */}
          <div className="p-5 border-t border-[#f3f4f6] flex flex-col items-end">
            <div className="w-[200px] space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#6b7280]">Subtotal</span>
                <span className="font-bold text-[#111827]">{formatCurrency(order.subtotal, currency)}</span>
              </div>
              {(order.tax || 0) > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#6b7280]">{restaurant?.taxType || 'Tax'}</span>
                  <span className="font-bold text-[#111827]">{formatCurrency(order.tax, currency)}</span>
                </div>
              )}
              {(order.deliveryFee || 0) > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#6b7280]">Delivery</span>
                  <span className="font-bold text-[#111827]">{formatCurrency(order.deliveryFee, currency)}</span>
                </div>
              )}
              {(order.tip || 0) > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#6b7280]">Tip</span>
                  <span className="font-bold text-[#111827]">{formatCurrency(order.tip, currency)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-[13px] pt-2 mt-2 border-t border-[#f3f4f6]">
                <span className="font-black text-[#dc2626]">Total</span>
                <span className="font-black text-[#dc2626]">{formatCurrency(order.total, currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-5 shadow-sm">
          <h3 className="text-[12px] font-bold text-[#111827] mb-6">Order Status Timeline</h3>
          <div className="relative pl-3 space-y-6">
            <div className="absolute left-[15px] top-2 bottom-6 w-0.5 bg-[#e5e7eb] -z-10" />
            {timelineSteps.map((step, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const stepTime = getTimestampForStatus(step.key);
              const timeStr = stepTime
                ? `${formatDate(stepTime, restaurant?.dateFormat, restaurant?.timezone)} - ${formatTime(stepTime, restaurant?.timeFormat, restaurant?.timezone)}`
                : (isCompleted || isCurrent ? 'Just now' : 'Pending');
              const isNegative = ['cancelled', 'refunded', 'failed'].includes(oStatus) && isCurrent;
              return (
                <div key={idx} className="flex gap-4 relative z-10">
                  <div className="mt-0.5 shrink-0">
                    {(isCompleted || isCurrent) && isNegative ? (
                      <div className="w-5 h-5 rounded-full bg-[#dc2626] flex items-center justify-center ring-4 ring-white">
                        <XCircle className="w-3 h-3 text-white" />
                      </div>
                    ) : isCompleted ? (
                      <div className="w-5 h-5 rounded-full bg-[#16a34a] flex items-center justify-center ring-4 ring-white">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-5 h-5 rounded-full bg-[#ea580c] flex items-center justify-center ring-4 ring-white">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-white border-2 border-[#d1d5db] ring-4 ring-white" />
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
        </div>

        {/* Notes + History */}
        <div className="flex flex-col gap-4">
          {/* Customer Note */}
          <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-5 shadow-sm">
            <h3 className="text-[12px] font-bold text-[#111827] mb-4">Order Notes</h3>
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
          {/* Status History */}
          <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-5 shadow-sm flex-1">
            <h3 className="text-[12px] font-bold text-[#111827] mb-4">Status History</h3>
            <div className="space-y-3 relative pl-2">
              <div className="absolute left-[11px] top-1 bottom-1 w-px border-l border-dashed border-[#d1d5db]" />
              {(order.statusUpdates || []).map((su, idx) => {
                const isCancel = ['cancelled', 'failed', 'refunded'].includes(su.status);
                const dotColor = isCancel ? 'bg-[#dc2626]' : su.status === 'preparing' || su.status === 'ready' ? 'bg-[#f59e0b]' : 'bg-[#16a34a]';
                return (
                  <div key={idx} className="flex justify-between items-start relative z-10">
                    <div className="flex items-start gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${dotColor} mt-1.5`} />
                      <div>
                        <span className="text-xs font-bold text-[#374151] capitalize">{su.status?.replace('_', ' ')}</span>
                        {su.description && <p className="text-[10px] text-[#9ca3af] mt-0.5 line-clamp-1">{su.description}</p>}
                      </div>
                    </div>
                    <span className="text-xs text-[#6b7280] shrink-0 ml-2">
                      {su.timestamp ? new Date(su.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* ── Action Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">

        {/* Recommended Actions */}
        <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-5 shadow-sm">
          <h3 className="text-xs font-bold text-[#111827] mb-3">Recommended Actions</h3>
          <div className="flex flex-wrap gap-2">
            <a href={`tel:${order.customerPhone || ''}`}
              className="flex-1 min-w-[120px] border border-[#e5e7eb] rounded-lg p-2 flex items-center gap-2 hover:bg-gray-50 transition-colors">
              <Phone className="w-3.5 h-3.5 text-[#3b82f6]" />
              <div>
                <p className="text-xs font-bold text-[#111827] leading-tight">Contact Customer</p>
                <p className="text-[8px] text-[#6b7280]">Call or Message</p>
              </div>
            </a>

            <button onClick={handleRemake} disabled={isRemakingOrder}
              className="flex-1 min-w-[120px] border border-[#e5e7eb] rounded-lg p-2 flex items-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <RefreshCcw className={`w-3.5 h-3.5 text-[#16a34a] ${isRemakingOrder ? 'animate-spin' : ''}`} />
              <div>
                <p className="text-xs font-bold text-[#111827] leading-tight">Remake Order</p>
                <p className="text-[8px] text-[#6b7280]">{isRemakingOrder ? 'Creating…' : 'Send KOT ($0)'}</p>
              </div>
            </button>

            <button onClick={handleRefund} disabled={isRefunding || !canRefund}
              title={!canRefund ? (isRefunded ? 'Already refunded' : 'Order is not paid — cannot refund') : 'Process refund'}
              className={`flex-1 min-w-[120px] border rounded-lg p-2 flex items-center gap-2 transition-colors
                ${!canRefund
                  ? 'border-[#e5e7eb] bg-[#f9fafb] opacity-50 cursor-not-allowed'
                  : 'border-[#e5e7eb] hover:bg-gray-50 cursor-pointer'}`}>
              <FileClock className="w-3.5 h-3.5 text-[#dc2626]" />
              <div>
                <p className="text-xs font-bold text-[#111827] leading-tight">
                  {isRefunded ? 'Refunded ✓' : isPartialRefund ? 'Add Refund' : 'Refund'}
                </p>
                <p className="text-[8px] text-[#6b7280]">
                  {isRefunding ? 'Processing…' : isRefunded ? 'Already done' : isPartialRefund ? `Remaining: ${formatCurrency((order.total || 0) - (order.refundAmount || 0), currency)}` : 'Process Refund'}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-5 shadow-sm">
          <h3 className="text-xs font-bold text-[#111827] mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-2 h-full">
            <button onClick={handlePrintKOT}
              className="flex-1 min-w-[100px] border border-[#e5e7eb] rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors py-3">
              <Printer className="w-3.5 h-3.5 text-[#374151]" />
              <span className="text-xs font-bold text-[#111827]">Print KOT</span>
            </button>

            <button onClick={handlePrintInvoice}
              className="flex-1 min-w-[100px] border border-[#e5e7eb] rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors py-3">
              <FileText className="w-3.5 h-3.5 text-[#374151]" />
              <span className="text-xs font-bold text-[#111827]">Print Invoice</span>
            </button>

            <button onClick={handleSendInvoice} disabled={isSendingInvoice || !order.customerEmail}
              title={!order.customerEmail ? 'No customer email on file' : 'Email invoice to customer'}
              className={`flex-1 min-w-[100px] border rounded-lg flex items-center justify-center gap-2 transition-colors py-3
                ${!order.customerEmail ? 'border-[#e5e7eb] bg-[#f9fafb] opacity-50 cursor-not-allowed' : 'border-[#e5e7eb] hover:bg-gray-50 cursor-pointer'}`}>
              <Send className={`w-3.5 h-3.5 text-[#374151] ${isSendingInvoice ? 'animate-pulse' : ''}`} />
              <span className="text-xs font-bold text-[#111827]">{isSendingInvoice ? 'Sending…' : 'Email Invoice'}</span>
            </button>

            <button onClick={handleCancel} disabled={isCancelling || !canCancel}
              title={!canCancel ? `Order is ${oStatus} — cannot cancel` : 'Cancel this order'}
              className={`flex-1 min-w-[100px] border rounded-lg flex items-center justify-center gap-2 transition-colors py-3
                ${!canCancel
                  ? 'border-[#e5e7eb] bg-[#f9fafb] opacity-50 cursor-not-allowed'
                  : 'border-[#fecaca] bg-[#fef2f2] hover:bg-[#fee2e2] cursor-pointer'}`}>
              <XCircle className={`w-3.5 h-3.5 ${!canCancel ? 'text-[#9ca3af]' : 'text-[#dc2626]'}`} />
              <span className={`text-xs font-bold ${!canCancel ? 'text-[#9ca3af]' : 'text-[#dc2626]'}`}>
                {isCancelling ? 'Cancelling…' : !canCancel ? `${oStatus.charAt(0).toUpperCase() + oStatus.slice(1)}` : 'Cancel Order'}
              </span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
