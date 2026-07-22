import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Heart, Minus, Plus, Flame, Leaf, SearchX, LayoutGrid, List, ChevronDown } from 'lucide-react';

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

export default function DishGrid({
  filteredItems,
  currentCategory,
  isAuthenticated,
  user,
  items = [],
  handleCartAdd,
  handleCartDecrement,
  toggleFavorite,
  searchQuery = ''
}) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('popular');

  const visibleItems = useMemo(() => {
    const items = [...filteredItems];
    if (sortBy === 'price-low') return items.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sortBy === 'price-high') return items.sort((a, b) => (b.price || 0) - (a.price || 0));
    return items.sort((a, b) => Number(b.isBestseller || false) - Number(a.isBestseller || false));
  }, [filteredItems, sortBy]);

  return (
    <div className="space-y-6 ll-reveal">
      
      {/* ─── 1. HEADER CONTROLS ─── */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between bg-transparent pb-4 border-b border-[#e5e7eb]/80">
        
        {/* Left Side: Title & Item Count */}
        <div className="flex flex-col flex-1 min-w-0 w-full pr-4">
          <div className="flex items-center gap-2 min-w-0 w-full">
             <div className="shrink-0 text-[#e8a020] mt-1.5 flex items-center justify-center">
               <svg width="22" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
             </div>
             <h2 className="text-[28px] md:text-[32px] font-serif font-black text-[#1a1a1a] leading-none truncate w-full">
               {searchQuery.trim() 
                 ? `Search Results for "${searchQuery.length > 25 ? searchQuery.substring(0, 25) + '...' : searchQuery}"` 
                 : (currentCategory?.name || 'Appetizers')}
             </h2>
          </div>
          <div className="flex items-center gap-2 ml-1.5 mt-1.5">
             <div className="text-[#e8a020] flex items-center">
               <svg width="20" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="12" x2="15" y2="12"/><circle cx="20" cy="12" r="2" fill="currentColor"/></svg>
             </div>
             <span className="text-[12px] text-[#6b7280] font-medium leading-none">
               {visibleItems.length} Items
             </span>
          </div>
        </div>

        {/* Right Side: Sort & View Toggles (FIXED UI) */}
       <div className="flex items-center gap-4 shrink-0">
            
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[13px] font-medium text-[#1a1a1a] whitespace-nowrap">Sort By:</span>
              
            
              <div className="relative w-[130px] h-[36px]">
                
              
                <select 
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="w-full h-full bg-[#ffffff] border border-[#e5e7eb] rounded-md pl-3 pr-8 text-[13px] font-medium text-[#1a1a1a] focus:outline-none focus:border-[#7a0b10] shadow-sm cursor-pointer appearance-none outline-none ll-focus-ring"
                  style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                >
                  <option value="popular">Popular</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
                
              
                <div className="absolute right-1 top-1 bottom-1 w-7 bg-[#ffffff] flex items-center justify-center pointer-events-none rounded-r-md">
                  <ChevronDown className="w-4 h-4 text-[#1a1a1a] text-[#7a0b10]" strokeWidth={2} />
                </div>
                
              </div>
            </div>
          
          {/* Functional Grid/List View Toggles - PERFECT SIZING */}
          <div className="flex gap-2 ml-1">
            <button 
              onClick={() => setViewMode('grid')}
              className={`w-[36px] h-[36px] flex items-center justify-center rounded-md border shadow-sm ll-interactive ll-focus-ring
                ${viewMode === 'grid' ? 'bg-[#7a0b10] text-[#ffffff] border-[#7a0b10]' : 'bg-[#ffffff] text-[#7a0b10] border-[#e5e7eb] hover:bg-gray-50'}`}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-[18px] h-[18px]" strokeWidth={2.5} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`w-[36px] h-[36px] flex items-center justify-center rounded-md border shadow-sm ll-interactive ll-focus-ring
                ${viewMode === 'list' ? 'bg-[#7a0b10] text-[#ffffff] border-[#7a0b10]' : 'bg-[#ffffff] text-[#7a0b10] border-[#e5e7eb] hover:bg-gray-50'}`}
              aria-label="List view"
            >
              <List className="w-[20px] h-[20px]" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

   {/* ─── 2. ITEMS GRID / LIST ─── */}
      <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 ll-stagger" : "flex flex-col gap-4 ll-stagger"}>
        {visibleItems.map(item => {
          const isFavorite = user?.favoriteItems?.some(f => (f._id || f) === item._id);
          const isAvailable = item.isAvailable !== false;
          
          const targetId = item.menuItemId || item._id || item.id;
          const cartQty = items
            .filter(i => {
              const iId = i.menuItemId || i._id || i.id;
              const sameId = targetId && iId && iId === targetId;
              const sameName = i.name && item.name && i.name.toLowerCase().trim() === item.name.toLowerCase().trim();
              return sameId || sameName;
            })
            .reduce((sum, i) => sum + (i.quantity || i.qty || 0), 0);

          const hasCustomizations =
            (item.sizeVariations && item.sizeVariations.length > 0) ||
            (item.addOns && item.addOns.length > 0);

          return (
            <div 
              key={item._id}
              onClick={() => {
                router.push(`/customer/restaurant/${item.restaurantId}/item/${item._id}`);
              }}
              className={`bg-[#fcfaf5] rounded-xl border border-[#f3f4f6] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_14px_34px_rgba(122,11,16,0.12)] flex overflow-hidden relative group ll-interactive cursor-pointer ${!isAvailable ? 'opacity-50 pointer-events-none' : ''} ${viewMode === 'grid' ? 'flex-col' : 'flex-col sm:flex-row sm:min-h-[210px] h-auto'}`}
            >
              {/* Image header */}
              <div className={`relative bg-[#f3f4f6] overflow-hidden shrink-0 ${viewMode === 'grid' ? 'h-[200px] w-full' : 'h-[180px] sm:h-auto w-full sm:w-[240px]'}`}>
                <img 
                  src={getDishImage(item.name)} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Heart Button */}
                {isAuthenticated && isAvailable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item._id);
                    }}
                    className="absolute top-3 right-3 p-1.5 bg-[#000000]/40 backdrop-blur-sm rounded-full border border-[#ffffff]/80 hover:bg-[#000000]/60 shadow-sm ll-interactive ll-focus-ring"
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart className={`h-4 w-4 ${isFavorite ? 'fill-[#cd131b] text-[#cd131b] border-none' : 'text-[#ffffff]'}`} strokeWidth={isFavorite ? 0 : 2} />
                  </button>
                )}
              </div>

              {/* Card Content */}
              <div className={`p-4 flex-grow flex flex-col justify-between ${viewMode === 'list' ? 'sm:py-5 sm:px-6' : ''}`}>
                <div>
                  <h3 className="text-[17px] font-bold text-[#1a1a1a] tracking-tight line-clamp-1 font-serif">
                    {item.name}
                  </h3>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex text-[#e8a020]">
                       {[...Array(4)].map((_, i) => (
                         <Star key={i} className="h-[13px] w-[13px] fill-current" />
                       ))}
                       <Star className="h-[13px] w-[13px] fill-[#e5e7eb] text-[#e5e7eb]" />
                    </div>
                    <span className="text-[11px] font-bold text-[#6b7280]">4.4 (96)</span>
                  </div>

                  <p className="text-[12px] text-[#4b5563] leading-relaxed line-clamp-2 mt-2.5">
                    {item.description || 'Crispy rolls stuffed with fresh vegetables & served hot.'}
                  </p>
                  
                  {/* Veg & Spice Indicators */}
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-[11px] font-bold text-[#4b5563] flex items-center gap-2">
                      <span className={`h-3.5 w-3.5 rounded-full flex items-center justify-center ${item.isVeg ? 'bg-[#16a34a]' : 'bg-[#cd131b]'}`}>
                        <Leaf className="h-3 w-3 text-[#ffffff]" strokeWidth={3} />
                      </span>
                      {item.isVeg ? 'Veg' : 'Non Veg'}
                    </span>
                    <span className="text-[11px] font-bold text-[#4b5563] flex items-center gap-1">
                      {item.isSpicy ? <Flame className="h-3.5 w-3.5 text-[#e8a020]" strokeWidth={2.5} /> : <Leaf className="h-3.5 w-3.5 text-[#16a34a]" strokeWidth={2.5} />}
                      {item.isSpicy ? 'Medium' : 'Mild'}
                    </span>
                  </div>
                </div>

                {/* Bottom Section: Price & Actions */}
                <div className="mt-5 flex items-center justify-between w-full pt-1">
                   <div className="text-[18px] font-black text-[#1a1a1a] leading-none">
                     ${item.price?.toFixed(2) || '9.99'}
                   </div>
                   
                   <div className="flex flex-col items-center select-none">
                      {cartQty > 0 ? (
                        <div className="flex items-center border border-[#7a0b10]/20 rounded-lg h-[38px] bg-[#ffffff] shadow-sm shrink-0 w-[110px] overflow-hidden">
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleCartDecrement(item); }} 
                             className="w-10 text-[#7a0b10] hover:bg-[#7a0b10]/5 h-full flex items-center justify-center transition-colors font-bold ll-focus-ring"
                             aria-label={`Remove ${item.name}`}
                           >
                             <Minus className="h-[13px] w-[13px]" strokeWidth={3} />
                           </button>
                           <span className="flex-1 text-[13px] font-black text-[#7a0b10] text-center">
                             {cartQty}
                           </span>
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleCartAdd(item); }} 
                             className="w-10 text-[#7a0b10] hover:bg-[#7a0b10]/5 h-full flex items-center justify-center transition-colors font-bold ll-focus-ring"
                             aria-label={`Add one more ${item.name}`}
                           >
                             <Plus className="h-[13px] w-[13px]" strokeWidth={3} />
                           </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCartAdd(item); }}
                          className="bg-[#7a0b10] hover:bg-[#5e080c] text-[#ffffff] text-[12px] font-black h-[38px] px-6 rounded-lg shadow-sm flex items-center justify-center gap-1.5 uppercase tracking-wider min-w-[110px] transition-colors ll-interactive ll-focus-ring"
                        >
                          ADD <Plus className="h-[14px] w-[14px]" strokeWidth={3} />
                        </button>
                      )}
                      {hasCustomizations && (
                        <span className="text-[9px] text-[#6b7280] font-medium tracking-wide uppercase mt-1.5 block">
                          Customisable
                        </span>
                      )}
                   </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── 3. PAGINATION ─── */}
      {visibleItems.length > 0 && (
        <div className="flex justify-center items-center mt-10 py-4 text-[12px] font-bold uppercase tracking-wider text-[#6b7280]">
          Showing {visibleItems.length} dishes from {currentCategory?.name || 'this category'}
        </div>
      )}

      {visibleItems.length === 0 && (
        <div className="text-center py-20 bg-[#ffffff] border border-[#e5e7eb] rounded-xl shadow-sm ll-pop">
          <SearchX className="h-10 w-10 mx-auto text-[#e8a020] mb-4" strokeWidth={1.6} />
          <p className="text-[#1a1a1a] text-[15px] font-black">No dishes found</p>
          <p className="text-[#6b7280] text-sm font-medium mt-1">Try another category or a shorter search.</p>
        </div>
      )}
    </div>
  );
}
