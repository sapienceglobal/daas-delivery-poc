import React, { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Utensils, Coffee, Pizza, Salad, Flame, CakeSlice } from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/ui';

// get category icon
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
  searchQuery = '',
  isViewOnly = false
}) {
  const router = useRouter();
  const navRef = useRef(null);
  const [activeCoupon, setActiveCoupon] = useState(null);

  useEffect(() => {
    const fetchCoupon = async () => {
      try {
        const BRANDED_ID = process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID || 'lassi-lounge';
        const res = await api.get(`/api/cms?restaurantId=${BRANDED_ID}`);
        if (res.data?.promotions?.menuPage) {
          setActiveCoupon(res.data.promotions.menuPage);
        }
      } catch (err) {
        console.error('Failed to fetch CMS promotions:', err);
      }
    };
    fetchCoupon();
  }, []);

  useEffect(() => {
    if (navRef.current && activeCategory && !searchQuery.trim()) {
      const activeBtn = navRef.current.querySelector(`[data-category-id="${activeCategory}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeCategory, searchQuery]);

  return (
    <div className="space-y-6 ll-reveal">

      {/* ─── 1. CATEGORIES LIST ─── */}
      <div className="bg-[#ffffff] rounded-lg lg:border lg:border-[#e5e7eb] lg:shadow-sm overflow-hidden">
        <div className="hidden lg:block bg-[#7a0b10] text-[#ffffff] px-5 py-3 font-bold uppercase tracking-wider text-[11px]">
          CATEGORIES
        </div>
        <nav ref={navRef} className="flex flex-row overflow-x-auto no-scrollbar lg:flex-col snap-x snap-mandatory px-4 lg:px-0 gap-2 lg:gap-0 pb-2 lg:pb-0">
          <button
            key="all"
            data-category-id="all"
            onClick={(e) => {
              e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
              setActiveCategory('all');
              setSearchQuery('');
            }}
            className={`shrink-0 snap-start flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-3 text-[13px] font-bold border lg:border-0 lg:border-b border-[#e5e7eb] lg:border-[#f3f4f6] rounded-full lg:rounded-none lg:w-full lg:justify-between last:border-0 ll-interactive ll-focus-ring whitespace-nowrap
              ${(!searchQuery.trim() && activeCategory === 'all')
                ? 'bg-[#e8a020] text-[#1a1a1a] border-[#e8a020]'
                : 'bg-[#ffffff] text-[#1a1a1a] hover:bg-[#f9fafb] hover:text-[#cd131b]'
              }`}
          >
            <div className="flex items-center gap-2 lg:gap-3">
              <Utensils className={`w-4 h-4 stroke-[2px] ${(!searchQuery.trim() && activeCategory === 'all') ? 'text-[#1a1a1a]' : 'text-[#7a0b10]'}`} />
              <span>All Items</span>
            </div>
          </button>
          {categories.map((cat) => {
            const isActive = !searchQuery.trim() && activeCategory === cat._id;
            const Icon = getCategoryIcon(cat.name);

            return (
              <button
                key={cat._id}
                data-category-id={cat._id}
                onClick={(e) => {
                  e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                  setActiveCategory(cat._id);
                  setSearchQuery('');
                }}
                className={`shrink-0 snap-start flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-3 text-[13px] font-bold border lg:border-0 lg:border-b border-[#e5e7eb] lg:border-[#f3f4f6] rounded-full lg:rounded-none lg:w-full lg:justify-between last:border-0 ll-interactive ll-focus-ring whitespace-nowrap
                  ${isActive
                    ? 'bg-[#e8a020] text-[#1a1a1a] border-[#e8a020]'
                    : 'bg-[#ffffff] text-[#1a1a1a] hover:bg-[#f9fafb] hover:text-[#cd131b]'
                  }`}
              >
                <div className="flex items-center gap-2 lg:gap-3">
                  {/* icon color based on active state */}
                  <Icon className={`w-4 h-4 stroke-[2px] ${isActive ? 'text-[#1a1a1a]' : 'text-[#7a0b10]'}`} />
                  <span>{cat.name}</span>
                </div>

                {/* count badge */}
                <span className={`hidden lg:inline-block text-[10px] rounded-full px-2 py-0.5 font-bold ${isActive ? 'bg-black/15 text-[#1a1a1a]' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>
                  {cat.items?.length || 0}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ─── 2. PROMO OFFER CARD (Desktop Only) ─── */}
      {activeCoupon && (
        <div className="hidden lg:block relative rounded-xl p-6 text-center text-[#ffffff] overflow-hidden shadow-lg border border-[#222222] mt-6">

          {/* background image and dark overlay */}
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
              GET {activeCoupon.type === 'percentage' ? `${activeCoupon.value}%` : `$${activeCoupon.value}`} OFF
            </h4>
            <p className="text-[9px] text-[#a1a1aa] uppercase tracking-widest font-bold mb-5">
              {activeCoupon.description || 'ON YOUR NEXT ORDER!'}
            </p>

            <div className="mb-5">
              <span className="block text-[#a1a1aa] text-[10px] mb-1.5">Use Code:</span>
              <div className="border border-dashed border-[#e8a020] rounded-md py-1.5 px-6 inline-block text-[13px] font-bold tracking-widest text-[#e8a020]">
                {activeCoupon.code}
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.setItem('pendingCouponCode', activeCoupon.code);
                if (isViewOnly) {
                  router.push('/menu');
                } else {
                  setCouponApplied(true);
                  showToast('Coupon applied! Checkout to see discount.', 'success');
                }
              }}
              className="bg-[#e8a020] hover:bg-[#d68f13] text-[#1a1a1a] text-[11px] uppercase tracking-wide font-black w-full rounded-md py-2.5 shadow-[0_4px_15px_rgba(232,160,32,0.2)] ll-interactive ll-focus-ring"
            >
              {isViewOnly ? 'ORDER NOW' : (couponApplied ? 'APPLIED!' : 'APPLY')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
