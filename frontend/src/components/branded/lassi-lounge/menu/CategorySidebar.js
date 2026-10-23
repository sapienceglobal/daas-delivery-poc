'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, UtensilsCrossed, LayoutGrid, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/ui';
import PopOutCapsuleImage from '@/components/common/PopOutCapsuleImage';
import AllCategoriesModal from '@/components/common/AllCategoriesModal';
import { getCategory3DImage } from '@/lib/category3DHelper';

export default function CategorySidebar({
  categories = [],
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
  const [isAllModalOpen, setIsAllModalOpen] = useState(false);

  useEffect(() => {
    const fetchCoupon = async () => {
      try {
        const BRANDED_ID = process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID || 'lassi-lounge';
        const res = await api.get(`/api/cms?restaurantId=${BRANDED_ID}`);
        if (res.data?.promotions?.menuPage) {
          setActiveCoupon(res.data.promotions.menuPage);
        } else {
          setActiveCoupon(null);
        }
      } catch (err) {
        console.error('Failed to fetch CMS promotions:', err);
        setActiveCoupon(null);
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

  const isExpired = activeCoupon && (
    activeCoupon.isActive === false || 
    (activeCoupon.endDate && new Date(activeCoupon.endDate).getTime() < Date.now())
  );

  const totalAllItemsCount = categories.reduce((acc, c) => acc + (c.items?.length || 0), 0);

  return (
    <div className="space-y-4 lg:space-y-6 ll-reveal">

      {/* ─── 1. MOBILE / TABLET 3D CATEGORIES STRIP (Visible below lg) ─── */}
      <div className="lg:hidden bg-[#fcfaf5] rounded-2xl py-3 px-2 border border-[#ebdcc1]/80 shadow-xs">
        <div className="flex items-center justify-between px-3 pb-2.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#7a0b10] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#e8a020]" />
            <span>Categories</span>
          </span>
          <button
            type="button"
            onClick={() => setIsAllModalOpen(true)}
            className="flex items-center gap-1 text-[11px] font-bold text-[#7a0b10] hover:text-[#58080c] px-3 py-1 rounded-full bg-[#ebdcc1]/40 hover:bg-[#ebdcc1] transition-all cursor-pointer shadow-2xs"
          >
            <LayoutGrid className="w-3 h-3" />
            <span>View All ({categories.length})</span>
          </button>
        </div>

        <nav
          ref={navRef}
          className="flex flex-row overflow-x-auto no-scrollbar gap-2 sm:gap-3 px-2 pb-1 pt-1 snap-x snap-mandatory"
        >
          {/* All Items Capsule */}
          <div className="shrink-0 snap-start">
            <PopOutCapsuleImage
              label="All Items"
              imageUrl={getCategory3DImage('all')}
              width={66}
              isSelected={!searchQuery.trim() && activeCategory === 'all'}
              itemCount={totalAllItemsCount}
              onClick={() => {
                setActiveCategory('all');
                if (setSearchQuery) setSearchQuery('');
              }}
            />
          </div>

          {/* Dynamic 3D Categories */}
          {categories.map((cat) => {
            const isActive = !searchQuery.trim() && activeCategory === cat._id;
            return (
              <div
                key={cat._id}
                data-category-id={cat._id}
                className="shrink-0 snap-start"
              >
                <PopOutCapsuleImage
                  category={cat}
                  width={66}
                  isSelected={isActive}
                  itemCount={cat.items?.length}
                  onClick={() => {
                    setActiveCategory(cat._id);
                    if (setSearchQuery) setSearchQuery('');
                  }}
                />
              </div>
            );
          })}
        </nav>
      </div>

      {/* ─── 2. DESKTOP 3D CATEGORIES SIDEBAR (Visible on lg and above) ─── */}
      <div className="hidden lg:block bg-white rounded-2xl border border-[#ebdcc1] shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7a0b10] to-[#8d1117] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-[#e8a020]" />
            <span className="font-black uppercase tracking-wider text-[11px] font-sans">
              CATEGORIES
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsAllModalOpen(true)}
            className="flex items-center gap-1.5 text-[11px] font-bold bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
            title="View Grid"
          >
            <LayoutGrid className="w-3 h-3" />
            <span>Grid</span>
          </button>
        </div>

        {/* Categories List */}
        <nav className="flex flex-col max-h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar">
          {/* All Items Row */}
          <button
            key="all"
            data-category-id="all"
            onClick={() => {
              setActiveCategory('all');
              if (setSearchQuery) setSearchQuery('');
            }}
            className={`group flex items-center justify-between px-3.5 py-2.5 text-[13px] font-bold border-b border-[#f3f4f6] transition-all ll-interactive ll-focus-ring cursor-pointer ${
              !searchQuery.trim() && activeCategory === 'all'
                ? 'bg-gradient-to-r from-[#7a0b10] to-[#961218] text-white shadow-sm'
                : 'bg-white text-[#1a1a1a] hover:bg-[#fcfaf5] hover:text-[#7a0b10]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`relative w-8 h-9 rounded-full shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 ${
                  !searchQuery.trim() && activeCategory === 'all' ? 'shadow-inner' : 'shadow-2xs'
                }`}
                style={{
                  background:
                    !searchQuery.trim() && activeCategory === 'all'
                      ? 'radial-gradient(circle at center, #ffdcb5 0%, #fff 100%)'
                      : 'radial-gradient(circle at center, #FDEFD5 0%, #fff 100%)',
                }}
              >
                <img
                  src={getCategory3DImage('all')}
                  alt="All Items"
                  className="w-7 h-7 object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.18)] -mt-1 group-hover:-translate-y-0.5 transition-transform"
                />
              </div>
              <span className="truncate">All Items</span>
            </div>
            <span
              className={`text-[10px] rounded-full px-2 py-0.5 font-black transition-colors ${
                !searchQuery.trim() && activeCategory === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#f3f4f6] text-[#6b7280]'
              }`}
            >
              {totalAllItemsCount}
            </span>
          </button>

          {/* Dynamic Category Rows */}
          {categories.map((cat) => {
            const isActive = !searchQuery.trim() && activeCategory === cat._id;
            return (
              <button
                key={cat._id}
                data-category-id={cat._id}
                onClick={() => {
                  setActiveCategory(cat._id);
                  if (setSearchQuery) setSearchQuery('');
                }}
                className={`group flex items-center justify-between px-3.5 py-2.5 text-[13px] font-bold border-b border-[#f3f4f6] transition-all ll-interactive ll-focus-ring cursor-pointer last:border-b-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#7a0b10] to-[#961218] text-white shadow-sm'
                    : 'bg-white text-[#1a1a1a] hover:bg-[#fcfaf5] hover:text-[#7a0b10]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`relative w-8 h-9 rounded-full shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 ${
                      isActive ? 'shadow-inner' : 'shadow-2xs'
                    }`}
                    style={{
                      background: isActive
                        ? 'radial-gradient(circle at center, #ffdcb5 0%, #fff 100%)'
                        : 'radial-gradient(circle at center, #FDEFD5 0%, #fff 100%)',
                    }}
                  >
                    <img
                      src={getCategory3DImage(cat.name)}
                      alt={cat.name}
                      className="w-7 h-7 object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.18)] -mt-1 group-hover:-translate-y-0.5 transition-transform"
                    />
                  </div>
                  <span className="truncate">{cat.name}</span>
                </div>
                <span
                  className={`text-[10px] rounded-full px-2 py-0.5 font-black transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[#f3f4f6] text-[#6b7280] group-hover:bg-[#7a0b10]/10 group-hover:text-[#7a0b10]'
                  }`}
                >
                  {cat.items?.length || 0}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ─── 3. PROMO OFFER CARD (Desktop Only) ─── */}
      {activeCoupon && (
        <div className="hidden lg:block relative rounded-2xl p-6 text-center text-[#ffffff] overflow-hidden shadow-lg border border-[#222222] mt-6">
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
              disabled={isExpired}
              onClick={() => {
                if (isExpired) return;
                localStorage.setItem('pendingCouponCode', activeCoupon.code);
                if (isViewOnly) {
                  router.push('/menu');
                } else {
                  setCouponApplied(true);
                  showToast('Coupon applied! Checkout to see discount.', 'success');
                }
              }}
              className={`${isExpired ? 'bg-red-600 cursor-not-allowed text-white' : 'bg-[#e8a020] hover:bg-[#d68f13] text-[#1a1a1a]'} text-[11px] uppercase tracking-wide font-black w-full rounded-xl py-2.5 shadow-[0_4px_15px_rgba(232,160,32,0.2)] ll-interactive ll-focus-ring cursor-pointer`}
            >
              {isExpired ? 'EXPIRED' : (isViewOnly ? 'ORDER NOW' : (couponApplied ? 'APPLIED!' : 'APPLY'))}
            </button>
          </div>
        </div>
      )}

      {/* ─── 4. ALL CATEGORIES 3D MODAL (Matches Flutter All Categories Bottom Sheet) ─── */}
      <AllCategoriesModal
        isOpen={isAllModalOpen}
        onClose={() => setIsAllModalOpen(false)}
        categories={categories}
        selectedCategoryId={activeCategory}
        title="All Categories"
        onSelectCategory={(cat) => {
          setActiveCategory(cat._id);
          if (setSearchQuery) setSearchQuery('');
        }}
      />
    </div>
  );
}
