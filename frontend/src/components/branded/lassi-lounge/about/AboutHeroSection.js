'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function AboutHeroSection() {
  return (
    <section className="relative w-full bg-[#0e0d0c] overflow-hidden py-16 lg:py-24 select-none border-b border-[#ffffff]/10">
      <div className="absolute inset-0 z-0">
        <img
          src="/images/branded/lassi-lounge/about/hero-bg.jpg"
          alt="Lassi Lounge luxury ambient dining background"
          className="w-full h-full object-cover object-center opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0d0c] via-transparent to-[#0e0d0c]/40" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1300px] px-6 lg:px-8 flex flex-col items-start space-y-5">
        
        <nav className="flex items-center gap-2 text-[13px] font-medium text-[#d1d5db] mb-1">
          <Link href="/customer" className="hover:text-[#ffffff] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#9ca3af]" />
          <span className="text-[#ffffff]">About Us</span>
        </nav>

        <div className="space-y-3 max-w-2xl">
          <h1 className="text-[48px] md:text-[64px] font-serif font-black tracking-tight leading-[1.1]">
            <span className="text-[#ffffff] block">About</span>
            <span className="text-[#e8a020] block">Lassi Lounge</span>
          </h1>

          <div className="flex items-center gap-3 py-2">
            <div className="flex gap-1 mr-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 18L10 6M10 20L16 8M16 22L22 10" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <svg width="35" height="12" viewBox="0 0 40 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <path d="M40 7H4M4 7L10 1M4 7L10 13" stroke="#e8a020" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="20" cy="7" r="3" fill="#0e0d0c" stroke="#e8a020" strokeWidth="1.5"/>
            </svg>
            <span className="text-[#ffffff] text-[22px] md:text-[28px] font-medium px-1" style={{ fontFamily: 'var(--font-script, cursive)', fontStyle: 'italic' }}>
              Where Tradition Meets Taste
            </span>
            <svg width="35" height="12" viewBox="0 0 40 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <path d="M0 7H36M36 7L30 1M36 7L30 13" stroke="#e8a020" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="20" cy="7" r="3" fill="#0e0d0c" stroke="#e8a020" strokeWidth="1.5"/>
            </svg>
          </div>

          <p className="text-[#e5e7eb] text-[14px] md:text-[15px] leading-relaxed max-w-[400px] font-medium pt-1">
            A celebration of authentic Indian flavors,<br className="hidden sm:block" />
            warm hospitality, and unforgettable moments.
          </p>
        </div>

      </div>
    </section>
  );
}