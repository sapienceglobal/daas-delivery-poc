'use client';

import { FileText } from 'lucide-react';

export default function OrderDetailsCard({ order }) {
  if (!order) return null;

  // Simple dynamic veg/non-veg helper based on common keywords
  const isVegItem = (name) => {
    const lower = name.toLowerCase();
    const nonVegKeywords = ['chicken', 'beef', 'pork', 'bacon', 'pepperoni', 'lamb', 'mutton', 'fish', 'shrimp', 'crab', 'meat', 'egg'];
    return !nonVegKeywords.some(keyword => lower.includes(keyword));
  };

  const totalItemsCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-[#ffffff] p-6 shadow-sm">
      
      {/* Title */}
      <h2 className="text-[20px] font-bold font-serif flex items-center gap-3 text-[#1a1a1a] mb-6">
        <span className="h-10 w-10 rounded-full flex items-center justify-center bg-[#fcedec] text-[#7a0b10] shrink-0">
          <FileText className="w-5 h-5" />
        </span>
        Order Details
      </h2>

      {/* Item List */}
      <div className="divide-y divide-[#e5e7eb] mb-6">
        {order.items?.map((item, idx) => {
          const isVeg = isVegItem(item.name);
          const basePrice = item.selectedSize?.price ?? item.price;
          const addOnTotal = item.addOns?.reduce((sum, a) => sum + (a.price || 0), 0) || 0;
          const singleItemPrice = basePrice + addOnTotal;

          return (
            <div key={idx} className="flex gap-4 py-4 first:pt-0 last:pb-0 items-start">
              {/* Thumbnail */}
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#e5e7eb] shrink-0 bg-[#f9fafb]">
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=100&q=80'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title & Options */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {/* Veg/Non-Veg Indicator Symbol */}
                  <span 
                    className={`inline-flex items-center justify-center w-4 h-4 border-2 shrink-0 p-0.5 rounded-sm ${
                      isVeg ? 'border-[#1fae64]' : 'border-[#ef4444]'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-[#1fae64]' : 'bg-[#ef4444]'}`}></span>
                  </span>
                  <h4 className="font-bold text-[15px] text-[#1a1a1a] leading-tight truncate">
                    {item.name}
                  </h4>
                </div>

                <div className="flex flex-col gap-0.5 text-[12px] text-[#6b7280]">
                  {item.selectedSize?.name && (
                    <span>Size: {item.selectedSize.name}</span>
                  )}
                  {item.addOns && item.addOns.length > 0 && (
                    <span>+ {item.addOns.map(a => a.name).join(', ')}</span>
                  )}
                  {item.specialInstructions && (
                    <span className="italic">Note: "{item.specialInstructions}"</span>
                  )}
                </div>
              </div>

              {/* Price, Quantity, Line Total */}
              <div className="flex items-start gap-6 shrink-0 text-right">
                <span className="text-[13px] font-medium text-[#4b5563] pt-0.5">
                  ${singleItemPrice.toFixed(2)}
                </span>
                <span className="text-[13px] font-medium text-[#6b7280] pt-0.5">
                  x {item.quantity}
                </span>
                <span className="text-[14px] font-bold text-[#7a0b10] pt-0.5 min-w-[60px]">
                  ${(item.lineTotal || (singleItemPrice * item.quantity)).toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pricing Breakdown */}
      <div className="border-t border-dashed border-[#d1d5db] pt-5 space-y-3">
        
        {/* Subtotal */}
        <div className="flex justify-between items-center text-[14px]">
          <span className="text-[#4b5563] font-medium">Subtotal ({totalItemsCount} Items)</span>
          <span className="font-bold text-[#1a1a1a]">${order.subtotal?.toFixed(2)}</span>
        </div>

        {/* Delivery Fee */}
        {order.orderType === 'delivery' && (
          <div className="flex justify-between items-center text-[14px]">
            <span className="text-[#4b5563] font-medium">Delivery Fee</span>
            <span className="font-bold text-[#1a1a1a]">
              {order.deliveryFee === 0 ? 'FREE' : `$${order.deliveryFee?.toFixed(2)}`}
            </span>
          </div>
        )}

        {/* Taxes */}
        <div className="flex justify-between items-center text-[14px]">
          <span className="text-[#4b5563] font-medium">Taxes & Charges</span>
          <span className="font-bold text-[#1a1a1a]">${order.tax?.toFixed(2)}</span>
        </div>

        {/* Platform Fee */}
        {order.platformFee > 0 && (
          <div className="flex justify-between items-center text-[14px]">
            <span className="text-[#4b5563] font-medium">Platform Fee</span>
            <span className="font-bold text-[#1a1a1a]">${order.platformFee?.toFixed(2)}</span>
          </div>
        )}

        {/* Service Fee */}
        {order.serviceFee > 0 && (
          <div className="flex justify-between items-center text-[14px]">
            <span className="text-[#4b5563] font-medium">Service Fee (3%)</span>
            <span className="font-bold text-[#1a1a1a]">${order.serviceFee?.toFixed(2)}</span>
          </div>
        )}

        {/* Tip */}
        {order.tip > 0 && (
          <div className="flex justify-between items-center text-[14px]">
            <span className="text-[#4b5563] font-medium">Driver Tip</span>
            <span className="font-bold text-[#1fae64]">${order.tip?.toFixed(2)}</span>
          </div>
        )}

        {/* Coupon Discount */}
        {order.discount > 0 && (
          <div className="flex justify-between items-center text-[14px]">
            <span className="text-[#4b5563] font-medium">
              Coupon Discount {order.couponCode ? `(${order.couponCode})` : ''}
            </span>
            <span className="font-bold text-[#1fae64]">-${order.discount?.toFixed(2)}</span>
          </div>
        )}

        {/* Loyalty Discount */}
        {order.loyaltyDiscount > 0 && (
          <div className="flex justify-between items-center text-[14px]">
            <span className="text-[#4b5563] font-medium">Loyalty Discount</span>
            <span className="font-bold text-[#1fae64]">-${order.loyaltyDiscount?.toFixed(2)}</span>
          </div>
        )}

        {/* Refunded Amount */}
        {order.refundAmount > 0 && (
          <div className="flex justify-between items-center text-[14px]">
            <span className="text-[#ef4444] font-medium">Refunded Amount</span>
            <span className="font-bold text-[#ef4444]">-${order.refundAmount?.toFixed(2)}</span>
          </div>
        )}

        {/* Final Total */}
        <div className="border-t border-[#e5e7eb] pt-4 mt-2 flex items-center justify-between">
          <span className="text-[16px] font-bold text-[#1a1a1a] uppercase tracking-wider">Total Amount</span>
          <span className="text-[24px] font-black text-[#7a0b10]">${order.total?.toFixed(2)}</span>
        </div>

      </div>

    </div>
  );
}
