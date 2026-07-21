'use client';

import { ChefHat, Star, Users, Truck, ArrowRight, BookOpen } from 'lucide-react';

const FEATURES = [
  { icon: ChefHat, label: 'Authentic Flavors' },
  { icon: Star, label: 'Premium Quality' },
  { icon: Users, label: 'Perfect for Any Occasion' },
  { icon: Truck, label: 'On-time Delivery' }
];

export default function CateringHero({ onGetQuote }) {
  return (
    <section className="relative w-full bg-[#fdfbf7] overflow-hidden min-h-[550px] flex items-center">
      {/* Right side image gradient fade */}
      <div className="absolute right-0 top-0 bottom-0 w-full md:w-[65%] lg:w-[60%] h-full z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-[#fdfbf7] via-[#fdfbf7]/80 to-transparent z-10 w-1/2 left-0" />
        <img 
          src="/images/branded/lassi-lounge/catering/table-setting.jpg" 
          alt="Catering Buffet" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Left side content */}
      <div className="relative z-20 mx-auto w-full max-w-[1200px] px-6 py-12 md:py-20">
        <div className="max-w-xl">
          <h1 className="text-[56px] md:text-[72px] font-serif font-black text-[#7a0b10] leading-none mb-2">
            Catering
          </h1>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center">
              <div className="w-1.5 h-1.5 rounded-full border border-[#b47b80]"></div>
              <div className="w-8 h-[1px] bg-[#b47b80]"></div>
            </div>
            <h2 className="text-[32px] md:text-[40px] font-script text-[#b47b80] italic leading-none">
              Made Memorable
            </h2>
            <div className="flex items-center">
              <div className="w-8 h-[1px] bg-[#b47b80]"></div>
              <div className="w-1.5 h-1.5 rounded-full border border-[#b47b80]"></div>
            </div>
          </div>
          
          <p className="text-[16px] text-[#4b5563] font-medium leading-relaxed mb-10 max-w-md">
            Delicious food brings people together. Whether it's a small get-together or a grand celebration, we cater with passion and perfection.
          </p>

          {/* Features */}
          <div className="grid grid-cols-4 gap-4 mb-10 max-w-lg">
            {FEATURES.map((feat, idx) => (
              <div key={idx} className="flex flex-col items-center text-center gap-2">
                <div className="h-12 w-12 rounded-full border border-[#eadfdb] bg-white flex items-center justify-center shrink-0 shadow-sm">
                  <feat.icon className="h-6 w-6 text-[#7a0b10]" strokeWidth={1.5} />
                </div>
                <span className="text-[11px] font-bold text-[#1a1a1a] leading-tight max-w-[80px]">
                  {feat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <button 
              onClick={onGetQuote}
              className="px-8 h-[52px] rounded-lg bg-[#7a0b10] text-white text-[13px] font-black uppercase tracking-wider hover:bg-[#680307] transition-colors flex items-center gap-2 shadow-md"
            >
              GET A QUOTE <ArrowRight className="h-4 w-4" />
            </button>
            <button 
              className="px-8 h-[52px] rounded-lg border-2 border-[#eadfdb] bg-white text-[#7a0b10] text-[13px] font-black uppercase tracking-wider hover:border-[#b47b80] transition-colors flex items-center gap-2 shadow-sm"
            >
              <BookOpen className="h-4 w-4" /> VIEW MENU
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
