'use client';

import { ArrowRight } from 'lucide-react';

export default function CateringFooterCta({ onGetQuote }) {
  return (
    <section className="pb-16 max-w-[1200px] mx-auto px-6">
      <div className="w-full bg-[#7a0b10] rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-lg relative overflow-hidden">
        
        {/* Decorative background pattern (subtle mandala or pattern placeholder) */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-[url('/images/branded/lassi-lounge/pattern.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
        <div className="absolute left-0 bottom-0 w-48 h-48 bg-[url('/images/branded/lassi-lounge/pattern.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>

        <div className="flex items-center gap-6 relative z-10">
          <div className="hidden md:flex shrink-0">
            {/* Tray Icon */}
            <div className="relative w-20 h-20">
              <div className="absolute bottom-4 left-0 w-full h-2 bg-[#f5a623] rounded-full"></div>
              <div className="absolute bottom-6 left-[10%] w-[80%] h-10 bg-[#f5a623] rounded-t-full"></div>
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-6 bg-[#f5a623] rounded-full transform -rotate-12 origin-bottom"></div>
            </div>
          </div>
          <div>
            <h3 className="text-[24px] md:text-[28px] font-serif font-black text-white mb-2">
              Let's Make Your Event Special!
            </h3>
            <p className="text-[14px] font-medium text-white/80">
              Contact us today for catering inquiries and customized menus.
            </p>
          </div>
        </div>

        <button 
          onClick={onGetQuote}
          className="shrink-0 px-8 h-[52px] rounded-lg bg-[#f5a623] text-[#1a1a1a] text-[13px] font-black uppercase tracking-wider hover:bg-[#e0941a] transition-colors flex items-center gap-2 shadow-md relative z-10"
        >
          GET A QUOTE NOW <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
