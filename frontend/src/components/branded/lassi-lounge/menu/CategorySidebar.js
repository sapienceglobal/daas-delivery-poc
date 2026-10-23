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
  const mobileNavRef = useRef(null);
  const desktopNavRef = useRef(null);
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

  const scrollToActiveCategory = (targetId) => {
    const idToScroll = targetId || activeCategory;
    if (!idToScroll || searchQuery.trim()) return;

    // 1. Desktop Sidebar Scroll
    if (desktopNavRef.current) {
      const activeBtn = desktopNavRef.current.querySelector(`[data-category-id="${idToScroll}"]`);
      if (activeBtn) {
        const container = desktopNavRef.current;
        const containerTop = container.scrollTop;
        const containerRect = container.getBoundingClientRect();
        const btnRect = activeBtn.getBoundingClientRect();

        const offset = (btnRect.top - containerRect.top) + containerTop - (containerRect.height / 2) + (btnRect.height / 2);
        container.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
      }
    }

    // 2. Mobile Strip Scroll
    if (mobileNavRef.current) {
      const activeBtn = mobileNavRef.current.querySelector(`[data-category-id="${idToScroll}"]`);
      if (activeBtn) {
        const container = mobileNavRef.current;
        const containerLeft = container.scrollLeft;
        const containerRect = container.getBoundingClientRect();
        const btnRect = activeBtn.getBoundingClientRect();

        const offset = (btnRect.left - containerRect.left) + containerLeft - (containerRect.width / 2) + (btnRect.width / 2);
        container.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToActiveCategory();
    }, 60);
    return () => clearTimeout(timer);
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
          ref={mobileNavRef}
          className="flex flex-row overflow-x-auto no-scrollbar gap-2 sm:gap-3 px-2 pt-3 pb-2.5 snap-x snap-mandatory scroll-smooth"
        >
          {/* All Items Capsule */}
          <div data-category-id="all" className="shrink-0 snap-start">
            <PopOutCapsuleImage
              label="All Items"
              icon={UtensilsCrossed}
              width={72}
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
                  width={72}
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
            <span>All</span>
          </button>
        </div>

        {/* Categories List (no-scrollbar removes OS scrollbar gutter/white vertical strip) */}
        <nav ref={desktopNavRef} className="flex flex-col max-h-[calc(100vh-180px)] overflow-y-auto no-scrollbar scroll-smooth">
          {/* All Items Row */}
          <button
            key="all"
            data-category-id="all"
            onClick={() => {
              setActiveCategory('all');
              if (setSearchQuery) setSearchQuery('');
            }}
            className={`w-full group relative flex items-center justify-between px-3.5 py-3 text-[13.5px] font-bold border-b transition-all ll-interactive ll-focus-ring cursor-pointer ${
              !searchQuery.trim() && activeCategory === 'all'
                ? 'bg-gradient-to-r from-[#7a0b10] to-[#961218] text-white shadow-sm border-[#7a0b10]'
                : 'bg-white text-[#1a1a1a] hover:bg-[#fcfaf5] hover:text-[#7a0b10] border-[#f3f4f6]'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
              <div
                className={`relative w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center transition-all duration-300 group-hover:scale-108 ${
                  !searchQuery.trim() && activeCategory === 'all'
                    ? 'shadow-md ring-2 ring-white/30'
                    : 'shadow-2xs group-hover:shadow-md'
                }`}
                style={{
                  background:
                    !searchQuery.trim() && activeCategory === 'all'
                      ? 'radial-gradient(circle at center, #ffdcb5 0%, #ffffff 100%)'
                      : 'radial-gradient(circle at center, #fef4e4 0%, #ffffff 100%)',
                  border:
                    !searchQuery.trim() && activeCategory === 'all'
                      ? '1.5px solid rgba(255,255,255,0.4)'
                      : '1px solid #ebdcc1',
                }}
              >
                <UtensilsCrossed
                  className="w-6 h-6 text-[#7a0b10] drop-shadow-xs group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <span className={`text-[13.5px] font-extrabold tracking-tight truncate leading-tight transition-colors ${
                !searchQuery.trim() && activeCategory === 'all' ? 'text-white' : 'text-[#1a1a1a] group-hover:text-[#7a0b10]'
              }`}>
                All Items
              </span>
            </div>
            <span
              className={`text-[11px] rounded-full px-2.5 py-0.5 font-black shrink-0 transition-all ${
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
                className={`w-full group relative flex items-center justify-between px-3.5 py-3 text-[13.5px] font-bold border-b transition-all ll-interactive ll-focus-ring cursor-pointer last:border-b-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#7a0b10] to-[#961218] text-white shadow-sm border-[#7a0b10]'
                    : 'bg-white text-[#1a1a1a] hover:bg-[#fcfaf5] hover:text-[#7a0b10] border-[#f3f4f6]'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                  <div
                    className={`relative w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center transition-all duration-300 group-hover:scale-108 ${
                      isActive ? 'shadow-md ring-2 ring-white/30' : 'shadow-2xs group-hover:shadow-md'
                    }`}
                    style={{
                      background: isActive
                        ? 'radial-gradient(circle at center, #ffdcb5 0%, #ffffff 100%)'
                        : 'radial-gradient(circle at center, #fef4e4 0%, #ffffff 100%)',
                      border: isActive ? '1.5px solid rgba(255,255,255,0.4)' : '1px solid #ebdcc1',
                    }}
                  >
                    {/* Contact Shadow beneath 3D dish */}
                    <div
                      className="absolute bottom-1 w-7 h-1.5 rounded-full pointer-events-none"
                      style={{
                        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 70%)',
                        filter: 'blur(1px)',
                      }}
                    />
                    <img
                      src={getCategory3DImage(cat.name)}
                      alt={cat.name}
                      className="w-11 h-11 object-contain filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.22)] -mt-1 group-hover:-translate-y-1 group-hover:scale-110 transition-all duration-300"
                    />
                  </div>
                  <span className={`text-[13.5px] font-extrabold tracking-tight truncate leading-tight transition-colors ${
                    isActive ? 'text-white' : 'text-[#1a1a1a] group-hover:text-[#7a0b10]'
                  }`}>
                    {cat.name}
                  </span>
                </div>
                <span
                  className={`text-[11px] rounded-full px-2.5 py-0.5 font-black shrink-0 transition-all ${
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
          const selectedId = cat._id || cat.id || 'all';
          setActiveCategory(selectedId);
          if (setSearchQuery) setSearchQuery('');
          setTimeout(() => {
            scrollToActiveCategory(selectedId);
          }, 80);
        }}
      />
    </div>
  );
}
