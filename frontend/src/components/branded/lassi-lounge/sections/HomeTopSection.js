'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Bike, Utensils, ChevronRight, ArrowRight, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import { menuCategoryContent, deliveryPartnersContent, heroContent } from '../config';

export default function HomeTopSection() {
  const router = useRouter();

  const handleScroll = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const { categories, viewFullMenuCta } = menuCategoryContent;
  const { eyebrow, heading, headingScript, description, partners } = deliveryPartnersContent;

  return (
    <div className="w-full relative flex flex-col bg-[#0e0d0c]">

      {/* =========================================
          1. HERO SECTION (DARK LAYER)
          ========================================= */}
      {/* यहाँ pt-40/lg:pt-56 (Top Spacing) और min-h-[750px] (Height) ऐड किया गया है */}
      <section className="relative w-full pt-30 pb-32 md:pt-38 md:pb-30 lg:pt-56 lg:pb-44 flex flex-col justify-center overflow-hidden z-10 min-h-[600px] lg:min-h-[720px]">

        {/* Full-width Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/branded/lassi-lounge/hero-spread.jpg"
            alt="Lassi Lounge Indian feast spread"
            fill
            priority
            className="object-cover object-center"
          />
        </div>

        {/* Dark Rich Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e0d0c] via-[#0e0d0c]/85 to-transparent z-10" />

        <div className="relative z-20 mx-auto max-w-7xl w-full px-4 md:px-8 flex flex-col justify-center text-left">

          <div className="relative self-start">
            <p
              className="text-3xl md:text-4xl text-white tracking-wide font-normal mb-1"
              style={{ fontFamily: "'Dancing Script', cursive" }}
            >
              Welcome to
            </p>
            <span className="absolute -top-1 -right-4 text-[#e8a020] text-lg font-bold rotate-[20deg]">/</span>
            <span className="absolute top-2 -right-6 text-[#e8a020] text-base font-bold rotate-[65deg]">\</span>
          </div>

          <h1 className="font-serif font-black leading-[0.85] tracking-tight mt-1">
            <span className="block text-7xl md:text-[95px] text-white">LASSI</span>
            <span className="block text-7xl md:text-[95px] text-[#e8a020]">LOUNGE</span>
          </h1>

          <div className="mt-4 self-start relative ml-1">
            <div className="bg-[#cd131b] text-white text-xs md:text-sm font-bold tracking-widest px-6 py-2.5 uppercase relative z-10 shadow-lg">
              INDIAN RESTAURANT
            </div>
            <div className="absolute -left-1.5 top-0 h-full w-2 bg-[#cd131b] z-0"></div>
            <div className="absolute -left-1.5 -bottom-1.5 border-t-[6px] border-t-[#78060b] border-l-[6px] border-l-transparent z-0"></div>
          </div>

          <p className="text-[#f7f1e4]/80 text-xs md:text-sm leading-relaxed mt-6 max-w-[380px] font-sans">
            Experience the rich and authentic flavors of India. From traditional favorites to modern delights, every dish is made with love.
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-8">
            <Button
              href={heroContent.primaryCta.href}
              className="bg-[#e8a020] hover:bg-[#d68f13] text-black px-6 py-3 rounded-md font-bold uppercase text-xs tracking-wider flex items-center gap-2 transition-colors shadow-md"
            >
              <Bike size={18} strokeWidth={2.5} /> {heroContent.primaryCta.label}
            </Button>

            <Button
              href={heroContent.secondaryCta.href}
              className="bg-transparent border border-[#e8a020] text-white hover:bg-[#e8a020]/10 px-6 py-3 rounded-md font-bold uppercase text-xs tracking-wider flex items-center gap-2 transition-colors"
            >
              <Utensils size={16} strokeWidth={2.5} className="text-[#e8a020]" /> {heroContent.secondaryCta.label}
            </Button>
          </div>
        </div>
      </section>

      {/* =========================================
          2. LIGHT CREAM CANVAS WRAPPER
          ========================================= */}
      <section className="bg-[#f7f1e4] w-full relative pb-16 pt-0 flex flex-col items-center z-30 mt-0">

        {/* ─── EXPLORE OUR MENU CONTAINER CARD ─── */}
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 -mt-20 relative z-40">

          <div className="bg-[#fcfaf5] rounded-[2rem] shadow-[0_10px_30px_rgba(0,0,0,0.1)] py-5 md:py-6 px-6 md:px-10 w-full border border-[#ebdcc1]/50">

            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="flex items-center text-[#e8a020]">
                <div className="h-[1.5px] w-10 bg-[#e8a020]"></div>
                <ArrowRight size={14} strokeWidth={2.5} className="ml-1" />
              </div>
              <h2 className="font-serif font-bold text-lg md:text-xl text-[#0e0d0c] uppercase tracking-wider text-center">
                EXPLORE OUR MENU
              </h2>
              <div className="flex items-center text-[#e8a020]">
                <ArrowLeft size={14} strokeWidth={2.5} className="mr-1" />
                <div className="h-[1.5px] w-10 bg-[#e8a020]"></div>
              </div>
            </div>

            <div className="flex flex-col xl:flex-row items-center justify-between gap-4 xl:gap-6">

              <div className="flex flex-wrap md:flex-nowrap justify-center md:justify-between gap-6 md:gap-4 flex-1 w-full">
                {categories.map((category) => (
                  <div key={category.id} onClick={() => router.push(viewFullMenuCta.href)} className="group flex flex-col items-center gap-2 cursor-pointer">
                    <div className="relative w-[75px] h-[75px] md:w-[85px] md:h-[85px] rounded-full p-[2px] border border-[#e8a020] bg-transparent transition-transform duration-300 group-hover:-translate-y-1">
                      <div className="w-full h-full rounded-full border-[3px] border-[#fcfaf5] bg-white overflow-hidden shadow-sm">
                        <img
                          src={category.icon}
                          alt={category.label}
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                    </div>
                    <span className="text-[10px] md:text-[11px] font-bold tracking-widest text-[#0e0d0c] uppercase font-sans text-center">
                      {category.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="shrink-0 w-full xl:w-auto text-center mt-3 xl:mt-0">
                <Button
                  href={viewFullMenuCta.href}
                  className="bg-[#8a1620] hover:bg-[#6f1119] text-white font-bold text-[11px] md:text-xs uppercase tracking-widest py-3 px-5 md:py-3.5 md:px-6 rounded-lg shadow-md inline-flex items-center gap-1.5 transition-colors"
                >
                  {viewFullMenuCta.label} <ChevronRight size={16} strokeWidth={2.5} />
                </Button>
              </div>
            </div>

          </div>
        </div>

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

            <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-3 md:gap-4 w-full xl:w-auto mt-8 xl:mt-0">

              <a href={partners[0].href} target="_blank" rel="noopener noreferrer" className="bg-black hover:bg-neutral-900 rounded-2xl shadow-xl flex items-center justify-center w-[150px] sm:w-[170px] lg:w-[190px] h-[85px] lg:h-[95px] transition-transform hover:-translate-y-1">
                <span className="font-bold text-white text-2xl md:text-3xl tracking-tighter flex flex-col items-center leading-none font-sans">
                  Uber <span className="text-[#06c167] mt-1">Eats</span>
                </span>
              </a>

              <a href={partners[1].href} target="_blank" rel="noopener noreferrer" className="bg-white hover:bg-gray-50 rounded-2xl shadow-xl flex items-center justify-center w-[150px] sm:w-[170px] lg:w-[190px] h-[85px] lg:h-[95px] transition-transform hover:-translate-y-1">
                <span className="font-black text-[#ff3008] text-base md:text-lg tracking-widest font-sans uppercase flex flex-col items-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="#ff3008" xmlns="http://www.w3.org/2000/svg" className="mb-1.5"><path d="M22.956 16.037c0 4.148-4.708 6.44-8.868 6.44-4.887 0-9.824-2.83-9.824-6.44 0-4.149 4.706-6.44 8.867-6.44 4.889 0 9.825 2.829 9.825 6.44zm-14.93-9.043c0-4.147 4.708-6.44 8.867-6.44 4.889 0 9.825 2.83 9.825 6.44 0 4.149-4.707 6.44-8.868 6.44-4.887 0-9.824-2.829-9.824-6.44z" /></svg>
                  DOORDASH
                </span>
              </a>

              <a href={partners[2].href} target="_blank" rel="noopener noreferrer" className="bg-white hover:bg-gray-50 rounded-2xl shadow-xl flex items-center justify-center w-[150px] sm:w-[170px] lg:w-[190px] h-[85px] lg:h-[95px] transition-transform hover:-translate-y-1">
                <span className="font-black text-[#f28100] text-2xl md:text-3xl tracking-tight font-sans uppercase">
                  GRUBHUB
                </span>
              </a>

            </div>
          </div>
        </div>

      </section>
    </div>
  );
}