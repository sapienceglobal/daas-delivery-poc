'use client';

import { Check, Calendar, Clock, CreditCard, Receipt, X } from 'lucide-react';

const STATUS_META = {
  pending: { label: 'Order Received', color: '#2563eb' },
  accepted: { label: 'Order Confirmed', color: '#1fae64' },
  preparing: { label: 'Preparing', color: '#e8a020' },
  ready: { label: 'Ready', color: '#e8a020' },
  picked_up: { label: 'Out for Delivery', color: '#7c3aed' },
  delivered: { label: 'Delivered', color: '#1fae64' },
  cancelled: { label: 'Cancelled', color: '#ef4444' },
};

export default function OrderHeaderBanner({ order, isSingleRestaurantMode }) {
  if (!order) return null;

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const orderTime = new Date(order.createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const getWording = () => {
    switch (order.status) {
      case 'pending':
        return {
          prefix: 'YOUR ORDER HAS BEEN',
          statusWord: 'RECEIVED',
          desc: "We've received your order and are waiting for the restaurant to confirm it.",
        };
      case 'accepted':
        return {
          prefix: 'YOUR ORDER IS',
          statusWord: 'CONFIRMED',
          desc: "Great news! The restaurant has confirmed your order and it's being prepared with love and care.",
        };
      case 'preparing':
      case 'ready':
        return {
          prefix: 'YOUR ORDER IS BEING',
          statusWord: 'PREPARED',
          desc: 'Our talented chefs are crafting your dishes to absolute perfection.',
        };
      case 'picked_up':
        return {
          prefix: 'YOUR ORDER IS OUT FOR',
          statusWord: 'DELIVERY',
          desc: 'Your food is hot and fresh on its way to your destination.',
        };
      case 'delivered':
        return {
          prefix: 'YOUR ORDER HAS BEEN',
          statusWord: 'DELIVERED',
          desc: 'Enjoy your meal! We hope you love every bite of it.',
        };
      case 'cancelled':
        return {
          prefix: 'YOUR ORDER WAS',
          statusWord: 'CANCELLED',
          desc: 'This order has been cancelled. If paid, your refund is being processed.',
        };
      default:
        return {
          prefix: 'ORDER STATUS',
          statusWord: 'UPDATED',
          desc: 'The status of your order has been updated.',
        };
    }
  };

  const wording = getWording();
  const statusMeta =
    STATUS_META[order.status] ?? { label: order.status?.replace('_', ' ') || 'Updated', color: '#9ca3af' };
  const isCancelled = order.status === 'cancelled';
  const isPaid = order.paymentStatus === 'paid';
  const displayOrderId = order.orderNumber?.replace('ORD-', '') || order._id.slice(-6).toUpperCase();

  return (
    <div
      className="relative py-12 md:py-16 bg-cover bg-center border-b border-[#e5e7eb] flex items-center overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(10, 10, 10, 0.95) 45%, rgba(10, 10, 10, 0.50) 100%), url('https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1600&q=80')",
      }}
    >
      <div className="mx-auto max-w-[1550px] w-full px-4 md:px-6 lg:px-8 relative z-10 flex flex-col gap-8">
        {/* Confirmed message block */}
        <div className="flex items-center gap-4 md:gap-6 animate-in fade-in slide-in-from-left duration-500">
          <div
            className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${statusMeta.color}20`, border: `1px solid ${statusMeta.color}66` }}
          >
            <div
              className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-[#ffffff]"
              style={{ backgroundColor: statusMeta.color }}
            >
              {isCancelled ? <X className="w-6 h-6 stroke-[3]" /> : <Check className="w-6 h-6 stroke-[3]" />}
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: statusMeta.color }} />
              <h2
                className="text-[12px] md:text-[13px] font-black uppercase tracking-wider leading-none"
                style={{ color: statusMeta.color }}
              >
                {statusMeta.label} — Live Status
              </h2>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black font-serif leading-tight tracking-wide uppercase">
              <span className="text-[#ffffff]">{wording.prefix} </span>
              <span style={{ color: statusMeta.color }}>{wording.statusWord}</span>
            </h1>
            <p className="text-[13px] md:text-[14px] text-[#e5e7eb] mt-2 font-medium max-w-[500px]">
              {wording.desc}
            </p>
          </div>
        </div>

        {/* Metadata badges container */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-[900px] border border-[#ffffff]/10 bg-[#ffffff]/5 backdrop-blur-md rounded-2xl p-4 md:p-5 mt-2 animate-in fade-in slide-in-from-bottom duration-500">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#ffffff]/10 text-[#e8a020] shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#9ca3af] tracking-wider block">Order ID</span>
              <span className="text-[14px] font-black text-[#ffffff] tracking-wide">{displayOrderId}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 border-l border-[#ffffff]/10 pl-2 md:pl-4">
            <div className="p-2.5 rounded-xl bg-[#ffffff]/10 text-[#e8a020] shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#9ca3af] tracking-wider block">Order Date</span>
              <span className="text-[13px] font-bold text-[#ffffff]">{orderDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 border-l border-[#ffffff]/10 pl-2 md:pl-4">
            <div className="p-2.5 rounded-xl bg-[#ffffff]/10 text-[#e8a020] shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#9ca3af] tracking-wider block">Order Time</span>
              <span className="text-[13px] font-bold text-[#ffffff]">{orderTime}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 border-l border-[#ffffff]/10 pl-2 md:pl-4">
            <div className="p-2.5 rounded-xl bg-[#ffffff]/10 text-[#e8a020] shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#9ca3af] tracking-wider block">Payment</span>
              <span className={`text-[13px] font-bold ${isPaid ? 'text-[#1fae64]' : 'text-[#e8a020]'}`}>
                {isPaid ? 'Paid Online' : order.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}