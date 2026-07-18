'use client';

import { Check, Calendar, Clock, CreditCard, Receipt } from 'lucide-react';

export default function OrderHeaderBanner({ order, isSingleRestaurantMode }) {
  if (!order) return null;

  // Format date and time
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

  // Dynamic confirmation wording based on status
  const getWording = () => {
    switch (order.status) {
      case 'pending':
      case 'accepted':
        return {
          title: 'YOUR ORDER IS CONFIRMED',
          desc: "We've received your order and it's being prepared with love and care.",
        };
      case 'preparing':
      case 'ready':
        return {
          title: 'YOUR ORDER IS BEING PREPARED',
          desc: 'Our talented chefs are crafting your dishes to absolute perfection.',
        };
      case 'picked_up':
        return {
          title: 'YOUR ORDER IS OUT FOR DELIVERY',
          desc: 'Your food is hot and fresh on its way to your destination.',
        };
      case 'delivered':
        return {
          title: 'YOUR ORDER HAS BEEN DELIVERED',
          desc: 'Enjoy your meal! We hope you love every bite of it.',
        };
      case 'cancelled':
        return {
          title: 'YOUR ORDER WAS CANCELLED',
          desc: 'This order has been cancelled. If paid, your refund is being processed.',
        };
      default:
        return {
          title: 'ORDER STATUS UPDATED',
          desc: 'The status of your order has been updated.',
        };
    }
  };

  const wording = getWording();
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
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#1fae64]/20 border border-[#1fae64]/40 flex items-center justify-center text-[#1fae64] shrink-0">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#1fae64] flex items-center justify-center text-[#ffffff]">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
          </div>
          <div>
            <h2 className="text-[20px] font-bold text-[#e8a020] uppercase tracking-wider mb-1 leading-none">
              Thank You!
            </h2>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black font-serif text-[#ffffff] leading-tight tracking-wide uppercase">
              {wording.title}
            </h1>
            <p className="text-[13px] md:text-[14px] text-[#e5e7eb] mt-2 font-medium max-w-[500px]">
              {wording.desc}
            </p>
          </div>
        </div>

        {/* Metadata badges container */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-[900px] border border-[#ffffff]/10 bg-[#ffffff]/5 backdrop-blur-md rounded-2xl p-4 md:p-5 mt-2 animate-in fade-in slide-in-from-bottom duration-500">
          
          {/* Order ID */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#ffffff]/10 text-[#e8a020] shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#9ca3af] tracking-wider block">Order ID</span>
              <span className="text-[14px] font-black text-[#ffffff] tracking-wide">{displayOrderId}</span>
            </div>
          </div>

          {/* Order Date */}
          <div className="flex items-center gap-3 border-l border-[#ffffff]/10 pl-2 md:pl-4">
            <div className="p-2.5 rounded-xl bg-[#ffffff]/10 text-[#e8a020] shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#9ca3af] tracking-wider block">Order Date</span>
              <span className="text-[13px] font-bold text-[#ffffff]">{orderDate}</span>
            </div>
          </div>

          {/* Order Time */}
          <div className="flex items-center gap-3 border-l border-[#ffffff]/10 pl-2 md:pl-4">
            <div className="p-2.5 rounded-xl bg-[#ffffff]/10 text-[#e8a020] shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#9ca3af] tracking-wider block">Order Time</span>
              <span className="text-[13px] font-bold text-[#ffffff]">{orderTime}</span>
            </div>
          </div>

          {/* Payment */}
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
