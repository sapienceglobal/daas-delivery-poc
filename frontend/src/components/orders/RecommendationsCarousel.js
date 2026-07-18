'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Star } from 'lucide-react';
import { menuAPI } from '@/lib/api';
import { useAddToCart } from '@/context/useAddToCart';
import { showToast } from '@/components/ui';

export default function RecommendationsCarousel({ restaurantId, orderedItemIds = [] }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const handleAddToCart = useAddToCart();

  useEffect(() => {
    if (!restaurantId) return;
    loadRecommendations();
  }, [restaurantId]);

  const loadRecommendations = async () => {
    try {
      const data = await menuAPI.getByRestaurant(restaurantId);
      const allItems = data.data || [];
      
      // Filter out items that are already in the order
      const filtered = allItems.filter(
        (item) => !orderedItemIds.includes(item._id) && item.isAvailable
      );
      
      // Limit to 8 items for recommendation carousel
      setItems(filtered.slice(0, 8));
    } catch (err) {
      console.error('Failed to load recommended items:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate deterministic rating & review count from ObjectId hash
  const getDeterministicRating = (id) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const score = 4.4 + (Math.abs(hash) % 6) / 10;
    const count = 35 + (Math.abs(hash) % 165);
    return { rating: score.toFixed(1), reviews: count };
  };

  const handleAdd = (item) => {
    handleAddToCart(item);
    showToast(`${item.name} added to cart!`, 'success');
  };

  if (loading || items.length === 0) return null;

  return (
    <div className="pt-8 border-t border-[#e5e7eb] select-none">
      
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[22px] font-bold font-serif text-[#1a1a1a]">
          You May Also Like
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              const el = document.getElementById('rec-scroller');
              if (el) el.scrollBy({ left: -280, behavior: 'smooth' });
            }}
            className="w-8 h-8 rounded-full border border-[#e5e7eb] flex items-center justify-center text-[#4b5563] hover:bg-[#f9fafb]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => {
              const el = document.getElementById('rec-scroller');
              if (el) el.scrollBy({ left: 280, behavior: 'smooth' });
            }}
            className="w-8 h-8 rounded-full border border-[#e5e7eb] flex items-center justify-center text-[#4b5563] hover:bg-[#f9fafb]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid horizontal scrollbar container */}
      <div 
        id="rec-scroller"
        className="flex gap-6 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory"
      >
        {items.map((item) => {
          const { rating, reviews } = getDeterministicRating(item._id);
          const isVeg = item.isVeg || false;

          return (
            <div 
              key={item._id}
              className="w-[260px] shrink-0 bg-[#ffffff] border border-[#e5e7eb] rounded-2xl p-3 shadow-sm hover:shadow-md transition-all duration-300 snap-start flex flex-col justify-between group"
            >
              <div>
                {/* Product Thumbnail */}
                <div className="relative w-full h-36 rounded-xl overflow-hidden mb-3 bg-[#f9fafb]">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Bestseller Badge */}
                  {item.isBestseller && (
                    <span className="absolute top-2.5 left-2.5 bg-[#7a0b10] text-[#ffffff] text-[9px] font-extrabold px-2 py-0.5 rounded-lg uppercase tracking-wide">
                      Bestseller
                    </span>
                  )}
                </div>

                {/* Rating & Veg indicator */}
                <div className="flex items-center gap-2 mb-1.5">
                  {/* Veg/Non-Veg dot */}
                  <span 
                    className={`inline-flex items-center justify-center w-3.5 h-3.5 border shrink-0 p-0.5 rounded-sm ${
                      isVeg ? 'border-[#1fae64]' : 'border-[#ef4444]'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-[#1fae64]' : 'bg-[#ef4444]'}`}></span>
                  </span>

                  {/* Stars Rating */}
                  <div className="flex items-center text-[#e8a020]">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-[12px] font-bold ml-1 text-[#1a1a1a]">{rating}</span>
                    <span className="text-[11px] text-[#6b7280] ml-0.5">({reviews})</span>
                  </div>
                </div>

                {/* Product details */}
                <h4 className="font-bold text-[14px] text-[#1a1a1a] leading-tight truncate mb-1">
                  {item.name}
                </h4>
                <p className="text-[11px] text-[#6b7280] line-clamp-2 leading-relaxed mb-3">
                  {item.description || 'Delicately prepared with handpicked ingredients.'}
                </p>
              </div>

              {/* Price & Add to Cart button */}
              <div className="flex justify-between items-center mt-auto">
                <span className="font-bold text-[15px] text-[#7a0b10]">
                  ${item.price.toFixed(2)}
                </span>
                <button
                  onClick={() => handleAdd(item)}
                  className="w-8 h-8 rounded-full bg-[#7a0b10] text-[#ffffff] hover:bg-[#5e080c] transition-colors flex items-center justify-center shadow-sm"
                  aria-label={`Add ${item.name} to cart`}
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
