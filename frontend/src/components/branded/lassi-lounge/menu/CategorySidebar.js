import React from 'react';
import { Gift, Utensils, Coffee, Pizza, Salad, Flame, CakeSlice } from 'lucide-react';

// यह फंक्शन कैटेगरी के नाम के हिसाब से सही आइकॉन रिटर्न करेगा
const getCategoryIcon = (categoryName) => {
  const name = categoryName.toLowerCase();
  if (name.includes('appetizer')) return Utensils;
  if (name.includes('chaat') || name.includes('salad')) return Salad;
  if (name.includes('tandoori') || name.includes('spicy')) return Flame;
  if (name.includes('bread') || name.includes('naan')) return Pizza;
  if (name.includes('dessert') || name.includes('sweet')) return CakeSlice;
  if (name.includes('beverage') || name.includes('drink')) return Coffee;
  return Utensils; // Default icon
};

export default function CategorySidebar({ 
  categories, 
  activeCategory, 
  setActiveCategory, 
  setSearchQuery,
  couponApplied,
  setCouponApplied,
  searchQuery = ''
}) {
  return (
    <div className="space-y-6 ll-reveal">
      
      {/* ─── 1. CATEGORIES LIST ─── */}
      <div className="bg-[#ffffff] rounded-lg border border-[#e5e7eb] shadow-sm overflow-hidden">
        <div className="bg-[#7a0b10] text-[#ffffff] px-5 py-3 font-bold uppercase tracking-wider text-[11px]">
          CATEGORIES
        </div>
        <nav className="flex flex-col">
          {categories.map((cat) => {
            const isActive = !searchQuery.trim() && activeCategory === cat._id;
            const Icon = getCategoryIcon(cat.name);
            
            return (
              <button
                key={cat._id}
                onClick={() => {
                  setActiveCategory(cat._id);
                  setSearchQuery('');
                }}
                className={`w-full flex items-center justify-between px-5 py-3 text-[13px] font-bold border-b border-[#f3f4f6] last:border-0 ll-interactive ll-focus-ring
                  ${isActive
                    ? 'bg-[#e8a020] text-[#1a1a1a]'
                    : 'bg-[#ffffff] text-[#1a1a1a] hover:bg-[#f9fafb] hover:text-[#cd131b]'
                  }`}
              >
                <div className="flex items-center gap-3">
                  {/* आइकॉन का कलर एक्टिव स्टेट के हिसाब से बदलेगा */}
                  <Icon className={`w-4 h-4 stroke-[2px] ${isActive ? 'text-[#1a1a1a]' : 'text-[#7a0b10]'}`} />
                  <span>{cat.name}</span>
                </div>
                
                {/* काउंट बैज */}
                <span className={`text-[10px] rounded-full px-2 py-0.5 font-bold ${isActive ? 'bg-black/15 text-[#1a1a1a]' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>
                  {cat.items?.length || 0}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ─── 2. PROMO OFFER CARD ─── */}
      <div className="relative rounded-xl p-6 text-center text-[#ffffff] overflow-hidden shadow-lg border border-[#222222] mt-6">
        
        {/* बैकग्राउंड इमेज और डार्क ओवरले (मसालों वाले बैकग्राउंड के लिए) */}
        <div 
          className="absolute inset-0 opacity-30 bg-cover bg-center mix-blend-luminosity"
          style={{ backgroundImage: "url('/images/branded/lassi-lounge/menu-hero.jpg')" }} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/90 via-[#0a0a0a]/95 to-[#000000] -z-10" />

        <div className="relative z-10">
          {/* Top Gift Icon with Sparkles */}
          <div className="flex justify-center items-center mb-2 text-[#e8a020]">
            <span className="opacity-50 font-light mr-3 text-lg">✨</span>
            <Gift className="h-8 w-8 stroke-[1.5]" />
            <span className="opacity-50 font-light ml-3 text-lg">✨</span>
          </div>
          
          <h4 className="text-[16px] font-serif font-black tracking-wide text-[#ffffff] mb-1">
            GET 10% OFF
          </h4>
          <p className="text-[9px] text-[#a1a1aa] uppercase tracking-widest font-bold mb-5">
            ON YOUR FIRST ORDER!
          </p>
          
          <div className="mb-5">
            <span className="block text-[#a1a1aa] text-[10px] mb-1.5">Use Code:</span>
            <div className="border border-dashed border-[#e8a020] rounded-md py-1.5 px-6 inline-block text-[13px] font-bold tracking-widest text-[#e8a020]">
              LASSI10
            </div>
          </div>
          
          <button 
            onClick={() => setCouponApplied(true)} 
            className="bg-[#e8a020] hover:bg-[#d68f13] text-[#1a1a1a] text-[11px] uppercase tracking-wide font-black w-full rounded-md py-2.5 shadow-[0_4px_15px_rgba(232,160,32,0.2)] ll-interactive ll-focus-ring"
          >
            {couponApplied ? 'APPLIED!' : 'ORDER NOW'}
          </button>
        </div>
        
      </div>
      
    </div>
  );
}
