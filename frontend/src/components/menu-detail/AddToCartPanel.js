'use client';

'use client';

import { ShoppingCart, Heart, Clock, Truck, ShieldAlert, Plus, Minus } from 'lucide-react';

export default function AddToCartPanel({
  price = 0,
  cartQty = 0, // quantity ki jagah direct global cartQty pass karenge
  onIncrement,
  onDecrement,
  onAddToCart,
  isFavorite,
  onToggleFavorite,
  isSingleRestaurant
}) {
  const buttonBg = isSingleRestaurant
    ? 'bg-[#7a0b10] hover:bg-[#5e080c] text-[#ffffff]'
    : 'bg-[#6b52ff] hover:bg-[#4a3aff] text-[#ffffff]';
  const favoriteBtnBorder = 'border-[#e5e7eb] text-[#1a1a1a] hover:bg-[#f9fafb]';

  const isInCart = cartQty > 0;
  // Agar cart me nahi hai to initial price calculation ke liye qty 1 manenge
  const displayQty = isInCart ? cartQty : 1; 
  const numericPrice = typeof price === 'number' && !isNaN(price) ? price : 0;
  const totalPrice = (numericPrice * displayQty).toFixed(2);

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-[#ffffff] p-6 shadow-sm space-y-6 select-none">
      
      {/* Price Section */}
      <div>
        <span className="text-[12px] font-bold text-[#6b7280] uppercase tracking-wider block mb-1">
          {isInCart ? 'Total in Cart' : 'Item Total'}
        </span>
        <div className="text-[32px] font-black text-[#7a0b10] leading-none">
          ${totalPrice}
        </div>
      </div>

      {/* Dynamic Cart Controls */}
      <div className="space-y-3 pt-1">
        {isInCart ? (
          // Jab item cart me ho, to badha Quantity Selector dikhayenge
          <div className="flex items-center border-2 border-[#7a0b10] rounded-xl h-[46px] bg-[#7a0b10]/5 overflow-hidden w-full shadow-sm">
            <button
              type="button"
              onClick={onDecrement}
              className="w-14 h-full flex items-center justify-center font-black text-lg text-[#7a0b10] hover:bg-[#7a0b10]/20 transition-colors border-r border-[#7a0b10]/20"
            >
              <Minus className="w-5 h-5" strokeWidth={3} />
            </button>
            <span className="flex-1 text-center font-extrabold text-[#7a0b10] text-[18px]">
              {cartQty}
            </span>
            <button
              type="button"
              onClick={onIncrement}
              className="w-14 h-full flex items-center justify-center font-black text-lg text-[#7a0b10] hover:bg-[#7a0b10]/20 transition-colors border-l border-[#7a0b10]/20"
            >
              <Plus className="w-5 h-5" strokeWidth={3} />
            </button>
          </div>
        ) : (
          // Jab cart me na ho, to Add to Cart button dikhayenge
          <button
            type="button"
            onClick={onAddToCart}
            className={`w-full h-[46px] rounded-lg flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-[13px] shadow-sm transition-colors duration-200 ${buttonBg}`}
          >
            <ShoppingCart className="w-4 h-4" /> Add to Cart
          </button>
        )}

        {/* Favorite Button */}
        <button
          type="button"
          onClick={onToggleFavorite}
          className={`w-full h-[46px] rounded-lg border flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-[13px] transition-colors duration-200 bg-[#ffffff] ${favoriteBtnBorder}`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-[#ef4444] text-[#ef4444]' : ''}`} /> {isFavorite ? 'Added' : 'Add to Favorites'}
        </button>
      </div>

      {/* Badges block below */}
      <div className="space-y-5 pt-6 border-t border-[#e5e7eb]">
        <div className="flex gap-1">
          <Clock className="w-5 h-5 text-[#e8a020] shrink-0 mt-0.5" strokeWidth={2} />
          <div>
            <h4 className="font-bold text-[14px] text-[#1a1a1a] leading-tight">Delivery Time</h4>
            <p className="text-[13px] font-medium text-[#6b7280] mt-0.5">30-40 mins</p>
          </div>
        </div>

        <div className="flex gap-1">
          <Truck className="w-5 h-5 text-[#e8a020] shrink-0 mt-0.5" strokeWidth={2} />
          <div>
            <h4 className="font-bold text-[14px] text-[#1a1a1a] leading-tight">Free Delivery</h4>
            <p className="text-[13px] font-medium text-[#6b7280] mt-0.5">On orders over $20</p>
          </div>
        </div>

        <div className="flex gap-1">
          <ShieldAlert className="w-5 h-5 text-[#e8a020] shrink-0 mt-0.5" strokeWidth={2} />
          <div>
            <h4 className="font-bold text-[14px] text-[#1a1a1a] leading-tight">Easy Returns</h4>
            <p className="text-[13px] font-medium text-[#6b7280] mt-0.5">Not satisfied? We'll refund.</p>
          </div>
        </div>
      </div>
      
    </div>
  );
}