'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Bike, Utensils, ChevronRight, ChevronLeft, ArrowRight, ArrowLeft, LayoutGrid, Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import { menuCategoryContent, deliveryPartnersContent, heroContent } from '../config';
import { restaurantAPI } from '@/lib/api';
import { useBrand } from '@/context/BrandContext';
import { useCms } from '@/context/CmsContext';
import PopOutCapsuleImage from '@/components/common/PopOutCapsuleImage';
import AllCategoriesModal from '@/components/common/AllCategoriesModal';
import { getCategory3DImage } from '@/lib/category3DHelper';

export default function HomeTopSection() {
  const router = useRouter();
  const partnersScrollRef = useRef(null);
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

  useEffect(() => {
    if (partnersScrollRef.current) {
      // small timeout ensures the DOM has fully painted the widths
      setTimeout(() => {
        const container = partnersScrollRef.current;
        const scrollTarget = (container.scrollWidth - container.clientWidth) / 2;
        container.scrollTo({ left: scrollTarget, behavior: 'smooth' });
      }, 100);
    }
  }, []);

  const handleScroll = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const { eyebrow, heading, headingScript, description, partners } = deliveryPartnersContent;

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

          <h1 className="font-serif font-black leading-none flex items-center justify-start flex-nowrap gap-2 sm:gap-3.5 mt-1">
            <span
              className="text-[32px] xs:text-[36px] sm:text-[46px] md:text-[58px] lg:text-[62px] text-white uppercase whitespace-nowrap ll-text-wipe"
              style={{ animationDelay: '500ms' }}
            >
              {brandName1}
            </span>
            <span className="text-[32px] xs:text-[36px] sm:text-[46px] md:text-[58px] lg:text-[62px] text-[#e8a020] uppercase whitespace-nowrap ll-text-wipe-shimmer">
              {brandName2}
            </span>
          </h1>

          {/* Cuisine — line 1 bold white, line 2 golden pill */}
          <div className="mt-2.5 sm:mt-4 flex flex-col items-start gap-2">
            <span className="block text-white font-black uppercase tracking-wide leading-tight text-[15px] xs:text-[17px] sm:text-xl md:text-[26px] whitespace-nowrap drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
              {cuisineLine1}
            </span>
            {cuisineLine2 && (
              <span className="inline-flex items-center bg-gradient-to-r from-[#f5b82e] to-[#e8a020] text-[#1a0806] font-black uppercase tracking-wide rounded-full px-3.5 sm:px-5 py-1 sm:py-1.5 text-[11px] xs:text-[12px] sm:text-sm md:text-base shadow-[0_6px_18px_-6px_rgba(232,160,32,0.7)]">
                {cuisineLine2}
              </span>
            )}
          </div>

          {/* Subtitle Description — Shown on Desktop, hidden on mobile */}
          <p className="hidden md:block text-white/85 text-sm md:text-base font-sans max-w-xl mt-4 leading-relaxed font-light">
            {heroContent.description}
          </p>

          <div className="flex flex-row items-center justify-start gap-2.5 sm:gap-4 mt-4 sm:mt-7 ll-hero-cta-row">
            <Button
              href={heroContent.primaryCta.href}
              variant="custom"
              className="!bg-[#cd131b] hover:!bg-[#b01017] text-white border border-[#ff3a3a]/40 px-4 sm:px-7 py-2.5 sm:py-3 !rounded-full font-bold text-[12px] sm:text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-[0_8px_22px_-8px_rgba(205,19,27,0.8)] hover:-translate-y-0.5 ll-hero-cta-btn ll-hero-cta-btn--primary"
            >
              <Bike size={16} strokeWidth={2.5} /> <span>{heroContent.primaryCta.label}</span>
            </Button>

            <Button
              href={heroContent.secondaryCta.href}
              variant="custom"
              className="!bg-black/30 hover:!bg-[#e8a020]/15 backdrop-blur-sm border-[1.5px] border-[#e8a020] text-white px-4 sm:px-7 py-2.5 sm:py-3 !rounded-full font-bold text-[12px] sm:text-sm tracking-wide flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 ll-hero-cta-btn ll-hero-cta-btn--secondary"
            >
              <Utensils size={15} strokeWidth={2.5} className="text-[#e8a020]" /> <span>{heroContent.secondaryCta.label}</span>
            </Button>
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

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 md:mb-5 px-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center text-[#e8a020]">
                  <div className="h-[1.5px] w-8 md:w-10 bg-[#e8a020]"></div>
                  <ArrowRight size={14} strokeWidth={2.5} className="ml-1" />
                </div>
                <h2 className="font-serif font-black text-lg md:text-2xl text-[#0e0d0c] uppercase tracking-wider text-center">
                  EXPLORE OUR MENU
                </h2>
                <div className="flex items-center text-[#e8a020]">
                  <ArrowLeft size={14} strokeWidth={2.5} className="mr-1" />
                  <div className="h-[1.5px] w-8 md:w-10 bg-[#e8a020]"></div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAllCategoriesOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#f3ece6] hover:bg-[#ebdcc1] border border-[#ebdcc1] text-[#7a0b10] hover:text-[#58080c] text-xs font-bold transition-all shadow-2xs hover:scale-105 cursor-pointer"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>All Categories ({displayCategories.length})</span>
              </button>
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
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 mt-6 md:mt-10 relative z-30">
          <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#8f0d14] via-[#6e0a10] to-[#3d0508] border border-[#e8a020]/25 shadow-[0_20px_45px_-18px_rgba(110,10,16,0.75)]">
            {/* decorative glows */}
            <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-[#e8a020]/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-[#ff3a3a]/15 blur-3xl pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '14px 14px' }} />

            <div className="relative flex items-center gap-3 sm:gap-6 md:gap-10 px-3.5 sm:px-8 md:px-12 py-5 md:py-7">
              {/* Phone mockups with user's actual app home screen */}
              <div className="relative shrink-0 w-[92px] h-[140px] sm:w-[150px] sm:h-[190px] md:w-[190px] md:h-[200px]">
                <div className="absolute left-0 bottom-0 w-[62px] h-[126px] sm:w-[92px] sm:h-[180px] md:w-[100px] md:h-[196px] rounded-[16px] sm:rounded-[20px] bg-[#111] p-[3px] shadow-[0_14px_30px_rgba(0,0,0,0.55)] -rotate-[8deg] z-10">
                  <div className="w-full h-full rounded-[13px] sm:rounded-[17px] overflow-hidden bg-[#fcfaf5] flex flex-col">
                    <div className="relative flex-1">
                      <Image src="/images/branded/lassi-lounge/app-home-screen.jpg" alt="Lassi Lounge mobile app" fill className="object-cover object-top" sizes="110px" />
                    </div>
                  </div>
                </div>
                <div className="absolute right-0 top-0 w-[56px] h-[114px] sm:w-[84px] sm:h-[166px] md:w-[92px] md:h-[180px] rounded-[15px] sm:rounded-[18px] bg-[#111] p-[3px] shadow-[0_14px_30px_rgba(0,0,0,0.5)] rotate-[6deg]">
                  <div className="w-full h-full rounded-[12px] sm:rounded-[15px] overflow-hidden bg-[#fcfaf5] flex flex-col">
                    <div className="relative flex-1">
                      <Image src="/images/branded/lassi-lounge/app-home-screen.jpg" alt="" fill className="object-cover object-[center_45%]" sizes="100px" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Copy + CTAs */}
              <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-8">
                <div className="flex flex-col items-start md:items-center md:text-center">
                  <h3 className="flex items-center gap-1.5 font-black uppercase leading-tight text-white text-[15px] xs:text-[17px] sm:text-xl md:text-[26px]">
                    <Download className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#e8a020] shrink-0" strokeWidth={3} />
                    <span>Download Our <span className="text-[#e8a020]">Mobile App</span></span>
                  </h3>
                  <p className="text-white/85 text-[11px] sm:text-[13px] md:text-sm mt-1 leading-snug">
                    Order on our mobile app directly and get
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="bg-[#e8a020] text-[#1a0806] font-black text-[15px] sm:text-xl md:text-2xl px-2.5 py-0.5 rounded-lg leading-none shadow-md whitespace-nowrap">20% OFF</span>
                    <span className="text-white text-[11px] sm:text-sm font-semibold whitespace-nowrap">on your every order</span>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-dashed border-[#e8a020]/80 bg-black/20 px-3 py-1 text-[10px] sm:text-xs text-white">
                    Use Code: <span className="font-black text-[#e8a020] tracking-wider">WELCOME20</span>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-2 shrink-0">
                  <a
                    href={brand?.playStoreUrl || 'https://play.google.com/store/apps/details?id=com.lassilounge.customer&hl=en'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-black hover:bg-[#1a1a1a] border border-white/25 rounded-lg px-2 md:px-4 py-1.5 md:py-2 transition-all hover:-translate-y-0.5"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true"><path fill="#34A853" d="M3.6 1.8 13.8 12 3.6 22.2c-.4-.2-.6-.6-.6-1.1V2.9c0-.5.2-.9.6-1.1z"/><path fill="#FBBC04" d="m17.2 15.4-3.4-3.4 3.4-3.4 3.9 2.2c1.1.6 1.1 1.8 0 2.4z"/><path fill="#EA4335" d="M17.2 15.4 13.8 12 3.6 22.2c.4.2.9.2 1.4-.1z"/><path fill="#4285F4" d="M17.2 8.6 5 1.9c-.5-.3-1-.3-1.4-.1L13.8 12z"/></svg>
                    <span className="flex flex-col leading-none text-white whitespace-nowrap"><span className="text-[7px] md:text-[9px] uppercase">Get it on</span><span className="text-[10px] xs:text-[11px] md:text-sm font-bold">Google Play</span></span>
                  </a>

                  <div
                    className="flex items-center gap-1.5 bg-black/80 border border-white/20 rounded-lg px-2 md:px-4 py-1.5 md:py-2 select-none cursor-default opacity-85"
                    title="iOS App Coming Soon!"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 md:w-5 md:h-5 fill-white/80" aria-hidden="true"><path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1zM13.9 4.9c.7-.9 1.2-2.1 1.1-3.3-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.2 1.1.1 2.3-.6 3-1.5z"/></svg>
                    <span className="flex flex-col leading-none text-white whitespace-nowrap"><span className="text-[7px] md:text-[9px] uppercase font-bold text-[#e8a020] tracking-wider">Coming Soon</span><span className="text-[10px] xs:text-[11px] md:text-sm font-bold text-white/90">App Store</span></span>
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

        {/* ─── DELIVERY PARTNERS BANNER CARD ─── */}
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 mt-6 relative z-30">

          <div className="bg-gradient-to-r from-[#3a060d] via-[#6e0c15] to-[#a41722] rounded-[2.5rem] flex flex-col xl:flex-row items-center justify-between px-8 py-8 md:px-10 md:py-8 shadow-2xl border border-red-900/30">

            <div className="space-y-1 text-left w-full xl:w-auto xl:flex-1">
              <p className="text-[#e8a020] font-bold text-[10px] md:text-xs uppercase tracking-widest mb-2">
                {eyebrow}
              </p>
              <h2 className="text-3xl md:text-[2.2rem] font-serif font-bold text-white leading-tight">
                {heading}
              </h2>
              <h3
                className="text-[#e8a020] font-normal tracking-wide text-3xl md:text-[2.5rem] mt-1"
                style={{ fontFamily: "'Dancing Script', cursive" }}
              >
                {headingScript}
              </h3>
              <p className="text-white/80 text-xs md:text-[13px] font-sans max-w-sm leading-relaxed pt-3">
                {description}
              </p>
            </div>

            <div className="hidden xl:block w-[1px] h-24 bg-white/20 mx-6"></div>

            <div
              ref={partnersScrollRef}
              className="flex flex-row overflow-x-auto snap-x snap-mandatory no-scrollbar items-center justify-start xl:justify-center gap-3 md:gap-4 w-full xl:w-auto mt-8 xl:mt-0 pb-2 xl:pb-0 -mx-4 px-4 xl:mx-0 xl:px-0"
            >

              <a href={partners[0].href} target="_blank" rel="noopener noreferrer" className="shrink-0 snap-center bg-black hover:bg-neutral-900 rounded-2xl shadow-xl flex items-center justify-center w-[150px] sm:w-[170px] lg:w-[190px] h-[85px] lg:h-[95px] transition-transform hover:-translate-y-1">
                <span className="font-bold text-white text-2xl md:text-3xl tracking-tighter flex flex-col items-center leading-none font-sans">
                  Uber <span className="text-[#06c167] mt-1">Eats</span>
                </span>
              </a>

              <a href={partners[1].href} target="_blank" rel="noopener noreferrer" className="shrink-0 snap-center bg-white hover:bg-gray-50 rounded-2xl shadow-xl flex items-center justify-center w-[150px] sm:w-[170px] lg:w-[190px] h-[85px] lg:h-[95px] transition-transform hover:-translate-y-1">
                <span className="font-black text-[#ff3008] text-base md:text-lg tracking-widest font-sans uppercase flex flex-col items-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="#ff3008" xmlns="http://www.w3.org/2000/svg" className="mb-1.5"><path d="M22.956 16.037c0 4.148-4.708 6.44-8.868 6.44-4.887 0-9.824-2.83-9.824-6.44 0-4.149 4.706-6.44 8.867-6.44 4.889 0 9.825 2.829 9.825 6.44zm-14.93-9.043c0-4.147 4.708-6.44 8.867-6.44 4.889 0 9.825 2.83 9.825 6.44 0 4.149-4.707 6.44-8.868 6.44-4.887 0-9.824-2.829-9.824-6.44z" /></svg>
                  DOORDASH
                </span>
              </a>

            </div>
          </div>
        </div>

      </section>
    </div>
  );
}