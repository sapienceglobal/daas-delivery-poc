'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function AboutStorySection({ onReserveClick }) {
  return (
    <section className="w-full bg-[#faf6f0] text-[#1a1a1a] py-14 lg:py-20 select-none">
      <div className="mx-auto max-w-[1300px] px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        
        <div className="lg:col-span-6 space-y-5">
          <div className="flex items-center gap-3 text-[#e8a020] text-[12px] font-black uppercase tracking-[0.15em]">
            <span>Our Story</span>
            <svg width="40" height="10" viewBox="0 0 45 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 6H40M40 6L35 1M40 6L35 11" stroke="#e8a020" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 3V9" stroke="#e8a020" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          <h2 className="text-[32px] md:text-[44px] font-serif font-bold leading-[1.15] text-[#1a1a1a]">
            A Passion For Authentic <br className="hidden sm:block" />
            <span className="text-[#7a0b10]">Indian Cuisine</span>
          </h2>

          <div className="space-y-4 text-[#4b5563] text-[14px] md:text-[15px] leading-relaxed font-medium max-w-[95%]">
            <p>
              Lassi Lounge was born from a simple idea – to bring the rich, diverse and soulful flavors of India to the heart of New York. From the bustling streets of Delhi to the royal kitchens of Punjab, our recipes are crafted with love, tradition and the finest ingredients.
            </p>
            <p>
              Every dish we serve is a reflection of our culture, our memories and our promise to deliver an experience you&apos;ll want to come back to.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-start gap-8">
            {onReserveClick ? (
              <button
                onClick={onReserveClick}
                className="bg-[#7a0b10] hover:bg-[#5e080c] text-[#ffffff] font-bold text-[12px] uppercase tracking-wider px-7 py-3 rounded-lg shadow-sm inline-flex items-center justify-center gap-2 transition-colors duration-200 shrink-0"
              >
                Reserve A Table <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
              </button>
            ) : (
              <Link
                href="/customer/restaurant/lassi-lounge?tab=reserve"
                className="bg-[#7a0b10] hover:bg-[#5e080c] text-[#ffffff] font-bold text-[12px] uppercase tracking-wider px-6 py-3 rounded-lg shadow-sm inline-flex items-center justify-center gap-2 transition-colors duration-200 shrink-0"
              >
                Reserve A Table <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
              </Link>
            )}

            <div className="space-y-0.5">
              <span className="text-[26px] md:text-[30px] text-[#1a1a1a] block leading-none" style={{ fontFamily: 'var(--font-script, cursive)' }}>
                Kuldeep Singh
              </span>
              <span className="text-[11px] font-medium text-[#6b7280] block">
                Founder, Lassi Lounge
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="relative aspect-video sm:aspect-[16/10] lg:aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-lg bg-[#e5e7eb] group">
            <img
              src="/images/branded/lassi-lounge/about/story-spread.jpg"
              alt="Authentic Indian Cuisine Spread"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/10 to-transparent" />
          </div>
        </div>

      </div>
    </section>
  );
}