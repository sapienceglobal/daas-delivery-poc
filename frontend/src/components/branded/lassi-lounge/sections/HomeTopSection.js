'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Bike, Utensils, ChevronRight, ChevronLeft, Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import { menuCategoryContent, heroContent } from '../config';
import { restaurantAPI } from '@/lib/api';
import { useBrand } from '@/context/BrandContext';
import { useCms } from '@/context/CmsContext';
import PopOutCapsuleImage from '@/components/common/PopOutCapsuleImage';
import AllCategoriesModal from '@/components/common/AllCategoriesModal';
import { getCategory3DImage } from '@/lib/category3DHelper';

export default function HomeTopSection() {
  const router = useRouter();
  const categoriesScrollRef = useRef(null);
  const { brand } = useBrand();
  const { cmsData, loadingCms } = useCms();

  const [isAllCategoriesOpen, setIsAllCategoriesOpen] = useState(false);

  // real DB categories — fetched using brand._id from BrandContext
  const [dbCategories, setDbCategories] = useState([]);

  useEffect(() => {
    if (!brand?._id) return;
    restaurantAPI.getById(brand._id)
      .then(res => {
        const cats = res.data?.menu || [];
        // only include categories that have at least one available item
        const withItems = cats.filter(c => (c.items || []).length > 0);
        if (withItems.length > 0) setDbCategories(withItems);
      })
      .catch(() => {}); // silently fall back to config categories
  }, [brand?._id]);

  // build display categories: prefer DB, fall back to config, always decorated with 3D cutout assets
  const { categories: configCategories, viewFullMenuCta } = menuCategoryContent;
  const displayCategories = dbCategories.length > 0
    ? dbCategories.map(cat => ({
        id: cat._id,
        _id: cat._id,
        label: cat.name,
        name: cat.name,
        items: cat.items,
        icon: getCategory3DImage(cat.name)
      }))
    : configCategories.map(cat => ({
        ...cat,
        name: cat.label,
        icon: getCategory3DImage(cat.label)
      }));

  const isPausedRef = useRef(false);
  const pauseTimeoutRef = useRef(null);

  const pauseAutoScroll = () => {
    isPausedRef.current = true;
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      isPausedRef.current = false;
    }, 1000);
  };

  const scrollCategories = (direction) => {
    pauseAutoScroll();
    if (categoriesScrollRef.current) {
      const scrollAmount = 300;
      categoriesScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const container = categoriesScrollRef.current;
    if (!container) return;

    let animationFrameId;

    const handleMouseEnter = () => { isPausedRef.current = true; };
    const handleMouseLeave = () => { isPausedRef.current = false; };
    const handleTouchStart = () => { isPausedRef.current = true; };
    const handleTouchEnd = () => { 
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = setTimeout(() => { isPausedRef.current = false; }, 1000); 
    };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);

    const scrollLoop = () => {
      if (!isPausedRef.current && container) {
        const maxScroll = container.scrollWidth - container.clientWidth;
        if (container.scrollLeft >= maxScroll - 1) {
          container.scrollTo({ left: 0, behavior: 'auto' });
        } else {
          container.scrollLeft += 1;
        }
      }
      animationFrameId = requestAnimationFrame(scrollLoop);
    };

    animationFrameId = requestAnimationFrame(scrollLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const handleScroll = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const brandNameParts = brand?.name ? brand.name.split(' ') : ['LASSI', 'LOUNGE'];
  const brandName1 = brandNameParts[0];
  const brandName2 = brandNameParts.slice(1).join(' ') || 'LOUNGE';
  const cuisineRaw = brand?.cuisine || 'Authentic Indian Restaurant | Veg & Non-Veg Cuisine';
  const [cuisineLine1, cuisineLine2] = cuisineRaw.includes('|')
    ? cuisineRaw.split('|').map(s => s.trim())
    : [cuisineRaw, ''];

  return (
    <div className="w-full relative flex flex-col bg-[#f7f1e4]">

      {/* =========================================
          1. HERO SECTION (DARK LAYER)
          ========================================= */}

      <section className="relative w-full pt-16 pb-20 sm:pt-20 sm:pb-28 lg:pt-24 lg:pb-32 flex flex-col justify-start overflow-hidden z-10 min-h-[340px] sm:min-h-[480px] lg:min-h-[540px] ll-hero-mobile-fit bg-[#0e0d0c]">

        {/* Full-width Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={cmsData?.heroBanners?.home || "/images/branded/lassi-lounge/hero-spread.jpg"}
            alt="Hero background"
            fill
            priority
            className="object-cover object-center"
          />
        </div>

        {/* Dark Rich Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e0d0c] via-[#0e0d0c]/85 to-transparent z-10" />

        {/* Mobile-only bottom vignette — adds depth and keeps the headline/CTAs
            legible edge-to-edge since text runs full width on phones (unlike
            desktop where it sits over the dark left half only). Hidden by
            default via .ll-hero-mobile-vignette; a real max-width media query
            in globals.css is the only thing that ever shows it, and only
            below 768px — desktop is untouched. */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0d0c] via-[#0e0d0c]/25 to-transparent z-10 ll-hero-mobile-vignette" />

        {/* ll-stagger cascades each direct child in on mount (Welcome-to, headline,
            cuisine badge, description, CTA row) using the existing fade-lift system. */}
        <div className="relative z-20 mx-auto max-w-7xl w-full px-4 md:px-8 flex flex-col justify-start items-start text-left ll-stagger">

          {/* Hero text container: on mobile, capped at matching width so Title, Cuisine lines, and CTA align seamlessly */}
          <div className="w-full max-w-[295px] xs:max-w-[325px] md:max-w-none flex flex-col items-start">
            <div className="relative self-start">
              <p
                className="text-[26px] xs:text-3xl md:text-4xl text-white tracking-wide font-normal mb-0.5"
                style={{ fontFamily: "'Dancing Script', cursive" }}
              >
                Welcome to
              </p>
              <span className="absolute -top-1 -right-4 text-[#e8a020] text-lg font-bold rotate-[20deg]">/</span>
              <span className="absolute top-2 -right-6 text-[#e8a020] text-base font-bold rotate-[65deg]">\</span>
            </div>

            <h1 className="w-full font-serif font-black leading-none flex items-center justify-between md:justify-start flex-nowrap md:gap-3.5 mt-1">
              <span
                className="text-[35px] xs:text-[39px] sm:text-[46px] md:text-[58px] lg:text-[62px] text-white uppercase whitespace-nowrap ll-text-wipe"
                style={{ animationDelay: '500ms' }}
              >
                {brandName1}
              </span>
              <span className="text-[35px] xs:text-[39px] sm:text-[46px] md:text-[58px] lg:text-[62px] text-[#e8a020] uppercase whitespace-nowrap ll-text-wipe-shimmer">
                {brandName2}
              </span>
            </h1>

            {/* Cuisine — line 1 bold white, line 2 golden banner/pill */}
            <div className="w-full mt-2 sm:mt-3 flex flex-col items-start gap-1.5 sm:gap-2">
              <span className="w-full block text-white font-black uppercase tracking-wide leading-tight text-[13px] xs:text-[14.5px] sm:text-xl md:text-[26px] whitespace-nowrap drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
                {cuisineLine1}
              </span>
              {cuisineLine2 && (
                <span className="w-full md:w-auto inline-flex items-center justify-center text-center bg-gradient-to-r from-[#f5b82e] to-[#e8a020] text-[#1a0806] font-black uppercase tracking-wider rounded-lg md:rounded-full px-3.5 sm:px-5 py-1.5 text-[11px] xs:text-[12px] sm:text-sm md:text-base shadow-[0_6px_18px_-6px_rgba(232,160,32,0.7)]">
                  {cuisineLine2}
                </span>
              )}
            </div>

            {/* Subtitle Description — Shown on Desktop, hidden on mobile */}
            <p className="hidden md:block text-white/85 text-sm md:text-base font-sans max-w-xl mt-4 leading-relaxed font-light">
              {heroContent.description}
            </p>

            <div className="w-full md:w-auto flex flex-row items-center justify-start gap-2.5 sm:gap-4 mt-3.5 sm:mt-7 ll-hero-cta-row">
              <Button
                href={heroContent.primaryCta.href}
                variant="custom"
                className="w-full md:w-auto !bg-[#cd131b] hover:!bg-[#b01017] text-white border border-[#ff3a3a]/40 px-6 sm:px-7 py-3 !rounded-full font-bold text-[13px] sm:text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-[0_8px_22px_-8px_rgba(205,19,27,0.8)] hover:-translate-y-0.5 ll-hero-cta-btn ll-hero-cta-btn--primary"
              >
                <Bike size={17} strokeWidth={2.5} /> <span>{heroContent.primaryCta.label}</span>
              </Button>

              <Button
                href={heroContent.secondaryCta.href}
                variant="custom"
                className="hidden md:inline-flex !bg-black/30 hover:!bg-[#e8a020]/15 backdrop-blur-sm border-[1.5px] border-[#e8a020] text-white px-4 sm:px-7 py-2.5 sm:py-3 !rounded-full font-bold text-[12px] sm:text-sm tracking-wide items-center justify-center gap-2 transition-all hover:-translate-y-0.5 ll-hero-cta-btn ll-hero-cta-btn--secondary"
              >
                <Utensils size={15} strokeWidth={2.5} className="text-[#e8a020]" /> <span>{heroContent.secondaryCta.label}</span>
              </Button>
            </div>
          </div>
        </div>
        {/* Bottom Smooth Organic Wave Transition into Categories */}
        <div className="absolute -bottom-[2px] left-0 right-0 h-12 sm:h-20 pointer-events-none z-20 overflow-hidden">
          <svg
            viewBox="0 0 1440 80"
            fill="none"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            <path
              d="M0,30 C360,62 720,66 1080,44 C1260,33 1360,26 1440,24"
              fill="none"
              stroke="#e8a020"
              strokeWidth="6"
              className="opacity-25"
              style={{ filter: 'blur(3px)' }}
            />
            <path
              d="M0,30 C360,62 720,66 1080,44 C1260,33 1360,26 1440,24 L1440,90 L0,90 Z"
              fill="#f7f1e4"
            />
            <path
              d="M0,30 C360,62 720,66 1080,44 C1260,33 1360,26 1440,24"
              fill="none"
              stroke="#FFFDF8"
              strokeWidth="3"
            />
          </svg>
        </div>
      </section>

      {/* =========================================
          2. LIGHT CREAM CANVAS WRAPPER
          ========================================= */}
      <section className="bg-[#f7f1e4] w-full relative pb-16 pt-0 flex flex-col items-center z-30 -mt-1 sm:-mt-1.5">

        {/* ─── EXPLORE OUR MENU CONTAINER CARD ─── */}
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 -mt-20 relative z-40 ll-explore-mobile-gap">

          <div className="bg-[#fcfaf5] rounded-[2rem] shadow-[0_10px_30px_rgba(0,0,0,0.1)] py-5 md:py-6 px-4 sm:px-6 md:px-10 w-full border border-[#ebdcc1]/50">

            <div className="flex items-center justify-center mb-4 md:mb-5 px-1">
              <h2 className="font-serif font-black text-base xs:text-lg sm:text-xl md:text-2xl text-[#0e0d0c] uppercase tracking-wider text-center whitespace-nowrap">
                EXPLORE OUR MENU
              </h2>
            </div>

            <div className="flex flex-col xl:flex-row items-center justify-between gap-4 xl:gap-6">

              <div className="relative w-full flex items-center min-w-0">
                <div ref={categoriesScrollRef} className="flex flex-nowrap overflow-x-auto no-scrollbar pb-3 md:pb-1 pt-2 justify-start gap-3 sm:gap-5 md:gap-7 flex-1 w-full px-2 md:px-8 ll-cat-scroll-fade">
                  {displayCategories.map((category) => (
                    <PopOutCapsuleImage
                      key={category.id}
                      category={category}
                      label={category.label}
                      imageUrl={category.icon}
                      width={80}
                      className="shrink-0"
                      onClick={() => router.push(`${viewFullMenuCta.href}?categoryName=${encodeURIComponent(category.label)}`)}
                    />
                  ))}
                </div>

                {/* Left Arrow (Desktop Only) */}
                <button 
                  className="hidden md:flex absolute -left-5 z-50 bg-white/95 shadow-[0_4px_16px_rgba(0,0,0,0.15)] border border-[#e5e7eb] rounded-full w-11 h-11 items-center justify-center text-[#0e0d0c] hover:text-[#e8a020] hover:scale-105 transition-all ml-1 cursor-pointer"
                  onClick={() => scrollCategories('left')}
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={24} strokeWidth={2.5} />
                </button>

                {/* Right Arrow (Desktop Only) */}
                <button 
                  className="hidden md:flex absolute -right-5 z-50 bg-white/95 shadow-[0_4px_16px_rgba(0,0,0,0.15)] border border-[#e5e7eb] rounded-full w-11 h-11 items-center justify-center text-[#0e0d0c] hover:text-[#e8a020] hover:scale-105 transition-all mr-1 cursor-pointer"
                  onClick={() => scrollCategories('right')}
                  aria-label="Scroll right"
                >
                  <ChevronRight size={24} strokeWidth={2.5} />
                </button>
              </div>
            </div>

          </div>
        </div>

        
        {/* ─── DOWNLOAD OUR MOBILE APP PROMO CARD ─── */}
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 mt-7 md:mt-12 relative z-30">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#800b12] via-[#5c080d] to-[#2c0407] border-[1.5px] border-[#f5b82e]/35 shadow-[0_22px_50px_-15px_rgba(92,8,13,0.75)]">
            {/* Ambient luxury glows */}
            <div className="absolute -top-20 -right-12 w-64 h-64 rounded-full bg-[#f5b82e]/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-12 w-72 h-72 rounded-full bg-[#ff3a3a]/20 blur-3xl pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '14px 14px' }} />

            <div className="relative flex items-center gap-4 sm:gap-7 md:gap-12 px-4 xs:px-5 sm:px-8 md:px-12 py-6 sm:py-8 md:py-8">
              {/* Phone mockups with user's actual app home screen - bigger & richer */}
              <div className="relative shrink-0 w-[108px] h-[165px] xs:w-[118px] xs:h-[178px] sm:w-[155px] sm:h-[195px] md:w-[195px] md:h-[210px]">
                {/* Front Phone */}
                <div className="absolute left-0 bottom-0 w-[74px] h-[148px] xs:w-[80px] xs:h-[160px] sm:w-[98px] sm:h-[188px] md:w-[108px] md:h-[204px] rounded-[18px] sm:rounded-[22px] bg-[#111] p-[3px] shadow-[0_16px_36px_rgba(0,0,0,0.65)] -rotate-[7deg] z-10 border border-white/20">
                  <div className="w-full h-full rounded-[15px] sm:rounded-[19px] overflow-hidden bg-[#fcfaf5] flex flex-col">
                    <div className="relative flex-1">
                      <Image src="/images/branded/lassi-lounge/app-home-screen.jpg" alt="Lassi Lounge mobile app" fill className="object-cover object-top" sizes="120px" />
                    </div>
                  </div>
                </div>
                {/* Back Phone */}
                <div className="absolute right-0 top-0 w-[66px] h-[134px] xs:w-[72px] xs:h-[146px] sm:w-[90px] sm:h-[174px] md:w-[100px] md:h-[190px] rounded-[16px] sm:rounded-[20px] bg-[#111] p-[3px] shadow-[0_14px_30px_rgba(0,0,0,0.5)] rotate-[7deg] border border-white/15">
                  <div className="w-full h-full rounded-[13px] sm:rounded-[17px] overflow-hidden bg-[#fcfaf5] flex flex-col">
                    <div className="relative flex-1">
                      <Image src="/images/branded/lassi-lounge/app-home-screen.jpg" alt="" fill className="object-cover object-[center_45%]" sizes="110px" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Copy + CTAs */}
              <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 md:gap-8">
                <div className="flex flex-col items-start md:items-center md:text-center">
                  <h3 className="flex items-center gap-1.5 font-black uppercase leading-tight text-white text-[16px] xs:text-[18px] sm:text-2xl md:text-[28px] tracking-tight">
                    <Download className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-[#f5b82e] shrink-0" strokeWidth={3} />
                    <span>Download Our <span className="text-[#f5b82e] drop-shadow-[0_2px_10px_rgba(245,184,46,0.45)]">Mobile App</span></span>
                  </h3>
                  
                  {/* 2-line clean descriptive text on mobile & desktop */}
                  <div className="text-white/90 text-[12px] xs:text-[13px] sm:text-[14px] md:text-base mt-1.5 sm:mt-2 leading-snug font-medium">
                    <p className="whitespace-nowrap">Order on our mobile app directly</p>
                    <p className="text-white/80">and get</p>
                  </div>

                  {/* 20% OFF Offer Pill */}
                  <div className="flex items-center gap-2 mt-2 sm:mt-2.5">
                    <span className="bg-gradient-to-r from-[#f5b82e] via-[#e8a020] to-[#d4821a] text-[#1a0806] font-black text-[16px] xs:text-[18px] sm:text-2xl md:text-3xl px-3 py-0.5 sm:py-1 rounded-xl leading-none shadow-[0_6px_16px_rgba(232,160,32,0.45)] border border-[#ffdf79]/50 whitespace-nowrap">
                      20% OFF
                    </span>
                    <span className="text-white text-xs xs:text-sm sm:text-base font-bold whitespace-nowrap tracking-wide">
                      on your every order
                    </span>
                  </div>

                  {/* Coupon Code badge */}
                  <div className="mt-2.5 inline-flex items-center gap-1.5 xs:gap-2 rounded-full border border-dashed border-[#f5b82e] bg-black/40 backdrop-blur-md px-3.5 py-1 text-[11px] sm:text-xs text-white shadow-inner">
                    <span className="text-white/85 font-medium">Use Code:</span>
                    <span className="font-black text-[#f5b82e] tracking-widest text-xs sm:text-sm">WELCOME20</span>
                  </div>
                </div>

                {/* App Download Buttons */}
                <div className="flex flex-row md:flex-col gap-2 xs:gap-2.5 shrink-0 mt-1 md:mt-0">
                  <a
                    href={brand?.playStoreUrl || 'https://play.google.com/store/apps/details?id=com.lassilounge.customer&hl=en'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-black/90 hover:bg-black border border-white/25 rounded-xl px-2.5 xs:px-3.5 sm:px-4 py-2 transition-all hover:scale-105 shadow-md"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 xs:w-5 xs:h-5 md:w-6 md:h-6 shrink-0" aria-hidden="true">
                      <path fill="#34A853" d="M3.6 1.8 13.8 12 3.6 22.2c-.4-.2-.6-.6-.6-1.1V2.9c0-.5.2-.9.6-1.1z"/>
                      <path fill="#FBBC04" d="m17.2 15.4-3.4-3.4 3.4-3.4 3.9 2.2c1.1.6 1.1 1.8 0 2.4z"/>
                      <path fill="#EA4335" d="M17.2 15.4 13.8 12 3.6 22.2c.4.2.9.2 1.4-.1z"/>
                      <path fill="#4285F4" d="M17.2 8.6 5 1.9c-.5-.3-1-.3-1.4-.1L13.8 12z"/>
                    </svg>
                    <span className="flex flex-col leading-none text-white whitespace-nowrap">
                      <span className="text-[7.5px] xs:text-[8px] md:text-[9px] uppercase text-white/75 font-medium tracking-wide">Get it on</span>
                      <span className="text-[11px] xs:text-[12px] md:text-sm font-bold mt-0.5">Google Play</span>
                    </span>
                  </a>

                  <div
                    className="flex items-center gap-2 bg-black/75 border border-white/20 rounded-xl px-2.5 xs:px-3.5 sm:px-4 py-2 select-none cursor-default opacity-90 shadow-md"
                    title="iOS App Coming Soon!"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 xs:w-5 xs:h-5 md:w-6 md:h-6 fill-white/80 shrink-0" aria-hidden="true">
                      <path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1zM13.9 4.9c.7-.9 1.2-2.1 1.1-3.3-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.2 1.1.1 2.3-.6 3-1.5z"/>
                    </svg>
                    <span className="flex flex-col leading-none text-white whitespace-nowrap">
                      <span className="text-[7.5px] xs:text-[8px] md:text-[9px] uppercase font-bold text-[#f5b82e] tracking-wider">Coming Soon</span>
                      <span className="text-[11px] xs:text-[12px] md:text-sm font-bold text-white/90 mt-0.5">App Store</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── ALL CATEGORIES 3D MODAL (Matches Flutter All Categories Bottom Sheet) ─── */}
        <AllCategoriesModal
          isOpen={isAllCategoriesOpen}
          onClose={() => setIsAllCategoriesOpen(false)}
          categories={displayCategories}
          title="All Menu Categories"
          onSelectCategory={(cat) => {
            router.push(`${viewFullMenuCta.href}?categoryName=${encodeURIComponent(cat.label || cat.name)}`);
          }}
        />

        </section>
    </div>
  );
}
