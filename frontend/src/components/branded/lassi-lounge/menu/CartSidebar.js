import React from 'react';
import { Minus, Plus, ShoppingBag, X, ChevronUp } from 'lucide-react';

const getDishImage = (itemName) => {
  const name = itemName.toLowerCase();
  if (name.includes('butter chicken')) return '/images/branded/lassi-lounge/dishes/butter-chicken.jpg';
  if (name.includes('rogan josh') || name.includes('lamb')) return '/images/branded/lassi-lounge/dishes/lamb-rogan-josh.jpg';
  if (name.includes('paneer tikka')) return '/images/branded/lassi-lounge/dishes/paneer-tikka.jpg';
  if (name.includes('biryani')) return '/images/branded/lassi-lounge/dishes/chicken-biryani.jpg';
  if (name.includes('dal makhani')) return '/images/branded/lassi-lounge/dishes/dal-makhani.jpg';
  if (name.includes('lassi')) return '/images/branded/lassi-lounge/dishes/mango-lassi.jpg';
  if (name.includes('roll') || name.includes('spring')) return '/images/branded/lassi-lounge/dishes/veg-spring-rolls.png';
  if (name.includes('corn')) return 'https://images.unsplash.com/photo-1626804475297-41609ea004eb?auto=format&fit=crop&w=400&q=80';
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
};

export default function CartSidebar({
  items,
  itemCount,
  subtotal,
  taxes,
  deliveryFee = 2.99,
  discount,
  totalAmount,
  couponApplied,
  setCouponApplied,
  updateQuantity,
  router
}) {
  return (
    <div className="overflow-hidden rounded-2xl shadow-md border border-[#1a1a1a]/10 bg-[#fdfbf7] text-[#1a1a1a] ll-slide-panel">
      {/* Cart Header (Premium deep maroon) */}
      <div className="bg-[#5c060a] text-[#ffffff] px-5 py-4 flex items-center justify-between">
        <h3 className="text-[17px] font-extrabold gap-1 tracking-wide flex items-center gap-1.5 font-sans">
          Your Cart <span className="text-[14px]  font-normal text-white/80">({itemCount} Items)</span>
        </h3>
        <button className="text-white hover:text-white/80 transition-colors ll-focus-ring" aria-label="Cart summary">
          <ChevronUp className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>

      {/* Cart Body */}
      <div className="p-5">
        {items.length > 0 ? (
          <>
            {/* Cart Items List */}
            <div className="max-h-80 overflow-y-auto pr-1 flex flex-col gap-5 ll-soft-scroll ll-stagger">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-center rounded-xl p-1 -m-1 transition-colors hover:bg-[#ffffff]/70">
                  
                  {/* Left Side: Image with (X) button inside */}
                  <div className="relative w-[72px] h-[72px] shrink-0">
                    <img 
                      src={item.image || getDishImage(item.name)} 
                      alt={item.name} 
                      className="w-full h-full rounded-xl object-cover border border-[#1a1a1a]/10 shadow-sm" 
                    />
                    <button 
                      onClick={() => updateQuantity(idx, 0)} 
                      className="absolute top-1 right-1 bg-black/40 hover:bg-black/60 rounded-full p-0.5 text-white transition-colors border border-white/20 ll-focus-ring"
                      aria-label={`Remove ${item.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  
                  {/* Right Side: Name, Price, and Quantity Selector */}
                  <div className="flex-1 flex flex-col justify-start">
                    <h4 className="text-[14px] font-extrabold text-[#1a1a1a] leading-tight font-sans">
                      {item.name}
                    </h4>
                    
                    {item.selectedSize && (
                      <span className="text-[11px] text-[#7a0b10] font-bold block mt-0.5">
                        Size: {item.selectedSize.name}
                      </span>
                    )}
                    {item.addOns && item.addOns.length > 0 && (
                      <span className="text-[11px] text-[#1a1a1a]/60 block leading-snug">
                        + {item.addOns.map(a => a.name).join(', ')}
                      </span>
                    )}

                    <p className="text-[13px] text-[#1a1a1a]/80 font-bold mt-1 font-sans">
                      ${((item.selectedSize?.price || item.price) + (item.addOns || []).reduce((sum, a) => sum + (a.price || 0), 0)).toFixed(2)}
                    </p>
                    
                    {/* Quantity Controls - Exactly like image (with dividers) */}
                    <div className="flex items-center mt-2.5">
                      <div className="flex items-center border border-[#1a1a1a]/20 rounded-lg bg-[#ffffff] h-[30px] shadow-sm mt-2">
                        <button 
                          onClick={() => updateQuantity(idx, item.quantity - 1)} 
                          className="px-2 text-[#7a0b10] hover:bg-[#1a1a1a]/5 h-full flex items-center justify-center transition-colors ll-focus-ring"
                          aria-label={`Decrease ${item.name}`}
                        >
                          <Minus className="h-3 w-3" strokeWidth={2.5} />
                        </button>
                        
                        {/* Divider Line */}
                        <div className="w-px h-full bg-[#1a1a1a]/10"></div>
                        
                        <span className="text-[12px] font-bold text-[#1a1a1a] w-7 text-center">
                          {item.quantity}
                        </span>
                        
                        {/* Divider Line */}
                        <div className="w-px h-full bg-[#1a1a1a]/10"></div>
                        
                        <button 
                          onClick={() => updateQuantity(idx, item.quantity + 1)} 
                          className="px-2 text-[#7a0b10] hover:bg-[#1a1a1a]/5 h-full flex items-center justify-center transition-colors ll-focus-ring"
                          aria-label={`Increase ${item.name}`}
                        >
                          <Plus className="h-3 w-3" strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>

            {/* Special Instructions */}
            <div className="pt-3 mt-1">
              <button className="text-[13px] text-[#7a0b10] hover:underline font-extrabold text-left w-full flex items-center gap-1.5 ll-focus-ring">
                <Plus className="w-3.5 h-3.5" strokeWidth={3} /> Add Special Instructions
              </button>
            </div>

            {/* Calculations Table */}
            <div className="space-y-3 pt-4 border-t border-[#1a1a1a]/15 mt-4 text-[13px] font-bold text-[#1a1a1a]/80">
              <div className="flex justify-between">
                <span className="text-[#1a1a1a]/60 font-medium">Subtotal</span>
                <span className="text-[#1a1a1a]">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#1a1a1a]/60 font-medium">Delivery Fee</span>
                <span className="text-[#1a1a1a]">${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#1a1a1a]/60 font-medium">Taxes & Charges</span>
                <span className="text-[#1a1a1a]">${taxes.toFixed(2)}</span>
              </div>
              
              {/* Promo Discount Row */}
              {couponApplied ? (
                <div className="flex justify-between text-[#1a1a1a]/80">
                  <span className="text-[#1a1a1a]/60 font-medium">Discount (LASSI10)</span>
                  <span className="flex items-center gap-1.5 text-[#1a1a1a]">
                    <span>-${discount.toFixed(2)}</span>
                    <button 
                    onClick={() => setCouponApplied && setCouponApplied(false)} 
                      className="text-[#1a1a1a]/40 hover:text-red-600 text-[10px] font-normal ml-1 ll-focus-ring"
                    >
                      (Remove)
                    </button>
                  </span>
                </div>
              ) : (
                <div className="flex justify-between items-center text-[12px] pt-1">
                  <span className="text-[#1a1a1a]/50 font-medium font-sans">Have a coupon?</span>
                  <button 
                    onClick={() => setCouponApplied && setCouponApplied(true)}
                    className="text-[#7a0b10] font-bold hover:underline ll-focus-ring"
                  >
                    Apply LASSI10
                  </button>
                </div>
              )}
              
              {/* Total Amount Row */}
              <div className="border-t border-[#1a1a1a]/15 pt-4 mt-2">
                <div className="flex flex-col">
                  <span className="text-[12px] font-extrabold text-[#1a1a1a]/60 uppercase tracking-wide">Total Amount</span>
                  <span className="text-[26px] font-black text-[#1a1a1a] mt-1 leading-none font-sans">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* View Cart & Checkout Button */}
            <button
              onClick={() => router.push('/customer/checkout')}
              className="bg-[#5c060a] hover:bg-[#4a0508] text-[#ffffff] font-extrabold w-full rounded-lg py-3 mt-4 shadow-md text-[13px] tracking-wide uppercase flex items-center justify-center ll-interactive ll-focus-ring"
            >
              VIEW CART & CHECKOUT
            </button>

            {/* Secure Checkout Strip */}
            <div className="border-t border-[#1a1a1a]/15 pt-4 mt-4">
              <div className="flex items-start gap-3">
                <div className="text-[#7a0b10] mt-0.5">
                  <svg className="w-6 h-6 text-[#7a0b10]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <div>
                  <h5 className="text-[11px] font-extrabold text-[#1a1a1a]/80 uppercase tracking-wide font-sans">Secure Checkout</h5>
                  <p className="text-[11px] text-[#1a1a1a]/60 mt-0.5 font-sans">Your data is 100% safe with us.</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-[#9ca3af] space-y-3 bg-[#fdfcf9] rounded-xl border border-dashed border-gray-200 ll-pop">
            <ShoppingBag className="h-10 w-10 mx-auto stroke-[1.5] text-gray-300" />
            <p className="text-[13px] font-semibold text-gray-400 font-sans">Your cart is empty.</p>
            <p className="text-[11px] text-[#6b7280] px-6">Add a dish and your order summary will appear here instantly.</p>
          </div>
        )}
      </div>
    </div>
  );
}
