'use client';

import { Star, ShoppingCart, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext'; // Cart Context Import kiya

export default function YouMayAlsoLike({
  restaurantId,
  onQuickAdd,
  isSingleRestaurant,
  currentItemId,
  menuItems = []
}) {
  const router = useRouter();
  const { items, updateQuantity, removeItem } = useCart(); // Cart methods nikale

  const handleCardClick = (recId) => {
    const restId = isSingleRestaurant ? 'lassi-lounge' : restaurantId;
    router.push(`/customer/restaurant/${restId}/item/${recId}`);
  };

  const recommendations = menuItems
    .filter((item) => item._id !== currentItemId)
    .slice(0, 8); // Show up to 8 recommendations so the slider is useful

  if (recommendations.length === 0) {
    return null;
  }

  const primaryBg = isSingleRestaurant
    ? 'bg-[#7a0b10] hover:bg-[#5e080c]'
    : 'bg-[#6b52ff] hover:bg-[#4a3aff]';

  const getDishImage = (item) => {
    if (item.image) return item.image;
    const name = item.name.toLowerCase();
    if (name.includes('butter chicken')) return '/images/branded/lassi-lounge/dishes/butter-chicken.jpg';
    if (name.includes('rogan josh') || name.includes('lamb')) return '/images/branded/lassi-lounge/dishes/lamb-rogan-josh.jpg';
    if (name.includes('paneer tikka')) return '/images/branded/lassi-lounge/dishes/paneer-tikka.jpg';
    if (name.includes('biryani')) return '/images/branded/lassi-lounge/dishes/chicken-biryani.jpg';
    if (name.includes('dal makhani')) return '/images/branded/lassi-lounge/dishes/dal-makhani.jpg';
    if (name.includes('lassi')) return '/images/branded/lassi-lounge/dishes/mango-lassi.jpg';
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
  };

  const scrollContainerRef = useRef(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 select-none pt-4">
      {/* Header with Golden Accents */}
      <div className="flex items-center justify-center gap-3 py-2">
        <div className="flex items-center gap-1.5 opacity-80">
          <div className="h-[1.5px] bg-[#e8a020] w-8 md:w-16" />
          <div className="w-1.5 h-1.5 rotate-45 bg-[#e8a020]" />
        </div>
        <h2 className="text-[26px] md:text-[28px] font-serif font-bold text-[#1a1a1a] text-center tracking-wide px-2">
          You May Also Like
        </h2>
        <div className="flex items-center gap-1.5 opacity-80">
          <div className="w-1.5 h-1.5 rotate-45 bg-[#e8a020]" />
          <div className="h-[1.5px] bg-[#e8a020] w-8 md:w-16" />
        </div>
      </div>

      {/* Cards Grid / Slider */}
      <div className="relative flex items-center group/slider">
        {/* Left Scroll Button */}
        <button 
          onClick={scrollLeft}
          className="absolute -left-4 md:-left-5 z-10 w-10 h-10 rounded-full border border-[#e5e7eb] bg-[#ffffff] hover:bg-[#f9fafb] flex items-center justify-center text-[#4b5563] shadow-md opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Scrollable Container */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-4 md:gap-5 w-full pb-4 pt-2 px-1 snap-x snap-mandatory hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {recommendations.map((rec) => {
            const recId = rec._id || rec.id;
            const matchingItems = items.filter(i => {
              const iId = i.menuItemId || i._id || i.id;
              return (recId && iId && iId === recId) ||
                (i.name && rec.name && i.name.toLowerCase().trim() === rec.name.toLowerCase().trim());
            });

            const cartQty = matchingItems.reduce((sum, i) => sum + (i.quantity || i.qty || 1), 0);
            const lastMatchingIndex = matchingItems.length > 0 ? items.indexOf(matchingItems[matchingItems.length - 1]) : -1;

            const handleDecrement = (e) => {
              e.stopPropagation();
              if (lastMatchingIndex > -1) {
                const currentQty = items[lastMatchingIndex].quantity || items[lastMatchingIndex].qty || 1;
                if (currentQty > 1) {
                  updateQuantity(lastMatchingIndex, currentQty - 1);
                } else {
                  removeItem(lastMatchingIndex);
                }
              }
            };

            return (
              <div
                key={rec._id}
                onClick={() => handleCardClick(rec._id)}
                className="group cursor-pointer rounded-2xl border border-[#e5e7eb] bg-[#ffffff] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(122,11,16,0.12)] transition-all duration-300 flex flex-col flex-none w-[160px] md:w-[220px] lg:w-[240px] snap-start"
              >
                {/* Product Image */}
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#f3f4f6] relative">
                  <img
                    src={getDishImage(rec)}
                    alt={rec.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Card Body */}
                <div className="p-4 flex-grow flex flex-col justify-between">
                  <div className="mb-2">
                    <h4 className="font-bold text-[15px] text-[#1a1a1a] line-clamp-1 group-hover:underline">
                      {rec.name}
                    </h4>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="flex text-[#e8a020]">
                        {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                      </div>
                      <span className="text-[12px] font-medium text-[#6b7280]">4.6 (87)</span>
                    </div>
                  </div>

                  {/* Bottom line: Price & Cart/Quantity Controls */}
               <div className="flex items-center justify-between mt-1 w-full h-[34px]">
                    <span className="text-[16px] font-bold text-[#1a1a1a] leading-none">${rec.price.toFixed(2)}</span>
                    
                    {cartQty > 0 ? (
                      <div className="flex items-center border border-[#7a0b10]/20 rounded-lg h-[34px] bg-[#ffffff] shadow-sm shrink-0 w-[90px] overflow-hidden">
                        <button 
                          onClick={handleDecrement} 
                          className="w-8 text-[#7a0b10] hover:bg-[#7a0b10]/5 h-full flex items-center justify-center transition-colors font-bold"
                          aria-label={`Remove ${rec.name}`}
                        >
                          <Minus className="h-3 w-3" strokeWidth={3} />
                        </button>
                        <span className="flex-1 text-[13px] font-black text-[#7a0b10] text-center">
                          {cartQty}
                        </span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onQuickAdd(rec); }} 
                          className="w-8 text-[#7a0b10] hover:bg-[#7a0b10]/5 h-full flex items-center justify-center transition-colors font-bold"
                          aria-label={`Add one more ${rec.name}`}
                        >
                          <Plus className="h-3 w-3" strokeWidth={3} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickAdd(rec);
                        }}
                        /* Yahan w-[34px] h-[34px] lagaya hai taaki ye exact quantity box jitna bada rahe */
                        className="flex items-center justify-center w-[34px] h-[34px] text-[#7a0b10] hover:text-[#5e080c] hover:bg-[#f9fafb] rounded-full transition-colors shrink-0"
                        aria-label="Add to cart"
                      >
                        <ShoppingCart className="w-[18px] h-[18px]" strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Scroll Button */}
        <button 
          onClick={scrollRight}
          className="absolute -right-4 md:-right-5 z-10 w-10 h-10 rounded-full border border-[#e5e7eb] bg-[#ffffff] hover:bg-[#f9fafb] flex items-center justify-center text-[#4b5563] shadow-md opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}