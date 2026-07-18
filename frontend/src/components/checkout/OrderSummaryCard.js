'use client';
import { Minus, Plus, ShieldCheck, Tag, Info, X } from 'lucide-react';

export default function OrderSummaryCard({
  t,
  items, itemCount, subtotal, updateQuantity,
  orderType, deliveryFee, quoteLoading, tax, platformFee, serviceFee,
  couponCode, setCouponCode, onApplyCoupon, couponLoading, couponApplied, couponDiscount, onRemoveCoupon,
  user, useLoyaltyPoints, setUseLoyaltyPoints,
  total,
  quoteError,
}) {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-[#ffffff] p-6 shadow-sm ll-slide-panel">
      <h3 className="text-[22px] font-bold font-serif text-[#7a0b10] mb-6">Order Summary</h3>

      <div className="space-y-6 max-h-[350px] overflow-y-auto pr-2 mb-6 scrollbar-thin">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-4 items-start">
            <img
              src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=100&q=80'}
              alt={item.name}
              className="w-[72px] h-[72px] rounded-xl object-cover border border-[#e5e7eb] shrink-0"
            />

            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-[15px] text-[#1a1a1a] leading-tight truncate mb-1">
                {item.name}
              </h4>
              <span className="text-[14px] font-medium text-[#1a1a1a] block mb-2.5">
                ${((item.selectedSize?.price || item.price) + (item.addOns || []).reduce((sum, a) => sum + (a.price || 0), 0)).toFixed(2)}
              </span>
              
              {item.selectedSize && (
                <span className="text-[11px] font-bold text-[#6b7280] block mb-1">Size: {item.selectedSize.name}</span>
              )}
              {item.addOns && item.addOns.length > 0 && (
                <span className="text-[11px] text-[#6b7280] block leading-snug mb-1">+ {item.addOns.map((a) => a.name).join(', ')}</span>
              )}

              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center border border-[#e5e7eb] rounded-lg h-[32px] bg-[#ffffff]">
                  <button onClick={() => updateQuantity(idx, item.quantity - 1)} className="pl-1 h-full flex items-center justify-center text-[#7a0b10] hover:bg-[#f9fafb] transition-colors rounded-l-lg ll-focus-ring" aria-label={`Decrease ${item.name}`}>
                    <Minus className="h-3 w-3" strokeWidth={2.5} />
                  </button>
                  <div className="w-px h-full bg-[#e5e7eb]" />
                  <span className="text-[13px] font-bold w-8 text-center text-[#1a1a1a]">{item.quantity}</span>
                  <div className="w-px h-full bg-[#e5e7eb]" />
                  <button onClick={() => updateQuantity(idx, item.quantity + 1)} className=" h-full flex items-center justify-center text-[#7a0b10] hover:bg-[#f9fafb] transition-colors rounded-r-lg ll-focus-ring" aria-label={`Increase ${item.name}`}>
                    <Plus className="h-3 w-3x" strokeWidth={2.5} />
                  </button>
                </div>
                
                <span className="font-bold text-[15px] text-[#7a0b10] shrink-0">
                  ${item.lineTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-[#d1d5db] pt-5 pb-5 space-y-3.5">
        <div className="flex justify-between items-center text-[14px]">
          <span className="text-[#1a1a1a] font-medium">Subtotal ({itemCount} Items)</span>
          <span className="font-bold text-[#1a1a1a]">${subtotal.toFixed(2)}</span>
        </div>

        {orderType === 'delivery' && (
          <div className="flex justify-between items-center text-[14px]">
            <span className="text-[#1a1a1a] font-medium flex items-center gap-1">
              Delivery Fee <Info className="w-4 h-4 text-[#9ca3af]" />
            </span>
            <span className="font-bold text-[#1a1a1a]">
              {quoteLoading ? '...' : deliveryFee === null ? 'Unavailable' : deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center text-[14px]">
          <span className="text-[#1a1a1a] font-medium flex items-center gap-1">
            Taxes & Charges <Info className="w-4 h-4 text-[#9ca3af]" />
          </span>
          <span className="font-bold text-[#1a1a1a]">${tax.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center text-[14px]">
          <span className="text-[#1a1a1a] font-medium">Platform Fee</span>
          <span className="font-bold text-[#1a1a1a]">${platformFee.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-center text-[14px]">
          <span className="text-[#1a1a1a] font-medium flex items-center gap-1">
            Service Fee (3%) <Info className="w-4 h-4 text-[#9ca3af]" />
          </span>
          <span className="font-bold text-[#1a1a1a]">${serviceFee.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-[#d1d5db] pt-5 pb-5">
        <div className="flex items-center gap-2 mb-3 text-[#1a1a1a] font-bold text-[14px]">
          <Tag className="w-4 h-4 text-[#4b5563]" /> Apply Coupon
        </div>
        
        <div className="flex gap-2.5">
          <input
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            className="flex-1 rounded-lg border border-[#e5e7eb] bg-[#ffffff] px-3.5 py-2.5 text-[14px] text-[#1a1a1a] placeholder-[#9ca3af] focus:outline-none focus:border-[#7a0b10] transition-colors"
          />
          <button
            type="button"
            onClick={onApplyCoupon}
            disabled={couponLoading || couponApplied}
            className={`text-[14px] font-bold text-[#ffffff] bg-[#7a0b10] hover:bg-[#5e080c] px-6 rounded-lg ll-interactive ll-focus-ring ${
              couponApplied ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {couponLoading ? '...' : 'Apply'}
          </button>
        </div>

        {couponApplied && (
          <div className="flex items-center justify-between mt-3 px-4 py-3 bg-[#f2fcf5] border border-[#d1fae5] rounded-lg">
            <span className="text-[#1fae64] text-[13px] font-bold">
              {couponCode} Applied <span className="font-medium ml-1">(-${couponDiscount.toFixed(2)})</span>
            </span>
            <button onClick={onRemoveCoupon} className="text-[#1fae64] hover:text-[#16a34a] transition-colors ll-focus-ring" aria-label="Remove coupon">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {user && user.loyaltyPoints > 0 && (
        <div className="border-t border-dashed border-[#d1d5db] pt-4 pb-4 flex items-center justify-between text-[13px]">
          <div>
            <span className="font-bold text-[#1a1a1a] block">Loyalty Points</span>
            <span className="text-[#6b7280] text-[12px] mt-0.5">Points: {user.loyaltyPoints} (${(user.loyaltyPoints / 100).toFixed(2)})</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] font-medium text-[#1a1a1a] cursor-pointer select-none">Use Points</label>
            <input
              type="checkbox"
              checked={useLoyaltyPoints}
              onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
              className="rounded border-[#d1d5db] text-[#7a0b10] focus:ring-[#7a0b10] w-4 h-4 cursor-pointer"
            />
          </div>
        </div>
      )}

      <div className="border-t border-dashed border-[#d1d5db] pt-6 pb-2 flex items-center justify-between">
        <span className="text-[16px] font-bold uppercase tracking-wider text-[#1a1a1a]">Total Amount</span>
        <span className="text-[28px] font-bold text-[#7a0b10]">
          {deliveryFee === null ? 'N/A' : `$${total.toFixed(2)}`}
        </span>
      </div>

      {orderType === 'delivery' && quoteError && (
        <div className="text-[#ef4444] text-[12px] font-bold text-center p-2.5 bg-[#fef2f2] border border-[#fca5a5] rounded-xl mt-3 select-none">
          Delivery is unavailable for this location
        </div>
      )}

      <div className="mt-6 p-4 rounded-xl bg-[#fffaf9] border border-[#f5ebe9] flex items-start gap-3">
        <ShieldCheck className="h-6 w-6 text-[#7a0b10] shrink-0 mt-0.5" strokeWidth={1.5} />
        <div>
          <div className="text-[13px] font-bold text-[#7a0b10] mb-0.5">Secure Checkout</div>
          <div className="text-[12px] text-[#6b7280]">Your data is 100% safe.</div>
        </div>
      </div>
    </div>
  );
}
